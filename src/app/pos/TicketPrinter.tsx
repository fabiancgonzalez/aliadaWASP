import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer?: { name: string };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
  payments: Array<{
    paymentMethod: string;
    amount: number;
  }>;
}

interface TicketPrinterProps {
  order: Order;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
  onClose: () => void;
}

export function TicketPrinter({ order, tenantName, tenantAddress, tenantPhone, onClose }: TicketPrinterProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket-${order.orderNumber}`,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Vista Previa del Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Ticket (80mm de ancho) */}
        <div
          ref={componentRef}
          className="bg-white p-4 mx-auto"
          style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px' }}
        >
          {/* Header */}
          <div className="text-center mb-4 border-b border-dashed pb-4">
            <div className="font-bold text-lg">{tenantName}</div>
            {tenantAddress && <div className="text-xs">{tenantAddress}</div>}
            {tenantPhone && <div className="text-xs">Tel: {tenantPhone}</div>}
            <div className="text-xs mt-2">
              Ticket: {order.orderNumber}
            </div>
            <div className="text-xs">
              {new Date(order.createdAt).toLocaleString('es-MX')}
            </div>
          </div>

          {/* Cliente */}
          {order.customer && (
            <div className="mb-3 text-xs">
              <div className="font-semibold">Cliente:</div>
              <div>{order.customer.name}</div>
            </div>
          )}

          {/* Productos */}
          <div className="mb-3">
            <div className="border-b border-dashed pb-1 mb-2 font-semibold">
              Productos
            </div>
            {(order.items ?? []).map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-gray-600">
                      {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold">${Number(item.lineTotal).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="border-t border-dashed pt-2 mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Subtotal:</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span>Descuento:</span>
                <span>-${Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs mb-1">
              <span>IVA:</span>
              <span>${Number(order.taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-dashed pt-2 mt-2">
              <span>TOTAL:</span>
              <span>${Number(order.grandTotal).toFixed(2)}</span>
            </div>
          </div>

          {/* Pagos */}
          <div className="border-t border-dashed pt-2 mb-3 text-xs">
            <div className="font-semibold mb-1">Pagos:</div>
            {(order.payments ?? []).map((payment, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="capitalize">{payment.paymentMethod}:</span>
                <span>${Number(payment.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* QR Code */}
          <div className="text-center mb-3">
            <QRCodeSVG
              value={order.id}
              size={80}
              level="M"
            />
            <div className="text-xs mt-2">Escanea para verificar</div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs border-t border-dashed pt-2">
            <div>¡Gracias por su compra!</div>
            <div className="mt-1">Vuelva pronto</div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
          >
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}