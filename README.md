# 喝水站立提醒

基于 Electron 的 Windows 桌面健康提醒应用，支持定时喝水/站立提醒、历史统计、系统监控与托盘后台运行。

## 功能

- 喝水与站立定时提醒（系统通知 + 应用内对话框）
- 系统托盘后台运行与快捷控制
- 近 7 天完成统计与 Chart.js 图表
- 系统资源监控（CPU / 内存 / 磁盘 / 网络等，按需轮询）
- 工作日过滤、深色模式、设置持久化

## 技术栈

- Electron 31
- TypeScript
- electron-vite
- Chart.js
- systeminformation

## 开发

```bash
pnpm install
pnpm dev
```

## 构建与打包

```bash
pnpm build
pnpm dist
```

安装包输出目录：`dist/`

## 测试与代码检查

```bash
pnpm test
pnpm lint
```

## 目录结构

```
src/
├── main/          # 主进程：提醒、存储、托盘、系统信息、IPC
├── preload/       # 预加载脚本与 IPC 桥接
├── renderer/      # 渲染进程 UI 模块
└── shared/        # 共享类型、常量与纯函数
tests/             # Vitest 单元测试
```

## 数据存储

用户数据保存在 Electron `userData` 目录：

- `settings.json` — 提醒设置
- `history.json` — 完成记录（自动保留 30 天）
