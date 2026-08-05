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

// 기온 단계(폭염~혹한). 카드 색과 라벨 문구를 한 번에 결정한다.
// 화씨로 바꾼 displayTemp 가 아니라 원본 섭씨를 넘겨야 한다.
const tempTier = computed(() => getTempTier(props.cityItem.temp))

// 눈금 막대의 채움 비율. 이것도 판정 기준은 원본 섭씨다.
// 단위를 화씨로 바꿔도 막대 길이가 달라지면 안 되기 때문이다.
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
  <!-- tier-폭염키 클래스가 --t-solid 를 넣어준다.
       목록에서는 그 단색을 기온 숫자와 눈금 막대, 두 곳에만 쓴다. -->
  <li class="weather-card" :class="`tier-${tempTier.key}`" @click="emit('select-card', cityItem)">
    <div class="card-head">
      <div class="card-info">
        <h3 class="city-name">{{ cityItem.name }}</h3>

        <!-- 날씨 설명 앞에 그림을 붙인다.
             글자만 있을 때보다 어떤 날씨인지 훨씬 빨리 알아본다. -->
        <p class="city-status">
          <WeatherIcon :code="cityItem.icon" />
          {{ cityItem.status }}
        </p>
      </div>

      <p class="city-temp">
        {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
      </p>
    </div>

    <!-- 기온 눈금 — 숫자만으로는 도시 간 차이가 한눈에 안 들어온다.
         -20~40℃ 구간에서 이 도시가 어디쯤인지 막대 길이로 보여준다.
         순수 시각 보조라 aria-hidden 으로 스크린리더에서는 건너뛴다. -->
    <div
      class="temp-scale"
      :title="`${SCALE_MIN}℃ ~ ${SCALE_MAX}℃ 중 ${cityItem.temp}℃`"
      aria-hidden="true"
    >
      <span class="temp-scale-fill" :style="{ width: `${tempPercent}%` }"></span>
    </div>

    <div class="card-foot">
      <!-- 단계 라벨. v-if 로 두 갈래를 적던 것을 단계 객체 하나로 대체했다. -->
      <p class="temp-label">{{ tempTier.label }}</p>

      <!-- 습도는 fetchWeather 에서 이미 받아 두고도 목록에서는 쓰지 않던 값이다 -->
      <p class="humidity-chip">습도 {{ cityItem.humidity }}%</p>

      <!-- .stop 으로 위쪽 li 의 @click 까지 번지지 않게 한다 -->
      <button class="detail-btn" @click.stop="emit('click-detail', cityItem)">상세보기</button>
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

  /* 목록에 나타날 때 아래에서 떠오른다.
     --i 는 부모(WeatherHomeView)가 v-for 순번으로 넘겨준다. */
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

/* 기온 — 카드에서 가장 먼저 읽혀야 하므로 가장 크고 단계색으로 칠한다 */
.city-temp {
  margin: 0;
  font-size: 40px;
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  white-space: nowrap;
  color: var(--t-solid);
  /* 숫자 폭을 고정해 35 -> 9 처럼 자릿수가 바뀌어도 흔들리지 않는다 */
  font-variant-numeric: tabular-nums;
}

.temp-unit {
  font-size: 17px;
  font-weight: 700;
  opacity: 0.5;
}

/* 기온 눈금 막대 */
.temp-scale {
  height: 5px;
  margin-top: 18px;
  overflow: hidden;
  background-color: var(--dash-line-soft);
  border-radius: var(--dash-r-pill);
}

.temp-scale-fill {
  display: block;
  height: 100%;
  background-color: var(--t-solid);
  border-radius: var(--dash-r-pill);
  /* 단위를 바꿔도 막대는 그대로지만, 목록이 갱신될 때 부드럽게 늘어난다 */
  transition: width var(--dash-ease-out);
}

/* 아래쪽 줄 — 라벨·습도·상세보기 버튼.
   margin-top:auto 로 카드 높이가 달라도 항상 바닥에 붙는다. */
.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 카드가 좁아지면 버튼이 아랫줄로 내려간다 */
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
}

/* 단계 라벨 — 왼쪽 눈금과 기온 숫자가 이미 색으로 알려주므로 글자만 남긴다 */
.temp-label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--dash-ink);
}

/* 습도 — 라벨과 가운뎃점으로 구분하고 한 단계 흐리게 */
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

/* 상세보기 버튼 — 카드 전체가 이미 눌리므로 평소엔 힘을 뺀다.
   margin-left:auto 로 오른쪽 끝에 붙인다. */
.detail-btn {
  margin-left: auto;
  padding: 7px 13px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-ink-mid);
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  cursor: pointer;
  white-space: nowrap;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease),
    border-color var(--dash-ease);
}

.detail-btn:hover {
  color: #ffffff;
  background-color: var(--dash-accent);
  border-color: var(--dash-accent);
}
</style>
