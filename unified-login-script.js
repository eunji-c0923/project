// ========================================
// 스마트파킹 로그인 시스템 - Thymeleaf 연동 버전
// ========================================

console.log('🚀 스마트파킹 로그인 시스템 시작 (Thymeleaf 연동)');

// 전역 변수
let currentUserType = null;
let isSubmitting = false;

// ========================================
// 1. DOM 로드 및 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM 로드 완료');
    
    // 페이지 애니메이션
    animatePageLoad();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 아이디 입력 필드에 포커스
    setTimeout(() => {
        const idInput = document.getElementById('unified-id');
        if (idInput) {
            idInput.focus();
            console.log('🎯 아이디 필드에 포커스 설정');
        }
    }, 500);
    
    console.log('✅ 초기화 완료');
});

// ========================================
// 2. 이벤트 리스너 설정
// ========================================
function setupEventListeners() {
    console.log('🔗 이벤트 리스너 설정 중...');
    
    // 로그인 폼 이벤트 - Thymeleaf 처리를 위해 수정
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleThymeleafLogin);
        console.log('📝 로그인 폼 이벤트 연결 (Thymeleaf)');
    }
    
    // 아이디 입력 이벤트
    const idInput = document.getElementById('unified-id');
    if (idInput) {
        idInput.addEventListener('input', function() {
            detectUserType(this.value);
            // 실시간으로 hidden 필드 업데이트
            updateHiddenUserType();
        });
        console.log('👤 아이디 입력 이벤트 연결');
    }
    
    // 비밀번호 토글 이벤트
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePassword);
        console.log('👁️ 비밀번호 토글 이벤트 연결');
    }
    
    // 소셜 로그인 처리 (별도 처리)
    setupSocialLogin();
    
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        } else if (e.key === 'F12') {
            e.preventDefault();
            showDebugInfo();
        }
    });
    
    console.log('⌨️ 키보드 단축키 연결');
}

// ========================================
// 3. Thymeleaf 연동 로그인 처리
// ========================================
function handleThymeleafLogin(event) {
    console.log('🔐 Thymeleaf 로그인 처리 시작');
    
    // 중복 제출 방지
    if (isSubmitting) {
        console.log('⚠️ 이미 제출 중입니다');
        event.preventDefault();
        return false;
    }
    
    const id = document.getElementById('unified-id').value.trim();
    const password = document.getElementById('unified-password').value;
    
    console.log('📝 입력 정보:', { id, password: '***', userType: currentUserType });
    
    // 클라이언트 사이드 기본 검증
    if (!id) {
        event.preventDefault();
        showMessage('아이디를 입력해주세요.', 'error');
        return false;
    }
    
    if (!password) {
        event.preventDefault();
        showMessage('비밀번호를 입력해주세요.', 'error');
        return false;
    }
    
    // 관리자 로그인 시 확인
    if (currentUserType === 'admin') {
        const confirmAdmin = confirm(
            '🛡️ 관리자 계정으로 로그인하시겠습니까?\n\n' +
            '관리자 권한으로 접근됩니다.'
        );
        
        if (!confirmAdmin) {
            event.preventDefault();
            console.log('❌ 관리자 로그인 취소됨');
            return false;
        }
    }
    
    // 사용자 타입을 hidden 필드에 설정
    updateHiddenUserType();
    
    // 로딩 상태 설정
    setLoadingState(true);
    isSubmitting = true;
    
    // 폼 액션 동적 설정 (선택사항)
    setFormAction();
    
    console.log('📤 서버로 폼 제출 허용');
    // event.preventDefault() 하지 않음 - 서버로 제출됨
    
    // 3초 후 로딩 해제 (서버 응답이 늦을 경우를 위한 백업)
    setTimeout(() => {
        setLoadingState(false);
        isSubmitting = false;
    }, 3000);
    
    return true; // 폼 제출 허용
}

