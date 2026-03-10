# 🔗 리눅스 DNS 서버 연결 가이드

## 서버 정보
- **IP 주소**: 192.168.10.247
- **포트**: 22
- **사용자**: apro
- **도메인**: aproele.com

---

## 📋 1단계: SSH 라이브러리 설치

Windows PC에서 실행:

```bash
cd c:\Users\apro\DNS\DNS-Management-System
npm install ssh2 --save
```

---

## 📋 2단계: 리눅스 서버 설정

### SSH로 서버 접속

```bash
ssh apro@192.168.10.247
```

비밀번호 입력: `aproit!`

### BIND9 설치 확인

```bash
# BIND9 설치 확인
which named

# 설치되어 있지 않다면 설치
sudo apt-get update
sudo apt-get install bind9 bind9utils bind9-doc -y
```

### 존 디렉토리 생성

```bash
# 존 파일 디렉토리 생성
sudo mkdir -p /etc/bind/zones

# 권한 설정
sudo chown -R bind:bind /etc/bind/zones/
sudo chmod 775 /etc/bind/zones/
```

### aproele.com 존 파일 생성

```bash
sudo nano /etc/bind/zones/db.aproele.com
```

다음 내용 입력:

```bind
$TTL    604800
@       IN      SOA     ns1.aproele.com. admin.aproele.com. (
                              2026021001         ; Serial
                              604800             ; Refresh
                              86400              ; Retry
                              2419200            ; Expire
                              604800 )           ; Negative Cache TTL
;
; 네임서버 레코드
@       IN      NS      ns1.aproele.com.

; A 레코드
@       IN      A       192.168.10.247
ns1     IN      A       192.168.10.247
www     IN      A       192.168.10.247
```

저장: `Ctrl + O`, `Enter`, `Ctrl + X`

### BIND9 설정 파일 수정

```bash
sudo nano /etc/bind/named.conf.local
```

다음 내용 추가:

```bind
zone "aproele.com" {
    type master;
    file "/etc/bind/zones/db.aproele.com";
};
```

저장: `Ctrl + O`, `Enter`, `Ctrl + X`

### 권한 설정

```bash
# apro 사용자를 bind 그룹에 추가
sudo usermod -a -G bind apro

# sudoers 설정
sudo visudo
```

파일 끝에 다음 줄 추가:

```
apro ALL=(ALL) NOPASSWD: /usr/sbin/rndc
apro ALL=(ALL) NOPASSWD: /usr/bin/tee
apro ALL=(ALL) NOPASSWD: /bin/sed
apro ALL=(ALL) NOPASSWD: /usr/sbin/named-checkzone
apro ALL=(ALL) NOPASSWD: /usr/sbin/named-checkconf
apro ALL=(ALL) NOPASSWD: /bin/systemctl status bind9
apro ALL=(ALL) NOPASSWD: /bin/systemctl restart bind9
```

저장: `Ctrl + O`, `Enter`, `Ctrl + X`

### 설정 검증 및 재시작

```bash
# 설정 파일 검증
sudo named-checkconf

# 존 파일 검증
sudo named-checkzone aproele.com /etc/bind/zones/db.aproele.com

# BIND9 재시작
sudo systemctl restart bind9

# 상태 확인
sudo systemctl status bind9
```

---

## 📋 3단계: Windows에서 연결 테스트

### 테스트 스크립트 실행

```bash
cd c:\Users\apro\DNS\DNS-Management-System
node test-connection.js
```

---

## 📋 4단계: 웹 애플리케이션 실행

```bash
npm start
```

브라우저에서 접속:
```
http://localhost:3000
```

로그인:
- 사용자명: `admin`
- 비밀번호: `adminit1!`

---

## 🧪 DNS 테스트

리눅스 서버에서:

```bash
# 로컬 DNS 쿼리 테스트
nslookup www.aproele.com localhost

# dig 명령으로 테스트
dig @localhost www.aproele.com

# 모든 레코드 조회
dig @localhost aproele.com ANY
```

Windows PC에서:

```bash
# DNS 서버 지정하여 조회
nslookup www.aproele.com 192.168.10.247
```

---

## 🔒 보안 참고사항

⚠️ **중요**: 
- 비밀번호가 코드에 하드코딩되어 있습니다.
- 프로덕션 환경에서는 환경 변수나 암호화된 설정 파일 사용을 권장합니다.
- SSH 키 기반 인증을 사용하는 것이 더 안전합니다.

### SSH 키 생성 (선택사항)

Windows PC에서:

```bash
ssh-keygen -t rsa -b 4096
```

공개 키를 서버에 복사:

```bash
type %USERPROFILE%\.ssh\id_rsa.pub | ssh apro@192.168.10.247 "cat >> ~/.ssh/authorized_keys"
```

---

## ❌ 문제 해결

### SSH 연결 실패

```bash
# Windows 방화벽 확인
# 리눅스 서버 방화벽 확인
sudo ufw status
sudo ufw allow 22/tcp
```

### BIND9 재로드 실패

```bash
# 로그 확인
sudo tail -f /var/log/syslog | grep named

# 설정 검증
sudo named-checkconf
sudo named-checkzone aproele.com /etc/bind/zones/db.aproele.com
```

### 권한 오류

```bash
# 파일 권한 확인
ls -la /etc/bind/zones/

# 권한 재설정
sudo chown -R bind:bind /etc/bind/zones/
sudo chmod 775 /etc/bind/zones/
sudo chmod 664 /etc/bind/zones/*
```

---

## 📞 다음 단계

1. ✅ SSH 라이브러리 설치
2. ✅ 리눅스 서버 BIND9 설정
3. ✅ 연결 테스트
4. ✅ 웹 애플리케이션에서 DNS 레코드 추가 테스트

모든 설정이 완료되면 웹 브라우저에서 DNS 레코드를 추가/수정/삭제할 수 있습니다!
