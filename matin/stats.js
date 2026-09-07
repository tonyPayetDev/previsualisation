// Shared statistics for "Le Matin". Used verbatim by the n8n weekly report
// (Code node) and by analyse.mjs — keep this file the single source of truth.
// Input: rows from the MatinJournal data table. Output: plain object.
function analyserMatin(rows, now) {
  now = now || new Date();
  var DAY = 86400000;
  var num = function (v) { if (v === null || v === undefined || v === '') return null; var n = Number(v); return isNaN(n) ? null : n; };
  var moyenne = function (xs) { xs = xs.filter(function (x) { return x !== null; }); return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; };
  var r1 = function (x) { return x === null ? null : Math.round(x * 10) / 10; };
  // Réunion is UTC+4, no DST: "today" as seen by Tony.
  var isoReunion = function (d) { return new Date(d.getTime() + 4 * 3600000).toISOString().slice(0, 10); };
  var today = isoReunion(now);
  var dayIndex = function (iso) { return Math.round(Date.parse(iso + 'T00:00:00Z') / DAY); };

  var byDate = {};
  (rows || []).forEach(function (r) {
    if (!r || typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return;
    if (r.date === '2000-01-01') return; // technical test row
    byDate[r.date] = r; // last one wins
  });
  var all = Object.keys(byDate).sort().map(function (d) { return byDate[d]; });
  var n = all.length;

  var t0 = dayIndex(today);
  var last7 = all.filter(function (r) { var k = t0 - dayIndex(r.date); return k >= 0 && k <= 6; });
  var n7 = last7.length;
  var manques7 = 7 - n7;

  var deltas = { energie: [], humeur: [], clarte: [] };
  var prets = [];
  all.forEach(function (r) {
    ['energie', 'humeur', 'clarte'].forEach(function (k) {
      var a = num(r[k + '_avant']), b = num(r[k + '_apres']);
      if (a !== null && b !== null) deltas[k].push(b - a);
    });
    prets.push(num(r.pret));
  });
  var deltaMoy = { energie: r1(moyenne(deltas.energie)), humeur: r1(moyenne(deltas.humeur)), clarte: r1(moyenne(deltas.clarte)) };
  var deltaGlobal = r1(moyenne([deltaMoy.energie, deltaMoy.humeur, deltaMoy.clarte]));
  var pretMoy = r1(moyenne(prets));

  // Slope of the BEFORE scores over calendar days (linear regression).
  // This is the real test: does the baseline rise session after session?
  var pente = function (key) {
    var pts = [];
    all.forEach(function (r) {
      var y = key === 'global'
        ? moyenne([num(r.energie_avant), num(r.humeur_avant), num(r.clarte_avant)])
        : num(r[key + '_avant']);
      if (y !== null) pts.push([dayIndex(r.date), y]);
    });
    if (pts.length < 2) return null;
    var x0 = pts[0][0];
    var mx = moyenne(pts.map(function (p) { return p[0] - x0; }));
    var my = moyenne(pts.map(function (p) { return p[1]; }));
    var sxx = 0, sxy = 0;
    pts.forEach(function (p) { var dx = p[0] - x0 - mx; sxx += dx * dx; sxy += dx * (p[1] - my); });
    return sxx === 0 ? null : sxy / sxx; // points per day
  };
  var penteJour = { global: pente('global'), energie: pente('energie'), humeur: pente('humeur'), clarte: pente('clarte') };
  var penteSemaine = {};
  Object.keys(penteJour).forEach(function (k) { penteSemaine[k] = penteJour[k] === null ? null : r1(penteJour[k] * 7); });

  // Streak: sessions walking back from the last one, a single missing day
  // (the weekly rest) does not break it, two missing days do.
  var serie = 0;
  if (n) {
    var last = dayIndex(all[n - 1].date);
    if (t0 - last <= 2) {
      serie = 1;
      for (var i = n - 1; i > 0; i--) {
        if (dayIndex(all[i].date) - dayIndex(all[i - 1].date) <= 2) serie++; else break;
      }
    }
  }

  var avantMoy = r1(moyenne(all.map(function (r) { return moyenne([num(r.energie_avant), num(r.humeur_avant), num(r.clarte_avant)]); })));
  var apresMoy = r1(moyenne(all.map(function (r) { return moyenne([num(r.energie_apres), num(r.humeur_apres), num(r.clarte_apres)]); })));

  var verdict, code;
  var ps = penteSemaine.global;
  if (n < 6) { code = 'trop_tot'; verdict = 'Trop tôt : ' + n + ' séance' + (n > 1 ? 's' : '') + ' enregistrée' + (n > 1 ? 's' : '') + ', il en faut 6 pour conclure.'; }
  else if (ps !== null && ps >= 0.3) { code = 'marche'; verdict = 'Ça marche : ton niveau de base monte de ' + ps + ' pt/semaine' + (deltaGlobal !== null ? ', et chaque séance te fait gagner ' + (deltaGlobal > 0 ? '+' : '') + deltaGlobal + ' pt' : '') + '.'; }
  else if (ps !== null && ps <= -0.3) { code = 'ne_marche_pas'; verdict = 'Ça ne marche pas : ton niveau de base baisse (' + ps + ' pt/semaine) malgré les séances.'; }
  else if (deltaGlobal !== null && deltaGlobal >= 1 && n < 12) { code = 'trop_tot'; verdict = 'Trop tôt pour le niveau de base (pente ' + (ps === null ? '?' : (ps > 0 ? '+' : '') + ps) + ' pt/semaine), mais l\'effet immédiat est là : ' + (deltaGlobal > 0 ? '+' : '') + deltaGlobal + ' pt par séance. Continue jusqu\'à 12.'; }
  else if (deltaGlobal !== null && deltaGlobal < 0.5) { code = 'ne_marche_pas'; verdict = 'Ça ne marche pas : ni effet immédiat (' + (deltaGlobal > 0 ? '+' : '') + deltaGlobal + ' pt par séance) ni hausse du niveau de base.'; }
  else { code = 'trop_tot'; verdict = 'Trop tôt : effet immédiat modeste, niveau de base plat. Continue jusqu\'à 12 séances.'; }

  return {
    today: today, n: n, n7: n7, manques7: manques7, serie: serie,
    avantMoy: avantMoy, apresMoy: apresMoy,
    deltaMoy: deltaMoy, deltaGlobal: deltaGlobal, pretMoy: pretMoy,
    penteSemaine: penteSemaine,
    derniere: n ? all[n - 1].date : null,
    rows: all, verdict: verdict, code: code
  };
}
export { analyserMatin };
