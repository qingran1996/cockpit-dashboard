const metric = (label, value, unit, delta) => ({ label, value, unit, delta })
const diagnostic = (label, value, status) => ({ label, value, status })

const views = {
  '水资源详情': {
    总览: {
      metrics: [metric('今日用水', '986.2', 't', '较昨日 +3.2%'), metric('实时流量', '42.8', 'm³/h', '计划区间内'), metric('平均压力', '0.48', 'MPa', '稳定'), metric('管网漏损率', '5.9', '%', '目标 ≤ 6.5%')],
      diagnostics: [diagnostic('供水可用率', '99.95%', '稳定'), diagnostic('在线阀门', '26 / 27', '1台检修'), diagnostic('压力合格率', '98.7%', '达标'), diagnostic('夜间基流', '18.4 m³/h', '偏高'), diagnostic('单位水耗', '2.81 t/万元', '待优化'), diagnostic('漏损预算', '-0.6 pp', '预算内')],
      chart: { type: 'line', title: '24小时用水流量', unit: 'm³/h', labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'], values: [31, 28, 34, 39, 47, 42, 51, 45, 38], secondary: [28, 26, 31, 36, 41, 39, 46, 42, 35] },
      context: { title: '供水综合态势', caption: '总量、压力与损耗保持联动监视', items: ['高峰 51 m³/h', '压差 0.09 MPa', '漏损预算内'] },
    },
    分区: {
      metrics: [metric('最大用水分区', '一区', '', '占比 46%'), metric('一区用水', '456.2', 't', '较昨日 +2.6%'), metric('二区用水', '312.8', 't', '压力需关注'), metric('区域偏差', '7.4', '%', '目标 ≤ 8%')],
      diagnostics: [diagnostic('一区压力', '0.46 MPa', '正常'), diagnostic('二区压力', '0.51 MPa', '关注'), diagnostic('三区压力', '0.47 MPa', '正常'), diagnostic('行政用水', '71.6 t', '平稳'), diagnostic('分区计量率', '97.5%', '达标'), diagnostic('水力平衡差', '3.1%', '正常')],
      chart: { type: 'bar', title: '分区用水结构', unit: 't', labels: ['一区', '二区', '三区', '行政'], values: [456.2, 312.8, 145.6, 71.6] },
      context: { title: '分区水力平衡', caption: '按区域识别流量偏差和异常压力', items: ['一区占比 46%', '二区高限预警', '平衡差 3.1%'] },
    },
    管网: {
      metrics: [metric('主管压力', '0.52', 'MPa', '市政进水'), metric('末端压力', '0.43', 'MPa', '实验中心'), metric('最大压差', '0.09', 'MPa', '目标 ≤ 0.12'), metric('在线节点', '18', '/ 19', '1节点检修')],
      diagnostics: [diagnostic('压力合格率', '98.7%', '达标'), diagnostic('阀门开度', '72%', '正常'), diagnostic('泵组频率', '43 Hz', '节能'), diagnostic('流速峰值', '1.8 m/s', '正常'), diagnostic('异常压降', '1处', '关注'), diagnostic('管龄风险', '低', '正常')],
      chart: { type: 'line', title: '管网压力趋势', unit: 'MPa', labels: ['00', '04', '08', '12', '16', '20', '24'], values: [0.46, 0.45, 0.49, 0.52, 0.48, 0.47, 0.48], secondary: [0.44, 0.44, 0.47, 0.49, 0.46, 0.45, 0.46], threshold: 0.55 },
      context: { title: '供水管网运行', caption: '沿主管到末端追踪压力传递效率', items: ['压差 0.09 MPa', '二区临近高限', '泵组节能运行'] },
    },
    告警: {
      metrics: [metric('活跃告警', '2', '条', '重要 1 条'), metric('今日新增', '5', '条', '已关闭 3 条'), metric('平均响应', '8.4', 'min', '优于目标'), metric('闭环率', '96.8', '%', '本月累计')],
      diagnostics: [diagnostic('高压告警', '1条', '处理中'), diagnostic('基流异常', '1条', '待核查'), diagnostic('通信告警', '0条', '正常'), diagnostic('超时工单', '0项', '正常'), diagnostic('巡检到位', '100%', '完成'), diagnostic('风险等级', 'II级', '可控')],
      chart: { type: 'bar', title: '告警时段分布', unit: '条', labels: ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'], values: [0, 1, 2, 1, 1, 0], threshold: 3 },
      context: { title: '告警处置态势', caption: '突出高风险事件与响应闭环效率', items: ['重要 1 条', '响应 8.4 min', '闭环率 96.8%'] },
    },
  },
  '电力资源详情': {
    总览: {
      metrics: [metric('实时负荷', '85.6', 'MW', '较昨日 +4.5%'), metric('最大需量', '102.4', 'MW', '发生于 14:20'), metric('功率因数', '0.96', '', '目标 ≥ 0.95'), metric('电网频率', '50.03', 'Hz', '运行稳定')],
      diagnostics: [diagnostic('供电可用率', '99.98%', '稳定'), diagnostic('在线电表', '64 / 65', '1台离线'), diagnostic('需量利用率', '85.3%', '正常'), diagnostic('电压总谐波', '2.8%', '达标'), diagnostic('无功补偿', '6 / 8组', '已投入'), diagnostic('峰谷差', '52.6 MW', '可优化')],
      chart: { type: 'line', title: '24小时综合负荷', unit: 'MW', labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'], values: [38, 34, 49, 67, 82, 96, 78, 88, 72], secondary: [35, 31, 45, 61, 74, 85, 71, 80, 68], threshold: 110 },
      context: { title: '配电综合态势', caption: '负荷、需量与电能质量统一监视', items: ['峰值 102.4 MW', '余量 17.6 MW', '可用率 99.98%'] },
    },
    负荷: {
      metrics: [metric('当前负荷', '85.6', 'MW', '负载率 71.3%'), metric('预测峰值', '104.8', 'MW', '预计 15:10'), metric('峰谷差', '52.6', 'MW', '调峰空间大'), metric('同比变化', '+4.5', '%', '生产负荷增加')],
      diagnostics: [diagnostic('生产负荷', '61.4 MW', '主导'), diagnostic('公辅负荷', '14.8 MW', '稳定'), diagnostic('办公负荷', '5.6 MW', '正常'), diagnostic('充电负荷', '3.8 MW', '上升'), diagnostic('预测误差', '1.9%', '优良'), diagnostic('调峰潜力', '8.6 MW', '可执行')],
      chart: { type: 'line', title: '实时负荷与预测', unit: 'MW', labels: ['10', '11', '12', '13', '14', '15', '16', '17'], values: [70, 78, 86, 93, 102, 96, 91, 88], secondary: [72, 80, 88, 96, 104.8, 101, 94, 90], threshold: 110 },
      context: { title: '负荷调度分析', caption: '当前曲线叠加短时预测，支撑削峰', items: ['预测误差 1.9%', '调峰 8.6 MW', '峰值 15:10'] },
    },
    需量: {
      metrics: [metric('当前需量', '102.4', 'MW', '合同上限 120 MW'), metric('需量余量', '17.6', 'MW', '安全裕度 14.7%'), metric('控制目标', '108.0', 'MW', '策略已下发'), metric('本月峰值', '109.2', 'MW', '较上月 -2.1%')],
      diagnostics: [diagnostic('合同需量', '120 MW', '有效'), diagnostic('预测需量', '107.6 MW', '安全'), diagnostic('控制动作', '3项', '待命'), diagnostic('可中断负荷', '6.8 MW', '可用'), diagnostic('储能余量', '4.2 MWh', '充足'), diagnostic('越限风险', '低', '可控')],
      chart: { type: 'line', title: '需量控制过程', unit: 'MW', labels: ['08', '09', '10', '11', '12', '13', '14', '15'], values: [72, 78, 84, 91, 98, 102.4, 99, 96], secondary: [80, 86, 92, 98, 104, 107.6, 106, 101], threshold: 110 },
      context: { title: '合同需量控制', caption: '预测越限前联动储能与可中断负荷', items: ['合同 120 MW', '控制线 110 MW', '余量 17.6 MW'] },
    },
    电能质量: {
      metrics: [metric('电压总谐波', '2.8', '%', '限值 5.0%'), metric('电流总谐波', '4.2', '%', '正常'), metric('三相不平衡', '0.7', '%', '优良'), metric('电压偏差', '+1.6', '%', '正常')],
      diagnostics: [diagnostic('A相电压', '10.18 kV', '正常'), diagnostic('B相电压', '10.21 kV', '正常'), diagnostic('C相电压', '10.16 kV', '正常'), diagnostic('暂降事件', '0次', '今日'), diagnostic('闪变 Pst', '0.42', '达标'), diagnostic('频率偏差', '+0.03 Hz', '正常')],
      chart: { type: 'bar', title: '电压谐波频谱', unit: '%', labels: ['2次', '3次', '5次', '7次', '9次', '11次', '13次'], values: [0.6, 1.4, 2.8, 1.9, 0.8, 0.5, 0.3], threshold: 5 },
      context: { title: '电能质量画像', caption: '追踪主要谐波次数及三相平衡状态', items: ['THD 2.8%', '不平衡 0.7%', '暂降 0 次'] },
    },
    设备: {
      metrics: [metric('在线设备', '64', '/ 65', '在线率 98.5%'), metric('主变健康度', '94', '%', '2#需关注'), metric('断路器可用率', '100', '%', '32 / 32'), metric('待检设备', '3', '台', '本周计划')],
      diagnostics: [diagnostic('1#主变', '76%', '正常'), diagnostic('2#主变', '92%', '关注'), diagnostic('3#主变', '68%', '正常'), diagnostic('母联开关', '合闸', '正常'), diagnostic('补偿电容', '6 / 8组', '投入'), diagnostic('红外测温', '1处', '关注')],
      chart: { type: 'bar', title: '关键设备健康度', unit: '%', labels: ['1#主变', '2#主变', '3#主变', '母联', '断路器'], values: [96, 86, 97, 100, 99], threshold: 85 },
      context: { title: '配电设备健康', caption: '健康度、负载率和缺陷工单同步追踪', items: ['2#主变关注', '待检 3 台', '可用率 99.98%'] },
    },
  },
  '蒸汽资源详情': {
    总览: {
      metrics: [metric('实时流量', '68.5', 't/h', '较昨日 +2.8%'), metric('累计用汽', '326.4', 't', '完成计划 82%'), metric('主管压力', '1.60', 'MPa', '稳定'), metric('供汽温度', '285', '°C', '目标 280–295°C')],
      diagnostics: [diagnostic('管网热损率', '8.6%', '正常'), diagnostic('疏水器在线', '42 / 44', '2台检修'), diagnostic('锅炉效率', '82.6%', '可提升'), diagnostic('单位成本', '¥186 / t', '预算内'), diagnostic('压力合格率', '97.4%', '达标'), diagnostic('凝结水回收', '71.2%', '上升')],
      chart: { type: 'line', title: '24小时蒸汽流量', unit: 't/h', labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'], values: [26, 22, 35, 54, 62, 58, 76, 71, 60], secondary: [23, 20, 31, 47, 55, 52, 68, 64, 57] },
      context: { title: '热力综合态势', caption: '流量、压力、效率与成本协同监视', items: ['峰值 76 t/h', '热损 8.6%', '成本 ¥186/t'] },
    },
    管网: {
      metrics: [metric('主管压力', '1.62', 'MPa', '锅炉房出口'), metric('末端压力', '1.28', 'MPa', '实验中心'), metric('最大压降', '0.34', 'MPa', '需关注'), metric('末端温度', '278', '°C', '低于目标 2°C')],
      diagnostics: [diagnostic('压力合格率', '97.4%', '达标'), diagnostic('温度合格率', '96.1%', '关注'), diagnostic('管网热损', '8.6%', '正常'), diagnostic('疏水器在线', '42 / 44', '2台检修'), diagnostic('凝结水温度', '86°C', '正常'), diagnostic('异常节点', '1处', '实验中心')],
      chart: { type: 'line', title: '管网压力与温降', unit: 'MPa', labels: ['锅炉房', '主管A', '生产区', '工艺区', '公辅区', '实验中心'], values: [1.62, 1.58, 1.55, 1.43, 1.36, 1.28], secondary: [1.64, 1.61, 1.58, 1.50, 1.44, 1.39] },
      context: { title: '蒸汽管网传输', caption: '识别压降、温降与疏水异常节点', items: ['压降 0.34 MPa', '末端 278°C', '异常 1 处'] },
    },
    锅炉: {
      metrics: [metric('运行锅炉', '2', '/ 4', '2台热备用'), metric('总蒸发量', '72.6', 't/h', '负荷率 78%'), metric('平均效率', '82.6', '%', '目标 85%'), metric('排烟温度', '148', '°C', '正常')],
      diagnostics: [diagnostic('1#锅炉', '42.1 t/h', '运行'), diagnostic('2#锅炉', '30.5 t/h', '运行'), diagnostic('3#锅炉', '热备用', '可启动'), diagnostic('4#锅炉', '热备用', '已确认'), diagnostic('给水温度', '104°C', '正常'), diagnostic('氧量', '3.4%', '达标')],
      chart: { type: 'bar', title: '锅炉负荷分配', unit: 't/h', labels: ['1#锅炉', '2#锅炉', '3#锅炉', '4#锅炉'], values: [42.1, 30.5, 0, 0], threshold: 50 },
      context: { title: '锅炉群控策略', caption: '按效率区间分配蒸发量并保留热备', items: ['运行 2 台', '备用 2 台', '效率 82.6%'] },
    },
    效率: {
      metrics: [metric('锅炉效率', '82.6', '%', '目标 85%'), metric('凝水回收率', '71.2', '%', '较昨日 +1.8%'), metric('管网热损率', '8.6', '%', '目标 ≤ 9%'), metric('单位成本', '186', '元/t', '预算内')],
      diagnostics: [diagnostic('燃烧效率', '91.4%', '正常'), diagnostic('排烟损失', '6.8%', '可优化'), diagnostic('散热损失', '1.7%', '正常'), diagnostic('凝水回温', '86°C', '良好'), diagnostic('补水率', '28.8%', '下降'), diagnostic('节能潜力', '3.4%', '可实施')],
      chart: { type: 'line', title: '热效率与回收率', unit: '%', labels: ['00', '04', '08', '12', '16', '20', '24'], values: [80.8, 81.5, 82.2, 83.1, 82.6, 83.4, 82.6], secondary: [68.4, 69.1, 70.2, 71.8, 71.2, 72.1, 71.2] },
      context: { title: '热效率诊断', caption: '锅炉效率叠加凝结水回收趋势', items: ['效率差 2.4 pp', '回收 71.2%', '潜力 3.4%'] },
    },
    告警: {
      metrics: [metric('活跃告警', '2', '条', '重要 1 条'), metric('今日新增', '4', '条', '已关闭 2 条'), metric('平均响应', '6.8', 'min', '优于目标'), metric('闭环率', '95.2', '%', '本月累计')],
      diagnostics: [diagnostic('压降告警', '1条', '处理中'), diagnostic('温度告警', '1条', '待复核'), diagnostic('锅炉告警', '0条', '正常'), diagnostic('超时工单', '0项', '正常'), diagnostic('巡检到位', '100%', '完成'), diagnostic('风险等级', 'II级', '可控')],
      chart: { type: 'bar', title: '告警时段分布', unit: '条', labels: ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'], values: [0, 0, 2, 1, 1, 0], threshold: 3 },
      context: { title: '热力告警处置', caption: '重点监视末端压降和疏水异常', items: ['重要 1 条', '响应 6.8 min', '闭环率 95.2%'] },
    },
  },
}

export function resolveEnergyTabView(detail, activeTab) {
  const resourceViews = views[detail?.title] ?? {}
  const fallback = resourceViews.总览 ?? {
    metrics: detail?.metrics ?? [],
    diagnostics: detail?.diagnostics ?? [],
    chart: {
      type: 'line',
      title: detail?.trend?.title ?? '运行趋势',
      unit: detail?.trend?.unit ?? '',
      labels: detail?.trend?.labels ?? [],
      values: detail?.trend?.current ?? [],
      secondary: detail?.trend?.previous ?? [],
      threshold: detail?.trend?.threshold,
    },
    context: { title: '运行态势', caption: '实时运行数据', items: [] },
  }
  return resourceViews[activeTab] ?? fallback
}
