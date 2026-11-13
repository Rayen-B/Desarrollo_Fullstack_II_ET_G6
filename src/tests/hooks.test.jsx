import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFormulario } from '../hooks/useFormulario';
import { useOverlay } from '../hooks/useOverlay';
import { useSeo } from '../hooks/useSeo';
import { useEstilos } from '../hooks/useEstilos';

const inicial = { nombre: '' };
const validar = (v) => (v.nombre ? {} : { nombre: 'El nombre es requerido' });
const evento = (name, value) => ({ target: { name, value }, preventDefault: () => {} });

describe('useFormulario', () => {
  it('parte con los valores iniciales y sin errores', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    expect(result.current.valores).toEqual({ nombre: '' });
    expect(result.current.errores).toEqual({});
  });

  it('cambiar actualiza el valor del campo', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    act(() => result.current.cambiar(evento('nombre', 'Ana')));
    expect(result.current.valores.nombre).toBe('Ana');
  });

  it('alSalir de un campo vacío muestra su error', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    act(() => result.current.alSalir(evento('nombre', '')));
    expect(result.current.errores.nombre).toBe('El nombre es requerido');
  });

  it('un campo tocado se revalida mientras se escribe', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    act(() => result.current.alSalir(evento('nombre', '')));
    act(() => result.current.cambiar(evento('nombre', 'Ana')));
    expect(result.current.errores.nombre).toBeUndefined();
  });

  it('enviar con datos inválidos devuelve false y no queda enviando', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    let resultado;
    act(() => { resultado = result.current.enviar(); });
    expect(resultado).toBe(false);
    expect(result.current.enviando).toBe(false);
    expect(result.current.errores.nombre).toBeDefined();
  });

  it('enviar con datos válidos devuelve true y queda enviando', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    act(() => result.current.cambiar(evento('nombre', 'Ana')));
    let resultado;
    act(() => { resultado = result.current.enviar(); });
    expect(resultado).toBe(true);
    expect(result.current.enviando).toBe(true);
  });

  it('al terminar el envío marca enviado, limpia el formulario y llama al callback', () => {
    vi.useFakeTimers();
    const alTerminar = vi.fn();
    const { result } = renderHook(() => useFormulario(inicial, validar));
    act(() => result.current.cambiar(evento('nombre', 'Ana')));
    act(() => { result.current.enviar(alTerminar); });
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current.enviado).toBe(true);
    expect(result.current.enviando).toBe(false);
    expect(result.current.valores).toEqual({ nombre: '' });
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('alEnviar evita la recarga de la página (preventDefault)', () => {
    const { result } = renderHook(() => useFormulario(inicial, validar));
    const e = { preventDefault: vi.fn() };
    act(() => result.current.alEnviar()(e));
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
  });
});

describe('useOverlay', () => {
  it('abierto bloquea el scroll del body', () => {
    renderHook(() => useOverlay(true, () => {}));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('cerrado no toca el scroll del body', () => {
    renderHook(() => useOverlay(false, () => {}));
    expect(document.body.style.overflow).toBe('');
  });

  it('al desmontar devuelve el scroll al body', () => {
    const { unmount } = renderHook(() => useOverlay(true, () => {}));
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('la tecla Escape cierra el panel', () => {
    const cerrar = vi.fn();
    renderHook(() => useOverlay(true, cerrar));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('otra tecla no cierra el panel', () => {
    const cerrar = vi.fn();
    renderHook(() => useOverlay(true, cerrar));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(cerrar).not.toHaveBeenCalled();
  });
});

describe('useSeo', () => {
  it('cambia el título de la pestaña', () => {
    renderHook(() => useSeo({ titulo: 'Productos' }));
    expect(document.title).toBe('Productos | Papita Dulce');
  });

  it('sin título usa el título base del sitio', () => {
    renderHook(() => useSeo({}));
    expect(document.title).toContain('Papita Dulce - Pastelería');
  });

  it('al desmontar restaura el título anterior', () => {
    document.title = 'Anterior';
    const { unmount } = renderHook(() => useSeo({ titulo: 'Productos' }));
    unmount();
    expect(document.title).toBe('Anterior');
  });

  it('crea la meta description', () => {
    renderHook(() => useSeo({ titulo: 'X', descripcion: 'Descripción de prueba' }));
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe('Descripción de prueba');
  });

  it('con noindex agrega la meta robots', () => {
    renderHook(() => useSeo({ titulo: 'Login', noindex: true }));
    expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  });

  it('al desmontar quita la meta robots que había creado', () => {
    const { unmount } = renderHook(() => useSeo({ titulo: 'Login', noindex: true }));
    unmount();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('define la URL canónica de la página', () => {
    renderHook(() => useSeo({ titulo: 'X' }));
    expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/^http/);
  });
});

describe('useEstilos', () => {
  it('inserta la hoja de estilos mientras está montado', () => {
    renderHook(() => useEstilos('body{color:red}', 'prueba'));
    expect(document.head.querySelector('style[data-estilos="prueba"]')).not.toBeNull();
  });

  it('al desmontar elimina la hoja de estilos', () => {
    const { unmount } = renderHook(() => useEstilos('body{color:red}', 'prueba'));
    unmount();
    expect(document.head.querySelector('style[data-estilos="prueba"]')).toBeNull();
  });
});
