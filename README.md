# Buckshot Roulette (恶魔轮盘)

一个基于 React 实现的《恶魔轮盘》(Buckshot Roulette) 网页游戏，支持 **真人 vs AI** 和 **AI vs AI** 对战模式。

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

## 快速开始

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 生产构建

```bash
bun run build
```

### 预览生产构建

```bash
bun run preview
```

## 配置 AI

1. 点击主菜单的 **设置** 按钮
2. 选择 AI 服务商（Gemini / OpenAI / DeepSeek / Grok / OpenRouter / OpenAI Compatible）
3. 输入对应的 API Key
4. 配置模型名称（可选，有默认值）
5. AI vs AI 模式需要分别配置玩家 AI 和恶魔 AI

## 技术栈

- **框架**：React 19 + TypeScript 5.9
- **构建工具**：Rsbuild (基于 Rspack)
- **状态管理**：Zustand
- **样式**：Tailwind CSS 4 + Radix UI
- **动画**：Framer Motion
- **包管理器**：Bun

## 项目结构

```
src/
├── app/stores/        # Zustand 状态管理
├── agents/            # AI 系统（Bridge、Prompts、Strategies）
├── entities/          # 领域模型（道具、子弹）
├── features/          # UI 功能模块
│   ├── game-table/    # 主游戏界面
│   ├── player-view/   # 玩家头像
│   ├── settings/      # 设置对话框
│   └── signature/     # 签名板
└── shared/            # 共享工具和 UI 组件
```

## 部署

项目已配置 GitHub Actions，推送到 `main` 或 `master` 分支时会自动部署到 GitHub Pages。

手动部署：
1. 进入 GitHub 仓库 → Settings → Pages
2. Source 选择 **GitHub Actions**
3. 推送代码或手动触发 workflow

## 游戏规则

详见 [GAME_RULES.md](./GAME_RULES.md)

## License

MIT
