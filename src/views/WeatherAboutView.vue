<script setup>
import { useRouter } from 'vue-router'
// 단계 기준을 글로 다시 적으면 utils 를 고칠 때마다 이 페이지가 거짓말을 하게 된다.
// 화면이 쓰는 값을 그대로 가져와 표를 그린다.
import { TEMP_TIERS, SCALE_MIN, SCALE_MAX } from '@/utils/temperature'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="about-view">
    <h1 class="about-title">서비스 소개</h1>

    <div class="about-box">
      <p class="about-lead">
        전 세계 10개 지점의 5일 예보를 한 화면에 놓고 서로 견주어 보는 대시보드입니다.
        Vue 3 를 익히려고 만든 학습용 프로젝트이지만, 화면에 나오는 숫자는 모두
        OpenWeatherMap 에서 받아온 실제 예보입니다.
      </p>

      <p class="about-note">
        서울부터 남극까지 기온 폭이 80℃ 가까이 벌어지는 지점들을 일부러 섞었습니다.
        한 자 위에 함께 올려놓았을 때 무엇이 보이는지가 이 화면의 관심사입니다.
      </p>
    </div>

    <div class="about-box">
      <h2 class="about-head">무엇을 보여주나</h2>
      <dl class="about-facts">
        <div class="fact">
          <dt>데이터</dt>
          <dd>
            OpenWeatherMap <span class="about-mark">5 day / 3 hour forecast</span> —
            한 지점당 3시간 간격 40개, 약 5일치가 옵니다.
          </dd>
        </div>
        <div class="fact">
          <dt>지점</dt>
          <dd>
            국내 7곳(서울·부산·대구·인천·광주·대전·제주)과 해외 3곳(헬싱키·마라케시·남극).
            도시명 대신 위도·경도로 조회합니다 — 같은 이름의 도시가 여럿이라
            <span class="about-mark">q=Incheon,KR</span> 이 인천 도심이 아닌 서해 지점을 집어
            기온이 4℃ 낮게 나온 적이 있습니다.
          </dd>
        </div>
        <div class="fact">
          <dt>대기질</dt>
          <dd>
            <span class="about-mark">air_pollution/forecast</span> — 1시간 간격으로 약 5일치.
            AQI 1~5 등급과 초미세먼지·미세먼지·오존·이산화질소 농도가 옵니다.
            날씨보다 예보 기간이 짧아서 마지막 날은 표시되지 않습니다.
          </dd>
        </div>
        <div class="fact">
          <dt>지도</dt>
          <dd>
            바탕은 OpenStreetMap, 그 위에 OpenWeatherMap 의 기온·강수·구름·바람 타일을 겹칩니다.
            목록으로는 볼 수 없는 것 — 비구름이 <strong>어디서 어디로 오는 중인지</strong>가 보입니다.
          </dd>
        </div>
        <div class="fact">
          <dt>호출</dt>
          <dd>
            10개 지점을 <span class="about-mark">axios.all</span> 로 한 번에 요청합니다.
            하나씩 기다리지 않으므로 지점을 늘려도 대기 시간이 그만큼 늘지 않습니다.
            대기질은 <span class="about-mark">Promise.allSettled</span> 로 따로 받습니다 —
            한 묶음에 넣으면 대기질이 실패할 때 멀쩡한 날씨까지 같이 사라지기 때문입니다.
          </dd>
        </div>
        <div class="fact">
          <dt>하루치 요약</dt>
          <dd>
            3시간 간격 값을 날짜별로 묶은 뒤, <strong>정오에 가장 가까운 시점</strong>을 그날의
            대표로 씁니다. 새벽 값이 대표가 되면 그날 날씨를 잘못 전하게 됩니다.
            최저·최고는 그날 전체에서 뽑습니다.
          </dd>
        </div>
      </dl>
    </div>

    <div class="about-box">
      <h2 class="about-head">화면 읽는 법</h2>
      <ul class="about-list">
        <li>
          <strong>기온 눈금은 모든 카드가 공유합니다.</strong>
          왼쪽 끝이 {{ SCALE_MIN }}℃, 오른쪽 끝이 {{ SCALE_MAX }}℃ 로 카드마다 같습니다.
          그래서 점의 위치만으로 지점끼리 비교됩니다. 옅은 띠는 그날의 최저~최고 구간이라,
          띠가 길수록 일교차가 큰 곳입니다.
        </li>
        <li>
          <strong>날짜는 예보가 있는 날만 고를 수 있습니다.</strong>
          한 달 달력을 그리면 고를 수 없는 날이 대부분이라, 받아온 날짜만 가로로 늘어놓았습니다.
        </li>
        <li>
          <strong>상세 페이지의 꺾은선은 그날의 3시간 간격 원본입니다.</strong>
          목록에서 하루 한 개로 줄이며 버려지던 값을 그대로 그린 것이라 추가 통신이 없습니다.
          날짜를 바꿔도 이미 받아둔 자료 안에서 갈아 끼우기만 합니다.
        </li>
        <li>
          <strong>강수확률과 대기질은 그날의 최댓값입니다.</strong>
          평균을 내면 잠깐 쏟아지는 소나기와 저녁 두 시간의 매우 나쁜 공기가 묻힙니다.
          "오늘 비 오나", "오늘 나가도 되나"에 답하려면 최악이 기준이라야 합니다.
        </li>
        <li>
          <strong>대기질은 색이 아니라 모양으로 구분합니다.</strong>
          기온도 색을 쓰기 때문에 둘 다 색으로만 알리면 섞입니다. 기온은 큰 숫자와 눈금 위의
          동그란 점이, 대기질은 네모 스와치가 붙은 알약이 맡습니다.
        </li>
        <li>
          <strong>지도에서 가까운 지점은 하나로 묶입니다.</strong>
          세계 지도 배율에서 국내 7곳은 7픽셀 안에 겹쳐 한 개로만 보였습니다.
          확대하면 나뉘고, 묶음을 누르면 그 자리를 확대합니다.
        </li>
        <li>
          <strong>남극은 지도에 그릴 수 없는 위치입니다.</strong>
          웹 메르카토르는 극점에서 무한히 늘어나 위도 ±85 까지만 그립니다.
          그래서 남극 핀은 조금 안쪽에 찍히고, 화면 밖으로 나가면 지도 아래 안내로 꺼내 줍니다.
        </li>
        <li>
          <strong>단위 변경은 보이는 숫자만 바꿉니다.</strong>
          단계 판정과 눈금 위치는 언제나 원본 섭씨로 계산합니다. 화씨로 판정하면 모든 지점이
          폭염이 되어 버립니다.
        </li>
      </ul>
    </div>

    <div class="about-box">
      <h2 class="about-head">기온 6단계</h2>
      <p class="about-sub">
        카드의 숫자 색과 상세 페이지의 배경색이 이 표를 따릅니다.
        기준은 <span class="about-mark">utils/temperature.js</span> 한 곳에만 적혀 있습니다.
      </p>

      <ul class="tier-list">
        <li v-for="tier in TEMP_TIERS" :key="tier.key" class="tier-row" :class="`tier-${tier.key}`">
          <span class="tier-chip"></span>
          <span class="tier-name">{{ tier.label }}</span>
          <span class="tier-range">{{ tier.rangeText }}</span>
        </li>
      </ul>
    </div>

    <div class="about-box">
      <h2 class="about-head">만들면서 쓴 것</h2>
      <ul class="about-list">
        <li>
          <span class="about-mark">Composition API</span> — 상태는
          <span class="about-mark">ref</span>, 파생값은 <span class="about-mark">computed</span>.
          카드 목록은 날짜·검색어·정렬에서 계산되므로 따로 들고 있지 않습니다.
        </li>
        <li>
          <span class="about-mark">Vue Router</span> — 목록과 상세를 주소로 나눕니다.
          <span class="about-mark">/weather/:cityId?date=</span> 로 어느 지점의 어느 날인지가
          주소에 남아, 그대로 공유하면 같은 화면이 열립니다.
        </li>
        <li>
          <span class="about-mark">Pinia</span> — 온도 단위처럼 화면을 가로지르는 값만 담습니다.
          나머지는 각 화면이 스스로 들고 있습니다.
        </li>
        <li>
          <span class="about-mark">props / emits</span> — 자식은 받은 것을 그리기만 하고
          상태를 바꾸지 않습니다. 날짜 스트립이 고른 날을 직접 기억하지 않는 것도 같은 이유로,
          카드 목록이 같은 날짜를 봐야 하기 때문입니다.
        </li>
        <li>
          <span class="about-mark">Element Plus</span> — 드롭다운과 로딩 자리표시자에 씁니다.
          기본 테마 대신 <span class="about-mark">--el-*</span> 변수를 이 화면의 색으로 바꿔 끼웠습니다.
        </li>
        <li>
          <span class="about-mark">Leaflet</span> — 지도. Vue 의 반응형 시스템으로 감싸지 않고
          일반 변수로 들고 있습니다. <span class="about-mark">ref()</span> 로 감싸면 Vue 가
          지도 내부를 통째로 프록시로 만들어 느려지고 오작동합니다.
        </li>
        <li>
          날씨 그림은 이미지가 아니라 <span class="about-mark">SVG</span> 컴포넌트입니다.
          이모지는 기기마다 모양이 달라 화면 전체에서 쓰지 않습니다.
        </li>
      </ul>
    </div>

    <div class="about-box">
      <h2 class="about-head">알아둘 점</h2>
      <ul class="about-list about-caveat">
        <li>
          <strong>실황이 아니라 예보입니다.</strong> 지금 창밖 날씨와 다를 수 있습니다.
        </li>
        <li>
          <strong>오늘은 남은 시간대만 옵니다.</strong> 늦은 오후에 열면 그래프의 점이
          두세 개뿐일 수 있습니다. 빠진 것이 아니라 지나간 시간이라 오지 않는 것입니다.
        </li>
        <li>
          <strong>고른 단위는 저장되지 않습니다.</strong> 새로고침하면 섭씨로 돌아갑니다.
        </li>
        <li>
          <strong>남극은 도시가 아니라 좌표입니다.</strong> 관측소가 아닌 남극점(90°S)이라
          응답에 지명이 비어 있고, 값은 예보 모델이 계산한 것입니다.
        </li>
      </ul>
    </div>

    <el-button class="home-btn" round @click="goHome">← 메인 대시보드로 돌아가기</el-button>
  </div>
