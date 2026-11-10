# Invitación web de cumpleaños · Isaac, 2 años (dinosaurios)

Invitación digital para móvil con apertura de sobre sellado, cuenta regresiva, ubicación, calendario y **confirmación de asistencia guardada en Google Sheets**. Es una web estática (HTML, CSS y JavaScript sin build), pensada para compartirse por WhatsApp y desplegarse gratis en Vercel.

> Diseñada primero para móvil (360–430 px). En escritorio se centra una columna de 480 px.

---

## 1. Qué incluye

| Sección | Qué hace |
|---|---|
| **Sobre de apertura** | Sobre sellado con humo del volcán, nubes y lava animados. Al tocar el sello se abre con luz, sacudida y confeti. Botón "Saltar". |
| **Portada** | "¡Estás cordialmente invitado!", nombre, edad y versículo bíblico (Jeremías 1:5, RVR1960). |
| **Invitación** | Mensaje de bienvenida, fecha y hora en tarjetas. |
| **Cuenta regresiva** | Días, horas, minutos y segundos hasta la fiesta (hora de Colombia). |
| **Ubicación** | Dirección y botón "Cómo llegar" (abre Google Maps). |
| **Confirmación** | Formulario con validaciones: nombre, sí/no, adultos y niños, mensaje para el cumpleañero. Confeti y mensajes de gracias. |
| **Cierre** | Botón "Añadir al calendario" (archivo `.ics`), huevos de dinosaurio y polvo que sube. |
| **Música** | Canción de fondo a volumen bajo (12 %), con botón de pausa. |

Detalles de comportamiento:
- Siempre empieza en el sobre: al recargar, arrastrar hacia abajo desde arriba o tocar "Ver el sobre otra vez".
- Respeta `prefers-reduced-motion` (sin animaciones para quien lo pide).
- La música arranca al abrir la página; si el navegador lo bloquea, empieza con el primer toque.

---

## 2. Cómo está hecha

