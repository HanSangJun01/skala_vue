<script setup>
import { computed } from 'vue'
import { toDateKey } from '@/utils/date'

// 부모가 고른 날짜와 고를 수 있는 날 목록을 전달받아 표시하고(props),
// 다른 날을 누르면 select-date 이벤트로 부모에게 올려보낸다(emits).
// 이 컴포넌트는 상태를 갖지 않는다 — 카드 목록도 같은 날짜를 써야 하므로
// selectedDate 는 부모가 들고 있어야 한다.
const props = defineProps({
  selectedDate: { type: Date, default: null },
  availableDates: { type: Array, default: () => [] },
})

const emit = defineEmits(['select-date'])

const selectedKey = computed(() => (props.selectedDate ? toDateKey(props.selectedDate) : ''))

// 예보가 있는 날인지 (칸을 칠하는 데 쓴다)
const isAvailable = (dayKey) => props.availableDates.includes(dayKey)

// el-calendar 에는 날짜를 막는 기능이 없다.
// 대신 model-value 를 넘기면 완전 제어 컴포넌트가 되므로,
// 예보가 없는 날은 올려보내지 않으면 달력이 알아서 원래 날짜로 돌아간다.
const handlePickDate = (date) => {
  if (!isAvailable(toDateKey(date))) return
  emit('select-date', date)
}
</script>

<template>
  <div class="date-calendar-box">
    <el-calendar
      class="date-calendar"
      :model-value="selectedDate"
      @update:model-value="handlePickDate"
    >
      <!-- date-cell 슬롯으로 칸을 직접 그린다 -->
      <template #date-cell="{ data }">
        <div
          class="cal-cell"
          :class="{
            'is-available': isAvailable(data.day),
            'is-picked': data.day === selectedKey,
          }"
        >
          <span class="cal-day">{{ Number(data.day.split('-')[2]) }}</span>
          <span v-if="isAvailable(data.day)" class="cal-dot"></span>
        </div>
      </template>
    </el-calendar>

    <p class="cal-hint">예보가 있는 {{ availableDates.length }}일만 고를 수 있습니다.</p>
  </div>
</template>

<style scoped>
/* el-calendar 는 기본 여백이 크고 헤더가 화려하다. 사이드바에 맞게 줄인다. */
.date-calendar :deep(.el-calendar__header) {
  padding: 0 0 10px;
  border-bottom: 1px solid var(--dash-line-soft);
}

.date-calendar :deep(.el-calendar__title) {
  font-size: 14px;
  font-weight: 700;
  color: var(--dash-ink);
}

.date-calendar :deep(.el-calendar__body) {
  padding: 10px 0 0;
}

.date-calendar :deep(.el-calendar-table td) {
  border: none;
}

.date-calendar :deep(.el-calendar-table .el-calendar-day) {
  height: auto;
  min-height: 0;
  padding: 0;
  background-color: transparent;
}

/* EP 가 오늘·선택 칸에 넣는 기본 배경을 지운다. 우리가 직접 칠한다. */
.date-calendar :deep(.el-calendar-table td.is-selected),
.date-calendar :deep(.el-calendar-table td.is-today) {
  background-color: transparent;
}

.date-calendar :deep(.el-calendar-table thead th) {
  padding: 6px 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--dash-ink-weak);
}

/* 날짜 한 칸 */
.cal-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  font-size: 13px;
  border-radius: var(--dash-r-sm);
  /* 예보가 없는 날은 흐리게. 눌러도 아무 일이 없다는 뜻이다. */
  color: var(--dash-ink-weak);
  opacity: 0.45;
}

/* 고를 수 있는 날 */
.cal-cell.is-available {
  font-weight: 700;
  color: var(--dash-ink);
  background-color: var(--dash-sunken);
  opacity: 1;
  cursor: pointer;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease);
}

.cal-cell.is-available:hover {
  background-color: var(--dash-accent-soft);
}

/* 지금 보고 있는 날 */
.cal-cell.is-picked {
  color: #ffffff;
  background-color: var(--dash-accent);
}

.cal-cell.is-picked:hover {
  background-color: var(--dash-accent-deep);
}

/* 고를 수 있는 날 아래의 작은 점 */
.cal-dot {
  position: absolute;
  bottom: 4px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: var(--dash-accent);
}

.cal-cell.is-picked .cal-dot {
  background-color: #ffffff;
}

.cal-hint {
  margin: 12px 0 0;
  font-size: 11px;
  text-align: center;
  color: var(--dash-ink-weak);
}
</style>
