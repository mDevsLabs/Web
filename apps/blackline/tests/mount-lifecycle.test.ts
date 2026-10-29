import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portraitViewport } from '../src/landscape.ts';

const entry = readFileSync(new URL('../src/entry.ts', import.meta.url), 'utf8');
const landscape = readFileSync(
  new URL('../src/landscape.ts', import.meta.url),
  'utf8'
);

test('le montage asynchrone est invalidé par un démontage (jeton de génération)', () => {
  // Un montage en vol vérifie la génération après CHAQUE attente et libère le
  // moteur s'il est devenu obsolète.
  assert.ok(entry.includes('mountGeneration'));
  assert.ok(entry.includes('const isCurrent = () => generation === mountGeneration'));
  assert.ok(entry.includes('if (!isCurrent())'));
  assert.ok(entry.includes('game.dispose()'));
});

test('le garde d’orientation retourne un dispose et retire ses écouteurs', () => {
  assert.match(landscape, /export interface LandscapeGuard/);
  assert.ok(landscape.includes('dispose'));
  assert.ok(landscape.includes("removeEventListener('resize'"));
  assert.ok(landscape.includes("removeEventListener('orientationchange'"));
  assert.ok(landscape.includes('layer.remove()'));
  assert.ok(landscape.includes('isMounted()'));
});

test('le viewport portrait est reconnu uniquement en mode tactile', () => {
  assert.equal(portraitViewport(true, 390, 844), true);
  assert.equal(portraitViewport(true, 844, 390), false);
  assert.equal(portraitViewport(false, 390, 844), false);
  assert.equal(portraitViewport(true, Number.NaN, 844), false);
});
