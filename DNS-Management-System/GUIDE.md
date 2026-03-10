# DNS 관리 시스템 사용 가이드

## 시작하기

### 1. 서버 실행

Windows PowerShell에서:
```powershell
cd c:\Users\apro\DNS
powershell -ExecutionPolicy Bypass -Command "npm start"
```

또는 간단하게:
```bash
npm start
```

### 2. 웹 브라우저로 접속

브라우저를 열고 다음 주소로 접속하세요:
```
http://localhost:3000
```

### 3. 로그인

기본 관리자 계정으로 로그인:
- **사용자명**: `admin`
- **비밀번호**: `admin123`

## 주요 기능

### DNS 레코드 추가

1. 대시보드에서 **"새 레코드 추가"** 버튼 클릭
2. 레코드 정보 입력:
   - **레코드 타입**: A, AAAA, CNAME, MX, TXT, NS, PTR 중 선택
   - **레코드 이름**: 예) `www.example.com`
   - **값**: 예) `192.168.1.100`
   - **TTL**: 기본값 3600초 (1시간)
3. **저장** 버튼 클릭

### 레코드 타입별 예시

#### A 레코드 (IPv4 주소)
- **이름**: `www.example.com`
- **값**: `192.168.1.100`
- **TTL**: `3600`

#### CNAME 레코드 (별칭)
- **이름**: `blog.example.com`
- **값**: `www.example.com`
- **TTL**: `7200`

#### MX 레코드 (메일 서버)
- **이름**: `example.com`
- **값**: `mail.example.com`
- **우선순위**: `10`
- **TTL**: `3600`

#### TXT 레코드 (텍스트)
- **이름**: `example.com`
- **값**: `v=spf1 include:_spf.example.com ~all`
- **TTL**: `3600`

### DNS 레코드 수정

1. 레코드 목록에서 수정할 레코드의 **연필 아이콘** 클릭
2. 정보 수정
3. **저장** 버튼 클릭

### DNS 레코드 삭제

1. 레코드 목록에서 삭제할 레코드의 **휴지통 아이콘** 클릭
2. 확인 대화상자에서 **확인** 클릭

### 레코드 검색

상단의 검색창에 검색어를 입력하면 실시간으로 레코드가 필터링됩니다.
- 레코드 이름으로 검색
- IP 주소로 검색
- 레코드 타입으로 검색

### 통계 확인

좌측 메뉴에서 **"통계"** 탭을 클릭하면:
- 총 레코드 수
- DNS 존 수
- 활성 레코드 수

를 확인할 수 있습니다.

## 리눅스 DNS 서버 연동

이 웹 애플리케이션을 실제 리눅스 DNS 서버(BIND9)와 연동하려면:

### 1. BIND9 설치 (리눅스 서버)

```bash
sudo apt-get update
sudo apt-get install bind9 bind9utils bind9-doc
```

### 2. 존 파일 디렉토리 생성

```bash
sudo mkdir -p /etc/bind/zones
```

### 3. 예시 존 파일 생성

`/etc/bind/zones/db.example.com` 파일 생성:

```bind
$TTL    604800
@       IN      SOA     ns1.example.com. admin.example.com. (
                              2024021001         ; Serial
                              604800             ; Refresh
                              86400              ; Retry
                              2419200            ; Expire
                              604800 )           ; Negative Cache TTL
;
@       IN      NS      ns1.example.com.
@       IN      A       192.168.1.1
ns1     IN      A       192.168.1.1
www     IN      A       192.168.1.100
```

### 4. BIND9 설정 파일 수정

`/etc/bind/named.conf.local` 파일에 존 추가:

```bind
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
};
```

### 5. 권한 설정

```bash
sudo chown -R bind:bind /etc/bind/zones/
sudo chmod 775 /etc/bind/zones/
```

### 6. BIND9 재시작

```bash
sudo systemctl restart bind9
```

### 7. 서버 설정 확인

`server.js` 파일에서 BIND 경로가 올바른지 확인:

```javascript
const BIND_ZONE_DIR = '/etc/bind/zones';
const BIND_CONFIG = '/etc/bind/named.conf.local';
```

## 문제 해결

### 서버가 시작되지 않을 때

1. Node.js가 설치되어 있는지 확인:
   ```bash
   node --version
   npm --version
   ```

2. 의존성이 설치되어 있는지 확인:
   ```bash
   npm install
   ```

3. 포트 3000이 이미 사용 중인지 확인:
   ```bash
   netstat -ano | findstr :3000
   ```

### 로그인이 안 될 때

기본 계정 정보를 다시 확인하세요:
- 사용자명: `admin`
- 비밀번호: `admin123`

### DNS 레코드가 추가되지 않을 때

1. 브라우저 콘솔(F12)에서 오류 확인
2. 서버 터미널에서 오류 로그 확인
3. BIND9 서버와의 연결 확인

## 보안 권장사항

### 프로덕션 환경에서는:

1. **비밀번호 변경**: `login.js` 파일에서 기본 비밀번호를 변경하세요
2. **HTTPS 사용**: SSL/TLS 인증서를 설정하세요
3. **방화벽 설정**: 필요한 포트만 열어두세요
4. **접근 제한**: IP 기반 접근 제한을 설정하세요
5. **로그 모니터링**: 모든 DNS 변경 사항을 로그로 기록하세요

## 추가 기능 개발

이 시스템을 확장하려면:

1. **데이터베이스 연동**: 레코드를 데이터베이스에 저장
2. **사용자 관리**: 다중 사용자 및 권한 관리
3. **변경 이력**: DNS 레코드 변경 이력 추적
4. **백업/복원**: 자동 백업 및 복원 기능
5. **알림**: 중요한 변경사항에 대한 이메일 알림

## 지원

문제가 발생하면 README.md 파일을 참고하거나 시스템 관리자에게 문의하세요.
