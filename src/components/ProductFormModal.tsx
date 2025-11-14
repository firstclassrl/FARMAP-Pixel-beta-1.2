import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, PackagePlus, Package, Upload, Image, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];

const productSchema = z.object({
  name: z.string().min(2, 'Nome prodotto richiesto'),
  unit: z.string().default('pz'),
  base_price: z.number().min(0, 'Prezzo deve essere maggiore di 0').default(0),
  cost: z.number().min(0, 'Costo deve essere maggiore di 0').default(0),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  code: z.string().min(1, 'Codice prodotto richiesto'),
  cartone: z.string().optional(),
  pallet: z.string().optional(),
  // Allow empty input for "strati": treat '' or NaN as undefined so it's not required
  strati: z.preprocess((v) => {
    if (v === '' || v === null || typeof v === 'undefined') return undefined;
    if (typeof v === 'number' && Number.isNaN(v)) return undefined;
    return v;
  }, z.number().min(0).optional()),
  scadenza: z.string().optional(),
  iva: z.number().min(0).max(100).default(22),
  ean: z.string().optional()
});

type ProductForm = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSaveSuccess: () => void;
  categories?: string[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSaveSuccess,
  categories = []
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [selectedPhoto, setSelectedPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = React.useState<string | null>(null);
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
      cost: 0,
      iva: 22
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
      setSelectedCategory(editingProduct.category || '');
      
      // Set existing photo URL if available
      if (editingProduct?.photo_url) {
        setUploadedPhotoUrl(editingProduct.photo_url);
        setPhotoPreview(editingProduct.photo_url);
      } else {
        setUploadedPhotoUrl(null);
        setPhotoPreview(null);
      }
    } else {
      reset({
        unit: 'pz',
        base_price: 0,
        cost: 0,
        iva: 22
      });
      setSelectedCategory('');
      setUploadedPhotoUrl(null);
      setPhotoPreview(null);
    }
  }, [editingProduct, setValue, reset]);

  const handlePhotoSelect = (file: File) => {
    setSelectedPhoto(file);
    setUploadedPhotoUrl(null); // Reset uploaded URL when new photo is selected

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      addNotification({
        type: 'success',
        title: 'Foto selezionata',
        message: 'Clicca "Carica Foto" per caricarla nel database'
      });
    } catch (error: any) {
      console.error('Errore nella selezione foto:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile selezionare la foto'
      });
    }
  };

  const handlePhotoDelete = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto || !user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Seleziona una foto e assicurati di essere autenticato'
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      // Compress image before upload to reduce file size
      const { compressImage, blobToFile } = await import('../lib/imageUtils');
      const compressedBlob = await compressImage(selectedPhoto, 600, 0.35);
      const compressedFile = blobToFile(compressedBlob, `product_photo.jpg`);

      // Prefer saving under the product ID folder if we are editing,
      // otherwise use a temporary path and rely on create flow to upload after save
      const filePath = editingProduct ? `${editingProduct.id}/main.jpg` : null;

      if (!filePath) {
        addNotification({
          type: 'warning',
          title: 'Salva prima il prodotto',
          message: 'Per nuovi prodotti, salva prima. La foto verrà caricata automaticamente.'
        });
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(filePath, compressedFile, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('product-photos')
        .getPublicUrl(filePath);

      
      setUploadedPhotoUrl(data.publicUrl);

      addNotification({
        type: 'success',
        title: 'Foto caricata',
        message: 'Foto caricata con successo nel database'
      });
    } catch (error: any) {
      console.error('Errore upload foto:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare la foto'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

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
        category: selectedCategory && selectedCategory.trim() !== '' ? selectedCategory : null,
        unit: data.unit || 'pz',
        base_price: data.base_price || 0,
        cost: data.cost || 0,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        cartone: data.cartone || null,
        pallet: data.pallet || null,
        strati: data.strati || null,
        scadenza: data.scadenza || null,
        iva: data.iva || 22,
        ean: data.ean || null,
        photo_url: uploadedPhotoUrl,
        created_by: user.id
      };

      

      if (editingProduct) {
        // Update existing product
        
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        
        

        addNotification({
          type: 'success',
          title: 'Prodotto aggiornato',
          message: `${data.name} è stato aggiornato con successo`
        });
      } else {
        // Create new product (first, without photo), then upload photo and update URL
        const { data: inserted, error: insertError } = await supabase
          .from('products')
          .insert([{ ...productData, photo_url: null }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Database error:', insertError);
          throw insertError;
        }

        // If user selected a photo, upload it under the new product ID and update photo_url
        if (selectedPhoto && inserted?.id) {
          try {
            const fileExt = selectedPhoto.name.split('.').pop();
            const fileName = `product_photo.${fileExt}`;
            const filePath = `${inserted.id}/${fileName}`;

            const { error: uploadErr } = await supabase.storage
              .from('product-photos')
              .upload(filePath, selectedPhoto, { upsert: true });
            if (uploadErr) throw uploadErr;

            const { data: pub } = supabase.storage
              .from('product-photos')
              .getPublicUrl(filePath);

            if (pub?.publicUrl) {
              await supabase
                .from('products')
                .update({ photo_url: pub.publicUrl })
                .eq('id', inserted.id);
            }
          } catch (e) {
            console.error('Errore upload foto post-creazione:', e);
            addNotification({
              type: 'warning',
              title: 'Prodotto creato',
              message: 'Foto non caricata. Puoi aggiungerla modificando il prodotto.'
            });
          }
        }

        addNotification({
          type: 'success',
          title: 'Prodotto creato',
          message: `${data.name} è stato creato con successo`
        });
      }

      // Reset form and call success callback
      reset();
      setSelectedCategory('');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setUploadedPhotoUrl(null);
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
    setSelectedCategory('');
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
                  placeholder="es. PB0001 (2 lettere + 4 numeri)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 2 lettere (prefisso cliente) + 4 numeri. Es: PB0001, AB0001
                </p>
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


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={selectedCategory || undefined} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria (opzionale)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Foto Prodotto</h3>
            
            {photoPreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Anteprima foto prodotto"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handlePhotoDelete}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {uploadedPhotoUrl ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Foto caricata nel database</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto}
                    className="w-full"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Caricamento...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Carica Foto nel Database
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Image className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Carica una foto del prodotto
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Formati supportati: JPG, PNG, GIF (max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoSelect(file);
                    }
                  }}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploadingPhoto}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleziona Foto
                </Button>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informazioni Aggiuntive</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dimensions">Dimensioni</Label>
                <Input
                  id="dimensions"
                  {...register('dimensions')}
                  placeholder="es. 30x20x15 cm"
                />
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cartone">Cartone</Label>
                <Input
                  id="cartone"
                  {...register('cartone')}
                  placeholder="Tipo di cartone"
                />
              </div>
              <div>
                <Label htmlFor="pallet">Pallet</Label>
                <Input
                  id="pallet"
                  {...register('pallet')}
                  placeholder="Informazioni pallet"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="strati">Strati</Label>
                <Input
                  id="strati"
                  type="number"
                  {...register('strati', { valueAsNumber: true })}
                  placeholder="Numero strati"
                />
              </div>
              <div>
                <Label htmlFor="scadenza">Scadenza</Label>
                <Input
                  id="scadenza"
                  {...register('scadenza')}
                  placeholder="es. 3 anni"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Durata di scadenza (es. 3 anni, 2 anni, 1 anno)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="iva">IVA (%)</Label>
                <Input
                  id="iva"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('iva', { valueAsNumber: true })}
                  placeholder="22.00"
                />
              </div>
              <div>
                <Label htmlFor="ean">EAN</Label>
                <Input
                  id="ean"
                  {...register('ean')}
                  placeholder="Codice EAN"
                />
              </div>
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