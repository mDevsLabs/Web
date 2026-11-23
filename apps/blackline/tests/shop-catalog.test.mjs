import assert from 'node:assert/strict';
import test from 'node:test';
import { SHOP_ITEMS, equipItem, normalizeCollection, purchase, wallet } from '../lib/game/shop-catalog.js';

test('les articles ont un identifiant unique et un prix entier positif ou nul', () => {
  const ids = SHOP_ITEMS.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of SHOP_ITEMS) {
    assert.ok(item.id.trim());
    assert.ok(Number.isSafeInteger(item.price) && item.price >= 0, item.id);
  }
});

test('un cosmétique est débité une seule fois et reste équipé après rechargement', () => {
  const profile = { xp: 0 };
  const before = wallet(profile);
  const item = SHOP_ITEMS.find(item => item.id === 'shot-ion');
  assert.ok(item);
  assert.equal(purchase(profile, item.id).ok, true);
  assert.equal(purchase(profile, item.id).ok, false);
  assert.equal(wallet(profile), before - item.price);
  assert.equal(equipItem(profile, item.id), true);
  const saved = JSON.parse(JSON.stringify(profile));
  assert.deepEqual(normalizeCollection(saved.collection, saved.xp), {
    purchases: [item.id], shot: item.target, kill: 'none',
  });
});

for (const [reason, id] of [['solde insuffisant', 'weapon-carbine'], ['article inconnu', 'absent-du-catalogue']]) {
  test(`un achat refusé laisse le profil et le solde intacts : ${reason}`, () => {
    const profile = { xp: 0, collection: normalizeCollection(null) };
    const snapshot = structuredClone(profile);
    const before = wallet(profile);
    assert.equal(purchase(profile, id).ok, false);
    assert.deepEqual(profile, snapshot);
    assert.equal(wallet(profile), before);
  });
}
