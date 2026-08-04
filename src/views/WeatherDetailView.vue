<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'

// 발급받은 OpenWeatherMap API 키를 여기에 넣는다.
// 환경 변수(.env)로 빼는 것은 과제 9 의 요구사항이다.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

// 주소의 cityId 를 영문 도시명으로 바꾸기 위한 목록
const targetCities = [
  { id: 'city_01', name: '서울', english: 'Seoul' },
  { id: 'city_02', name: '수원', english: 'Suwon' },
  { id: 'city_03', name: '부산', english: 'Busan' },
]

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const cityDetail = ref(null)

// 통신 상태
const isLoading = ref(false)
const errorMessage = ref('')

// 주소의 :cityId 에 해당하는 도시의 현재 날씨를 받아온다
const fetchDetail = async () => {
  const cityId = route.params.cityId
  console.log(`🔎 상세 페이지 진입: ${cityId}`)

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
    const url = `${BASE_URL}?q=${target.english}&appid=${API_KEY}&units=metric&lang=kr`
    const response = await axios.get(url)

    // Axios 는 response.data 가 이미 JSON 으로 파싱되어 있다
    cityDetail.value = {
      id: target.id,
      name: target.name,
      temp: Math.round(response.data.main.temp),
      status: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      wind: response.data.wind.speed,
      pressure: response.data.main.pressure,
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

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="detail-view">
    <!-- 통신 중 -->
    <p v-if="isLoading" class="loading-text">⏳ 실시간 날씨를 불러오는 중입니다...</p>

    <!-- 통신 실패 -->
    <p v-else-if="errorMessage !== ''" class="error-text">{{ errorMessage }}</p>

    <div v-else-if="cityDetail !== null">
      <h1 class="detail-title">{{ cityDetail.name }} 상세 기상관측</h1>

      <!-- 25도 기준 라벨.
           판정은 화씨 변환값이 아니라 원본 섭씨(cityDetail.temp)로 해야 한다. -->
      <p v-if="cityDetail.temp >= 25" class="temp-label hot">🔥 더움 (25도 이상)</p>
      <p v-else class="temp-label cool">❄️ 선선함 (25도 미만)</p>

      <dl class="detail-list">
        <div class="detail-row">
          <dt>기온</dt>
          <dd>{{ displayTemp }}{{ configStore.unitSymbol }}</dd>
        </div>
        <div class="detail-row">
          <dt>날씨</dt>
          <dd>{{ cityDetail.status }}</dd>
        </div>
        <div class="detail-row">
          <dt>습도</dt>
          <dd>{{ cityDetail.humidity }}%</dd>
        </div>
        <div class="detail-row">
          <dt>풍속</dt>
          <dd>{{ cityDetail.wind }}m/s</dd>
        </div>
        <div class="detail-row">
          <dt>기압</dt>
          <dd>{{ cityDetail.pressure }}hPa</dd>
        </div>
      </dl>
    </div>

    <!-- 등록되지 않은 도시 코드로 들어온 경우 -->
    <div v-else class="detail-empty">
      <p>'{{ route.params.cityId }}'에 해당하는 도시 정보가 없습니다.</p>
    </div>

    <button class="home-btn" @click="goHome">대시보드 홈으로 이동</button>
  </div>
</template>

<style scoped>
.detail-view {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 14px 32px;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: #2d3436;
}

.detail-title {
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 10px;
}

.temp-label {
  display: inline-block;
  margin: 0 0 16px;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 999px;
}

.temp-label.hot {
  background-color: #ffeaa7;
  color: #d63031;
}

.temp-label.cool {
  background-color: #dff9fb;
  color: #0984e3;
}

.detail-list {
  margin: 0 0 20px;
  padding: 16px;
  background-color: #f1f4f6;
  border: 1px solid #dfe6e9;
  border-radius: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid #dfe6e9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row dt {
  font-size: 14px;
  color: #636e72;
}

.detail-row dd {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
}

/* 통신 중 안내 */
.loading-text {
  margin: 0 0 20px;
  padding: 28px 16px;
  text-align: center;
  font-size: 14px;
  color: #636e72;
  background-color: #ffffff;
  border: 1px solid #dfe6e9;
  border-radius: 10px;
}

/* 통신 실패 안내 */
.error-text {
  margin: 0 0 20px;
  padding: 28px 16px;
  text-align: center;
  font-size: 14px;
  color: #d63031;
  background-color: #ffffff;
  border: 1px solid #ffb8b8;
  border-radius: 10px;
}

.detail-empty {
  margin-bottom: 20px;
  padding: 28px 16px;
  text-align: center;
  font-size: 14px;
  color: #636e72;
  background-color: #ffffff;
  border: 1px dashed #dfe6e9;
  border-radius: 10px;
}

.home-btn {
  padding: 9px 14px;
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
  background-color: #42b983;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.home-btn:hover {
  background-color: #35a06f;
}
</style>
