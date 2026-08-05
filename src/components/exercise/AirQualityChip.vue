<script setup>
import { computed } from 'vue'
import { getAqiGrade } from '@/utils/airQuality'

// 카드 한 귀퉁이에 붙는 대기질 표시.
// 기온은 큰 숫자와 눈금이 맡고, 대기질은 이 알약이 맡는다.
// 두 축이 같은 색 계열로 겹칠 수 있어서, 색만 쓰지 않고
// 네모 스와치 + 글자 라벨을 항상 같이 둬 형태로 구분한다.
const props = defineProps({
  // 1~5 정수. 아직 못 받았거나 예보 범위 밖이면 null 이 온다.
  aqi: { type: Number, default: null },
})

const grade = computed(() => (props.aqi === null ? null : getAqiGrade(props.aqi)))
</script>

<template>
  <!-- 등급을 모르면 자리만 비운다. '정보 없음' 을 굳이 그리면 카드가 시끄러워진다. -->
  <span v-if="grade" class="aq-chip" :title="`대기질 ${grade.label} (AQI ${aqi}/5)`">
    <span class="aq-swatch" :style="{ backgroundColor: grade.color }" aria-hidden="true"></span>
    <span class="aq-label">대기질 {{ grade.label }}</span>
  </span>
</template>

<style scoped>
.aq-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--dash-ink-mid);
  background-color: var(--dash-sunken);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
}

/* 네모 — 기온 눈금의 동그란 점과 형태를 다르게 해 두 축을 가른다 */
.aq-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.aq-label {
  letter-spacing: -0.01em;
}
</style>
