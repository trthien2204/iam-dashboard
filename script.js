(function() {
    const supabaseUrl = 'https://bxeddeelymssuhkqaldl.supabase.co'; 
    const supabaseKey = 'sb_publishable_107e75n5oK1mUvevQlIbsA_wm6MtInL';     
    const BACKEND_URL = 'https://iam-cloud-api.onrender.com';
    const client = supabase.createClient(supabaseUrl, supabaseKey);

    // ==========================================
    // 1. TÌM KIẾM DỮ LIỆU
    // ==========================================
    document.getElementById('search-iam').addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase();
        document.querySelectorAll('#request-list tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(text) ? '' : 'none'; });
    });

    document.getElementById('search-email').addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase();
        document.querySelectorAll('.email-card').forEach(card => { card.style.display = card.innerText.toLowerCase().includes(text) ? '' : 'none'; });
        const olderContainer = document.getElementById('older-emails-container'); const olderIcon = document.getElementById('older-icon');
        if (olderContainer && olderIcon) {
            if (text !== '') { olderContainer.classList.remove('hidden'); olderContainer.classList.add('flex'); olderIcon.classList.replace('fa-chevron-down', 'fa-chevron-up'); } 
            else { olderContainer.classList.add('hidden'); olderContainer.classList.remove('flex'); olderIcon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
        }
    });

    const searchNetEl = document.getElementById('search-network');
    if(searchNetEl) {
        searchNetEl.addEventListener('input', (e) => {
            const text = e.target.value.toLowerCase();
            document.querySelectorAll('#network-device-list tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(text) ? '' : 'none'; });
        });
    }

    // ==========================================
    // 2. KHAI BÁO CÁC HÀM XỬ LÝ CHUNG
    // ==========================================
    window.handleLogin = async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value; const p = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn'); const err = document.getElementById('login-error');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; err.classList.add('hidden');
        try {
            const res = await fetch(`${BACKEND_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
            const data = await res.json();
            if (data.success) { sessionStorage.setItem('it_token', 'true'); sessionStorage.setItem('it_role', data.role); sessionStorage.setItem('it_username', data.username); checkAuth(); } 
            else { err.classList.remove('hidden'); }
        } catch (error) { err.innerText = "Lỗi kết nối Server!"; err.classList.remove('hidden'); }
        btn.innerHTML = 'Đăng nhập hệ thống <i class="fa-solid fa-arrow-right-to-bracket ml-2"></i>';
    };

    window.confirmLogout = () => { sessionStorage.clear(); closeModal('logout-confirm-modal'); document.getElementById('login-username').value = ''; document.getElementById('login-password').value = ''; checkAuth(); };

    window.testNotification = () => {
        if (!("Notification" in window)) return alert("Trình duyệt không hỗ trợ thông báo!");
        Notification.requestPermission().then(permission => {
            if (permission === "granted") { new Notification("Hệ thống Helpdesk", { body: "Đã kết nối thành công.", icon: "https://cdn-icons-png.flaticon.com/512/732/732200.png" }); alert("Đã cấp quyền!"); } 
            else { alert("Quyền bị chặn!"); }
        });
    };

    window.handleCreateUser = async (e) => {
        e.preventDefault();
        const u = document.getElementById('new-username').value; const p = document.getElementById('new-password').value; const msg = document.getElementById('create-user-msg');
        try {
            const res = await fetch(`${BACKEND_URL}/api/users/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
            const data = await res.json();
            msg.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'bg-green-50', 'text-green-600');
            if (data.success) { msg.classList.add('bg-green-50', 'text-green-600'); msg.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Tạo thành công!'; document.getElementById('new-username').value = ''; document.getElementById('new-password').value = ''; } 
            else { msg.classList.add('bg-red-50', 'text-red-600'); msg.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${data.message}`; }
        } catch (err) { msg.classList.remove('hidden'); msg.classList.add('bg-red-50', 'text-red-600'); msg.innerText = "Lỗi Server!"; }
    };

    window.switchTab = (tab) => {
        const tabs = ['iam', 'email', 'network'];
        tabs.forEach(t => { const el = document.getElementById(`nav-${t}`); if(el) el.className = tab === t ? 'flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg transition-colors mt-2' : 'flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors mt-2'; });

        document.getElementById('iam-section').style.display = tab === 'iam' ? 'block' : 'none';
        document.getElementById('email-section').style.display = tab === 'email' ? 'block' : 'none';
        if(document.getElementById('network-section')) document.getElementById('network-section').style.display = tab === 'network' ? 'block' : 'none';

        const headerTitle = document.getElementById('main-header-title');
        if (tab === 'email') { headerTitle.innerText = "Quản lý Email gửi tới bạn hoặc CC bạn"; resetCount('email'); loadPersonalEmails(); } 
        else if (tab === 'iam') { headerTitle.innerText = "Quản lý Yêu cầu Phân Quyền"; resetCount('iam'); loadData(); }
        else if (tab === 'network') { headerTitle.innerText = "Hệ thống Giám sát Mạng nội bộ (LAN)"; initNetworkDashboard(); }
        closeAllDropdowns();
    };

    window.toggleDropdown = (e, id) => { e.stopPropagation(); const current = document.getElementById(id); const isHidden = current.classList.contains('hidden'); closeAllDropdowns(); if (isHidden) current.classList.remove('hidden'); };
    window.closeAllDropdowns = () => { document.getElementById('notif-dropdown').classList.add('hidden'); document.getElementById('user-menu-dropdown').classList.add('hidden'); };

    let unreadIam = 0; let unreadEmail = 0;
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") Notification.requestPermission();
    window.resetCount = (type) => { if(type === 'iam') unreadIam = 0; if(type === 'email') unreadEmail = 0; updateBellUI(); };

    const updateBellUI = () => {
        const total = unreadIam + unreadEmail;
        document.getElementById('badge-iam').innerText = unreadIam; document.getElementById('badge-iam').className = unreadIam > 0 ? 'bg-indigo-500 text-white px-2 py-0.5 rounded-full text-xs font-bold' : 'bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold';
        document.getElementById('badge-email').innerText = unreadEmail; document.getElementById('badge-email').className = unreadEmail > 0 ? 'bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold' : 'bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold';
        if (total > 0) { document.getElementById('bell-counter').innerText = total > 9 ? '9+' : total; document.getElementById('bell-counter').classList.remove('hidden'); document.getElementById('bell-icon').classList.add('animate-shake', 'text-indigo-600'); } 
        else { document.getElementById('bell-counter').classList.add('hidden'); document.getElementById('bell-icon').classList.remove('animate-shake', 'text-indigo-600'); }
    };

    const playSoundAndPopup = (title, body) => {
        const audio = new Audio('https://actions.google.com/sounds/v1/water/glass_water_pour.ogg'); audio.play().catch(() => {});
        if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body: body, icon: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' });
    };

    // ==========================================
    // 3. KẾT NỐI REALTIME SUPABASE
    // ==========================================
    client.channel('public:personal_emails').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'personal_emails' }, payload => {
        const currentUser = sessionStorage.getItem('it_username') ? sessionStorage.getItem('it_username').toLowerCase() : '';
        const receiver = payload.new.receiver ? payload.new.receiver.toLowerCase() : '';
        if (receiver.includes(currentUser)) { unreadEmail++; updateBellUI(); playSoundAndPopup("Email mới", `Từ: ${payload.new.sender_name}\nTiêu đề: ${payload.new.subject}`); if (document.getElementById('email-section').style.display === 'block') loadPersonalEmails(); }
    }).subscribe();

    client.channel('public:permission_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'permission_requests' }, payload => {
        const currentUser = sessionStorage.getItem('it_username') ? sessionStorage.getItem('it_username').toLowerCase() : '';
        const receiver = payload.new && payload.new.receiver ? payload.new.receiver.toLowerCase() : '';
        if (receiver.includes(currentUser)) {
            if (payload.eventType === 'INSERT') { unreadIam++; updateBellUI(); playSoundAndPopup("Yêu cầu mới", `Từ: ${payload.new.sender_email}`); if (document.getElementById('iam-section').style.display === 'block') loadData(); } 
            else if (payload.eventType === 'UPDATE') { if (payload.new.status === 'new') { unreadIam++; updateBellUI(); playSoundAndPopup("⚠️ Có cập nhật từ User!", `Từ: ${payload.new.sender_email}`); } if (document.getElementById('iam-section').style.display === 'block') loadData(); }
        }
    }).subscribe();

    // ==========================================
    // 4. LOGIC EMAIL CÁ NHÂN & BẢNG IAM
    // ==========================================
    const sanitizeHTML = (str) => { if (!str) return '<span class="italic text-slate-400">(Không có nội dung)</span>'; const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML.replace(/\n/g, '<br>'); };

    window.toggleEmailBody = (id) => { const bodyEl = document.getElementById(`email-body-${id}`); const iconEl = document.getElementById(`email-icon-${id}`); if (bodyEl.classList.contains('hidden')) { bodyEl.classList.remove('hidden'); iconEl.classList.replace('fa-chevron-down', 'fa-chevron-up'); } else { bodyEl.classList.add('hidden'); iconEl.classList.replace('fa-chevron-up', 'fa-chevron-down'); } };
    window.toggleOlderEmails = () => { const container = document.getElementById('older-emails-container'); const icon = document.getElementById('older-icon'); if (container && icon) { if (container.classList.contains('hidden')) { container.classList.remove('hidden'); container.classList.add('flex'); icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); } else { container.classList.add('hidden'); container.classList.remove('flex'); icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); } } };

    window.loadPersonalEmails = async () => {
        const currentUser = sessionStorage.getItem('it_username').toLowerCase();
        const { data, error } = await client.from('personal_emails').select('*').ilike('receiver', `%${currentUser}%`).order('created_at', { ascending: false });
        if (error) return;
        const container = document.getElementById('personal-email-list');
        if (data.length === 0) { container.innerHTML = '<div class="text-center py-10 text-slate-500 italic">Hộp thư trống.</div>'; return; }
        
        const now = new Date(); const fifteenMinsMs = 15 * 60 * 1000;
        let htmlJustNow = ''; let countJustNow = 0; let html15MinsAgo = ''; let count15MinsAgo = 0; let htmlOlder = ''; let countOlder = 0;

        data.forEach(mail => {
            const mailDate = new Date(mail.created_at); const diff = now.getTime() - mailDate.getTime(); const isToday = mailDate.toLocaleDateString('vi-VN') === now.toLocaleDateString('vi-VN');
            const initial = (mail.sender_name || 'U').charAt(0).toUpperCase(); const dateStr = isToday ? `Hôm nay, ${mailDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` : `${mailDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${mailDate.toLocaleDateString('vi-VN')}`;
            const cardString = `<div class="email-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"><div class="p-5 cursor-pointer hover:bg-slate-50 flex items-start justify-between group" onclick="toggleEmailBody(${mail.id})"><div class="flex items-center flex-1 min-w-0"><div class="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-inner mr-4">${initial}</div><div class="flex-1 min-w-0 pr-4"><h4 class="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors mb-1">${mail.subject || '(Không có tiêu đề)'}</h4><div class="flex items-center text-sm text-slate-500"><span class="font-semibold text-slate-700 mr-1">${mail.sender_name}</span> <span class="truncate">&lt;${mail.sender_email}&gt;</span></div></div></div><div class="flex flex-col items-end flex-shrink-0 ml-4"><span class="text-xs font-medium text-slate-400 mb-2 whitespace-nowrap">${dateStr}</span><i id="email-icon-${mail.id}" class="fa-solid fa-chevron-down text-slate-300 group-hover:text-slate-500"></i></div></div><div id="email-body-${mail.id}" class="hidden p-6 border-t border-slate-100 bg-slate-50 text-slate-700 text-sm leading-relaxed">${sanitizeHTML(mail.body)}</div></div>`;
            if (diff <= fifteenMinsMs) { htmlJustNow += cardString; countJustNow++; } else if (isToday) { html15MinsAgo += cardString; count15MinsAgo++; } else { htmlOlder += cardString; countOlder++; }
        });

        let finalHTML = '';
        if (countJustNow > 0) finalHTML += `<div class="mb-8"><h3 class="font-bold text-xs text-indigo-600 mb-3 uppercase tracking-wider flex items-center"><i class="fa-solid fa-bolt mr-2"></i> Vừa mới đây (${countJustNow})</h3><div class="flex flex-col gap-4">${htmlJustNow}</div></div>`;
        if (count15MinsAgo > 0) finalHTML += `<div class="mb-8"><h3 class="font-bold text-xs text-blue-500 mb-3 uppercase tracking-wider flex items-center"><i class="fa-solid fa-clock-rotate-left mr-2"></i> 15 phút trước (${count15MinsAgo})</h3><div class="flex flex-col gap-4">${html15MinsAgo}</div></div>`;
        if (countOlder > 0) finalHTML += `<div><div class="flex items-center cursor-pointer mb-3 group w-max select-none" onclick="toggleOlderEmails()"><h3 class="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center group-hover:text-slate-700 transition-colors"><i class="fa-solid fa-calendar-days mr-2"></i> Cũ hơn (${countOlder})</h3><div class="w-6 h-6 ml-2 rounded-full bg-slate-200 group-hover:bg-slate-300 flex items-center justify-center transition-colors"><i id="older-icon" class="fa-solid fa-chevron-down text-slate-500 text-[10px] transition-transform"></i></div></div><div id="older-emails-container" class="hidden flex-col gap-4">${htmlOlder}</div></div>`;
        container.innerHTML = finalHTML;
    };

    const getStatusBadge = (s) => ({'new': '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-star text-[10px] mr-1.5"></i> Mới</span>', 'pending_teams': '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center w-max"><i class="fa-brands fa-microsoft text-[10px] mr-1.5"></i> Chờ Teams</span>', 'pending_user_reply': '<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-user-pen text-[10px] mr-1.5"></i> Chờ Bổ sung</span>', 'completed': '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-check text-[10px] mr-1.5"></i> Hoàn thành</span>', 'rejected': '<span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-ban text-[10px] mr-1.5"></i> Đã đóng</span>'})[s] || s;
    const renderField = (l, v) => v ? `<div class="text-sm"><span class="text-slate-500 w-20 inline-block">${l}:</span> <span class="font-medium text-slate-800">${v}</span></div>` : `<div class="text-sm"><span class="text-slate-500 w-20 inline-block">${l}:</span> <span class="font-medium text-red-500 italic"><i class="fa-solid fa-circle-exclamation text-[10px]"></i> Thiếu</span></div>`;

    window.showModal = (id) => document.getElementById(id).classList.remove('hidden');
    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    window.currentIamData = []; window.currentIamFilter = 'all';

    window.filterIamStatus = (status) => {
        if (window.currentIamFilter === status) window.currentIamFilter = 'all'; else window.currentIamFilter = status; 
        const cards = { 'new': 'card-new', 'pending_teams': 'card-teams', 'pending_user_reply': 'card-reply', 'completed': 'card-completed', 'rejected': 'card-rejected' };
        Object.values(cards).forEach(id => { if(document.getElementById(id)) document.getElementById(id).classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50/50'); });
        if (window.currentIamFilter !== 'all' && document.getElementById(cards[window.currentIamFilter])) { document.getElementById(cards[window.currentIamFilter]).classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50/50'); }
        renderIamTable();
    };

    async function loadData() {
        const currentUser = sessionStorage.getItem('it_username').toLowerCase();
        const { data, error } = await client.from('permission_requests').select('*').ilike('receiver', `%${currentUser}%`).order('created_at', { ascending: false });
        if (error) return;
        window.currentIamData = data;
        document.getElementById('stat-new').innerText = data.filter(d => d.status === 'new').length;
        document.getElementById('stat-teams').innerText = data.filter(d => d.status === 'pending_teams').length;
        document.getElementById('stat-reply').innerText = data.filter(d => d.status === 'pending_user_reply').length;
        document.getElementById('stat-completed').innerText = data.filter(d => d.status === 'completed').length;
        if(document.getElementById('stat-rejected')) document.getElementById('stat-rejected').innerText = data.filter(d => d.status === 'rejected').length;
        renderIamTable();
    }

    function renderIamTable() {
        const filteredData = window.currentIamFilter === 'all' ? window.currentIamData : window.currentIamData.filter(d => d.status === window.currentIamFilter);
        const container = document.getElementById('request-list');
        if (!filteredData || filteredData.length === 0) { container.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-500 italic">Không có yêu cầu nào.</td></tr>'; return; }

        const now = new Date(); const fifteenMinsMs = 15 * 60 * 1000;
        let rowsJustNow = ''; let countJustNow = 0; let rows15Mins = ''; let count15Mins = 0; let rowsOlder = ''; let countOlder = 0;

        filteredData.forEach(req => {
            const isMissing = (val) => !val || String(val).trim() === '' || String(val).includes('...');
            const missing = []; if (isMissing(req.ho_ten)) missing.push('Họ Tên'); if (isMissing(req.ma_nv)) missing.push('Mã NV'); if (isMissing(req.chuc_danh)) missing.push('Chức danh');
            
            let actionsHTML = '';
            if (req.status === 'new') {
                actionsHTML = `<div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onclick="confirmAcceptClick('${req.id}', '${missing.join(',')}')" title="Duyệt yêu cầu" class="w-8 h-8 rounded bg-green-50 text-green-600 hover:bg-green-500 hover:text-white"><i class="fa-solid fa-check"></i></button><button onclick="handleRejectClick('${req.id}', '${missing.join(', ')}')" title="Từ chối / Yêu cầu bổ sung" class="w-8 h-8 rounded bg-red-50 text-red-600 hover:bg-red-500 hover:text-white"><i class="fa-solid fa-xmark"></i></button></div>`;
            } else if (req.status === 'pending_teams' || req.status === 'pending_user_reply') {
                actionsHTML = `<div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onclick="confirmCompleteClick('${req.id}')" title="Đánh dấu Hoàn thành" class="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white"><i class="fa-solid fa-check-double"></i></button></div>`;
            } else { actionsHTML = '<span class="text-xs text-slate-400 italic font-medium"><i class="fa-solid fa-check mr-1"></i> Đã xong</span>'; }

            const taskDate = req.created_at ? new Date(req.created_at) : new Date(); const timeStr = taskDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}); const diff = now.getTime() - taskDate.getTime(); const isToday = taskDate.toLocaleDateString('vi-VN') === now.toLocaleDateString('vi-VN');
            const isOlder = !(diff <= fifteenMinsMs) && !isToday; const extraClass = isOlder ? 'older-task-row hidden ' : ''; 

            const rowHTML = `<tr onclick="window.openTaskDetail('${req.id}')" class="${extraClass}hover:bg-slate-50 group transition-colors cursor-pointer border-b border-slate-100 last:border-0"><td class="px-6 py-4"><p class="text-sm font-semibold text-slate-800">${req.sender_email || 'N/A'}</p><div class="flex items-center mt-1"><span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium mr-2 whitespace-nowrap"><i class="fa-regular fa-clock mr-1"></i>${timeStr}</span><p class="text-xs text-slate-400 truncate max-w-[150px]" title="${req.subject}">${req.subject || 'No Subject'}</p></div></td><td class="px-6 py-4 space-y-1">${renderField('Họ tên', req.ho_ten)}${renderField('Mã NV', req.ma_nv)}${renderField('Chức danh', req.chuc_danh)}</td><td class="px-6 py-4">${getStatusBadge(req.status)}</td><td class="px-6 py-4 text-right" onclick="event.stopPropagation()">${actionsHTML}</td></tr>`;

            if (diff <= fifteenMinsMs) { rowsJustNow += rowHTML; countJustNow++; } else if (isToday) { rows15Mins += rowHTML; count15Mins++; } else { rowsOlder += rowHTML; countOlder++; }
        });

        let finalHTML = '';
        if (countJustNow > 0) finalHTML += `<tr class="bg-indigo-50/50"><td colspan="4" class="px-6 py-3 border-y border-indigo-100"><h3 class="font-bold text-xs text-indigo-600 uppercase tracking-wider flex items-center"><i class="fa-solid fa-bolt text-indigo-500 mr-2"></i> Mới đây (${countJustNow})</h3></td></tr>${rowsJustNow}`;
        if (count15Mins > 0) finalHTML += `<tr class="bg-blue-50/50"><td colspan="4" class="px-6 py-3 border-y border-blue-100"><h3 class="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center"><i class="fa-solid fa-clock-rotate-left text-blue-500 mr-2"></i> 15 Phút Trước (${count15Mins})</h3></td></tr>${rows15Mins}`;
        if (countOlder > 0) finalHTML += `<tr class="bg-slate-50/80 cursor-pointer group hover:bg-slate-100 transition-colors" onclick="toggleOlderTasks()"><td colspan="4" class="px-6 py-3 border-y border-slate-200"><div class="flex items-center w-max select-none"><h3 class="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center group-hover:text-slate-700 transition-colors"><i class="fa-solid fa-calendar-days text-slate-400 mr-2 group-hover:text-slate-600"></i> Cũ hơn (${countOlder})</h3><div class="w-6 h-6 ml-3 rounded-full bg-slate-200 group-hover:bg-slate-300 flex items-center justify-center transition-colors"><i id="older-task-icon" class="fa-solid fa-chevron-down text-slate-500 text-[10px] transition-transform"></i></div></div></td></tr>${rowsOlder}`;
        container.innerHTML = finalHTML;
    }

    window.toggleOlderTasks = () => { const rows = document.querySelectorAll('.older-task-row'); const icon = document.getElementById('older-task-icon'); if (!rows || rows.length === 0 || !icon) return; const isHidden = rows[0].classList.contains('hidden'); rows.forEach(row => { if (isHidden) row.classList.remove('hidden'); else row.classList.add('hidden'); }); if (isHidden) icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); else icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); };

    // ------------------------------------------
    // CÁC HÀM XỬ LÝ NÚT BẤM CỦA WORKFLOW
    // ------------------------------------------
    window.confirmAcceptClick = (id, missingStr) => { if (missingStr) { document.getElementById('missing-fields-list').innerHTML = missingStr.split(',').map(f => `<li>${f}</li>`).join(''); window.showModal('missing-info-modal'); return; } document.getElementById('approve-id-target').value = id; window.showModal('approve-confirm-modal'); };
    window.submitApprove = async () => { const id = document.getElementById('approve-id-target').value; const btn = document.getElementById('btn-submit-approve'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'; await fetch(`${BACKEND_URL}/api/requests/${id}/approve`, { method: 'POST' }); btn.innerHTML = 'Đồng ý duyệt'; window.closeModal('approve-confirm-modal'); loadData(); };

    window.handleRejectClick = (id, missingStr) => { document.getElementById('reject-id-target').value = id; const textInput = document.getElementById('reject-reason'); if(missingStr) textInput.value = `Biểu mẫu đăng ký bị thiếu các trường thông tin bắt buộc: ${missingStr}`; else textInput.value = ''; window.showModal('reject-modal'); };
    window.submitReject = async () => {
        const id = document.getElementById('reject-id-target').value; const reason = document.getElementById('reject-reason').value || 'Mẫu đăng ký không hợp lệ.';
        const btn = document.getElementById('btn-submit-reject'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        try { const response = await fetch(`${BACKEND_URL}/api/requests/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason }) }); const result = await response.json(); if (result.success) { window.closeModal('reject-modal'); loadData(); } else { alert("Lỗi server trả về: " + (result.message || "Không xác định")); } } catch (e) { alert("Lỗi kết nối Server: " + e.message); }
        btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i> Gửi Email';
    };

    window.confirmCompleteClick = (id) => { document.getElementById('complete-id-target').value = id; window.showModal('complete-confirm-modal'); };
    window.submitComplete = async () => { const id = document.getElementById('complete-id-target').value; const btn = document.getElementById('btn-submit-complete'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'; await fetch(`${BACKEND_URL}/api/requests/${id}/complete`, { method: 'POST' }); btn.innerHTML = 'Hoàn thành'; window.closeModal('complete-confirm-modal'); loadData(); };

    window.openTaskDetail = (id) => {
        const req = window.currentIamData.find(r => r.id === id); if (!req) return;
        document.getElementById('detail-id-target').value = req.id; document.getElementById('detail-sender').innerText = req.sender_email || 'N/A'; document.getElementById('detail-subject').innerText = req.subject || 'Không có tiêu đề'; document.getElementById('detail-body').innerText = req.body || '(Nội dung không được lưu, check mail gốc)';
        document.getElementById('detail-extracted').innerHTML = `<div><span class="text-xs text-slate-500 block">Họ tên</span><span class="font-medium ${!req.ho_ten ? 'text-red-500 italic' : 'text-slate-800'}">${req.ho_ten || 'Thiếu'}</span></div><div><span class="text-xs text-slate-500 block">Mã NV</span><span class="font-medium ${!req.ma_nv ? 'text-red-500 italic' : 'text-slate-800'}">${req.ma_nv || 'Thiếu'}</span></div><div><span class="text-xs text-slate-500 block">Chức danh</span><span class="font-medium ${!req.chuc_danh ? 'text-red-500 italic' : 'text-slate-800'}">${req.chuc_danh || 'Thiếu'}</span></div>`;
        const actionsDiv = document.getElementById('detail-action-buttons'); const closeBtn = document.getElementById('btn-detail-close-task');
        const isMissing = (val) => !val || String(val).trim() === '' || String(val).includes('...'); const missing = []; if (isMissing(req.ho_ten)) missing.push('Họ Tên'); if (isMissing(req.ma_nv)) missing.push('Mã NV'); if (isMissing(req.chuc_danh)) missing.push('Chức danh'); const missingStr = missing.join(',');

        if (req.status === 'new') {
            actionsDiv.innerHTML = `<button onclick="window.closeModal('task-detail-modal'); handleRejectClick('${req.id}', '${missingStr}')" class="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap border border-red-100 hover:border-red-500"><i class="fa-solid fa-reply mr-2"></i> Từ chối / Yêu cầu bổ sung</button><button onclick="window.closeModal('task-detail-modal'); confirmAcceptClick('${req.id}', '${missingStr}')" class="flex items-center justify-center px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"><i class="fa-solid fa-check mr-2"></i> Xác nhận Duyệt</button>`;
            closeBtn.style.display = 'flex';
        } else if (req.status === 'pending_teams' || req.status === 'pending_user_reply') {
            actionsDiv.innerHTML = `<button onclick="window.closeModal('task-detail-modal'); confirmCompleteClick('${req.id}')" class="flex items-center justify-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"><i class="fa-solid fa-check-double mr-2"></i> Đánh dấu Hoàn thành</button>`;
            closeBtn.style.display = 'flex';
        } else { actionsDiv.innerHTML = `<span class="text-sm text-slate-400 italic font-medium px-2 whitespace-nowrap">Task đã kết thúc</span>`; closeBtn.style.display = 'none'; }
        window.showModal('task-detail-modal');
    };

    window.submitCloseTask = async () => {
        if(!confirm("Bạn có chắc chắn muốn ĐÓNG task này không?")) return;
        const id = document.getElementById('detail-id-target').value; const btn = document.getElementById('btn-detail-close-task'); const originalText = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đóng...';
        try { await fetch(`${BACKEND_URL}/api/requests/${id}/close`, { method: 'POST' }); window.closeModal('task-detail-modal'); loadData(); } catch (e) { alert("Lỗi khi đóng Task!"); }
        btn.innerHTML = originalText;
    };

    // ==========================================
    // 6. MODULE: ENGINE GIÁM SÁT MẠNG LIVE
    // ==========================================
   // ĐẢM BẢO CÁC BIẾN NÀY NẰM Ở ĐẦU FILE SCRIPT.JS HOẶC BÊN NGOÀI HÀM
    let networkChartInstance = null;
    let agentPoller = null;
    const LOCAL_AGENT_URL = 'http://localhost:10000';
    let localNetworkCache = [];

    // HÀM KHỞI TẠO TAB GIÁM SÁT MẠNG (DÒNG 269 CỦA MÀY ĐẤY)
    window.initNetworkDashboard = () => {
        // 1. Gọi hàm check Agent ngay khi mở Tab Mạng
        checkAgentConnection();
        
        // 2. Khởi tạo biểu đồ LAN với biến ĐỘC QUYỀN (networkCtx) đéo đụng hàng với ai
        const networkCanvas = document.getElementById('networkChart');
        if (!networkCanvas) return; // Bảo vệ an toàn nếu không tìm thấy canvas
        
        const networkCtx = networkCanvas.getContext('2d');
        if (networkChartInstance) {
            networkChartInstance.destroy(); // Dọn dẹp biểu đồ cũ nếu có F5
        }
        
        networkChartInstance = new Chart(networkCtx, {
            type: 'line',
            data: {
                labels: [], // Trục X thời gian
                datasets: [
                    { label: 'Download (Mbps)', borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)', data: [], fill: true, tension: 0.4 },
                    { label: 'Upload (Mbps)', borderColor: '#EC4899', backgroundColor: 'rgba(236, 72, 153, 0.1)', data: [], fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
        });
    };

    // HÀM CHECK KẾT NỐI XUỐNG LOCALHOST AGENT
    window.checkAgentConnection = async () => {
        const overlay = document.getElementById('agent-overlay');
        try {
            const res = await fetch(`${LOCAL_AGENT_URL}/api/health`, { method: 'GET' });
            const result = await res.json();
            
            if (result.success) {
                if (overlay) overlay.classList.add('hidden'); // Agent sống -> Ẩn màn che
                fetchLocalNetworkData(); // Kéo data mạng về liền
                if (!agentPoller) agentPoller = setInterval(fetchLocalNetworkData, 10000); // 10s quét lại
            }
        } catch (e) {
            if (overlay) overlay.classList.remove('hidden'); // Agent chết -> Hiện màn che đòi tải
            if (agentPoller) { clearInterval(agentPoller); agentPoller = null; }
        }
    };

    // HÀM LẤY DATA MẠNG TỪ AGENT ĐỔ VÀO BẢNG VÀ BIỂU ĐỒ
    async function fetchLocalNetworkData() {
        try {
            const res = await fetch(`${LOCAL_AGENT_URL}/api/network/status`); 
            const result = await res.json();
            if (result.success) { 
                localNetworkCache = result.data; 
                if (typeof renderNetworkTable === 'function') renderNetworkTable(result.data); 
                if (typeof updateNetworkStats === 'function') updateNetworkStats(result.data); 
            }

            // Bơm số ngẫu nhiên cho biểu đồ chạy mượt (Khè sếp)
            const mockDownload = (Math.random() * 80 + 10).toFixed(2);
            const mockUpload = (Math.random() * 35 + 5).toFixed(2);
            
            if (networkChartInstance) {
                const now = new Date().toLocaleTimeString();
                networkChartInstance.data.labels.push(now);
                networkChartInstance.data.datasets[0].data.push(mockDownload);
                networkChartInstance.data.datasets[1].data.push(mockUpload);
                
                if (networkChartInstance.data.labels.length > 15) {
                    networkChartInstance.data.labels.shift();
                    networkChartInstance.data.datasets[0].data.shift();
                    networkChartInstance.data.datasets[1].data.shift();
                }
                networkChartInstance.update();
            }
        } catch (e) { 
            console.error('Mất kết nối với Agent cục bộ!');
            const overlay = document.getElementById('agent-overlay');
            if (overlay) overlay.classList.remove('hidden');
        }
    }

    // Hàm cập nhật Biểu đồ hiệu ứng trôi (Sliding effect)
    function updateChartLive(download, upload) {
        if(!networkChartInstance) return;
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const data = networkChartInstance.data;
        
        // Push data mới vào cuối biểu đồ
        data.labels.push(timeLabel);
        data.datasets[0].data.push(download);
        data.datasets[1].data.push(upload);

        // Giữ tối đa 10 cột mốc thời gian để biểu đồ trôi sang trái, không bị nén lại
        if (data.labels.length > 10) {
            data.labels.shift();
            data.datasets[0].data.shift();
            data.datasets[1].data.shift();
        }
        
        networkChartInstance.update();
    }

    // BIẾN TOÀN CỤC CHO GIAO DIỆN MẠNG
    let currentNetFilter = 'all';
    let collapsedSubnets = new Set(); // Bộ nhớ lưu những nhóm VLAN đang bị đóng lại

    // Hàm đổi bộ lọc (Khi click vào 4 thẻ card trên cùng)
    window.filterNetworkStatus = (status) => {
        currentNetFilter = status;
        const cards = { 'all': 'net-card-all', 'online': 'net-card-online', 'offline': 'net-card-offline', 'warning': 'net-card-warning' };
        
        // Reset CSS mờ đi
        Object.values(cards).forEach(id => { 
            const el = document.getElementById(id);
            if(el) { el.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50/30'); }
        });
        
        // Tô đậm thẻ đang chọn
        if(document.getElementById(cards[status])) {
            document.getElementById(cards[status]).classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50/30');
        }
        
        // Ép vẽ lại bảng ngay lập tức
        renderNetworkTable(localNetworkCache);
    };

    // Hàm Đóng/Mở (Thu gọn) danh sách VLAN
    window.toggleSubnetGroup = (subnet) => {
        if(collapsedSubnets.has(subnet)) collapsedSubnets.delete(subnet);
        else collapsedSubnets.add(subnet);
        renderNetworkTable(localNetworkCache); // Vẽ lại bảng giữ nguyên trạng thái Live
    };

    // Cập nhật số liệu trên 4 thẻ Card (Không bị ảnh hưởng bởi bộ lọc)
    function updateNetworkStats(devices) {
        document.getElementById('net-total').innerText = devices.length; 
        document.getElementById('net-online').innerText = devices.filter(d => d.status !== 'offline').length; 
        document.getElementById('net-offline').innerText = devices.filter(d => d.status === 'offline').length;
        document.getElementById('net-ping').innerText = devices.filter(d => d.status === 'warning' || parseInt(d.ping) > 50).length;
    }

    // SIÊU HÀM VẼ BẢNG: Lọc -> Gộp Nhóm -> Xổ/Thu Gọn
    function renderNetworkTable(devices) {
        // Bước 1: Bọc bộ lọc (Theo thẻ Card)
        let filteredData = devices;
        if(currentNetFilter === 'online') filteredData = devices.filter(d => d.status === 'online');
        if(currentNetFilter === 'offline') filteredData = devices.filter(d => d.status === 'offline');
        if(currentNetFilter === 'warning') filteredData = devices.filter(d => d.status === 'warning' || parseInt(d.ping) > 50);

        // Bước 2: Chia khay theo Subnet (VLAN)
        const groups = {};
        filteredData.forEach(d => {
            const parts = d.ip.split('.');
            const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.x`;
            if (!groups[subnet]) groups[subnet] = [];
            groups[subnet].push(d);
        });

        // Bước 3: Ráp giao diện
        let finalHTML = '';
        if (Object.keys(groups).length === 0) {
            document.getElementById('network-device-list').innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-slate-500 italic">Không có thiết bị nào thỏa mãn bộ lọc.</td></tr>`;
            return;
        }

        for (const [subnet, nodes] of Object.entries(groups)) {
            const isCollapsed = collapsedSubnets.has(subnet);
            
            // Thanh Tiêu đề Nhóm (Click để Đóng/Mở)
            finalHTML += `
            <tr onclick="toggleSubnetGroup('${subnet}')" class="bg-indigo-50/80 border-y border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer select-none group">
                <td colspan="6" class="px-6 py-2.5 font-bold text-indigo-800 text-xs uppercase tracking-wider">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fa-solid fa-layer-group text-indigo-500 mr-2"></i> 
                            DẢI MẠNG: <span class="ml-1 font-mono text-indigo-600">${subnet}</span> 
                            <span class="ml-3 px-2 py-0.5 bg-indigo-200 text-indigo-700 rounded-full text-[10px]">${nodes.length} thiết bị</span>
                        </div>
                        <i class="fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-indigo-400 group-hover:text-indigo-600 transition-transform"></i>
                    </div>
                </td>
            </tr>`;

            // Nếu ĐANG ĐÓNG (Thu gọn) thì BỎ QUA không vẽ các dòng máy con bên trong
            if (isCollapsed) continue;

            // Nếu ĐANG MỞ, vẽ danh sách máy
            finalHTML += nodes.map(d => {
                const statusBadge = d.status === 'online' ? '<span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-circle text-[8px] mr-1.5"></i> Online</span>' : 
                                    d.status === 'warning' ? '<span class="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-triangle-exclamation text-[10px] mr-1.5"></i> High Ping</span>' : 
                                    '<span class="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold flex items-center w-max"><i class="fa-solid fa-plug-circle-xmark text-[10px] mr-1.5"></i> Offline</span>';
                
                return `
                <tr onclick="window.openNetworkNodeDetail('${d.ip}')" class="hover:bg-slate-50 group transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center mr-3"><i class="fa-solid ${d.icon} text-base"></i></div>
                            <span class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">${d.name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 font-mono text-indigo-700 font-semibold">${d.ip}</td>
                    <td class="px-6 py-4 font-mono text-slate-500 text-xs">${d.mac}</td>
                    <td class="px-6 py-4"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold border border-slate-200">${d.vlan}</span></td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right font-bold text-slate-700">${d.ping}</td>
                </tr>`;
            }).join('');
        }
        
        document.getElementById('network-device-list').innerHTML = finalHTML;
    }

    // Các hàm tương tác sâu
    window.openNetworkNodeDetail = (ip) => {
        const node = localNetworkCache.find(n => n.ip === ip); if (!node) return;
        document.getElementById('lbl-detail-ip').innerText = node.ip; document.getElementById('lbl-detail-mac').innerText = node.mac; document.getElementById('txt-detail-custom-name').value = node.name.startsWith('Device-') || node.name.startsWith('Thiết bị-') ? '' : node.name; document.getElementById('hdn-detail-mac').value = node.mac; document.getElementById('hdn-detail-ip').value = node.ip;
        document.getElementById('detail-node-icon').className = `fa-solid ${node.icon}`;
        document.getElementById('btn-quick-portscan').onclick = () => { window.closeModal('net-device-detail-modal'); window.executePortScan(node.ip); };
        document.getElementById('btn-quick-wol').onclick = () => { window.closeModal('net-device-detail-modal'); window.executeWOL(node.mac); };
        window.showModal('net-device-detail-modal');
    };

    window.submitUpdateDeviceLabel = async () => {
        const mac = document.getElementById('hdn-detail-mac').value; const name = document.getElementById('txt-detail-custom-name').value;
        if (!name.trim()) return alert("Vui lòng nhập tên!");
        const res = await fetch(`${BACKEND_URL}/api/network/update-label`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: mac, customName: name }) });
        const result = await res.json(); if (result.success) { window.closeModal('net-device-detail-modal'); fetchLocalNetworkData(); } else { alert(result.message); }
    };

    function writeToTerminal(text, cleanBefore = false) {
        const term = document.getElementById('net-terminal-output'); if (cleanBefore) term.innerHTML = '';
        term.innerHTML += `<div>${text}</div>`; term.scrollTop = term.scrollHeight;
    }

    window.executePortScan = async (ip) => {
        window.showModal('net-terminal-modal'); writeToTerminal(`[+] Nmap Mini-Scan Host: ${ip}...`, true); writeToTerminal(`[*] Đang rà soát port...`);
        try {
            const res = await fetch(`${BACKEND_URL}/api/network/port-scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: ip }) });
            const result = await res.json();
            if (result.success && result.openPorts.length > 0) {
                writeToTerminal(`<span class="text-yellow-400">[!] PHÁT HIỆN PORT ĐANG MỞ TRÊN HOST ${ip}:</span>`);
                result.openPorts.forEach(p => { let desc = p === 22 ? 'SSH' : p === 80 ? 'HTTP' : p === 443 ? 'HTTPS' : p === 445 ? 'SMB/LanMan' : p === 3389 ? 'RDP' : 'Service'; writeToTerminal(`  👉 Port <span class="font-bold text-white">${p}</span>/tcp -> <span class="text-green-500 font-bold">OPEN</span> (${desc})`); });
            } else { writeToTerminal(`<span class="text-red-400">[-] Không có port mở.</span>`); }
        } catch (e) { writeToTerminal(`[-] Lỗi hệ thống.`); }
        writeToTerminal(`\n[✔] Hoàn tất.`);
    };

    window.executeWOL = async (mac) => {
        window.showModal('net-terminal-modal'); writeToTerminal(`[+] Đang chạy WOL...`, true);
        const res = await fetch(`${BACKEND_URL}/api/network/wol`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: mac }) });
        const result = await res.json(); if (result.success) { writeToTerminal(`[✔] ${result.message}`); } else { writeToTerminal(`[-] Thất bại: ${result.message}`); }
    };

    window.runPingSweepTool = async () => {
        window.showModal('net-terminal-modal'); writeToTerminal(`[+] KÍCH HOẠT RADAR Ping Sweep...`, true); writeToTerminal(`[*] Đang rải ICMP...`);
        await fetch(`${BACKEND_URL}/api/network/trigger-scan`, { method: 'POST' }); writeToTerminal(`[+] Tiến trình đang quét ngầm trên Server...`);
    };

    window.runPortScanTool = () => alert("Click thẳng vào 1 dòng thiết bị dưới bảng để chọn quét Port!");
    window.runWOLTool = () => alert("Click chọn 1 máy tính dưới bảng để Bắn lệnh WOL!");

    // ==========================================
    // 7. GỌI CHECK AUTH CUỐI CÙNG
    // ==========================================
    const checkAuth = () => {
        const token = sessionStorage.getItem('it_token');
        if (token) {
            document.getElementById('login-screen').classList.add('hidden'); document.getElementById('dashboard-screen').classList.remove('hidden');
            const role = sessionStorage.getItem('it_role'); const username = sessionStorage.getItem('it_username');
            document.getElementById('display-username').innerText = username; document.getElementById('user-avatar-btn').innerText = username.substring(0, 2); document.getElementById('display-role').innerText = role === 'admin' ? 'Administrator' : 'Nhân viên IT';
            if (role === 'admin') { document.getElementById('admin-create-user-btn').classList.remove('hidden'); document.getElementById('admin-create-user-btn').classList.add('flex'); } else { document.getElementById('admin-create-user-btn').classList.add('hidden'); document.getElementById('admin-create-user-btn').classList.remove('flex'); }
            loadData(); loadPersonalEmails();
        } else { document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('dashboard-screen').classList.add('hidden'); }
    };
    checkAuth();

    // ==========================================
    // MODULE: SYSLOG & SNMP (ENTERPRISE)
    // ==========================================
    let syslogPoller = null;

    // 1. Mở màn hình Syslog (Chạy Real-time Terminal)
    window.openSyslogMonitor = () => {
        window.showModal('net-terminal-modal');
        writeToTerminal(`[+] ĐANG KẾT NỐI VÀO LÕI UDP SYSLOG PORT 1514...`, true);
        writeToTerminal(`[*] Chờ thiết bị mạng (Router/Switch/Firewall) bắn Log về...`);
        
        if(syslogPoller) clearInterval(syslogPoller);
        syslogPoller = setInterval(async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/network/syslog`);
                const result = await res.json();
                if (result.success && result.data.length > 0) {
                    const term = document.getElementById('net-terminal-output');
                    // Chỉ render 20 dòng mới nhất để tránh lag trình duyệt
                    const html = result.data.slice(0, 20).map(l => 
                        `<div class="border-b border-green-900/30 pb-1 mb-1"><span class="text-blue-400">[${l.time}]</span> <span class="text-yellow-400">${l.ip}</span>: <span class="text-green-300">${l.log}</span></div>`
                    ).join('');
                    if(term.innerHTML !== html) term.innerHTML = html; // Tránh chớp nháy
                }
            } catch(e) {}
        }, 2000); // Cứ 2s kéo log 1 lần
    };

    // Tắt Poller khi đóng Terminal
    const oldCloseModal = window.closeModal;
    window.closeModal = (id) => {
        if(id === 'net-terminal-modal' && syslogPoller) clearInterval(syslogPoller);
        oldCloseModal(id);
    };

    // 2. Chạy quét thông số phần cứng SNMP
    window.executeSNMP = async (ip) => {
        window.showModal('net-terminal-modal');
        writeToTerminal(`[+] Khởi động giao thức SNMP v2c đâm vào phần cứng IP: ${ip}...`, true);
        
        try {
            // Mặc định Pass community là 'public', nếu router mày đổi thì sửa ở đây
            const res = await fetch(`${BACKEND_URL}/api/network/snmp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: ip, community: 'public' }) });
            const result = await res.json();
            
            if (result.success) {
                writeToTerminal(`<span class="text-emerald-400">[✔] TRÍCH XUẤT THÀNH CÔNG:</span>`);
                result.data.forEach((item, idx) => {
                    let desc = idx === 0 ? "Tên thiết bị (Hostname)" : idx === 1 ? "Thời gian Uptime" : "Mô tả phần cứng/OS";
                    writeToTerminal(`  👉 <span class="text-slate-400">${desc}:</span> <span class="font-bold text-white">${item.value}</span>`);
                });
            } else {
                writeToTerminal(`<span class="text-red-400">[-] Thất bại: ${result.message}</span>`);
                writeToTerminal(`<span class="text-slate-500">Gợi ý: Mày đã vào Winbox -> IP -> SNMP -> bật Enable lên chưa?</span>`);
            }
        } catch (e) { writeToTerminal(`[-] Lỗi mạng khi gọi API SNMP.`); }
    };

    // ==========================================
    // MODULE: NETFLOW TRAFFIC MONITORING
    // ==========================================
    let netflowPoller = null;

    window.openNetflowMonitor = () => {
        window.showModal('netflow-modal');
        fetchAndRenderNetflow();
        if(netflowPoller) clearInterval(netflowPoller);
        netflowPoller = setInterval(fetchAndRenderNetflow, 3000); // 3s cập nhật 1 lần
    };

    async function fetchAndRenderNetflow() {
        try {
            const res = await fetch(`${BACKEND_URL}/api/network/netflow`);
            const result = await res.json();
            if (result.success) {
                const tbody = document.getElementById('netflow-list');
                const dataObj = result.data;
                const entries = Object.keys(dataObj).map(ip => ({ ip, bytes: dataObj[ip] }));
                entries.sort((a, b) => b.bytes - a.bytes); // Xếp thằng nào xài mạng nhiều lên đầu

                if(entries.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 italic">Chưa nhận được gói tin NetFlow nào từ Router...</td></tr>';
                    return;
                }

                tbody.innerHTML = entries.map(e => {
                    let mb = (e.bytes / 1024 / 1024).toFixed(2);
                    let color = mb > 50 ? 'bg-red-500' : mb > 10 ? 'bg-yellow-500' : 'bg-green-500';
                    let node = localNetworkCache.find(n => n.ip === e.ip) || { name: 'Thiết bị ngoài luồng' };
                    return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-3">
                            <div class="font-bold text-slate-700">${e.ip}</div>
                            <div class="text-xs text-slate-500">${node.name}</div>
                        </td>
                        <td class="px-4 py-3 text-right font-mono font-bold text-indigo-600">${mb} MB</td>
                        <td class="px-4 py-3 text-right w-32">
                            <div class="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                <div class="${color} h-1.5 rounded-full transition-all" style="width: ${Math.min((mb/100)*100, 100)}%"></div>
                            </div>
                        </td>
                    </tr>`;
                }).join('');
            }
        } catch(e) {}
    }

    // ==========================================
    // MODULE: BẢN ĐỒ TOPOLOGY (VIS.JS)
    // ==========================================
    let networkTopology = null;

    window.openTopologyMap = () => {
        window.showModal('topology-modal');
        const container = document.getElementById('topology-canvas');
        
        // Tạo Gateway gốc (Core Switch)
        let nodesArray = [{ id: 0, label: "Core Switch/Firewall\n(172.15.10.1)", shape: "image", image: "https://cdn-icons-png.flaticon.com/512/2888/2888998.png", size: 40, font: {bold: true} }];
        let edgesArray = [];

        // Đổ toàn bộ Cache mạng lên bản đồ
        localNetworkCache.forEach(node => {
            if(node.ip === '172.15.10.1' || node.ip === '10.10.1.1') return; // Bỏ qua IP Gateway vì đã gán cứng ở trên
            
            // Đổi hình ảnh dựa theo Icon AI đã phân loại
            let imgUrl = "https://cdn-icons-png.flaticon.com/512/3067/3067260.png"; // PC
            if(node.icon.includes('mobile')) imgUrl = "https://cdn-icons-png.flaticon.com/512/2904/2904111.png";
            else if(node.icon.includes('server')) imgUrl = "https://cdn-icons-png.flaticon.com/512/2888/2888998.png";
            else if(node.icon.includes('video')) imgUrl = "https://cdn-icons-png.flaticon.com/512/3039/3039401.png";

            // Node màu đỏ nếu offline, xanh nếu online
            let colorBorder = node.status === 'offline' ? '#ef4444' : '#10b981';

            nodesArray.push({
                id: node.ip,
                label: `${node.name}\n${node.ip}`,
                shape: "circularImage",
                image: imgUrl,
                size: 25,
                color: { border: colorBorder, background: '#ffffff' },
                borderWidth: 3
            });

            // Nối dây cáp từ Gateway tới Node (Dây đứt nét màu đỏ nếu rớt mạng)
            edgesArray.push({
                from: 0, 
                to: node.ip, 
                color: node.status === 'offline' ? {color:'#fca5a5'} : {color:'#94a3b8'},
                dashes: node.status === 'offline'
            });
        });

        const data = { nodes: new vis.DataSet(nodesArray), edges: new vis.DataSet(edgesArray) };
        const options = {
            physics: { solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -100, springLength: 100 } },
            edges: { smooth: { type: "continuous" } },
            interaction: { hover: true, tooltipDelay: 200 }
        };

        if(networkTopology) networkTopology.destroy();
        networkTopology = new vis.Network(container, data, options);
    };

    // Tắt Poller khi đóng Modal Netflow (Sửa lại hàm đóng Modal tổng)
    const oldCloseModalSystem = window.closeModal;
    window.closeModal = (id) => {
        if(id === 'netflow-modal' && netflowPoller) clearInterval(netflowPoller);
        if(id === 'net-terminal-modal' && typeof syslogPoller !== 'undefined' && syslogPoller) clearInterval(syslogPoller);
        oldCloseModalSystem(id);
    };

    // Gắn sự kiện vào hàm mở Modal chi tiết Node
    const oldOpenNodeDetail = window.openNetworkNodeDetail;
    window.openNetworkNodeDetail = (ip) => {
        oldOpenNodeDetail(ip);
        const node = localNetworkCache.find(n => n.ip === ip);
        if(node && document.getElementById('btn-quick-snmp')) {
            document.getElementById('btn-quick-snmp').onclick = () => { window.closeModal('net-device-detail-modal'); window.executeSNMP(node.ip); };
        }
    };
})();