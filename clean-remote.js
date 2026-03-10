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
        console.log('홈 디렉터리의 불필요한 중복 파일들을 삭제합니다...');
        // /home/apro 홈에 있는 중복 파일 삭제
        const homeTrash = ['server.js', 'dashboard.html', 'dashboard.js'];
        for (const file of homeTrash) {
            await ssh.execCommand(`rm -f /home/apro/${file}`);
            console.log(`/home/apro/${file} 삭제 완료`);
        }

        console.log('\n/home/apro/dns-web 내의 불필요한 파일/폴더를 삭제합니다...');
        // dns-web 내의 불필요한 md 파일들과 내부 중첩 백업 디렉터리, 예제 파일 삭제
        const appTrash = [
            '*.md',
            'DNS-Management-System',
            'server-config.server.example.js'
        ];

        for (const target of appTrash) {
            await ssh.execCommand(`rm -rf /home/apro/dns-web/${target}`);
            console.log(`/home/apro/dns-web/${target} 삭제 완료`);
        }

        console.log('\n--- 정리 후 /home/apro 목록 ---');
        let res = await ssh.execCommand('ls -la /home/apro');
        console.log(res.stdout);

        console.log('\n--- 정리 후 /home/apro/dns-web 목록 ---');
        res = await ssh.execCommand('ls -la /home/apro/dns-web');
        console.log(res.stdout);

        console.log('\n정리가 성공적으로 완료되었습니다.');

    } catch (err) {
        console.error('오류:', err);
    } finally {
        ssh.dispose();
    }
}

main();
