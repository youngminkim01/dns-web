const { NodeSSH } = require('node-ssh');

async function main() {
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.10.243',
        port: 22,
        username: 'apro',
        password: 'aproit1!',
        tryKeyboard: true,
    });
    try {
        await ssh.execCommand('cd /home/apro/dns-web && nohup node server.js > /dev/null 2>&1 &');
        console.log('앱 백그라운드 실행 완료.');
    } finally {
        ssh.dispose();
    }
}
main().catch((e) => { console.error(e); process.exit(1); });
