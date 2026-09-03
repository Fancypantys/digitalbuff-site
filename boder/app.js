/* Bødekassen — Round Table
 * Statisk web-app. Al data ligger i browserens localStorage.
 * Ingen build, ingen afhængigheder.
 */
(function () {
  'use strict';

  var KEY = 'rt_boder_v1';

  var DEFAULT_TYPES = [
    { name: 'For sent til møde', amount: 20 },
    { name: 'Udeblivelse uden afbud', amount: 50 },
    { name: 'Mobilen ringer under mødet', amount: 25 },
    { name: 'Glemt Round Table-nål', amount: 10 },
    { name: 'Afbryder Præsidenten', amount: 20 },
    { name: 'Taler uden at rejse sig', amount: 15 },
    { name: 'Glemt navneskilt', amount: 10 },
    { name: 'Fødselsdag', amount: 50 },
    { name: 'Nyt job eller forfremmelse', amount: 50 },
    { name: 'Barn født', amount: 100 },
    { name: 'Præsidentens skøn', amount: 25 }
  ];

  /* ---------------- Hjælpefunktioner ---------------- */

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var nf = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });

  function money(n) {
    return nf.format(Math.round(Number(n) || 0)) + ' ' + (db.settings.currency || 'kr');
  }

  function num(n) { return nf.format(Number(n) || 0); }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmtDate(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '.' + p[1] + '.' + p[0];
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    var s = (parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '');
    return s.toUpperCase();
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function sortBy(list, fn, desc) {
    return list.slice().sort(function (a, b) {
      var x = fn(a), y = fn(b);
      if (x < y) return desc ? 1 : -1;
      if (x > y) return desc ? -1 : 1;
      return 0;
    });
  }

  function sum(list, fn) {
    var t = 0;
    for (var i = 0; i < list.length; i++) t += Number(fn(list[i])) || 0;
    return t;
  }

  /* ---------------- Data ---------------- */

  function blank() {
    return {
      version: 1,
      demo: false,
      settings: { clubName: 'Bødekassen', currency: 'kr' },
      members: [],
      types: DEFAULT_TYPES.map(function (t) {
        return { id: uid(), name: t.name, amount: t.amount, active: true };
      }),
      fines: []
    };
  }

  function demoDb(settings) {
    var d = blank();
    if (settings) d.settings = settings;
    d.demo = true;
    var names = ['Anders Holm', 'Mikkel Bay', 'Frederik Lund', 'Jonas Bruun', 'Kasper Riis', 'Rasmus Dahl', 'Thomas Vig', 'Søren Krag'];
    var roles = ['Præsident', 'Vicepræsident', 'Kasserer', 'Sekretær', '', '', '', ''];
    names.forEach(function (n, i) {
      d.members.push({ id: uid(), name: n, role: roles[i], joined: '', active: true });
    });
    var now = new Date();
    for (var i = 0; i < 70; i++) {
      var m = d.members[Math.floor(Math.random() * d.members.length)];
      var t = d.types[Math.floor(Math.random() * d.types.length)];
      var day = new Date(now.getTime() - Math.floor(Math.random() * 300) * 86400000);
      var paid = Math.random() > 0.38;
      d.fines.push({
        id: uid(),
        memberId: m.id,
        typeId: t.id,
        label: t.name,
        amount: t.amount,
        date: day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate()),
        note: '',
        paid: paid,
        paidDate: paid ? todayISO() : ''
      });
    }
    return d;
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return demoDb();
    try {
      var d = JSON.parse(raw);
      return normalize(d);
    } catch (e) {
      return blank();
    }
  }

  function normalize(d) {
    var base = blank();
    if (!d || typeof d !== 'object') return base;
    return {
      version: 1,
      demo: !!d.demo,
      settings: {
        clubName: (d.settings && d.settings.clubName) || base.settings.clubName,
        currency: (d.settings && d.settings.currency) || base.settings.currency
      },
      members: Array.isArray(d.members) ? d.members.map(function (m) {
        return {
          id: m.id || uid(),
          name: String(m.name || 'Ukendt'),
          role: String(m.role || ''),
          joined: m.joined || '',
          active: m.active !== false
        };
      }) : [],
      types: Array.isArray(d.types) && d.types.length ? d.types.map(function (t) {
        return {
          id: t.id || uid(),
          name: String(t.name || 'Bøde'),
          amount: Number(t.amount) || 0,
          active: t.active !== false
        };
      }) : base.types,
      fines: Array.isArray(d.fines) ? d.fines.map(function (f) {
        return {
          id: f.id || uid(),
          memberId: f.memberId || '',
          typeId: f.typeId || '',
          label: String(f.label || 'Bøde'),
          amount: Number(f.amount) || 0,
          date: f.date || todayISO(),
          note: String(f.note || ''),
          paid: !!f.paid,
          paidDate: f.paidDate || ''
        };
      }) : []
    };
  }

  var db = load();
  var toastTimer = null;

  function save(rerender) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      toast('Kunne ikke gemme — browserens lager er fuldt eller blokeret.', true);
    }
    if (rerender !== false) render();
  }

  /* ---------------- UI-tilstand ---------------- */

  var ui = {
    view: 'dashboard',
    period: 'all',
    draft: { typeId: null, memberIds: [], amount: '', date: todayISO(), note: '', label: '' },
    filters: { q: '', memberId: '', typeId: '', status: '' },
    refocus: null
  };

  function toast(msg, isErr) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2600);
  }

  /* ---------------- Periode ---------------- */

  function years() {
    var set = {};
    db.fines.forEach(function (f) { set[String(f.date).slice(0, 4)] = true; });
    set[String(todayISO()).slice(0, 4)] = true;
    return Object.keys(set).sort().reverse();
  }

  function inPeriod(f) {
    if (ui.period === 'all') return true;
    return String(f.date).slice(0, 4) === ui.period;
  }

  function periodFines() {
    return db.fines.filter(inPeriod);
  }

  function periodLabel() {
    return ui.period === 'all' ? 'alle sæsoner' : 'sæson ' + ui.period;
  }

  /* ---------------- Beregninger ---------------- */

  function memberStats(fines) {
    var map = {};
    db.members.forEach(function (m) {
      map[m.id] = { member: m, count: 0, total: 0, paid: 0, due: 0, dueCount: 0, last: '' };
    });
    fines.forEach(function (f) {
      var row = map[f.memberId];
      if (!row) return;
      row.count++;
      row.total += f.amount;
      if (f.paid) { row.paid += f.amount; } else { row.due += f.amount; row.dueCount++; }
      if (f.date > row.last) row.last = f.date;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function typeStats(fines) {
    var map = {};
    fines.forEach(function (f) {
      var key = f.typeId || ('fri:' + f.label);
      if (!map[key]) map[key] = { name: f.label, count: 0, total: 0 };
      map[key].count++;
      map[key].total += f.amount;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function totals(fines) {
    var total = sum(fines, function (f) { return f.amount; });
    var paid = sum(fines.filter(function (f) { return f.paid; }), function (f) { return f.amount; });
    return { count: fines.length, total: total, paid: paid, due: total - paid };
  }

  /* ---------------- Små byggeklodser ---------------- */

  function kpi(label, value, sub, cls) {
    return '<div class="card kpi">' +
      '<span class="kpi-label">' + esc(label) + '</span>' +
      '<span class="kpi-value ' + (cls || '') + '">' + esc(value) + '</span>' +
      (sub ? '<span class="kpi-sub">' + esc(sub) + '</span>' : '') +
      '</div>';
  }

  function barChart(rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<p class="empty">Ingen data endnu.</p>';
    var max = 0;
    rows.forEach(function (r) { if (r.value > max) max = r.value; });
    if (max <= 0) max = 1;
    return '<div class="bars">' + rows.map(function (r) {
      var pct = Math.max(2, Math.round((r.value / max) * 100));
      return '<div class="bar-row">' +
        '<span class="bar-name" title="' + esc(r.label) + '">' + esc(r.label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill ' + (opts.tone || '') + '" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-val">' + esc(r.display) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function columnChart(rows) {
    if (!rows.length) return '<p class="empty">Ingen data endnu.</p>';
    var max = 0;
    rows.forEach(function (r) { if (r.value > max) max = r.value; });
    if (max <= 0) max = 1;
    return '<div class="cols">' + rows.map(function (r) {
      var h = Math.max(2, Math.round((r.value / max) * 100));
      return '<div class="col" title="' + esc(r.label + ': ' + r.display) + '">' +
        '<span class="col-val">' + esc(r.short || '') + '</span>' +
        '<span class="col-bar ' + (r.value === max ? 'hi' : '') + '" style="height:' + h + '%"></span>' +
        '<span class="col-label">' + esc(r.label) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function donut(paid, due) {
    var total = paid + due;
    var pct = total > 0 ? paid / total : 0;
    var C = 339.292;
    var dash = (pct * C).toFixed(1);
    return '<div class="donut-wrap">' +
      '<svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Betalt ' + Math.round(pct * 100) + ' procent">' +
      '<circle cx="66" cy="66" r="54" fill="none" stroke="#1b1b1e" stroke-width="16"/>' +
      '<circle cx="66" cy="66" r="54" fill="none" stroke="#00d9a3" stroke-width="16" stroke-linecap="round"' +
      ' stroke-dasharray="' + dash + ' ' + (C - dash).toFixed(1) + '" transform="rotate(-90 66 66)"/>' +
      '<text x="66" y="62" text-anchor="middle" fill="#f5f3ee" font-size="22" font-family="JetBrains Mono, monospace" font-weight="700">' + Math.round(pct * 100) + '%</text>' +
      '<text x="66" y="80" text-anchor="middle" fill="#8a8680" font-size="11" font-family="Inter, sans-serif">betalt</text>' +
      '</svg>' +
      '<div class="legend">' +
      '<span class="legend-item"><span class="legend-dot" style="background:#00d9a3"></span>Betalt: <strong class="mono">' + esc(money(paid)) + '</strong></span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:#1b1b1e;border:1px solid #262626"></span>Udestående: <strong class="mono">' + esc(money(due)) + '</strong></span>' +
      '</div></div>';
  }

  function emptyBox(title, body, action) {
    return '<div class="card"><div class="empty"><strong>' + esc(title) + '</strong>' + esc(body) +
      (action ? '<div style="margin-top:14px">' + action + '</div>' : '') + '</div></div>';
  }

  function demoBanner() {
    if (!db.demo) return '';
    return '<div class="banner">' +
      '<span class="banner-dot" aria-hidden="true"></span>' +
      '<p><strong>Du kigger på demo-data.</strong> Otte opdigtede medlemmer og 70 tilfældige bøder, så appen viser noget fra første klik. Tøm den, når din egen klub skal ind.</p>' +
      '<span class="banner-actions">' +
      '<button class="btn btn-sm" data-action="demo-clear" type="button">Tøm og start forfra</button>' +
      '<button class="btn btn-sm btn-ghost" data-action="demo-keep" type="button">Behold data</button>' +
      '</span></div>';
  }

  /* ---------------- View: Oversigt ---------------- */

  function viewDashboard() {
    var fines = periodFines();
    var t = totals(fines);
    var activeMembers = db.members.filter(function (m) { return m.active; });
    var ms = sortBy(memberStats(fines).filter(function (r) { return r.count > 0; }), function (r) { return r.total; }, true);
    var recent = sortBy(fines, function (f) { return f.date + f.id; }, true).slice(0, 8);

    var html = '<div class="page-head"><div>' +
      '<h1>Oversigt</h1><p>' + esc(db.settings.clubName) + ' — ' + esc(periodLabel()) + '</p>' +
      '</div><div class="spacer">' +
      '<button class="btn btn-accent btn-sm" data-action="nav" data-view="new" type="button">+ Opret bøde</button>' +
      '</div></div>';

    if (!db.members.length) {
      return html + emptyBox('Kom i gang', 'Tilføj klubbens medlemmer, så kan du give den første bøde.',
        '<button class="btn btn-accent" data-action="nav" data-view="members" type="button">Tilføj medlemmer</button>');
    }

    html += '<div class="grid grid-kpi">' +
      kpi('Bødekassen i alt', money(t.total), t.count + ' bøder registreret') +
      kpi('Betalt', money(t.paid), t.total ? Math.round((t.paid / t.total) * 100) + ' % af kassen' : '—', 'accent') +
      kpi('Udestående', money(t.due), t.due > 0 ? 'mangler at blive betalt' : 'alt er betalt', t.due > 0 ? 'warn' : 'accent') +
      kpi('Pr. aktivt medlem', money(activeMembers.length ? t.total / activeMembers.length : 0), activeMembers.length + ' aktive medlemmer') +
      '</div>';

    html += '<div class="grid grid-2" style="margin-top:14px">';

    html += '<div class="card"><h2 class="section-title" style="margin-top:0">Top 5 — mest bødet</h2>' +
      barChart(ms.slice(0, 5).map(function (r) {
        return { label: r.member.name, value: r.total, display: money(r.total) };
      })) + '</div>';

    html += '<div class="card"><h2 class="section-title" style="margin-top:0">Betalingsstatus</h2>' +
      donut(t.paid, t.due) + '</div>';

    html += '</div>';

    html += '<h2 class="section-title">Seneste bøder</h2>';
    if (!recent.length) {
      html += emptyBox('Ingen bøder endnu', 'Så snart nogen kommer for sent, er du klar.',
        '<button class="btn btn-accent" data-action="nav" data-view="new" type="button">Opret første bøde</button>');
    } else {
      html += finesTable(recent, false);
    }

    var due = sortBy(memberStats(fines).filter(function (r) { return r.due > 0; }), function (r) { return r.due; }, true);
    if (due.length) {
      html += '<h2 class="section-title">Skyldnere</h2><div class="table-wrap"><table>' +
        '<thead><tr><th>Medlem</th><th class="num">Udestående</th><th class="num">Ubetalte</th><th class="actions"></th></tr></thead><tbody>' +
        due.map(function (r) {
          return '<tr><td><span class="name-cell"><span class="chip-initials">' + esc(initials(r.member.name)) + '</span>' + esc(r.member.name) + '</span></td>' +
            '<td class="num">' + esc(money(r.due)) + '</td>' +
            '<td class="num">' + r.dueCount + '</td>' +
            '<td class="actions"><button class="btn btn-xs" data-action="settle-member" data-id="' + esc(r.member.id) + '" type="button">Afregn alt</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    return html;
  }

  /* ---------------- View: Ny bøde ---------------- */

  function viewNew() {
    var d = ui.draft;
    var activeTypes = db.types.filter(function (t) { return t.active; });
    var activeMembers = db.members.filter(function (m) { return m.active; });

    var html = '<div class="page-head"><div><h1>Ny bøde</h1>' +
      '<p>Vælg bødetype, vælg hvem der skal betale, og tryk gem. Flere medlemmer ad gangen er også fint.</p></div></div>';

    if (!activeMembers.length) {
      return html + emptyBox('Ingen aktive medlemmer', 'Tilføj mindst ét medlem, før du kan oprette bøder.',
        '<button class="btn btn-accent" data-action="nav" data-view="members" type="button">Tilføj medlemmer</button>');
    }

    html += '<form data-form="new-fine" class="card stack">';

    html += '<div><h2 class="section-title" style="margin-top:0">1. Bødetype</h2><div class="chips">' +
      activeTypes.map(function (t) {
        return '<button type="button" class="chip ' + (d.typeId === t.id ? 'is-on' : '') + '" data-action="pick-type" data-id="' + esc(t.id) + '">' +
          esc(t.name) + ' <span class="chip-amt">' + esc(money(t.amount)) + '</span></button>';
      }).join('') +
      '<button type="button" class="chip ' + (d.typeId === '' ? 'is-on' : '') + '" data-action="pick-type" data-id="">Fri bøde</button>' +
      '</div>' +
      (d.typeId === '' ? '<div style="margin-top:12px"><label class="field">Beskrivelse<input type="text" data-draft="label" value="' + esc(d.label) + '" placeholder="Fx: Kom i habitbukser til grillaften" required></label></div>' : '') +
      '</div>';

    html += '<div><h2 class="section-title">2. Hvem?</h2><div class="chips">' +
      activeMembers.map(function (m) {
        var on = ui.draft.memberIds.indexOf(m.id) > -1;
        return '<button type="button" class="chip ' + (on ? 'is-on' : '') + '" data-action="pick-member" data-id="' + esc(m.id) + '">' +
          '<span class="chip-initials">' + esc(initials(m.name)) + '</span>' + esc(m.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="inline" style="margin-top:10px">' +
      '<button type="button" class="btn btn-xs" data-action="pick-all-members">Vælg alle</button>' +
      '<button type="button" class="btn btn-xs" data-action="clear-members">Ryd valg</button>' +
      '<span class="hint">' + d.memberIds.length + ' valgt</span></div></div>';

    html += '<div><h2 class="section-title">3. Detaljer</h2><div class="form-row">' +
      '<label class="field">Beløb pr. medlem (' + esc(db.settings.currency) + ')<input type="number" min="0" step="1" data-draft="amount" value="' + esc(d.amount) + '" required></label>' +
      '<label class="field">Dato<input type="date" data-draft="date" value="' + esc(d.date) + '" required></label>' +
      '</div>' +
      '<div style="margin-top:12px"><label class="field">Note (valgfri)<textarea data-draft="note" placeholder="Fx: 12 minutter for sent, igen">' + esc(d.note) + '</textarea></label></div></div>';

    var count = d.memberIds.length;
    var per = Number(d.amount) || 0;
    html += '<div class="form-actions">' +
      '<button class="btn btn-accent" type="submit">Gem bøde' + (count > 1 ? 'r' : '') + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="reset-draft">Nulstil</button>' +
      '<span class="hint">' + (count ? count + ' medlem' + (count > 1 ? 'mer' : '') + ' × ' + money(per) + ' = <strong class="mono">' + money(count * per) + '</strong>' : 'Vælg mindst ét medlem') + '</span>' +
      '</div>';

    html += '</form>';

    var last = sortBy(db.fines, function (f) { return f.date + f.id; }, true).slice(0, 5);
    if (last.length) {
      html += '<h2 class="section-title">Sidst registreret</h2>' + finesTable(last, false);
    }
    return html;
  }

  /* ---------------- View: Bøder ---------------- */

  function finesTable(fines, withFilters) {
    if (!fines.length) return emptyBox('Ingen bøder', 'Ingen bøder matcher det valgte.');
    return '<div class="table-wrap"><table><thead><tr>' +
      '<th>Dato</th><th>Medlem</th><th>Bøde</th><th class="num">Beløb</th><th>Status</th><th class="actions">Handling</th>' +
      '</tr></thead><tbody>' +
      fines.map(function (f) {
        var m = byId(db.members, f.memberId);
        return '<tr>' +
          '<td class="mono">' + esc(fmtDate(f.date)) + '</td>' +
          '<td><span class="name-cell"><span class="chip-initials">' + esc(initials(m ? m.name : '?')) + '</span>' + esc(m ? m.name : 'Slettet medlem') + '</span></td>' +
          '<td>' + esc(f.label) + (f.note ? '<br><span class="hint">' + esc(f.note) + '</span>' : '') + '</td>' +
          '<td class="num">' + esc(money(f.amount)) + '</td>' +
          '<td>' + (f.paid
            ? '<span class="tag paid">Betalt ' + esc(fmtDate(f.paidDate)) + '</span>'
            : '<span class="tag unpaid">Skylder</span>') + '</td>' +
          '<td class="actions">' +
          '<button class="btn btn-xs" data-action="toggle-paid" data-id="' + esc(f.id) + '" type="button">' + (f.paid ? 'Fortryd' : 'Marker betalt') + '</button>' +
          '<button class="btn btn-xs" data-action="edit-fine" data-id="' + esc(f.id) + '" type="button">Ret</button>' +
          '<button class="btn btn-xs btn-danger" data-action="del-fine" data-id="' + esc(f.id) + '" type="button">Slet</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function filteredFines() {
    var f = ui.filters;
    var q = f.q.trim().toLowerCase();
    return sortBy(periodFines().filter(function (x) {
      if (f.memberId && x.memberId !== f.memberId) return false;
      if (f.typeId && x.typeId !== f.typeId) return false;
      if (f.status === 'paid' && !x.paid) return false;
      if (f.status === 'due' && x.paid) return false;
      if (q) {
        var m = byId(db.members, x.memberId);
        var hay = (x.label + ' ' + x.note + ' ' + (m ? m.name : '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }), function (x) { return x.date + x.id; }, true);
  }

  function viewFines() {
    var list = filteredFines();
    var t = totals(list);
    var html = '<div class="page-head"><div><h1>Bøder</h1><p>' + list.length + ' bøder — ' +
      esc(money(t.total)) + ' i alt, heraf ' + esc(money(t.due)) + ' udestående.</p></div>' +
      '<div class="spacer">' +
      '<button class="btn btn-sm" data-action="export-csv" type="button">Eksportér CSV</button>' +
      '<button class="btn btn-accent btn-sm" data-action="nav" data-view="new" type="button">+ Ny bøde</button>' +
      '</div></div>';

    html += '<div class="filters">' +
      '<input type="search" data-filter="q" placeholder="Søg medlem, bøde eller note" value="' + esc(ui.filters.q) + '">' +
      '<select data-filter="memberId"><option value="">Alle medlemmer</option>' +
      db.members.map(function (m) {
        return '<option value="' + esc(m.id) + '"' + (ui.filters.memberId === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>';
      }).join('') + '</select>' +
      '<select data-filter="typeId"><option value="">Alle bødetyper</option>' +
      db.types.map(function (t2) {
        return '<option value="' + esc(t2.id) + '"' + (ui.filters.typeId === t2.id ? ' selected' : '') + '>' + esc(t2.name) + '</option>';
      }).join('') + '</select>' +
      '<select data-filter="status"><option value="">Alle statusser</option>' +
      '<option value="due"' + (ui.filters.status === 'due' ? ' selected' : '') + '>Kun ubetalte</option>' +
      '<option value="paid"' + (ui.filters.status === 'paid' ? ' selected' : '') + '>Kun betalte</option></select>' +
      '</div>';

    html += finesTable(list, true);

    if (list.length) {
      html += '<div class="form-actions">' +
        '<button class="btn btn-sm" data-action="mark-filtered-paid" type="button">Marker alle viste som betalt</button>' +
        '</div>';
    }
    return html;
  }

  /* ---------------- View: Medlemmer ---------------- */

  function viewMembers() {
    var fines = periodFines();
    var rows = sortBy(memberStats(fines), function (r) { return r.total; }, true);

    var html = '<div class="page-head"><div><h1>Medlemmer</h1><p>' +
      db.members.filter(function (m) { return m.active; }).length + ' aktive af ' + db.members.length + ' — tal for ' + esc(periodLabel()) + '.</p></div>' +
      '<div class="spacer"><button class="btn btn-accent btn-sm" data-action="add-member" type="button">+ Tilføj medlem</button></div></div>';

    html += '<form data-form="quick-member" class="card"><div class="form-row">' +
      '<label class="field">Navn<input type="text" name="name" placeholder="Fx: Jonas Bruun" required></label>' +
      '<label class="field">Rolle (valgfri)<input type="text" name="role" placeholder="Fx: Præsident"></label>' +
      '<label class="field">Medlem siden (valgfri)<input type="date" name="joined"></label>' +
      '</div><div class="form-actions"><button class="btn btn-accent" type="submit">Tilføj medlem</button>' +
      '<span class="hint">Genvej: tilføj hurtigt flere medlemmer efter hinanden.</span></div></form>';

    if (!db.members.length) {
      return html + emptyBox('Ingen medlemmer endnu', 'Brug formularen ovenfor til at tilføje klubbens medlemmer.');
    }

    html += '<h2 class="section-title">Klubben</h2><div class="table-wrap"><table><thead><tr>' +
      '<th>Medlem</th><th>Rolle</th><th class="num">Bøder</th><th class="num">I alt</th><th class="num">Udestående</th><th>Status</th><th class="actions">Handling</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        var m = r.member;
        return '<tr>' +
          '<td><span class="name-cell"><span class="chip-initials">' + esc(initials(m.name)) + '</span><span>' + esc(m.name) +
          (m.joined ? '<br><span class="hint">medlem siden ' + esc(fmtDate(m.joined)) + '</span>' : '') + '</span></span></td>' +
          '<td class="muted">' + esc(m.role || '—') + '</td>' +
          '<td class="num">' + r.count + '</td>' +
          '<td class="num">' + esc(money(r.total)) + '</td>' +
          '<td class="num">' + (r.due > 0 ? '<span class="tag unpaid">' + esc(money(r.due)) + '</span>' : '<span class="muted">0</span>') + '</td>' +
          '<td>' + (m.active ? '<span class="tag paid">Aktiv</span>' : '<span class="tag off">Passiv</span>') + '</td>' +
          '<td class="actions">' +
          (r.due > 0 ? '<button class="btn btn-xs" data-action="settle-member" data-id="' + esc(m.id) + '" type="button">Afregn</button>' : '') +
          '<button class="btn btn-xs" data-action="edit-member" data-id="' + esc(m.id) + '" type="button">Ret</button>' +
          '<button class="btn btn-xs btn-danger" data-action="del-member" data-id="' + esc(m.id) + '" type="button">Slet</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return html;
  }

  /* ---------------- View: Bødetyper ---------------- */

  function viewTypes() {
    var fines = periodFines();
    var used = {};
    fines.forEach(function (f) {
      if (!f.typeId) return;
      if (!used[f.typeId]) used[f.typeId] = { count: 0, total: 0 };
      used[f.typeId].count++;
      used[f.typeId].total += f.amount;
    });

    var html = '<div class="page-head"><div><h1>Bødetyper</h1>' +
      '<p>Klubbens takstblad. Beløbet foreslås automatisk, når du opretter en bøde — og kan altid rettes.</p></div></div>';

    html += '<form data-form="quick-type" class="card"><div class="form-row">' +
      '<label class="field">Bødetype<input type="text" name="name" placeholder="Fx: Glemt sangbog" required></label>' +
      '<label class="field">Beløb (' + esc(db.settings.currency) + ')<input type="number" name="amount" min="0" step="1" value="20" required></label>' +
      '</div><div class="form-actions"><button class="btn btn-accent" type="submit">Tilføj bødetype</button></div></form>';

    html += '<div class="table-wrap" style="margin-top:14px"><table><thead><tr>' +
      '<th>Bødetype</th><th class="num">Takst</th><th class="num">Brugt</th><th class="num">Indbragt</th><th>Status</th><th class="actions">Handling</th>' +
      '</tr></thead><tbody>' +
      sortBy(db.types, function (t) { return (used[t.id] ? used[t.id].total : 0); }, true).map(function (t) {
        var u = used[t.id] || { count: 0, total: 0 };
        return '<tr>' +
          '<td>' + esc(t.name) + '</td>' +
          '<td class="num">' + esc(money(t.amount)) + '</td>' +
          '<td class="num">' + u.count + '</td>' +
          '<td class="num">' + esc(money(u.total)) + '</td>' +
          '<td>' + (t.active ? '<span class="tag paid">Aktiv</span>' : '<span class="tag off">Skjult</span>') + '</td>' +
          '<td class="actions">' +
          '<button class="btn btn-xs" data-action="toggle-type" data-id="' + esc(t.id) + '" type="button">' + (t.active ? 'Skjul' : 'Aktivér') + '</button>' +
          '<button class="btn btn-xs" data-action="edit-type" data-id="' + esc(t.id) + '" type="button">Ret</button>' +
          '<button class="btn btn-xs btn-danger" data-action="del-type" data-id="' + esc(t.id) + '" type="button">Slet</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';

    html += '<p class="hint" style="margin-top:12px">Sletter du en bødetype, bliver allerede oprettede bøder stående — de husker selv navn og beløb.</p>';
    return html;
  }

  /* ---------------- View: Statistik ---------------- */

  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  function monthlyRows(fines) {
    var map = {};
    fines.forEach(function (f) {
      var k = String(f.date).slice(0, 7);
      if (!map[k]) map[k] = 0;
      map[k] += f.amount;
    });
    var keys = Object.keys(map).sort().slice(-12);
    return keys.map(function (k) {
      var m = parseInt(k.slice(5, 7), 10) - 1;
      return {
        label: (MONTHS[m] || '?') + ' ' + k.slice(2, 4),
        value: map[k],
        short: num(map[k]),
        display: money(map[k])
      };
    });
  }

  function viewStats() {
    var fines = periodFines();
    var t = totals(fines);

    var html = '<div class="page-head"><div><h1>Statistik</h1><p>Tal for ' + esc(periodLabel()) + '.</p></div>' +
      '<div class="spacer"><button class="btn btn-sm" data-action="export-csv" type="button">Eksportér CSV</button>' +
      '<button class="btn btn-sm" data-action="print" type="button">Print</button></div></div>';

    if (!fines.length) {
      return html + emptyBox('Ingen data i perioden', 'Opret bøder, så tegner statistikken sig selv.',
        '<button class="btn btn-accent" data-action="nav" data-view="new" type="button">Opret bøde</button>');
    }

    var ms = memberStats(fines).filter(function (r) { return r.count > 0; });
    var ts = typeStats(fines);
    var active = db.members.filter(function (m) { return m.active; });
    var clean = active.filter(function (m) {
      return !ms.some(function (r) { return r.member.id === m.id; });
    });
    var priciest = sortBy(fines, function (f) { return f.amount; }, true)[0];
    var mostCount = sortBy(ms, function (r) { return r.count; }, true)[0];
    var topType = sortBy(ts, function (r) { return r.total; }, true)[0];
    var months = monthlyRows(fines);
    var peak = sortBy(months.slice(), function (r) { return r.value; }, true)[0];
    var priciestMember = priciest ? byId(db.members, priciest.memberId) : null;

    html += '<div class="grid grid-kpi">' +
      kpi('Samlet bødesum', money(t.total), t.count + ' bøder') +
      kpi('Gennemsnitlig bøde', money(t.count ? t.total / t.count : 0), 'pr. registrering') +
      kpi('Bøder pr. medlem', num(active.length ? Math.round((t.count / active.length) * 10) / 10 : 0), 'i gennemsnit blandt aktive') +
      kpi('Betalingsgrad', (t.total ? Math.round((t.paid / t.total) * 100) : 0) + ' %', money(t.due) + ' udestående', t.due > 0 ? 'warn' : 'accent') +
      '</div>';

    html += '<div class="grid grid-2" style="margin-top:14px">' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Bødesum pr. medlem</h2>' +
      barChart(sortBy(ms, function (r) { return r.total; }, true).map(function (r) {
        return { label: r.member.name, value: r.total, display: money(r.total) };
      })) + '</div>' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Antal bøder pr. medlem</h2>' +
      barChart(sortBy(ms, function (r) { return r.count; }, true).map(function (r) {
        return { label: r.member.name, value: r.count, display: num(r.count) + ' stk.' };
      }), { tone: 'dim' }) + '</div>' +
      '</div>';

    html += '<div class="grid grid-2" style="margin-top:14px">' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Hvad bliver der bødet for?</h2>' +
      barChart(sortBy(ts, function (r) { return r.total; }, true).slice(0, 10).map(function (r) {
        return { label: r.name, value: r.total, display: money(r.total) + ' · ' + r.count + ' stk.' };
      })) + '</div>' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Udvikling pr. måned</h2>' +
      columnChart(months) + '</div>' +
      '</div>';

    html += '<div class="grid grid-2" style="margin-top:14px">' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Betalingsstatus</h2>' + donut(t.paid, t.due) + '</div>' +
      '<div class="card"><h2 class="section-title" style="margin-top:0">Kuriosa</h2><div class="stack">' +
      '<div><span class="kpi-label">Dyreste enkeltbøde</span><div>' +
      (priciest ? esc(money(priciest.amount)) + ' — ' + esc(priciest.label) + ' <span class="muted">(' + esc(priciestMember ? priciestMember.name : 'ukendt') + ')</span>' : '—') + '</div></div>' +
      '<div><span class="kpi-label">Flest bøder</span><div>' +
      (mostCount ? esc(mostCount.member.name) + ' med ' + mostCount.count + ' bøder' : '—') + '</div></div>' +
      '<div><span class="kpi-label">Mest indbringende bødetype</span><div>' +
      (topType ? esc(topType.name) + ' — ' + esc(money(topType.total)) : '—') + '</div></div>' +
      '<div><span class="kpi-label">Dyreste måned</span><div>' +
      (peak ? esc(peak.label) + ' — ' + esc(peak.display) : '—') + '</div></div>' +
      '<div><span class="kpi-label">Uden en eneste bøde</span><div>' +
      (clean.length ? esc(clean.map(function (m) { return m.name; }).join(', ')) : '<span class="muted">Ingen slipper — alle aktive har fået mindst én.</span>') + '</div></div>' +
      '</div></div></div>';

    html += '<h2 class="section-title">Fuld oversigt pr. medlem</h2><div class="table-wrap"><table><thead><tr>' +
      '<th class="num">#</th><th>Medlem</th><th class="num">Bøder</th><th class="num">I alt</th><th class="num">Betalt</th><th class="num">Udestående</th><th class="num">Gns.</th><th>Seneste</th>' +
      '</tr></thead><tbody>' +
      sortBy(ms, function (r) { return r.total; }, true).map(function (r, i) {
        return '<tr><td class="num">' + (i + 1) + '</td>' +
          '<td>' + esc(r.member.name) + '</td>' +
          '<td class="num">' + r.count + '</td>' +
          '<td class="num">' + esc(money(r.total)) + '</td>' +
          '<td class="num">' + esc(money(r.paid)) + '</td>' +
          '<td class="num">' + esc(money(r.due)) + '</td>' +
          '<td class="num">' + esc(money(r.count ? r.total / r.count : 0)) + '</td>' +
          '<td class="mono">' + esc(fmtDate(r.last)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return html;
  }

  /* ---------------- View: Indstillinger ---------------- */

  function viewSettings() {
    var t = totals(db.fines);
    var html = '<div class="page-head"><div><h1>Indstillinger</h1>' +
      '<p>Klubbens navn, valuta og sikkerhedskopier.</p></div></div>';

    html += '<form data-form="settings" class="card"><h2 class="section-title" style="margin-top:0">Klubben</h2>' +
      '<div class="form-row">' +
      '<label class="field">Klubnavn<input type="text" name="clubName" value="' + esc(db.settings.clubName) + '" required></label>' +
      '<label class="field">Valuta<input type="text" name="currency" value="' + esc(db.settings.currency) + '" maxlength="5" required></label>' +
      '</div><div class="form-actions"><button class="btn btn-accent" type="submit">Gem</button></div></form>';

    html += '<div class="card" style="margin-top:14px"><h2 class="section-title" style="margin-top:0">Data</h2>' +
      '<p class="hint">Appen gemmer alt lokalt i denne browser. Tag en sikkerhedskopi, hvis flere skal bruge de samme tal — eller hvis du rydder din browser.</p>' +
      '<div class="form-actions">' +
      '<button class="btn" data-action="export-json" type="button">Download sikkerhedskopi (JSON)</button>' +
      '<button class="btn" data-action="export-csv" type="button">Eksportér bøder (CSV)</button>' +
      '<label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Indlæs sikkerhedskopi' +
      '<input type="file" id="importFile" accept="application/json,.json" style="display:none"></label>' +
      '</div>' +
      '<p class="hint" style="margin-top:10px">I appen ligger nu ' + db.members.length + ' medlemmer, ' + db.types.length +
      ' bødetyper og ' + db.fines.length + ' bøder til en samlet værdi af ' + esc(money(t.total)) + '.</p></div>';

    html += '<div class="card" style="margin-top:14px"><h2 class="section-title" style="margin-top:0">Nulstil</h2>' +
      '<div class="form-actions">' +
      '<button class="btn" data-action="demo" type="button">Indlæs demo-data</button>' +
      '<button class="btn btn-danger" data-action="reset-fines" type="button">Slet alle bøder</button>' +
      '<button class="btn btn-danger" data-action="reset-all" type="button">Slet alt</button>' +
      '</div><p class="hint" style="margin-top:10px">Demo-data lægger et par medlemmer og bøder ind, så du kan se hvordan statistikken ser ud. Det erstatter det, der ligger nu.</p></div>';

    return html;
  }

  /* ---------------- Modaler ---------------- */

  function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modal').hidden = false;
    var first = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea');
    if (first) first.focus();
  }

  function closeModal() {
    document.getElementById('modal').hidden = true;
    document.getElementById('modalBody').innerHTML = '';
  }

  function modalActions(saveLabel) {
    return '<div class="form-actions"><button class="btn btn-accent" type="submit">' + esc(saveLabel || 'Gem') + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="close-modal">Annullér</button></div>';
  }

  function editMemberModal(m) {
    openModal('Ret medlem', '<form data-form="edit-member">' +
      '<input type="hidden" name="id" value="' + esc(m.id) + '">' +
      '<div class="form-row"><label class="field">Navn<input type="text" name="name" value="' + esc(m.name) + '" required></label></div>' +
      '<div class="form-row"><label class="field">Rolle<input type="text" name="role" value="' + esc(m.role) + '"></label>' +
      '<label class="field">Medlem siden<input type="date" name="joined" value="' + esc(m.joined) + '"></label></div>' +
      '<div class="form-row"><label class="field">Status<select name="active">' +
      '<option value="1"' + (m.active ? ' selected' : '') + '>Aktiv</option>' +
      '<option value="0"' + (!m.active ? ' selected' : '') + '>Passiv</option></select></label></div>' +
      modalActions() + '</form>');
  }

  function editTypeModal(t) {
    openModal('Ret bødetype', '<form data-form="edit-type">' +
      '<input type="hidden" name="id" value="' + esc(t.id) + '">' +
      '<div class="form-row"><label class="field">Navn<input type="text" name="name" value="' + esc(t.name) + '" required></label></div>' +
      '<div class="form-row"><label class="field">Takst (' + esc(db.settings.currency) + ')<input type="number" name="amount" min="0" step="1" value="' + esc(t.amount) + '" required></label></div>' +
      modalActions() + '</form>');
  }

  function editFineModal(f) {
    openModal('Ret bøde', '<form data-form="edit-fine">' +
      '<input type="hidden" name="id" value="' + esc(f.id) + '">' +
      '<div class="form-row"><label class="field">Medlem<select name="memberId" required>' +
      db.members.map(function (m) {
        return '<option value="' + esc(m.id) + '"' + (m.id === f.memberId ? ' selected' : '') + '>' + esc(m.name) + '</option>';
      }).join('') + '</select></label></div>' +
      '<div class="form-row"><label class="field">Bøde<input type="text" name="label" value="' + esc(f.label) + '" required></label></div>' +
      '<div class="form-row"><label class="field">Beløb<input type="number" name="amount" min="0" step="1" value="' + esc(f.amount) + '" required></label>' +
      '<label class="field">Dato<input type="date" name="date" value="' + esc(f.date) + '" required></label></div>' +
      '<div class="form-row"><label class="field">Note<textarea name="note">' + esc(f.note) + '</textarea></label></div>' +
      '<div class="form-row"><label class="field">Status<select name="paid">' +
      '<option value="0"' + (!f.paid ? ' selected' : '') + '>Ikke betalt</option>' +
      '<option value="1"' + (f.paid ? ' selected' : '') + '>Betalt</option></select></label></div>' +
      modalActions() + '</form>');
  }

  /* ---------------- Handlinger ---------------- */

  function addFinesFromDraft() {
    var d = ui.draft;
    var type = d.typeId ? byId(db.types, d.typeId) : null;
    var label = type ? type.name : String(d.label || '').trim();
    var amount = Math.round(Number(d.amount) || 0);

    if (!d.memberIds.length) { toast('Vælg mindst ét medlem.', true); return; }
    if (!label) { toast('Skriv hvad bøden er for.', true); return; }
    if (!(amount > 0)) { toast('Beløbet skal være større end 0.', true); return; }

    d.memberIds.forEach(function (mid) {
      db.fines.push({
        id: uid(),
        memberId: mid,
        typeId: d.typeId || '',
        label: label,
        amount: amount,
        date: d.date || todayISO(),
        note: String(d.note || '').trim(),
        paid: false,
        paidDate: ''
      });
    });

    var n = d.memberIds.length;
    toast(n === 1 ? 'Bøde registreret — ' + money(amount) + '.' : n + ' bøder registreret — ' + money(n * amount) + ' i alt.');
    ui.draft.memberIds = [];
    ui.draft.note = '';
    save();
  }

  function settleMember(id) {
    var n = 0;
    db.fines.forEach(function (f) {
      if (f.memberId === id && !f.paid && inPeriod(f)) {
        f.paid = true;
        f.paidDate = todayISO();
        n++;
      }
    });
    var m = byId(db.members, id);
    toast(n ? (m ? m.name : 'Medlem') + ': ' + n + ' bøder markeret som betalt.' : 'Ingen ubetalte bøder.');
    save();
  }

  /* Kører appen inde i en Claude-artifact, går downloads gennem værtens
     gemme-dialog; ellers bruges et almindeligt download-link. */
  var hostDownloads = null;
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      window.claude.use('downloads').then(function (d) { hostDownloads = d; }, function () { hostDownloads = null; });
    } catch (e) { hostDownloads = null; }
  }

  function download(filename, content, mime, okMsg) {
    if (hostDownloads) {
      hostDownloads.save({ filename: filename, data: content }).then(function () {
        toast(okMsg);
      }, function (err) {
        if (err && err.code === 'declined') { toast('Download afbrudt.'); return; }
        toast('Filen kunne ikke gemmes — prøv igen.', true);
      });
      return;
    }
    var blob = new Blob([content], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(okMsg);
  }

  function exportJSON() {
    download('boedekasse-' + todayISO() + '.json', JSON.stringify(db, null, 2), 'application/json',
      'Sikkerhedskopi gemt.');
  }

  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    var rows = [['Dato', 'Medlem', 'Bøde', 'Beløb', 'Status', 'Betalt dato', 'Note']];
    sortBy(periodFines(), function (f) { return f.date + f.id; }).forEach(function (f) {
      var m = byId(db.members, f.memberId);
      rows.push([f.date, m ? m.name : 'Slettet medlem', f.label, f.amount, f.paid ? 'Betalt' : 'Ubetalt', f.paidDate, f.note]);
    });
    var csv = '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n');
    download('boeder-' + (ui.period === 'all' ? 'alle' : ui.period) + '.csv', csv, 'text/csv',
      'CSV gemt — åbner direkte i Excel og Numbers.');
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (e) {
        toast('Filen kunne ikke læses som JSON.', true);
        return;
      }
      if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.fines)) {
        toast('Filen ligner ikke en sikkerhedskopi fra Bødekassen.', true);
        return;
      }
      if (!confirm('Indlæs sikkerhedskopien? Det erstatter alt, der ligger i appen nu (' +
        db.members.length + ' medlemmer og ' + db.fines.length + ' bøder).')) return;
      db = normalize(parsed);
      toast('Sikkerhedskopi indlæst — ' + db.members.length + ' medlemmer og ' + db.fines.length + ' bøder.');
      save();
    };
    reader.onerror = function () { toast('Filen kunne ikke læses.', true); };
    reader.readAsText(file);
  }

  function loadDemo() {
    if (!confirm('Indlæs demo-data? Det erstatter de medlemmer og bøder, der ligger i appen nu.')) return;
    db = demoDb(db.settings);
    toast('Demo-data indlæst.');
    save();
  }

  /* ---------------- Events ---------------- */

  var ACTIONS = {
    'nav': function (el) { ui.view = el.getAttribute('data-view'); render(); },

    'pick-type': function (el) {
      var id = el.getAttribute('data-id');
      ui.draft.typeId = id;
      var t = id ? byId(db.types, id) : null;
      if (t) { ui.draft.amount = t.amount; ui.draft.label = ''; }
      render();
    },

    'pick-member': function (el) {
      var id = el.getAttribute('data-id');
      var i = ui.draft.memberIds.indexOf(id);
      if (i > -1) ui.draft.memberIds.splice(i, 1); else ui.draft.memberIds.push(id);
      render();
    },

    'pick-all-members': function () {
      ui.draft.memberIds = db.members.filter(function (m) { return m.active; }).map(function (m) { return m.id; });
      render();
    },

    'clear-members': function () { ui.draft.memberIds = []; render(); },

    'reset-draft': function () {
      ui.draft = { typeId: null, memberIds: [], amount: '', date: todayISO(), note: '', label: '' };
      render();
    },

    'toggle-paid': function (el) {
      var f = byId(db.fines, el.getAttribute('data-id'));
      if (!f) return;
      f.paid = !f.paid;
      f.paidDate = f.paid ? todayISO() : '';
      save();
    },

    'edit-fine': function (el) {
      var f = byId(db.fines, el.getAttribute('data-id'));
      if (f) editFineModal(f);
    },

    'del-fine': function (el) {
      var f = byId(db.fines, el.getAttribute('data-id'));
      if (!f) return;
      if (!confirm('Slet bøden "' + f.label + '" på ' + money(f.amount) + '?')) return;
      db.fines = db.fines.filter(function (x) { return x.id !== f.id; });
      toast('Bøde slettet.');
      save();
    },

    'mark-filtered-paid': function () {
      var list = filteredFines().filter(function (f) { return !f.paid; });
      if (!list.length) { toast('De viste bøder er allerede betalt.'); return; }
      if (!confirm('Marker ' + list.length + ' bøder som betalt?')) return;
      list.forEach(function (f) { f.paid = true; f.paidDate = todayISO(); });
      toast(list.length + ' bøder markeret som betalt.');
      save();
    },

    'settle-member': function (el) { settleMember(el.getAttribute('data-id')); },

    'add-member': function () {
      openModal('Tilføj medlem', '<form data-form="quick-member">' +
        '<div class="form-row"><label class="field">Navn<input type="text" name="name" required></label></div>' +
        '<div class="form-row"><label class="field">Rolle<input type="text" name="role"></label>' +
        '<label class="field">Medlem siden<input type="date" name="joined"></label></div>' +
        modalActions('Tilføj') + '</form>');
    },

    'edit-member': function (el) {
      var m = byId(db.members, el.getAttribute('data-id'));
      if (m) editMemberModal(m);
    },

    'del-member': function (el) {
      var m = byId(db.members, el.getAttribute('data-id'));
      if (!m) return;
      var n = db.fines.filter(function (f) { return f.memberId === m.id; }).length;
      if (!confirm('Slet ' + m.name + '?' + (n ? ' Medlemmets ' + n + ' bøder slettes også.' : ''))) return;
      db.members = db.members.filter(function (x) { return x.id !== m.id; });
      db.fines = db.fines.filter(function (f) { return f.memberId !== m.id; });
      toast(m.name + ' er slettet.');
      save();
    },

    'edit-type': function (el) {
      var t = byId(db.types, el.getAttribute('data-id'));
      if (t) editTypeModal(t);
    },

    'toggle-type': function (el) {
      var t = byId(db.types, el.getAttribute('data-id'));
      if (!t) return;
      t.active = !t.active;
      save();
    },

    'del-type': function (el) {
      var t = byId(db.types, el.getAttribute('data-id'));
      if (!t) return;
      if (!confirm('Slet bødetypen "' + t.name + '"? Allerede oprettede bøder bevares.')) return;
      db.types = db.types.filter(function (x) { return x.id !== t.id; });
      if (ui.draft.typeId === t.id) ui.draft.typeId = '';
      toast('Bødetype slettet.');
      save();
    },

    'demo-clear': function () {
      if (!confirm('Tøm appen helt? Demo-medlemmer og demo-bøder slettes, og du starter med et blankt takstblad plus klubbens standardtakster.')) return;
      db = blank();
      ui.view = 'members';
      toast('Appen er tom — start med at tilføje klubbens medlemmer.');
      save();
    },

    'demo-keep': function () {
      db.demo = false;
      toast('Demo-data beholdt — du kan altid tømme appen under Indstillinger.');
      save();
    },

    'export-json': exportJSON,
    'export-csv': exportCSV,
    'demo': loadDemo,
    'print': function () { window.print(); },

    'reset-fines': function () {
      if (!confirm('Slet alle ' + db.fines.length + ' bøder? Medlemmer og bødetyper bevares.')) return;
      db.fines = [];
      toast('Alle bøder er slettet.');
      save();
    },

    'reset-all': function () {
      if (!confirm('Slet alt — medlemmer, bødetyper og bøder?')) return;
      if (!confirm('Sidste chance. Har du taget en sikkerhedskopi?')) return;
      db = blank();
      toast('Appen er nulstillet.');
      save();
    },

    'close-modal': closeModal
  };

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var closeEl = e.target.closest('[data-close]');
    if (closeEl) { closeModal(); return; }
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var fn = ACTIONS[el.getAttribute('data-action')];
    if (!fn) return;
    e.preventDefault();
    fn(el);
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form');
    var fd = new FormData(form);

    if (kind === 'new-fine') {
      addFinesFromDraft();
      return;
    }

    if (kind === 'quick-member') {
      var name = String(fd.get('name') || '').trim();
      if (!name) return;
      db.members.push({
        id: uid(), name: name,
        role: String(fd.get('role') || '').trim(),
        joined: String(fd.get('joined') || ''),
        active: true
      });
      closeModal();
      toast(name + ' er tilføjet.');
      save();
      return;
    }

    if (kind === 'edit-member') {
      var m = byId(db.members, String(fd.get('id')));
      if (m) {
        m.name = String(fd.get('name') || '').trim() || m.name;
        m.role = String(fd.get('role') || '').trim();
        m.joined = String(fd.get('joined') || '');
        m.active = fd.get('active') === '1';
      }
      closeModal();
      toast('Medlem opdateret.');
      save();
      return;
    }

    if (kind === 'quick-type') {
      var tn = String(fd.get('name') || '').trim();
      if (!tn) return;
      db.types.push({ id: uid(), name: tn, amount: Math.round(Number(fd.get('amount')) || 0), active: true });
      form.reset();
      toast('Bødetype tilføjet.');
      save();
      return;
    }

    if (kind === 'edit-type') {
      var t = byId(db.types, String(fd.get('id')));
      if (t) {
        t.name = String(fd.get('name') || '').trim() || t.name;
        t.amount = Math.round(Number(fd.get('amount')) || 0);
      }
      closeModal();
      toast('Bødetype opdateret.');
      save();
      return;
    }

    if (kind === 'edit-fine') {
      var f = byId(db.fines, String(fd.get('id')));
      if (f) {
        f.memberId = String(fd.get('memberId') || f.memberId);
        f.label = String(fd.get('label') || '').trim() || f.label;
        f.amount = Math.round(Number(fd.get('amount')) || 0);
        f.date = String(fd.get('date') || f.date);
        f.note = String(fd.get('note') || '').trim();
        var paid = fd.get('paid') === '1';
        if (paid && !f.paid) f.paidDate = todayISO();
        if (!paid) f.paidDate = '';
        f.paid = paid;
      }
      closeModal();
      toast('Bøde opdateret.');
      save();
      return;
    }

    if (kind === 'settings') {
      db.settings.clubName = String(fd.get('clubName') || '').trim() || 'Bødekassen';
      db.settings.currency = String(fd.get('currency') || '').trim() || 'kr';
      toast('Indstillinger gemt.');
      save();
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    var draftKey = el.getAttribute && el.getAttribute('data-draft');
    if (draftKey) { ui.draft[draftKey] = el.value; return; }
    var filterKey = el.getAttribute && el.getAttribute('data-filter');
    if (filterKey && el.tagName === 'INPUT') {
      ui.filters[filterKey] = el.value;
      ui.refocus = filterKey;
      render();
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'periodSelect') { ui.period = el.value; render(); return; }
    if (el.id === 'importFile' && el.files && el.files[0]) { importJSON(el.files[0]); return; }
    var filterKey = el.getAttribute && el.getAttribute('data-filter');
    if (filterKey && el.tagName === 'SELECT') {
      ui.filters[filterKey] = el.value;
      render();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !document.getElementById('modal').hidden) closeModal();
  });

  /* ---------------- Render ---------------- */

  var VIEWS = {
    dashboard: viewDashboard,
    'new': viewNew,
    fines: viewFines,
    members: viewMembers,
    types: viewTypes,
    stats: viewStats,
    settings: viewSettings
  };

  function renderPeriod() {
    var sel = document.getElementById('periodSelect');
    var ys = years();
    if (ui.period !== 'all' && ys.indexOf(ui.period) === -1) ui.period = 'all';
    sel.innerHTML = '<option value="all">Alle</option>' + ys.map(function (y) {
      return '<option value="' + y + '">' + y + '</option>';
    }).join('');
    sel.value = ui.period;
  }

  function render() {
    document.getElementById('clubName').textContent = db.settings.clubName;
    document.title = db.settings.clubName;

    var tabs = document.querySelectorAll('#tabs .tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('is-active', tabs[i].getAttribute('data-view') === ui.view);
    }
    renderPeriod();

    var fn = VIEWS[ui.view] || viewDashboard;
    document.getElementById('view').innerHTML = demoBanner() + fn();

    if (ui.refocus) {
      var el = document.querySelector('[data-filter="' + ui.refocus + '"]');
      if (el) {
        el.focus();
        if (el.setSelectionRange && el.type === 'search') {
          try { el.setSelectionRange(el.value.length, el.value.length); } catch (err) { /* ingen handling */ }
        }
      }
      ui.refocus = null;
    }
  }

  document.getElementById('tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (!tab) return;
    ui.view = tab.getAttribute('data-view');
    render();
  });

  document.getElementById('quickAddBtn').addEventListener('click', function () {
    ui.view = 'new';
    render();
  });

  render();
})();
