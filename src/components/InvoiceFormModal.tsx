import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CustomerSelectionModal } from './CustomerSelectionModal';
import { useNotifications } from '../store/useStore';
import type { Database } from '../types/database.types';
import { createInvoice } from '../lib/invoiceUtils';

type Customer = Database['public']['Tables']['customers']['Row'];

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { addNotification } = useNotifications();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pz');
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatRate, setVatRate] = useState(22);
  const [status, setStatus] = useState<'draft' | 'issued'>('issued');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setSelectedCustomer(null);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setQuantity(1);
    setUnit('pz');
    setUnitPrice(0);
    setVatRate(22);
    setStatus('issued');
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      addNotification({
        type: 'error',
        title: 'Cliente mancante',
        message: 'Seleziona un cliente per la fattura.',
      });
      return;
    }

    if (!description.trim()) {
      addNotification({
        type: 'error',
        title: 'Descrizione mancante',
        message: 'Inserisci una descrizione per la riga della fattura.',
      });
      return;
    }

    if (quantity <= 0 || unitPrice < 0) {
      addNotification({
        type: 'error',
        title: 'Valori non validi',
        message: 'Quantità e prezzo devono essere maggiori di zero.',
      });
      return;
    }

    setSaving(true);
    try {
      await createInvoice({
        customer_id: selectedCustomer.id,
        order_id: null,
        invoice_date: invoiceDate,
        payment_terms: selectedCustomer.payment_terms,
        notes: null,
        status,
        items: [
          {
            product_id: null,
            description,
            quantity,
            unit,
            unit_price: unitPrice,
            discount_percentage: 0,
            vat_rate: vatRate,
          },
        ],
      });

      addNotification({
        type: 'success',
        title: 'Fattura creata',
        message: 'La fattura è stata creata correttamente.',
      });

      resetForm();
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Errore salvataggio fattura:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message:
          error?.message ||
          'Si è verificato un errore durante la creazione della fattura.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuova fattura</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Cliente */}
            <div className="space-y-1">
              <Label>Cliente</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={selectedCustomer?.company_name || 'Nessun cliente selezionato'}
                  className="bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomerModal(true)}
                >
                  Seleziona
                </Button>
              </div>
            </div>

            {/* Dati fattura */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data fattura</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Stato</Label>
                <select
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'issued')}
                >
                  <option value="draft">Bozza</option>
                  <option value="issued">Emessa</option>
                </select>
              </div>
            </div>

            {/* Riga fattura minimale */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="space-y-1">
                <Label>Descrizione riga</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrizione prodotto/servizio"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label>Quantità</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Unità</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prezzo unitario</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>IVA %</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva fattura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selezione cliente */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerSelect={(c) => setSelectedCustomer(c)}
        selectedCustomerId={selectedCustomer?.id}
        title="Seleziona cliente per la fattura"
        description="Scegli il cliente a cui intestare la fattura"
      />
    </>
  );
};

export default InvoiceFormModal;


