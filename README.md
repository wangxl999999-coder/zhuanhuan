# 文件格式转换微信小程序

一款功能强大的文件格式转换微信小程序，支持多种文档、图片、PDF和Markdown格式的互转。

## 功能特性

### 文档格式转换
- Word → PDF (.doc/.docx → .pdf)
- Excel → PDF (.xls/.xlsx → .pdf)
- PPT → PDF (.ppt/.pptx → .pdf)
- PDF → Word (.pdf → .doc/.docx)

### 图片处理
- 图片 → PDF (jpg/jpeg/png/gif/bmp/webp → pdf)
- 图片 → Word/Excel (图片 → docx/xlsx)
- 图片格式互转 (支持jpg、png、bmp、webp、gif之间互转)

### PDF处理
- PDF拆分 (将PDF拆分为单页)
- PDF合并 (合并多个PDF文件)
- PDF转图片 (PDF → jpg/png)

### Markdown处理
- Markdown → HTML
- Markdown → Word
- Markdown → PDF

## 执行流程
1. **上传文件** - 支持从微信聊天记录、手机本地选择文件，支持批量上传
2. **选择目标格式** - 根据源文件智能推荐可转换格式
3. **执行转换** - 实时显示转换进度
4. **预览结果** - 在线预览转换后的文件
5. **保存或分享** - 保存到本地或分享给好友

## 特色功能
- 🔒 **文件大小限制** - 单个文件最大10MB
- 📺 **激励视频广告** - 观看一次广告获得1次免费转换
- 📊 **统计后台** - 记录并展示转换调用量统计
- 💾 **历史记录** - 本地保存转换历史，支持再次转换

## 项目结构

```
zhuanhuan/
├── miniprogram/              # 微信小程序前端代码
│   ├── pages/
│   │   ├── index/            # 首页 - 快捷转换入口
│   │   ├── upload/           # 上传页 - 文件选择
│   │   ├── convert/          # 转换页 - 格式选择与进度
│   │   ├── preview/          # 预览页 - 结果预览与分享
│   │   ├── history/          # 历史页 - 转换历史记录
│   │   └── admin/            # 管理页 - 统计后台
│   ├── utils/
│   │   ├── api.js            # 接口请求封装
│   │   └── util.js           # 工具函数
│   ├── app.js                # 小程序入口
│   ├── app.json              # 小程序配置
│   ├── app.wxss              # 全局样式
│   └── project.config.json   # 项目配置
└── server/                   # 后端服务代码
    ├── converters/           # 文件转换模块
    │   ├── docConverter.js   # 文档转换
    │   ├── pdfConverter.js   # PDF转换
    │   ├── imageConverter.js # 图片转换
    │   └── mdConverter.js    # Markdown转换
    ├── database.js           # 数据库操作
    ├── server.js             # Express服务入口
    └── package.json          # 依赖配置
```

## 快速开始

### 1. 启动后端服务

```bash
cd server
npm install
npm start
```

服务将在 `http://localhost:3000` 启动。

### 2. 配置小程序

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram` 目录
3. 在 `app.js` 中修改 `apiBaseUrl` 为你的后端服务地址
4. 在微信公众平台配置服务器域名

### 3. 配置激励视频广告
在 `app.js` 中将 `adUnitId` 替换为你在微信广告平台申请的广告位ID。

### 4. 统计后台
访问小程序内「我的」页面，点击右上角设置图标，输入管理员密码（默认：admin123）进入统计后台。

## 技术栈

### 前端
- 微信小程序原生框架
- WXML / WXSS / JavaScript

### 后端
- Node.js
- Express.js
- SQLite3 (数据库)
- pdf-lib (PDF处理)
- sharp (图片处理)
- showdown (Markdown转HTML)

## API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/health | GET | 健康检查 |
| /api/convert | POST | 文件转换 |
| /api/download/:fileId | GET | 下载文件 |
| /api/history | GET | 获取转换历史 |
| /api/admin/statistics | GET | 获取统计数据 |
| /api/admin/login | POST | 管理员登录 |

## 注意事项

1. **广告配置** - 需要在微信公众平台申请激励视频广告位
2. **域名配置** - 需在微信公众平台配置request合法域名
3. **文件大小** - 单个文件限制为10MB
4. **隐私协议** - 使用前请确保符合微信小程序隐私协议要求

## License

MIT
