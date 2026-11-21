import uuid
from datetime import datetime
from langchain_core.tools import tool
from langgraph.types import interrupt
from sqlalchemy import select, func, desc
from app.database import AsyncSessionLocal, Product, Order, OrderItem, Customer

# --- SKILLS DEL AGENTE 5: COMMUNITY MANAGER ---

@tool
async def analizar_productos_mas_vendidos(limite: int = 5) -> str:
    """Obtiene los productos más vendidos en órdenes pagadas para crear campañas y contenido en redes."""
    async with AsyncSessionLocal() as session:
        stmt = (
            select(
                OrderItem.product_title,
                func.sum(OrderItem.quantity).label("total_unidades"),
                func.sum(OrderItem.unit_price_in_cents * OrderItem.quantity).label("ingresos_cents"),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status.in_(["paid", "preparing", "ready", "completed"]))
            .group_by(OrderItem.product_title)
            .order_by(desc("total_unidades"))
            .limit(limite)
        )
        rows = (await session.execute(stmt)).all()
        
        if not rows:
            return "Aún no hay ventas confirmadas suficientes para armar un ranking."
        
        ranking = [
            f"- {r.product_title}: {r.total_unidades} unidades vendidas (${r.ingresos_cents / 100:,.2f} ARS)"
            for r in rows
        ]
        return "Top productos más vendidos:\n" + "\n".join(ranking)

@tool
async def detectar_productos_con_sobrespock() -> str:
    """Identifica productos activos con alto stock para lanzar promociones o combos en Instagram/WhatsApp."""
    async with AsyncSessionLocal() as session:
        stmt = select(Product).where(Product.active == True, Product.stock >= 20).order_by(desc(Product.stock))
        productos = (await session.execute(stmt)).scalars().all()
        
        if not productos:
            return "No hay productos con exceso de stock (mayor o igual a 20 unidades)."
        
        lista = [f"- {p.title} ({p.category}): {p.stock} unidades | Precio actual: ${p.price_in_cents / 100:,.2f}" for p in productos]
        return "Productos ideales para campaña promocional:\n" + "\n".join(lista)

# --- SKILLS DEL AGENTE 6: FINANZAS ---

@tool
async def generar_reporte_financiero_ventas(comision_mp_porcentaje: float = 6.29) -> str:
    """Calcula facturación bruta, comisiones estimadas de Mercado Pago e ingreso neto real."""
    async with AsyncSessionLocal() as session:
        stmt_pagadas = select(func.count(Order.id), func.coalesce(func.sum(Order.total_in_cents), 0)).where(
            Order.status.in_(["paid", "preparing", "ready", "completed"])
        )
        cant_pagadas, bruto_cents = (await session.execute(stmt_pagadas)).one()

        stmt_pendientes = select(func.count(Order.id), func.coalesce(func.sum(Order.total_in_cents), 0)).where(
            Order.status == "pending_payment"
        )
        cant_pend, pend_cents = (await session.execute(stmt_pendientes)).one()

        bruto_ars = bruto_cents / 100
        comision_ars = bruto_ars * (comision_mp_porcentaje / 100)
        neto_ars = bruto_ars - comision_ars
        pendiente_ars = pend_cents / 100

        return (
            f"--- REPORTE FINANCIERO ALIADA STUDIO PRINT ---\n"
            f"• Órdenes cobradas: {cant_pagadas}\n"
            f"• Facturación Bruta: ${bruto_ars:,.2f} ARS\n"
            f"• Comisión estimada Mercado Pago ({comision_mp_porcentaje}%): -${comision_ars:,.2f} ARS\n"
            f"• Ingreso Neto Real: ${neto_ars:,.2f} ARS\n"
            f"• Carritos/Órdenes pendientes de cobro: {cant_pend} (${pendiente_ars:,.2f} ARS)"
        )

