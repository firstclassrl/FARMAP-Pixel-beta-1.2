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
    <div className="font-sans bg-white text-gray-800 p-8 shadow-lg max-w-4xl mx-auto">
      {/* Company Header Space */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-red-600 pb-4">
        <div>
          <div className="text-3xl font-bold text-red-600">FARMAP S.r.l.</div>
          <div className="text-sm text-gray-600 mt-1">Gestione Commerciale</div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800">ORDINE DI ACQUISTO</h2>
          <div className="text-sm text-gray-600 mt-1">Documento Ufficiale</div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-gray-700">Numero Ordine:</p>
          <p className="text-lg font-bold text-gray-900">{orderData.orderNumber}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Data Ordine:</p>
          <p className="text-base font-medium text-gray-900">{formatDate(orderData.orderDate)}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Data Consegna Prevista:</p>
          <p className="text-base font-bold text-red-600">{formatDate(orderData.deliveryDate)}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Rappresentante di Vendita:</p>
          <p className="text-base font-medium text-gray-900">{orderData.salesRepresentative}</p>
        </div>
        {orderData.trackingNumber && (
          <div className="col-span-2 border-t pt-3 mt-2">
            <p className="text-sm font-semibold text-gray-700">Numero di Tracciamento:</p>
            <p className="text-base font-mono text-blue-600">{orderData.trackingNumber}</p>
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2 text-blue-600" />
          Dettagli Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Nome Cliente / Azienda:</p>
            <p className="text-base font-medium text-gray-900">{orderData.customerName}</p>
            {orderData.customerContact && (
              <>
                <p className="text-sm font-semibold text-gray-700 mt-2">Persona di Contatto:</p>
                <p className="text-base text-gray-900">{orderData.customerContact}</p>
              </>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Codice Cliente:</p>
            <p className="text-base font-mono text-gray-900">{orderData.customerCode}</p>
            {orderData.customerEmail && (
              <>
                <p className="text-sm font-semibold text-gray-700 mt-2">Email:</p>
                <p className="text-base text-blue-600">{orderData.customerEmail}</p>
              </>
            )}
            {orderData.customerPhone && (
              <>
                <p className="text-sm font-semibold text-gray-700 mt-2">Telefono:</p>
                <p className="text-base text-gray-900">{orderData.customerPhone}</p>
              </>
            )}
          </div>
          {orderData.customerAddress && (
            <div className="md:col-span-2 border-t pt-3 mt-2">
              <p className="text-sm font-semibold text-gray-700">Indirizzo Cliente:</p>
              <p className="text-base text-gray-900">{orderData.customerAddress}</p>
            </div>
          )}
          {orderData.shippingAddress && orderData.shippingAddress !== 'Stesso indirizzo del cliente' && (
            <div className="md:col-span-2 border-t pt-3 mt-2">
              <p className="text-sm font-semibold text-gray-700">Indirizzo di Spedizione:</p>
              <p className="text-base text-gray-900">{orderData.shippingAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Table */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-green-600" />
          Dettagli Prodotti
        </h3>
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-red-600 text-white">
              <th className="text-left p-3 text-sm font-bold">Codice</th>
              <th className="text-left p-3 text-sm font-bold w-2/5">Nome / Descrizione</th>
              <th className="text-right p-3 text-sm font-bold">Quantità</th>
              <th className="text-right p-3 text-sm font-bold">Prezzo Unit.</th>
              <th className="text-right p-3 text-sm font-bold">Sconto</th>
              <th className="text-right p-3 text-sm font-bold">Totale</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => (
              <tr key={index} className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className="p-3 text-sm font-mono">{item.productCode}</td>
                <td className="p-3 text-sm w-2/5">
                  <div className="font-semibold text-gray-900">{item.productName}</div>
                  {item.productDescription && (
                    <div className="text-xs text-gray-600 mt-1">{item.productDescription}</div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-blue-600 mt-1 italic font-medium">Note: {item.notes}</div>
                  )}
                </td>
                <td className="text-right p-3 text-sm font-medium">
                  {item.quantity} {item.unit || 'pz'}
                </td>
                <td className="text-right p-3 text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right p-3 text-sm">
                  {item.discountPercentage ? `${item.discountPercentage}%` : '-'}
                </td>
                <td className="text-right p-3 text-sm font-bold text-red-600">
                  {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice, item.discountPercentage))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-1/2 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="font-semibold text-gray-700">Subtotale (Imponibile):</span>
            <span className="font-medium">{formatCurrency(orderData.subtotal)}</span>
          </div>
          {orderData.discountAmount && orderData.discountAmount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300 text-red-600">
              <span className="font-semibold">Sconto Applicato:</span>
              <span className="font-medium">-{formatCurrency(orderData.discountAmount)}</span>
            </div>
          )}
          {orderData.shippingCost && orderData.shippingCost > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-semibold text-gray-700">Costi di Spedizione:</span>
              <span className="font-medium">{formatCurrency(orderData.shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="font-semibold text-gray-700">IVA (22%):</span>
            <span className="font-medium">{formatCurrency(orderData.taxAmount || 0)}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold text-red-600 border-t-2 border-red-600 mt-2">
            <span>Totale Ordine:</span>
            <span>{formatCurrency(orderData.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {orderData.notes && (
        <div className="mb-6 border-t pt-4">
          <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
            Note Ordine:
          </h4>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-800 leading-relaxed">{orderData.notes}</p>
          </div>
        </div>
      )}

      {/* Footer with generation info */}
      <div className="mt-8 pt-4 border-t-2 border-gray-300 flex justify-between text-xs text-gray-500">
        <span>Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT')}</span>
        <span>FARMAP S.r.l. - Sistema CRM Pixel</span>
      </div>
    </div>
  );
};

export default OrderFormTemplate;