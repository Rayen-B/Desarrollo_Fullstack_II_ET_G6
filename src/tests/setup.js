import { afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest'; // matchers extra: toBeInTheDocument(), toHaveTextContent()...
import { limpiarRenders } from './utils';

// Entorno de pruebas: React 18 en modo "act", localStorage limpio y sin animaciones de scroll
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock de la librería de animaciones (no aporta nada a las pruebas)
vi.mock('aos', () => ({ default: { init: vi.fn(), refreshHard: vi.fn(), refresh: vi.fn() } }));

// jsdom no implementa estas APIs del navegador: se simulan para que los componentes no fallen
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.print = vi.fn();
  window.confirm = vi.fn(() => true);
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = globalThis.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
});

afterEach(() => {
  limpiarRenders();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