@tool
def calcular_margen_unitario_sticker(
    precio_venta_ars: float,
    costo_insumos_ars: float,
    comision_mp_porcentaje: float = 6.29
) -> str:
    """Calcula la ganancia neta y margen porcentual real de un sticker o plancha."""
    if precio_venta_ars <= 0:
        return "Error: El precio de venta debe ser mayor a 0."
    
    costo_mp = precio_venta_ars * (comision_mp_porcentaje / 100)
    ganancia_neta = precio_venta_ars - costo_insumos_ars - costo_mp
    margen_pct = (ganancia_neta / precio_venta_ars) * 100
    
    return (
        f"Precio Venta: ${precio_venta_ars:,.2f} | Costo Insumos: -${costo_insumos_ars:,.2f} | "
        f"Comisión MP: -${costo_mp:,.2f} => Ganancia Neta: ${ganancia_neta:,.2f} ARS (Margen: {margen_pct:.1f}%)"
    )

# --- SKILLS DEL AGENTE 7: SUPER_ADMIN (CON APROBACIÓN HUMANA / HUMAN-IN-THE-LOOP) ---

@tool
async def actualizar_precio_o_stock_admin(
    product_id: str,
    nuevo_precio_ars: float | None = None,
    nuevo_stock: int | None = None,
    motivo: str = "Actualización administrativa"
) -> str:
    """Modifica el precio o stock de un producto en PostgreSQL. REQUIERE APROBACIÓN HUMANA antes de ejecutarse."""
    try:
        producto_uuid = uuid.UUID(product_id)
    except ValueError:
        return (
            f"Error: '{product_id}' no es un ID de producto válido. "
            "Usá buscar_catalogo_productos para obtener el ID exacto (UUID) y reintentá."
        )

    async with AsyncSessionLocal() as session:
        stmt = select(Product).where(Product.id == producto_uuid)
        producto = (await session.execute(stmt)).scalar_one_or_none()
        
        if not producto:
            return f"Error: Producto {product_id} no encontrado."

        precio_actual_ars = producto.price_in_cents / 100
        
        # PAUSA DE SEGURIDAD (Human-in-the-Loop)
        aprobacion = interrupt({
            "accion": "MODIFICAR_PRODUCTO_BD",
            "producto": producto.title,
            "product_id": str(producto.id),
            "precio_actual": f"${precio_actual_ars:,.2f}",
            "nuevo_precio": f"${nuevo_precio_ars:,.2f}" if nuevo_precio_ars is not None else "Sin cambios",
            "stock_actual": producto.stock,
            "nuevo_stock": nuevo_stock if nuevo_stock is not None else "Sin cambios",
            "motivo": motivo,
            "pregunta": "¿Apruebas ejecutar este cambio definitivo en PostgreSQL? (Responde 'si' o 'no')"
        })

        if str(aprobacion).strip().lower() not in {"si", "sí", "yes", "aprobar", "approved", "true"}:
            return f"Operación CANCELADA por el administrador humano. No se modificó '{producto.title}'."

        if nuevo_precio_ars is not None:
            if nuevo_precio_ars < 0:
                return "Error: El precio no puede ser negativo."
            producto.price_in_cents = int(round(nuevo_precio_ars * 100))
        
        if nuevo_stock is not None:
            if nuevo_stock < 0:
                return "Error: El stock no puede ser negativo."
            producto.stock = nuevo_stock

        producto.updated_at = datetime.utcnow()
        await session.commit()
        
        return (
            f"APROBADO Y EJECUTADO: '{producto.title}' actualizado en BD. "
            f"Precio actual: ${producto.price_in_cents / 100:,.2f} ARS | Stock actual: {producto.stock} unidades."
        )

@tool
async def auditar_resumen_general_bd() -> str:
    """Devuelve una radiografía rápida del estado de todas las tablas principales en Neon."""
    async with AsyncSessionLocal() as session:
        total_prod = (await session.execute(select(func.count(Product.id)))).scalar_one()
        total_cust = (await session.execute(select(func.count(Customer.id)))).scalar_one()
        total_ord = (await session.execute(select(func.count(Order.id)))).scalar_one()
        return (
            f"Auditoría Rápida PostgreSQL (Aliada Studio Print):\n"
            f"- Productos registrados: {total_prod}\n"
            f"- Clientes/Leads: {total_cust}\n"
            f"- Órdenes totales: {total_ord}"
        )
