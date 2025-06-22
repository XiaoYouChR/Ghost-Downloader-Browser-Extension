import browser from 'webextension-polyfill';
import { logger } from '@/shared/logger';
import { ApiService } from './api.service';

export class InjectorService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.setupListeners();
  }

  private setupListeners() {
    // 监听 Tab 的更新事件，以决定何时注入脚本
    browser.tabs.onUpdated.addListener(this.handleTabUpdate);
  }

  private handleTabUpdate = async (tabId: number, changeInfo: browser.tabs.TabChangeInfo, tab: browser.tabs.Tab) => {
    // 我们只在页面加载完成时注入
    if (changeInfo.status === 'complete' && tab.url) {
      logger.debug(`Tab ${tabId} completed loading: ${tab.url}`);

      try {
        const scriptToInject = await this.apiService.getInjectorScript(tab.url);

        if (scriptToInject) {
          logger.info(`Injecting script into tab ${tabId} for URL ${tab.url}`);
          await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: (scriptContent) => {
              const script = document.createElement('script');
              script.textContent = scriptContent;
              (document.head || document.documentElement).appendChild(script);
              script.remove(); // 执行后立即移除，保持 DOM 干净
            },
            args: [scriptToInject],
          });
        }
      } catch (error) {
        logger.error(`Failed to get or inject script for tab ${tabId}:`, error);
      }
    }
  };
}
