import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Check,
  Loader2,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';
import type { Database } from '../types/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomerId?: string;
  title?: string;
  description?: string;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onCustomerSelect,
  selectedCustomerId,
  title = "Seleziona Cliente",
  description = "Scegli il cliente per questo listino"
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  
  const { addNotification } = useNotifications();

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    } else {
      // Reset filters when modal closes
      setSearchTerm('');
      setFilterCity('');
      setFilterProvince('');
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i clienti'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique cities and provinces for filters
  const uniqueCities = [...new Set(customers.map(c => c.city).filter(Boolean))].sort();
  const uniqueProvinces = [...new Set(customers.map(c => c.province).filter(Boolean))].sort();

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.vat_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !filterCity || customer.city === filterCity;
    const matchesProvince = !filterProvince || customer.province === filterProvince;
    
    return matchesSearch && matchesCity && matchesProvince;
  });

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCity('');
    setFilterProvince('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Search and Filters */}
          <div className="space-y-4 p-1">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome azienda, contatto, email o P.IVA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Tutte le città</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Tutte le province</option>
                  {uniqueProvinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="w-4 h-4 mr-2" />
                Pulisci Filtri
              </Button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {loading ? (
                <span>Caricamento clienti...</span>
              ) : (
                <span>
                  {filteredCustomers.length} di {customers.length} clienti
                  {(searchTerm || filterCity || filterProvince) && ' (filtrati)'}
                </span>
              )}
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-600">Caricamento clienti...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {customers.length === 0 ? 'Nessun cliente disponibile' : 'Nessun cliente trovato'}
                </h3>
                <p className="text-gray-600">
                  {customers.length === 0 
                    ? 'Crea prima alcuni clienti per poterli assegnare ai listini'
                    : 'Prova a modificare i criteri di ricerca'
                  }
                </p>
                {(searchTerm || filterCity || filterProvince) && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Pulisci filtri
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {filteredCustomers.map((customer) => (
                  <Card 
                    key={customer.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300 ${
                      selectedCustomerId === customer.id 
                        ? 'border-primary-500 bg-primary-50 shadow-md' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {customer.company_name}
                            </h3>
                            {selectedCustomerId === customer.id && (
                              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            {customer.contact_person && (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{customer.contact_person}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {(customer.city || customer.province) && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>
                                  {[customer.city, customer.province].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {customer.vat_number && (
                            <div className="mt-2 text-xs text-gray-500">
                              P.IVA: {customer.vat_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            {selectedCustomerId && (
              <Button 
                onClick={() => {
                  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
                  if (selectedCustomer) {
                    handleCustomerSelect(selectedCustomer);
                  }
                }}
              >
                Conferma Selezione
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};