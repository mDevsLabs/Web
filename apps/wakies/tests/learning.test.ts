import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import type { RunAgentInput } from '@ag-ui/core';
import { WorkspaceStore } from '../src/server/workspace.js';
import { learningSelector } from '../src/server/learning.js';

const cleanup: (() => void)[] = [];
afterEach(() =>
  cleanup
    .splice(0)
    .reverse()
    .forEach((fn) => fn()),
);
function fixture() {
  const ws = new WorkspaceStore(':memory:', 'owner');
  cleanup.push(() => ws.close());
  const wakie = ws.wakies()[0];
  return { ws, wakie };
}
const input = (threadId: string): RunAgentInput => ({
  threadId,
  runId: 'run',
  state: {},
  messages: [],
  tools: [],
  context: [],
  forwardedProps: {},
});

it('freezes container assignments, including disabled conversations, when a Wakie changes', () => {
  const { ws, wakie } = fixture();
  ws.bindThread('disabled', wakie.id, 'Before learning');
  ws.updateWakie(wakie.id, {
    ...wakie,
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
  ws.bindThread('research', wakie.id, 'Research');
  ws.updateWakie(wakie.id, {
    ...wakie,
    learningContainerId: 'writing',
    skillDeliveryEnabled: true,
  });
  ws.bindThread('writing', wakie.id, 'Writing');
  expect(ws.requireThread('disabled').learningContainerId).toBeNull();
  expect(ws.requireThread('research').learningContainerId).toBe('research');
  expect(ws.requireThread('writing').learningContainerId).toBe('writing');
  ws.updateWakie(wakie.id, {
    ...wakie,
    learningContainerId: null,
    skillDeliveryEnabled: false,
  });
  expect(ws.requireThread('research').learningContainerId).toBe('research');
});

it('migrates legacy threads without enrolling them and persists configuration across restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wakies-learning-'));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'workspace.sqlite');
  const legacy = new DatabaseSync(path);
  legacy.exec(`CREATE TABLE thread_bindings(id TEXT PRIMARY KEY, wakieId TEXT NOT NULL, ownerId TEXT NOT NULL, title TEXT NOT NULL, createdAt INTEGER NOT NULL);
    INSERT INTO thread_bindings VALUES ('old', 'wakie', 'owner', 'Existing', 1);`);
  legacy.close();
  const ws = new WorkspaceStore(path, 'owner');
  const wakie = ws.wakies()[0];
  ws.updateWakie(wakie.id, {
    ...wakie,
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
  ws.bindThread('new', wakie.id, 'New');
  ws.close();
  const reopened = new WorkspaceStore(path, 'owner');
  cleanup.push(() => reopened.close());
  expect(reopened.requireThread('old').learningContainerId).toBeNull();
  expect(reopened.requireThread('new').learningContainerId).toBe('research');
  expect(reopened.wakie(wakie.id)).toMatchObject({
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
});

it('selects only owned web threads and binds the configured channel Wakie before its first run', () => {
  const { ws, wakie } = fixture();
  ws.updateWakie(wakie.id, {
    ...wakie,
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
  ws.bindThread('web', wakie.id, 'Web');
  const select = learningSelector(ws, wakie.id);
  const user = { id: 'owner', name: 'Owner' };
  expect(
    select({ surface: 'web', user, agentId: wakie.id, input: input('web') }),
  ).toBe('research');
  expect(() =>
    select({ surface: 'web', user, agentId: wakie.id, input: input('unknown') }),
  ).toThrow();
  expect(
    select({
      surface: 'channel',
      user,
      agentId: wakie.id,
      input: input('slack'),
    }),
  ).toBe('research');
  expect(ws.requireThread('slack', wakie.id).learningContainerId).toBe(
    'research',
  );
  expect(() =>
    select({
      surface: 'channel',
      user: null,
      agentId: wakie.id,
      input: input('unauthorized'),
    }),
  ).toThrow();
  expect(() =>
    select({
      surface: 'web',
      user: { id: 'other', name: 'Other' },
      agentId: wakie.id,
      input: input('web'),
    }),
  ).toThrow();
  const other = ws.createWakie(wakie.spaceId, 'Other', 'Other role', true, true);
  expect(() =>
    select({
      surface: 'channel',
      user,
      agentId: other.id,
      input: input('wrong-wakie'),
    }),
  ).toThrow();
  expect(() =>
    select({ surface: 'web', user, agentId: other.id, input: input('web') }),
  ).toThrow();
  expect(ws.conversations()).toHaveLength(2);
});

it('rejects invalid container IDs and delivery without a container', () => {
  const { ws, wakie } = fixture();
  for (const learningContainerId of [
    '',
    'Upper',
    'two--hyphens',
    '-leading',
    'trailing-',
    'a'.repeat(65),
  ]) {
    expect(() =>
      ws.updateWakie(wakie.id, { ...wakie, learningContainerId }),
    ).toThrow();
  }
  expect(() =>
    ws.updateWakie(wakie.id, {
      ...wakie,
      learningContainerId: null,
      skillDeliveryEnabled: true,
    }),
  ).toThrow();
  expect(ws.wakie(wakie.id)?.learningContainerId).toBeNull();
});
