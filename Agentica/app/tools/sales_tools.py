import uuid
from langchain_core.tools import tool
from sqlalchemy import select
from app.database import AsyncSessionLocal, Product, Customer, Order, OrderItem

# --- SKILLS DEL AGENTE 1: REPRESENTANTE DE VENTAS ---

@tool
async def buscar_catalogo_productos(categoria: str = "") -> str:
    """Consulta los productos activos y precios actuales en PostgreSQL. Filtra opcionalmente por categoría."""
    async with AsyncSessionLocal() as session:
        stmt = select(Product).where(Product.active == True)
        if categoria:
            stmt = stmt.where(Product.category.ilike(f"%{categoria}%"))
        result = await session.execute(stmt)
        productos = result.scalars().all()
        
        if not productos:
            return "No se encontraron productos activos para esa búsqueda."
        
        lineas = []
        for p in productos:
            precio_ars = p.price_in_cents / 100
            lineas.append(f"- ID: {p.id} | {p.title} ({p.category}) | Precio: ${precio_ars:,.2f} | Stock: {p.stock}")
        return "\n".join(lineas)

@tool
async def registrar_cliente_lead(name: str, phone: str, email: str = "", address: str = "") -> str:
    """Registra un nuevo cliente o contacto interesado en la tabla customers."""
    async with AsyncSessionLocal() as session:
        nuevo_cliente = Customer(name=name, phone=phone, email=email, address=address)
        session.add(nuevo_cliente)
        await session.commit()
        return f"Cliente {name} registrado correctamente con ID {nuevo_cliente.id}."

# --- SKILLS DEL AGENTE 2: VENDEDOR (CLOSER) ---

@tool
async def crear_pedido_pendiente(
    customer_email: str,
    product_id: str,
    quantity: int,
    clerk_user_id: str = "guest_agent_user"
) -> str:
    """Verifica stock, recalcula el precio exacto en servidor y crea una orden en estado 'pending_payment'."""
    if quantity <= 0:
        return "Error: La cantidad debe ser mayor a 0."

    async with AsyncSessionLocal() as session:
        stmt = select(Product).where(Product.id == uuid.UUID(product_id), Product.active == True)
        result = await session.execute(stmt)
        producto = result.scalar_one_or_none()

        if not producto:
            return "Error: Producto no encontrado o inactivo."
        if producto.stock < quantity:
            return f"Stock insuficiente para '{producto.title}'. Disponible: {producto.stock} unidades."

        total_cents = producto.price_in_cents * quantity

        nueva_orden = Order(
            clerk_user_id=clerk_user_id,
            customer_email=customer_email,
            status="pending_payment",
            total_in_cents=total_cents,
        )
        session.add(nueva_orden)
        await session.flush()

        item = OrderItem(
            order_id=nueva_orden.id,
            product_id=producto.id,
            product_title=producto.title,
            unit_price_in_cents=producto.price_in_cents,
            quantity=quantity,
        )
        session.add(item)
        await session.commit()

        total_ars = total_cents / 100
        return (
            f"Orden creada con éxito. ID Orden: {nueva_orden.id} | "
            f"Producto: {producto.title} x{quantity} | Total a pagar: ${total_ars:,.2f} ARS | "
            f"Estado: pending_payment."
        )
