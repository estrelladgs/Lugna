# Lugna Core

App inteligente para la práctica de pilates. Combina rutinas guiadas, clases en directo y **corrección postural en tiempo real mediante visión por computador**, analizando la cámara del móvil para detectar la postura corporal y dar feedback inmediato durante el ejercicio.

> Trabajo de Fin de Grado (TFG) de Ingeniería Multimedia.

## Índice

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
  - [Backend](#backend-fastapi)
  - [App móvil](#app-móvil-expo--react-native)
- [Variables de entorno](#variables-de-entorno)
- [API — endpoints principales](#api--endpoints-principales)
- [Notas y limitaciones conocidas](#notas-y-limitaciones-conocidas)

## Características

- **Autenticación**: registro/login con email y contraseña, inicio de sesión con Google, recuperación de contraseña por email y cambio de contraseña.
- **Corrección postural con cámara**: análisis en tiempo real de la postura mediante MediaPipe (detección de puntos corporales), con feedback hablado (text-to-speech) y visual (esqueleto superpuesto).
- **Consentimiento de cámara**: pantalla de consentimiento explícito antes de activar la cámara, con enlace a la Política de Privacidad; los fotogramas se procesan y se descartan, no se almacenan.
- **Rutinas de pilates**: catálogo filtrable por nivel y duración, con buscador, vídeo de referencia (YouTube) y detalle de cada rutina.
- **Clases en directo**: listado de clases programadas con instructoras, horario y enlace de videollamada.
- **Progreso y estadísticas**: historial de sesiones de corrección postural y de rutinas completadas, con gráficas de evolución.
- **Onboarding** guiado para nuevas usuarias.
- **Gestión de cuenta**: edición de perfil, cambio de contraseña, baja de cuenta (borra en cascada sesiones, consentimientos y códigos de recuperación).

## Arquitectura

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   App móvil (Expo /      │ ───────────────────────▶ │   API REST (FastAPI)     │
│   React Native, TS)      │ ◀─────────────────────── │                          │
│                          │   frames de cámara (b64)  │  · Auth (JWT)            │
│  · Navegación por stacks │ ───────────────────────▶ │  · Análisis postural      │
│  · Zustand (estado auth) │                          │    (MediaPipe)           │
│  · expo-camera / audio   │                          │  · SQLAlchemy + Alembic  │
└─────────────────────────┘                          └──────────┬───────────────┘
                                                                  │
                                                        ┌─────────▼─────────┐
                                                        │ SQLite (local) /   │
                                                        │ PostgreSQL (docker)│
                                                        └────────────────────┘
```

## Stack tecnológico

**App móvil** (`app/`)
- Expo SDK 56 · React Native 0.85 · React 19 · TypeScript
- React Navigation (stacks + bottom tabs)
- Zustand para estado global (sesión de usuario)
- `expo-camera`, `expo-audio`, `expo-speech` para la captura y el feedback de la corrección postural
- `@react-native-google-signin/google-signin` para login con Google
- `react-native-svg` para gráficas e iconografía
- Axios como cliente HTTP
- Requiere **dev client** (`expo-dev-client`), no funciona con Expo Go genérico

**Backend** (`backend/`)
- FastAPI + Uvicorn
- SQLAlchemy 2.0 + Alembic (migraciones)
- SQLite en desarrollo local, PostgreSQL en Docker/producción
- Autenticación JWT (`python-jose`) con hashing bcrypt
- MediaPipe (Tasks API, `PoseLandmarker`) para la detección de puntos corporales en las imágenes de la cámara
- Envío de emails (recuperación de contraseña) vía SMTP

## Estructura del repositorio

```
Lugna/
├── app/                        # App móvil (Expo / React Native / TypeScript)
│   ├── src/
│   │   ├── screens/            # auth, home, posture, routines, classes, progress, legal, onboarding
│   │   ├── navigation/         # stacks de React Navigation
│   │   ├── services/           # clientes HTTP (auth, posturas, rutinas, consentimiento...)
│   │   ├── store/               # estado global (Zustand)
│   │   ├── components/         # componentes reutilizables
│   │   ├── constants/          # guías e imágenes de posturas
│   │   └── utils/              # helpers (manejo de errores, etc.)
│   ├── app.json                # configuración de Expo
│   └── package.json
│
├── backend/                     # API (FastAPI)
│   ├── app/
│   │   ├── main.py             # entrypoint, CORS, seed de datos, manejo global de errores
│   │   ├── models/             # User, Posture, Routine, PostureSession, RoutineSession,
│   │   │                       # PasswordResetCode, CameraConsent...
│   │   ├── schemas/             # esquemas Pydantic
│   │   ├── routers/             # auth, users, postures, sessions, home
│   │   └── services/            # análisis biomecánico (MediaPipe), auth (JWT/bcrypt)
│   ├── alembic/versions/        # migraciones de base de datos
│   ├── docker-compose.yml       # PostgreSQL + API en contenedores
│   ├── requirements.txt         # dependencias completas (Docker/producción)
│   ├── requirements_local.txt   # dependencias sin psycopg2/mediapipe pesados (SQLite local)
│   └── setup_local.py           # script de arranque rápido en local
│
└── README.md
```

## Puesta en marcha

### Backend (FastAPI)

**Requisitos**: Python 3.11+ (probado con 3.14).

1. Crear entorno virtual e instalar dependencias:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate        # Windows
   pip install -r requirements_local.txt   # desarrollo local con SQLite
   ```

2. Copiar variables de entorno:

   ```bash
   copy .env.example .env
   ```

3. Arrancar el servidor (crea tablas y siembra datos de ejemplo automáticamente):

   ```bash
   .venv/Scripts/uvicorn app.main:app --reload --port 8000
   ```

4. La documentación interactiva (Swagger) queda disponible en `http://localhost:8000/docs`.

**Alternativa con Docker + PostgreSQL:**

```bash
cd backend
docker compose up
```

Esto levanta PostgreSQL y la API en `http://localhost:8000`. Recuerda ajustar `DATABASE_URL` en `.env` a `postgresql://lugna:lugna_pass@localhost:5432/lugna_db` si arrancas la API fuera de Docker.

### App móvil (Expo / React Native)

**Requisitos**: Node.js 18+, un emulador Android/iOS o dispositivo físico. Al usar `expo-dev-client`, **no sirve Expo Go**.

```bash
cd app
npm install
npx expo run:android     # o: npx expo run:ios
```

La app espera la API en `http://localhost:8000` (ver configuración del cliente HTTP en `app/src/services/`). Para iterar sobre lógica que no dependa de módulos nativos, también puedes usar:

```bash
npx expo start --web
```

## Variables de entorno

Backend (`backend/.env`, ver `backend/.env.example`):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión (SQLite local o PostgreSQL) |
| `SECRET_KEY` | Clave para firmar los JWT (mínimo 32 caracteres) |
| `ALGORITHM` | Algoritmo de firma JWT (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiración del refresh token |
| `GOOGLE_WEB_CLIENT_ID` | Client ID de Google para verificar el login con Google |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Envío de emails de recuperación de contraseña |

## API — endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login con email/contraseña |
| `POST` | `/auth/refresh` | Refresco de tokens |
| `GET` | `/users/me/consent` | Estado del consentimiento de cámara |
| `POST` | `/users/me/consent` | Registrar consentimiento de cámara |
| `DELETE` | `/users/me` | Borrar cuenta (en cascada) |
| `GET` | `/postures` | Listado de posturas de pilates |
| `GET` | `/postures/{id}` | Detalle de una postura |
| `POST` | `/posture/analyze` | Analiza un fotograma y devuelve feedback postural |
| `POST` | `/posture/sessions` | Guarda una sesión de corrección postural |
| `GET` | `/posture/sessions` | Historial de sesiones del usuario |
| `GET` | `/routines` | Listado de rutinas de pilates |
| `GET` | `/health` | Healthcheck del servicio |

Consulta `http://localhost:8000/docs` para la referencia completa e interactiva.

## Notas y limitaciones conocidas

- El análisis postural usa MediaPipe real (`PoseLandmarker`, API "Tasks"); si el modelo no está disponible localmente, cae a un modo *mock* automáticamente.
- Los fotogramas enviados para el análisis se procesan al vuelo y no se almacenan.
- El seed de rutinas y clases en directo se sincroniza en cada arranque del backend (editar `setup_local.py`/`main.py` y reiniciar para reflejar cambios).
