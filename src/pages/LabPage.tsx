import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Beaker,
  ClipboardList,
  Droplet,
  Edit,
  FileText,
  FlaskConical,
  Loader2,
  PackagePlus,
  Plus,
  AlertTriangle,
  Printer,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotifications } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import {
  calculateIngredientCost,
  calculateIngredientQuantity,
  LAB_MIX_PHASES,
  LabMixPhase,
  LabRawMaterial,
  LabRawMaterialWithClass,
  LabRecipe,
  LabRecipeIngredientWithMaterial,
  LabRecipeVersion,
  LabSampleStatus,
  LabSampleWithRelations,
  ProductionSheetPayload
} from '../lib/lab.service';
import { supabase } from '../lib/supabase';
import { useLabRawMaterials, useLabRecipes, useLabSamples } from '../hooks/useLabData';

type RawMaterialsHook = ReturnType<typeof useLabRawMaterials>;
type RecipesHook = ReturnType<typeof useLabRecipes>;
type SamplesHook = ReturnType<typeof useLabSamples>;

type CustomerLite = {
  id: string;
  company_name: string | null;
};

const TAB_ITEMS = [
  { value: 'materials', label: 'Materie Prime', description: 'Anagrafica ingredienti e materie prime' },
  { value: 'recipes', label: 'Ricette', description: 'Percentuali, costi e schede produzione' },
  { value: 'samples', label: 'Campionature', description: 'Richieste conto terzi e follow-up' },
  { value: 'insights', label: 'Insights', description: 'Metriche di laboratorio e alert' }
] as const;

const RECIPE_STATUSES = ['draft', 'testing', 'approved', 'archived'] as const;

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);

