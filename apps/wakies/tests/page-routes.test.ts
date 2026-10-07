import { afterEach, expect, it } from 'vitest';
import { Store } from '../src/server/store.js';
import { WorkspaceStore } from '../src/server/workspace.js';
import { Platform } from '../src/server/platform.js';
import { Runner } from '../src/server/runner.js';
import { createApp } from '../src/server/app.js';
const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((fn) => fn()));
function fixture(ownerToken?: string) {
  const store = new Store(':memory:');
  const ws = new WorkspaceStore(':memory:', 'owner');
  cleanup.push(() => {
    store.close();
    ws.close();
  });
  const config = { mode: 'live' as const, baseUrl: 'https://example.com' };
  const platform = new Platform(store, ws, {
    baseUrl: config.baseUrl,
    voiceName: 'marin',
    slackUsers: [],
    runtimeUrl: '',
  });
  return {
    ws,
    app: createApp({
      store,
      runner: new Runner(store, config),
      config,
      platform,
      ownerToken,
    }),
  };
}
const request = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

it('saves Learning settings through the owner API and rejects malformed container IDs', async () => {
  const { ws, app } = fixture();
  const wakie = ws.wakies()[0];
  const body = {
    name: wakie.name,
    instructions: wakie.instructions,
    researchAllowed: true,
    memoryAllowed: true,
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  };
  expect(
    (await app.request(`/api/wakies/${wakie.id}`, request(body, 'PUT'))).status,
  ).toBe(200);
  expect(ws.wakie(wakie.id)).toMatchObject({
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
  expect(
    (
      await app.request(
        `/api/wakies/${wakie.id}`,
        request({ ...body, learningContainerId: 'bad--id' }, 'PUT'),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await app.request(
        `/api/wakies/${wakie.id}`,
        request({ ...body, learningContainerId: null }, 'PUT'),
      )
    ).status,
  ).toBe(400);
  const created = await app.request(
    '/api/wakies',
    request({ ...body, spaceId: wakie.spaceId }),
  );
  expect(created.status).toBe(201);
  expect(await created.json()).toMatchObject({
    learningContainerId: 'research',
    skillDeliveryEnabled: true,
  });
  const privateApp = fixture('owner-secret');
  expect(
    (
      await privateApp.app.request(
        `/api/wakies/${privateApp.ws.wakies()[0].id}`,
        request(body, 'PUT'),
      )
    ).status,
  ).toBe(401);
});
it('supports manual pages without credentials and returns validation, scope and conflict statuses', async () => {
  const { ws, app } = fixture();
  const space = ws.spaces()[0].id;
  const path = `/api/spaces/${space}/pages`;
  expect((await app.request(path, request({ title: '' }))).status).toBe(400);
  expect((await app.request('/api/spaces/missing/pages')).status).toBe(404);
  const result = await app.request(path, request({ title: 'Document' }));
  expect(result.status).toBe(201);
  const page = await result.json();
  expect(
    (
      await app.request(
        `${path}/${page.id}`,
        request({ expectedRevision: 1, content: 'First' }, 'PATCH'),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await app.request(
        `${path}/${page.id}`,
        request({ expectedRevision: 1, content: 'Stale' }, 'PATCH'),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await app.request(
        `${path}/${page.id}/conversation`,
        request({ wakieId: ws.wakies()[0].id }),
      )
    ).status,
  ).toBe(503);
  expect(ws.pages.get(space, page.id).content).toBe('First');
  expect(
    (
      await app.request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
  ).toBe(400);
});
it('keeps page routes behind owner authentication and browser origin checks', async () => {
  const { ws, app } = fixture('owner-secret');
  const path = `/api/spaces/${ws.spaces()[0].id}/pages`;
  expect((await app.request(path)).status).toBe(401);
  expect(
    (
      await app.request(path, {
        headers: { Authorization: 'Bearer owner-secret' },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await app.request(path, {
        ...request({ title: 'Cross-origin' }),
        headers: {
          Authorization: 'Bearer owner-secret',
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
      })
    ).status,
  ).toBe(403);
});

it('saves reviewed drafts once and rechecks the Wakie’s Space access', async () => {
  const { ws, app } = fixture();
  const wakie = ws.wakies()[0];
  ws.bindThread('review-thread', wakie.id, 'Review');
  const draft = {
    title: 'Launch brief',
    content: 'A reviewed draft.',
    spaceId: wakie.spaceId,
    toolCallId: 'review-1',
  };
  const path = '/api/conversations/review-thread/reviewed-page';
  const first = await app.request(path, request(draft));
  expect(first.status).toBe(201);
  const saved = await first.json();
  const retry = await app.request(path, request(draft));
  expect((await retry.json()).id).toBe(saved.id);
  expect(ws.pages.list(wakie.spaceId)).toHaveLength(1);
  const other = ws.createSpace('Other', '');
  ws.updateWakie(wakie.id, { ...wakie, spaceId: other.id, spaceIds: [other.id] });
  expect((await app.request(path, request(draft))).status).toBe(403);
  expect(ws.pages.list(wakie.spaceId)).toHaveLength(1);
});

it('restores review receipts through the owner API with current thread and Space authorization', async () => {
  const { ws, app } = fixture('owner-secret');
  const wakie = ws.wakies()[0];
  ws.bindThread('review-restore', wakie.id, 'Review');
  const base = '/api/conversations/review-restore/reviewed-page';
  const headers = { Authorization: 'Bearer owner-secret' };
  expect((await app.request(`${base}/call`)).status).toBe(401);
  expect(
    await (await app.request(`${base}/call`, { headers })).json(),
  ).toBeNull();
  const saved = ws.pages.createReviewed(
    wakie.spaceId,
    { title: 'Saved', content: 'Evidence' },
    'review-restore',
    'call',
  );
  expect(
    await (await app.request(`${base}/call`, { headers })).json(),
  ).toMatchObject({ id: saved.id, spaceId: wakie.spaceId });
  ws.bindThread('other-thread', wakie.id, 'Other');
  expect(
    await (
      await app.request('/api/conversations/other-thread/reviewed-page/call', {
        headers,
      })
    ).json(),
  ).toBeNull();
  expect(
    (
      await app.request(
        '/api/conversations/missing-thread/reviewed-page/call',
        { headers },
      )
    ).status,
  ).not.toBe(200);
  const other = ws.createSpace('Other', '');
  ws.updateWakie(wakie.id, { ...wakie, spaceId: other.id, spaceIds: [other.id] });
  expect((await app.request(`${base}/call`, { headers })).status).toBe(403);
});
