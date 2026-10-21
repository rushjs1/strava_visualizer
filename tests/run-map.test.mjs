import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { decodeRoute, routeBounds } from '../lib/run-map.ts';

const source = readFileSync(new URL('../lib/strava.ts', import.meta.url), 'utf8');
function stravaModule(fetchImpl) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const require = (id) => {
    if (id === 'server-only') return {};
    if (id === '@/lib/mock-data') return { mockActivities: [], mockAthlete: null };
    if (id === '@/lib/strava-oauth') return { getValidStoredAccessToken: async () => 'test-token' };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  new Function('exports', 'require', 'fetch', output)(exports, require, fetchImpl);
  return exports;
}

test('decodes a known encoded polyline into longitude/latitude order', () => {
  assert.deepEqual(decodeRoute('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
});
test('missing, truncated, malformed, and single-point routes do not crash the map', () => {
  for (const value of [null, '', '_', '!!', '??', '_p~iF~ps|U_']) assert.deepEqual(decodeRoute(value), []);
});
test('bounds include every route and handle an empty collection', () => {
  assert.equal(routeBounds([]), null);
  assert.deepEqual(routeBounds([[[-87, 39], [-86, 40]], [[-85, 38]]]), [[-87, 38], [-85, 40]]);
});
test('history continues after a full page containing zero runs', async () => {
  const urls = [];
  const api = stravaModule(async (url) => {
    urls.push(url);
    return { ok: true, json: async () => urls.length === 1
      ? Array.from({ length: 200 }, (_, id) => ({ id, sport_type: 'Ride' }))
      : [{ id: 201, sport_type: 'TrailRun', map: { summary_polyline: 'route' } }, { id: 202, sport_type: 'VirtualRun' }] };
  });
  const first = await api.fetchRunMapPage(1, 1234567890);
  assert.equal(first.nextPage, 2);
  assert.deepEqual(first.activities, []);
  const second = await api.fetchRunMapPage(2, 1234567890);
  assert.equal(second.nextPage, null);
  assert.equal(second.activities.length, 2);
  assert.equal(second.activities[0].summaryPolyline, 'route');
  assert.equal(second.activities[1].summaryPolyline, null);
  assert.match(urls[1], /per_page=200&page=2&before=1234567890/);
});
test('Strava failure propagates instead of silently replacing history with samples', async () => {
  const api = stravaModule(async () => ({ ok: false, status: 429, text: async () => 'Rate limit exceeded' }));
  await assert.rejects(api.fetchRunMapPage(2, 1234567890), /429/);
});
