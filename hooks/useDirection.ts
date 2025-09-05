"use client";
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { getDictionary } from '../lib/i18n/dictionaries';
import type { DictionaryHook } from '@/types/dictionary.types';

export function useDictionary(): DictionaryHook {
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [dictionary, setDictionary] = useState < any > (null);
  const [loading, setLoading] = useState < boolean > (true);
  const [error, setError] = useState < any > (null);

  useEffect(() => {
    async function loadDictionary(): Promise<void> {
      try {
        setLoading(true);
        setError(null);
        const dict = await getDictionary(locale);
        setDictionary(dict);
      } catch (err) {
        console.error('Failed to load dictionary:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (locale) {
      loadDictionary();
    }
  }, [locale]);

  // Helper function for accessing nested translations
  const t = (key: string): string => {
    if (!dictionary) return key;
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], dictionary) || key;
  };

  return {
    dictionary,
    loading,
    error,
    t,
    locale
  };
}