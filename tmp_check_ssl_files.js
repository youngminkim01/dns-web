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
        const res = await ssh.execCommand('ls -l /etc/nginx/ssl');
        console.log('--- /etc/nginx/ssl 파일 목록 ---');
        console.log(res.stdout);
    } catch (err) {
        console.error('오류 발생:', err);
    } finally {
        ssh.dispose();
    }
}

main();
