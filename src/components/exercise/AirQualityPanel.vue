<script setup>
import { computed } from 'vue'
import { getAqiGrade, POLLUTANTS, getPollutantPercent } from '@/utils/airQuality'

// 상세 화면의 대기질 패널.
// 등급만 보면 '나쁨'의 원인을 알 수 없어 항목별 농도를 막대로 함께 그린다.
const props = defineProps({
  // { aqi, components } — 없으면 안내만 보여준다
  air: { type: Object, default: null },
})

const grade = computed(() => (props.air ? getAqiGrade(props.air.aqi) : null))

// 막대에 그릴 항목들. 응답에 없는 항목은 건너뛴다.
const rows = computed(() => {
  if (props.air === null) return []
  return POLLUTANTS.filter((item) => typeof props.air.components[item.key] === 'number').map(
    (item) => {
      const value = props.air.components[item.key]
      return {
        key: item.key,
        label: item.label,
        // 소수 둘째 자리까지 오므로 한 자리로 줄인다
        value: Math.round(value * 10) / 10,
        percent: getPollutantPercent(value, item.cap),
      }
    },
  )
})
</script>

<template>
  <div class="air-panel">
    <p class="panel-label">대기질 · 그날 가장 나빴던 시각 기준</p>

    <div v-if="grade" class="air-grid">
      <!-- 등급 -->
      <div class="air-badge" :style="{ backgroundColor: grade.color }">
        <strong>{{ grade.label }}</strong>
        <span>AQI {{ air.aqi }} / 5</span>
      </div>

      <!-- 항목별 농도 -->
      <dl class="air-bars">
        <div v-for="row in rows" :key="row.key" class="air-row">
          <dt>{{ row.label }}</dt>
          <dd class="air-track">
            <span
              class="air-fill"
              :style="{ width: row.percent + '%', backgroundColor: grade.color }"
            ></span>
          </dd>
          <dd class="air-value">{{ row.value }}<span class="air-unit">㎍/㎥</span></dd>
        </div>
      </dl>
    </div>

    <!-- 대기질은 날씨보다 예보 기간이 짧아 마지막 날은 값이 없다 -->
    <p v-else class="air-empty">이 날짜의 대기질 예보는 아직 제공되지 않습니다.</p>
  </div>
</template>

<style scoped>
.air-panel {
  margin-bottom: 10px;
  padding: 16px 18px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-sm);
}

.panel-label {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-ink-mid);
}

.air-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;
}

/* 등급 — 이 패널에서 색을 쓰는 곳은 여기와 막대뿐 */
.air-badge {
  min-width: 116px;
  padding: 14px 16px;
  text-align: center;
  color: #ffffff;
  border-radius: var(--dash-r-lg);
}

.air-badge strong {
  display: block;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.air-badge span {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  font-variant-numeric: tabular-nums;
}

.air-bars {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 이름 · 막대 · 수치 세 칸 */
.air-row {
  display: grid;
  grid-template-columns: 92px 1fr 84px;
  gap: 10px;
  align-items: center;
}

.air-row dt {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--dash-ink-mid);
}

.air-row dd {
  margin: 0;
}

.air-track {
  height: 6px;
  border-radius: var(--dash-r-pill);
  background-color: var(--dash-line-soft);
  overflow: hidden;
}

.air-fill {
  display: block;
  height: 100%;
  border-radius: var(--dash-r-pill);
  transition: width var(--dash-ease-out);
}

.air-value {
  text-align: right;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}

.air-unit {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--dash-ink-weak);
}

.air-empty {
  margin: 0;
  padding: 20px 0 6px;
  text-align: center;
  font-size: 12.5px;
  color: var(--dash-ink-weak);
}

/* 좁은 화면에서는 등급을 위로 올리고 막대 이름을 줄인다 */
@media (max-width: 560px) {
  .air-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .air-row {
    grid-template-columns: 80px 1fr 72px;
  }
}
</style>
