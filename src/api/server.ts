import { logger } from '@/shared/logger';
import {
  Task,
  ConfigField
} from '@/shared/types';

// API 的基地址，将由后台服务在初始化时动态设置
let API_BASE_URL = 'http://127.0.0.1:8000'; // 一个安全的默认值

// 一个辅助函数，用于统一处理 fetch 请求和错误
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 总是使用最新的 API_BASE_URL
  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  logger.debug(`API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      // 在这里可以添加认证头，例如 'Authorization': `Bearer ${token}`
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // 尝试解析 JSON 错误体，如果失败则使用状态文本
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) { /* 忽略 JSON 解析错误 */ }

      logger.error(`API Error ${response.status} for ${url}: ${errorDetail}`);
      throw new Error(errorDetail);
    }

    // 对于 202 或 204 这种成功但可能没有响应体的状态码
    if (response.status === 202 || response.status === 204) {
      // 尝试解析，如果内容为空则返回 null
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    return await response.json();
  } catch (error) {
    logger.error(`Network or API request failed for ${url}:`, error);
    // 将错误包装后重新抛出，以便上层服务可以捕获
    throw new Error(`Failed to communicate with the server. Please ensure it is running at ${API_BASE_URL}.`);
  }
}

// 导出的 API 客户端对象
export const serverApi = {
  /**
   * Initializes the ApiClient with the server address from user settings.
   * This MUST be called by the background script on startup.
   */
  initialize(baseUrl: string) {
    API_BASE_URL = baseUrl;
    logger.info(`API client initialized to target server at: ${API_BASE_URL}`);
  },

  // --- Task API ---
  getTasks: (): Promise<Task[]> => apiFetch<Task[]>('/tasks'),
  getTaskDetails: (taskId: string): Promise<any> => apiFetch(`/tasks/${taskId}`),
  createTask: (url: string, configOverrides: Record<string, any>): Promise<Task> =>
    apiFetch<Task>('/tasks/url', {
      method: 'POST',
      body: JSON.stringify({ url, configOverrides }),
    }),
  pauseTask: (taskId: string): Promise<Task> => apiFetch<Task>(`/tasks/${taskId}/pause`, { method: 'POST' }),
  resumeTask: (taskId: string): Promise<Task> => apiFetch<Task>(`/tasks/${taskId}/resume`, { method: 'POST' }),
  cancelTask: (taskId: string, cleanup: boolean): Promise<null> => apiFetch<null>(`/tasks/${taskId}?cleanup=${cleanup}`, { method: 'DELETE' }),
  updateTaskConfig: (taskId: string, key: string, value: any): Promise<any> =>
    apiFetch(`/tasks/${taskId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),

  // --- Config API ---
  getConfigSchema: (): Promise<ConfigField[]> => apiFetch<ConfigField[]>('/config/schema'),
  getGlobalValues: (): Promise<Record<string, any>> => apiFetch('/config/values'),
  updateGlobalValues: (settings: Record<string, any>): Promise<Record<string, any>> =>
    apiFetch('/config/values', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),

  // --- Plugin API ---
  getInstalledPlugins: (): Promise<any[]> => apiFetch('/plugins'),
  reloadPlugins: (): Promise<any> => apiFetch('/plugins/reload', { method: 'POST' }),
  // ... 其他插件 API
};
