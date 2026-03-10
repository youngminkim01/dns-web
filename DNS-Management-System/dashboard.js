// 인증 확인
function checkAuth() {
    const localUser = localStorage.getItem('dnsUser');
    const sessionUser = sessionStorage.getItem('dnsUser');

    if (!localUser && !sessionUser) {
        window.location.href = 'index.html';
        return null;
    }

    return JSON.parse(localUser || sessionUser);
}

// 페이지 로드 시 인증 확인
const currentUser = checkAuth();
if (currentUser) {
    document.getElementById('userName').textContent = currentUser.username;
}

// DNS 레코드 데이터 (실제로는 서버에서 가져와야 함)
let dnsRecords = [
    { id: 1, type: 'A', name: 'www.example.com', value: '192.168.1.100', ttl: 3600, status: 'active' },
    { id: 2, type: 'A', name: 'mail.example.com', value: '192.168.1.101', ttl: 3600, status: 'active' },
    { id: 3, type: 'CNAME', name: 'blog.example.com', value: 'www.example.com', ttl: 7200, status: 'active' },
    { id: 4, type: 'MX', name: 'example.com', value: 'mail.example.com', ttl: 3600, status: 'active', priority: 10 },
    { id: 5, type: 'TXT', name: 'example.com', value: 'v=spf1 include:_spf.example.com ~all', ttl: 3600, status: 'active' }
];

let dnsZones = [
    { id: 1, name: 'example.com', records: 5, type: 'Primary' },
    { id: 2, name: 'test.local', records: 3, type: 'Primary' },
    { id: 3, name: 'internal.net', records: 8, type: 'Secondary' }
];

let currentEditId = null;

// 레코드 테이블 렌더링
function renderRecords(records = dnsRecords) {
    const tbody = document.getElementById('recordsTableBody');
    tbody.innerHTML = '';

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="record-type">${record.type}</span></td>
            <td>${record.name}</td>
            <td>${record.value}</td>
            <td>${record.ttl}s</td>
            <td>
                <span class="record-status ${record.status}">
                    <span class="record-status-dot"></span>
                    ${record.status === 'active' ? '활성' : '비활성'}
                </span>
            </td>
            <td>
                <div class="record-actions">
                    <button class="btn-icon btn-edit" onclick="editRecord(${record.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteRecord(${record.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateStats();
}

