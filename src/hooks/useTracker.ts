import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Entry, Settings } from '../types';

export function useTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session/check', { credentials: 'include' });
      if (!res.ok) {
        console.warn('[useTracker] Session check failed', res.status);
        setIsAuthorized(false);
        return false;
      }
      const data = await res.json();
      setIsAuthorized(data.authorized);
      return data.authorized;
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('fetch')) {
        setIsAuthorized(false);
        return false;
      }
      console.error('[useTracker] Session check error', err);
      setIsAuthorized(false);
      return false;
    }
  }, []);

  const login = async (passcode: string) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
        credentials: 'include',
      });
      
      if (res.ok) {
        const authorized = await checkSession();
        if (!authorized) {
          console.warn('[useTracker] Passcode accepted but session cookie failed.');
          return false;
        }
        return true;
      } else {
        console.warn('[useTracker] Login failed', res.status);
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('fetch')) return false;
      console.error('[useTracker] Login error', err);
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
    } catch (e) {
      console.warn("Logout fetch failed", e);
    } finally {
      setIsAuthorized(false);
    }
  };

  const fetchEntries = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const res = await fetch('/api/entries', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('fetch')) return;
      console.error('Failed to fetch entries', err);
    }
  }, [isAuthorized]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data?.theme) {
          localStorage.setItem('smeemo_theme', data.theme);
          document.documentElement.classList.toggle('dark', data.theme === 'dark');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('fetch')) return;
      console.error('Failed to fetch settings', err);
    }
  }, []);

  const saveEntry = async (entry: Partial<Entry>) => {
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        credentials: 'include',
      });
      if (res.ok) {
        await fetchEntries();
        toast.success(`Entry saved successfully`);
        return true;
      }
    } catch (err) {
      console.error('Failed to save entry', err);
      toast.error('Failed to save entry');
    }
    return false;
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        await fetchEntries();
        toast.success('Entry deleted');
        return true;
      }
    } catch (err) {
      console.error('Failed to delete entry', err);
      toast.error('Failed to delete entry');
    }
    return false;
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      if (newSettings.theme) {
        localStorage.setItem('smeemo_theme', newSettings.theme);
        document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
      }
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => prev ? { ...prev, ...data } : data);
        const isThemeOnly = Object.keys(newSettings).every(k => k === 'theme');
        if (!isThemeOnly) {
          toast.success('Settings updated');
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to update settings', err);
      toast.error('Failed to update settings');
    }
    return false;
  };

  const importData = async (data: any, mode: 'merge' | 'replace') => {
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode }),
        credentials: 'include',
      });
      if (res.ok) {
        await fetchEntries();
        await fetchSettings();
        toast.success('Data imported successfully');
        return true;
      }
    } catch (err) {
      console.error('Failed to import data', err);
      toast.error('Failed to import data');
    }
    return false;
  };

  useEffect(() => {
    fetchSettings();
    checkSession().finally(() => setIsLoading(false));
  }, [checkSession, fetchSettings]);

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
    checkSession,
    saveEntry,
    deleteEntry,
    updateSettings,
    importData,
    refresh: fetchEntries,
  };
}
