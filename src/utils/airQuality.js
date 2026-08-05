// 대기질을 다루는 공용 함수.
// OpenWeatherMap 의 Air Pollution API 는 AQI 를 1~5 정수로 준다.
// 기온(utils/temperature.js)과 완전히 다른 축이므로 파일을 나눠 둔다.

// ⚠️ 색은 기온 단계색(--dash-*-solid)과 일부러 다른 계열을 쓴다.
// 다만 '나쁨'(주황)과 '더움'(주황)처럼 눈으로는 가까운 색이 생기므로,
// 화면에서는 반드시 네모 스와치 + 글자 라벨을 같이 둬서 형태로 구분한다.
// 색만으로 두 축을 가르려 하면 읽는 사람이 헷갈린다.
export const AQI_GRADES = [
  { aqi: 1, label: '좋음', color: '#3f9e6a' },
  { aqi: 2, label: '보통', color: '#7aa83a' },
  { aqi: 3, label: '민감군 주의', color: '#d3a029' },
  { aqi: 4, label: '나쁨', color: '#d9713a' },
  { aqi: 5, label: '매우 나쁨', color: '#b83c46' },
]

// AQI 정수 → 등급 객체. 범위 밖이면 null 이라 화면에서 숨길 수 있다.
export function getAqiGrade(aqi) {
  return AQI_GRADES.find((grade) => grade.aqi === aqi) ?? null
}

// 상세 화면의 막대에 쓸 항목들.
// cap 은 막대를 가득 채우는 기준치(㎍/㎥). 실제 농도가 이보다 높으면 100% 로 자른다.
// 환경부 '매우 나쁨' 시작값 언저리를 기준으로 잡아, 막대가 가득 차면 실제로 나쁜 상태다.
export const POLLUTANTS = [
  { key: 'pm2_5', label: '초미세 PM2.5', cap: 75 },
  { key: 'pm10', label: '미세 PM10', cap: 150 },
  { key: 'o3', label: '오존 O₃', cap: 150 },
  { key: 'no2', label: '이산화질소 NO₂', cap: 200 },
]

// 농도 → 막대 채움 비율(0~100)
export function getPollutantPercent(value, cap) {
  if (typeof value !== 'number') return 0
  return Math.min(100, Math.max(0, Math.round((value / cap) * 100)))
}

// 시간별 목록을 날짜별로 묶어 하루치 요약으로 만든다.
// 대표값은 그날의 '가장 나쁜 시각'이다 — 강수확률과 같은 이유로,
// "오늘 나가도 되나"에 답하려면 평균보다 최악이 맞다.
// 하루 종일 좋다가 저녁 두 시간만 매우 나쁜 날을 '보통'이라 부르면 안 된다.
export function summarizeAirByDate(list, toDateKey) {
  const buckets = {}
  for (const item of list) {
    const key = toDateKey(new Date(item.dt * 1000))
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(item)
  }

  const result = {}
  for (const [key, items] of Object.entries(buckets)) {
    let worst = items[0]
    for (const item of items) {
      if (item.main.aqi > worst.main.aqi) worst = item
    }
    result[key] = {
      aqi: worst.main.aqi,
      // 농도도 가장 나빴던 그 시각의 값을 쓴다. 등급과 숫자가 같은 시점이라야
      // '나쁨인데 PM2.5 가 낮다' 같은 어긋남이 생기지 않는다.
      components: worst.components,
      hourCount: items.length,
    }
  }
  return result
}
