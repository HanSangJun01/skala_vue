<script setup>
import { computed } from 'vue'
import { getAqiGrade } from '@/utils/airQuality'

// 카드에 붙는 대기질 표시.
// 기온과 색이 겹칠 수 있어 네모 스와치 + 라벨로 형태를 다르게 준다.
const props = defineProps({
  // 1~5. 아직 못 받았거나 예보 범위 밖이면 null.
  aqi: { type: Number, default: null },
})

const grade = computed(() => (props.aqi === null ? null : getAqiGrade(props.aqi)))
</script>

<template>
  <!-- 등급을 모르면 자리만 비운다 -->
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

/* 네모 — 기온 눈금의 동그란 점과 형태를 다르게 둔다 */
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
