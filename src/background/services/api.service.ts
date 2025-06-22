import { useTasksStore, useSettingsStore } from '@/store';
import { logger } from '@/shared/logger';
import { Task } from '@/shared/types';

// 在一个单独的文件中封装 fetch 调用
import { serverApi } from '@/api/server';

export class ApiService {
  private tasksStore: ReturnType<typeof useTasksStore>;
  private settingsStore: ReturnType<typeof useSettingsStore>;
  private pollingInterval: number | null = null;
  private readonly POLLING_RATE_MS = 1000; // 每1秒轮询一次

  constructor(tasksStore: ReturnType<typeof useTasksStore>, settingsStore: ReturnType<typeof useSettingsStore>) {
    this.tasksStore = tasksStore;
    this.settingsStore = settingsStore;
  }

  public startPolling() {
    if (this.pollingInterval) {
      this.stopPolling();
    }
    logger.info(`Starting task polling every ${this.POLLING_RATE_MS}ms.`);
    this.pollingInterval = setInterval(() => this.fetchTasks(), this.POLLING_RATE_MS);
    this.fetchTasks();
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info('Task polling stopped.');
    }
  }

  public async fetchTasks() {
    try {
      const tasks = await serverApi.getTasks();
      this.tasksStore.setTasks(tasks);
    } catch (error) {
      logger.error('Failed to fetch tasks from server:', error);
      // 在这里可以处理错误，例如在 UI 上显示一个“连接失败”的标志
    }
  }

  // 这些方法将被 Message Hub 调用，以响应来自 UI 的操作
  public async createTask(url: string) {
    await serverApi.createTask(url, {}); // 简化：暂时不处理配置覆盖
    await this.fetchTasks(); // 创建后立即刷新一次列表
  }

  public async pauseTask(taskId: string) {
    try {
      const updatedTask = await serverApi.pauseTask(taskId);
      this.tasksStore.updateSingleTask(updatedTask);
    } catch (error) {
      logger.error(`API call to pause task ${taskId} failed:`, error);
    }
  }

  public async resumeTask(taskId: string) {
    await serverApi.resumeTask(taskId);
    await this.fetchTasks();
  }

  public async cancelTask(taskId: string) {
    await serverApi.cancelTask(taskId, true); // 简化：暂时不处理 cleanup
    await this.fetchTasks();
  }

  // injector.service.ts 会调用这个
  public async getInjectorScript(url: string): Promise<string | null> {
    return serverApi.getInjectorScript(url);
  }
}
