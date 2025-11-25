import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];
type Enums = Database['public']['Enums'];

export type LabRawMaterial = Tables['lab_raw_materials']['Row'];
export type LabRawMaterialInsert = Tables['lab_raw_materials']['Insert'];
export type LabRawMaterialUpdate = Tables['lab_raw_materials']['Update'];

export type LabRecipe = Tables['lab_recipes']['Row'];
export type LabRecipeInsert = Tables['lab_recipes']['Insert'];
export type LabRecipeUpdate = Tables['lab_recipes']['Update'];

export type LabRecipeIngredient = Tables['lab_recipe_ingredients']['Row'];
export type LabRecipeIngredientInsert = Tables['lab_recipe_ingredients']['Insert'];
export type LabRecipeIngredientUpdate = Tables['lab_recipe_ingredients']['Update'];

export type LabSample = Tables['lab_samples']['Row'];
export type LabSampleInsert = Tables['lab_samples']['Insert'];
export type LabSampleUpdate = Tables['lab_samples']['Update'];
export type LabSampleWithRelations = LabSample & {
  recipe?: Pick<LabRecipe, 'name' | 'code'> | null;
  customer?: { company_name: string | null; codice_cliente: string | null } | null;
};

export type LabRecipeCostSummary = Views['lab_recipe_costs_view']['Row'];
export type LabSampleStatus = Enums['lab_sample_status'];

export type LabRecipeIngredientWithMaterial = LabRecipeIngredient & {
  raw_material?: LabRawMaterial | null;
};

export type ProductionSheetPayload = {
  header: {
    code: string;
    name: string;
    version: number;
    batchSize: number;
    unit: string;
    lastReviewAt: string | null;
  };
  summary: {
    targetCost: number | null;
    estimatedBatchCost: number;
    estimatedUnitCost: number;
    totalPercentage: number;
    totalQuantity: number;
    ingredientsCount: number;
  };
  steps: {
    instructions: string | null;
    notes: string | null;
  };
  ingredients: Array<{
    id: string;
    code: string;
    name: string;
    percentage: number;
    quantity: number;
    unitCost: number;
    costShare: number;
    supplier?: string | null;
    safetyNotes?: string | null;
  }>;
};

const LAB_SAMPLE_STATUSES: LabSampleStatus[] = [
  'draft',
  'pending',
  'in_progress',
  'ready',
  'sent',
  'approved',
  'rejected',
  'archived'
];

const LAB_SAMPLE_PRIORITIES = ['low', 'normal', 'high'] as const;

const defaultErrorMessage = 'Errore durante la comunicazione con Supabase';

type SupabaseSingleResponse<T> = Promise<{
  data: T | null;
  error: PostgrestError | null;
}>;

type SupabaseListResponse<T> = Promise<{
  data: T[] | null;
  error: PostgrestError | null;
}>;

async function unwrapSingle<T>(
  promise: SupabaseSingleResponse<T>,
  mapError?: (err: PostgrestError) => string
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(mapError ? mapError(error) : error.message || defaultErrorMessage);
  }
  if (data === null) {
    throw new Error('Dato non disponibile');
  }
  return data;
}

async function unwrapList<T>(promise: SupabaseListResponse<T>): Promise<T[]> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }
  return data ?? [];
}

/**
 * RAW MATERIALS
 */
