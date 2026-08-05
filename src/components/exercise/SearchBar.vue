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
    <!-- 돋보기는 장식이므로 입력창을 감싸고 CSS 로 위치만 잡는다 -->
    <div class="search-field">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        class="search-input"
        :value="query"
        @input="onInput"
        placeholder="검색할 도시 이름을 입력하세요"
      />
    </div>

    <p class="search-result">
      검색 중인 도시 : <strong>{{ query }}</strong>
      <span class="search-count">검색 결과 {{ resultCount }}건</span>
    </p>
  </div>
</template>

<style scoped>
.search-field {
  position: relative;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  font-size: 13px;
  opacity: 0.45;
  pointer-events: none; /* 아이콘을 클릭해도 입력창이 눌리도록 */
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px 13px 38px; /* 왼쪽은 아이콘 자리만큼 비운다 */
  font-family: inherit;
  font-size: 14px;
  color: var(--dash-ink);
  background-color: var(--dash-sunken);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  outline: none;
  transition:
    border-color var(--dash-ease),
    background-color var(--dash-ease),
    box-shadow var(--dash-ease);
}

.search-input::placeholder {
  color: var(--dash-ink-weak);
}

.search-input:focus {
  background-color: var(--dash-surface);
  border-color: var(--dash-accent);
  box-shadow:
    0 0 0 4px var(--dash-accent-soft),
    var(--dash-shadow-sm);
}

.search-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--dash-ink-mid);
}

.search-result strong {
  font-weight: 700;
  color: var(--dash-ink);
}

/* 결과 건수는 알약 모양으로 떼어내 눈에 먼저 들어오게 한다 */
.search-count {
  margin-left: auto;
  padding: 3px 9px;
  font-weight: 700;
  color: var(--dash-accent-deep);
  background-color: var(--dash-accent-soft);
  border-radius: var(--dash-r-pill);
}
</style>
