// DNS 서버(리눅스)에서 앱을 실행할 때 사용하는 설정 예시
// 이 파일을 server-config.js 로 복사한 뒤 localMode: true 로 두고 실행하면
// SSH 없이 로컬 BIND 존 파일을 직접 읽고 써서 추가·삭제가 서버에 바로 반영됩니다.

module.exports = {
    // ★ 서버에서 실행 시 true (로컬 파일 직접 사용)
    localMode: true,

    ssh: {
        host: '127.0.0.1',
        port: 22,
        username: 'apro',
        // sudo 비밀번호 (로컬 모드에서 cat/mv/chown/rndc 에 사용)
        password: 'aproit1!',
        tryKeyboard: true,
    },

    bind: {
        zoneDir: '/etc/bind/zones',
        configFile: '/etc/bind/named.conf.local',
        defaultZone: 'aproele.com',
        namedCheckConf: '/usr/sbin/named-checkconf',
        namedCheckZone: '/usr/sbin/named-checkzone',
        rndc: '/usr/sbin/rndc',
    },

    web: {
        port: 3000,
        host: '0.0.0.0',  // 외부에서 접속하려면 0.0.0.0
    },
};
