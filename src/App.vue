<script setup>
import UnitToggler from '@/components/exercise/UnitToggler.vue'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'
</script>

<template>
  <!-- 이모지(🌤)는 기기마다 모양이 다르고 작게 흐리게 보였다.
       카드에서 쓰는 것과 같은 SVG 아이콘으로 바꿔 또렷하게 만든다. -->
  <h1 class="app-title">
    <WeatherIcon class="title-icon" code="02d" />
    <span class="title-text">날씨 대시보드</span>
  </h1>

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
/* 제목 — 빛무리·그라디언트 글자 같은 장식을 걷어내고 글자만 남겼다.
   크기와 굵기, 자간만으로 존재감을 만드는 편이 훨씬 깔끔하다. */
.app-title {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 42px 0 20px;
  display: flex;
  align-items: center;
  gap: 11px;
}

/* 제목 글자와 높이를 맞추고, 강조색으로 칠해 로고처럼 보이게 한다 */
.title-icon {
  width: 30px;
  height: 30px;
  stroke-width: 1.9;
  color: var(--dash-accent);
}

.title-text {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.045em;
  color: var(--dash-ink);
}

/* 좁은 화면에서는 제목을 한 단계 줄인다 */
@media (max-width: 480px) {
  .app-title {
    padding: 28px 0 16px;
  }

  .title-icon {
    width: 24px;
    height: 24px;
  }

  .title-text {
    font-size: 24px;
  }
}

.nav-bar {
  /* 스크롤해도 상단에 붙어 있어 메뉴와 단위 전환이 항상 손에 닿는다 */
  position: sticky;
  top: 12px;
  z-index: 10;

  max-width: var(--dash-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  /* 그라디언트를 빼고 단색으로. 작은 막대에 그라디언트는 티가 안 나고 탁하기만 하다. */
  background-color: #1b2730;
  border-radius: var(--dash-r-md);
  box-shadow: var(--dash-shadow-sm);
}

/* 남는 공간을 전부 왼쪽에 몰아줘서 단위 변경 UI 를 오른쪽 끝으로 밀어낸다 */
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

/* main.css 가 모든 a 태그에 초록 배경 hover 를 걸어 두었다.
   어두운 네비게이션 바에서는 어울리지 않으므로 여기서 다시 지정한다. */
.nav-link:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.09);
}

/* 현재 보고 있는 메뉴는 Vue Router 가 이 클래스를 자동으로 붙여준다.
   그라디언트와 번지는 그림자를 빼고 단색 한 겹으로만 표시한다. */
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
