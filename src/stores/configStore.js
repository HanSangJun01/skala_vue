import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 식별자는 use + 파일명 + Store 규칙을 따른다
export const useConfigStore = defineStore('config', () => {
  // state — 단위 (초기값: celsius)
  const unit = ref('celsius')

  // getters — 현재 단위에 맞는 기호
  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))

  // actions — celsius 와 fahrenheit 를 번갈아 전환한다
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  // return 에 넣은 것만 외부에서 쓸 수 있다
  return { unit, unitSymbol, toggleUnit }
})
