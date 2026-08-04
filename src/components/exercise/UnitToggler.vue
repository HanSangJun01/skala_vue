<script setup>
import { useConfigStore } from '@/stores/configStore'

// Store 인스턴스를 가동한다.
// configStore.xxx 형태로 점 접근하면 반응성이 그대로 유지된다.
const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">
      날씨단위: {{ configStore.unit === 'celsius' ? '섭씨' : '화씨' }}({{ configStore.unitSymbol }})
    </span>
    <button class="unit-btn" @click="configStore.toggleUnit">단위변경</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-label {
  font-size: 13px;
  color: #dfe6e9;
}

.unit-btn {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: bold;
  color: #2d3436;
  background-color: #dfe6e9;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.unit-btn:hover {
  background-color: #ffffff;
}
</style>
