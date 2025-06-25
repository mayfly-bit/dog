# 🐕 宠物繁育管理系统

一个基于 Next.js 14 + Supabase 的现代化宠物繁育管理平台，提供全面的狗狗管理、健康追踪、财务管理、繁殖记录和成长档案功能。

## ✨ 主要功能

### 🏠 核心管理
- **狗狗信息管理** - 完整的宠物档案系统
- **智能搜索筛选** - 多字段实时搜索
- **数据统计面板** - 实时数据可视化

### 🏥 健康管理
- **疫苗记录** - 疫苗接种时间和类型追踪
- **体检记录** - 定期健康检查记录
- **治疗记录** - 疾病治疗和康复追踪
- **健康提醒** - 智能健康提醒系统

### 💰 财务管理
- **收支记录** - 详细的财务流水管理
- **分类统计** - 按类别统计收支情况
- **利润分析** - 自动计算净利润
- **财务报表** - 可视化财务数据

### 👶 繁殖管理
- **配种记录** - 配种信息和预产期计算
- **怀孕追踪** - 妊娠进度和护理建议
- **产仔记录** - 分娩信息和幼犬管理
- **谱系管理** - 三代血统关系图

### 📈 成长档案
- **成长记录** - 体重、身高等体征数据
- **成长里程碑** - 重要成长时刻记录
- **成长照片** - 照片档案管理
- **成长日志** - 日常成长记录
- **数据可视化** - 专业的成长曲线图

### 📱 二维码系统
- **专属二维码** - 为每只狗狗生成专属二维码
- **完整档案** - 扫码查看完整狗狗信息
- **批量生成** - 支持批量生成和打印
- **微信支付宝兼容** - 完美支持主流扫码APP

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式系统**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: Zustand
- **图表库**: Recharts
- **二维码**: qrcode
- **图标**: Lucide React

## 🛠️ 性能优化

- **React.memo** - 组件级别优化
- **useMemo & useCallback** - 避免不必要的重计算
- **代码分割** - 按需加载组件
- **图片优化** - WebP/AVIF 格式支持
- **缓存策略** - 智能数据缓存
- **虚拟滚动** - 大列表性能优化
- **骨架屏** - 优化加载体验

## 📦 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/mayfly-bit/dog.git
cd dog
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加您的 Supabase 配置：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **运行开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开 [http://localhost:3000](http://localhost:3000) 查看应用

### 数据库设置

在 Supabase SQL Editor 中执行以下脚本来创建数据库表：

1. `database-setup.sql` - 基础表结构
2. `database-health-optimization.sql` - 健康记录表
3. `database-breeding-fix-safe.sql` - 繁殖记录表
4. `database-growth-records.sql` - 成长档案表

## 🚀 部署

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署完成

### 其他平台
支持部署到任何支持 Next.js 的平台，如 Netlify、Railway 等。

## 📱 功能截图

- 🏠 **现代化首页** - 清晰的数据概览和快速操作
- 🔍 **智能搜索** - 多字段实时筛选功能
- 📊 **数据可视化** - 专业的图表和统计分析
- 📱 **响应式设计** - 完美适配手机和平板
- 🎨 **优雅界面** - 现代化的 UI 设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**🐕 让宠物繁育管理变得更简单、更专业！** 