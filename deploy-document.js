const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const REMOTE = {
    host: '192.168.10.243',
    port: 22,
    username: 'apro',
    password: 'aproit1!',
};

async function main() {
    const ssh = new NodeSSH();
    const localDir = path.join(__dirname, 'document');

    console.log('서버에 연결 중...', REMOTE.host);
    try {
        await ssh.connect({
            host: REMOTE.host,
            port: REMOTE.port,
            username: REMOTE.username,
            password: REMOTE.password,
            tryKeyboard: true,
        });
    } catch (e) {
        console.error('SSH 연결 실패:', e.message);
        process.exit(1);
    }

    try {
        // 서버에서 dns-web 경로 찾기 (기존 deploy 로직 참고)
        const { stdout: findOut } = await ssh.execCommand(
            'find /home/apro -maxdepth 4 -name "server.js" -type f 2>/dev/null | head -1'
        );
        let appDir = findOut.trim();
        if (appDir) appDir = path.posix.dirname(appDir);
        if (!appDir) {
            for (const p of ['/home/apro/DNS-Server', '/home/apro', '/home/apro/dns-web']) {
                const { code } = await ssh.execCommand(`test -d "${p}" && echo ok`);
                if (code === 0) {
                    appDir = p;
                    break;
                }
            }
        }
        if (!appDir) appDir = '/home/apro/dns-web'; // Fallback

        console.log('앱 경로:', appDir);
        const remoteFolder = path.posix.join(appDir, 'document');

        console.log('원격 디렉토리 생성 중...', remoteFolder);
        await ssh.execCommand(`mkdir -p "${remoteFolder}"`);

        const files = fs.readdirSync(localDir);
        for (const file of files) {
            const localFile = path.join(localDir, file);
            const remoteFile = path.posix.join(remoteFolder, file);

            if (fs.statSync(localFile).isFile()) {
                console.log('업로드 중:', file);
                await ssh.putFile(localFile, remoteFile);
            }
        }

        console.log('\ndocument 폴더 배포 완료.');
    } finally {
        ssh.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
