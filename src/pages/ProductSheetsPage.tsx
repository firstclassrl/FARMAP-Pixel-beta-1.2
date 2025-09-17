import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileImage, 
  Search, 
  Filter, 
  Eye, 
  Upload, 
  Download,
  Package,
  Building,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  FileSpreadsheet,
  FileText,
  Loader2,
  Camera,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface ProductWithCustomer extends Product {
  customers?: Customer;
}

export const ProductSheetsPage = () => {
  const [products, setProducts] = useState<ProductWithCustomer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterCompletion, setFilterCompletion] = useState<'all' | 'complete' | 'incomplete' | 'missing-photos' | 'missing-docs'>('all');

  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load products separately
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Load customers separately
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('company_name');

      if (customersError) throw customersError;

      // Manually join products with customers
      const productsWithCustomers = (productsData || []).map(product => ({
        ...product,
        customers: product.customer_id 
          ? customersData?.find(customer => customer.id === product.customer_id)
          : undefined
      }));

      setProducts(productsWithCustomers);
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i dati delle schede prodotto'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCompletionStatus = (product: Product) => {
    const hasPhoto = !!product.photo_url;
    const hasSDS = !!product.sds_url;
    const hasST = !!product.st_url;
    
    if (hasPhoto && hasSDS && hasST) return 'complete';
    if (!hasPhoto && !hasSDS && !hasST) return 'empty';
    return 'partial';
  };

  // Filter products based on search term, customer, and completion status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.customers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCustomer = filterCustomer === 'all' || product.customer_id === filterCustomer;
    
    let matchesCompletion = true;
    if (filterCompletion !== 'all') {
      const status = getCompletionStatus(product);
      switch (filterCompletion) {
        case 'complete':
          matchesCompletion = status === 'complete';
          break;
        case 'incomplete':
          matchesCompletion = status === 'partial' || status === 'empty';
          break;
        case 'missing-photos':
          matchesCompletion = !product.photo_url;
          break;
        case 'missing-docs':
          matchesCompletion = !product.sds_url || !product.st_url;
          break;
      }
    }
    
    return matchesSearch && matchesCustomer && matchesCompletion;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento schede prodotto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schede Prodotto</h1>
          <p className="text-gray-600 mt-1">
            Gestisci foto, documenti SDS e ST per tutti i prodotti
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca per nome, codice, marchio o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i clienti</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCompletion} onValueChange={(value: any) => setFilterCompletion(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le schede</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="missing-photos">Senza foto</SelectItem>
                  <SelectItem value="missing-docs">Senza documenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna scheda trovata</h3>
              <p className="text-gray-600">
                {searchTerm || filterCustomer !== 'all' || filterCompletion !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Non ci sono prodotti da gestire'
                }
              </p>
            </Card>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="product-card-enhanced hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{product.code}</p>
                    {product.brand_name && (
                      <p className="text-xs text-blue-600 mt-1">{product.brand_name}</p>
                    )}
                  </div>
                </div>

                {product.customers && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                    <Building className="w-3 h-3" />
                    <span>{product.customers.company_name}</span>
                  </div>
                )}

                {/* File Status Indicators */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className={`text-center p-2 rounded-lg border ${product.photo_url ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <Camera className={`w-4 h-4 mx-auto mb-1 ${product.photo_url ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className={`text-xs font-medium ${product.photo_url ? 'text-green-800' : 'text-gray-500'}`}>
                      Foto
                    </p>
                  </div>
                  <div className={`text-center p-2 rounded-lg border ${product.sds_url ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <FileCheck className={`w-4 h-4 mx-auto mb-1 ${product.sds_url ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`text-xs font-medium ${product.sds_url ? 'text-blue-800' : 'text-gray-500'}`}>
                      SDS
                    </p>
                  </div>
                  <div className={`text-center p-2 rounded-lg border ${product.st_url ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <FileCheck className={`w-4 h-4 mx-auto mb-1 ${product.st_url ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`text-xs font-medium ${product.st_url ? 'text-purple-800' : 'text-gray-500'}`}>
                      ST
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Link to={`/products/${product.id}/schede-prodotto`}>
                  <Button variant="glass" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Gestisci Scheda
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default ProductSheetsPage;