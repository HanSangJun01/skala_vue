<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="notfound-view">
    <h1 class="notfound-title">404</h1>
    <p class="notfound-subtitle">페이지를 찾을 수 없습니다</p>
    <p class="notfound-message">요청하신 주소가 존재하지 않거나, 아직 개발되지 않았습니다.</p>
    <p class="notfound-path">{{ route.fullPath }}</p>

    <button class="home-btn" @click="goHome">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.notfound-view {
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 14px;
  text-align: center;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: #2d3436;
}

.notfound-title {
  margin: 0 0 4px;
  font-size: 48px;
  font-weight: bold;
  color: #b2bec3;
}

.notfound-subtitle {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: bold;
  color: #b2bec3;
}

.notfound-message {
  margin: 0 0 8px;
  font-size: 15px;
}

.notfound-path {
  margin: 0 0 24px;
  font-size: 13px;
  color: #636e72;
}

.home-btn {
  padding: 9px 14px;
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
  background-color: #42b983;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.home-btn:hover {
  background-color: #35a06f;
}
</style>
