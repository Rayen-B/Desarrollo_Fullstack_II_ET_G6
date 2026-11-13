import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CampoTexto from '../components/molecules/CampoTexto';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import TarjetaProducto from '../components/molecules/TarjetaProducto';
import ItemCarrito from '../components/molecules/ItemCarrito';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';

const producto = { codigo: 'TC001', nombre: 'Torta Panqueque', categoria: 'Tortas', precio: 16000, precioAnterior: 20000, stock: 5, descripcion: 'Rica torta', imagen: 'menu/Torta_Trufa' };

describe('CampoTexto', () => {
  it('asocia la etiqueta con el campo', () => {
    render(<CampoTexto id="nombre" label="Nombre" />);
    expect(screen.getByLabelText('Nombre')).toBeTruthy();
  });

  it('agrega un asterisco si el campo es requerido', () => {
    render(<CampoTexto id="nombre" label="Nombre" requerido />);
    expect(screen.getByText('Nombre *')).toBeTruthy();
  });

  it('sin error no muestra alerta y aria-invalid es false', () => {
    render(<CampoTexto id="nombre" label="Nombre" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('false');
  });

  it('con error muestra el mensaje y marca el campo como inválido', () => {
    render(<CampoTexto id="nombre" label="Nombre" error="Falta el nombre" />);
    expect(screen.getByRole('alert').textContent).toBe('Falta el nombre');
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Nombre').className).toContain('is-invalid');
  });

  it('con error enlaza el campo con su mensaje (aria-describedby)', () => {
    render(<CampoTexto id="nombre" label="Nombre" error="Falta" />);
    expect(screen.getByLabelText('Nombre').getAttribute('aria-describedby')).toBe('nombre-error');
  });

  it('avisa los cambios que escribe el usuario', () => {
    const onChange = vi.fn();
    render(<CampoTexto id="nombre" label="Nombre" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('puede renderizarse como textarea', () => {
    render(<CampoTexto id="msg" label="Mensaje" as="textarea" />);
    expect(screen.getByLabelText('Mensaje').tagName).toBe('TEXTAREA');
  });

  it('puede renderizarse como select con opciones', () => {
    render(
      <CampoTexto id="asunto" label="Asunto" as="select">
        <option value="a">Consulta</option>
      </CampoTexto>
    );
    expect(screen.getByLabelText('Asunto').tagName).toBe('SELECT');
    expect(screen.getByText('Consulta')).toBeTruthy();
  });
});

describe('EncabezadoSeccion', () => {
  it('por defecto el título es un h1', () => {
    render(<EncabezadoSeccion titulo="Nuestros productos" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nuestros productos' })).toBeTruthy();
  });

  it('con nivel 2 el título es un h2', () => {
    render(<EncabezadoSeccion titulo="Destacados" nivel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Destacados' })).toBeTruthy();
  });

  it('muestra etiqueta y descripción solo si se entregan', () => {
    render(<EncabezadoSeccion titulo="Blog" etiqueta="Novedades" descripcion="Lo último" />);
    expect(screen.getByText('Novedades')).toBeTruthy();
    expect(screen.getByText('Lo último')).toBeTruthy();
  });

  it('sin etiqueta ni descripción no las renderiza', () => {
    const { container } = render(<EncabezadoSeccion titulo="Blog" />);
    expect(container.querySelector('.slbl')).toBeNull();
    expect(container.querySelector('.sdesc')).toBeNull();
  });
});

describe('TarjetaProducto', () => {
  it('muestra nombre, categoría y descripción', () => {
    render(<MemoryRouter><TarjetaProducto producto={producto} /></MemoryRouter>);
    expect(screen.getByText('Torta Panqueque')).toBeTruthy();
    expect(screen.getByText('Tortas')).toBeTruthy();
    expect(screen.getByText('Rica torta')).toBeTruthy();
  });

  it('muestra el porcentaje de descuento cuando hay oferta', () => {
    render(<MemoryRouter><TarjetaProducto producto={producto} /></MemoryRouter>);
    expect(screen.getByText(/-20%/)).toBeTruthy();
  });

  it('no muestra descuento si no hay precio anterior', () => {
    render(<MemoryRouter><TarjetaProducto producto={{ ...producto, precioAnterior: 0 }} /></MemoryRouter>);
    expect(screen.queryByText(/-20%/)).toBeNull();
  });

  it('enlaza al detalle del producto', () => {
    render(<MemoryRouter><TarjetaProducto producto={producto} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Torta Panqueque' }).getAttribute('href')).toBe('/producto/TC001');
  });

  it('sin onAgregar no muestra el botón de agregar', () => {
    render(<MemoryRouter><TarjetaProducto producto={producto} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: /agregar/i })).toBeNull();
  });

  it('llama a onAgregar con el producto al hacer clic', () => {
    const onAgregar = vi.fn();
    render(<MemoryRouter><TarjetaProducto producto={producto} onAgregar={onAgregar} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    expect(onAgregar).toHaveBeenCalledWith(producto);
  });

  it('con stock 0 muestra "Agotado" y bloquea el botón', () => {
    render(<MemoryRouter><TarjetaProducto producto={{ ...producto, stock: 0 }} onAgregar={() => {}} /></MemoryRouter>);
    expect(screen.getByText('Agotado')).toBeTruthy();
    expect(screen.getByRole('button', { name: /agregar/i }).disabled).toBe(true);
  });

  it('con stock negativo también queda agotado', () => {
    render(<MemoryRouter><TarjetaProducto producto={{ ...producto, stock: -1 }} onAgregar={() => {}} /></MemoryRouter>);
    expect(screen.getByText('Agotado')).toBeTruthy();
  });

  it('la imagen también enlaza al detalle del producto', () => {
    render(<MemoryRouter><TarjetaProducto producto={producto} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Ver detalle de Torta Panqueque' }).getAttribute('href')).toBe('/producto/TC001');
  });
});

describe('ItemCarrito', () => {
  const item = { id: 'TC001', nombre: 'Torta Panqueque', precio: 16000, imagen: 'menu/Torta_Trufa', variante: 'entera', cantidad: 2 };

  it('muestra nombre, precio y cantidad', () => {
    render(<CartProvider><TiendaProvider><ItemCarrito item={item} /></TiendaProvider></CartProvider>);
    expect(screen.getByText('Torta Panqueque')).toBeTruthy();
    expect(screen.getByText('$16.000')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('tiene botones para aumentar, disminuir y eliminar', () => {
    render(<CartProvider><TiendaProvider><ItemCarrito item={item} /></TiendaProvider></CartProvider>);
    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar Torta Panqueque' })).toBeTruthy();
  });
});
