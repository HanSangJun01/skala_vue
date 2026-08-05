// 조회할 지점 목록 — 홈·상세·지도 세 화면이 함께 쓰는 단 하나의 원본.
// 예전에는 화면마다 같은 배열을 복사해 두고 "둘을 같이 고칠 것"이라고 주석을 달았는데,
// 지도 화면이 늘면서 사본이 셋이 될 참이라 여기로 옮겼다. 지점을 고치려면 이 파일만 보면 된다.
//
// ⚠️ q=도시명 대신 좌표를 쓴다.
// OpenWeatherMap 의 도시 목록에는 같은 이름이 여러 개 있고, q= 는 그중
// 어느 것을 고를지 보장하지 않는다. 실제로 'Incheon,KR' 은 인천 도심이 아니라
// 서쪽 25km 바다 쪽 레코드를 집어 기온이 4도 낮게 나왔다.
export const TARGET_CITIES = [
  { id: 'kr-seoul', name: '서울', lat: 37.5667, lon: 126.9783 },
  { id: 'kr-busan', name: '부산', lat: 35.18, lon: 129.0752 },
  { id: 'kr-daegu', name: '대구', lat: 35.8713, lon: 128.6018 },
  { id: 'kr-incheon', name: '인천', lat: 37.456, lon: 126.7052 },
  { id: 'kr-gwangju', name: '광주', lat: 35.1595, lon: 126.8515 },
  { id: 'kr-daejeon', name: '대전', lat: 36.3497, lon: 127.3849 },
  { id: 'kr-jeju', name: '제주', lat: 33.4998, lon: 126.5314 },

  { id: 'fi-helsinki', name: '헬싱키', lat: 60.1675, lon: 24.9427 },

  // 사막 가장자리라 낮과 밤의 기온 차가 크다. 실제 예보에서도
  // 하루 안에서 16℃ 안팎이 벌어져, 카드의 최저~최고 띠가 가장 길게 그려진다.
  { id: 'ma-marrakesh', name: '마라케시', lat: 31.6295, lon: -7.9811 },

  // 남극점. 경도는 어느 값을 넣어도 같은 지점이라 0 으로 둔다.
  // 도시가 아니라 좌표라서 q=도시명 방식으로는 아예 조회할 수 없다.
  { id: 'aq-south-pole', name: '남극', lat: -90, lon: 0 },
]

// 주소의 cityId 로 지점을 찾는다. 등록되지 않은 코드면 null.
export function findCityById(cityId) {
  return TARGET_CITIES.find((city) => city.id === cityId) ?? null
}
