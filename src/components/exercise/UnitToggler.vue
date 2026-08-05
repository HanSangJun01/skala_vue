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
  font-size: 12px;
  /* 어두운 네비게이션 바 위에 올라가므로 흰색 계열을 반투명하게 쓴다 */
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
}

.unit-btn {
  padding: 6px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--dash-r-pill);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--dash-ease),
    border-color var(--dash-ease);
}

.unit-btn:hover {
  background-color: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.32);
}
</style>
