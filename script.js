(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast helper ---------- */
  var toastWrap = document.getElementById('toastWrap');
  function toast(msg) {
    if (!toastWrap) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
    t.appendChild(document.createTextNode(msg));
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 300);
    }, 2200);
  }

  /* ---------- Sprite floaters (container is parallaxed, not each dot) ---------- */
  function initSprites() {
    var container = document.getElementById('sprites');
    if (!container) return;
    container.innerHTML = '';
    var w = window.innerWidth;
    var count = w <= 768 ? 8 : (w <= 1024 ? 12 : 16);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var f = document.createElement('div');
      f.className = 'sprite-floater';
      f.style.left = (Math.random() * 100) + '%';
      f.style.top = (Math.random() * 100) + '%';
      f.style.animationDelay = (Math.random() * 10) + 's';
      frag.appendChild(f);
    }
    container.appendChild(frag);
  }

  /* Parallax the whole sprite layer + drive the reading-progress bar. */
  var spriteLayer = document.getElementById('sprites');
  var progressBar = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');
  var ticking = false;
  function onScrollFrame() {
    var y = window.pageYOffset;
    if (spriteLayer && !prefersReduced) spriteLayer.style.transform = 'translateY(' + (y * 0.12) + 'px)';
    if (progressBar) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';
    }
    if (backToTop) backToTop.classList.toggle('show', y > 500);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScrollFrame); ticking = true; }
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initSprites, 200);
  }, { passive: true });

  /* ---------- Pointer-tracked 3D tilt + glare ---------- */
  function bindTilt() {
    if (prefersReduced) return;
    var cards = document.querySelectorAll('.link-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var rx = ((y - r.height / 2) / r.height) * 8;
        var ry = ((r.width / 2 - x) / r.width) * 8;
        card.style.transform = 'translateY(-8px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Theme (system-aware + persisted) ---------- */
  function initTheme() {
    var toggle = document.getElementById('themeToggle');

    function getStoredTheme() {
      try { return localStorage.getItem('theme'); } catch (_) { return null; }
    }

    function persistTheme(theme) {
      try { localStorage.setItem('theme', theme); } catch (_) {}
    }

    function syncViewportBackground(theme) {
      var bg = theme === 'dark' ? '#0a1733' : '#d7ecff';
      document.documentElement.style.backgroundColor = bg;
      document.documentElement.style.colorScheme = theme;
      if (document.body) document.body.style.backgroundColor = bg;
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
        meta.setAttribute('content', bg);
      });
    }

    function setTheme(theme, persist) {
      document.documentElement.setAttribute('data-theme', theme);
      syncViewportBackground(theme);
      if (persist) persistTheme(theme);
      window.dispatchEvent(new CustomEvent('bio:themechange', { detail: { theme: theme } }));
    }

    var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var stored = getStoredTheme();
    setTheme(stored || (themeQuery.matches ? 'dark' : 'light'), false);

    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(next, true);
      });

      // Listen for system theme changes
      var onSystemThemeChange = function(e) {
        if (!getStoredTheme()) setTheme(e.matches ? 'dark' : 'light', false);
      };
      if (themeQuery.addEventListener) themeQuery.addEventListener('change', onSystemThemeChange);
      else if (themeQuery.addListener) themeQuery.addListener(onSystemThemeChange);
    }
  }
  initTheme();

  /* ---------- Accordion reveal helper (height-animated, clip-free when open) ---------- */
  function setReveal(el, open) {
    if (!el) return;
    if (open) {
      el.classList.add('open');
      el.style.maxHeight = el.scrollHeight + 'px';
      var done = function (e) {
        if (e && e.propertyName !== 'max-height') return;
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible'; /* let card hover-glows spill past the container edges */
        el.removeEventListener('transitionend', done);
      };
      el.addEventListener('transitionend', done);
    } else {
      el.style.overflow = 'hidden'; /* clip again before collapsing */
      el.style.maxHeight = el.scrollHeight + 'px';
      void el.offsetHeight; /* force reflow so the next change animates */
      el.classList.remove('open');
      requestAnimationFrame(function () { el.style.maxHeight = '0'; });
    }
  }

  /* ---------- Bio + project links reveal (single toggle) ---------- */
  function initBio() {
    var btn = document.getElementById('bioToggle');
    var panel = document.getElementById('bioExpand');
    var reveal = document.getElementById('linksReveal');
    var hint = document.getElementById('linksHint');
    if (!btn) return;
    var open = false;
    btn.addEventListener('click', function () {
      open = !open;
      if (panel) panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0';
      setReveal(reveal, open);
      if (hint) hint.style.display = open ? 'none' : '';
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open ? 'Show less' : 'More about me';
      btn.querySelector('svg').style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  /* ---------- Project filtering (real, bento-aware) ---------- */
  function initFilter() {
    var bar = document.getElementById('sectionFilter');
    var grid = document.getElementById('linksGrid');
    if (!bar || !grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.link-card'));
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');
      bar.querySelectorAll('.filter-btn').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      grid.classList.toggle('filtering', filter !== 'all');
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !match);
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var i = Array.prototype.indexOf.call(el.parentNode.children, el);
          el.style.transitionDelay = Math.min(i * 50, 300) + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }


  /* ---------- Share ---------- */
  function initShare() {
    var btn = document.getElementById('shareBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var data = { title: document.title, text: 'Check out Vazghen Vardanian’s hub', url: location.href };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () { toast('Link copied to clipboard'); });
      } else {
        toast(location.href);
      }
    });
  }

  /* ---------- Copy email ---------- */
  function initCopyEmail() {
    var btn = document.getElementById('copyEmail');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var email = btn.getAttribute('data-email');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(function () { toast('Email copied'); });
      } else {
        toast(email);
      }
    });
  }

  /* ---------- Command palette ( / or Ctrl/Cmd+K ) ---------- */
  function initCmdK() {
    var overlay = document.getElementById('cmdkOverlay');
    var input = document.getElementById('cmdkInput');
    var results = document.getElementById('cmdkResults');
    if (!overlay || !input || !results) return;

    var countEl = document.getElementById('cmdkCount');
    var searchSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.35-4.35"></path></svg>';

    var items = [];
    document.querySelectorAll('.links-grid .link-card').forEach(function (card) {
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p');
      var icon = card.querySelector('.link-icon svg');
      items.push({
        group: 'Links',
        label: h3 ? h3.textContent.trim() : 'Link',
        sub: p ? p.textContent.trim() : '',
        icon: icon ? icon.outerHTML : '',
        href: card.getAttribute('href'),
        target: card.getAttribute('href') && card.getAttribute('href').indexOf('mailto:') === 0 ? '_self' : '_blank'
      });
    });
    document.querySelectorAll('.social-grid .social-link').forEach(function (a) {
      var span = a.querySelector('span');
      var icon = a.querySelector('.social-btn svg');
      items.push({ group: 'Social', label: span ? span.textContent.trim() : 'Social', sub: 'Social profile', icon: icon ? icon.outerHTML : '', href: a.getAttribute('href'), target: '_blank' });
    });
    items.push({ group: 'Actions', label: 'Toggle theme', sub: 'Switch light / dark', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path></svg>', action: function () { document.getElementById('themeToggle').click(); } });
    items.push({ group: 'Actions', label: 'Share this page', sub: 'Copy or share link', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line></svg>', action: function () { document.getElementById('shareBtn').click(); } });
    items.push({ group: 'Actions', label: 'Show QR code', sub: 'Open this page on your phone', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><line x1="14" y1="14" x2="21" y2="14"></line><line x1="14" y1="18" x2="14" y2="21"></line></svg>', action: function () { var b = document.getElementById('qrBtn'); if (b) b.click(); } });
    items.push({ group: 'Actions', label: 'Save my contact', sub: 'Download vCard (.vcf)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>', action: function () { var b = document.getElementById('contactBtn'); if (b) b.click(); } });

    var active = 0, filtered = items.slice(), query = '';

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function highlight(text) {
      var safe = esc(text);
      if (!query) return safe;
      var idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return safe;
      return esc(text.slice(0, idx)) + '<mark>' + esc(text.slice(idx, idx + query.length)) + '</mark>' + esc(text.slice(idx + query.length));
    }

    function render() {
      results.innerHTML = '';
      if (countEl) countEl.textContent = filtered.length + (filtered.length === 1 ? ' result' : ' results');
      if (!filtered.length) {
        results.innerHTML = '<div class="cmdk-empty">No matches for “' + esc(query) + '”</div>';
        return;
      }
      var lastGroup = null;
      filtered.forEach(function (it, i) {
        if (it.group !== lastGroup) {
          lastGroup = it.group;
          var lbl = document.createElement('div');
          lbl.className = 'cmdk-group-label';
          lbl.textContent = it.group;
          results.appendChild(lbl);
        }
        var b = document.createElement('button');
        b.className = 'cmdk-item' + (i === active ? ' active' : '');
        b.setAttribute('role', 'option');
        b.innerHTML = '<span class="ci-icon">' + (it.icon || searchSvg) + '</span>' +
          '<span class="ci-text"><strong>' + highlight(it.label) + '</strong><small>' + highlight(it.sub || '') + '</small></span>' +
          '<span class="ci-enter">↵</span>';
        b.addEventListener('click', function () { run(it); });
        b.addEventListener('mousemove', function () { if (active !== i) { active = i; paintActive(); } });
        results.appendChild(b);
      });
    }
    function paintActive() {
      var kids = results.querySelectorAll('.cmdk-item');
      kids.forEach(function (k, i) { k.classList.toggle('active', i === active); });
      if (kids[active]) kids[active].scrollIntoView({ block: 'nearest' });
    }
    function run(it) {
      close();
      if (it.action) { it.action(); return; }
      if (!it.href || it.href === '#') { toast('Coming soon: ' + it.label); return; }
      if (it.target === '_blank') window.open(it.href, '_blank', 'noopener,noreferrer');
      else window.location.href = it.href;
    }
    function search(q) {
      query = q.trim().toLowerCase();
      filtered = !query ? items.slice() : items.filter(function (it) {
        return (it.label + ' ' + (it.sub || '') + ' ' + it.group).toLowerCase().indexOf(query) !== -1;
      });
      active = 0; render();
    }
    function open() { overlay.classList.add('open'); input.value = ''; search(''); setTimeout(function () { input.focus(); }, 30); }
    function close() { overlay.classList.remove('open'); }

    input.addEventListener('input', function () { search(input.value); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      var typing = /^(input|textarea|select)$/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault(); open(); return;
      }
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); paintActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paintActive(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) run(filtered[active]); }
    });
  }

  /* ---------- Data-driven profile config (single source of truth) ---------- */
  var SITE = {
    name: 'Vazghen Vardanian',
    role: 'Junior Full-Stack Developer · AI & Blockchain Enthusiast',
    email: 'iamvazghen@gmail.com',
    url: location.href.split('#')[0],
    org: 'Advi Systems',
    socials: {
      Instagram: 'https://instagram.com/iamvazghen',
      LinkedIn: 'https://linkedin.com/in/iamvazghen',
      GitHub: 'https://github.com/iamvazghen'
    }
  };

  /* ---------- vCard ("Save contact") ---------- */
  function buildVCard() {
    var n = SITE.name.trim().split(/\s+/);
    var last = n.length > 1 ? n[n.length - 1] : '';
    var first = n.slice(0, n.length > 1 ? n.length - 1 : 1).join(' ');
    var lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      'N:' + last + ';' + first + ';;;',
      'FN:' + SITE.name,
      'TITLE:' + SITE.role,
      'ORG:' + SITE.org,
      'EMAIL;TYPE=INTERNET:' + SITE.email,
      'URL:' + SITE.url
    ];
    Object.keys(SITE.socials).forEach(function (k) { lines.push('URL;TYPE=' + k + ':' + SITE.socials[k]); });
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }
  function downloadVCard() {
    try {
      var blob = new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = SITE.name.replace(/\s+/g, '-').toLowerCase() + '.vcf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Contact card downloaded');
    } catch (_) { toast('Could not create contact card'); }
  }
  function initContact() {
    var btn = document.getElementById('contactBtn');
    var save = document.getElementById('qrSaveContact');
    if (btn) btn.addEventListener('click', downloadVCard);
    if (save) save.addEventListener('click', downloadVCard);
  }

  /* ---------- QR modal (lazy lib load, image fallback) ---------- */
  function initQR() {
    var openBtn = document.getElementById('qrBtn');
    var overlay = document.getElementById('qrOverlay');
    var closeBtn = document.getElementById('qrClose');
    var holder = document.getElementById('qrCanvas');
    if (!openBtn || !overlay || !holder) return;
    var built = false;

    function fallbackImg() {
      holder.innerHTML = '';
      var img = document.createElement('img');
      img.alt = 'QR code for ' + SITE.url; img.width = 200; img.height = 200;
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=' + encodeURIComponent(SITE.url);
      holder.appendChild(img);
    }
    function drawLib() {
      if (!(window.QRCode && window.QRCode.toCanvas)) { fallbackImg(); return; }
      holder.innerHTML = '';
      var c = document.createElement('canvas');
      holder.appendChild(c);
      window.QRCode.toCanvas(c, SITE.url, { width: 400, margin: 0, color: { dark: '#1a1209', light: '#ffffff' } }, function (err) { if (err) fallbackImg(); });
    }
    function build() {
      if (built) return; built = true;
      if (window.QRCode && typeof window.QRCode.toCanvas === 'function') { drawLib(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      s.onload = drawLib; s.onerror = fallbackImg;
      document.head.appendChild(s);
    }
    function open() { build(); overlay.classList.add('open'); }
    function close() { overlay.classList.remove('open'); }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  }

  /* ---------- Live GitHub data (idea 1, key-free + CORS-friendly) ---------- */
  function initLive() {
    var ghUrl = (SITE.socials && SITE.socials.GitHub) || '';
    var user = ghUrl.replace(/\/+$/, '').split('/').pop();
    if (!user) return;
    // Real public-repo count -> badge on the GitHub social button
    fetch('https://api.github.com/users/' + user).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || typeof d.public_repos !== 'number') return;
      var gh = document.querySelector('.social-grid a[href*="github.com/"]');
      if (gh && !gh.querySelector('.social-followers')) {
        var b = document.createElement('div');
        b.className = 'social-followers';
        b.textContent = d.public_repos + ' repos';
        gh.appendChild(b);
      }
    }).catch(function () {});
    // Most recently pushed repo -> live "Latest" link in the footer
    fetch('https://api.github.com/users/' + user + '/repos?sort=pushed&per_page=1').then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list || !list.length || !list[0].html_url) return;
      var footer = document.querySelector('.footer p');
      if (!footer) return;
      var a = document.createElement('a');
      a.href = list[0].html_url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.color = 'var(--current-accent)';
      a.textContent = 'Latest repo updated: ' + list[0].name;
      footer.appendChild(document.createTextNode(' · '));
      footer.appendChild(a);
    }).catch(function () {});
  }

  /* ---------- Hover link previews (idea 2, no key via WordPress mShots) ---------- */
  function initPreviews() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    var grid = document.getElementById('linksGrid');
    if (!grid) return;
    var pv = document.createElement('div'); pv.className = 'card-preview';
    var img = document.createElement('img'); img.alt = ''; pv.appendChild(img);
    document.body.appendChild(pv);
    var current = null, loadedSrc = '';
    img.addEventListener('load', function () { img.classList.add('loaded'); });
    function shot(u) { return 'https://s0.wp.com/mshots/v1/' + encodeURIComponent(u) + '?w=560&h=350'; }
    function position(card) {
      var r = card.getBoundingClientRect(), w = 280, h = 175, gap = 12;
      var left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
      var top = r.top - h - gap; if (top < 12) top = r.bottom + gap;
      pv.style.left = left + 'px'; pv.style.top = top + 'px';
    }
    grid.querySelectorAll('.link-card').forEach(function (card) {
      var href = card.getAttribute('href');
      if (!href || !/^https?:\/\//i.test(href)) return;
      var src = shot(href);
      card.addEventListener('mouseenter', function () {
        current = card; position(card);
        if (loadedSrc !== src) { img.classList.remove('loaded'); img.src = src; loadedSrc = src; }
        pv.classList.add('show');
      });
      card.addEventListener('mousemove', function () { if (current === card) position(card); });
      card.addEventListener('mouseleave', function () { if (current === card) { current = null; pv.classList.remove('show'); } });
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var yr = document.getElementById('year');
    if (yr) yr.textContent = String(new Date().getFullYear());
    initSprites();
    bindTilt();
    initBio();
    initFilter();
    initReveal();
    initShare();
    initCopyEmail();
    initCmdK();
    initContact();
    initQR();
    initLive();
    initPreviews();
    if (backToTop) backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); });
  });
})();
