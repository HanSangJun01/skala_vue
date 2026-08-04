<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="about-view">
    <h1 class="about-title">ℹ️ 서비스 소개</h1>

    <div class="about-box">
      <p class="about-lead">이 서비스는 Vue 3 학습용으로 만든 날씨 대시보드입니다.</p>

      <ul class="about-list">
        <li><mark style="color: red">components/exercise/</mark> 폴더 내부의 독립 부품 연동</li>
        <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
        <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
      </ul>
    </div>

    <button class="home-btn" @click="goHome">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.about-view {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 14px 32px;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  color: #2d3436;
}

.about-title {
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 18px;
}

.about-lead {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
}

.about-box {
  margin-bottom: 20px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.7;
  background-color: #f1f4f6;
  border: 1px solid #dfe6e9;
  border-radius: 10px;
}

.about-list {
  margin: 0;
  padding-left: 20px;
}

.about-list li {
  margin-bottom: 8px;
}

.about-list li:last-child {
  margin-bottom: 0;
}

.home-btn {
  padding: 9px 14px;
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
  background-color: #42b983;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.home-btn:hover {
  background-color: #35a06f;
}
</style>
