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

// DNS 레코드 데이터 (서버에서 가져옴)
let dnsRecords = [];

let dnsZones = [];

// 서버에서 DNS 레코드 불러오기
async function loadDNSRecords() {
    try {
        // 서버 API는 querystring 이름으로 zone 을 사용하므로 맞춰준다.
        // 실제 운영 중인 존 이름에 맞게 필요하면 이 값을 수정하면 된다.
        const response = await fetch('/api/dns/records?zone=aproele.com');

        if (!response.ok) {
            throw new Error('DNS 레코드 조회 실패');
        }

        const data = await response.json();

        if (data.success && data.records) {
            dnsRecords = data.records;
            renderRecords();
            console.log('✓ DNS 레코드를 서버에서 불러왔습니다:', dnsRecords.length, '개');
        }
    } catch (error) {
        console.error('DNS 레코드 불러오기 오류:', error);
        // 오류 발생 시 샘플 데이터 사용
        dnsRecords = [
            { id: 1, type: 'A', name: 'www.example.com', value: '192.168.1.100', ttl: 3600, status: 'active' },
            { id: 2, type: 'A', name: 'mail.example.com', value: '192.168.1.101', ttl: 3600, status: 'active' },
            { id: 3, type: 'CNAME', name: 'blog.example.com', value: 'www.example.com', ttl: 7200, status: 'active' },
            { id: 4, type: 'MX', name: 'example.com', value: 'mail.example.com', ttl: 3600, status: 'active', priority: 10 },
            { id: 5, type: 'TXT', name: 'example.com', value: 'v=spf1 include:_spf.example.com ~all', ttl: 3600, status: 'active' }
        ];
        renderRecords();
        console.warn('⚠ 서버 연결 실패. 샘플 데이터를 사용합니다.');
    }
}

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
            <td>
                <span class="record-status ${record.status}">
                    <span class="record-status-dot"></span>
                    ${record.status === 'active' ? '활성' : '비활성'}
                </span>
            </td>
            <td>
                <div class="record-actions">
                    <button class="btn-icon btn-edit" onclick="openEditModal(${record.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
}

// DNS 존 렌더링 및 통계 함수 삭제됨

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
            'records': '조회된 DNS 레코드 관리'
        };
        if (titles[tabName]) {
            document.getElementById('pageTitle').textContent = titles[tabName];
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

let editingRecordId = null;

// 새 레코드 추가 버튼
addRecordBtn.addEventListener('click', () => {
    editingRecordId = null;
    document.getElementById('modalTitle').textContent = '새 DNS 레코드 추가';
    recordForm.reset();
    priorityGroup.style.display = 'none';
    modal.classList.add('show');
});

// 수정 모달 열기
function openEditModal(id) {
    const record = dnsRecords.find(r => r.id === id);
    if (!record) return;

    editingRecordId = id;
    document.getElementById('modalTitle').textContent = 'DNS 레코드 수정';

    document.getElementById('recordType').value = record.type;
    document.getElementById('recordName').value = record.name;
    document.getElementById('recordValue').value = record.value;

    if (record.type === 'MX') {
        priorityGroup.style.display = 'block';
        document.getElementById('recordPriority').value = record.priority || 10;
    } else {
        priorityGroup.style.display = 'none';
        document.getElementById('recordPriority').value = 10;
    }

    modal.classList.add('show');
}

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
        status: 'active'
    };

    if (recordData.type === 'MX') {
        recordData.priority = parseInt(formData.get('priority'));
    }

    try {
        if (editingRecordId) {
            const oldRecord = dnsRecords.find(r => r.id === editingRecordId);
            await editDNSRecord(oldRecord, recordData);
            alert('DNS 레코드가 성공적으로 수정되었습니다.');
        } else {
            await addDNSRecord(recordData);
            alert('DNS 레코드가 성공적으로 추가되었습니다.');
        }

        await loadDNSRecords();
        modal.classList.remove('show');
        recordForm.reset();
        editingRecordId = null;
    } catch (error) {
        console.error('레코드 저장 오류:', error);
        // 하위 함수에서 이미 alert를 띄우므로 여기서 무시하거나 추가 로직 처리 가능
    }
});

// 레코드 삭제
async function deleteRecord(id) {
    if (!confirm('이 DNS 레코드를 삭제하시겠습니까?')) return;

    const record = dnsRecords.find(r => r.id === id);
    if (!record) return;

    try {
        // 실제 DNS 서버에서 삭제 (API 호출)
        await deleteDNSRecord(record);

        alert('DNS 레코드가 성공적으로 삭제되었습니다.');

        // 서버에서 최신 레코드 목록 다시 불러오기
        await loadDNSRecords();
    } catch (error) {
        console.error('레코드 삭제 오류:', error);
        alert('레코드 삭제 중 오류가 발생했습니다.');
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
        throw error;
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
        throw error;
    }
}

async function editDNSRecord(oldRecord, newRecord) {
    try {
        const response = await fetch('/api/dns/edit', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldRecord, newRecord })
        });

        if (!response.ok) {
            throw new Error('DNS 레코드 수정 실패');
        }

        console.log('DNS 레코드가 수정되었습니다:', newRecord);
    } catch (error) {
        console.error('DNS 레코드 수정 중 오류:', error);
        alert('DNS 레코드 수정에 실패했습니다. 서버 연결을 확인하세요.');
        throw error;
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

// 초기 렌더링 - 서버에서 DNS 레코드 불러오기
loadDNSRecords();
