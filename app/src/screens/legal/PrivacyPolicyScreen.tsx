import React from 'react';
import LegalScreen from './LegalScreen';

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Política de Privacidad"
      updatedAt="7 de julio de 2026"
      sections={[
        {
          heading: '1. Responsable del tratamiento',
          body: 'Lugna es una aplicación desarrollada como Trabajo de Fin de Grado con fines educativos. El responsable del tratamiento de los datos es el equipo desarrollador de la aplicación, contactable a través del correo indicado en el apartado de contacto.',
        },
        {
          heading: '2. Datos que recopilamos',
          body: 'Recopilamos el nombre y correo electrónico que proporcionas al registrarte (o los que facilita tu cuenta de Google si inicias sesión con ella), así como el historial de tus sesiones de entrenamiento y corrección postural (postura practicada, fecha, duración y puntuación media).',
        },
        {
          heading: '3. Análisis de imagen y cámara',
          body: 'Durante la corrección postural, la cámara captura fotogramas que se envían a nuestro servidor únicamente para detectar los puntos clave del cuerpo (landmarks) y generar feedback en tiempo real. Estos fotogramas no se almacenan ni se comparten con terceros: se procesan al vuelo y se descartan inmediatamente después del análisis.',
        },
        {
          heading: '4. Finalidad del tratamiento',
          body: 'Los datos se utilizan exclusivamente para ofrecerte el servicio de la app: autenticarte, mostrarte tu progreso e historial, y corregir tu postura durante los ejercicios de pilates.',
        },
        {
          heading: '5. Conservación de datos',
          body: 'Tus datos se conservan mientras mantengas tu cuenta activa. Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento desde la sección de Perfil.',
        },
        {
          heading: '6. Tus derechos',
          body: 'Puedes acceder, rectificar o eliminar tus datos personales en cualquier momento. La edición de perfil y la eliminación de cuenta están disponibles directamente desde la app, en la pestaña Perfil.',
        },
        {
          heading: '7. Terceros',
          body: 'Si inicias sesión con Google, dicho servicio trata tus datos conforme a su propia política de privacidad. No compartimos tus datos con ningún otro tercero con fines comerciales.',
        },
        {
          heading: '8. Contacto',
          body: 'Para cualquier consulta sobre tus datos o esta política, puedes escribir a contacto@lugna-app.com.',
        },
      ]}
    />
  );
}
