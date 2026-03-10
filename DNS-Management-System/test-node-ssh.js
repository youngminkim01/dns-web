// node-ssh 라이브러리로 테스트
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

console.log('🔄 SSH 연결 시도 중...');
console.log('서버: 192.168.10.247:22');
console.log('사용자: apro');
console.log('비밀번호: aproit1!');
console.log('');

ssh.connect({
    host: '192.168.10.247',
    port: 22,
    username: 'apro',
    password: 'aproit1!',
    tryKeyboard: true,
}).then(() => {
    console.log('✅ SSH 연결 성공!');
    console.log('');

    // 명령 실행
    return ssh.execCommand('whoami && hostname && pwd && echo "---" && ls -la /etc/bind/zones/ 2>&1');
}).then((result) => {
    console.log('📊 명령 실행 결과:');
    console.log('─────────────────────────────────────');
    console.log(result.stdout);
    if (result.stderr) {
        console.log('오류:', result.stderr);
    }
    console.log('─────────────────────────────────────');
    console.log('');

    // BIND9 확인
    return ssh.execCommand('which named && systemctl is-active bind9 2>&1');
}).then((result) => {
    console.log('🔍 BIND9 상태:');
    console.log(result.stdout || result.stderr);
    console.log('');

    ssh.dispose();

    console.log('═══════════════════════════════════════');
    console.log('✅ 모든 테스트 성공!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('다음 단계:');
    console.log('1. setup-guide.md를 참고하여 BIND9 설정');
    console.log('2. npm start로 웹 서버 실행');
    console.log('3. http://localhost:3000 접속');

}).catch((err) => {
    console.error('❌ 오류 발생:', err.message);
    console.error('');

    if (err.message.includes('Authentication')) {
        console.error('인증 실패 - 비밀번호를 확인하세요.');
        console.error('PuTTY에서 사용하는 정확한 비밀번호를 입력했는지 확인하세요.');
    } else if (err.message.includes('ECONNREFUSED')) {
        console.error('연결 거부 - SSH 서비스가 실행 중인지 확인하세요.');
    } else if (err.message.includes('ETIMEDOUT')) {
        console.error('연결 타임아웃 - 네트워크 연결을 확인하세요.');
    }

    process.exit(1);
});
