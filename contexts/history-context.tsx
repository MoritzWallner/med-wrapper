import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ChatMessage } from '@/hooks/use-chat';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  chatArray: ChatMessage[];
  imageUri?: string;
}

interface HistoryContextValue {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id'>) => string;
  updateEntry: (id: string, chatArray: ChatMessage[]) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    setEntries((prev) => [{ ...entry, id }, ...prev]);
    return id;
  }, []);

  const updateEntry = useCallback((id: string, chatArray: ChatMessage[]) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, chatArray } : e))
    );
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, addEntry, updateEntry }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}
