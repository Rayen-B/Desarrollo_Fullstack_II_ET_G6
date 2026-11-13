import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Inicio from '../pages/Inicio';
import Chefs from '../components/secciones/Chefs';
import Horarios from '../components/secciones/Horarios';
import Boletin from '../components/secciones/Boletin';
import Reservacion, { validarReserva } from '../components/secciones/Reservacion';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';

const conProviders = (ui) => (
  <MemoryRouter>
    <AuthProvider><CartProvider><TiendaProvider>{ui}</TiendaProvider></CartProvider></AuthProvider>
  </MemoryRouter>
);

// true si el elemento "a" aparece antes que "b" en la página
const estaAntesQue = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('Orden de las secciones en la página de inicio', () => {
  const abrirInicio = () => render(conProviders(<Inicio />)).container;

  it('las reservas van debajo de los comentarios de los clientes', () => {
    const c = abrirInicio();
    expect(estaAntesQue(c.querySelector('#testimonials'), c.querySelector('#reservation'))).toBe(true);
  });

  it('el equipo de cocina va antes que los horarios, y los horarios antes que las reseñas', () => {
    const c = abrirInicio();
    expect(estaAntesQue(c.querySelector('#chefs'), c.querySelector('#hours'))).toBe(true);
    expect(estaAntesQue(c.querySelector('#hours'), c.querySelector('#testimonials'))).toBe(true);
  });

  it('el blog va antes que la suscripción y la suscripción antes que el contacto', () => {
    const c = abrirInicio();
    expect(estaAntesQue(c.querySelector('#blog'), c.querySelector('#newsletter'))).toBe(true);
    expect(estaAntesQue(c.querySelector('#newsletter'), c.querySelector('#contact-section'))).toBe(true);
  });

  it('los paneles siguen el mismo orden que PAPITA_REACT', () => {
    const c = abrirInicio();
    const orden = ['hero', 'category', 'about', 'menu', 'gallery', 'history', 'chefs', 'hours', 'testimonials', 'reservation', 'blog', 'newsletter', 'contact-section'];
    const paneles = orden.map((id) => c.querySelector('#' + id));
    expect(paneles.every(Boolean)).toBe(true);
    paneles.slice(1).forEach((panel, i) => {
      expect(estaAntesQue(paneles[i], panel)).toBe(true);
    });
  });

  it('cada sección aparece una sola vez', () => {
    const c = abrirInicio();
    expect(c.querySelectorAll('#reservation')).toHaveLength(1);
    expect(c.querySelectorAll('#chefs')).toHaveLength(1);
    expect(c.querySelectorAll('#hours')).toHaveLength(1);
    expect(c.querySelectorAll('#newsletter')).toHaveLength(1);
    expect(c.querySelectorAll('#entregas')).toHaveLength(1);
    expect(c.querySelectorAll('#about')).toHaveLength(1);
    expect(c.querySelectorAll('#contact-section')).toHaveLength(1);
  });

  it('la página de inicio sigue teniendo un solo h1 (SEO)', () => {
    const c = abrirInicio();
    expect(c.querySelectorAll('h1')).toHaveLength(1);
  });
});

describe('Chefs', () => {
  it('muestra el título de la sección', () => {
    render(<Chefs />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Chefs');
  });

  it('muestra los 4 integrantes del equipo', () => {
    render(<Chefs />);
    expect(screen.getByText('Ramon Perez')).toBeTruthy();
    expect(screen.getByText('Johnny Bravo')).toBeTruthy();
    expect(screen.getByText('Pepito Clavito')).toBeTruthy();
    expect(screen.getByText('Carlos Lopez')).toBeTruthy();
  });

  it('muestra el rol y la experiencia de cada chef', () => {
    render(<Chefs />);
    expect(screen.getByText('Jefe de cocina')).toBeTruthy();
    expect(screen.getByText('12 años de experiencia')).toBeTruthy();
  });

  it('los enlaces a redes sociales se abren en otra pestaña de forma segura', () => {
    render(<Chefs />);
    const instagram = screen.getAllByRole('link', { name: 'Instagram' })[0];
    expect(instagram.getAttribute('target')).toBe('_blank');
    expect(instagram.getAttribute('rel')).toContain('noopener');
  });
});

describe('Horarios y entregas', () => {
  it('muestra los días de atención', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByText('Viernes')).toBeTruthy();
    expect(screen.getByText('Domingo')).toBeTruthy();
  });

  it('lunes y martes aparecen como cerrado', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByText('Cerrado')).toBeTruthy();
  });

  it('muestra el horario del viernes', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByText('09:00 AM - 11:00 PM')).toBeTruthy();
  });

  it('muestra la entrega online en 25 minutos', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByText(/25 minutos/)).toBeTruthy();
  });

  it('el botón "Ordenar Ahora" lleva a /productos', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByRole('link', { name: 'Ordenar Ahora' }).getAttribute('href')).toBe('/productos');
  });

  it('muestra dirección, teléfono y correo', () => {
    render(conProviders(<Horarios />));
    expect(screen.getByText('+56 9 1234 5678')).toBeTruthy();
    expect(screen.getByText('papitadulce@gmail.com')).toBeTruthy();
  });
});

