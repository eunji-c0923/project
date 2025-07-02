// 전역 변수
let currentUserType = null; // 'customer' or 'admin'
let pendingAdminLogin = false;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initializeLoginPage();
  checkAutoLogin();
  setupFormValidation();
  setupKeyboardShortcuts();
  setupSocialLoginButtons(); // 소셜 로그인 버튼 설정 추가
});

// === 소셜 로그인 버튼 설정 ===
function setupSocialLoginButtons() {
  const kakaoBtn = document.querySelector('.social-btn.kakao');
  const naverBtn = document.querySelector('.social-btn.naver');
  
  if (kakaoBtn) {
    kakaoBtn.addEventListener('click', function(event) {
      event.preventDefault();
      socialLogin('kakao', event);
    });
  }
  
  if (naverBtn) {
    naverBtn.addEventListener('click', function(event) {
      event.preventDefault();
      socialLogin('naver', event);
    });
  }
}

// 페이지 초기화
function initializeLoginPage() {
  // 페이지 로드 애니메이션
  const elements = document.querySelectorAll('.login-card, .service-preview, .demo-notice');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = index === 0 ? 'translateX(-30px)' : index === 1 ? 'translateX(30px)' : 'translateY(30px)';
    
    setTimeout(() => {
      el.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      el.style.opacity = '1';
      el.style.transform = 'translate(0)';
    }, 100 + (index * 150));
  });
  
  // 포커스를 아이디 입력 필드로
  setTimeout(() => {
    document.getElementById('unified-id').focus();
  }, 500);
}

// === 사용자 타입 감지 ===
function detectUserType(userId) {
  const indicator = document.getElementById('user-type-indicator');
  const loginCard = document.getElementById('login-card');
  const servicePreview = document.getElementById('service-preview');
  const loginBtn = document.getElementById('login-btn');
  const customerPreview = document.getElementById('customer-preview');
  const adminPreview = document.getElementById('admin-preview');
  const idInput = document.getElementById('unified-id');
  
  // 초기화
  indicator.classList.remove('show', 'customer', 'admin');
  loginCard.classList.remove('customer-mode', 'admin-mode');
  servicePreview.classList.remove('customer-mode', 'admin-mode');
  loginBtn.classList.remove('customer-mode', 'admin-mode');
  idInput.classList.remove('customer-mode', 'admin-mode');
  currentUserType = null;
  
  if (!userId.trim()) {
    customerPreview.style.display = 'block';
    adminPreview.style.display = 'none';
    return;
  }
  
  // 관리자 계정 패턴 감지
  const adminPatterns = [
    'admin', 'manager', 'supervisor', 'operator',
    'security', 'system', 'root', 'master'
  ];
  
  const isAdmin = adminPatterns.some(pattern => 
    userId.toLowerCase().includes(pattern)
  );
  
  if (isAdmin) {
    // 관리자 모드
    currentUserType = 'admin';
    indicator.textContent = '🛡️ 관리자 계정으로 감지되었습니다';
    indicator.classList.add('show', 'admin');
    loginCard.classList.add('admin-mode');
    servicePreview.classList.add('admin-mode');
    loginBtn.classList.add('admin-mode');
    idInput.classList.add('admin-mode');
    
    // 미리보기 전환
    customerPreview.style.display = 'none';
    adminPreview.style.display = 'block';
    
  } else {
    // 고객 모드
    currentUserType = 'customer';
    indicator.textContent = '👤 고객 계정으로 감지되었습니다';
    indicator.classList.add('show', 'customer');
    loginCard.classList.add('customer-mode');
    servicePreview.classList.add('customer-mode');
    loginBtn.classList.add('customer-mode');
    idInput.classList.add('customer-mode');
    
    // 미리보기 전환
    customerPreview.style.display = 'block';
    adminPreview.style.display = 'none';
  }
}

