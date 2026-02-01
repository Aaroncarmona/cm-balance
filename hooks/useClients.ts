import { useState, useEffect } from 'react';
import { Client } from '@/lib/types';
import { getClients } from '@/lib/storage';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = getClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => {
    const data = getClients();
    setClients(data);
  };

  return {
    clients,
    loading,
    refresh,
  };
}
