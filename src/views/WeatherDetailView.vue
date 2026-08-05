<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'
import { getTempTier } from '@/utils/temperature'
import { toDateKey, formatDateLabel } from '@/utils/date'
import { summarizeAirByDate } from '@/utils/airQuality'
// 지점 목록은 홈·상세·지도가 함께 쓰는 한 파일에서 가져온다
import { TARGET_CITIES as targetCities } from '@/constants/cities'
import DateStrip from '@/components/exercise/DateStrip.vue'
import WeatherIcon from '@/components/exercise/WeatherIcon.vue'
import AirQualityPanel from '@/components/exercise/AirQualityPanel.vue'

// API 키는 .env 의 VITE_WEATHER_API_KEY 에서 읽는다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
// 예보만 쓴다. 현재 날씨(2.5/weather)에 있던 값이 예보에도 전부 있고,
// 예보를 쓰면 홈에서 고른 날짜를 그대로 보여줄 수 있다.
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast'
// 대기질은 별도 엔드포인트. 1시간 간격 96개(약 4~5일)가 온다.
const AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution/forecast'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

// 3시간 간격 원본을 날짜별로 묶어 통째로 들고 있는다.
// 예전에는 요청한 하루치만 남기고 나머지 30여 개를 버렸는데,
// 그러면 날짜를 바꿀 때마다 같은 응답을 다시 받아와야 한다.
const bucketsByDate = ref({})
// 날짜별 대기질 요약. 기온과 다른 축이라 따로 담는다.
const airByDate = ref({})
// 실제로 보여준 날짜. 주소로 받은 날짜에 예보가 없으면 첫날로 밀린다.
const shownDateKey = ref('')

// 통신 상태
const isLoading = ref(false)
const errorMessage = ref('')

// 홈에서 ?date=2026-08-09 로 넘겨준다. 없으면 오늘.
const requestedDateKey = computed(() => route.query.date ?? toDateKey(new Date()))

// 주소의 :cityId 에 해당하는 도시. 등록되지 않은 코드면 null.
const targetCity = computed(
  () => targetCities.find((city) => city.id === route.params.cityId) ?? null,
)

// 예보가 있는 날짜 목록(오름차순) — 날짜 스트립이 이 값을 쓴다
const availableDates = computed(() => Object.keys(bucketsByDate.value).sort())

// 주소의 :cityId 에 해당하는 도시의 예보를 받아온다
const fetchDetail = async () => {
  const target = targetCity.value
  console.log(`🔎 상세 페이지 진입: ${route.params.cityId} / ${requestedDateKey.value}`)

  // 등록되지 않은 도시 코드면 통신하지 않고 끝낸다
  if (target === null) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // units=metric 이면 섭씨로, lang=kr 이면 날씨 설명이 한글로 온다
    const url = `${BASE_URL}?lat=${target.lat}&lon=${target.lon}&appid=${API_KEY}&units=metric&lang=kr`
    const response = await axios.get(url)

    // 3시간 간격 40개를 날짜별로 묶는다
    const buckets = {}
    for (const item of response.data.list) {
      const key = toDateKey(new Date(item.dt * 1000))
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(item)
    }
    bucketsByDate.value = buckets

    // 요청한 날짜에 예보가 없으면(범위 밖) 가장 이른 날로 대신한다
    shownDateKey.value = buckets[requestedDateKey.value]
      ? requestedDateKey.value
      : Object.keys(buckets).sort()[0]
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    errorMessage.value =
      '날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부와 주소를 확인해 주세요.'
  } finally {
    // 성공이든 실패든 로딩 표시는 반드시 해제한다
    isLoading.value = false
  }
}

// 대기질을 따로 받아온다. 날씨와 같은 try 안에 두면 대기질이 실패할 때
// 멀쩡한 날씨까지 오류 화면으로 바뀐다. 여기서는 조용히 비워 둔다.
const fetchAirQuality = async () => {
  const target = targetCity.value
  if (target === null) return

  try {
    const response = await axios.get(
      `${AIR_URL}?lat=${target.lat}&lon=${target.lon}&appid=${API_KEY}`,
    )
    airByDate.value = summarizeAirByDate(response.data.list, toDateKey)
  } catch (error) {
    console.warn('대기질을 받지 못했습니다:', error)
    airByDate.value = {}
  }
}

