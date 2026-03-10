const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { NodeSSH } = require('node-ssh');
const config = require('./server-config');
const { execSync } = require('child_process');

const app = express();
const PORT = config.web.port || 3000;
const ssh = new NodeSSH();

// =====================
// 🔥 고정 존 설정
// =====================
const BIND_ZONE_DIR = config.bind?.zoneDir || '/etc/bind/zones';
const FIXED_ZONE = 'aproele.com';
const FIXED_ZONE_FILE = path.posix.join(BIND_ZONE_DIR, 'db.aproele.com');
// =====================

let sshConnected = false;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* =====================
   SSH / LOCAL MODE
===================== */

const LOCAL_MODE = config.localMode === true;

function getSudoStdin() {
    return (config.ssh && config.ssh.password) ? `${config.ssh.password}\n` : '';
}

async function connectSSH() {
    if (sshConnected) return true;
    await ssh.connect(config.ssh);
    sshConnected = true;
    console.log('✓ SSH 연결 성공:', config.ssh.host);
}

async function executeSSHCommand(command) {
    if (!sshConnected) await connectSSH();

    let execCmd = command;
    let options = undefined;

    if (command.trim().startsWith('sudo ')) {
        const realCmd = command.trim().slice(5);
        execCmd = `sudo -S -p '' ${realCmd}`;
        options = { stdin: `${config.ssh.password}\n` };
    }

    const result = await ssh.execCommand(execCmd, options);

    if (result.code !== 0) {
        throw new Error(result.stderr || '명령 실행 실패');
    }
    return result.stdout;
}

/* =====================
   FILE I/O
===================== */

async function readZoneContent(zoneFile) {
    if (LOCAL_MODE) {
        return execSync(`sudo -S -p '' cat ${zoneFile}`, {
            encoding: 'utf8',
            input: getSudoStdin(),
            maxBuffer: 2 * 1024 * 1024
        });
    }
    return await executeSSHCommand(`sudo cat ${zoneFile}`);
}

async function writeRemoteFile(zoneFile, content) {
    const tmpName = `zone_${Date.now()}.tmp`;
    const localPath = path.join(os.tmpdir(), tmpName);
    const remoteTmp = `/tmp/${tmpName}`;

    await fs.writeFile(localPath, content, 'utf8');

    try {
        if (LOCAL_MODE) {
            execSync(`sudo -S -p '' mv ${localPath} ${zoneFile}`, { input: getSudoStdin() });
            execSync(`sudo -S -p '' chown bind:bind ${zoneFile}`, { input: getSudoStdin() });
        } else {
            if (!sshConnected) await connectSSH();
            await ssh.putFile(localPath, remoteTmp);
            await executeSSHCommand(`sudo mv ${remoteTmp} ${zoneFile}`);
            await executeSSHCommand(`sudo chown bind:bind ${zoneFile}`);
        }
    } finally {
        if (!LOCAL_MODE) await fs.unlink(localPath).catch(() => { });
    }
}

/* =====================
   DNS API
===================== */

