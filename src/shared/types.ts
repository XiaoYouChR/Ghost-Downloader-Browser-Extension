// 与后端的枚举和模型对应
export type TaskStatus = "waiting" | "running" | "paused" | "completed" | "failed";
export type OverallTaskStatus = "running" | "completed" | "failed" | "paused";

export interface DisplayIntent {
  key: string;
  context: Record<string, any>;
}

export interface TaskStage {
  stageId: string;
  taskId: string;
  stageIndex: number;
  displayIntent: DisplayIntent;
  workerType: string;
  status: TaskStatus;
  progress: number;
}

export interface Task {
  taskId: string;
  title: string;
  overallStatus: OverallTaskStatus;
  currentStageId?: string;
  currentStageDescription?: string;
  overallProgress?: number;
}

// 插件的全局设置
export interface PluginSettings {
  serverUrl: string;
  isInterceptEnabled: boolean;
  minFileSizeToIntercept: number; // in megabytes
  ignoredDomains: string[];
  modifierKey: "alt" | "ctrl" | "shift" | "none"; // 用于绕过拦截的按键
}

// --- Message Payloads ---
export type PauseTaskPayload = { taskId: string };
export type ResumeTaskPayload = { taskId: string };
export type CancelTaskPayload = { taskId: string; cleanup?: boolean };
export type OpenFilePayload = { taskId: string };

// --- Message Definitions ---
// 使用一个 "type" 字段来区分消息，并用一个 "payload" 字段来携带数据
export type Message =
  | { type: 'GET_ALL_TASKS' }
  | { type: 'PAUSE_TASK'; payload: PauseTaskPayload }
  | { type: 'RESUME_TASK'; payload: ResumeTaskPayload }
  | { type: 'CANCEL_TASK'; payload: CancelTaskPayload }
  | { type: 'OPEN_FILE_LOCATION'; payload: OpenFilePayload }
  | { type: 'OPEN_OPTIONS_PAGE' };

// --- Message Response ---
// 定义一个标准化的响应格式，便于 UI 处理
export type MessageResponse<T = any> =
  | { status: 'success'; data?: T }
  | { status: 'error'; error: string };
