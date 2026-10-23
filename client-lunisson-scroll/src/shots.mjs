import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';
const B = await chromium.launch({ args:['--no-sandbox','--disable-dev-shm-usage'] });

async function passe(nom, w, h, points) {
  const ctx = await B.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0,140)));
  p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text().slice(0,120)); });
  await p.goto('file:///work/previsualisation/client-lunisson-scroll/index.html', {waitUntil:'load'});
  await p.waitForTimeout(2200);
  const H = await p.evaluate(() => document.body.scrollHeight);
  /* Vérifier que la police distante a bien chargé : si Archivo manque, la
     maquette se juge sur une substitution système et le rendu ment. */
  const pol = await p.evaluate(async () => {
    await document.fonts.ready;
    return { archivo: document.fonts.check('900 40px Archivo'),
             karla: document.fonts.check('400 17px Karla'), n: document.fonts.size };
  });
  console.log(`  ${nom} ${w}x${h} · page ${H}px · Archivo=${pol.archivo} Karla=${pol.karla} (${pol.n} faces)`);
  for (const [lbl, frac] of points) {
    await p.evaluate((f) => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * f), frac);
    await p.waitForTimeout(900);
    await p.screenshot({ path:`src/shot-${nom}-${lbl}.jpg`, quality:74, type:'jpeg' });
  }
  if (errs.length) console.log('  ⚠️ ' + [...new Set(errs)].slice(0,4).join(' | '));
  else console.log('  aucune erreur JS');
  await ctx.close();
}
await passe('desk', 1440, 900, [['00',0],['12',.12],['22',.22],['34',.34],['48',.48],['62',.62],['78',.78],['96',.96]]);
await passe('mob', 390, 844, [['00',0],['22',.22],['40',.40],['62',.62],['88',.88]]);
await B.close();
