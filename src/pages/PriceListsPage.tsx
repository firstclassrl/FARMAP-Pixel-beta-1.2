import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Loader2, 
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  TrendingUp,
  Users,
  Package,
  Percent,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { PriceListDetailPage } from './PriceListDetailPage';
import { PriceListPrintView } from './PriceListPrintView';
import type { Database } from '../types/database.types';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface PriceListWithDetails extends PriceList {
  customer?: Customer;
  product_count: number;
  status: 'active' | 'draft' | 'expired';
}

interface KPIData {
  total: number;
  active: number;
  drafts: number;
  averageDiscount: number;
}

export const PriceListsPage = () => {
  const [priceLists, setPriceLists] = useState<PriceListWithDetails[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    total: 0,
    active: 0,
    drafts: 0,
    averageDiscount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string | undefined>();
  const [showPrintView, setShowPrintView] = useState(false);
  const [printPriceListId, setPrintPriceListId] = useState<string>('');
  const [priceListToArchive, setPriceListToArchive] = useState<PriceListWithDetails | null>(null); // MODIFICA 1: Rinominato da priceListToDelete

  const { addNotification } = useNotifications();

  const loadPriceLists = useCallback(async () => {
    try {
      setLoading(true);
      
      // MODIFICA 2: Aggiunto filtro per caricare solo listini con is_active = true
      const { data: priceListsData, error: priceListsError } = await supabase
        .from('price_lists')
        .select(`
          *,
          price_list_items(count)
        `)
        .eq('is_active', true) 
        .order('created_at', { ascending: false });

      if (priceListsError) throw priceListsError;

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, price_list_id')
        .not('price_list_id', 'is', null);

      if (customersError) throw customersError;

      const processedPriceLists: PriceListWithDetails[] = (priceListsData || []).map(priceList => {
        const customer = customersData?.find(c => c.price_list_id === priceList.id);
        const productCount = (priceList.price_list_items as any)[0]?.count || 0;
        const now = new Date();
        const validFrom = new Date(priceList.valid_from);
        const validUntil = priceList.valid_until ? new Date(priceList.valid_until) : null;
        let status: 'active' | 'draft' | 'expired' = 'draft';
        if (validFrom <= now && (!validUntil || validUntil >= now)) {
          status = 'active';
        } else if (validUntil && validUntil < now) {
          status = 'expired';
        }

        return {
          ...priceList,
          customer: customer ? { 
            id: customer.id, 
            company_name: customer.company_name 
          } as Customer : undefined,
          product_count: productCount,
          status
        };
      });

      setPriceLists(processedPriceLists);

      const total = processedPriceLists.length;
      const active = processedPriceLists.filter(pl => pl.status === 'active').length;
      const drafts = processedPriceLists.filter(pl => pl.status === 'draft').length;
      
      const { data: itemsData } = await supabase
        .from('price_list_items')
        .select('discount_percentage');
      
      let totalDiscount = 0;
      let itemCount = 0;
      
      if (itemsData) {
        itemsData.forEach(item => {
          totalDiscount += item.discount_percentage;
          itemCount++;
        });
      }
      
      const averageDiscount = itemCount > 0 ? Math.round(totalDiscount / itemCount) : 0;

      setKpiData({
        total,
        active,
        drafts,
        averageDiscount
      });

    } catch (error) {
      console.error('Error loading price lists:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i listini'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadPriceLists();
  }, [loadPriceLists]);

  const handleNewPriceList = () => {
    setSelectedPriceListId(undefined);
    setShowDetailModal(true);
  };

  const handleEditPriceList = (priceListId: string) => {
    setSelectedPriceListId(priceListId);
    setShowDetailModal(true);
  };

  const handleViewPriceList = (priceListId: string) => {
    setPrintPriceListId(priceListId);
    setShowPrintView(true);
  };

  // MODIFICA 3: La funzione ora si chiama handleArchive... e imposta il listino da archiviare
  const handleArchivePriceList = (priceList: PriceListWithDetails) => {
    setPriceListToArchive(priceList);
  };

  // MODIFICA 4: Logica di archiviazione che fa UPDATE invece di DELETE
  const confirmPriceListArchive = async () => {
    if (!priceListToArchive) return;

    try {
      const { error } = await supabase
        .from('price_lists')
        .update({ is_active: false })
        .eq('id', priceListToArchive.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Listino Archiviato',
        message: `${priceListToArchive.name} è stato archiviato`
      });

      await loadPriceLists();
    } catch (error: any) {
      console.error('Error archiving price list:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Impossibile archiviare il listino'
      });
    } finally {
      setPriceListToArchive(null);
    }
  };

  const handleModalClose = () => {
    setShowDetailModal(false);
    setSelectedPriceListId(undefined);
  };

  const handleModalSaveSuccess = () => {
    loadPriceLists();
  };

  const handleClosePrintView = () => {
    setShowPrintView(false);
    setPrintPriceListId('');
  };

  const filteredPriceLists = priceLists.filter(priceList => {
    const matchesSearch = priceList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      priceList.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      priceList.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: 'active' | 'draft' | 'expired') => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'Attivo',
      draft: 'Bozza',
      expired: 'Scaduto'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento listini...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listini Cliente</h1>
          <p className="text-gray-600 mt-1">
            Gestisci i listini personalizzati per i tuoi clienti
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleNewPriceList}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Listino
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Listini Totali
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Listini Attivi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bozze
            </CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sconto Medio
            </CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.averageDiscount}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cerca listini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Price Lists List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Listini Cliente ({filteredPriceLists.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPriceLists.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nessun listino trovato per la ricerca' : 'Nessun listino creato'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleNewPriceList}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crea il primo listino
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPriceLists.map((priceList) => (
                <div
                  key={priceList.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    <div><p className="font-medium text-gray-900">{priceList.name}</p></div>
                    <div><p className="text-sm text-gray-600">{priceList.customer?.company_name || '-'}</p></div>
                    <div><p className="text-sm text-gray-600">{new Date(priceList.valid_from).toLocaleDateString('it-IT')}</p></div>
                    <div><p className="text-sm text-gray-600">{priceList.product_count} prodotti</p></div>
                    <div><p className="text-sm text-gray-600">{kpiData.averageDiscount}%</p></div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(priceList.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPriceList(priceList.id)}><Eye className="w-4 h-4 mr-2" /> Visualizza</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPriceList(priceList.id)}><Edit className="w-4 h-4 mr-2" /> Modifica</DropdownMenuItem>
                          {/* MODIFICA: L'azione ora è ARCHIVIA */}
                          <DropdownMenuItem onClick={() => handleArchivePriceList(priceList)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Archivia
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price List Detail Modal */}
      <PriceListDetailPage
        isOpen={showDetailModal}
        onClose={handleModalClose}
        priceListId={selectedPriceListId}
        onSaveSuccess={handleModalSaveSuccess}
      />

      {/* Price List Print View */}
      <PriceListPrintView
        isOpen={showPrintView}
        onClose={handleClosePrintView}
        priceListId={printPriceListId}
      />

      {/* MODIFICA: Dialogo di conferma ARCHIVIAZIONE */}
      <Dialog open={!!priceListToArchive} onOpenChange={() => setPriceListToArchive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>Conferma Archiviazione</span>
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler archiviare il listino "{priceListToArchive?.name}"? Non sarà più utilizzabile per nuovi ordini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceListToArchive(null)}>Annulla</Button>
            <Button variant="destructive" onClick={confirmPriceListArchive}>Sì, archivia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default PriceListsPage;