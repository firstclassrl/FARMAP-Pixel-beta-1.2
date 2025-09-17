import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, FileText, CheckCircle, AlertCircle, Loader2, X, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

interface ExportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  items: Array<{
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit: string;
  }>;
}

const ExportOrdersModal: React.FC<ExportOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [customers, setCustomers] = useState<Array<{id: string, company_name: string}>>([]);
  const [exportResults, setExportResults] = useState<{
    success: boolean;
    count: number;
    error?: string;
  }>({ success: false, count: 0 });
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      // Imposta date di default (ultimo mese)
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      setDateFrom(lastMonth.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('is_active', true)
        .order('company_name');

      setCustomers(customersData || []);
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error);
    }
  };

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      addNotification('Seleziona le date di inizio e fine', 'error');
      return;
    }

    setIsExporting(true);
    setExportResults({ success: false, count: 0 });

    try {
      // Costruisci query per gli ordini
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          status,
          total_amount,
          created_at,
          updated_at,
          notes,
          customers!inner(company_name),
          order_items(
            quantity,
            unit_price,
            products!inner(code, name, unit)
          )
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`);

      // Applica filtri
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (customerFilter !== 'all') {
        query = query.eq('customer_id', customerFilter);
      }

      const { data: ordersData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!ordersData || ordersData.length === 0) {
        setExportResults({ success: true, count: 0 });
        addNotification('Nessun ordine trovato con i filtri selezionati', 'info');
        return;
      }

      // Prepara dati per CSV
      const csvData = prepareCSVData(ordersData);
      
      // Genera e scarica CSV
      downloadCSV(csvData, `ordini_${dateFrom}_${dateTo}.csv`);
      
      setExportResults({ success: true, count: ordersData.length });
      addNotification(`${ordersData.length} ordini esportati con successo`, 'success');

    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      setExportResults({ 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      });
      addNotification('Errore durante l\'esportazione', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const prepareCSVData = (orders: any[]): string[][] => {
    const headers = [
      'ID Ordine',
      'Numero Ordine',
      'Cliente',
      'Stato',
      'Data Creazione',
      'Data Aggiornamento',
      'Totale',
      'Note',
      'Codice Prodotto',
      'Nome Prodotto',
      'Quantità',
      'Prezzo Unitario',
      'Totale Riga',
      'Unità'
    ];

    const rows: string[][] = [headers];

    orders.forEach(order => {
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          rows.push([
            order.id,
            order.order_number || '',
            order.customers?.company_name || '',
            order.status,
            new Date(order.created_at).toLocaleDateString('it-IT'),
            new Date(order.updated_at).toLocaleDateString('it-IT'),
            order.total_amount?.toString() || '0',
            order.notes || '',
            item.products?.code || '',
            item.products?.name || '',
            item.quantity?.toString() || '0',
            item.unit_price?.toString() || '0',
            (item.quantity * item.unit_price)?.toString() || '0',
            item.products?.unit || ''
          ]);
        });
      } else {
        // Ordine senza items
        rows.push([
          order.id,
          order.order_number || '',
          order.customers?.company_name || '',
          order.status,
          new Date(order.created_at).toLocaleDateString('it-IT'),
          new Date(order.updated_at).toLocaleDateString('it-IT'),
          order.total_amount?.toString() || '0',
          order.notes || '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      }
    });

    return rows;
  };

  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setExportResults({ success: false, count: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-6 h-6 text-blue-600" />
            <span>Esporta Ordini in CSV</span>
          </DialogTitle>
          <DialogDescription>
            Seleziona i filtri per esportare gli ordini in formato CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Periodo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Data Inizio</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Data Fine</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Filtri
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="statusFilter">Stato Ordine</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="pending">In Attesa</SelectItem>
                    <SelectItem value="confirmed">Confermato</SelectItem>
                    <SelectItem value="processing">In Elaborazione</SelectItem>
                    <SelectItem value="shipped">Spedito</SelectItem>
                    <SelectItem value="delivered">Consegnato</SelectItem>
                    <SelectItem value="cancelled">Annullato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customerFilter">Cliente</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente" />
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
              </div>
            </div>
          </div>

          {/* Export Results */}
          {exportResults.success && exportResults.count > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{exportResults.count} ordini esportati con successo</span>
              </div>
            </div>
          )}

          {exportResults.success && exportResults.count === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>Nessun ordine trovato con i filtri selezionati</span>
              </div>
            </div>
          )}

          {!exportResults.success && exportResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Errore: {exportResults.error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            <X className="w-4 h-4 mr-2" />
            Chiudi
          </Button>
          <Button
            onClick={handleExport}
            disabled={!dateFrom || !dateTo || isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Esporta CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOrdersModal;

