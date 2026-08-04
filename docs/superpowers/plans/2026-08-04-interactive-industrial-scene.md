# 交互式 3D 工业园区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用程序化 Three.js 场景替换中央工业园区图片，并提供旋转、缩放、悬停高亮、点击详情和空白取消交互。

**Architecture:** React 负责 Canvas 容器、标签和详情卡；`useIndustrialScene` 独占 Three.js 生命周期与指针事件；`sceneFactory` 和 `buildingFactory` 使用基础几何体创建园区并返回可交互建筑注册表。业务数据与三维对象通过稳定的 `buildingId` 连接，React 状态变化不重建场景。

**Tech Stack:** React 18、Three.js 0.165、OrbitControls、Vite 5、CSS、Node.js 内置测试运行器、Playwright CLI。

## Global Constraints

- 禁止显示或请求 `industrial-park.png`，中央主视觉必须由 WebGL 实时渲染。
- 保持现有左右面板、蒸汽舱、标题栏和底部指标结构不变。
- 场景以青色 `#19d7ff` 和橙色 `#ff7138` 为能源分区颜色，不引入外部 3D 模型。
- 支持拖拽旋转、滚轮缩放、悬停标签、点击详情和空白取消。
- 设备像素比上限为 `2`，低动态偏好下关闭自动旋转和环境动画。
- WebGL 失败必须显示 CSS 占位，不能阻塞其他监控区域。

## File Structure

- `src/scene/buildingRegistry.js`：建筑业务数据、位置、尺寸和颜色分区。
- `src/scene/sceneMath.js`：指针标准化、像素比限制和相机约束纯函数。
- `src/scene/buildingFactory.js`：厂房、办公楼、水罐、水塔、烟囱、控制中心的程序化几何。
- `src/scene/sceneFactory.js`：底座、道路、管线、节点、粒子、灯光和建筑组装。
- `src/hooks/useIndustrialScene.js`：renderer、camera、controls、raycaster、动画循环、ResizeObserver 与释放。
- `src/components/IndustrialScene.jsx`：Canvas 容器、悬停标签、详情卡和 WebGL 降级。
- `src/App.jsx`：把 `IndustrialHero` 替换为 `IndustrialScene`。
- `src/styles/index.css`：替换中央图片层样式为 3D Canvas、提示标签和详情卡样式。
- `tests/sceneMath.test.js`：场景数学测试。
- `tests/buildingRegistry.test.js`：建筑注册表完整性测试。

---

### Task 1: 场景数据和可测试数学基础

**Files:**
- Create: `tests/sceneMath.test.js`
- Create: `tests/buildingRegistry.test.js`
- Create: `src/scene/sceneMath.js`
- Create: `src/scene/buildingRegistry.js`

**Interfaces:**
- Produces: `normalizePointer(clientX, clientY, rect): { x: number, y: number }`
- Produces: `clampPixelRatio(devicePixelRatio): number`
- Produces: `cameraLimits: { minDistance, maxDistance, minPolarAngle, maxPolarAngle }`
- Produces: `buildingRegistry: Array<{ id, name, type, status, metricLabel, metricValue, temperature, position, size, tone, model }>`
- Produces: `buildingById: Map<string, BuildingRecord>`

- [ ] **Step 1: 写场景数学失败测试**

```js
test('normalizes the center of a canvas to zero', () => {
  assert.deepEqual(normalizePointer(150, 100, { left: 50, top: 50, width: 200, height: 100 }), { x: 0, y: 0 })
})

test('caps renderer pixel ratio at two', () => {
  assert.equal(clampPixelRatio(3), 2)
  assert.equal(clampPixelRatio(1.5), 1.5)
})
```

- [ ] **Step 2: 写建筑注册表失败测试**

测试至少 11 座设施、所有 `id` 唯一、每项具备名称/状态/位置/模型类型，并同时包含 `cyan` 与 `orange` 分区。

