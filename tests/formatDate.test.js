import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDashboardDate } from '../src/utils/formatDate.js'

test('formats dashboard time in Chinese', () => {
  const value = formatDashboardDate(new Date(2025, 5, 18, 14, 30, 45))
  assert.equal(value, '2025-06-18 14:30:45 星期三')
})
