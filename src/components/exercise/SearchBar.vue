<script setup>
// 요구사항 3 — 부모로부터 검색어를 전달받아 표시하고(props),
// 입력이 생기면 update-query 이벤트로 부모에게 올려보낸다(emits)
defineProps({
  query: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update-query'])

// props 는 읽기 전용이라 여기서 query 를 직접 바꿀 수 없다 (p140).
// v-model 대신 :value + @input 을 유지해야 한글 조합 중인 글자도 즉시 전달된다.
const onInput = (event) => {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div class="search-bar">
    <!-- 돋보기는 장식. 이모지는 기기마다 모양이 달라 SVG 로 그린다. -->
    <div class="search-field">
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        class="search-input"
        :value="query"
        @input="onInput"
        placeholder="도시 이름 검색"
        aria-label="도시 이름 검색"
      />

      <!-- 검색 전에는 아무것도 거르지 않았으므로 건수를 띄우지 않는다 -->
      <span v-if="query !== ''" class="search-count">{{ resultCount }}건</span>
    </div>
  </div>
</template>

<style scoped>
/* 껍데기가 곧 입력창이라, 안쪽 input 이 초점을 받을 때 :focus-within 으로 칠한다 */
.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  transition:
    border-color var(--dash-ease),
    box-shadow var(--dash-ease);
}

.search-field:focus-within {
  border-color: var(--dash-accent);
  box-shadow: 0 0 0 3px var(--dash-accent-soft);
}

.search-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--dash-ink-weak);
  stroke-width: 2;
  stroke-linecap: round;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--dash-ink);
  background-color: transparent;
  border: 0;
  outline: none;
}

.search-input::placeholder {
  color: var(--dash-ink-weak);
}

/* 껍데기가 이미 초점 테두리를 그리므로 input 자체의 기본 링은 끈다 */
.search-input:focus-visible {
  outline: none;
}

/* 결과 건수 */
.search-count {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--dash-accent-deep);
  background-color: var(--dash-accent-soft);
  border-radius: var(--dash-r-pill);
  font-variant-numeric: tabular-nums;
}
</style>