// DNS 존 렌더링
function renderZones() {
    const grid = document.getElementById('zonesGrid');
    grid.innerHTML = '';

    dnsZones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        card.innerHTML = `
            <h3>${zone.name}</h3>
            <p>${zone.type} Zone</p>
            <div class="zone-stats">
                <div class="zone-stat">
                    <div class="zone-stat-label">레코드</div>
                    <div class="zone-stat-value">${zone.records}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 통계 업데이트
function updateStats() {
    document.getElementById('totalRecords').textContent = dnsRecords.length;
    document.getElementById('totalZones').textContent = dnsZones.length;
    document.getElementById('activeRecords').textContent = dnsRecords.filter(r => r.status === 'active').length;
}

// 검색 기능
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = dnsRecords.filter(record =>
        record.name.toLowerCase().includes(searchTerm) ||
        record.value.toLowerCase().includes(searchTerm) ||
        record.type.toLowerCase().includes(searchTerm)
    );
    renderRecords(filtered);
});

// 탭 전환
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // 모든 탭 비활성화
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        // 선택한 탭 활성화
        item.classList.add('active');
        const tabName = item.dataset.tab;
        document.getElementById(tabName + 'Tab').classList.add('active');

        // 페이지 제목 변경
        const titles = {
            'records': 'DNS 레코드 관리',
            'zones': 'DNS 존 관리',
            'stats': '통계 및 현황'
        };
        document.getElementById('pageTitle').textContent = titles[tabName];

        // 존 탭이면 렌더링
        if (tabName === 'zones') {
            renderZones();
        }
    });
});

// 모달 관련
const modal = document.getElementById('recordModal');
const addRecordBtn = document.getElementById('addRecordBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const recordForm = document.getElementById('recordForm');
const recordType = document.getElementById('recordType');
const priorityGroup = document.getElementById('priorityGroup');

// 레코드 타입 변경 시 우선순위 필드 표시/숨김
recordType.addEventListener('change', (e) => {
    if (e.target.value === 'MX') {
        priorityGroup.style.display = 'block';
    } else {
        priorityGroup.style.display = 'none';
    }
});

// 새 레코드 추가 버튼
addRecordBtn.addEventListener('click', () => {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = '새 DNS 레코드 추가';
    recordForm.reset();
    priorityGroup.style.display = 'none';
    modal.classList.add('show');
});

// 모달 닫기
closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
});

cancelBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

// 모달 외부 클릭 시 닫기
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// 레코드 폼 제출
recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(recordForm);
    const recordData = {
        type: formData.get('type'),
        name: formData.get('name'),
        value: formData.get('value'),
        ttl: parseInt(formData.get('ttl')),
        status: 'active'
    };

    if (recordData.type === 'MX') {
        recordData.priority = parseInt(formData.get('priority'));
    }

    if (currentEditId) {
        // 수정
        const index = dnsRecords.findIndex(r => r.id === currentEditId);
        dnsRecords[index] = { ...dnsRecords[index], ...recordData };

        // 실제 DNS 서버 업데이트 (API 호출)
        await updateDNSRecord(currentEditId, recordData);
    } else {
        // 추가
        const newRecord = {
            id: Math.max(...dnsRecords.map(r => r.id), 0) + 1,
            ...recordData
        };
        dnsRecords.push(newRecord);

        // 실제 DNS 서버에 추가 (API 호출)
        await addDNSRecord(newRecord);
    }

    renderRecords();
    modal.classList.remove('show');
    recordForm.reset();
});

// 레코드 수정
function editRecord(id) {
    const record = dnsRecords.find(r => r.id === id);
    if (!record) return;

    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'DNS 레코드 수정';
    document.getElementById('recordType').value = record.type;
    document.getElementById('recordName').value = record.name;
    document.getElementById('recordValue').value = record.value;
    document.getElementById('recordTTL').value = record.ttl;

    if (record.type === 'MX') {
        priorityGroup.style.display = 'block';
        document.getElementById('recordPriority').value = record.priority || 10;
    } else {
        priorityGroup.style.display = 'none';
    }

    modal.classList.add('show');
}

// 레코드 삭제
async function deleteRecord(id) {
    if (!confirm('이 DNS 레코드를 삭제하시겠습니까?')) return;

    const index = dnsRecords.findIndex(r => r.id === id);
    if (index !== -1) {
        const record = dnsRecords[index];
        dnsRecords.splice(index, 1);

        // 실제 DNS 서버에서 삭제 (API 호출)
        await deleteDNSRecord(record);

        renderRecords();
    }
}

// DNS 서버 API 함수들
async function addDNSRecord(record) {
    try {
        const response = await fetch('/api/dns/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            throw new Error('DNS 레코드 추가 실패');
        }

        console.log('DNS 레코드가 추가되었습니다:', record);
    } catch (error) {
        console.error('DNS 레코드 추가 중 오류:', error);
        alert('DNS 레코드 추가에 실패했습니다. 서버 연결을 확인하세요.');
    }
}

async function updateDNSRecord(id, record) {
    try {
        const response = await fetch(`/api/dns/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            throw new Error('DNS 레코드 수정 실패');
        }

        console.log('DNS 레코드가 수정되었습니다:', record);
    } catch (error) {
        console.error('DNS 레코드 수정 중 오류:', error);
        alert('DNS 레코드 수정에 실패했습니다. 서버 연결을 확인하세요.');
    }
}

async function deleteDNSRecord(record) {
    try {
        const response = await fetch('/api/dns/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            throw new Error('DNS 레코드 삭제 실패');
        }

        console.log('DNS 레코드가 삭제되었습니다:', record);
    } catch (error) {
        console.error('DNS 레코드 삭제 중 오류:', error);
        alert('DNS 레코드 삭제에 실패했습니다. 서버 연결을 확인하세요.');
    }
}

// 로그아웃
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('dnsUser');
        sessionStorage.removeItem('dnsUser');
        window.location.href = 'index.html';
    }
});

// 초기 렌더링
renderRecords();
updateStats();