export async function listLabRawMaterials(params?: { search?: string }) {
  let query = supabase
    .from('lab_raw_materials')
    .select('*')
    .order('name', { ascending: true });

  if (params?.search) {
    const searchValue = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${searchValue},code.ilike.${searchValue},supplier.ilike.${searchValue}`);
  }

  return unwrapList<LabRawMaterial>(query);
}

export async function createLabRawMaterial(payload: LabRawMaterialInsert) {
  const normalized: LabRawMaterialInsert = {
    attachments: payload.attachments ?? [],
    unit: payload.unit ?? 'kg',
    cost_per_unit: payload.cost_per_unit ?? 0,
    ...payload
  };

  return unwrapSingle<LabRawMaterial>(
    supabase
      .from('lab_raw_materials')
      .insert(normalized)
      .select()
      .single()
  );
}

export async function updateLabRawMaterial(id: string, updates: LabRawMaterialUpdate) {
  return unwrapSingle<LabRawMaterial>(
    supabase
      .from('lab_raw_materials')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  );
}

export async function deleteLabRawMaterial(id: string) {
  const { error } = await supabase.from('lab_raw_materials').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }
}

/**
 * RECIPES
 */
export async function listLabRecipes(params?: { search?: string; includeInactive?: boolean }) {
  let query = supabase
    .from('lab_recipes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (!params?.includeInactive) {
    query = query.neq('status', 'archived');
  }

  if (params?.search) {
    const search = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${search},code.ilike.${search},notes.ilike.${search}`);
  }

  return unwrapList<LabRecipe>(query);
}

export async function getLabRecipeById(id: string) {
  return unwrapSingle<LabRecipe>(
    supabase
      .from('lab_recipes')
      .select('*')
      .eq('id', id)
      .single()
  );
}

export async function createLabRecipe(payload: LabRecipeInsert) {
  const normalized: LabRecipeInsert = {
    unit: payload.unit ?? 'kg',
    batch_size: payload.batch_size ?? 100,
    version: payload.version ?? 1,
    attachments: payload.attachments ?? [],
    status: payload.status ?? 'draft',
    ...payload
  };

  return unwrapSingle<LabRecipe>(
    supabase
      .from('lab_recipes')
      .insert(normalized)
      .select()
      .single()
  );
}

export async function updateLabRecipe(id: string, updates: LabRecipeUpdate) {
  return unwrapSingle<LabRecipe>(
    supabase
      .from('lab_recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  );
}

export async function duplicateLabRecipe(recipeId: string, overrides?: Partial<LabRecipeInsert>) {
  const recipe = await getLabRecipeById(recipeId);
  const cloneBase: LabRecipeInsert = {
    code: recipe.code,
    name: recipe.name,
    version: recipe.version,
    status: recipe.status,
    batch_size: recipe.batch_size,
    unit: recipe.unit,
    target_cost: recipe.target_cost ?? undefined,
    yield_percentage: recipe.yield_percentage ?? undefined,
    notes: recipe.notes ?? undefined,
    instructions: recipe.instructions ?? undefined,
    attachments: recipe.attachments ?? [],
    created_by: recipe.created_by,
    approved_by: recipe.approved_by ?? undefined,
    last_review_at: recipe.last_review_at ?? undefined
  };
  return createLabRecipe({
    ...cloneBase,
    version: (recipe.version ?? 1) + 1,
    status: 'draft',
    code: `${recipe.code}-v${(recipe.version ?? 1) + 1}`,
    ...overrides
  });
}

export async function listLabRecipeIngredients(recipeId: string) {
  return unwrapList<LabRecipeIngredientWithMaterial>(
    supabase
      .from('lab_recipe_ingredients')
      .select('*, raw_material:lab_raw_materials(*)')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true })
  );
}

export async function saveLabRecipeIngredients(recipeId: string, ingredients: LabRecipeIngredientInsert[]) {
  const { error } = await supabase.from('lab_recipe_ingredients').delete().eq('recipe_id', recipeId);
  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }

  if (!ingredients.length) return [];

  const payload = ingredients.map((ingredient, index) => ({
    position: index,
    recipe_id: recipeId,
    ...ingredient
  }));

  return unwrapList<LabRecipeIngredient>(
    supabase
      .from('lab_recipe_ingredients')
      .insert(payload)
      .select()
  );
}

export async function getRecipeCostSummary(recipeId: string) {
  const { data, error } = await supabase
    .from('lab_recipe_costs_view')
    .select('*')
    .eq('recipe_id', recipeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }

  return data as LabRecipeCostSummary | null;
}

