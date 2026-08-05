<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
// ElMessage 는 태그가 아니라 함수라서 따로 가져와야 한다
import { ElMessage } from 'element-plus'
import { toDateKey, formatDateLabel } from '@/utils/date'
// 카드 눈금의 양 끝. 머리글에 그대로 찍어 카드와 같은 값을 쓴다는 걸 보인다.
import { SCALE_MIN, SCALE_MAX } from '@/utils/temperature'
import { summarizeAirByDate } from '@/utils/airQuality'
// 지점 목록은 홈·상세·지도가 함께 쓰는 한 파일에서 가져온다
import { TARGET_CITIES as targetCities } from '@/constants/cities'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import DateStrip from '@/components/exercise/DateStrip.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

// API 키는 .env 의 VITE_WEATHER_API_KEY 에서 읽는다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
// 현재 날씨(weather)가 아니라 5일 예보(forecast). 3시간 간격 40개가 온다.
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast'
// 대기질은 별도 엔드포인트. 1시간 간격 96개(약 4~5일)가 온다.
const AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution/forecast'

const router = useRouter()

// 도시별 → 날짜별 예보. { 'kr-seoul': { '2026-08-05': {...} } }
const forecastByCity = ref({})
// 도시별 → 날짜별 대기질. 기온과 다른 축이라 따로 담는다.
const airByCity = ref({})
// 예보가 있는 날짜 목록(오름차순). 스트립에서 고를 수 있는 날이 곧 이 값이다.
const availableDates = ref([])
// 지금 보고 있는 날짜. 'YYYY-MM-DD' 문자열이라 Date 로 오갈 일이 없다.
const selectedKey = ref('')

const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedCityInfo = ref('')
// 'default'(등록 순) | 'desc'(더운 곳부터) | 'asc'(추운 곳부터)
const sortOrder = ref('default')

// 오늘로부터 며칠 뒤인지 — 화면에 '오늘 / 내일 / 3일 뒤' 로 보여준다
const selectedOffsetLabel = computed(() => {
  if (availableDates.value.length === 0) return ''
  const index = availableDates.value.indexOf(selectedKey.value)
  if (index === 0) return '오늘'
  if (index === 1) return '내일'
  return `${index}일 뒤`
})

// 3시간 간격 40개를 날짜별로 묶어 하루치 요약으로 만든다.
const summarizeByDate = (list) => {
  const buckets = {}
  for (const item of list) {
    const key = toDateKey(new Date(item.dt * 1000))
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(item)
  }

  const result = {}
  for (const [key, items] of Object.entries(buckets)) {
    // 그날을 대표할 시점은 정오에 가장 가까운 것으로 고른다.
    // 새벽 값만 잡히면 그날 날씨를 잘못 대표하게 된다.
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
    result[key] = {
      temp: Math.round(pick.main.temp),
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      status: pick.weather[0].description,
      icon: pick.weather[0].icon,
      humidity: pick.main.humidity,
    }
  }
  return result
}

// 선택한 날짜의 도시별 날씨. 날짜가 바뀌면 이 값이 다시 계산되어 카드가 갈린다.
const weatherList = computed(() => {
  const key = selectedKey.value
  if (key === '') return []

  const rows = []
  for (const city of targetCities) {
    const day = forecastByCity.value[city.id]?.[key]
    // 대기질은 날씨보다 예보 기간이 짧다. 마지막 날은 없을 수 있으므로
    // 없으면 null 을 넣어 카드가 칩을 그리지 않게 한다.
    const air = airByCity.value[city.id]?.[key] ?? null
    if (day) rows.push({ id: city.id, name: city.name, ...day, aqi: air?.aqi ?? null })
  }
  return rows
})

// 검색어가 비어 있으면 원본 전체를 그대로 반환한다
const filteredWeatherList = computed(() => {
  if (searchQuery.value === '') {
    return weatherList.value
  }
  return weatherList.value.filter((city) => city.name.includes(searchQuery.value))
})

