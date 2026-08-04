<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 도시 코드별 상세 기상관측 Mock Data
const detailMockData = {
  city_01: { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 55, wind: 2.1, pressure: 1012 },
  city_02: { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 82, wind: 3.4, pressure: 1008 },
  city_03: { id: 'city_03', name: '부산', temp: 26, status: '구름', humidity: 68, wind: 4.0, pressure: 1010 },
}

const cityDetail = ref(null)

// 요구사항 4 — Mount 시점에 주소의 :cityId 로 Mock Data 에서 도시 객체를 고른다
onMounted(() => {
  const cityId = route.params.cityId
  cityDetail.value = detailMockData[cityId] || null
  console.log(`🔎 상세 페이지 진입: ${cityId}`)
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="detail-view">
    <div v-if="cityDetail !== null">
      <h1 class="detail-title">{{ cityDetail.name }} 상세 기상관측</h1>

      <!-- 25도 기준 라벨 -->
      <p v-if="cityDetail.temp >= 25" class="temp-label hot">🔥 더움 (25도 이상)</p>
      <p v-else class="temp-label cool">❄️ 선선함 (25도 미만)</p>

      <dl class="detail-list">
        <div class="detail-row">
          <dt>기온</dt>
          <dd>{{ cityDetail.temp }}℃</dd>
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
