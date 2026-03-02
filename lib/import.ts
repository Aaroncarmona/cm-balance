import { ExportData } from './types';

/**
 * Import data from JSON file
 */
export const importFromJSON = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // Validate data structure
        if (!data.investments || !data.operative || !data.debts || !data.cash) {
          throw new Error('Archivo JSON inválido: faltan datos requeridos');
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Error al leer el archivo JSON: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};

/**
 * Import data from Excel file
 */
export const importFromExcel = (file: File): Promise<Partial<ExportData>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const result: Partial<ExportData> = {
          investments: [],
          operative: [],
          debts: [],
          cash: [],
        };

        // Read Investments sheet
        if (workbook.SheetNames.includes('Inversiones')) {
          const sheet = workbook.Sheets['Inversiones'];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          result.investments = jsonData.map((row: any, index) => ({
            id: `inv-import-${Date.now()}-${index}`,
            concept: row.Concepto || '',
            previousValue: parseFloat(row.Anterior) || 0,
            currentValue: parseFloat(row.Actual) || 0,
            profitLoss: parseFloat(row['P/M']) || 0,
            income: parseFloat(row.Ingreso) || 0,
            accumulated: parseFloat(row.Acumulado) || 0,
            type: row.Tipo || 'Fondo',
            portfolio: parseFloat(row['Portafolio %']) || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }

        // Read Operative sheet
        if (workbook.SheetNames.includes('Operativo')) {
          const sheet = workbook.Sheets['Operativo'];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          result.operative = jsonData.map((row: any, index) => ({
            id: `op-import-${Date.now()}-${index}`,
            concept: row.Concepto || '',
            previousValue: parseFloat(row.Anterior) || 0,
            currentValue: parseFloat(row.Actual) || 0,
            profitLoss: parseFloat(row['P/M']) || 0,
            income: parseFloat(row.Ingreso) || 0,
            accumulated: parseFloat(row.Acumulado) || 0,
            type: 'CPC',
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }

        // Read Debts sheet
        if (workbook.SheetNames.includes('Deudas')) {
          const sheet = workbook.Sheets['Deudas'];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          result.debts = jsonData.map((row: any, index) => ({
            id: `debt-import-${Date.now()}-${index}`,
            concept: row.Concepto || '',
            previousValue: parseFloat(row.Anterior) || 0,
            currentValue: parseFloat(row.Actual) || 0,
            profitLoss: parseFloat(row['P/M']) || 0,
            limit: parseFloat(row.Límite) || 0,
            balance: parseFloat(row.Balance) || 0,
            type: 'CREDITO',
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }

        // Read Cash sheet
        if (workbook.SheetNames.includes('Caja')) {
          const sheet = workbook.Sheets['Caja'];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          result.cash = jsonData.map((row: any, index) => ({
            id: `cash-import-${Date.now()}-${index}`,
            concept: row.Concepto || '',
            location: row.Ubicación || '',
            amount: parseFloat(row.Monto) || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }

        resolve(result);
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Import data from CSV file
 */
export const importFromCSV = (file: File): Promise<Partial<ExportData>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

        const result: Partial<ExportData> = {
          investments: [],
          operative: [],
          debts: [],
          cash: [],
        };

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          const category = row['Categoría'];
          const id = `${category.toLowerCase()}-import-${Date.now()}-${i}`;

          if (category === 'INVERSION') {
            result.investments?.push({
              id,
              concept: row.Concepto,
              previousValue: parseFloat(row.Anterior?.replace(/[^0-9.-]/g, '')) || 0,
              currentValue: parseFloat(row.Actual?.replace(/[^0-9.-]/g, '')) || 0,
              profitLoss: parseFloat(row['P/M']?.replace(/[^0-9.-]/g, '')) || 0,
              income: parseFloat(row.Extra?.replace(/[^0-9.-]/g, '')) || 0,
              accumulated: parseFloat(row.Acumulado?.replace(/[^0-9.-]/g, '')) || 0,
              type: row.Tipo as any,
              portfolio: parseFloat(row.Porcentaje?.replace(/[^0-9.-]/g, '')) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else if (category === 'OPERATIVO') {
            result.operative?.push({
              id,
              concept: row.Concepto,
              previousValue: parseFloat(row.Anterior?.replace(/[^0-9.-]/g, '')) || 0,
              currentValue: parseFloat(row.Actual?.replace(/[^0-9.-]/g, '')) || 0,
              profitLoss: parseFloat(row['P/M']?.replace(/[^0-9.-]/g, '')) || 0,
              income: parseFloat(row.Extra?.replace(/[^0-9.-]/g, '')) || 0,
              accumulated: parseFloat(row.Acumulado?.replace(/[^0-9.-]/g, '')) || 0,
              type: 'CPC',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else if (category === 'DEUDA') {
            result.debts?.push({
              id,
              concept: row.Concepto,
              previousValue: parseFloat(row.Anterior?.replace(/[^0-9.-]/g, '')) || 0,
              currentValue: parseFloat(row.Actual?.replace(/[^0-9.-]/g, '')) || 0,
              profitLoss: parseFloat(row['P/M']?.replace(/[^0-9.-]/g, '')) || 0,
              limit: parseFloat(row.Extra?.replace(/[^0-9.-]/g, '')) || 0,
              balance: parseFloat(row.Acumulado?.replace(/[^0-9.-]/g, '')) || 0,
              type: 'CREDITO',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else if (category === 'CAJA') {
            result.cash?.push({
              id,
              concept: row.Concepto,
              location: row.Tipo,
              amount: parseFloat(row.Acumulado?.replace(/[^0-9.-]/g, '')) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        resolve(result);
      } catch (error) {
        reject(new Error('Error al leer el archivo CSV: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};