// 정렬까지 끝난 최종 목록. '오늘 제일 더운 곳'을 눈으로 훑지 않아도 되게 한다.
// ⚠️ sort 는 원본 배열을 바꾸므로 반드시 복사본([...])을 정렬할 것.
//    computed 안에서 filteredWeatherList 를 직접 sort 하면 그 값도 같이 뒤집힌다.
const sortedWeatherList = computed(() => {
  const rows = [...filteredWeatherList.value]
  // 단위를 바꿔도 순서는 그대로여야 하므로 원본 섭씨로 비교한다
  if (sortOrder.value === 'desc') return rows.sort((a, b) => b.temp - a.temp)
  if (sortOrder.value === 'asc') return rows.sort((a, b) => a.temp - b.temp)
  return rows
})

// 도시 전체의 5일 예보를 병렬로 받아온다.
const fetchForecast = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const requests = targetCities.map((city) => {
      const url = `${BASE_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=kr`
      return axios.get(url)
    })

    // axios.all 은 Promise.all 을 감싼 함수. 하나라도 실패하면 catch 로 간다.
    const responses = await axios.all(requests)

    const byCity = {}
    const dateSet = new Set()
    responses.forEach((response, index) => {
      const summary = summarizeByDate(response.data.list)
      byCity[targetCities[index].id] = summary
      Object.keys(summary).forEach((key) => dateSet.add(key))
    })

    forecastByCity.value = byCity
    availableDates.value = [...dateSet].sort()

    // 첫날(오늘)을 기본으로 고른다
    if (availableDates.value.length > 0) {
      selectedKey.value = availableDates.value[0]
    }
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    errorMessage.value =
      '날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부와 주소를 확인해 주세요.'
  } finally {
    isLoading.value = false
  }
}

// 대기질을 따로 받아온다.
// 일부러 날씨와 같은 묶음에 넣지 않았다 — 한 묶음이면 대기질 쪽이 실패할 때
// 멀쩡한 날씨까지 같이 사라진다. 대기질은 있으면 좋은 정보이지 화면의 뼈대가 아니다.
// allSettled 라서 특정 지점만 실패해도 나머지 지점의 칩은 그대로 나온다.
const fetchAirQuality = async () => {
  const results = await Promise.allSettled(
    targetCities.map((city) =>
      axios.get(`${AIR_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`),
    ),
  )

  const byCity = {}
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      console.warn(`대기질을 받지 못했습니다: ${targetCities[index].name}`)
      return
    }
    byCity[targetCities[index].id] = summarizeAirByDate(result.value.data.list, toDateKey)
  })
  airByCity.value = byCity
}

onMounted(() => {
  fetchForecast()
  // 날씨를 기다리지 않고 같이 출발시킨다. 늦게 도착해도 칩만 나중에 붙는다.
  fetchAirQuality()
})

// 자식이 올려보낸 select-date 를 받아 보고 있는 날짜를 바꾼다.
// 스트립에는 예보가 있는 날만 그려지므로 고를 수 없는 날이 올라올 일이 없다.
const handleSelectDate = (key) => {
  selectedKey.value = key
}

// 이전 값(oldValue)이 필요하고 감시 대상이 하나로 명확하므로 watch 를 쓴다
watch(selectedCityInfo, (newValue, oldValue) => {
  console.log(`📍 상태바 변경: [${oldValue}] ➡️ [${newValue}]`)
})

// 감시 대상 파라미터가 없다. 콜백 안에서 searchQuery.value 를 읽는 것만으로 자동 추적된다.
watchEffect(() => {
  console.log(`⌨️ 현재 검색어: ${searchQuery.value}`)
})

const handleUpdateQuery = (value) => {
  searchQuery.value = value
}

