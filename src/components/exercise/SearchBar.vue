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
    <input
      type="text"
      class="search-input"
      :value="query"
      @input="onInput"
      placeholder="검색할 도시 이름을 입력하세요"
    />
    <p class="search-result">검색 중인 도시 : {{ query }} (검색 결과 {{ resultCount }}건)</p>
  </div>
</template>

<style scoped>
.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  font-size: 14px;
  border: 1px solid #dfe6e9;
  border-radius: 6px;
  outline: none;
}

.search-input:focus {
  border-color: #42b983;
}

.search-result {
  margin-top: 6px;
  margin-bottom: 0;
  font-size: 13px;
  color: #636e72;
}
</style>
