import os
import uuid
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from sqlalchemy import Boolean, DateTime, Enum as PgEnum, Integer, String, Text, ForeignKey, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from dotenv import load_dotenv

load_dotenv()

def _adaptar_url_asyncpg(url: str) -> str:
    """Adapta una URL estándar de Neon/PostgreSQL para asyncpg.

    asyncpg no acepta los parámetros 'sslmode' ni 'channel_binding' en la query
    string: 'sslmode' se traduce a 'ssl' y 'channel_binding' se descarta, venga
    en la posición que venga dentro de la URL.
    """
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(url)
    params = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            continue
        if key == "sslmode":
            params.append(("ssl", value))
            continue
        params.append((key, value))
    return urlunsplit(parts._replace(query=urlencode(params)))

RAW_DB_URL = os.getenv("DATABASE_URL", "")
ASYNC_DB_URL = _adaptar_url_asyncpg(RAW_DB_URL)

engine = create_async_engine(ASYNC_DB_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

class Product(Base):
    __tablename__ = "products"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    price_in_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), default="", nullable=False)
    email: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    address: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# El tipo enum 'order_status' ya existe en la BD (lo crea Drizzle desde el frontend)
order_status_type = PgEnum(
    "pending_payment", "paid", "preparing", "ready", "completed",
    "cancelled", "refunded", "charged_back",
    name="order_status",
    create_type=False,
)

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(Text, nullable=False)
    customer_email: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(order_status_type, default="pending_payment", nullable=False)
    total_in_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    mercado_pago_preference_id: Mapped[str | None] = mapped_column(Text, unique=True)
    mercado_pago_payment_id: Mapped[str | None] = mapped_column(Text, unique=True)
    payment_status_detail: Mapped[str | None] = mapped_column(Text)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"))
    product_title: Mapped[str] = mapped_column(String(160), nullable=False)
    unit_price_in_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)


# Agregar dentro de app/database.py

class StickerSubmission(Base):
    __tablename__ = "sticker_submissions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), default="", nullable=False)
    message: Mapped[str] = mapped_column(Text, default="", nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
