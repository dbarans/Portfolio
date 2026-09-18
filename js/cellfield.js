// The cell-field generator shared by the home page islands and the project pages: one grid
// of squares whose look is six numbers (cell size, spacing, density, light cone, scan bands),
// so a preset can blend into another instead of cutting between images.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;

  const PRESETS = {
    grid: { cw: 14, ch: 14, sx: 34, sy: 34, den: 17, cone: 0, band: 0 },
    cone: { cw: 6, ch: 6, sx: 26, sy: 26, den: 26, cone: 1, band: 0 },
    bands: { cw: 44, ch: 5, sx: 62, sy: 30, den: 30, cone: 0, band: 1 },
    dense: { cw: 12, ch: 12, sx: 20, sy: 20, den: 30, cone: 0, band: 0 },
  };

  const DARK = ['#121211', '#1E1E1C', '#30302B', '#4E4E46'];

  function mix(A, B, u) {
    return {
      cw: lerp(A.cw, B.cw, u), ch: lerp(A.ch, B.ch, u),
      sx: lerp(A.sx, B.sx, u), sy: lerp(A.sy, B.sy, u),
      den: lerp(A.den, B.den, u),
      cone: lerp(A.cone, B.cone, u), band: lerp(A.band, B.band, u),
    };
  }

  // Draws one layer. `off` scrolls it vertically (wrapping), `dim` shifts every cell down the
  // palette, `pal` is four colours from darkest to brightest.
  function draw(g, p, fw, fh, scale, off, seed, dim, pal) {
    pal = pal || DARK;
    const sx = p.sx * scale, sy = p.sy * scale;
    const span = fh + 260;
    const cols = Math.ceil(fw / sx) + 1;
    const rows = Math.ceil(span / sy) + 1;
    const w = Math.max(2, Math.round(p.cw * scale));
    const h = Math.max(2, Math.round(p.ch * scale));
    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const hash = (gx * 73856093) ^ (gy * 19349663) ^ ((gx * gy) * 83492791) ^ seed;
        const v = Math.abs(hash) % 100;
        if (v >= p.den) continue;
        const x = Math.round(gx * sx);
        const yAbs = ((gy * sy + off) % span + span) % span;
        let lum = v < 3 ? 3 : (v < 8 ? 2 : (v < 13 ? 1 : 0));
        if (p.cone > 0.02) {
          const ang = Math.atan2(yAbs / span - 0.24, x / fw - 0.14);
          const lit = Math.abs(ang - 0.66) < 0.4 ? 3 : 0;
          lum = Math.round(lerp(lum, lit, p.cone));
        }
        if (lum === 0 && p.cone > 0.55) continue;
        g.fillStyle = pal[clamp(lum - dim, 0, 3)];
        g.fillRect(x, Math.round(yAbs) - 130, w, h);
      }
    }
  }

  window.CellField = { PRESETS: PRESETS, DARK: DARK, mix: mix, draw: draw };
})();
