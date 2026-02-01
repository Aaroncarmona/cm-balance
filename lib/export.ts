import * as XLSX from 'xlsx';
import { Investment, Operative, Debt, Cash, ExportData } from './types';
import { formatCurrency, formatPercentage, formatDate } from './calculations';

/**
 * Export data to Excel
 */
export const exportToExcel = async (
  investments: Investment[],
  operative: Operative[],
  debts: Debt[],
  cash: Cash[]
): Promise<void> => {
  const workbook = XLSX.utils.book_new();

  // Investments sheet
  const investmentsData = investments.map((inv) => ({
    Concepto: inv.concept,
    Anterior: inv.previousValue,
    Actual: inv.currentValue,
    'P/M': inv.profitLoss,
    Ingreso: inv.income,
    Acumulado: inv.accumulated,
    Tipo: inv.type,
    'Portafolio %': inv.portfolio,
  }));
  const investmentsSheet = XLSX.utils.json_to_sheet(investmentsData);
  XLSX.utils.book_append_sheet(workbook, investmentsSheet, 'Inversiones');

  // Operative sheet
  const operativeData = operative.map((op) => ({
    Concepto: op.concept,
    Anterior: op.previousValue,
    Actual: op.currentValue,
    'P/M': op.profitLoss,
    Ingreso: op.income,
    Acumulado: op.accumulated,
    Tipo: op.type,
  }));
  const operativeSheet = XLSX.utils.json_to_sheet(operativeData);
  XLSX.utils.book_append_sheet(workbook, operativeSheet, 'Operativo');

  // Debts sheet
  const debtsData = debts.map((debt) => ({
    Concepto: debt.concept,
    Anterior: debt.previousValue,
    Actual: debt.currentValue,
    'P/M': debt.profitLoss,
    Límite: debt.limit,
    Balance: debt.balance,
    Tipo: debt.type,
  }));
  const debtsSheet = XLSX.utils.json_to_sheet(debtsData);
  XLSX.utils.book_append_sheet(workbook, debtsSheet, 'Deudas');

  // Cash sheet
  const cashData = cash.map((c) => ({
    Concepto: c.concept,
    Ubicación: c.location,
    Monto: c.amount,
  }));
  const cashSheet = XLSX.utils.json_to_sheet(cashData);
  XLSX.utils.book_append_sheet(workbook, cashSheet, 'Caja');

  // Write file
  const fileName = `banlance_${formatDate(new Date()).replace(/\s/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export data to CSV
 */
export const exportToCSV = async (
  investments: Investment[],
  operative: Operative[],
  debts: Debt[],
  cash: Cash[]
): Promise<void> => {
  // Combine all data
  const allData = [
    ...investments.map((inv) => ({
      Categoría: 'INVERSION',
      Concepto: inv.concept,
      Tipo: inv.type,
      Anterior: formatCurrency(inv.previousValue),
      Actual: formatCurrency(inv.currentValue),
      'P/M': formatCurrency(inv.profitLoss),
      Extra: formatCurrency(inv.income),
      Acumulado: formatCurrency(inv.accumulated),
      Porcentaje: formatPercentage(inv.portfolio),
    })),
    ...operative.map((op) => ({
      Categoría: 'OPERATIVO',
      Concepto: op.concept,
      Tipo: op.type,
      Anterior: formatCurrency(op.previousValue),
      Actual: formatCurrency(op.currentValue),
      'P/M': formatCurrency(op.profitLoss),
      Extra: formatCurrency(op.income),
      Acumulado: formatCurrency(op.accumulated),
      Porcentaje: '',
    })),
    ...debts.map((debt) => ({
      Categoría: 'DEUDA',
      Concepto: debt.concept,
      Tipo: debt.type,
      Anterior: formatCurrency(debt.previousValue),
      Actual: formatCurrency(debt.currentValue),
      'P/M': formatCurrency(debt.profitLoss),
      Extra: formatCurrency(debt.limit),
      Acumulado: formatCurrency(debt.balance),
      Porcentaje: '',
    })),
    ...cash.map((c) => ({
      Categoría: 'CAJA',
      Concepto: c.concept,
      Tipo: c.location,
      Anterior: '',
      Actual: '',
      'P/M': '',
      Extra: '',
      Acumulado: formatCurrency(c.amount),
      Porcentaje: '',
    })),
  ];

  // Convert to CSV
  const headers = Object.keys(allData[0] || {});
  const csv = [
    headers.join(','),
    ...allData.map((row) =>
      headers
        .map((header) => {
          const value = (row as any)[header] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `banlance_${formatDate(new Date()).replace(/\s/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to JSON
 */
export const exportToJSON = async (data: ExportData): Promise<void> => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `banlance_backup_${Date.now()}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
