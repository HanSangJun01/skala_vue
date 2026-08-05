// 대기질 공용 함수. AQI 는 1~5 정수로 온다.

// ⚠️ 기온 단계색과 색이 비슷해질 수 있다.
// 화면에서는 색만 쓰지 말고 네모 스와치 + 글자 라벨을 함께 둘 것.
export const AQI_GRADES = [
  { aqi: 1, label: '좋음', color: '#3f9e6a' },
  { aqi: 2, label: '보통', color: '#7aa83a' },
  { aqi: 3, label: '민감군 주의', color: '#d3a029' },
  { aqi: 4, label: '나쁨', color: '#d9713a' },
  { aqi: 5, label: '매우 나쁨', color: '#b83c46' },
]

// AQI 정수 → 등급 객체. 범위 밖이면 null.
export function getAqiGrade(aqi) {
  return AQI_GRADES.find((grade) => grade.aqi === aqi) ?? null
}

// cap = 막대가 가득 차는 농도(㎍/㎥). 환경부 '매우 나쁨' 시작값 언저리.
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

// 시간별 목록 → 날짜별 요약.
// 대표값은 그날의 '가장 나쁜 시각'. 평균을 내면 저녁 두 시간의 매우 나쁜 공기가 묻힌다.
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
      // 농도도 같은 시각의 값. 등급과 숫자의 시점이 어긋나면 안 된다.
      components: worst.components,
      hourCount: items.length,
    }
  }
  return result
}
