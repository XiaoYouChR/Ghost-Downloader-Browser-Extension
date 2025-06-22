import browser from 'webextension-polyfill';
import { useSettingsStore } from '@/store';
import { logger } from '@/shared/logger';
import { ApiService } from './api.service';

export class BrowserService {
  private settingsStore: ReturnType<typeof useSettingsStore>;
  private apiService: ApiService;

  constructor(settingsStore: ReturnType<typeof useSettingsStore>, apiService: ApiService) {
    this.settingsStore = settingsStore;
    this.apiService = apiService;
  }

  public initialize() {
    this.setupDownloadInterceptor();
    logger.info('Browser event listeners initialized.');
  }

  public async openOptionsPage(): Promise<void> {
        browser.runtime.openOptionsPage();
    }

  public async showDownloadInFolder(taskId: string): Promise<void> {
    // TODO 方案是，如果我们的服务器 API 能返回任务的保存路径，
    // 我们可以使用新的 showItemInFolder API（如果可用）。
    //
    // 现在，我们先用一个占位符。
  logger.warn(`showDownloadInFolder for taskId '${taskId}' is not yet implemented.`);
    // 伪代码:
    // const task = tasksStore.findTaskById(taskId);
    // if (task.downloadId) {
    //   browser.downloads.show(task.downloadId);
    // }
  }


  private setupDownloadInterceptor() {
    // onDeterminingFilename 提供了在下载开始前、文件名确定时的拦截点
    // 并且它是一个异步事件，允许我们在其中执行异步操作
    if (browser.downloads.onDeterminingFilename.hasListener(this.handleDownload)) {
        browser.downloads.onDeterminingFilename.removeListener(this.handleDownload);
    }
    browser.downloads.onDeterminingFilename.addListener(this.handleDownload);
  }

  // 使用箭头函数来绑定 this 上下文
  private handleDownload = async (downloadItem: browser.downloads.DownloadItem, suggest: (suggestion: { filename: string, conflictAction?: browser.downloads.FilenameConflictAction }) => void) => {
    const settings = this.settingsStore.settings;

    // 1. 检查总开关
    if (!settings.isInterceptEnabled) {
      logger.debug('Interception is disabled. Skipping download interception.');
      return;
    }

    // 2. 检查域名
    const url = new URL(downloadItem.url);
    if (settings.ignoredDomains.some(domain => url.hostname.includes(domain))) {
      logger.debug(`Domain ${url.hostname} is ignored. Skipping download interception.`);
      return;
    }

    // 3. 检查文件大小 (需要注意 downloadItem.fileSize 可能在此时还不可用)
    if (downloadItem.fileSize > 0 && settings.minFileSizeToIntercept * 1024 * 1024 > downloadItem.fileSize) {
        logger.debug(`File size is below threshold. Skipping download interception.`);
        return;
    }

    // 4. 检查快捷键 (这是一个简化的示例，实际的按键状态检查更复杂，通常在 content script 中完成)
    // 在 background script 中直接检查按键状态很困难，我们先跳过这个复杂功能

    // --- 执行拦截 ---
    logger.info(`Intercepting download for URL: ${downloadItem.url}`);

    // a. 取消浏览器原生下载
    // 为了防止浏览器弹出“另存为”对话框，我们不调用 suggest()
    // 而是直接取消。MV3 中需要返回一个 Promise
    try {
        await browser.downloads.cancel(downloadItem.id);
        // 有时 cancel 会失败，因为下载可能已经被浏览器处理了，所以要捕获错误
    } catch(e) {
        logger.warning(`Could not cancel browser download for item ${downloadItem.id}, it may have already completed or failed.`);
    }

    // b. 将下载任务发送到我们的服务器
    try {
        await this.apiService.createTask(downloadItem.url);
        // (可选) 可以在此显示一个桌面通知
        browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('icons/icon48.png'),
            title: '任务已添加',
            message: `下载任务已发送到 Ghost Downloader: ${downloadItem.filename}`
        });
    } catch (e) {
        logger.error(`Failed to send intercepted download to server:`, e);
    }
  };
}
