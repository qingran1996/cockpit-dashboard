# 能源综合监控可视化平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在现有 Vite + React 工程中构建与 `disignpng.png` 高度一致、图表可交互并适配普通笔记本、1920 × 1080 大屏和超宽屏的能源综合监控平台。

**Architecture:** 使用 1920 × 1080 固定逻辑画布配合 `useViewportScale` 等比缩放；中央园区使用从参考图裁切的静态素材，其余界面由 React 组件、CSS 切角框架和 ECharts 构成。演示数据集中维护，图表通过统一 `EChart` 组件管理生命周期和尺寸变化。

**Tech Stack:** React 18、Vite 5、ECharts 5、CSS、Node.js 内置测试运行器、Playwright 浏览器截图。

## Global Constraints

- 参考图 `disignpng.png` 是唯一视觉基准，禁止将整张参考图直接作为页面背景。
- 逻辑画布固定为 1920 × 1080，主体只允许等比缩放，超宽屏仅延展外层背景。
- 中央园区允许从参考图裁切使用，所有文本、指标、面板和图表必须由 React/CSS/ECharts 实现。
- 青色承担水、电与框架信息；橙色只用于蒸汽、热能节点和锅炉状态；绿色只表达正常状态或同比改善。
- 页面数据集中在 `src/data/dashboard.js`，组件不得内嵌重复业务数据。
- 支持 `prefers-reduced-motion: reduce`，关键状态必须同时使用文字说明。
- 不实现后端、登录、数据持久化、Three.js 可旋转模型或移动端纵向重排。

## File Structure

- `src/App.jsx`：组装逻辑画布与六个业务区域。
- `src/hooks/useViewportScale.js`：计算 1920 × 1080 画布的等比缩放与居中偏移。
- `src/hooks/useClock.js`：每秒产生中文日期时间字符串。
- `src/components/EChart.jsx`：封装 ECharts 初始化、更新、ResizeObserver 和卸载。
- `src/components/TechPanel.jsx`：青色/橙色切角面板壳。
- `src/components/DashboardHeader.jsx`：天气、标题和实时时钟。
- `src/components/IndustrialHero.jsx`：中央园区素材及扫描、节点与粒子装饰。
- `src/components/WaterPanel.jsx`：水资源监控。
- `src/components/PowerPanel.jsx`：电力资源监控。
- `src/components/SteamPanel.jsx`：蒸汽资源监控。
- `src/components/BottomMetrics.jsx`：底部五项指标。
- `src/data/dashboard.js`：演示数据和 ECharts option 工厂。
- `src/styles/index.css`：全局画布、背景、排版、响应式和动画降级。
- `src/styles/panels.css`：切角框、图表、仪表与各面板细节。
- `src/utils/layout.js`：纯函数 `calculateViewportScale`。
- `src/utils/formatDate.js`：纯函数 `formatDashboardDate`。
- `tests/layout.test.js`：缩放算法测试。
- `tests/formatDate.test.js`：时钟格式测试。
- `public/industrial-park.png`：从参考图中央区域裁切的园区素材。

---

### Task 1: 自适应画布与时间基础设施

**Files:**
- Create: `src/utils/layout.js`
- Create: `src/utils/formatDate.js`
- Create: `src/hooks/useViewportScale.js`
- Create: `src/hooks/useClock.js`
- Create: `tests/layout.test.js`
- Create: `tests/formatDate.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `calculateViewportScale(viewportWidth: number, viewportHeight: number, designWidth?: number, designHeight?: number): { scale: number, left: number, top: number }`
- Produces: `formatDashboardDate(date: Date): string`
- Produces: `useViewportScale(): { scale: number, left: number, top: number }`
- Produces: `useClock(): string`

- [x] **Step 1: 为等比缩放写失败测试**

```js
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
```

- [x] **Step 2: 为日期格式写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDashboardDate } from '../src/utils/formatDate.js'

test('formats dashboard time in Chinese', () => {
  const value = formatDashboardDate(new Date(2025, 5, 18, 14, 30, 45))
  assert.equal(value, '2025-06-18 14:30:45 星期三')
})
```

- [x] **Step 3: 运行测试并确认缺少模块**

Run: `node --test tests/layout.test.js tests/formatDate.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/utils/layout.js` and `src/utils/formatDate.js`.

- [x] **Step 4: 实现纯函数与 React hooks**

`calculateViewportScale` 必须使用 `Math.min(viewportWidth / designWidth, viewportHeight / designHeight)`，并计算居中后的 `left` 和 `top`。`formatDashboardDate` 使用零填充年月日时分秒和 `星期日` 至 `星期六` 数组。`useViewportScale` 监听 `resize` 并返回纯函数结果；`useClock` 每秒更新一次并在卸载时清理计时器。

