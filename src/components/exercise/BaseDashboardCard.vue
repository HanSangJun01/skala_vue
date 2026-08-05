<script setup>
// 요구사항 2 — 검색박스와 리스트박스의 공통 디자인 껍데기
// 제목만 부모가 전달하고, 내용은 <slot> 으로 주입받는다
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="panel">
    <!-- 제목 왼쪽 막대는 장식이라 CSS(::before)로 그린다 -->
    <h2 v-if="title !== ''" class="panel-title">{{ title }}</h2>

    <!-- 부모가 아무것도 주입하지 않으면 아래 내용이 대신 표시된다 (p154) -->
    <slot>
      <p class="panel-empty">표시할 내용이 없습니다.</p>
    </slot>
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: 14px;
  padding: 20px;
  /* 반투명 흰색 + 배경 흐리기 = 뒤의 빛무리가 은은하게 비쳐 보인다 */
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-md);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 15px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--dash-ink-mid);
}

/* 제목 앞의 작은 막대 */
.panel-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: var(--dash-r-pill);
  background-color: var(--dash-accent);
}

.panel-empty {
  margin: 0;
  font-size: 14px;
  color: var(--dash-ink-mid);
}
</style>
