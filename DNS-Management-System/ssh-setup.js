// SSH를 통한 원격 DNS 서버 관리
const { Client } = require('ssh2');
const config = require('./server-config');

class SSHManager {
    constructor() {
        this.conn = new Client();
        this.isConnected = false;
    }

    // SSH 연결
    connect() {
        return new Promise((resolve, reject) => {
            this.conn.on('ready', () => {
                console.log('✅ SSH 연결 성공!');
                this.isConnected = true;
                resolve();
            }).on('error', (err) => {
                console.error('❌ SSH 연결 실패:', err.message);
                reject(err);
            }).connect(config.ssh);
        });
    }

    // 명령 실행
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('SSH 연결이 되어있지 않습니다.'));
                return;
            }

            this.conn.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                let stdout = '';
                let stderr = '';

                stream.on('close', (code, signal) => {
                    resolve({ stdout, stderr, code });
                }).on('data', (data) => {
                    stdout += data.toString();
                }).stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            });
        });
    }

    // 파일 읽기
    async readFile(remotePath) {
        const result = await this.executeCommand(`cat ${remotePath}`);
        return result.stdout;
    }

    // 파일 쓰기
    async writeFile(remotePath, content) {
        const escapedContent = content.replace(/'/g, "'\\''");
        const command = `echo '${escapedContent}' | sudo tee ${remotePath} > /dev/null`;
        return await this.executeCommand(command);
    }

    // 존 파일에 레코드 추가
    async addDNSRecord(zone, record) {
        const zoneFile = `${config.bind.zoneDir}/db.${zone}`;

        // 레코드 라인 생성
        let recordLine = this.formatRecord(record);

        // 존 파일에 추가
        const command = `echo '${recordLine}' | sudo tee -a ${zoneFile} > /dev/null`;
        await this.executeCommand(command);

        // 시리얼 증가
        await this.incrementSerial(zoneFile);

        // BIND9 재로드
        await this.reloadBind();
    }

    // 레코드 포맷팅
    formatRecord(record) {
        const { type, name, value, ttl, priority } = record;
        const hostname = name.split('.')[0] || '@';

        switch (type) {
            case 'A':
                return `${hostname}\t${ttl}\tIN\tA\t${value}`;
            case 'AAAA':
                return `${hostname}\t${ttl}\tIN\tAAAA\t${value}`;
            case 'CNAME':
                return `${hostname}\t${ttl}\tIN\tCNAME\t${value}`;
            case 'MX':
                return `${hostname}\t${ttl}\tIN\tMX\t${priority || 10}\t${value}`;
            case 'TXT':
                return `${hostname}\t${ttl}\tIN\tTXT\t"${value}"`;
            case 'NS':
                return `${hostname}\t${ttl}\tIN\tNS\t${value}`;
            case 'PTR':
                return `${hostname}\t${ttl}\tIN\tPTR\t${value}`;
            default:
                throw new Error('지원하지 않는 레코드 타입입니다.');
        }
    }

    // 시리얼 번호 증가
    async incrementSerial(zoneFile) {
        const command = `
            sudo sed -i '/Serial/s/[0-9]\\{10\\}/$(date +%Y%m%d)01/' ${zoneFile}
        `;
        await this.executeCommand(command);
    }

    // BIND9 재로드
    async reloadBind() {
        const result = await this.executeCommand('sudo rndc reload');
        console.log('BIND9 재로드:', result.stdout);
        return result;
    }

    // BIND9 상태 확인
    async checkBindStatus() {
        const result = await this.executeCommand('sudo systemctl status bind9');
        return result.stdout;
    }

    // 존 파일 검증
    async validateZone(zone) {
        const zoneFile = `${config.bind.zoneDir}/db.${zone}`;
        const command = `sudo named-checkzone ${zone} ${zoneFile}`;
        const result = await this.executeCommand(command);
        return result.code === 0;
    }

    // 연결 종료
    disconnect() {
        this.conn.end();
        this.isConnected = false;
        console.log('SSH 연결 종료');
    }
}

module.exports = SSHManager;
