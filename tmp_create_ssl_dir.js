const { NodeSSH } = require('node-ssh');

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
        const pswd = 'aproit1!\n';
        console.log('/etc/nginx/ssl 디렉토리를 생성합니다...');

        // 디렉토리 생성 및 소유권 변경 (apro 사용자가 쓸 수 있도록)
        await ssh.execCommand('sudo -S -p "" mkdir -p /etc/nginx/ssl', { stdin: pswd });
        await ssh.execCommand('sudo -S -p "" chown apro:apro /etc/nginx/ssl', { stdin: pswd });
        await ssh.execCommand('sudo -S -p "" chmod 755 /etc/nginx/ssl', { stdin: pswd });

        console.log('디렉토리 생성 완료: /etc/nginx/ssl');
    } catch (err) {
        console.error('오류 발생:', err);
    } finally {
        ssh.dispose();
    }
}

main();
