import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, PackagePlus, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];

const productSchema = z.object({
  name: z.string().min(2, 'Nome prodotto richiesto'),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('pz'),
  base_price: z.number().min(0, 'Prezzo deve essere maggiore di 0').default(0),
  cost: z.number().min(0, 'Costo deve essere maggiore di 0').default(0),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  image_url: z.string().url('URL immagine non valido').optional().or(z.literal('')),
  code: z.string().min(1, 'Codice prodotto richiesto'),
  brand_name: z.string().optional(),
  client_product_code: z.string().optional(),
  supplier_product_code: z.string().optional(),
  barcode: z.string().optional(),
  packaging_type: z.string().optional(),
  regulation: z.string().optional(),
  product_notes: z.string().optional(),
  customer_id: z.string().optional()
});

type ProductForm = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSaveSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSaveSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'pz',
      base_price: 0,
      cost: 0
    }
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editingProduct) {
      Object.keys(editingProduct).forEach((key) => {
        const value = editingProduct[key as keyof Product];
        if (value !== null && value !== undefined) {
          setValue(key as keyof ProductForm, value as any);
        }
      });
    } else {
      reset({
        unit: 'pz',
        base_price: 0,
        cost: 0
      });
    }
  }, [editingProduct, setValue, reset]);

  const onSubmit = async (data: ProductForm) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare o modificare prodotti'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const productData = {
        code: data.code,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        unit: data.unit || 'pz',
        base_price: data.base_price || 0,
        cost: data.cost || 0,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        image_url: data.image_url || null,
        brand_name: data.brand_name || null,
        client_product_code: data.client_product_code || null,
        supplier_product_code: data.supplier_product_code || null,
        barcode: data.barcode || null,
        packaging_type: data.packaging_type || null,
        regulation: data.regulation || null,
        product_notes: data.product_notes || null,
        customer_id: data.customer_id || null,
        created_by: user.id
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'Prodotto aggiornato',
          message: `${data.name} è stato aggiornato con successo`
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'Prodotto creato',
          message: `${data.name} è stato creato con successo`
        });
      }

      // Reset form and call success callback
      reset();
      onSaveSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error saving product:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Si è verificato un errore durante il salvataggio'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {editingProduct ? (
                <>
                  <Package className="w-5 h-5" />
                  <span>Modifica Prodotto</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-5 h-5" />
                  <span>Nuovo Prodotto</span>
                </>
              )}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informazioni Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="code">Codice Prodotto *</Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="es. PROD001"
                />
                {errors.code && (
                  <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Nome Prodotto *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="es. Fertilizzante NPK"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Descrizione dettagliata del prodotto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="es. Fertilizzanti"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unità di Misura</Label>
                <Input
                  id="unit"
                  {...register('unit')}
                  placeholder="es. kg, pz, lt"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informazioni Prezzo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="base_price">Prezzo Base (€)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  {...register('base_price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="cost">Costo (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  {...register('cost', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  {...register('weight', { valueAsNumber: true })}
                  placeholder="0.000"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informazioni Aggiuntive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="brand_name">Marchio</Label>
                <Input
                  id="brand_name"
                  {...register('brand_name')}
                  placeholder="Nome del marchio"
                />
              </div>
              <div>
                <Label htmlFor="client_product_code">Codice Cliente</Label>
                <Input
                  id="client_product_code"
                  {...register('client_product_code')}
                  placeholder="Codice del cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="supplier_product_code">Codice Fornitore</Label>
                <Input
                  id="supplier_product_code"
                  {...register('supplier_product_code')}
                  placeholder="Codice fornitore"
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  {...register('barcode')}
                  placeholder="Codice a barre"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="packaging_type">Tipo Cartone</Label>
                <Input
                  id="packaging_type"
                  {...register('packaging_type')}
                  placeholder="Tipo di imballaggio"
                />
              </div>
              <div>
                <Label htmlFor="regulation">Normativa</Label>
                <Input
                  id="regulation"
                  {...register('regulation')}
                  placeholder="Normativa di riferimento"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dimensions">Dimensioni</Label>
                <Input
                  id="dimensions"
                  {...register('dimensions')}
                  placeholder="es. 30x20x15 cm"
                />
              </div>
              <div>
                <Label htmlFor="image_url">URL Immagine</Label>
                <Input
                  id="image_url"
                  {...register('image_url')}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_notes">Note Prodotto</Label>
              <textarea
                id="product_notes"
                {...register('product_notes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Note aggiuntive sul prodotto..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingProduct ? 'Aggiornamento...' : 'Creazione...'}
                </>
              ) : (
                <>
                  {editingProduct ? 'Aggiorna Prodotto' : 'Crea Prodotto'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};