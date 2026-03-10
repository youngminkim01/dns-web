// 리눅스 DNS 서버 연결 설정
module.exports = {
    // SSH 연결 정보
    ssh: {
        host: '192.168.10.243',
        port: 22,
        username: 'apro',
        password: 'aproit1!',
        tryKeyboard: true,
        // 또는 SSH 키 사용 시:
        // privateKey: require('fs').readFileSync('/path/to/private/key')
    },

    // BIND9 설정
    bind: {
        zoneDir: '/etc/bind/zones',
        configFile: '/etc/bind/named.conf.local',
        defaultZone: 'aproele.com',
        namedCheckConf: '/usr/sbin/named-checkconf',
        namedCheckZone: '/usr/sbin/named-checkzone',
        rndc: '/usr/sbin/rndc'
    },

    // 웹 서버 설정
    web: {
        port: 3000,
        host: 'localhost'
    }
};
