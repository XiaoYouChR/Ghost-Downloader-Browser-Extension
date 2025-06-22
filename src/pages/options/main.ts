// src/pages/options/main.ts

import { createApp } from 'vue';
import { createPinia } from 'pinia';

// [✓] FIX: Import all necessary components from their specific paths
import { provideFluentDesignSystem } from '@fluentui/web-components';
import { fluentCard } from '@fluentui/web-components';
import { fluentTextField } from '@fluentui/web-components';
import { fluentSwitch } from '@fluentui/web-components';
import { fluentNumberField } from '@fluentui/web-components';
import { fluentSelect } from '@fluentui/web-components';
import { fluentOption } from '@fluentui/web-components';
import { fluentTextArea } from '@fluentui/web-components';
import { fluentButton } from '@fluentui/web-components';

import App from './Options.vue';
import '@/assets/styles/main.css';

// Register all components
provideFluentDesignSystem().register(
    fluentCard(),
    fluentTextField(),
    fluentSwitch(),
    fluentNumberField(),
    fluentSelect(),
    fluentOption(),
    fluentTextArea(),
    fluentButton()
);

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');
