import React, { useState, useEffect } from 'react';
import { Building, Package, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/exportUtils';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface OrderFormTemplateProps {
  orderData: {
    orderNumber: string;
    orderDate: Date;
    deliveryDate: Date;
    customerName: string;
    customerCode: string;
    customerAddress?: string;
    customerContact?: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingAddress?: string;
    salesRepresentative: string;
    items: Array<{
      id?: string;
      productCode: string;
      productName: string;
      productDescription?: string;
      category?: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      discountPercentage?: number;
      notes?: string;
      productId?: string;
    }>;
    subtotal: number;
    discountAmount?: number;
    taxAmount?: number;
    shippingCost?: number;
    totalAmount: number;
    notes?: string;
    trackingNumber?: string;
    termsAndConditions?: string;
    salesConditions?: {
      payment?: string | null;
      shipping?: string | null;
      delivery?: string | null;
      brand?: string | null;
      printConditions?: boolean;
    } | null;
  };
  mode?: 'view' | 'edit';
  onSave?: (data: any) => Promise<void>;
}

const OrderFormTemplate: React.FC<OrderFormTemplateProps> = ({ orderData, mode = 'view', onSave }) => {
  const [editableData, setEditableData] = useState(orderData);
  const [isEditing, setIsEditing] = useState(false);
  const [deliveryInput, setDeliveryInput] = useState<string>(formatDate(orderData.deliveryDate));

  // Sync editableData with orderData when it changes (e.g., when modal opens or order is refreshed)
  useEffect(() => {
    setEditableData(orderData);
    setDeliveryInput(formatDate(orderData.deliveryDate));
  }, [orderData]);

  const calculateItemTotal = (quantity: number, unitPrice: number, discountPercentage: number = 0) => {
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountPercentage) / 100;
    return subtotal - discountAmount;
  };

  // Calculate totals from items
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    editableData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0;
      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
    });

    const totalAmount = subtotal - totalDiscount;
    const taxAmount = totalAmount * 0.22; // 22% IVA standard

    return {
      subtotal: totalAmount,
      discountAmount: totalDiscount,
      taxAmount,
      totalAmount: totalAmount + taxAmount
    };
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...editableData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableData({ ...editableData, items: newItems });
  };

  const handleNotesChange = (value: string) => {
    setEditableData({ ...editableData, notes: value });
  };

  const handleDeliveryDateChange = (value: string) => {
    setDeliveryInput(value);

    // Accetta solo formato GG/MM/AAAA
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const newDate = new Date(year, month, day);

    if (!Number.isNaN(newDate.getTime())) {
      setEditableData({ ...editableData, deliveryDate: newDate });
    }
  };

  // Get totals - use calculated values in edit mode, original in view mode
  const totals = mode === 'edit' ? calculateTotals() : {
    subtotal: orderData.subtotal,
    discountAmount: orderData.discountAmount || 0,
    taxAmount: orderData.taxAmount || 0,
    totalAmount: orderData.totalAmount
  };

  return (
    <div className="font-sans bg-white text-gray-800 p-6 shadow-lg max-w-4xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header con Logo Originale */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-red-600 pb-3">
        <div className="flex items-center space-x-3">
          <img src="/logo_farmap industry.jpg" alt="FARMAP Logo" className="h-12 w-auto" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">ORDINE DI ACQUISTO</h2>
            <div className="text-xs text-gray-600">Documento Ufficiale</div>
          </div>
        </div>
      </div>

      {/* Dettagli Ordine e Cliente - Layout Compatto Affiancato */}
      <div className="flex gap-4 mb-4 -mt-2">
        {/* Dettagli Ordine */}
        <div className="flex-1 bg-gray-50 p-3 rounded border">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
            <Package className="w-4 h-4 mr-1" />
            Dettagli Ordine
          </h3>
          <div className="space-y-1 text-xs">
            <div><span className="font-semibold">Numero:</span> {orderData.orderNumber}</div>
            <div><span className="font-semibold">Data:</span> {formatDate(orderData.orderDate)}</div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Tempi di consegna:</span>
              {mode === 'edit' ? (
                <Input
                  type="text"
                  placeholder="gg/mm/aaaa"
                  value={deliveryInput}
                  onChange={(e) => handleDeliveryDateChange(e.target.value)}
                  className="h-6 text-xs w-36"
                />
              ) : (
                <span>{formatDate(orderData.deliveryDate)}</span>
              )}
            </div>
            <div><span className="font-semibold">Commerciale:</span> {orderData.salesRepresentative}</div>
            {orderData.trackingNumber && (
              <div><span className="font-semibold">Tracking:</span> {orderData.trackingNumber}</div>
            )}
          </div>
        </div>

        {/* Dettagli Cliente */}
        <div className="flex-1 bg-blue-50 p-3 rounded border">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
            <Building className="w-4 h-4 mr-1" />
            Dettagli Cliente
          </h3>
          <div className="space-y-1 text-xs">
            <div><span className="font-semibold">Cliente:</span> {orderData.customerName}</div>
            <div><span className="font-semibold">Codice:</span> {orderData.customerCode}</div>
            {orderData.customerContact && (
              <div><span className="font-semibold">Contatto:</span> {orderData.customerContact}</div>
            )}
            {orderData.customerPhone && (
              <div><span className="font-semibold">Telefono:</span> {orderData.customerPhone}</div>
            )}
            {orderData.customerAddress && (
              <div><span className="font-semibold">Indirizzo:</span> {orderData.customerAddress}</div>
            )}
          </div>
        </div>
      </div>


      {/* Product Details Table - Compatta con Griglia Nera */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
          <Package className="w-4 h-4 mr-1" />
          Dettagli Prodotti
        </h3>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-2 text-xs font-bold border border-black">Codice</th>
              <th className="text-left p-2 text-xs font-bold border border-black">Prodotto</th>
              <th className="text-right p-2 text-xs font-bold border border-black">Quantità</th>
              <th className="text-right p-2 text-xs font-bold border border-black">Prezzo</th>
              <th className="text-right p-2 text-xs font-bold border border-black">Totale</th>
            </tr>
          </thead>
          <tbody>
            {editableData.items.map((item, index) => (
              <tr key={item.id || index} className="border border-black">
                <td className="p-2 text-xs font-mono border border-black">{item.productCode}</td>
                <td className="p-2 text-xs border border-black">
                  <div className="font-semibold">{item.productName}</div>
                  {item.productDescription && (
                    <div className="text-gray-600">{item.productDescription}</div>
                  )}
                </td>
                <td className="text-right p-2 text-xs border border-black">
                  {mode === 'edit' ? (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-16 h-6 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    `${item.quantity} ${item.unit || 'pz'}`
                  )}
                </td>
                <td className="text-right p-2 text-xs border border-black">
                  {mode === 'edit' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-20 h-6 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    formatCurrency(item.unitPrice)
                  )}
                </td>
                <td className="text-right p-2 text-xs font-bold border border-black">
                  {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice, item.discountPercentage))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals in una riga */}
      <div className="mb-4 p-2 bg-gray-50 rounded border">
        <div className="text-sm font-bold text-center">
          Subtotale: {formatCurrency(totals.subtotal)} | 
          IVA: {formatCurrency(totals.taxAmount)} | 
          TOTALE: {formatCurrency(totals.totalAmount)}
        </div>
      </div>

      {/* Note compatte */}
      {(editableData.notes || mode === 'edit') && (
        <div className="mb-4">
          <div className="bg-yellow-100 border border-yellow-300 rounded p-2 h-16">
            <div className="text-xs font-bold text-yellow-800 mb-1">NOTE:</div>
            {mode === 'edit' ? (
              <textarea
                value={editableData.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Inserisci note per l'ordine..."
                className="w-full h-16 text-xs resize-none border border-gray-300 rounded px-2 py-1"
                rows={3}
              />
            ) : (
              <div className="text-xs text-gray-800 leading-tight">{editableData.notes}</div>
            )}
          </div>
        </div>
      )}

      {/* Pulsanti di modifica */}
      {mode === 'edit' && (
        <div className="mb-4 flex gap-2 justify-end">
          <Button 
            onClick={async () => {
              if (onSave) {
                // Include calculated totals in the data to save
                const dataToSave = {
                  ...editableData,
                  ...totals
                };
                await onSave(dataToSave);
              }
            }}
            className="text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            Salva e Chiudi
          </Button>
        </div>
      )}

      {/* Condizioni di vendita dal listino e spazio firma */}
      {orderData.salesConditions && orderData.salesConditions.printConditions !== false && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="flex justify-between gap-4 items-start">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <AlertCircle className="w-3 h-3 text-orange-600 mr-1" />
                <h3 className="text-xs font-bold text-orange-800">Condizioni di vendita</h3>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-800">
                {orderData.salesConditions.payment && (
                  <div>
                    <span className="font-semibold">Pagamento:</span>{' '}
                    <span>{orderData.salesConditions.payment}</span>
                  </div>
                )}
                {orderData.salesConditions.shipping && (
                  <div>
                    <span className="font-semibold">Trasporto:</span>{' '}
                    <span>{orderData.salesConditions.shipping}</span>
                  </div>
                )}
                {orderData.salesConditions.delivery && (
                  <div>
                    <span className="font-semibold">Tempi di consegna:</span>{' '}
                    <span>{orderData.salesConditions.delivery}</span>
                  </div>
                )}
                {orderData.salesConditions.brand && (
                  <div>
                    <span className="font-semibold">Marchio:</span>{' '}
                    <span>{orderData.salesConditions.brand}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-40 h-20 border border-gray-400 rounded flex flex-col items-center justify-center text-[10px] text-gray-700">
              <div className="font-semibold">Per accettazione</div>
              <div>Timbro e firma</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer with generation info */}
      <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between text-xs text-gray-500">
        <span>Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT')}</span>
        <span>FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE)</span>
      </div>
    </div>
  );
};

export default OrderFormTemplate;