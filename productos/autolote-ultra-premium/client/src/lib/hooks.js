import { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

// Nivel del dispositivo para decidir la calidad del 3D: 'none' (sin WebGL), 'low' o 'high'.
export function detectDeviceTier() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'none';
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const saveData = navigator.connection?.saveData;
    if (saveData) return 'none';
    if (cores <= 4 || mem <= 4 || small) return 'low';
    return 'high';
  } catch {
    return 'none';
  }
}

// Agrega la clase .in cuando el elemento entra en pantalla (una sola vez).
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

export function useScrolled(threshold = 24) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > threshold);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return s;
}

export function useFormStart() {
  const t = useRef(Date.now());
  return t.current;
}

export function useLocalList(key, max = 3) {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [key, list]);
  const toggle = (id) => setList((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= max ? l : [...l, id]));
  return [list, toggle, setList];
}