/**
 * SAMPLES / CUSTOM BATCHES
 */
export async function listLabSamples(params?: { status?: LabSampleStatus; search?: string }) {
  let query = supabase
    .from('lab_samples')
    .select('*, recipe:lab_recipes(name, code), customer:customers(company_name, codice_cliente)')
    .order('updated_at', { ascending: false });

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.search) {
    const search = `%${params.search.trim()}%`;
    query = query.or(`project_name.ilike.${search},notes.ilike.${search}`);
  }

  return unwrapList<LabSampleWithRelations>(query);
}

export async function createLabSample(payload: LabSampleInsert) {
  const normalized: LabSampleInsert = {
    attachments: payload.attachments ?? [],
    customizations: payload.customizations ?? {},
    priority: payload.priority ?? 'normal',
    status: payload.status ?? 'draft',
    ...payload
  };

  return unwrapSingle<LabSample>(
    supabase
      .from('lab_samples')
      .insert(normalized)
      .select()
      .single()
  );
}

export async function updateLabSample(id: string, updates: LabSampleUpdate) {
  return unwrapSingle<LabSample>(
    supabase
      .from('lab_samples')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  );
}

export async function updateLabSampleStatus(id: string, status: LabSampleStatus) {
  return updateLabSample(id, { status });
}

/**
 * HELPERS
 */
export function calculateIngredientQuantity(percentage: number, batchSize: number) {
  if (!batchSize || !percentage) return 0;
  return parseFloat(((percentage / 100) * batchSize).toFixed(3));
}

export function calculateIngredientCost(quantity: number, costPerUnit: number) {
  return parseFloat(((quantity || 0) * (costPerUnit || 0)).toFixed(4));
}

export function buildProductionSheetPayload(
  recipe: LabRecipe,
  ingredients: LabRecipeIngredientWithMaterial[],
  summary: LabRecipeCostSummary | null
): ProductionSheetPayload {
  const rows = ingredients.map((ingredient) => {
    const quantity = ingredient.quantity ?? calculateIngredientQuantity(ingredient.percentage, recipe.batch_size ?? 0);
    const unitCost = ingredient.raw_material?.cost_per_unit ?? 0;
    const costShare = ingredient.cost_share ?? calculateIngredientCost(quantity, unitCost);
    return {
      id: ingredient.id,
      code: ingredient.raw_material?.code ?? '',
      name: ingredient.raw_material?.name ?? '',
      percentage: ingredient.percentage,
      quantity,
      unitCost,
      costShare,
      supplier: ingredient.raw_material?.supplier,
      safetyNotes: ingredient.raw_material?.safety_notes
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalQuantity += row.quantity;
      acc.estimatedCost += row.costShare;
      acc.totalPercentage += row.percentage;
      return acc;
    },
    { totalQuantity: 0, estimatedCost: 0, totalPercentage: 0 }
  );

  const batchSize = recipe.batch_size ?? 0;
  const estimatedUnitCost =
    batchSize > 0 ? parseFloat((totals.estimatedCost / batchSize).toFixed(4)) : 0;

  return {
    header: {
      code: recipe.code,
      name: recipe.name,
      version: recipe.version ?? 1,
      batchSize,
      unit: recipe.unit ?? 'kg',
      lastReviewAt: recipe.last_review_at
    },
    summary: {
      targetCost: recipe.target_cost,
      estimatedBatchCost: summary?.estimated_batch_cost ?? totals.estimatedCost,
      estimatedUnitCost: summary?.estimated_unit_cost ?? estimatedUnitCost,
      totalPercentage: summary?.total_percentage ?? totals.totalPercentage,
      totalQuantity: summary?.total_quantity ?? totals.totalQuantity,
      ingredientsCount: summary?.ingredients_count ?? rows.length
    },
    steps: {
      instructions: recipe.instructions,
      notes: recipe.notes
    },
    ingredients: rows
  };
}

export { LAB_SAMPLE_STATUSES, LAB_SAMPLE_PRIORITIES };

