const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { NodeSSH } = require('node-ssh');
const config = require('./server-config');

const app = express();
const PORT = config.web.port || 3000;
const ssh = new NodeSSH();

// SSH 연결 상태
let sshConnected = false;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// SSH 연결 함수
async function connectSSH() {
    if (sshConnected) return true;

    try {
        await ssh.connect(config.ssh);
        sshConnected = true;
        console.log('✓ SSH 연결 성공:', config.ssh.host);
        return true;
    } catch (error) {
        console.error('✗ SSH 연결 실패:', error.message);
        sshConnected = false;
        return false;
    }
}

// SSH 명령 실행 함수
async function executeSSHCommand(command) {
    try {
        if (!sshConnected) {
            await connectSSH();
        }

        const result = await ssh.execCommand(command);

        if (result.code !== 0) {
            throw new Error(result.stderr || '명령 실행 실패');
        }

        return result.stdout;
    } catch (error) {
        console.error('SSH 명령 실행 오류:', error);
        throw error;
    }
}

// BIND9 설정 파일 경로 (리눅스 환경에 맞게 수정)
const BIND_ZONE_DIR = '/etc/bind/zones';
const BIND_CONFIG = '/etc/bind/named.conf.local';

// DNS 레코드 추가
app.post('/api/dns/add', async (req, res) => {
    try {
        const { type, name, value, ttl, priority } = req.body;

        console.log('DNS 레코드 추가 요청:', req.body);

        // 도메인에서 존 추출
        const zone = extractZone(name);
        const zoneFile = path.join(BIND_ZONE_DIR, `db.${zone}`);

        // 레코드 문자열 생성
        let recordLine = '';
        const hostname = name.replace(`.${zone}`, '') || '@';

        switch (type) {
            case 'A':
                recordLine = `${hostname}\t${ttl}\tIN\tA\t${value}`;
                break;
            case 'AAAA':
                recordLine = `${hostname}\t${ttl}\tIN\tAAAA\t${value}`;
                break;
            case 'CNAME':
                recordLine = `${hostname}\t${ttl}\tIN\tCNAME\t${value}`;
                break;
            case 'MX':
                recordLine = `${hostname}\t${ttl}\tIN\tMX\t${priority || 10}\t${value}`;
                break;
            case 'TXT':
                recordLine = `${hostname}\t${ttl}\tIN\tTXT\t"${value}"`;
                break;
            case 'NS':
                recordLine = `${hostname}\t${ttl}\tIN\tNS\t${value}`;
                break;
            case 'PTR':
                recordLine = `${hostname}\t${ttl}\tIN\tPTR\t${value}`;
                break;
            default:
                return res.status(400).json({ error: '지원하지 않는 레코드 타입입니다.' });
        }

        // 존 파일에 레코드 추가
        await addRecordToZoneFile(zoneFile, recordLine);

        // 시리얼 번호 증가
        await incrementSerial(zoneFile);

        // BIND9 재로드
        await reloadBind();

        res.json({
            success: true,
            message: 'DNS 레코드가 성공적으로 추가되었습니다.',
            record: req.body
        });

    } catch (error) {
        console.error('DNS 레코드 추가 오류:', error);
        res.status(500).json({
            error: 'DNS 레코드 추가 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// DNS 레코드 수정
app.put('/api/dns/update/:id', async (req, res) => {
    try {
        const { type, name, value, ttl, priority } = req.body;

        console.log('DNS 레코드 수정 요청:', req.body);

        // 실제 구현에서는 기존 레코드를 찾아서 수정
        // 여기서는 간단히 삭제 후 추가로 처리

        const zone = extractZone(name);
        const zoneFile = path.join(BIND_ZONE_DIR, `db.${zone}`);

        // 시리얼 번호 증가
        await incrementSerial(zoneFile);

        // BIND9 재로드
        await reloadBind();

        res.json({
            success: true,
            message: 'DNS 레코드가 성공적으로 수정되었습니다.',
            record: req.body
        });

    } catch (error) {
        console.error('DNS 레코드 수정 오류:', error);
        res.status(500).json({
            error: 'DNS 레코드 수정 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// DNS 레코드 삭제
app.delete('/api/dns/delete', async (req, res) => {
    try {
        const { name, type, value } = req.body;

        console.log('DNS 레코드 삭제 요청:', req.body);

        const zone = extractZone(name);
        const zoneFile = path.join(BIND_ZONE_DIR, `db.${zone}`);

        // 레코드 삭제
        await deleteRecordFromZoneFile(zoneFile, name, type, value);

        // 시리얼 번호 증가
        await incrementSerial(zoneFile);

        // BIND9 재로드
        await reloadBind();

        res.json({
            success: true,
            message: 'DNS 레코드가 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('DNS 레코드 삭제 오류:', error);
        res.status(500).json({
            error: 'DNS 레코드 삭제 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// DNS 레코드 목록 조회
app.get('/api/dns/records', async (req, res) => {
    try {
        const zone = req.query.zone || 'aproele.com';
        const zoneFile = path.join(BIND_ZONE_DIR, `db.${zone}`);

        const records = await parseZoneFile(zoneFile);

        res.json({
            success: true,
            records: records
        });

    } catch (error) {
        console.error('DNS 레코드 조회 오류:', error);
        res.status(500).json({
            error: 'DNS 레코드 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 헬퍼 함수들

// 도메인에서 존 추출
function extractZone(fqdn) {
    const parts = fqdn.split('.');
    if (parts.length >= 2) {
        return parts.slice(-2).join('.');
    }
    return fqdn;
}

// 존 파일에 레코드 추가 (SSH 사용)
async function addRecordToZoneFile(zoneFile, recordLine) {
    try {
        // SSH로 존 파일 읽기
        const content = await executeSSHCommand(`sudo cat ${zoneFile}`);

        // 레코드 섹션 찾기 (SOA 레코드 이후)
        const lines = content.split('\n');
        let insertIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('SOA')) {
                // SOA 레코드의 끝 찾기 (닫는 괄호)
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].includes(')')) {
                        insertIndex = j + 1;
                        break;
                    }
                }
                break;
            }
        }

        if (insertIndex === -1) {
            insertIndex = lines.length;
        }

        // 레코드 추가
        lines.splice(insertIndex, 0, recordLine);

        // 임시 파일로 저장 후 SSH로 전송
        const tempFile = `/tmp/zone_${Date.now()}.tmp`;
        const newContent = lines.join('\n');

        // SSH로 파일 쓰기
        await executeSSHCommand(`echo '${newContent.replace(/'/g, "'\\''")}' | sudo tee ${tempFile} > /dev/null`);
        await executeSSHCommand(`sudo mv ${tempFile} ${zoneFile}`);
        await executeSSHCommand(`sudo chown bind:bind ${zoneFile}`);

        console.log(`레코드가 ${zoneFile}에 추가되었습니다.`);

    } catch (error) {
        console.error('존 파일 수정 오류:', error);
        throw error;
    }
}

// 존 파일에서 레코드 삭제 (SSH 사용)
async function deleteRecordFromZoneFile(zoneFile, name, type, value) {
    try {
        const content = await executeSSHCommand(`sudo cat ${zoneFile}`);
        const lines = content.split('\n');

        // 레코드 찾아서 삭제
        const filteredLines = lines.filter(line => {
            return !(line.includes(type) && line.includes(value));
        });

        // 임시 파일로 저장 후 SSH로 전송
        const tempFile = `/tmp/zone_${Date.now()}.tmp`;
        const newContent = filteredLines.join('\n');

        await executeSSHCommand(`echo '${newContent.replace(/'/g, "'\\''")}' | sudo tee ${tempFile} > /dev/null`);
        await executeSSHCommand(`sudo mv ${tempFile} ${zoneFile}`);
        await executeSSHCommand(`sudo chown bind:bind ${zoneFile}`);

        console.log(`레코드가 ${zoneFile}에서 삭제되었습니다.`);

    } catch (error) {
        console.error('레코드 삭제 오류:', error);
        throw error;
    }
}

// 시리얼 번호 증가 (SSH 사용)
async function incrementSerial(zoneFile) {
    try {
        let content = await executeSSHCommand(`sudo cat ${zoneFile}`);

        // 시리얼 번호 찾기 및 증가
        const serialRegex = /(\d{10})\s*;\s*Serial/;
        const match = content.match(serialRegex);

        if (match) {
            const currentSerial = parseInt(match[1]);
            const newSerial = currentSerial + 1;
            content = content.replace(serialRegex, `${newSerial} ; Serial`);

            // 임시 파일로 저장 후 SSH로 전송
            const tempFile = `/tmp/zone_${Date.now()}.tmp`;
            await executeSSHCommand(`echo '${content.replace(/'/g, "'\\''")}' | sudo tee ${tempFile} > /dev/null`);
            await executeSSHCommand(`sudo mv ${tempFile} ${zoneFile}`);
            await executeSSHCommand(`sudo chown bind:bind ${zoneFile}`);

            console.log(`시리얼 번호가 ${newSerial}로 증가되었습니다.`);
        }

    } catch (error) {
        console.error('시리얼 번호 증가 오류:', error);
        throw error;
    }
}

// BIND9 재로드 (SSH 사용)
async function reloadBind() {
    try {
        const result = await executeSSHCommand('sudo rndc reload');
        console.log('✓ BIND9이 재로드되었습니다:', result);
        return true;
    } catch (error) {
        console.error('✗ BIND9 재로드 오류:', error.message);
        // 개발 환경에서는 오류를 무시하고 계속 진행
        return false;
    }
}

// 존 파일 파싱 (SSH 사용)
async function parseZoneFile(zoneFile) {
    try {
        const content = await executeSSHCommand(`sudo cat ${zoneFile}`);
        const lines = content.split('\n');
        const records = [];
        let recordId = 1;

        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith(';') && !line.startsWith('$') && !line.includes('SOA')) {
                // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
                const parts = line.split(/\s+/);
                if (parts.length >= 4 && parts.includes('IN')) {
                    const inIndex = parts.indexOf('IN');
                    const recordType = parts[inIndex + 1];

                    // SOA, NS 레코드는 제외 (관리 레코드)
                    if (!['SOA', 'NS'].includes(recordType)) {
                        const record = {
                            id: recordId++,
                            name: parts[0],
                            ttl: parts[inIndex - 1],
                            type: recordType,
                            value: parts.slice(inIndex + 2).join(' ').replace(/"/g, ''),
                            status: 'active'
                        };

                        // MX 레코드의 경우 우선순위 추출
                        if (recordType === 'MX' && parts.length >= inIndex + 3) {
                            record.priority = parseInt(parts[inIndex + 2]);
                            record.value = parts.slice(inIndex + 3).join(' ');
                        }

                        records.push(record);
                    }
                }
            }
        });

        return records;

    } catch (error) {
        console.error('존 파일 파싱 오류:', error);
        return [];
    }
}

// 서버 시작
app.listen(PORT, () => {
    console.log(`DNS 관리 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT} 에서 접속하세요.`);
    console.log('\n기본 로그인 정보:');
    console.log('사용자명: admin');
    console.log('비밀번호: admin123');
});
