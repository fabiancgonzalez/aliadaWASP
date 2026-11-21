import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Busca el .env tanto en Agentica/ como en la carpeta raíz aliadaWASP/
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

vercel_api_key = os.getenv("VERCEL_AI_GATEWAY_API_KEY")
if not vercel_api_key:
    raise ValueError("Falta VERCEL_AI_GATEWAY_API_KEY en tu archivo .env")

llm = ChatOpenAI(
    model="openai/gpt-4o-mini",  # También puedes usar "google/gemini-2.5-flash"
    api_key=vercel_api_key,
    base_url="https://ai-gateway.vercel.sh/v1",
    temperature=0,
)



from typing import Literal
from pydantic import BaseModel
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from app.tools.sales_tools import (
    buscar_catalogo_productos,
    registrar_cliente_lead,
    crear_pedido_pendiente,
)
from app.tools.ops_tools import (
    revisar_ultimos_stickers_enviados,
    calcular_plancha_stickers,
    generar_datos_transferencia,
    generar_link_pago_mercadopago,
    verificar_estado_pago_orden,
)
from app.tools.admin_tools import (
    analizar_productos_mas_vendidos,
    detectar_productos_con_sobrespock,
    generar_reporte_financiero_ventas,
    calcular_margen_unitario_sticker,
    actualizar_precio_o_stock_admin,
    auditar_resumen_general_bd,
)

# --- 1. AGENTES DE ATENCIÓN Y OPERACIONES ---
sales_rep_agent = create_react_agent(
    llm,
    tools=[buscar_catalogo_productos, registrar_cliente_lead],
    prompt="Eres el Representante de Ventas de Aliada Studio Print. Atiendes consultas del catálogo y registras leads.",
)

seller_agent = create_react_agent(
    llm,
    tools=[buscar_catalogo_productos, crear_pedido_pendiente],
    prompt="Eres el Agente Vendedor. Verificas stock real, confirmas cantidades y creas la orden en 'pending_payment'.",
)

prepress_agent = create_react_agent(
    llm,
    tools=[revisar_ultimos_stickers_enviados, calcular_plancha_stickers],
    prompt="Eres el Agente de Pre-Impresión. Validás archivos subidos y calculás aprovechamiento en planchas A3+.",
)

cashier_agent = create_react_agent(
    llm,
    tools=[generar_datos_transferencia, generar_link_pago_mercadopago, verificar_estado_pago_orden],
    prompt=(
        "Eres el Agente Cajero de Aliada Studio Print. Ofrecés al cliente pagar por transferencia "
        "(compartís alias, CVU y monto exacto con generar_datos_transferencia) o, si lo prefiere, "
        "generás un link de Mercado Pago Checkout Pro. También verificás pagos acreditados."
    ),
)

# --- 2. AGENTES DE GESTIÓN INTERNA ---
community_agent = create_react_agent(
    llm,
    tools=[analizar_productos_mas_vendidos, detectar_productos_con_sobrespock],
    prompt=(
        "Eres el Community Manager de Aliada Studio Print (Córdoba). Analizas los stickers más vendidos "
        "y productos con alto stock para redactar copys atractivos para Instagram, TikTok y difusión de WhatsApp."
    ),
)

finance_agent = create_react_agent(
    llm,
    tools=[generar_reporte_financiero_ventas, calcular_margen_unitario_sticker],
    prompt=(
        "Eres el Agente de Finanzas de Aliada Studio Print. Calculas ingresos brutos, descuentos por comisiones "
        "de Mercado Pago y rentabilidad neta por unidad para cuidar la salud financiera del negocio."
    ),
)

super_admin_agent = create_react_agent(
    llm,
    tools=[buscar_catalogo_productos, actualizar_precio_o_stock_admin, auditar_resumen_general_bd],
    prompt=(
        "Eres el Agente Super_Admin de Aliada Studio Print. Administras y auditas la base de datos PostgreSQL. "
        "Cualquier modificación de precios o stock pasará obligatoriamente por aprobación humana."
    ),
)

# --- 3. ORQUESTADOR SUPERVISOR ---
class RouteDecision(BaseModel):
    next_agent: Literal[
        "sales_rep", "seller", "prepress", "cashier",
        "community", "finance", "super_admin", "FINISH"
    ]

supervisor_prompt = (
    "Eres el Orquestador Central de Aliada Studio Print. Analiza el mensaje y enruta al especialista correcto:\n"
    "- 'sales_rep': Consultas de catálogo, precios generales, dudas de la tienda o registro de contacto.\n"
    "- 'seller': Confirmar compra, verificar stock para comprar o generar una orden.\n"
    "- 'prepress': Revisar archivos subidos en 'Envía tu Sticker', formatos PNG/PDF o cálculo de planchas.\n"
    "- 'cashier': Datos de transferencia (alias/CVU), link de pago de Mercado Pago o verificar si una orden ya está pagada.\n"
    "- 'community': Ideas de posts, campañas para redes sociales, rankings de productos más vendidos o promos por sobrestock.\n"
    "- 'finance': Reportes de facturación, comisiones de Mercado Pago, cálculo de márgenes o ganancia neta.\n"
    "- 'super_admin': Auditoría de base de datos, cambiar precios de productos o modificar stock en el sistema.\n"
    "- 'FINISH': Si la consulta ya está resuelta."
)

class OrchestratorState(MessagesState):
    next: str

async def supervisor_node(state: OrchestratorState):
    messages = [SystemMessage(content=supervisor_prompt)] + state["messages"]
    decision = await llm.with_structured_output(RouteDecision).ainvoke(messages)
    return {"next": decision.next_agent}

builder = StateGraph(OrchestratorState)
builder.add_node("supervisor", supervisor_node)

agentes = {
    "sales_rep": sales_rep_agent,
    "seller": seller_agent,
    "prepress": prepress_agent,
    "cashier": cashier_agent,
    "community": community_agent,
    "finance": finance_agent,
    "super_admin": super_admin_agent,
}

for nombre, nodo in agentes.items():
    builder.add_node(nombre, nodo)
    builder.add_edge(nombre, END)

builder.add_edge(START, "supervisor")
builder.add_conditional_edges(
    "supervisor",
    lambda state: state["next"],
    {**{k: k for k in agentes.keys()}, "FINISH": END},
)

# Checkpointer obligatorio para soportar Human-in-the-Loop (interrupt)
memory = MemorySaver()
aliada_orchestrator = builder.compile(checkpointer=memory)
