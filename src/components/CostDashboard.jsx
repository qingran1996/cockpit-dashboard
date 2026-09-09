import { EChart } from './EChart.jsx'
import { useViewportScale } from '../hooks/useViewportScale.js'
import { costPages, energyBills, totalCost, lines, batches, forecast, forecastDays, dailyBudget, tariffs, shiftScenario, money } from '../data/costDashboardData.js'

const colors = ['#32a7ff', '#25dfc3', '#ffa94d', '#a58bff']
function Panel({ title, meta, children, className = '' }) {
  return <section className={`cost-panel ${className}`}><header><h2>{title}</h2><span>{meta}</span></header><div className="cost-panel-body">{children}</div></section>
}
function Kpi({ label, value, unit = '元', detail, tone = '' }) {
  return <article className={`cost-kpi ${tone}`}><span>{label}</span><div><strong>{value}</strong><small>{unit}</small></div><p>{detail}</p></article>
}
function Legend({ items }) {
  return <div className="cost-legend">{items.map((item, i) => <span key={item}><i style={{ background: colors[i] }} />{item}</span>)}</div>
}
function Chart({ labels, series, unit = '元', horizontal = false }) {
  const category = { type: 'category', data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: '#204658' } }, axisLabel: { color: '#a9c5d3', fontSize: 14, margin: 15 } }
  const value = { type: 'value', name: unit, nameTextStyle: { color: '#8dadbf', fontSize: 13 }, axisLabel: { color: '#8dadbf', fontSize: 13 }, splitLine: { lineStyle: { color: '#163343', type: 'dashed' } } }
  const option = { animation: false, color: colors, textStyle: { fontFamily: 'Microsoft YaHei, sans-serif' }, tooltip: { trigger: 'axis', backgroundColor: '#071c2e', borderColor: '#28667d', textStyle: { color: '#e4f7ff' } }, grid: { left: horizontal ? 114 : 74, right: horizontal ? 84 : 30, top: 38, bottom: 40 }, xAxis: horizontal ? value : category, yAxis: horizontal ? category : value, series: series.map(s => ({ type: 'bar', barMaxWidth: 36, itemStyle: { borderRadius: [3, 3, 0, 0] }, ...s })) }
  return <EChart option={option} ariaLabel={`${labels.join('、')}的${series.map(s => s.name).join('、')}，单位${unit}`} className="cost-chart" />
}
function Table({ headers, rows, total }) {
  return <table className="cost-table"><thead><tr>{headers.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>{total && <tfoot><tr>{total.map((cell, j) => <td key={j}>{cell}</td>)}</tr></tfoot>}</table>
}
function Note({ children }) { return <p className="cost-note">{children}</p> }
function Overview() {
  return <>
    <div className="cost-kpis"><Kpi label="全厂当日能源费用" value="44,000" detail="统计日 2026.09.07 · 按分项费用汇总" /><Kpi label="较前日费用变化" value="+2,920" detail="前日 41,080 元 · 增幅 7.1%" tone="amber" /><Kpi label="最大费用项 · 蒸汽" value="50.9" unit="%" detail="当日蒸汽费用 22,400 元" tone="amber" /><Kpi label="当日合格产量" value="36" unit="t" detail="摩擦材料 20 t / 复合材料 16 t" tone="green" /></div>
    <div className="cost-overview-top">
      <Panel title="当日费用构成" meta="按费用占比">
        <div className="cost-donut-layout"><div className="cost-donut"><div><span>全厂合计 / 元</span><strong>44,000</strong><small>电 · 汽 · 水</small></div></div><div className="cost-breakdown">{energyBills.map(e => <article key={e.name}><span><i style={{ background: e.color }} />{e.name}<em>{(e.cost / totalCost * 100).toFixed(1)}%</em></span><strong style={{ color: e.color }}>{money(e.cost)}<small>元</small></strong><div className="cost-track"><b style={{ width: `${e.cost / totalCost * 100}%`, background: e.color }} /></div></article>)}</div></div>
        <Note>蒸汽为最大费用项，可进一步核查产线与工序明细。</Note>
      </Panel>
      <Panel title="分项费用对比" meta="2026.09.06 / 09.07"><Legend items={['前日费用', '当日费用']} /><Chart labels={energyBills.map(e => e.name)} series={[{ name: '前日费用', data: energyBills.map(e => e.previous) }, { name: '当日费用', data: energyBills.map(e => e.cost), label: { show: true, position: 'top', color: '#ccecf7', formatter: p => money(p.value) } }]} /></Panel>
      <Panel title="费用增量来源" meta="较前日 +2,920 元"><div className="cost-delta-list">{[energyBills[1], energyBills[0], energyBills[2]].map((e, i) => <article key={e.name}><span className="cost-rank">0{i + 1}</span><div><h3>{e.name}费用增加</h3><span>占增量 {((e.cost - e.previous) / 2920 * 100).toFixed(1)}%</span></div><strong>+{money(e.cost - e.previous)}<small>元</small></strong></article>)}</div><div className="cost-insight"><span>核查方向</span><p>前日分项为演示拆分。先核查用量与价格，再结合产量及工况定位原因。</p></div></Panel>
    </div>
    <div className="cost-overview-bottom">
      <Panel title="全厂能源账单" meta="计量用量 × 适用单价"><Table headers={['能源类型', '当日用量', '单价', '当日费用 / 元', '费用占比']} rows={energyBills.map(e => [e.name, `${money(e.quantity)} ${e.unit}`, `${e.rate.toFixed(2)} 元/${e.unit}`, money(e.cost), `${(e.cost / totalCost * 100).toFixed(1)}%`])} total={['费用合计', '不同计量单位不相加', '按分项费用汇总', '44,000', '100%']} /><Note>电价采用当日加权均价。基本电费等其他账单项目未计入本示例。</Note></Panel>
      <Panel title="费用归集到产线" meta="直接计量 + 公用分摊"><div className="cost-line-summary">{lines.map((line, i) => <article key={line.name}><span>0{i + 1} / {line.name}</span><strong>{money(line.total)}<small>元</small></strong><div className="cost-track"><b style={{ width: `${line.total / totalCost * 100}%`, background: colors[i] }} /></div><p>直接 {money(line.direct)} 元 <em>公用分摊 {money(line.shared)} 元</em></p></article>)}</div><Note>两条产线归集费用之和与全厂账单一致。</Note></Panel>
    </div>
  </>
}
function Allocation() {
  return <>
    <div className="cost-kpis"><Kpi label="产线归集总费用" value="44,000" detail="与全厂账单一致 · 差额 0 元" /><Kpi label="直接计量能源费" value="40,600" detail="按产线所属测点归集" /><Kpi label="公用工程分摊池" value="3,400" detail="摩擦材料 60% / 复合材料 40%" tone="amber" /><Kpi label="摩擦材料吨产品费用" value="1,482" unit="元/t" detail="29,640 元 ÷ 20 t 合格产量" tone="green" /></div>
    <div className="cost-allocation-top"><Panel title="全厂费用归集路径" meta="2026.09.07"><div className="cost-flow"><div className="cost-flow-source"><span>全厂能源账单</span><strong>44,000<small>元</small></strong><p>直接 40,600 + 公用 3,400</p></div><div className="cost-flow-branches">{lines.map((l, i) => <div className="cost-flow-line" key={l.name}><i>0{i + 1}</i><div><span>{l.name}</span><p>直接 {money(l.direct)} + 分摊 {money(l.shared)}</p></div><strong>{money(l.total)}<small>元</small></strong></div>)}</div></div><div className="cost-reconcile"><span>分摊前后守恒</span><strong>29,640 + 14,360 = 44,000 元</strong><b>校核一致</b></div></Panel><Panel title="产线成本结构" meta="费用 / 元"><Legend items={['直接能源费', '公用分摊']} /><Chart horizontal labels={lines.map(l => l.name).reverse()} series={[{ name: '直接能源费', stack: 'cost', data: lines.map(l => l.direct).reverse() }, { name: '公用分摊', stack: 'cost', data: lines.map(l => l.shared).reverse(), label: { show: true, position: 'right', color: '#ccf5ff', formatter: p => money(p.value) } }]} /><Note>公用工程费只分配一次，60% / 40% 为本例假设。</Note></Panel></div>
    <div className="cost-allocation-bottom"><Panel title="摩擦材料 · 批次成本账本" meta="同产品 / 同日 / 同成本边界"><Table headers={['核算指标', '批次 A01', '批次 A02', '产线合计']} rows={[
      ['合格产量 / t', '12', '8', '20'], ['直接能源费 / 元', '15,960', '11,640', '27,600'], ['公用分摊 / 元', '1,224', '816', '2,040'], ['实际总费用 / 元', '17,184', '12,456', '29,640'], ['APS 计划费用 / 元', '16,800', '12,000', '28,800'], ['单位费用 / 元/t', '1,432', '1,557', '1,482'],
    ]} /><Note>批次分摊依据：合格产量 12 : 8；1,482 元/t 由总费用除以总产量计算。</Note></Panel><Panel title="批次计划与实际" meta="摩擦材料产线"><Legend items={['APS 计划', '实际费用']} /><Chart labels={batches.map(b => `批次 ${b.name}`)} series={[{ name: 'APS 计划', data: batches.map(b => b.plan) }, { name: '实际费用', data: batches.map(b => b.total) }]} /><div className="cost-inline-callout"><span>产线较计划增加</span><strong>+840<small>元</small></strong><b>+2.9%</b></div></Panel></div>
  </>
}
function Forecast() {
  return <>
    <div className="cost-kpis"><Kpi label="未来 7 日预计能源费用" value="308,600" detail="预测区间 2026.09.08 — 09.14" /><Kpi label="同期费用预算" value="315,000" detail="日预算 45,000 元 × 7 日" /><Kpi label="整体预算结余" value="6,400" detail="预计费用低于预算 2.0%" tone="green" /><Kpi label="高于日预算的日期" value="3" unit="天" detail="09/10 · 09/11 · 09/13" tone="amber" /></div>
    <div className="cost-forecast-top"><Panel title="未来七日费用与预算" meta="情景预测 · 元/日"><Legend items={['预计费用', '日预算', '超日预算']} /><Chart labels={forecastDays} series={[{ name: '预计费用', data: forecast.map(v => ({ value: v, itemStyle: { color: v > dailyBudget ? '#ffa94d' : '#32a7ff' } })), label: { show: true, position: 'top', color: '#e2f3fa', backgroundColor: '#071c2e', padding: [2, 4], formatter: p => money(p.value) } }, { name: '日预算', type: 'line', data: forecast.map(() => dailyBudget), symbol: 'none', lineStyle: { type: 'dashed', width: 2 } }]} /><Note>周总额及 09/10 取自方案，其余日分布为静态演示补充，不代表模型输出。</Note></Panel><Panel title="重点日期 · 09 / 10" meta="预算压力"><div className="cost-focus-number"><span>预计能源费用</span><strong>47,000<small>元</small></strong><p>较日预算增加 <b>2,000 元</b></p></div><div className="cost-focus-ratio"><span>日预算占用</span><strong>104.4%</strong></div><div className="cost-track"><b style={{ width: '100%', background: '#ffa94d' }} /></div><div className="cost-insight"><span>排产复核重点</span><p>核查计划产量、产品单耗与峰段用电安排，计划调整后重算费用。</p></div></Panel></div>
    <div className="cost-forecast-bottom"><Panel title="实际费用偏差对照" meta="先核查口径，再核查生产变化"><Table headers={['比较对象', '本期', '对照基准', '偏差']} rows={[
      ['全厂日费用', '44,000 元', '前日 41,080 元', '+7.1%'], ['摩擦材料产线费用', '29,640 元', '计划 28,800 元', '+2.9%'], ['摩擦材料单位费用', '1,482 元/t', '同产品历史 1,450 元/t', '+2.2%'], ['复合材料单位费用', '897.5 元/t', '同产品预算 880 元/t', '+2.0%'],
    ]} /><Note>不同产品的单位费用分别对照同产品基准，避免跨产品直接比较。</Note></Panel><Panel title="预测依据与核查顺序" meta="演示流程"><ol className="cost-steps"><li><b>01</b><div><strong>确认计划边界</strong><p>订单、批次、起止时间与合格产量</p></div></li><li><b>02</b><div><strong>匹配计价口径</strong><p>能源单价、生效版本与分时规则</p></div></li><li><b>03</b><div><strong>核查偏差来源</strong><p>产量、价格、单位用量与启停待机</p></div></li></ol><Note>预测区间与误差需经同产品历史批次回测后确定。</Note></Panel></div>
  </>
}
function Optimization() {
  return <>
    <div className="cost-kpis"><Kpi label="移峰预计日节费" value="1,200" detail="2,000 kWh × 0.60 元/kWh" tone="green" /><Kpi label="情景日费用降幅" value="2.7" unit="%" detail="原费用 44,000 元 / 调整后 42,800 元" tone="green" /><Kpi label="允许移峰电量" value="2,000" unit="kWh" detail="峰段移至谷段 · 总用电量不变" /><Kpi label="年度节费情景" value="30" unit="万元" detail="按 250 个适用日测算 · 非收益承诺" tone="amber" /></div>
    <div className="cost-optimization-top"><Panel title="分时电价与移峰路径" meta="演示单价 / 元·kWh⁻¹"><div className="cost-tariffs">{tariffs.map(t => <article key={t.name} style={{ '--tariff-color': t.color }}><span>{t.name}</span><strong>{t.rate.toFixed(2)}</strong><small>元/kWh</small><div>原用电量 {money(t.quantity)} kWh</div><b>原电费 {money(t.quantity * t.rate)} 元</b></article>)}</div><div className="cost-shift-strip"><span>谷段 <b>+2,000 kWh</b></span><div>峰段移至谷段 <strong>←</strong></div><span>峰段 <b>−2,000 kWh</b></span></div><Note>保留价格生效时间与版本。本例只改变用电时段，不改变总用量和产量。</Note></Panel><Panel title="移峰前后费用对比" meta="总量不变 · 费用 / 元"><Legend items={['移峰前', '移峰后']} /><Chart labels={['电费', '全厂费用']} series={[{ name: '移峰前', data: [19200, totalCost] }, { name: '移峰后', data: [18000, totalCost - shiftScenario.saving], label: { show: true, position: 'top', color: '#ccecf7', formatter: p => money(p.value) } }]} /><Note>蒸汽 22,400 元、水 2,400 元保持不变。</Note></Panel></div>
    <div className="cost-optimization-bottom"><Panel title="移峰电费复算" meta="总电量 24,000 kWh"><Table headers={['时段', '单价 / 元·kWh⁻¹', '原电量 / kWh', '调整后 / kWh', '调整后电费 / 元']} rows={tariffs.map((t, i) => { const q = t.quantity + (i === 0 ? 2000 : i === 2 ? -2000 : 0); return [t.name, t.rate.toFixed(2), money(t.quantity), money(q), money(q * t.rate)] })} total={['合计', '按时段匹配', '24,000', '24,000', '18,000']} /><Note>原电费 19,200 元 − 调整后 18,000 元 = 预计节费 1,200 元。</Note></Panel><Panel title="措施实施与收益复核" meta="条件情景 · 待验证"><ol className="cost-steps"><li><b>01</b><div><strong>先满足生产约束</strong><p>交期、工艺连续性与设备能力满足后调整</p></div></li><li><b>02</b><div><strong>由授权人员确认排产</strong><p>按既有生产流程执行，记录调整时间与批次</p></div></li><li><b>03</b><div><strong>同口径复核实际节费</strong><p>剔除产量与价格影响，同一措施不重复累计</p></div></li></ol><Note>未计投入及增量运维费用，本示例不计算投资回收期。</Note></Panel></div>
  </>
}
const views = { overview: Overview, allocation: Allocation, forecast: Forecast, optimization: Optimization }
export function CostDashboardPage({ page }) {
  const viewport = useViewportScale()
  const View = views[page.key]
  return <div className="cost-shell"><main className="cost-stage" style={{ transform: `scale(${viewport.viewportWidth / 1920}, ${viewport.viewportHeight / 1080})` }}>
    <header className="cost-header"><div className="cost-brand"><i />大塚化学<span>能源经营分析</span></div><div className="cost-title"><h1>{page.title}</h1><p>{page.english}</p></div><div className="cost-header-right"><span>静态演示</span><button className="dashboard-header__return-scene" onClick={() => console.log('UE_DASHBOARD:{"type":"dashboard.close"}')}><span aria-hidden="true">↗</span>返回场景</button></div></header>
    <nav className="cost-nav" aria-label="费用展示页面"><div>{costPages.map((p, i) => <a key={p.key} href={p.path} aria-current={p.key === page.key ? 'page' : undefined}><small>0{i + 1}</small>{p.title}</a>)}</div><span>核算日期 <b>2026.09.07</b><i />币种 CNY / 人民币</span></nav>
    <div className="cost-content"><View /></div>
    <footer className="cost-footer"><span><i />演示数据，非现场实绩；预测及节费为情景测算。</span><span>大塚综合数字孪生平台 <b>ENERGY COST CENTER</b><em>{String(costPages.indexOf(page) + 1).padStart(2, '0')} / 04</em></span></footer>
  </main></div>
}
