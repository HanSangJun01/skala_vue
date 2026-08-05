<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'
import { getTempTier } from '@/utils/temperature'
import { toDateKey, formatDateLabel } from '@/utils/date'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'

// API 키는 .env 의 VITE_WEATHER_API_KEY 에서 읽는다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
// 예보만 쓴다. 현재 날씨(2.5/weather)에 있던 값이 예보에도 전부 있고,
// 예보를 쓰면 홈에서 고른 날짜를 그대로 보여줄 수 있다.
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast'

// 주소의 cityId 를 검색어로 바꾸기 위한 목록.
// ※ WeatherHomeView 의 목록과 항상 같아야 한다.
const targetCities = [
  { id: 'kr-seoul', name: '서울', query: 'Seoul,KR' },
  { id: 'kr-busan', name: '부산', query: 'Busan,KR' },
  { id: 'kr-daegu', name: '대구', query: 'Daegu,KR' },
  { id: 'kr-incheon', name: '인천', query: 'Incheon,KR' },
  { id: 'kr-gwangju', name: '광주', query: 'Gwangju,KR' },
  { id: 'kr-daejeon', name: '대전', query: 'Daejeon,KR' },
  { id: 'kr-jeju', name: '제주', query: 'Jeju,KR' },

  { id: 'fi-helsinki', name: '헬싱키', query: 'Helsinki,FI' },
  { id: 'is-reykjavik', name: '레이캬비크', query: 'Reykjavik,IS' },
  { id: 'ar-ushuaia', name: '우수아이아', query: 'Ushuaia,AR' },
]

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const cityDetail = ref(null)
// 실제로 보여준 날짜. 주소로 받은 날짜에 예보가 없으면 첫날로 밀린다.
const shownDateKey = ref('')

// 통신 상태
const isLoading = ref(false)
const errorMessage = ref('')

// 홈에서 ?date=2026-08-09 로 넘겨준다. 없으면 오늘.
const requestedDateKey = computed(() => route.query.date ?? toDateKey(new Date()))

// 주소의 :cityId 에 해당하는 도시의 예보를 받아온다
const fetchDetail = async () => {
  const cityId = route.params.cityId
  console.log(`🔎 상세 페이지 진입: ${cityId} / ${requestedDateKey.value}`)

  // 목록에서 해당 도시를 찾는다
  let target = null
  for (const city of targetCities) {
    if (city.id === cityId) {
      target = city
    }
  }

  // 등록되지 않은 도시 코드면 통신하지 않고 끝낸다
  if (target === null) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // units=metric 이면 섭씨로, lang=kr 이면 날씨 설명이 한글로 온다
    const url = `${BASE_URL}?q=${target.query}&appid=${API_KEY}&units=metric&lang=kr`
    const response = await axios.get(url)

    // 3시간 간격 40개를 날짜별로 묶는다
    const buckets = {}
    for (const item of response.data.list) {
      const key = toDateKey(new Date(item.dt * 1000))
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(item)
    }

    // 요청한 날짜에 예보가 없으면(범위 밖) 가장 이른 날로 대신한다
    const key = buckets[requestedDateKey.value]
      ? requestedDateKey.value
      : Object.keys(buckets).sort()[0]
    const items = buckets[key]
    if (!items) return

    shownDateKey.value = key

    // 그날을 대표할 시점은 정오에 가장 가까운 것으로 고른다.
    // 홈 목록과 같은 기준이라야 두 화면의 숫자가 어긋나지 않는다.
    let pick = items[0]
    let bestGap = Infinity
    for (const item of items) {
      const gap = Math.abs(new Date(item.dt * 1000).getHours() - 12)
      if (gap < bestGap) {
        bestGap = gap
        pick = item
      }
    }

    const temps = items.map((item) => item.main.temp)

    // Axios 는 response.data 가 이미 JSON 으로 파싱되어 있다
    cityDetail.value = {
      id: target.id,
      name: target.name,
      temp: Math.round(pick.main.temp),
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      status: pick.weather[0].description,
      // 아이콘 코드('01d', '04n' 같은 값). 그림을 고르는 데 쓴다.
      icon: pick.weather[0].icon,
      humidity: pick.main.humidity,
      wind: pick.wind.speed,
      pressure: pick.main.pressure,
    }
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    errorMessage.value =
      '날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부와 주소를 확인해 주세요.'
  } finally {
    // 성공이든 실패든 로딩 표시는 반드시 해제한다
    isLoading.value = false
  }
}

