import React from 'react';
import { Building, Package, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/exportUtils';

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
      productCode: string;
      productName: string;
      productDescription?: string;
      category?: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      discountPercentage?: number;
      notes?: string;
    }>;
    subtotal: number;
    discountAmount?: number;
    taxAmount?: number;
    shippingCost?: number;
    totalAmount: number;
    notes?: string;
    trackingNumber?: string;
    termsAndConditions?: string;
  };
}

const OrderFormTemplate: React.FC<OrderFormTemplateProps> = ({ orderData }) => {
  const calculateItemTotal = (quantity: number, unitPrice: number, discountPercentage: number = 0) => {
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountPercentage) / 100;
    return subtotal - discountAmount;
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
            <div><span className="font-semibold">Consegna:</span> {formatDate(orderData.deliveryDate)}</div>
            <div><span className="font-semibold">Rappresentante:</span> {orderData.salesRepresentative}</div>
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
              <th className="text-right p-2 text-xs font-bold border border-black">Qty</th>
              <th className="text-right p-2 text-xs font-bold border border-black">Prezzo</th>
              <th className="text-right p-2 text-xs font-bold border border-black">Totale</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => (
              <tr key={index} className="border border-black">
                <td className="p-2 text-xs font-mono border border-black">{item.productCode}</td>
                <td className="p-2 text-xs border border-black">
                  <div className="font-semibold">{item.productName}</div>
                  {item.productDescription && (
                    <div className="text-gray-600">{item.productDescription}</div>
                  )}
                </td>
                <td className="text-right p-2 text-xs border border-black">
                  {item.quantity} {item.unit || 'pz'}
                </td>
                <td className="text-right p-2 text-xs border border-black">{formatCurrency(item.unitPrice)}</td>
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
          Subtotale: {formatCurrency(orderData.subtotal)} | 
          IVA: {formatCurrency(orderData.taxAmount || 0)} | 
          TOTALE: {formatCurrency(orderData.totalAmount)}
        </div>
      </div>

      {/* Note compatte */}
      {orderData.notes && (
        <div className="mb-4">
          <div className="bg-yellow-100 border border-yellow-300 rounded p-2 h-16">
            <div className="text-xs font-bold text-yellow-800 mb-1">NOTE:</div>
            <div className="text-xs text-gray-800 leading-tight">{orderData.notes}</div>
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