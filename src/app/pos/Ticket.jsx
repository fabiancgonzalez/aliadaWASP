"use client";

import React, { useEffect } from 'react';

const money = (cents) =>
  (cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export default function Ticket({ venta, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="modal-overlay ticket-overlay">
      <div className="modal">
        <div id="ticket-print" className="ticket">
          <div className="ticket-center">
            <strong className="ticket-title">Aliada</strong>
            <div>Ticket #{venta.id.slice(0, 8).toUpperCase()}</div>
            <div>{new Date(venta.fecha).toLocaleString('es-AR')}</div>
          </div>
          <hr />
          {venta.cliente?.nombre ? <div>Cliente: {venta.cliente.nombre}</div> : null}
          {venta.items.map((i) => (
            <div key={i.id} className="ticket-item">
              <div>{i.nombre}</div>
              <div className="ticket-row">
                <span>{i.cantidad} x {money(i.precio)}</span>
                <span>{money(i.cantidad * i.precio)}</span>
              </div>
            </div>
          ))}
          <hr />
          {venta.ivaIncluido > 0 ? (
            <div className="ticket-row"><span>IVA incluido</span><span>{money(venta.ivaIncluido)}</span></div>
          ) : null}
          <div className="ticket-row ticket-total"><span>TOTAL</span><span>{money(venta.total)}</span></div>
          <div className="ticket-row"><span>Pago</span><span>{venta.formaPago}</span></div>
          <hr />
          <div className="ticket-center">¡Gracias por su compra!</div>
        </div>
        <div className="ticket-actions">
          <button onClick={() => window.print()}>🖨️ Imprimir</button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
