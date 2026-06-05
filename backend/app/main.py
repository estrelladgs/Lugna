from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app.routers import auth, home, postures, sessions


def _seed_db():
    """Insert initial posture, routine and live-class data if tables are empty."""
    from app.models.posture import LiveClass, Posture, Routine

    db = SessionLocal()
    try:
        if db.query(Posture).count() > 0:
            return

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
                "id": "roll_up",
                "name": "Roll Up",
                "description": "Articulación completa de la columna desde tumbado hasta sentado. Trabaja la flexibilidad de la columna y la fuerza abdominal.",
                "difficulty": "beginner",
                "muscle_groups": ["abdominales", "columna", "isquiotibiales"],
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

        routine_data = [
            {
                "id": "morning_flow",
                "name": "Flujo Matutino",
                "description": "Rutina suave para despertar el cuerpo y activar el core al comenzar el día.",
                "duration_minutes": "20",
                "difficulty": "beginner",
                "postures": ["hundred", "roll_up", "spine_stretch", "rolling_like_a_ball"],
            },
            {
                "id": "core_power",
                "name": "Potencia de Core",
                "description": "Entrenamiento intensivo centrado en el trabajo abdominal profundo y la estabilidad.",
                "duration_minutes": "30",
                "difficulty": "intermediate",
                "postures": ["hundred", "single_leg_stretch", "double_leg_stretch", "plank"],
            },
            {
                "id": "flexibility_flow",
                "name": "Flexibilidad y Movilidad",
                "description": "Sesión dedicada a mejorar la movilidad articular y elongar la musculatura.",
                "duration_minutes": "25",
                "difficulty": "beginner",
                "postures": ["roll_up", "single_leg_circles", "spine_stretch", "rolling_like_a_ball"],
            },
            {
                "id": "full_body",
                "name": "Cuerpo Completo",
                "description": "Rutina equilibrada que trabaja todos los grupos musculares principales de pilates.",
                "duration_minutes": "45",
                "difficulty": "intermediate",
                "postures": [
                    "hundred",
                    "roll_up",
                    "single_leg_circles",
                    "rolling_like_a_ball",
                    "single_leg_stretch",
                    "double_leg_stretch",
                    "spine_stretch",
                    "plank",
                ],
            },
        ]

        for r in routine_data:
            db.add(Routine(**r))

        from datetime import datetime, timedelta

        if db.query(LiveClass).count() == 0:
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
                },
                {
                    "id": "pilates_suave_manana",
                    "title": "Pilates suave",
                    "instructor_name": "Laura Sánchez",
                    "scheduled_at": base + timedelta(days=1, hours=10),
                    "duration_minutes": 30,
                    "difficulty": "beginner",
                },
                {
                    "id": "stretching_manana",
                    "title": "Stretching profundo",
                    "instructor_name": "Ana Martínez",
                    "scheduled_at": base + timedelta(days=1, hours=17),
                    "duration_minutes": 40,
                    "difficulty": "beginner",
                },
                {
                    "id": "core_intermedio_2d",
                    "title": "Core intermedio",
                    "instructor_name": "María García",
                    "scheduled_at": base + timedelta(days=2, hours=9),
                    "duration_minutes": 45,
                    "difficulty": "intermediate",
                },
                {
                    "id": "pilates_avanzado_2d",
                    "title": "Pilates avanzado",
                    "instructor_name": "Laura Sánchez",
                    "scheduled_at": base + timedelta(days=2, hours=19),
                    "duration_minutes": 60,
                    "difficulty": "advanced",
                },
                {
                    "id": "flujo_matutino_3d",
                    "title": "Flujo matutino",
                    "instructor_name": "Ana Martínez",
                    "scheduled_at": base + timedelta(days=3, hours=8),
                    "duration_minutes": 30,
                    "difficulty": "beginner",
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

app.include_router(auth.router)
app.include_router(postures.router)
app.include_router(sessions.router)
app.include_router(home.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "lugna-api"}
