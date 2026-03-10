// 모든 존 파일 확인
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function checkAllZones() {
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

        // 모든 존 파일 목록
        console.log('📁 존재하는 모든 존 파일:');
        const zoneFiles = await ssh.execCommand('ls -1 /etc/bind/zones/ | grep "^db\\."');
        const files = zoneFiles.stdout.split('\n').filter(f => f.trim());

        console.log(`총 ${files.length}개의 존 파일 발견\n`);

        // 각 존 파일 확인
        for (const file of files) {
            console.log('='.repeat(70));
            console.log(`📄 ${file}`);
            console.log('='.repeat(70));

            const content = await ssh.execCommand(`sudo cat /etc/bind/zones/${file}`);
            const lines = content.stdout.split('\n');
            const totalLines = lines.length;

            // 레코드 개수 확인
            const recordCount = await ssh.execCommand(`sudo cat /etc/bind/zones/${file} | grep -E "IN\\s+(A|AAAA|CNAME|MX|TXT)" | grep -v "^;" | grep -v "SOA" | wc -l`);

            console.log(`📊 총 줄 수: ${totalLines}줄`);
            console.log(`📊 DNS 레코드: ${recordCount.stdout.trim()}개\n`);

            if (totalLines > 0 && totalLines <= 50) {
                console.log('내용:');
                console.log(content.stdout);
            } else if (totalLines > 50) {
                console.log('처음 30줄:');
                const first30 = await ssh.execCommand(`sudo cat /etc/bind/zones/${file} | head -30`);
                console.log(first30.stdout);
                console.log('\n... (생략) ...\n');
            } else {
                console.log('⚠️ 파일이 비어있습니다.\n');
            }

            console.log('');
        }

        // named.conf.local 확인
        console.log('='.repeat(70));
        console.log('📝 named.conf.local 설정:');
        console.log('='.repeat(70));
        const namedConf = await ssh.execCommand('sudo cat /etc/bind/named.conf.local');
        console.log(namedConf.stdout);

        ssh.dispose();
        console.log('\n✅ 확인 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}

checkAllZones();
