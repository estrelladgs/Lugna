import React from 'react';
import LegalScreen from './LegalScreen';

export default function TermsOfUseScreen() {
  return (
    <LegalScreen
      title="Condiciones de Uso"
      updatedAt="7 de julio de 2026"
      sections={[
        {
          heading: '1. Aceptación de las condiciones',
          body: 'Al crear una cuenta y utilizar Lugna aceptas estas condiciones de uso. Si no estás de acuerdo con ellas, no debes utilizar la aplicación.',
        },
        {
          heading: '2. Descripción del servicio',
          body: 'Lugna es una aplicación de apoyo al entrenamiento de pilates que ofrece rutinas, corrección postural asistida mediante cámara y seguimiento del progreso del usuario.',
        },
        {
          heading: '3. Uso previsto — no es un servicio médico',
          body: 'La corrección postural y las rutinas de Lugna tienen un propósito orientativo y educativo. No sustituyen la valoración de un profesional sanitario o entrenador cualificado. Si tienes alguna lesión o condición médica, consulta a un profesional antes de realizar los ejercicios.',
        },
        {
          heading: '4. Responsabilidad del usuario',
          body: 'Eres responsable de realizar los ejercicios en un espacio seguro y adecuado, y de detener la actividad si sientes dolor o malestar. El uso de la aplicación es bajo tu propia responsabilidad.',
        },
        {
          heading: '5. Cuenta de usuario',
          body: 'Eres responsable de mantener la confidencialidad de tus credenciales de acceso. Puedes editar tus datos o eliminar tu cuenta en cualquier momento desde la sección de Perfil.',
        },
        {
          heading: '6. Disponibilidad del servicio',
          body: 'Al tratarse de un proyecto educativo, algunas funciones (como el análisis de postura o las clases en directo) pueden no estar disponibles de forma puntual. Trabajamos para minimizar estas interrupciones.',
        },
        {
          heading: '7. Modificaciones',
          body: 'Estas condiciones pueden actualizarse para reflejar cambios en la aplicación. Te recomendamos revisarlas periódicamente desde esta misma sección.',
        },
        {
          heading: '8. Contacto',
          body: 'Para cualquier duda sobre estas condiciones, puedes escribir a lugnacore@gmail.com.',
        },
      ]}
    />
  );
}