- [x] **Step 5: 添加测试脚本并运行**

在 `package.json` 添加 `"test": "node --test tests/*.test.js"`。

Run: `npm test`
Expected: 4 tests pass.

- [x] **Step 6: 提交基础设施**

```bash
git add package.json src/utils src/hooks tests
git commit -m "feat: add responsive dashboard foundations"
```

### Task 2: 中央素材、数据层和通用组件

**Files:**
- Create: `public/industrial-park.png`
- Create: `src/data/dashboard.js`
- Create: `src/components/EChart.jsx`
- Create: `src/components/TechPanel.jsx`

**Interfaces:**
- Consumes: ECharts from `echarts`.
- Produces: `dashboardData` with `water`, `power`, `steam`, and `bottomMetrics` keys.
- Produces: `chartOptions` with `waterUsage`, `powerLoad`, and `steamFlow` option objects.
- Produces: `<EChart option className ariaLabel />`.
- Produces: `<TechPanel tone title className children />`, where `tone` is `'cyan' | 'orange'`.

- [x] **Step 1: 裁切中央园区素材**

从 2816 × 1584 参考图裁切近似区域 `x=625, y=160, width=1565, height=925`，输出到 `public/industrial-park.png`。使用 `sips` 时先复制到临时文件，再执行裁切，确保原始 `disignpng.png` 不被修改。通过 `sips -g pixelWidth -g pixelHeight public/industrial-park.png` 确认输出尺寸。

- [x] **Step 2: 编写集中数据与图表配置**

`dashboardData` 使用参考图中的数值：月用水量 `[120,132,145,138,152,168]`，压力 `0.48 MPa`，漏损率 `5.9%`，实时负荷 `85.6 MW`，供电可用率 `99.98%`，蒸汽流量 `68.5 t/h`，蒸汽压力 `1.6 MPa`，温度 `285°C`，转换效率 `82.6%`。三张图表使用透明背景、青色或橙色渐变、弱网格线、无动画首次抖动。

- [x] **Step 3: 实现 ECharts 生命周期封装**

`EChart` 使用 `ref` 保存 DOM，`useEffect` 内 `echarts.init`；option 更新时调用 `setOption(option, true)`；使用 `ResizeObserver` 调用 `instance.resize()`；cleanup 时断开 observer 并调用 `instance.dispose()`。容器设置 `role="img"` 和来自 `ariaLabel` 的 `aria-label`。

- [x] **Step 4: 实现切角面板容器**

`TechPanel` 输出面板标题槽、四角装饰和内容槽；`tone` 通过 `data-tone` 控制青色与橙色变量；装饰层必须 `pointer-events: none`。

- [x] **Step 5: 构建检查并提交**

Run: `npm run build`
Expected: Vite build completes without warnings from JSX or ECharts imports.

```bash
git add public/industrial-park.png src/data src/components/EChart.jsx src/components/TechPanel.jsx
git commit -m "feat: add dashboard data and visual primitives"
```

### Task 3: 六大监控区域 React 组件

**Files:**
- Create: `src/components/DashboardHeader.jsx`
- Create: `src/components/IndustrialHero.jsx`
- Create: `src/components/WaterPanel.jsx`
- Create: `src/components/PowerPanel.jsx`
- Create: `src/components/SteamPanel.jsx`
- Create: `src/components/BottomMetrics.jsx`
- Create: `src/App.jsx`

**Interfaces:**
- Consumes: `dashboardData`, `chartOptions`, `EChart`, `TechPanel`, `useClock`, `useViewportScale`.
- Produces: complete `<App />` mounted by existing `src/main.jsx`.

- [x] **Step 1: 实现顶部和中央主视觉**

`DashboardHeader` 放置天气 `🌤 28°C 多云`、标题 `能源综合监控可视化平台` 和 `useClock()` 输出。`IndustrialHero` 使用 `/industrial-park.png`，提供图片失败状态，并加入一个扫描光层、八个绝对定位能量节点和低密度粒子层。

- [x] **Step 2: 实现水资源和电力面板**

`WaterPanel` 包含月用水柱图、压力进度条、三区压力、漏损率环和分区用水量。`PowerPanel` 包含负荷曲线、峰平谷三项数据、供电可用率环和三条设备正常状态。

- [x] **Step 3: 实现蒸汽舱和底部指标**

