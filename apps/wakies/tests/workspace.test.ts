import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { WorkspaceStore } from '../src/server/workspace.js';
it('persists spaces, specialist permissions, and canonical thread ownership', () => {
  const store = new WorkspaceStore(':memory:', 'owner');
  const space = store.createSpace('Design', 'Design decisions');
  const wakie = store.createWakie(space.id, 'Scout', 'Be concise', false, true);
  store.bindThread('thread-1', wakie.id, 'Design research');
  expect(store.requireThread('thread-1', wakie.id).ownerId).toBe('owner');
  expect(() => store.requireThread('thread-1', 'another-wakie')).toThrow();
  expect(() => store.requireThread('unknown')).toThrow();
  expect(store.wakie(wakie.id)?.researchAllowed).toBe(false);
  store.close();
});
it('rejects a wakie in a nonexistent space and does not rebind an existing thread', () => {
  const store = new WorkspaceStore(':memory:', 'owner');
  expect(() => store.createWakie('missing', 'Wakie', 'Help', true, true)).toThrow();
  const wakies = store.wakies();
  store.bindThread('one', wakies[0].id, 'First');
  expect(() => store.bindThread('one', wakies[0].id, 'Second')).toThrow();
  store.close();
});

it('migrates legacy Space ownership once and never restores revoked access on restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wakies-access-'));
  const path = join(dir, 'workspace.sqlite');
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`CREATE TABLE spaces(id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, createdAt INTEGER NOT NULL);
      CREATE TABLE wakies(id TEXT PRIMARY KEY, spaceId TEXT NOT NULL, name TEXT NOT NULL, instructions TEXT NOT NULL, researchAllowed INTEGER NOT NULL, memoryAllowed INTEGER NOT NULL, createdAt INTEGER NOT NULL);
      INSERT INTO spaces VALUES ('old', 'Original', '', 1), ('new', 'New', '', 2);
      INSERT INTO wakies VALUES ('wakie', 'old', 'Wakie', 'Help', 1, 1, 1);`);
    legacy.close();
    const ws = new WorkspaceStore(path, 'owner');
    const wakie = ws.wakie('wakie')!;
    expect(wakie.spaceIds).toEqual(['old']);
    expect(ws.canAccessSpace('wakie', 'new')).toBe(false);
    expect(() =>
      ws.updateWakie('wakie', { ...wakie, spaceIds: ['missing'] }),
    ).toThrow();
    expect(ws.wakie('wakie')?.spaceIds).toEqual(['old']);
    ws.bindThread('existing-thread', 'wakie', 'Keep me');
    ws.updateWakie('wakie', { ...wakie, spaceId: 'new', spaceIds: ['new'] });
    ws.close();
    const reopened = new WorkspaceStore(path, 'owner');
    expect(reopened.wakie('wakie')?.spaceIds).toEqual(['new']);
    expect(reopened.canAccessSpace('wakie', 'old')).toBe(false);
    expect(reopened.requireThread('existing-thread').wakieId).toBe('wakie');
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
