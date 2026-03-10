const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function main() {
    const ssh = new NodeSSH();
    console.log('서버에 연결 중...');
    await ssh.connect({
        host: '192.168.10.243',
        port: 22,
        username: 'apro',
        password: 'aproit1!',
        tryKeyboard: true,
    });

    try {
        console.log('Nginx 설정 파일 내용을 읽어옵니다...');
        const nginxConf = fs.readFileSync('nginx-dns-web.conf', 'utf-8');

        console.log('서버에 Nginx 설정을 적용합니다...');

        const pswd = 'aproit1!\n';

        // 1. 설정 파일을 서버의 /tmp 에 복사
        await ssh.putFile('nginx-dns-web.conf', '/tmp/nginx-dns-web.conf');

        // 2. sudo 로 /etc/nginx/sites-available 로 이동
        await ssh.execCommand('sudo -S -p "" cp /tmp/nginx-dns-web.conf /etc/nginx/sites-available/dns-web', { stdin: pswd });

        // 3. 심볼릭 링크 생성
        await ssh.execCommand('sudo -S -p "" ln -sf /etc/nginx/sites-available/dns-web /etc/nginx/sites-enabled/', { stdin: pswd });

        // 4. default 사이트 삭제
        await ssh.execCommand('sudo -S -p "" rm -f /etc/nginx/sites-enabled/default', { stdin: pswd });

        // 5. Nginx 재시작
        let res = await ssh.execCommand('sudo -S -p "" systemctl reload nginx', { stdin: pswd });

        if (res.code !== 0 && (res.stderr.includes('not found') || res.stderr.includes('Failed to reload') || res.stderr.includes('ActiveState'))) {
            // Nginx가 재시작이 안되거나 없으면
            console.log('Nginx를 재시작/설치합니다...', res.stderr);
            res = await ssh.execCommand('sudo -S -p "" systemctl restart nginx', { stdin: pswd });
            if (res.code !== 0) {
                console.log('Nginx 설치 시도...');
                await ssh.execCommand('sudo -S -p "" apt-get update', { stdin: pswd });
                await ssh.execCommand('sudo -S -p "" apt-get install -y nginx', { stdin: pswd });
                await ssh.execCommand('sudo -S -p "" cp /tmp/nginx-dns-web.conf /etc/nginx/sites-available/dns-web', { stdin: pswd });
                await ssh.execCommand('sudo -S -p "" ln -sf /etc/nginx/sites-available/dns-web /etc/nginx/sites-enabled/', { stdin: pswd });
                await ssh.execCommand('sudo -S -p "" rm -f /etc/nginx/sites-enabled/default', { stdin: pswd });
                await ssh.execCommand('sudo -S -p "" systemctl restart nginx', { stdin: pswd });
            }
        }

        console.log('Nginx 설정 완료: dns.aproele.com 로 접속 (포트번호 생략).');

    } catch (err) {
        console.error('Nginx 적용 중 오류:', err);
    } finally {
        ssh.dispose();
    }
}

main();
