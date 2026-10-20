// Tests du moteur de planification : node --test pilote/moteur.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { planifier, capacite, CONFIG_DEFAUT, lundiDe } from './moteur.mjs';

const LUNDI = '2026-10-19', MARDI = '2026-10-20';
const cfg = { ...CONFIG_DEFAUT, heures: [2, 2, 2, 2, 2, 0, 0], reserve: 0.25 }; // 90 min planifiables par jour
const t = (tid, o = {}) => ({ tid, kind: 'tache', titre: tid, statut: 'a_faire', duree: 30, priorite: 2, cree: '2026-10-01', ...o });

test('capacité : réserve retirée, week-end vide', () => {
  assert.equal(capacite(cfg, LUNDI), 90);
  assert.equal(capacite(cfg, '2026-10-25'), 0);
  assert.equal(lundiDe('2026-10-25'), LUNDI);
});

test('ne dépasse jamais la capacité : le surplus reste au parking avec une raison', () => {
  const taches = Array.from({ length: 20 }, (_, i) => t('x' + i, { duree: 60 }));
  const r = planifier(taches, cfg, LUNDI, LUNDI);
  const places = Object.values(r.placement).filter(Boolean).length;
  assert.equal(places, 5); // 1 tâche de 60 min par jour sur 90
  assert.ok(r.jours.every((j) => !j.surcharge));
  assert.equal(Object.keys(r.raisons).length, 15);
});

test('les jours passés ne reçoivent rien', () => {
  const r = planifier([t('a')], cfg, LUNDI, MARDI);
  assert.equal(r.placement.a, MARDI);
});

test('placement manuel verrouillé conservé, même en surcharge ; terminées intactes', () => {
  const r = planifier([t('v', { jour: '2026-10-23', verrou: true, duree: 120 }), t('f', { jour: LUNDI, statut: 'terminee' }), t('n')], cfg, LUNDI, LUNDI);
  assert.equal(r.placement.v, '2026-10-23');
  assert.equal(r.placement.f, LUNDI);
  assert.ok(r.jours.find((j) => j.date === '2026-10-23').surcharge); // signalée, pas cachée
});

test('échéance respectée, priorité ensuite', () => {
  const r = planifier([t('tard', { priorite: 1 }), t('urgent', { echeance: LUNDI, duree: 90, priorite: 3 })], cfg, LUNDI, LUNDI);
  assert.equal(r.placement.urgent, LUNDI);
  assert.equal(r.placement.tard, MARDI);
});

test('échéance impossible : parking avec raison', () => {
  const r = planifier([t('long', { echeance: LUNDI, duree: 200 })], cfg, LUNDI, LUNDI);
  assert.equal(r.placement.long, null);
  assert.match(r.raisons.long, /Trop longue|Pas assez/);
});

test('dépendances : après la tâche dont elle dépend ; attente si la dépendance ne rentre pas', () => {
  const r = planifier([t('b', { depend: ['a'], duree: 60 }), t('a', { duree: 90 })], cfg, LUNDI, LUNDI);
  assert.equal(r.placement.a, LUNDI);
  assert.equal(r.placement.b, MARDI);
  const r2 = planifier([t('b', { depend: ['a'] }), t('a', { duree: 500 })], cfg, LUNDI, LUNDI);
  assert.equal(r2.placement.b, null);
  assert.match(r2.raisons.b, /Attend/);
});

test('bloquée et semaine future : jamais déplacées', () => {
  const r = planifier([t('blo', { statut: 'bloquee' }), t('fut', { jour: '2026-11-02' })], cfg, LUNDI, LUNDI);
  assert.equal(r.placement.blo, null);
  assert.equal(r.placement.fut, '2026-11-02');
});

test('déterministe : deux appels, même résultat', () => {
  const taches = Array.from({ length: 12 }, (_, i) => t('d' + i, { duree: 15 + (i % 4) * 15, priorite: 1 + (i % 3) }));
  assert.deepEqual(planifier(taches, cfg, LUNDI, LUNDI), planifier(taches, cfg, LUNDI, LUNDI));
});