// === 통합 로그인 처리 ===
function handleUnifiedLogin(event) {
  event.preventDefault();
  
  const id = document.getElementById('unified-id').value.trim();
  const password = document.getElementById('unified-password').value;
  const remember = document.getElementById('remember-login').checked;
  
  if (!validateInputs(id, password)) {
    return;
  }
  
  // 관리자 로그인 시 경고 모달
  if (currentUserType === 'admin') {
    pendingAdminLogin = { id, password, remember };
    showAdminWarning();
    return;
  }
  
  // 일반 로그인 처리
  processLogin(id, password, remember, currentUserType || 'customer');
}

function continueAdminLogin() {
  closeAdminWarning();
  const { id, password, remember } = pendingAdminLogin;
  processLogin(id, password, remember, 'admin');
  pendingAdminLogin = false;
}

function processLogin(id, password, remember, userType) {
  // 로딩 상태로 변경
  setLoadingState(true);
  
  // 로그인 시뮬레이션 (사용자 타입에 따라 다른 시간)
  const loadingTime = userType === 'admin' ? 2500 : 1500;
  
  setTimeout(() => {
    if (validateCredentials(id, password, userType)) {
      handleLoginSuccess(userType, { 
        id, 
        name: getUserName(id, userType),
        role: userType
      }, remember);
    } else {
      handleLoginFailure('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    setLoadingState(false);
  }, loadingTime);
}

// === 로그인 검증 ===
function validateCredentials(id, password, userType) {
  const accounts = {
    customer: [
      { id: 'customer', password: '1234' },
      { id: 'test', password: 'test' },
      { id: 'demo', password: 'demo' },
      { id: 'user', password: 'user' },
      { id: 'guest', password: 'guest' }
    ],
    admin: [
      { id: 'admin', password: 'admin' },
      { id: 'manager', password: '1234' },
      { id: 'supervisor', password: 'super' },
      { id: 'security', password: 'security' },
      { id: 'system', password: 'system' },
      { id: 'operator', password: 'operator' }
    ]
  };
  
  const validAccounts = accounts[userType] || accounts.customer;
  return validAccounts.some(account => 
    account.id === id && account.password === password
  );
}

function validateInputs(id, password) {
  if (!id) {
    showToast('아이디를 입력해주세요.', 'error');
    return false;
  }
  
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'error');
    return false;
  }
  
  if (id.length < 3) {
    showToast('아이디는 3자 이상이어야 합니다.', 'error');
    return false;
  }
  
  if (password.length < 4) {
    showToast('비밀번호는 4자 이상이어야 합니다.', 'error');
    return false;
  }
  
  return true;
}

// === 로그인 성공/실패 처리 ===
function handleLoginSuccess(userType, userData, remember) {
  // 로그인 정보 저장
  const loginData = {
    user: userData,
    role: userType,
    loginTime: new Date().toISOString(),
    remember: remember
  };
  
  if (remember) {
    localStorage.setItem('loginData', JSON.stringify(loginData));
  } else {
    sessionStorage.setItem('loginData', JSON.stringify(loginData));
  }
  
  // 성공 모달 설정
  const successContent = document.getElementById('success-content');
  const successIcon = document.getElementById('success-icon');
  const successTitle = document.getElementById('success-title');
  const successMessage = document.getElementById('success-message');
  
  if (userType === 'admin') {
    successContent.style.borderTopColor = '#e53e3e';
    successIcon.textContent = '🛡️';
    successTitle.textContent = '관리자 인증 완료!';
    successMessage.textContent = '관리자 대시보드로 이동합니다...';
  } else {
    successContent.style.borderTopColor = '#48bb78';
    successIcon.textContent = '✅';
    successTitle.textContent = '로그인 성공!';
    successMessage.textContent = '고객 대시보드로 이동합니다...';
  }
  
  // 성공 모달 표시
  document.getElementById('success-modal').style.display = 'flex';
  
  // 성공 사운드 효과
  playSuccessSound();
  
  // 3초 후 리다이렉트
  setTimeout(() => {
    redirectToAppropriatePage(userType);
  }, 3000);
}

