class GitLabPipelineMonitor {
  constructor() {
    this.currentPipelines = [];
    this.filteredPipelines = [];
    this.settings = {};
    this.projects = [];
    this.currentProjectId = null;
    this.autoRefreshSettings = {};
    this.isLoading = false;
    this.state = {
      searchTerm: '',
      statusFilter: '',
      settingsPanelOpen: false
    };
    
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.restoreState();
  }

  initializeElements() {
    // 状态面板
    this.loadingState = document.getElementById('loadingState');
    this.errorState = document.getElementById('errorState');
    this.unconfiguredState = document.getElementById('unconfiguredState');
    this.pipelineList = document.getElementById('pipelineList');
    this.emptyState = document.getElementById('emptyState');
    
    // 设置相关
    this.settingsPanel = document.getElementById('settingsPanel');
    this.pipelinePanel = document.getElementById('pipelinePanel');
    this.gitlabUrlInput = document.getElementById('gitlabUrl');
    this.accessTokenInput = document.getElementById('accessToken');
    this.projectSelector = document.getElementById('projectSelector');
    this.currentProjectSelect = document.getElementById('currentProjectSelect');
    this.projectList = document.getElementById('projectList');
    this.addProjectForm = document.getElementById('addProjectForm');
    this.newProjectIdInput = document.getElementById('newProjectId');
    
    // 控制按钮
    this.refreshBtn = document.getElementById('refreshBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    this.retryBtn = document.getElementById('retryBtn');
    this.configureBtn = document.getElementById('configureBtn');
    this.addProjectBtn = document.getElementById('addProjectBtn');
    this.confirmAddBtn = document.getElementById('confirmAddBtn');
    this.cancelAddBtn = document.getElementById('cancelAddBtn');
    
    // 帮助按钮
    this.tokenHelpBtn = document.getElementById('tokenHelpBtn');
    this.createTokenBtn = document.getElementById('createTokenBtn');
    this.projectHelpBtn = document.getElementById('projectHelpBtn')
    this.projectHelpBtn = document.getElementById('projectHelpBtn');
    
    // 搜索和过滤
    this.searchInput = document.getElementById('searchInput');
    this.statusFilter = document.getElementById('statusFilter');
    
    // 状态文本
    this.statusText = document.getElementById('statusText');
    this.lastUpdateTime = document.getElementById('lastUpdateTime');
    this.errorMessage = document.getElementById('errorMessage');
  }

  bindEvents() {
    // 按钮事件
    this.refreshBtn.addEventListener('click', () => this.loadPipelines());
    this.settingsBtn.addEventListener('click', () => this.toggleSettings());
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.cancelSettingsBtn.addEventListener('click', () => this.hideSettings());
    this.retryBtn.addEventListener('click', () => this.loadPipelines());
    this.configureBtn.addEventListener('click', () => this.showSettings());
    
    // 项目管理
    this.addProjectBtn.addEventListener('click', () => this.showAddProjectForm());
    this.confirmAddBtn.addEventListener('click', () => this.addProject());
    this.cancelAddBtn.addEventListener('click', () => this.hideAddProjectForm());
    this.currentProjectSelect.addEventListener('change', () => this.switchProject());
    
    // 帮助链接
    this.tokenHelpBtn.addEventListener('click', () => this.showTokenHelp());
    this.createTokenBtn.addEventListener('click', () => this.openCreateTokenPage());
    this.projectHelpBtn.addEventListener('click', () => this.showProjectHelp());
    
    // 搜索和过滤事件
    this.searchInput.addEventListener('input', () => {
      this.state.searchTerm = this.searchInput.value;
      this.saveState();
      this.filterPipelines();
    });
    
    this.statusFilter.addEventListener('change', () => {
      this.state.statusFilter = this.statusFilter.value;
      this.saveState();
      this.filterPipelines();
    });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSettings();
        this.hideAddProjectForm();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.loadPipelines();
      }
    });

    // 新建项目输入框回车事件
    this.newProjectIdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.addProject();
      }
    });
  }

  // 状态持久化
  async saveState() {
    try {
      await chrome.storage.local.set({ 
        appState: {
          ...this.state,
          currentProjectId: this.currentProjectId
        }
      });
    } catch (error) {
      console.error('保存状态失败:', error);
    }
  }

  async restoreState() {
    try {
      const result = await chrome.storage.local.get(['appState']);
      if (result.appState) {
        this.state = { ...this.state, ...result.appState };
        this.currentProjectId = result.appState.currentProjectId;
        
        // 恢复 UI 状态
        this.searchInput.value = this.state.searchTerm || '';
        this.statusFilter.value = this.state.statusFilter || '';
        
        if (this.state.settingsPanelOpen) {
          this.showSettings();
        }
      }
    } catch (error) {
      console.error('恢复状态失败:', error);
    }
  }

  // 帮助功能
  showTokenHelp() {
    const helpText = `创建 GitLab Personal Access Token 步骤：

1. 登录您的 GitLab 实例
2. 点击右上角头像 → Settings
3. 左侧菜单选择 "Access Tokens"
4. 填写 Token 信息：
   - Name: Pipeline Monitor
   - Expiration date: 选择较远日期
   - Scopes: 勾选 read_api 和 read_repository
5. 点击 "Create personal access token"
6. 复制生成的 token（以 glpat- 开头）

注意：Token 只显示一次，请立即复制保存！`;

    alert(helpText);
  }

  openCreateTokenPage() {
    const gitlabUrl = this.gitlabUrlInput.value.trim() || 'https://gitlab.com';
    const tokenUrl = `${gitlabUrl}/-/user_settings/personal_access_tokens`;
    chrome.tabs.create({ url: tokenUrl });
  }

  showProjectHelp() {
    const helpText = `在项目设置页面可以找到 Project ID:
1. 点击项目名称
2. 点击 "Settings"
3. 在左侧菜单选择 "General"
4. 在 "Project ID" 字段中找到 Project ID
    `;
    alert(helpText);
  }

  // 项目管理
  showAddProjectForm() {
    this.addProjectForm.classList.remove('hidden');
    this.newProjectIdInput.focus();
  }

  hideAddProjectForm() {
    this.addProjectForm.classList.add('hidden');
    this.newProjectIdInput.value = '';
  }

  async addProject() {
    const projectId = this.newProjectIdInput.value.trim();
    
    if (!projectId) {
      alert('请输入 Project ID');
      return;
    }

    if (!/^\d+$/.test(projectId)) {
      alert('Project ID 应该是纯数字');
      return;
    }

    if (this.projects.find(p => p.id === projectId)) {
      alert('该项目已存在');
      return;
    }

    // 验证项目是否存在
    try {
      const isValid = await this.validateProject(projectId);
      if (!isValid) {
        alert('无法访问该项目，请检查 Project ID 或访问权限');
        return;
      }

      // 获取项目信息
      const projectInfo = await this.getProjectInfo(projectId);
      
      this.projects.push({
        id: projectId,
        name: projectInfo?.name || `Project ${projectId}`,
        path: projectInfo?.path_with_namespace || projectId
      });

      await this.saveSettings();
      this.renderProjectList();
      this.updateProjectSelector();
      this.hideAddProjectForm();
      
      // 如果是第一个项目，自动选择
      if (this.projects.length === 1) {
        this.currentProjectId = projectId;
        this.currentProjectSelect.value = projectId;
        await this.saveState();
        this.loadPipelines();
      }

      this.updateStatus(`项目 ${projectInfo?.name || projectId} 已添加`);
    } catch (error) {
      console.error('添加项目失败:', error);
      alert('添加项目失败，请检查网络连接和配置');
    }
  }

  async validateProject(projectId) {
    if (!this.isConfigured()) return false;
    
    try {
      const apiUrl = `${this.settings.gitlabUrl}/api/v4/projects/${projectId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': this.settings.accessToken
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getProjectInfo(projectId) {
    try {
      const apiUrl = `${this.settings.gitlabUrl}/api/v4/projects/${projectId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': this.settings.accessToken
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('获取项目信息失败:', error);
    }
    return null;
  }

  removeProject(projectId) {
    if (confirm('确定要移除这个项目吗？')) {
      this.projects = this.projects.filter(p => p.id !== projectId);
      
      // 如果删除的是当前项目，切换到第一个项目
      if (this.currentProjectId === projectId) {
        this.currentProjectId = this.projects.length > 0 ? this.projects[0].id : null;
        this.currentProjectSelect.value = this.currentProjectId || '';
      }
      
      this.saveSettings();
      this.renderProjectList();
      this.updateProjectSelector();
      
      if (this.currentProjectId) {
        this.loadPipelines();
      } else {
        this.showUnconfiguredState();
      }
    }
  }

  switchProject() {
    const selectedProjectId = this.currentProjectSelect.value;
    if (selectedProjectId !== this.currentProjectId) {
      this.currentProjectId = selectedProjectId;
      this.saveState();
      if (this.currentProjectId) {
        this.loadPipelines();
      }
    }
  }

  renderProjectList() {
    this.projectList.innerHTML = '';
    
    this.projects.forEach(project => {
      const projectDiv = document.createElement('div');
      projectDiv.className = `project-item ${project.id === this.currentProjectId ? 'active' : ''}`;
      
      projectDiv.innerHTML = `
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-800">${project.name}</div>
          <div class="text-xs text-gray-500">ID: ${project.id}</div>
        </div>
        <button class="remove-btn" onclick="monitor.removeProject('${project.id}')" title="移除项目">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      this.projectList.appendChild(projectDiv);
    });
  }

  updateProjectSelector() {
    // 清空选择器
    this.currentProjectSelect.innerHTML = '<option value="">选择项目</option>';
    
    // 添加项目选项
    this.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = `${project.name} (${project.id})`;
      this.currentProjectSelect.appendChild(option);
    });
    
    // 设置当前选中项目
    if (this.currentProjectId) {
      this.currentProjectSelect.value = this.currentProjectId;
    }
    
    // 显示或隐藏项目选择器
    if (this.projects.length > 0) {
      this.projectSelector.classList.remove('hidden');
    } else {
      this.projectSelector.classList.add('hidden');
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['gitlabSettings', 'autoRefreshSettings', 'projects']);
      this.settings = result.gitlabSettings || {};
      this.autoRefreshSettings = result.autoRefreshSettings || { enabled: false, interval: 5 };
      this.projects = result.projects || [];
      
      if (this.settings.gitlabUrl) this.gitlabUrlInput.value = this.settings.gitlabUrl;
      if (this.settings.accessToken) this.accessTokenInput.value = this.settings.accessToken;
      
      // 迁移旧的单项目配置
      if (this.settings.projectId && this.projects.length === 0) {
        this.projects.push({
          id: this.settings.projectId,
          name: `Project ${this.settings.projectId}`,
          path: this.settings.projectId
        });
        await this.saveSettings();
      }
      
      this.renderProjectList();
      this.updateProjectSelector();
      this.loadAutoRefreshSettings();
      
      // 检查是否已配置
      if (this.isConfigured() && this.projects.length > 0) {
        if (!this.currentProjectId) {
          this.currentProjectId = this.projects[0].id;
          this.currentProjectSelect.value = this.currentProjectId;
          await this.saveState();
        }
        this.loadPipelines();
      } else {
        this.showUnconfiguredState();
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      this.showUnconfiguredState();
    }
  }

  loadAutoRefreshSettings() {
    const autoRefreshEnabled = document.getElementById('autoRefreshEnabled');
    const autoRefreshInterval = document.getElementById('autoRefreshInterval');
    
    if (autoRefreshEnabled) {
      autoRefreshEnabled.checked = this.autoRefreshSettings.enabled;
    }
    if (autoRefreshInterval) {
      autoRefreshInterval.value = this.autoRefreshSettings.interval;
    }
  }

  async saveSettings() {
    const newSettings = {
      gitlabUrl: this.gitlabUrlInput.value.trim(),
      accessToken: this.accessTokenInput.value.trim()
    };

    // 验证输入
    if (!newSettings.gitlabUrl || !newSettings.accessToken) {
      this.showError('请填写 GitLab URL 和 Access Token');
      return;
    }

    // 获取自动刷新设置
    const autoRefreshEnabled = document.getElementById('autoRefreshEnabled');
    const autoRefreshInterval = document.getElementById('autoRefreshInterval');
    
    const newAutoRefreshSettings = {
      enabled: autoRefreshEnabled ? autoRefreshEnabled.checked : false,
      interval: autoRefreshInterval ? parseInt(autoRefreshInterval.value) : 5
    };

    try {
      await chrome.storage.local.set({ 
        gitlabSettings: newSettings,
        autoRefreshSettings: newAutoRefreshSettings,
        projects: this.projects
      });
      
      this.settings = newSettings;
      this.autoRefreshSettings = newAutoRefreshSettings;
      
      // 通知后台脚本更新自动刷新设置
      if (newAutoRefreshSettings.enabled) {
        chrome.runtime.sendMessage({
          action: 'enableAutoRefresh',
          interval: newAutoRefreshSettings.interval
        });
      } else {
        chrome.runtime.sendMessage({
          action: 'disableAutoRefresh'
        });
      }
      
      this.hideSettings();
      
      if (this.currentProjectId) {
        this.loadPipelines();
      }
      
      this.updateStatus('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showError('保存设置失败');
    }
  }

  isConfigured() {
    return this.settings.gitlabUrl && this.settings.accessToken;
  }

  toggleSettings() {
    if (this.settingsPanel.classList.contains('hidden')) {
      this.showSettings();
    } else {
      this.hideSettings();
    }
  }

  showSettings() {
    this.settingsPanel.classList.remove('hidden');
    this.pipelinePanel.classList.add('hidden');
    this.state.settingsPanelOpen = true;
    this.saveState();
    this.ensureAutoRefreshControls();
  }

  hideSettings() {
    this.settingsPanel.classList.add('hidden');
    this.pipelinePanel.classList.remove('hidden');
    this.hideAddProjectForm();
    this.state.settingsPanelOpen = false;
    this.saveState();
  }

  ensureAutoRefreshControls() {
    const existingAutoRefresh = document.getElementById('autoRefreshEnabled');
    if (!existingAutoRefresh) {
      this.addAutoRefreshControls();
    }
  }

  addAutoRefreshControls() {
    const settingsContainer = this.settingsPanel.querySelector('.space-y-3');
    
    const autoRefreshDiv = document.createElement('div');
    autoRefreshDiv.innerHTML = `
      <div class="border-t border-gray-200 pt-3 mt-3">
        <label class="block text-xs font-medium text-gray-600 mb-2">自动刷新设置</label>
        <div class="flex items-center space-x-3 mb-2">
          <input type="checkbox" id="autoRefreshEnabled" class="rounded border-gray-300 text-orange-600 focus:ring-orange-500">
          <label for="autoRefreshEnabled" class="text-xs text-gray-700">启用自动刷新</label>
        </div>
        <div class="flex items-center space-x-2">
          <label class="text-xs text-gray-600">间隔:</label>
          <select id="autoRefreshInterval" class="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="1">1分钟</option>
            <option value="2">2分钟</option>
            <option value="5">5分钟</option>
            <option value="10">10分钟</option>
            <option value="15">15分钟</option>
            <option value="30">30分钟</option>
          </select>
        </div>
      </div>
    `;
    
    const buttonsDiv = settingsContainer.querySelector('.flex.space-x-2.pt-2');
    settingsContainer.insertBefore(autoRefreshDiv, buttonsDiv);
    
    this.loadAutoRefreshSettings();
  }

  async loadPipelines() {
    if (!this.isConfigured() || !this.currentProjectId) {
      this.showUnconfiguredState();
      return;
    }

    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();
    this.updateRefreshButtonState();

    try {
      const apiUrl = `${this.settings.gitlabUrl}/api/v4/projects/${this.currentProjectId}/pipelines?per_page=20&sort=desc`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': this.settings.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const pipelines = await response.json();
      
      const detailedPipelines = await Promise.all(
        pipelines.map(pipeline => this.getPipelineDetails(pipeline))
      );

      this.currentPipelines = detailedPipelines;
      this.filterPipelines();
      this.updateStatus(`已加载 ${pipelines.length} 个 Pipeline`);
      this.updateLastUpdateTime();
      
    } catch (error) {
      console.error('加载 Pipeline 失败:', error);
      this.showError(`加载失败: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.updateRefreshButtonState();
    }
  }

  async getPipelineDetails(pipeline) {
    try {
      const commitUrl = `${this.settings.gitlabUrl}/api/v4/projects/${this.currentProjectId}/repository/commits/${pipeline.sha}`;
      const commitResponse = await fetch(commitUrl, {
        headers: {
          'PRIVATE-TOKEN': this.settings.accessToken
        }
      });

      let commitInfo = null;
      if (commitResponse.ok) {
        commitInfo = await commitResponse.json();
      }

      return {
        ...pipeline,
        commit: commitInfo
      };
    } catch (error) {
      console.error('获取提交信息失败:', error);
      return pipeline;
    }
  }

  filterPipelines() {
    const searchTerm = this.state.searchTerm.toLowerCase().trim();
    const statusFilter = this.state.statusFilter;

    this.filteredPipelines = this.currentPipelines.filter(pipeline => {
      if (statusFilter && pipeline.status !== statusFilter) {
        return false;
      }

      if (searchTerm) {
        const searchableText = [
          pipeline.ref,
          pipeline.commit?.message || '',
          pipeline.commit?.author_name || '',
          pipeline.user?.name || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    this.renderPipelines();
  }

  renderPipelines() {
    this.hideAllStates();

    if (this.filteredPipelines.length === 0) {
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.pipelineList.classList.remove('hidden');
    this.pipelineList.innerHTML = '';

    this.filteredPipelines.forEach(pipeline => {
      const pipelineElement = this.createPipelineElement(pipeline);
      this.pipelineList.appendChild(pipelineElement);
    });
  }

  createPipelineElement(pipeline) {
    const div = document.createElement('div');
    div.className = `pipeline-item bg-white rounded-lg border-l-4 p-3 cursor-pointer ${this.getStatusClass(pipeline.status)}`;
    
    if (pipeline.status === 'failed') {
      div.addEventListener('click', () => {
        const pipelineUrl = `${this.settings.gitlabUrl}/${this.currentProjectId}/-/pipelines/${pipeline.id}`;
        chrome.tabs.create({ url: pipelineUrl });
      });
      div.classList.add('hover:shadow-md');
    }

    const statusIcon = this.getStatusIcon(pipeline.status);
    const statusText = this.getStatusText(pipeline.status);
    const timeInfo = this.formatTimeInfo(pipeline);

    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-2">
            <i class="${statusIcon}"></i>
            <span class="text-sm font-medium">#${pipeline.id}</span>
            <span class="text-xs px-2 py-1 rounded-full ${this.getStatusBadgeClass(pipeline.status)}">
              ${statusText}
            </span>
          </div>
          
          <div class="text-sm text-gray-700 mb-1">
            <i class="fas fa-code-branch text-gray-400 mr-1"></i>
            <span class="font-mono">${pipeline.ref}</span>
          </div>
          
          ${pipeline.commit ? `
            <div class="text-xs text-gray-600 mb-1 truncate" title="${pipeline.commit.message}">
              <i class="fas fa-comment text-gray-400 mr-1"></i>
              ${pipeline.commit.message}
            </div>
          ` : ''}
          
          <div class="text-xs text-gray-500">
            <i class="fas fa-user text-gray-400 mr-1"></i>
            ${pipeline.commit?.author_name || pipeline.user?.name || '未知用户'}
          </div>
        </div>
        
        <div class="text-right text-xs text-gray-500 ml-3">
          ${timeInfo}
          ${pipeline.status === 'failed' ? '<div class="mt-1"><i class="fas fa-external-link-alt"></i></div>' : ''}
        </div>
      </div>
    `;

    return div;
  }

  getStatusClass(status) {
    const classes = {
      'success': 'border-green-400',
      'failed': 'border-red-400',
      'running': 'border-blue-400',
      'pending': 'border-yellow-400',
      'canceled': 'border-gray-400'
    };
    return classes[status] || 'border-gray-400';
  }

  getStatusBadgeClass(status) {
    const classes = {
      'success': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'running': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'canceled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status) {
    const icons = {
      'success': 'fas fa-check-circle text-green-500',
      'failed': 'fas fa-times-circle text-red-500',
      'running': 'fas fa-circle-notch spinner text-blue-500',
      'pending': 'fas fa-clock text-yellow-500',
      'canceled': 'fas fa-ban text-gray-500'
    };
    return icons[status] || 'fas fa-question-circle text-gray-500';
  }

  getStatusText(status) {
    const texts = {
      'success': '成功',
      'failed': '失败',
      'running': '运行中',
      'pending': '等待中',
      'canceled': '已取消'
    };
    return texts[status] || status;
  }

  formatTimeInfo(pipeline) {
    const createdAt = new Date(pipeline.created_at);
    const now = new Date();
    const diffMs = now - createdAt;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo;
    if (diffDays > 0) {
      timeAgo = `${diffDays}天前`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}小时前`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins}分钟前`;
    } else {
      timeAgo = '刚刚';
    }

    let duration = '';
    if (pipeline.duration) {
      const durationMins = Math.floor(pipeline.duration / 60);
      const durationSecs = pipeline.duration % 60;
      if (durationMins > 0) {
        duration = `耗时 ${durationMins}分${durationSecs}秒`;
      } else {
        duration = `耗时 ${durationSecs}秒`;
      }
    }

    return `
      <div>${timeAgo}</div>
      ${duration ? `<div>${duration}</div>` : ''}
    `;
  }

  showLoadingState() {
    this.hideAllStates();
    this.loadingState.classList.remove('hidden');
  }

  showUnconfiguredState() {
    this.hideAllStates();
    this.unconfiguredState.classList.remove('hidden');
    this.updateStatus('未配置');
  }

  showError(message) {
    this.hideAllStates();
    this.errorState.classList.remove('hidden');
    this.errorMessage.textContent = message;
    this.updateStatus('错误');
  }

  hideAllStates() {
    this.loadingState.classList.add('hidden');
    this.errorState.classList.add('hidden');
    this.unconfiguredState.classList.add('hidden');
    this.emptyState.classList.add('hidden');
    this.pipelineList.classList.add('hidden');
  }

  updateRefreshButtonState() {
    if (this.isLoading) {
      this.refreshBtn.innerHTML = '<i class="fas fa-circle-notch spinner"></i>';
      this.refreshBtn.disabled = true;
    } else {
      this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      this.refreshBtn.disabled = false;
    }
  }

  updateStatus(text) {
    this.statusText.textContent = text;
  }

  updateLastUpdateTime() {
    const now = new Date();
    this.lastUpdateTime.textContent = `最后更新: ${now.toLocaleTimeString()}`;
  }
}

// 全局变量，用于在 HTML 中调用
let monitor;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  monitor = new GitLabPipelineMonitor();
}); 