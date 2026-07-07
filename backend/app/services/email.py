import smtplib
from email.mime.text import MIMEText

from app.config import settings


def send_password_reset_email(to_email: str, code: str) -> None:
    subject = "Tu código de verificación de Lugna"
    body = (
        "Hola,\n\n"
        f"Tu código para recuperar o cambiar tu contraseña en Lugna es: {code}\n\n"
        "Este código caduca en 15 minutos. Si no has solicitado este cambio, puedes ignorar este mensaje.\n\n"
        "— Equipo Lugna"
    )

    if not settings.SMTP_PASSWORD:
        # Sin credenciales SMTP configuradas (desarrollo local): se muestra el código en consola.
        print(f"[email:mock] Código de verificación para {to_email}: {code}")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())