</template>

<style scoped>
.about-view {
  max-width: var(--dash-width);
  margin: 0 auto;
  padding: 18px 0 32px;
  color: var(--dash-ink);
}

.about-title {
  margin: 0 0 12px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.about-box {
  margin-bottom: 10px;
  padding: 18px 20px;
  background-color: var(--dash-surface);
  border: 1px solid var(--dash-line);
  border-radius: var(--dash-r-xl);
  box-shadow: var(--dash-shadow-sm);
  animation: dash-rise var(--dash-ease-out) backwards;
}

/* 상자마다 조금씩 늦게 떠오르게 한다 */
.about-box:nth-child(3) {
  animation-delay: 50ms;
}

.about-box:nth-child(4) {
  animation-delay: 100ms;
}

.about-box:nth-child(5) {
  animation-delay: 150ms;
}

.about-lead {
  margin: 0;
  font-size: 15px;
  line-height: 1.75;
}

.about-note {
  margin: 12px 0 0;
  padding-top: 12px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--dash-ink-mid);
  border-top: 1px solid var(--dash-line-soft);
}

.about-head {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--dash-ink-mid);
  display: flex;
  align-items: center;
  gap: 9px;
}

/* 제목 앞의 작은 막대 — BaseDashboardCard 와 같은 표시 */
.about-head::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: var(--dash-r-pill);
  background-color: var(--dash-accent);
}

