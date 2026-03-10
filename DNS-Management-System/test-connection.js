// SSH 연결 테스트 스크립트
const SSHManager = require('./ssh-setup');

async function testConnection() {
    const ssh = new SSHManager();

    console.log('🔄 SSH 연결 시도 중...');
    console.log('서버: 192.168.10.243');
    console.log('사용자: apro');
    console.log('');

    try {
        // 연결
        await ssh.connect();
        console.log('');

        // 시스템 정보 확인
        console.log('📊 시스템 정보 확인 중...');
        const hostname = await ssh.executeCommand('hostname');
        console.log('호스트명:', hostname.stdout.trim());

        const whoami = await ssh.executeCommand('whoami');
        console.log('사용자:', whoami.stdout.trim());

        const pwd = await ssh.executeCommand('pwd');
        console.log('현재 디렉토리:', pwd.stdout.trim());
        console.log('');

        // BIND9 확인
        console.log('🔍 BIND9 설치 확인 중...');
        const namedCheck = await ssh.executeCommand('which named');
        if (namedCheck.stdout.trim()) {
            console.log('✅ BIND9 설치됨:', namedCheck.stdout.trim());
        } else {
            console.log('❌ BIND9가 설치되어 있지 않습니다.');
            console.log('   설치 명령: sudo apt-get install bind9 bind9utils bind9-doc -y');
        }
        console.log('');

        // BIND9 상태 확인
        console.log('🔍 BIND9 상태 확인 중...');
        try {
            const bindStatus = await ssh.executeCommand('systemctl is-active bind9');
            if (bindStatus.stdout.trim() === 'active') {
                console.log('✅ BIND9 실행 중');
            } else {
                console.log('⚠️  BIND9가 실행되고 있지 않습니다.');
            }
        } catch (err) {
            console.log('⚠️  BIND9 상태 확인 실패');
        }
        console.log('');

        // 존 디렉토리 확인
        console.log('🔍 존 디렉토리 확인 중...');
        const zoneDir = await ssh.executeCommand('ls -la /etc/bind/zones/ 2>&1');
        if (zoneDir.code === 0) {
            console.log('✅ 존 디렉토리 존재');
            console.log(zoneDir.stdout);
        } else {
            console.log('❌ 존 디렉토리가 없습니다.');
            console.log('   생성 명령: sudo mkdir -p /etc/bind/zones');
        }
        console.log('');

        // aproele.com 존 파일 확인
        console.log('🔍 aproele.com 존 파일 확인 중...');
        const zoneFile = await ssh.executeCommand('ls -la /etc/bind/zones/db.aproele.com 2>&1');
        if (zoneFile.code === 0) {
            console.log('✅ aproele.com 존 파일 존재');

            // 존 파일 내용 미리보기
            const zoneContent = await ssh.executeCommand('head -20 /etc/bind/zones/db.aproele.com');
            console.log('존 파일 내용 (처음 20줄):');
            console.log('─────────────────────────────────────');
            console.log(zoneContent.stdout);
            console.log('─────────────────────────────────────');
        } else {
            console.log('❌ aproele.com 존 파일이 없습니다.');
            console.log('   setup-guide.md 파일을 참고하여 생성하세요.');
        }
        console.log('');

        // 권한 확인
        console.log('🔍 sudo 권한 확인 중...');
        const sudoCheck = await ssh.executeCommand('sudo -n rndc status 2>&1');
        if (sudoCheck.code === 0 || sudoCheck.stdout.includes('version')) {
            console.log('✅ sudo 권한 설정됨 (비밀번호 없이 rndc 실행 가능)');
        } else {
            console.log('⚠️  sudo 권한이 설정되지 않았습니다.');
            console.log('   setup-guide.md의 "권한 설정" 섹션을 참고하세요.');
        }
        console.log('');

        console.log('═══════════════════════════════════════');
        console.log('✅ 연결 테스트 완료!');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('다음 단계:');
        console.log('1. setup-guide.md 파일을 참고하여 서버 설정 완료');
        console.log('2. npm start 명령으로 웹 서버 실행');
        console.log('3. http://localhost:3000 접속하여 DNS 관리');

    } catch (error) {
        console.error('');
        console.error('❌ 오류 발생:', error.message);
        console.error('');
        console.error('문제 해결:');
        console.error('1. 서버 IP 주소 확인: 192.168.10.247');
        console.error('2. SSH 포트 확인: 22');
        console.error('3. 사용자명/비밀번호 확인');
        console.error('4. 네트워크 연결 확인 (ping 192.168.10.247)');
        console.error('5. 방화벽 설정 확인');
    } finally {
        ssh.disconnect();
    }
}

// 실행
testConnection();