// 부착(Mounting) 시점이 초기 데이터를 받아오기에 알맞은 타이밍이다
onMounted(() => {
  fetchDetail()
  fetchAirQuality()
})

// 보고 있는 날의 대기질. 예보 마지막 날은 없을 수 있어 null 이 된다.
const shownAir = computed(() => airByDate.value[shownDateKey.value] ?? null)

// 보고 있는 날의 3시간 간격 원본
const shownItems = computed(() => bucketsByDate.value[shownDateKey.value] ?? [])

// 그날의 요약. 통신이 끝나기 전에는 null 이다.
const cityDetail = computed(() => {
  const items = shownItems.value
  if (targetCity.value === null || items.length === 0) return null

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

  return {
    name: targetCity.value.name,
    temp: Math.round(pick.main.temp),
    tempMin: Math.round(Math.min(...temps)),
    tempMax: Math.round(Math.max(...temps)),
    status: pick.weather[0].description,
    // 아이콘 코드('01d', '04n' 같은 값). 그림을 고르는 데 쓴다.
    icon: pick.weather[0].icon,
    humidity: pick.main.humidity,
    wind: pick.wind.speed,
    pressure: pick.main.pressure,
    // pop 은 0~1 비율로 온다. 그날 중 가장 높은 값을 쓴다 —
    // '오늘 비 오나?' 에 답하려면 평균보다 최댓값이 맞다.
    pop: Math.round(Math.max(...items.map((item) => item.pop ?? 0)) * 100),
  }
})

// 섭씨 숫자를 현재 단위로 바꾼다. 원본 데이터는 항상 섭씨다.
const toDisplayUnit = (celsius) =>
  configStore.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius

const displayTemp = computed(() => (cityDetail.value ? toDisplayUnit(cityDetail.value.temp) : null))

// 그날의 최저·최고도 같은 단위로 바꿔 보여준다
const displayRange = computed(() => {
  if (cityDetail.value === null) return null
  return {
    min: toDisplayUnit(cityDetail.value.tempMin),
    max: toDisplayUnit(cityDetail.value.tempMax),
  }
})

// 날짜 칸에 같이 그릴 날씨 그림과 최고기온.
// 이미 받아둔 예보에서 뽑아내는 것이라 추가 통신이 없다.
// 도시가 하나뿐인 화면이라 '그날의 최고기온'이 무엇을 가리키는지 분명하다.
const dayInfo = computed(() => {
  const result = {}
  for (const [key, items] of Object.entries(bucketsByDate.value)) {
    // 그림은 정오에 가장 가까운 시점의 것을 쓴다 — 요약과 같은 기준
    let pick = items[0]
    let bestGap = Infinity
    for (const item of items) {
      const gap = Math.abs(new Date(item.dt * 1000).getHours() - 12)
      if (gap < bestGap) {
        bestGap = gap
        pick = item
      }
    }
    result[key] = {
      icon: pick.weather[0].icon,
      tempMax: toDisplayUnit(Math.round(Math.max(...items.map((item) => item.main.temp)))),
    }
  }
  return result
})

// ---- 시간대별 그래프 ----
// API 가 주는 3시간 간격 값을 그대로 쓴다. 예전에는 하루 1개(정오 대표값)만
// 남기고 나머지를 버렸는데, 이미 받아온 데이터라 추가 통신이 없다.
// 좌표는 아래 <svg viewBox="0 0 620 150"> 기준이다.
const CHART_LEFT = 35
const CHART_RIGHT = 596
const CHART_TOP = 30
const CHART_BOTTOM = 104

const chartPoints = computed(() => {
  const items = shownItems.value
  if (items.length === 0) return []

  const temps = items.map((item) => item.main.temp)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  // 하루 종일 기온이 같으면 span 이 0 이 되어 0 으로 나누게 된다
  const span = maxTemp - minTemp || 1

  return items.map((item, index) => {
    const date = new Date(item.dt * 1000)
    // 점이 하나뿐이면 (length - 1) 이 0 이라 역시 0 으로 나누게 된다
    const ratio = items.length === 1 ? 0.5 : index / (items.length - 1)
    return {
      x: CHART_LEFT + ratio * (CHART_RIGHT - CHART_LEFT),
      y: CHART_BOTTOM - ((item.main.temp - minTemp) / span) * (CHART_BOTTOM - CHART_TOP),
      temp: toDisplayUnit(Math.round(item.main.temp)),
      hourLabel: `${String(date.getHours()).padStart(2, '0')}시`,
    }
  })
})

