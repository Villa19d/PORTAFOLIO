import { useEffect, useState } from 'react';
import cvSnapshot from '../../data/cv.snapshot.json';
import { fetchApi } from '../../lib/api';

export interface CvDocument {
  url: string;
  fileName: string;
  updatedAt: string;
}

export interface CvState {
  es: CvDocument | null;
  en: CvDocument | null;
}

export type CvStatus = 'loading' | 'ready' | 'error';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedCv: CvState | null = null;
let cachedAt = 0;
let pending: Promise<CvState> | null = null;

function snapshot(): CvState {
  return cvSnapshot;
}

function loadCv(): Promise<CvState> {
  const now = Date.now();
  if (cachedCv && now - cachedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedCv);
  }

  if (!pending) {
    pending = fetchApi<CvState>('/api/cv')
      .then((data) => {
        cachedCv = data;
        cachedAt = Date.now();
        return data;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}

export function useCv() {
  const [cv, setCv] = useState<CvState>(() => cachedCv ?? snapshot());
  const [status, setStatus] = useState<CvStatus>(() => (cachedCv ? 'ready' : 'loading'));

  useEffect(() => {
    if (cachedCv) {
      setCv(cachedCv);
      setStatus('ready');
      return;
    }

    let active = true;
    loadCv()
      .then((data) => {
        if (!active) return;
        setCv(data);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return { cv, status };
}