// 부착(Mounting) 시점이 초기 데이터를 받아오기에 알맞은 타이밍이다
onMounted(fetchDetail)

// 화면에 보여줄 기온. 원본 데이터는 항상 섭씨 숫자다.
// WeatherCard 와 거의 같은 코드가 중복되는데, 이 과제에서는 그대로 둔다.
const displayTemp = computed(() => {
  // cityDetail 은 onMounted 이후에 채워진다
  if (cityDetail.value === null) {
    return null
  }
  const rawTemp = cityDetail.value.temp
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})

// 그날의 최저·최고도 같은 단위로 바꿔 보여준다
const displayRange = computed(() => {
  if (cityDetail.value === null) return null
  const convert = (celsius) =>
    configStore.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius
  return { min: convert(cityDetail.value.tempMin), max: convert(cityDetail.value.tempMax) }
})

// 화면 위에 보여줄 날짜 문구
const dateLabel = computed(() =>
  shownDateKey.value === '' ? '' : formatDateLabel(shownDateKey.value),
)

// 기온 단계. 통신 전에는 cityDetail 이 null 이라 기본값을 쓴다.
const tempTier = computed(() => {
  if (cityDetail.value === null) {
    return getTempTier(20)
  }
  return getTempTier(cityDetail.value.temp)
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="detail-view">
    <!-- 통신 중 — #template 슬롯에 직접 그리면 EP 기본 줄 모양 대신 이 배치가 쓰인다 -->
    <el-skeleton v-if="isLoading" animated>
      <template #template>
        <el-skeleton-item variant="image" class="skeleton-hero" />
        <div class="metric-grid">
          <el-skeleton-item v-for="n in 3" :key="n" variant="image" class="skeleton-metric" />
        </div>
        <p class="loading-caption">실시간 날씨를 불러오는 중입니다...</p>
      </template>
    </el-skeleton>

    <!-- 통신 실패 -->
    <p v-else-if="errorMessage !== ''" class="state-box error-text">{{ errorMessage }}</p>

    <div v-else-if="cityDetail !== null">
      <!-- 히어로 — tier-* 클래스가 배경 그라디언트를 결정한다 -->
      <section class="detail-hero" :class="`tier-${tempTier.key}`">
        <h1 class="detail-title">{{ cityDetail.name }}</h1>
        <!-- 어느 날짜의 예보인지 -->
        <p class="detail-sub">{{ dateLabel }} 예보</p>

        <!-- 기온 왼쪽의 큰 날씨 그림 -->
        <div class="hero-main">
          <WeatherIcon class="hero-icon" :code="cityDetail.icon" />
          <p class="hero-temp">
            {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
          </p>
        </div>

        <!-- 오늘의 최저·최고. 예보가 없는 도시면 이 줄만 빠진다. -->
        <p v-if="displayRange !== null" class="hero-range">
          <span class="range-item">
            최저 <strong>{{ displayRange.min }}{{ configStore.unitSymbol }}</strong>
          </span>
          <span class="range-sep" aria-hidden="true"></span>
          <span class="range-item">
            최고 <strong>{{ displayRange.max }}{{ configStore.unitSymbol }}</strong>
          </span>
        </p>

        <p class="hero-status">{{ cityDetail.status }}</p>

        <!-- 단계 라벨 -->
        <p class="temp-label">
          {{ tempTier.emoji }} {{ tempTier.label }}
          <span class="temp-range">{{ tempTier.rangeText }}</span>
        </p>
      </section>

      <!-- 기온·날씨는 히어로에 이미 나오므로 나머지 세 가지만 -->
      <dl class="metric-grid">
        <div class="metric-card">
          <dt>💧 습도</dt>
          <dd>{{ cityDetail.humidity }}<span class="metric-unit">%</span></dd>
        </div>
        <div class="metric-card">
          <dt>🌬 풍속</dt>
          <dd>{{ cityDetail.wind }}<span class="metric-unit">m/s</span></dd>
        </div>
        <div class="metric-card">
          <dt>🧭 기압</dt>
          <dd>{{ cityDetail.pressure }}<span class="metric-unit">hPa</span></dd>
        </div>
      </dl>
    </div>

    <!-- 등록되지 않은 도시 코드로 들어온 경우 -->
    <div v-else class="state-box detail-empty">
      <p>'{{ route.params.cityId }}'에 해당하는 도시 정보가 없습니다.</p>
    </div>

    <el-button class="home-btn" round @click="goHome">← 대시보드 홈으로 이동</el-button>
  </div>
</template>

<style scoped>
.detail-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

/* 히어로 카드 — 단계에 따라 배경색이 바뀐다 */
.detail-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
  padding: 34px 20px 28px;
  text-align: center;
  color: #ffffff;
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-lg);
  animation: dash-rise var(--dash-ease-out) backwards;
}

/* 배경은 .tier-* 가 넣어준 --t-grad */
.detail-hero {
  background-image: var(--t-grad);
}

/* 오른쪽 위 빛무리 */
.detail-hero::after {
  content: '';
  position: absolute;
  top: -70px;
  right: -50px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.16);
  pointer-events: none;
}