function handleLoginFailure(message) {
  showToast(message, 'error');
  
  // 비밀번호 필드 클리어 및 포커스
  const passwordField = document.getElementById('unified-password');
  passwordField.value = '';
  passwordField.focus();
  
  // 폼 흔들기 애니메이션
  const form = document.querySelector('.login-form');
  form.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    form.style.animation = '';
  }, 500);
}

function redirectToAppropriatePage(userType) {
  if (userType === 'customer') {
    window.location.href = 'customer-dashboard.html';
  } else {
    window.location.href = 'admin-dashboard.html';
  }
}

// === UI 상태 관리 ===
function setLoadingState(isLoading) {
  const btn = document.getElementById('login-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  
  if (isLoading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
    
    // 폼 비활성화
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.disabled = true);
  } else {
    btnText.style.display = 'block';
    btnLoading.style.display = 'none';
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    
    // 폼 활성화
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.disabled = false);
  }
}

// === 관리자 경고 모달 ===
function showAdminWarning() {
  document.getElementById('admin-warning-modal').style.display = 'flex';
}

function closeAdminWarning() {
  document.getElementById('admin-warning-modal').style.display = 'none';
  pendingAdminLogin = false;
}

// === 비밀번호 토글 ===
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById('password-icon');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁️';
  }
}

