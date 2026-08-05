// ============================================================
// 기온을 6단계로 나누는 공용 판정 함수
// ------------------------------------------------------------
// 전에는 "25도 이상이면 더움" 하나로만 갈랐다. 기준이 하나뿐이라
// 12도와 -1도가 똑같이 "선선함"으로 묶이는 문제가 있었다.
//
// 이 함수는 WeatherCard 와 WeatherDetailView 두 곳에서 쓴다.
// 판정 기준을 한곳에 두어야 두 화면이 서로 다른 단계를 보여주는 일이 없다.
//
// ⚠️ 판정은 반드시 원본 섭씨로 한다.
//    화씨로 바꾼 값(예: 77℉)을 넣으면 전부 폭염으로 판정된다.
// ============================================================

// min 은 "이 값 이상"을 뜻한다. 위에서부터 훑어 처음 걸리는 단계가 답이다.
// 따라서 배열은 반드시 높은 기온부터 낮은 기온 순으로 둬야 한다.
export const TEMP_TIERS = [
  { key: 'scorching', min: 30, emoji: '🔥', label: '폭염', rangeText: '30℃ 이상' },
  { key: 'hot', min: 25, emoji: '☀️', label: '더움', rangeText: '25~29℃' },
  { key: 'mild', min: 15, emoji: '🌤', label: '온화', rangeText: '15~24℃' },
  { key: 'cool', min: 5, emoji: '🍃', label: '선선함', rangeText: '5~14℃' },
  { key: 'cold', min: -5, emoji: '❄️', label: '추움', rangeText: '-5~4℃' },
  // 마지막 단계는 아래로 열려 있다. -Infinity 라서 어떤 값이든 반드시 걸린다.
  { key: 'freezing', min: -Infinity, emoji: '🥶', label: '혹한', rangeText: '-5℃ 미만' },
]

/**
 * 섭씨 기온을 받아 해당하는 단계 객체를 돌려준다.
 * @param {number} celsius 원본 섭씨 기온
 * @returns {{key: string, emoji: string, label: string, rangeText: string}}
 */
export function getTempTier(celsius) {
  for (const tier of TEMP_TIERS) {
    if (celsius >= tier.min) {
      return tier
    }
  }
  // 위 반복문에서 반드시 하나가 걸리지만, 만에 하나를 대비해 마지막 단계를 돌려준다
  return TEMP_TIERS[TEMP_TIERS.length - 1]
}

// 기온 눈금이 다루는 범위. 지구에서 사람이 사는 곳은 대체로 이 안에 들어온다.
export const SCALE_MIN = -20
export const SCALE_MAX = 40

/**
 * 기온을 눈금 막대의 채움 비율(0~100)로 바꾼다.
 * 범위를 벗어나는 값은 0 또는 100 으로 잘라내(clamp) 막대가 삐져나가지 않게 한다.
 * @param {number} celsius 원본 섭씨 기온
 * @returns {number} 0 이상 100 이하의 숫자
 */
export function getTempPercent(celsius) {
  const ratio = ((celsius - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100
  return Math.min(100, Math.max(0, Math.round(ratio)))
}