// polyline 의 points 속성은 'x,y x,y ...' 형식의 문자열 하나를 받는다
const chartLine = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

// 화면 위에 보여줄 날짜 문구
const dateLabel = computed(() =>
  shownDateKey.value === '' ? '' : formatDateLabel(shownDateKey.value),
)

// 기온 단계. 통신 전에는 cityDetail 이 null 이라 기본값을 쓴다.
const tempTier = computed(() =>
  cityDetail.value === null ? getTempTier(20) : getTempTier(cityDetail.value.temp),
)

// ---- 도시 이동 ----
// 목록을 순환시킨다. 첫 도시의 '이전'은 마지막 도시가 된다.
const cityIndex = computed(() => targetCities.findIndex((city) => city.id === route.params.cityId))

const prevCity = computed(() =>
  cityIndex.value < 0
    ? null
    : targetCities[(cityIndex.value - 1 + targetCities.length) % targetCities.length],
)

const nextCity = computed(() =>
  cityIndex.value < 0 ? null : targetCities[(cityIndex.value + 1) % targetCities.length],
)

// 도시를 바꾸면 주소의 :cityId 만 달라진다. 같은 컴포넌트가 재사용되어
// onMounted 가 다시 불리지 않으므로 이동이 끝난 뒤 직접 다시 받아온다.
const goCity = async (city) => {
  await router.push({ path: '/weather/' + city.id, query: { date: shownDateKey.value } })
  fetchDetail()
  fetchAirQuality()
}

