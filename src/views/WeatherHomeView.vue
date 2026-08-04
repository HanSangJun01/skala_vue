<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'

// 코드로 페이지를 이동하기 위한 라우터 인스턴스 (Programmatic Navigation)
const router = useRouter()

// 모든 반응형 데이터는 이 View 가 전부 보유한다
// 지역별 날씨 데이터 배열 (Mock Data)
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

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

// 요구사항 3 — window.alert 를 제거하고 상세 페이지로 이동시킨다
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
      <!-- slot 안이지만 부모 스코프에서 평가되므로 filteredWeatherList 에 접근할 수 있다 -->
      <ul v-if="filteredWeatherList.length > 0" class="card-list">
        <WeatherCard
          v-for="city in filteredWeatherList"
          :key="city.id"
          :city-item="city"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
        />
      </ul>

      <p v-else class="empty-result">"{{ searchQuery }}"와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

    <!-- 상태바 — 선택 전에는 안내 문구를 보여준다 -->
    <div class="status-bar">
      <span v-if="selectedCityInfo !== ''">{{ selectedCityInfo }}</span>
      <span v-else class="status-hint">카드를 클릭하거나 검색해 보세요.</span>
    </div>
  </div>
</template>

<style scoped>
.weather-app {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 14px 32px;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: #2d3436;
}

/* 카드 목록 */
.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 검색 결과 없음 안내 */
.empty-result {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: 14px;
  color: #636e72;
  background-color: #ffffff;
  border: 1px dashed #dfe6e9;
  border-radius: 10px;
}

/* 상태바 — 카드 목록 아래 박스 */
.status-bar {
  margin-top: 16px;
  min-height: 40px;
  padding: 11px 14px;
  box-sizing: border-box;
  background-color: #cee3d3;
  color: #006a1e;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  border-radius: 7px;
}

/* 아직 선택된 도시가 없을 때의 안내 문구 */
.status-hint {
  font-weight: normal;
  opacity: 0.75;
}
</style>
