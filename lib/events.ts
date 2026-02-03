/**
 * Sistema de eventos para sincronización entre páginas
 */

export const DATA_UPDATED_EVENT = 'banlance:data:updated';

export function emitDataUpdated(dataType: 'investments' | 'operative' | 'debts' | 'movements' | 'cuentas' | 'all') {
  // Dispatchar evento personalizado para actualizar otras páginas/componentes
  window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT, {
    detail: { dataType, timestamp: Date.now() }
  }));
}

export function onDataUpdated(callback: (detail: { dataType: string; timestamp: number }) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(DATA_UPDATED_EVENT, handler);
  
  // Retornar función para limpiar el listener
  return () => window.removeEventListener(DATA_UPDATED_EVENT, handler);
}
