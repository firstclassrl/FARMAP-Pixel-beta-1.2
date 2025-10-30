import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Filter, Layers, Loader2, PlusCircle, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { useAuth } from '../hooks/useAuth-simple';
import { CustomerSelectionModal } from './CustomerSelectionModal';

type Product = Database['public']['Tables']['products']['Row'];
type PriceListInsert = Database['public']['Tables']['price_lists']['Insert'];
type PriceListItemInsert = Database['public']['Tables']['price_list_items']['Insert'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface BulkPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const BulkPriceListModal: React.FC<BulkPriceListModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [category, setCategory] = useState('');
  const [prefix, setPrefix] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // Load distinct categories from products
  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);
    if (error) return;
    const unique = Array.from(new Set((data || []).map(p => p.category).filter(Boolean))) as string[];
    unique.sort((a, b) => a.localeCompare(b));
    setCategories(unique);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setPreviewCount(null);
    } else {
      // reset state on close
      setName('');
      setSelectedCustomer(null);
      setCategory('');
      setPrefix('');
      setPreviewCount(null);
    }
  }, [isOpen, loadCategories]);

  const canPreview = useMemo(() => !!category && !!prefix, [category, prefix]);
  const canCreate = useMemo(
    () => !!name && !!selectedCustomer && !!category && !!prefix && (previewCount ?? 0) > 0,
    [name, selectedCustomer, category, prefix, previewCount]
  );

  const handlePreview = async () => {
    if (!canPreview) return;
    try {
      setLoadingPreview(true);
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true)
        .eq('category', category)
        .ilike('code', `${prefix}%`);
      if (error) throw error;
      setPreviewCount((data || []).length);
      addNotification({ type: 'info', title: 'Anteprima', message: `${(data || []).length} prodotti trovati` });
    } catch (e: any) {
      console.error(e);
      addNotification({ type: 'error', title: 'Errore anteprima', message: e.message || 'Impossibile calcolare anteprima' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCreate = async () => {
    if (!canCreate || !user) return;
    setCreating(true);
    try {
      // 1) fetch products with prices
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, base_price')
        .eq('is_active', true)
        .eq('category', category)
        .ilike('code', `${prefix}%`);
      if (prodErr) throw prodErr;
      const list = (products || []) as Pick<Product, 'id' | 'base_price'>[];
      if (list.length === 0) {
        addNotification({ type: 'warning', title: 'Nessun prodotto', message: 'Nessun prodotto corrisponde ai filtri' });
        setCreating(false);
        return;
      }

      // 2) create price_list
      const priceListPayload: PriceListInsert = {
        name,
        is_active: true,
        created_by: user.id,
      } as PriceListInsert;

      const { data: newList, error: listErr } = await supabase
        .from('price_lists')
        .insert([priceListPayload])
        .select()
        .single();
      if (listErr) throw listErr;

      // 3) bulk insert price_list_items in chunks
      const rows: PriceListItemInsert[] = list.map(p => ({
        price_list_id: (newList as any).id,
        product_id: p.id,
        price: p.base_price,
        discount_percentage: 0,
        min_quantity: 1,
      }));

      const batches = chunk(rows, 200);
      for (const batch of batches) {
        const { error: itemsErr } = await supabase.from('price_list_items').insert(batch);
        if (itemsErr) throw itemsErr;
      }

      // 4) assign customer to price list
      if (selectedCustomer) {
        const { error: custErr } = await supabase
          .from('customers')
          .update({ price_list_id: (newList as any).id })
          .eq('id', selectedCustomer.id);
        if (custErr) {
          addNotification({ type: 'warning', title: 'Listino creato', message: 'Assegnazione cliente fallita' });
        }
      }

      addNotification({ type: 'success', title: 'Listino creato', message: `Creato con ${(rows || []).length} prodotti` });
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      addNotification({ type: 'error', title: 'Errore creazione', message: e.message || 'Impossibile creare il listino' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5" />
            <span>Crea listino massivo</span>
          </DialogTitle>
          <DialogDescription>
            Seleziona cliente, categoria e prefisso codice per includere i prodotti corrispondenti. I prezzi usano il prezzo base del prodotto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Nome listino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome listino</label>
            <Input placeholder="Es. Listino EN Disabituanti" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowCustomerModal(true)}>
                <Building2 className="w-4 h-4 mr-2" /> {selectedCustomer ? selectedCustomer.company_name : 'Seleziona cliente'}
              </Button>
              {selectedCustomer && (
                <span className="text-xs text-gray-500">{selectedCustomer.email || ''}</span>
              )}
            </div>
          </div>

          {/* Filtri prodotti */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtri prodotti</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleziona categoria</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefisso codice</label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input className="pl-9" placeholder="EN" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Esempio: EN include tutti i codici che iniziano per EN</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>
                    {previewCount === null ? 'Anteprima non calcolata' : `${previewCount} prodotti corrispondenti`}
                  </span>
                </div>
                <Button variant="outline" onClick={handlePreview} disabled={!canPreview || loadingPreview}>
                  {loadingPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calcolo...
                    </>
                  ) : (
                    'Calcola anteprima'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleCreate} disabled={!canCreate || creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creazione...
              </>
            ) : (
              'Crea listino'
            )}
          </Button>
        </DialogFooter>

        {/* Customer selector modal */}
        <CustomerSelectionModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onCustomerSelect={(c) => setSelectedCustomer(c)}
          selectedCustomerId={selectedCustomer?.id}
          title="Seleziona cliente per il listino"
          description="Il listino creato sarà assegnato a questo cliente"
        />
      </DialogContent>
    </Dialog>
  );
};

export default BulkPriceListModal;


