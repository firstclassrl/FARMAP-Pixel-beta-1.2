export type RecipeSnapshot = {
  code: string;
  name: string;
  version: number;
  status: string;
  batch_size: number;
  unit: string;
  target_cost: number | null;
  yield_percentage: number | null;
  notes: string | null;
  instructions: string | null;
  attachments: LabRecipe['attachments'];
};

export type VersionedIngredient = {
  raw_material_id: string;
  percentage: number;
  quantity: number | null;
  cost_share: number | null;
  notes: string | null;
  position: number;
  phase: LabMixPhase | null;
};

export type LabRecipeVersion = Omit<LabRecipeVersionRow, 'snapshot' | 'ingredients'> & {
  snapshot: RecipeSnapshot;
  ingredients: VersionedIngredient[];
};
import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];
type Enums = Database['public']['Enums'];

export type LabRawMaterial = Tables['lab_raw_materials']['Row'];
export type LabRawMaterialInsert = Tables['lab_raw_materials']['Insert'];
export type LabRawMaterialUpdate = Tables['lab_raw_materials']['Update'];
export type LabMaterialClass = Tables['lab_material_classes']['Row'];
export type LabMaterialClassInsert = Tables['lab_material_classes']['Insert'];
export type LabRawMaterialWithClass = LabRawMaterial & {
  material_class?: LabMaterialClass | null;
};

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
export type LabMixPhase = Enums['lab_mix_phase'];

export type LabRecipeVersionRow = Tables['lab_recipe_versions']['Row'];

export type LabRecipeIngredientWithMaterial = LabRecipeIngredient & {
  raw_material?: LabRawMaterialWithClass | null;
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
    phase: LabMixPhase | null;
    className?: string | null;
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
export const LAB_MIX_PHASES: LabMixPhase[] = ['Acqua', 'Olio', 'Polveri'];

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

function mapVersionRow(row: LabRecipeVersionRow): LabRecipeVersion {
  return {
    ...row,
    snapshot: row.snapshot as RecipeSnapshot,
    ingredients: (row.ingredients as VersionedIngredient[]) ?? []
  };
}

async function unwrapList<T>(promise: SupabaseListResponse<T>): Promise<T[]> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }
  return data ?? [];
}

