<script setup>
import { computed } from 'vue'

// API 의 아이콘 코드('숫자 두 자리 + d/n')를 SVG 그림으로 바꾼다.
// 예) 01d = 맑음(낮), 04n = 온흐림(밤)
// 이미지 파일 대신 SVG 라서 네트워크 요청이 없고 currentColor 를 따라간다.
const props = defineProps({
  code: { type: String, default: '' },
})

// 앞 두 자리 = 날씨 종류, 끝 글자 = 낮(d)/밤(n)
const kind = computed(() => props.code.slice(0, 2))
const isNight = computed(() => props.code.endsWith('n'))

// 대체 텍스트용 이름
const LABELS = {
  '01': '맑음',
  '02': '구름 조금',
  '03': '구름',
  '04': '흐림',
  '09': '소나기',
  10: '비',
  11: '뇌우',
  13: '눈',
  50: '안개',
}

const label = computed(() => LABELS[kind.value] ?? '날씨')
</script>

<template>
  <!-- 그림만 보이는 자리를 대비해 title 로 이름을 남긴다 -->
  <svg
    class="weather-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="label"
  >
    <title>{{ label }}</title>

    <!-- 01 맑음 — 낮은 해, 밤은 초승달 -->
    <template v-if="kind === '01'">
      <template v-if="isNight">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </template>
    </template>

    <!-- 02 구름 조금 — 해/달이 구름 뒤에 살짝 보인다 -->
    <template v-else-if="kind === '02'">
      <template v-if="isNight">
        <path d="M18.5 8.5a4.5 4.5 0 0 1-5.9-5.9 5 5 0 1 0 5.9 5.9Z" />
      </template>
      <template v-else>
        <path d="M12 2v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="M20 12h2" />
        <path d="m19.07 4.93-1.41 1.41" />
        <path d="M15.95 12.65a4 4 0 0 0-5.93-4.13" />
      </template>
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </template>

    <!-- 03 구름 — 구름 한 덩이 -->
    <template v-else-if="kind === '03'">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </template>

    <!-- 04 흐림 — 구름 두 덩이 -->
    <template v-else-if="kind === '04'">
      <path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M22 10a3 3 0 0 0-3-3h-2.2a5.5 5.5 0 0 0-10.7.5" />
    </template>

    <!-- 09 소나기 / 10 비 — 구름 아래로 빗줄기 -->
    <template v-else-if="kind === '09' || kind === '10'">
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M16 14v6" />
      <path d="M8 14v6" />
      <path d="M12 16v6" />
    </template>

    <!-- 11 뇌우 — 구름 아래 번개 -->
    <template v-else-if="kind === '11'">
      <path d="M6 16.33A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97" />
      <path d="m13 12-3 5h4l-3 5" />
    </template>

    <!-- 13 눈 — 구름 아래 눈송이 -->
    <template v-else-if="kind === '13'">
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M8 15h.01" />
      <path d="M8 19h.01" />
      <path d="M12 17h.01" />
      <path d="M12 21h.01" />
      <path d="M16 15h.01" />
      <path d="M16 19h.01" />
    </template>

    <!-- 50 안개 — 구름 아래 가로줄 -->
    <template v-else-if="kind === '50'">
      <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />
      <path d="M16 17H7" />
      <path d="M17 21H9" />
    </template>

    <!-- 모르는 코드는 구름으로 대신한다 -->
    <template v-else>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </template>
  </svg>
</template>

<style scoped>
/* 기본 크기 1.15em. :where() 로 우선순위를 0으로 만들어
   쓰는 쪽에서 width 만 적어도 덮어쓸 수 있게 한다. */
:where(.weather-icon) {
  width: 1.15em;
  height: 1.15em;
}

.weather-icon {
  flex-shrink: 0; /* flex 안에서 찌그러지지 않게 */
}
</style>
