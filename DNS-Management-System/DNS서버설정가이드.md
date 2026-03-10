# 🔧 DNS 서버 설정 문제 해결 가이드

## 발견된 문제

### ✅ 정상
- aproele.com 존 파일 존재: `/etc/bind/zones/db.aproele.com`

### ❌ 문제
1. **존 파일이 비어있음** - 레코드가 0개
2. **BIND9 서비스가 실행되지 않음**
3. **named.conf.local에 aproele.com 존 설정이 없음**

---

## 해결 방법

### 1단계: DNS 서버에 SSH 접속
```bash
ssh apro@192.168.10.247
```

### 2단계: aproele.com 존 파일 생성

```bash
sudo nano /etc/bind/zones/db.aproele.com
```

다음 내용을 입력하세요:

```bind
;
; BIND data file for aproele.com
;
$TTL    3600
@       IN      SOA     ns1.aproele.com. admin.aproele.com. (
                        2026021001      ; Serial (YYYYMMDDNN)
                        3600            ; Refresh
                        1800            ; Retry
                        604800          ; Expire
                        86400 )         ; Negative Cache TTL
;
; Name servers
@       IN      NS      ns1.aproele.com.

; A records
ns1     IN      A       192.168.10.247
www     IN      A       192.168.10.100
mail    IN      A       192.168.10.101

; CNAME records
ftp     IN      CNAME   www.aproele.com.

; MX records
@       IN      MX      10 mail.aproele.com.
```

저장: `Ctrl+X` → `Y` → `Enter`

### 3단계: named.conf.local에 존 설정 추가

```bash
sudo nano /etc/bind/named.conf.local
```

다음 내용을 추가하세요:

```bind
zone "aproele.com" {
    type master;
    file "/etc/bind/zones/db.aproele.com";
    allow-update { none; };
};
```

저장: `Ctrl+X` → `Y` → `Enter`

### 4단계: 파일 권한 설정

```bash
sudo chown bind:bind /etc/bind/zones/db.aproele.com
sudo chmod 644 /etc/bind/zones/db.aproele.com
```

### 5단계: 설정 검증

```bash
# BIND 설정 파일 검증
sudo named-checkconf

# 존 파일 검증
sudo named-checkzone aproele.com /etc/bind/zones/db.aproele.com
```

### 6단계: BIND9 서비스 시작

```bash
# BIND9 시작
sudo systemctl start bind9

# 상태 확인
sudo systemctl status bind9

# 부팅 시 자동 시작 설정
sudo systemctl enable bind9
```

### 7단계: 방화벽 설정 (필요시)

```bash
# DNS 포트 허용 (53번)
sudo ufw allow 53/tcp
sudo ufw allow 53/udp
```

---

## 빠른 설정 스크립트

모든 단계를 한 번에 실행하려면 다음 스크립트를 사용하세요:

```bash
# 1. 존 파일 생성
sudo tee /etc/bind/zones/db.aproele.com > /dev/null << 'EOF'
;
; BIND data file for aproele.com
;
$TTL    3600
@       IN      SOA     ns1.aproele.com. admin.aproele.com. (
                        2026021001      ; Serial
                        3600            ; Refresh
                        1800            ; Retry
                        604800          ; Expire
                        86400 )         ; Negative Cache TTL
;
@       IN      NS      ns1.aproele.com.
ns1     IN      A       192.168.10.247
www     IN      A       192.168.10.100
mail    IN      A       192.168.10.101
ftp     IN      CNAME   www.aproele.com.
@       IN      MX      10 mail.aproele.com.
EOF

# 2. named.conf.local에 존 추가
sudo tee -a /etc/bind/named.conf.local > /dev/null << 'EOF'

zone "aproele.com" {
    type master;
    file "/etc/bind/zones/db.aproele.com";
    allow-update { none; };
};
EOF

# 3. 권한 설정
sudo chown bind:bind /etc/bind/zones/db.aproele.com
sudo chmod 644 /etc/bind/zones/db.aproele.com

# 4. 설정 검증
echo "=== 설정 검증 ==="
sudo named-checkconf && echo "✅ named.conf 정상"
sudo named-checkzone aproele.com /etc/bind/zones/db.aproele.com

# 5. BIND9 재시작
sudo systemctl restart bind9
sudo systemctl enable bind9

# 6. 상태 확인
echo "=== BIND9 상태 ==="
sudo systemctl status bind9
```

---

## 설정 완료 후 테스트

### DNS 서버에서 테스트
```bash
# 로컬 테스트
nslookup www.aproele.com localhost
dig @localhost www.aproele.com
```

### 윈도우에서 테스트
```powershell
# PowerShell에서
nslookup www.aproele.com 192.168.10.247
```

---

## 웹 인터페이스에서 확인

설정 완료 후:

1. 웹 브라우저에서 `http://localhost:3000` 접속
2. 로그인 (admin / admin123)
3. 대시보드에서 DNS 레코드 목록 확인
4. 이제 aproele.com의 레코드들이 표시됩니다!

---

## 문제 해결

### BIND9가 시작되지 않는 경우
```bash
# 로그 확인
sudo journalctl -u bind9 -n 50

# 또는
sudo tail -f /var/log/syslog | grep named
```

### 존 파일 오류
```bash
# 존 파일 문법 검사
sudo named-checkzone aproele.com /etc/bind/zones/db.aproele.com
```

### 권한 오류
```bash
# 모든 존 파일 권한 재설정
sudo chown -R bind:bind /etc/bind/zones/
sudo chmod 755 /etc/bind/zones/
sudo chmod 644 /etc/bind/zones/*
```

---

**작성일**: 2026-02-10  
**다음 단계**: 위 설정을 완료한 후 웹 인터페이스를 새로고침하세요!
