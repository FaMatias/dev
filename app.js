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

  /* ============ M06 · Estación elevadora ============ */
  $('ps-run')?.addEventListener('click', () => {
    const q = +$('ps-q').value || 0;          // L/s demanda
    const lvl = +$('ps-lvl').value || 0;      // %
    const p = +$('ps-p').value || 3.5;        // bar
    const log = $('ps-log'), st = $('ps-status');
    // cada bomba aporta ~80 L/s @ 3,5 bar, 55 kW nominal
    const cap = 80;
    let nBombas = Math.min(3, Math.ceil(q / cap));
    if (lvl < 15) nBombas = 0;                // protección por bajo nivel
    const qReal = Math.min(q, nBombas * cap);
    const kW = nBombas * 55 * (0.6 + (p / 8) * 0.4); // estimación con VFD
    const kWhM3 = qReal > 0 ? (kW / (qReal * 3.6)) : 0; // kWh/m³
    const kpis = $('ps-kpis').querySelectorAll('.kpi strong');
    kpis[0].textContent = nBombas === 0 ? 'PARO' : `${nBombas} / 3`;
    kpis[1].textContent = `${fmt(qReal, 0)} L/s · ${fmt(qReal * 3.6, 0)} m³/h`;
    kpis[2].textContent = `${fmt(kW, 1)} kW`;
    kpis[3].textContent = qReal > 0 ? `${fmt(kWhM3, 3)} kWh/m³` : '—';

    let cls = 'ok', msg, stMsg;
    if (lvl < 15) {
      cls = 'crit'; stMsg = 'PARO POR BAJO NIVEL · CISTERNA';
      msg = `⚠ Nivel de aspiración ${fmt(lvl, 0)} % < 15 % — protección activada: bombas detenidas para evitar cavitación.`;
    } else if (qReal < q) {
      cls = 'warn'; stMsg = 'DEMANDA NO CUBIERTA';
      msg = `⚠ Demanda ${fmt(q, 0)} L/s supera la capacidad instalada (3 × ${cap} L/s). Caudal entregado: ${fmt(qReal, 0)} L/s.`;
    } else {
      stMsg = 'RÉGIMEN HIDRÁULICO ESTABLE';
      msg = `✓ ${nBombas} bomba(s) en marcha @ ${fmt(p, 1)} bar.\n• Caudal entregado: ${fmt(qReal, 0)} L/s (${fmt(qReal * 3.6, 0)} m³/h)\n• Consumo: ${fmt(kW, 1)} kW · eficiencia ${fmt(kWhM3, 3)} kWh/m³\n• Próxima rotación horaria programada (desgaste equilibrado).`;
    }
    st.className = 'status ' + cls; st.innerHTML = `<span class="dot-pulse"></span>${stMsg}`;
    log.className = 'log ' + cls; log.textContent = msg;
  });

  /* ============ M07 · Laboratorio analítico multiparamétrico ============ */
  const LAB = {
    cl:   { unit: 'mg Cl/L',       min: 0.20, max: 1.00, sim: () => 0.4 + Math.random() * 0.7,    norma: 'RD 140/2003: 0,2–1,0 mg/L en red' },
    clt:  { unit: 'mg Cl/L',       min: 0.20, max: 1.50, sim: () => 0.5 + Math.random() * 1.0,    norma: 'Cl libre + combinado' },
    alk:  { unit: 'mg CaCO₃/L',    min: 30,   max: 200,  sim: () => 60 + Math.random() * 80,     norma: 'Recomendado 30–200 mg/L (estabilidad)' },
    hard: { unit: 'mg CaCO₃/L',    min: 60,   max: 350,  sim: () => 80 + Math.random() * 180,    norma: 'Sin límite sanitario; objetivo 60–350' },
    fe:   { unit: 'mg Fe/L',       min: 0,    max: 0.20, sim: () => Math.random() * 0.25,        norma: 'RD 140/2003: ≤ 0,20 mg/L' },
    col:  { unit: 'mg Pt-Co/L',    min: 0,    max: 15,   sim: () => Math.random() * 18,          norma: 'RD 140/2003: ≤ 15 mg Pt-Co/L' },
    cond: { unit: 'µS/cm',         min: 0,    max: 2500, sim: () => 200 + Math.random() * 600,   norma: 'RD 140/2003: ≤ 2.500 µS/cm @ 20 °C' },
  };
  const labHistory = [];
  $('lab-run')?.addEventListener('click', () => {
    const test = $('lab-test').value;
    const id = $('lab-id').value.trim() || 'SIN-ID';
    const cfg = LAB[test];
    const val = cfg.sim();
    const ok = val >= cfg.min && val <= cfg.max;
    const vial = $('lab-vial'), log = $('lab-log');
    vial.style.background = ok ? 'rgba(120,200,180,.25)' : 'rgba(220,120,140,.35)';
    vial.textContent = `${fmt(val, 3)} ${cfg.unit}`;
    log.className = 'log ' + (ok ? 'ok' : 'crit');
    const label = $('lab-test').selectedOptions[0].text;
    log.textContent = `> Ensayo: ${label}\n• Muestra: ${id}\n• Resultado: ${fmt(val, 3)} ${cfg.unit}\n• Norma: ${cfg.norma}\n• Estado: ${ok ? 'CONFORME ✓' : 'NO CONFORME ⚠ — generar incidencia'}`;
    labHistory.push({ ts: new Date().toISOString(), id, ensayo: label, valor: val.toFixed(3), unidad: cfg.unit, estado: ok ? 'CONFORME' : 'NO CONFORME' });
  });
  $('lab-csv')?.addEventListener('click', () => {
    if (!labHistory.length) { $('lab-log').textContent = '> Sin registros para exportar. Ejecute al menos un ensayo.'; return; }
    const head = 'timestamp;muestra;ensayo;valor;unidad;estado\n';
    const rows = labHistory.map(r => `${r.ts};${r.id};${r.ensayo};${r.valor};${r.unidad};${r.estado}`).join('\n');
    const blob = new Blob([head + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `laboratorio_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  /* ============ M08 · HSE · fuga de cloro / HCl ============ */
  const HSE = {
    cl2: { tlv: 0.5, idlh: 10, name: 'Cloro gas (Cl₂)' },
    hcl: { tlv: 2.0, idlh: 50, name: 'Ácido clorhídrico (HCl)' },
  };
  const hseEval = (gas, ppm) => {
    const g = HSE[gas];
    const kpis = $('hse-kpis').querySelectorAll('.kpi strong');
    const log = $('hse-log'), st = $('hse-status');
    let cls, riesgo, accion, stMsg;
    if (ppm < g.tlv) {
      cls = 'ok'; riesgo = 'BAJO'; stMsg = 'AMBIENTE SEGURO';
      accion = 'Vigilancia normal'; }
    else if (ppm < g.idlh) {
      cls = 'warn'; riesgo = 'MEDIO · sobre TLV'; stMsg = 'PRE-ALARMA HSE';
      accion = 'EPP nivel B · ventilación forzada · aviso a supervisión'; }
    else {
      cls = 'crit'; riesgo = 'CRÍTICO · IDLH'; stMsg = 'EVACUACIÓN INMEDIATA';
      accion = 'Evacuación · SCBA · torre neutralizadora ON · corte de proceso · 112'; }
    kpis[0].textContent = `${fmt(ppm, 2)} ppm`;
    kpis[1].textContent = `${g.tlv} ppm`;
    kpis[2].textContent = riesgo;
    kpis[3].textContent = accion.split(' · ')[0];
    st.className = 'status ' + cls; st.innerHTML = `<span class="dot-pulse"></span>${stMsg}`;
    log.className = 'log ' + cls;
    log.textContent = `> ${g.name}\n• Lectura: ${fmt(ppm, 2)} ppm\n• TLV-TWA: ${g.tlv} ppm · IDLH: ${g.idlh} ppm\n• Riesgo: ${riesgo}\n• Acción SCADA: ${accion}`;
  };
  $('hse-run')?.addEventListener('click', () => hseEval($('hse-gas').value, +$('hse-ppm').value || 0));
  $('hse-drill')?.addEventListener('click', async () => {
    const inp = $('hse-ppm'), gas = $('hse-gas');
    gas.value = 'cl2';
    const seq = [0.3, 0.8, 3.2, 7.8, 12.5, 6.0, 1.2, 0.4];
    const log = $('hse-log');
    for (const v of seq) {
      inp.value = v;
      hseEval('cl2', v);
      log.textContent = '[SIMULACRO] ' + log.textContent;
      await sleep(900);
    }
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
