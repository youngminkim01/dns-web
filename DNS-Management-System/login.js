// 로그인 폼 처리
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMessage = document.getElementById('errorMessage');

    // 간단한 인증 (실제 환경에서는 서버 인증 필요)
    // 기본 계정: admin / admin123
    if (username === 'admin' && password === '1q2w3e!Q@W#E!') {
        // 로그인 성공
        const userData = {
            username: username,
            loginTime: new Date().toISOString(),
            remember: remember
        };

        // 세션 저장
        if (remember) {
            localStorage.setItem('dnsUser', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('dnsUser', JSON.stringify(userData));
        }

        // 대시보드로 이동
        window.location.href = 'dashboard.html';
    } else {
        // 로그인 실패
        errorMessage.textContent = '사용자 이름 또는 비밀번호가 올바르지 않습니다.';
        errorMessage.classList.add('show');

        // 3초 후 에러 메시지 숨김
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }
});

// 페이지 로드 시 이미 로그인되어 있는지 확인
window.addEventListener('DOMContentLoaded', () => {
    const localUser = localStorage.getItem('dnsUser');
    const sessionUser = sessionStorage.getItem('dnsUser');

    if (localUser || sessionUser) {
        // 이미 로그인되어 있으면 대시보드로 리다이렉트
        window.location.href = 'dashboard.html';
    }
});

// Enter 키로 폼 제출
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
