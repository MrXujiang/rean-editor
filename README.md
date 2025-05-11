# rean-editor
An out-of-the-box animation visualization editor ｜ 一款开箱即用的动画可视化编辑器

![](demo.gif)

项目完全开源，开源不易，可以点个【star】支持一下哦～

Remotion 动画编辑器是一个基于 Web 技术构建的现代化视频动画创作工具，采用了以下技术栈：

- **前端框架**：Next.js 14 (App Router)
- **UI 组件库**：shadcn/ui + Tailwind CSS
- **动画引擎**：Remotion + Framer Motion
- **状态管理**：React Hooks (useState, useEffect, useRef, useMemo)
- **视频处理**：Web APIs (MediaRecorder, Canvas API)
- **导出功能**：客户端视频编码 + 可选的 GIF 导出

这种技术组合提供了高性能的动画编辑体验，同时保持了代码的可维护性和扩展性。

## 核心功能

- **直观的可视化编辑界面**：拖放式元素创建和编辑
- **多元素类型支持**：文本、形状和图像元素
- **关键帧动画系统**：支持多种属性的关键帧动画
- **实时预览**：即时查看动画效果
- **时间轴编辑**：直观的时间轴界面，支持关键帧和元素时长调整
- **导出功能**：支持视频和 GIF 格式导出
- **撤销/重做**：完整的历史记录系统
- **主题切换**：支持亮色和暗色主题


## 技术亮点

1. **高性能动画渲染**：

1. 使用 `useMemo` 缓存计算值，减少重复计算
2. 采用 CSS 变量优化变换属性应用
3. 使用 `willChange` 提示浏览器优化渲染


关注【趣谈前端】公众号，获取更多技术干货，项目最新进展，和开源实践。作者微信：`cxzk_168`

## 在线办公相关解决方案

1. [flowmix/docx多模态文档编辑器](https://flowmix.turntip.cn)
2. [灵语AI文档](https://mindlink.turntip.cn)
3. [H5-Dooring智能零代码平台](https://github.com/MrXujiang/h5-Dooring)