.about-sub {
  margin: -4px 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dash-ink-mid);
}

/* ---- 항목 목록 ---- */
.about-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--dash-ink-mid);
}

.about-list li::marker {
  color: var(--dash-accent);
}

.about-list li + li {
  margin-top: 9px;
}

.about-list strong {
  font-weight: 700;
  color: var(--dash-ink);
}

/* 주의사항은 점 색을 빼서 조용하게 둔다 */
.about-caveat li::marker {
  color: var(--dash-ink-weak);
}

/* ---- 사실 목록 (용어 + 설명) ---- */
.about-facts {
  margin: 0;
}

.fact {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 14px;
  padding: 9px 0;
  border-top: 1px solid var(--dash-line-soft);
}

.fact:first-child {
  border-top: 0;
  padding-top: 0;
}

.fact dt {
  font-size: 12px;
  font-weight: 700;
  color: var(--dash-ink);
  padding-top: 2px;
}

.fact dd {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--dash-ink-mid);
}

.fact dd strong {
  font-weight: 700;
  color: var(--dash-ink);
}

/* 좁은 화면에서는 용어를 위로 올린다 */
@media (max-width: 560px) {
  .fact {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}

/* ---- 기온 단계 표 ---- */
.tier-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

@media (max-width: 560px) {
  .tier-list {
    grid-template-columns: 1fr;
  }
}

.tier-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  background-color: var(--dash-sunken);
  border-radius: var(--dash-r-sm);
}

/* 단계색 — tier-* 가 넣어준 --t-solid */
.tier-chip {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: var(--t-solid);
  flex-shrink: 0;
}

.tier-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dash-ink);
}

.tier-range {
  margin-left: auto;
  font-size: 12px;
  color: var(--dash-ink-weak);
  font-variant-numeric: tabular-nums;
}

/* 코드·경로 표기 */
.about-mark {
  padding: 1px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--dash-accent-deep);
  background-color: var(--dash-accent-soft);
  border-radius: 5px;
  white-space: nowrap;
}

/* 홈 버튼. el-button 은 색을 --el-button-* 변수로 읽는다 */
.home-btn {
  --el-button-bg-color: var(--dash-surface);
  --el-button-border-color: var(--dash-line);
  --el-button-text-color: var(--dash-ink-mid);
  --el-button-hover-bg-color: var(--dash-accent);
  --el-button-hover-border-color: var(--dash-accent);
  --el-button-hover-text-color: #ffffff;
  --el-button-active-bg-color: var(--dash-accent-deep);
  --el-button-active-border-color: var(--dash-accent-deep);
  --el-button-active-text-color: #ffffff;
  --el-button-font-weight: 700;
}
</style>
