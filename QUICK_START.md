# 🚀 快速开始指南

这份指南将帮助您在 5 分钟内开始使用 GitLab Pipeline Monitor 监控您的项目。

## 📥 第一步：安装插件

### 从源码安装
```bash
# 下载项目
git clone https://github.com/leylatop/gitlab-pipeline-monitor.git
cd gitlab-pipeline-monitor

# 在 Chrome 中加载
# 1. 打开 chrome://extensions/
# 2. 启用「开发者模式」
# 3. 点击「加载已解压的扩展程序」
# 4. 选择项目文件夹
```

## ⚙️ 第二步：基础配置

### 1. 打开设置面板
- 点击浏览器工具栏中的 GitLab 插件图标
- 点击右上角的齿轮图标 ⚙️

### 2. 配置 GitLab 连接
填写以下基础信息：

**GitLab URL** (必填)
```
# 官方 GitLab
https://gitlab.com

# 私有部署
https://gitlab.company.com
```

**Access Token** (必填)
- 点击 Access Token 字段旁边的 ❓ 帮助按钮
- 或直接点击「🔗 创建 Token」链接跳转到 GitLab
- 创建具有 `read_api` 和 `read_repository` 权限的 Token

## 📋 第三步：添加项目

### 快速添加项目
1. 在设置面板中找到「监控项目」部分
2. 点击「➕ 添加项目」按钮
3. 输入项目的 Project ID
4. 点击「确认添加」

### 获取 Project ID
**方法**: 项目设置页面
- 进入项目 → Settings → General
- 在 Project information 中查看 Project ID

### 示例
```
Project ID: 12345678  ✅
Project ID: my-project  ❌ (应为数字)
```

## ✅ 第四步：完成设置

1. **保存配置**: 点击「保存设置」按钮
2. **选择项目**: 在项目选择器中选择要查看的项目
3. **开始监控**: 插件会自动加载 Pipeline 数据

## 🔄 第五步：启用自动刷新（可选）

### 自动监控设置
在设置面板中：
1. ✅ 勾选「启用自动刷新」
2. 选择刷新间隔（建议 5-10 分钟）
3. 保存设置

### 功能说明
- 🔔 **自动通知**: Pipeline 失败时发送桌面通知
- 🔴 **状态徽章**: 插件图标显示失败数量
- 📱 **后台监控**: 不需要打开插件界面

## 🎯 使用技巧

### 多项目管理
```
✅ 同时监控多个项目
✅ 快速切换项目视图
✅ 独立项目状态追踪
✅ 统一通知管理
```

### 搜索和过滤
```
🔍 搜索分支: feature/login
🔍 搜索提交: fix bug
🔍 搜索用户: 张三
📋 状态过滤: 只看失败的 Pipeline
```

### 快捷操作
```
🖱️  点击失败 Pipeline → 跳转到 GitLab
⌨️  Ctrl/Cmd + R → 刷新 Pipeline
⌨️  Esc → 关闭设置面板
```

## 🔧 常见问题

### ❓ Token 创建失败
**解决方案**: 
- 使用插件内置的帮助链接
- 确保选择正确的权限 (`read_api` + `read_repository`)
- Token 名称可以设置为 "Pipeline Monitor"

### ❓ 项目添加失败
**检查清单**:
- [ ] Project ID 是纯数字格式
- [ ] 有项目访问权限
- [ ] GitLab URL 和 Token 配置正确
- [ ] 网络连接正常

### ❓ 无法加载数据
**常见原因**:
1. **URL 错误**: 检查 GitLab URL 格式
2. **权限不足**: 重新生成 Access Token
3. **网络问题**: 确认能访问 GitLab
4. **项目权限**: 确认对项目有访问权限

### ❓ 通知不工作
**解决步骤**:
1. 检查浏览器通知权限
2. 启用自动刷新功能  
3. 确认有失败的 Pipeline 触发

## 🏁 完成设置

设置完成后，您将看到：

```
✅ Pipeline 列表正常加载
✅ 可以搜索和过滤
✅ 失败项目可以点击跳转
✅ 状态徽章显示在图标上
✅ 桌面通知正常工作
```

## 📚 进阶功能

### 状态持久化
- 💾 切换页面时保持插件状态
- 🔄 记住搜索条件和当前项目
- ⚡ 快速恢复工作状态

### 智能通知
- 🎯 只在关键状态变化时通知
- 🚫 避免重复通知同一状态
- 📊 多项目状态统一管理

---

🎉 **恭喜！** 您已成功配置 GitLab Pipeline Monitor

如有问题，请查看完整的 [README.md](README.md) 文档或提交 GitHub Issue。 