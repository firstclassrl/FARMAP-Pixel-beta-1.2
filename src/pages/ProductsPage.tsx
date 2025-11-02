import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Loader2, 
  Search,
  Edit,
  Trash2,
  Box,
  Plus,
  Upload,
  FileSpreadsheet,
  FileText,
  Settings,
  FolderPlus,
  Trash,
  FileImage,
  AlertTriangle,
  Tag,
  X,
  Sprout,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import type { Database } from '../types/database.types';
import { exportToExcel, exportToCSV, formatDate, formatBoolean, formatCurrency, type ExportColumn } from '../lib/exportUtils';
import { parseCSV, validateRequired, transformToNumber, transformToBoolean, type ImportColumn } from '../lib/importUtils';
import { ProductFormModal } from '../components/ProductFormModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

// Database categories will be loaded dynamically

const categorySchema = z.object({
  name: z.string().min(2, 'Nome categoria richiesto')
});

type CategoryForm = z.infer<typeof categorySchema>;

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterPhoto, setFilterPhoto] = useState<'all' | 'with' | 'without'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isClearingAllCategories, setIsClearingAllCategories] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    formState: { errors: categoryErrors },
    reset: resetCategory
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema)
  });

  // Get category names from database
  const allCategories = categories.filter(cat => cat.is_active).map(cat => cat.name);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare le categorie'
      });
    }
  }, [addNotification]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i prodotti'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadCustomers();
  }, [loadCategories, loadProducts, loadCustomers]);

  const handleEdit = (product: Product) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per modificare prodotti'
      });
      return;
    }
    
    setProductToEdit(product);
    setShowProductFormModal(true);
  };

  const handleDelete = (product: Product) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per eliminare prodotti'
      });
      return;
    }
    
    setProductToDelete(product);
  };

  const confirmProductDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Prodotto eliminato',
        message: `${productToDelete.name} è stato eliminato`
      });

      await loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Impossibile eliminare il prodotto'
      });
    } finally {
      setProductToDelete(null);
    }
  };

  const handleNewProduct = () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare prodotti'
      });
      return;
    }
    
    setProductToEdit(null);
    setShowProductFormModal(true);
  };

  const handleProductFormClose = () => {
    setShowProductFormModal(false);
    setProductToEdit(null);
  };

  const handleProductSaveSuccess = () => {
    loadProducts();
  };

  const onSubmitCategory = async (data: CategoryForm) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare categorie'
      });
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === data.name.toLowerCase())) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Questa categoria esiste già'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: data.name,
          created_by: user.id
        }]);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Categoria aggiunta',
        message: `La categoria "${data.name}" è stata aggiunta`
      });
      
      resetCategory();
      setShowCategoryDialog(false);
      loadCategories(); // Reload categories
    } catch (error) {
      console.error('Error creating category:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile creare la categoria'
      });
    }
  };

  const handleDeleteCustomCategory = async (categoryName: string) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per eliminare categorie'
      });
      return;
    }
    
    // Count products using this category
    const productsWithCategory = products.filter(p => p.category === categoryName);
    const productCount = productsWithCategory.length;
    
    const confirmMessage = productCount > 0 
      ? `Sei sicuro di voler eliminare la categoria "${categoryName}"?\n\nQuesta azione rimuoverà la categoria da ${productCount} prodotto${productCount > 1 ? 'i' : ''} e non può essere annullata.`
      : `Sei sicuro di voler eliminare la categoria "${categoryName}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeletingCategory(true);
    try {
      // Update all products with this category to have null category
      if (productCount > 0) {
        const { error } = await supabase
          .from('products')
          .update({ category: null })
          .eq('category', categoryName);

        if (error) throw error;
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName);

      if (deleteError) throw deleteError;
      
      addNotification({
        type: 'success',
        title: 'Categoria eliminata',
        message: productCount > 0 
          ? `La categoria "${categoryName}" è stata eliminata e rimossa da ${productCount} prodotto${productCount > 1 ? 'i' : ''}`
          : `La categoria "${categoryName}" è stata eliminata`
      });
      
      // Reload data to reflect changes
      await loadCategories();
      await loadProducts();
      
    } catch (error: any) {
      console.error('Error deleting category:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Impossibile eliminare la categoria'
      });
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleClearAllCategories = async () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per eliminare categorie'
      });
      return;
    }
    
    const totalCategories = allCategories.length;
    const productsWithCategories = products.filter(p => p.category !== null && p.category !== undefined);
    const productCount = productsWithCategories.length;
    
    if (totalCategories === 0) {
      addNotification({
        type: 'info',
        title: 'Nessuna categoria',
        message: 'Non ci sono categorie da eliminare'
      });
      return;
    }
    
    const confirmMessage = productCount > 0 
      ? `⚠️ ATTENZIONE: Questa azione eliminerà TUTTE le ${totalCategories} categorie e rimuoverà la categorizzazione da ${productCount} prodotto${productCount > 1 ? 'i' : ''}.\n\nQuesta operazione NON PUÒ essere annullata.\n\nSei sicuro di voler continuare?`
      : `Sei sicuro di voler eliminare tutte le ${totalCategories} categorie?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsClearingAllCategories(true);
    try {
      // Update all products to have null category
      if (productCount > 0) {
        const { error } = await supabase
          .from('products')
          .update({ category: null })
          .not('category', 'is', null);

        if (error) throw error;
      }

      // Delete all categories from database
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;
      
      addNotification({
        type: 'success',
        title: 'Tutte le categorie eliminate',
        message: productCount > 0 
          ? `Tutte le ${totalCategories} categorie sono state eliminate e la categorizzazione è stata rimossa da ${productCount} prodotto${productCount > 1 ? 'i' : ''}`
          : `Tutte le ${totalCategories} categorie sono state eliminate`
      });
      
      // Reload data to reflect changes
      await loadCategories();
      await loadProducts();
      
    } catch (error: any) {
      console.error('Error clearing all categories:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Impossibile eliminare tutte le categorie'
      });
    } finally {
      setIsClearingAllCategories(false);
    }
  };

  // Filter products based on search term (prefisso codice prodotto - solo lettere) and filters
  const filteredProducts = products.filter(product => {
    // Filtra per prefisso codice prodotto (solo lettere ammesse)
    const codePrefix = searchTerm.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const matchesSearch = !codePrefix || product.code.toUpperCase().startsWith(codePrefix);
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesCustomer = filterCustomer === 'all' || product.customer_id === filterCustomer;
    const hasPhoto = Boolean(product.photo_url && String(product.photo_url).trim() !== '');
    const matchesPhoto = filterPhoto === 'all' || (filterPhoto === 'with' && hasPhoto) || (filterPhoto === 'without' && !hasPhoto);
    
    return matchesSearch && matchesCategory && matchesCustomer && matchesPhoto;
  });

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const columns: ExportColumn[] = [
        { key: 'code', label: 'Codice' },
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrizione' },
        { key: 'category', label: 'Categoria' },
        { key: 'unit', label: 'Unità' },
        { key: 'base_price', label: 'Prezzo Base', format: formatCurrency },
        { key: 'cost', label: 'Costo', format: formatCurrency },
        { key: 'weight', label: 'Peso (kg)' },
        { key: 'dimensions', label: 'Dimensioni' },
        { key: 'is_active', label: 'Attivo', format: formatBoolean },
        { key: 'brand_name', label: 'Marchio' },
        { key: 'client_product_code', label: 'Codice Cliente' },
        { key: 'supplier_product_code', label: 'Codice Fornitore' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'packaging_type', label: 'Tipo Cartone' },
        { key: 'regulation', label: 'Normativa' },
        { key: 'product_notes', label: 'Note Prodotto' },
        { key: 'created_at', label: 'Data Creazione', format: formatDate },
        { key: 'photo_url', label: 'URL Foto' }
      ];

      const success = exportToExcel(filteredProducts, columns, `prodotti_${new Date().toISOString().split('T')[0]}`);
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Export completato',
          message: 'I prodotti sono stati esportati in Excel con successo'
        });
      } else {
        throw new Error('Export fallito');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Errore export',
        message: 'Si è verificato un errore durante l\'export'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const columns: ExportColumn[] = [
        { key: 'code', label: 'Codice' },
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrizione' },
        { key: 'category', label: 'Categoria' },
        { key: 'unit', label: 'Unità' },
        { key: 'base_price', label: 'Prezzo Base' },
        { key: 'cost', label: 'Costo' },
        { key: 'weight', label: 'Peso (kg)' },
        { key: 'dimensions', label: 'Dimensioni' },
        { key: 'is_active', label: 'Attivo', format: formatBoolean },
        { key: 'brand_name', label: 'Marchio' },
        { key: 'client_product_code', label: 'Codice Cliente' },
        { key: 'supplier_product_code', label: 'Codice Fornitore' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'packaging_type', label: 'Tipo Cartone' },
        { key: 'regulation', label: 'Normativa' },
        { key: 'product_notes', label: 'Note Prodotto' },
        { key: 'created_at', label: 'Data Creazione', format: formatDate },
        { key: 'photo_url', label: 'URL Foto' }
      ];

      const success = exportToCSV(filteredProducts, columns, `prodotti_${new Date().toISOString().split('T')[0]}`);
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Export completato',
          message: 'I prodotti sono stati esportati in CSV con successo'
        });
      } else {
        throw new Error('Export fallito');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Errore export',
        message: 'Si è verificato un errore durante l\'export'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    await loadProducts();
    addNotification({
      type: 'success',
      title: 'Prodotti aggiornati'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento prodotti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prodotti</h1>
          <p className="text-gray-600 mt-1">
            Gestisci il catalogo prodotti e il magazzino
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Azioni
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleExportExcel}
                disabled={isExporting || filteredProducts.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Esporta Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportCSV}
                disabled={isExporting || filteredProducts.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Esporta CSV
              </DropdownMenuItem>
              {/* Public access - category management always available */}
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowCategoryDialog(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Gestisci Categorie
                </DropdownMenuItem>
              </>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Public access - new product always available */}
          <Button 
            variant="outline" 
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Aggiorna
          </Button>
          <Button onClick={handleNewProduct} disabled={!user?.id}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Prodotto
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Prefisso codice prodotto (solo lettere)..."
                  value={searchTerm}
                  onChange={(e) => {
                    // Accetta solo lettere (rimuove automaticamente numeri e caratteri speciali)
                    const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '');
                    setSearchTerm(lettersOnly);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterPhoto} onValueChange={(value: any) => setFilterPhoto(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Foto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le foto</SelectItem>
                  <SelectItem value="with">Con foto</SelectItem>
                  <SelectItem value="without">Senza foto</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i clienti</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Prodotti ({filteredProducts.length})</span>
          </CardTitle>
          <CardDescription>
            Catalogo completo dei prodotti con informazioni su stock e prezzi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nessun prodotto trovato per la ricerca' : 'Nessun prodotto nel catalogo'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleNewProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi il primo prodotto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:shadow-emerald-500/20 hover:ring-2 hover:ring-emerald-400/30 hover:ring-opacity-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description || 'Nessuna descrizione disponibile'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Codice:</span>
                        <span className="font-mono text-sm">{product.code}</span>
                      </div>
                      {product.category && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Categoria:</span>
                          <span className="text-sm">{product.category}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prezzo:</span>
                        <span className="font-semibold">€{product.base_price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      {product.photo_url ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 liquid-glass-badge">
                          <FileImage className="w-3 h-3 inline mr-1" />
                          Con foto
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <FileImage className="w-3 h-3 inline mr-1" />
                          Senza foto
                        </span>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          title="Modifica prodotto"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                          title="Elimina prodotto"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Link to="/garden">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                          >
                            <Sprout className="w-4 h-4 mr-1" />
                            Garden
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showProductFormModal}
        onClose={handleProductFormClose}
        editingProduct={productToEdit}
        onSaveSuccess={handleProductSaveSuccess}
        categories={allCategories}
      />

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FolderPlus className="w-5 h-5" />
              <span>Gestione Categorie</span>
            </DialogTitle>
            <DialogDescription>
              Gestisci le categorie per organizzare i tuoi prodotti
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Lista Categorie Esistenti */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Categorie Disponibili</h4>
              
              {/* Clear All Categories Button */}
              {allCategories.length > 0 && (
                <div className="mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllCategories}
                    disabled={isClearingAllCategories || isDeletingCategory}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    {isClearingAllCategories ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Eliminazione in corso...
                      </>
                    ) : (
                      <>
                        <Trash className="w-4 h-4 mr-2" />
                        Elimina Tutte le Categorie ({allCategories.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {allCategories.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FolderPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">Nessuna categoria disponibile</p>
                    <p className="text-xs mt-1">Inizia aggiungendo la tua prima categoria personalizzata</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {allCategories.map((category, index) => {
                      const productsUsingCategory = products.filter(p => p.category === category).length;
                      
                      return (
                        <React.Fragment key={index}>
                          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Tag className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{category}</p>
                                <p className="text-xs text-gray-500">
                                  Categoria salvata nel database
                                  {productsUsingCategory > 0 && (
                                    <span className="ml-2">• {productsUsingCategory} prodotto{productsUsingCategory > 1 ? 'i' : ''}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Database
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCustomCategory(category)}
                                disabled={isDeletingCategory || isClearingAllCategories}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={`Elimina categoria "${category}"${productsUsingCategory > 0 ? ` (usata da ${productsUsingCategory} prodotto${productsUsingCategory > 1 ? 'i' : ''})` : ''}`}
                              >
                                {isDeletingCategory ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Form Aggiungi Categoria */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Aggiungi Nuova Categoria</h4>
              <form onSubmit={handleSubmitCategory(onSubmitCategory)} className="space-y-4">
                <div>
                  <Label htmlFor="category_name">Nome Categoria</Label>
                  <Input
                    id="category_name"
                    placeholder="es. Prodotti Biologici"
                    {...registerCategory('name')}
                    className={categoryErrors.name ? 'border-red-500' : ''}
                  />
                  {categoryErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{categoryErrors.name.message}</p>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Chiudi
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isDeletingCategory || isClearingAllCategories}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Categoria
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Deletion Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Conferma Eliminazione</span>
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il prodotto "{productToDelete?.name}"?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmProductDelete}>
              Sì, elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
export default ProductsPage;