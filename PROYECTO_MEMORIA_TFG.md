# Lugna — Documento base para la Memoria del TFG

> Generado a partir del análisis exhaustivo del código, historial de git y configuración del
> repositorio `c:\Users\User\Lugna` (rama `main`, remoto `https://github.com/estrelladgs/Lugna.git`).
> Todos los datos son verificables en el código citado (`archivo:línea`).

---

## 1. ARQUITECTURA GENERAL

### 1.1 Diagrama textual

```
┌────────────────────────────────────┐        HTTPS / JSON            ┌──────────────────────────────────┐
│   APP MÓVIL (Expo / React Native)   │ ──────────────────────────────▶ │   API REST (FastAPI + Uvicorn)    │
│                                      │ ◀────────────────────────────── │                                   │
│  RootNavigator                      │   Authorization: Bearer <JWT>   │  routers/                         │
│   ├─ Onboarding / Login / Register  │                                 │   ├─ auth.py    (registro, login, │
│   │  / ForgotPassword               │                                 │   │   google, refresh, password)   │
│   └─ AppNavigator (bottom tabs)      │                                 │   ├─ users.py   (perfil, consent, │
│       ├─ Home                        │                                 │   │   borrado de cuenta)          │
│       ├─ Routines (RoutinesNav)      │                                 │   ├─ postures.py(posturas,        │
│       ├─ Classes                     │                                 │   │   análisis, rutinas)          │
│       ├─ Progress (ProgressNav)       │                                 │   ├─ sessions.py(sesiones postura)│
│       └─ Camera (PostureNavigator,    │  fotogramas JPEG en base64      │   └─ home.py    (clases, racha,   │
│           tab oculto)                 │ ──────────────────────────────▶ │        progreso, continuar rutina)│
│                                      │                                 │                                   │
│  store/ (Zustand): authStore,        │                                 │  services/                         │
│   postureStore                       │                                 │   ├─ analysis.py (MediaPipe +      │
│  services/ (Axios): api.ts (cliente  │                                 │   │   analizadores biomecánicos)   │
│   con interceptor de refresh token),  │                                 │   ├─ auth.py     (JWT + bcrypt)    │
│   authService, postureService,       │                                 │   └─ email.py    (SMTP recuperación)│
│   routineService, homeService,       │                                 │                                   │
│   consentService, googleSignIn       │                                 │  SQLAlchemy 2.0 + Alembic          │
└────────────────────────────────────┘                                 └──────────────┬────────────────────┘
                                                                                        │
                                                                          ┌─────────────▼─────────────┐
                                                                          │ SQLite (dev local, archivo │
                                                                          │ lugna.db) / PostgreSQL 16  │
                                                                          │ (Docker, producción)       │
                                                                          └────────────────────────────┘
```

Flujo de la funcionalidad estrella (corrección postural en tiempo real):

```
CameraView (expo-camera, frontal)
   → captura fotograma cada 1.5s (takePictureAsync, calidad 0.3, JPEG base64)
   → POST /posture/analyze { postureId, frame }
        → analysis.py: decodifica base64 → OpenCV → MediaPipe PoseLandmarker (Tasks API)
        → comprobación de orientación corporal (tumbado/sentado/de pie según ejercicio)
        → analizador específico del ejercicio → { score, corrections[], landmarks[], incorrectLandmarks[] }
   ← PostureFeedback
   → SkeletonOverlay (dibuja esqueleto sobre la cámara) + FeedbackOverlay (mensaje/score)
   → expo-speech lee en voz alta la primera corrección si la postura es incorrecta
   → si es correcta: sonido de éxito (expo-audio) y la sesión finaliza automáticamente
   → al terminar: POST /posture/sessions (persistencia del historial)
```

### 1.2 Stack tecnológico completo

**App móvil** (`app/`)
| Tecnología | Versión | Uso |
|---|---|---|
| Expo (SDK) | 56.0.14 | Framework de la app React Native, dev client |
| React Native | 0.85.3 | Motor de la UI móvil |
| React | 19.2.3 | Librería de componentes |
| TypeScript | 6.0.3 | Tipado estático |
| React Navigation (`native`, `native-stack`, `stack`, `bottom-tabs`) | ^7.x | Navegación por stacks y pestañas |
| Zustand | ^5.0.14 | Estado global (sesión de usuario, sesión postural activa) |
| Axios | ^1.16.1 | Cliente HTTP con interceptores (auth + refresh) |
| `expo-camera` | ~56.0.8 | Captura de fotogramas de la cámara frontal |
| `expo-audio` | ~56.0.12 | Reproducción de sonido de acierto |
| `expo-speech` | ~56.0.3 | Feedback hablado (texto a voz) de las correcciones |
| `@react-native-google-signin/google-signin` | ^16.1.2 | Login nativo con Google |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistencia local de sesión/tokens |
| `react-native-svg` | 15.15.4 | Iconografía y gráficas (donut chart, iconos de pestañas) |
| `expo-dev-client` | ~56.0.22 | Cliente de desarrollo nativo (necesario por Google Sign-In) |

**Backend** (`backend/`)
| Tecnología | Versión | Uso |
|---|---|---|
| FastAPI | 0.115.6 | Framework de la API REST |
| Uvicorn | 0.32.1 | Servidor ASGI |
| SQLAlchemy | 2.0.36 | ORM |
| Alembic | 1.14.0 | Migraciones de base de datos |
| Pydantic (+ pydantic-settings) | 2.10.3 / 2.7.0 | Validación de esquemas y configuración |
| python-jose[cryptography] | 3.3.0 | Firmado/verificación de JWT |
| bcrypt | 5.0.0 | Hashing de contraseñas (uso directo, sin passlib) |
| google-auth | 2.36.0 | Verificación de ID tokens de Google Sign-In |
| MediaPipe | 0.10.35 | Detección de puntos corporales (`PoseLandmarker`, Tasks API) |
| OpenCV (`opencv-python-headless`) | 4.10.0.84 | Decodificación de imágenes JPEG/PNG recibidas |
| NumPy | 2.5.1 | Cálculo de ángulos articulares |
| psycopg2-binary | 2.9.10 | Driver PostgreSQL (solo producción/Docker) |
| PostgreSQL | 16 (alpine, Docker) | Base de datos de producción |
| SQLite | — | Base de datos de desarrollo local (`lugna.db`) |

### 1.3 Justificación de decisiones tecnológicas (evidencia en README / código / commits)

- **Expo + dev client (no Expo Go)**: el README indica explícitamente que se requiere `expo-dev-client`
  porque `@react-native-google-signin/google-signin` no funciona en el Expo Go genérico
  (`README.md:59`, `AGENTS.md`).
- **MediaPipe Tasks API en vez de `mp.solutions.pose`**: la versión instalable en Python 3.14
  (0.10.35) eliminó la API antigua; solo queda la API "Tasks" (`PoseLandmarker`, modo `IMAGE`),
  documentado en comentarios de `analysis.py:1-3` y en la memoria del proyecto.
- **bcrypt directo sin passlib**: passlib es incompatible con bcrypt 5.0.0; se implementa
  hashing/verificación manual en `app/services/auth.py:11-16`.
- **SQLite en local / PostgreSQL en Docker**: dos ficheros de dependencias
  (`requirements_local.txt` sin `psycopg2`/`mediapipe` pesados, `requirements.txt` completo)
  para acelerar el ciclo de desarrollo sin renunciar a Postgres en producción
  (`README.md:61-97`, `docker-compose.yml`).
- **Manejador global de excepciones en FastAPI**: `main.py:239-247` añade un
  `exception_handler(Exception)` con el comentario explícito de que, sin él, una excepción no
  controlada se salta el `CORSMiddleware` y el navegador la reporta como fallo de CORS en vez del
  error real — decisión tomada tras depurar ese problema.
- **Fallback mock del análisis postural**: si MediaPipe no está disponible o el modelo no se
  puede descargar (sin internet en el primer arranque), `analysis.py` cae automáticamente a
  `_mock_response()` para no bloquear el desarrollo/demo (`analysis.py:428-441`).
