import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, Plus, Loader2, Search, Edit, Trash2, Package, Calendar, 
  Building, AlertTriangle, CheckCircle, Clock, Truck, AlertCircle as AlertIcon, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '../components/ui/dialog';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../types/database.types';
import { formatDate, formatCurrency } from '../lib/exportUtils';
import OrderFormModal from '../components/OrderFormModal';
import { CreateOrderFromPriceListModal } from '../components/CreateOrderFromPriceListModal';

// Definizione dei tipi di dati
type Order = Database['public']['Tables']['orders']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
interface OrderWithDetails extends Order {
  customers: Customer | null;
  order_items: { product_id: string }[];
}

// Mappature per lo stato degli ordini
const statusLabels: { [key: string]: string } = {
  pending: 'In attesa', confirmed: 'Confermato', processing: 'In lavorazione',
  shipped: 'Spedito', delivered: 'Consegnato', cancelled: 'Annullato'
};
const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800', shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800'
};
const statusIcons: { [key: string]: React.ElementType } = {
  pending: Clock, confirmed: CheckCircle, processing: Package,
  shipped: Truck, delivered: CheckCircle, cancelled: AlertIcon
};

// --- Inizio del Componente ---

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState<OrderWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const { addNotification } = useNotifications();
  const { user } = useAuth();

  // Funzione per caricare gli ordini dal database
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(company_name), order_items(product_id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore caricamento ordini:', error);
      addNotification({ type: 'error', title: 'Errore', message: 'Impossibile caricare gli ordini.' });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [addNotification]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Funzione per ANNULLARE un ordine (soft delete)
  const confirmOrderCancel = async () => {
    if (!orderToCancel) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderToCancel.id);

    if (error) {
      console.error('Errore annullamento ordine:', error);
      addNotification({ type: 'error', title: 'Operazione non riuscita', message: 'Impossibile annullare l\'ordine.' });
    } else {
      addNotification({ type: 'success', title: 'Ordine Annullato', message: `L'ordine ${orderToCancel.order_number} è stato annullato.` });
      fetchOrders();
    }
    
    setOrderToCancel(null);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderModal(true);
  };
  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrderId(null);
  };

  const handleCreateOrderFromPriceList = () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare ordini'
      });
      return;
    }
    setShowCreateOrderModal(true);
  };

  const handleCloseCreateOrderModal = () => {
    setShowCreateOrderModal(false);
  };

  const handleOrderCreated = () => {
    fetchOrders(); // Refresh the orders list
  };

  // Filtra gli ordini
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = order.order_number?.toLowerCase().includes(searchLower) ||
      order.customers?.company_name.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordini</h1>
          <p className="text-gray-600 mt-1">Gestisci e visualizza tutti gli ordini</p>
        </div>
        <div>
          <Button onClick={handleCreateOrderFromPriceList}>
            <Plus className="w-4 h-4 mr-2" /> Nuovo Ordine
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex gap-4">
          <Input placeholder="Cerca per numero o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {Object.entries(statusLabels).map(([status, label]) => (
                <SelectItem key={status} value={status}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status] || AlertIcon;
          return (
            <Card key={order.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[order.status]}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Building className="w-4 h-4" /> {order.customers?.company_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500 text-right">
                    <p>Data: {formatDate(order.order_date)}</p>
                    <p>Totale: {formatCurrency(order.total_amount)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order.id)}><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setOrderToCancel(order)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Conferma Annullamento</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler annullare l'ordine "{orderToCancel?.order_number}"? L'ordine non verrà eliminato, ma il suo stato diventerà "Annullato".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Indietro</Button></DialogClose>
            <Button variant="destructive" onClick={confirmOrderCancel}>Sì, annulla ordine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <OrderFormModal isOpen={showOrderModal} onClose={handleCloseOrderModal} orderId={selectedOrderId} />
      
      <CreateOrderFromPriceListModal 
        isOpen={showCreateOrderModal} 
        onClose={handleCloseCreateOrderModal} 
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}
export default OrdersPage