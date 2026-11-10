(function () {
  "use strict";
  var C = window.INVITE;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  if (hasGsap) document.documentElement.classList.add("js");
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Almacenamiento seguro ---------- */
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  var lstore = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Fechas (siempre derivadas de C.date) ---------- */
  var eventDate = new Date(C.date);
  var tz = C.timeZone;
  function fmt(opts) { return new Intl.DateTimeFormat("es-CO", Object.assign({ timeZone: tz }, opts)).format(eventDate); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var parts = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "2-digit", year: "2-digit" })
    .formatToParts(eventDate).forEach(function (p) { parts[p.type] = p.value; });
  var timeLong = fmt({ hour: "numeric", minute: "2-digit", hour12: true }).replace(/\u202f|\u00a0/g, " ");
  var m = timeLong.match(/^(\d{1,2}:\d{2})\s*(.*)$/i);
  var timeShort = m ? m[1] : timeLong;
  var meridiem = m ? m[2].toUpperCase() : "";
  var weekday = fmt({ weekday: "long" });
  var dayNum = fmt({ day: "numeric" });
  var monthName = fmt({ month: "long" });
  var yearNum = fmt({ year: "numeric" });
  var dateLong = cap(weekday) + " " + dayNum + " de " + monthName + " de " + yearNum;

  var venue = C.venue;
  var addrLine = [venue.address, venue.neighborhood].filter(Boolean).join(", ");
  var fullAddr = [addrLine, venue.city].filter(Boolean).join(", ");

  /* ---------- Datos en el DOM ---------- */
  var bind = {
    firstName: C.child.firstName,
    fullName: C.child.fullName,
    age: String(C.child.age),
    agesWord: C.child.age === 1 ? "AÑO" : "AÑOS",
    ageText: C.child.age + (C.child.age === 1 ? " año" : " años"),
    dateShort: parts.day + "." + parts.month + "." + parts.year,
    timeShort: timeShort,
    meridiem: meridiem,
    weekday: weekday.toUpperCase(),
    day: dayNum,
    monthYear: monthName.toUpperCase() + " " + yearNum
  };
  $$("[data-bind]").forEach(function (el) { var k = el.getAttribute("data-bind"); if (k in bind) el.textContent = bind[k]; });
  document.title = C.child.firstName + " cumple " + C.child.age + " años · Invitación";

  if (venue.name) { var pn = $("#placeName"); pn.textContent = venue.name; pn.hidden = false; }
  $("#placeAddr").textContent = addrLine + (venue.city ? " · " + venue.city : "");
  if (venue.note) { var nt = $("#placeNote"); nt.textContent = venue.note; nt.hidden = false; }
  $("#placeWhen").textContent = dateLong + " · " + timeLong.replace(/ /g, "\u00a0");
  $("#mapBtn").href = venue.mapUrl || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fullAddr));

  if (C.rsvp.deadline) {
    var dl = new Date(C.rsvp.deadline + "T12:00:00-05:00");
    var dlTxt = new Intl.DateTimeFormat("es-CO", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(dl).replace(",", "");
    var dEl = $("#rsvpDeadline");
    if (dEl) { dEl.textContent = "Cuéntanos si vienes antes del " + dlTxt + "."; dEl.hidden = false; }
  }
  /* Pasada la fecha límite (fin del día en Colombia) el formulario desaparece de la página */
  if (C.rsvp.deadline && Date.now() > new Date(C.rsvp.deadline + "T23:59:59-05:00").getTime()) {
    var secClosed = $("#confirmar"); if (secClosed) secClosed.remove();
  }

  /* ---------- Confeti pastel ---------- */
  var cvs = $("#confetti"), cctx = cvs.getContext("2d"), pieces = [], crafting = false, cw = 0, ch = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var palette = ["#F6A07A", "#FFE08A", "#A8D5BA", "#9ACDE8", "#C9B8EE", "#F7B7C7"];
  function sizeConfetti() { cw = window.innerWidth; ch = window.innerHeight; cvs.width = cw * dpr; cvs.height = ch * dpr; cctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function burst(x, y, n, power) {
    if (reduce) return;
    if (!cw) sizeConfetti();
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = (power || 9) * (0.45 + Math.random() * 0.8);
      pieces.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
        s: 5 + Math.random() * 6, c: palette[(Math.random() * palette.length) | 0], round: Math.random() < 0.35, life: 0 });
    }
    if (!crafting) { crafting = true; requestAnimationFrame(stepConfetti); }
  }
  function stepConfetti() {
    cctx.clearRect(0, 0, cw, ch);
    pieces = pieces.filter(function (p) { return p.y < ch + 20 && p.life < 220; });
    pieces.forEach(function (p) {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r); cctx.fillStyle = p.c; cctx.globalAlpha = Math.min(1, (220 - p.life) / 60);
      if (p.round) { cctx.beginPath(); cctx.arc(0, 0, p.s / 2, 0, 6.28); cctx.fill(); } else cctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      cctx.restore();
    });
    if (pieces.length) requestAnimationFrame(stepConfetti); else { crafting = false; cctx.clearRect(0, 0, cw, ch); }
  }
  window.addEventListener("resize", sizeConfetti);

  /* ---------- Destellos de portada ---------- */
  function sparkles() {
    var cv = $("#sparkles"); if (!cv || reduce) return;
    var ctx = cv.getContext("2d"), w = 0, h = 0, run = false, raf = 0, n = (navigator.hardwareConcurrency || 4) <= 4 ? 12 : 20, ps = [];
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function mk(first) { return { x: Math.random() * w, y: first ? Math.random() * h : h + 10, r: 1.5 + Math.random() * 3.2, vy: 0.18 + Math.random() * 0.4, ph: Math.random() * 6.28, vx: (Math.random() - 0.5) * 0.2 }; }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      ps.forEach(function (p) {
        p.y -= p.vy; p.ph += 0.03; p.x += p.vx + Math.sin(p.ph) * 0.2;
        if (p.y < -10) Object.assign(p, mk(false));
        var a = 0.35 + 0.55 * Math.abs(Math.sin(p.ph));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, "rgba(255,255,255," + a + ")"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 6.28); ctx.fill();
      });
      if (run) raf = requestAnimationFrame(frame);
    }
    function start() { if (!run) { run = true; raf = requestAnimationFrame(frame); } }
    function stop() { run = false; cancelAnimationFrame(raf); }
    size(); for (var i = 0; i < n; i++) ps.push(mk(true));
    window.addEventListener("resize", size);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(cv); else start();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* ---------- Polvo que sube (cierre): llega casi hasta el botón del calendario ---------- */
  function dust() {
    var cv = $("#dust"); if (!cv || reduce) return;
    var sec = $("#cierre"), top = $("#icsBtn");
    var ctx = cv.getContext("2d"), w = 0, h = 0, run = false, raf = 0, ps = [], n = (navigator.hardwareConcurrency || 4) <= 4 ? 44 : 70;
    var cols = ["226,190,140", "196,146,100", "176,192,120", "244,206,150", "255,240,205", "210,170,120"];
    function size() {
      var hh = sec.getBoundingClientRect().bottom - top.getBoundingClientRect().bottom - 10;
      cv.style.height = Math.max(220, Math.round(hh)) + "px";
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(first) { var life = first ? Math.random() : 0; return { x: Math.random() * w, y: h - 4 - life * h, r: 2.4 + Math.random() * 3.6, vy: 0.3 + Math.random() * 0.55, ph: Math.random() * 6.28, sp: 0.015 + Math.random() * 0.02, amp: 0.25 + Math.random() * 0.5, life: life, c: cols[(Math.random() * cols.length) | 0] }; }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      ps.forEach(function (p) {
        p.y -= p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * p.amp; p.life += p.vy / h;
        if (p.life >= 1) Object.assign(p, mk(false));
        var a = Math.sin(Math.PI * Math.min(1, p.life)); a = Math.min(1, a * 1.5) * 0.95;
        ctx.fillStyle = "rgba(" + p.c + "," + a + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      });
      if (run) raf = requestAnimationFrame(frame);
    }
    function start() { if (!run) { run = true; raf = requestAnimationFrame(frame); } }
    function stop() { run = false; cancelAnimationFrame(raf); }
    size(); for (var i = 0; i < n; i++) ps.push(mk(true));
    window.addEventListener("resize", function () { size(); ps.forEach(function (p) { Object.assign(p, mk(true)); }); });
    window.addEventListener("load", function () { size(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(cv); else start();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : (cv.getBoundingClientRect().top < window.innerHeight && start()); });
  }
  dust();

  /* ---------- Cuenta atrás ---------- */
  var cdEls = {}; $$("[data-unit]").forEach(function (e) { cdEls[e.getAttribute("data-unit")] = e; });
  var cdBox = $("#countdown"), cdMsg = $("#cdMsg"), cdSr = $("#cdSr");
  var lastVals = {}, lastSr = "", firstTick = true;
  var endDate = new Date(eventDate.getTime() + C.durationHours * 3600e3);
  function setNum(el, txt, animate) {
    if (el.textContent === txt) return;
    if (!animate || reduce || !hasGsap) { el.textContent = txt; return; }
    gsap.timeline()
      .to(el, { y: -14, opacity: 0, filter: "blur(3px)", duration: 0.12, ease: "power1.in" })
      .add(function () { el.textContent = txt; })
      .fromTo(el, { y: 14, opacity: 0, filter: "blur(3px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.14, ease: "power1.out", clearProps: "filter" });
  }
  function tick() {
    var now = Date.now(), diff = eventDate.getTime() - now;
    if (diff <= 0) {
      cdBox.hidden = true; cdMsg.hidden = false;
      cdMsg.textContent = now < endDate.getTime() ? "¡Hoy es la gran fiesta!" : "¡Gracias por celebrar con " + C.child.firstName + "!";
      return;
    }
    var s = Math.floor(diff / 1000);
    var v = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
    Object.keys(v).forEach(function (k) {
      var txt = k === "d" ? String(v[k]) : String(v[k]).padStart(2, "0");
      if (lastVals[k] !== txt) { setNum(cdEls[k], txt, !firstTick); lastVals[k] = txt; }
    });
    firstTick = false;
    var sr = "Faltan " + v.d + " días, " + v.h + " horas y " + v.m + " minutos.";
    if (!lastSr || (sr !== lastSr && v.s === 0)) { cdSr.textContent = sr; cdBox.setAttribute("aria-label", sr); lastSr = sr; }
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Apertura ---------- */
  var intro = $("#intro"), opened = false;
  if (hasGsap && !reduce) gsap.set(".cv", { opacity: 0, y: 18 });

  /* Vuelve al inicio al instante y borra la posición que recuerdan el navegador y ScrollTrigger */
  function toTop() {
    var root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0); root.scrollTop = 0; document.body.scrollTop = 0;
    if (window.ScrollTrigger && ScrollTrigger.clearScrollMemory) ScrollTrigger.clearScrollMemory();
    root.style.scrollBehavior = prev;
  }
  function showCover() {
    document.body.classList.remove("is-locked");
    intro.classList.add("is-gone");
    toTop();
    if (hasGsap && !reduce) {
      gsap.fromTo(".cv", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", clearProps: "transform" });
      gsap.fromTo(".cv-age span", { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.9, delay: 0.25, ease: "elastic.out(1,.55)" });
      var W = window.innerWidth, H = window.innerHeight;
      $(".cv-age").classList.add("is-lit");
      burst(W * 0.5, H * 0.45, 140, 13);
      setTimeout(function () { burst(W * 0.2, H * 0.55, 70, 11); burst(W * 0.8, H * 0.55, 70, 11); }, 350);
      setTimeout(function () { burst(W * 0.5, H * 0.4, 110, 12); }, 800);
      setTimeout(function () { burst(W * 0.3, H * 0.5, 60, 10); burst(W * 0.7, H * 0.5, 60, 10); }, 1300);
    }
    sparkles();
    if (window.ScrollTrigger) { toTop(); ScrollTrigger.refresh(); toTop(); }
  }
  function finishIntro(fast) {
    store.set("isaac-open", "1");
    if (!hasGsap || reduce || fast) {
      if (hasGsap && !reduce) gsap.to(intro, { opacity: 0, duration: 0.35, onComplete: showCover }); else showCover();
      return;
    }
    gsap.to(intro, { opacity: 0, duration: 0.7, ease: "power1.inOut", onComplete: showCover });
  }
  function openEnvelope() {
    if (opened) return; opened = true;
    $("#hint").style.opacity = 0; $("#skipBtn").style.visibility = "hidden";
    $(".ring", $("#sealBtn")).style.animation = "none";
    startMusic();
    if (!hasGsap || reduce) { finishIntro(true); return; }
    $$(".ring").forEach(function (r) { r.style.display = "none"; });
    var tl = gsap.timeline({ onComplete: function () { finishIntro(false); } });
    tl.to("#stage", { scale: 1.09, duration: 0.22, ease: "back.out(3)" })
      .to("#stage", { rotate: 1.6, duration: 0.06, yoyo: true, repeat: 7, ease: "sine.inOut" }, "<")
      .to("#stOpen", { opacity: 1, duration: 0.5, ease: "power1.inOut" }, "-=0.1")
      .to("#glow", { opacity: 0.62, scale: 1, duration: 0.7, ease: "power2.out" }, "<")
      .to("#stage", { scale: 1.04, rotate: 0, duration: 0.4, ease: "elastic.out(1,.5)" }, ">-0.05")
      .add(function () { var W = window.innerWidth, H = window.innerHeight; burst(W * 0.5, H * 0.55, 90, 11); setTimeout(function () { burst(W * 0.25, H * 0.6, 40, 9); burst(W * 0.75, H * 0.6, 40, 9); }, 250); }, "<0.1")
      .to("#stage", { scale: 2.6, y: "6%", duration: 1.15, ease: "power3.in" }, "+=0.55")
      .to("#glow", { opacity: 1, scale: 2.4, duration: 1.15, ease: "power3.in" }, "<");
  }
  $("#sealBtn").addEventListener("click", openEnvelope);
  $("#skipBtn").addEventListener("click", function () { if (opened) return; opened = true; startMusic(); finishIntro(true); });

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  toTop();
  window.addEventListener("load", toTop);
  $("#replayBtn").addEventListener("click", function () { toTop(); location.reload(); });
  window.addEventListener("pagehide", toTop);

  /* ---------- Música ---------- */
  var audio = null, musicBtn = $("#musicBtn"), wantMusic = lstore.get("isaac-music") !== "off";
  function setMusicUI(on) { musicBtn.setAttribute("aria-pressed", on ? "true" : "false"); musicBtn.setAttribute("aria-label", on ? "Pausar música" : "Reproducir música"); }
  var VOL = 0.12, ac = null, gestureBound = false, gestureEvents = ["pointerdown", "touchstart", "keydown", "click"];
  function setupVolume() {
    audio.volume = VOL;
    if (Math.abs(audio.volume - VOL) < 0.01) return; /* el navegador respeta el volumen */
    try { /* iPhone/iPad: el volumen del elemento es fijo; se baja con Web Audio */
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !/^https?:/.test(location.protocol)) return;
      ac = new AC(); var g = ac.createGain(); g.gain.value = VOL;
      ac.createMediaElementSource(audio).connect(g); g.connect(ac.destination); audio.volume = 1;
    } catch (e) { ac = null; }
  }
  function resumeAudio() { if (ac && ac.state === "suspended") { try { ac.resume(); } catch (e) {} } }
  function bindGesture() { if (!gestureBound) { gestureBound = true; gestureEvents.forEach(function (t) { document.addEventListener(t, onGesture, true); }); } }
  function onGesture() {
    gestureEvents.forEach(function (t) { document.removeEventListener(t, onGesture, true); });
    gestureBound = false;
    if (!audio || !wantMusic) return;
    resumeAudio();
    var q = audio.play(); if (q && q.then) q.then(function () { setMusicUI(true); }).catch(function () {});
  }
  function startMusic() {
    if (!C.music || /[?&]nomusic/.test(location.search)) return;
    if (!audio) { audio = new Audio(C.music); audio.loop = true; audio.preload = "auto"; setupVolume(); }
    musicBtn.hidden = false;
    if (!wantMusic) { setMusicUI(false); return; }
    resumeAudio();
    var p = audio.play();
    setMusicUI(true);
    if (p && p.then) p.then(function () { if (ac && ac.state !== "running") { setMusicUI(false); bindGesture(); } });
    if (p && p.catch) p.catch(function () { setMusicUI(false); bindGesture(); }); /* el navegador pide un toque primero: arranca con el primero que haga */
  }
  musicBtn.addEventListener("click", function () { resumeAudio(); });
  startMusic();
  musicBtn.addEventListener("click", function () {
    if (!audio) return;
    if (audio.paused) { audio.play(); wantMusic = true; setMusicUI(true); lstore.set("isaac-music", "on"); }
    else { audio.pause(); wantMusic = false; setMusicUI(false); lstore.set("isaac-music", "off"); }
  });
  document.addEventListener("visibilitychange", function () {
    if (!audio) return;
    if (document.hidden) audio.pause(); else if (wantMusic) audio.play().catch(function () {});
  });

  /* ---------- Dinosaurios y scroll ---------- */
  var dinos = $$("[data-dino]");
  function dinoFx() {
    dinos.forEach(function (d, i) {
      d.classList.add("sway"); d.style.animationDelay = (i * 0.5) + "s";
      d.addEventListener("click", function (ev) {
        if (!hasGsap || reduce) return;
        var r = d.getBoundingClientRect();
        gsap.timeline().to(d, { y: -26, scaleY: 1.06, scaleX: 0.96, duration: 0.18, ease: "power2.out", overwrite: "auto" })
          .to(d, { y: 0, scaleY: 0.94, scaleX: 1.04, duration: 0.16, ease: "power2.in" })
          .to(d, { scaleX: 1, scaleY: 1, duration: 0.45, ease: "elastic.out(1,.4)" });
        burst(r.left + r.width / 2, r.top + r.height * 0.3, 18, 7);
      });
    });
  }
  /* Ejecuta algo una sola vez cuando el elemento entra en pantalla. Con IntersectionObserver no depende de
     posiciones calculadas de antemano, así que sigue funcionando aunque la página cambie de alto. */
  function onceVisible(el, margin, fn) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: "0px 0px -" + margin + "% 0px" });
      io.observe(el);
    } else fn();
  }
  function scrollFx() {
    dinoFx();
    if (!hasGsap || reduce) return;
    $$("[data-reveal]").forEach(function (el) {
      var tw = gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", clearProps: "transform", paused: true });
      onceVisible(el, 10, function () { tw.play(); });
    });
    dinos.forEach(function (d) {
      var tw = gsap.from(d, { scale: 0.4, opacity: 0, duration: 0.9, ease: "back.out(1.8)", clearProps: "opacity", paused: true });
      onceVisible(d, 8, function () { tw.play(); });
    });
    /* Huellas que aparecen una tras otra */
    var prints = $$(".prints img"), pr = $(".prints");
    if (pr) {
      gsap.set(prints, { opacity: 0, scale: 0.4 });
      var twp = gsap.to(prints, { opacity: 0.5, scale: 1, duration: 0.5, stagger: 0.28, ease: "back.out(2)", paused: true });
      onceVisible(pr, 15, function () { twp.play(); });
    }
    /* El huevo se tambalea al llegar al formulario */
    var egg = $("#egg");
    if (egg) {
      var twe = gsap.fromTo(egg, { rotate: -6 }, { rotate: 6, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut", clearProps: "rotate", paused: true });
      onceVisible(egg, 20, function () { twe.play(); });
    }
    if (!window.ScrollTrigger) return;
    /* Paralaje suave */
    gsap.to("#coverBg", { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".cover", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".leaf--l", { y: -40, ease: "none", scrollTrigger: { trigger: "#invitacion", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.to(".leaf--r", { y: 40, ease: "none", scrollTrigger: { trigger: "#cierre", start: "top bottom", end: "bottom top", scrub: true } });
  }
  scrollFx();
  window.addEventListener("load", function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  /* Si el alto de la página cambia (p. ej. al ocultar el formulario), se recalcula todo */
  if ("ResizeObserver" in window) {
    var roTimer = null;
    new ResizeObserver(function () {
      clearTimeout(roTimer);
      roTimer = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); window.dispatchEvent(new Event("resize")); }, 150);
    }).observe($("#page"));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); });

  /* ---------- Confirmación de asistencia ---------- */
  (function () {
    var form = $("#rsvpForm"); if (!form) return; /* el formulario se retira cuando vence el plazo */
    var statusEl = $("#rsvpStatus"), btn = $("#rsvpBtn"), formWrap = $(".form-wrap"), t0 = Date.now(), KEY = "isaac-rsvp";
    var nbsp = function (s) { return s.replace(/ /g, " "); };
    var when = dateLong.toLowerCase() + ", a las " + nbsp(timeLong);
    var deadlineTxt = typeof dlTxt !== "undefined" ? dlTxt : "la fecha límite";
    function first(n) { return n.split(/\s+/)[0]; }
    function saved() { try { var v = JSON.parse(lstore.get(KEY) || "null"); return v && v.name ? v : null; } catch (e) { return null; } }
    function remember(name, att) { lstore.set(KEY, JSON.stringify({ name: name, att: att })); }
    function setErr(id, input, msg) { $(id).textContent = msg; if (input) input.setAttribute("aria-invalid", msg ? "true" : "false"); }

    /* Si esta persona ya confirmó que viene, el formulario se reemplaza por un mensaje */
    function lockDone(name) {
      form.hidden = true; var dd = $("#rsvpDeadline"); if (dd) dd.hidden = true;
      if ($("#rsvpDone")) return;
      var card = document.createElement("div"); card.className = "done-card"; card.id = "rsvpDone";
      var h = document.createElement("h3"); h.textContent = "¡Hola de nuevo, " + first(name) + "!";
      var p = document.createElement("p"); p.textContent = "Ya nos diste tu confirmación de que vienes. ¡Te esperamos con mucho cariño!";
      card.appendChild(h); card.appendChild(p);
      if (C.rsvp.whatsapp) {
        var a = document.createElement("a"); a.className = "done-link"; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.href = "https://wa.me/" + C.rsvp.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola, soy " + name + ". Necesito cambiar algo de mi confirmación al cumpleaños de " + C.child.firstName + ".");
        a.appendChild(document.createTextNode("Si algo cambia en tu asistencia,")); a.appendChild(document.createElement("br")); a.appendChild(document.createTextNode("escríbenos por WhatsApp."));
        card.appendChild(a);
      }
      formWrap.appendChild(card);
    }
    var s0 = saved();
    if (s0 && s0.att === "si") lockDone(s0.name);
    else if (s0 && s0.att === "no") {
      $("#fName").value = s0.name;
      var note = document.createElement("p"); note.className = "form-note";
      note.textContent = "Hola de nuevo, " + first(s0.name) + ". Ya nos avisaste que no podías venir; si cambiaste de opinión, ¡cuéntanoslo aquí!";
      form.insertBefore(note, form.firstChild);
    }

    $$("input[name=att]", form).forEach(function (r) {
      r.addEventListener("change", function () { $("#guestsField").hidden = r.value === "no" && r.checked; setErr("#eAtt", null, ""); setErr("#eGuests", null, ""); });
    });
    $("#fName").addEventListener("input", function () { setErr("#eName", this, ""); });

    function reset() { btn.disabled = false; btn.textContent = "Confirmar asistencia"; }
    function fail(msg) {
      reset(); statusEl.className = "form-status is-err";
      statusEl.textContent = msg || "No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.";
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      statusEl.className = "form-status"; statusEl.textContent = "";
      var name = $("#fName").value.trim(), att = (form.querySelector("input[name=att]:checked") || {}).value;
      var ok = true;
      if (name.length < 2) { setErr("#eName", $("#fName"), "Cuéntanos tu nombre para anotarte."); ok = false; } else setErr("#eName", $("#fName"), "");
      if (!att) { setErr("#eAtt", null, "Dinos si nos acompañas para continuar."); ok = false; }
      var adults = 0, kids = 0;
      if (att === "si") {
        adults = parseInt($("#fAdults").value, 10); kids = $("#fKids").value.trim() === "" ? 0 : parseInt($("#fKids").value, 10);
        if (!(adults >= 1)) { setErr("#eGuests", $("#fAdults"), "Cuéntanos cuántos adultos vendrán (mínimo 1), contándote a ti."); ok = false; }
        else if (!(kids >= 0)) { setErr("#eGuests", $("#fKids"), "El número de niños debe ser 0 o más."); ok = false; }
        else { setErr("#eGuests", null, ""); $("#fAdults").setAttribute("aria-invalid", "false"); $("#fKids").setAttribute("aria-invalid", "false"); }
      }
      if (!ok) { var bad = form.querySelector("[aria-invalid=true]") || form.querySelector("input[name=att]"); bad.focus(); return; }
      if ($("#fWeb").value) return; /* señuelo anti-spam */
      if (Date.now() - t0 < 2500) { fail("Un momento… inténtalo de nuevo en unos segundos."); return; }
      var payload = { name: name, attending: att, adults: att === "si" ? adults : 0, kids: att === "si" ? kids : 0, message: $("#fMsg").value.trim() };

      function show(kind, confetti, after) {
        if (confetti) celebrate();
        setTimeout(function () { reset(); showModal(kind, name, after); }, confetti && !reduce ? 1900 : (reduce ? 0 : 350));
      }
      function handle(res) {
        var st = res && (res.status || (res.ok ? "new" : "error"));
        if (st === "new") {
          remember(name, att);
          if (att === "si") show("si", true, function () { lockDone(name); }); else show("no", false);
        } else if (st === "updated") {
          remember(name, "si"); show("updated", true, function () { lockDone(name); });
        } else if (st === "already") {
          var yes = res.attending === "si"; remember(name, yes ? "si" : "no");
          show(yes ? "alreadySi" : "alreadyNo", false, yes ? function () { lockDone(name); } : null);
        } else if (st === "closed") {
          show("closed", false, function () { var sec = $("#confirmar"); if (sec) sec.remove(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
        } else if (st === "busy" || st === "full") {
          fail("Estamos recibiendo muchas respuestas a la vez. Inténtalo de nuevo en un minuto.");
        } else { fail(); }
      }

      btn.disabled = true; btn.textContent = "Enviando…";
      if (!C.rsvp.endpoint) { /* sin hoja conectada: solo muestra el flujo */
        if (window.console) console.warn("Falta rsvp.endpoint en config.js: la respuesta no se guarda en ninguna hoja.");
        setTimeout(function () { handle({ status: "new" }); }, 350);
        return;
      }
      var ctl = ("AbortController" in window) ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      fetch(C.rsvp.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (res) { clearTimeout(timer); handle(res); })
        .catch(function () { clearTimeout(timer); fail(); });
    });

    /* ---------- Celebración y mensajes de respuesta ---------- */
    function celebrate() {
      var W = window.innerWidth, H = window.innerHeight, r = btn.getBoundingClientRect();
      var fl = document.createElement("div"); fl.className = "flash"; fl.setAttribute("aria-hidden", "true"); document.body.appendChild(fl);
      setTimeout(function () { fl.remove(); }, 2200);
      burst(r.left + r.width / 2, r.top, 80, 12);
      setTimeout(function () { burst(W * 0.1, H, 50, 15); burst(W * 0.9, H, 50, 15); }, 250);
      setTimeout(function () { burst(W * 0.5, H * 0.75, 70, 13); }, 650);
      setTimeout(function () { burst(W * 0.25, H * 0.9, 35, 13); burst(W * 0.75, H * 0.9, 35, 13); }, 1100);
    }
    var MSG = {
      si:         { img: "trex", title: function (f) { return "¡Gracias por confirmar, " + f + "!"; }, text: function () { return "Nos hace muy felices que nos acompañes. ¡Te esperamos el " + when + "!"; } },
      updated:    { img: "trex", title: function (f) { return "¡Qué alegría, " + f + "!"; }, text: function () { return "Hemos tomado tu respuesta y nos encanta que puedas venir. ¡Te esperamos el " + when + "!"; } },
      alreadySi:  { img: "trex", title: function (f) { return "Ya nos diste tu confirmación, " + f; }, text: function () { return "Sabemos que vienes, ¡y nos hace muy felices! ¡Te esperamos el " + when + "!"; } },
      no:         { img: "bebe-huevo", title: function (f) { return "Gracias por avisarnos, " + f; }, text: function () { return "Esta vez no podrás acompañarnos, pero en otra ocasión tendremos la oportunidad de compartir contigo. Te enviamos un abrazo muy grande."; } },
      alreadyNo:  { img: "bebe-huevo", title: function (f) { return "Ya recibimos tu respuesta, " + f; }, text: function () { return "Si cambias de opinión, puedes confirmar de nuevo hasta el " + deadlineTxt + ". ¡Nos encantará verte!"; } },
      closed:     { img: "bebe-huevo", title: function (f) { return "El plazo ya terminó, " + f; }, text: function () { return "Gracias por querer acompañarnos. ¡Te enviamos un abrazo muy grande!"; } }
    };
    var modal = $("#thanks"), lastFocus = null, afterClose = null;
    function showModal(kind, name, after) {
      var m = MSG[kind];
      $("#thanksImg").src = "assets/img/" + m.img + ".webp";
      $("#thanksTitle").textContent = m.title(first(name));
      $("#thanksText").textContent = m.text();
      afterClose = after || null;
      lastFocus = document.activeElement; modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add("is-open"); $("#thanksClose").focus({ preventScroll: true }); });
    }
    function hideModal() {
      modal.classList.remove("is-open"); setTimeout(function () { modal.hidden = true; }, 250);
      var fn = afterClose; afterClose = null;
      if (fn) fn(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    $("#thanksClose").addEventListener("click", hideModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) hideModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) hideModal(); });
  })();

  /* ---------- Recargar deslizando hacia abajo: siempre vuelve al sobre (sin avisos) ---------- */
  window.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
  (function () {
    var y0 = null, pull = 0;
    document.addEventListener("touchstart", function (e) { y0 = (window.scrollY <= 0 && !document.body.classList.contains("is-locked") && e.touches.length === 1) ? e.touches[0].clientY : null; pull = 0; }, { passive: true });
    document.addEventListener("touchmove", function (e) { if (y0 === null) return; if (window.scrollY > 0) { y0 = null; return; } pull = e.touches[0].clientY - y0; }, { passive: true });
    document.addEventListener("touchend", function () { if (y0 !== null && pull >= 110) location.reload(); y0 = null; pull = 0; }, { passive: true });
    document.addEventListener("touchcancel", function () { y0 = null; pull = 0; }, { passive: true });
  })();

  /* ---------- Calendario (.ics) ---------- */
  $("#icsBtn").addEventListener("click", function () {
    function utc(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
    var end = new Date(eventDate.getTime() + C.durationHours * 3600e3);
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      "UID:" + utc(eventDate) + "@invitacion-" + C.child.firstName.toLowerCase(), "DTSTAMP:" + utc(new Date()),
      "DTSTART:" + utc(eventDate), "DTEND:" + utc(end),
      "SUMMARY:" + esc("Cumpleaños " + C.child.age + " de " + C.child.firstName),
      "LOCATION:" + esc(fullAddr), "DESCRIPTION:" + esc("Fiesta de dinosaurios. Llegada a las " + timeLong + "."),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Mañana es la fiesta de " + esc(C.child.firstName), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"];
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "cumpleanos-" + C.child.firstName.toLowerCase() + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
})();