.detail-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.detail-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

/* 그림과 기온을 한 줄에 나란히 세운다 */
.hero-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 18px;
}

/* 기온 숫자보다 뒤로 물러나 보이게 살짝 투명하게 */
.hero-icon {
  width: 62px;
  height: 62px;
  stroke-width: 1.4;
  opacity: 0.92;
}

.hero-temp {
  margin: 0;
  font-size: 68px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.14);
}

.temp-unit {
  margin-left: 2px;
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

/* 오늘의 최저·최고 */
.hero-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 14px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
  font-variant-numeric: tabular-nums;
}

.hero-range strong {
  font-weight: 700;
  color: #ffffff;
}

/* 최저와 최고 사이의 세로 구분선 */
.range-sep {
  width: 1px;
  height: 12px;
  background-color: rgba(255, 255, 255, 0.3);
}

.hero-status {
  margin: 10px 0 16px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

/* 단계 라벨 — 색 있는 배경 위라 반투명 흰색으로 */
.temp-label {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  margin: 0;
  padding: 7px 15px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: var(--dash-r-pill);
}

.temp-range {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.78);
}

/* 관측 수치 — 세 항목을 나란히 놓는다 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 0 18px;
  padding: 0;
}

.metric-card {
  padding: 16px 12px;
  text-align: center;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
  box-shadow: var(--dash-shadow-sm);
  animation: dash-rise var(--dash-ease-out) backwards;
}

/* 카드마다 조금씩 늦게 떠오르게 한다 */
.metric-card:nth-child(2) {
  animation-delay: 70ms;
}

.metric-card:nth-child(3) {
  animation-delay: 140ms;
}

.metric-card dt {
  font-size: 12px;
  color: var(--dash-ink-mid);
}

.metric-card dd {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}

.metric-unit {
  margin-left: 2px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-ink-weak);
}

/* 로딩 자리표시자 — 회색과 반짝임은 el-skeleton-item 이 그린다 */
.skeleton-hero {
  height: 210px;
  margin-bottom: 14px;
  border-radius: var(--dash-r-xl);
}

.skeleton-metric {
  height: 84px;
  border-radius: var(--dash-r-lg);
}

/* 배경 위에 바로 놓여서 한 단계 진한 색을 쓴다 */
.loading-caption {
  margin: 14px 0 18px;
  text-align: center;
  font-size: 12px;
  color: var(--dash-ink-mid);
}

/* 좁은 화면에서는 세 지표를 한 줄에 하나씩 쌓는다 */
@media (max-width: 420px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}

/* 오류 / 정보없음 공통 틀 */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 0 0 16px;
  padding: 38px 16px;
  text-align: center;
  font-size: 13px;
  border-radius: var(--dash-r-lg);
}

.state-box p {
  margin: 0;
}

.error-text {
  color: var(--dash-danger-fg);
  background-color: var(--dash-danger-bg);
  border: 1px solid var(--dash-danger-line);
}

.detail-empty {
  color: var(--dash-ink-mid);
  background-color: var(--dash-sunken);
  border: 1px dashed var(--dash-line);
}

/* 홈 버튼. el-button 은 색을 --el-button-* 변수로 읽는다 */
.home-btn {
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
