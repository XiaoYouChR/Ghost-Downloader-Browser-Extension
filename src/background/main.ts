import { logger } from '@/shared/logger';
import { ApiService } from './services/api.service';
import { BrowserService } from './services/browser.service';
import { InjectorService } from './services/injector.service';
import { initializeMessageHub } from './message-hub';
import { useSettingsStore, useTasksStore } from '@/store';
import { createPinia } from 'pinia';
import { serverApi } from "@/api/server.ts";

const pinia = createPinia();
const settingsStore = useSettingsStore(pinia);
const tasksStore = useTasksStore(pinia);

logger.info('Background script starting...');

// 初始化所有服务，并注入依赖
const apiService = new ApiService(tasksStore, settingsStore);
const browserService = new BrowserService(settingsStore, apiService);
const injectorService = new InjectorService(apiService);

// 初始化消息中心，将服务连接起来
// 消息中心负责监听来自 UI 的消息，并调用相应服务的方法
initializeMessageHub({
  apiService,
  browserService,
  injectorService,
  tasksStore,
  settingsStore,
});

// 在插件启动时执行核心初始化逻辑
async function initialize() {
  await settingsStore.loadSettings(); // 首先加载设置

  // 使用加载后的设置来初始化 API 客户端
  serverApi.initialize(settingsStore.settings.serverUrl);

  browserService.initialize();
  apiService.startPolling();
  logger.info('All background services initialized and started.');
}

initialize();