describe('Boletín (suscripción)', () => {
  const correoInput = () => screen.getByPlaceholderText(/dirección de correo/i);

  it('el botón empieza diciendo "Suscríbete"', () => {
    render(<Boletin />);
    expect(screen.getByRole('button', { name: /suscríbete/i })).toBeTruthy();
  });

  it('con el campo vacío no se suscribe', () => {
    render(<Boletin />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('¡Suscrito!')).toBeNull();
  });

  it('con un correo sin @ no se suscribe', () => {
    render(<Boletin />);
    fireEvent.change(correoInput(), { target: { value: 'correo-sin-arroba' } });
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('¡Suscrito!')).toBeNull();
  });

  it('con un correo válido muestra "¡Suscrito!" y limpia el campo', () => {
    render(<Boletin />);
    fireEvent.change(correoInput(), { target: { value: 'ana@correo.cl' } });
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('¡Suscrito!')).toBeTruthy();
    expect(correoInput().value).toBe('');
  });

  it('a los 3 segundos el botón pasa a decir "Suscribirse"', () => {
    vi.useFakeTimers();
    render(<Boletin />);
    fireEvent.change(correoInput(), { target: { value: 'ana@correo.cl' } });
    fireEvent.click(screen.getByRole('button'));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByRole('button', { name: 'Suscribirse' })).toBeTruthy();
  });
});

describe('Reservación', () => {
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const valida = { nombre: 'Ana Pérez', telefono: '+56 9 1234 5678', correo: 'ana@correo.cl', fecha: manana };

  it('validarReserva no devuelve errores con datos correctos', () => {
    expect(validarReserva(valida)).toEqual({});
  });

  it('validarReserva exige nombre, teléfono, correo y fecha', () => {
    const errores = validarReserva({ nombre: '', telefono: '', correo: '', fecha: '' });
    expect(errores.nombre).toBeDefined();
    expect(errores.telefono).toBeDefined();
    expect(errores.correo).toBeDefined();
    expect(errores.fecha).toBeDefined();
  });

  it('validarReserva rechaza una fecha pasada', () => {
    expect(validarReserva({ ...valida, fecha: '2000-01-01' }).fecha).toContain('hoy');
  });

  it('validarReserva rechaza un nombre con números', () => {
    expect(validarReserva({ ...valida, nombre: 'Ana 123' }).nombre).toBeDefined();
  });

  it('muestra el formulario con el botón de confirmar', () => {
    render(<Reservacion />);
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeTruthy();
  });

  it('enviar vacío muestra los errores y no confirma la reserva', () => {
    const { container } = render(<Reservacion />);
    fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    expect(screen.getAllByRole('alert').length).toBe(4);
    expect(container.querySelector('#resOk').style.display).not.toBe('block');
  });

  it('al salir de un campo vacío muestra su error', () => {
    render(<Reservacion />);
    const nombre = screen.getByPlaceholderText('Juan Perez');
    fireEvent.blur(nombre);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('con datos válidos confirma la reserva tras el envío', () => {
    vi.useFakeTimers();
    const { container } = render(<Reservacion />);
    fireEvent.change(screen.getByPlaceholderText('Juan Perez'), { target: { name: 'nombre', value: valida.nombre } });
    fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { name: 'telefono', value: valida.telefono } });
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { name: 'correo', value: valida.correo } });
    fireEvent.change(container.querySelector('input[name="fecha"]'), { target: { name: 'fecha', value: valida.fecha } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(container.querySelector('#resOk').style.display).toBe('block');
  });
});
