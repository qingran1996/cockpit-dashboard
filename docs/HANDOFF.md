# 项目交接文档

## 1. 交付信息

| 项目 | 内容 |
| --- | --- |
| 项目名称 | 能源综合监控可视化平台 |
| 仓库 | `https://github.com/qingran1996/cockpit-dashboard.git` |
| 交付分支 | `codex/img2threejs-factory-rebuild` |
| 基线分支 | `main` |
| 代码交付提交 | `eff2fc1`（页头视觉升级后的代码基线） |
| 交接日期 | 2026-08-17 |
| 技术栈 | React 18、Three.js 0.165、ECharts 5、Vite 5 |

本分支完成了驾驶舱中央场景从原有简化模型到程序化工业园区的重建，并补充了厂区道路、围栏、闸门、停车场、车辆、行人、建筑近景及沉浸式第一人称漫游。

## 2. 当前交付状态

- 三维园区包含 16 栋可独立拾取的建筑。
- 园区尺寸为 70 × 54 个 Three.js 世界单位。
- 建筑、道路、停车场、球场、绿化、管廊和围栏均由代码程序化生成。
- 两个车辆闸门、内部停车场、外部道路及车辆循环路线已经接通。
- 行人在园区步行路线中持续运动，但不会被误识别为可选建筑。
- 点击建筑会平滑切换至对应近景并展示运行指标。
- 第一人称支持 Pointer Lock、WASD 行走、Shift 奔跑、视角起伏、摆臂、碰撞和沿墙滑动。
- 页头已升级为中央能量徽章、双侧脉冲光轨和渐变标题。
- README 已包含安装、使用、交互和项目结构说明。

## 3. 本地验证结果

交接前执行：

```bash
npm test
npm run build
git diff --check
```

验证结果：

- 自动测试：52 项通过，0 项失败。
- Vite 生产构建：通过。
- 生产产物输出目录：`dist/`。
- Three.js、ECharts 与应用代码均成功完成打包。

后续修改场景布局、道路、建筑或第一人称算法后，应重新执行以上命令。

## 4. 功能操作

### 4.1 园区俯瞰

| 操作 | 结果 |
| --- | --- |
| 鼠标拖拽 | 旋转园区视角 |
| 鼠标滚轮 | 缩放园区 |
| 悬停建筑 | 显示建筑名称和设施类型 |
| 点击建筑 | 切换到建筑近景并显示运行数据 |
| 复位视角 | 返回默认俯瞰视角 |

### 4.2 第一人称

| 操作 | 结果 |
| --- | --- |
| 点击“第一人称” | 从主闸门内侧进入人物视角并请求锁定鼠标 |
| `W` / `A` / `S` / `D` | 前后左右行走 |
| 方向键 | 前后移动或左右转向 |
| 移动鼠标 | 调整观察方向 |
| `Shift` | 奔跑 |
| `Esc` | 释放 Pointer Lock 并显示鼠标，不离开当前位置 |
| 点击场景 | 重新锁定鼠标 |
| “退出漫游” | 返回默认俯瞰视角 |

不支持 Pointer Lock 的浏览器会保留鼠标左键拖拽转向作为降级方案。

## 5. 代码结构与职责

| 路径 | 职责 |
| --- | --- |
| `src/App.jsx` | 驾驶舱整体布局与各业务面板装配 |
| `src/components/IndustrialScene.jsx` | 三维场景 UI、建筑详情、漫游按钮与提示 |
| `src/hooks/useIndustrialScene.js` | Three.js 生命周期、相机、拾取、近景、Pointer Lock 和第一人称控制 |
| `src/scene/factoryCampusRegistry.js` | 16 栋建筑的名称、类型、指标、位置和尺寸 |
| `src/scene/factoryCampusFactory.js` | 建筑、道路、停车场、车辆、行人、围栏、闸门及绿化建模 |
| `src/scene/buildingFactory.js` | 建筑立面、屋顶及重复工业构件生成 |
| `src/scene/sceneFactory.js` | 场景装配、动画对象、可拾取与可展开运行时结构 |
| `src/scene/sceneMath.js` | 相机参数、建筑近景、移动、碰撞、鼠标观察和步态算法 |
| `src/styles/industrialSceneControls.css` | 近景、第一人称、准星和沉浸式遮罩样式 |
| `src/data/dashboard.js` | 水、电、蒸汽和底部指标演示数据 |
| `tests/` | 布局、几何、道路、车辆、相机和第一人称回归测试 |

## 6. 关键约束

### 6.1 建筑与道路

