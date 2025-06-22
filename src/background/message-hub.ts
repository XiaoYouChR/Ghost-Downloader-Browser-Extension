// src/background/message-hub.ts

import browser from 'webextension-polyfill';
import { logger } from '@/shared/logger';
import {Message, MessageResponse, PluginSettings, Task} from '@/shared/types';

// 导入所有需要的后台服务
import { ApiService } from './services/api.service';
import { BrowserService } from './services/browser.service';
import { InjectorService } from './services/injector.service';
import {_StoreWithState, PiniaCustomProperties, PiniaCustomStateProperties} from "pinia";
import {UnwrapRef} from "vue";

// 这个对象将包含所有后台服务的引用，在 main.ts 中被注入
interface Services {
  apiService: ApiService;
  browserService: BrowserService;
  injectorService: InjectorService;
}

export function initializeMessageHub(services: {
  apiService: ApiService;
  browserService: BrowserService;
  injectorService: any;
  tasksStore: _StoreWithState<"tasks", { tasks: Task[] }, { runningTasksCount: (state) => any }, {
    setTasks(newTasks: Task[]): void;
    pauseTask(taskId: string): Promise<void>;
    resumeTask(taskId: string): Promise<void>;
    cancelTask(taskId: string): Promise<void>;
    refreshTasks(): Promise<void>
  }> & UnwrapRef<{ tasks: Task[] }> & _StoreWithGetters_Readonly<{
    runningTasksCount: (state) => any
  }> & _StoreWithGetters_Writable<{ runningTasksCount: (state) => any }> & {
    setTasks(newTasks: Task[]): void;
    pauseTask(taskId: string): Promise<void>;
    resumeTask(taskId: string): Promise<void>;
    cancelTask(taskId: string): Promise<void>;
    refreshTasks(): Promise<void>
  } & PiniaCustomProperties<"tasks", { tasks: Task[] }, { runningTasksCount: (state) => any }, {
    setTasks(newTasks: Task[]): void;
    pauseTask(taskId: string): Promise<void>;
    resumeTask(taskId: string): Promise<void>;
    cancelTask(taskId: string): Promise<void>;
    refreshTasks(): Promise<void>
  }> & PiniaCustomStateProperties<{ tasks: Task[] }>;
  settingsStore: _StoreWithState<"settings", { settings: PluginSettings }, {}, {
    loadSettings(): Promise<void>;
    updateSettings(newSettings: Partial<PluginSettings>): Promise<void>
  }> & UnwrapRef<{ settings: PluginSettings }> & _StoreWithGetters_Readonly<{}> & _StoreWithGetters_Writable<{}> & {
    loadSettings(): Promise<void>;
    updateSettings(newSettings: Partial<PluginSettings>): Promise<void>
  } & PiniaCustomProperties<"settings", { settings: PluginSettings }, {}, {
    loadSettings(): Promise<void>;
    updateSettings(newSettings: Partial<PluginSettings>): Promise<void>
  }> & PiniaCustomStateProperties<{ settings: PluginSettings }>
}) {
  /**
   * Handles all incoming messages from other parts of the extension (e.g., popup, options page).
   * It acts as a central router, delegating tasks to the appropriate service.
   * It MUST return a MessageResponse to the sender.
   */
  const handleMessage = async (message: Message, sender: browser.runtime.MessageSender): Promise<MessageResponse> => {
    logger.debug(`Received message from [${sender.tab ? 'Tab ' + sender.tab.id : 'UI'}]`, message);

    try {
      // 使用 switch 语句来清晰地路由消息
      switch (message.type) {
        // --- Task Actions ---
        case 'GET_ALL_TASKS':
          await services.apiService.fetchTasks();
          return { status: 'success' };

        case 'PAUSE_TASK':
          await services.apiService.pauseTask(message.payload.taskId);
          return { status: 'success' };

        case 'RESUME_TASK':
          await services.apiService.resumeTask(message.payload.taskId);
          return { status: 'success' };

        case 'CANCEL_TASK':
          // 注意，cancelTask 在 API 层可能不需要 cleanup 参数，这取决于服务器实现
          await services.apiService.cancelTask(message.payload.taskId, message.payload.cleanup || false);
          return { status: 'success' };

        // --- Browser Actions ---
        case 'OPEN_OPTIONS_PAGE':
          await services.browserService.openOptionsPage();
          return { status: 'success' };

        case 'OPEN_FILE_LOCATION':
          // 调用 BrowserService 的一个新方法
          await services.browserService.showDownloadInFolder(message.payload.taskId);
          return { status: 'success' };

        default:
          // 使用 "never" 类型来确保所有消息类型都被处理，否则 TypeScript 会报错
          const _exhaustiveCheck: never = message;
          logger.warning(`Unhandled message type: ${(_exhaustiveCheck as any).type}`);
          throw new Error(`Unknown message type: ${(_exhaustiveCheck as any).type}`);
      }
    } catch (error: any) {
      logger.error(`Error handling message type '${message.type}':`, error);
      // 返回一个标准化的错误响应
      return { status: 'error', error: error.message || 'An unknown error occurred.' };
    }
  };

  // 注册监听器
  if (browser.runtime.onMessage.hasListener(handleMessage)) {
    logger.warning("Message handler was already registered. Removing old one.");
    browser.runtime.onMessage.removeListener(handleMessage);
  }
  browser.runtime.onMessage.addListener(handleMessage);

  logger.info('Message hub initialized and listening for messages.');
}
