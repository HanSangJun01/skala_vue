<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

// 도시 객체 하나를 전달받아 표시하고(props),
// 카드 선택(select-card)과 상세보기(click-detail)를 부모에게 올려보낸다(emits)
const props = defineProps({
  cityItem: { type: Object, required: true },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

// 화면에 보여줄 기온. 원본 데이터는 항상 섭씨 숫자다.
const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})
</script>

<template>
  <li class="weather-card" @click="emit('select-card', cityItem)">
    <h3 class="city-name">{{ cityItem.name }}</h3>
    <p class="city-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>
    <p class="city-status">{{ cityItem.status }}</p>

    <!-- 25도 기준 라벨 분기.
         판정은 화씨 변환값이 아니라 원본 섭씨(cityItem.temp)로 해야 한다. -->

    <p v-if="cityItem.temp >= 25" class="temp-label hot">🔥 더움 (25도 이상)</p>
    <p v-else class="temp-label cool">❄️ 선선함 (25도 미만)</p>

    <!-- .stop 으로 위쪽 li 의 @click 까지 번지지 않게 한다 -->
    <button class="detail-btn" @click.stop="emit('click-detail', cityItem)">상세보기</button>
  </li>
</template>

<style scoped>
.weather-card {
  position: relative;
  padding: 14px 16px;
  background-color: #ffffff;
  border: 1px solid #dfe6e9;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.weather-card:hover {
  border-color: #42b983;
}

.city-name {
  font-size: 17px;
  font-weight: bold;
  margin: 0 0 6px;
}

.city-temp {
  font-size: 26px;
  font-weight: bold;
  margin: 0 0 2px;
  color: #0984e3;
}

.city-status {
  margin: 0 0 8px;
  font-size: 14px;
  color: #636e72;
}

/* 25도 기준 라벨 */
.temp-label {
  display: inline-block;
  margin: 0;
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

/* 상세보기 버튼 */
.detail-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: auto;
  padding: 7px 11px;
  font-size: 13px;
  font-weight: bold;
  color: #010101;
  background-color: #d2d0d0;
  border: 1px solid #020202;
  cursor: pointer;
}

.detail-btn:hover {
  background-color: #35a06f;
}
</style>
