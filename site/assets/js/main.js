/* ==========================================================================
   O VACA CICLISTA — JS progressivo
   Tudo aqui é opcional: o site funciona 100% sem JavaScript.
   - ticker alimentado por /assets/data/articles.json (fallback: itens no HTML)
   - reveal on scroll
   - parallax leve no Vaca do hero
   - filtros do blog (tipo + pelote)
   ========================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------- ticker via JSON
     Como a tarja é alimentada: o build/agente atualiza
     /assets/data/articles.json a cada novo post; este script lê o JSON e
     recompõe a tarja com os títulos mais recentes. Sem JS (ou se o fetch
     falhar), valem os itens estáticos já presentes no HTML. */
  var track = document.querySelector('[data-ticker]');
  if (track) {
    var base = track.getAttribute('data-base') || '';
    fetch(base + 'assets/data/articles.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.articles || !data.articles.length) return;
        var items = data.articles.slice(0, 6);
        var html = items.map(function (a) {
          var label = a.ticker || a.title;
          return '<span class="ticker__item"><a href="' + base + a.url + '">' + label + '</a></span>';
        });
        // duplicado para o loop contínuo do marquee
        track.innerHTML = html.join('') + html.join('');
      })
      .catch(function () { /* mantém fallback estático */ });
  }

  /* --------------------------------------------------- reveal on scroll */
  var revs = document.querySelectorAll('.rev');
  if (revs.length && 'IntersectionObserver' in window && !reduced) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = (en.target.dataset.revDelay || 0) + 'ms';
          en.target.classList.add('in');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revs.forEach(function (el, i) {
      el.dataset.revDelay = (i % 4) * 90;
      obs.observe(el);
    });
  } else {
    revs.forEach(function (el) { el.classList.add('in'); });
  }

  /* --------------------------------------------------- parallax do Vaca */
  var vaca = document.querySelector('[data-parallax]');
  if (vaca && !reduced) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < 900) vaca.style.transform = 'translateY(' + (y * 0.16) + 'px) rotate(' + (y * 0.004) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* --------------------------------------------------- filtros do blog
     Aceita ?pelote=Nome e/ou ?tipo=Nome na URL (usado pelos links de
     categoria do header) para chegar já filtrado — sem isso, os links do
     menu caiam sempre na listagem inteira. */
  var grid = document.querySelector('[data-catalog]');
  if (grid) {
    var params = new URLSearchParams(window.location.search);
    var urlPelote = params.get('pelote');
    var urlTipo = params.get('tipo');
    var state = { tipo: urlTipo || 'todas', pelote: urlPelote || 'todos' };
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-tipo]'));
    var status = document.querySelector('[data-filter-status]');
    var empty = document.querySelector('[data-empty]');

    function apply() {
      var visible = 0;
      cards.forEach(function (c) {
        var okTipo = state.tipo === 'todas' || c.getAttribute('data-tipo') === state.tipo;
        var okPelote = state.pelote === 'todos' || c.getAttribute('data-pelote') === state.pelote;
        var show = okTipo && okPelote;
        c.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (status) {
        status.textContent = visible + (visible === 1 ? ' matéria de pé' : ' matérias de pé') +
          (state.pelote !== 'todos' ? ' em ' + state.pelote : ' no site') +
          (state.tipo !== 'todas' ? ' · ' + state.tipo : '');
      }
      if (empty) empty.style.display = visible === 0 ? '' : 'none';
    }

    document.querySelectorAll('[data-filter-tipo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tipo = btn.getAttribute('data-filter-tipo');
        document.querySelectorAll('[data-filter-tipo]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        apply();
      });
    });
    document.querySelectorAll('[data-filter-pelote]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.pelote = btn.getAttribute('data-filter-pelote');
        document.querySelectorAll('[data-filter-pelote]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        apply();
      });
    });

    // reflete o estado vindo da URL nos chips visuais
    if (urlPelote) {
      document.querySelectorAll('[data-filter-pelote]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filter-pelote') === urlPelote ? 'true' : 'false');
      });
    }
    if (urlTipo) {
      document.querySelectorAll('[data-filter-tipo]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filter-tipo') === urlTipo ? 'true' : 'false');
      });
    }
    apply();
  }

  /* --------------------------------------------------- busca (overlay no header)
     Índice: assets/data/articles.json (mesmo arquivo do ticker/listagens).
     Sem backend — filtro client-side por título/descrição/pelote/tags.
     Sem JS, o botão ⌕ cai no fallback: leva para /blog/, que lista tudo. */
  var overlay = document.querySelector('[data-search-overlay]');
  if (overlay) {
    var sBase = overlay.getAttribute('data-base') || '';
    var input = overlay.querySelector('[data-search-input]');
    var results = overlay.querySelector('[data-search-results]');
    var openers = document.querySelectorAll('[data-search-open]');
    var closers = overlay.querySelectorAll('[data-search-close], [data-search-backdrop]');
    var searchData = null;
    var lastFocused = null;

    function loadIndex() {
      if (searchData) return Promise.resolve(searchData);
      return fetch(sBase + 'assets/data/articles.json')
        .then(function (r) { return r.ok ? r.json() : { articles: [] }; })
        .then(function (data) { searchData = data.articles || []; return searchData; })
        .catch(function () { searchData = []; return searchData; });
    }

    function renderHint() {
      results.innerHTML = '<p class="search-overlay__hint">Digite ao menos 2 letras — busca por título, pelote ou assunto. Índice gerado a partir de <code>articles.json</code>, atualizado a cada matéria publicada.</p>';
    }

    function renderResults(list, q) {
      if (!list.length) {
        results.innerHTML = '<p class="search-overlay__empty">Nada encontrado para "' + q + '". Veja todas as matérias no <a href="' + sBase + 'blog/index.html">Blog</a>.</p>';
        return;
      }
      results.innerHTML = list.slice(0, 12).map(function (a) {
        return '<a class="search-overlay__item" href="' + sBase + a.url + '"><span class="k">' + a.pelote + ' · ' + (a.dateline || '') + '</span><span class="t">' + a.title + '</span></a>';
      }).join('');
    }

    function doSearch(q) {
      q = q.trim().toLowerCase();
      if (q.length < 2) { renderHint(); return; }
      loadIndex().then(function (articles) {
        var hits = articles.filter(function (a) {
          var hay = [a.title, a.description, a.pelote, a.tipo].concat(a.tags || []).join(' ').toLowerCase();
          return hay.indexOf(q) !== -1;
        });
        renderResults(hits, q);
      });
    }

    function openSearch() {
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      document.body.classList.add('search-open');
      renderHint();
      loadIndex();
      setTimeout(function () { input.focus(); }, 30);
    }
    function closeSearch() {
      overlay.classList.remove('open');
      document.body.classList.remove('search-open');
      input.value = '';
      if (lastFocused) lastFocused.focus();
    }

    openers.forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
    });
    closers.forEach(function (el) { el.addEventListener('click', closeSearch); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    });
    input.addEventListener('input', function () { doSearch(input.value); });
  }

  /* --------------------------------------------------- posição do IOT gauge */
  document.querySelectorAll('.iot').forEach(function (el) {
    var v = parseInt(el.getAttribute('data-iot'), 10);
    var needle = el.querySelector('.iot__needle');
    if (needle && !isNaN(v)) needle.style.left = 'calc(' + Math.max(0, Math.min(100, v)) + '% - 2px)';
  });
})();
