import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Camera,
  FileCheck,
  Upload,
  Download,
  Trash2,
  Eye,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Building,
  User,
  Calendar,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase, uploadFile, getFileUrl } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

// Extend Product type to include customer_id and customer data
interface ProductWithCustomer extends Product {
  customer_id: string | null;
  customers?: Customer;
}

interface FileUploadZoneProps {
  title: string;
  description: string;
  accept: string;
  currentFile?: string;
  onFileUpload: (file: File) => Promise<void>;
  onFileDelete: () => Promise<void>;
  uploading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  title,
  description,
  accept,
  currentFile,
  onFileUpload,
  onFileDelete,
  uploading,
  icon: Icon,
  color
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <div className={`file-upload-zone ${dragOver ? 'drag-over' : ''} rounded-lg p-6 text-center transition-all duration-300`}>
      <div className="space-y-4">
        <div className={`w-16 h-16 mx-auto rounded-full ${color} flex items-center justify-center`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {currentFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">File caricato</span>
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentFile, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizza
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentFile.startsWith('data:')) {
                    // Handle base64 data URLs
                    const link = document.createElement('a');
                    link.href = currentFile;
                    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.${currentFile.includes('pdf') ? 'pdf' : 'jpg'}`;
                    link.click();
                  } else {
                    // Handle regular URLs
                    const link = document.createElement('a');
                    link.href = currentFile;
                    link.download = title.toLowerCase().replace(/\s+/g, '_');
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Scarica
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onFileDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Rimuovi
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                id={`file-${title.toLowerCase().replace(/\s+/g, '-')}`}
                disabled={uploading}
              />
              <label
                htmlFor={`file-${title.toLowerCase().replace(/\s+/g, '-')}`}
                className="cursor-pointer block"
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Caricamento...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Trascina il file qui o <span className="text-blue-600 underline">clicca per selezionare</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Formati supportati: {accept.replace(/\./g, '').toUpperCase()}
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductDetailSheetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [product, setProduct] = useState<ProductWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({
    photo: false,
    sds: false,
    st: false
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    client_product_code: '',
    supplier_product_code: '',
    barcode: '',
    packaging_type: '',
    regulation: '',
    product_notes: ''
  });

  const loadProduct = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // First, load the product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      
      let customerData = null;
      
      // If product has a customer_id, load the customer separately
      if (productData.customer_id) {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, company_name, contact_person')
          .eq('id', productData.customer_id)
          .single();
          
        if (!customerError) {
          customerData = customer;
        }
      }
      
      // Combine product and customer data
      const combinedData = {
        ...productData,
        customers: customerData
      };
      
      setProduct(combinedData);
      
      // Pre-fill form data
      setFormData({
        brand_name: productData.brand_name || '',
        client_product_code: productData.client_product_code || '',
        supplier_product_code: productData.supplier_product_code || '',
        barcode: productData.barcode || '',
        packaging_type: productData.packaging_type || '',
        regulation: productData.regulation || '',
        product_notes: productData.product_notes || ''
      });

    } catch (error) {
      console.error('Error loading product:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare il prodotto'
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, addNotification, navigate]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleFileUpload = async (file: File, type: 'photo' | 'sds' | 'st') => {
    if (!product || !user) return;

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      // Convert file to base64 data URL for temporary storage
      const reader = new FileReader();
      const fileUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update product record
      const updateField = `${type}_url`;
      const { error } = await supabase
        .from('products')
        .update({ [updateField]: fileUrl })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state
      setProduct(prev => prev ? { ...prev, [updateField]: fileUrl } : null);

      addNotification({
        type: 'success',
        title: 'File caricato',
        message: `${type.toUpperCase()} caricato con successo (temporaneo)`
      });

    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      addNotification({
        type: 'error',
        title: 'Errore upload',
        message: `Impossibile caricare il file ${type.toUpperCase()}`
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileDelete = async (type: 'photo' | 'sds' | 'st') => {
    if (!product || !user) return;

    if (!confirm(`Sei sicuro di voler eliminare il file ${type.toUpperCase()}?`)) return;

    try {
      // Update product record
      const updateField = `${type}_url`;
      const { error } = await supabase
        .from('products')
        .update({ [updateField]: null })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state
      setProduct(prev => prev ? { ...prev, [updateField]: null } : null);

      addNotification({
        type: 'success',
        title: 'File eliminato',
        message: `${type.toUpperCase()} eliminato con successo`
      });

    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: `Impossibile eliminare il file ${type.toUpperCase()}`
      });
    }
  };

  const handleSaveProductInfo = async () => {
    if (!product || !user) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          brand_name: formData.brand_name || null,
          client_product_code: formData.client_product_code || null,
          supplier_product_code: formData.supplier_product_code || null,
          barcode: formData.barcode || null,
          packaging_type: formData.packaging_type || null,
          regulation: formData.regulation || null,
          product_notes: formData.product_notes || null
        })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state
      setProduct(prev => prev ? { 
        ...prev, 
        brand_name: formData.brand_name || null,
        client_product_code: formData.client_product_code || null,
        supplier_product_code: formData.supplier_product_code || null,
        barcode: formData.barcode || null,
        packaging_type: formData.packaging_type || null,
        regulation: formData.regulation || null,
        product_notes: formData.product_notes || null
      } : null);

      setEditMode(false);
      addNotification({
        type: 'success',
        title: 'Informazioni salvate',
        message: 'Le informazioni del prodotto sono state aggiornate'
      });

    } catch (error: any) {
      console.error('Error saving product info:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile salvare le informazioni del prodotto'
      });
    }
  };

  const getCompletionPercentage = () => {
    if (!product) return 0;
    
    let completed = 0;
    const total = 3; // photo, sds, st
    
    if (product.photo_url) completed++;
    if (product.sds_url) completed++;
    if (product.st_url) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const getCompletionColor = () => {
    const percentage = getCompletionPercentage();
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento scheda prodotto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Prodotto non trovato</h2>
          <p className="text-gray-600 mb-4">Il prodotto richiesto non esiste o non è accessibile</p>
          <Button asChild>
            <Link to="/product-sheets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alle Schede Prodotto
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/product-sheets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Schede Prodotto
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">
              Gestisci foto e documenti per {product.code}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`text-right ${getCompletionColor()}`}>
            <div className="text-2xl font-bold">{getCompletionPercentage()}%</div>
            <div className="text-xs">Completezza</div>
          </div>
        </div>
      </div>

      {/* Product Info Card */}
      <Card className="product-sheet-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Informazioni Prodotto</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Annulla
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Modifica Info
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Nome Prodotto</Label>
                <p className="text-lg font-semibold text-gray-900">{product.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Codice Prodotto</Label>
                <p className="font-mono text-gray-900">{product.code}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Categoria</Label>
                <p className="text-gray-900">{product.category || 'Non specificata'}</p>
              </div>
            </div>

            {/* Extended Info */}
            <div className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <Label htmlFor="brand_name">Marchio</Label>
                    <Input
                      id="brand_name"
                      value={formData.brand_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                      placeholder="Nome del marchio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_product_code">Codice Cliente</Label>
                    <Input
                      id="client_product_code"
                      value={formData.client_product_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_product_code: e.target.value }))}
                      placeholder="Codice del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_product_code">Codice FARMAP</Label>
                    <Input
                      id="supplier_product_code"
                      value={formData.supplier_product_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_product_code: e.target.value }))}
                      placeholder="Codice FARMAP/Fornitore"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Marchio</Label>
                    <p className="text-gray-900">{product.brand_name || 'Non specificato'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Codice Cliente</Label>
                    <p className="text-gray-900">{product.client_product_code || 'Non specificato'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Codice FARMAP</Label>
                    <p className="text-gray-900">{product.supplier_product_code || 'Non specificato'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Codice a barre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="packaging_type">Tipo Cartone</Label>
                    <Input
                      id="packaging_type"
                      value={formData.packaging_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, packaging_type: e.target.value }))}
                      placeholder="Tipo di imballaggio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regulation">Normativa</Label>
                    <Input
                      id="regulation"
                      value={formData.regulation}
                      onChange={(e) => setFormData(prev => ({ ...prev, regulation: e.target.value }))}
                      placeholder="Normativa di riferimento"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Barcode</Label>
                    <p className="text-gray-900">{product.barcode || 'Non specificato'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo Cartone</Label>
                    <p className="text-gray-900">{product.packaging_type || 'Non specificato'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Normativa</Label>
                    <p className="text-gray-900">{product.regulation || 'Non specificata'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Customer Info */}
            {product.customers && (
              <div className="md:col-span-2 lg:col-span-1 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Cliente Associato</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{product.customers.company_name}</p>
                  </div>
                  {product.customers.contact_person && (
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{product.customers.contact_person}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {editMode ? (
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="product_notes">Note Prodotto</Label>
                <textarea
                  id="product_notes"
                  value={formData.product_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_notes: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Note aggiuntive sul prodotto..."
                />
              </div>
            ) : (
              product.product_notes && (
                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-sm font-medium text-gray-600">Note Prodotto</Label>
                  <p className="text-gray-900 mt-1">{product.product_notes}</p>
                </div>
              )
            )}
          </div>

          {editMode && (
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annulla
              </Button>
              <Button onClick={handleSaveProductInfo}>
                <Save className="w-4 h-4 mr-2" />
                Salva Modifiche
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-green-600" />
              <span>Foto Prodotto</span>
            </CardTitle>
            <CardDescription>
              Carica una foto del prodotto (JPG, PNG, WebP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              title="Foto Prodotto"
              description="Immagine del prodotto per catalogo"
              accept=".jpg,.jpeg,.png,.webp"
              currentFile={product.photo_url || undefined}
              onFileUpload={(file) => handleFileUpload(file, 'photo')}
              onFileDelete={() => handleFileDelete('photo')}
              uploading={uploading.photo}
              icon={Camera}
              color="bg-green-500"
            />
          </CardContent>
        </Card>

        {/* SDS Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Scheda di Sicurezza</span>
            </CardTitle>
            <CardDescription>
              Carica la SDS del prodotto (PDF)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              title="SDS"
              description="Scheda di Sicurezza (Safety Data Sheet)"
              accept=".pdf"
              currentFile={product.sds_url || undefined}
              onFileUpload={(file) => handleFileUpload(file, 'sds')}
              onFileDelete={() => handleFileDelete('sds')}
              uploading={uploading.sds}
              icon={FileCheck}
              color="bg-blue-500"
            />
          </CardContent>
        </Card>

        {/* ST Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              <span>Scheda Tecnica</span>
            </CardTitle>
            <CardDescription>
              Carica la ST del prodotto (PDF)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              title="ST"
              description="Scheda Tecnica del prodotto"
              accept=".pdf"
              currentFile={product.st_url || undefined}
              onFileUpload={(file) => handleFileUpload(file, 'st')}
              onFileDelete={() => handleFileDelete('st')}
              uploading={uploading.st}
              icon={FileCheck}
              color="bg-purple-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Stato Completamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-sm font-medium text-gray-600">Progresso:</span>
                <span className={`text-lg font-bold ${getCompletionColor()}`}>
                  {getCompletionPercentage()}% completato
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getCompletionPercentage() === 100 ? 'bg-green-500' :
                    getCompletionPercentage() >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
            </div>
            
            {getCompletionPercentage() === 100 && (
              <div className="flex items-center space-x-2 text-green-600 ml-4">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Scheda Completa!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className={`text-center p-3 rounded-lg ${product.photo_url ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <Camera className={`w-6 h-6 mx-auto mb-2 ${product.photo_url ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${product.photo_url ? 'text-green-800' : 'text-gray-500'}`}>
                Foto {product.photo_url ? '✓' : '✗'}
              </p>
            </div>
            <div className={`text-center p-3 rounded-lg ${product.sds_url ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
              <FileCheck className={`w-6 h-6 mx-auto mb-2 ${product.sds_url ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${product.sds_url ? 'text-blue-800' : 'text-gray-500'}`}>
                SDS {product.sds_url ? '✓' : '✗'}
              </p>
            </div>
            <div className={`text-center p-3 rounded-lg ${product.st_url ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'}`}>
              <FileCheck className={`w-6 h-6 mx-auto mb-2 ${product.st_url ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${product.st_url ? 'text-purple-800' : 'text-gray-500'}`}>
                ST {product.st_url ? '✓' : '✗'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ProductDetailSheetPage;