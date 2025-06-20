# GitLab Pipeline Monitor

**English** | [中文](README.zh.md)

A Chrome extension for monitoring GitLab Pipeline status with multi-project support, real-time notifications, and state persistence.

## ✨ Key Features

### Core Features
- 📊 **Multi-Project Monitoring**: Monitor multiple GitLab projects' pipeline status simultaneously
- 🔄 **Real-time Refresh**: Support manual refresh and automatic scheduled refresh (1-30 minute intervals)
- 🔔 **Desktop Notifications**: Automatic notifications when pipelines fail or complete
- 📱 **Status Badge**: Extension icon displays count of failed or running pipelines
- 💾 **State Persistence**: Maintain extension state when switching pages, avoiding reloads

### Interface Features
- 🎨 **Modern UI**: Beautiful interface based on Tailwind CSS
- 🔍 **Search & Filter**: Search by branch name, commit message, username
- 📋 **Status Filter**: Filter display by pipeline status
- 🔗 **Quick Navigation**: Click on failed pipelines to jump directly to GitLab
- ❓ **Built-in Help**: Provides guidance for Access Token creation and project configuration

### Advanced Features
- ⏰ **Auto Refresh**: Configurable background automatic checking and notifications
- 🎯 **Smart Notifications**: Only notify on status changes or new pipeline failures
- 📈 **Multi-Status Support**: Display success, failed, running, pending, canceled states
- 🔄 **Graceful Degradation**: Friendly error messages for network issues

## 📦 Installation & Usage

### 1. Download Extension
```bash
git clone https://github.com/leylatop/gitlab-pipeline-monitor.git
cd gitlab-pipeline-monitor
```

### 2. Install to Chrome
1. Open Chrome browser
2. Enter `chrome://extensions/` in the address bar
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension directory

### 3. Configure Extension

#### Step 1: Basic Configuration
1. Click the extension icon to open the interface
2. Click the gear icon in the top right to enter settings
3. Fill in the following information:
   - **GitLab URL**: Your GitLab instance address (e.g., `https://gitlab.com`)
   - **Access Token**: Your personal access token

#### Step 2: Get Access Token
The extension provides complete guidance for obtaining Access Token:

1. Click the help button ❓ next to Access Token in settings
2. Or click the "Create Token" link to jump directly to GitLab
3. Create a token with the following permissions as instructed:
   - `read_api` - Read API permissions
   - `read_repository` - Read repository permissions

#### Step 3: Add Monitoring Projects
1. Click "Add Project" in the "Monitoring Projects" section of settings
2. Enter the project's Project ID
3. Click "Confirm Add"
4. You can add multiple projects for monitoring

#### Step 4: Configure Auto Refresh (Optional)
- Check "Enable Auto Refresh"
- Select refresh interval (1-30 minutes)
- The extension will periodically check pipeline status in the background

## 🎯 Feature Details

### Project Management
- **Multi-Project Support**: Monitor multiple GitLab projects simultaneously
- **Project Switching**: Quick switching between different projects via dropdown menu
- **Dynamic Addition**: Add or remove monitoring projects at runtime
- **Project Validation**: Verify access permissions when adding projects

### Status Display
| Status | Display | Description |
|--------|---------|-------------|
| ✅ Success | Green border | Pipeline executed successfully |
| ❌ Failed | Red border | Pipeline execution failed, clickable to jump |
| 🔄 Running | Blue border | Pipeline is executing |
| ⏳ Pending | Yellow border | Pipeline waiting for execution |
| ⏹️ Canceled | Gray border | Pipeline canceled by user |

### Notification Mechanism
- **Failure Notifications**: Immediate notification when new pipeline fails
- **Completion Notifications**: Notify when running pipeline completes
- **Status Changes**: Notify when pipeline status changes
- **Avoid Duplicates**: Same status won't be notified repeatedly

### State Persistence
- **Cross-Page Maintenance**: Keep extension state when switching browser tabs
- **Search Persistence**: Search conditions and filter settings are saved
- **Project Memory**: Remember currently selected project
- **Settings Sync**: Settings changes sync to background in real-time

## 🔧 Configuration Instructions

### GitLab URL Format
- Public GitLab: `https://gitlab.com`
- Private instance: `https://gitlab.company.com`
- With port: `https://gitlab.company.com:8080`

### How to Get Project ID
1. Log in to GitLab and enter project settings page
2. Select "General" from the left menu
3. Find the Project ID in the "Project ID" field

### Access Token Permissions
The extension requires the following minimum permissions:
- `read_api`: Read API data
- `read_repository`: Read repository information (for getting commit details)

## 📋 Usage Tips

### Keyboard Shortcuts
- `Ctrl/Cmd + R`: Refresh pipeline list
- `Esc`: Close settings panel or cancel operation

### Search Tips
- Search by branch name: `feature/login`
- Search by commit message: `fix bug`
- Search by username: `John`
- Combined search: Enter multiple keywords

### Filter Tips
- Use status filters to quickly view pipelines of specific status
- Combine search and filter to narrow down results
- Clear search box to show all results

## 🔒 Privacy & Security

### Data Storage
- All configuration information is stored locally in the browser
- No data is uploaded to third-party servers
- Access Token uses browser secure storage

### Permission Requirements
Permissions requested by the extension and their purposes:
- `storage`: Save configuration information and state
- `alarms`: Implement auto-refresh functionality
- `notifications`: Send desktop notifications
- `tabs`: Open GitLab pages when failures occur

## 🐛 Troubleshooting

### Common Issues

#### 1. Cannot Load Pipeline Data
**Possible Causes**:
- Incorrect GitLab URL
- Invalid Access Token or insufficient permissions
- Network connection issues
- Project ID doesn't exist or no access permissions

**Solutions**:
1. Check if GitLab URL is accessible
2. Regenerate Access Token and ensure correct permissions
3. Verify Project ID is correct
4. Check network connection

#### 2. Notifications Not Working
**Possible Causes**:
- Browser notification permissions disabled
- Auto refresh not enabled
- Background script error

**Solutions**:
1. Check browser notification permission settings
2. Enable auto refresh functionality
3. Reinstall the extension

#### 3. Project Addition Failed
**Possible Causes**:
- Incorrect Project ID format (should be numbers only)
- No access permissions
- Network connection issues

**Solutions**:
1. Confirm Project ID is in numeric format only
2. Check if you have project access permissions
3. Try manually accessing project API

#### 4. Interface Display Issues
**Possible Causes**:
- CSS file loading failed
- Browser compatibility issues

**Solutions**:
1. Refresh extension or reload
2. Check browser version (Chrome 88+ recommended)
3. Clear browser cache

### Debug Mode
1. Open Chrome Developer Tools (F12)
2. Switch to Console tab
3. View error messages and debug logs
4. Please provide error information if issues persist

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Development Environment
1. Clone project locally
2. Load development version in Chrome
3. Test after modifying code by reloading extension

### Submission Guidelines
- Use meaningful commit messages
- Follow existing code style
- Add necessary comments
- Test new feature compatibility

## 📄 License

This project is open source under the MIT License. See [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or suggestions, please:
1. Submit GitHub Issue
2. Send email to: [leyla_qiao@163.com](mailto:leyla_qiao@163.com)
3. Check [QUICK_START.md](QUICK_START.md) for more information

---

**Happy Coding! 🚀** 