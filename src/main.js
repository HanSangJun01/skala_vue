import './assets/main.css'

// dashboard.css 보다 먼저. 뒤에 오는 파일이 --el-* 변수를 덮어써야 한다.
import 'element-plus/dist/index.css'
import './assets/dashboard.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// 로케일을 안 넣으면 달력 헤더가 'August 2026', 요일이 Sun/Mon 으로 나온다
import ko from 'element-plus/es/locale/lang/ko'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 전역 설정 주입 — 등록하면 모든 컴포넌트에서 <el-button> 을 바로 쓸 수 있다
app.use(ElementPlus, { locale: ko })

app.mount('#app')
