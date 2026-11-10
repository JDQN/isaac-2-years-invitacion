/**
 * Recibe las confirmaciones de la invitación de Isaac y las guarda en esta hoja de Google.
 *
 * Reglas:
 *  - Después de la fecha límite (CIERRE) ya no se aceptan respuestas.
 *  - Quien ya confirmó "Sí" no puede responder de nuevo.
 *  - Quien dijo "No" puede cambiar a "Sí" (se actualiza su fila).
 *  - Hay un límite de respuestas por minuto y de filas, para que nadie llene la hoja de basura.
 *  - Todo texto se limpia (largo máximo y sin fórmulas) antes de guardarse.
 *
 * Después de pegar este código: Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 */
var HOJA = "Respuestas";
var HISTORIAL = "Historial";
var AVISAR_POR_CORREO = true;                 // true = te llega un correo con cada confirmación nueva
var CIERRE = "2026-12-01T23:59:59-05:00";     // martes 1 de diciembre, fin del día (hora de Colombia)
var MAX_FILAS = 500;                          // tope de respuestas guardadas
var MAX_POR_MINUTO = 30;                      // tope de envíos por minuto (todos juntos)

function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Fecha", "Nombre", "Asistencia", "Adultos", "Niños", "Total personas", "Mensaje para Isaac"]);
    sh.getRange("A1:G1").setFontWeight("bold").setBackground("#D9F0E2");
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 1, 150); sh.setColumnWidths(2, 1, 200); sh.setColumnWidths(7, 1, 400);
  }
  historial_();
  var res = ss.getSheetByName("Resumen") || ss.insertSheet("Resumen");
  res.clear();
  res.getRange("A1:B6").setValues([
    ["Resumen de confirmaciones", ""],
    ["Familias/personas que confirmaron", '=COUNTIF(Respuestas!C:C;"Sí")'],
    ["Responden que no asisten", '=COUNTIF(Respuestas!C:C;"No")'],
    ["Adultos que vienen", '=SUM(Respuestas!D:D)'],
    ["Niños que vienen", '=SUM(Respuestas!E:E)'],
    ["TOTAL de personas", '=SUM(Respuestas!F:F)']
  ]);
  res.getRange("A1").setFontWeight("bold").setFontSize(14);
  res.getRange("A6:B6").setFontWeight("bold").setBackground("#FFEBD6");
  res.setColumnWidth(1, 280);
}

function historial_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(HISTORIAL);
  if (!h) {
    h = ss.insertSheet(HISTORIAL);
    h.appendRow(["Fecha", "Nombre", "Respuesta", "Adultos", "Niños", "Resultado"]);
    h.getRange("A1:F1").setFontWeight("bold").setBackground("#E3D9F7");
    h.setFrozenRows(1);
  }
  return h;
}

function limpiar_(t, max) {
  t = String(t == null ? "" : t).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t; // evita fórmulas inyectadas
}

function clave_(t) { // para comparar nombres sin importar mayúsculas, tildes ni espacios
  return String(t).replace(/^'/, "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

function limiteOk_() {
  var cache = CacheService.getScriptCache(), k = "n" + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(k) || 0) + 1;
  cache.put(k, String(n), 120);
  return n <= MAX_POR_MINUTO;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (new Date() > new Date(CIERRE)) return salida_({ status: "closed" });
    if (!limiteOk_()) return salida_({ status: "busy" });

    var d = JSON.parse(e.postData.contents);
    var nombre = limpiar_(d.name, 80);
    if (nombre.length < 2) return salida_({ status: "invalid" });
    var asiste = d.attending === "si";
    var adultos = asiste ? Math.max(0, Math.min(20, parseInt(d.adults, 10) || 0)) : 0;
    var ninos = asiste ? Math.max(0, Math.min(20, parseInt(d.kids, 10) || 0)) : 0;
    if (asiste && adultos < 1) return salida_({ status: "invalid" });
    var fila = [new Date(), nombre, asiste ? "Sí" : "No", adultos, ninos, adultos + ninos, limpiar_(d.message, 400)];

    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
    var ultima = sh.getLastRow();
    var nombres = ultima > 1 ? sh.getRange(2, 2, ultima - 1, 1).getValues() : [];
    var clave = clave_(nombre), existente = -1;
    for (var i = 0; i < nombres.length; i++) {
      if (clave_(nombres[i][0]) === clave) { existente = i + 2; break; }
    }

    var resultado;
    if (existente > 0) {
      var previo = String(sh.getRange(existente, 3).getValue());
      if (previo === "Sí") return salida_({ status: "already", attending: "si" });   // ya confirmó: no se cambia
      if (!asiste) return salida_({ status: "already", attending: "no" });            // repite el "No"
      sh.getRange(existente, 1, 1, fila.length).setValues([fila]);                     // de "No" a "Sí"
      resultado = "updated";
    } else {
      if (ultima - 1 >= MAX_FILAS) return salida_({ status: "full" });
      sh.appendRow(fila);
      resultado = "new";
    }

    historial_().appendRow([fila[0], nombre, fila[2], adultos, ninos, resultado]);

    if (AVISAR_POR_CORREO) {
      try {
        MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
          (resultado === "updated" ? "Cambió a SÍ: " : "Nueva confirmación: ") + nombre,
          nombre + (asiste ? " asistirá con " + adultos + " adulto(s) y " + ninos + " niño(s)." : " no podrá asistir.") +
          (fila[6] ? "\n\nMensaje: " + fila[6] : ""));
      } catch (mailErr) { /* si se agota la cuota de correo, la respuesta igual queda guardada */ }
    }
    return salida_({ status: resultado });
  } catch (err) {
    return salida_({ status: "error" });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Al abrir la URL en el navegador solo muestra este mensaje (sirve para comprobar que está publicada).
function doGet() {
  return ContentService.createTextOutput("La invitación de Isaac está lista para recibir confirmaciones.");
}

function salida_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
