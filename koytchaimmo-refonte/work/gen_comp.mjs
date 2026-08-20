// Maquette nord de la direction « lambrequins ». Elle fixe le niveau
// d'ambition AVANT le code : sans elle, la construction retombe sur la version
// prudente. Une seule image, premier écran, pleine fidélité.
import fs from 'fs';

const KEY = fs.readFileSync('/work/.kie.env', 'utf8')
  .match(/KIE_API_KEY\s*=\s*"?([^"\n]+)"?/)[1].trim();
const OUT = '/work/previsualisation/koytchaimmo-refonte/work/comp';
fs.mkdirSync(OUT, { recursive: true });

const PROMPT = `Desktop web landing page, first viewport only, 16:9, for a real-estate
advisory and property-development firm on Réunion Island. NOT a photograph of a
building — a designed web page.

STRUCTURE, top to bottom: a slim top bar; then an enormous condensed sans-serif
headline in French set at display scale, occupying nearly half the viewport
width, tight tracking, set flush left with generous margin; to its right a
full-bleed photograph of a modern Creole-influenced office building bleeding off
the right edge of the frame. Across the full width, separating the headline zone
from what is below, a horizontal band of CREOLE LAMBREQUIN FRETWORK: the sawn
wooden valance frieze found under the eaves of Réunion Creole houses, a
repeating scalloped and pierced silhouette, rendered as a crisp flat graphic
band, not as a photo of wood. Below it, a horizontal search instrument as a
white panel.

COLOUR: the page commits hard to a single saturated magenta (#E6007E) — it owns
large fields, not thin accents; roughly 40 percent of the surface. A deep
foliage green (#4E8221) as the second colour. White and very dark charcoal as
the only neutrals. No pastel, no cream, no beige, no gradient text.

TYPE: one condensed grotesque with real character for the display, set very
large; a plain neutral sans for small text. High contrast between the two sizes.

MOOD: confident, graphic, tropical without being touristy or folkloric.
Poster-like. Flat colour fields and one photograph. Precise, not decorative.

NO stock-photo collage, NO glassmorphism, NO drop shadows on cards, NO icons in
circles, NO gradient backgrounds, NO lorem ipsum blocks of grey bars.`;

const api = async (p, o) => (await fetch(`https://api.kie.ai${p}`, {
  ...o, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(o?.headers || {}) },
})).json();

const r = await api('/api/v1/jobs/createTask', {
  method: 'POST',
  body: JSON.stringify({ model: 'google/nano-banana', input: { prompt: PROMPT, image_size: '16:9' } }),
});
if (r.code !== 200) { console.log('ECHEC ' + r.msg); process.exit(1); }
console.log('  tache ' + r.data.taskId);

for (let i = 0; i < 50; i++) {
  await new Promise((s) => setTimeout(s, 6000));
  const q = await api(`/api/v1/jobs/recordInfo?taskId=${r.data.taskId}`, { method: 'GET' });
  const d = q.data || {};
  const e = d.state || d.status;
  if (e === 'success' || e === 'succeeded') {
    let u = d.resultJson ? (JSON.parse(d.resultJson).resultUrls || [])[0] : null;
    u = u || (d.resultUrls || [])[0];
    if (!u) { console.log('  succes sans URL'); break; }
    const b = Buffer.from(await (await fetch(u)).arrayBuffer());
    fs.writeFileSync(`${OUT}/lambrequin-hero.png`, b);
    // Provenance : toute image livrée porte son prompt.
    fs.writeFileSync(`${OUT}/lambrequin-hero.prompt.txt`, PROMPT);
    console.log(`  ecrit ${b.length} o`);
    break;
  }
  if (e === 'fail' || e === 'failed') { console.log('  echec: ' + (d.failMsg || '')); break; }
}
console.log('COMP_DONE');