- `factoryCampusRegistry` 是建筑信息的唯一运行时来源。
- 新增建筑时必须提供唯一 `id`、三维 `position`、`size`、设施信息和屋顶类型。
- 建筑之间保留服务间距，不能与内部道路、球场或停车区域重叠。
- 新增道路后需保证服务环路连通，并避免道路 AABB 穿过建筑 AABB。
- 调整建筑位置时同时检查相机俯瞰范围和参考图投影测试。

### 6.2 第一人称

- 人物地面位置与相机步态偏移分离，不能把头部起伏写回碰撞坐标。
- 碰撞使用建筑注册表中的矩形占地范围，并保留 1.1 单位的人体安全半径。
- Pointer Lock 必须由用户点击触发；`Esc` 只释放鼠标，不退出第一人称。
- 鼠标向右移动时 yaw 应增加，相关方向回归测试位于 `tests/sceneInteraction.test.js`。

### 6.3 Three.js 资源

- 场景卸载时必须释放 Geometry、Material、Renderer、Controls 和事件监听器。
- 行人、车辆及场地系统不能加入建筑拾取数组。
- `root.userData.sculptRuntime` 中的拾取与展开部件定义必须保持一致。

## 7. 测试覆盖

| 测试文件 | 主要覆盖内容 |
| --- | --- |
| `tests/buildingRegistry.test.js` | 建筑数量、参考布局、间距、拾取、展开与资源释放 |
| `tests/factoryCampusFactory.test.js` | 道路、停车场、车辆路线、闸门、绿化、材质与场地约束 |
| `tests/sceneInteraction.test.js` | 建筑近景、第一人称移动、碰撞、观察方向和步态 |
| `tests/sceneMath.test.js` | 视口坐标、相机限制、雾效和默认俯瞰范围 |
| `tests/layout.test.js` | 1920 × 1080 画布在不同窗口尺寸下的缩放 |
| `tests/formatDate.test.js` | 驾驶舱时间格式 |

## 8. 启动与部署

```bash
git clone https://github.com/qingran1996/cockpit-dashboard.git
cd cockpit-dashboard
git checkout codex/img2threejs-factory-rebuild
npm install
npm test
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

部署时发布 `dist/` 目录即可。项目当前没有后端依赖，能源指标来自前端静态演示数据。

## 9. 已知限制

1. 园区来自单张效果图，背面和被遮挡区域为合理推断，不能视为工程测绘级 1:1 数据。
2. 能源指标目前是静态演示数据，尚未连接实时接口、WebSocket 或告警服务。
3. Pointer Lock 依赖浏览器支持和用户手势；Chrome/Edge 的体验最完整。
4. WebGL 或硬件加速不可用时只显示降级提示，不提供二维园区替代图。
5. `src/scene/generated/` 是本地 img2threejs 生成实验产物，当前应用运行时使用手工集成的 `factoryCampusFactory.js`，不要直接替换。
6. Three.js vendor 包体积较大，生产构建会输出约 500 KB 的未压缩 Three.js chunk；如对首屏有严格要求，可继续做按需加载。

## 10. 未纳入本次提交的本地文件

以下内容保留在工作区，但不属于应用正式源码：

- `.img2threejs/`：重建流水线状态、分析和中间证据。
- `bgtp.jpg`：用户提供的原始参考图。
- `output/playwright/`：多轮浏览器检查截图。
- `src/scene/generated/`：未接入运行时的生成模型实验代码。

若需要长期归档，可在确认版权、文件体积及用途后，另建资料分支或发布附件，不建议直接混入应用源码提交。

## 11. 后续建议

1. 从该分支创建 Pull Request，并在合并前再次运行 `npm test` 和 `npm run build`。
2. 将 `src/data/dashboard.js` 替换为真实能源接口，并增加加载、异常和断线状态。
3. 为关键建筑补充业务路由，使建筑近景可进入设备详情页面。
4. 将 Three.js 场景改为延迟加载，降低驾驶舱首屏脚本体积。
5. 如需要工程级还原，应补充总平面 CAD、建筑尺寸或多角度渲染图，再校准注册表坐标。

## 12. 交接验收清单

- [ ] 拉取并切换到 `codex/img2threejs-factory-rebuild`
- [ ] 执行 `npm install`
- [ ] 确认 `npm test` 全部通过
- [ ] 确认 `npm run build` 成功
- [ ] 检查建筑点击近景与详情面板
- [ ] 检查第一人称、WASD、鼠标方向、Shift 和 Esc
- [ ] 确认两个闸门、内部停车场、车辆和行人动画
- [ ] 确认不同窗口尺寸下驾驶舱完整显示
