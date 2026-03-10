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
        console.log('--- port 3000 ---');
        let res = await ssh.execCommand('netstat -tulnp | grep 3000 || sudo -S -p "" netstat -tulnp | grep 3000', { stdin: 'aproit1!\n' });
        console.log(res.stdout || res.stderr);

        console.log('--- ufw status ---');
        res = await ssh.execCommand('sudo -S -p "" ufw status', { stdin: 'aproit1!\n' });
        console.log(res.stdout || res.stderr);

        console.log('--- node logs ---');
        // Check standard output of pm2 or node if available. Since it's run via nohup, it should have a log file if not pointing to /dev/null
        // Actually deploy-start.js does: cd /home/apro/dns-web && nohup node server.js > /dev/null 2>&1 & (it redirects to dev null). 
        // We might want to see if the process is actually listening.

    } catch (err) {
        console.error('오류:', err);
    } finally {
        ssh.dispose();
    }
}

main();