- [ ] **Step 3: 运行测试确认模块缺失**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/scene/sceneMath.js` and `src/scene/buildingRegistry.js`.

- [ ] **Step 4: 实现纯函数和建筑注册表**

建筑注册表包含储罐 3 座、高架水塔 1 座、中央厂房 2 座、烟囱 3 座、办公楼 2 座、控制中心 1 座；模型类型限定为 `tank | waterTower | factory | chimney | office | controlCenter`。

- [ ] **Step 5: 运行测试并提交**

Run: `npm test`
Expected: all existing and new tests pass.

```bash
git add tests src/scene/sceneMath.js src/scene/buildingRegistry.js
git commit -m "feat: define industrial scene data model"
```

### Task 2: 程序化建筑与园区场景工厂

**Files:**
- Create: `src/scene/buildingFactory.js`
- Create: `src/scene/sceneFactory.js`

**Interfaces:**
- Consumes: `buildingRegistry` records.
- Produces: `createBuilding(record, materialLibrary): THREE.Group` with `group.userData.buildingId` and descendant meshes carrying the same ID.
- Produces: `createIndustrialScene(): { root, interactiveObjects, animated, dispose }`.

- [ ] **Step 1: 创建共享材质与边线辅助函数**

建立深蓝实体、青色发光、橙色发光、玻璃和道路材质；`addEdges(mesh, color)` 使用 `EdgesGeometry` 创建轮廓线；材质库由场景工厂创建并在释放时统一销毁。

- [ ] **Step 2: 实现六类建筑模型**

`tank` 使用圆柱与球顶；`waterTower` 使用圆柱水箱和四根支架；`factory` 使用盒体、屋顶层、窗格与入口；`chimney` 使用锥台组合并添加发光环；`office` 使用盒体与水平窗带；`controlCenter` 使用多层盒体和外框。

- [ ] **Step 3: 建立底座、道路和管线**

底座由两层方盒组成并带青色轮廓；道路使用深色平面条带；管线使用 `CatmullRomCurve3` 与 `TubeGeometry`；在管线路径放置错峰脉冲节点。

- [ ] **Step 4: 添加灯光、网格和粒子**

添加环境光、方向光、青/橙点光源、透明 GridHelper 和不超过 180 个粒子的 Points。`animated` 数组只保存需要逐帧更新的节点、粒子和热能环。

- [ ] **Step 5: 构建验证并提交**

Run: `npm test && npm run build`
Expected: tests pass and Vite resolves all Three.js imports.

```bash
git add src/scene
git commit -m "feat: build procedural industrial park scene"
```

### Task 3: Three.js 生命周期和交互 Hook

**Files:**
- Create: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: `{ containerRef, onHover(buildingId | null, screenPoint | null), onSelect(buildingId | null), reducedMotion }`.
- Produces: `{ webglError: boolean, resetView(): void }`.

- [ ] **Step 1: 初始化 renderer、scene、camera 和 OrbitControls**

Camera 使用透视投影和最佳等距位置；OrbitControls 限制距离、极角并启用 damping；Canvas 添加描述性 aria-label，renderer 像素比调用 `clampPixelRatio`。

- [ ] **Step 2: 实现尺寸和动画循环**

ResizeObserver 更新 renderer size、camera aspect 和 projection matrix。动画循环调用 controls.update、更新 `animated` 项并渲染；低动态偏好下停止自动旋转与环境对象更新，但手动交互仍触发渲染。

- [ ] **Step 3: 实现 Raycaster 悬停和选择**

`pointermove` 使用 `normalizePointer`，只射线检测 `interactiveObjects`；悬停时保存原材质 emissiveIntensity 并提高亮度，离开时恢复。`click` 返回建筑 ID，空白点击返回 `null`。

- [ ] **Step 4: 实现空闲自动旋转和恢复视角**

交互开始后暂停自动旋转，最后操作 3 秒后恢复。提供 `resetView` 将相机平滑恢复到初始位置和 target。

- [ ] **Step 5: 实现完整释放并提交**

Cleanup 取消 RAF、断开 ResizeObserver、移除 DOM 监听器、dispose controls、调用 scene factory 的 dispose、dispose renderer 并移除 Canvas。

Run: `npm test && npm run build`
Expected: tests pass and build succeeds.

```bash
git add src/hooks/useIndustrialScene.js
git commit -m "feat: add interactive Three.js scene lifecycle"
```

### Task 4: React 场景组件和视觉集成

**Files:**
- Create: `src/components/IndustrialScene.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `buildingById`, `useIndustrialScene`.
- Produces: `<IndustrialScene />` replacing `<IndustrialHero />`.

