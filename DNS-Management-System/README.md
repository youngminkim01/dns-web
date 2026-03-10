# DNS 관리 시스템

리눅스 DNS 서버(BIND9)를 웹 인터페이스로 관리할 수 있는 시스템입니다.

## 기능

- 🔐 **로그인 인증** - 관리자 로그인 시스템
- 📝 **DNS 레코드 관리** - A, AAAA, CNAME, MX, TXT, NS, PTR 레코드 추가/수정/삭제
- 📊 **통계 대시보드** - DNS 레코드 및 존 통계
- 🔍 **검색 기능** - 레코드 실시간 검색
- 🎨 **모던 UI** - 반응형 디자인

## 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. BIND9 설정 (리눅스 서버)

BIND9가 설치되어 있어야 합니다:

```bash
sudo apt-get update
sudo apt-get install bind9 bind9utils bind9-doc
```

### 3. 권한 설정

서버가 BIND9 설정 파일을 수정할 수 있도록 권한을 설정합니다:

```bash
# 사용자를 bind 그룹에 추가
sudo usermod -a -G bind $USER

# 존 파일 디렉토리 권한 설정
sudo chmod 775 /etc/bind/zones
sudo chown -R bind:bind /etc/bind/zones
```

### 4. sudoers 설정

rndc 명령을 비밀번호 없이 실행할 수 있도록 설정:

```bash
sudo visudo
```

다음 줄을 추가:
```
yourusername ALL=(ALL) NOPASSWD: /usr/sbin/rndc
```

## 실행 방법

### 개발 모드
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

서버가 시작되면 브라우저에서 `http://localhost:3000`으로 접속하세요.

## 기본 로그인 정보

- **사용자명**: admin
- **비밀번호**: admin123

## 프로젝트 구조

```
DNS/
├── index.html          # 로그인 페이지
├── dashboard.html      # 대시보드 페이지
├── style.css           # 스타일시트
├── login.js            # 로그인 로직
├── dashboard.js        # 대시보드 로직
├── server.js           # Express 백엔드 서버
├── package.json        # Node.js 의존성
└── README.md           # 문서
```

## API 엔드포인트

### DNS 레코드 추가
```
POST /api/dns/add
Content-Type: application/json

{
  "type": "A",
  "name": "www.example.com",
  "value": "192.168.1.100",
  "ttl": 3600
}
```

### DNS 레코드 수정
```
PUT /api/dns/update/:id
Content-Type: application/json

{
  "type": "A",
  "name": "www.example.com",
  "value": "192.168.1.101",
  "ttl": 3600
}
```

### DNS 레코드 삭제
```
DELETE /api/dns/delete
Content-Type: application/json

{
  "name": "www.example.com",
  "type": "A",
  "value": "192.168.1.100"
}
```

### DNS 레코드 조회
```
GET /api/dns/records?zone=example.com
```

## 주의사항

1. **보안**: 프로덕션 환경에서는 반드시 강력한 비밀번호를 사용하고, HTTPS를 설정하세요.
2. **백업**: DNS 설정 파일을 수정하기 전에 항상 백업하세요.
3. **권한**: 서버가 BIND9 설정 파일에 접근할 수 있는 적절한 권한이 필요합니다.
4. **테스트**: 프로덕션 환경에 적용하기 전에 테스트 환경에서 충분히 테스트하세요.

## 문제 해결

### BIND9 재로드 실패
```bash
# BIND9 상태 확인
sudo systemctl status bind9

# BIND9 설정 검증
sudo named-checkconf

# 존 파일 검증
sudo named-checkzone example.com /etc/bind/zones/db.example.com
```

### 권한 오류
```bash
# 파일 권한 확인
ls -la /etc/bind/zones/

# 권한 재설정
sudo chown -R bind:bind /etc/bind/zones/
sudo chmod 775 /etc/bind/zones/
```

## 라이선스

MIT License

## 지원

문제가 발생하면 이슈를 등록해주세요.
