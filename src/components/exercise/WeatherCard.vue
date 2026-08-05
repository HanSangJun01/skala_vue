<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { getTempTier, getTempPercent, SCALE_MIN, SCALE_MAX } from '@/utils/temperature'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'

// 도시 객체 하나를 전달받아 표시하고(props),
// 카드 선택(select-card)과 상세보기(click-detail)를 부모에게 올려보낸다(emits)
const props = defineProps({
  cityItem: { type: Object, required: true },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

// 기온 단계. 원본 섭씨를 넘겨야 한다 (화씨를 넣으면 판정이 틀어진다)
const tempTier = computed(() => getTempTier(props.cityItem.temp))

// 눈금 막대 채움 비율. 단위를 바꿔도 길이는 그대로여야 하므로 섭씨 기준.
const tempPercent = computed(() => getTempPercent(props.cityItem.temp))

// 화면에 보여줄 기온. 원본 데이터는 항상 섭씨 숫자다.
const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})
</script>

<template>
  <!-- tier-* 클래스가 --t-solid 를 넣어준다. 목록에서는 두 곳에만 쓴다. -->
  <li class="weather-card" :class="`tier-${tempTier.key}`" @click="emit('select-card', cityItem)">
    <div class="card-head">
      <div class="card-info">
        <h3 class="city-name">{{ cityItem.name }}</h3>

        <!-- 날씨 설명 앞의 그림 -->
        <p class="city-status">
          <WeatherIcon :code="cityItem.icon" />
          {{ cityItem.status }}
        </p>
      </div>

      <p class="city-temp">
        {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
      </p>
    </div>

    <!-- 기온 눈금 — -20~40℃ 중 어디쯤인지 막대로 보여준다.
         show-text 를 끄지 않으면 오른쪽에 "63%" 가 따라붙는다.
         색은 CSS 에서 --t-solid 를 읽으므로 color 속성을 쓰지 않는다. -->
    <el-progress
      class="temp-scale"
      :percentage="tempPercent"
      :stroke-width="5"
      :show-text="false"
      :title="`${SCALE_MIN}℃ ~ ${SCALE_MAX}℃ 중 ${cityItem.temp}℃`"
      aria-hidden="true"
    />

    <div class="card-foot">
      <!-- 단계 라벨 -->
      <p class="temp-label">{{ tempTier.label }}</p>

      <!-- 습도 -->
      <p class="humidity-chip">습도 {{ cityItem.humidity }}%</p>

      <!-- .stop 으로 위쪽 li 의 @click 까지 번지지 않게 한다 -->
      <el-button class="detail-btn" size="small" round @click.stop="emit('click-detail', cityItem)">
        상세보기
      </el-button>
    </div>
  </li>
</template>

<style scoped>
.weather-card {
  display: flex;
  flex-direction: column;
  padding: 20px 20px 16px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
  cursor: pointer;
  transition:
    border-color var(--dash-ease),
    box-shadow var(--dash-ease),
    transform var(--dash-ease);

  /* --i 는 부모가 v-for 순번으로 넘겨준다 */
  animation: dash-rise var(--dash-ease-out) backwards;
  animation-delay: calc(var(--i, 0) * 60ms);
}

.weather-card:hover {
  border-color: var(--dash-ink-weak);
  box-shadow: var(--dash-shadow-md);
  transform: translateY(-2px);
}

/* 위쪽 줄 — 도시 정보와 기온 */
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.city-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dash-ink);
}

/* 그림과 글자를 한 줄에 세로 가운데로 맞춘다 */
.city-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--dash-ink-mid);
}

/* 기온 — 가장 먼저 읽혀야 하므로 크고 단계색으로 */
.city-temp {
  margin: 0;
  font-size: 40px;
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  white-space: nowrap;
  color: var(--t-solid);
  /* 자릿수가 바뀌어도 폭이 흔들리지 않게 */
  font-variant-numeric: tabular-nums;
}

.temp-unit {
  font-size: 17px;
  font-weight: 700;
  opacity: 0.5;
}

/* 기온 눈금 막대 — el-progress 의 겉자리만 잡아준다 */
.temp-scale {
  margin-top: 18px;
}

/* el-progress 내부 요소는 scoped 로 닿지 않아 :deep() 이 필요하다 */
.temp-scale :deep(.el-progress-bar__outer) {
  background-color: var(--dash-line-soft);
  border-radius: var(--dash-r-pill);
}

/* EP 기본색은 강조색 하나뿐이라 단계색으로 바꾼다 */
.temp-scale :deep(.el-progress-bar__inner) {
  background-color: var(--t-solid);
  border-radius: var(--dash-r-pill);
  /* EP 기본(.6s)은 느려서 화면 전체와 맞춘다 */
  transition: width var(--dash-ease-out);
}

/* 아래쪽 줄 — margin-top:auto 로 카드 높이가 달라도 바닥에 붙는다 */
.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 카드가 좁아지면 버튼이 아랫줄로 내려간다 */
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
}

/* 단계 라벨 — 눈금과 기온이 이미 색으로 알려주므로 글자만 */
.temp-label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--dash-ink);
}

/* 습도 — 가운뎃점으로 구분하고 흐리게 */
.humidity-chip {
  margin: 0;
  font-size: 12px;
  white-space: nowrap;
  color: var(--dash-ink-weak);
  font-variant-numeric: tabular-nums;
}

.humidity-chip::before {
  content: '·';
  margin-right: 7px;
}

/* 상세보기 버튼. el-button 은 색을 --el-button-* 변수로 읽는다 */
.detail-btn {
  margin-left: auto;
  --el-button-bg-color: var(--dash-surface);
  --el-button-border-color: var(--dash-line);
  --el-button-text-color: var(--dash-ink-mid);
  --el-button-hover-bg-color: var(--dash-accent);
  --el-button-hover-border-color: var(--dash-accent);
  --el-button-hover-text-color: #ffffff;
  --el-button-active-bg-color: var(--dash-accent-deep);
  --el-button-active-border-color: var(--dash-accent-deep);
  --el-button-active-text-color: #ffffff;
  --el-button-font-weight: 700;
}
</style>
