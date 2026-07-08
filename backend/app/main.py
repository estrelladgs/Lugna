import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine, SessionLocal
from app.routers import auth, home, postures, sessions, users

logger = logging.getLogger(__name__)


def _seed_db():
    """
    Seed strategy:
    - Postures : insert once (never overwrite) — edit freely in Neon afterwards.
    - Routines : insert once (never overwrite) — edit freely in Neon afterwards.
    - Live classes : replace on every startup so scheduled times stay in the future.
    """
    from datetime import datetime, timedelta
    from app.models.posture import LiveClass, Posture, Routine

    db = SessionLocal()
    try:

        # ── Postures (seed once) ──────────────────────────────────────────────
        if db.query(Posture).count() == 0:
            posture_data = [
                {
                    "id": "hundred",
                    "name": "El Cien",
                    "description": "Ejercicio clásico de pilates para calentar y activar el core. Se realizan 100 bombeos de brazos con las piernas extendidas a 45°.",
                    "difficulty": "beginner",
                    "muscle_groups": ["core", "abdominales", "cadera flexora"],
                    "image_url": None,
                },
                {
                    "id": "single_leg_circles",
                    "name": "Círculos de Pierna",
                    "description": "Una pierna describe círculos en el aire manteniendo la pelvis estable. Mejora la movilidad de cadera y el control pélvico.",
                    "difficulty": "beginner",
                    "muscle_groups": ["cadera", "pelvis", "core"],
                    "image_url": None,
                },
                {
                    "id": "rolling_like_a_ball",
                    "name": "Rodar como una Pelota",
                    "description": "Masajea la columna rodando hacia atrás y regresando al equilibrio. Requiere una curva en C profunda.",
                    "difficulty": "beginner",
                    "muscle_groups": ["columna", "core", "espalda"],
                    "image_url": None,
                },
                {
                    "id": "single_leg_stretch",
                    "name": "Estiramiento de una Pierna",
                    "description": "Alternancia de piernas con la cabeza y hombros elevados. Desarrolla la coordinación y estabilidad del core.",
                    "difficulty": "intermediate",
                    "muscle_groups": ["core", "cadera flexora", "abdominales"],
                    "image_url": None,
                },
                {
                    "id": "double_leg_stretch",
                    "name": "Estiramiento de dos Piernas",
                    "description": "Extensión coordinada de brazos y piernas desde posición de rodillas al pecho. Exige gran control abdominal.",
                    "difficulty": "intermediate",
                    "muscle_groups": ["abdominales", "core", "cadera flexora", "hombros"],
                    "image_url": None,
                },
                {
                    "id": "spine_stretch",
                    "name": "Estiramiento de Columna",
                    "description": "Sentado con piernas abiertas, se estira la columna hacia adelante. Alarga la columna y estira los isquiotibiales.",
                    "difficulty": "beginner",
                    "muscle_groups": ["columna", "isquiotibiales", "espalda"],
                    "image_url": None,
                },
                {
                    "id": "plank",
                    "name": "Plancha",
                    "description": "Posición isométrica de sostén con el cuerpo en línea recta. Fortalece el core completo y mejora la estabilidad.",
                    "difficulty": "intermediate",
                    "muscle_groups": ["core", "hombros", "brazos", "glúteos"],
                    "image_url": None,
                },
            ]
            for p in posture_data:
                db.add(Posture(**p))
            db.flush()

        # Roll Up was removed from the posture-correction module (it's a movement,
        # not a static posture) — drop it if it was seeded by an earlier run.
        db.query(Posture).filter(Posture.id == "roll_up").delete()

        # ── Routines (seed once — edit directly in Neon afterwards) ──────────
        # This only runs the first time (when the table is empty). Once seeded,
        # add/edit/delete routines straight in Neon; the backend won't touch them again.
        routine_data = [
            {
                "id": "morning_flow",
                "name": "Flujo Matutino",
                "description": "En esta clase completa de pilates en casa vamos a realizar una rutina de ejercicios de estiramiento, flexibilidad y movilidad. Es una clase de pilates ideal para principiantes o cualquier persona que quiera mejorar la postura y aumentar la energía y la flexibilidad con ejercicios sencillos, efectivos y explicados paso a paso.",
                "duration_minutes": "18",
                "difficulty": "beginner",
                "enlace": "https://www.youtube.com/watch?v=B7DIkBlF2AY",
            },
            {
                "id": "core_power",
                "name": "Potencia de Core",
                "description": " Hoy trabajaremos el core, incluyendo abdomen, oblicuos y zona lumbar, fortaleciendo el centro del cuerpo para mejorar postura, equilibrio y estabilidad general.",
                "duration_minutes": "16",
                "difficulty": "intermediate",
                "enlace": "https://www.youtube.com/watch?v=tNJ3U067S2c",
            },
            {
                "id": "flexibility_flow",
                "name": "Flexibilidad y Movilidad",
                "description": "En esta clase de pilates realizaremos un trabajo global para movilizar y activar todo el cuerpo. Es una rutina muy completa perfecta para despertar el cuerpo por la mañana, aumentar la flexibilidad y fortalecer suavemente la musculatura. También te ayudará movilizar las articulaciones, mejorar la postura y aliviar dolores de espalda.",
                "duration_minutes": "25",
                "difficulty": "beginner",
                "enlace": "https://www.youtube.com/watch?v=NXibfyQ9gvo",
            },
            {
                "id": "full_body",
                "name": "Cuerpo Completo",
                "description": "Esta sesión de 30 minutos de Pilates Mat está diseñada para trabajar todo el cuerpo, ayudándote a definir y fortalecer cada músculo. A través de movimientos controlados y ejercicios efectivos, activarás el core, tonificarás piernas y brazos, y mejorarás tu postura. Es una clase ideal para quienes buscan un entrenamiento equilibrado que combine fuerza, resistencia y control corporal. ¡Espero que la disfrutes!",
                "duration_minutes": "35",
                "difficulty": "intermediate",
                "enlace": "https://www.youtube.com/watch?v=xCM3ajL6BdE",
            },
        ]
        if db.query(Routine).count() == 0:
            for r in routine_data:
                db.add(Routine(**r))

        # ── Live classes (replace on every startup so times stay fresh) ───────
        # To ADD a class: add a new dict with a unique id.
        # To EDIT or DELETE: modify/remove the dict and restart.
        # scheduled_at uses timedelta from today's midnight (UTC).
        db.query(LiveClass).delete()
        now = datetime.utcnow()
        base = now.replace(hour=0, minute=0, second=0, microsecond=0)
        live_class_data = [
            {
                "id": "core_avanzado_hoy",
                "title": "Core avanzado",
                "instructor_name": "María García",
                "scheduled_at": base + timedelta(hours=18),
                "duration_minutes": 45,
                "difficulty": "advanced",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "core_avanzado_paloma",
                "title": "Core avanzado",
                "instructor_name": "Paloma Domínguez",
                "scheduled_at": base + timedelta(days=1, hours=18),
                "duration_minutes": 45,
                "difficulty": "advanced",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "pilates_suave_manana",
                "title": "Pilates suave",
                "instructor_name": "Laura Sánchez",
                "scheduled_at": base + timedelta(days=1, hours=10),
                "duration_minutes": 30,
                "difficulty": "beginner",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "stretching_manana",
                "title": "Stretching profundo",
                "instructor_name": "Ana Martínez",
                "scheduled_at": base + timedelta(days=1, hours=17),
                "duration_minutes": 40,
                "difficulty": "beginner",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "core_intermedio_2d",
                "title": "Core intermedio",
                "instructor_name": "María García",
                "scheduled_at": base + timedelta(days=2, hours=9),
                "duration_minutes": 45,
                "difficulty": "intermediate",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "pilates_avanzado_2d",
                "title": "Pilates avanzado",
                "instructor_name": "Laura Sánchez",
                "scheduled_at": base + timedelta(days=2, hours=19),
                "duration_minutes": 60,
                "difficulty": "advanced",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
            {
                "id": "flujo_matutino_3d",
                "title": "Flujo matutino",
                "instructor_name": "Ana Martínez",
                "scheduled_at": base + timedelta(days=3, hours=8),
                "duration_minutes": 30,
                "difficulty": "beginner",
                "enlace": "https://meet.google.com/wcn-ncvn-owo",
            },
        ]
        for lc in live_class_data:
            db.add(LiveClass(**lc))

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_db()
    yield


app = FastAPI(
    title="Lugna API",
    description="Backend para la app inteligente de pilates Lugna",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Sin este handler, una excepción no controlada se salta el CORSMiddleware
    # y el navegador la reporta como fallo de CORS en vez de mostrar el error real.
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde."},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(postures.router)
app.include_router(sessions.router)
app.include_router(home.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "lugna-api"}
