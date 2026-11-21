import base64
import uuid
from pathlib import Path
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from app.database import AsyncSessionLocal, StickerSubmission
from app.orchestrator import aliada_orchestrator

app = FastAPI(title="Aliada Studio Print - Orquestador Multiagente")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta absoluta hacia backend-agents/static/index.html
BASE_DIR = Path(__file__).resolve().parent.parent
HTML_PATH = BASE_DIR / "static" / "index.html"

class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None

class ApproveRequest(BaseModel):
    thread_id: str
    decision: str

def extraer_respuesta(result: dict, thread_id: str) -> dict:
    if "__interrupt__" in result and result["__interrupt__"]:
        detalle_interrupcion = result["__interrupt__"].value
        return {
            "thread_id": thread_id,
            "status": "requires_approval",
            "agent": "super_admin",
            "reply": detalle_interrupcion.get("pregunta", "¿Apruebas esta acción administrativa?"),
            "approval_data": detalle_interrupcion,
        }

    mensajes = result.get("messages", [])
    ultimo_texto = mensajes[-1].content if mensajes else "Sin respuesta del agente."
    agente_activo = result.get("next", "orquestador")

    return {
        "thread_id": thread_id,
        "status": "completed",
        "agent": agente_activo,
        "reply": ultimo_texto,
        "approval_data": None,
    }

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

@app.get("/")
async def serve_ui():
    return FileResponse(HTML_PATH)

@app.post("/upload-sticker")
async def upload_sticker(
    file: UploadFile = File(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    message: str = Form(""),
):
    contenido = await file.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(contenido) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera los 10 MB permitidos.")

    submission = StickerSubmission(
        name=name.strip() or "Cliente Chat",
        email=email.strip(),
        phone=phone.strip(),
        message=message.strip(),
        file_name=file.filename or "sticker",
        content_type=file.content_type or "application/octet-stream",
        data=base64.b64encode(contenido).decode("ascii"),
    )
    async with AsyncSessionLocal() as session:
        session.add(submission)
        await session.commit()
        await session.refresh(submission)

    return {
        "status": "ok",
        "submission_id": str(submission.id),
        "file_name": submission.file_name,
        "content_type": submission.content_type,
    }

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    result = await aliada_orchestrator.ainvoke(
        {"messages": [HumanMessage(content=req.message)]},
        config=config,
    )
    return extraer_respuesta(result, thread_id)

@app.post("/chat/approve")
async def approve_endpoint(req: ApproveRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    result = await aliada_orchestrator.ainvoke(
        Command(resume=req.decision),
        config=config,
    )
    return extraer_respuesta(result, req.thread_id)
