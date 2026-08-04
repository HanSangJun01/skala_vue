<script setup>
import UnitToggler from '@/components/exercise/UnitToggler.vue'
</script>

<template>
  <h1 class="app-title">🌤 날씨 대시보드</h1>

  <!-- 요구사항 2 — Navigation Bar. a 태그 대신 RouterLink 를 쓴다.
       a 태그는 브라우저를 새로고침시켜 메모리의 반응형 데이터를 전부 초기화한다. -->
  <nav class="nav-bar">
    <RouterLink to="/" class="nav-link">🌤️ 날씨 대시보드</RouterLink>
    <RouterLink to="/about" class="nav-link">ℹ️ 서비스 소개</RouterLink>

    <!-- 요구사항 2 — Navigation Bar 옆에 단위 변경 UI 배치 -->
    <UnitToggler class="nav-toggler" />
  </nav>

  <!-- 요구사항 2 — 주소에 맞는 View 가 이 자리에 그려진다 -->
  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
.app-title {
  margin: 0;
  padding: 18px 14px 14px;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  color: #2d3436;
}

.nav-bar {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background-color: #323b3b;
  border-radius: 8px;
}

/* 남는 공간을 전부 왼쪽에 몰아줘서 단위 변경 UI 를 오른쪽 끝으로 밀어낸다 */
.nav-toggler {
  margin-left: auto;
}

.nav-link {
  padding: 7px 12px;
  font-size: 14px;
  font-weight: bold;
  color: #dfe6e9;
  text-decoration: none;
  border-radius: 6px;
}

.nav-link:hover {
  background-color: #3d4547;
}

/* 현재 보고 있는 메뉴는 Vue Router 가 이 클래스를 자동으로 붙여준다 */
.nav-link.router-link-active {
  color: #ffffff;
  background-color: #42b983;
}

.main-content {
  padding-top: 8px;
}
</style>
