agente-gestion-postgresql/
├── app/
│   ├── main.py              # Punto de entrada de FastAPI (endpoints REST)
│   ├── config.py            # Lectura de variables de entorno (.env)
│   ├── database.py          # Conexión a PostgreSQL (SQLAlchemy / asyncpg)
│   ├── models.py            # Modelos de tablas SQL (ej. historial, tareas, políticas)
│   ├── schemas.py           # Validación de entrada/salida con Pydantic
│   └── agent/
│       ├── graph.py         # Lógica y flujo de coordinación del agente
│       └── tools.py         # Herramientas del agente para leer/escribir en PostgreSQL
├── .env.example             # Plantilla de configuración (sin claves reales, clave para seguridad)
├── requirements.txt         # Dependencias del proyecto
└── README.md                # Documentación, diagrama de arquitectura y guía de uso
