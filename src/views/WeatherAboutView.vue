<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="about-view">
    <h1 class="about-title">ℹ️ 서비스 소개</h1>

    <div class="about-box">
      <p class="about-lead">이 서비스는 Vue 3 학습용으로 만든 날씨 대시보드입니다.</p>

      <ul class="about-list">
        <!-- 강조는 인라인 style 대신 클래스로 뺀다. 나중에 색을 바꿀 때 한 곳만 고치면 된다. -->
        <li><span class="about-mark">components/exercise/</span> 폴더 내부의 독립 부품 연동</li>
        <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
        <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
      </ul>
    </div>

    <button class="home-btn" @click="goHome">← 메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.about-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

.about-title {
  margin: 0 0 14px;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.about-box {
  margin-bottom: 18px;
  padding: 22px;
  /* 다른 화면의 카드와 같은 유리 질감으로 통일한다 */
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-md);
  animation: dash-rise var(--dash-ease-out) backwards;
}

.about-lead {
  margin: 0 0 16px;
  padding-bottom: 16px;
  font-size: 15px;
  line-height: 1.7;
  border-bottom: 1px solid var(--dash-line-soft);
}

.about-list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dash-ink-mid);
}

/* 목록 앞의 점 색만 강조색으로 바꾼다 */
.about-list li::marker {
  color: var(--dash-accent);
}

.about-list li + li {
  margin-top: 8px;
}

/* 폴더 경로 강조 — 코드처럼 보이게 한다 */
.about-mark {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: var(--dash-accent-deep);
  background-color: var(--dash-accent-soft);
  border-radius: 5px;
}

.home-btn {
  padding: 11px 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--dash-ink-mid);
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  cursor: pointer;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease),
    border-color var(--dash-ease),
    box-shadow var(--dash-ease);
}

.home-btn:hover {
  color: #ffffff;
  background-color: var(--dash-accent);
  border-color: var(--dash-accent);
  box-shadow: none;
}
</style>
