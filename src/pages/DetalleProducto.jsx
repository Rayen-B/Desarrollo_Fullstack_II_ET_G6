import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import { obtenerProducto } from '../services/db';
import { useSeo } from '../hooks/useSeo';
import { useTienda } from '../context/TiendaContext';
import EtiquetaPrecio from '../components/atoms/EtiquetaPrecio';
import InsigniaEstado from '../components/atoms/InsigniaEstado';
import { useCart } from '../context/CartContext';
import images from '../assets/images';
import { obtenerImagen } from '../assets/images';
import { disponiblePorFactor, FACTOR_TROZO } from '../utils/stock';

export default function DetalleProducto() {
  const { id } = useParams();
  const { carrito } = useCart();
  const { abrirCarrito, agregarConStock, maximoPara, insumos, recargarCatalogo } = useTienda();
  const [producto, setProducto] = useState(null);
  const [variante, setVariante] = useState('entera');
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    recargarCatalogo();
    setProducto(obtenerProducto(id));
    setCantidad(1);
  }, [id, recargarCatalogo]);

  useSeo({
    titulo: producto ? producto.nombre : 'Producto no encontrado',
    descripcion: producto ? `${producto.descripcion} Compra ${producto.nombre} online en Papita Dulce.` : undefined
  });

  if (!producto) {
    return (
      <Container className="py-5 text-center">
        <h1 className="stitle mb-3">Producto no encontrado</h1>
        <Link to="/productos" className="btn-red">
          <i className="fas fa-utensils me-1"></i> Volver a los productos
        </Link>
      </Container>
    );
  }

  const esTorta = producto.categoria === 'Tortas';
  const factor = esTorta && variante === 'trozo' ? FACTOR_TROZO : 1;
  // Stock de la presentación elegida y lo que aún se puede agregar descontando el carrito
  const disponible = disponiblePorFactor(producto, insumos, factor);
  const maximo = Math.max(0, maximoPara(producto.codigo, factor));
  const enCarrito = carrito.filter((i) => i.codigo === producto.codigo && (i.variante || 'entera') === (esTorta ? variante : 'entera')).reduce((t, i) => t + i.cantidad, 0);
  const precioUnitario = esTorta && variante === 'trozo' ? Math.round(producto.precio * 0.25) : producto.precio;
  const precioTotal = precioUnitario * cantidad;

  return (
    <Container className="py-5">
      <Link to="/productos" className="btn-red btn-sm mb-4 d-inline-flex align-items-center gap-1">
        <i className="fas fa-arrow-left"></i> Volver al Catálogo
      </Link>

      <Row className="gy-4 align-items-center">
        <Col md={6}>
          <img
            src={obtenerImagen(producto.imagen)}
            alt={producto.nombre}
            className="img-fluid rounded-4 shadow-sm w-100"
            style={{ maxHeight: '450px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = images['imgc1'];
            }}
          />
        </Col>
        <Col md={6}>
          <span className="slbl mb-2">{producto.categoria}</span>
          <h1 className="stitle text-start mb-3" style={{ fontSize: '2.5rem' }}>{producto.nombre}</h1>
          <p className="sdesc mb-4" style={{ margin: 0 }}>{producto.descripcion}</p>

          <div className="mb-4">
            <InsigniaEstado stock={disponible} stockCritico={factor === 1 ? producto.stockCritico : undefined} />
            {variante === 'trozo' && esTorta && <small className="text-muted ms-2">trozos disponibles</small>}
          </div>

          <Card className="border-0 rounded-4 p-4 mb-4" style={{ background: '#fff6ef', border: '1px solid #fae7da' }}>
            {esTorta && (
              <Form.Group className="mb-3">
                <Form.Label className="flbl">Variante de Producto</Form.Label>
                <Form.Select className="fctrl" value={variante} onChange={(e) => { setVariante(e.target.value); setCantidad(1); }}>
                  <option value="entera">Torta Completa ({new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(producto.precio)})</option>
                  <option value="trozo">Trozo individual ({new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(producto.precio * 0.25))})</option>
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="flbl">Cantidad</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <button type="button" className="btn-red btn-sm px-3" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>
                  -
                </button>
                <span className="fw-bold fs-5">{cantidad}</span>
                <button type="button" className="btn-red btn-sm px-3" disabled={cantidad >= maximo}
                  onClick={() => setCantidad(Math.min(maximo, cantidad + 1))}>
                  +
                </button>
              </div>
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
              <span className="fw-bold text-muted">Subtotal:</span>
              <EtiquetaPrecio monto={precioTotal} className="fs-3 fw-bold" style={{ color: '#894530' }} />
            </div>
          </Card>

          <button
            type="button"
            className="btn-red w-100 justify-content-center py-3 fs-6"
            disabled={maximo <= 0}
            onClick={() => { agregarConStock(producto, esTorta ? variante : 'entera', Math.min(cantidad, maximo)); setCantidad(1); abrirCarrito(); }}
          >
            <i className="fas fa-shopping-bag me-2"></i> {disponible <= 0 ? 'Agotado' : maximo <= 0 ? 'Ya tienes todo el stock en tu carrito' : 'Agregar al Carrito'}
          </button>
          {enCarrito > 0 && maximo > 0 && <p className="small text-muted mt-2 mb-0 text-center">Ya tienes {enCarrito} en tu carrito · puedes agregar {maximo} más.</p>}
        </Col>
      </Row>
    </Container>
  );
}
