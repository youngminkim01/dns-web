/**
 * 수정된 파일을 원격 서버에 업로드 후 앱 재시작
 * 실행: node deploy.js
 */
const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const REMOTE = {
    host: '192.168.10.243',
    port: 22,
    username: 'apro',
    password: 'aproit1!',
};

const FILES = ['server.js', 'dashboard.js', 'dashboard.html'];

async function main() {
    const ssh = new NodeSSH();
    const localDir = __dirname;

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
        // 서버에서 server.js 가 있는 앱 디렉터리 찾기
        const { stdout: findOut } = await ssh.execCommand(
            'find /home/apro -maxdepth 4 -name "server.js" -type f 2>/dev/null | head -1'
        );
        let appDir = findOut.trim();
        if (appDir) appDir = path.posix.dirname(appDir);
        if (!appDir) {
            for (const p of ['/home/apro/DNS-Server', '/home/apro']) {
                const { code } = await ssh.execCommand(`test -f "${p}/server.js" && echo ok`);
                if (code === 0) {
                    appDir = p;
                    break;
                }
            }
        }
        if (!appDir) appDir = '/home/apro';
        console.log('앱 경로:', appDir);

        for (const file of FILES) {
            const local = path.join(localDir, file);
            if (!fs.existsSync(local)) continue;
            const remote = path.posix.join(appDir, file);
            await ssh.putFile(local, remote);
            console.log('  업로드:', file);
        }

        // Node 앱 재시작 (pm2 > node server.js 프로세스)
        const { stdout: pm2List } = await ssh.execCommand('pm2 list 2>/dev/null || true');
        if (pm2List && pm2List.includes('server')) {
            await ssh.execCommand('pm2 restart server 2>/dev/null || pm2 restart all');
            console.log('pm2 재시작 완료.');
        } else {
            await ssh.execCommand('pkill -f "node.*server.js" 2>/dev/null || true');
            console.log('기존 node 프로세스 종료함. 서버에서 node server.js 로 다시 실행해 주세요.');
        }
        console.log('\n배포 완료.');
    } finally {
        ssh.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
