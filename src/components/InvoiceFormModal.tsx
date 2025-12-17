import React, { useMemo, useState } from 'react';
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
import { createInvoice, calculateInvoiceTotals } from '../lib/invoiceUtils';
import InvoiceProductSelectionModal from './InvoiceProductSelectionModal';
import type { Json } from '../types/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface InvoiceLine {
  id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  vat_rate: number;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { addNotification } = useNotifications();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [productModalLineId, setProductModalLineId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      id: 'line-1',
      product_id: null,
      product_code: '',
      product_name: '',
      description: '',
      quantity: 1,
      unit: 'pz',
      unit_price: 0,
      discount_percentage: 0,
      vat_rate: 22,
    },
  ]);
  const [status, setStatus] = useState<'draft' | 'issued'>('issued');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setSelectedCustomer(null);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setLines([
      {
        id: 'line-1',
        product_id: null,
        product_code: '',
        product_name: '',
        description: '',
        quantity: 1,
        unit: 'pz',
        unit_price: 0,
        discount_percentage: 0,
        vat_rate: 22,
      },
    ]);
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

    const validLines = lines.filter(
      (l) => l.description.trim() && l.quantity > 0 && l.unit_price >= 0
    );

    if (validLines.length === 0) {
      addNotification({
        type: 'error',
        title: 'Righe mancanti',
        message: 'Aggiungi almeno una riga valida alla fattura.',
      });
      return;
    }

    setSaving(true);
    try {
      const items = validLines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unit_price,
        discount_percentage: l.discount_percentage,
        vat_rate: l.vat_rate,
      }));

      await createInvoice({
        customer_id: selectedCustomer.id,
        order_id: null,
        invoice_date: invoiceDate,
        payment_terms: selectedCustomer.payment_terms,
        notes: null,
        status,
        items,
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

  const handleAddLine = () => {
    const newId = `line-${Date.now()}`;
    setLines((prev) => [
      ...prev,
      {
        id: newId,
        product_id: null,
        product_code: '',
        product_name: '',
        description: '',
        quantity: 1,
        unit: 'pz',
        unit_price: 0,
        discount_percentage: 0,
        vat_rate: 22,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const handleLineChange = (id: string, patch: Partial<InvoiceLine>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const handleProductSelected = (product: Database['public']['Tables']['products']['Row']) => {
    if (!productModalLineId) return;
    handleLineChange(productModalLineId, {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      description:
        product.name +
        (product.description ? ` - ${product.description}` : ''),
      unit: product.unit || 'pz',
      unit_price: product.base_price || 0,
      vat_rate: product.iva ?? 22,
    });
  };

  const totals = useMemo(() => {
    const items = lines.map((l) => ({
      product_id: l.product_id,
      description: l.description || '',
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      discount_percentage: l.discount_percentage,
      vat_rate: l.vat_rate,
    }));
    return calculateInvoiceTotals(items);
  }, [lines]);

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

            {/* Righe fattura */}
            <div className="space-y-3 border rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Righe fattura</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddLine}>
                  Aggiungi riga
                </Button>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {lines.map((line, index) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-2 items-end border rounded-md p-2 bg-gray-50"
                  >
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Prodotto</Label>
                      <div className="flex gap-1">
                        <Input
                          readOnly
                          value={
                            line.product_code
                              ? `${line.product_code} - ${line.product_name}`
                              : ''
                          }
                          placeholder="Nessun prodotto"
                          className="h-8 text-xs bg-white"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => setProductModalLineId(line.id)}
                        >
                          Sel.
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Descrizione</Label>
                      <Input
                        className="h-8 text-xs bg-white"
                        value={line.description}
                        onChange={(e) =>
                          handleLineChange(line.id, { description: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">Q.tà</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-xs bg-white"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(line.id, {
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">Unità</Label>
                      <Input
                        className="h-8 text-xs bg-white"
                        value={line.unit}
                        onChange={(e) =>
                          handleLineChange(line.id, { unit: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Prezzo</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-xs bg-white"
                        value={line.unit_price}
                        onChange={(e) =>
                          handleLineChange(line.id, {
                            unit_price: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">IVA %</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className="h-8 text-xs bg-white"
                        value={line.vat_rate}
                        onChange={(e) =>
                          handleLineChange(line.id, {
                            vat_rate: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={lines.length <= 1}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totali rapidi */}
              <div className="pt-2 border-t text-xs text-gray-700 flex justify-end gap-4">
                <div>Imponibile: € {totals.taxable_amount.toFixed(2)}</div>
                <div>IVA: € {totals.tax_amount.toFixed(2)}</div>
                <div className="font-semibold">
                  Totale: € {totals.total_amount.toFixed(2)}
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
      <InvoiceProductSelectionModal
        isOpen={Boolean(productModalLineId)}
        onClose={() => setProductModalLineId(null)}
        onProductSelect={handleProductSelected}
        selectedProductId={
          productModalLineId
            ? lines.find((l) => l.id === productModalLineId)?.product_id
            : undefined
        }
      />
    </>
  );
};

export default InvoiceFormModal;


