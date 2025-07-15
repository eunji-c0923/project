// ========================================
// 대시보드 실시간 현황 (dashboard.js)
// ========================================

let updateInterval = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 대시보드 모듈 로드됨');
  
  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }
  
  // 대시보드 초기화
  initializeDashboard();
  
  console.log('✅ 대시보드 초기화 완료');
});

function initializeDashboard() {
  // 초기 데이터 로드
  loadInitialData();
  
  // 실시간 업데이트 시작
  startRealTimeUpdates();
  
  // 사용자 정보 업데이트
  updateUserInfo();
}

// ========================================
// 실시간 주차장 현황 API (PDF 명세서 기준)
// ========================================
async function loadLiveStatus() {
  console.log('📊 실시간 주차장 현황 로드 중...');
  
  const data = await apiRequest('/api/parking/live-status');
  if (!data) return false;
  
  try {
    const statusNumbers = document.querySelectorAll('.status-number');
    if (statusNumbers.length >= 4) {
      statusNumbers[0].textContent = data.totalSlots || 0;
      statusNumbers[1].textContent = data.occupiedSlots || 0;
      statusNumbers[2].textContent = data.availableSlots || 0;
      statusNumbers[3].textContent = (data.occupancyRate || 0) + '%';
      
      console.log('📊 실시간 현황 업데이트 완료');
    }
    return true;
  } catch (error) {
    console.error('❌ 실시간 현황 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 현재 주차 상태 API (PDF 명세서 기준)
// ========================================
async function loadCurrentParkingStatus() {
  console.log('🚗 현재 주차 상태 로드 중...');
  
  const data = await apiRequest('/api/parking/status');
  if (!data) return false;
  
  try {
    // 현재 주차중 상태 업데이트
    if (data.currentStatus && data.currentStatus.type === 'active') {
      updateCurrentParkingDisplay(data.currentStatus);
    }
    
    // 예약 상태 업데이트
    if (data.reservationStatus && data.reservationStatus.type === 'reserved') {
      updateReservationDisplay(data.reservationStatus);
    }
    
    // 이용 내역 업데이트
    if (data.history && data.history.length > 0) {
      updateRecentHistoryDisplay(data.history);
    }
    
    console.log('✅ 현재 주차 상태 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 현재 주차 상태 UI 업데이트 실패:', error);
    return false;
  }
}

function updateCurrentParkingDisplay(currentStatus) {
  // 경과시간 업데이트
  const elapsedElement = document.getElementById('elapsed-time');
  if (elapsedElement) {
    elapsedElement.textContent = currentStatus.elapsedTime;
    elapsedElement.dataset.apiUpdated = 'true';
  }
  
  // 주차구역 업데이트
  const slotElements = document.querySelectorAll('.parking-slot');
  slotElements.forEach(el => {
    if (el) el.textContent = currentStatus.slotName;
  });
  
  // 예상요금 업데이트
  const feeElements = document.querySelectorAll('.estimated-fee, .current-fee');
  feeElements.forEach(el => {
    if (el) el.textContent = '₩' + currentStatus.estimatedFee.toLocaleString();
  });
  
  // 입차시간 업데이트
  const entryTimeElement = document.getElementById('entry-time');
  if (entryTimeElement) {
    entryTimeElement.textContent = currentStatus.entryTime;
  }
}

function updateReservationDisplay(reservationStatus) {
  const reservationElements = {
    slot: document.querySelectorAll('.reserved-slot'),
    time: document.querySelectorAll('.reserved-time'),
    duration: document.querySelectorAll('.reserved-duration'),
    fee: document.querySelectorAll('.reserved-fee')
  };
  
  reservationElements.slot.forEach(el => el.textContent = reservationStatus.slotName);
  reservationElements.time.forEach(el => el.textContent = reservationStatus.reservationTime);
  reservationElements.duration.forEach(el => el.textContent = reservationStatus.duration + '시간');
  reservationElements.fee.forEach(el => el.textContent = '₩' + reservationStatus.reservationFee.toLocaleString());
}

function updateRecentHistoryDisplay(history) {
  const historyContainer = document.querySelector('.recent-history-list');
  if (!historyContainer) return;
  
  historyContainer.innerHTML = '';
  
  // 최근 3개 항목만 표시
  history.slice(0, 3).forEach(record => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-date">${record.date}</div>
      <div class="history-slot">${record.slotName}</div>
      <div class="history-duration">${record.duration}</div>
      <div class="history-fee">₩${record.fee.toLocaleString()}</div>
      <div class="history-status">${record.status}</div>
    `;
    historyContainer.appendChild(item);
  });
}

// ========================================
// 구역별 실시간 현황 API (PDF 명세서 기준)
// ========================================
async function loadRealtimeStatus() {
  console.log('🏢 구역별 실시간 현황 로드 중...');
  
  const data = await apiRequest('/api/parking/realtime-status');
  if (!data || !data.zones) return false;
  
  try {
    const zoneContainer = document.querySelector('.zone-status-container');
    if (!zoneContainer) return false;
    
    zoneContainer.innerHTML = '';
    
    data.zones.forEach(zone => {
      const zoneElement = document.createElement('div');
      zoneElement.className = 'zone-status-item';
      
      // 가용률 계산 (PDF에서는 usageRate이지만 available 계산을 위해 변환)
      const availableSlots = zone.total - zone.used;
      const availabilityRate = Math.round((availableSlots / zone.total) * 100);
      
      // 상태에 따른 클래스 설정
      let statusClass = 'high';
      if (availabilityRate < 20) statusClass = 'low';
      else if (availabilityRate < 50) statusClass = 'medium';
      
      zoneElement.innerHTML = `
        <div class="zone-header">
          <span class="zone-name">${zone.zoneName}</span>
          <span class="zone-code">${zone.zoneCode}</span>
        </div>
        <div class="zone-stats">
          <div class="zone-available ${statusClass}">
            <span class="available-count">${availableSlots}</span>
            <span class="total-count">/${zone.total}</span>
          </div>
          <div class="zone-rate ${statusClass}">
            가용률: ${availabilityRate}%
            <div class="rate-progress">
              <div class="rate-bar" style="width: ${availabilityRate}%"></div>
            </div>
          </div>
        </div>
        <div class="zone-usage-rate">
          이용률: ${zone.usageRate}%
        </div>
      `;
      
      zoneContainer.appendChild(zoneElement);
    });
    
    console.log('✅ 구역별 실시간 현황 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 구역별 실시간 현황 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 내 계정 정보 API (PDF 명세서 기준)
// ========================================
async function loadAccountInfo() {
  console.log('💳 내 계정 정보 로드 중...');
  
  const data = await apiRequest('/api/payment/account-info');
  if (!data) return false;
  
  try {
    // 포인트 정보 업데이트
    const pointElements = document.querySelectorAll('.point-amount, #point');
    pointElements.forEach(el => {
      if (el) el.textContent = data.point?.toLocaleString() + 'P';
    });
    
    // 선불 잔액 업데이트
    const balanceElements = document.querySelectorAll('.balance-amount, #prepaid-balance');
    balanceElements.forEach(el => {
      if (el) el.textContent = '₩' + data.prepaidBalance?.toLocaleString();
    });
    
    // 이번달 사용액 업데이트
    const usageElements = document.querySelectorAll('.monthly-usage');
    usageElements.forEach(el => {
      if (el) el.textContent = '₩' + data.monthlyUsage?.toLocaleString();
    });
    
    // 소멸 예정 포인트 업데이트
    const expireElements = document.querySelectorAll('.expire-point');
    expireElements.forEach(el => {
      if (el) el.textContent = data.pointExpireNextMonth?.toLocaleString() + 'P';
    });
    
    // 마지막 충전일 업데이트
    const lastChargedElements = document.querySelectorAll('#last-charged');
    lastChargedElements.forEach(el => {
      if (el) el.textContent = data.lastChargedAt || '-';
    });
    
    // 절약 정보 업데이트
    const savingsElements = document.querySelectorAll('.savings-rate');
    savingsElements.forEach(el => {
      if (el && data.compareLastMonth !== undefined) {
        const rate = Math.abs(data.compareLastMonth);
        const isPositive = data.compareLastMonth < 0;
        el.textContent = (isPositive ? '↓' : '↑') + rate + '%';
        el.style.color = isPositive ? '#10b981' : '#ef4444';
      }
    });
    
    console.log('✅ 내 계정 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 내 계정 정보 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 멤버십 정보 API (PDF 명세서 기준)
// ========================================
async function loadMembershipInfo() {
  console.log('🏆 멤버십 정보 로드 중...');
  
  const data = await apiRequest('/api/membership/info');
  if (!data) return false;
  
  try {
    // 멤버십 등급 업데이트
    const gradeElements = document.querySelectorAll('.membership-grade, #membership-grade');
    gradeElements.forEach(el => {
      if (el) el.textContent = data.membershipGrade;
    });
    
    // 가입일 업데이트
    const joinedElements = document.querySelectorAll('.joined-date');
    joinedElements.forEach(el => {
      if (el) el.textContent = data.joinedAt;
    });
    
    // 총 이용횟수 업데이트
    const usageElements = document.querySelectorAll('.total-usage-count');
    usageElements.forEach(el => {
      if (el) el.textContent = data.totalUsageCount?.toLocaleString() + '회';
    });
    
    // 누적 결제금액 업데이트
    const paymentElements = document.querySelectorAll('.total-payment');
    paymentElements.forEach(el => {
      if (el) el.textContent = '₩' + data.totalPayment?.toLocaleString();
    });
    
    // 할인율 업데이트
    const discountElements = document.querySelectorAll('.discount-rate');
    discountElements.forEach(el => {
      if (el) el.textContent = data.discountRate + '%';
    });
    
    // 혜택 목록 업데이트
    const benefitsContainer = document.querySelector('.benefits-list');
    if (benefitsContainer && data.benefits) {
      benefitsContainer.innerHTML = '';
      data.benefits.forEach(benefit => {
        const item = document.createElement('div');
        item.className = 'benefit-item';
        item.innerHTML = `<span class="benefit-icon">✓</span> ${benefit}`;
        benefitsContainer.appendChild(item);
      });
    }
    
    console.log('✅ 멤버십 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 멤버십 정보 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 사용자 정보 업데이트
// ========================================
function updateUserInfo() {
  const user = getCurrentUser();
  if (user && user.name) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
  }
}

// ========================================
// 실시간 업데이트 관리
// ========================================
function startRealTimeUpdates() {
  // 30초마다 실시간 데이터 업데이트
  updateInterval = setInterval(async () => {
    console.log('🔄 실시간 데이터 업데이트 중...');
    
    try {
      await Promise.all([
        loadLiveStatus(),
        loadRealtimeStatus(),
        loadCurrentParkingStatus()
      ]);
      
      console.log('✅ 실시간 업데이트 완료');
    } catch (error) {
      console.error('❌ 실시간 업데이트 실패:', error);
    }
  }, 30000); // 30초
  
  console.log('⏰ 실시간 업데이트 시작 (30초 간격)');
}

function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('⏰ 실시간 업데이트 중지');
  }
}

// ========================================
// 출차 요청
// ========================================
async function requestExit() {
  if (!confirm('출차를 요청하시겠습니까?')) {
    return;
  }
  
  showLoading('출차를 처리중입니다...');
  
  try {
    const response = await apiRequest('/api/parking/exit', {
      method: 'POST'
    });
    
    if (response) {
      hideLoading();
      showToast(`출차가 완료되었습니다!\n최종요금: ₩${response.finalFee?.toLocaleString()}\n주차시간: ${response.totalDuration}`, 'success');
      
      // 주차 상태 및 계정 정보 업데이트
      await Promise.all([
        loadCurrentParkingStatus(),
        loadAccountInfo()
      ]);
    }
  } catch (error) {
    hideLoading();
    showToast('출차 처리 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 예약 취소
// ========================================
async function cancelReservation(reservationId) {
  if (!confirm('예약을 정말 취소하시겠습니까?\n취소 수수료가 발생할 수 있습니다.')) {
    return;
  }
  
  showLoading('예약을 취소하는 중...');
  
  try {
    const response = await apiRequest(`/api/reservations/${reservationId}`, {
      method: 'DELETE'
    });
    
    if (response) {
      hideLoading();
      
      if (response.cancellationFee && response.cancellationFee > 0) {
        showToast(`예약이 취소되었습니다. 취소 수수료: ₩${response.cancellationFee.toLocaleString()}`, 'info');
      } else {
        showToast('예약이 취소되었습니다.', 'success');
      }
      
      // 예약 상태 새로고침
      await loadCurrentParkingStatus();
    }
  } catch (error) {
    hideLoading();
    showToast('예약 취소에 실패했습니다.', 'error');
  }
}

// ========================================
// 에러 메시지 표시
// ========================================
function showErrorMessage(message) {
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // 5초 후 자동 숨김
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    showToast(message, 'error');
  }
}

// ========================================
// 초기 데이터 로드
// ========================================
async function loadInitialData() {
  showLoading('데이터를 불러오는 중...');
  
  try {
    // 순차적 로드 (중요한 순서대로)
    await loadLiveStatus();
    await loadCurrentParkingStatus();
    
    // 병렬 로드 (나머지)
    await Promise.all([
      loadRealtimeStatus(),
      loadAccountInfo(),
      loadMembershipInfo()
    ]);
    
    hideLoading();
    showToast('데이터 로드 완료!', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 데이터 로드 실패:', error);
    showToast('일부 데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.', 'warning');
  }
}

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopRealTimeUpdates();
});

// ========================================
// 전역 함수 노출
// ========================================
window.requestExit = requestExit;
window.cancelReservation = cancelReservation;
window.loadInitialData = loadInitialData;
window.loadLiveStatus = loadLiveStatus;
window.loadCurrentParkingStatus = loadCurrentParkingStatus;
window.loadRealtimeStatus = loadRealtimeStatus;
window.loadAccountInfo = loadAccountInfo;
window.loadMembershipInfo = loadMembershipInfo;