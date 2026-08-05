<script setup>
import { useConfigStore } from '@/stores/configStore'

// configStore.xxx 로 점 접근하면 반응성이 유지된다
const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">
      날씨단위: {{ configStore.unit === 'celsius' ? '섭씨' : '화씨' }}({{ configStore.unitSymbol }})
    </span>
    <el-button class="unit-btn" size="small" round @click="configStore.toggleUnit"
      >단위변경</el-button
    >
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
  /* 어두운 네비 바 위라 반투명 흰색 */
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
}

/* 단위 전환 버튼 — 어두운 네비 바 위 */
.unit-btn {
  --el-button-bg-color: rgba(255, 255, 255, 0.12);
  --el-button-border-color: rgba(255, 255, 255, 0.18);
  --el-button-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.22);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.32);
  --el-button-hover-text-color: #ffffff;
  --el-button-active-bg-color: rgba(255, 255, 255, 0.28);
  --el-button-active-border-color: rgba(255, 255, 255, 0.36);
  --el-button-active-text-color: #ffffff;
  --el-button-font-weight: 700;
}
</style>
