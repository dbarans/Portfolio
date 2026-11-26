// Draws the home-page card image for Room Planner (images/room-planner/plan.svg) from the same
// compiled domain the demo uses, so the picture shows a real state the rules produced.
//   node tools/room-planner-web/card-svg.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '../..');
const { PlannerDemo } = await import('file://' + resolve(site, 'js/room-planner/room-planner-domain.js').replace(/\\/g, '/'));

const demo = new PlannerDemo();
// The table pulled into the stove's clearance: the rules mark it red.
demo.moveTo('table', 175, 385, true, 1);
const s = JSON.parse(demo.stateJson());
const table = s.furniture.find((f) => f.id === 'table');
console.log('table issues:', JSON.stringify(table.issues));

const W = 1200, H = 750;
const xs = s.room.map((p) => p[0]), ys = s.room.map((p) => p[1]);
const rw = Math.max(...xs) - Math.min(...xs), rh = Math.max(...ys) - Math.min(...ys);
const scale = Math.min((W - 160) / rw, (H - 120) / rh);
const ox = (W - rw * scale) / 2 - Math.min(...xs) * scale;
const oy = (H - rh * scale) / 2 - Math.min(...ys) * scale;
const P = (p) => (ox + p[0] * scale).toFixed(1) + ',' + (oy + p[1] * scale).toFixed(1);
const poly = (pts) => 'M' + pts.map(P).join(' L') + ' Z';

const c = {
  bg: '#0b0c0e', floor: '#15161a', wall: '#f4f3ef', text: '#cfcdc6', muted: '#8e8c86',
  accent: '#8f9dff', error: '#ff5a4a', warning: '#ffb85c', window: '#7fd0ff', line: '#2f3137',
};
const labels = { SOFA: 'Sofa', ARMCHAIR: 'Armchair', TABLE: 'Table', SIDEBOARD: 'Sideboard', WARDROBE: 'Wardrobe' };
const wallW = (8 * scale).toFixed(1);

let out = '';
out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
out += `<defs>
<pattern id="he" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${c.error}" stroke-opacity="0.45" stroke-width="2"/></pattern>
<pattern id="hw" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${c.warning}" stroke-opacity="0.4" stroke-width="2"/></pattern>
</defs>\n`;
out += `<rect width="${W}" height="${H}" fill="${c.bg}"/>\n`;
out += `<path d="${poly(s.room)}" fill="${c.floor}"/>\n`;
for (const f of s.features) {
  if (f.type === 'stove') out += `<path d="${poly(f.zone)}" fill="url(#he)"/>\n`;
  if (f.type === 'radiator') out += `<path d="${poly(f.zone)}" fill="url(#hw)"/>\n`;
  if (f.type === 'door') for (const a of f.swing) out += `<path d="${poly(a)}" fill="${c.line}" fill-opacity="0.5" stroke="${c.muted}" stroke-dasharray="6 6" stroke-width="1.5"/>\n`;
}
out += `<path d="${poly(s.room)}" fill="none" stroke="${c.wall}" stroke-width="${wallW}" stroke-linejoin="miter"/>\n`;
for (const f of s.features) {
  const seg = f.span ? `M${P(f.span[0])} L${P(f.span[1])}` : '';
  if (f.type === 'window' || f.type === 'door') out += `<path d="${seg}" stroke="${c.bg}" stroke-width="${(9 * scale).toFixed(1)}"/>\n`;
  if (f.type === 'window') out += `<path d="${seg}" stroke="${c.window}" stroke-width="3"/>\n`;
  if (f.type === 'radiator') out += `<path d="${poly(f.body)}" fill="${c.warning}"/>\n`;
  if (f.type === 'stove') out += `<path d="${seg}" stroke="${c.error}" stroke-width="${(9 * scale).toFixed(1)}"/>\n`;
}
const order = s.furniture.slice().sort((a, b) => (a.id === 'table') - (b.id === 'table'));
for (const f of order) {
  const sel = f.id === 'table';
  const tone = f.status === 'ERROR' ? c.error : f.status === 'WARNING' ? c.warning : null;
  const fill = tone ? tone : c.bg;
  const fillOp = tone ? 0.2 : 0.85;
  out += `<path d="${poly(f.footprint)}" fill="${fill}" fill-opacity="${fillOp}" stroke="${sel ? c.accent : tone || c.text}" stroke-width="${sel ? 4 : 2.5}"/>\n`;
  out += `<path d="M${P(f.footprint[0])} L${P(f.footprint[1])}" stroke="${sel ? c.accent : tone || c.text}" stroke-width="${sel ? 7 : 5}"/>\n`;
  const [cx, cy] = P([f.x, f.y]).split(',');
  out += `<text x="${cx}" y="${cy}" fill="${tone || c.text}" font-family="ui-monospace, Consolas, monospace" font-size="20" font-weight="500" text-anchor="middle" dominant-baseline="middle">${labels[f.kind] || f.kind}</text>\n`;
  if (sel) {
    const a = ((f.rot + 90) * Math.PI) / 180, r = f.d / 2 + 26;
    const h = [f.x + Math.cos(a) * r, f.y + Math.sin(a) * r];
    out += `<path d="M${P([f.x, f.y])} L${P(h)}" stroke="${c.accent}" stroke-width="2" stroke-dasharray="5 5"/>\n`;
    const [hx, hy] = P(h).split(',');
    out += `<circle cx="${hx}" cy="${hy}" r="15" fill="${c.accent}"/>\n`;
  }
}
out += '</svg>\n';

mkdirSync(resolve(site, 'images/room-planner'), { recursive: true });
writeFileSync(resolve(site, 'images/room-planner/plan.svg'), out);
console.log('wrote images/room-planner/plan.svg', out.length, 'bytes');
