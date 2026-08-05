// 기온을 6단계로 나누는 공용 판정 함수.
// WeatherCard 와 WeatherDetailView 가 같이 쓴다.
// ⚠️ 반드시 원본 섭씨를 넣을 것. 화씨를 넣으면 전부 폭염이 된다.

// 높은 기온부터 정렬. 위에서부터 훑어 처음 걸리는 단계가 답이다.
export const TEMP_TIERS = [
  { key: 'scorching', min: 30, emoji: '🔥', label: '폭염', rangeText: '30℃ 이상' },
  { key: 'hot', min: 25, emoji: '☀️', label: '더움', rangeText: '25~29℃' },
  { key: 'mild', min: 15, emoji: '🌤', label: '온화', rangeText: '15~24℃' },
  { key: 'cool', min: 5, emoji: '🍃', label: '선선함', rangeText: '5~14℃' },
  { key: 'cold', min: -5, emoji: '❄️', label: '추움', rangeText: '-5~4℃' },
  // -Infinity 라서 어떤 값이든 반드시 걸린다
  { key: 'freezing', min: -Infinity, emoji: '🥶', label: '혹한', rangeText: '-5℃ 미만' },
]

// 섭씨 기온 → 단계 객체
export function getTempTier(celsius) {
  for (const tier of TEMP_TIERS) {
    if (celsius >= tier.min) {
      return tier
    }
  }
  return TEMP_TIERS[TEMP_TIERS.length - 1]
}

// 눈금 막대가 다루는 범위
export const SCALE_MIN = -20
export const SCALE_MAX = 40

// 섭씨 기온 → 막대 채움 비율(0~100). 범위 밖은 잘라낸다.
export function getTempPercent(celsius) {
  const ratio = ((celsius - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100
  return Math.min(100, Math.max(0, Math.round(ratio)))
}
