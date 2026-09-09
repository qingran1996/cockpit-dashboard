import test from 'node:test'
import assert from 'node:assert/strict'
import { energyBills, totalCost, lines, batches, forecast, dailyBudget, tariffs, shiftScenario, resolveCostPage } from '../src/data/costDashboardData.js'

test('demonstration bills reconcile through plant, lines and friction-material batches', () => {
  energyBills.forEach(e => assert.equal(e.quantity * e.rate, e.cost))
  assert.equal(totalCost, 44000)
  assert.equal(energyBills.reduce((s, e) => s + e.previous, 0), 41080)
  assert.equal(lines.reduce((s, l) => s + l.total, 0), totalCost)
  for (const l of lines) {
    assert.equal(l.direct + l.shared, l.total)
    assert.equal(3400 * l.share, l.shared)
    assert.equal(l.total / l.output, l.unitCost)
  }
  for (const b of batches) {
    assert.equal(b.direct + b.shared, b.total)
    assert.equal(lines[0].shared * b.output / lines[0].output, b.shared)
    assert.equal(b.total / b.output, b.unitCost)
  }
  assert.equal(batches.reduce((s, b) => s + b.total, 0), lines[0].total)
  assert.equal(batches.reduce((s, b) => s + b.total - b.plan, 0), 840)
})

test('forecast summary and load-shifting figures remain consistent with the proposal', () => {
  assert.equal(forecast.reduce((s, v) => s + v, 0), 308600)
  assert.equal(dailyBudget * forecast.length - forecast.reduce((s, v) => s + v, 0), 6400)
  assert.equal(forecast.filter(v => v > dailyBudget).length, 3)
  assert.equal(tariffs.reduce((s, t) => s + t.quantity * t.rate, 0), 19200)
  const adjusted = tariffs.map((t, i) => ({ ...t, quantity: t.quantity + (i === 0 ? 2000 : i === 2 ? -2000 : 0) }))
  assert.equal(adjusted.reduce((s, t) => s + t.quantity, 0), 24000)
  assert.equal(adjusted.reduce((s, t) => s + t.quantity * t.rate, 0), 18000)
  assert.equal(shiftScenario.quantity * shiftScenario.priceDifference, shiftScenario.saving)
  assert.equal(shiftScenario.saving * shiftScenario.applicableDays, 300000)
})

test('cost routes support direct entry and trailing slash without capturing existing pages', () => {
  for (const key of ['overview', 'allocation', 'forecast', 'optimization']) {
    assert.equal(resolveCostPage(`/cost-${key}`).key, key)
    assert.equal(resolveCostPage(`/cost-${key}/`).key, key)
  }
  for (const route of ['/', '/unity-dashboard', '/rotary-kiln', '/test1', '/cost-unknown']) assert.equal(resolveCostPage(route), undefined)
})
