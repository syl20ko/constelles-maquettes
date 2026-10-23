/* Maquettes Constelles, (c) Sylvain Caron 2026. Script commun, sans dépendance.
   1. Comportements de maquette (barre, formulaire, liens vides).
   2. Copie fidèle des scripts de suivi du site (templates/tracking_scripts/), pour prouver
      que chaque maquette envoie les mêmes événements que la page en ligne.
   3. ?suivi=1 affiche en direct les événements envoyés au dataLayer. */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('nobar') === '1') document.documentElement.classList.add('barre-cachee');
  window.dataLayer = window.dataLayer || [];

  // Panneau de contrôle du suivi (?suivi=1)
  var panneau = null;
  if (q.get('suivi') === '1') {
    panneau = document.createElement('aside');
    panneau.setAttribute('aria-live', 'polite');
    panneau.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:99;width:min(360px,calc(100% - 24px));max-height:46vh;overflow:auto;background:#14202a;color:#e8f0f6;font:12px/1.45 ui-monospace,Menlo,monospace;border-radius:12px;padding:12px;box-shadow:0 18px 40px -12px rgba(0,0,0,.5)';
    panneau.innerHTML = '<b style="color:#ffc82e;font:800 13px system-ui">Suivi GA4 / GTM en direct</b><div data-liste></div>';
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(panneau); });
    var push = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function (o) {
      var r = push(o);
      if (o && o.event && panneau) {
        var l = document.createElement('div');
        l.style.cssText = 'border-top:1px solid rgba(255,255,255,.12);padding:6px 0';
        var d = Object.keys(o).filter(function (k) { return k !== 'event'; }).map(function (k) { return k + '=' + JSON.stringify(o[k]); }).join(' ');
        l.textContent = o.event + '  ' + d;
        var liste = panneau.querySelector('[data-liste]');
        liste.insertBefore(l, liste.firstChild);
      }
      return r;
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Liens pas encore maquettés : un clic ne fait rien. Les liens externes s'ouvrent à part.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
      var ext = e.target.closest('a[href^="http"], a[href^="/"]');
      if (ext && !ext.target) { e.preventDefault(); window.open(ext.href.indexOf('http') === 0 ? ext.href : 'https://constelles-familiales.fr' + ext.getAttribute('href'), '_blank', 'noopener'); }
    });

    // Formulaire : rien n'est envoyé dans une maquette.
    document.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var b = f.querySelector('button[type="submit"]');
        if (b) b.textContent = 'Merci, c\'est noté (maquette)';
      });
    });

    // Menu mobile
    document.querySelectorAll('[data-menu]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = document.getElementById(b.getAttribute('aria-controls'));
        var open = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!open));
        if (n) n.classList.toggle('ouvert', !open);
      });
    });

    /* ---------- Copie des scripts de suivi du site, logique inchangée ---------- */

    // block_viewed : sections et header portant un id
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { window.dataLayer.push({ event: 'block_viewed', block_id: en.target.id }); o.unobserve(en.target); }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id], header[id]').forEach(function (b) { obs.observe(b); });

    // cta_click : éléments avec data-track-click
    document.querySelectorAll('[data-track-click]').forEach(function (el) {
      el.addEventListener('click', function () {
        window.dataLayer.push({
          event: 'cta_click',
          track_id: el.getAttribute('data-track-click'),
          element_type: el.tagName.toLowerCase(),
          element_text: el.textContent.replace(/\s\s+/g, ' ').trim() || el.alt,
          element_href: el.getAttribute('href') || null,
          service_name: el.getAttribute('data-track-service') || null
        });
      });
    });

    // scroll_depth : 25, 50, 75, 100
    var seuils = [25, 50, 75, 100], faits = [];
    window.addEventListener('scroll', function () {
      var p = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      seuils.forEach(function (s) { if (p >= s && faits.indexOf(s) < 0) { window.dataLayer.push({ event: 'scroll_depth', scroll_percent: s }); faits.push(s); } });
    });

    // form_start + form_field_filled
    var debut = false;
    document.querySelectorAll('input, select, textarea, button').forEach(function (f) {
      f.addEventListener('focus', function () {
        var id = f.form ? f.form.getAttribute('name') : null;
        if (!debut && id) { window.dataLayer.push({ event: 'form_start', form_id: id }); debut = true; }
      });
      var ev = f.tagName.toLowerCase() === 'select' ? 'change' : 'blur';
      f.addEventListener(ev, function () {
        var n = f.getAttribute('name');
        var v = f.type === 'checkbox' || f.type === 'radio' ? f.checked : f.value || null;
        if (n && v !== null) window.dataLayer.push({ event: 'form_field_filled', form_id: f.form ? f.form.getAttribute('name') : null, field_name: n, field_value: v });
      });
    });

    // form_fill_time : form.form-style-1
    var t0 = new Date(), form = document.querySelector('form.form-style-1');
    if (form) form.addEventListener('submit', function () {
      window.dataLayer.push({ event: 'form_fill_time', form_id: form.getAttribute('name'), time_spent: (new Date() - t0) / 1000 });
    });
  });
})();