// 날짜는 이미 받아둔 데이터 안에서 갈아끼우기만 하면 된다 — 통신이 없다
const handleSelectDate = (key) => {
  shownDateKey.value = key
}

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
        <el-skeleton-item variant="image" class="skeleton-chart" />
        <div class="metric-grid">
          <el-skeleton-item v-for="n in 4" :key="n" variant="image" class="skeleton-metric" />
        </div>
        <p class="loading-caption">실시간 날씨를 불러오는 중입니다...</p>
      </template>
    </el-skeleton>

    <!-- 통신 실패 -->
    <p v-else-if="errorMessage !== ''" class="state-box error-text">{{ errorMessage }}</p>

    <div v-else-if="cityDetail !== null">
      <!-- 히어로 — tier-* 클래스가 배경 그라디언트를 결정한다.
           세로로 쌓지 않고 가로로 눕혀 남는 높이를 그래프에 내준다. -->
      <section class="detail-hero" :class="`tier-${tempTier.key}`">
        <div class="hero-info">
          <h1 class="detail-title">{{ cityDetail.name }}</h1>
          <p class="detail-sub">{{ dateLabel }} · {{ cityDetail.status }}</p>

          <!-- 단계 라벨 -->
          <p class="temp-label">
            {{ tempTier.label }}
            <span class="temp-range">{{ tempTier.rangeText }}</span>
          </p>
        </div>

        <div class="hero-main">
          <WeatherIcon class="hero-icon" :code="cityDetail.icon" />
          <div class="hero-temp-box">
            <p class="hero-temp">
              {{ displayTemp }}<span class="temp-unit">{{ configStore.unitSymbol }}</span>
            </p>
            <!-- 그날의 최저·최고 -->
            <p class="hero-range">최저 {{ displayRange.min }}° · 최고 {{ displayRange.max }}°</p>
          </div>
        </div>
      </section>

      <!-- 날짜 이동 — 예전에는 다른 날을 보려면 홈까지 돌아가야 했다.
           이미 받아둔 데이터라 여기서 날짜를 바꿔도 통신하지 않는다. -->
      <div class="detail-panel">
        <DateStrip
          :selected-key="shownDateKey"
          :available-dates="availableDates"
          :day-info="dayInfo"
          @select-date="handleSelectDate"
        />
      </div>

      <!-- 시간대별 그래프 -->
      <div class="detail-panel">
        <p class="panel-label">시간대별 기온 · 3시간 간격</p>

        <svg
          class="hour-chart"
          viewBox="0 0 620 150"
          role="img"
          :aria-label="`${dateLabel} 시간대별 기온`"
        >
          <title>시간대별 기온</title>

          <!-- 가로 기준선 — 선이 허공에 뜨지 않게 바닥을 깔아준다 -->
          <g stroke="var(--dash-line-soft)" stroke-width="1">
            <line x1="35" y1="30" x2="596" y2="30" />
            <line x1="35" y1="67" x2="596" y2="67" />
            <line x1="35" y1="104" x2="596" y2="104" />
          </g>

          <!-- 꺾은선 -->
          <polyline
            :points="chartLine"
            fill="none"
            stroke="var(--dash-accent)"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- 각 시각의 점 + 기온 + 시각 -->
          <g v-for="point in chartPoints" :key="point.hourLabel">
            <circle :cx="point.x" :cy="point.y" r="3.5" fill="var(--dash-accent)" />
            <text class="chart-temp" :x="point.x" :y="point.y - 12" text-anchor="middle">
              {{ point.temp }}
            </text>
            <text class="chart-hour" :x="point.x" y="138" text-anchor="middle">
              {{ point.hourLabel }}
            </text>
          </g>
        </svg>
      </div>

      <!-- 대기질 — 기온과 나란히 놓아야 '덥지만 나가도 되나'에 답이 된다 -->
      <AirQualityPanel :air="shownAir" />

      <!-- 관측 수치. 이모지는 기기마다 모양이 달라 WeatherIcon 처럼 SVG 로 그린다. -->
      <dl class="metric-grid">
        <div class="metric-card">
          <dt>
            <svg class="metric-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.7 6.7 9.4a7 7 0 1 0 10.6 0Z" />
            </svg>
            습도
          </dt>
          <dd>{{ cityDetail.humidity }}<span class="metric-unit">%</span></dd>
        </div>

        <div class="metric-card">
          <dt>
            <svg class="metric-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 8h11a3 3 0 1 0-3-3" />
              <path d="M3 12h15a3 3 0 1 1-3 3" />
              <path d="M3 16h8" />
            </svg>
            풍속
          </dt>
          <dd>{{ cityDetail.wind }}<span class="metric-unit">m/s</span></dd>
        </div>

        <div class="metric-card">
          <dt>
            <svg class="metric-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m15.5 8.5-2 5-5 2 2-5Z" />
            </svg>
            기압
          </dt>
          <dd>{{ cityDetail.pressure }}<span class="metric-unit">hPa</span></dd>
        </div>

        <!-- 강수확률 — 응답의 pop 필드에 있는데 그동안 안 쓰고 있었다 -->
        <div class="metric-card">
          <dt>
            <svg class="metric-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" />
              <path d="M12 12v6a2.5 2.5 0 0 0 5 0" />
            </svg>
            강수확률
          </dt>
          <dd>{{ cityDetail.pop }}<span class="metric-unit">%</span></dd>
        </div>
      </dl>

      <!-- 도시 이동 — 예전에는 옆 도시를 보려면 홈을 거쳐야 했다 -->
      <nav class="city-nav">
        <el-button v-if="prevCity" class="nav-btn" round @click="goCity(prevCity)">
          ← {{ prevCity.name }}
        </el-button>
        <el-button class="nav-btn is-home" round @click="goHome">대시보드 홈</el-button>
        <el-button v-if="nextCity" class="nav-btn" round @click="goCity(nextCity)">
          {{ nextCity.name }} →
        </el-button>
      </nav>
    </div>

    <!-- 등록되지 않은 도시 코드로 들어온 경우 -->
    <template v-else>
      <div class="state-box detail-empty">
        <p>'{{ route.params.cityId }}'에 해당하는 도시 정보가 없습니다.</p>
      </div>

      <el-button class="nav-btn" round @click="goHome">← 대시보드 홈으로 이동</el-button>
    </template>
  </div>
</template>

<style scoped>
.detail-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