- **Login con Google desacoplado por plataforma (`GoogleAuthButton.tsx` / `.web.tsx`)**: la lógica
  que antes estaba duplicada e inline en `LoginScreen.tsx` y `RegisterScreen.tsx` (~47 líneas cada
  una) se extrajo a un componente compartido con dos implementaciones que Expo/Metro resuelve por
  plataforma: en nativo usa `@react-native-google-signin/google-signin`; en web, como ese módulo
  nativo no existe en el navegador, carga dinámicamente el script de Google Identity Services
  (`accounts.google.com/gsi/client`) y renderiza su botón oficial, usando
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` como client id — ambas rutas acaban llamando al mismo
  `POST /auth/google` con el `idToken`/`credential` recibido.
- **Síntesis de voz multiplataforma (`services/tts.ts` / `tts.web.ts`)**: la llamada directa a
  `expo-speech` se sustituyó por una capa `warmUp/unlockSpeech/stopSpeaking/speakCorrection` con
  variante `.web` propia, porque el motor de voz del navegador (Web Speech API) tiene varios
  comportamientos que `expo-speech` no cubre: Chrome/Edge descartan silenciosamente un `speak()`
  llamado justo después de `cancel()` (crbug.com/679437, se soluciona difiriendo el `speak()` 150ms),
  el `SpeechSynthesisUtterance` puede ser recolectado por el GC a mitad de la frase si no se
  mantiene una referencia fuerte (crbug.com/509488), Safari/iOS solo permite hablar dentro de un
  gesto de usuario directo (de ahí `unlockSpeech()`, que lanza una locución casi muda al pulsar
  "Comenzar" para desbloquear el motor durante el resto de la sesión) y fijar solo `lang: 'es-ES'`
  no garantiza una voz en español si el idioma del sistema operativo no lo es, por lo que se busca
  explícitamente una voz `es-*` instalada (`voice`/`utterance.voice`) en vez de confiar en el
  fallback del navegador.
- **Reflejo del esqueleto sobre la cámara (`SkeletonOverlay.tsx`)**: el fotograma que se envía a
  MediaPipe se captura sin espejar (la cámara frontal real), pero la usuaria se ve a sí misma
  reflejada como en un espejo en la pantalla; se invierte la coordenada X (`(1 - lm.x) * width`) al
  dibujar el esqueleto para que coincida visualmente con el cuerpo tal como lo percibe la usuaria.
- **Caché local del consentimiento de cámara (`consentService.ts`)**: una vez concedido el
  consentimiento, se guarda en `AsyncStorage` y se confía en él en aperturas posteriores de la
  cámara, en vez de volver a consultar `/users/me/consent` cada vez — así un backend lento o caído
  no obliga a repetir el flujo de consentimiento ya aceptado.
- **Cambio de estrategia de *seed* de posturas y rutinas (`main.py::_seed_db`)**: pasaron de
  "upsert en cada arranque" (pensado para editar el catálogo cambiando el código y reiniciando) a
  "insertar solo si la tabla está vacía", según el comentario del propio código, para poder editar
  esos datos directamente en la base de datos de producción ("Neon", mencionada en el comentario)
  sin que un reinicio del backend los sobrescriba. Las clases en directo siguen reemplazándose en
  cada arranque para mantener sus horarios en el futuro.

### 1.4 Despliegue (añadido en la fase final del proyecto)

El proyecto incorpora, además de la ejecución local, un esquema de despliegue pensado para poder
hacer una demo pública sin contratar hosting de pago para el backend (que necesita MediaPipe/OpenCV,
pesados para plataformas gratuitas):

```
┌───────────────────────────┐        túnel HTTPS         ┌──────────────────────────────┐
│  Backend FastAPI           │◀───────────────────────────│  cloudflared (Cloudflare      │
│  (equipo local de la       │   cloudflared tunnel --url  │  Tunnel, URL efímera tipo     │
│  autora, uvicorn :8000)    │   http://localhost:8000     │  *.trycloudflare.com)         │
└───────────────────────────┘                             └──────────────┬───────────────┘
                                                                           │  EXPO_PUBLIC_API_URL
                                                                           ▼
                                                             ┌──────────────────────────────┐
                                                             │  Render (render.yaml)         │
                                                             │  servicio estático "lugna-web"│
                                                             │  = build web de Expo          │
                                                             │  (npx expo export -p web)     │
                                                             └──────────────────────────────┘
```

- **`render.yaml`**: define un único servicio Render de tipo `web`/`runtime: static` llamado
  `lugna-web`, con `rootDir: app`, `buildCommand: npm install && npx expo export -p web` y
  `staticPublishPath: dist`. Es decir, **solo el frontend se despliega en Render** (como sitio
  estático, la versión web de la app Expo); el backend con MediaPipe sigue corriendo en local.
- **`iniciar-servidor.ps1` / `Iniciar-Lugna.bat`**: script de automatización que (1) arranca
  Uvicorn en local, (2) levanta un túnel de Cloudflare (`cloudflared tunnel --url
  http://localhost:8000`) para exponerlo con HTTPS público, (3) extrae la URL generada del log del
  túnel, (4) la escribe automáticamente en `app/eas.json` (variable `EXPO_PUBLIC_API_URL` del
  perfil `preview`) y (5), si existe un fichero local `render-api-key.local.txt` con una API key de
  Render, actualiza también la variable de entorno `EXPO_PUBLIC_API_URL` del servicio `lugna-web`
  vía la API REST de Render y dispara un redeploy automático. El `.bat` es solo un lanzador de
  doble clic del script de PowerShell.
- **Corrección de seguridad durante el despliegue**: `backend/docker-compose.yml` dejó de tener el
  `SECRET_KEY` de JWT hardcodeado en texto plano (`SECRET_KEY: lugna-secret-key-...`) y pasó a
  leerlo de una variable de entorno (`SECRET_KEY: ${SECRET_KEY}`); a la vez, `backend/.env` se
  eliminó del control de versiones y se añadió a `backend/.gitignore` (antes se llegó a commitear
  por error). También se añadió `render-api-key.local.txt` al `.gitignore` raíz para no exponer la
  API key de Render.
- **Ajustes de compatibilidad web** motivados por este despliegue (el build de Render corre en
  navegador, no en un runtime nativo de React Native): ver detalle en la sección 6.

---

## 2. DISEÑO DE LA PERSISTENCIA

### 2.1 Modelos (SQLAlchemy, `backend/app/models/`)

**`users`** (`user.py`)
| Campo | Tipo | Notas |
|---|---|---|
| id | String(36), PK | UUID4 |
| email | String, unique, index | |
| name | String, not null | |
| hashed_password | String, nullable | nulo si el usuario solo usa Google |
| google_id | String, unique, nullable, index | vínculo con cuenta de Google |
| last_routine_id | String, FK → `routines.id`, nullable | rutina en curso para "continuar" |
| created_at / updated_at | DateTime | auto |

**`postures`** (`posture.py`) — catálogo de posturas de corrección (7 seeded)
| Campo | Tipo |
|---|---|
| id | String, PK (slug, ej. `plank`) |
| name, description, difficulty | String |
| muscle_groups | JSON (lista de strings) |
| image_url | String, nullable |

**`routines`** (`posture.py`) — rutinas/programas de pilates (4 seeded)
| Campo | Tipo |
|---|---|
| id | String, PK |
| name, description, difficulty | String |
| duration_minutes | String *(sic — almacenado como texto, convertido a `int` en la capa de schema/router)* |
| enlace | String, nullable (vídeo de YouTube) |

**`live_classes`** (`posture.py`) — clases en directo (re-sembradas en cada arranque)
| Campo | Tipo |
|---|---|
| id | String, PK |
| title, instructor_name, difficulty | String |
| scheduled_at | DateTime |
| duration_minutes | Integer |
| enlace | String, nullable (videollamada) |

**`posture_sessions`** (`session.py`) — historial de sesiones de corrección postural
| Campo | Tipo | Notas |
|---|---|---|
| id | String(36), PK | generado en el cliente, `db.merge()` idempotente |
| user_id | String(36), FK → `users.id` ON DELETE CASCADE | |
| posture_id | String | |
| started_at / ended_at | String (ISO, no `DateTime`) | |
| duration_seconds | Integer | |
| average_score | Float | |
| feedback_history | JSON (lista de `PostureFeedback`) | histórico completo de correcciones de la sesión |
| created_at | DateTime | usado para ordenar/calcular racha |

**`routine_sessions`** (`session.py`) — registro de inicio de rutina (progreso)
| Campo | Tipo |
|---|---|
| id | String(36), PK |
| user_id | FK → `users.id` ON DELETE CASCADE |
| routine_id | FK → `routines.id` ON DELETE CASCADE |
| started_at | DateTime |

**`camera_consents`** (`consent.py`) — consentimiento explícito de uso de cámara (RGPD)
| Campo | Tipo |
|---|---|
| id | String(36), PK |
| user_id | FK → `users.id` ON DELETE CASCADE |
| policy_version | String (versión de la Política de Privacidad aceptada) |
| granted_at | DateTime |

**`password_reset_codes`** (`password_reset.py`) — códigos OTP de recuperación
| Campo | Tipo |
|---|---|
| id | String(36), PK |
| user_id | FK → `users.id` ON DELETE CASCADE |
| code | String(6) |
| expires_at | DateTime (TTL 15 min, `auth.py:35`) |
| used | Boolean |
| created_at | DateTime |

### 2.2 Relaciones
- `User 1—N PostureSession`, `User 1—N RoutineSession`, `User 1—N CameraConsent`,
  `User 1—N PasswordResetCode` (todas con `ondelete="CASCADE"`).
- `User N—1 Routine` (vía `last_routine_id`, para "continuar donde lo dejaste").
- `Routine 1—N RoutineSession`.
- `Posture`/`Routine` no tienen FK entrante desde `posture_sessions`/`routine_sessions` con
  integridad referencial declarada salvo en `routine_sessions.routine_id`; `posture_sessions.posture_id`
  se resuelve por *join* manual en el router (`sessions.py:34,59`).

### 2.3 Tipo de base de datos y encaje con el proyecto
- **Desarrollo**: SQLite (fichero `backend/lugna.db`), cero configuración, ideal para iterar rápido
  en un TFG individual.
- **Producción/Docker**: PostgreSQL 16 vía `docker-compose.yml`, con *healthcheck* antes de levantar
  la API. El cambio de motor es transparente porque SQLAlchemy abstrae el dialecto y los modelos
  usan tipos compatibles con ambos (`String(36)` en vez de `UUID` nativo, `JSON` en vez de `JSONB`).
- Migraciones gestionadas con **Alembic**, ver evolución en la sección 5.

### 2.4 Metadatos de administración
- `created_at`/`updated_at` en `users`; `created_at` en `posture_sessions` y
  `password_reset_codes`; `granted_at` en `camera_consents`; `started_at` en `routine_sessions`.
- No hay tabla de auditoría/logs de administración dedicada; el único logging es
  `logger.exception(...)` en el manejador global de errores (`main.py:243`) y prints puntuales
  (fallo de envío de email, fallback a mock).

---

## 3. DISEÑO Y ESPECIFICACIÓN DE LA API REST

Todos los routers están montados sin prefijo global; cada uno declara su propio `prefix`
(`main.py:250-254`). Autenticación: **JWT Bearer** (`HTTPBearer` + `Depends(get_current_user)`,
`dependencies.py`) en todos los endpoints salvo registro/login/recuperación de contraseña.

### `auth.py` (prefix `/auth`) — sin autenticación previa
| Método | Ruta | Entrada | Salida | Requisito funcional |
|---|---|---|---|---|
| POST | `/auth/register` | `{name, email, password}` | `AuthResponse{user, tokens}` (201) | Alta de usuario |
| POST | `/auth/login` | `{email, password}` | `AuthResponse` | Login email/contraseña |
| POST | `/auth/google` | `{idToken}` | `AuthResponse` | Login/registro con Google (crea usuario si no existe, o vincula `google_id` a un email ya existente) |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` | Renovación de sesión |
| POST | `/auth/password/forgot` | `{email}` | `{message}` (siempre genérico, no filtra si el email existe) | Recuperación de contraseña, paso 1 |
| POST | `/auth/password/reset` | `{email, code, newPassword}` | `{message}` | Recuperación de contraseña, paso 2 |

### `users.py` (prefix `/users`) — requiere JWT
| Método | Ruta | Entrada | Salida | Requisito funcional |
|---|---|---|---|---|
| PATCH | `/users/me` | `{name, email}` | `UserOut` | Edición de perfil |
| GET | `/users/me/consent` | — | `ConsentStatusOut` | Estado del consentimiento de cámara |
| POST | `/users/me/consent` | `{policyVersion}` | `ConsentStatusOut` (201) | Registrar consentimiento explícito |
| DELETE | `/users/me` | — | 204 | Baja de cuenta (borra en cascada sesiones, rutinas, consentimientos, códigos) |

### `postures.py` — requiere JWT
| Método | Ruta | Entrada | Salida | Requisito funcional |
|---|---|---|---|---|
| GET | `/postures` | — | `PostureOut[]` | Catálogo de posturas |
| GET | `/postures/{posture_id}` | — | `PostureOut` (404 si no existe) | Detalle de postura |
| POST | `/posture/analyze` | `{postureId, frame}` (base64) | `PostureFeedbackOut` | Análisis en tiempo real |
| GET | `/routines` | — | `RoutineOut[]` | Catálogo de rutinas |
| POST | `/routines/{routine_id}/start` | — | `RoutineOut` (404 si no existe) | Marca la rutina como "en curso" (actualiza `last_routine_id`, crea `RoutineSession`) |

### `sessions.py` (prefix `/posture`) — requiere JWT
| Método | Ruta | Entrada | Salida | Requisito funcional |
|---|---|---|---|---|
| POST | `/posture/sessions` | `SessionIn` (id, postureId, startedAt, endedAt, durationSeconds, averageScore, feedbackHistory[]) | `SessionOut` (201) | Guardar sesión de corrección (usa `db.merge`, idempotente) |
| GET | `/posture/sessions` | — | `SessionOut[]` | Historial de sesiones del usuario |

### `home.py` (prefix `/home`) — requiere JWT
| Método | Ruta | Entrada | Salida | Requisito funcional |
|---|---|---|---|---|
| GET | `/home/live-classes` | — | `LiveClassOut[]` (máx. 6, futuras) | Listado de clases en directo |
| GET | `/home/activity` | query `tz_offset_minutes` | `{activeDays[], streakDays}` | Racha de días consecutivos (calculada combinando `posture_sessions` y `routine_sessions`, corrigiendo huso horario del cliente) |
| GET | `/home/progress` | — | `ProgressOut` | % de rutinas completadas, sesiones totales, último programa |
| GET | `/home/continue-routine` | — | `ContinueRoutineOut` | Rutina para el botón "continuar" |

### `/health` (raíz, sin auth)
Healthcheck simple (`{"status": "ok", "service": "lugna-api"}`).

### 3.1 Autenticación/autorización
- **JWT** con dos tipos de token (`type: access` / `type: refresh`) firmados con `HS256` y
  `SECRET_KEY` (`services/auth.py`). Access token corto (`ACCESS_TOKEN_EXPIRE_MINUTES`, 30 min por
  defecto), refresh token largo (`REFRESH_TOKEN_EXPIRE_DAYS`, 7 días).
- `get_current_user` (`dependencies.py:21-42`) decodifica el token, valida que sea de tipo
  `access` y recupera el usuario; devuelve 401 en cualquier fallo.
- El cliente (`app/src/services/api.ts`) implementa **renovación automática silenciosa**: un
  interceptor de Axios detecta 401, encola las peticiones concurrentes mientras se refresca el
  token una sola vez (`isRefreshing`/`refreshQueue`), y reintenta la petición original.
- **Login con Google**: el ID token se verifica en el backend contra `GOOGLE_WEB_CLIENT_ID`
  (`services/auth.py:43-46`) usando la librería oficial `google-auth`; no se confía en datos
  enviados directamente por el cliente.

---

## 4. ESTRUCTURA DEL PROYECTO Y ENTORNO DE DESARROLLO

```
Lugna/
├── app/                          # App móvil (Expo / React Native / TypeScript)
│   ├── src/
│   │   ├── screens/              # auth, home, posture, routines, classes, progress, legal, onboarding
│   │   ├── navigation/           # RootNavigator, AppNavigator (tabs) + stacks anidados por sección
│   │   ├── services/             # clientes HTTP por dominio + cliente Axios base (api.ts),
│   │   │                          # tts.ts/tts.web.ts (voz de correcciones por plataforma)
│   │   ├── store/                # authStore, postureStore (Zustand)
│   │   ├── components/           # auth/ (GoogleAuthButton.tsx/.web.tsx), posture/ (overlays), icons/
│   │   ├── constants/            # guías de postura (texto) e imágenes de referencia
│   │   ├── hooks/                # usePostureSession, usePostureHistory, useScrollToTopOnFocus
│   │   ├── utils/                # errors.ts (mapeo de errores Axios), alert.ts (Alert cross-platform)
│   │   └── types/                # tipos TS compartidos (User, Posture, PostureSession...)
│   ├── assets/                   # imágenes, sonidos (éxito), iconos de la app
│   ├── android/                  # proyecto nativo Android generado por Expo prebuild
│   ├── app.json                  # configuración Expo (permisos de cámara, plugins, bundle id)
│   ├── eas.json                  # perfiles de build EAS + URL del túnel para el perfil `preview`
│   └── package.json
│
├── backend/                      # API (FastAPI)
│   ├── app/
│   │   ├── main.py               # entrypoint, lifespan (crea tablas + seed), CORS, exception handler
│   │   ├── config.py             # Settings (pydantic-settings, lee .env)
│   │   ├── database.py           # engine + SessionLocal + Base
│   │   ├── dependencies.py       # get_db, get_current_user
│   │   ├── models/                # User, Posture, Routine, LiveClass, PostureSession,
│   │   │                          # RoutineSession, CameraConsent, PasswordResetCode
│   │   ├── schemas/                # DTOs Pydantic (auth, posture, session, home, consent)
│   │   ├── routers/                # auth, users, postures, sessions, home
│   │   ├── services/                # analysis.py (MediaPipe), auth.py (JWT/bcrypt), email.py (SMTP)
│   │   └── ml_models/               # modelo `pose_landmarker_lite.task` descargado en runtime (gitignored)
│   ├── alembic/                   # migraciones (env.py + versions/001..005)
│   ├── docker-compose.yml         # Postgres 16 + API en contenedores (SECRET_KEY vía variable de entorno)
│   ├── Dockerfile
│   ├── requirements.txt           # dependencias completas (Docker/producción, incluye mediapipe/psycopg2)
│   ├── requirements_local.txt     # dependencias ligeras para SQLite local
│   ├── setup_local.py             # script de arranque rápido en local
│   ├── test_api.py                # smoke test manual end-to-end contra la API en marcha
│   └── lugna.db                   # base de datos SQLite de desarrollo
│
├── render.yaml                    # configuración del despliegue del frontend web en Render
├── iniciar-servidor.ps1           # automatiza: backend local + túnel Cloudflare + actualización de URLs
├── Iniciar-Lugna.bat              # lanzador de doble clic de iniciar-servidor.ps1
└── README.md
```

### 4.1 Herramientas de desarrollo
- **Control de versiones**: Git, un único remoto GitHub (`estrelladgs/Lugna`), rama principal
  `main` y una rama secundaria `google` (probablemente usada para desarrollar el login con Google
  de forma aislada, ya fusionada en `main`).
- **Gestión de dependencias**: `pip` + `requirements*.txt` (backend), `npm` + `package-lock.json`
  (frontend).
- **Migraciones**: Alembic (`alembic.ini`, `alembic/env.py`, `alembic/versions/001..005`).
- **Variables de entorno**: `.env` / `.env.example` en el backend; el frontend usa
  `EXPO_PUBLIC_API_URL` opcional (por defecto detecta Android emulator vs localhost,
  `app/src/services/api.ts:5`) y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (client id de Google Identity
  Services usado solo en la variante web del login con Google, `GoogleAuthButton.web.tsx`).
  `backend/.env` se llegó a commitear por error en una fase temprana
  del despliegue y se corrigió añadiéndolo a `backend/.gitignore` y quitándolo del repositorio
  (ver sección 5, fase de despliegue) — buena práctica a mencionar en la memoria como lección
  aprendida sobre gestión de secretos.
- **Contenedores**: `docker-compose.yml` + `Dockerfile` para levantar Postgres + API.
- **Despliegue/hosting**: `render.yaml` publica la build web de Expo (`npx expo export -p web`)
  como sitio estático en Render; el backend (con MediaPipe/OpenCV, demasiado pesado para el plan
  gratuito de Render) se sigue ejecutando en local y se expone a internet mediante un túnel de
  Cloudflare (`cloudflared`), automatizado con `iniciar-servidor.ps1`.
- **Linter/formateo**: no se detectan `.eslintrc`, `.prettierrc` ni configuración de linting en
  ninguno de los dos proyectos — no hay linting automatizado configurado.
- **Carpeta `.github/modernize/java-upgrade/`**: contiene únicamente scripts (`recordToolUse.ps1`
  `.sh`) de una herramienta externa de modernización Java; no forma parte del stack de Lugna
  (el proyecto no tiene componentes Java) y no debe incluirse como parte de la arquitectura real.
- **`app/AGENTS.md` / `app/CLAUDE.md`**: nota de contexto para asistentes de IA que advierte de que
  Expo SDK 56 cambió respecto a versiones anteriores y que hay que consultar la documentación
  versionada — un indicio de que el desarrollo se apoyó en asistencia de IA y de los cuidados
  tomados frente a alucinaciones de API.

### 4.2 Puesta en marcha real (pasos verificados en `README.md`)

**Backend (SQLite local)**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements_local.txt
copy .env.example .env
.venv/Scripts/uvicorn app.main:app --reload --port 8000
```
Crea las tablas y siembra datos de ejemplo automáticamente (`main.py:216-220`). Swagger en
`http://localhost:8000/docs`.

**Backend (Docker + PostgreSQL)**
```bash
cd backend
docker compose up
```

**App móvil**
```bash
cd app
npm install
npx expo run:android    # o npx expo run:ios
```
Requiere `expo-dev-client` (no sirve Expo Go). Para iterar sin módulos nativos:
`npx expo start --web`.

**Demo pública (despliegue)**
```powershell
# Desde la raíz del repo, con el venv del backend ya creado:
.\Iniciar-Lugna.bat
```
Arranca Uvicorn en local, abre un túnel público de Cloudflare hacia `localhost:8000` y actualiza
automáticamente `app/eas.json` (y, opcionalmente, la variable de entorno del servicio en Render)
con la nueva URL pública. El frontend web ya desplegado en Render (`lugna-web`, ver `render.yaml`)
apunta a esa URL a través de `EXPO_PUBLIC_API_URL`. Requiere tener `cloudflared` instalado
(`winget install --id Cloudflare.cloudflared`).

---

## 5. HISTORIAL DE DESARROLLO / ITERACIONES

Historial completo (`git log --reverse`), 28 commits entre **2026-05-31** y **2026-07-08**
(≈ 5 semanas y media de desarrollo activo, con una concentración fuerte de commits entre el
2026-07-01 y el 2026-07-08, día en que además se completó todo el despliegue y se hizo una ronda
final de pulido posterior a la demo pública).

| # | Fecha | Commit | Fase |
|---|---|---|---|
| 1 | 2026-05-31 | `879ce29` Initial commit | Bootstrap |
| 2 | 2026-05-31 | `7f44599` Onboarding y home sin backend | Sprint 1 |
| 3 | 2026-06-05 | `c958005` Backend y camara | Sprint 2 |
| 4 | 2026-06-10 | `8490344` arreglos en backend y correcciones en home | Sprint 2 |
| 5 | 2026-07-01 | `53c94af` Página home completa | Sprint 3 |
| 6 | 2026-07-01 | `cdbf278` Corrección estética barra navegación | Sprint 3 |
| 7 | 2026-07-01 | `1abbcd6` Programas y clases hecho | Sprint 3 |
| 8 | 2026-07-01 | `00ccabf` Gráfica niveles completados | Sprint 3 |
| 9 | 2026-07-02 | `26329f7` Arreglos en onboarding, registro y login | Sprint 4 |
| 10 | 2026-07-02 | `b948918` Inicio con google y cambio en estética de todas las páginas | Sprint 4 |
| 11 | 2026-07-04 | `e13170a` Inicio de sesión con google funcional | Sprint 4 |
| 12 | 2026-07-04 | `f5d16f5` Arreglos menores | Sprint 4 |
| 13 | 2026-07-05 | `22daadc` Corrección postural: detecta y corrige | Sprint 5 |
| 14 | 2026-07-05 | `27c5d62` Correcciones en página posturas | Sprint 5 |
| 15 | 2026-07-07 | `c53598b` recuperación de contraseña (email), historial de correcciones y estadísticas | Sprint 6 |
| 16 | 2026-07-08 | `1bdf0ab` Consentimiento de cámara, filtros en rutinas y manejo de errores | Sprint 6 |
| 17 | 2026-07-08 | `b217878` Readme | Cierre/documentación |
| 18 | 2026-07-08 | `618c736` configuracion de despliegue | Sprint 7 (despliegue) |
| 19 | 2026-07-08 | `7b1fa23` despliegue 2 | Sprint 7 (despliegue) |
| 20 | 2026-07-08 | `69aed2a` render.yaml | Sprint 7 (despliegue) |
| 21 | 2026-07-08 | `7c1a640` errores despliegue | Sprint 7 (despliegue) |
| 22 | 2026-07-08 | `3b89445` arreglos deploy y automatizacion backend | Sprint 7 (despliegue) |
| 23 | 2026-07-08 | `23010e9` sign in google en web | Sprint 8 (pulido post-despliegue) |
| 24 | 2026-07-08 | `7cd4e21` permisos de camara y enlaces clases en directo | Sprint 8 (pulido post-despliegue) |
| 25 | 2026-07-08 | `a5eeecf` voz en correcciones para web | Sprint 8 (pulido post-despliegue) |
| 26 | 2026-07-08 | `e915afd` arreglo iOS | Sprint 8 (pulido post-despliegue) |
| 27 | 2026-07-08 | `c8d2fff` reflejo en el esqueleto | Sprint 8 (pulido post-despliegue) |
| 28 | 2026-07-08 | `17a5500` voces en correccion postural: spanish | Sprint 8 (pulido post-despliegue) |

### Fases agrupadas

**Fase 0 — Bootstrap (879ce29, 2026-05-31)**
Estructura inicial de ambos proyectos (Expo + FastAPI).

**Fase 1 — Onboarding y Home sin backend (7f44599)**
Maquetación inicial de pantallas con datos *mock*, sin conectar a la API todavía —
decisión de separar UI de integración para iterar rápido en la interfaz.

**Fase 2 — Backend, cámara y estabilización (c958005, 8490344)**
Primer levantamiento del backend (modelos, auth, base de datos) y primera integración de la
cámara. Segundo commit dedicado explícitamente a "arreglos" — indica una primera ronda de
estabilización tras integrar frontend/backend.

**Fase 3 — Home, programas y clases completos (53c94af, cdbf278, 1abbcd6, 00ccabf)**
Cuatro commits el mismo día (2026-07-01): pantalla Home terminada, ajuste estético de la barra de
navegación, módulo de Programas (rutinas) y Clases funcional, y gráfica de niveles completados
(antecedente del `DonutChart` en `ProgressScreen`). Sugiere una sesión de trabajo intensiva
centrada en completar el "esqueleto" funcional de la app antes de abordar autenticación avanzada.

**Fase 4 — Autenticación avanzada: Google Sign-In (26329f7, b948918, e13170a, f5d16f5)**
Se separan claramente los pasos: primero arreglos generales de onboarding/registro/login, luego
una primera integración de Google (con cambios estéticos transversales a todas las páginas), y dos
días después "funcional" — indicando que la primera integración de Google Sign-In no funcionó a
la primera y necesitó una iteración adicional (`e13170a` vs `b948918`), coherente con la
complejidad de configurar `@react-native-google-signin` en un dev client nativo.

**Fase 5 — Corrección postural con IA (22daadc, 27c5d62)**
Implementación del núcleo de visión por computador: detección y corrección de postura
(MediaPipe) y ajuste posterior de la pantalla de posturas. Los comentarios dejados en
`analysis.py` (ver sección 7) muestran varias iteraciones de refinamiento de las reglas
geométricas por postura (p. ej. el chequeo de plancha se corrigió para no confundir una postura
tumbada de lado con una plancha real; el de *rolling like a ball* para exigir pies levantados y no
solo rodillas al pecho).

**Fase 6 — Funcionalidades de cierre y calidad (c53598b, 1bdf0ab)**
Recuperación de contraseña por email (con código OTP de 6 dígitos y expiración de 15 minutos),
historial de correcciones y estadísticas (racha, progreso, `SessionHistoryScreen`), consentimiento
explícito de cámara (cumplimiento RGPD/legal), filtros de búsqueda en rutinas (nivel/duración/texto)
y manejo de errores más granular en el cliente HTTP. Esta fase concentra los requisitos "no
funcionales" (privacidad, resiliencia ante fallos de red) típicos del pulido final de un TFG.

**Refactorizaciones/cambios de enfoque detectados en el código (no visibles solo en los mensajes de commit)**
- El posture `roll_up` fue retirado del catálogo de posturas corregibles porque "es un movimiento,
  no una postura estática" — borrado explícito y comentado en el *seed* (`main.py:91-93`).
- Varias correcciones de heurística geométrica documentadas como comentarios "por qué" en
  `analysis.py` (plank, spine_stretch, rolling_like_a_ball, single_leg_circles), evidenciando una
  ronda de *debugging* empírico contra falsos positivos/negativos del detector.
- `usePostureSession.ts:42-47` documenta explícitamente un bug de *closure* corregido: leer el
  estado directamente de `usePostureStore.getState()` en vez de la variable capturada, porque el
  `setInterval` se registraba antes de que el hook re-renderizara con la sesión recién iniciada.

**Fase 7 — Despliegue (618c736, 7b1fa23, 69aed2a, 7c1a640, 3b89445 — todos el 2026-07-08)**
Cinco commits el mismo día, posteriores al cierre funcional (`b217878 Readme`), dedicados
íntegramente a publicar una demo accesible por URL en vez de depender solo de builds locales:
1. **`configuracion de despliegue`**: primera versión de `render.yaml` (51 líneas) para desplegar
   el frontend web en Render.
2. **`despliegue 2`**: se simplifica `render.yaml` (de 51 a ~9 líneas), se elimina `backend/.env`
   del repositorio (estaba commiteado) y se añade a `.gitignore`, y `docker-compose.yml` deja de
   tener el `SECRET_KEY` en texto plano — corrección de un problema de gestión de secretos
   detectado al preparar el despliegue público.
3. **`render.yaml`**: ajuste menor (elimina una línea sobrante).
4. **`errores despliegue`**: ronda de correcciones de compatibilidad con el build **web** de Expo
   (hasta entonces la app solo se había probado en Android/iOS nativo): `Alert.alert` es un no-op
   en `react-native-web`, así que se crea `utils/alert.ts` con un `showAlert()` que hace fallback a
   `window.alert`/`window.confirm` en web, y se sustituye en 8 pantallas/componentes; se añade
   `useScrollToTopOnFocus` para que las pantallas con `ScrollView` vuelvan arriba al recibir foco
   (comportamiento que en nativo se daba gratis pero no en web); se corrige que `Speech.speak()`
   podía fallar silenciosamente en web si se llamaba antes de que el navegador cargara su lista de
   voces (se "calienta" con `Speech.getAvailableVoicesAsync()` al montar la pantalla de cámara).
5. **`arreglos deploy y automatizacion backend`**: se añade `iniciar-servidor.ps1` +
   `Iniciar-Lugna.bat` para automatizar el arranque del backend, el túnel de Cloudflare y la
   actualización de la URL pública en `eas.json` (y opcionalmente en Render); y se corrige en
   `RoutineDetailScreen` que abrir el vídeo de YouTube dejaba de funcionar en navegadores si antes
   se esperaba (`await`) a una llamada de red — los navegadores bloquean los popups que no ocurren
   de forma síncrona dentro del gesto de clic del usuario, así que `Linking.openURL` se dispara
   ahora de forma síncrona y el tracking (`routineService.startRoutine`) queda como llamada en
   segundo plano sin bloquear.

Esta fase es un buen ejemplo, para la memoria, de un requisito no funcional que solo aparece al
intentar desplegar de verdad (compatibilidad web, gestión de secretos, restricciones de los
navegadores) y que no se detecta probando exclusivamente en el emulador/dispositivo nativo.

**Fase 8 — Pulido posterior a la demo pública (23010e9, 7cd4e21, a5eeecf, e915afd, c8d2fff, 17a5500
— todos el 2026-07-08)**
Seis commits el mismo día, ya con la demo pública funcionando, centrados en pulir la experiencia
real detectada al probar la app desde fuera del entorno de desarrollo (navegadores y dispositivos
distintos a los usados durante el desarrollo):
1. **`sign in google en web`**: el login con Google, hasta entonces solo nativo
   (`@react-native-google-signin/google-signin`, no disponible en el build web), se separa en
   `GoogleAuthButton.tsx` (nativo) y `GoogleAuthButton.web.tsx` (carga el SDK de Google Identity
   Services en el navegador y renderiza su botón oficial), sustituyendo la lógica que antes estaba
   duplicada dentro de `LoginScreen.tsx`/`RegisterScreen.tsx`.
2. **`permisos de camara y enlaces clases en directo`**: se cachea el consentimiento de cámara en
   `AsyncStorage` para no volver a pedirlo si el backend responde lento; se corrige una fuga de
   `setTimeout` del aviso hablado al cerrar la sesión de cámara; y se cambia el *seed* de rutinas de
   "upsert en cada arranque" a "solo si la tabla está vacía", para poder editarlas directamente en
   la base de datos de producción sin que el backend las sobrescriba al reiniciar.
3. **`voz en correcciones para web`**: se extrae la lógica de `expo-speech` a
   `services/tts.ts`/`tts.web.ts`; la variante web corrige que Chrome/Edge descartan un `speak()`
   llamado justo después de `cancel()` (diferido 150ms) y que la utterance puede perderse por el
   recolector de basura si no se retiene una referencia.
4. **`arreglo iOS`**: Safari en iOS solo permite iniciar voz sintetizada dentro de un gesto de
   usuario directo; se añade `unlockSpeech()` (lanza una locución muda al pulsar "Comenzar") para
   desbloquear el motor de voz del navegador para el resto de la sesión.
5. **`reflejo en el esqueleto`**: se invierte el eje X del esqueleto dibujado sobre la cámara para
   que coincida con la imagen en espejo que la usuaria ve de sí misma (el fotograma enviado al
   backend no está espejado, pero la vista de cámara sí lo está).
6. **`voces en correccion postural: spanish`**: tanto en nativo como en web se empieza a buscar y
   fijar explícitamente una voz instalada en español (`es-*`), en vez de confiar solo en
   `lang: 'es-ES'`, que en algunos dispositivos con el sistema operativo en otro idioma seguía
   leyendo las correcciones con acento no español.

Esta fase ilustra un tipo de defecto distinto al de la Fase 7: ya no son errores de compatibilidad
del *build* web en sí, sino matices de UX que solo se manifiestan al usar la app real en distintos
navegadores/dispositivos (voz, permisos, orientación visual del esqueleto) — validación en
condiciones reales tras el despliegue.

---

## 6. FUNCIONALIDADES IMPLEMENTADAS (mapeo a módulos)

| Funcionalidad | Implementación (frontend) | Implementación (backend) |
|---|---|---|
| Registro / login email+contraseña | `RegisterScreen.tsx`, `LoginScreen.tsx`, `authService.ts` | `routers/auth.py` (`/auth/register`, `/auth/login`), bcrypt en `services/auth.py` |
| Login con Google | `GoogleAuthButton.tsx` (nativo, `googleSignIn.ts`) / `GoogleAuthButton.web.tsx` (Google Identity Services JS), usado en `LoginScreen.tsx`/`RegisterScreen.tsx` | `routers/auth.py::google_auth`, verificación con `google-auth` |
| Recuperación de contraseña | `ForgotPasswordScreen.tsx`, `CodeAndPasswordStep.tsx` | `/auth/password/forgot`, `/auth/password/reset`, `models/password_reset.py`, `services/email.py` |
| Cambio de contraseña (autenticado) | `ChangePasswordScreen.tsx` | `/users/me` (PATCH) *(nota: no hay endpoint dedicado de cambio de contraseña autenticado en el backend revisado — ver sección de huecos)* |
| Renovación de sesión (refresh token) | interceptor Axios en `api.ts` | `/auth/refresh`, `decode_token` |
| Onboarding | `OnboardingScreen.tsx` | — (solo cliente) |
| Consentimiento de cámara (RGPD) | `PostureCameraScreen.tsx` (pantalla de consentimiento previa), `consentService.ts` (con caché local en `AsyncStorage` tras la primera concesión) | `/users/me/consent` (GET/POST), `models/consent.py` |
| Corrección postural en tiempo real | `PostureCameraScreen.tsx`, `SkeletonOverlay.tsx` (esqueleto espejado para coincidir con la vista de la usuaria), `FeedbackOverlay.tsx`, `usePostureSession.ts` | `/posture/analyze`, `services/analysis.py` (MediaPipe + 7 analizadores por ejercicio) |
| Feedback hablado y sonoro | `services/tts.ts`/`tts.web.ts` (voz por plataforma, con desbloqueo de gesto en iOS Safari y selección explícita de voz en español), `expo-audio` en `PostureCameraScreen.tsx` | — (solo cliente, basado en `corrections[]` devuelto por el backend) |
| Historial de sesiones posturales | `SessionHistoryScreen.tsx`, `usePostureHistory.ts` | `/posture/sessions` (GET/POST), `models/session.py::PostureSession` |
| Catálogo de posturas | `PostureSelectScreen.tsx`, `postureGuides.ts`, `postureImages.ts` | `/postures`, `/postures/{id}` |
| Catálogo de rutinas con filtros (nivel/duración/búsqueda) | `RoutineListScreen.tsx` | `/routines` |
| Detalle de rutina + "continuar rutina" | `RoutineDetailScreen.tsx`, `routineService.ts` | `/routines/{id}/start`, `/home/continue-routine` |
| Clases en directo | `ClassesScreen.tsx` | `/home/live-classes` |
| Racha de días activos | `ProgressScreen.tsx` (indicador con icono) | `/home/activity` (cálculo con corrección de huso horario) |
| Progreso / estadísticas (% rutinas completadas, sesiones totales, último programa) | `ProgressScreen.tsx` (donut chart SVG) | `/home/progress` |
| Edición de perfil | `ProgressScreen.tsx` | `/users/me` (PATCH) |
| Baja de cuenta (borrado en cascada) | `ProgressScreen.tsx::handleDeleteAccount` | `/users/me` (DELETE), borra sesiones, consentimientos y códigos |
| Páginas legales | `LegalScreen.tsx`, `PrivacyPolicyScreen.tsx`, `TermsOfUseScreen.tsx` | — (contenido estático) |
| Manejo de errores de red/API | `utils/errors.ts`, banners de error en `PostureCameraScreen.tsx` | manejador global de excepciones (`main.py`) |
| Compatibilidad con build web (demo desplegable) | `utils/alert.ts` (Alert cross-platform), `hooks/useScrollToTopOnFocus.ts`, warm-up de voces TTS en `PostureCameraScreen.tsx`, apertura síncrona de enlaces en `RoutineDetailScreen.tsx` | — (solo cliente) |
| Despliegue y demo pública | — | `render.yaml` (Render, frontend web estático), `iniciar-servidor.ps1`/`Iniciar-Lugna.bat` (backend local + túnel Cloudflare + actualización automática de URL) |

### Requisitos no implementados o parciales detectados
- **Cambio de contraseña autenticado**: existe `ChangePasswordScreen.tsx` en el frontend pero el
  backend revisado (`routers/auth.py`, `routers/users.py`) **no expone un endpoint específico**
  para cambiar la contraseña estando ya logueado (solo el flujo de "olvidé mi contraseña" con
  código OTP). Conviene revisar si esa pantalla reutiliza `/auth/password/reset` o si falta el
  endpoint — **punto a aclarar antes de documentarlo como terminado en la memoria**.
- **Envío real de emails**: `services/email.py` cae a modo *mock* (imprime el código por consola)
  si `SMTP_PASSWORD` no está configurada — en el `.env.example` este campo está vacío por defecto,
  por lo que en un entorno de evaluación sin credenciales SMTP configuradas el envío real no se
  demuestra automáticamente.
- **No hay tests automatizados** más allá de un script de humo manual (ver sección 8) — la
  cobertura de pruebas formal (unitarias/integración con framework tipo `pytest`) está pendiente.
- **No hay CI/CD** configurado para el proyecto (ver sección 8).
- **Imágenes de posturas** (`image_url` en el modelo `Posture`) están seedeadas a `None` en todos
  los registros (`main.py:36,44,52,60,68,76,84`) — el campo existe en el esquema pero no se usa
  activamente (las imágenes de guía se sirven desde `constants/postureImages.ts` en el cliente,
  no desde la API).

---

## 7. ALGORITMOS Y LÓGICA DESTACABLE

### 7.1 Análisis de postura mediante visión por computador (`backend/app/services/analysis.py`)

**Problema a resolver**: a partir de un fotograma de la cámara frontal del móvil, determinar si la
usuaria está ejecutando correctamente uno de 7 ejercicios de pilates, y si no, indicar qué
corregir, en menos de ~1.5s (frecuencia de muestreo del cliente) para que el feedback se perciba
como "en tiempo real".

**Enfoque**: detección de 33 puntos corporales (*landmarks*) con MediaPipe `PoseLandmarker`, y
sobre esos puntos, un conjunto de reglas geométricas (ángulos articulares y distancias relativas)
específicas por ejercicio — no se entrena ningún modelo propio; el "modelo de IA" es de terceros
(Google) y la lógica de negocio (biomecánica) es hecha a mano.

**Pseudocódigo del flujo general:**

```
función analizar_postura(id_postura, fotograma_base64):
    si MediaPipe no está disponible:
        devolver respuesta_simulada(id_postura)   // fallback determinista con score aleatorio

    decodificar base64 → imagen BGR → convertir a RGB
    si la imagen no se puede decodificar:
        devolver respuesta_simulada(id_postura)

    landmarker ← obtener_instancia_singleton()      // descarga el modelo .task la 1ª vez
    resultado ← landmarker.detectar(imagen)

    si no se detectó ninguna persona:
        devolver {score: 0, corrections: ["no se detecta a la persona"]}

    puntos ← resultado.landmarks[0]                 // 33 puntos (x, y, z, visibilidad)

    // Paso 1: comprobación de orientación corporal
    problema_orientación ← comprobar_orientación(puntos, id_postura)
       // usa 3 categorías: tumbado boca arriba (supino), boca abajo (prono), sentado
       // ejemplo: si la postura requiere estar tumbado y la inclinación
       // hombro-cadera > 45°, la usuaria está sentada/de pie → mensaje específico
    si hay problema_orientación:
        devolver {score: 0, corrections: [mensaje], landmarks: puntos}

    // Paso 2: analizador específico del ejercicio (uno de 7, por id_postura)
    analizador ← seleccionar_analizador(id_postura)
    resultado ← analizador(puntos)
        // cada analizador:
        //   - calcula 1-4 ángulos/distancias relevantes para ESE ejercicio
        //     (p.ej. ángulo hombro-cadera-tobillo para la plancha,
        //      elevación cadera-tobillo para "El Cien",
        //      curva hombro-cadera-rodilla para "rodar como una pelota")
        //   - por cada chequeo fallido: resta puntos (10-40) y añade un mensaje
        //     de corrección en español + los landmarks implicados
        //   - score final = 100 - suma de penalizaciones (mínimo 0)

    es_correcta ← score >= 70 Y no hay mensajes de corrección

    devolver {
        isCorrect: es_correcta,
        score: score,
        corrections: mensajes,
        landmarks: puntos (para dibujar el esqueleto en el cliente),
        incorrectLandmarks: índices de los puntos que fallan (para resaltarlos en rojo)
    }
```

**Ejemplo de regla concreta (plancha, `_analyze_plank`):**
```
ángulo_cuerpo ← ángulo(hombro, cadera, tobillo)
si |180° - ángulo_cuerpo| > 20°:
    si cadera está más alta que hombro: "baja las caderas"
    si no: "eleva las caderas"

si ángulo_pierna_izquierda < 150° O ángulo_pierna_derecha < 150°:
    "extiende ambas piernas por completo"

ángulo_apoyo ← ángulo(cadera, hombro, codo)
si ángulo_apoyo < 45° O > 135°:
    "apoya el peso sobre el antebrazo/mano con el codo doblado bajo el hombro"

si |x(muñeca) - x(hombro)| > 0.15:
    "coloca los hombros directamente sobre las muñecas"
```

**Decisiones de diseño destacables (documentadas como comentarios "por qué" en el propio código):**
- Se comprueban **ambas piernas** en la plancha para no confundir una postura de lado (con una
  rodilla doblada) con una plancha válida.
- El ángulo del brazo de apoyo se acota entre 45° y 135° para diferenciar "cargar peso con el codo
  doblado" de "brazo pegado al cuerpo" (~0°) o "brazo estirado hacia atrás, tumbado boca arriba"
  (~180°).
- En *spine stretch*, se mide la distancia mano-pie directamente en vez de relativa al hombro,
  porque en un pliegue profundo el hombro también se desplaza y generaba falsos negativos.
- En *rolling like a ball*, se exige que los pies estén levantados del suelo, para no confundir la
  postura con estar sentada simplemente abrazando las rodillas.
- En *single leg circles*, se evalúa **cualquiera de las dos piernas** (la que esté más elevada),
  porque el ejercicio es simétrico y limitar el chequeo a una sola pierna solo funcionaba si la
  usuaria elegía esa pierna concreta.

### 7.2 Cálculo de racha de días activos (`routers/home.py::get_activity`)

```
función calcular_racha(usuario, offset_huso_horario):
    días_activos ← conjunto vacío
    para cada sesión_postural del usuario:
        añadir fecha(sesión.created_at - offset) a días_activos
    para cada sesión_rutina del usuario:
        añadir fecha(sesión.started_at - offset) a días_activos

    hoy ← fecha_actual - offset
    racha ← 0
    día ← hoy
    mientras día esté en días_activos:
        racha += 1
        día ← día - 1 día
    devolver racha
```
Corrige el huso horario del cliente (`tz_offset_minutes`, equivalente a
`Date.getTimezoneOffset()` en JS) para que el "día" se calcule en la zona horaria de la usuaria y
no en UTC del servidor.

### 7.3 Renovación transparente de sesión (frontend, `services/api.ts`)
Patrón de "cola de peticiones" para evitar refrescar el token en paralelo desde varias peticiones
concurrentes: la primera petición que recibe un 401 dispara el refresh; las que llegan mientras
tanto se encolan (`refreshQueue`) y se reintentan automáticamente con el nuevo token cuando este
llega, sin que la usuaria perciba el corte de sesión.

### 7.4 Síntesis de voz multiplataforma (`services/tts.ts` / `tts.web.ts`)
Capa de abstracción (`warmUp`, `unlockSpeech`, `stopSpeaking`, `speakCorrection`) por encima de
`expo-speech` (nativo) y de la Web Speech API (`window.speechSynthesis`, en la variante `.web`),
motivada por varios comportamientos de los navegadores que no tienen equivalente en móvil nativo:

- **Descarte silencioso de `speak()` tras `cancel()`** (Chrome/Edge, crbug.com/679437): al corregir
  varias veces seguidas se llama a `cancel()` antes de la siguiente frase; si el `speak()` se
  invoca en el mismo tick, el navegador lo ignora sin lanzar ningún evento de error. Se soluciona
  difiriendo el `speak()` 150 ms con un `setTimeout` para dar tiempo a que el `cancel()` se asiente.
- **Recolección de basura de la utterance a mitad de la frase** (crbug.com/509488): si no se
  mantiene una referencia fuerte al `SpeechSynthesisUtterance`, el motor puede cortar la voz antes
  de terminar; se retiene en una variable de módulo (`currentUtterance`) hasta el evento `onend`.
- **Bloqueo por gesto de usuario en iOS Safari**: el motor de voz del navegador solo permite hablar
  si la primera invocación ocurre síncronamente dentro de un gesto directo (un `tap`); las llamadas
  posteriores y asíncronas (como las correcciones, que llegan tras la respuesta HTTP del análisis)
  se descartan si el motor no se "desbloqueó" antes. `unlockSpeech()` lanza una locución con
  `volume: 0` en el propio `onPress` del botón "Comenzar" para habilitar el resto de la sesión.
- **Acento incorrecto pese a `lang: 'es-ES'`**: fijar solo el idioma no garantiza una voz en
  español si el idioma de la interfaz del sistema operativo no lo es; se recorre
  `getVoices()`/`getAvailableVoicesAsync()` buscando una voz `es-es` (o, si no existe, cualquier
  `es-*`) y se fija explícitamente vía `utterance.voice` / el parámetro `voice` de `expo-speech`.

Ninguno de estos casos produce un error explícito — todos son fallos silenciosos detectados
únicamente probando la demo real en distintos navegadores/dispositivos tras el despliegue (Fase 8).

---

## 8. PRUEBAS EXISTENTES

### 8.1 Inventario
- **`backend/test_api.py`**: único fichero de pruebas del repositorio. Es un **script de humo
  manual** (no usa `pytest`/`unittest`, no tiene *asserts* automáticos: imprime resultados por
  consola y lanza una excepción genérica si alguna petición HTTP falla). Se ejecuta a mano contra
  una instancia real del backend ya arrancada (`http://localhost:8000`), no está integrado en un
  pipeline.
  - Cubre: registro, login, refresh token, listado de posturas, detalle de postura, análisis de
    postura (con MediaPipe en modo mock, frame `"aGVsbG8="` no es una imagen real), guardado de
    sesión, listado de sesiones, listado de rutinas.
  - **No cubre**: login con Google, recuperación de contraseña, consentimiento de cámara, edición
    de perfil, borrado de cuenta, endpoints de `/home/*` (clases, actividad, progreso, continuar
    rutina), casos de error (credenciales incorrectas, tokens expirados/inválidos, email
    duplicado), ni ningún test del frontend (no hay Jest ni Testing Library configurados en
    `package.json`).
- **No se encontraron colecciones de Postman/Insomnia** en el repositorio.
- La documentación interactiva de Swagger (`/docs`, generada automáticamente por FastAPI a partir
  de los `response_model` de Pydantic) actúa como referencia de contrato de API, pero no como
  suite de pruebas.

### 8.2 CI/CD
- **No hay pipelines de CI/CD configurados** para este proyecto: no existe carpeta
  `.github/workflows/`. La única carpeta bajo `.github/` (`modernize/java-upgrade/`) pertenece a
  una herramienta externa de modernización de código Java y es ajena a Lugna (el proyecto no tiene
  ningún componente Java) — no debe describirse como pipeline del TFG.

---

## 9. ESTADO ACTUAL / MÉTRICAS

| Métrica | Valor |
|---|---|
| Commits totales (rama `main`) | 28 |
| Primer commit | 2026-05-31 (`879ce29`) |
| Último commit | 2026-07-08 (`17a5500`) |
| Duración total del desarrollo | ≈ 39 días naturales (~5.5 semanas) |
| Líneas de código backend (`backend/app/**/*.py`) | ≈ 1.487 líneas (sin contar `test_api.py`) |
| Líneas de código frontend (`app/src/**/*.ts(x)`) | ≈ 5.752 líneas |
| Ficheros de routers backend | 5 (`auth`, `users`, `postures`, `sessions`, `home`) |
| Endpoints REST totales | 21 |
| Modelos de datos (tablas) | 7 (`users`, `postures`, `routines`, `live_classes`, `posture_sessions`, `routine_sessions`, `camera_consents`, `password_reset_codes` — 8 tablas) |
| Migraciones Alembic | 5 (`001` inicial → `005` consentimiento de cámara) |
| Posturas de corrección postural seeded | 7 |
| Rutinas de pilates seeded | 4 (seed único, editable directamente en producción desde `3b89445`+) |
| Clases en directo seeded | 7 |
| Pantallas (screens) del frontend | 17 |
| Cobertura de tests automatizados | 0% con framework formal; 1 script de humo manual sin asserts |
| CI/CD | No configurado |

### TODOs / pendientes detectados en el código o por inspección
- Aclarar el endpoint real de "cambio de contraseña estando autenticado" (`ChangePasswordScreen.tsx`
  existe en el frontend; no se localizó un router backend específico distinto del flujo OTP de
  recuperación — sección 6).
- `image_url` de `Posture` siempre `None` en el seed — campo del modelo sin usar en la práctica.
- Comentario explícito en `routers/postures.py`/`main.py` (seed) indicando que **editar rutinas o
  clases requiere tocar el código y reiniciar el backend** — no hay panel de administración.
- No hay *rate limiting* ni protección explícita contra fuerza bruta en `/auth/login` ni en el
  envío de códigos de recuperación (`/auth/password/forgot`), más allá del TTL de 15 minutos del
  código.
- El repositorio llegó a tener `backend/.env` (con `SECRET_KEY` y credenciales SMTP) commiteado en
  un momento dado de la fase de despliegue; se corrigió (fichero eliminado del repo y añadido a
  `.gitignore`, `SECRET_KEY` movido a variable de entorno en `docker-compose.yml`), pero conviene
  revisar el historial de git si se va a hacer público el repositorio, ya que el secreto pudo quedar
  expuesto en commits anteriores aunque ya no esté en el `HEAD` actual.
- El backend de producción/demo no está desplegado en un servicio gestionado: depende de que el
  ordenador de la autora esté encendido y el túnel de Cloudflare activo (URL efímera, cambia cada
  vez que se reinicia `iniciar-servidor.ps1`) — limitación a mencionar honestamente en la memoria
  si se presenta como "despliegue en producción".
- Las 7 clases en directo seeded comparten actualmente el mismo enlace de Google Meet
  (`https://meet.google.com/wcn-ncvn-owo`, `main.py`, commit `7cd4e21`) en vez de tener cada una su
  propio enlace — probablemente un valor de marcador de posición pendiente de sustituir por salas
  reales antes de una demo en directo.
- `backend/app/__pycache__/*.pyc` está commiteado en el repositorio (no hay `__pycache__` en
  ningún `.gitignore`) — no afecta al funcionamiento pero es ruido de control de versiones que
  convendría excluir.

---

## 10. ENLACE AL REPOSITORIO

- **Remoto**: `https://github.com/estrelladgs/Lugna.git`
- **Rama principal**: `main`
- **Rama secundaria**: `google` (existe en local; no se ha verificado si sigue activa o ya fue
  fusionada por completo en `main`)
