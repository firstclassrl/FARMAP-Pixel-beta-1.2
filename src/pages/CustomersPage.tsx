import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, RefreshCw, AlertTriangle, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Customer } from '../types/database.types';

// Stato iniziale pulito per il modulo
const initialFormData = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  province: '',
  country: 'Italia',
  vat_number: '',
  tax_code: '',
  payment_terms: '30 giorni',
  discount_percentage: 0,
  notes: '',
  code_prefix: '',
  codice_cliente: ''
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null); // Nuovo stato per la conferma di eliminazione
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const { addNotification } = useStore();
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i clienti'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Normalize payload for DB types (e.g. payment_terms as number of days)
      const normalized: any = { ...formData };
      if (typeof normalized.payment_terms === 'string') {
        const match = normalized.payment_terms.match(/\d+/);
        normalized.payment_terms = match ? Number(match[0]) : 0;
      }

      if (editingCustomer) {
        // In aggiornamento, non inviamo created_by
        const { error } = await supabase
          .from('customers')
          .update(normalized)
          .eq('id', editingCustomer.id);
        if (error) throw error;
        addNotification({ type: 'success', title: 'Cliente aggiornato' });
      } else {
        // In creazione, aggiungiamo created_by
        const { error } = await supabase
          .from('customers')
          .insert([{ ...normalized, created_by: user.id }]);
        if (error) throw error;
        addNotification({ type: 'success', title: 'Cliente creato' });
      }

      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      addNotification({ type: 'error', title: 'Errore', message: 'Impossibile salvare il cliente' });
    }
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      company_name: customer.company_name,
      contact_person: customer.contact_person || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      province: customer.province || '',
      country: customer.country || 'Italia',
      vat_number: customer.vat_number || '',
      tax_code: customer.tax_code || '',
      payment_terms: customer.payment_terms || '30 giorni',
      discount_percentage: Number(customer.discount_percentage) || 0,
      notes: customer.notes || '',
      code_prefix: customer.code_prefix || '',
      codice_cliente: customer.codice_cliente || ''
    });
    setIsFormOpen(true);
  };
  
  const openNewForm = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      // First, check if customer has any orders
      const { data: existingOrders, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', customerToDelete.id)
        .limit(1);

      if (checkError) {
        console.error('Error checking customer dependencies:', checkError);
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Impossibile verificare le dipendenze del cliente.',
        });
        setCustomerToDelete(null);
        return;
      }

      // If customer has orders, prevent deletion
      if (existingOrders && existingOrders.length > 0) {
        addNotification({
          type: 'error',
          title: 'Operazione non consentita',
          message: 'Impossibile eliminare: questo cliente ha degli ordini collegati.',
        });
        setCustomerToDelete(null);
        return;
      }

      // If no orders found, proceed with deletion
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (deleteError) {
        console.error('Error deleting customer:', deleteError);
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Impossibile eliminare il cliente.',
        });
      } else {
        // Success case
        addNotification({
          type: 'success',
          title: 'Cliente eliminato',
          message: `${customerToDelete.company_name} è stato eliminato con successo.`,
        });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Unexpected error during customer deletion:', error);
      addNotification({
        type: 'error',
        title: 'Errore imprevisto',
        message: 'Si è verificato un errore imprevisto durante l\'eliminazione.',
      });
    }

    // Close the confirmation dialog
    setCustomerToDelete(null);
  };

  const handleRefresh = () => {
    fetchCustomers();
    addNotification({ type: 'success', title: 'Clienti aggiornati' });
  };

  const filteredCustomers = customers.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Caricamento clienti...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clienti</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" /> Aggiorna
          </Button>
          <Button onClick={openNewForm}>
            <Plus className="w-4 h-4 mr-2" /> Nuovo Cliente
          </Button>
        </div>
      </div>

      <Input placeholder="Cerca clienti..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="p-3 hover:shadow-xl hover:shadow-red-300/80 transition-all duration-200 cursor-pointer hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate" title={customer.company_name}>
                  {customer.company_name}
                </h3>
                {customer.codice_cliente && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {customer.codice_cliente}
                  </p>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditForm(customer)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCustomerToDelete(customer)} 
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              {customer.contact_person && (
                <p className="flex items-center truncate">
                  <User className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate" title={customer.contact_person}>{customer.contact_person}</span>
                </p>
              )}
              {customer.email && (
                <p className="flex items-center truncate">
                  <span className="w-3 h-3 mr-1 flex-shrink-0">@</span>
                  <span className="truncate" title={customer.email}>{customer.email}</span>
                </p>
              )}
              {customer.phone && (
                <p className="flex items-center truncate">
                  <span className="w-3 h-3 mr-1 flex-shrink-0">📞</span>
                  <span className="truncate" title={customer.phone}>{customer.phone}</span>
                </p>
              )}
              {customer.city && (
                <p className="flex items-center truncate">
                  <span className="w-3 h-3 mr-1 flex-shrink-0">📍</span>
                  <span className="truncate" title={`${customer.city}, ${customer.province || ''} ${customer.postal_code || ''}`}>
                    {customer.city}{customer.province && `, ${customer.province}`}
                  </span>
                </p>
              )}
              {customer.vat_number && (
                <p className="text-xs text-gray-500 truncate" title={`P.IVA: ${customer.vat_number}`}>
                  P.IVA: {customer.vat_number}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {/* Dialog per Nuovo/Modifica Cliente */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCustomer ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codice_cliente">Codice Cliente</Label>
                <Input
                  id="codice_cliente"
                  value={formData.codice_cliente}
                  onChange={e => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
                    setFormData({ ...formData, codice_cliente: value });
                  }}
                  placeholder="Es: CLI001"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Codice univoco del cliente (es: CLI001, CLI002)
                </p>
              </div>
              <div>
                <Label htmlFor="company_name">Ragione Sociale *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nome dell'azienda"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code_prefix">Prefisso Codice Prodotto</Label>
                <Input
                  id="code_prefix"
                  value={formData.code_prefix}
                  onChange={e => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
                    setFormData({ ...formData, code_prefix: value });
                  }}
                  placeholder="Es: PB"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due lettere per identificare i prodotti di questo cliente (es: PB0001)
                </p>
              </div>
              <div>
                <Label htmlFor="contact_person">Persona di Contatto</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Nome del referente"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@azienda.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Via, numero civico"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Città</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Nome della città"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">CAP</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  placeholder="RM"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Paese</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                placeholder="Italia"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vat_number">Partita IVA</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={e => setFormData({ ...formData, vat_number: e.target.value })}
                  placeholder="IT12345678901"
                />
              </div>
              <div>
                <Label htmlFor="tax_code">Codice Fiscale</Label>
                <Input
                  id="tax_code"
                  value={formData.tax_code}
                  onChange={e => setFormData({ ...formData, tax_code: e.target.value })}
                  placeholder="RSSMRA80A01H501X"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_terms">Termini di Pagamento</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="Es: 30 giorni, FOB, CIF, Contanti"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Termini di pagamento in formato alfanumerico
                </p>
              </div>
              <div>
                <Label htmlFor="discount_percentage">Sconto Predefinito (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Note</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Note aggiuntive sul cliente..."
              />
            </div>


            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button type="button" variant="outline">Annulla</Button></DialogClose>
              <Button type="submit">{editingCustomer ? 'Aggiorna' : 'Crea'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog di Conferma Eliminazione */}
      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Conferma Eliminazione</span>
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il cliente "{customerToDelete?.company_name}"?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>Sì, elimina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}