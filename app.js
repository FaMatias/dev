/* Portfolio SCADA — Fabricio Toso · app.js */
(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n, d = 2) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ===== Menu toggle (mobile) =====
  const mt = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  mt?.addEventListener('click', () => {
    const open = nav.style.display === 'flex';
    nav.style.display = open ? 'none' : 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.top = '74px'; nav.style.right = '24px';
    nav.style.background = 'rgba(8,20,28,.95)';
    nav.style.padding = '16px 22px';
    nav.style.borderRadius = '12px';
    nav.style.border = '1px solid rgba(125,211,216,.18)';
    mt.setAttribute('aria-expanded', !open);
  });

  // ===== Circle arrow scroll =====
  document.querySelector('.circle-arrow')?.addEventListener('click', () =>
    document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })
  );

  // ===== M01 · Jar-Test =====
  const jar = {
    async run() {
      const ntu = +$('jar-ntu').value || 45;
      const pac = +$('jar-pac').value || 22;
      const log = $('jar-log'), vial = $('jar-vial'), bar = $('jar-bar'), btn = $('jar-run');
      btn.disabled = true; log.className = 'log';
      const steps = [
        ['Mezcla rápida 120 RPM · 60 s · dispersión del PAC…', 'rgba(180,140,60,.35)', '#2a1f10', 20],
        ['Floculación lenta 40 RPM · 15 min · formación de flóculos…', 'rgba(120,170,140,.25)', '#0e2018', 55],
        ['Sedimentación 20 min · decantación de flóculos…', 'rgba(60,140,160,.15)', '#0a1822', 85],
      ];
      for (const [msg, bg, vtxt, p] of steps) {
        log.textContent = `> ${msg}`;
        vial.style.background = bg;
        bar.style.width = p + '%';
        await sleep(1100);
      }
      // Optimal dose heuristic: ~0.45 mg/L per NTU
      const optimal = ntu * 0.45;
      const eff = Math.max(0, 100 - Math.abs(pac - optimal) * 4);
      const residual = Math.max(0.3, ntu * (1 - eff / 100) * 0.04);
      bar.style.width = '100%';
      vial.style.background = residual < 1 ? 'rgba(180,220,235,.22)' : 'rgba(160,140,90,.28)';
      vial.textContent = `Turbidez residual: ${fmt(residual)} NTU`;
      const ok = eff >= 80;
      log.className = 'log ' + (ok ? 'ok' : 'warn');
      log.textContent = `✓ Ensayo finalizado.\n• Dosis óptima estimada: ${fmt(optimal,1)} mg/L\n• Dosis aplicada: ${fmt(pac,1)} mg/L\n• Eficiencia de remoción: ${fmt(eff,1)} %\n• Turbidez residual: ${fmt(residual)} NTU ${ok?'(dentro de objetivo <1 NTU)':'(ajustar dosis)'}`;
      btn.disabled = false;
    }
  };
  $('jar-run')?.addEventListener('click', jar.run);

  // ===== M02 · Aluminio fotométrico =====
  const al = (() => {
    let step = 0;
    const steps = [
      { msg: 'Paso 2 de 4: añadir tampón pH 6,0 (acetato).', vial: 'rgba(180,160,60,.18)', vtxt: 'TAMPÓN AÑADIDO' },
      { msg: 'Paso 3 de 4: añadir reactivo eriocromo cianina R.', vial: 'rgba(200,90,140,.32)', vtxt: 'REACCIÓN CROMOGÉNICA' },
      { msg: 'Paso 4 de 4: lectura a 535 nm.', vial: 'rgba(220,100,150,.45)', vtxt: 'LEYENDO ABSORBANCIA…' },
      { msg: 'Resultado final', vial: '', vtxt: '' },
    ];
    return {
      next() {
        const log = $('al-log'), vial = $('al-vial'), btn = $('al-next'), stepEl = $('al-step');
        const dose = +$('al-dose').value || 22;
        if (step < 3) {
          const s = steps[step];
          stepEl.textContent = s.msg;
          vial.style.background = s.vial; vial.textContent = s.vtxt;
          log.textContent = `> ${s.msg}`;
          step++;
          if (step === 3) btn.textContent = 'Calcular Al residual';
        } else {
          // overdose => more residual Al
          const residual = Math.max(0.05, (dose - 15) * 0.012 + Math.random() * 0.03);
          const ok = residual <= 0.2;
          vial.style.background = ok ? 'rgba(150,200,210,.18)' : 'rgba(220,120,160,.4)';
          vial.textContent = `${fmt(residual,3)} mg Al/L`;
          log.className = 'log ' + (ok ? 'ok' : 'crit');
          log.textContent = `✓ Lectura completa (λ 535 nm).\n• Al residual: ${fmt(residual,3)} mg/L\n• Límite RD 140/2003: 0,200 mg/L\n• Estado: ${ok ? 'CONFORME' : 'NO CONFORME — reducir dosis de PAC'}`;
          btn.disabled = true;
        }
      }
    };
  })();
  $('al-next')?.addEventListener('click', al.next);

  // ===== M03 · Amonio salicilato =====
  const nh = (() => {
    let step = 0;
    const steps = [
      { msg: 'Paso 2 de 4: agitar 30 s para disolución completa.', bg: 'rgba(200,200,120,.12)', t: 'DISOLUCIÓN EN CURSO' },
      { msg: 'Paso 3 de 4: añadir activador hipoclorito alcalino.', bg: 'rgba(120,200,150,.22)', t: 'COMPLEJO INDOFENOL FORMÁNDOSE' },
      { msg: 'Paso 4 de 4: esperar 15 min · lectura a 655 nm.', bg: 'rgba(60,180,160,.35)', t: 'COLORACIÓN VERDE-AZULADA' },
      { msg: 'Resultado final', bg: '', t: '' },
    ];
    return {
      next() {
        const log = $('nh-log'), vial = $('nh-vial'), btn = $('nh-next'), stepEl = $('nh-step');
        const c = +$('nh-c').value || 0.45;
        if (step < 3) {
          const s = steps[step];
          stepEl.textContent = s.msg;
          vial.style.background = s.bg; vial.textContent = s.t;
          log.textContent = `> ${s.msg}`;
          step++;
          if (step === 3) btn.textContent = 'Leer absorbancia';
        } else {
          const measured = c * (0.95 + Math.random() * 0.1);
          const ok = measured <= 0.5;
          vial.style.background = ok ? 'rgba(120,200,180,.25)' : 'rgba(60,170,150,.5)';
          vial.textContent = `${fmt(measured,3)} mg NH₄⁺/L`;
          log.className = 'log ' + (ok ? 'ok' : 'warn');
          log.textContent = `✓ Determinación finalizada.\n• NH₄⁺ medido: ${fmt(measured,3)} mg/L\n• Límite RD 140/2003: 0,50 mg/L\n• Estado: ${ok ? 'CONFORME' : 'NO CONFORME — revisar cloraminación/precloración'}`;
          btn.disabled = true;
        }
      }
    };
  })();
  $('nh-next')?.addEventListener('click', nh.next);

  // ===== M04 · Balance logístico =====
  $('lg-run')?.addEventListener('click', () => {
    const q = +$('lg-q').value || 0;       // m³/h
    const d = +$('lg-d').value || 0;       // mg/L
    const s = +$('lg-s').value || 0;       // kg
    const lps = (q * 1000) / 3600;          // L/s
    const kgPerHour = (q * d) / 1000;       // mg/L * m³/h = g/h → /1000 = kg/h
    const kgPerDay = kgPerHour * 24;
    const autonomyDays = kgPerDay > 0 ? s / kgPerDay : Infinity;
    const priceKg = 0.55; // €/kg PAC referencial
    const monthlyCost = kgPerDay * 30 * priceKg;

    const kpis = $('lg-kpis').querySelectorAll('.kpi strong');
    kpis[0].textContent = `${fmt(lps,1)} L/s`;
    kpis[1].textContent = `${fmt(kgPerDay,1)} kg/d`;
    kpis[2].textContent = isFinite(autonomyDays) ? `${fmt(autonomyDays,1)} d` : '∞';
    kpis[3].textContent = `${fmt(monthlyCost,0)} €`;

    const log = $('lg-log');
    let cls = 'ok', warn = '';
    if (autonomyDays < 7) { cls = 'crit'; warn = '\n⚠ STOCK CRÍTICO — programar reposición inmediata.'; }
    else if (autonomyDays < 15) { cls = 'warn'; warn = '\n⚠ Stock bajo — generar orden de compra.'; }
    log.className = 'log ' + cls;
    log.textContent = `> Balance calculado:\n• Caudal: ${fmt(q,0)} m³/h ≡ ${fmt(lps,1)} L/s ≡ ${fmt(q*1000,0)} L/h\n• Consumo PAC: ${fmt(kgPerHour,2)} kg/h · ${fmt(kgPerDay,1)} kg/día\n• Autonomía del silo: ${fmt(autonomyDays,1)} días\n• Coste mensual estimado: ${fmt(monthlyCost,0)} €${warn}`;
  });

  // ===== M05 · Contralavado =====
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
    log.textContent = `✓ Ciclo de contralavado completado.\n• ΔP inicial: ${fmt(dp)} bar → ΔP final: ${fmt(0.12 + Math.random()*0.08)} bar\n• Volumen de agua de lavado: ~12 m³\n• Filtro reincorporado al ciclo de filtración.`;
    btn.disabled = false;
  });

  // ===== Reveal on scroll =====
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
