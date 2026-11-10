// Única fuente de datos de la invitación. Edita solo este archivo.
window.INVITE = {
  child: {
    firstName: "Isaac",
    fullName: "Isaac David Quimbayo Álvarez",
    age: 2
  },

  // Fecha y hora de llegada, con desfase de Colombia (UTC-5, sin horario de verano).
  date: "2026-12-05T18:00:00-05:00",
  timeZone: "America/Bogota",
  // Duración supuesta de la fiesta (solo se usa para el archivo de calendario).
  durationHours: 4,

  venue: {
    // Vacío = no se muestra. La fiesta es en casa, así que no hay nombre de lugar.
    name: "",
    // Nota breve bajo la dirección. Vacío = no se muestra.
    note: "Es en nuestra casa. ¡Te esperamos con los brazos abiertos!",
    address: "Calle 33 A Sur # 13A-22",
    neighborhood: "Barrio San Pablo",
    city: "Bogotá, Colombia",
    // Vacío = el enlace de mapa se genera a partir de la dirección.
    mapUrl: ""
  },

  rsvp: {
    // Fecha límite para confirmar (AAAA-MM-DD): martes 1 de diciembre.
    deadline: "2026-12-01",
    // WhatsApp (ya no se usa en el formulario; se deja por si quieres mostrarlo en otro lugar).
    whatsapp: "573112896676",
    // URL de la aplicación web de Google Apps Script (termina en /exec). Aquí se guardan las respuestas.
    endpoint: "https://script.google.com/macros/s/AKfycbwEvl6HystedBBbP3QqHbr09Ifju_8D0_898EpRVHOwC4nvutP8LVMmGsAWqO2EzRFH/exec"
  },

  // Archivo de audio con licencia, p. ej. "assets/musica.mp3". Vacío = no hay botón de música.
  music: "assets/musica.mp3"
};
