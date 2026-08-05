<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { getTempTier, getTempPercent, SCALE_MIN, SCALE_MAX } from '@/utils/temperature'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'
import AirQualityChip from '@/components/exercise/AirQualityChip.vue'

// 도시 객체 하나를 전달받아 표시하고(props),
// 카드 선택(select-card)과 상세보기(click-detail)를 부모에게 올려보낸다(emits)
const props = defineProps({
  cityItem: { type: Object, required: true },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

// 기온 단계. 원본 섭씨를 넘겨야 한다 (화씨를 넣으면 판정이 틀어진다)
const tempTier = computed(() => getTempTier(props.cityItem.temp))

// 눈금 위 위치. 모든 카드가 같은 자를 쓰므로 점 위치가 곧 기온이다.
// 단위를 바꿔도 자리는 그대로여야 하므로 섭씨 기준.
const tempPercent = computed(() => getTempPercent(props.cityItem.temp))

// 최저~최고가 눈금에서 차지하는 구간
const rangePercent = computed(() => {
  const min = getTempPercent(props.cityItem.tempMin)
  const max = getTempPercent(props.cityItem.tempMax)
  return { left: min, width: Math.max(0, max - min) }
})

// 영하와 영상을 가르는 기준선 위치
const zeroPercent = getTempPercent(0)

// 섭씨 숫자를 현재 단위로 바꾼다. 원본 데이터는 항상 섭씨다.
const toDisplayUnit = (celsius) =>
  configStore.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius

const displayTemp = computed(() => toDisplayUnit(props.cityItem.temp))

// 그날의 최저·최고
const displayRange = computed(() => ({
  min: toDisplayUnit(props.cityItem.tempMin),
  max: toDisplayUnit(props.cityItem.tempMax),
}))
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

      <div class="card-temp">
        <p class="city-temp">
          {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
        </p>

        <!-- 그날의 최저·최고 -->
        <p class="city-range">{{ displayRange.min }}° / {{ displayRange.max }}°</p>
      </div>
    </div>

    <!-- 기온 눈금 — 띠는 그날의 최저~최고, 점은 대표기온.
         색은 CSS 가 --t-solid 로 읽으므로 여기서 적지 않는다. -->
    <div
      class="temp-scale"
      :title="`${SCALE_MIN}℃ ~ ${SCALE_MAX}℃ 중 ${cityItem.temp}℃`"
      aria-hidden="true"
    >
      <span class="scale-track"></span>
      <span class="scale-zero" :style="{ left: zeroPercent + '%' }"></span>
      <span
        class="scale-span"
        :style="{ left: rangePercent.left + '%', width: rangePercent.width + '%' }"
      ></span>
      <span class="scale-dot" :style="{ left: tempPercent + '%' }"></span>
    </div>

    <div class="card-foot">
      <!-- 단계 라벨 -->
      <p class="temp-label">{{ tempTier.label }}</p>

      <!-- 습도 -->
      <p class="humidity-chip">습도 {{ cityItem.humidity }}%</p>

      <!-- 예보 범위 밖(마지막 날)이면 aqi 가 null 이라 알아서 빠진다 -->
      <AirQualityChip :aqi="cityItem.aqi ?? null" />

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
  padding: 14px 16px 12px;
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
  font-size: 15px;
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

/* 기온과 최저·최고를 오른쪽 끝에 세로로 붙인다 */
.card-temp {
  text-align: right;
}

/* 기온 — 가장 먼저 읽혀야 하므로 크고 단계색으로 */
.city-temp {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
  white-space: nowrap;
  color: var(--t-solid);
  /* 자릿수가 바뀌어도 폭이 흔들리지 않게 */
  font-variant-numeric: tabular-nums;
}

.temp-unit {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.45;
}

/* 최저·최고 — 대표기온을 방해하지 않게 작고 흐리게 */
.city-range {
  margin: 6px 0 0;
  font-size: 12px;
  white-space: nowrap;
  color: var(--dash-ink-weak);
  font-variant-numeric: tabular-nums;
}

/* ---- 기온 눈금 ----
   기준면 위에 자·기준선·구간·점을 겹쳐 놓는다.
   양 끝 값은 utils/temperature.js 의 SCALE_MIN·SCALE_MAX 를 따른다. */
.temp-scale {
  position: relative;
  height: 12px;
  margin-top: 14px;
  margin-bottom: 2px;
}

/* 자 — 전체 구간 */
.scale-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background-color: var(--dash-line-soft);
  border-radius: var(--dash-r-pill);
}

/* 0℃ 기준선 */
.scale-zero {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 8px;
  transform: translateY(-50%);
  background-color: var(--dash-line);
}

/* 그날의 최저~최고 구간 */
.scale-span {
  position: absolute;
  top: 50%;
  height: 3px;
  transform: translateY(-50%);
  border-radius: var(--dash-r-pill);
  background-color: var(--t-solid);
  opacity: 0.32;
  transition: all var(--dash-ease-out);
}

/* 대표기온. 흰 테두리를 둘러 구간 띠 위에서도 또렷하게 보인다. */
.scale-dot {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--t-solid);
  box-shadow: 0 0 0 2px var(--dash-surface);
  transition: left var(--dash-ease-out);
}

/* 아래쪽 줄 — margin-top:auto 로 카드 높이가 달라도 바닥에 붙는다 */
.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 카드가 좁아지면 버튼이 아랫줄로 내려간다 */
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
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
