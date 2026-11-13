import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Boton from '../components/atoms/Boton';
import ErrorCampo from '../components/atoms/ErrorCampo';
import EtiquetaPrecio from '../components/atoms/EtiquetaPrecio';
import InsigniaEstado from '../components/atoms/InsigniaEstado';
import FeedbackCampo, { claseValidacion } from '../components/atoms/FeedbackCampo';
import BotonVolverArriba from '../components/atoms/BotonVolverArriba';

describe('Boton', () => {
  it('muestra el texto que recibe', () => {
    render(<Boton>Guardar</Boton>);
    expect(screen.getByText('Guardar')).toBeTruthy();
  });

  it('por defecto es de tipo button y no está deshabilitado', () => {
    render(<Boton>Guardar</Boton>);
    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton.getAttribute('type')).toBe('button');
    expect(boton.disabled).toBe(false);
  });

  it('ejecuta onClick al hacer clic', () => {
    const onClick = vi.fn(); // mock
    render(<Boton onClick={onClick}>Guardar</Boton>);
    fireEvent.click(screen.getByText('Guardar'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta onClick si está deshabilitado', () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick} disabled>Guardar</Boton>);
    fireEvent.click(screen.getByText('Guardar'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica la variante de Bootstrap recibida', () => {
    render(<Boton variant="danger">Borrar</Boton>);
    expect(screen.getByText('Borrar').className).toContain('btn-danger');
  });
});

describe('ErrorCampo', () => {
  it('no muestra nada si no hay mensaje', () => {
    const { container } = render(<ErrorCampo />);
    expect(container.firstChild).toBeNull();
  });

  it('no muestra nada si el mensaje es un string vacío', () => {
    const { container } = render(<ErrorCampo mensaje="" />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el mensaje como alerta accesible', () => {
    render(<ErrorCampo mensaje="Dato inválido" />);
    expect(screen.getByRole('alert').textContent).toBe('Dato inválido');
  });
});

describe('EtiquetaPrecio', () => {
  it('formatea el monto en pesos chilenos', () => {
    render(<EtiquetaPrecio monto={16000} />);
    expect(screen.getByText(/16\.000/)).toBeTruthy();
  });

  it('muestra $0 si el monto es undefined', () => {
    render(<EtiquetaPrecio />);
    expect(screen.getByText(/\$\s?0/)).toBeTruthy();
  });

  it('muestra $0 si el monto es null', () => {
    render(<EtiquetaPrecio monto={null} />);
    expect(screen.getByText(/\$\s?0/)).toBeTruthy();
  });

  it('agrega la clase extra recibida', () => {
    const { container } = render(<EtiquetaPrecio monto={100} className="text-danger" />);
    expect(container.querySelector('span').className).toContain('text-danger');
  });
});

describe('InsigniaEstado', () => {
  it('muestra "Agotado" cuando el stock es 0', () => {
    render(<InsigniaEstado stock={0} />);
    expect(screen.getByText('Agotado')).toBeTruthy();
  });

  it('muestra "Agotado" cuando el stock es negativo', () => {
    render(<InsigniaEstado stock={-3} />);
    expect(screen.getByText('Agotado')).toBeTruthy();
  });

  it('muestra "Stock Crítico" cuando el stock está en el límite', () => {
    render(<InsigniaEstado stock={5} stockCritico={5} />);
    expect(screen.getByText('Stock Crítico (5)')).toBeTruthy();
  });

  it('muestra "En Stock" cuando el stock supera el crítico', () => {
    render(<InsigniaEstado stock={20} stockCritico={5} />);
    expect(screen.getByText('En Stock (20)')).toBeTruthy();
  });

  it('muestra el color de cada rol', () => {
    render(<InsigniaEstado estado="Administrador" />);
    expect(screen.getByText('Administrador').className).toContain('bg-danger');
  });

  it('muestra el estado "Pendiente" con color de advertencia', () => {
    render(<InsigniaEstado estado="Pendiente" />);
    expect(screen.getByText('Pendiente').className).toContain('bg-warning');
  });

  it('un estado desconocido se muestra tal cual con color secundario', () => {
    render(<InsigniaEstado estado="Otro estado" />);
    expect(screen.getByText('Otro estado').className).toContain('bg-secondary');
  });
});

describe('FeedbackCampo y claseValidacion', () => {
  it('no muestra nada si no hay resultado', () => {
    const { container } = render(<FeedbackCampo />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el mensaje en verde cuando es válido', () => {
    render(<FeedbackCampo resultado={{ valido: true, mensaje: 'Correcto' }} />);
    expect(screen.getByText('Correcto').className).toContain('success');
  });

  it('muestra el mensaje en rojo cuando es inválido', () => {
    render(<FeedbackCampo resultado={{ valido: false, mensaje: 'Incorrecto' }} />);
    expect(screen.getByText('Incorrecto').className).toContain('error');
  });

  it('claseValidacion devuelve is-valid o is-invalid', () => {
    expect(claseValidacion({ valido: true })).toBe(' is-valid');
    expect(claseValidacion({ valido: false })).toBe(' is-invalid');
  });

  it('claseValidacion devuelve string vacío sin resultado', () => {
    expect(claseValidacion(undefined)).toBe('');
    expect(claseValidacion(null)).toBe('');
  });
});

describe('BotonVolverArriba', () => {
  it('empieza oculto (sin la clase show)', () => {
    const { container } = render(<BotonVolverArriba />);
    expect(container.querySelector('#btt').className).toBe('');
  });

  it('aparece al hacer scroll más abajo de 300px', () => {
    const { container } = render(<BotonVolverArriba />);
    window.scrollY = 500;
    fireEvent.scroll(window);
    expect(container.querySelector('#btt').className).toBe('show');
  });

  it('vuelve a ocultarse al subir de nuevo', () => {
    const { container } = render(<BotonVolverArriba />);
    window.scrollY = 500;
    fireEvent.scroll(window);
    window.scrollY = 10;
    fireEvent.scroll(window);
    expect(container.querySelector('#btt').className).toBe('');
  });

  it('al hacer clic sube al inicio de la página', () => {
    const { container } = render(<BotonVolverArriba />);
    fireEvent.click(container.querySelector('#btt'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
