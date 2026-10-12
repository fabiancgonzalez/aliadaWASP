"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './POS.css';
import BarcodeScanner from './BarcodeScanner';
import Ticket from './Ticket';

const money = (cents) => `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [tipoFactura, setTipoFactura] = useState('C');
  const [iva, setIva] = useState(0);
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [modalCliente, setModalCliente] = useState(false);
  const [modalScanner, setModalScanner] = useState(false);
  const [venta, setVenta] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '', direccion: '' });

  const inputRef = useRef(null);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProductos(Array.isArray(data) ? data.filter((p) => p.active) : []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const resultados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return [];
    return productos
      .filter((p) => p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.id === term)
      .slice(0, 8);
  }, [busqueda, productos]);

  const agregarAlCarrito = (producto) => {
    setMensaje(null);
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id === producto.id);
      const actual = existe ? existe.cantidad : 0;
      if (actual + 1 > producto.stock) {
        setMensaje({ tipo: 'error', texto: `Sin stock suficiente de "${producto.title}" (stock ${producto.stock}).` });
        return prev;
      }
      if (existe) return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { id: producto.id, nombre: producto.title, precio: producto.priceInCents, stock: producto.stock, cantidad: 1 }];
    });
  };

  const buscarProducto = useCallback(
    (texto) => {
      const term = texto.trim().toLowerCase();
      if (!term) return;
      const prod = productos.find((p) => p.barcode && p.barcode.toLowerCase() === term) ||
        productos.find((p) => p.id === term || p.title.toLowerCase() === term) ||
        productos.find((p) => p.title.toLowerCase().includes(term));
      if (prod) agregarAlCarrito(prod);
      else setMensaje({ tipo: 'error', texto: 'Producto no encontrado.' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productos]
  );

  const eliminarItem = (id) => setCarrito((prev) => prev.filter((i) => i.id !== id));

  const actualizarCantidad = (id, cantidad) => {
    if (!Number.isFinite(cantidad) || cantidad <= 0) return eliminarItem(id);
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: Math.min(Math.floor(cantidad), i.stock) } : i))
    );
  };

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const ivaIncluido = Math.round(total - total / (1 + iva / 100));

  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(busquedaCliente)}`);
        if (res.ok) setClientes(await res.json());
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [busquedaCliente]);

  const elegirCliente = (c) => {
    setCliente({ id: c.id, nombre: c.name, telefono: c.phone, email: c.email, direccion: c.address });
    setBusquedaCliente('');
  };

  const guardarCliente = async () => {
    if (!nuevoCliente.nombre) return alert('El nombre es obligatorio');
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nuevoCliente.nombre,
        phone: nuevoCliente.telefono,
        email: nuevoCliente.email,
        address: nuevoCliente.direccion,
      }),
    });
    if (!res.ok) return alert('No se pudo guardar el cliente');
    elegirCliente(await res.json());
    setModalCliente(false);
    setNuevoCliente({ nombre: '', telefono: '', email: '', direccion: '' });
  };

  const cobrarYFacturar = async () => {
    if (carrito.length === 0) return setMensaje({ tipo: 'error', texto: 'El carrito esta vacio.' });
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map((i) => ({ productId: i.id, quantity: i.cantidad })),
          formaPago,
          customerEmail: cliente?.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la venta.');
      setMensaje({ tipo: 'ok', texto: `Venta registrada. Total ${money(data.totalInCents)} (${formaPago}).` });
      setVenta({
        id: data.id,
        fecha: new Date().toISOString(),
        items: carrito,
        total: data.totalInCents,
        ivaIncluido,
        formaPago,
        cliente,
      });
      setCarrito([]);
      setCliente(null);
      cargarProductos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al registrar la venta.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pos-container">
      <nav className="navbar">
        <div className="logo">Aliada</div>
        <div className="nav-links">
          <a href="/admin">Admin</a>
          <a href="/admin/products">Productos</a>
          <a href="/admin/orders">Pedidos</a>
          <a href="/admin/pos" className="active">POS</a>
        </div>
      </nav>

      <header className="pos-header">
        <h1>💳 Punto de Venta</h1>
        <p>Buscá, cobrá y descontá stock en un solo paso</p>
      </header>

      <section className="busqueda-section">
        <div className="busqueda-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder={cargando ? 'Cargando productos...' : '🔍 Buscar producto por nombre o categoría...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                buscarProducto(busqueda);
                setBusqueda('');
              }
            }}
          />
          <button onClick={() => setModalScanner(true)}>📷 Iniciar Escaneo con Cámara</button>
        </div>
        {resultados.length > 0 && (
          <ul style={{ listStyle: 'none', marginTop: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={p.stock <= 0}
                  onClick={() => { agregarAlCarrito(p); setBusqueda(''); inputRef.current?.focus(); }}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 0, borderBottom: '1px solid #eee', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.5, textAlign: 'left' }}
                >
                  <span>{p.title} <small>· {p.category}</small></span>
                  <span>{money(p.priceInCents)} · stock {p.stock}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mensaje && (
        <p role="status" style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 8, background: mensaje.tipo === 'ok' ? '#e6f6ea' : '#fdeaea', color: mensaje.tipo === 'ok' ? '#1d6b34' : '#a12020' }}>
          {mensaje.texto}
        </p>
      )}

      <section className="facturacion-section">
        <h3>🧾 Datos de Facturación</h3>
        <div className="facturacion-grid">
          <div className="campo">
            <label>Cliente (opcional)</label>
            <div className="cliente-input">
              <input
                type="text"
                list="clientes-lista"
                value={cliente ? cliente.nombre : busquedaCliente}
                placeholder="Buscar cliente por nombre, teléfono o email..."
                onChange={(e) => {
                  const v = e.target.value;
                  const c = clientes.find((x) => x.name === v);
                  if (c) elegirCliente(c);
                  else setBusquedaCliente(v);
                }}
                readOnly={!!cliente}
              />
              <datalist id="clientes-lista">
                {clientes.map((c) => (
                  <option key={c.id} value={c.name}>{c.phone || c.email}</option>
                ))}
              </datalist>
              {cliente && <button onClick={() => setCliente(null)}>Quitar</button>}
              <button onClick={() => setModalCliente(true)}>+ Nuevo Cliente</button>
            </div>
          </div>

          <div className="campo">
            <label>Tipo de Factura</label>
            <div className="btn-group">
              {['A', 'B', 'C'].map((t) => (
                <button key={t} className={tipoFactura === t ? 'activo' : ''} onClick={() => setTipoFactura(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="campo">
            <label>IVA incluido</label>
            <div className="btn-group">
              {[0, 10.5, 21].map((v) => (
                <button key={v} className={iva === v ? 'activo' : ''} onClick={() => setIva(v)}>{v}%</button>
              ))}
            </div>
          </div>

          <div className="campo">
            <label>Forma de Pago</label>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Tarjeta</option>
              <option>Otro</option>
            </select>
          </div>
        </div>
      </section>

      <section className="carrito-section">
        <h3>🛒 Carrito</h3>
        <div className="total-banner">
          Total a cobrar: <span>{money(total)}</span>
          <small style={{ marginLeft: 12 }}>(IVA incluido {money(ivaIncluido)})</small>
        </div>

        <table className="tabla-carrito">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.length === 0 ? (
              <tr><td colSpan="5" className="vacio">Carrito vacío.</td></tr>
            ) : (
              carrito.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={item.stock}
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value, 10))}
                    />
                  </td>
                  <td>{money(item.precio)}</td>
                  <td>{money(item.precio * item.cantidad)}</td>
                  <td>
                    <button className="btn-eliminar" onClick={() => eliminarItem(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="carrito-acciones">
          <button className="btn-vaciar" onClick={() => setCarrito([])}>🗑️ Vaciar</button>
          <button className="btn-cobrar" onClick={cobrarYFacturar} disabled={guardando}>
            {guardando ? 'Registrando...' : '💰 Cobrar y Facturar'}
          </button>
        </div>
      </section>

      {modalCliente && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nuevo Cliente</h3>
            <input type="text" placeholder="Nombre *" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
            <input type="text" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
            <input type="email" placeholder="Email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
            <input type="text" placeholder="Dirección" value={nuevoCliente.direccion} onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
            <div className="modal-actions">
              <button onClick={guardarCliente}>Guardar Cliente</button>
              <button onClick={() => setModalCliente(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {venta && <Ticket venta={venta} onClose={() => setVenta(null)} />}

      {modalScanner && (
        <div className="modal-overlay">
          <div className="modal scanner-modal">
            <h3>📷 Escanear Código</h3>
            <p>Apuntá la cámara al código del producto.</p>
            <BarcodeScanner
              onScanSuccess={(codigo) => {
                buscarProducto(codigo);
                setModalScanner(false);
              }}
            />
            <button onClick={() => setModalScanner(false)} style={{ width: '100%', marginTop: '12px' }}>Cerrar</button>
          </div>
        </div>
      )}

      <footer className="footer">Aliada. Todos los derechos reservados.</footer>
    </div>
  );
}
