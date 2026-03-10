// DNS 서버 존 파일 확인 스크립트
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkDNSServer() {
    try {
        console.log('🔌 SSH 연결 중...');
        await ssh.connect({
            host: '192.168.10.247',
            port: 22,
            username: 'apro',
            password: 'aproit1!',
            tryKeyboard: true
        });
        console.log('✅ SSH 연결 성공!\n');

        // 1. 존 디렉토리 확인
        console.log('📁 존 디렉토리 확인 중...');
        const zoneDirResult = await ssh.execCommand('ls -la /etc/bind/zones/');
        console.log(zoneDirResult.stdout);
        console.log('');

        // 2. aproele.com 존 파일 확인
        console.log('🔍 aproele.com 존 파일 확인 중...');
        const zoneFileCheck = await ssh.execCommand('test -f /etc/bind/zones/db.aproele.com && echo "EXISTS" || echo "NOT_FOUND"');

        if (zoneFileCheck.stdout.trim() === 'EXISTS') {
            console.log('✅ aproele.com 존 파일 존재!\n');

            // 존 파일 내용 확인
            console.log('📄 존 파일 내용 (처음 30줄):');
            const zoneContent = await ssh.execCommand('sudo cat /etc/bind/zones/db.aproele.com | head -30');
            console.log(zoneContent.stdout);
            console.log('');

            // 레코드 개수 확인
            const recordCount = await ssh.execCommand('sudo cat /etc/bind/zones/db.aproele.com | grep -E "IN\\s+(A|AAAA|CNAME|MX|TXT)" | grep -v "^;" | wc -l');
            console.log(`📊 레코드 개수: ${recordCount.stdout.trim()}개\n`);
        } else {
            console.log('❌ aproele.com 존 파일이 없습니다!');
            console.log('💡 존 파일을 생성해야 합니다.\n');

            // 사용 가능한 존 파일 목록
            console.log('📋 현재 존재하는 존 파일:');
            const existingZones = await ssh.execCommand('ls -1 /etc/bind/zones/ 2>/dev/null || echo "존 디렉토리가 없습니다"');
            console.log(existingZones.stdout);
        }

        // 3. BIND9 상태 확인
        console.log('\n🔧 BIND9 서비스 상태:');
        const bindStatus = await ssh.execCommand('sudo systemctl is-active bind9');
        if (bindStatus.stdout.trim() === 'active') {
            console.log('✅ BIND9 실행 중');
        } else {
            console.log('❌ BIND9 실행 안 됨:', bindStatus.stdout);
        }

        // 4. named.conf.local 확인
        console.log('\n📝 named.conf.local 설정:');
        const namedConf = await ssh.execCommand('sudo cat /etc/bind/named.conf.local | grep -A 5 "aproele.com" || echo "aproele.com 존 설정 없음"');
        console.log(namedConf.stdout);

        ssh.dispose();
        console.log('\n✅ 검사 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}

checkDNSServer();
