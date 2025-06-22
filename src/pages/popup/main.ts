// src/pages/popup/main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';

// [✓] FIX: Use the precise, correct file path for each component
import { provideFluentDesignSystem } from '@fluentui/web-components';
import { fluentButton } from '@fluentui/web-components';
import { fluentCard } from '@fluentui/web-components';
import { fluentProgress } from '@fluentui/web-components'; // The file is 'progress.js'
import { fluentSwitch } from '@fluentui/web-components';

import App from './Popup.vue';
import '@/assets/styles/main.css';

// Make Fluent UI Web Components available to Vue
provideFluentDesignSystem().register(
    fluentButton(),
    fluentCard(),
    fluentProgress(),
    fluentSwitch()
);

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');