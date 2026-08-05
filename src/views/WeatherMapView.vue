<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import L from 'leaflet'
// Leaflet 은 자기 CSS 가 없으면 타일이 어긋나고 확대 버튼이 깨진다.
// 컴포넌트에서 가져오면 이 화면을 열 때만 내려받는다(라우트가 지연 로딩이라).
import 'leaflet/dist/leaflet.css'

import { useConfigStore } from '@/stores/configStore'
import { getTempTier } from '@/utils/temperature'
import { TARGET_CITIES } from '@/constants/cities'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
// 지금 날씨(예보가 아니라). 지도 위 핀은 '현재'가 자연스럽다.
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'

// OpenWeatherMap 이 주는 날씨 타일. 지금 쓰는 API 키를 그대로 쓴다.
// 목록으로는 절대 안 보이는 것 — 비구름이 어디서 어디로 오는 중인지가 보인다.
const LAYERS = [
  { key: 'temp_new', label: '기온' },
  { key: 'precipitation_new', label: '강수' },
  { key: 'clouds_new', label: '구름' },
  { key: 'wind_new', label: '바람' },
]

const router = useRouter()
const configStore = useConfigStore()

const isLoading = ref(false)
const errorMessage = ref('')
const cityTemps = ref({})
const activeLayer = ref('temp_new')

// Leaflet 인스턴스는 반응형일 필요가 없다.
// ref() 로 감싸면 Vue 가 내부를 통째로 프록시로 감싸 지도가 느려지고 오작동한다.
let map = null
let overlay = null
let markerLayer = null

// 섭씨 → 현재 단위
const toDisplayUnit = (celsius) =>
  configStore.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius

const loadedCount = computed(() => Object.keys(cityTemps.value).length)

// 지점별 현재 기온을 받아온다.
// allSettled 라서 한 지점이 실패해도 나머지 핀은 그대로 찍힌다.
const fetchTemps = async () => {
  isLoading.value = true
  errorMessage.value = ''

  const results = await Promise.allSettled(
    TARGET_CITIES.map((city) =>
      axios.get(
        `${WEATHER_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric&lang=kr`,
      ),
    ),
  )

  const temps = {}
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    temps[TARGET_CITIES[index].id] = {
      temp: Math.round(result.value.data.main.temp),
      status: result.value.data.weather[0].description,
    }
  })

  cityTemps.value = temps
  isLoading.value = false

  if (Object.keys(temps).length === 0) {
    errorMessage.value = '기온을 가져오지 못했습니다. API 키 활성화 여부를 확인해 주세요.'
  }
}

// 웹 메르카토르는 극점을 그릴 수 없다(위도 90 에서 무한대로 늘어난다).
// Leaflet 이 다루는 한계가 ±85.05 라서, 남극(−90)은 그대로 두면 지도 밖으로 나간다.
// 표시용으로만 잘라 쓰고 데이터(constants/cities.js)는 그대로 둔다.
// 한계값(85.05)에 딱 붙이면 핀이 지도 맨 끝에 걸려, 배율을 맞출 때
// 지도 아래로 빈 회색 띠가 생긴다. 조금 안쪽으로 들여 찍는다.
const MERCATOR_LIMIT = 81
const toDrawable = (city) => ({
  lat: Math.max(-MERCATOR_LIMIT, Math.min(MERCATOR_LIMIT, city.lat)),
  lon: city.lon,
  clamped: Math.abs(city.lat) > MERCATOR_LIMIT,
})

// 화면에서 가까운 핀끼리 묶는다.
// 한국 7개 지점은 세계 지도 배율에서 7px 안에 전부 겹쳐 하나로만 보였다.
// 지도를 확대하면 자연히 흩어지므로, 매 배율마다 다시 계산한다.
// 겹침을 막으려면 '점'이 아니라 '라벨'끼리 안 닿아야 한다.
// 그런데 라벨 폭(약 90px)에 맞춰 반경을 키웠더니 헬싱키와 마라케시처럼
// 전혀 다른 곳까지 한 묶음이 됐다. 반경을 키우는 대신 라벨을 줄인다.
//
// 넓게 볼 때(zoom < 4)는 기온만("36°", 약 38px), 확대하면 이름까지("서울 36°").
// 라벨이 짧아지니 반경도 같이 줄일 수 있어 서로 다른 지점이 붙지 않는다.
const NAME_ZOOM = 4
const CLUSTER_RADIUS_PX = { compact: 44, full: 86 }

