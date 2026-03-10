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
        console.log('--- curl http://localhost:3000 ---');
        let res = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(res.stdout || res.stderr);

        console.log('\n--- nginx status ---');
        res = await ssh.execCommand('sudo -S -p "" systemctl status nginx', { stdin: 'aproit1!\n' });
        console.log(res.stdout);

        console.log('\n--- curl nginx ---');
        res = await ssh.execCommand('curl -I http://localhost');
        console.log(res.stdout || res.stderr);

    } catch (err) {
        console.error('오류:', err);
    } finally {
        ssh.dispose();
    }
}

main();
