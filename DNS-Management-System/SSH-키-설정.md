# SSH 키 기반 인증 설정 가이드

## 🔑 SSH 키 생성 및 설정

### 1단계: Windows에서 SSH 키 생성

PowerShell에서 실행:

```powershell
# SSH 키 생성 (Enter 3번 눌러서 기본값 사용)
ssh-keygen -t rsa -b 4096 -f C:\Users\apro\.ssh\id_rsa_dns
```

### 2단계: 공개 키 확인

```powershell
# 공개 키 내용 확인
type C:\Users\apro\.ssh\id_rsa_dns.pub
```

출력된 내용을 복사하세요 (ssh-rsa로 시작하는 긴 문자열)

### 3단계: 리눅스 서버에 공개 키 등록

PuTTY로 서버에 접속한 후:

```bash
# .ssh 디렉토리 생성
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# authorized_keys 파일 편집
nano ~/.ssh/authorized_keys
```

Windows에서 복사한 공개 키를 붙여넣고 저장 (Ctrl+O, Enter, Ctrl+X)

```bash
# 권한 설정
chmod 600 ~/.ssh/authorized_keys

# 소유권 확인
ls -la ~/.ssh/
```

### 4단계: server-config.js 수정

```javascript
const fs = require('fs');

module.exports = {
    ssh: {
        host: '192.168.10.247',
        port: 22,
        username: 'apro',
        // 비밀번호 대신 SSH 키 사용
        privateKey: fs.readFileSync('C:\\Users\\apro\\.ssh\\id_rsa_dns'),
        // password: 'aproit!',  // 주석 처리
    },
    // ... 나머지 설정
};
```

### 5단계: 테스트

```bash
node test-ssh-simple.js
```

---

## ✅ 장점

- 🔒 더 안전함 (비밀번호 노출 위험 없음)
- ⚡ 더 빠름 (자동 인증)
- 🎯 비밀번호 특수문자 문제 해결

---

## 🔄 빠른 설정 (한 줄 명령)

Git Bash 또는 WSL이 있다면:

```bash
# 키 생성 및 서버에 복사 (한 번에)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_dns && ssh-copy-id -i ~/.ssh/id_rsa_dns.pub apro@192.168.10.247
```

---

## 💡 추천

SSH 키 방식을 사용하는 것을 강력히 권장합니다!
