import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, Calendar, User, FileText, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { CustomerSelectionModal } from '../components/CustomerSelectionModal';

interface SampleRequest {
  id: string;
  customer_id: string;
  request_date: string;
  status: 'pending' | 'sent' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  customer?: {
    company_name: string;
    contact_person?: string;
  };
  sample_request_items?: SampleRequestItem[];
}

interface SampleRequestItem {
  id: string;
  sample_request_id: string;
  product_name: string;
  quantity: number;
  sent_date?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
}

interface Customer {
  id: string;
  company_name: string;
  contact_person?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const statusLabels = {
  pending: 'In Attesa',
  sent: 'Inviato',
  delivered: 'Consegnato',
  cancelled: 'Annullato'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export function SampleRequestsPage() {
  const [sampleRequests, setSampleRequests] = useState<SampleRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SampleRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<SampleRequest | null>(null);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    request_date: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
    notes: ''
  });

  const [requestItems, setRequestItems] = useState<{
    product_id: string;
    quantity: number;
    notes: string;
  }[]>([]);

  const [sampleProducts, setSampleProducts] = useState<Array<{
    product_name: string;
    quantity: number;
  }>>(Array(10).fill({ product_name: '', quantity: 1 }));

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({...formData, customer_id: customer.id});
    setIsCustomerSelectionOpen(false);
  };

  const handleProductChange = (index: number, field: 'product_name' | 'quantity', value: string | number) => {
    const newProducts = [...sampleProducts];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value
    };
    setSampleProducts(newProducts);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      request_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    });
    setSelectedCustomer(null);
    setSampleProducts(Array(10).fill({ product_name: '', quantity: 1 }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load sample requests with related data
      const { data: requestsData, error: requestsError } = await supabase
        .from('sample_requests')
        .select(`
          *,
          customer:customers(company_name, contact_person),
          sample_request_items(
            id,
            product_name,
            quantity,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_person')
        .eq('is_active', true)
        .order('company_name');

      if (customersError) throw customersError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, code, name, description')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;

      setSampleRequests(requestsData || []);
      setCustomers(customersData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i dati della campionatura'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare richieste di campioni'
      });
      return;
    }

    if (!formData.customer_id) return;

    try {
      // Create sample request
      const { data: requestData, error: requestError } = await supabase
        .from('sample_requests')
        .insert({
          customer_id: formData.customer_id,
          request_date: formData.request_date,
          status: formData.status,
          notes: formData.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create sample request items
      const itemsToInsert = sampleProducts
        .filter(item => item.product_name.trim() !== '')
        .map(item => ({
          sample_request_id: requestData.id,
          product_name: item.product_name,
          quantity: item.quantity,
          notes: ''
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('sample_request_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating sample request:', error);
    }
  };

  const handleUpdateRequest = async () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per modificare richieste di campioni'
      });
      return;
    }

    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('sample_requests')
        .update({
          customer_id: formData.customer_id,
          request_date: formData.request_date,
          status: formData.status,
          notes: formData.notes
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setSelectedRequest(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating sample request:', error);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const request = sampleRequests.find(r => r.id === id);
    if (request) {
      setRequestToDelete(request);
    }
  };

  const handlePrintRequest = (request: SampleRequest) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Richiesta Campioni - ${request.customer?.company_name || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #dc2626; }
            .title { font-size: 18px; margin: 10px 0; }
            .details { margin-bottom: 20px; }
            .detail-row { margin: 5px 0; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            .products { margin-top: 20px; }
            .product-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .product-table th, .product-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .product-table th { background-color: #f3f4f6; font-weight: bold; }
            .notes { margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FARMAP INDUSTRY S.r.l.</div>
            <div class="title">RICHIESA CAMPIONI</div>
            <div>www.farmapindustry.it</div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Cliente:</span>
              ${request.customer?.company_name || 'N/A'}
            </div>
            <div class="detail-row">
              <span class="label">Data Richiesta:</span>
              ${new Date(request.request_date).toLocaleDateString('it-IT')}
            </div>
            <div class="detail-row">
              <span class="label">Stato:</span>
              ${statusLabels[request.status]}
            </div>
            <div class="detail-row">
              <span class="label">Richiesta N°:</span>
              ${request.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          <div class="products">
            <h3>Prodotti Richiesti:</h3>
            <table class="product-table">
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Quantità</th>
                </tr>
              </thead>
              <tbody>
                ${request.sample_request_items?.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                  </tr>
                `).join('') || '<tr><td colspan="2">Nessun prodotto richiesto</td></tr>'}
              </tbody>
            </table>
          </div>

          ${request.notes ? `
            <div class="notes">
              <h3>Note:</h3>
              <p>${request.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
            <p>FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE)</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const confirmRequestDelete = async () => {
    if (!requestToDelete || !user?.id) {
      if (!user?.id) {
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Devi essere autenticato per eliminare richieste di campioni'
        });
      }
      setRequestToDelete(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('sample_requests')
        .delete()
        .eq('id', requestToDelete.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Richiesta eliminata',
        message: 'La richiesta di campioni è stata eliminata con successo'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting sample request:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: `Impossibile eliminare la richiesta: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      });
    } finally {
      setRequestToDelete(null);
    }
  };

  const openEditDialog = (request: SampleRequest) => {
    setSelectedRequest(request);
    setFormData({
      customer_id: request.customer_id,
      request_date: request.request_date,
      status: request.status,
      notes: request.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const addRequestItem = () => {
    setRequestItems([...requestItems, { product_id: '', quantity: 1, notes: '' }]);
  };

  const updateRequestItem = (index: number, field: string, value: any) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequestItems(updated);
  };

  const removeRequestItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const filteredRequests = sampleRequests.filter(request => {
    const matchesSearch = request.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento richieste campioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campionatura</h1>
          <p className="text-gray-600 mt-1">Gestisci le richieste di campioni dei clienti</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!user?.id}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta Campioni</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Cliente</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsCustomerSelectionOpen(true)}
                  >
                    {selectedCustomer ? selectedCustomer.company_name : "Seleziona cliente"}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="request_date">Data Richiesta</Label>
                  <Input
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Note</Label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Note aggiuntive..."
                />
              </div>
              
              {/* Sample Products */}
              <div>
                <Label>Prodotti Richiesti</Label>
                <div className="space-y-2 mt-2">
                  {sampleProducts.map((product, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-8">
                        <Input
                          value={product.product_name}
                          onChange={(e) => handleProductChange(index, 'product_name', e.target.value)}
                          placeholder={`Prodotto ${index + 1}`}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Quantità"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleCreateRequest}>
                  Crea Richiesta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca per cliente o note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
              <SelectItem value="sent">Inviato</SelectItem>
              <SelectItem value="delivered">Consegnato</SelectItem>
              <SelectItem value="cancelled">Annullato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Sample Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna richiesta trovata</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia creando la tua prima richiesta di campioni'
              }
            </p>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.customer?.company_name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Data: {new Date(request.request_date).toLocaleDateString('it-IT')}
                    </div>
                    {request.customer?.contact_person && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Contatto: {request.customer.contact_person}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Prodotti: {request.sample_request_items?.length || 0}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mt-3 flex items-start">
                      <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <p className="text-sm text-gray-600">{request.notes}</p>
                    </div>
                  )}

                  {request.sample_request_items && request.sample_request_items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Prodotti richiesti:</h4>
                      <div className="space-y-1">
                        {request.sample_request_items.map((item) => (
                          <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                            <span>{item.product_name}</span>
                            <span>Qtà: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintRequest(request)}
                    disabled={!user?.id}
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(request)}
                    disabled={!user?.id}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRequest(request.id)}
                    disabled={!user?.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Richiesta Campioni</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Stato</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">In Attesa</SelectItem>
                    <SelectItem value="sent">Inviato</SelectItem>
                    <SelectItem value="delivered">Consegnato</SelectItem>
                    <SelectItem value="cancelled">Annullato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="request_date">Data Richiesta</Label>
              <Input
                type="date"
                value={formData.request_date}
                onChange={(e) => setFormData({...formData, request_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="notes">Note</Label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Note aggiuntive..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleUpdateRequest}>
                Salva Modifiche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sample Request Deletion Confirmation Dialog */}
      <Dialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Conferma Eliminazione</span>
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la richiesta di campioni per "{requestToDelete?.customer?.company_name}"?
              <br />
              <span className="text-red-600 font-medium">Questa azione eliminerà anche tutti i prodotti richiesti e non può essere annullata.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestToDelete(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmRequestDelete}>
              Sì, elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerSelectionOpen}
        onClose={() => setIsCustomerSelectionOpen(false)}
        onCustomerSelect={handleCustomerSelect}
        selectedCustomerId={selectedCustomer?.id}
        title="Seleziona Cliente per Campioni"
        description="Scegli il cliente per questa richiesta di campioni"
      />
    </div>
  );
}
export default SampleRequestsPage;