"""
Script de configuración para levantar el backend en local sin Docker.
Requiere PostgreSQL instalado y en ejecución.

Uso:
    python setup_local.py
"""

import subprocess
import sys
import os


def run(cmd: str, check=True):
    print(f"  $ {cmd}")
    result = subprocess.run(cmd, shell=True, check=check)
    return result.returncode


def main():
    print("=" * 60)
    print("  Lugna Backend — Setup Local")
    print("=" * 60)

    # 1. Crear entorno virtual si no existe
    if not os.path.exists(".venv"):
        print("\n[1/4] Creando entorno virtual...")
        run(f"{sys.executable} -m venv .venv")
    else:
        print("\n[1/4] Entorno virtual ya existe.")

    # Detectar ruta de pip según SO
    if sys.platform == "win32":
        pip = ".venv\\Scripts\\pip"
        python = ".venv\\Scripts\\python"
    else:
        pip = ".venv/bin/pip"
        python = ".venv/bin/python"

    # 2. Instalar dependencias
    print("\n[2/4] Instalando dependencias...")
    run(f"{pip} install --quiet -r requirements.txt")

    # 3. Copiar .env si no existe
    if not os.path.exists(".env"):
        print("\n[3/4] Creando .env desde .env.example...")
        import shutil
        shutil.copy(".env.example", ".env")
        print("  ⚠  Edita .env para ajustar DATABASE_URL y SECRET_KEY.")
    else:
        print("\n[3/4] .env ya existe.")

    # 4. Crear tablas + seed (via uvicorn startup event)
    print("\n[4/4] Las tablas y datos de ejemplo se crean automáticamente al arrancar.")

    print("\n" + "=" * 60)
    print("  Setup completado.")
    print("  Arranca el servidor con:")
    print(f"    {python} -m uvicorn app.main:app --reload --port 8000")
    print("  Documentación: http://localhost:8000/docs")
    print("=" * 60)


if __name__ == "__main__":
    main()
