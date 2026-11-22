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
  // Ninguna prueba debe llamar a un servidor real: por defecto el backend "no responde" (promesa que nunca termina).
  // Las pruebas de nutrición reemplazan este fetch con respuestas simuladas.
  globalThis.fetch = vi.fn(() => new Promise(() => {}));
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.print = vi.fn();
  window.confirm = vi.fn(() => true);
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = globalThis.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  // ProseMirror (el motor del editor Tiptap) usa APIs de medidas que jsdom no implementa
  const sinMedidas = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() {} };
  Range.prototype.getBoundingClientRect = () => sinMedidas;
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* vacio() {} });
  document.elementFromPoint = document.elementFromPoint || (() => null);
});

afterEach(() => {
  limpiarRenders();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs(); // las pruebas de modo servidor activan VITE_MODO_SERVIDOR; no debe filtrarse a las demás
});