async function fetchRecipeSnapshot(recipeId: string) {
  const recipe = await getLabRecipeById(recipeId);
  const ingredients = await unwrapList<Tables['lab_recipe_ingredients']['Row']>(
    supabase
      .from('lab_recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('position', { ascending: true })
  );

  const snapshot: RecipeSnapshot = {
    code: recipe.code,
    name: recipe.name,
    version: recipe.version ?? 1,
    status: recipe.status,
    batch_size: recipe.batch_size ?? 0,
    unit: recipe.unit ?? 'kg',
    target_cost: recipe.target_cost ?? null,
    yield_percentage: recipe.yield_percentage ?? null,
    notes: recipe.notes ?? null,
    instructions: recipe.instructions ?? null,
    attachments: recipe.attachments ?? []
  };

  const versionIngredients: VersionedIngredient[] = ingredients.map(ing => ({
    raw_material_id: ing.raw_material_id,
    percentage: ing.percentage,
    quantity: ing.quantity ?? null,
    cost_share: ing.cost_share ?? null,
    notes: ing.notes ?? null,
    position: ing.position ?? 0,
    phase: (ing.phase as LabMixPhase | null) ?? 'Acqua'
  }));

  return { recipe, snapshot, versionIngredients };
}

async function archiveCurrentRecipeVersion(recipeId: string, createdBy?: string) {
  const { recipe, snapshot, versionIngredients } = await fetchRecipeSnapshot(recipeId);
  return unwrapSingle<LabRecipeVersionRow>(
    supabase
      .from('lab_recipe_versions')
      .insert({
        recipe_id: recipeId,
        version: recipe.version ?? 1,
        snapshot,
        ingredients: versionIngredients,
        created_by: createdBy ?? null
      })
      .select()
      .single()
  );
}

/**
 * RAW MATERIALS
 */
export async function listLabRawMaterials(params?: { search?: string }) {
  let query = supabase
    .from('lab_raw_materials')
    .select('*, material_class:lab_material_classes(*)')
    .order('name', { ascending: true });

  if (params?.search) {
    const searchValue = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${searchValue},code.ilike.${searchValue},supplier.ilike.${searchValue}`);
  }

  return unwrapList<LabRawMaterialWithClass>(query);
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

export async function listLabMaterialClasses() {
  return unwrapList<LabMaterialClass>(
    supabase
      .from('lab_material_classes')
      .select('*')
      .order('name', { ascending: true })
  );
}

export async function createLabMaterialClass(name: string) {
  return unwrapSingle<LabMaterialClass>(
    supabase
      .from('lab_material_classes')
      .insert({ name })
      .select()
      .single()
  );
}

export async function deleteLabMaterialClass(id: string) {
  const { error } = await supabase.from('lab_material_classes').delete().eq('id', id);
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

export async function deleteLabRecipe(id: string) {
  const { error } = await supabase.from('lab_recipes').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || defaultErrorMessage);
  }
}

export async function duplicateLabRecipe(recipeId: string, overrides?: Partial<LabRecipeInsert>) {
  const [recipe, ingredients] = await Promise.all([
    getLabRecipeById(recipeId),
    listLabRecipeIngredients(recipeId),
  ]);

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
  const clone = await createLabRecipe({
    ...cloneBase,
    version: (recipe.version ?? 1) + 1,
    status: 'draft',
    code: `${recipe.code}-v${(recipe.version ?? 1) + 1}`,
    ...overrides
  });

  if (ingredients.length) {
    await saveLabRecipeIngredients(
      clone.id,
      ingredients.map((ingredient, index) => ({
        raw_material_id: ingredient.raw_material_id,
        percentage: ingredient.percentage,
        quantity: ingredient.quantity,
        cost_share: ingredient.cost_share,
        notes: ingredient.notes ?? undefined,
        position: index,
      }))
    );
  }

  return clone;
}

export async function listLabRecipeIngredients(recipeId: string) {
  return unwrapList<LabRecipeIngredientWithMaterial>(
    supabase
      .from('lab_recipe_ingredients')
      .select('*, raw_material:lab_raw_materials(*, material_class:lab_material_classes(*))')
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
    phase: ingredient.phase ?? 'Acqua',
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

export async function listLabRecipeVersions(recipeId: string) {
  const rows = await unwrapList<LabRecipeVersionRow>(
    supabase
      .from('lab_recipe_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false })
  );
  return rows.map(mapVersionRow);
}

export async function createNewRecipeVersion(recipeId: string, createdBy?: string) {
  const recipe = await getLabRecipeById(recipeId);
  await archiveCurrentRecipeVersion(recipeId, createdBy);
  return updateLabRecipe(recipeId, {
    version: (recipe.version ?? 1) + 1,
    last_review_at: new Date().toISOString()
  });
}

export async function restoreRecipeVersion(versionId: string, createdBy?: string) {
  const versionRow = await unwrapSingle<LabRecipeVersionRow>(
    supabase
      .from('lab_recipe_versions')
      .select('*')
      .eq('id', versionId)
      .single()
  );

  const version = mapVersionRow(versionRow);
  await archiveCurrentRecipeVersion(version.recipe_id, createdBy);

  const snapshot = version.snapshot;
  const updatedRecipe = await updateLabRecipe(version.recipe_id, {
    name: snapshot.name,
    status: snapshot.status,
    batch_size: snapshot.batch_size,
    unit: snapshot.unit,
    target_cost: snapshot.target_cost,
    yield_percentage: snapshot.yield_percentage,
    notes: snapshot.notes,
    instructions: snapshot.instructions,
    attachments: snapshot.attachments,
    version: (snapshot.version ?? 1) + 1,
    last_review_at: new Date().toISOString()
  });

  await saveLabRecipeIngredients(
    version.recipe_id,
    version.ingredients.map(ingredient => ({
      raw_material_id: ingredient.raw_material_id,
      percentage: ingredient.percentage,
      quantity: ingredient.quantity ?? undefined,
      cost_share: ingredient.cost_share ?? undefined,
      notes: ingredient.notes ?? undefined,
      position: ingredient.position,
      phase: ingredient.phase ?? 'Acqua'
    }))
  );

  return updatedRecipe;
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
      phase: (ingredient.phase as LabMixPhase | null) ?? 'Acqua',
      className: ingredient.raw_material?.material_class?.name ?? null,
      supplier: ingredient.raw_material?.supplier,
      safetyNotes: ingredient.raw_material?.safety_notes
    };
  });

  const phaseIndex = (phase: LabMixPhase | null | undefined) => {
    const idx = LAB_MIX_PHASES.indexOf(phase ?? 'Acqua');
    return idx === -1 ? LAB_MIX_PHASES.length : idx;
  };

  const sortedRows = rows.sort((a, b) => phaseIndex(a.phase) - phaseIndex(b.phase));

  const totals = sortedRows.reduce(
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
        ingredientsCount: summary?.ingredients_count ?? sortedRows.length
    },
    steps: {
      instructions: recipe.instructions,
      notes: recipe.notes
    },
      ingredients: sortedRows
  };
}

export { LAB_SAMPLE_STATUSES, LAB_SAMPLE_PRIORITIES };

