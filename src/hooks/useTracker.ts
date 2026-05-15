import { useState, useEffect, useCallback } from 'react';
import { Entry, Settings } from '../types';

export function useTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session/check');
      const data = await res.json();
      setIsAuthorized(data.authorized);
      return data.authorized;
    } catch (err) {
      setIsAuthorized(false);
      return false;
    }
  }, []);

  const login = async (passcode: string) => {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      setIsAuthorized(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch('/api/session', { method: 'DELETE' });
    setIsAuthorized(false);
  };

  const fetchEntries = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const res = await fetch('/api/entries');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Failed to fetch entries', err);
    }
  }, [isAuthorized]);

  const fetchSettings = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, [isAuthorized]);

  const saveEntry = async (entry: Partial<Entry>) => {
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        await fetchEntries();
        return true;
      }
    } catch (err) {
      console.error('Failed to save entry', err);
    }
    return false;
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchEntries();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
    return false;
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => prev ? { ...prev, ...data } : data);
        return true;
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    }
    return false;
  };

  const importData = async (data: any, mode: 'merge' | 'replace') => {
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode }),
      });
      if (res.ok) {
        await fetchEntries();
        await fetchSettings();
        return true;
      }
    } catch (err) {
      console.error('Failed to import data', err);
    }
    return false;
  };

  useEffect(() => {
    checkSession().finally(() => setIsLoading(false));
  }, [checkSession]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAuthorized) {
      fetchEntries();
      fetchSettings();
      interval = setInterval(() => {
        fetchEntries();
        fetchSettings();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [isAuthorized, fetchEntries, fetchSettings]);

  return {
    entries,
    settings,
    isAuthorized,
    isLoading,
    login,
    logout,
    saveEntry,
    deleteEntry,
    updateSettings,
    importData,
    refresh: fetchEntries,
  };
}
