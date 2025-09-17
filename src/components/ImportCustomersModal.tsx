import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CustomerImportData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  code_prefix?: string;
  codice_cliente?: string;
  payment_terms?: string;
  is_active: boolean;
}

const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CustomerImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  }>({ success: 0, errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      addNotification('Seleziona un file CSV valido', 'error');
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        addNotification('Il file CSV deve contenere almeno un header e una riga di dati', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['company_name', 'contact_person', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        addNotification(`Header mancanti: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      const data: CustomerImportData[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Riga ${i + 1}: numero di colonne non corrispondente`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Validazione dati
        if (!row.company_name || !row.contact_person || !row.email) {
          errors.push(`Riga ${i + 1}: campi obbligatori mancanti`);
          continue;
        }

        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push(`Riga ${i + 1}: email non valida`);
          continue;
        }

        data.push({
          company_name: row.company_name,
          contact_person: row.contact_person,
          email: row.email,
          phone: row.phone || '',
          address: row.address || '',
          city: row.city || '',
          postal_code: row.postal_code || '',
          country: row.country || 'Italia',
          code_prefix: row.code_prefix || null,
          codice_cliente: row.codice_cliente || null,
          payment_terms: row.payment_terms || '30 giorni',
          is_active: row.is_active === 'true' || row.is_active === '1' || row.is_active === 'yes' || row.is_active === '',
        });
      }

      setCsvData(data);
      if (errors.length > 0) {
        setImportResults({ success: 0, errors });
      }
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      addNotification('Nessun dato da importare', 'error');
      return;
    }

    setIsProcessing(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      // Importa in batch per evitare timeout
      const batchSize = 50;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('customers')
          .insert(batch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      setImportResults({ success: successCount, errors });
      
      if (successCount > 0) {
        addNotification(`${successCount} clienti importati con successo`, 'success');
        onImportComplete();
      }
      
      if (errors.length > 0) {
        addNotification(`${errors.length} errori durante l'importazione`, 'warning');
      }

    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      addNotification('Errore durante l\'importazione', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setCsvData([]);
    setImportResults({ success: 0, errors: [] });
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      'company_name',
      'contact_person', 
      'email',
      'phone',
      'address',
      'city',
      'postal_code',
      'country',
      'code_prefix',
      'codice_cliente',
      'payment_terms',
      'is_active'
    ];
    
    const sampleData = [
      'Azienda Example SRL',
      'Mario Rossi',
      'mario.rossi@example.com',
      '+39 123 456 7890',
      'Via Roma 123',
      'Milano',
      '20100',
      'Italia',
      'EX',
      'CLI001',
      '30 giorni',
      'true'
    ];

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_clienti.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <span>Importa Clienti da CSV</span>
          </DialogTitle>
          <DialogDescription>
            Carica un file CSV per importare clienti nel database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">Template CSV</h3>
                <p className="text-sm text-blue-600">
                  Scarica il template per vedere il formato richiesto
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Scarica Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Seleziona file CSV
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Formato supportato: CSV con header nella prima riga
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Scegli File
              </Button>
              {csvFile && (
                <div className="mt-2 text-sm text-gray-600">
                  File selezionato: {csvFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && csvData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="font-medium text-gray-900 mb-2">
                Anteprima Dati ({csvData.length} clienti)
              </h3>
              <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Azienda</th>
                      <th className="px-3 py-2 text-left">Contatto</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Telefono</th>
                      <th className="px-3 py-2 text-left">Codice</th>
                      <th className="px-3 py-2 text-left">Prefisso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((customer, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{customer.company_name}</td>
                        <td className="px-3 py-2">{customer.contact_person}</td>
                        <td className="px-3 py-2">{customer.email}</td>
                        <td className="px-3 py-2">{customer.phone}</td>
                        <td className="px-3 py-2">{customer.codice_cliente || '-'}</td>
                        <td className="px-3 py-2">{customer.code_prefix || '-'}</td>
                      </tr>
                    ))}
                    {csvData.length > 10 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                          ... e altri {csvData.length - 10} clienti
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults.success > 0 || importResults.errors.length > 0 ? (
            <div className="space-y-2">
              {importResults.success > 0 && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{importResults.success} clienti importati con successo</span>
                </div>
              )}
              {importResults.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{importResults.errors.length} errori:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-sm text-red-600 bg-red-50 p-2 rounded">
                    {importResults.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Chiudi
          </Button>
          <Button
            onClick={handleImport}
            disabled={csvData.length === 0 || isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Importa {csvData.length > 0 ? `(${csvData.length})` : ''} Clienti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCustomersModal;
