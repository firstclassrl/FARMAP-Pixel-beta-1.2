import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportColumn {
  csvKey: string;
  dbKey: string;
  required?: boolean;
  transform?: (value: string) => any;
  validate?: (value: any) => boolean;
}

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
}

export const parseCSV = <T extends Record<string, any>>(
  file: File,
  columns: ImportColumn[]
): Promise<ImportResult<T>> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importResult: ImportResult<T> = {
          success: true,
          data: [],
          errors: [],
          warnings: []
        };

        if (results.errors.length > 0) {
          importResult.errors.push(...results.errors.map(err => err.message));
        }

        // Process each row
        results.data.forEach((row: any, index: number) => {
          const processedRow: any = {};
          let hasErrors = false;

          columns.forEach(col => {
            const csvValue = row[col.csvKey];
            
            // Check required fields
            if (col.required && (!csvValue || csvValue.trim() === '')) {
              importResult.errors.push(`Riga ${index + 2}: Campo "${col.csvKey}" è obbligatorio`);
              hasErrors = true;
              return;
            }

            // Transform value
            let transformedValue = csvValue;
            if (col.transform && csvValue) {
              try {
                transformedValue = col.transform(csvValue);
              } catch (error) {
                importResult.errors.push(`Riga ${index + 2}: Errore nella trasformazione del campo "${col.csvKey}"`);
                hasErrors = true;
                return;
              }
            }

            // Validate value
            if (col.validate && transformedValue !== null && transformedValue !== undefined) {
              if (!col.validate(transformedValue)) {
                importResult.errors.push(`Riga ${index + 2}: Valore non valido per il campo "${col.csvKey}"`);
                hasErrors = true;
                return;
              }
            }

            processedRow[col.dbKey] = transformedValue;
          });

          if (!hasErrors) {
            importResult.data.push(processedRow as T);
          }
        });

        if (importResult.errors.length > 0) {
          importResult.success = false;
        }

        resolve(importResult);
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [error.message],
          warnings: []
        });
      }
    });
  });
};

// Common transform functions
export const transformToNumber = (value: string): number => {
  const num = parseFloat(value.replace(',', '.'));
  if (isNaN(num)) throw new Error('Not a valid number');
  return num;
};

export const transformToBoolean = (value: string): boolean => {
  const lower = value.toLowerCase().trim();
  return ['true', '1', 'sì', 'si', 'yes', 'vero'].includes(lower);
};

export const transformToDate = (value: string): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new Error('Not a valid date');
  return date.toISOString();
};

// Common validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export const importFromExcel = <T extends Record<string, any>>(
  file: File,
  columns: ImportColumn[]
): Promise<ImportResult<T>> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['Il file Excel è vuoto'],
            warnings: []
          });
          return;
        }
        
        // Get headers from first row
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        const importResult: ImportResult<T> = {
          success: true,
          data: [],
          errors: [],
          warnings: []
        };
        
        // Process each row
        rows.forEach((row: any[], index: number) => {
          const processedRow: any = {};
          let hasErrors = false;
          
          columns.forEach(col => {
            const colIndex = headers.indexOf(col.csvKey);
            const cellValue = colIndex >= 0 ? row[colIndex] : undefined;
            const stringValue = cellValue?.toString() || '';
            
            // Check required fields
            if (col.required && (!stringValue || stringValue.trim() === '')) {
              importResult.errors.push(`Riga ${index + 2}: Campo "${col.csvKey}" è obbligatorio`);
              hasErrors = true;
              return;
            }
            
            // Transform value
            let transformedValue = stringValue;
            if (col.transform && stringValue) {
              try {
                transformedValue = col.transform(stringValue);
              } catch (error) {
                importResult.errors.push(`Riga ${index + 2}: Errore nella trasformazione del campo "${col.csvKey}"`);
                hasErrors = true;
                return;
              }
            }
            
            // Validate value
            if (col.validate && transformedValue !== null && transformedValue !== undefined) {
              if (!col.validate(transformedValue)) {
                importResult.errors.push(`Riga ${index + 2}: Valore non valido per il campo "${col.csvKey}"`);
                hasErrors = true;
                return;
              }
            }
            
            processedRow[col.dbKey] = transformedValue;
          });
          
          if (!hasErrors) {
            importResult.data.push(processedRow as T);
          }
        });
        
        if (importResult.errors.length > 0) {
          importResult.success = false;
        }
        
        resolve(importResult);
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [`Errore nella lettura del file Excel: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`],
          warnings: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Errore nella lettura del file'],
        warnings: []
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};