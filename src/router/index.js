import { createRouter, createWebHistory } from 'vue-router'

// 경로(path)와 이름(name)을 한곳에 모아 둔다.
const router = createRouter({
  // 슬래시(/)를 사용해 URL 을 관리하는 방식
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'WeatherHome',
      // 동적 import — 이 컴포넌트가 필요한 순간에 따로 내려받는다 (Lazy Loading)
      component: () => import('@/views/WeatherHomeView.vue'),
    },
    {
      // 지도. Leaflet 과 그 CSS 를 함께 들고 오므로 무거운 편인데,
      // 동적 import 라서 이 주소로 들어올 때만 내려받는다.
      path: '/map',
      name: 'WeatherMap',
      component: () => import('@/views/WeatherMapView.vue'),
    },
    {
      path: '/about',
      name: 'WeatherAbout',
      component: () => import('@/views/WeatherAboutView.vue'),
    },
    {
      // :cityId 는 동적 세그먼트. /weather/city_01 로 들어오면 route.params.cityId === 'city_01'
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      component: () => import('@/views/WeatherDetailView.vue'),
    },
    {
      // Catch-all Route — 위에서 걸리지 않은 모든 주소를 받는다.
      // 반드시 배열의 가장 마지막에 둘 것. 위에 있으면 모든 경로를 삼켜버린다.
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
