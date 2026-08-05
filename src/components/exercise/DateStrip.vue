<script setup>
import { computed } from 'vue'
import { formatShortDate, getWeekdayLabel } from '@/utils/date'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'

// 예보가 있는 날만 가로로 늘어놓는다.
// 예전에는 el-calendar 로 한 달(42칸)을 그렸는데, 정작 고를 수 있는 날은 6일뿐이라
// 나머지 36칸이 전부 빈자리였다. 게다가 '지난달/다음달' 버튼은 눌러도
// 예보가 없어 아무 일이 일어나지 않는 — 눌리는 척만 하는 버튼이었다.
//
// 이 컴포넌트는 상태를 갖지 않는다. 카드 목록도 같은 날짜를 써야 하므로
// 고른 날짜는 부모가 들고 있어야 한다.
const props = defineProps({
  // 'YYYY-MM-DD'. Date 객체가 아니라 문자열이라 부모에서 변환이 필요 없다.
  selectedKey: { type: String, default: '' },
  availableDates: { type: Array, default: () => [] },

  // 날짜별 { icon, tempMax } — 있으면 칸에 날씨 그림과 최고기온을 같이 그린다.
  // 홈은 넘기지 않는다. 서울과 남극이 한 목록에 있어서
  // '그날의 최고기온'을 하나로 뽑으면 어느 도시 얘기도 아니게 되기 때문이다.
  // 상세는 도시가 하나뿐이라 뜻이 분명해 넘긴다.
  dayInfo: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select-date'])

// 맨 앞 두 칸은 요일 대신 '오늘 / 내일' 로 부른다. 그게 먼저 읽힌다.
const days = computed(() =>
  props.availableDates.map((key, index) => ({
    key,
    shortDate: formatShortDate(key),
    label: index === 0 ? '오늘' : index === 1 ? '내일' : getWeekdayLabel(key),
    info: props.dayInfo[key] ?? null,
  })),
)
</script>

<template>
  <ul class="date-strip">
    <li v-for="day in days" :key="day.key" class="strip-item">
      <!-- button 이라야 키보드 Tab 과 Enter 가 그냥 동작한다 -->
      <!-- 두 span 이 붙어 '오늘8/5' 로 읽히므로 라벨을 따로 준다 -->
      <button
        type="button"
        class="strip-btn"
        :class="{ 'is-picked': day.key === selectedKey }"
        :aria-pressed="day.key === selectedKey"
        :aria-label="
          day.info
            ? `${day.label} ${day.shortDate} 최고 ${day.info.tempMax}도`
            : `${day.label} ${day.shortDate}`
        "
        @click="emit('select-date', day.key)"
      >
        <span class="strip-label">{{ day.label }}</span>
        <span class="strip-date">{{ day.shortDate }}</span>

        <!-- dayInfo 를 넘긴 화면(상세)에서만 나온다 -->
        <template v-if="day.info">
          <WeatherIcon class="strip-icon" :code="day.info.icon" />
          <span class="strip-max">{{ day.info.tempMax }}°</span>
        </template>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.date-strip {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  /* 예보 일수(보통 6일)에 맞춰 칸을 고르게 나눈다 */
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 8px;
}

.strip-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 5px;
  font-family: inherit;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-md);
  cursor: pointer;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease),
    border-color var(--dash-ease);
}

.strip-btn:hover {
  border-color: var(--dash-accent);
  background-color: var(--dash-accent-soft);
}

/* 지금 보고 있는 날 */
.strip-btn.is-picked {
  color: #ffffff;
  background-color: var(--dash-accent);
  border-color: var(--dash-accent);
}

.strip-label {
  font-size: 11px;
  color: var(--dash-ink-weak);
}

.strip-date {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}

/* 아래 둘은 dayInfo 를 넘긴 화면에만 나온다 */
.strip-icon {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: var(--dash-ink-mid);
}

.strip-max {
  font-size: 11px;
  font-weight: 700;
  color: var(--dash-ink-mid);
  font-variant-numeric: tabular-nums;
}

/* 고른 칸 안에서는 두 줄 다 흰색이라야 읽힌다 */
.strip-btn.is-picked .strip-label {
  color: rgba(255, 255, 255, 0.78);
}

.strip-btn.is-picked .strip-date,
.strip-btn.is-picked .strip-icon,
.strip-btn.is-picked .strip-max {
  color: #ffffff;
}

/* 좁은 화면에서는 한 줄에 다 못 들어가므로 가로 스크롤로 넘긴다 */
@media (max-width: 560px) {
  .date-strip {
    grid-auto-columns: 68px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>
