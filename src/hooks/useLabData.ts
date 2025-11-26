import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildProductionSheetPayload,
  createLabMaterialClass,
  createLabRawMaterial,
  createLabRecipe,
  createLabSample,
  createNewRecipeVersion,
  deleteLabMaterialClass,
  deleteLabRecipe,
  deleteLabRawMaterial,
  duplicateLabRecipe,
  getLabRecipeById,
  getRecipeCostSummary,
  LAB_SAMPLE_PRIORITIES,
  LAB_SAMPLE_STATUSES,
  LabMaterialClass,
  LabRecipe,
  LabRecipeIngredientInsert,
  LabRecipeInsert,
  LabRecipeUpdate,
  LabRawMaterialInsert,
  LabRawMaterialUpdate,
  LabRawMaterialWithClass,
  LabSampleInsert,
  LabSampleStatus,
  LabSampleWithRelations,
  LabSampleUpdate,
  listLabMaterialClasses,
  listLabRawMaterials,
  listLabRecipes,
  listLabRecipeIngredients,
  listLabRecipeVersions,
  listLabSamples,
  ProductionSheetPayload,
  restoreRecipeVersion as restoreRecipeVersionEntry,
  saveLabRecipeIngredients,
  updateLabMaterialClass,
  updateLabRawMaterial,
  updateLabRecipe,
  updateLabSample
} from '../lib/lab.service';

type AsyncError = string | null;

function toErrorMessage(error: unknown, fallback = 'Operazione non riuscita'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

export function useLabRawMaterials(initialSearch = '') {
  const [materials, setMaterials] = useState<LabRawMaterialWithClass[]>([]);
  const [classes, setClasses] = useState<LabMaterialClass[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AsyncError>(null);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classError, setClassError] = useState<AsyncError>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLabRawMaterials({
        search: search.trim() ? search : undefined
      });
      setMaterials(data);
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err, 'Impossibile caricare le materie prime'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const data = await listLabMaterialClasses();
      setClasses(data);
      setClassError(null);
    } catch (err) {
      setClassError(toErrorMessage(err, 'Impossibile caricare le classi'));
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const create = useCallback(async (payload: LabRawMaterialInsert) => {
    const created = await createLabRawMaterial(payload);
    const enriched: LabRawMaterialWithClass = {
      ...created,
      material_class: classes.find(cls => cls.id === created.class_id) ?? null
    };
    setMaterials(prev => [enriched, ...prev]);
    return enriched;
  }, [classes]);

  const update = useCallback(async (id: string, updates: LabRawMaterialUpdate) => {
    const updated = await updateLabRawMaterial(id, updates);
    const enriched: LabRawMaterialWithClass = {
      ...updated,
      material_class: classes.find(cls => cls.id === updated.class_id) ?? null
    };
    setMaterials(prev => prev.map(item => (item.id === id ? enriched : item)));
    return enriched;
  }, [classes]);

  const remove = useCallback(async (id: string) => {
    await deleteLabRawMaterial(id);
    setMaterials(prev => prev.filter(item => item.id !== id));
  }, []);

  const createClass = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const created = await createLabMaterialClass(trimmed);
      setClasses(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    },
    []
  );

  const updateClass = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const updated = await updateLabMaterialClass(id, trimmed);
      setClasses(prev =>
        prev
          .map(cls => (cls.id === id ? updated : cls))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setMaterials(prev =>
        prev.map(material =>
          material.class_id === id ? { ...material, material_class: updated } : material
        )
      );
      return updated;
    },
    []
  );

  const removeClass = useCallback(
    async (id: string) => {
      await deleteLabMaterialClass(id);
      setClasses(prev => prev.filter(cls => cls.id !== id));
      setMaterials(prev =>
        prev.map(material =>
          material.class_id === id ? { ...material, class_id: null, material_class: null } : material
        )
      );
    },
    []
  );

  return {
    materials,
    classes,
    loading,
    error,
    classesLoading,
    classError,
    search,
    setSearch,
    refresh: load,
    createMaterial: create,
    updateMaterial: update,
    deleteMaterial: remove,
    createClass,
    updateClass,
    deleteClass: removeClass
  };
}

