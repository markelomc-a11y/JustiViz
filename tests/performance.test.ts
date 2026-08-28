import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateFps } from '../src/utils/fps';

test('FPS monitor calculates sampled frame rate', () => {
  assert.equal(calculateFps(60, 1000), 60);
  assert.equal(calculateFps(30, 500), 60);
  assert.equal(calculateFps(0, 1000), 0);
  assert.equal(calculateFps(60, 0), 0);
});
