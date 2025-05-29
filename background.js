// Chrome 插件后台服务脚本
class GitLabPipelineBackground {
  constructor() {
    this.settings = {};
    this.projects = [];
    this.autoRefreshAlarm = 'gitlab-pipeline-refresh';
    this.lastNotifiedPipelines = new Map(); // 存储每个项目的最后通知状态
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupMessageListeners();
    this.setupAlarmListeners();
    
    // 启动时检查是否需要启用自动刷新
    if (this.settings.autoRefresh?.enabled) {
      this.enableAutoRefresh(this.settings.autoRefresh.interval);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['gitlabSettings', 'autoRefreshSettings', 'projects']);
      this.settings = {
        gitlab: result.gitlabSettings || {},
        autoRefresh: result.autoRefreshSettings || { enabled: false, interval: 5 }
      };
      this.projects = result.projects || [];
      
      // 迁移旧的单项目配置
      if (this.settings.gitlab.projectId && this.projects.length === 0) {
        this.projects.push({
          id: this.settings.gitlab.projectId,
          name: `Project ${this.settings.gitlab.projectId}`,
          path: this.settings.gitlab.projectId
        });
        await chrome.storage.local.set({ projects: this.projects });
      }
    } catch (error) {
      console.error('加载后台设置失败:', error);
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'enableAutoRefresh':
          this.enableAutoRefresh(message.interval);
          break;
        case 'disableAutoRefresh':
          this.disableAutoRefresh();
          break;
        case 'checkPipelines':
          this.checkAllProjectsPipelines();
          break;
        default:
          break;
      }
    });
  }

  setupAlarmListeners() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.autoRefreshAlarm) {
        this.checkAllProjectsPipelines();
      }
    });
  }

  enableAutoRefresh(intervalMinutes) {
    // 清除现有的闹钟
    chrome.alarms.clear(this.autoRefreshAlarm);
    
    // 设置新的闹钟
    chrome.alarms.create(this.autoRefreshAlarm, {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes
    });
    
    console.log(`自动刷新已启用，间隔: ${intervalMinutes} 分钟`);
  }

  disableAutoRefresh() {
    chrome.alarms.clear(this.autoRefreshAlarm);
    console.log('自动刷新已禁用');
  }

  async checkAllProjectsPipelines() {
    if (!this.isConfigured() || this.projects.length === 0) {
      return;
    }

    console.log('开始检查所有项目的 Pipeline 状态...');
    
    // 并行检查所有项目
    const results = await Promise.allSettled(
      this.projects.map(project => this.checkProjectPipelines(project))
    );
    
    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Pipeline 检查完成: ${successful} 个项目成功, ${failed} 个项目失败`);
    
    // 更新徽章
    this.updateBadge();
  }

  async checkProjectPipelines(project) {
    try {
      const latestPipeline = await this.getLatestPipeline(project.id);
      
      if (!latestPipeline) {
        return;
      }

      const lastNotified = this.lastNotifiedPipelines.get(project.id);
      
      // 检查是否需要发送通知
      if (this.shouldNotify(latestPipeline, lastNotified)) {
        await this.sendNotification(latestPipeline, project);
        this.lastNotifiedPipelines.set(project.id, {
          id: latestPipeline.id,
          status: latestPipeline.status,
          timestamp: Date.now()
        });
      }
      
      return latestPipeline;
    } catch (error) {
      console.error(`检查项目 ${project.name} (${project.id}) 失败:`, error);
      throw error;
    }
  }

  async getLatestPipeline(projectId) {
    try {
      const apiUrl = `${this.settings.gitlab.gitlabUrl}/api/v4/projects/${projectId}/pipelines?per_page=1&sort=desc`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'PRIVATE-TOKEN': this.settings.gitlab.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const pipelines = await response.json();
      return pipelines.length > 0 ? pipelines[0] : null;
    } catch (error) {
      console.error(`获取项目 ${projectId} 的最新 Pipeline 失败:`, error);
      throw error;
    }
  }

  shouldNotify(currentPipeline, lastNotified) {
    if (!lastNotified) {
      // 首次检查，只在失败时通知
      return currentPipeline.status === 'failed';
    }

    // 如果是新的 Pipeline
    if (currentPipeline.id !== lastNotified.id) {
      return currentPipeline.status === 'failed' || currentPipeline.status === 'success';
    }

    // 同一个 Pipeline 状态发生变化
    if (currentPipeline.status !== lastNotified.status) {
      return currentPipeline.status === 'failed' || 
             (lastNotified.status === 'running' && currentPipeline.status === 'success');
    }

    return false;
  }

  async sendNotification(pipeline, project) {
    const statusText = this.getStatusText(pipeline.status);
    const statusIcon = this.getNotificationIcon(pipeline.status);
    
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: statusIcon,
        title: `GitLab Pipeline ${statusText}`,
        message: `项目: ${project.name}\n分支: ${pipeline.ref}\nPipeline #${pipeline.id}`,
        contextMessage: '点击查看详情',
        priority: pipeline.status === 'failed' ? 2 : 1
      });
      
      console.log(`已发送通知: 项目 ${project.name} Pipeline #${pipeline.id} ${statusText}`);
    } catch (error) {
      console.error('发送通知失败:', error);
    }
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

  getNotificationIcon(status) {
    // 返回相应状态的图标路径
    const icons = {
      'success': 'icons/success.png',
      'failed': 'icons/failed.png',
      'running': 'icons/running.png',
      'pending': 'icons/pending.png',
      'canceled': 'icons/canceled.png'
    };
    return icons[status] || 'icons/icon48.png';
  }

  async updateBadge() {
    try {
      let totalFailed = 0;
      let totalRunning = 0;
      
      // 获取所有项目的最新状态
      for (const project of this.projects) {
        try {
          const latestPipeline = await this.getLatestPipeline(project.id);
          if (latestPipeline) {
            if (latestPipeline.status === 'failed') {
              totalFailed++;
            } else if (latestPipeline.status === 'running') {
              totalRunning++;
            }
          }
        } catch (error) {
          console.error(`获取项目 ${project.id} 状态失败:`, error);
        }
      }
      
      // 设置徽章
      if (totalFailed > 0) {
        chrome.action.setBadgeText({ text: totalFailed.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#dc2626' }); // 红色
        chrome.action.setTitle({ title: `${totalFailed} 个项目有失败的 Pipeline` });
      } else if (totalRunning > 0) {
        chrome.action.setBadgeText({ text: totalRunning.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#2563eb' }); // 蓝色
        chrome.action.setTitle({ title: `${totalRunning} 个项目有运行中的 Pipeline` });
      } else {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({ title: 'GitLab Pipeline Monitor' });
      }
    } catch (error) {
      console.error('更新徽章失败:', error);
    }
  }

  isConfigured() {
    return this.settings.gitlab.gitlabUrl && this.settings.gitlab.accessToken;
  }
}

// 监听通知点击事件
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    // 获取当前设置以生成 URL
    const result = await chrome.storage.local.get(['gitlabSettings', 'appState']);
    const settings = result.gitlabSettings || {};
    const appState = result.appState || {};
    
    if (settings.gitlabUrl && appState.currentProjectId) {
      const pipelineUrl = `${settings.gitlabUrl}/${appState.currentProjectId}/-/pipelines`;
      chrome.tabs.create({ url: pipelineUrl });
    }
    
    // 清除通知
    chrome.notifications.clear(notificationId);
  } catch (error) {
    console.error('处理通知点击失败:', error);
  }
});

// 监听存储变化，同步设置
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    if (changes.gitlabSettings || changes.autoRefreshSettings || changes.projects) {
      await backgroundService.loadSettings();
      
      // 重新配置自动刷新
      if (changes.autoRefreshSettings) {
        const newSettings = changes.autoRefreshSettings.newValue;
        if (newSettings?.enabled) {
          backgroundService.enableAutoRefresh(newSettings.interval);
        } else {
          backgroundService.disableAutoRefresh();
        }
      }
    }
  }
});

// 创建全局实例
const backgroundService = new GitLabPipelineBackground(); 