<script setup>
import UnitToggler from '@/components/exercise/UnitToggler.vue'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'
</script>

<template>
  <!-- 요구사항 2 — Navigation Bar. a 태그 대신 RouterLink 를 쓴다.
       a 태그는 브라우저를 새로고침시켜 메모리의 반응형 데이터를 전부 초기화한다.
       제목을 네비 안으로 넣었다. 예전에는 위에 h1 이 따로 있어
       '날씨 대시보드'가 세로로 두 번 나오고 상단 130px 이 그대로 낭비됐다. -->
  <nav class="nav-bar">
    <!-- 이모지는 기기마다 모양이 달라 카드와 같은 SVG 아이콘을 쓴다 -->
    <h1 class="app-title">
      <WeatherIcon class="title-icon" code="02d" />
      <span class="title-text">날씨 대시보드</span>
    </h1>

    <RouterLink to="/" class="nav-link">대시보드</RouterLink>
    <RouterLink to="/map" class="nav-link">지도</RouterLink>
    <RouterLink to="/about" class="nav-link">서비스 소개</RouterLink>

    <!-- 요구사항 2 — Navigation Bar 옆에 단위 변경 UI 배치 -->
    <UnitToggler class="nav-toggler" />
  </nav>

  <!-- 요구사항 2 — 주소에 맞는 View 가 이 자리에 그려진다 -->
  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
/* 제목 — 네비 바 안의 로고 자리 */
.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0 14px 0 10px;
  border-right: 1px solid rgba(255, 255, 255, 0.14);
  margin-right: 6px;
}

/* 강조색으로 칠해 로고처럼 */
.title-icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.9;
  color: var(--dash-accent);
}

/* 어두운 네비 바 위라 흰색으로 */
.title-text {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  white-space: nowrap;
}

.nav-bar {
  /* 스크롤해도 상단에 붙어 있어 메뉴와 단위 전환이 항상 손에 닿는다 */
  position: sticky;
  top: 12px;
  z-index: 10;

  max-width: var(--dash-width);
  margin: 20px auto 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background-color: #1b2730;
  border-radius: var(--dash-r-md);
  box-shadow: var(--dash-shadow-sm);
}

/* 단위 변경 UI 를 오른쪽 끝으로 민다 */
.nav-toggler {
  margin-left: auto;
}

.nav-link {
  position: relative;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.66);
  text-decoration: none;
  border-radius: var(--dash-r-sm);
  white-space: nowrap;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease);
}

/* main.css 의 a 태그 hover 를 여기서 덮어쓴다 */
.nav-link:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.09);
}

/* 현재 메뉴 — Vue Router 가 이 클래스를 자동으로 붙여준다 */
.nav-link.router-link-active,
.nav-link.router-link-active:hover {
  color: #ffffff;
  background-color: var(--dash-accent);
}

.main-content {
  padding-top: 6px;
}

/* 좁은 화면에서는 메뉴와 단위 변경 UI 를 두 줄로 접는다 */
@media (max-width: 480px) {
  .nav-bar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-toggler {
    width: 100%;
    margin-left: 0;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
}
</style>
