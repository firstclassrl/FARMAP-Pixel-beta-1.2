import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2, X, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ProductImportData {
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  base_price: number;
  peso?: number;
  cartone?: number;
  pallet?: number;
  strati?: number;
  scadenza?: string;
  iva?: number;
  ean?: string;
  customer_id?: string;
  is_active: boolean;
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ProductImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  }>({ success: 0, errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [customers, setCustomers] = useState<Array<{id: string, company_name: string}>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      loadCustomersAndCategories();
    }
  }, [isOpen]);

  const loadCustomersAndCategories = async () => {
    try {
      // Carica clienti
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('is_active', true)
        .order('company_name');

      setCustomers(customersData || []);

      // Carica categorie
      const { data: categoriesData } = await supabase
        .from('product_categories')
        .select('name')
        .order('name');

      setCategories(categoriesData?.map(c => c.name) || []);
    } catch (error) {
      console.error('Errore nel caricamento clienti e categorie:', error);
    }
  };

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
      const requiredHeaders = ['code', 'name', 'unit', 'base_price'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        addNotification(`Header mancanti: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      const data: ProductImportData[] = [];
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

        // Validazione dati obbligatori
        if (!row.code || !row.name || !row.unit || !row.base_price) {
          errors.push(`Riga ${i + 1}: campi obbligatori mancanti`);
          continue;
        }

        // Validazione prezzo
        const price = parseFloat(row.base_price);
        if (isNaN(price) || price < 0) {
          errors.push(`Riga ${i + 1}: prezzo non valido`);
          continue;
        }

        // Validazione peso se presente
        let peso = null;
        if (row.peso) {
          peso = parseFloat(row.peso);
          if (isNaN(peso) || peso < 0) {
            errors.push(`Riga ${i + 1}: peso non valido`);
            continue;
          }
        }

        // Validazione IVA se presente
        let iva = null;
        if (row.iva) {
          iva = parseFloat(row.iva);
          if (isNaN(iva) || iva < 0 || iva > 100) {
            errors.push(`Riga ${i + 1}: IVA non valida (deve essere tra 0 e 100)`);
            continue;
          }
        }

        // Validazione customer_id se presente
        let customer_id = null;
        if (row.customer_id) {
          const customer = customers.find(c => c.id === row.customer_id);
          if (!customer) {
            errors.push(`Riga ${i + 1}: customer_id non valido`);
            continue;
          }
          customer_id = row.customer_id;
        }

        data.push({
          code: row.code,
          name: row.name,
          description: row.description || null,
          category: row.category || null,
          unit: row.unit,
          base_price: price,
          peso: peso,
          cartone: row.cartone ? parseInt(row.cartone) : null,
          pallet: row.pallet ? parseInt(row.pallet) : null,
          strati: row.strati ? parseInt(row.strati) : null,
          scadenza: row.scadenza || null,
          iva: iva,
          ean: row.ean || null,
          customer_id: customer_id,
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
          .from('products')
          .insert(batch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      setImportResults({ success: successCount, errors });
      
      if (successCount > 0) {
        addNotification(`${successCount} prodotti importati con successo`, 'success');
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
      'code',
      'name',
      'description',
      'category',
      'unit',
      'base_price',
      'peso',
      'cartone',
      'pallet',
      'strati',
      'scadenza',
      'iva',
      'ean',
      'customer_id',
      'is_active'
    ];
    
    const sampleData = [
      'EX001',
      'Prodotto Example',
      'Descrizione del prodotto',
      'Categoria Example',
      'pz',
      '10.50',
      '1.5',
      '12',
      '100',
      '5',
      '3 anni',
      '22',
      '1234567890123',
      '',
      'true'
    ];

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_prodotti.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-green-600" />
            <span>Importa Prodotti da CSV</span>
          </DialogTitle>
          <DialogDescription>
            Carica un file CSV per importare prodotti nel database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Template Download */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Template CSV</h3>
                <p className="text-sm text-green-600">
                  Scarica il template per vedere il formato richiesto
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-green-300 text-green-700 hover:bg-green-100"
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
                Anteprima Dati ({csvData.length} prodotti)
              </h3>
              <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Codice</th>
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Unità</th>
                      <th className="px-3 py-2 text-left">Prezzo</th>
                      <th className="px-3 py-2 text-left">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((product, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{product.code}</td>
                        <td className="px-3 py-2">{product.name}</td>
                        <td className="px-3 py-2">{product.category || '-'}</td>
                        <td className="px-3 py-2">{product.unit}</td>
                        <td className="px-3 py-2">€{product.base_price.toFixed(2)}</td>
                        <td className="px-3 py-2">{product.peso ? `${product.peso}kg` : '-'}</td>
                      </tr>
                    ))}
                    {csvData.length > 10 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                          ... e altri {csvData.length - 10} prodotti
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
                  <span>{importResults.success} prodotti importati con successo</span>
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Importa {csvData.length > 0 ? `(${csvData.length})` : ''} Prodotti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProductsModal;

