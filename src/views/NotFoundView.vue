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
    <div class="notfound-box">
      <h1 class="notfound-title">404</h1>
      <p class="notfound-subtitle">페이지를 찾을 수 없습니다</p>
      <p class="notfound-message">요청하신 주소가 존재하지 않거나, 아직 개발되지 않았습니다.</p>

      <!-- catch-all 라우트가 잡아낸 실제 주소 -->
      <p class="notfound-path">{{ route.fullPath }}</p>

      <button class="home-btn" @click="goHome">← 메인 대시보드로 돌아가기</button>
    </div>
  </div>
</template>

<style scoped>
.notfound-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

.notfound-box {
  padding: 56px 20px;
  text-align: center;
  /* 다른 화면의 카드와 같은 유리 질감으로 통일한다 */
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-md);
  animation: dash-rise var(--dash-ease-out) backwards;
}

/* 404 숫자는 배경 장식처럼 크고 옅게 */
.notfound-title {
  margin: 0;
  font-size: 76px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--dash-line);
}

.notfound-subtitle {
  margin: 10px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.notfound-message {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--dash-ink-mid);
}

/* 실제 주소는 코드처럼 보이게 해서 본문과 구분한다 */
.notfound-path {
  display: inline-block;
  margin: 16px 0 24px;
  padding: 6px 12px;
  max-width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--dash-ink-mid);
  background-color: var(--dash-sunken);
  border-radius: var(--dash-r-sm);
  /* 아주 긴 주소가 들어와도 상자를 뚫고 나가지 않게 한다 */
  overflow-wrap: anywhere;
}

.home-btn {
  display: block;
  margin: 0 auto;
  padding: 11px 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  background-color: var(--dash-accent);
  border: none;
  border-radius: var(--dash-r-pill);
  box-shadow: var(--dash-shadow-sm);
  cursor: pointer;
  transition:
    transform var(--dash-ease),
    box-shadow var(--dash-ease);
}

.home-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--dash-shadow-md);
}
</style>
