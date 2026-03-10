# ⚠️ SSH 연결 문제 해결 가이드

## 현재 상황
- ✅ 서버 Ping 성공 (192.168.10.247)
- ❌ SSH 인증 실패

## 🔧 리눅스 서버에서 확인할 사항

### 1단계: SSH 서비스 상태 확인

리눅스 서버에 직접 접속하거나 콘솔에서 다음 명령 실행:

```bash
# SSH 서비스 상태 확인
sudo systemctl status ssh
# 또는
sudo systemctl status sshd

# SSH 서비스가 중지되어 있다면 시작
sudo systemctl start ssh
sudo systemctl enable ssh
```

### 2단계: SSH 설정 파일 확인

```bash
# SSH 설정 파일 편집
sudo nano /etc/ssh/sshd_config
```

다음 설정이 활성화되어 있는지 확인 (# 주석 제거):

```
PasswordAuthentication yes
PermitRootLogin yes  # 또는 PermitRootLogin prohibit-password
PubkeyAuthentication yes
ChallengeResponseAuthentication yes
```

변경 후 SSH 재시작:

```bash
sudo systemctl restart ssh
```

### 3단계: 사용자 확인

```bash
# apro 사용자 존재 확인
id apro

# 사용자가 없다면 생성
sudo adduser apro

# 비밀번호 설정
sudo passwd apro
# 비밀번호: aproit!
```

### 4단계: 방화벽 확인

```bash
# UFW 방화벽 상태 확인
sudo ufw status

# SSH 포트 허용
sudo ufw allow 22/tcp
sudo ufw allow ssh
```

### 5단계: SSH 로그 확인

```bash
# SSH 연결 시도 로그 확인
sudo tail -f /var/log/auth.log
# 또는
sudo journalctl -u ssh -f
```

Windows에서 다시 연결 시도하면서 로그를 확인하세요.

---

## 🔄 대안: SSH 키 기반 인증

비밀번호 인증이 계속 실패한다면 SSH 키를 사용하세요:

### Windows에서 SSH 키 생성

```powershell
# PowerShell에서 실행
ssh-keygen -t rsa -b 4096 -f C:\Users\apro\.ssh\id_rsa
```

### 공개 키를 서버에 복사

방법 1: 수동 복사
```bash
# Windows에서 공개 키 내용 확인
type C:\Users\apro\.ssh\id_rsa.pub
```

리눅스 서버에서:
```bash
# .ssh 디렉토리 생성
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# authorized_keys 파일에 공개 키 추가
nano ~/.ssh/authorized_keys
# Windows에서 복사한 공개 키 내용 붙여넣기

# 권한 설정
chmod 600 ~/.ssh/authorized_keys
```

방법 2: ssh-copy-id (Git Bash 또는 WSL에서)
```bash
ssh-copy-id apro@192.168.10.247
```

### server-config.js 수정

SSH 키 사용하도록 설정 변경:

```javascript
ssh: {
    host: '192.168.10.247',
    port: 22,
    username: 'apro',
    privateKey: require('fs').readFileSync('C:\\Users\\apro\\.ssh\\id_rsa'),
    // password: 'aproit!',  // 주석 처리
},
```

---

## 🧪 수동 SSH 테스트

Windows PowerShell 또는 CMD에서:

```bash
# SSH 클라이언트로 직접 연결 시도
ssh apro@192.168.10.247

# 포트 지정
ssh -p 22 apro@192.168.10.247

# 상세 디버그 모드
ssh -vvv apro@192.168.10.247
```

이 명령이 성공하면 SSH 서버는 정상이고, Node.js 코드 문제일 수 있습니다.

---

## 📞 다음 단계

1. ✅ 리눅스 서버에서 위의 1~5단계 확인
2. ✅ Windows에서 `ssh apro@192.168.10.247` 명령으로 수동 연결 테스트
3. ✅ 성공하면 `node test-ssh-simple.js` 다시 실행
4. ✅ 여전히 실패하면 SSH 키 기반 인증으로 전환

---

## 💡 빠른 해결책

가장 빠른 방법은 **리눅스 서버 콘솔에 직접 접속**하여:

```bash
# 1. SSH 서비스 재시작
sudo systemctl restart ssh

# 2. 비밀번호 인증 활성화 확인
sudo grep "PasswordAuthentication" /etc/ssh/sshd_config

# 3. 방화벽 SSH 허용
sudo ufw allow ssh

# 4. 테스트
ssh apro@localhost
```

모든 설정이 완료되면 Windows에서 다시 테스트하세요!