/* 히어로 — 단계에 따라 배경색이 바뀐다.
   가로 배치라 예전(세로)보다 높이가 3분의 1로 줄었다. */
.detail-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 22px 26px;
  color: #ffffff;
  background-image: var(--t-grad);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-lg);
  animation: dash-rise var(--dash-ease-out) backwards;
}

/* 오른쪽 위 빛무리 */
.detail-hero::after {
  content: '';
  position: absolute;
  top: -70px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.16);
  pointer-events: none;
}

/* 빛무리(::after) 위로 올린다 */
.hero-info,
.hero-main {
  position: relative;
  z-index: 1;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.detail-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 단계 라벨 — 색 있는 배경 위라 반투명 흰색으로 */
.temp-label {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  margin: 12px 0 0;
  padding: 5px 13px;
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

/* 그림과 기온을 한 줄에 나란히 세운다 */
.hero-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 기온 숫자보다 뒤로 물러나 보이게 살짝 투명하게 */
.hero-icon {
  width: 52px;
  height: 52px;
  stroke-width: 1.4;
  opacity: 0.92;
}

.hero-temp-box {
  text-align: right;
}

.hero-temp {
  margin: 0;
  font-size: 54px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.14);
}

.temp-unit {
  margin-left: 2px;
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

/* 그날의 최저·최고 */
.hero-range {
  margin: 6px 0 0;
  font-size: 12px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
}

/* 날짜 스트립·그래프를 담는 흰 판 */
.detail-panel {
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

/* ---- 시간대별 그래프 ---- */
.hour-chart {
  display: block;
  width: 100%;
  height: auto;
}

.chart-temp {
  font-size: 12px;
  font-weight: 700;
  fill: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}

.chart-hour {
  font-size: 11px;
  fill: var(--dash-ink-weak);
}

/* 관측 수치 — 네 개의 상자 대신 구분선으로 나눈 한 줄 띠.
   숫자 하나씩 담은 큰 상자 넷은 테두리와 그림자가 내용보다 무거웠다. */
.metric-grid {
  display: flex;
  margin: 0 0 10px;
  padding: 0;
  overflow: hidden;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
  box-shadow: var(--dash-shadow-sm);
}

.metric-card {
  flex: 1;
  min-width: 0;
  padding: 11px 13px;
  border-right: 1px solid var(--dash-line-soft);
  animation: dash-rise var(--dash-ease-out) backwards;
}

.metric-card:last-child {
  border-right: 0;
}

/* 카드마다 조금씩 늦게 떠오르게 한다 */
.metric-card:nth-child(2) {
  animation-delay: 60ms;
}

.metric-card:nth-child(3) {
  animation-delay: 120ms;
}

.metric-card:nth-child(4) {
  animation-delay: 180ms;
}

.metric-card dt {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--dash-ink-mid);
}

/* 지표 그림 — 이모지 대신 쓰는 선 아이콘 */
.metric-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: var(--dash-accent);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.metric-card dd {
  margin: 5px 0 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}

.metric-unit {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dash-ink-weak);
}

/* ---- 도시 이동 ---- */
.city-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 가운데 홈 버튼을 양옆으로 밀어 이전/다음을 끝에 붙인다 */
.city-nav .is-home {
  margin: 0 auto;
}

/* 로딩 자리표시자 — 회색과 반짝임은 el-skeleton-item 이 그린다 */
.skeleton-hero {
  height: 130px;
  margin-bottom: 10px;
  border-radius: var(--dash-r-xl);
}

.skeleton-chart {
  height: 170px;
  margin-bottom: 10px;
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

/* 좁은 화면에서는 지표를 2×2 로 접고 히어로를 가운데로 모은다 */
@media (max-width: 560px) {
  .metric-grid {
    flex-wrap: wrap;
  }

  .metric-card {
    flex: 1 1 50%;
    border-bottom: 1px solid var(--dash-line-soft);
  }

  /* 접힌 뒤에는 2·4번째가 오른쪽 끝이라 세로선을 지운다 */
  .metric-card:nth-child(2n) {
    border-right: 0;
  }

  .metric-card:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .detail-hero {
    justify-content: center;
    text-align: center;
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

/* el-button 은 색을 --el-button-* 변수로 읽는다 */
.nav-btn {
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
