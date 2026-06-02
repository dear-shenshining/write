# 致因爱创作的你们

一封来自「一间属于自己的房间」的感谢信网页。致敬为 128 名珍珠生捐款的每一位善心人。

> 敬自由，敬创作。

---

## 项目简介

这是一个单页静态网站，以柔和的油画风格呈现一封公开感谢信。页面包含：

- 感谢信正文与落款
- 点击「敬自由，敬创作。」触发的互动弹幕
- 珍珠、贝壳等装饰动画
- 响应式布局，适配手机与桌面端

---

## 在线预览

部署后可在此填写你的访问地址：

```
https://your-project.vercel.app
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Next.js 16](https://nextjs.org/) |
| UI | [React 19](https://react.dev/) |
| 样式 | [Tailwind CSS 4](https://tailwindcss.com/) |
| 动画 | [Framer Motion](https://www.framer.com/motion/) |
| 字体 | Noto Serif SC |
| 组件库 | Radix UI / shadcn/ui |
| 部署 | Vercel（可选） |

---

## 本地运行

### 环境要求

- Node.js 18.17 或更高版本
- npm / pnpm / yarn 任选其一

### 安装依赖

```bash
npm install
```

或使用 pnpm：

```bash
pnpm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm run start
```

---

## 项目结构

```
.
├── app/
│   ├── layout.tsx      # 页面布局与元信息
│   ├── page.tsx        # 主页面（感谢信 + 弹幕）
│   └── globals.css     # 全局样式与主题色
├── components/         # UI 组件
├── lib/
│   └── utils.ts        # 工具函数（含 throttle / debounce）
├── public/             # 静态资源（图标等）
├── package.json
└── README.md
```

---

## 弹幕功能说明

点击页面中的「敬自由，敬创作。」即可发送弹幕，当前实现包含以下稳定性优化：

- **节流**：600ms 内最多触发一次，防止连点堆积
- **轨道分配**：8 条固定轨道，避免弹幕垂直重叠
- **并发上限**：同屏最多 10 条弹幕
- **兜底清理**：动画完成回调 + 超时回收，防止内存泄漏

可在 `app/page.tsx` 顶部调整以下常量：

```ts
const MAX_DANMAKU = 10           // 最大同屏数量
const TRIGGER_THROTTLE_MS = 600  // 点击节流间隔（毫秒）
const LANE_COUNT = 8             // 弹幕轨道数
```

---

## 上传到 GitHub

### 1. 在 GitHub 创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库名称，例如 `thank-you-letter`
4. 选择 **Public** 或 **Private**
5. **不要**勾选「Add a README file」（本地已有）
6. 点击 **Create repository**

### 2. 初始化本地 Git 并推送

在项目根目录打开终端，依次执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 感谢信网页"

# 添加远程仓库（将 YOUR_USERNAME 和 YOUR_REPO 替换为你的信息）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 3. 推送前检查

确认以下内容**不要**提交到 GitHub：

- `node_modules/`
- `.next/`
- `.env*.local`
- 任何包含密钥或隐私信息的文件

项目已配置 `.gitignore`，正常情况下上述目录会被自动忽略。

---

## 部署到 Vercel（推荐）

1. 将代码推送到 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击 **Add New Project**
4. 导入你的 GitHub 仓库
5. 保持默认构建设置，点击 **Deploy**

Next.js 项目会自动识别，无需额外配置。

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 运行生产构建 |
| `npm run lint` | 代码检查 |

---

## 许可证

本项目仅供个人学习与公益展示使用。感谢信正文内容请勿用于商业用途。

---

## 致谢

感谢每一位为珍珠生献出爱心的人。

**心火不熄，创作不死。**
"# write" 
