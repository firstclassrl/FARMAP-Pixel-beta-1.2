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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
import BulkPriceListModal from '../components/BulkPriceListModal';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface PriceListWithDetails extends PriceList {
  customer?: Customer;
  product_count: number;
  status: 'active' | 'draft' | 'expired';
  creator_name?: string | null;
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
  const [selectedCreatorFilter, setSelectedCreatorFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string | undefined>();
  const [showPrintView, setShowPrintView] = useState(false);
  const [printPriceListId, setPrintPriceListId] = useState<string>('');
  const [priceListToArchive, setPriceListToArchive] = useState<PriceListWithDetails | null>(null); // MODIFICA 1: Rinominato da priceListToDelete
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { addNotification } = useNotifications();

  const loadPriceLists = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: priceListsData, error: priceListsError } = await supabase
        .from('price_lists')
        .select(`
          *,
          price_list_items(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (priceListsError) throw priceListsError;
      
      // Ensure we have valid data
      if (!priceListsData) {
        console.warn('No price lists data returned');
        setPriceLists([]);
        return;
      }

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, price_list_id')
        .not('price_list_id', 'is', null);

      if (customersError) throw customersError;

      // Fetch creator profiles - try to get all profiles, fallback to individual queries if RLS blocks
      const creatorIds = [...new Set(priceListsData.map((pl: any) => pl.created_by).filter(Boolean))];
      console.log('Creator IDs to fetch:', creatorIds);
      let profilesData: Array<{ id: string; full_names: string | null; email?: string | null }> = [];
      if (creatorIds.length > 0) {
        try {
          // Try to fetch all creator profiles at once
          // Note: using full_names (plural) as per database schema
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_names, email')
            .in('id', creatorIds);

          if (profilesError) {
            console.warn('Error fetching creator profiles (batch):', profilesError);
            // If batch query fails due to RLS, try fetching individually
            // This is a fallback - ideally RLS should allow reading profiles for list creators
            for (const creatorId of creatorIds) {
              try {
                const { data: singleProfile, error: singleError } = await supabase
                  .from('profiles')
                  .select('id, full_names, email')
                  .eq('id', creatorId)
                  .single();
                if (singleProfile) {
                  profilesData.push(singleProfile as { id: string; full_names: string | null; email?: string | null });
                  console.log(`Retrieved profile for ${creatorId}:`, { full_names: (singleProfile as any).full_names, email: (singleProfile as any).email });
                } else if (singleError) {
                  console.warn(`Cannot access profile ${creatorId}:`, singleError);
                }
              } catch (err) {
                // Skip profiles that can't be accessed
                console.warn(`Cannot access profile ${creatorId}:`, err);
              }
            }
          } else {
            profilesData = data || [];
            console.log('Retrieved profiles (batch):', profilesData.map(p => ({ id: p.id, full_names: p.full_names, email: p.email })));
          }
        } catch (error) {
          console.warn('Error fetching creator profiles:', error);
          profilesData = [];
        }
      }
      
      console.log('Final profilesData:', profilesData);

      const processedPriceLists: PriceListWithDetails[] = priceListsData.map((priceList: any) => {
        const customer = (customersData as any[])?.find((c: any) => c.price_list_id === priceList.id);
        const creator = profilesData.find(p => p.id === priceList.created_by);
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

        // Prefer full_names from profiles table, but use email as fallback if full_names is not available
        // Extract a more readable name from email if full_names is missing
        let creatorDisplayName: string | null = null;
        if (creator?.full_names) {
          creatorDisplayName = creator.full_names;
        } else if (creator?.email) {
          // Extract name from email: "antonio.pasetti@farmapindustry.it" -> "Antonio Pasetti"
          const emailParts = creator.email.split('@')[0];
          const nameParts = emailParts.split(/[._-]/);
          creatorDisplayName = nameParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Debug log to see what we're getting
        if (priceList.created_by) {
          if (!creator) {
            console.warn(`No profile found for creator ${priceList.created_by} (price list: ${priceList.name})`);
          } else {
            console.log(`Matched creator for ${priceList.name}:`, { 
              created_by: priceList.created_by, 
              creator_id: creator.id, 
              full_names: creator.full_names, 
              email: creator.email,
              display_name: creatorDisplayName 
            });
          }
        }

        return {
          ...priceList,
          customer: customer ? { 
            id: customer.id, 
            company_name: customer.company_name 
          } as Customer : undefined,
          product_count: productCount,
          status,
          creator_name: creatorDisplayName
        };
      });
      
      console.log('Processed price lists with creators:', processedPriceLists.map(pl => ({ 
        name: pl.name, 
        creator_name: pl.creator_name,
        created_by: pl.created_by 
      })));

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

  // Generate consistent color for each creator
  const getCreatorColor = (creatorName: string | null | undefined): string => {
    if (!creatorName) return '#9CA3AF'; // gray for null/undefined
    
    const nameLower = creatorName.toLowerCase().trim();
    
    // Special cases for specific creators with fixed colors
    // Check for exact match or if name contains the keyword
    if (nameLower === 'gigi' || nameLower.startsWith('gigi ')) {
      return '#3B82F6'; // blue
    }
    
    // Antonio gets green (distinct from blue)
    if (nameLower.includes('antonio') || 
        nameLower.includes('antonio pasetti') ||
        (nameLower.includes('@') && nameLower.includes('antonio'))) {
      return '#10B981'; // green
    }
    
    // Contabilita gets yellow - check both in name and email
    if (nameLower.includes('contabilita') || 
        nameLower.includes('contabilità') ||
        nameLower.startsWith('contabilita') ||
        (nameLower.includes('@') && nameLower.includes('contabilita'))) {
      return '#EAB308'; // yellow
    }
    
    // Generate a hash from the name for other creators
    let hash = 0;
    for (let i = 0; i < creatorName.length; i++) {
      hash = creatorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use a predefined color palette with better color separation
    const colors = [
      '#EF4444', // red
      '#10B981', // green
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#F97316', // orange
      '#6366F1', // indigo
      '#14B8A6', // teal
      '#A855F7', // purple
      '#84CC16', // lime
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get unique creators from price lists
  const uniqueCreators = Array.from(
    new Set(priceLists.map(pl => pl.creator_name).filter(Boolean) as string[])
  ).sort();

  const filteredPriceLists = priceLists.filter(priceList => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = priceList.name.toLowerCase().includes(searchLower) ||
      priceList.customer?.company_name?.toLowerCase().includes(searchLower) ||
      priceList.description?.toLowerCase().includes(searchLower);
    
    const matchesCreator = selectedCreatorFilter === 'all' || 
      priceList.creator_name === selectedCreatorFilter;
    
    return matchesSearch && matchesCreator;
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
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crea listino massivo
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

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cerca listini per nome, cliente o descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <Select value={selectedCreatorFilter} onValueChange={setSelectedCreatorFilter}>
              <SelectTrigger className="flex items-center gap-2 w-full">
                <SelectValue placeholder="Filtra per creatore" />
                {selectedCreatorFilter !== 'all' && (
                  <div
                    className="w-3 h-3 rounded-full ml-2"
                    style={{ backgroundColor: getCreatorColor(selectedCreatorFilter) }}
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i creatori</SelectItem>
                {uniqueCreators.map((creator) => (
                  <SelectItem key={creator} value={creator}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCreatorColor(creator) }}
                      />
                      <span>{creator}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

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
                    <div>
                      {priceList.creator_name ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCreatorColor(priceList.creator_name) }}
                          />
                          <p className="text-sm text-gray-600">{priceList.creator_name}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">-</p>
                      )}
                    </div>
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

      {/* Bulk Price List Modal */}
      <BulkPriceListModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onCreated={() => {
          setShowBulkModal(false);
          loadPriceLists();
        }}
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