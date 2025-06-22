<template>
  <div class="popup-container">
    <header class="popup-header">
      <img src="/icons/icon48.png" alt="Ghost Downloader Icon" class="logo" />
      <h1>Ghost Downloader</h1>
      <fluent-switch
        :checked="settingsStore.settings.isInterceptEnabled"
        @change="toggleInterception"
      >
        <span slot="checked-message">拦截开启</span>
        <span slot="unchecked-message">拦截关闭</span>
      </fluent-switch>
    </header>

    <main class="task-list">
      <div v-if="tasksStore.tasks.length === 0" class="empty-state">
        <p>暂无下载任务</p>
      </div>

      <div v-else>
        <!-- 我们将把单个任务的显示逻辑封装在一个独立的组件中 -->
        <TaskCard
          v-for="task in tasksStore.tasks"
          :key="task.taskId"
          :task="task"
        />
      </div>
    </main>

    <footer class="popup-footer">
      <fluent-button appearance="stealth" @click="openOptionsPage">
        打开设置
      </fluent-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSettingsStore } from '@/store';
import { useTasksStore } from '@/store';
import TaskCard from '@/components/TaskCard.vue';
import browser from 'webextension-polyfill';

// 获取 Pinia stores
const settingsStore = useSettingsStore();
const tasksStore = useTasksStore();

// 组件加载时，从浏览器存储中加载设置
onMounted(() => {
  settingsStore.loadSettings();
  tasksStore.refreshTasks();
});

const toggleInterception = (event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.updateSettings({ isInterceptEnabled: target.checked });
};

const openOptionsPage = () => {
  // browser.runtime.openOptionsPage();
    browser.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
};
</script>

<style scoped>
.popup-container {
  width: 350px;
  padding: 1rem;
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.logo {
  width: 32px;
  height: 32px;
}
.empty-state {
  text-align: center;
  color: #666;
  padding: 2rem 0;
}
</style>
