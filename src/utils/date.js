// 날짜를 다루는 공용 함수. DateStrip 과 두 View 가 같이 쓴다.

// Date → '2026-08-05'
// 브라우저가 있는 시간대 기준으로 자른다. UTC 로 자르면 도시마다 날짜 경계가 어긋나 달력과 안 맞는다.
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// '2026-08-05' → '8월 5일 (화)'
export function formatDateLabel(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${m}월 ${d}일 (${WEEKDAYS[date.getDay()]})`
}

// '2026-08-05' → Date
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// '2026-08-05' → '8/5'. 날짜 스트립처럼 폭이 좁은 자리에 쓴다.
export function formatShortDate(key) {
  const [, m, d] = key.split('-').map(Number)
  return `${m}/${d}`
}

// '2026-08-05' → '수'
export function getWeekdayLabel(key) {
  return WEEKDAYS[fromDateKey(key).getDay()]
}