const LabPage = () => {
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const rawMaterialsHook = useLabRawMaterials();
  const recipesHook = useLabRecipes();
  const samplesHook = useLabSamples();
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TAB_ITEMS[number]['value']>('materials');

  useEffect(() => {
    let mounted = true;
    const loadCustomers = async () => {
      setCustomersLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .order('company_name', { ascending: true })
        .limit(500);
      if (!mounted) return;
      if (error) {
        addNotification({
          type: 'error',
          title: 'Errore caricamento clienti',
          message: error.message
        });
      } else {
        setCustomers(data ?? []);
      }
      setCustomersLoading(false);
    };

    loadCustomers();
    return () => {
      mounted = false;
    };
  }, [addNotification]);

  const stats = useMemo(() => {
    const activeRecipes = recipesHook.recipes.filter((recipe) => recipe.status !== 'archived');
    const openSamples = samplesHook.samples.filter(
      (sample) => !['approved', 'archived'].includes(sample.status)
    );

    return {
      totalMaterials: rawMaterialsHook.materials.length,
      activeRecipes: activeRecipes.length,
      openSamples: openSamples.length
    };
  }, [rawMaterialsHook.materials, recipesHook.recipes, samplesHook.samples]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-100 border border-rose-100 p-8 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-rose-500 font-semibold">Reparto LAB</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              Controllo totale su materie prime, ricette e campionature
            </h1>
            <p className="text-gray-600 mt-3 max-w-3xl">
              Gestisci l’anagrafica ingredienti, costruisci ricette con le percentuali precise,
              genera schede produzione e monitora le campionature dedicate ai clienti conto terzi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricBadge
              icon={Droplet}
              label="Materie Prime"
              value={stats.totalMaterials.toString()}
              accent="from-sky-500 to-blue-500"
            />
            <MetricBadge
              icon={FlaskConical}
              label="Ricette attive"
              value={stats.activeRecipes.toString()}
              accent="from-pink-500 to-rose-500"
            />
            <MetricBadge
              icon={ClipboardList}
              label="Campionature aperte"
              value={stats.openSamples.toString()}
              accent="from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <Tabs.List className="flex flex-wrap gap-3 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          {TAB_ITEMS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={`flex-1 min-w-[180px] px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === tab.value
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <p className="font-semibold">{tab.label}</p>
              <p className="text-xs opacity-80">{tab.description}</p>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="mt-6">
          <Tabs.Content value="materials">
            <MaterialsTab hook={rawMaterialsHook} profileId={profile?.id} notify={addNotification} />
          </Tabs.Content>

          <Tabs.Content value="recipes">
            <RecipesTab
              hook={recipesHook}
              materials={rawMaterialsHook.materials}
              materialsLoading={rawMaterialsHook.loading}
              profileId={profile?.id}
              notify={addNotification}
            />
          </Tabs.Content>

          <Tabs.Content value="samples">
            <SamplesTab
              hook={samplesHook}
              recipes={recipesHook.recipes}
              customers={customers}
              customersLoading={customersLoading}
              profileId={profile?.id}
              notify={addNotification}
            />
          </Tabs.Content>

          <Tabs.Content value="insights">
            <InsightsTab recipes={recipesHook.recipes} samples={samplesHook.samples} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
};

/**
 * Materials Tab
 */
type MaterialsTabProps = {
  hook: RawMaterialsHook;
  profileId?: string;
  notify: ReturnType<typeof useNotifications>['addNotification'];
};

type MaterialFormValues = {
  code: string;
  name: string;
  supplier: string;
  unit: string;
  cost_per_unit: number;
  lead_time_days?: number;
  sds_url?: string;
  safety_notes?: string;
  class_id?: string;
};

const MaterialsTab = ({ hook, profileId, notify }: MaterialsTabProps) => {
  const {
    materials,
    loading,
    error,
    search,
    setSearch,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    classes,
    classesLoading,
    classError,
    createClass,
    deleteClass
  } = hook;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LabRawMaterialWithClass | null>(null);
  const [newClassName, setNewClassName] = useState('');

  const form = useForm<MaterialFormValues>({
    defaultValues: {
      code: '',
      name: '',
      supplier: '',
      unit: 'kg',
      cost_per_unit: 0,
      class_id: ''
    }
  });

  const openDialog = (material?: LabRawMaterialWithClass) => {
    if (material) {
      setEditing(material);
      form.reset({
        code: material.code,
        name: material.name,
        supplier: material.supplier ?? '',
        unit: material.unit,
        cost_per_unit: material.cost_per_unit,
        lead_time_days: material.lead_time_days ?? undefined,
        sds_url: material.sds_url ?? '',
        safety_notes: material.safety_notes ?? '',
        class_id: material.class_id ?? ''
      });
    } else {
      setEditing(null);
      form.reset({
        code: '',
        name: '',
        supplier: '',
        unit: 'kg',
        cost_per_unit: 0,
        lead_time_days: undefined,
        sds_url: '',
        safety_notes: '',
        class_id: ''
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (values: MaterialFormValues) => {
    if (!profileId && !editing) {
      notify({
        type: 'error',
        title: 'Profilo non valido',
        message: 'Non è possibile creare una materia prima senza utente autenticato.'
      });
      return;
    }

    const safeNumber = (value?: number) =>
      typeof value === 'number' && !Number.isNaN(value) ? value : null;

    const payload = {
      ...values,
      cost_per_unit: safeNumber(values.cost_per_unit) ?? 0,
      supplier: values.supplier || null,
      sds_url: values.sds_url || null,
      safety_notes: values.safety_notes || null,
      lead_time_days: safeNumber(values.lead_time_days),
      class_id: values.class_id ? values.class_id : null
    };

    try {
      if (editing) {
        await updateMaterial(editing.id, payload);
        notify({ type: 'success', title: 'Materia prima aggiornata' });
      } else {
        await createMaterial({
          ...payload,
          created_by: profileId!
        });
        notify({ type: 'success', title: 'Materia prima creata' });
      }
      setDialogOpen(false);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore salvataggio',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  const handleDelete = async (material: LabRawMaterialWithClass) => {
    if (!window.confirm(`Eliminare definitivamente ${material.name}?`)) return;
    try {
      await deleteMaterial(material.id);
      notify({ type: 'success', title: 'Materia prima eliminata' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore eliminazione',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  const handleAddClass = async () => {
    const value = newClassName.trim();
    if (!value) return;
    try {
      await createClass(value);
      setNewClassName('');
      notify({ type: 'success', title: 'Classe aggiunta' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore classe',
        message: err instanceof Error ? err.message : 'Impossibile creare la classe'
      });
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (!window.confirm(`Eliminare la classe "${name}"?`)) return;
    try {
      await deleteClass(classId);
      notify({ type: 'success', title: 'Classe eliminata' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore classe',
        message: err instanceof Error ? err.message : 'Impossibile eliminare la classe'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca per nome, codice o fornitore"
          className="md:flex-1"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => hook.refresh()}>
            Aggiorna
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuova Materia Prima
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      {classError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertTriangle className="w-4 h-4" />
          {classError}
        </div>
      )}

      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Classi materie prime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newClassName}
              onChange={event => setNewClassName(event.target.value)}
              placeholder="Nome classe (es. Conservanti)"
            />
            <Button
              onClick={handleAddClass}
              disabled={!newClassName.trim()}
            >
              Aggiungi
            </Button>
          </div>
          {classesLoading ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento classi...
            </div>
          ) : classes.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna classe definita.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <span
                  key={cls.id}
                  className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-100"
                >
                  {cls.name}
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Codice
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fornitore
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Costo unitario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2 text-rose-500" />
                    Caricamento materie prime...
                  </td>
                </tr>
              )}
              {!loading && materials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Nessuna materia prima disponibile. Aggiungine una nuova.
                  </td>
                </tr>
              )}
              {!loading &&
                materials.map((material) => (
                  <tr key={material.id} className="hover:bg-rose-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{material.code}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{material.name}</p>
                        {material.material_class && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {material.material_class.name}
                          </span>
                        )}
                        {material.safety_notes && (
                          <p className="text-xs text-gray-500">{material.safety_notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{material.supplier || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(material.cost_per_unit)} / {material.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(material)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Modifica
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(material)}>
                          Elimina
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifica materia prima' : 'Nuova materia prima'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Codice" required>
                <Input {...form.register('code', { required: true })} />
              </FormField>
              <FormField label="Unità di misura" required>
                <Input {...form.register('unit', { required: true })} />
              </FormField>
            </div>
            <FormField label="Nome" required>
              <Input {...form.register('name', { required: true })} />
            </FormField>
            <FormField label="Fornitore">
              <Input {...form.register('supplier')} />
            </FormField>
            <FormField label="Classe">
              <Controller
                name="class_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={value => field.onChange(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una classe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Costo unitario (€)" required>
                <Input type="number" step="0.01" {...form.register('cost_per_unit', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Lead time (giorni)">
                <Input type="number" {...form.register('lead_time_days', { valueAsNumber: true })} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Scheda di sicurezza (URL)">
                <Input type="url" {...form.register('sds_url')} />
              </FormField>
            </div>
            <FormField label="Note di sicurezza">
              <Textarea {...form.register('safety_notes')} rows={3} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Aggiorna' : 'Crea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Recipes Tab
 */
type RecipesTabProps = {
  hook: RecipesHook;
  materials: LabRawMaterial[];
  materialsLoading: boolean;
  profileId?: string;
  notify: ReturnType<typeof useNotifications>['addNotification'];
};

type RecipeFormValues = {
  code: string;
  name: string;
  status: string;
  batch_size: number;
  unit: string;
  target_cost?: number;
  notes?: string;
  instructions?: string;
};

type IngredientsFormValues = {
  items: Array<{
    raw_material_id: string;
    percentage: number;
    phase: LabMixPhase;
    notes?: string;
  }>;
};

const RecipesTab = ({ hook, materials, materialsLoading, profileId, notify }: RecipesTabProps) => {
  const {
    recipes,
    loading,
    error,
    search,
    setSearch,
    includeArchived,
    setIncludeArchived,
    createRecipe,
    updateRecipe,
    duplicateRecipe,
    deleteRecipe,
    fetchIngredients,
    saveIngredients,
    fetchRecipeVersions,
    createRecipeVersion,
    restoreRecipeVersion,
    generateProductionSheet,
    refresh
  } = hook;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<LabRecipe | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<LabRecipeIngredientWithMaterial[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [sheetPayload, setSheetPayload] = useState<ProductionSheetPayload | null>(null);
  const sheetPrintRef = useRef<HTMLDivElement | null>(null);
  const [versions, setVersions] = useState<LabRecipeVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionActionLoading, setVersionActionLoading] = useState(false);

  const recipeForm = useForm<RecipeFormValues>({
    defaultValues: {
      code: '',
      name: '',
      status: 'draft',
      unit: 'kg',
      batch_size: 100
    }
  });

  const ingredientsForm = useForm<IngredientsFormValues>({
    defaultValues: {
      items: []
    }
  });

  const ingredientsArray = useFieldArray({
    control: ingredientsForm.control,
    name: 'items'
  });

  const selectedRecipe = useMemo(() => {
    if (!recipes.length) return null;
    return recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0];
  }, [recipes, selectedRecipeId]);

  useEffect(() => {
    if (recipes.length && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].id);
    }
  }, [recipes, selectedRecipeId]);

  useEffect(() => {
    const loadIngredients = async () => {
      if (!selectedRecipe) return;
      setIngredientsLoading(true);
      try {
        const data = await fetchIngredients(selectedRecipe.id);
        setIngredients(data);
      } catch (err) {
        notify({
          type: 'error',
          title: 'Errore caricamento ingredienti',
          message: err instanceof Error ? err.message : 'Operazione non riuscita'
        });
      } finally {
        setIngredientsLoading(false);
      }
    };

    loadIngredients();
  }, [fetchIngredients, notify, selectedRecipe]);

  const loadVersions = useCallback(
    async (targetId?: string) => {
      const recipeId = targetId ?? selectedRecipe?.id;
      if (!recipeId) {
        setVersions([]);
        return;
      }
      setVersionsLoading(true);
      try {
        const data = await fetchRecipeVersions(recipeId);
        setVersions(data);
      } catch (err) {
        notify({
          type: 'error',
          title: 'Errore versioni',
          message: err instanceof Error ? err.message : 'Impossibile caricare le versioni'
        });
      } finally {
        setVersionsLoading(false);
      }
    },
    [fetchRecipeVersions, notify, selectedRecipe?.id]
  );

  useEffect(() => {
    loadVersions(selectedRecipe?.id);
  }, [loadVersions, selectedRecipe?.id]);

  const openRecipeDialog = (recipe?: LabRecipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      recipeForm.reset({
        code: recipe.code,
        name: recipe.name,
        status: recipe.status,
        batch_size: recipe.batch_size ?? 100,
        unit: recipe.unit ?? 'kg',
        target_cost: recipe.target_cost ?? undefined,
        notes: recipe.notes ?? '',
        instructions: recipe.instructions ?? ''
      });
    } else {
      setEditingRecipe(null);
      recipeForm.reset({
        code: '',
        name: '',
        status: 'draft',
        batch_size: 100,
        unit: 'kg',
        target_cost: undefined,
        notes: '',
        instructions: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDeleteRecipe = async (recipe: LabRecipe, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(`Eliminare definitivamente la ricetta ${recipe.name}?`)) return;
    try {
      await deleteRecipe(recipe.id);
      notify({ type: 'success', title: 'Ricetta eliminata' });
      if (selectedRecipeId === recipe.id) {
        setSelectedRecipeId(recipes.filter(r => r.id !== recipe.id)[0]?.id ?? null);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore eliminazione',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  const submitRecipe = async (values: RecipeFormValues) => {
    if (!profileId && !editingRecipe) {
      notify({
        type: 'error',
        title: 'Profilo non valido',
        message: 'Non è possibile creare una ricetta senza utente autenticato.'
      });
      return;
    }

    const sanitized: RecipeFormValues = {
      ...values,
      batch_size: Number.isFinite(values.batch_size) ? values.batch_size : 0,
      target_cost: values.target_cost && Number.isFinite(values.target_cost) ? values.target_cost : undefined
    };

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, sanitized);
        notify({ type: 'success', title: 'Ricetta aggiornata' });
      } else {
        const recipe = await createRecipe({
          ...sanitized,
          created_by: profileId!
        });
        setSelectedRecipeId(recipe.id);
        notify({ type: 'success', title: 'Ricetta creata' });
      }
      setDialogOpen(false);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore salvataggio ricetta',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  const openIngredientsDialog = () => {
    if (!selectedRecipe) return;
    setIngredientsDialogOpen(true);
    ingredientsForm.reset({
      items: ingredients.map((ingredient) => ({
        raw_material_id: ingredient.raw_material_id,
        percentage: ingredient.percentage,
        notes: ingredient.notes ?? '',
        phase: (ingredient.phase as LabMixPhase | undefined) ?? 'Acqua'
      }))
    });
    if (!ingredients.length) {
      ingredientsArray.replace([
        { raw_material_id: materials[0]?.id || '', percentage: 0, notes: '', phase: 'Acqua' }
      ]);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedRecipe) return;
    setVersionActionLoading(true);
    try {
      await createRecipeVersion(selectedRecipe.id, profileId);
      await refresh();
      await loadVersions(selectedRecipe.id);
      notify({ type: 'success', title: 'Nuova versione creata' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore versione',
        message: err instanceof Error ? err.message : 'Impossibile creare una nuova versione'
      });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedRecipe) return;
    setVersionActionLoading(true);
    try {
      await restoreRecipeVersion(versionId, selectedRecipe.id, profileId);
      await refresh();
      await loadVersions(selectedRecipe.id);
      notify({ type: 'success', title: 'Versione ripristinata' });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore ripristino',
        message: err instanceof Error ? err.message : 'Impossibile ripristinare la versione'
      });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const submitIngredients = async (values: IngredientsFormValues) => {
    if (!selectedRecipe) return;
    try {
      const payload = values.items
        .filter((item) => item.raw_material_id && Number.isFinite(item.percentage))
        .map((item, index) => {
          const percentage = Number.isFinite(item.percentage) ? item.percentage : 0;
          const material = materials.find((m) => m.id === item.raw_material_id);
          const quantity = calculateIngredientQuantity(percentage, selectedRecipe.batch_size ?? 0);
          const cost_share = calculateIngredientCost(quantity, material?.cost_per_unit ?? 0);
          return {
            raw_material_id: item.raw_material_id,
            percentage,
            quantity,
            cost_share,
            notes: item.notes || null,
            position: index,
            phase: item.phase || 'Acqua'
          };
        });

      await saveIngredients(selectedRecipe.id, payload);
      notify({ type: 'success', title: 'Ingredienti aggiornati' });
      setIngredientsDialogOpen(false);
      const refreshed = await fetchIngredients(selectedRecipe.id);
      setIngredients(refreshed);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore ingredienti',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  const handleGenerateSheet = useCallback(async () => {
    if (!selectedRecipe) return;
    try {
      const payload = await generateProductionSheet(selectedRecipe.id);
      setSheetPayload(payload);
      setSheetDialogOpen(true);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore generazione scheda',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  }, [generateProductionSheet, notify, selectedRecipe]);

  const handlePrintSheet = useCallback(() => {
    if (!sheetPayload || !sheetPrintRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Scheda produzione ${sheetPayload.header.code}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Inter', Arial, sans-serif; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.04em; }
            .section { margin-top: 16px; }
          </style>
        </head>
        <body>
          ${sheetPrintRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [sheetPayload]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca ricette per nome o codice"
          className="lg:flex-1"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
            />
            Mostra archiviate
          </label>
          <Button variant="outline" onClick={() => hook.refresh()}>
            Aggiorna
          </Button>
          <Button onClick={() => openRecipeDialog()}>
            <FlaskConical className="w-4 h-4 mr-2" />
            Nuova Ricetta
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {loading && (
            <Card className="p-6">
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
            </Card>
          )}
          {!loading && recipes.length === 0 && (
            <Card className="p-6 text-center text-gray-500">
              Nessuna ricetta presente. Creane una nuova.
            </Card>
          )}
          {!loading &&
            recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedRecipe?.id === recipe.id ? 'border-rose-400 shadow-lg' : 'border-transparent'
                }`}
                onClick={() => setSelectedRecipeId(recipe.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{recipe.name}</span>
                    <Badge variant="outline">{recipe.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>Codice: <span className="font-medium">{recipe.code}</span></p>
                  <p>Versione: <span className="font-medium">{recipe.version ?? 1}</span></p>
                  <p>
                    Batch: <span className="font-medium">{recipe.batch_size ?? 0} {recipe.unit ?? 'kg'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        openRecipeDialog(recipe);
                      }}
                    >
                      Modifica
                    </Button>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={async (event) => {
                        event.stopPropagation();
                        try {
                          const duplicate = await duplicateRecipe(recipe.id);
                          setSelectedRecipeId(duplicate.id);
                          notify({ type: 'success', title: 'Ricetta duplicata' });
                        } catch (err) {
                          notify({
                            type: 'error',
                            title: 'Errore duplicazione',
                            message: err instanceof Error ? err.message : 'Operazione non riuscita'
                          });
                        }
                      }}
                    >
                      Duplica
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={(event) => handleDeleteRecipe(recipe, event)}
                    >
                      Elimina
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="lg:col-span-3">
          {!selectedRecipe ? (
            <Card className="p-6 text-center text-gray-500">Seleziona una ricetta per vedere i dettagli.</Card>
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedRecipe.name}</h3>
                  <p className="text-sm text-gray-500">
                    Codice {selectedRecipe.code} · Versione {selectedRecipe.version ?? 1}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={openIngredientsDialog} disabled={!materials.length}>
                    <Beaker className="w-4 h-4 mr-2" />
                    Modifica ingredienti
                  </Button>
                  <Button onClick={handleGenerateSheet} disabled={!ingredients.length}>
                    <FileText className="w-4 h-4 mr-2" />
                    Scheda produzione
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <InfoCard label="Batch" value={`${selectedRecipe.batch_size ?? 0} ${selectedRecipe.unit ?? 'kg'}`} />
                <InfoCard
                  label="Costo stimato"
                  value={formatCurrency(
                    ingredients.reduce((sum, ingredient) => {
                      const qty =
                        ingredient.quantity ??
                        calculateIngredientQuantity(ingredient.percentage, selectedRecipe.batch_size ?? 0);
                      const costShare =
                        ingredient.cost_share ??
                        calculateIngredientCost(qty, ingredient.raw_material?.cost_per_unit ?? 0);
                      return sum + costShare;
                    }, 0)
                  )}
                />
                <InfoCard label="Stato" value={selectedRecipe.status} />
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">Ingredienti ({ingredients.length})</h4>
                {ingredientsLoading ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento ingredienti...
                  </div>
                ) : ingredients.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun ingrediente configurato.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Materia</th>
                          <th className="px-4 py-3">% lotto</th>
                          <th className="px-4 py-3">Fase</th>
                          <th className="px-4 py-3">Quantità</th>
                          <th className="px-4 py-3 hidden md:table-cell">Costo stimato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {ingredients.map((ingredient) => (
                          <tr key={ingredient.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{ingredient.raw_material?.name || 'Materia'}</div>
                              <div className="text-xs text-gray-500">{ingredient.raw_material?.code}</div>
                              {ingredient.raw_material?.material_class?.name && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {ingredient.raw_material.material_class.name}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">{ingredient.percentage}%</td>
                            <td className="px-4 py-3">{(ingredient.phase as LabMixPhase | undefined) ?? 'Acqua'}</td>
                            <td className="px-4 py-3">
                              {ingredient.quantity ?? calculateIngredientQuantity(ingredient.percentage, selectedRecipe.batch_size ?? 0)}{' '}
                              {selectedRecipe.unit ?? 'kg'}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {formatCurrency(
                                ingredient.cost_share ??
                                  calculateIngredientCost(
                                    ingredient.quantity ?? calculateIngredientQuantity(ingredient.percentage, selectedRecipe.batch_size ?? 0),
                                    ingredient.raw_material?.cost_per_unit ?? 0
                                  )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Versioni salvate</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateVersion}
                    disabled={!selectedRecipe || versionActionLoading}
                  >
                    {versionActionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuova versione
                      </>
                    )}
                  </Button>
                </div>
                {versionsLoading ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento versioni...
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessuna versione salvata.</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">Versione {version.version}</p>
                          <p className="text-xs text-gray-500">
                            Salvata il {new Date(version.created_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={versionActionLoading}
                          onClick={() => handleRestoreVersion(version.id)}
                        >
                          Ripristina
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRecipe.notes && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-900">
                  <p className="font-semibold mb-1">Note ricetta</p>
                  <p>{selectedRecipe.notes}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Recipe dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Modifica ricetta' : 'Nuova ricetta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={recipeForm.handleSubmit(submitRecipe)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Codice" required>
                <Input {...recipeForm.register('code', { required: true })} />
              </FormField>
              <FormField label="Stato" required>
                <Controller
                  name="status"
                  control={recipeForm.control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPE_STATUSES.map(statusOption => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <FormField label="Nome" required>
              <Input {...recipeForm.register('name', { required: true })} />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Batch">
                <Input type="number" {...recipeForm.register('batch_size', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Unità">
                <Input {...recipeForm.register('unit')} />
              </FormField>
              <FormField label="Target cost (€)">
                <Input type="number" step="0.01" {...recipeForm.register('target_cost', { valueAsNumber: true })} />
              </FormField>
            </div>
            <FormField label="Istruzioni">
              <Textarea rows={3} {...recipeForm.register('instructions')} />
            </FormField>
            <FormField label="Note">
              <Textarea rows={3} {...recipeForm.register('notes')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={recipeForm.formState.isSubmitting}>
                {recipeForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRecipe ? 'Aggiorna' : 'Crea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ingredients dialog */}
      <Dialog open={ingredientsDialogOpen} onOpenChange={setIngredientsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ingredienti ricetta</DialogTitle>
          </DialogHeader>
          {!materials.length && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl p-4 text-sm mb-4">
              Aggiungi almeno una materia prima per poter comporre la ricetta.
            </div>
          )}
          <form onSubmit={ingredientsForm.handleSubmit(submitIngredients)} className="space-y-4">
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {ingredientsArray.fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Ingrediente #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => ingredientsArray.remove(index)}
                      disabled={ingredientsArray.fields.length === 1}
                    >
                      Rimuovi
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <FormField label="Materia prima" required>
                      <Controller
                        name={`items.${index}.raw_material_id`}
                        control={ingredientsForm.control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={!materials.length || materialsLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{material.name} · {material.code}</span>
                                    {material.material_class && (
                                      <span className="text-xs text-gray-500">{material.material_class.name}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                    <FormField label="Percentuale (%)" required>
                      <Input
                        type="number"
                        step="0.01"
                        {...ingredientsForm.register(`items.${index}.percentage`, { valueAsNumber: true, required: true })}
                      />
                    </FormField>
                    <FormField label="Note">
                      <Input {...ingredientsForm.register(`items.${index}.notes`)} />
                    </FormField>
                    <FormField label="Fase" required>
                      <Controller
                        name={`items.${index}.phase`}
                        control={ingredientsForm.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Fase" />
                            </SelectTrigger>
                            <SelectContent>
                              {LAB_MIX_PHASES.map(phase => (
                                <SelectItem key={phase} value={phase}>
                                  {phase}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  ingredientsArray.append({
                    raw_material_id: materials[0]?.id || '',
                    percentage: 0,
                    notes: '',
                    phase: 'Acqua'
                  })
                }
                disabled={!materials.length}
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi ingrediente
              </Button>
              <DialogFooter className="p-0">
                <Button variant="outline" type="button" onClick={() => setIngredientsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={ingredientsForm.formState.isSubmitting}>
                  {ingredientsForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salva ingredienti
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Production sheet dialog */}
      <Dialog open={sheetDialogOpen} onOpenChange={setSheetDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scheda produzione</DialogTitle>
          </DialogHeader>
          {!sheetPayload ? (
            <div className="text-center py-8 text-gray-500">Nessun dato disponibile.</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2" ref={sheetPrintRef}>
              <div>
                <p className="text-xs uppercase text-gray-500">Ricetta</p>
                <p className="text-lg font-semibold text-gray-900">
                  {sheetPayload.header.name} · {sheetPayload.header.code}
                </p>
                <p className="text-sm text-gray-500">
                  Batch {sheetPayload.header.batchSize} {sheetPayload.header.unit} · Versione {sheetPayload.header.version}
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <InfoCard label="Costo lotto stimato" value={formatCurrency(sheetPayload.summary.estimatedBatchCost)} />
                <InfoCard label="Costo unitario" value={formatCurrency(sheetPayload.summary.estimatedUnitCost)} />
                <InfoCard label="Totale %" value={`${sheetPayload.summary.totalPercentage.toFixed(2)}%`} />
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Ingrediente</th>
                      <th className="px-3 py-2">% lotto</th>
                      <th className="px-3 py-2">Fase</th>
                      <th className="px-3 py-2">Quantità</th>
                      <th className="px-3 py-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sheetPayload.ingredients.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {row.name}
                          <span className="block text-xs text-gray-500">{row.code}</span>
                          {row.className && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {row.className}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.percentage}%</td>
                        <td className="px-3 py-2">{row.phase ?? 'Acqua'}</td>
                        <td className="px-3 py-2">
                          {row.quantity} {sheetPayload.header.unit}
                        </td>
                        <td className="px-3 py-2">{formatCurrency(row.costShare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sheetPayload.steps.instructions && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-1">Istruzioni</p>
                  <p>{sheetPayload.steps.instructions}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => setSheetDialogOpen(false)}>
              Chiudi
            </Button>
            <Button onClick={handlePrintSheet} disabled={!sheetPayload}>
              <Printer className="w-4 h-4 mr-2" />
              Stampa A4
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Samples Tab
 */
type SamplesTabProps = {
  hook: SamplesHook;
  recipes: LabRecipe[];
  customers: CustomerLite[];
  customersLoading: boolean;
  profileId?: string;
  notify: ReturnType<typeof useNotifications>['addNotification'];
};

type SampleFormValues = {
  project_name: string;
  recipe_id?: string;
  customer_id?: string;
  status: LabSampleStatus;
  priority: string;
  due_date?: string;
  notes?: string;
  customization_notes?: string;
};

const SAMPLE_STATUSES: LabSampleStatus[] = [
  'draft',
  'pending',
  'in_progress',
  'ready',
  'sent',
  'approved',
  'rejected',
  'archived'
];

const SAMPLE_PRIORITIES = ['low', 'normal', 'high'] as const;

const SamplesTab = ({ hook, recipes, customers, customersLoading, profileId, notify }: SamplesTabProps) => {
  const { samples, loading, error, status, setStatus, search, setSearch, createSample, updateSample, updateSampleStatus } = hook;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LabSampleWithRelations | null>(null);

  const form = useForm<SampleFormValues>({
    defaultValues: {
      project_name: '',
      status: 'draft',
      priority: 'normal'
    }
  });

  const openDialog = (sample?: LabSampleWithRelations) => {
    if (sample) {
      setEditing(sample);
      form.reset({
        project_name: sample.project_name,
        recipe_id: sample.recipe_id ?? undefined,
        customer_id: sample.customer_id ?? undefined,
        status: sample.status,
        priority: sample.priority,
        due_date: sample.due_date ?? undefined,
        notes: sample.notes ?? '',
        customization_notes: sample.customization_notes ?? ''
      });
    } else {
      setEditing(null);
      form.reset({
        project_name: '',
        recipe_id: undefined,
        customer_id: undefined,
        status: 'draft',
        priority: 'normal',
        due_date: undefined,
        notes: '',
        customization_notes: ''
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (values: SampleFormValues) => {
    if (!profileId && !editing) {
      notify({
        type: 'error',
        title: 'Profilo non valido',
        message: 'Non è possibile creare una campionatura senza utente autenticato.'
      });
      return;
    }

    const payload = {
      ...values,
      customer_id: values.customer_id || null,
      recipe_id: values.recipe_id || null,
      due_date: values.due_date || null,
      notes: values.notes || null,
      customization_notes: values.customization_notes || null,
      requested_by: profileId
    };

    try {
      if (editing) {
        await updateSample(editing.id, payload);
        notify({ type: 'success', title: 'Campionatura aggiornata' });
      } else {
        await createSample(payload);
        notify({ type: 'success', title: 'Campionatura creata' });
      }
      setDialogOpen(false);
    } catch (err) {
      notify({
        type: 'error',
        title: 'Errore campionatura',
        message: err instanceof Error ? err.message : 'Operazione non riuscita'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca campionature"
          />
          <Select value={status ?? 'all'} onValueChange={(value) => setStatus(value === 'all' ? undefined : (value as LabSampleStatus))}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {SAMPLE_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => hook.refresh()}>
            Aggiorna
          </Button>
          <Button onClick={() => openDialog()}>
            <PackagePlus className="w-4 h-4 mr-2" />
            Nuova campionatura
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Progetto</th>
                <th className="px-4 py-3">Ricetta</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Priorità</th>
                <th className="px-4 py-3">Scadenza</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2 text-rose-500" />
                    Caricamento campionature...
                  </td>
                </tr>
              )}
              {!loading && samples.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Nessuna campionatura trovata.
                  </td>
                </tr>
              )}
              {!loading &&
                samples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-rose-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{sample.project_name}</div>
                      {sample.notes && <p className="text-xs text-gray-500">{sample.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{sample.recipe?.code || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{sample.customer?.company_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          sample.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : sample.priority === 'low'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {sample.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{sample.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={sample.status}
                        onValueChange={(value) => updateSampleStatus(sample.id, value as LabSampleStatus)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_STATUSES.map((statusItem) => (
                            <SelectItem key={statusItem} value={statusItem}>
                              {statusItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(sample)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Modifica
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifica campionatura' : 'Nuova campionatura'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nome progetto" required>
              <Input {...form.register('project_name', { required: true })} />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Ricetta">
                <Controller
                  control={form.control}
                  name="recipe_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona ricetta" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name} · {recipe.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Cliente">
                <Controller
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={customersLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Stato">
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_STATUSES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Priorità">
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_PRIORITIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Data consegna">
                <Input type="date" {...form.register('due_date')} />
              </FormField>
            </div>
            <FormField label="Personalizzazioni richieste">
              <Textarea rows={3} {...form.register('customization_notes')} />
            </FormField>
            <FormField label="Note interne">
              <Textarea rows={3} {...form.register('notes')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Salva modifiche' : 'Crea campionatura'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Insights Tab
 */
type InsightsTabProps = {
  recipes: LabRecipe[];
  samples: LabSampleWithRelations[];
};

const InsightsTab = ({ recipes, samples }: InsightsTabProps) => {
  const highPrioritySamples = samples.filter((sample) => sample.priority === 'high');
  const recentRecipes = [...recipes].sort(
    (a, b) => new Date(b.updated_at ?? '').getTime() - new Date(a.updated_at ?? '').getTime()
  ).slice(0, 3);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-500 font-semibold">Campionature</p>
            <h3 className="text-xl font-semibold text-gray-900">Priorità alta ({highPrioritySamples.length})</h3>
          </div>
        </div>
        {highPrioritySamples.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna richiesta urgente.</p>
        ) : (
          <ul className="space-y-3">
            {highPrioritySamples.slice(0, 5).map((sample) => (
              <li key={sample.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{sample.project_name}</p>
                  <p className="text-xs text-gray-500">{sample.customer?.company_name || 'Cliente interno'}</p>
                </div>
                <Badge variant="outline">{sample.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6 space-y-4 lg:col-span-2">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Ricette aggiornate</p>
            <h3 className="text-xl font-semibold text-gray-900">Ultimi aggiornamenti</h3>
          </div>
        </div>
        {recentRecipes.length === 0 ? (
          <p className="text-sm text-gray-500">Non ci sono modifiche recenti alle ricette.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {recentRecipes.map((recipe) => (
              <div key={recipe.id} className="border border-gray-200 rounded-xl p-4 text-sm">
                <p className="text-xs text-gray-500 uppercase">Aggiornata il {new Date(recipe.updated_at ?? recipe.created_at).toLocaleDateString('it-IT')}</p>
                <p className="font-semibold text-gray-900">{recipe.name}</p>
                <p className="text-xs text-gray-500">
                  Batch {recipe.batch_size ?? 0} {recipe.unit ?? 'kg'} · Stato {recipe.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * Shared UI helpers
 */
const MetricBadge = ({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: typeof FlaskConical;
  label: string;
  value: string;
  accent: string;
}) => (
  <div className="bg-white rounded-2xl px-4 py-5 shadow flex items-center gap-4 border border-white/80">
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} text-white flex items-center justify-center`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs uppercase text-gray-500 tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const FormField = ({
  label,
  children,
  required
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
    <p className="text-xs uppercase text-gray-500">{label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
);

export default LabPage;

