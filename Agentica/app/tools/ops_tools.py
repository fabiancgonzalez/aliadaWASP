import os
import uuid
import base64
import mercadopago
from langchain_core.tools import tool
from sqlalchemy import select, desc
from app.database import AsyncSessionLocal, Order, OrderItem, StickerSubmission

# --- SKILLS DEL AGENTE 3: PRE-IMPRESIÓN (CONTROL TÉCNICO) ---

@tool
async def revisar_ultimos_stickers_enviados(email_cliente: str = "") -> str:
    """Consulta los archivos subidos por clientes en 'sticker_submissions' y valida formato y peso."""
    async with AsyncSessionLocal() as session:
        stmt = select(StickerSubmission).order_by(desc(StickerSubmission.created_at)).limit(5)
        if email_cliente:
            stmt = stmt.where(StickerSubmission.email.ilike(f"%{email_cliente}%"))
        
        result = await session.execute(stmt)
        envios = result.scalars().all()
        
        if not envios:
            return "No se encontraron envíos de stickers personalizados para esa consulta."
        
        formatos_aptos = {"image/png", "image/svg+xml", "application/pdf", "image/webp"}
        reportes = []
        for s in envios:
            es_apto = s.content_type in formatos_aptos
            estado_tecnico = "APTO PARA IMPRESIÓN" if es_apto else "REVISAR FORMATO (Se sugiere PNG transparente o PDF vectorial)"
            # Estimación aproximada del tamaño del archivo en KB desde base64
            peso_kb = (len(s.data) * 3) / 4 / 1024
            reportes.append(
                f"- ID Envío: {s.id} | Cliente: {s.name} ({s.email}) | Archivo: {s.file_name} "
                f"({s.content_type}, ~{peso_kb:.1f} KB) | Nota cliente: '{s.message}' | Diagnóstico: {estado_tecnico}"
            )
        return "\n".join(reportes)

@tool
def calcular_plancha_stickers(ancho_cm: float, alto_cm: float, cantidad_solicitada: int) -> str:
    """Calcula cuántos stickers entran en una plancha imprimible A3+ (30x42 cm útiles) con margen de corte."""
    if ancho_cm <= 0 or alto_cm <= 0 or cantidad_solicitada <= 0:
        return "Error: Las dimensiones y la cantidad deben ser mayores a 0."
    
    # Área útil estándar pliego A3+ con margen de registro de corte (3 mm entre stickers)
    pliego_ancho, pliego_alto = 30.0, 42.0
    margen = 0.3
    
    cols = int(pliego_ancho // (ancho_cm + margen))
    filas = int(pliego_alto // (alto_cm + margen))
    por_plancha = max(cols * filas, 1)
    planchas_necesarias = -(-cantidad_solicitada // por_plancha)  # División redondeada hacia arriba
    
    return (
        f"Para stickers de {ancho_cm}x{alto_cm} cm: entran {por_plancha} unidades por plancha A3+. "
        f"Para {cantidad_solicitada} unidades se necesitan {planchas_necesarias} plancha(s)."
    )

# --- SKILLS DEL AGENTE 4: CAJERO (TRANSFERENCIA / MERCADO PAGO) ---

# Datos de la cuenta receptora de transferencias (configurables por entorno)
TRANSFER_ALIAS = os.getenv("TRANSFER_ALIAS", "fabiancgonzalez.mp")
TRANSFER_CVU = os.getenv("TRANSFER_CVU", "0000003100044406405906")
TRANSFER_TITULAR = os.getenv("TRANSFER_TITULAR", "Fabián González")

@tool
async def generar_datos_transferencia(order_id: str) -> str:
    """Devuelve alias, CVU y monto exacto para que el cliente pague una orden 'pending_payment' por transferencia."""
    async with AsyncSessionLocal() as session:
        stmt_order = select(Order).where(Order.id == uuid.UUID(order_id))
        order = (await session.execute(stmt_order)).scalar_one_or_none()

        if not order:
            return f"Error: No existe la orden {order_id}."
        if order.status != "pending_payment":
            return f"La orden {order_id} no está pendiente de pago (estado actual: {order.status})."

        return (
            f"Datos para pagar la Orden {order.id} por transferencia:\n"
            f"- Monto exacto: ${order.total_in_cents / 100:,.2f} ARS\n"
            f"- Alias: {TRANSFER_ALIAS}\n"
            f"- CVU: {TRANSFER_CVU}\n"
            f"- Titular: {TRANSFER_TITULAR}\n"
            f"Referencia: número de orden. El cliente debe enviar el comprobante por este chat "
            f"para que se confirme la acreditación."
        )

@tool
async def generar_link_pago_mercadopago(order_id: str) -> str:
    """Genera una preferencia de pago en Mercado Pago para una orden 'pending_payment' y guarda el preference_id."""
    mp_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
    if not mp_token:
        return "Error de configuración: Falta MERCADOPAGO_ACCESS_TOKEN en el entorno."

    async with AsyncSessionLocal() as session:
        stmt_order = select(Order).where(Order.id == uuid.UUID(order_id))
        order = (await session.execute(stmt_order)).scalar_one_or_none()
        
        if not order:
            return f"Error: No existe la orden {order_id}."
        if order.status != "pending_payment":
            return f"La orden {order_id} no está pendiente de pago (estado actual: {order.status})."

        stmt_items = select(OrderItem).where(OrderItem.order_id == order.id)
        items = (await session.execute(stmt_items)).scalars().all()

        mp_items = [
            {
                "title": item.product_title,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price_in_cents / 100),
                "currency_id": "ARS",
            }
            for item in items
        ]

        sdk = mercadopago.SDK(mp_token)
        preference_data = {
            "items": mp_items,
            "payer": {"email": order.customer_email},
            "external_reference": str(order.id),
            "notification_url": "https://vercel.app",
            "back_urls": {
                "success": "https://vercel.app",
                "failure": "https://vercel.app",
                "pending": "https://vercel.app",
            },
            "auto_return": "approved",
        }

        preference_response = sdk.preference().create(preference_data)
        pref = preference_response.get("response", {})
        
        if "id" not in pref:
            return f"Error al crear preferencia en Mercado Pago: {pref}"

        order.mercado_pago_preference_id = pref["id"]
        await session.commit()

        use_sandbox = os.getenv("MERCADOPAGO_USE_SANDBOX", "true").lower() == "true"
        checkout_url = pref.get("sandbox_init_point") if use_sandbox else pref.get("init_point")
        
        return (
            f"Link de pago generado para la Orden {order.id} (${order.total_in_cents / 100:,.2f} ARS).\n"
            f"Preference ID: {pref['id']}\n"
            f"Link de pago: {checkout_url}"
        )

@tool
async def verificar_estado_pago_orden(order_id: str) -> str:
    """Consulta en PostgreSQL si el webhook firmado de Mercado Pago ya confirmó el pago de la orden."""
    async with AsyncSessionLocal() as session:
        stmt = select(Order).where(Order.id == uuid.UUID(order_id))
        order = (await session.execute(stmt)).scalar_one_or_none()
        
        if not order:
            return "Orden no encontrada."
        return (
            f"Orden {order.id} | Estado: {order.status} | "
            f"MP Payment ID: {order.mercado_pago_payment_id or 'Aún sin pago'} | "
            f"Detalle: {order.payment_status_detail or 'Esperando acreditación'}"
        )
