// 간단한 SSH 연결 테스트
const { Client } = require('ssh2');

const conn = new Client();

console.log('🔄 SSH 연결 시도 중...');
console.log('서버: 192.168.10.247:22');
console.log('사용자: apro');
console.log('');

conn.on('ready', () => {
    console.log('✅ SSH 연결 성공!');
    console.log('');

    // 간단한 명령 실행
    conn.exec('whoami && hostname && pwd', (err, stream) => {
        if (err) {
            console.error('명령 실행 오류:', err);
            conn.end();
            return;
        }

        stream.on('close', (code, signal) => {
            console.log('');
            console.log('명령 실행 완료 (종료 코드:', code, ')');
            conn.end();
        }).on('data', (data) => {
            console.log('출력:', data.toString());
        }).stderr.on('data', (data) => {
            console.error('오류:', data.toString());
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH 연결 실패:', err.message);
    console.error('');
    console.error('상세 오류:', err);
    console.error('');
    console.error('확인사항:');
    console.error('1. 리눅스 서버에서 SSH 서비스가 실행 중인지 확인');
    console.error('   명령: sudo systemctl status sshd 또는 sudo systemctl status ssh');
    console.error('2. 비밀번호가 정확한지 확인');
    console.error('3. 사용자 apro가 존재하는지 확인');
    console.error('4. SSH 포트가 22번인지 확인');
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
    console.log('키보드 인터랙티브 인증 요청');
    console.log('Prompts:', prompts);
    finish(['aproit!']);
}).connect({
    host: '192.168.10.247',
    port: 22,
    username: 'apro',
    password: 'aproit!',
    tryKeyboard: true,
    readyTimeout: 20000,
    // 알고리즘 호환성 설정 (PuTTY와 동일하게)
    algorithms: {
        kex: [
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1'
        ],
        cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes256-cbc',
            'aes192-cbc',
            'aes128-cbc'
        ],
        serverHostKey: [
            'ssh-rsa',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'ssh-ed25519'
        ],
        hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1'
        ]
    },
    debug: (msg) => {
        // SSH 디버그 메시지 (필요시 주석 해제)
        console.log('DEBUG:', msg);
    }
});

// 타임아웃 설정
setTimeout(() => {
    if (!conn._sock || !conn._sock.readable) {
        console.error('⏱️  연결 타임아웃 (10초)');
        process.exit(1);
    }
}, 10000);
