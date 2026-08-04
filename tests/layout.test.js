import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateViewportScale } from '../src/utils/layout.js'

test('1920x1080 uses a scale of 1', () => {
  assert.deepEqual(calculateViewportScale(1920, 1080), { scale: 1, left: 0, top: 0 })
})

test('ultrawide viewport centers the 16:9 canvas', () => {
  assert.deepEqual(calculateViewportScale(2560, 1080), { scale: 1, left: 320, top: 0 })
})

test('laptop viewport keeps the complete canvas visible', () => {
  assert.deepEqual(calculateViewportScale(1440, 900), { scale: 0.75, left: 0, top: 45 })
})