// 상태바 문구를 갱신하고 알림도 띄운다.
const handleSelectCard = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`

  // duration(ms) 이 지나면 스스로 사라진다
  ElMessage({
    message: `${city.name} · ${city.temp}℃ · ${city.status}`,
    type: 'success',
    duration: 2000,
    // 연달아 누를 때 알림이 쌓이지 않고 합쳐진다
    grouping: true,
    customClass: 'city-toast',
  })
}

// window.alert 를 제거하고 상세 페이지로 이동시킨다.
// 고른 날짜를 쿼리로 같이 넘겨야 상세도 같은 날 예보를 보여준다.
const handleClickDetail = (city) => {
  router.push({ path: '/weather/' + city.id, query: { date: selectedKey.value } })
}
</script>

<template>
  <div class="weather-app">
    <!-- 날짜 — 예보가 있는 날만 가로로 늘어놓는다.
         칩 자체가 이미 카드 모양이라 패널로 한 번 더 감싸지 않는다. -->
    <DateStrip
      :selected-key="selectedKey"
      :available-dates="availableDates"
      @select-date="handleSelectDate"
    />

    <!-- 고른 날이 무슨 날인지 한 줄로 확인시켜 준다 -->
    <p class="date-caption">
      <strong>{{ selectedKey === '' ? '날짜를 불러오는 중' : formatDateLabel(selectedKey) }}</strong>
      <span v-if="selectedOffsetLabel !== ''" class="date-offset">{{ selectedOffsetLabel }}</span>
    </p>

    <!-- 도구줄 — 검색과 정렬을 한 줄에 합쳤다.
         예전에는 검색이 패널 하나를 통째로 차지해, 입력창 하나에 110px 이 들었다. -->
    <div class="toolbar">
      <SearchBar
        class="toolbar-search"
        :query="searchQuery"
        :result-count="filteredWeatherList.length"
        @update-query="handleUpdateQuery"
      />

      <el-select v-model="sortOrder" class="sort-select" size="small" aria-label="정렬 기준">
        <el-option label="기본 순서" value="default" />
        <el-option label="기온 높은 순" value="desc" />
        <el-option label="기온 낮은 순" value="asc" />
      </el-select>
    </div>

    <BaseDashboardCard title="지역별 날씨 현황">
      <!-- 선택 상태 안내. 예전에는 화면 맨 아래에 있어 스크롤해야 보였다. -->
      <p class="status-line" :class="{ 'is-idle': selectedCityInfo === '' }">
        <span v-if="selectedCityInfo !== ''">{{ selectedCityInfo }}</span>
        <span v-else>카드를 클릭하면 여기에 표시됩니다.</span>
      </p>

      <!-- 눈금 머리글. 카드 그리드와 같은 열 구성을 써야 눈금이 세로로 맞는다.
           패널 전체에 자 하나를 걸치면 '0' 이 화면 한가운데로 가버려
           정작 카드 안의 0℃ 자리와 어긋난다. -->
      <div
        v-if="!isLoading && errorMessage === '' && sortedWeatherList.length > 0"
        class="axis-head"
        aria-hidden="true"
      >
        <!-- 눈금값이 20 단위로 고르게 떨어져야 space-between 위치와 실제
             기온 위치가 맞는다. 값을 하나 빼거나 더하면 어긋난다. -->
        <div v-for="n in 2" :key="n" class="axis-ruler">
          <span>{{ SCALE_MIN }}℃</span><span>−40</span><span>−20</span><span>0</span>
          <span>20</span><span>{{ SCALE_MAX }}℃</span>
        </div>
      </div>

      <!-- 통신 중 — 카드 모양 자리표시자를 깔아 화면이 덜컥거리지 않게 한다 -->
      <div v-if="isLoading">
        <ul class="card-list" aria-hidden="true">
          <li v-for="n in targetCities.length" :key="n" class="skeleton-card">
            <el-skeleton :rows="3" animated />
          </li>
        </ul>
        <p class="loading-caption">5일 예보를 불러오는 중입니다...</p>
      </div>

      <!-- 통신 실패 -->
      <p v-else-if="errorMessage !== ''" class="state-box error-text">{{ errorMessage }}</p>

      <!-- slot 안이지만 부모 스코프에서 평가되므로 sortedWeatherList 에 접근할 수 있다 -->
      <ul v-else-if="sortedWeatherList.length > 0" class="card-list">
        <!-- index 를 --i 로 넘겨 카드가 순서대로 조금씩 늦게 떠오르게 한다 -->
        <WeatherCard
          v-for="(city, index) in sortedWeatherList"
          :key="city.id"
          :city-item="city"
          :style="{ '--i': index }"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
        />
      </ul>

      <p v-else class="state-box empty-result">"{{ searchQuery }}"와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.weather-app {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

/* 스트립 아래 — 고른 날짜를 글자로 한 번 더 확인시켜 준다 */
.date-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 2px 12px;
  font-size: 12px;
  color: var(--dash-ink-mid);
}

.date-caption strong {
  font-weight: 700;
  color: var(--dash-ink);
}

/* 오늘 / 내일 / 3일 뒤 */
.date-offset {
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 700;
  color: var(--dash-accent-deep);
  background-color: var(--dash-accent-soft);
  border-radius: var(--dash-r-pill);
}

/* ---- 도구줄 (검색 + 정렬) ---- */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

/* 검색이 남는 폭을 모두 먹고 정렬은 제 폭만 쓴다 */
.toolbar-search {
  flex: 1;
  min-width: 180px;
}

.sort-select {
  width: 132px;
}

/* 선택된 도시 안내 — 예전 상태바를 목록 바로 위로 올린 것 */
.status-line {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-accent-deep);
  transition: color var(--dash-ease);
}

/* 아직 선택된 도시가 없을 때는 색을 빼서 조용하게 둔다 */
.status-line.is-idle {
  font-weight: 400;
  color: var(--dash-ink-weak);
}

/* 공용 눈금의 머리글 — 카드 그리드와 같은 열 구성 */
.axis-head {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 6px;
}

/* 자 한 벌. 카드 안쪽 여백(16px)만큼 좌우를 띄워야
   카드의 .temp-scale 과 좌우 끝이 정확히 맞는다. */
.axis-ruler {
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--dash-ink-weak);
  font-variant-numeric: tabular-nums;
}

/* 카드 목록 — 2열로 깔아 한 화면에 더 많이 담는다 */
.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 640px) {
  .card-list {
    grid-template-columns: 1fr;
  }

  /* 카드가 한 줄에 하나면 자도 하나만 남는다 */
  .axis-head {
    grid-template-columns: 1fr;
  }

  .axis-ruler + .axis-ruler {
    display: none;
  }
}

/* 오류 / 결과없음 — 생김새가 같으므로 공통 틀을 먼저 정의한다 */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 0;
  padding: 38px 16px;
  text-align: center;
  font-size: 13px;
  border-radius: var(--dash-r-lg);
}

/* 로딩 자리표시자 — 막대와 반짝임은 el-skeleton 이 그린다.
   여기서는 실제 카드와 같은 껍데기만 맞춰준다. */
.skeleton-card {
  padding: 20px 20px 16px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
}

/* el-skeleton 이 만든 막대의 둥글기를 화면 톤에 맞춘다 */
.skeleton-card :deep(.el-skeleton__item) {
  border-radius: var(--dash-r-pill);
}

.loading-caption {
  margin: 14px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--dash-ink-weak);
}

.error-text {
  color: var(--dash-danger-fg);
  background-color: var(--dash-danger-bg);
  border: 1px solid var(--dash-danger-line);
}

/* 검색 결과 없음 안내 */
.empty-result {
  color: var(--dash-ink-mid);
  background-color: var(--dash-sunken);
  border: 1px dashed var(--dash-line);
}
</style>
