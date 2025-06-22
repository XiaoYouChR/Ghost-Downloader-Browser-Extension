import { defineStore } from 'pinia';
import { PluginSettings, Task } from '@/shared/types';
import browser from 'webextension-polyfill';
import { logger } from '@/shared/logger';
import { Message, MessageResponse } from '@/shared/types';

// --- Settings Store (保持不变，已足够完善) ---
export const useSettingsStore = defineStore('settings', { /* ... */ });


// --- Tasks Store (重大升级) ---
export const useTasksStore = defineStore('tasks', {
  state: (): { tasks: Task[], isLoading: boolean, lastError: string | null } => ({
    tasks: [],
    isLoading: false, // 用于向 UI 显示加载状态
    lastError: null,  // 用于向 UI 显示错误信息
  }),

  getters: {
    // 按创建时间倒序排列任务
    sortedTasks: (state) => [...state.tasks].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),

    // 按 ID 快速查找任务
    getTaskById: (state) => (taskId: string) => state.tasks.find(t => t.taskId === taskId),
  },

  actions: {
    // --- 内部状态修改 ---
    _updateOrAddTask(task: Task) {
      const index = this.tasks.findIndex(t => t.taskId === task.taskId);
      if (index !== -1) {
        // 更新现有任务
        this.tasks[index] = task;
      } else {
        // 添加新任务
        this.tasks.push(task);
      }
    },

    _removeTask(taskId: string) {
        this.tasks = this.tasks.filter(t => t.taskId !== taskId);
    },

    // --- 与后台脚本通信的 Actions ---
    async _sendMessageWithLoading<T>(message: Message): Promise<MessageResponse<T>> {
      this.isLoading = true;
      this.lastError = null;
      try {
        const response: MessageResponse<T> = await browser.runtime.sendMessage(message);
        if (response.status === 'error') {
          throw new Error(response.error);
        }
        return response;
      } catch (error: any) {
        logger.error(`Failed to execute action ${message.type}:`, error.message);
        this.lastError = error.message;
        return { status: 'error', error: error.message };
      } finally {
        this.isLoading = false;
      }
    },

    async refreshTasks() {
      await this._sendMessageWithLoading({ type: 'GET_ALL_TASKS' });
    },

    async pauseTask(taskId: string) {
      const response = await this._sendMessageWithLoading({ type: 'PAUSE_TASK', payload: { taskId } });
      if (response.status === 'success' && response.data) {
        this._updateOrAddTask(response.data as Task);
      }
    },

    async resumeTask(taskId: string) {
      const response = await this._sendMessageWithLoading({ type: 'RESUME_TASK', payload: { taskId } });
      if (response.status === 'success' && response.data) {
        this._updateOrAddTask(response.data as Task);
      }
    },

    async cancelTask(taskId: string) {
      const response = await this._sendMessageWithLoading({ type: 'CANCEL_TASK', payload: { taskId, cleanup: false } });
      if (response.status === 'success') {
          // 取消后，任务状态会变为 failed，或者直接被移除
          // 这里我们选择让后台轮询来移除它，或者我们可以立即在前端移除
          this._removeTask(taskId);
      }
    },
  },
});