// ========================================
// 4. Hidden 필드 및 폼 액션 설정
// ========================================
function updateHiddenUserType() {
    // userType hidden 필드 업데이트
    let userTypeField = document.getElementById('userType');
    if (!userTypeField) {
        // hidden 필드가 없으면 생성
        userTypeField = document.createElement('input');
        userTypeField.type = 'hidden';
        userTypeField.id = 'userType';
        userTypeField.name = 'userType';
        document.querySelector('.login-form').appendChild(userTypeField);
        console.log('🔧 userType hidden 필드 생성됨');
    }
    
    userTypeField.value = currentUserType || 'customer';
    console.log('📝 userType 설정됨:', userTypeField.value);
}

function setFormAction() {
    const form = document.querySelector('.login-form');
    if (!form) return;
    
    // 현재 action이 설정되어 있으면 그대로 사용
    if (form.action && form.action !== window.location.href) {
        console.log('📍 기존 action 사용:', form.action);
        return;
    }
    
    // action이 없으면 기본값 설정
    const baseAction = '/member/login';
    form.action = baseAction;
    console.log('📍 폼 action 설정됨:', baseAction);
}

// ========================================
// 5. 사용자 타입 감지 (기존과 동일)
// ========================================
function detectUserType(userId) {
    console.log('🔍 사용자 타입 감지:', userId);
    
    const indicator = document.getElementById('user-type-indicator');
    const loginCard = document.getElementById('login-card');
    const servicePreview = document.getElementById('service-preview');
    const loginBtn = document.getElementById('login-btn');
    const customerPreview = document.getElementById('customer-preview');
    const adminPreview = document.getElementById('admin-preview');
    const idInput = document.getElementById('unified-id');
    
    // 초기화
    if (indicator) indicator.classList.remove('show', 'customer', 'admin');
    if (loginCard) loginCard.classList.remove('customer-mode', 'admin-mode');
    if (servicePreview) servicePreview.classList.remove('customer-mode', 'admin-mode');
    if (loginBtn) loginBtn.classList.remove('customer-mode', 'admin-mode');
    if (idInput) idInput.classList.remove('customer-mode', 'admin-mode');
    
    currentUserType = null;
    
    if (!userId || !userId.trim()) {
        if (customerPreview) customerPreview.style.display = 'block';
        if (adminPreview) adminPreview.style.display = 'none';
        return;
    }
    
    // 관리자 계정 체크
    const adminAccounts = ['admin', 'manager', 'supervisor', 'security', 'system', 'operator'];
    const isAdmin = adminAccounts.includes(userId.toLowerCase());
    
    console.log('🎭 사용자 타입 결정:', isAdmin ? 'admin' : 'customer');
    
    if (isAdmin) {
        currentUserType = 'admin';
        if (indicator) {
            indicator.textContent = '🛡️ 관리자 계정으로 감지되었습니다';
            indicator.classList.add('show', 'admin');
        }
        
        // 스타일 적용
        if (loginCard) loginCard.classList.add('admin-mode');
        if (servicePreview) servicePreview.classList.add('admin-mode');
        if (loginBtn) loginBtn.classList.add('admin-mode');
        if (idInput) idInput.classList.add('admin-mode');
        
        // 미리보기 전환
        if (customerPreview) customerPreview.style.display = 'none';
        if (adminPreview) adminPreview.style.display = 'block';
        
    } else {
        currentUserType = 'customer';
        if (indicator) {
            indicator.textContent = '👤 고객 계정으로 감지되었습니다';
            indicator.classList.add('show', 'customer');
        }
        
        // 스타일 적용
        if (loginCard) loginCard.classList.add('customer-mode');
        if (servicePreview) servicePreview.classList.add('customer-mode');
        if (loginBtn) loginBtn.classList.add('customer-mode');
        if (idInput) idInput.classList.add('customer-mode');
        
        // 미리보기 전환
        if (customerPreview) customerPreview.style.display = 'block';
        if (adminPreview) adminPreview.style.display = 'none';
    }
}

