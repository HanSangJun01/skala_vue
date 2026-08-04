<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

// 요구사항 1 — 반응형 상태 관리
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

// 요구사항 2 — 검색 도시 (computed 활용)
// 검색어가 비어 있으면 원본 전체를 그대로 반환한다 (요구사항 4-1)
const filteredWeatherList = computed(() => {
  if (searchQuery.value === '') {
    return weatherList.value
  }
  return weatherList.value.filter((city) => city.name.includes(searchQuery.value))
})

// 요구사항 3-1 — watch 로 selectedCityInfo 감시
// 이전 값(oldValue)이 필요하고 감시 대상이 하나로 명확하므로 watch 를 쓴다
watch(selectedCityInfo, (newValue, oldValue) => {
  console.log(`📍 상태바 변경: [${oldValue}] ➡️ [${newValue}]`)
})

// 요구사항 3-2 — watchEffect 로 searchQuery 감시
// 감시 대상 파라미터가 없다. 콜백 안에서 searchQuery.value 를 읽는 것만으로 자동 추적된다.
// 컴포넌트가 처음 만들어질 때 1회 즉시 실행되므로 새로고침 직후에도 로그가 찍힌다.
watchEffect(() => {
  console.log(`⌨️ 현재 검색어: ${searchQuery.value}`)
})

// v-model 대신 @input 으로 직접 받아야 한글 조합 중인 글자도 즉시 반영된다
const onInput = (event) => {
  searchQuery.value = event.target.value
}

// 카드를 누르면 상태바 문구를 갱신 (부모 요소의 이벤트)
const selectCity = (cityName) => {
  selectedCityInfo.value = `${cityName}이 선택되었습니다.`
}

// [상세보기] 버튼 — @click.stop 으로 카드 클릭까지 번지지 않게 한다
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="weather-app">
    <h1 class="app-title">🌤 과제 2: 날씨(컴포지션)</h1>

    <!-- 도시 검색 : :value + @input 양방향 바인딩 -->
    <section class="panel">
      <h2 class="panel-title">도시 검색</h2>
      <input
        type="text"
        class="search-input"
        :value="searchQuery"
        @input="onInput"
        placeholder="검색할 도시 이름을 입력하세요"
      />
      <p class="search-result">
        검색 중인 도시 : {{ searchQuery }} (검색 결과 {{ filteredWeatherList.length }}건)
      </p>
    </section>

    <!-- 지역별 날씨 현황 -->
    <section class="panel">
      <h2 class="panel-title">지역별 날씨 현황</h2>

      <!-- 요구사항 4 — 검색 결과가 있을 때 : 필터링된 목록 출력 -->
      <ul v-if="filteredWeatherList.length > 0" class="card-list">
        <li
          v-for="city in filteredWeatherList"
          :key="city.id"
          class="weather-card"
          @click="selectCity(city.name)"
        >
          <h3 class="city-name">{{ city.name }}</h3>
          <p class="city-temp">{{ city.temp }}℃</p>
          <p class="city-status">{{ city.status }}</p>

          <!-- 25도 기준 라벨 분기 -->
          <p v-if="city.temp >= 25" class="temp-label hot">🔥 더움</p>
          <p v-else class="temp-label cool">❄️ 선선함</p>

          <!-- .stop 으로 버블링 차단 -->
          <button class="detail-btn" @click.stop="showDetail(city.name, city.status)">
            상세보기
          </button>
        </li>
      </ul>

      <!-- 요구사항 4 — 검색 결과가 없을 때 : 안내 문구 -->
      <p v-else class="empty-result">"{{ searchQuery }}"와 일치하는 도시가 없습니다.</p>
    </section>

    <!-- 상태바 — 선택 전에는 안내 문구를 보여준다 -->
    <div class="status-bar">
      <span v-if="selectedCityInfo !== ''">{{ selectedCityInfo }}</span>
      <span v-else class="status-hint">카드를 클릭하거나 검색해 보세요.</span>
    </div>
  </div>
</template>

<style>
/* 외부 CSS 파일을 이 컴포넌트로 불러온다 (교재 p096) */
@import '@/assets/weather-mockup.css';
</style>
