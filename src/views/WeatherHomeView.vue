<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

// API 키는 .env 의 VITE_WEATHER_API_KEY 에서 읽는다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

// 조회할 도시 목록. id 는 :key 와 상세 페이지 라우팅에 계속 필요하다.
//
// query 는 OpenWeatherMap 에 그대로 넘기는 검색어다. 뒤에 국가 코드를 붙였는데,
// 'Gwangju' 만 보내면 광주광역시와 경기도 광주시가 헷갈리기 때문이다.
// 국가를 못박아야 엉뚱한 나라의 동명 도시가 걸리지 않는다.
//
// ※ 이 목록을 고치면 WeatherDetailView 의 같은 목록도 함께 고쳐야 한다.
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

// 코드로 페이지를 이동하기 위한 라우터 인스턴스 (Programmatic Navigation)
const router = useRouter()

// 모든 반응형 데이터는 이 View 가 전부 보유한다
// 실데이터로 채워질 배열. 처음에는 비어 있다.
const weatherList = ref([])

// 통신 상태
const isLoading = ref(false)
const errorMessage = ref('')

// 검색어 (한글 조합 중인 글자까지 그대로 담긴다)
const searchQuery = ref('')

// 선택된 도시 — 상태바에 표시되는 문구
const selectedCityInfo = ref('')

// 검색어가 비어 있으면 원본 전체를 그대로 반환한다
const filteredWeatherList = computed(() => {
  if (searchQuery.value === '') {
    return weatherList.value
  }
  return weatherList.value.filter((city) => city.name.includes(searchQuery.value))
})

// 도시 3곳의 현재 날씨를 순서대로 받아온다
const fetchWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const results = []

  try {
    for (const city of targetCities) {
      // units=metric 이면 섭씨로, lang=kr 이면 날씨 설명이 한글로 온다
      const url = `${BASE_URL}?q=${city.query}&appid=${API_KEY}&units=metric&lang=kr`
      const response = await axios.get(url)

      // Axios 는 response.data 가 이미 JSON 으로 파싱되어 있다
      results.push({
        id: city.id,
        name: city.name,
        temp: Math.round(response.data.main.temp),
        status: response.data.weather[0].description,
        // 아이콘 코드('01d', '04n' 같은 값). 그림을 고르는 데 쓴다.
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
      })
    }
    weatherList.value = results
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
onMounted(fetchWeather)

// 이전 값(oldValue)이 필요하고 감시 대상이 하나로 명확하므로 watch 를 쓴다
watch(selectedCityInfo, (newValue, oldValue) => {
  console.log(`📍 상태바 변경: [${oldValue}] ➡️ [${newValue}]`)
})

// 감시 대상 파라미터가 없다. 콜백 안에서 searchQuery.value 를 읽는 것만으로 자동 추적된다.
watchEffect(() => {
  console.log(`⌨️ 현재 검색어: ${searchQuery.value}`)
})

// 자식이 올려보낸 update-query 를 받아 검색어를 갱신한다
const handleUpdateQuery = (value) => {
  searchQuery.value = value
}

// 자식이 올려보낸 select-card 를 받아 상태바 문구를 갱신한다
const handleSelectCard = (city) => {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

// window.alert 를 제거하고 상세 페이지로 이동시킨다
const handleClickDetail = (city) => {
  router.push('/weather/' + city.id)
}
</script>

<template>
  <div class="weather-app">
    <!-- 검색박스 : BaseDashboardCard 의 slot 에 SearchBar 주입 -->
    <BaseDashboardCard title="도시 검색">
      <SearchBar
        :query="searchQuery"
        :result-count="filteredWeatherList.length"
        @update-query="handleUpdateQuery"
      />
    </BaseDashboardCard>

    <!-- 리스트박스 : 같은 BaseDashboardCard 를 재사용 -->
    <BaseDashboardCard title="지역별 날씨 현황">
      <!-- 통신 중 — 빈 상자 대신 카드 모양 자리표시자(skeleton)를 깔아 둔다.
           곧 나타날 결과와 크기가 같아 화면이 덜컥거리지 않는다.
           개수를 targetCities.length 로 묶어 두면 도시를 늘려도 따로 고칠 필요가 없다. -->
      <div v-if="isLoading">
        <ul class="card-list" aria-hidden="true">
          <li
            v-for="n in targetCities.length"
            :key="n"
            class="skeleton-card"
            :style="{ '--i': n - 1 }"
          >
            <div class="sk-line sk-name"></div>
            <div class="sk-line sk-status"></div>
            <div class="sk-line sk-scale"></div>
            <div class="sk-line sk-foot"></div>
          </li>
        </ul>
        <p class="loading-caption">실시간 날씨를 불러오는 중입니다...</p>
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

      <p v-else class="state-box empty-result">"{{ searchQuery }}"와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

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

/* 카드 목록 — 도시가 여섯 곳이라 2열로 깔면 한 화면에 다 들어온다.
   세로로만 쌓으면 스크롤이 길어져 대시보드처럼 보이지 않는다. */
.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 좁은 화면에서는 한 줄에 하나씩 쌓는다 */
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

/* ---- 로딩 자리표시자(skeleton) ---- */
/* 실제 카드와 같은 여백·크기의 회색 상자를 미리 깔아 둔다.
   모양이 어긋나면 데이터가 도착하는 순간 화면이 덜컥거린다. */
.skeleton-card {
  padding: 20px 20px 16px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-lg);
  animation: dash-rise var(--dash-ease-out) backwards;
  animation-delay: calc(var(--i, 0) * 60ms);
}

/* 회색 막대 위로 빛이 훑고 지나가 "불러오는 중"임을 알린다 */
.sk-line {
  height: 12px;
  border-radius: var(--dash-r-pill);
  background-image: linear-gradient(
    90deg,
    var(--dash-line-soft) 40%,
    var(--dash-sunken) 50%,
    var(--dash-line-soft) 60%
  );
  background-size: 200% 100%;
  animation: dash-shimmer 1.4s linear infinite;
}

/* 실제 카드의 도시명 / 날씨설명 / 기온눈금 / 아랫줄 자리를 그대로 흉내낸다 */
.sk-name {
  width: 34%;
  height: 15px;
}

.sk-status {
  width: 50%;
  margin-top: 9px;
}

.sk-scale {
  width: 100%;
  height: 5px;
  margin-top: 22px;
}

.sk-foot {
  width: 62%;
  height: 26px;
  margin-top: 18px;
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

/* 상태바 — 카드 목록 아래 박스.
   선택 전에는 조용한 회색, 선택 후에는 강조색으로 살아난다. */
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
  /* 그라디언트와 흰 글자를 빼고, 흰 카드 위에 강조색 글자만 얹는다 */
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
