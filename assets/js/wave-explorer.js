/* Interactive dispersion explorer.
   Plots: Bloch dispersion of an infinite mass-in-mass chain,
   cos(qL) = 1 - meff w^2 / (2 k1), with w normalised by w0 = sqrt(k2/m2),
   k1/m1 = w0^2 and m2/m1 = 0.5.
   Animation: harmonic scattering by a finite chain placed between two
   non-dispersive, semi-infinite media (no reflection from their far ends).
   Their impedance matches the chain's long-wave limit, Z = sqrt(k1 (m1 + m2)). */
(function () {
  var root = document.getElementById('wave-explorer');
  if (!root) return;
  var NS = 'http://www.w3.org/2000/svg', MU = 0.5, WMAX = 2.6, WMIN = 0.05, WTOP = 2.5;
  function el(name, attrs, parent, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function gamma(w) { return 1 - (1 + MU / (1 - w * w)) * w * w / 2; }
  function respFactor(w) { return 1 / (1 - w * w); }
  /* Returns decay per cell, phase per cell and whether the wave propagates */
  function bloch(w) {
    var g = gamma(w);
    if (Math.abs(g) <= 1) return { prop: true, q: Math.acos(g), decay: 0, sign: 1 };
    return { prop: false, q: g < 0 ? Math.PI : 0, decay: Math.acosh(Math.abs(g)), sign: g < 0 ? -1 : 1 };
  }

  /* ---------- Plots ---------- */
  var plot = root.querySelector('.we-plot');
  var PY0 = 316, PY1 = 48, PX = [86, 370], AX = [420, 704], AMAX = 3;
  var Y = function (w) { return PY0 + (PY1 - PY0) * w / WMAX; };
  var gaps = [], prev = null, start = null;
  for (var w = 0.0005; w <= WMAX; w += 0.0005) {
    if (Math.abs(w - 1) < 0.0005) continue;
    var isGap = Math.abs(gamma(w)) > 1;
    if (isGap && !prev) start = w;
    if (!isGap && prev) gaps.push([start, w]);
    prev = isGap;
  }
  if (prev) gaps.push([start, WMAX]);
  [PX, AX].forEach(function (x) {
    gaps.forEach(function (g) {
      el('rect', { x: x[0], y: Y(g[1]), width: x[1] - x[0], height: Y(g[0]) - Y(g[1]), 'class': 'we-gap' }, plot);
    });
    [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (t) {
      el('line', { x1: x[0], x2: x[1], y1: Y(t), y2: Y(t), 'class': 'we-grid' }, plot);
    });
    el('path', { d: 'M' + x[0] + ' ' + PY1 + 'V' + PY0 + 'H' + x[1], 'class': 'we-axis' }, plot);
  });
  [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (t) {
    el('text', { x: PX[0] - 10, y: Y(t) + 6, 'text-anchor': 'end', 'class': 'we-tick' }, plot, String(t));
  });
  [['0', 0], ['π/2', 0.5], ['π', 1]].forEach(function (t) {
    el('text', { x: PX[0] + (PX[1] - PX[0]) * t[1], y: PY0 + 26, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, t[0]);
  });
  [['0', 0], ['1', 1 / 3], ['2', 2 / 3], ['3+', 1]].forEach(function (t) {
    el('text', { x: AX[0] + (AX[1] - AX[0]) * t[1], y: PY0 + 26, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, t[0]);
  });
  el('text', { x: 228, y: PY0 + 56, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Re(qL)');
  el('text', { x: 562, y: PY0 + 56, 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Im(qL)');
  el('text', { x: PX[0], y: 32, 'class': 'we-head' }, plot, 'Wave propagation');
  el('text', { x: AX[0], y: 32, 'class': 'we-head' }, plot, 'Wave attenuation');
  el('text', { transform: 'translate(22 182) rotate(-90)', 'text-anchor': 'middle', 'class': 'we-tick' }, plot, 'Frequency, ω / ω₀');
  el('text', { x: PX[0] + 12, y: (Y(gaps[0][0]) + Y(gaps[0][1])) / 2 + 7, 'class': 'we-head' }, plot, 'Bandgap');

  var pProp = [], pAtt = [], dProp = '', dAtt = '', lastProp = false, lastAtt = false;
  for (w = 0.0005; w <= WMAX; w += 0.0005) {
    if (Math.abs(w - 1) < 0.0005) { lastProp = lastAtt = false; continue; }
    var b = bloch(w), y = Y(w).toFixed(2);
    if (b.prop) {
      dProp += (lastProp ? 'L' : 'M') + (PX[0] + (PX[1] - PX[0]) * b.q / Math.PI).toFixed(2) + ' ' + y;
      lastProp = true; lastAtt = false;
    } else {
      dAtt += (lastAtt ? 'L' : 'M') + (AX[0] + (AX[1] - AX[0]) * Math.min(b.decay, AMAX) / AMAX).toFixed(2) + ' ' + y;
      lastAtt = true; lastProp = false;
    }
  }
  el('path', { d: dProp, 'class': 'we-curve-prop' }, plot);
  el('path', { d: dAtt, 'class': 'we-curve-att' }, plot);

  var fLines = [PX, AX].map(function (x) { return el('line', { x1: x[0], x2: x[1], y1: 0, y2: 0, 'class': 'we-fline' }, plot); });
  var dotP = el('circle', { r: 7, 'class': 'we-dot-prop' }, plot);
  var dotA = el('circle', { r: 7, 'class': 'we-dot-att' }, plot);
  var grip = el('rect', { x: 388, y: 0, width: 14, height: 22, rx: 4, 'class': 'we-grip' }, plot);

  /* ---------- Scattering solution ---------- */
  var N = 8, Z = Math.sqrt(1 + MU), SPEED = 1 / Math.sqrt(1 + MU);
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function solve(w) {
    var me = 1 + MU / (1 - w * w), mid = 2 - w * w * me, end = 1 - w * w * me, cp = [], dp = [], n, u = [];
    /* Tridiagonal system with unit incident amplitude: off-diagonals are -1 */
    var d0 = [end, w * Z];
    cp[0] = cdiv([-1, 0], d0);
    dp[0] = cdiv([0, 2 * w * Z], d0);
    for (n = 1; n < N; n++) {
      var dn = n === N - 1 ? [end, w * Z] : [mid, 0];
      var den = [dn[0] + cp[n - 1][0], dn[1] + cp[n - 1][1]];
      cp[n] = cdiv([-1, 0], den);
      dp[n] = cdiv(dp[n - 1], den);
    }
    u[N - 1] = dp[N - 1];
    for (n = N - 2; n >= 0; n--) {
      var c = cmul(cp[n], u[n + 1]);
      u[n] = [dp[n][0] - c[0], dp[n][1] - c[1]];
    }
    return { u: u, r: [u[0][0] - 1, u[0][1]], t: u[N - 1] };
  }
  window.waveExplorerSolve = solve;

  /* ---------- Chain animation ---------- */
  var anim = root.querySelector('.we-anim');
  var XA = 170, PITCH = 54, XB = XA + (N - 1) * PITCH, YM = 96, YR = 208, AU = 19, AV = 21, WIDTH = 720;
  el('rect', { x: XA - 27, y: 44, width: XB - XA + 54, height: 222, rx: 6, 'class': 'we-meta' }, anim);
  el('text', { x: (XA + XB) / 2, y: 30, 'text-anchor': 'middle', 'class': 'we-head' }, anim, 'Metamaterial');
  el('text', { x: 4, y: 30, 'class': 'we-tick' }, anim, 'Non-dispersive');
  el('text', { x: WIDTH - 4, y: 30, 'text-anchor': 'end', 'class': 'we-tick' }, anim, 'Non-dispersive');
  var lineL = el('polyline', { 'class': 'we-medium' }, anim), lineR = el('polyline', { 'class': 'we-medium' }, anim);
  var spr = [], rsp = [], mm = [], rm = [], i;
  for (i = 0; i < N - 1; i++) spr.push(el('polyline', { 'class': 'we-spring' }, anim));
  for (i = 0; i < N; i++) rsp.push(el('polyline', { 'class': 'we-rspring' }, anim));
  for (i = 0; i < N; i++) rm.push(el('circle', { cx: XA + i * PITCH, r: 7, 'class': 'we-res' }, anim));
  for (i = 0; i < N; i++) mm.push(el('circle', { cx: XA + i * PITCH, r: 10, 'class': 'we-mass' }, anim));
  function zig(x1, y1, x2, y2, n, a) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, p = [x1 + ',' + y1];
    for (var k = 0; k < n; k++) {
      var t = 0.14 + 0.72 * (k + 0.5) / n, s = k % 2 ? -a : a;
      p.push((x1 + dx * t + nx * s).toFixed(1) + ',' + (y1 + dy * t + ny * s).toFixed(1));
    }
    p.push(x2 + ',' + y2);
    return p.join(' ');
  }

  /* ---------- State ---------- */
  var slider = root.querySelector('.we-slider'), readout = root.querySelector('.we-readout');
  var playBtn = root.querySelector('.we-play');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var freq = 0.55, phase = 0, playing = !reduce, last = null, cur = bloch(freq), sol = solve(freq);

  function setFreq(v) {
    freq = Math.max(WMIN, Math.min(WTOP, v));
    if (Math.abs(freq - 1) < 0.002) freq = 1.002;
    cur = bloch(freq);
    sol = solve(freq);
    slider.value = freq.toFixed(3);
    var y = Y(freq);
    fLines.forEach(function (l) { l.setAttribute('y1', y); l.setAttribute('y2', y); });
    grip.setAttribute('y', y - 11);
    var tr = Math.hypot(sol.t[0], sol.t[1]) * 100;
    var trText = 'Transmitted amplitude: ' + (tr < 0.1 ? 'below 0.1' : tr < 10 ? tr.toFixed(1) : tr.toFixed(0)) + '% of the incoming wave.';
    if (cur.prop) {
      dotP.setAttribute('cx', PX[0] + (PX[1] - PX[0]) * cur.q / Math.PI); dotP.setAttribute('cy', y);
      dotP.style.display = ''; dotA.style.display = 'none';
      readout.innerHTML = '<strong>ω/ω₀ = ' + freq.toFixed(2) + ': pass band.</strong> ' + trText;
    } else {
      dotA.setAttribute('cx', AX[0] + (AX[1] - AX[0]) * Math.min(cur.decay, AMAX) / AMAX); dotA.setAttribute('cy', y);
      dotA.style.display = ''; dotP.style.display = 'none';
      readout.innerHTML = '<strong>ω/ω₀ = ' + freq.toFixed(2) + ': bandgap.</strong> ' + trText;
    }
    draw();
  }
  function draw() {
    var cp = Math.cos(phase), sp = Math.sin(phase), kap = freq / SPEED;
    var f = 1 / (1 - freq * freq);
    f = Math.sign(f) * Math.min(Math.abs(f), 1.3);
    var re = function (z) { return z[0] * cp - z[1] * sp; }, n, px;
    var pts = [];
    for (px = 0; px <= XA; px += 5) {
      var xi = (px - XA) / PITCH, c1 = Math.cos(kap * xi), s1 = Math.sin(kap * xi);
      /* incident e^{-i k x} + reflected r e^{+i k x} */
      var z = [c1 + sol.r[0] * c1 - sol.r[1] * s1, -s1 + sol.r[0] * s1 + sol.r[1] * c1];
      pts.push(px + ',' + (YM + AU * re(z)).toFixed(1));
    }
    lineL.setAttribute('points', pts.join(' '));
    pts = [];
    for (px = XB; px <= WIDTH; px += 5) {
      var xr = (px - XB) / PITCH, c2 = Math.cos(kap * xr), s2 = Math.sin(kap * xr);
      pts.push(px + ',' + (YM + AU * re([sol.t[0] * c2 + sol.t[1] * s2, sol.t[1] * c2 - sol.t[0] * s2])).toFixed(1));
    }
    lineR.setAttribute('points', pts.join(' '));
    var ys = [];
    for (n = 0; n < N; n++) {
      var d = re(sol.u[n]), x = XA + n * PITCH, ym = +(YM + AU * d).toFixed(1), yr = +(YR + AV * f * d).toFixed(1);
      ys.push(ym);
      mm[n].setAttribute('cy', ym);
      rm[n].setAttribute('cy', yr);
      rsp[n].setAttribute('points', zig(x, ym, x, yr, 5, 4));
    }
    for (n = 0; n < N - 1; n++) spr[n].setAttribute('points', zig(XA + n * PITCH, ys[n], XA + (n + 1) * PITCH, ys[n + 1], 5, 5));
  }
  function tick(t) {
    if (last !== null && playing) { phase += (t - last) / 1000 * freq * 2 * Math.PI * 0.6; draw(); }
    last = t;
    requestAnimationFrame(tick);
  }
  slider.addEventListener('input', function () { setFreq(parseFloat(slider.value)); });
  playBtn.addEventListener('click', function () {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
  });
  playBtn.textContent = playing ? 'Pause' : 'Play';
  root.querySelectorAll('[data-freq]').forEach(function (b) {
    b.addEventListener('click', function () { setFreq(parseFloat(b.getAttribute('data-freq'))); });
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
  setFreq(freq);
  requestAnimationFrame(tick);
})();
