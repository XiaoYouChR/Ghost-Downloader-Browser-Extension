<template>
  <div class="options-container">
    <h1>Ghost Downloader 设置</h1>

    <fluent-card class="setting-group">
      <h2>服务器连接</h2>
      <div class="field">
        <label for="serverUrl">服务器地址</label>
        <fluent-text-field
          id="serverUrl"
          v-model="settings.serverUrl"
          placeholder="e.g., http://127.0.0.1:8000"
        ></fluent-text-field>
      </div>
    </fluent-card>

    <fluent-card class="setting-group">
      <h2>下载拦截</h2>
      <div class="field switch-field">
        <label for="interceptEnabled">开启下载拦截</label>
        <fluent-switch
          id="interceptEnabled"
          :checked="settings.isInterceptEnabled"
          @change="updateSwitch('isInterceptEnabled', $event)"
        ></fluent-switch>
      </div>

      <div class="field">
        <label for="minFileSize">最小拦截文件大小 (MB)</label>
        <fluent-number-field
          id="minFileSize"
          v-model="settings.minFileSizeToIntercept"
          min="0"
        ></fluent-number-field>
      </div>

      <div class="field">
        <label for="modifierKey">绕过拦截快捷键</label>
        <fluent-select id="modifierKey" v-model="settings.modifierKey">
            <fluent-option value="none">无</fluent-option>
            <fluent-option value="alt">Alt</fluent-option>
            <fluent-option value="ctrl">Ctrl</fluent-option>
            <fluent-option value="shift">Shift</fluent-option>
        </fluent-select>
      </div>

      <div class="field">
        <label for="ignoredDomains">不拦截的域名列表 (每行一个)</label>
        <fluent-text-area
          id="ignoredDomains"
          :value="ignoredDomainsAsText"
          @input="updateIgnoredDomains"
          placeholder="example.com
google.com"
        ></fluent-text-area>
      </div>
    </fluent-card>

    <fluent-button appearance="accent" @click="saveSettings">保存设置</fluent-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useSettingsStore } from '@/store';
import { PluginSettings } from '@/shared/types';
import {
  fluentCard, fluentTextField, fluentSwitch, fluentNumberField, fluentSelect, fluentOption, fluentTextArea, fluentButton, provideFluentDesignSystem
} from '@fluentui/web-components';

// 注册所有需要的 Fluent 组件
provideFluentDesignSystem().register(fluentCard(), fluentTextField(), fluentSwitch(), fluentNumberField(), fluentSelect(), fluentOption(), fluentTextArea(), fluentButton());

const settingsStore = useSettingsStore();
// 创建一个本地的、可编辑的状态，避免直接修改 Pinia state
const settings = ref<PluginSettings>({ ...settingsStore.settings });

onMounted(async () => {
  await settingsStore.loadSettings();
  // 加载后，用 Pinia store 的最新值更新本地状态
  settings.value = { ...settingsStore.settings };
});

// 计算属性，用于处理数组和文本区域的转换
const ignoredDomainsAsText = computed(() => settings.value.ignoredDomains.join('\n'));

const updateIgnoredDomains = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  settings.value.ignoredDomains = target.value.split('\n').map(d => d.trim()).filter(Boolean);
};

const updateSwitch = (key: keyof PluginSettings, event: Event) => {
    const target = event.target as HTMLInputElement;
    (settings.value[key] as boolean) = target.checked;
};

const saveSettings = () => {
  // 调用 Pinia action 来更新和持久化设置
  settingsStore.updateSettings(settings.value);
  // TODO: 显示一个“保存成功”的提示
  alert('设置已保存！');
};

// 监听 Pinia store 的变化，以同步来自其他地方的更改
watch(() => settingsStore.settings, (newSettings) => {
    settings.value = { ...newSettings };
}, { deep: true });

</script>

<style scoped>
.options-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}
.setting-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.switch-field {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}
label {
  margin-bottom: 0.5rem;
  font-weight: bold;
}
</style>
