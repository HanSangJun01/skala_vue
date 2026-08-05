<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
// ElMessage 는 태그가 아니라 함수라서 따로 가져와야 한다
import { ElMessage } from 'element-plus'
import { toDateKey, formatDateLabel, fromDateKey } from '@/utils/date'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import DateCalendar from '@/components/exercise/DateCalendar.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

// API 키는 .env 의 VITE_WEATHER_API_KEY 에서 읽는다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
// 현재 날씨(weather)가 아니라 5일 예보(forecast). 3시간 간격 40개가 온다.
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast'

// 조회할 도시 목록. id 는 :key 와 상세 페이지 라우팅에 쓴다.
// query 뒤의 국가 코드는 동명 도시(광주광역시 vs 경기 광주)를 가르기 위한 것.
// ※ 이 목록을 고치면 WeatherDetailView 의 같은 목록도 함께 고칠 것.
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

const router = useRouter()

// 도시별 → 날짜별 예보. { 'kr-seoul': { '2026-08-05': {...} } }
const forecastByCity = ref({})
// 예보가 있는 날짜 목록(오름차순). 달력에서 고를 수 있는 날이 곧 이 값이다.
const availableDates = ref([])
// 지금 보고 있는 날짜. el-calendar 가 Date 객체를 다루므로 Date 로 들고 있는다.
const selectedDate = ref(null)

const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const selectedCityInfo = ref('')

const selectedKey = computed(() => (selectedDate.value ? toDateKey(selectedDate.value) : ''))

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
    if (day) rows.push({ id: city.id, name: city.name, ...day })
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

// 도시 전체의 5일 예보를 병렬로 받아온다.
const fetchForecast = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const requests = targetCities.map((city) => {
      const url = `${BASE_URL}?q=${city.query}&appid=${API_KEY}&units=metric&lang=kr`
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
      selectedDate.value = fromDateKey(availableDates.value[0])
    }
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    errorMessage.value =
      '날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부와 주소를 확인해 주세요.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchForecast)

// 자식이 올려보낸 select-date 를 받아 보고 있는 날짜를 바꾼다.
// 고를 수 없는 날인지는 DateCalendar 가 이미 걸러낸다.
const handleSelectDate = (date) => {
  selectedDate.value = date
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
    <div class="home-grid">
      <!-- 왼쪽 — 날짜 달력 -->
      <aside class="home-side">
        <BaseDashboardCard title="예보 날짜">
          <DateCalendar
            :selected-date="selectedDate"
            :available-dates="availableDates"
            @select-date="handleSelectDate"
          />
        </BaseDashboardCard>
      </aside>

      <!-- 오른쪽 — 선택 날짜 배너 + 검색 + 카드 목록 -->
      <div class="home-main">
        <!-- 지금 보고 있는 날짜를 가장 크게 보여준다 -->
        <div class="date-banner">
          <div class="date-banner-main">
            <span class="date-banner-label">{{ selectedOffsetLabel }}</span>
            <strong class="date-banner-date">{{
              selectedKey === '' ? '날짜를 불러오는 중' : formatDateLabel(selectedKey)
            }}</strong>
          </div>
          <span class="date-banner-sub">{{ filteredWeatherList.length }}개 지역 예보</span>
        </div>

        <BaseDashboardCard title="도시 검색">
          <SearchBar
            :query="searchQuery"
            :result-count="filteredWeatherList.length"
            @update-query="handleUpdateQuery"
          />
        </BaseDashboardCard>

        <BaseDashboardCard title="지역별 날씨 현황">
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

          <!-- slot 안이지만 부모 스코프에서 평가되므로 filteredWeatherList 에 접근할 수 있다 -->
          <ul v-else-if="filteredWeatherList.length > 0" class="card-list">
            <!-- index 를 --i 로 넘겨 카드가 순서대로 조금씩 늦게 떠오르게 한다 -->
            <WeatherCard
              v-for="(city, index) in filteredWeatherList"
              :key="city.id"
              :city-item="city"
              :style="{ '--i': index }"
              @select-card="handleSelectCard"
              @click-detail="handleClickDetail"
            />
          </ul>

          <p v-else class="state-box empty-result">
            "{{ searchQuery }}"와 일치하는 도시가 없습니다.
          </p>
        </BaseDashboardCard>
      </div>
    </div>

    <!-- 상태바 — 선택 전에는 안내 문구를 보여준다 -->
    <div class="status-bar" :class="{ 'is-idle': selectedCityInfo === '' }">
      <span v-if="selectedCityInfo !== ''">{{ selectedCityInfo }}</span>
      <span v-else class="status-hint">카드를 클릭하거나 검색해 보세요.</span>
    </div>
  </div>
</template>

<style scoped>
.weather-app {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

/* 달력 사이드바 + 본문 */
.home-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
  align-items: start;
}

/* 좁은 화면에서는 달력을 위로 올려 한 줄씩 쌓는다 */
@media (max-width: 900px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}

/* ---- 선택 날짜 배너 ---- */
.date-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 18px 22px;
  color: #ffffff;
  background-image: linear-gradient(135deg, #2b4a5e 0%, #16232b 100%);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-md);
}

.date-banner-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

/* 오늘 / 내일 / 3일 뒤 */
.date-banner-label {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.18);
  border-radius: var(--dash-r-pill);
}

.date-banner-date {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.date-banner-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

/* 카드 목록 — 2열로 깔아 한 화면에 더 많이 담는다 */
.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .card-list {
    grid-template-columns: 1fr;
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

/* 상태바 — 선택 전에는 회색, 선택 후에는 강조색 */
.status-bar {
  margin-top: 14px;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: var(--dash-accent-deep);
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
  transition: color var(--dash-ease);
}

/* 아직 선택된 도시가 없을 때는 색을 빼서 조용하게 둔다 */
.status-bar.is-idle {
  color: var(--dash-ink-weak);
}

.status-hint {
  font-weight: 400;
}
</style>
