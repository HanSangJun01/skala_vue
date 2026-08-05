import './assets/main.css'
// main.css 뒤에 불러야 토큰과 배경색 지정이 덮어쓴다. 순서가 중요하다.
import './assets/dashboard.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