- **Sin build ni dependencias:** se abre con cualquier servidor estático. No hay `npm`, ni framework.
- **Una sola fuente de datos:** todo el contenido (nombre, fecha, dirección, textos del lugar, fecha límite, música, URL de Google) vive en `config.js`. La cuenta regresiva, el calendario y los textos se calculan desde ahí.
- **Animaciones:** [GSAP](https://gsap.com/) 3.12.5 y ScrollTrigger, incluidos en `vendor/` (no se cargan desde internet). El confeti y el polvo son `canvas` propios.
- **Aparición de contenido:** se hace con `IntersectionObserver`, así que no se rompe cuando cambia el alto de la página (por ejemplo, al ocultar el formulario).
- **Imágenes:** todo el arte son imágenes aportadas por el cliente, en WebP con transparencia. No hay dibujos en CSS ni SVG.
- **Tipografías:** Lilita One (títulos) y Fredoka (texto), en `vendor/fonts/`, con `font-display: swap`.
- **Fechas:** `Intl.DateTimeFormat` con zona `America/Bogota` (UTC-5, sin horario de verano).
- **Accesibilidad:** HTML semántico, etiquetas en el formulario, `aria-live` en la cuenta regresiva, foco visible, modal con cierre por Escape.

### Estructura de archivos

```
.
├── index.html            Estructura de la página
├── styles.css            Estilos (mobile first)
├── main.js               Lógica: sobre, animaciones, cuenta regresiva, formulario, música
├── config.js             DATOS DE LA INVITACIÓN (único archivo que se edita)
├── vercel.json           Cabeceras de seguridad y caché para Vercel
├── assets/
│   ├── img/              Dinosaurios, sobre, portada, hojas, huevos, huellas (WebP)
│   ├── musica.mp3        Canción de fondo
│   └── social.jpg        Imagen de vista previa al compartir el enlace (1200×630)
├── vendor/               GSAP, ScrollTrigger y tipografías locales
├── apps-script/
│   └── google-apps-script.gs   Código que guarda las confirmaciones en Google Sheets
└── social.html           Plantilla para regenerar social.jpg (no se publica)
```

---

## 3. Ejecutarla en tu computador

```bash
python -m http.server 5182
```

Abre `http://localhost:5182`. Para probar sin que suene la música, usa `http://localhost:5182/?nomusic`.

---

## 4. Personalizar (`config.js`)

| Campo | Para qué sirve |
|---|---|
| `child` | Nombre, nombre completo y edad. |
| `date`, `timeZone` | Fecha y hora de llegada, con desfase (`2026-11-28T17:00:00-05:00`). |
| `durationHours` | Duración supuesta, solo para el archivo de calendario. |
| `venue` | Nombre del lugar (vacío = no se muestra), nota, dirección, barrio, ciudad y `mapUrl` (opcional). |
| `rsvp.deadline` | Fecha límite (`AAAA-MM-DD`). Pasado ese día, el formulario desaparece. |
| `rsvp.endpoint` | URL de la aplicación web de Google Apps Script (termina en `/exec`). |
| `rsvp.whatsapp` | Número con indicativo y solo dígitos. Se usa solo para el enlace "Si algo cambia…". |
| `music` | Ruta del audio. Vacío = no aparece el botón de música. |

Los textos fijos (títulos, versículo, mensajes) están en `index.html` y `main.js`. Las imágenes se cambian sustituyendo el archivo en `assets/img/` por otro con el mismo nombre.

---

## 5. Confirmaciones en Google Sheets

Las respuestas se guardan en una hoja de cálculo mediante Google Apps Script. Es gratis y no requiere servidor.

1. Crea una hoja en [sheets.new](https://sheets.new).
2. **Extensiones → Apps Script**, pega el contenido de `apps-script/google-apps-script.gs` y guarda.
3. Ejecuta la función `configurar` una vez y acepta los permisos (se crean las pestañas **Respuestas**, **Resumen** e **Historial**).
4. **Implementar → Nueva implementación → Aplicación web**: *Ejecutar como: yo* y *Quién tiene acceso: cualquier persona*.
5. Copia la URL que termina en `/exec` y pégala en `rsvp.endpoint` de `config.js`.
6. Si cambias el script más adelante: **Implementar → Administrar implementaciones → ✏️ → Nueva versión**. La URL no cambia.

**Reglas que aplica el script:**
- Después de la fecha límite (`CIERRE`) rechaza respuestas, aunque alguien salte la página.
- Quien ya confirmó "Sí" no puede responder otra vez.
- Quien dijo "No" puede cambiar a "Sí" (se actualiza su fila).
- Los nombres se comparan sin importar mayúsculas, tildes ni espacios.
- Máximo 30 envíos por minuto y 500 filas.
- El texto se limpia: largo máximo, sin caracteres de control y sin fórmulas.
- Pestaña **Historial** con cada respuesta nueva o cambio.
- Opcional: un correo por cada confirmación (`AVISAR_POR_CORREO`).

**Dónde está la fecha límite:** hay que mantenerla igual en dos lugares: `rsvp.deadline` en `config.js` y `CIERRE` en el script.

---

## 6. Seguridad y privacidad

- `vercel.json` aplica una política de seguridad de contenido (CSP) que solo permite recursos propios y la conexión a Google Apps Script, además de `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
- El formulario lleva un campo señuelo contra robots y una espera mínima antes de enviar.
- Los textos de los invitados se insertan siempre como texto (nunca como HTML).
- La página lleva `noindex`: es una invitación privada y no debe aparecer en buscadores.
- La URL del script no es una clave secreta: solo permite **enviar** confirmaciones, no leer ni borrar la hoja.
- El repositorio contiene datos personales (nombre del niño, dirección, WhatsApp y URL del script). **Manténlo privado.**
- El formulario avisa: "Guardaremos tus datos con cariño, solo para organizar la fiesta de Isaac". Para uso comercial en Colombia, ajusta este aviso a la política de tratamiento de datos (Ley 1581).

**Límites conocidos:**
- No hay inicio de sesión: la persona se identifica por su nombre. Alguien podría escribir el nombre de otro.
- El recuerdo de "ya confirmaste" se guarda en el navegador del invitado (`localStorage`). Si borra los datos del sitio, vuelve a ver el formulario, pero el servidor sigue impidiendo duplicados.

---

## 7. Publicar en Vercel (gratis)

1. Sube este repositorio a GitHub (privado).
2. En [vercel.com](https://vercel.com), **Add New → Project**, elige el repositorio y pulsa **Deploy**. No hace falta ningún ajuste de build.
3. **Vista previa al compartir (WhatsApp, etc.):** las etiquetas `og:` de `index.html` ya apuntan a la dirección completa de la imagen (`https://isaac-2-years-invitacion.vercel.app/assets/social.jpg`). Si cambias de dominio, actualiza `og:url`, `og:image`, `og:image:secure_url` y `twitter:image`. La imagen debe ser pública y de menos de 300 KB (`social.jpg` pesa unos 73 KB). Para regenerarla, usa `social.html`.
   - WhatsApp guarda la vista previa de cada enlace. Si ya compartiste el enlace antes de corregirla, comparte `…vercel.app/?v=2` o vuelve a leerlo en el [Depurador de Facebook](https://developers.facebook.com/tools/debug/) (botón *Scrape Again*).
4. Haz una confirmación de prueba y borra esa fila de la hoja antes de enviar la invitación.

---

## 8. A qué clientes puede ir este tipo de invitación

**Celebraciones familiares**
- Cumpleaños infantiles y de adultos, baby showers, revelaciones de género.
- Bautizos, primeras comuniones, quinceañeras y grados.
- Bodas pequeñas, aniversarios y reuniones familiares.

**Profesionales y negocios que venden servicios de eventos**
- Organizadores de eventos y *party planners*.
- Decoradores, fotógrafos y salones de fiestas que quieran ofrecer "invitación web" como valor agregado.
- Agencias y freelancers que vendan invitaciones digitales como producto.

**Eventos pequeños de empresas o comunidades**
- Lanzamientos, inauguraciones, cumpleaños de marca o reuniones de equipo.
- Iglesias, colegios y grupos que necesiten un conteo simple de asistentes.

**Por qué funciona para ellos**
- Se comparte con un solo enlace por WhatsApp y se abre sin instalar nada.
- El anfitrión ve en vivo cuántos adultos y niños vienen (pestaña **Resumen**).
- Es económica de mantener: no tiene servidor ni base de datos de pago.
- Se adapta cambiando un archivo (`config.js`), las imágenes y los textos.

**Cuándo no es la mejor opción**
- Eventos con venta de entradas o pagos.
- Eventos de miles de invitados (el script está limitado a 500 respuestas y 30 por minuto; se puede ajustar, pero Sheets no está pensado para grandes volúmenes).
- Casos que necesiten cuentas de usuario, asignación de mesas o confirmaciones con identidad verificada.

---

## 9. Reutilizarla para otro evento

1. Duplica el repositorio y cambia los datos en `config.js`.
2. Sustituye las imágenes de `assets/img/` por las del nuevo tema (mismos nombres, WebP con fondo transparente para los personajes).
3. Cambia los textos de `index.html` (títulos, mensajes, versículo o frase de la portada) y los textos de `main.js` si cambia el tono.
4. Ajusta la paleta en las variables `:root` de `styles.css`.
5. Crea una hoja y un script nuevos (sección 5) y pega la URL en `rsvp.endpoint`.
6. Cambia `CIERRE` en el script y `rsvp.deadline` en `config.js`.

---

## 10. Estado de las pruebas y pendientes

- Probada en el navegador de pruebas de escritorio a 360×740, 375×667 y 390×844. **No se ha probado en un iPhone ni en un Android reales**: conviene revisar la música, el gesto de arrastrar para recargar y la fluidez de las animaciones.
- La política de seguridad (CSP) se probó en un servidor local con las mismas cabeceras; en Vercel debe comprobarse una vez desplegada.
- Pendiente al publicar: borrar las filas de prueba de la hoja y comprobar la vista previa del enlace en WhatsApp.

## 11. Licencias y créditos

- **Imágenes y música:** aportadas por el cliente. Verifica que la canción permita su uso en una página pública.
- **GSAP y ScrollTrigger:** licencia gratuita de GreenSock/Webflow. **Fredoka** y **Lilita One:** SIL Open Font License.
