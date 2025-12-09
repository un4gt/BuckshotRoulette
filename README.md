# Buckshot Roulette (恶魔轮盘)

一个基于 React + Rust 实现的《恶魔轮盘》(Buckshot Roulette) 网页游戏，支持 **真人 vs AI** 和 **AI vs AI** 对战模式。

## 游戏简介

《恶魔轮盘》是一款回合制心理博弈游戏。玩家与恶魔荷官轮流使用装有实弹和空包弹的霰弹枪，可以选择射击对手或射击自己（空弹射自己可保留回合）。游戏引入多种道具增加策略性，采用三局制，第三局还有"闸刀"一击必杀机制。

## 特性

- **双模式支持**：真人 vs AI / AI vs AI 观战模式
- **多 AI 服务商**：支持 Gemini、OpenAI、DeepSeek、Grok、OpenRouter 及自定义 OpenAI 兼容接口
- **完整三局制**：
  - 第一局：2 血量，无道具（纯心理博弈）
  - 第二局：4 血量，2 道具/小局
  - 第三局：5 血量，4 道具/小局，闸刀机制
- **9 种道具**：锯子、手铐、香烟、放大镜、饮料、肾上腺素、过期药物、逆转器、电话
- **实时 AI 思考展示**：显示 AI 的推理过程和对话
- **射击动画**：枪口旋转、实弹火焰、空弹烟雾效果

## 项目结构

```
BuckshotRoulette/
├── frontend/          # React 前端
│   └── src/
│       ├── app/stores/    # Zustand 状态管理
│       ├── agents/        # AI 系统（Bridge、Prompts、Strategies）
│       ├── entities/      # 领域模型（道具、子弹）
│       ├── features/      # UI 功能模块
│       └── shared/        # 共享工具和 UI 组件
└── backend/           # Rust 后端 (Actix-web + Diesel)
    └── src/
```

## 快速开始

### 前端

```bash
cd frontend
bun install           # 安装依赖
bun run dev           # 启动开发服务器 http://localhost:3000
bun run build         # 生产构建
```

### 后端

```bash
cd backend
cargo build           # 构建
cargo run             # 运行服务器
cargo test            # 运行测试
```

## 配置 AI

1. 点击主菜单的 **设置** 按钮
2. 选择 AI 服务商（Gemini / OpenAI / DeepSeek / Grok / OpenRouter / OpenAI Compatible）
3. 输入对应的 API Key
4. 配置模型名称（可选，有默认值）
5. AI vs AI 模式需要分别配置玩家 AI 和恶魔 AI

## 技术栈

### 前端

- **框架**：React 19 + TypeScript 5.9
- **构建工具**：Rsbuild (基于 Rspack)
- **状态管理**：Zustand
- **样式**：Tailwind CSS 4 + Radix UI
- **动画**：Framer Motion
- **包管理器**：Bun

### 后端

- **语言**：Rust (Edition 2024)
- **Web 框架**：Actix-web
- **ORM**：Diesel
- **连接池**：r2d2

## 游戏规则

详见 [frontend/GAME_RULES.md](./frontend/GAME_RULES.md)

## License

MIT
