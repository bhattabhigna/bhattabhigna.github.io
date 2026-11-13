/* Interactive explorer: longitudinal waves in a bar with periodic resonators.
   Unit cell of length a: uniform bar (E, A, rho) with a resonator (m, k)
   attached at the cell centre. Lengths in units of a, frequency as
   eta = w / w_B with w_B = pi c / a, c = sqrt(E / rho).
   Dispersion: cos(qa) = F(W) = cos W - (mu / 2) W sin W / (1 - W^2 / Wr^2),
   W = pi eta, Wr = pi eta_r, eta_r = sqrt(k / m) / w_B, mu = m / (rho A a).
   The stiffness slider runs from k = 0 to k -> infinity, with m fixed.
   Finite structure: N cells between two semi-infinite bare bars. */
(function () {
  var root = document.getElementById('bar-explorer');
  if (!root) return;
  var NS = 'http://www.w3.org/2000/svg', PI = Math.PI;
  var MU = 0.25, N = 10, WMAX = 2.6, WTOP = 2.5, WMIN = 0.02, QMAX = 2.5, BMAX = 2.5;
  function el(name, attrs, parent, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- Physics ---------- */
  var S = 0.5, ETAR = 1, KINF = false;               /* slider position, eta_r, rigid limit */
  function setStiff(s) {
    S = Math.max(0, Math.min(1, s));
    KINF = S >= 0.999;
    ETAR = KINF ? Infinity : S / (1 - S);
  }
  /* Effective-mass factor m_eff / m = 1 / (1 - eta^2 / eta_r^2) */
  function meff(eta) {
    if (KINF) return 1;
    if (ETAR === 0) return 0;
    return 1 / (1 - eta * eta / (ETAR * ETAR));
  }
  function Fd(eta) { var W = PI * eta; return Math.cos(W) - 0.5 * MU * W * Math.sin(W) * meff(eta); }
  function dF(eta) {
    /* dF/dW */
    var W = PI * eta, g = meff(eta), gp = 0;
    if (!KINF && ETAR > 0) { var Wr = PI * ETAR; gp = 2 * W / (Wr * Wr) * g * g; }
    return -Math.sin(W) - 0.5 * MU * ((Math.sin(W) + W * Math.cos(W)) * g + W * Math.sin(W) * gp);
  }
  function bloch(eta) {
    var f = Fd(eta);
    if (Math.abs(f) <= 1) return { prop: true, a: Math.acos(f), decay: 0 };
    return { prop: false, a: f < 0 ? PI : 0, decay: Math.acosh(Math.abs(f)) };
  }

  /* Band structure on a grid: gaps, pass bands, extended-zone wavenumber and velocities */
  var DE = 0.002, GRID = [], BANDS = [], GAPS = [];
  function build() {
    GRID = []; BANDS = []; GAPS = [];
    var i, n = Math.round(WMAX / DE), cur = null, gs = null;
    for (i = 0; i < n; i++) {
      var eta = (i + 0.5) * DE, b = bloch(eta);
      b.eta = eta;
      GRID.push(b);
      /* Pass bands also end at eta = 1, 2, ..., where |F| = 1 for every k */
      var split = cur && Math.floor(eta) !== Math.floor(GRID[cur.i1].eta);
      if (b.prop) {
        if (gs !== null) { GAPS.push([gs, eta]); gs = null; }
        if (!cur || split) { cur = { i0: i, i1: i }; BANDS.push(cur); }
        cur.i1 = i;
      } else {
        if (gs === null) gs = cur ? GRID[cur.i1].eta : 0;
        cur = null;
      }
    }
    if (gs !== null) GAPS.push([gs, WMAX]);
    BANDS.forEach(function (bd) {
      var a0 = GRID[bd.i0].a, a1 = GRID[bd.i1].a, mid = GRID[Math.round((bd.i0 + bd.i1) / 2)];
      bd.s = a1 >= a0 ? 1 : -1;
      bd.lo = GRID[bd.i0].eta - DE / 2; bd.hi = GRID[bd.i1].eta + DE / 2;
      /* Branch s*alpha + 2 pi m closest to the bare-bar wavenumber at the band centre */
      var best = 1e9;
      for (var m = 0; m <= 3; m++) {
        var q = bd.s * mid.a + 2 * PI * m;
        if (q < 0) continue;
        var d = Math.abs(q - PI * mid.eta);
        if (d < best) { best = d; bd.m = m; }
      }
      for (var j = bd.i0; j <= bd.i1; j++) {
        var g = GRID[j];
        g.band = bd;
        g.q = bd.s * g.a + 2 * PI * bd.m;
        g.cp = PI * g.eta / g.q;
        g.cg = Math.abs(-Math.sin(g.a) / dF(g.eta));
      }
    });
    /* Classify each gap: LR if it holds eta_r, Bragg n if eta = n is an edge or inside it */
    GAPS = GAPS.map(function (g) {
      var lr = !KINF && ETAR > g[0] && ETAR < g[1], n = 0, t = 0.003;
      for (var k = 1; k <= 3; k++) if (g[0] <= k + t && g[1] >= k - t) n = k;
      if (!n && !lr && g[1] >= WMAX) n = Math.ceil(g[0]);
      return { lo: g[0], hi: g[1], lr: lr, n: n };
    });
  }
  function bandAt(eta) {
    for (var i = 0; i < BANDS.length; i++) if (eta >= BANDS[i].lo - 1e-9 && eta <= BANDS[i].hi + 1e-9) return BANDS[i];
    return null;
  }
  /* Point values at an arbitrary frequency in a pass band */
  function state(eta) {
    var b = bloch(eta);
    if (!b.prop) return b;
    var bd = bandAt(eta);
    if (!bd) { b.prop = false; b.decay = 0; return b; }
    b.band = bd;
    b.q = bd.s * b.a + 2 * PI * bd.m;
    b.cp = PI * eta / b.q;
    b.cg = Math.abs(-Math.sin(b.a) / dF(eta));
    return b;
  }
  /* Frequency in band bd at which cos(alpha) = c, by bisection */
  function etaOf(bd, c) {
    var lo = bd.lo, hi = bd.hi, flo = Fd(lo) - c;
    for (var it = 0; it < 40; it++) {
      var mid = (lo + hi) / 2, fm = Fd(mid) - c;
      if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ---------- Scattering by N cells between two bare bars ---------- */
  function seg(W, L) { var c = Math.cos(W * L), s = Math.sin(W * L); return [c, s / W, -W * s, c]; }
  function mm(A, B) { return [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]]; }
  function mv(A, v) {
    /* real 2x2 times complex 2-vector [[ur, ui], [nr, ni]] */
    return [[A[0] * v[0][0] + A[1] * v[1][0], A[0] * v[0][1] + A[1] * v[1][1]],
            [A[2] * v[0][0] + A[3] * v[1][0], A[2] * v[0][1] + A[3] * v[1][1]]];
  }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function solve(eta) {
    var W = PI * eta, gam = MU * W * W * meff(eta), H = seg(W, 0.5), J = [1, 0, -gam, 1];
    var C = mm(H, mm(J, H)), M = [1, 0, 0, 1], j;
    for (j = 0; j < N; j++) M = mm(C, M);
    var A = M[0], B = M[1], Cc = M[2], D = M[3];
    var R = cdiv([Cc + W * W * B, -W * (A - D)], [W * W * B - Cc, W * (A + D)]);
    /* State at x = 0: u = 1 + R, N = i W (1 - R) */
    var st = [[1 + R[0], R[1]], [W * R[1], W * (1 - R[0])]];
    var left = [], right = [], res = [];
    for (j = 0; j < N; j++) {
      left.push(st);
      var s1 = mv(H, st);
      res.push(s1[0]);
      var s2 = mv(J, s1);
      right.push(s2);
      st = mv(H, s2);
    }
    return { W: W, R: R, T: st[0], left: left, right: right, res: res };
  }
  window.barExplorerCore = { setStiff: setStiff, build: build, state: state, solve: solve, F: Fd, gaps: function () { return GAPS; }, bands: function () { return BANDS; } };

  /* ---------- Plots ---------- */
  var plot = root.querySelector('.we-plot');
  var PY0 = 316, PY1 = 48, UNIT = (PY0 - PY1) / WMAX, PX = [86, 86 + QMAX * UNIT], AX = [430, 430 + BMAX * UNIT];
  var Y = function (w) { return PY0 + (PY1 - PY0) * w / WMAX; };
  var XQ = function (q) { return PX[0] + UNIT * q / PI; };
  var XB = function (b) { return AX[0] + (AX[1] - AX[0]) * Math.min(b, BMAX) / BMAX; };
  var gapLayer = el('g', {}, plot);
  [PX, AX].forEach(function (x, p) {
    [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (t) {
      el('line', { x1: x[0], x2: x[1], y1: Y(t), y2: Y(t), 'class': 'we-grid' }, plot);
    });
    var gx;
    if (p === 0) for (gx = 0.5; gx < QMAX - 0.01; gx += 0.5) el('line', { x1: XQ(gx * PI), x2: XQ(gx * PI), y1: PY1, y2: PY0, 'class': 'we-grid' }, plot);
    else for (gx = 0.5; gx < BMAX - 0.01; gx += 0.5) el('line', { x1: XB(gx), x2: XB(gx), y1: PY1, y2: PY0, 'class': 'we-grid' }, plot);
    el('path', { d: 'M' + x[0] + ' ' + PY1 + 'V' + PY0 + 'H' + x[1], 'class': 'we-axis' }, plot);
  });
  [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (t) {
    el('text', { x: PX[0] - 10, y: Y(t) + 6, 'text-anchor': 'end', 'class': 'we-tick' }, plot, String(t));
  });
  [0, 1, 2].forEach(function (t) { el('text', { x: XQ(t * PI), y: PY0 + 26, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, String(t)); });
  [['0', 0], ['1', 1], ['2', 2], ['2.5+', 2.5]].forEach(function (t) { el('text', { x: XB(t[1]), y: PY0 + 26, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, t[0]); });
  el('text', { x: (PX[0] + PX[1]) / 2, y: PY0 + 56, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Wavenumber, qa/π');
  el('text', { x: (AX[0] + AX[1]) / 2, y: PY0 + 56, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Attenuation constant, β');
  el('text', { x: PX[0], y: 32, 'class': 'we-head' }, plot, 'Propagation');
  el('text', { x: AX[0], y: 32, 'class': 'we-head' }, plot, 'Attenuation');
  var yl = el('text', { transform: 'translate(20 ' + ((PY0 + PY1) / 2) + ') rotate(-90)', 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Frequency, ω/ω');
  el('tspan', { dy: 5, 'font-size': 13 }, yl, 'B');
  /* Bare bar: q = w / c, and its speed */
  el('line', { x1: XQ(0), y1: Y(0), x2: XQ(QMAX * PI), y2: Y(QMAX), 'class': 'be-light' }, plot);
  var curveLayer = el('g', {}, plot);
  var wrLines = [AX].map(function (x) { return el('line', { x1: x[0], x2: x[1], 'class': 'be-wr' }, plot); });
  var wrLab = el('text', { x: AX[1] + 3, 'class': 'be-wr-lab' }, plot, 'ω');
  el('tspan', { dy: 4, 'font-size': 12 }, wrLab, 'r');

  var secant = el('line', { 'class': 'we-cp' }, plot), tangent = el('line', { 'class': 'we-cg' }, plot);
  var labP = el('text', { 'class': 'we-lab-cp' }, plot, 'c'), labG = el('text', { 'class': 'we-lab-cg' }, plot, 'c');
  el('tspan', { dy: 5, 'font-size': 14 }, labP, 'p'); el('tspan', { dy: 5, 'font-size': 14 }, labG, 'g');
  var fLines = [PX, AX].map(function (x) { return el('line', { x1: x[0], x2: x[1], y1: 0, y2: 0, 'class': 'we-fline' }, plot); });
  var dotP = el('circle', { r: 7, 'class': 'we-dot-prop' }, plot);
  var dotA = el('circle', { r: 7, 'class': 'we-dot-att' }, plot);
  var grip = el('rect', { x: (PX[1] + AX[0]) / 2 - 7, y: 0, width: 14, height: 22, rx: 4, 'class': 'we-grip' }, plot);

  function drawCurves() {
    while (gapLayer.firstChild) gapLayer.removeChild(gapLayer.firstChild);
    while (curveLayer.firstChild) curveLayer.removeChild(curveLayer.firstChild);
    GAPS.forEach(function (g) {
      [PX, AX].forEach(function (x) {
        el('rect', { x: x[0], y: Y(Math.min(g.hi, WMAX)), width: x[1] - x[0], height: Y(g.lo) - Y(Math.min(g.hi, WMAX)), 'class': 'we-gap' + (g.lr ? ' be-gap-lr' : '') }, gapLayer);
      });
      var h = Y(g.lo) - Y(Math.min(g.hi, WMAX));
      /* A Bragg gap has one edge pinned at eta = n (node mode: a node at every resonator).
         Its other edge is the antinode mode, pushed up by m_eff < 0 or down by m_eff > 0. */
      var bragg = g.n && !g.lr && g.hi <= WMAX, above = bragg && Math.abs(g.lo - g.n) < Math.abs(g.hi - g.n);
      if (bragg && h >= 3) {
        edgeLabel(above ? g.lo : g.hi, !above, 'node mode');
        edgeLabel(above ? g.hi : g.lo, above, 'antinode mode');
      }
      /* Merged gap: the node mode is gone; the edges are the Bragg antinode mode and the LR out-of-phase mode */
      if (g.lr && g.n && g.hi <= WMAX) {
        edgeLabel(g.lo, false, 'antinode mode');
        edgeLabel(g.hi, true, 'out-of-phase mode');
      }
      /* A thin gap is labelled only if it is the LR gap: it sits at low frequency, where the right of the panel is empty */
      var thin = h < 15;
      if (thin && bragg) {
        /* A thin Bragg gap sits where the curves cross it in the propagation panel, so label it on the attenuation panel */
        var tb = el('text', { x: AX[0] + 24, y: (Y(g.lo) + Y(g.hi)) / 2 + 5, 'class': 'be-gaplab' }, gapLayer, 'Bragg ' + g.n);
        meffText(tb, above ? ' < 0' : ' > 0');
        return;
      }
      if (thin && !(g.lr && !g.n)) return;
      var lab = el('text', { x: thin ? PX[1] - 8 : PX[0] + 8, y: (Y(g.lo) + Y(Math.min(g.hi, WMAX))) / 2 + 5, 'text-anchor': thin ? 'end' : 'start', 'class': 'be-gaplab' + (g.lr ? ' be-gaplab-lr' : '') }, gapLayer, g.lr && g.n ? 'Merged: LR + Bragg ' + g.n : g.lr ? 'LR gap' : 'Bragg gap ' + g.n);
      if (bragg) meffText(lab, above ? ' < 0' : ' > 0');
      else if (g.lr && !g.n) meffText(lab, ' → ±∞');
    });
    var dq = '', da = '', lastQ = null, lastA = false;
    GRID.forEach(function (g, i) {
      var y = Y(g.eta).toFixed(2);
      if (g.prop) {
        var nb = g.band !== lastQ;
        if (g.q <= QMAX * PI) dq += (nb ? 'M' : 'L') + XQ(g.q).toFixed(2) + ' ' + y;
        lastQ = g.band; lastA = false;
      } else {
        da += (lastA ? 'L' : 'M') + XB(g.decay).toFixed(2) + ' ' + y;
        lastA = true; lastQ = null;
      }
    });
    el('path', { d: dq, 'class': 'we-curve-prop' }, curveLayer);
    el('path', { d: da, 'class': 'we-curve-att' }, curveLayer);
    var show = !KINF && ETAR > 0 && ETAR <= WMAX;
    wrLines.forEach(function (l) { l.style.display = show ? '' : 'none'; if (show) { l.setAttribute('y1', Y(ETAR)); l.setAttribute('y2', Y(ETAR)); } });
    wrLab.style.display = show ? '' : 'none';
    if (show) wrLab.setAttribute('y', Y(ETAR) + 5);
  }
  /* Append ", m_eff <rest>" to a label */
  function meffText(lab, rest) {
    el('tspan', {}, lab, ', m');
    el('tspan', { dy: 4, 'font-size': 11 }, lab, 'eff');
    el('tspan', { dy: -4 }, lab, rest);
  }
  /* Label a band edge on the attenuation panel, outside the gap, if there is room */
  function edgeLabel(eta, up, txt) {
    var room = 15 / UNIT, y = Y(eta);
    if (up ? eta + room > WMAX : eta - room < 0) return;
    for (var i = 0; i < GAPS.length; i++) {
      var o = GAPS[i];
      if (up ? (o.lo > eta + 1e-6 && o.lo < eta + room) : (o.hi < eta - 1e-6 && o.hi > eta - room)) return;
    }
    el('text', { x: AX[1] - 6, y: up ? y - 4 : y + 14, 'text-anchor': 'end', 'class': 'be-edgelab' }, gapLayer, txt);
  }
  function setLine(line, lab, w0, x0, slope, dx, dy) {
    /* Line through (x0, w0) in plot units (qa/pi, eta) with the given slope, clipped to the panel */
    var x1 = 0, x2 = QMAX;
    if (slope > 1e-9) { x1 = Math.max(x1, x0 - w0 / slope); x2 = Math.min(x2, x0 + (WMAX - w0) / slope); }
    var yA = Y(w0 + slope * (x1 - x0)), yB = Y(w0 + slope * (x2 - x0));
    line.setAttribute('x1', XQ(x1 * PI)); line.setAttribute('y1', yA);
    line.setAttribute('x2', XQ(x2 * PI)); line.setAttribute('y2', yB);
    lab.setAttribute('x', Math.min(XQ(x2 * PI) + dx, PX[1] - 14)); lab.setAttribute('y', Math.max(yB + dy, 60));
  }

  /* ---------- Bar animation ---------- */
  var anim = root.querySelector('.we-anim');
  var WIDTH = 720, PITCH = 42, XA = 150, XE = XA + N * PITCH, YM = 98, YR = 206, AU = 17, AV = 17;
  el('rect', { x: XA - 12, y: 46, width: XE - XA + 24, height: 220, rx: 6, 'class': 'we-meta' }, anim);
  el('text', { x: (XA + XE) / 2, y: 30, 'text-anchor': 'middle', 'class': 'we-head' }, anim, 'Bar with resonators');
  el('text', { x: 10, y: 30, 'class': 'we-tick' }, anim, 'Bare bar');
  el('text', { x: WIDTH - 10, y: 30, 'text-anchor': 'end', 'class': 'we-tick' }, anim, 'Bare bar');
  var barL = el('polyline', { 'class': 'we-medium' }, anim), barM = el('polyline', { 'class': 'be-bar' }, anim), barR = el('polyline', { 'class': 'we-medium' }, anim);
  var rsp = [], rmass = [], att = [], i;
  for (i = 0; i < N; i++) rsp.push(el('polyline', { 'class': 'we-rspring' }, anim));
  for (i = 0; i < N; i++) att.push(el('circle', { cx: XA + (i + 0.5) * PITCH, r: 3.5, 'class': 'be-attach' }, anim));
  for (i = 0; i < N; i++) rmass.push(el('circle', { cx: XA + (i + 0.5) * PITCH, r: 8, 'class': 'we-res' }, anim));
  function zig(x1, y1, x2, y2, n, a) {
    if (a < 0.05) return x1 + ',' + y1 + ' ' + x2 + ',' + y2;
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, p = [x1 + ',' + y1];
    for (var k = 0; k < n; k++) {
      var t = 0.14 + 0.72 * (k + 0.5) / n, s = k % 2 ? -a : a;
      p.push((x1 + dx * t + nx * s).toFixed(1) + ',' + (y1 + dy * t + ny * s).toFixed(1));
    }
    p.push(x2 + ',' + y2);
    return p.join(' ');
  }

  /* ---------- Wave packet panel ---------- */
  var pk = root.querySelector('.we-packet'), PW = 720, PBASE = 124, PAMP = 46, CELL = 16, LDOM = 45, SIG = 5;
  el('text', { x: 14, y: 28, 'class': 'we-head' }, pk, 'Wave packet in the bar with resonators');
  el('circle', { cx: 470, cy: 16, r: 7, 'class': 'we-pt-cp' }, pk);
  el('text', { x: 483, y: 22, 'class': 'we-tick' }, pk, 'crest, phase velocity');
  el('circle', { cx: 470, cy: 40, r: 7, 'class': 'we-pt-cg' }, pk);
  el('text', { x: 483, y: 46, 'class': 'we-tick' }, pk, 'envelope, group velocity');
  var pkLine = el('polyline', { 'class': 'we-medium' }, pk), pkEnvU = el('polyline', { 'class': 'we-env' }, pk), pkEnvD = el('polyline', { 'class': 'we-env' }, pk);
  var pkCp = el('circle', { r: 7, 'class': 'we-pt-cp' }, pk), pkCg = el('circle', { r: 7, 'class': 'we-pt-cg' }, pk);
  var pkMsg = el('text', { x: 360, y: PBASE + 6, 'text-anchor': 'middle', 'class': 'we-tick' }, pk, 'No propagating wave in an attenuation band');
  var MODES = [], PKNORM = 1, X0 = LDOM / 2, DK = 2 * PI / LDOM, tp = 0;
  function setPacket() {
    MODES = []; PKNORM = 0;
    if (!cur.prop) return;
    var bd = cur.band;
    for (var j = -12; j <= 12; j++) {
      var dk = j * DK, a = Math.exp(-dk * dk * SIG * SIG / 2), q = cur.q + dk;
      var al = Math.max(0, Math.min(PI, bd.s * (q - 2 * PI * bd.m)));
      MODES.push({ k: q, w: PI * etaOf(bd, Math.cos(al)), a: a });
      PKNORM += a;
    }
  }
  function packetAt(x) {
    var re = 0, im = 0, s = x - X0;
    for (var i = 0; i < MODES.length; i++) {
      var m = MODES[i], p = m.k * s - m.w * tp;
      re += m.a * Math.cos(p); im += m.a * Math.sin(p);
    }
    return [re / PKNORM, Math.hypot(re, im) / PKNORM];
  }
  function drawPacket() {
    if (!cur.prop) return;
    if (tp * Math.max(cur.cg, 0.01) > LDOM || tp > 60) tp = 0;
    var pts = [], up = [], dn = [], px;
    for (px = 0; px <= PW; px += 2) {
      var v = packetAt(px / CELL);
      pts.push(px + ',' + (PBASE - PAMP * v[0]).toFixed(1));
      up.push(px + ',' + (PBASE - PAMP * v[1]).toFixed(1));
      dn.push(px + ',' + (PBASE + PAMP * v[1]).toFixed(1));
    }
    pkLine.setAttribute('points', pts.join(' '));
    pkEnvU.setAttribute('points', up.join(' '));
    pkEnvD.setAttribute('points', dn.join(' '));
    var xg = X0 + cur.cg * tp;
    var lam = 2 * PI / cur.q, Wl = lam * Math.max(1, Math.ceil(2.4 * SIG / lam));
    var sc = ((cur.cp - cur.cg) * tp % Wl + Wl) % Wl; if (sc > Wl / 2) sc -= Wl;
    var wrap = function (x) { return ((x % LDOM) + LDOM) % LDOM; };
    var xc = wrap(xg + sc);
    pkCp.setAttribute('cx', (xc * CELL).toFixed(1));
    pkCp.setAttribute('cy', (PBASE - PAMP * packetAt(xc)[1]).toFixed(1));
    pkCg.setAttribute('cx', (wrap(xg) * CELL).toFixed(1));
    pkCg.setAttribute('cy', (PBASE - PAMP * packetAt(wrap(xg))[1]).toFixed(1));
  }

  /* ---------- State and drawing ---------- */
  var fSlider = root.querySelector('.be-fslider'), kSlider = root.querySelector('.be-kslider');
  var kVal = root.querySelector('.be-kval'), readout = root.querySelector('.we-readout'), kNote = root.querySelector('.be-knote');
  var playBtn = root.querySelector('.we-play'), wrBtn = root.querySelector('[data-freq="r"]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var freq = 0.4, phase = 0, playing = !reduce, last = null, cur = null, sol = null;

  var WB = 'ω<sub>B</sub>', WR = 'ω<sub>r</sub>';
  function fmt(x, d) { return x.toFixed(d === undefined ? 2 : d); }
  function stiffText() {
    if (KINF) return '∞';
    var r = ETAR * ETAR;
    return r < 10 ? fmt(r) : r < 100 ? fmt(r, 1) : fmt(r, 0);
  }
  function gapName(eta) {
    for (var i = 0; i < GAPS.length; i++) {
      var g = GAPS[i];
      if (eta >= g.lo && eta <= g.hi) return g.lr && g.n ? 'merged local-resonance and Bragg ' + g.n + ' gap' : g.lr ? 'local-resonance (LR) gap' : 'Bragg gap ' + g.n;
    }
    return 'attenuation band';
  }
  function setK(s) {
    setStiff(s);
    kSlider.value = S.toFixed(3);
    kVal.textContent = stiffText();
    build();
    drawCurves();
    var note;
    if (S === 0) note = 'k = 0: the resonators are detached, so this is a uniform bar with no gaps.';
    else if (KINF) note = 'k → ∞: each resonator is a rigid point mass m. Only Bragg gaps remain, each just below a multiple of ' + WB + '.';
    else {
      var n = Math.round(ETAR), close = n >= 1 && n <= 2 && Math.abs(ETAR - n) < 0.006;
      note = WR + ' = ' + fmt(ETAR) + WB + (close ? ': the resonance sits on the Bragg frequency ' + (n === 1 ? '' : n) + WB + ', so the LR gap and Bragg gap ' + n + ' merge into one.' : ETAR > WMAX ? ', above the plotted range, so the gaps shown are Bragg gaps.' : '.');
    }
    kNote.innerHTML = note;
    wrBtn.disabled = KINF || ETAR === 0 || ETAR > WTOP;
    setFreq(freq);
  }
  function setFreq(v) {
    freq = Math.max(WMIN, Math.min(WTOP, v));
    if (!KINF && ETAR > 0 && Math.abs(freq - ETAR) < 2e-4) freq = ETAR + 2e-4;
    cur = state(freq);
    sol = solve(freq);
    fSlider.value = freq.toFixed(3);
    var y = Y(freq);
    fLines.forEach(function (l) { l.setAttribute('y1', y); l.setAttribute('y2', y); });
    grip.setAttribute('y', y - 11);
    tp = 0;
    var shown = cur.prop ? '' : 'none';
    [secant, tangent, labP, labG, dotP, pkLine, pkEnvU, pkEnvD, pkCp, pkCg].forEach(function (n) { n.style.display = shown; });
    pkMsg.style.display = cur.prop ? 'none' : '';
    dotA.style.display = cur.prop ? 'none' : '';
    setPacket();
    var Tr = sol.T[0] * sol.T[0] + sol.T[1] * sol.T[1];
    var tTxt = ' Transmission through ' + N + ' cells: ' + (Tr < 0.001 ? Tr.toExponential(1) : (100 * Tr).toFixed(Tr > 0.1 ? 0 : 1) + '%') + '.';
    if (cur.prop) {
      var xq = cur.q / PI;
      dotP.setAttribute('cx', XQ(cur.q)); dotP.setAttribute('cy', y);
      readout.innerHTML = '<strong>ω/' + WB + ' = ' + fmt(freq, 3) + ': propagation band.</strong> Phase velocity = ' + fmt(cur.cp) + 'c, group velocity = ' + fmt(cur.cg) + 'c.' + tTxt;
      setLine(secant, labP, freq, xq, cur.cp, -20, -8);
      setLine(tangent, labG, freq, xq, cur.cg, -22, 22);
    } else {
      dotA.setAttribute('cx', XB(cur.decay)); dotA.setAttribute('cy', y);
      readout.innerHTML = '<strong>ω/' + WB + ' = ' + fmt(freq, 3) + ': ' + gapName(freq) + '.</strong> Amplitude falls by a factor ' + (cur.decay > 9 ? '> 8000' : fmt(Math.exp(cur.decay), cur.decay > 2 ? 0 : 2)) + ' per cell (β = ' + (cur.decay > 9 ? '> 9' : fmt(cur.decay)) + '), so phase and group velocity are not defined.' + tTxt;
    }
    draw();
    drawPacket();
  }
  function draw() {
    var cp = Math.cos(phase), sp = Math.sin(phase), W = sol.W, R = sol.R, T = sol.T, px, j;
    /* Displacement u e^{-i w t}; display Re(z e^{-i phase}) */
    var re = function (z) { return z[0] * cp + z[1] * sp; };
    var pts = [];
    for (px = 0; px <= XA; px += 3) {
      var xi = (px - XA) / PITCH, c1 = Math.cos(W * xi), s1 = Math.sin(W * xi);
      pts.push(px + ',' + (YM - AU * re([c1 + R[0] * c1 + R[1] * s1, s1 + R[1] * c1 - R[0] * s1])).toFixed(1));
    }
    barL.setAttribute('points', pts.join(' '));
    pts = [];
    for (px = XA; px <= XE; px += 2) {
      var x = Math.min((px - XA) / PITCH, N - 1e-9), cell = Math.floor(x), d = x - cell, st, dd;
      if (d < 0.5) { st = sol.left[cell]; dd = d; } else { st = sol.right[cell]; dd = d - 0.5; }
      var c = Math.cos(W * dd), s = Math.sin(W * dd) / W;
      pts.push(px + ',' + (YM - AU * re([st[0][0] * c + st[1][0] * s, st[0][1] * c + st[1][1] * s])).toFixed(1));
    }
    barM.setAttribute('points', pts.join(' '));
    pts = [];
    for (px = XE; px <= WIDTH; px += 3) {
      var xr = (px - XE) / PITCH, c2 = Math.cos(W * xr), s2 = Math.sin(W * xr);
      pts.push(px + ',' + (YM - AU * re([T[0] * c2 - T[1] * s2, T[1] * c2 + T[0] * s2])).toFixed(1));
    }
    barR.setAttribute('points', pts.join(' '));
    /* Resonator displacement v = u / (1 - w^2 / w_r^2), softly capped at VC for display */
    var f = meff(freq), VC = 2.2;
    var amp = 5 * (1 - S), op = S === 0 ? 0.25 : 1;
    for (j = 0; j < N; j++) {
      var u = re(sol.res[j]), xx = XA + (j + 0.5) * PITCH, ym = +(YM - AU * u).toFixed(1), yr = +(YR - AV * VC * Math.tanh(f * u / VC)).toFixed(1);
      att[j].setAttribute('cy', ym);
      rmass[j].setAttribute('cy', yr);
      rsp[j].setAttribute('points', zig(xx, ym + 4, xx, yr - 8, 6, amp));
      rsp[j].style.opacity = op;
    }
  }
  function tick(t) {
    if (last !== null && playing) {
      var dt = (t - last) / 1000 * 2 * PI * 0.6;
      phase += dt * freq; tp += dt * 0.8;
      draw(); drawPacket();
    }
    last = t;
    requestAnimationFrame(tick);
  }
  fSlider.addEventListener('input', function () { setFreq(parseFloat(fSlider.value)); });
  kSlider.addEventListener('input', function () { setK(parseFloat(kSlider.value)); });
  playBtn.addEventListener('click', function () {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
  });
  playBtn.textContent = playing ? 'Pause' : 'Play';
  root.querySelectorAll('[data-freq]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-freq');
      setFreq(v === 'r' ? ETAR + 0.003 : parseFloat(v));
    });
  });
  root.querySelectorAll('[data-k]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.getAttribute('data-k');
      setK(r === 'inf' ? 1 : parseFloat(r) / (1 + parseFloat(r)));
    });
  });
  function pointerFreq(e) {
    var pt = plot.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(plot.getScreenCTM().inverse());
    setFreq((p.y - PY0) / (PY1 - PY0) * WMAX);
  }
  var dragging = false;
  plot.addEventListener('pointerdown', function (e) { dragging = true; plot.setPointerCapture(e.pointerId); pointerFreq(e); e.preventDefault(); });
  plot.addEventListener('pointermove', function (e) { if (dragging) pointerFreq(e); });
  plot.addEventListener('pointerup', function () { dragging = false; });
  plot.addEventListener('pointercancel', function () { dragging = false; });
  setK(0.5);
  requestAnimationFrame(tick);
})();
