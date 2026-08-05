// 조회할 지점 목록 — 홈·상세·지도가 함께 쓰는 단 하나의 원본.
//
// ⚠️ q=도시명 대신 좌표를 쓴다. 같은 이름의 도시가 여럿이라 q= 는 어느 것을 고를지
// 보장하지 않는다. 'Incheon,KR' 이 서해 지점을 집어 기온이 4℃ 낮게 나온 적이 있다.
export const TARGET_CITIES = [
  { id: 'kr-seoul', name: '서울', lat: 37.5667, lon: 126.9783 },
  { id: 'kr-busan', name: '부산', lat: 35.18, lon: 129.0752 },
  { id: 'kr-daegu', name: '대구', lat: 35.8713, lon: 128.6018 },
  { id: 'kr-incheon', name: '인천', lat: 37.456, lon: 126.7052 },
  { id: 'kr-gwangju', name: '광주', lat: 35.1595, lon: 126.8515 },
  { id: 'kr-daejeon', name: '대전', lat: 36.3497, lon: 127.3849 },
  { id: 'kr-jeju', name: '제주', lat: 33.4998, lon: 126.5314 },

  { id: 'fi-helsinki', name: '헬싱키', lat: 60.1675, lon: 24.9427 },

  // 사막 가장자리라 일교차가 크다(하루 16℃ 안팎)
  { id: 'ma-marrakesh', name: '마라케시', lat: 31.6295, lon: -7.9811 },

  // 남극점. 경도는 어느 값이든 같은 지점이라 0.
  { id: 'aq-south-pole', name: '남극', lat: -90, lon: 0 },
]

// 주소의 cityId 로 지점을 찾는다. 등록되지 않은 코드면 null.
export function findCityById(cityId) {
  return TARGET_CITIES.find((city) => city.id === cityId) ?? null
}