const isCompact = () => map.getZoom() < NAME_ZOOM
const clusterRadius = () => (isCompact() ? CLUSTER_RADIUS_PX.compact : CLUSTER_RADIUS_PX.full)

const groupByScreenDistance = (entries) => {
  const radius = clusterRadius()
  const groups = []
  for (const entry of entries) {
    const point = map.latLngToContainerPoint([entry.draw.lat, entry.draw.lon])
    const near = groups.find((group) => group.point.distanceTo(point) < radius)
    if (near) {
      near.members.push(entry)
    } else {
      groups.push({ point, members: [entry] })
    }
  }
  return groups
}

// 핀을 그린다. 기본 마커 이미지는 번들러에서 경로가 깨지기로 유명하므로
// divIcon(그냥 HTML)을 써서 이미지 자체를 쓰지 않는다.
const buildMarkers = () => {
  if (map === null) return
  if (markerLayer !== null) markerLayer.remove()
  markerLayer = L.layerGroup().addTo(map)

  const entries = TARGET_CITIES.filter((city) => cityTemps.value[city.id]).map((city) => ({
    city,
    found: cityTemps.value[city.id],
    draw: toDrawable(city),
  }))

  for (const group of groupByScreenDistance(entries)) {
    const first = group.members[0]

    // 한 곳뿐이면 지점 이름과 기온을 그대로 보여준다
    if (group.members.length === 1) {
      const tier = getTempTier(first.found.temp)
      const suffix = first.draw.clamped ? ' (극점 · 실제 위치는 더 남쪽)' : ''
      // 넓게 볼 때는 이름을 빼 라벨을 짧게 — 이름은 title 로 남으니 정보가 사라지진 않는다
      const label = isCompact()
        ? `<b>${toDisplayUnit(first.found.temp)}°</b>`
        : `${first.city.name} <b>${toDisplayUnit(first.found.temp)}°</b>`
      const icon = L.divIcon({
        className: 'temp-pin-wrap',
        html: `<span class="temp-pin tier-${tier.key}">${label}</span>`,
        // 폭이 내용마다 달라 0 으로 두고 CSS transform 으로 좌표 위에 가운데 맞춘다
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      L.marker([first.draw.lat, first.draw.lon], {
        icon,
        title: `${first.city.name} ${first.found.temp}℃${suffix}`,
      })
        .addTo(markerLayer)
        .on('click', () => router.push('/weather/' + first.city.id))
      continue
    }

    // 여러 곳이 겹치면 개수와 기온 범위로 묶어 보여준다.
    // 색은 그중 가장 더운 곳을 따른다 — 묶음에서 먼저 눈에 띄어야 할 값이다.
    const temps = group.members.map((member) => member.found.temp)
    const hottest = Math.max(...temps)
    const coldest = Math.min(...temps)
    const tier = getTempTier(hottest)
    const names = group.members.map((member) => member.city.name).join(', ')
    const icon = L.divIcon({
      className: 'temp-pin-wrap',
      html: `<span class="temp-pin is-group tier-${tier.key}">${group.members.length}곳 <b>${toDisplayUnit(coldest)}~${toDisplayUnit(hottest)}°</b></span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
    L.marker([first.draw.lat, first.draw.lon], { icon, title: `${names} — 확대하면 나뉩니다` })
      .addTo(markerLayer)
      // 묶음을 누르면 상세로 가지 않고 그 자리를 확대한다. 어느 지점인지 아직 모르므로.
      .on('click', () => map.setView([first.draw.lat, first.draw.lon], map.getZoom() + 3))
  }
}

// 지금 화면 밖에 있는 지점들.
// 모든 핀이 들어오도록 fitBounds 를 걸어 봤지만, 남극(−81°)과 중위도 도시를
// 한 화면에 담으려면 배율이 1까지 내려가 세계 지도가 캔버스보다 작아진다.
// 메르카토르에서 극점과 중위도를 함께 편히 보는 건 원래 안 되는 일이라,
// 억지로 맞추는 대신 "밖에 이런 지점이 있다"고 알려주고 눌러서 가게 한다.
const offscreen = ref([])

const updateOffscreen = () => {
  if (map === null) return
  const size = map.getSize()
  offscreen.value = TARGET_CITIES.filter((city) => cityTemps.value[city.id])
    .filter((city) => {
      const draw = toDrawable(city)
      const point = map.latLngToContainerPoint([draw.lat, draw.lon])
      // 핀이 가장자리에 반쯤 걸친 것도 '밖'으로 친다
      return point.x < 24 || point.y < 24 || point.x > size.x - 24 || point.y > size.y - 24
    })
    .map((city) => ({
      id: city.id,
      name: city.name,
      temp: toDisplayUnit(cityTemps.value[city.id].temp),
    }))
}

// 안내를 눌렀을 때 그 지점으로 이동한다
const flyToCity = (cityId) => {
  const city = TARGET_CITIES.find((item) => item.id === cityId)
  if (!city || map === null) return
  const draw = toDrawable(city)
  map.setView([draw.lat, draw.lon], Math.max(map.getZoom(), 4))
}

// 고른 레이어의 타일로 갈아 끼운다
const applyLayer = () => {
  if (map === null) return
  if (overlay !== null) overlay.remove()
  overlay = L.tileLayer(
    `https://tile.openweathermap.org/map/${activeLayer.value}/{z}/{x}/{y}.png?appid=${API_KEY}`,
    { opacity: 0.65 },
  ).addTo(map)
}

onMounted(async () => {
  // 좁은 화면에서 배율 2로 시작하면 세계 지도의 3분의 1만 보여서
  // 지점 대부분이 '화면 밖'으로 밀린다. 폭에 맞춰 한 단계 넓게 잡는다.
  const container = document.getElementById('weather-map')
  const startZoom = container !== null && container.clientWidth < 560 ? 1 : 2

  map = L.map('weather-map', {
    center: [30, 60],
    zoom: startZoom,
    // 세계 지도를 옆으로 무한히 반복시키지 않는다. 같은 도시가 여러 번 나오면 헷갈린다.
    worldCopyJump: false,
    minZoom: 1,
  })

  // 바탕 지도. OpenStreetMap 은 출처 표기가 이용 약관이라 attribution 을 지우지 말 것.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 18,
  }).addTo(map)

  applyLayer()
  await fetchTemps()
  buildMarkers()
  updateOffscreen()

  // 배율이 바뀌면 겹침 관계가 달라지므로 핀을 다시 묶는다.
  map.on('zoomend', buildMarkers)
  // 화면 밖 목록은 옆으로 밀기만 해도 달라지므로 moveend 로 받는다.
  // (moveend 는 확대·축소 뒤에도 함께 발생한다)
  map.on('moveend', updateOffscreen)
})

// 화면을 떠날 때 지도를 반드시 정리한다.
// 남겨두면 Leaflet 이 붙여 둔 이벤트가 그대로 남아 메모리를 잡는다.
onBeforeUnmount(() => {
  if (map !== null) {
    map.remove()
    map = null
  }
})

watch(activeLayer, applyLayer)
// 단위를 바꾸면 핀의 숫자도 따라 바뀌어야 한다
watch(() => configStore.unit, buildMarkers)
</script>

<template>
  <div class="map-view">
    <!-- 레이어 전환 + 상태 -->
    <div class="map-toolbar">
      <div class="layer-group" role="group" aria-label="지도에 겹칠 정보">
        <button
          v-for="layer in LAYERS"
          :key="layer.key"
          type="button"
          class="layer-btn"
          :class="{ 'is-on': layer.key === activeLayer }"
          :aria-pressed="layer.key === activeLayer"
          @click="activeLayer = layer.key"
        >
          {{ layer.label }}
        </button>
      </div>

      <p class="map-count">
        <template v-if="isLoading">기온을 불러오는 중…</template>
        <template v-else>{{ loadedCount }} / {{ TARGET_CITIES.length }} 지점</template>
      </p>
    </div>

    <p v-if="errorMessage !== ''" class="state-box error-text">{{ errorMessage }}</p>

    <!-- Leaflet 이 이 요소 안에 지도를 그린다. 높이가 0 이면 아무것도 안 보이므로
         CSS 에서 높이를 반드시 정해 줘야 한다. -->
    <div id="weather-map" class="map-canvas"></div>

    <!-- 화면 밖 지점 안내. 남극처럼 극단에 있는 지점은 배율을 아무리 맞춰도
         다른 지점과 한 화면에 편히 담기지 않는다. 숨기는 대신 여기로 꺼내 준다. -->
    <div v-if="offscreen.length > 0" class="offscreen-bar">
      <span class="offscreen-label">화면 밖</span>
      <button
        v-for="item in offscreen"
        :key="item.id"
        type="button"
        class="offscreen-btn"
        @click="flyToCity(item.id)"
      >
        {{ item.name }} {{ item.temp }}°
      </button>
    </div>

    <div class="map-legend">
      <span class="legend-label">핀 색 = 기온 단계</span>
      <span class="legend-scale" aria-hidden="true">
        <span class="tier-freezing"></span><span class="tier-cold"></span>
        <span class="tier-cool"></span><span class="tier-mild"></span>
        <span class="tier-hot"></span><span class="tier-scorching"></span>
      </span>
      <span class="legend-hint">핀을 누르면 그 지점의 상세로 이동합니다</span>
    </div>
  </div>
</template>

<style scoped>
.map-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

.map-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.layer-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.layer-btn {
  padding: 6px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-ink-mid);
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  cursor: pointer;
  transition:
    color var(--dash-ease),
    background-color var(--dash-ease),
    border-color var(--dash-ease);
}

.layer-btn:hover {
  border-color: var(--dash-accent);
  color: var(--dash-accent-deep);
}

.layer-btn.is-on {
  color: #ffffff;
  background-color: var(--dash-accent);
  border-color: var(--dash-accent);
}

.map-count {
  margin: 0 0 0 auto;
  font-size: 11.5px;
  color: var(--dash-ink-weak);
  font-variant-numeric: tabular-nums;
}

.map-canvas {
  height: 520px;
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  /* 둥근 모서리 밖으로 타일이 삐져나오지 않게 */
  overflow: hidden;
  box-shadow: var(--dash-shadow-sm);
  /* Leaflet 의 확대 버튼·출처 표기가 카드 위로 겹치지 않도록 기준면을 만든다 */
  position: relative;
  z-index: 0;
}

@media (max-width: 640px) {
  .map-canvas {
    height: 380px;
  }
}

/* 지도 밖(세계 지도의 위아래 끝 너머)은 타일이 없다.
   Leaflet 기본값은 회색이라 렌더링이 깨진 것처럼 보이므로 화면 톤에 맞춘다. */
.map-canvas :deep(.leaflet-container) {
  background-color: var(--dash-sunken);
  font-family: var(--dash-font);
}

/* 핀 — divIcon 은 Leaflet 이 만든 요소라 scoped 로 닿지 않는다.
   :deep() 으로 뚫어야 색이 적용된다. */
.map-canvas :deep(.temp-pin) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  font-family: var(--dash-font);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  color: #ffffff;
  /* tier-* 가 넣어준 단계색 */
  background-color: var(--t-solid);
  border-radius: var(--dash-r-pill);
  box-shadow: 0 1px 6px rgba(20, 28, 40, 0.35);
  /* iconAnchor 를 0,0 으로 뒀으므로 여기서 좌표 위로 가운데 정렬한다 */
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.map-canvas :deep(.temp-pin b) {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* 묶인 핀 — 흰 테두리를 둘러 낱개 핀과 구별한다 */
.map-canvas :deep(.temp-pin.is-group) {
  border: 2px solid rgba(255, 255, 255, 0.85);
  padding: 2px 9px;
}

/* 화면 밖 지점 안내 */
.offscreen-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 8px 12px;
  background-color: var(--dash-sunken);
  border: 1px dashed var(--dash-line);
  border-radius: var(--dash-r-md);
}

.offscreen-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--dash-ink-mid);
}

.offscreen-btn {
  padding: 3px 11px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--dash-accent-deep);
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-pill);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--dash-ease),
    background-color var(--dash-ease);
}

.offscreen-btn:hover {
  border-color: var(--dash-accent);
  background-color: var(--dash-accent-soft);
}

.map-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 0 2px;
  font-size: 11.5px;
  color: var(--dash-ink-weak);
}

.legend-label {
  font-weight: 700;
  color: var(--dash-ink-mid);
}

.legend-scale {
  display: flex;
  width: 120px;
  height: 6px;
  border-radius: var(--dash-r-pill);
  overflow: hidden;
}

.legend-scale span {
  flex: 1;
  background-color: var(--t-solid);
}

.legend-hint {
  margin-left: auto;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 10px;
  padding: 22px 16px;
  text-align: center;
  font-size: 13px;
  border-radius: var(--dash-r-lg);
}

.error-text {
  color: var(--dash-danger-fg);
  background-color: var(--dash-danger-bg);
  border: 1px solid var(--dash-danger-line);
}
</style>
