/**
 * Convierte una fecha de string (formato YYYY-MM-DD del input) a Date local
 * sin conversión de zona horaria
 */
export function dateInputToLocal(dateString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convierte un Date a string formato YYYY-MM-DD para inputs de fecha
 * usando la zona horaria local (sin conversión UTC)
 */
export function dateToLocalInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
  }
  
  return d.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD local
 */
export function getTodayLocalInput(): string {
  return new Date().toLocaleDateString('en-CA');
}
