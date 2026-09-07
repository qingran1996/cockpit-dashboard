import assert from 'node:assert/strict'
import test from 'node:test'

test('provides dense first-level operating data for water power and steam', async () => {
  const { dashboardData } = await import('../src/data/dashboard.js')

  assert.deepEqual(dashboardData.water.summary.map((item) => item.label), ['今日用水', '实时流量', '平均压力', '漏损率'])
  assert.equal(dashboardData.water.districts.length, 3)
  assert.equal(dashboardData.water.meterHealth.online, 38)
  assert.match(dashboardData.water.alert, /二区压力/)
  assert.deepEqual(dashboardData.water.terminal.map((item) => item.label), ['管网健康', '夜间基流', '单位水耗'])

  assert.deepEqual(dashboardData.power.summary.map((item) => item.label), ['实时负荷', '最大需量', '功率因数', '频率'])
  assert.equal(dashboardData.power.transformers.length, 3)
  assert.equal(dashboardData.power.transformers[1].tone, 'warning')
  assert.ok(dashboardData.power.transformers.every((item) => /（.+）/.test(item.name)), 'transformer rows must identify their served equipment')
  assert.equal(dashboardData.power.quality.value, '2.8')
  assert.deepEqual(dashboardData.power.terminal.map((item) => item.label), ['供电可用率', '在线电表', '需量利用率'])

  assert.deepEqual(dashboardData.steam.summary.map((item) => item.label), ['实时流量', '今日用汽量', '供汽压力', '供汽温度'])
  assert.equal(dashboardData.steam.boilerStates.length, 4)
  assert.equal(dashboardData.steam.unitCost, '186')
  assert.match(dashboardData.steam.alert, /压降/)

  for (const resource of [dashboardData.water, dashboardData.power]) {
    assert.equal(resource.summary.length, 4)
    assert.ok(resource.summary.every((item) => item.comparisons?.length === 2), 'every side-panel KPI must show yesterday and month comparisons')
  }

  assert.deepEqual(dashboardData.water.operations.map((item) => item.label), ['在线水表', '夜间基流', '漏损异常', '二区压力接近高限'])
  assert.deepEqual(dashboardData.steam.balance.map((item) => item.label), ['锅炉出口', '用户端', '供需差', '热损失'])
  assert.deepEqual(dashboardData.steam.summary.slice(2).map((item) => item.delta), ['+0.03', '+2'])
  assert.equal(dashboardData.steam.unitCostDelta, '+8')
  assert.deepEqual(dashboardData.steam.alerts.map((item) => item.meta), ['较昨日 -1', '持续 12 分钟'])
})

test('uses approved first-level footer totals and engineering units', async () => {
  const { dashboardData } = await import('../src/data/dashboard.js')
  assert.deepEqual(
    dashboardData.bottomMetrics.map(({ label, value, unit }) => [label, value, unit]),
    [
      ['今日总用水', '986.2', 't'],
      ['今日总用电', '128.6', 'MWh'],
      ['今日总蒸汽', '326.4', 't'],
      ['综合能耗', '82.6', 'tce'],
      ['告警数量', '3', '条'],
    ],
  )

  assert.ok(dashboardData.bottomMetrics.every((item) => item.comparisons?.length === 2), 'every footer metric must show two comparison readings')
})