`SteamPanel` 使用橙色 `TechPanel`，包含蒸汽流量曲线、压力温度、82.6% 效率环和四个锅炉火焰状态。`BottomMetrics` 映射五项指标并显示同比方向。

- [x] **Step 4: 组装 App 逻辑画布**

`App` 渲染 `.dashboard-shell > .dashboard-canvas`，将 `useViewportScale()` 结果写为 transform 和 left/top；内部使用 CSS grid 精确划分 header、water、hero、steam、power 和 footer 区域。图片、装饰层和图表需要明确 z-index，保证中央园区不会覆盖两侧面板。

- [x] **Step 5: 运行构建并提交**

Run: `npm run build`
Expected: build succeeds and produces `dist/index.html` plus bundled assets.

```bash
git add src/App.jsx src/components
git commit -m "feat: compose energy monitoring dashboard"
```

### Task 4: 像素级视觉系统与动画降级

**Files:**
- Create: `src/styles/index.css`
- Create: `src/styles/panels.css`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: class names emitted by all Task 3 components.
- Produces: a 1920 × 1080 neon industrial dashboard with cyan/orange panel variants and reduced-motion support.

- [x] **Step 1: 建立全局画布和背景**

在 `index.css` 定义颜色变量、字体栈、1920 × 1080 画布、电路网格背景和区域 grid。设置 `html, body, #root` 为全视口且 `overflow: hidden`；使用 `transform-origin: top left` 保持等比缩放。

- [x] **Step 2: 实现标题框和青色面板**

使用 `clip-path: polygon(...)`、伪元素、多层 box-shadow 和线性渐变完成切角轮廓。标题高度、左右面板宽度、中央园区占比按参考图设置；文字字号以逻辑像素为单位，不随区域单独缩放。

- [x] **Step 3: 实现橙色蒸汽舱与仪表细节**

在 `panels.css` 定义 `data-tone="orange"` 变量覆盖、环形仪表、压力条、设备状态行、火焰标记和底部指标分隔。橙色只用于蒸汽区域及热能指标。

- [x] **Step 4: 添加克制的环境动画和无动画模式**

只定义 `scan`, `nodePulse`, `floatParticle`, `panelReveal` 四组动画；在 `@media (prefers-reduced-motion: reduce)` 中把 animation-duration 设为 `0.001ms`、iteration-count 设为 `1`，并关闭扫描光。

- [x] **Step 5: 引入样式并验证**

`src/main.jsx` 同时引入 `./styles/index.css` 和 `./styles/panels.css`。

Run: `npm test && npm run build`
Expected: 4 tests pass and production build succeeds.

- [x] **Step 6: 提交视觉实现**

```bash
git add src/main.jsx src/styles
git commit -m "feat: recreate neon industrial cockpit styling"
```

### Task 5: 多视口浏览器校验与视觉收敛

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/styles/panels.css`
- Modify if needed: `src/components/*.jsx`
- Create: `artifacts/dashboard-1440x900.png`
- Create: `artifacts/dashboard-1920x1080.png`
- Create: `artifacts/dashboard-2560x1080.png`

**Interfaces:**
- Consumes: complete dashboard from Tasks 1–4.
- Produces: three viewport screenshots and verified final build.

- [x] **Step 1: 启动本地服务**

Run: `npm run dev -- --host 127.0.0.1`
Expected: Vite reports a local URL on port 5180.

- [x] **Step 2: 捕获 1920 × 1080 基准截图**

使用 Playwright 打开 `http://127.0.0.1:5180`，等待园区图片和 ECharts canvas 加载，保存 `artifacts/dashboard-1920x1080.png`。对照参考图检查标题中心线、左右面板边界、中央园区底边、蒸汽舱高度和底栏间距。

- [x] **Step 3: 捕获笔记本和超宽截图**

分别使用 1440 × 900 和 2560 × 1080 视口保存另外两张截图。确认逻辑画布等比、主体居中、无横向拉伸、无正文溢出，超宽空余区只显示延展背景。

- [x] **Step 4: 视觉收敛并复测**

每次仅调整影响最大的差异：区域比例、面板边框、字号密度、主图裁切、图表留白和颜色亮度。调整后重新捕获三张截图，直到不存在明显错位、裁切、重影或过亮光效。

- [x] **Step 5: 最终验证**

Run: `npm test && npm run build`
Expected: all 4 tests pass; Vite production build succeeds; browser console has no errors; three screenshots contain the complete dashboard.

- [x] **Step 6: 提交验证结果**

```bash
git add src artifacts package.json package-lock.json public
git commit -m "test: verify dashboard across target viewports"
```