// ➕ 추가
app.post('/api/dns/add', async (req, res) => {
    try {
        const { type, name, value, ttl, priority } = req.body;

        const hostname = name.includes('.')
            ? name.replace(`.${FIXED_ZONE}`, '').trim()
            : name;

        let recordLine = '';

        switch (type) {
            case 'A':
                recordLine = `${hostname}\tIN\tA\t${value}`;
                break;
            case 'AAAA':
                recordLine = `${hostname}\tIN\tAAAA\t${value}`;
                break;
            case 'CNAME':
                recordLine = `${hostname}\tIN\tCNAME\t${value}`;
                break;
            case 'MX':
                recordLine = `${hostname}\tIN\tMX\t${priority || 10}\t${value}`;
                break;
            case 'TXT':
                recordLine = `${hostname}\tIN\tTXT\t"${value}"`;
                break;
            default:
                return res.status(400).json({ error: '지원하지 않는 타입' });
        }

        await addRecordToZoneFile(FIXED_ZONE_FILE, recordLine);
        await incrementSerial(FIXED_ZONE_FILE);
        await reloadBind();

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// ❌ 삭제
app.delete('/api/dns/delete', async (req, res) => {
    try {
        const { name, type, value } = req.body;

        await deleteRecordFromZoneFile(FIXED_ZONE_FILE, name, type, value);
        await incrementSerial(FIXED_ZONE_FILE);
        await reloadBind();

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 📄 목록
app.get('/api/dns/records', async (req, res) => {
    try {
        const records = await parseZoneFile(FIXED_ZONE_FILE);
        res.json({ success: true, records });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* =====================
   HELPERS
===================== */

// ✅ NS 아래 삽입
async function addRecordToZoneFile(zoneFile, recordLine) {
    const content = await readZoneContent(zoneFile);
    const lines = content.split('\n');

    // NS 라인들 찾기
    const nsIndexes = lines
        .map((line, idx) => ({ line, idx }))
        .filter(obj => obj.line.match(/^\s*@?\s+IN\s+NS\s+/i))
        .map(obj => obj.idx);

    let insertIndex = lines.length;

    if (nsIndexes.length > 0) {
        // 마지막 NS 바로 아래
        insertIndex = nsIndexes[nsIndexes.length - 1] + 1;
    } else {
        // NS 없으면 SOA 아래
        const soaIndex = lines.findIndex(l => l.match(/\s+IN\s+SOA\s+/i));
        if (soaIndex !== -1) {
            for (let j = soaIndex; j < lines.length; j++) {
                if (lines[j].includes(')')) {
                    insertIndex = j + 1;
                    break;
                }
            }
        }
    }

    lines.splice(insertIndex, 0, recordLine);
    await writeRemoteFile(zoneFile, lines.join('\n'));
}

async function deleteRecordFromZoneFile(zoneFile, name, type, value) {
    const content = await readZoneContent(zoneFile);
    const lines = content.split('\n');

    const filtered = lines.filter(line => {
        const l = line.trim();
        if (!l) return true;
        return !(l.startsWith(name) && l.includes(type) && l.includes(value));
    });

    await writeRemoteFile(zoneFile, filtered.join('\n'));
}

async function incrementSerial(zoneFile) {
    let content = await readZoneContent(zoneFile);

    const serialRegex = /(\d{10})\s*;\s*Serial/;
    const match = content.match(serialRegex);

    if (match) {
        const newSerial = parseInt(match[1]) + 1;
        content = content.replace(serialRegex, `${newSerial} ; Serial`);
        await writeRemoteFile(zoneFile, content);
    }
}

async function reloadBind() {
    if (LOCAL_MODE) {
        execSync('sudo -S -p "" rndc reload', {
            input: getSudoStdin(),
            encoding: 'utf8'
        });
    } else {
        await executeSSHCommand('sudo rndc reload');
    }
}

async function parseZoneFile(zoneFile) {
    const content = await readZoneContent(zoneFile);
    const lines = content.split('\n');
    const records = [];
    let id = 1;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('$') || line.includes('SOA')) continue;

        const parts = line.split(/\s+/);
        if (parts.includes('IN')) {
            const i = parts.indexOf('IN');
            const type = parts[i + 1];
            if (['SOA', 'NS'].includes(type)) continue;

            records.push({
                id: id++,
                name: parts[0],
                ttl: /^\d+$/.test(parts[i - 1]) ? parts[i - 1] : '3600',
                type,
                value: parts.slice(i + 2).join(' ').replace(/"/g, ''),
                status: 'active'
            });
        }
    }

    return records;
}

/* =====================
   START
===================== */

app.listen(PORT, () => {
    console.log(`DNS 관리 서버 실행중 : http://dns.aproele.com`);
    console.log(`고정 존 파일: ${FIXED_ZONE_FILE}`);
});
