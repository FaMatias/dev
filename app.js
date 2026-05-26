/* Portafolio SCADA — Fabricio Toso · app.js (v2, ES) */
(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n, d = 2) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ============ Menú: drawer móvil + scrollspy + cerrar al navegar ============ */
  const header = document.querySelector('.site-header');
  const toggle = $('menuToggle');
  const nav = $('primaryNav');
  const overlay = $('menuOverlay');
  const navLinks = nav.querySelectorAll('a[data-nav]');

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  overlay?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* Header con efecto al hacer scroll + barra progreso + botón "volver arriba" */
  const progress = $('scrollProgress');
  const backTop = $('backToTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);
    backTop.classList.toggle('show', y > 600);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = h > 0 ? ((y / h) * 100).toFixed(2) + '%' : '0%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Scrollspy: activa enlace de sección visible */
  const sections = ['perfil', 'modulos', 'experiencia', 'contacto']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));

  /* Flecha del preview-card */
  document.querySelector('.circle-arrow')?.addEventListener('click', () =>
    document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })
  );

  /* ============ M01 · Jar-Test ============ */
  const jar = {
    async run() {
      const ntu = +$('jar-ntu').value || 45;
      const pac = +$('jar-pac').value || 22;
      const log = $('jar-log'), vial = $('jar-vial'), bar = $('jar-bar'), btn = $('jar-run');
      btn.disabled = true; log.className = 'log';
      const steps = [
        ['Mezcla rápida 120 RPM · 60 s · dispersión del PAC…', 'rgba(180,140,60,.35)', 20],
        ['Floculación lenta 40 RPM · 15 min · formación de flóculos…', 'rgba(120,170,140,.25)', 55],
        ['Sedimentación 20 min · decantación de flóculos…', 'rgba(60,140,160,.15)', 85],
      ];
      for (const [msg, bg, p] of steps) {
        log.textContent = `> ${msg}`;
        vial.style.background = bg;
        bar.style.width = p + '%';
        await sleep(1100);
      }
      const optimal = ntu * 0.45;
      const eff = Math.max(0, 100 - Math.abs(pac - optimal) * 4);
      const residual = Math.max(0.3, ntu * (1 - eff / 100) * 0.04);
      bar.style.width = '100%';
      vial.style.background = residual < 1 ? 'rgba(180,220,235,.22)' : 'rgba(160,140,90,.28)';
      vial.textContent = `Turbidez residual: ${fmt(residual)} NTU`;
      const ok = eff >= 80;
      log.className = 'log ' + (ok ? 'ok' : 'warn');
      log.textContent = `✓ Ensayo finalizado.\n• Dosis óptima estimada: ${fmt(optimal, 1)} mg/L\n• Dosis aplicada: ${fmt(pac, 1)} mg/L\n• Eficiencia de remoción: ${fmt(eff, 1)} %\n• Turbidez residual: ${fmt(residual)} NTU ${ok ? '(dentro de objetivo <1 NTU)' : '(ajustar dosis)'}`;
      btn.disabled = false;
    }
  };
  $('jar-run')?.addEventListener('click', jar.run);

  /* ============ M02 · Aluminio fotométrico ============ */
  const buildSeq = (cfg) => {
    let step = 0;
    const reset = () => {
      step = 0;
      $(cfg.stepEl).textContent = cfg.initialStep;
      $(cfg.vialEl).style.background = ''; $(cfg.vialEl).textContent = cfg.initialVial;
      const log = $(cfg.logEl); log.className = 'log'; log.textContent = cfg.initialLog;
      const btn = $(cfg.btnEl); btn.disabled = false; btn.textContent = cfg.initialBtn;
    };
    const next = () => {
      const log = $(cfg.logEl), vial = $(cfg.vialEl), btn = $(cfg.btnEl), stepEl = $(cfg.stepEl);
      if (step < cfg.steps.length) {
        const s = cfg.steps[step];
        stepEl.textContent = s.msg;
        vial.style.background = s.bg; vial.textContent = s.t;
        log.className = 'log';
        log.textContent = `> ${s.msg}`;
        step++;
        if (step === cfg.steps.length) btn.textContent = cfg.finalBtn;
      } else {
        cfg.finish({ log, vial, btn, stepEl });
      }
    };
    return { next, reset };
  };

  const al = buildSeq({
    stepEl: 'al-step', vialEl: 'al-vial', logEl: 'al-log', btnEl: 'al-next',
    initialStep: 'Paso 1 de 4: carga de alícuota (25 mL).',
    initialVial: 'CELDA VACÍA',
    initialLog: 'Espectrofotómetro calibrado a cero. Inserte la cubeta de agua decantada/filtrada.',
    initialBtn: 'Siguiente etapa →',
    finalBtn: 'Calcular Al residual',
    steps: [
      { msg: 'Paso 2 de 4: añadir tampón pH 6,0 (acetato).', bg: 'rgba(180,160,60,.18)', t: 'TAMPÓN AÑADIDO' },
      { msg: 'Paso 3 de 4: añadir reactivo eriocromo cianina R.', bg: 'rgba(200,90,140,.32)', t: 'REACCIÓN CROMOGÉNICA' },
      { msg: 'Paso 4 de 4: lectura a 535 nm.', bg: 'rgba(220,100,150,.45)', t: 'LEYENDO ABSORBANCIA…' },
    ],
    finish: ({ log, vial, btn }) => {
      const dose = +$('al-dose').value || 22;
      const residual = Math.max(0.05, (dose - 15) * 0.012 + Math.random() * 0.03);
      const ok = residual <= 0.2;
      vial.style.background = ok ? 'rgba(150,200,210,.18)' : 'rgba(220,120,160,.4)';
      vial.textContent = `${fmt(residual, 3)} mg Al/L`;
      log.className = 'log ' + (ok ? 'ok' : 'crit');
      log.textContent = `✓ Lectura completa (λ 535 nm).\n• Al residual: ${fmt(residual, 3)} mg/L\n• Límite RD 140/2003: 0,200 mg/L\n• Estado: ${ok ? 'CONFORME' : 'NO CONFORME — reducir dosis de PAC'}`;
      btn.disabled = true;
    }
  });
  $('al-next')?.addEventListener('click', al.next);
  $('al-reset')?.addEventListener('click', al.reset);

  /* ============ M03 · Amonio salicilato ============ */
  const nh = buildSeq({
    stepEl: 'nh-step', vialEl: 'nh-vial', logEl: 'nh-log', btnEl: 'nh-next',
    initialStep: 'Paso 1 de 4: dosificación de reactivo en polvo (cianurato/salicilato).',
    initialVial: 'MUESTRA BASE TRANSPARENTE',
    initialLog: 'Esperando adición de reactivos catalizadores para examen cromogénico…',
    initialBtn: 'Disolver reactivo →',
    finalBtn: 'Leer absorbancia',
    steps: [
      { msg: 'Paso 2 de 4: agitar 30 s para disolución completa.', bg: 'rgba(200,200,120,.12)', t: 'DISOLUCIÓN EN CURSO' },
      { msg: 'Paso 3 de 4: añadir activador hipoclorito alcalino.', bg: 'rgba(120,200,150,.22)', t: 'COMPLEJO INDOFENOL FORMÁNDOSE' },
      { msg: 'Paso 4 de 4: esperar 15 min · lectura a 655 nm.', bg: 'rgba(60,180,160,.35)', t: 'COLORACIÓN VERDE-AZULADA' },
    ],
    finish: ({ log, vial, btn }) => {
      const c = +$('nh-c').value || 0.45;
      const measured = c * (0.95 + Math.random() * 0.1);
      const ok = measured <= 0.5;
      vial.style.background = ok ? 'rgba(120,200,180,.25)' : 'rgba(60,170,150,.5)';
      vial.textContent = `${fmt(measured, 3)} mg NH₄⁺/L`;
      log.className = 'log ' + (ok ? 'ok' : 'warn');
      log.textContent = `✓ Determinación finalizada.\n• NH₄⁺ medido: ${fmt(measured, 3)} mg/L\n• Límite RD 140/2003: 0,50 mg/L\n• Estado: ${ok ? 'CONFORME' : 'NO CONFORME — revisar cloraminación/precloración'}`;
      btn.disabled = true;
    }
  });
  $('nh-next')?.addEventListener('click', nh.next);
  $('nh-reset')?.addEventListener('click', nh.reset);

  /* ============ M04 · Balance logístico ============ */
  $('lg-run')?.addEventListener('click', () => {
    const q = +$('lg-q').value || 0;
    const d = +$('lg-d').value || 0;
    const s = +$('lg-s').value || 0;
    const lps = (q * 1000) / 3600;
    const kgPerHour = (q * d) / 1000;
    const kgPerDay = kgPerHour * 24;
    const autonomyDays = kgPerDay > 0 ? s / kgPerDay : Infinity;
    const priceKg = 0.55;
    const monthlyCost = kgPerDay * 30 * priceKg;

    const kpis = $('lg-kpis').querySelectorAll('.kpi strong');
    kpis[0].textContent = `${fmt(lps, 1)} L/s`;
    kpis[1].textContent = `${fmt(kgPerDay, 1)} kg/d`;
    kpis[2].textContent = isFinite(autonomyDays) ? `${fmt(autonomyDays, 1)} d` : '∞';
    kpis[3].textContent = `${fmt(monthlyCost, 0)} €`;

    const log = $('lg-log');
    let cls = 'ok', warn = '';
    if (autonomyDays < 7) { cls = 'crit'; warn = '\n⚠ STOCK CRÍTICO — programar reposición inmediata.'; }
    else if (autonomyDays < 15) { cls = 'warn'; warn = '\n⚠ Stock bajo — generar orden de compra.'; }
    log.className = 'log ' + cls;
    log.textContent = `> Balance calculado:\n• Caudal: ${fmt(q, 0)} m³/h ≡ ${fmt(lps, 1)} L/s ≡ ${fmt(q * 1000, 0)} L/h\n• Consumo PAC: ${fmt(kgPerHour, 2)} kg/h · ${fmt(kgPerDay, 1)} kg/día\n• Autonomía del silo: ${fmt(autonomyDays, 1)} días\n• Coste mensual estimado: ${fmt(monthlyCost, 0)} €${warn}`;
  });

  /* ============ M05 · Contralavado ============ */
  $('bw-run')?.addEventListener('click', async () => {
    const dp = +$('bw-dp').value || 0.45;
    const log = $('bw-log'), bar = $('bw-bar'), st = $('bw-status'), btn = $('bw-run');
    btn.disabled = true;
    if (dp < 0.6) {
      log.className = 'log ok';
      log.textContent = `✓ ΔP = ${fmt(dp)} bar dentro de parámetros (<0,6). No se requiere contralavado.`;
      btn.disabled = false; return;
    }
    st.className = 'status crit'; st.innerHTML = '<span class="dot-pulse"></span>CONTRALAVADO EN CURSO';
    const phases = [
      ['Fase 1 · cierre de válvulas de alimentación', 15],
      ['Fase 2 · drenaje de columna (90 s)', 30],
      ['Fase 3 · soplado de aire 60 Nm³/h (3 min)', 55],
      ['Fase 4 · lavado con agua filtrada 18 m/h (5 min)', 80],
      ['Fase 5 · reposición y enjuague final', 100],
    ];
    for (const [msg, p] of phases) {
      log.className = 'log';
      log.textContent = `> ${msg}…`;
      bar.style.width = p + '%';
      await sleep(900);
    }
    st.className = 'status ok'; st.innerHTML = '<span class="dot-pulse"></span>BATERÍA EN RÉGIMEN NORMAL';
    log.className = 'log ok';
    log.textContent = `✓ Ciclo de contralavado completado.\n• ΔP inicial: ${fmt(dp)} bar → ΔP final: ${fmt(0.12 + Math.random() * 0.08)} bar\n• Volumen de agua de lavado: ~12 m³\n• Filtro reincorporado al ciclo de filtración.`;
    btn.disabled = false;
  });

  /* ============ Revelado al hacer scroll ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = 'translateY(0)'; io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.module, .exp .card, .section-head').forEach(el => {
    el.style.opacity = 0; el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .7s ease, transform .7s ease';
    io.observe(el);
  });
})();
