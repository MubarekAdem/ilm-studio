import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delayMs = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<T>(data);
  latestDataRef.current = data;

  const saveFnRef = useRef(onSave);
  saveFnRef.current = onSave;

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enabled) return;

    setIsSaving(true);
    try {
      await saveFnRef.current(latestDataRef.current);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [enabled]);

  // Trigger auto-save debounce
  const markDirtyAndSchedule = useCallback(() => {
    if (!enabled) return;
    setIsDirty(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      flush();
    }, delayMs);
  }, [delayMs, enabled, flush]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    isDirty,
    lastSaved,
    markDirtyAndSchedule,
    flush,
  };
}

export default useAutoSave;
