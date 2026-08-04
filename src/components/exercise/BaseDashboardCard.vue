<script setup>
// 요구사항 2 — 검색박스와 리스트박스의 공통 디자인 껍데기
// 제목만 부모가 전달하고, 내용은 <slot> 으로 주입받는다
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="panel">
    <h2 v-if="title !== ''" class="panel-title">{{ title }}</h2>

    <!-- 부모가 아무것도 주입하지 않으면 아래 내용이 대신 표시된다 (p154) -->
    <slot>
      <p class="panel-empty">표시할 내용이 없습니다.</p>
    </slot>
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f1f4f6;
  border: 1px solid #dfe6e9;
  border-radius: 10px;
}

.panel-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: bold;
  color: #2d3436;
}

.panel-empty {
  margin: 0;
  color: #636e72;
}
</style>