- [ ] **Step 1: 实现 Canvas 容器和低动态检测**

组件监听 `matchMedia('(prefers-reduced-motion: reduce)')`，向 Hook 传递状态；渲染 `.industrial-scene__canvas`、悬停标签层、详情卡、重置视角按钮和 WebGL 错误占位。

- [ ] **Step 2: 实现建筑标签和详情卡**

悬停标签跟随场景内指针但限制在容器边界。点击详情卡显示名称、类型、指标、温度和“正常”状态；详情卡与按钮使用中文文案且不阻断 Canvas 其他区域交互。

- [ ] **Step 3: 替换 App 中央组件**

删除 `IndustrialHero` 引用并改为 `IndustrialScene`；保留旧文件但不再被运行时代码导入，以便 Git 历史可追溯。

- [ ] **Step 4: 重写中央区域样式**

移除图片相关的主视觉样式，增加 Canvas、暗角、指针标签、详情卡、重置按钮和 WebGL 占位样式。Canvas 保持 `left: 391px; top: 105px; width: 1138px; height: 668px`，z-index 不超过左右面板和蒸汽舱。

- [ ] **Step 5: 构建验证并提交**

Run: `npm test && npm run build`
Expected: all tests pass; build contains Three.js but no runtime reference to `/industrial-park.png`.

```bash
git add src/App.jsx src/components/IndustrialScene.jsx src/styles/index.css
git commit -m "feat: replace hero image with interactive 3D park"
```

### Task 5: 浏览器交互和多视口验证

**Files:**
- Modify if needed: `src/scene/*.js`
- Modify if needed: `src/hooks/useIndustrialScene.js`
- Modify if needed: `src/components/IndustrialScene.jsx`
- Modify if needed: `src/styles/index.css`
- Replace: `output/playwright/dashboard-1440x900.png`
- Replace: `output/playwright/dashboard-1920x1080.png`
- Replace: `output/playwright/dashboard-2560x1080.png`

- [ ] **Step 1: 启动服务并检查控制台**

Run: `npm run dev -- --host 127.0.0.1`
Expected: page loads with 0 browser console errors and a WebGL Canvas inside `.industrial-scene`.

- [ ] **Step 2: 验证资源和对象数量**

使用 Playwright 检查没有 `/industrial-park.png` 请求；Canvas 存在；场景注册表至少 12 项；详情卡初始隐藏。

- [ ] **Step 3: 验证旋转、缩放、悬停与选择**

在 Canvas 上拖拽后验证相机画面变化；滚轮后验证画面缩放；移动到可见建筑上验证标签出现；点击建筑验证详情卡出现；点击空白验证详情卡关闭。

- [ ] **Step 4: 更新三种视口截图**

捕获 1440 × 900、1920 × 1080、2560 × 1080 截图，确认园区体量、中央橙色焦点、左右青色建筑和底座比例接近参考图，且不覆盖监控面板。

- [ ] **Step 5: 最终验证与提交**

Run: `npm test && npm run build`
Expected: all tests pass, build succeeds without warnings, browser console has 0 errors.

```bash
git add src tests output/playwright docs/superpowers/plans/2026-08-04-interactive-industrial-scene.md
git commit -m "test: verify interactive industrial scene"
```
