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
        console.log('--- /home/apro 목록 ---');
        let res = await ssh.execCommand('ls -la /home/apro');
        console.log(res.stdout);

        console.log('\n--- /home/apro/dns-web 목록 ---');
        res = await ssh.execCommand('ls -la /home/apro/dns-web');
        console.log(res.stdout);

        console.log('\n--- Node/PM2 실행 상태 ---');
        res = await ssh.execCommand('ps -ef | grep node');
        console.log(res.stdout);

    } catch (err) {
        console.error('오류:', err);
    } finally {
        ssh.dispose();
    }
}

main();