// === 소셜 로그인 ===
function socialLogin(provider, event) {
  // 이벤트가 전달되지 않은 경우 현재 활성 요소를 찾음
  if (!event) {
    event = window.event || { target: document.activeElement };
  }
  
  showToast(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인을 준비중입니다...`, 'info');
  
  // 로딩 상태 표시
  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
  });
  
  // 클릭된 버튼에 로딩 애니메이션 추가
  let clickedBtn = null;
  if (event && event.target) {
    clickedBtn = event.target.closest('.social-btn');
  }
  
  // 버튼을 찾지 못한 경우 provider로 찾기
  if (!clickedBtn) {
    clickedBtn = document.querySelector(`.social-btn.${provider}`);
  }
  
  let originalText = '';
  if (clickedBtn) {
    originalText = clickedBtn.innerHTML;
    clickedBtn.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.3); border-top: 2px solid #000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        연결중...
      </div>
    `;
  }
  
  setTimeout(() => {
    // 소셜 로그인 성공 시뮬레이션
    const userData = {
      id: `${provider}_user`,
      name: `${provider === 'kakao' ? '카카오' : '네이버'} 사용자`,
      role: 'customer'
    };
    
    // 로그인 정보 저장
    const loginData = {
      user: userData,
      role: 'customer',
      loginTime: new Date().toISOString(),
      remember: false,
      socialProvider: provider
    };
    
    sessionStorage.setItem('loginData', JSON.stringify(loginData));
    
    // 성공 메시지 표시
    showToast(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인 성공!`, 'success');
    
    // viewport.html로 이동
    setTimeout(() => {
      window.location.href = 'viewport.html';
    }, 1000);
    
  }, 2000);
}

// === 계정 찾기 ===
function showFindAccount() {
  showToast('계정 찾기 페이지로 이동합니다...', 'info');
  
  setTimeout(() => {
    alert(`계정 찾기 서비스

📧 이메일: support@smartparking.com
📞 고객센터: 1588-1234
🕐 운영시간: 09:00-18:00

본인 확인 후 임시 비밀번호를 발송해드립니다.`);
  }, 1000);
}

function showAdminSignupInfo() {
  alert(`관리자 계정 신청 안내

🔐 관리자 계정은 별도 승인이 필요합니다.

📋 필요 서류:
• 신분증 사본
• 재직증명서  
• 관리자 추천서

📞 문의처:
• 전화: 02-1234-5678
• 이메일: admin@smartparking.com

⏰ 승인 기간: 영업일 기준 3-5일`);
}

// === 자동 로그인 확인 ===
function checkAutoLogin() {
  // 자동 로그인 비활성화 - 테스트를 위해 주석 처리
  // const savedLogin = localStorage.getItem('loginData') || sessionStorage.getItem('loginData');
  
  // 기존 로그인 정보 삭제 (테스트용)
  localStorage.removeItem('loginData');
  sessionStorage.removeItem('loginData');
  
  return false;
  
  /* 자동 로그인을 다시 활성화하려면 아래 코드의 주석을 해제하세요
  if (savedLogin) {
    try {
      const loginData = JSON.parse(savedLogin);
      const loginTime = new Date(loginData.loginTime);
      const now = new Date();
      const hoursPassed = (now - loginTime) / (1000 * 60 * 60);
      
      // 8시간 이내면 자동 로그인
      if (hoursPassed < 8) {
        showToast('자동 로그인 중...', 'info');
        
        setTimeout(() => {
          // 소셜 로그인 사용자인 경우 viewport.html로 이동
          if (loginData.socialProvider) {
            window.location.href = 'viewport.html';
          } else {
            redirectToAppropriatePage(loginData.role);
          }
        }, 1500);
        
        return true;
      } else {
        // 만료된 로그인 정보 삭제
        localStorage.removeItem('loginData');
        sessionStorage.removeItem('loginData');
      }
    } catch (e) {
      console.error('자동 로그인 확인 중 오류:', e);
    }
  }
  
  return false;
  */
}

// === 폼 유효성 검사 ===
function setupFormValidation() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
  
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      validateFieldRealTime(this);
    });
    
    input.addEventListener('blur', function() {
      validateFieldOnBlur(this);
    });
    
    // Enter 키 처리
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const form = this.closest('form');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.click();
      }
    });
  });
}

function validateFieldRealTime(input) {
  const value = input.value;
  
  // 아이디 검증
  if (input.type === 'text' && input.id.includes('id')) {
    if (value.length > 0 && value.length < 3) {
      setFieldError(input, '아이디는 3자 이상이어야 합니다.');
    } else if (value.length >= 3) {
      setFieldSuccess(input);
    } else {
      clearFieldStatus(input);
    }
  }
  
  // 비밀번호 검증
  if (input.type === 'password') {
    if (value.length > 0 && value.length < 4) {
      setFieldError(input, '비밀번호는 4자 이상이어야 합니다.');
    } else if (value.length >= 4) {
      setFieldSuccess(input);
    } else {
      clearFieldStatus(input);
    }
  }
}

function validateFieldOnBlur(input) {
  const value = input.value.trim();
  
  if (value === '') {
    setFieldError(input, '필수 입력 항목입니다.');
  }
}

function setFieldError(input, message) {
  input.style.borderColor = '#e53e3e';
  input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  
  removeFieldMessage(input);
  const errorMsg = document.createElement('div');
  errorMsg.className = 'field-error';
  errorMsg.textContent = message;
  errorMsg.style.cssText = `
    color: #e53e3e;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    padding-left: 0.5rem;
  `;
  input.parentNode.appendChild(errorMsg);
}

function setFieldSuccess(input) {
  if (currentUserType === 'customer') {
    input.style.borderColor = '#48bb78';
    input.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
  } else if (currentUserType === 'admin') {
    input.style.borderColor = '#e53e3e';
    input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  } else {
    input.style.borderColor = '#4299e1';
    input.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
  }
  removeFieldMessage(input);
}

function clearFieldStatus(input) {
  input.style.borderColor = '#e2e8f0';
  input.style.boxShadow = 'none';
  removeFieldMessage(input);
}

function removeFieldMessage(input) {
  const existingMsg = input.parentNode.querySelector('.field-error');
  if (existingMsg) {
    existingMsg.remove();
  }
}

// === 키보드 단축키 ===
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl + Enter: 로그인 버튼 클릭
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      const loginBtn = document.getElementById('login-btn');
      if (loginBtn && !loginBtn.disabled) {
        loginBtn.click();
      }
    }
    
    // ESC: 모달 닫기
    if (e.key === 'Escape') {
      closeAdminWarning();
      document.getElementById('success-modal').style.display = 'none';
    }
    
    // F1: 도움말
    if (e.key === 'F1') {
      e.preventDefault();
      showHelp();
    }
  });
}

// === 유틸리티 함수들 ===
function getUserName(id, userType) {
  const customerNames = {
    'customer': '김고객',
    'test': '테스트',
    'demo': '데모',
    'user': '사용자',
    'guest': '게스트'
  };
  
  const adminNames = {
    'admin': '시스템 관리자',
    'manager': '주차관리팀',
    'supervisor': '관리 감독자',
    'security': '보안관리팀',
    'system': '시스템 운영자',
    'operator': '운영 담당자'
  };
  
  if (userType === 'admin') {
    return adminNames[id] || '관리자님';
  } else {
    return customerNames[id] || '고객님';
  }
}

// showToast 함수 계속...
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  const styles = {
    success: { background: '#48bb78', icon: '✓' },
    error: { background: '#e53e3e', icon: '✕' },
    warning: { background: '#ed8936', icon: '⚠' },
    info: { background: '#4299e1', icon: 'ℹ' }
  };
  
  const style = styles[type] || styles.info;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${style.background};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;
  
  // 아이콘 추가
  const icon = document.createElement('span');
  icon.textContent = style.icon;
  icon.style.fontSize = '1.2rem';
  toast.prepend(icon);
  
  // 애니메이션 추가
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
  
  document.body.appendChild(toast);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// === 사운드 효과 ===
function playSuccessSound() {
  // Web Audio API를 사용한 간단한 성공 사운드
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('사운드 재생 실패:', e);
  }
}

// === 도움말 ===
function showHelp() {
  const helpContent = `
    <div style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <h2 style="margin-bottom: 1rem; color: #2d3748;">🔑 로그인 도움말</h2>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #4299e1; margin-bottom: 0.5rem;">고객 계정</h3>
        <ul style="list-style: none; padding: 0;">
          <li>📧 아이디: customer / 비밀번호: 1234</li>
          <li>📧 아이디: test / 비밀번호: test</li>
          <li>📧 아이디: demo / 비밀번호: demo</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #e53e3e; margin-bottom: 0.5rem;">관리자 계정</h3>
        <ul style="list-style: none; padding: 0;">
          <li>🛡️ 아이디: admin / 비밀번호: admin</li>
          <li>🛡️ 아이디: manager / 비밀번호: 1234</li>
          <li>🛡️ 아이디: supervisor / 비밀번호: super</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #48bb78; margin-bottom: 0.5rem;">키보드 단축키</h3>
        <ul style="list-style: none; padding: 0;">
          <li>⌨️ Ctrl + Enter: 로그인</li>
          <li>⌨️ ESC: 모달 닫기</li>
          <li>⌨️ F1: 이 도움말 보기</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #ed8936; margin-bottom: 0.5rem;">문의처</h3>
        <ul style="list-style: none; padding: 0;">
          <li>📞 고객센터: 1588-1234</li>
          <li>📧 이메일: support@smartparking.com</li>
          <li>🕐 운영시간: 평일 09:00-18:00</li>
        </ul>
      </div>
    </div>
  `;
  
  showModal('도움말', helpContent);
}

// === 범용 모달 ===
function showModal(title, content, buttons = []) {
  // 기존 모달 제거
  const existingModal = document.getElementById('generic-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'generic-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
  `;
  
  const modalHeader = document.createElement('div');
  modalHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  `;
  
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  modalTitle.style.cssText = `
    margin: 0;
    color: #2d3748;
    font-size: 1.5rem;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #718096;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#f7fafc';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  closeBtn.onclick = () => modal.remove();
  
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeBtn);
  
  const modalBody = document.createElement('div');
  modalBody.innerHTML = content;
  modalBody.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
  `;
  
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  
  // 버튼 추가
  if (buttons.length > 0) {
    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    `;
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        ${btn.primary ? 
          'background: #4299e1; color: white;' : 
          'background: #e2e8f0; color: #2d3748;'}
      `;
      button.onclick = () => {
        if (btn.onClick) btn.onClick();
        modal.remove();
      };
      modalFooter.appendChild(button);
    });
    
    modalContent.appendChild(modalFooter);
  }
  
  // 애니메이션 스타일 추가
  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(animationStyle);
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // ESC 키로 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // 모달 외부 클릭으로 닫기
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

// === 세션 관리 ===
function startSessionTimer() {
  let sessionTime = 0;
  const maxSessionTime = 30 * 60; // 30분
  
  const sessionTimer = setInterval(() => {
    sessionTime++;
    
    // 25분 경과 시 경고
    if (sessionTime === 25 * 60) {
      showToast('세션이 5분 후 만료됩니다. 활동을 계속하세요.', 'warning');
    }
    
    // 30분 경과 시 자동 로그아웃
    if (sessionTime >= maxSessionTime) {
      clearInterval(sessionTimer);
      handleSessionTimeout();
    }
  }, 1000);
  
  // 사용자 활동 감지
  ['click', 'keypress', 'mousemove'].forEach(event => {
    document.addEventListener(event, () => {
      sessionTime = 0; // 활동 시 타이머 리셋
    });
  });
}

function handleSessionTimeout() {
  showModal(
    '세션 만료',
    '<p>보안을 위해 30분간 활동이 없어 자동으로 로그아웃됩니다.</p>',
    [
      {
        text: '다시 로그인',
        primary: true,
        onClick: () => {
          window.location.reload();
        }
      }
    ]
  );
  
  // 로그인 정보 제거
  localStorage.removeItem('loginData');
  sessionStorage.removeItem('loginData');
}

// === 브라우저 호환성 체크 ===
function checkBrowserCompatibility() {
  const isIE = /MSIE|Trident/.test(navigator.userAgent);
  
  if (isIE) {
    showToast('Internet Explorer는 지원하지 않습니다. Chrome, Firefox, Edge 등을 사용해주세요.', 'error');
    return false;
  }
  
  // 필수 기능 체크
  const requiredFeatures = [
    'localStorage' in window,
    'sessionStorage' in window,
    'addEventListener' in window,
    'querySelector' in document
  ];
  
  if (!requiredFeatures.every(f => f)) {
    showToast('브라우저가 너무 오래되었습니다. 최신 브라우저를 사용해주세요.', 'error');
    return false;
  }
  
  return true;
}

// === 디버그 모드 ===
const DEBUG_MODE = false;

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// === 초기화 시 브라우저 체크 추가 ===
document.addEventListener('DOMContentLoaded', function() {
  if (checkBrowserCompatibility()) {
    initializeLoginPage();
    
    // 자동 로그인이 되지 않은 경우에만 세션 타이머 시작
    if (!checkAutoLogin()) {
      startSessionTimer();
    }
    
    setupFormValidation();
    setupKeyboardShortcuts();
  }
});

// === 성능 최적화를 위한 디바운스 함수 ===
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 사용자 타입 감지에 디바운스 적용
const debouncedDetectUserType = debounce(detectUserType, 300);

// 아이디 입력 필드에 디바운스된 이벤트 적용
document.addEventListener('DOMContentLoaded', function() {
  const idInput = document.getElementById('unified-id');
  if (idInput) {
    idInput.addEventListener('input', function() {
      debouncedDetectUserType(this.value);
    });
  }
});