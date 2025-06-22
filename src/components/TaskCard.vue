<template>
  <fluent-card class="task-card">
    <div class="task-info">
      <p class="task-title">{{ task.title }}</p>
      <small class="task-description">{{ currentStageDescription }}</small>
    </div>

    <fluent-progress-bar :value="task.overallProgress || 0"></fluent-progress-bar>

    <div class="task-actions">
      <fluent-button
        v-if="task.overallStatus === 'running'"
        @click="tasksStore.pauseTask(task.taskId)"
        appearance="stealth"
        title="暂停"
      >
        <!--TODO 使用 Fluent UI System Icons (需要单独配置) 或 SVG -->
        ⏸️
      </fluent-button>

      <fluent-button
        v-if="task.overallStatus === 'paused'"
        @click="tasksStore.resumeTask(task.taskId)"
        appearance="stealth"
        title="恢复"
      >
        ▶️
      </fluent-button>

      <fluent-button
        @click="tasksStore.cancelTask(task.taskId)"
        appearance="stealth"
        title="取消"
      >
        ❌
      </fluent-button>

      <fluent-button
        v-if="task.overallStatus === 'completed'"
        @click="openFileLocation"
        appearance="stealth"
        title="打开文件"
      >
        📁
      </fluent-button>
    </div>
  </fluent-card>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { Task } from '@/shared/types';
import { useTasksStore } from '@/store';

const props = defineProps<{
  task: Task;
}>();

const tasksStore = useTasksStore();

// 计算属性，用于显示当前阶段的描述
const currentStageDescription = computed(() => {
  // TODO: 基于 task.currentStageId 和 task.stages 列表来计算
  return props.task.currentStageDescription || '正在准备...';
});

const openFileLocation = () => {
  // TODO: 需要通过后台脚本调用 chrome.downloads.show()
  console.log(`Requesting to open location for task: ${props.task.taskId}`);
};
</script>

<style scoped>
.task-card {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
}
.task-info {
  margin-bottom: 0.5rem;
}
.task-title {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-description {
  color: #444;
  font-size: 0.8rem;
}
.task-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
</style>
