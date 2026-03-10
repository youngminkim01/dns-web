// DNS 존 파일 전체 내용 확인
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function viewZoneFile() {
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

        // aproele.com 존 파일 전체 내용 확인
        console.log('📄 aproele.com 존 파일 전체 내용:');
        console.log('='.repeat(60));
        const zoneContent = await ssh.execCommand('sudo cat /etc/bind/zones/db.aproele.com');
        console.log(zoneContent.stdout);
        console.log('='.repeat(60));
        console.log('');

        // 파일 크기 확인
        const fileSize = await ssh.execCommand('sudo wc -l /etc/bind/zones/db.aproele.com');
        console.log(`📊 파일 정보: ${fileSize.stdout}`);
        console.log('');

        // 레코드만 추출
        console.log('📋 DNS 레코드만 추출:');
        console.log('-'.repeat(60));
        const records = await ssh.execCommand('sudo cat /etc/bind/zones/db.aproele.com | grep -E "IN\\s+(A|AAAA|CNAME|MX|TXT|NS|PTR)" | grep -v "^;" | grep -v "SOA"');
        if (records.stdout.trim()) {
            console.log(records.stdout);
        } else {
            console.log('레코드가 없습니다.');
        }
        console.log('-'.repeat(60));

        ssh.dispose();
        console.log('\n✅ 확인 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}

viewZoneFile();
