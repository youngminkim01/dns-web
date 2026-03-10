// 비밀번호 테스트 - 여러 가지 시도
const { Client } = require('ssh2');

const passwords = [
    'aproit!',      // 원래 비밀번호
    'aproit\\!',    // 이스케이프된 느낌표
    'aproit',       // 느낌표 없이
];

async function testPassword(password, index) {
    return new Promise((resolve) => {
        const conn = new Client();

        console.log(`\n시도 ${index + 1}: 비밀번호 = "${password}"`);

        const timeout = setTimeout(() => {
            conn.end();
            console.log('  ⏱️  타임아웃');
            resolve(false);
        }, 5000);

        conn.on('ready', () => {
            clearTimeout(timeout);
            console.log('  ✅ 성공!');
            conn.end();
            resolve(true);
        }).on('error', (err) => {
            clearTimeout(timeout);
            if (err.level === 'client-authentication') {
                console.log('  ❌ 인증 실패');
            } else {
                console.log('  ❌ 오류:', err.message);
            }
            resolve(false);
        }).connect({
            host: '192.168.10.247',
            port: 22,
            username: 'apro',
            password: password,
            readyTimeout: 5000
        });
    });
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('비밀번호 테스트 시작');
    console.log('서버: 192.168.10.247');
    console.log('사용자: apro');
    console.log('═══════════════════════════════════════');

    for (let i = 0; i < passwords.length; i++) {
        const success = await testPassword(passwords[i], i);
        if (success) {
            console.log('\n🎉 올바른 비밀번호를 찾았습니다!');
            console.log(`비밀번호: "${passwords[i]}"`);
            process.exit(0);
        }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('❌ 모든 비밀번호 시도 실패');
    console.log('═══════════════════════════════════════');
    console.log('\n다음을 확인하세요:');
    console.log('1. PuTTY에서 사용하는 정확한 비밀번호 확인');
    console.log('2. 비밀번호에 특수문자가 있는지 확인');
    console.log('3. 대소문자 구분 확인');
    console.log('\n또는 리눅스 서버에서 비밀번호를 재설정하세요:');
    console.log('  sudo passwd apro');
}

main();