// ========================================
// 6. 소셜 로그인 처리
// ========================================
function setupSocialLogin() {
    const kakaoBtn = document.getElementById('kakao-btn');
    const naverBtn = document.getElementById('naver-btn');
    
    if (kakaoBtn) {
        kakaoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/member/oauth/kakao';
        });
        console.log('💛 카카오 버튼 이벤트 연결');
    }
    
    if (naverBtn) {
        naverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/member/oauth/naver';
        });
        console.log('🟢 네이버 버튼 이벤트 연결');
    }
}

// ========================================
// 7. UI 헬퍼 함수들
// ========================================
function setLoadingState(isLoading) {
    const btn = document.getElementById('login-btn');
    const btnText = btn?.querySelector('.btn-text');
    const btnLoading = btn?.querySelector('.btn-loading');
    
    if (!btn) return;
    
    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        console.log('⏳ 로딩 상태 활성화');
    } else {
        if (btnText) btnText.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
        btn.disabled = false;
        btn.style.opacity = '1';
        console.log('✅ 로딩 상태 비활성화');
    }
}

function showMessage(text, type = 'info') {
    console.log(`📢 메시지 표시 (${type}):`, text);
    
    // 기존 토스트 제거
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span style="margin-right: 0.5rem;">${icons[type] || icons.info}</span>
        ${text}
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-size: 0.95rem;
        animation: slideInFromRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    // 애니메이션 스타일 추가
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.style.animation = 'slideOutToRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePassword() {
    const input = document.getElementById('unified-password');
    const icon = document.getElementById('password-icon');
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

function animatePageLoad() {
    const elements = document.querySelectorAll('.login-card, .service-preview, .demo-notice');
    elements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = index === 0 ? 'translateX(-30px)' : index === 1 ? 'translateX(30px)' : 'translateY(30px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translate(0)';
            }, 100 + (index * 150));
        }
    });
}

// ========================================
// 8. 디버그 및 도움말 (간소화)
// ========================================
function showDebugInfo() {
    console.log('🔍 현재 상태:');
    console.log('  - 사용자 타입:', currentUserType);
    console.log('  - 제출 중 여부:', isSubmitting);
    console.log('  - 폼 액션:', document.querySelector('.login-form')?.action);
    console.log('  - userType 필드:', document.getElementById('userType')?.value);
}

function showHelp() {
    alert(`🔑 로그인 도움말

👤 고객 로그인: 일반 사용자 계정
🛡️ 관리자 로그인: admin, manager, supervisor 등

⌨️ 단축키:
• F1: 도움말
• F12: 디버그 정보

📝 Thymeleaf 연동:
• 서버에서 검증 후 적절한 페이지로 리다이렉트됩니다.`);
}

// ========================================
// 전역 함수들 (HTML에서 호출용)
// ========================================
window.detectUserType = detectUserType;
window.togglePassword = togglePassword;
window.showMessage = showMessage;

// 디버그용 함수들
window.debugThymeleaf = function() {
    console.log('🔍 Thymeleaf 연동 상태:');
    console.log('현재 사용자 타입:', currentUserType);
    console.log('제출 중 여부:', isSubmitting);
    console.log('폼 액션:', document.querySelector('.login-form')?.action);
    console.log('userType 필드 값:', document.getElementById('userType')?.value);
    
    const form = document.querySelector('.login-form');
    if (form) {
        console.log('폼 데이터:');
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${key === 'password' ? '***' : value}`);
        }
    }
};

window.testThymeleafSubmit = function() {
    console.log('🧪 Thymeleaf 제출 테스트');
    document.getElementById('unified-id').value = 'test';
    document.getElementById('unified-password').value = 'test';
    detectUserType('test');
    
    setTimeout(() => {
        console.log('📤 폼 제출 시뮬레이션');
        document.querySelector('.login-form').submit();
    }, 500);
};

console.log('🎯 Thymeleaf 연동 로그인 시스템 로드 완료!');
console.log('🔧 디버그 명령어:');
console.log('  - debugThymeleaf() : Thymeleaf 연동 상태 확인');
console.log('  - testThymeleafSubmit() : 제출 테스트');
console.log('  - showDebugInfo() : 디버그 정보');
console.log('  - showHelp() : 도움말');