export function useLabRecipes(initialSearch = '') {
  const [recipes, setRecipes] = useState<LabRecipe[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AsyncError>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLabRecipes({
        search: search.trim() ? search : undefined,
        includeInactive: includeArchived
      });
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err, 'Impossibile caricare le ricette'));
    } finally {
      setLoading(false);
    }
  }, [includeArchived, search]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (payload: LabRecipeInsert) => {
    const created = await createLabRecipe(payload);
    setRecipes(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, updates: LabRecipeUpdate) => {
    const updated = await updateLabRecipe(id, updates);
    setRecipes(prev => prev.map(recipe => (recipe.id === id ? updated : recipe)));
    return updated;
  }, []);

  const duplicate = useCallback(async (id: string, overrides?: Partial<LabRecipeInsert>) => {
    const clone = await duplicateLabRecipe(id, overrides);
    setRecipes(prev => [clone, ...prev]);
    return clone;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteLabRecipe(id);
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  }, []);

  const persistIngredients = useCallback(async (recipeId: string, ingredients: LabRecipeIngredientInsert[]) => {
    return saveLabRecipeIngredients(recipeId, ingredients);
  }, []);

  const fetchIngredients = useCallback(async (recipeId: string) => {
    return listLabRecipeIngredients(recipeId);
  }, []);

  const fetchRecipe = useCallback(async (recipeId: string) => {
    return getLabRecipeById(recipeId);
  }, []);

  const generateSheet = useCallback(async (recipeId: string): Promise<ProductionSheetPayload> => {
    const [recipe, ingredients, summary] = await Promise.all([
      getLabRecipeById(recipeId),
      listLabRecipeIngredients(recipeId),
      getRecipeCostSummary(recipeId)
    ]);
    return buildProductionSheetPayload(recipe, ingredients, summary);
  }, []);

  const listVersions = useCallback(async (recipeId: string) => {
    return listLabRecipeVersions(recipeId);
  }, []);

  const createVersion = useCallback(async (recipeId: string, userId?: string) => {
    const updated = await createNewRecipeVersion(recipeId, userId);
    setRecipes(prev => prev.map(recipe => (recipe.id === recipeId ? updated : recipe)));
    return updated;
  }, []);

  const restoreVersion = useCallback(async (versionId: string, recipeId: string, userId?: string) => {
    const updated = await restoreRecipeVersionEntry(versionId, userId);
    setRecipes(prev => prev.map(recipe => (recipe.id === recipeId ? updated : recipe)));
    return updated;
  }, []);

  return {
    recipes,
    loading,
    error,
    search,
    setSearch,
    includeArchived,
    setIncludeArchived,
    refresh: load,
    createRecipe: create,
    updateRecipe: update,
    duplicateRecipe: duplicate,
    deleteRecipe: remove,
    saveIngredients: persistIngredients,
    fetchIngredients,
    fetchRecipe,
    fetchRecipeVersions: listVersions,
    createRecipeVersion: createVersion,
    restoreRecipeVersion: restoreVersion,
    generateProductionSheet: generateSheet
  };
}

export function useLabSamples(defaultStatus?: LabSampleStatus) {
  const [samples, setSamples] = useState<LabSampleWithRelations[]>([]);
  const [status, setStatus] = useState<LabSampleStatus | undefined>(defaultStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AsyncError>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLabSamples({
        status,
        search: search.trim() ? search : undefined
      });
      setSamples(data);
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err, 'Impossibile caricare le campionature'));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (payload: LabSampleInsert) => {
    const created = await createLabSample(payload);
    const normalized: LabSampleWithRelations = { ...created, recipe: null, customer: null };
    setSamples(prev => [normalized, ...prev]);
    return normalized;
  }, []);

  const update = useCallback(async (id: string, updates: LabSampleUpdate) => {
    const updated = await updateLabSample(id, updates);
    let merged: LabSampleWithRelations = { ...updated, recipe: null, customer: null };

    setSamples(prev =>
      prev.map(sample => {
        if (sample.id === id) {
          merged = { ...sample, ...updated };
          return merged;
        }
        return sample;
      })
    );

    return merged;
  }, []);

  const updateStatus = useCallback(async (id: string, nextStatus: LabSampleStatus) => {
    return update(id, { status: nextStatus });
  }, [update]);

  const meta = useMemo(() => {
    return {
      statusOptions: LAB_SAMPLE_STATUSES,
      priorityOptions: LAB_SAMPLE_PRIORITIES
    };
  }, []);

  return {
    samples,
    loading,
    error,
    status,
    setStatus,
    search,
    setSearch,
    refresh: load,
    createSample: create,
    updateSample: update,
    updateSampleStatus: updateStatus,
    meta
  };
}

