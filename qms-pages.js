/* qms-pages.js — Pages 페이지 렌더러 [v2.399]
   v2.394→v2.395  문서관리 고도화 페이지 함수 추가 */
"use strict";


const Pages={

/* ── 홈 (메인화면) ──
   레이아웃: hw(flex row) = hw-main(카드그리드) + hw-side(멘션/공지)
   카드 클릭: mc-card-sub onclick → Nav.go(page) 직접 이동
   v2.394: C안 우측 패널 고정, 카드 높이 5배, stopPropagation 제거 */
home(){
  const w=document.getElementById('pw');
  w.classList.add('home-mode');
  const ncO=DB.nc.filter(n=>n.status!=='완료').length;
  const eqE=DB.equip.filter(e=>e.status==='교정만료').length;
  const carO=DB.cars.filter(c=>c.status!=='완료').length;
  const unread=DB.mentions.filter(m=>!m.read).length;
  const today=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'});
  const loginUser=DB.users.find(u=>u.username===(Auth._cur||'admin'))||{name:'관리자',username:'admin'};

  const cards=[
    {c:'mc-c1',icon:'📦',name:'기준정보',badge:0,
     subs:[{icon:'📦',label:'품목 등록',page:'items'},{icon:'🏢',label:'거래처 등록',page:'vendors'},{icon:'👥',label:'사원관리',page:'users'},{icon:'⚙️',label:'시스템',page:'settings'}]},
    {c:'mc-c2',icon:'🔍',name:'품질관리',badge:ncO,
     subs:[{icon:'📊',label:'품질현황 대시보드',page:'quality_dash'},{icon:'🔍',label:'수입검사',page:'insp_in'},{icon:'⚙️',label:'공정검사',page:'insp_pr'},{icon:'🛒',label:'구매검사',page:'insp_pu'},{icon:'🏭',label:'외주검사',page:'insp_ou'},{icon:'✅',label:'최종검사',page:'insp_fi'},{icon:'⚠️',label:'부적합 관리',page:'nc'},{icon:'📝',label:'8D Report',page:'nc_8d'},{icon:'♻️',label:'반품/폐기',page:'nc_dispose'},{icon:'📉',label:'불량 트렌드',page:'nc_trend'}]},
    {c:'mc-c3',icon:'📋',name:'검사 고도화',badge:0,
     subs:[{icon:'📋',label:'검사 기준서',page:'insp_std'},{icon:'📜',label:'검사 성적서',page:'insp_cert'},{icon:'🔗',label:'LOT 추적성',page:'lot_trace'},{icon:'🚫',label:'Hold 관리',page:'hold_mgmt'},{icon:'🔄',label:'재검사 관리',page:'reinsp'}]},
    {c:'mc-c4',icon:'⭐',name:'공급업체 품질',badge:0,
     subs:[{icon:'⭐',label:'업체 평가',page:'sqm_eval'},{icon:'🔎',label:'업체 심사',page:'sqm_audit'},{icon:'📅',label:'심사 계획 관리',page:'sqm_plan'},{icon:'🚚',label:'납품 이력',page:'sqm_delivery'},{icon:'📊',label:'SQM 대시보드',page:'sqm_dash'}]},
    {c:'mc-c5',icon:'📈',name:'SPC 통계관리',badge:0,
     subs:[{icon:'📈',label:'관리도',page:'spc_chart'},{icon:'🎯',label:'Cp/Cpk',page:'spc_cpk'},{icon:'📊',label:'파레토 분석',page:'spc_pareto'}]},
    {c:'mc-c6',icon:'🔬',name:'계측기관리',badge:eqE,
     subs:[{icon:'🔬',label:'계측기 등록',page:'equip'},{icon:'📐',label:'교정 관리',page:'cal'},{icon:'📈',label:'MSA 분석',page:'msa'}]},
    {c:'mc-c7',icon:'📄',name:'문서관리',badge:0,
     subs:[{icon:'📄',label:'문서 목록',page:'docs'},{icon:'✍️',label:'결재함',page:'doc_approval'},{icon:'🕐',label:'개정 이력',page:'doc_history_home'},{icon:'🔍',label:'지식 검색',page:'doc_search'},{icon:'📋',label:'기록 관리',page:'rec'}]},
    {c:'mc-c8',icon:'🔧',name:'개선활동',badge:carO,
     subs:[{icon:'🔧',label:'시정조치(CAR)',page:'car'},{icon:'🔎',label:'내부심사',page:'audit'}]},
  ];

  const cardEl=card=>`<div class="mc-card ${card.c}">
    <div class="mc-card-hd">
      <span class="mc-card-icon">${card.icon}</span>
      <span class="mc-card-name">${card.name}</span>
      ${card.badge>0?`<span class="mc-card-badge">${card.badge}</span>`:''}
    </div>
    <div class="mc-card-subs">
      ${card.subs.map(s=>`<div class="mc-card-sub" onclick="Nav.go('${s.page}')">
        <span class="mc-card-sub-icon">${s.icon}</span>${s.label}
      </div>`).join('')}
    </div>
  </div>`;

  w.innerHTML=`
  <div class="hw">
    <!-- 좌측: 헤더 + 2×4 카드 그리드 -->
    <div class="hw-main">

      <!-- 헤더 행: 로고 | 타이틀 | 상태 | 프로필 -->
      <div class="hw-hdr">
        ${App.logo
          ?`<img class="hw-hdr-logo" src="${App.logo}" alt="INNODIS">`
          :`<span class="hw-hdr-logo-def">QMS</span>`}
        <div class="hw-hdr-center">
          <div class="hw-hdr-title">QMS 품질경영시스템</div>
          <div class="hw-hdr-sub">Quality Management System · v2.394</div>
        </div>
        <div class="hw-hdr-stat">
          <div>${today}</div>
          <div>미결 <strong style="color:#ef4444">${ncO}건</strong> &nbsp;·&nbsp; 교정만료 <strong style="color:#f59e0b">${eqE}건</strong> &nbsp;·&nbsp; CAR <strong style="color:#3b82f6">${carO}건</strong></div>
        </div>
        <!-- A안: 👤 이름(개인정보수정) + 🚪 로그아웃 버튼 나란히 -->
        <div class="hw-profile-btn" onclick="Pages._profileEdit()" title="개인정보 수정">
          <div class="hw-profile-avatar">${H.e(loginUser.name.charAt(0))}</div>
          <span class="hw-profile-name">${H.e(loginUser.name)}</span>
        </div>
        <div class="hw-logout-btn" onclick="Auth.logout()" title="로그아웃">
          🚪 로그아웃
        </div>
      </div>

      <!-- 2×4 카드 그리드 -->
      <div class="mc-grid">
        ${cards.map(cardEl).join('')}
      </div>
    </div>

    <!-- 우측: 멘션함 + 공지사항 (고정 패널) -->
    <div class="hw-side">
      <!-- 멘션함 -->
      <div class="hw-panel">
        <div class="hw-panel-head">
          <div class="hw-panel-title">💬 멘션함
            <span style="background:#ef4444;color:#fff;border-radius:999px;font-size:9px;font-weight:800;padding:1px 6px">${unread}</span>
          </div>
          <span class="hw-panel-more" onclick="Nav.go('mentions')">전체보기 →</span>
        </div>
        <div class="hw-panel-body">
          ${DB.mentions.map(m=>`
            <div class="hw-mention" onclick="Nav.go('mentions')">
              <div class="hw-mention-top">
                <div class="hw-mention-avatar">${H.e(m.from.charAt(0))}</div>
                <span class="hw-mention-from">${H.e(m.from)}</span>
                <span class="hw-mention-ref">${H.e(m.ref)}</span>
                ${!m.read?'<span class="hw-mention-unread"></span>':''}
              </div>
              <div class="hw-mention-text">${H.e(m.text)}</div>
              <div class="hw-mention-time">${H.e(m.time)}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- [v2.394 Phase3] 교정 D-30 알림 패널 -->
      ${(()=>{
        const _n=new Date();
        const _warn=DB.equip.filter(e=>{
          if(!e.next) return false;
          const d=Math.ceil((new Date(e.next)-_n)/(864e5));
          return d>=0&&d<30;
        }).sort((a,b)=>(a.next||"").localeCompare(b.next||""));
        const _exp=DB.equip.filter(e=>e.status==='교정만료');
        if(!_warn.length&&!_exp.length) return "";
        return `<div class="hw-panel" style="border-left:3px solid var(--warn)">
          <div class="hw-panel-head">
            <div class="hw-panel-title">⚠️ 교정 임박/만료
              <span class="badge bred" style="margin-left:6px;font-size:10px">${_warn.length+_exp.length}</span>
            </div>
            <span class="hw-panel-more" onclick="Nav.go('equip')">계측기 →</span>
          </div>
          <div class="hw-panel-body">
            ${_exp.slice(0,3).map(e=>`<div class="hw-mention" onclick="Nav.go('equip')" style="border-left:3px solid #ef4444;padding-left:8px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;font-weight:600">${H.e(e.code)} ${H.e(e.name)}</span>
                <span class="badge bred">만료</span>
              </div>
              <div style="font-size:11px;color:var(--tm)">${e.next||"-"} · ${H.e(e.loc||"-")}</div>
            </div>`).join("")}
            ${_warn.slice(0,3).map(e=>{
              const _d=Math.ceil((new Date(e.next)-_n)/(864e5));
              return `<div class="hw-mention" onclick="Nav.go('equip')" style="border-left:3px solid #f59e0b;padding-left:8px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;font-weight:600">${H.e(e.code)} ${H.e(e.name)}</span>
                  <span class="badge bamb">D-${_d}</span>
                </div>
                <div style="font-size:11px;color:var(--tm)">${e.next||"-"} · ${H.e(e.loc||"-")}</div>
              </div>`;
            }).join("")}
            ${(_warn.length+_exp.length)>6?`<div style="text-align:center;font-size:11px;color:var(--tm);padding:4px">외 ${_warn.length+_exp.length-6}건 더보기</div>`:""}
          </div>
        </div>`;
      })()}
            <!-- [v2.394 PhaseB] 미처리 멘션 D-day 패널 -->
      ${(()=>{
        const _me=Auth._cur||'admin';
        const _td=new Date();
        const _over=DB.mentions.filter(m=>{
          if(!m.due_date||m.status==='done') return false;
          const isMy=(m.to===_me)||(m.to_list||[]).includes(_me)||Auth._u?.role==='admin';
          return isMy;
        }).sort((a,b)=>a.due_date.localeCompare(b.due_date));
        if(!_over.length) return "";
        return `<div class="hw-panel" style="border-left:3px solid #8b5cf6">
          <div class="hw-panel-head">
            <div class="hw-panel-title">📋 처리 대기 멘션
              <span class="badge" style="background:#8b5cf6;color:#fff;font-size:10px;margin-left:6px">${_over.length}</span>
            </div>
            <span class="hw-panel-more" onclick="Nav.go('mentions')">멘션함 →</span>
          </div>
          <div class="hw-panel-body">
            ${_over.slice(0,4).map(m=>{
              const d=Math.ceil((new Date(m.due_date)-_td)/(864e5));
              const dTag=d<0?'<span class="badge bred" style="font-size:10px">D+'+Math.abs(d)+'초과</span>':d<=3?'<span class="badge bamb" style="font-size:10px">D-'+d+'</span>':'<span style="font-size:10px;color:var(--tm)">~'+m.due_date+'</span>';
              const pCls=m.priority==='urgent'?'bred':m.priority==='low'?'bgh':'bpri';
              return `<div class="hw-mention" onclick="Nav.go('mentions')" style="border-left:3px solid var(--pri);padding-left:8px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;font-weight:600">${H.e(m.from||'?')}</span>
                  <div style="display:flex;gap:4px;align-items:center">
                    <span class="badge ${pCls}" style="font-size:10px">${m.priority==='urgent'?'긴급':m.priority==='low'?'낮음':'일반'}</span>
                    ${dTag}
                  </div>
                </div>
                <div style="font-size:11px;color:var(--tm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${H.e((m.text||'').slice(0,40))}</div>
              </div>`;
            }).join("")}
            ${_over.length>4?`<div style="text-align:center;font-size:11px;color:var(--tm);padding:4px">외 ${_over.length-4}건</div>`:""}
          </div>
        </div>`;
      })()}
<!-- 공지사항 -->
      <div class="hw-panel">
        <div class="hw-panel-head">
          <div class="hw-panel-title">📢 공지사항</div>
          <span class="hw-panel-more" onclick="Nav.go('settings')">관리 →</span>
        </div>
        <div class="hw-panel-body">
          ${(()=>{
            const _td=H.today();
            const _vis=App.notices.filter(n=>n.show&&(!n.expire||n.expire>=_td)&&(!n.date||n.date<=_td));
            return _vis.length===0
              ?'<div style="padding:12px 0;text-align:center;color:#94a3b8;font-size:12px">📭 공지사항이 없습니다.</div>'
              :_vis.map(n=>`
              <div class="hw-notice" onclick="Modal.open({title:'📢 공지사항',size:'mmd',body:\`<div style='font-weight:700;font-size:14px;margin-bottom:10px'>${H.e(n.title)}</div><div style='font-size:13px;line-height:1.7'>${H.e(n.body||"")}</div>\`})">
                <div class="hw-notice-row">
                  <span class="hw-notice-new">NEW</span>
                  <div class="hw-notice-title">${H.e(n.title)}</div>
                </div>
                <div class="hw-notice-meta"><span>✍ ${H.e(n.author)}</span><span>📅 ${n.date}~${n.expire||""}</span></div>
              </div>`).join('');
          })()}
        </div>
      </div>
    </div>
  </div>`;
},

/* ── 개인정보 수정 ── */
/* ── 멘션 답장 [v2.394→v2.394] ── */
  /* [v2.394 A안] _mentionReply 전체 재작성 — 문자열 연결 방식 (백틱 중첩 제거) */
  _mentionReply(parentId, toUser){
    const parent=DB.mentions.find(m=>Number(m.id)===Number(parentId));
    if(!parent){Toast.show('원본 멘션을 찾을 수 없습니다.','err');return;}
    const me=Auth._u;
    const meUser=DB.users.find(u=>u.username===(me?.username||Auth._cur))||{name:'관리자',department:'IT팀'};
    const originText=H.e((parent.text||parent.message||'').slice(0,80));
    const hasMore=(parent.text||parent.message||'').length>80?'...':'';
    const activeUsers=DB.users.filter(u=>u.active!==0);
    const opts=activeUsers.map(u=>{
      const sel=(u.name===toUser||u.username===toUser)?' selected':'';
      return '<option value="'+H.e(u.username)+'"'+sel+'>'+H.e(u.name)+'</option>';
    }).join('');
    const bodyHtml=
      '<div style="padding:10px 12px;background:var(--bg);border-radius:var(--r);border-left:3px solid var(--pri);margin-bottom:12px;font-size:12px;color:var(--tm)">'
      +'<strong>원본:</strong> '+originText+hasMore+'</div>'
      +'<div class="lfg"><label>받는 사람</label>'
      +'<select class="fc" id="rplyTo">'+opts+'</select></div>'
      +'<div class="lfg"><label>메시지 <span style="color:#ef4444">*</span></label>'
      +'<textarea class="fc" id="rplyText" rows="4" placeholder="답장 내용을 입력하세요..."></textarea></div>';
    const footHtml=
      '<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" onclick="Pages._mentionReplySend('+parentId+')">↩ 답장 발송</button>';
    Modal.open({title:'↩ 답장 — @'+H.e(toUser)+'에게', size:'mmd', body:bodyHtml, foot:footHtml});
    setTimeout(()=>{const t=document.getElementById('rplyText');if(t)t.focus();},80);
  },

async _mentionReplySend(parentId){
  /* [v2.394 PhaseB] thread_id 기반 SB 스레드 저장 */
  const text=(document.getElementById('rtext')?.value||'').trim();
  if(!text){Toast.show('내용을 입력하세요.','warn');return}
  const me=Auth._u;
  const meUser=DB.users.find(u=>u.username===(me?.username||Auth._cur))||{name:'관리자',dept:''};
  const parent=DB.mentions.find(m=>m.id===parentId);
  const row={
    from:      meUser.name||Auth._cur||'admin',
    dept:      meUser.dept||meUser.department||'',
    to:        parent?.from||'',
    to_list:   [parent?.from||''].filter(Boolean),
    text,
    message:   text,
    channel:   parent?.channel||'general',
    type:      'mention',
    priority:  'normal',
    status:    'open',
    thread_id: parentId,
    reply_to:  parentId,
    ref:       parent?.ref||'',
    read:      false,
    created_at:new Date().toISOString(),
  };
  const res=await SB.addMention(row);
  if(!res.ok) return;
  if(parent){
    if(!parent.replies) parent.replies=[];
    parent.replies.push({...row, id:res.id||Date.now()});
  }
  document.getElementById('rtext').value='';
  Toast.show('답글이 전송되었습니다.','ok');
  /* [v2.394] 입력창 초기화 + 배지 갱신 + 팝업 재렌더 */
  const _rtEl=document.getElementById('rtext');
  if(_rtEl) _rtEl.value='';
  TopNav.updateMentionBadge();
  Pages._mentionReplyView(parentId);
},
async _approveUser(userId, username){
  if(Auth._u?.role!=='admin'){Toast.show('관리자만 승인 가능합니다.','err');return}
  const res=await SB.updateUser(userId,{active:1,pending:false,updated_at:H.today()});
  if(!res.ok) return;
  const u=DB.users.find(u=>u.id===userId);
  if(u){u.active=1;u.pending=false;}
  Toast.show(`${username} 계정이 승인되었습니다.`,'ok');
  /* [v2.394] 승인 후 화면 유지 — usermgmt 탭 그대로 */
  const pane=document.querySelector('.stab-pane[data-tab="usermgmt"]');
  if(pane) pane.innerHTML=renderUserMgmt();
},

async _rejectUser(userId, username){
  if(Auth._u?.role!=='admin'){Toast.show('관리자만 처리 가능합니다.','err');return}
  Modal.confirm({title:'가입 거절',msg:`"${username}" 가입 신청을 거절하고 계정을 삭제하시겠습니까?`,danger:true,
    onOk:async()=>{
      await SB.deleteUser(userId);
      DB.users=DB.users.filter(u=>u.id!==userId);
      Toast.show(`${username} 가입 신청이 거절되었습니다.`,'ok');
      Pages.settings();
    }
  });
},

/* ── 사용자 권한 변경 (설정 > 사용자 관리, v2.394) ── */
async _setUserRole(userId, newRole){
  if(Auth._u?.role!=='admin'){Toast.show('관리자만 권한을 변경할 수 있습니다.','err');return}
  const res=await SB.updateUser(userId,{role:newRole,updated_at:H.today()});
  if(!res.ok) return;
  const u=DB.users.find(u=>u.id===userId);
  if(u) u.role=newRole;
  Toast.show(`${username} 권한이 ${{admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'}[newRole]||newRole}으로 변경되었습니다.`,'ok');
},

/* 접근 권한 저장 (sessionStorage, v2.394) */
/* [v2.394] perms 저장 — sessionStorage + SB users 테이블 */
_savePerms(){
  try{
    const permsStr=JSON.stringify(App.perms||{});
    sessionStorage.setItem('qms_perms',permsStr);
    /* SB users 테이블에도 저장 (perms 컬럼) */
    if(typeof _sb!=='undefined'&&_sb&&Auth._u?.id){
      _sb.from('users').update({perms:permsStr}).eq('id','system').then(()=>{});
    }
    Toast.show('권한 설정이 저장되었습니다.','ok');
  }catch(e){Toast.show('저장 실패: '+e.message,'err');}
},

/* 비밀번호 변경 (설정 탭, v2.394) */
async _changePw(){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const cur=g('sPwCur'),nw=g('sPwNew'),nw2=g('sPwNew2');
  if(!cur){Toast.show('현재 비밀번호를 입력하세요.','warn');return}
  if(!nw||nw.length<8){Toast.show('새 비밀번호는 8자 이상이어야 합니다.','warn');return}
  if(nw!==nw2){Toast.show('새 비밀번호가 일치하지 않습니다.','warn');return}
  const user=Auth._u;
  if(!user){Toast.show('로그인 정보를 찾을 수 없습니다.','err');return}
  /* [v2.394] admin 비밀번호 변경 — sessionStorage 저장 */
  if(user.username==='admin'){
    const savedAdmin=JSON.parse(sessionStorage.getItem('qms_admin')||'null');
    const curHash=await H.sha256(cur);
    const defHash=await H.sha256('admin1234');
    const validHash=savedAdmin?.pwHash||defHash;
    if(curHash!==validHash){Toast.show('현재 비밀번호가 올바르지 않습니다.','err');return}
    const newH=await H.sha256(nw);
    const adminInfo={...user};
    sessionStorage.setItem('qms_admin',JSON.stringify({pwHash:newH,info:adminInfo}));
    Auth._u.password=newH;
    sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
    ['sPwCur','sPwNew','sPwNew2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    Toast.show('관리자 비밀번호가 변경되었습니다.','ok');
    return;
  }
  /* 일반 사용자 비밀번호 변경 */
  const curHash=await H.sha256(cur);
  if(curHash!==user.password){Toast.show('현재 비밀번호가 올바르지 않습니다.','err');return}
  const newHash=await H.sha256(nw);
  const res=await SB.updateUser(user.id,{password:newHash,updated_at:H.today()});
  if(!res.ok) return;
  Auth._u.password=newHash;
  sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
  ['sPwCur','sPwNew','sPwNew2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  Toast.show('비밀번호가 변경되었습니다.','ok');
},
/* ── 개인정보 팝업 ──
   [v2.394] 2-B: 로그인 사용자 실제 정보 표시
   Auth._u에서 직접 읽어 항상 최신 정보 반영 */
_profileEdit(){
  /* Auth._u가 없으면 sessionStorage에서 복원 */
  let user=Auth._u;
  if(!user){
    try{ const s=sessionStorage.getItem('qms_auth'); user=s?JSON.parse(s).u:null; }catch(e){}
  }
  if(!user) user={id:null,username:'admin',name:'시스템관리자',department:'IT팀',tel:'',email:'',role:'admin'};
  const roleMap={admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'};
  Modal.open({title:'👤 내 정보',size:'mmd',
    body:`<div style="text-align:center;margin-bottom:18px">
      <div style="width:56px;height:56px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin:0 auto 8px">${H.e((user.name||user.username||'?').charAt(0))}</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:2px">${H.e(user.name||user.username)}</div>
      <div style="font-size:12px;color:#64748b">${H.e(user.username)} · ${roleMap[user.role]||user.role||''}</div>
    </div>
    <div class="fg2">
      <div class="fgroup ff"><label class="fl">아이디</label>
        <input class="fc" value="${H.e(user.username||'')}" readonly style="background:#f1f5f9;color:#64748b"></div>
      <div class="fgroup ff"><label class="fl req">이름</label>
        <input class="fc" id="pf_name" value="${H.e(user.name||'')}"></div>
      <div class="fgroup ff"><label class="fl">부서</label>
        <input class="fc" id="pf_dept" value="${H.e(user.department||user.dept||'')}" placeholder="예) 품질팀"></div>
      <div class="fgroup ff"><label class="fl">연락처</label>
        <input class="fc" id="pf_tel" value="${H.e(user.tel||'')}" placeholder="010-0000-0000"></div>
      <div class="fgroup ff"><label class="fl">E-MAIL</label>
        <input class="fc" id="pf_email" type="email" value="${H.e(user.email||'')}" placeholder="user@company.com"></div>
      <div class="fgroup ff"><label class="fl">새 비밀번호</label>
        <input class="fc" id="pf_pw" type="password" placeholder="변경 시만 입력 (8자 이상)"></div>
      <div class="fgroup ff"><label class="fl">비밀번호 확인</label>
        <input class="fc" id="pf_pw2" type="password" placeholder="변경 시만 입력"></div>
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri" onclick="Pages._profileSave(${user.id||'null'},'${H.e(user.username)}')">저장</button>`
  });
},
/* [v2.394] 설정 사용자관리 이름 클릭 → id로 사용자 찾아 수정 팝업 */
_uFormById(userId){
  const u=DB.users.find(x=>Number(x.id)===Number(userId));
  if(u) Pages._uForm(u);
  else Toast.show('사용자 정보를 찾을 수 없습니다.','err');
},

/* ── 사용자 삭제 (목록 버튼) [v2.394] ── */
async _uDelete(userId){
  const u=DB.users.find(x=>Number(x.id)===Number(userId));
  if(!u){Toast.show('사용자 정보를 찾을 수 없습니다.','err');return;}
  /* 사유 입력 Modal */
  Modal.open({
    title:'🗑️ 사용자 삭제',
    size:'msm',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn berr" onclick="Pages._uDeleteConfirm('+userId+')">삭제 확인</button>',
    body:`<div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">
        <span class="badge bblu">${H.e(u.username)}</span> ${H.e(u.name||'')} 사용자를 삭제합니다.
      </div>
      <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:6px;padding:10px;font-size:12px;color:#991b1b;margin-bottom:10px">
        ⚠️ 삭제된 계정은 복구할 수 없습니다.
      </div>
      <label class="fl req" style="font-size:12px;font-weight:700;margin-bottom:4px;display:block">삭제 사유 <span style="color:#dc2626">*</span></label>
      <textarea class="fc" id="uDelReason" rows="3" placeholder="삭제 사유를 반드시 입력하세요 (예: 퇴사, 중복계정 등)"
        style="font-size:12px;width:100%"></textarea>
    </div>`,
  });
  window._uDeleteTargetId=userId;
},

/* ── 사용자 삭제 확인 실행 [v2.394] ── */
async _uDeleteConfirm(userId){
  const reason=document.getElementById('uDelReason')?.value.trim();
  if(!reason){Toast.show('삭제 사유를 입력하세요.','warn');return;}
  const uid=userId||window._uDeleteTargetId;
  if(!uid){Toast.show('삭제할 사용자를 찾을 수 없습니다.','err');return;}
  const res=await SB.deleteUser(Number(uid));
  if(!res?.ok) return;
  /* [v2.397.2 버그수정] 삭제 후 목록 완전 갱신
     근본 원인: settings()는 async(DB 조회) 작업 포함 → 80ms setTimeout 으로는
               DOM 완성 전에 btn.click()이 실행됨 → usermgmt 탭 미활성
     수정: sysusers() 검증 패턴 동일 적용 (200ms + btn.click())
     참고: window.renderTab = settings() 마지막에 전역 노출 → 200ms 후 안전 */

  /* ① 로컬 DB 즉시 필터링 */
  DB.users = DB.users.filter(u => Number(u.id) !== Number(uid));
  Modal.close();
  Toast.show('사용자가 삭제되었습니다.', 'ok');

  /* ② SB 최신 users 재조회 */
  try{
    const fresh = await SB.getUsers();
    if(Array.isArray(fresh)) DB.users = fresh;
  }catch(e){}

  /* ③ settings() 전체 재렌더 (sysusers()와 동일 패턴) */
  await Pages.settings();

  /* ④ 200ms 후 usermgmt 탭 클릭 — DOM 완성 보장 후 실행 */
  setTimeout(function(){
    const btn = document.querySelector('.stab-btn[data-tab="usermgmt"]');
    if(btn && !btn.disabled) btn.click();
  }, 200);
},
_uStatusPopup(userId, userName){
  const u=DB.users.find(x=>x.id===userId);
  if(!u){Toast.show('사용자 정보를 찾을 수 없습니다.','err');return;}
  const statusBadge=`<span class="badge ${u.active?'bgrn':'bgry'}" style="font-size:14px;padding:4px 12px">${u.active?'활성':'비활성'}</span>`;
  Modal.open({title:'👤 사용자 상태',size:'msm',
    body:`<div style="text-align:center;padding:20px 0">
      <div class="cav" style="width:56px;height:56px;font-size:22px;margin:0 auto 12px">${H.e((u.name||u.username).charAt(0))}</div>
      <div style="font-weight:700;font-size:16px;margin-bottom:4px">${H.e(u.name||u.username)}</div>
      <div style="color:var(--tm);font-size:12px;margin-bottom:16px">${H.e(u.username)} · ${H.e(u.department||'-')}</div>
      <div style="margin-bottom:16px">${statusBadge}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <div style="background:var(--bg);border-radius:var(--r);padding:8px 16px;font-size:12px"><span style="color:var(--tm)">연락처</span><br><strong>${H.e(u.tel||u.phone||'-')}</strong></div>
        <div style="background:var(--bg);border-radius:var(--r);padding:8px 16px;font-size:12px"><span style="color:var(--tm)">이메일</span><br><strong style="color:var(--acc)">${u.email?H.e(u.email):'-'}</strong></div>
        <div style="background:var(--bg);border-radius:var(--r);padding:8px 16px;font-size:12px"><span style="color:var(--tm)">등록일</span><br><strong>${H.e(u.created_at||'-')}</strong></div>
      </div>
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
      <button class="btn ${u.active?'berr':'bgrn'}" onclick="Pages._uToggleActive(${userId})">
        ${u.active?'🔒 비활성화':'✅ 활성화'}
      </button>`
  });
},
/* [v2.394] 사용자 활성/비활성 토글 */
async _uToggleActive(userId){
  const u=DB.users.find(x=>x.id===userId);
  if(!u) return;
  const newActive=u.active?0:1;
  const res=await SB.updateUser(userId,{active:newActive});
  if(!res.ok) return;
  u.active=newActive;
  Modal.close();
  Toast.show(`${u.name||u.username} ${newActive?'활성화':'비활성화'} 완료`,'ok');
  Pages.settings();
},
/* [v2.394] _profileSave —
   Auth._u 실시간 갱신 + SB 업데이트 */
async _profileSave(userId, username){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const name=g('pf_name'),pw=g('pf_pw'),pw2=g('pf_pw2'),email=g('pf_email');
  if(!name){Toast.show('이름은 필수입니다.','warn');return}
  if(pw&&pw.length<8){Toast.show('비밀번호는 8자 이상이어야 합니다.','warn');return}
  if(pw&&pw!==pw2){Toast.show('비밀번호가 일치하지 않습니다.','warn');return}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){Toast.show('올바른 이메일 형식을 입력하세요.','warn');return}
  const today=H.today();
  const patch={name, department:g('pf_dept'), tel:g('pf_tel'), email, updated_at:today};
  if(pw) patch.password=await H.sha256(pw);
  /* admin 계정은 DB에 없으므로 세션만 갱신 */
  if(username==='admin'||!userId||userId==='null'){
    if(Auth._u) Object.assign(Auth._u, patch);
    sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
  } else {
    const res=await SB.updateUser(userId,patch);
    if(!res.ok) return;
    /* 로컬 캐시 갱신 */
    const idx=DB.users.findIndex(u=>u.username===username);
    if(idx>=0) Object.assign(DB.users[idx],patch);
    /* Auth._u 갱신 */
    if(Auth._u?.username===username) Object.assign(Auth._u,patch);
    sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
  }
  /* TopNav 이름 즉시 반영 */
  const tbuser=document.getElementById('tbuser');
  if(tbuser) tbuser.textContent=name;
  const uname=document.getElementById('uname');
  if(uname) uname.textContent=name;
  Toast.show('개인정보가 수정되었습니다.','ok');
  Modal.close();
},
_homeCard(subs){/* 레거시 */},


/* ── 대시보드 ── */
dash(){
  const w=document.getElementById('pw');
  w.innerHTML=`<div class="ph"><div><div class="ptit">📊 대시보드</div><div class="psub">품질경영시스템 종합 현황</div></div></div>
  <div class="sg">
    <div class="sc"><div class="si sbl">📦</div><div><div class="sv">${DB.items.length}</div><div class="sl">등록 품목</div></div></div>
    <div class="sc"><div class="si spl">🏢</div><div><div class="sv">${DB.vendors.length}</div><div class="sl">등록 거래처</div></div></div>
    <div class="sc"><div class="si sgl">🔍</div><div><div class="sv">${DB.inspections.length}</div><div class="sl">이번 달 검사</div></div></div>
    <div class="sc"><div class="si sal">⚠️</div><div><div class="sv" style="color:var(--warn)">${DB.nc.filter(n=>n.status!=='완료').length}</div><div class="sl">미결 부적합</div></div></div>
    <div class="sc"><div class="si srl">🔬</div><div><div class="sv" style="color:var(--err)">${DB.equip.filter(e=>e.status==='교정만료').length}</div><div class="sl">교정 만료</div></div></div>
    <div class="sc"><div class="si stl">🔧</div><div><div class="sv">${DB.cars.filter(c=>c.status!=='완료').length}</div><div class="sl">진행 중 CAR</div></div></div>
  </div>
  <div class="g2" style="margin-bottom:13px">
    <div class="card"><div class="ch"><div class="ct">⚠️ 미결 부적합</div><button class="btn bout bsm" onclick="Nav.go('nc')">전체보기</button></div>
      ${DB.nc.filter(n=>n.status!=='완료').map(n=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px"><div><div style="font-weight:600">${H.e(n.no)}</div><div style="color:var(--tm)">${H.e(n.desc)}</div></div><span class="badge bamb">${H.e(n.status)}</span></div>`).join('')}
    </div>
    <div class="card"><div class="ch"><div class="ct">🔧 시정조치 현황</div><button class="btn bout bsm" onclick="Nav.go('car')">전체보기</button></div>
      ${DB.cars.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px"><div><div style="font-weight:600">${H.e(c.no)}</div><div style="color:var(--tm)">${H.e(c.title)}</div></div><span class="badge ${c.status==='완료'?'bgrn':c.status==='처리중'?'bamb':'bgry'}">${H.e(c.status)}</span></div>`).join('')}
    </div>
  </div>
  <div class="card"><div class="ch"><div class="ct">🔍 최근 검사</div></div>
    <div class="ts"><table class="dt" style="font-size:12px"><thead><tr><th>유형</th><th>품목</th><th>검사일</th><th>LOT</th><th>결과</th></tr></thead><tbody>
    ${DB.inspections.map(i=>`<tr><td><span class="badge bblu">${H.e(i.type)}</span></td><td>${H.e(i.item)}</td><td>${i.date}</td><td style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(i.lot)}</td><td><span class="badge ${i.result==='합격'?'bgrn':'bred'}">${H.e(i.result)}</span></td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
},

/* ── 품목 등록 (컬럼 재설계) ── */
async items(){
  /* ── 품목 등록 페이지
     [v2.394 수정] 통계 카드 실시간 재계산:
     render() 호출 시마다 data 기준으로 통계 재계산
     삭제/등록 후 즉시 숫자 반영 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  /* [v2.394 수정] _sbFetchAll 전체 로드 복원
     Phase1 _sbPage는 count 오류로 데이터 사라짐 버그 발생
     → _sbFetchAll로 안전하게 전체 로드 후 로컬 필터 방식 유지
     대용량 시: 향후 올바른 페이지네이션 방식으로 단계적 전환 */
  const allItems=await SB.getItems();
  DB.items=Array.isArray(allItems)?allItems:[];
  let data=[...DB.items], search='', cat='';

  const COLS=[
    {key:'major_category',label:'대분류',  w:'80px', render:v=>`<span class="badge bgry">${H.e(v||'-')}</span>`},
    {key:'category',      label:'품목분류', w:'78px', req:true, render:v=>`<span class="badge bblu">${H.e(v||'-')}</span>`},
    {key:'item_code', label:'품목코드', req:true, w:'100px',
      render:(v,row)=>`<span
        style="cursor:pointer;color:var(--pri);font-weight:600"
        onmouseover="this.style.textDecoration='underline'"
        onmouseout="this.style.textDecoration='none'"
        onclick="event.stopPropagation();Pages._iForm(${JSON.stringify(row).replace(/"/g,'&quot;')})"
        title="클릭하여 상세 보기">${H.e(v)}</span>`},
    {key:'item_name',     label:'품목명'},
    {key:'spec',          label:'규격',    w:'105px'},
    {key:'unit',          label:'단위',    w:'48px', align:'center'},
    {key:'material',      label:'재질',    w:'78px'},
    {key:'vendor_name',   label:'주 거래처', req:true,w:'110px'},
    {key:'active',        label:'사용',    w:'52px', align:'center',
      render:v=>`<span class="badge ${v?'bgrn':'bgry'}">${v?'사용':'미사용'}</span>`},
    {key:'created_at',    label:'등록일',  w:'84px'},
    {key:'updated_at',    label:'수정일',  w:'84px', render:v=>v?H.e(v):''},
    {key:'id',            label:'파일',    w:'68px', align:'center',
      render:(v)=>FM.btn(`item-${v}`)},
  ];

  /* ── render: 통계 카드 + 테이블 동시 갱신 ── */
  const render=()=>{
    const d=data.filter(i=>
      (search?i.item_name.includes(search)||i.item_code.includes(search):true)&&
      (cat?i.category===cat:true)
    );
    /* 통계 실시간 재계산 (삭제/등록 후 즉시 반영) */
    const total=data.length;
    const active=data.filter(i=>i.active).length;
    const byType={};data.forEach(i=>{byType[i.category]=(byType[i.category]||0)+1});
    const withFile=data.filter(i=>FM.has(`item-${i.id}`)).length;

    /* 통계 카드 업데이트 (DOM 존재 시) */
    const sd=w.querySelector('.stat-dash');
    if(sd){
      const vals=sd.querySelectorAll('.sd-val');
      if(vals[0]) vals[0].textContent=total;
      if(vals[1]) vals[1].textContent=active;
      if(vals[2]) vals[2].textContent=total-active;
      if(vals[3]) vals[3].textContent=withFile;
    }

    /* 테이블 렌더링 */
    const tc=w.querySelector('#itbl');
    if(tc) Tbl.render({el:'#itbl',cols:COLS,data:d,
      onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 품목 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        /* [v2.394] 즉시 로컬 제거 → 화면 먼저 갱신 */
        DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
        data=data.filter(i=>!numIds.includes(Number(i.id)));
        render();
        /* SB 일괄 삭제 (IN 쿼리 1번) */
        const res=await SB.deleteItems(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
      };
      Modal.confirm({
        title:'🗑️ 품목 삭제 확인',
        msg:`<div style="text-align:center">
          <div style="font-size:30px;margin-bottom:8px">⚠️</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:8px">
            선택한 <span style="color:#dc2626">${ids.length}건</span>의 품목 데이터를 삭제합니다.</div>
          <div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다.<br>계속 진행하시겠습니까?</div>
        </div>`,
        danger:true,
        onOk:_doDelete
      });
    },
      onRow:row=>Pages._iForm(row)});
  };

  /* ── 초기 렌더링 ── */
  const total=data.length;
  const active=data.filter(i=>i.active).length;
  const byType={};data.forEach(i=>{byType[i.category]=(byType[i.category]||0)+1});
  const withFile=data.filter(i=>FM.has(`item-${i.id}`)).length;

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#dbeafe;color:#2563eb">📦</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체 품목</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${active}</div><div class="sd-lbl">사용 품목</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#475569">⏸</div>
        <div><div class="sd-val">${total-active}</div><div class="sd-lbl">미사용</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fed7aa;color:#9a3412">📎</div>
        <div><div class="sd-val">${withFile}</div><div class="sd-lbl">파일 첨부</div></div></div>
      ${Object.entries(byType).map(([t,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${H.e(t)}</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">📦 품목 등록</div><div class="psub">검사·관리에 사용되는 품목 기준정보</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._iForm()">+ 품목 등록 <span class="kbd">F2</span></button>
        <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('items')" title="엑셀 양식 내려받기">📥 양식 내려받기</button>
        <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('items')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
        <button class="btn btn-xl-up bsm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none"
          onclick="ExcelMgr.openUploadAll()" title="멀티시트 통합 일괄등록 (A+C안)">🗂️ 통합 일괄등록</button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" placeholder="품목코드, 품목명 검색..." oninput="Pages._iS(this.value)"></div>
      <select class="fsel" onchange="Pages._iC(this.value)">
        <option value="">전체 분류</option>${['원자재','부자재','반제품','완제품','소모품'].map(c=>`<option>${c}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('items')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="itbl"></div>`;

  Pages._iS=v=>{search=v; render()};
  Pages._iC=v=>{cat=v; render()};
  render();
},

/* ── 거래처 ── */
async vendors(){
  /* [v2.394] SB 연동 + 통계 실시간 갱신 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const allVendors=await SB.getVendors();
  DB.vendors=allVendors;
  let data=[...allVendors];
  const total=data.length;
  const active=data.filter(v=>v.active).length;
  const byType={};data.forEach(v=>{byType[v.vendor_type]=(byType[v.vendor_type]||0)+1});
  const topType=Object.entries(byType).sort((a,b)=>b[1]-a[1])[0];

  w.innerHTML=`
    <!-- 통계 대시보드 -->
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">🏢</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체 거래처</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${active}</div><div class="sd-lbl">정상 거래처</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⏸</div>
        <div><div class="sd-val">${total-active}</div><div class="sd-lbl">비활성</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📊</div>
        <div><div class="sd-val">${topType?topType[0]:'-'}</div><div class="sd-lbl">최다 유형 (${topType?topType[1]:0}건)</div></div></div>
      ${Object.entries(byType).map(([t,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl" style="font-size:11px">${H.e(t)}</div><div class="sd-val" style="font-size:18px">${n}</div></div>`).join('')}
    </div>
    <!-- 헤더 -->
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">🏢 거래처 등록</div><div class="psub">납품·외주 거래처 기준정보</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._vForm()">+ 거래처 등록 <span class="kbd">F2</span></button>
        <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('vendors')" title="엑셀 양식 내려받기">📥 양식 내려받기</button>
        <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('vendors')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
        <button class="btn bsm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none"
          onclick="ExcelMgr.openUploadAll('vendors')" title="거래처 통합 일괄등록">🗂️ 통합 일괄등록</button>
      </div>
    </div>
    <!-- 툴바 -->
    <div class="tbar">
      <div class="sw2"><input type="text" id="vSearch" placeholder="거래처명, 사업자번호 검색..." oninput="Pages._vFilter()"></div>
      <select class="fsel" id="vTypeF" onchange="Pages._vFilter()">
        <option value="">전체 유형</option>${['원자재','부자재','소모품','외주','기타'].map(t=>`<option>${t}</option>`).join('')}
      </select>
      <select class="fsel" id="vStatusF" onchange="Pages._vFilter()">
        <option value="">전체 상태</option><option value="1">정상</option><option value="0">비활성</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('vendors')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="vtbl"></div>`;

  Pages._vRender();
},
_vFilter(){
  const s=(document.getElementById('vSearch')?.value||'').trim();
  const t=document.getElementById('vTypeF')?.value||'';
  const st=document.getElementById('vStatusF')?.value||'';
  const d=DB.vendors.filter(v=>{
    if(s&&!v.vendor_name.includes(s)&&!(v.biz_no||'').includes(s)&&!(v.email||'').includes(s))return false;
    if(t&&v.vendor_type!==t)return false;
    if(st!==''&&String(v.active)!==st)return false;
    return true;
  });
  Pages._vRender(d);
},
_vRender(data){
  /* [v2.394] 통계 카드 실시간 갱신 */
  data=data||DB.vendors;
  /* 통계 업데이트 */
  const total=data.length, active=data.filter(v=>v.active).length;
  const byType={};data.forEach(v=>{byType[v.vendor_type]=(byType[v.vendor_type]||0)+1});
  const topType=Object.entries(byType).sort((a,b)=>b[1]-a[1])[0];
  const sd=document.querySelector('.pw .stat-dash');
  if(sd){
    const vals=sd.querySelectorAll('.sd-val');
    if(vals[0]) vals[0].textContent=total;
    if(vals[1]) vals[1].textContent=active;
    if(vals[2]) vals[2].textContent=total-active;
    if(vals[3]) vals[3].textContent=topType?topType[0]:'-';
  }
  Tbl.render({el:'#vtbl',cols:[
    {key:'vendor_type',label:'유형',      w:'70px', render:v=>`<span class="badge bpur">${H.e(v||'-')}</span>`},
    {key:'biz_no',     label:'사업자번호',w:'108px'},
    {key:'vendor_name',label:'거래처명', req:true,
      render:(v,row)=>`<span
        style="cursor:pointer;color:var(--pri);font-weight:600"
        onmouseover="this.style.textDecoration='underline'"
        onmouseout="this.style.textDecoration='none'"
        onclick="event.stopPropagation();Pages._vForm(JSON.parse(this.dataset.row))"
        data-row="${JSON.stringify(row).replace(/"/g,'&quot;')}"
        title="클릭하여 상세 보기">${H.e(v)}</span>`},
    {key:'ceo_name',   label:'대표자',    w:'70px'},
    {key:'tel',        label:'전화번호',  w:'112px'},
    {key:'fax',        label:'FAX번호',   w:'112px', render:v=>H.e(v||'-')},
    {key:'email',      label:'E-MAIL',    w:'150px', render:v=>v?`<a href="mailto:${H.e(v)}" style="color:var(--acc)">${H.e(v)}</a>`:'-'},
    {key:'manager',    label:'담당자',    w:'70px'},
    {key:'manager_tel',label:'담당자 연락처',w:'112px',render:v=>H.e(v||'-')},
    {key:'manager_email',label:'담당자 E-MAIL',w:'150px',render:v=>v?`<a href="mailto:${H.e(v)}" style="color:var(--acc)">${H.e(v)}</a>`:'-'},
    {key:'active',     label:'상태',      w:'55px',  align:'center',render:v=>`<span class="badge ${v?'bgrn':'bgry'}">${v?'정상':'비활성'}</span>`},
    {key:'created_at', label:'등록일',    w:'88px'},
    {key:'updated_at', label:'수정일',    w:'88px',  render:v=>v?H.e(v):''},
    {key:'id',         label:'파일',      w:'70px',  align:'center',render:(v)=>FM.btn(`vendor-${v}`)},
  ],data,onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 거래처 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));
        Pages._vRender();
        const res=await SB.deleteVendors(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
      };
      Modal.confirm({
        title:'🗑️ 거래처 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 거래처를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    },onRow:row=>Pages._vendorDetail(row)});
},
/* ── 품목 상세/등록/수정 팝업 ──
   [v2.394] 행 클릭 또는 품목코드 클릭 시 상세 팝업 열림 */
_iForm(row=null){
  const e=!!row;
  const MAJOR=['수지가공','금속가공','VALVE','FITTING','PUMP','유량계','소재판매'];
  const CAT=['원자재','부자재','반제품','완제품','소모품'];
  Modal.open({title:e?`📦 품목 상세 — ${H.e(row.item_code)}`:'📦 품목 등록',size:'mlg',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl">대분류</label>
        <select class="fc" id="imaj">
          <option value="">선택</option>
          ${MAJOR.map(c=>`<option ${row?.major_category===c?'selected':''}>${c}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl req">품목분류</label>
        <select class="fc" id="ica">
          ${CAT.map(c=>`<option ${row?.category===c?'selected':''}>${c}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl req">품목코드</label>
        <input class="fc" id="ic" value="${H.e(row?.item_code||'')}" placeholder="예) RAW-001" ${e?'readonly':''}></div>
      <div class="fgroup"><label class="fl req">품목명</label>
        <input class="fc" id="in" value="${H.e(row?.item_name||'')}"></div>
      <div class="fgroup"><label class="fl">규격</label>
        <input class="fc" id="isp" value="${H.e(row?.spec||'')}" placeholder="예) SUS304 2T"></div>
      <div class="fgroup"><label class="fl">단위</label>
        <select class="fc" id="iu">
          ${['EA','KG','L','M','BOX','SET','개','개소'].map(u=>`<option ${row?.unit===u?'selected':''}>${u}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl">재질</label>
        <input class="fc" id="imt" value="${H.e(row?.material||'')}" placeholder="예) SUS304"></div>
      <div class="fgroup"><label class="fl">주 거래처</label>
        <select class="fc" id="ivn">
          <option value="">선택</option>
          ${DB.vendors.map(v=>`<option ${row?.vendor_id===v.id?'selected':''}>${H.e(v.vendor_name)}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl">사용여부</label>
        <select class="fc" id="iuse">
          <option value="1" ${!row||row.active?'selected':''}>사용</option>
          <option value="0" ${row&&!row.active?'selected':''}>미사용</option>
        </select></div>
      ${e?`<div class="fgroup"><label class="fl">등록일</label>
        <input class="fc" value="${H.e(row?.created_at||'')}" readonly style="background:#f8fafc"></div>`
       :`<div class="fgroup"></div>`}
      ${e?`<div class="fgroup"><label class="fl">수정일</label>
        <input class="fc" value="${H.e(row?.updated_at||H.today())}" readonly style="background:#f8fafc"></div>`
       :`<div class="fgroup"></div>`}
      ${e?`<div class="fgroup ff"><label class="fl">첨부파일</label>
        ${FM.btn('item-'+row.id)}
        <span style="font-size:12px;color:var(--tm);margin-left:8px">
          ${FM.has('item-'+row.id)?FM.get('item-'+row.id).length+'개 파일':'등록된 파일 없음'}
        </span></div>`:''}
      <div class="fgroup ff"><label class="fl">비고</label>
        <textarea class="fc" id="irmk" rows="2">${H.e(row?.remark||'')}</textarea>
      </div>
    </div>${e?`<div id="icmt"></div>`:''}`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
      <button class="btn bpri btn-f8" onclick="Pages._iSave(${row?.id||'null'})">
        ${e?'저장':'등록'} <span class="kbd">F8</span>
      </button>`
  });
  if(e) setTimeout(()=>Cmt.render('#icmt',`item-${row.id}`),80);
},

/* ── 품목 저장/수정 ── */
async _iSave(id){
  const v=k=>document.getElementById(k)?.value.trim()||'';
  const major=v('imaj'), cat=v('ica'), code=v('ic'), name=v('in');
  if(!cat){Toast.show('품목분류는 필수입니다.','warn');return}
  if(!code){Toast.show('품목코드는 필수입니다.','warn');document.getElementById('ic')?.classList.add('err');return}
  if(!name){Toast.show('품목명은 필수입니다.','warn');document.getElementById('in')?.classList.add('err');return}
  const dup=DB.items.find(i=>i.item_code===code&&(!id||i.id!==id));
  if(dup){
    Toast.show(`⚠️ 품목코드 "${code}"는 이미 등록된 코드입니다. (${dup.item_name})`,'err',5000);
    document.getElementById('ic')?.classList.add('err');return;
  }
  const today=H.today();
  const vidx=DB.vendors.find(vn=>vn.vendor_name===v('ivn'))?.id||null;
  const row={
    major_category:major, category:cat, item_code:code, item_name:name,
    spec:v('isp'), unit:v('iu'), material:v('imt'),
    vendor_name:v('ivn'), vendor_id:vidx,
    active:Number(document.getElementById('iuse')?.value||1),
    remark:v('irmk'),
  };
  if(id){
    const res=await SB.updateItem(id,{...row,updated_at:today});
    if(!res.ok) return;
    Toast.show('품목이 수정되었습니다.','ok');
  } else {
    const res=await SB.addItem({...row,created_at:today,updated_at:today});
    if(!res.ok) return;
    Toast.show('품목이 등록되었습니다.','ok');
  }
  Modal.close(); Pages.items();
},

_vForm(row=null){
  const e=!!row;
  const today=H.today();
  Modal.open({title:e?'🏢 거래처 수정':'🏢 거래처 등록',size:'mxl',
    body:`<div class="fg2">
      <!-- 1열: 유형, 사업자번호 -->
      <div class="fgroup"><label class="fl">유형</label>
        <select class="fc" id="vf_type">${['원자재','부자재','소모품','외주','기타'].map(t=>`<option ${row?.vendor_type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="fgroup"><label class="fl req">사업자번호</label>
        <input class="fc" id="vf_biz" value="${H.e(row?.biz_no||'')}" placeholder="000-00-00000"></div>
      <!-- 2열: 거래처명, 대표자 -->
      <div class="fgroup"><label class="fl req">거래처명</label>
        <input class="fc" id="vf_name" value="${H.e(row?.vendor_name||'')}"></div>
      <div class="fgroup"><label class="fl">대표자</label>
        <input class="fc" id="vf_ceo" value="${H.e(row?.ceo_name||'')}"></div>
      <!-- 3열: 전화번호, FAX번호 -->
      <div class="fgroup"><label class="fl req">전화번호</label>
        <input class="fc" id="vf_tel" value="${H.e(row?.tel||'')}" placeholder="02-0000-0000"></div>
      <div class="fgroup"><label class="fl">FAX번호</label>
        <input class="fc" id="vf_fax" value="${H.e(row?.fax||'')}" placeholder="02-0000-0001"></div>
      <!-- 4열: E-MAIL, 담당자 -->
      <div class="fgroup"><label class="fl req">E-MAIL</label>
        <input class="fc" id="vf_email" type="email" value="${H.e(row?.email||'')}" placeholder="info@company.co.kr"></div>
      <div class="fgroup"><label class="fl">담당자</label>
        <input class="fc" id="vf_mgr" value="${H.e(row?.manager||'')}"></div>
      <!-- 5열: 담당자 연락처, 담당자 E-MAIL -->
      <div class="fgroup"><label class="fl">담당자 연락처</label>
        <input class="fc" id="vf_mtel" value="${H.e(row?.manager_tel||'')}" placeholder="010-0000-0000"></div>
      <div class="fgroup"><label class="fl">담당자 E-MAIL</label>
        <input class="fc" id="vf_memail" type="email" value="${H.e(row?.manager_email||'')}" placeholder="manager@company.co.kr"></div>
      <div class="fgroup"><label class="fl">상태</label>
        <select class="fc" id="vf_active"><option value="1" ${!row||row.active?'selected':''}>정상</option><option value="0" ${row&&!row.active?'selected':''}>비활성</option></select></div>
      <!-- 6열: 주소 (전체) -->
      <div class="fgroup ff"><label class="fl">주소</label>
        <input class="fc" id="vf_addr" value="${H.e(row?.address||'')}"></div>
      <!-- 7열: 등록일, 수정일 (읽기전용) -->
      ${e?`<div class="fgroup"><label class="fl">등록일</label><input class="fc" value="${H.e(row?.created_at||today)}" readonly></div>
           <div class="fgroup"><label class="fl">수정일</label><input class="fc" value="${today}" readonly></div>`:''}
      <!-- 파일 첨부 (수정 시) -->
      ${e?`<div class="fgroup ff">
        <label class="fl">첨부파일</label>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          ${FM.btn('vendor-'+row.id)}
          <button class="btn bout bsm" onclick="Pages._vFileView(${row.id})">📋 파일 목록</button>
          <label class="btn bout bsm" style="cursor:pointer">📁 파일 추가
            <input type="file" multiple style="display:none" onchange="FM.add('vendor-${row.id}',this);Pages._vRefreshFile(${row.id})">
          </label>
          <span style="font-size:11px;color:var(--tm)">${FM.has('vendor-'+row.id)?FM.get('vendor-'+row.id).length+'개 파일':' 없음'}</span>
        </div>
      </div>`:''}
    </div>
    ${e?`<div id="vcmt"></div>`:''}`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._vSave(${row?.id||'null'})">${e?'저장':'등록'} <span class="kbd">F8</span></button>`
  });
  if(e)setTimeout(()=>Cmt.render('#vcmt',`vendor-${row.id}`),80);
}

/* ── 거래처 상세 팝업 [v2.394] ── */
,
/* ── 거래처 상세 팝업 [v2.394] ── */
_vendorDetail(row){
  /* 납품 실적 + 평가점수 + 부적합 이력 통합 */
  const evals=(DB.vendor_evals||[]).filter(e=>e.vendor_name===row.vendor_name);
  const audits=(DB.vendor_audits||[]).filter(a=>a.vendor_name===row.vendor_name);
  const inspections=(DB.inspections||[]).filter(i=>
    (i.vendor_name||'')===(row.vendor_name||'')||(i.vendor_id||0)===(row.id||0)
  ).filter(i=>i.type==='수입'||i.insp_type==='수입').slice(0,10);
  const ncs=(DB.nc||[]).filter(n=>
    (n.vendor_name||'')===(row.vendor_name||'')
  ).slice(0,10);
  const latestEval=evals[0];
  const GC={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};

  Modal.open({
    title:`🏢 거래처 상세 — ${H.e(row.vendor_name||'-')}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bgry bsm" onclick="Modal.close();Pages._vForm(${JSON.stringify(row).replace(/</g,'\u003c')})">✏️ 수정</button>`,
    body:`
      <!-- 기본 정보 -->
      <div class="card" style="padding:14px 18px;margin-bottom:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div class="ir"><div class="il">거래처명</div><div class="iv" style="font-weight:700">${H.e(row.vendor_name||'-')}</div></div>
          <div class="ir"><div class="il">구분</div><div class="iv"><span class="badge bblu">${H.e(row.vendor_type||'-')}</span></div></div>
          <div class="ir"><div class="il">대표자</div><div class="iv">${H.e(row.ceo||row.rep||'-')}</div></div>
          <div class="ir"><div class="il">사업자번호</div><div class="iv">${H.e(row.biz_no||'-')}</div></div>
          <div class="ir"><div class="il">전화</div><div class="iv">${H.e(row.tel||'-')}</div></div>
          <div class="ir"><div class="il">이메일</div><div class="iv">${H.e(row.email||'-')}</div></div>
          <div class="ir"><div class="il">담당자</div><div class="iv">${H.e(row.contact||'-')}</div></div>
          <div class="ir"><div class="il">주요품목</div><div class="iv">${H.e(row.main_item||'-')}</div></div>
        </div>
      </div>
      <!-- 최근 평가 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="card" style="padding:14px">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">⭐ 최근 평가</div>
          ${latestEval?`
            <div style="text-align:center;margin-bottom:8px">
              <span style="font-size:36px;font-weight:800;color:${GC[latestEval.grade]||'#374151'}">${latestEval.grade||'-'}</span>
              <span style="font-size:14px;color:var(--tm);margin-left:6px">${latestEval.total||'-'}점</span>
            </div>
            <div style="font-size:12px;color:var(--tm)">${H.e(latestEval.period||'-')}</div>
            <div style="font-size:11px;margin-top:6px">
              품질 ${latestEval.quality||0} | 납기 ${latestEval.delivery||0} | PPM ${H.n(latestEval.ppm)||0}
            </div>
          `:'<div style="text-align:center;color:var(--tl);padding:20px;font-size:12px">평가 없음</div>'}
        </div>
        <div class="card" style="padding:14px">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 납품 현황</div>
          <div style="font-size:12px">
            <div style="margin-bottom:6px">납품 검사: <b>${inspections.length}</b>건</div>
            <div style="margin-bottom:6px">합격: <b style="color:#059669">${inspections.filter(i=>i.result==='합격').length}</b>건</div>
            <div style="margin-bottom:6px">부적합: <b style="color:#dc2626">${ncs.length}</b>건</div>
            <div>심사: <b>${audits.length}</b>회</div>
          </div>
        </div>
      </div>
      <!-- 납품 이력 -->
      ${inspections.length?`<div class="card" style="padding:14px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">🚚 최근 납품 이력</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:var(--bg2)">
            <th style="padding:5px 8px;text-align:left">검사일</th>
            <th style="padding:5px 8px;text-align:left">품목명</th>
            <th style="padding:5px 8px;text-align:center">수량</th>
            <th style="padding:5px 8px;text-align:center">판정</th>
          </tr></thead><tbody>
          ${inspections.map((i,idx)=>`
            <tr style="border-bottom:1px solid var(--bd);background:${idx%2===0?'#fff':'var(--bg2)'}">
              <td style="padding:5px 8px">${H.e(i.insp_date||'-')}</td>
              <td style="padding:5px 8px">${H.e(i.item_name||'-')}</td>
              <td style="padding:5px 8px;text-align:center">${i.qty||'-'}</td>
              <td style="padding:5px 8px;text-align:center"><span class="badge ${i.result==='합격'?'bgrn':'bred'}" style="font-size:10px">${H.e(i.result||'-')}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`:''}
    `,
  });
},
/* [v2.394 수정] async로 전환 + SB.addVendor/updateVendor 연동
   기존: DB.vendors.push(더미) → vendors() 재로드 시 SB 결과로 덮어씌워져 사라짐
   수정: SB.addVendor/updateVendor 호출 → Supabase에 실제 저장 */
async _vSave(id){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const biz=g('vf_biz'),name=g('vf_name'),tel=g('vf_tel'),email=g('vf_email');
  if(!biz){Toast.show('사업자번호는 필수입니다.','warn');document.getElementById('vf_biz')?.classList.add('err');return}
  if(!name){Toast.show('거래처명은 필수입니다.','warn');document.getElementById('vf_name')?.classList.add('err');return}
  if(!tel){Toast.show('전화번호는 필수입니다.','warn');document.getElementById('vf_tel')?.classList.add('err');return}
  if(!email){Toast.show('E-MAIL은 필수입니다.','warn');document.getElementById('vf_email')?.classList.add('err');return}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){Toast.show('올바른 이메일 형식을 입력하세요.','warn');return}
  // 사업자번호 중복 검사
  const dupBiz=DB.vendors.find(v=>v.biz_no===biz&&(!id||v.id!==id));
  if(dupBiz){
    Toast.show(`⚠️ 사업자번호 "${biz}"는 이미 등록된 거래처입니다. (${dupBiz.vendor_name})`,'err',5000);
    document.getElementById('vf_biz')?.classList.add('err');return;
  }
  const today=H.today();
  const row={
    vendor_name:name, biz_no:biz, vendor_type:g('vf_type'),
    ceo_name:g('vf_ceo'), tel, fax:g('vf_fax'), email,
    manager:g('vf_mgr'), manager_tel:g('vf_mtel'), manager_email:g('vf_memail'),
    address:g('vf_addr'),
    active:Number(document.getElementById('vf_active')?.value||1),
  };
  if(id){
    const res=await SB.updateVendor(id,{...row,updated_at:today});
    if(!res.ok) return;
    Toast.show('거래처가 수정되었습니다.','ok');
  } else {
    const res=await SB.addVendor({...row,created_at:today,updated_at:today});
    if(!res.ok) return;
    Toast.show('거래처가 등록되었습니다.','ok');
  }
  Modal.close();Pages.vendors();
},
_vFileView(id){
  FM.modal('vendor-'+id);
},
_vRefreshFile(id){
  const span=document.querySelector('#gmo .fc[readonly]');
  const btn=document.querySelector('#gmo .fbtn');
  if(btn){btn.className=`fbtn ${FM.has('vendor-'+id)?'has':'no'}`;btn.textContent=FM.has('vendor-'+id)?'📎 '+FM.get('vendor-'+id).length+'개':'📎 없음';}
},

/* ── 사용자 ── */
async users(){
  /* [v2.394] 사원관리 — 인사 목록 (권한관리 없음, 활성사용자만) */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const allUsers=await SB.getUsers();
  if(allUsers) DB.users=allUsers;

  /* 활성 사용자만 (pending 제외, active=1) */
  const staff=DB.users.filter(u=>!u.pending&&u.active!==0);
  const udepts=new Set(staff.map(u=>u.department).filter(Boolean)).size;

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">👥</div><div><div class="sd-val">${staff.length}</div><div class="sd-lbl">전체 사원</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🏢</div><div><div class="sd-val">${udepts}</div><div class="sd-lbl">부서 수</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">👥 사원관리</div><div class="psub">인사 목록</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._staffForm()">+ 사원 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="staffSrch" placeholder="이름, 아이디, 부서 검색..." oninput="Pages._staffFilter()"></div>
      <select class="fsel" id="staffDeptF" onchange="Pages._staffFilter()">
        <option value="">전체 부서</option>
        ${[...new Set(staff.map(u=>u.department).filter(Boolean))].sort().map(d=>`<option>${d}</option>`).join('')}
      </select>
    </div>
    <div id="staffTbl"></div>`;
  Pages._staffRender();
},

/* 사원관리 목록 렌더 */
_staffRender(){
  const q=(document.getElementById('staffSrch')?.value||'').toLowerCase();
  const dept=document.getElementById('staffDeptF')?.value||'';
  const staff=DB.users.filter(u=>!u.pending&&u.active!==0);
  const filtered=staff.filter(u=>{
    const mQ=!q||(u.name||'').toLowerCase().includes(q)||(u.username||'').toLowerCase().includes(q)||(u.department||'').toLowerCase().includes(q);
    const mD=!dept||(u.department||'')=== dept;
    return mQ&&mD;
  });
  Tbl.render({el:'#staffTbl', cols:[
    {key:'username', label:'아이디',  req:true,  w:'100px'},
    {key:'name',     label:'이름',    w:'80px', req:true},
    {key:'department',label:'부서',   w:'90px'},
    {key:'tel',      label:'연락처',  w:'110px'},
    {key:'email',    label:'E-MAIL',  w:'160px'},
    {key:'created_at',label:'등록일', w:'90px', render:v=>v?v.slice(0,10):'-'},
    {key:'updated_at',label:'수정일', w:'90px', render:v=>v?v.slice(0,10):'-'},
  ], data:filtered, onRow:row=>Pages._staffForm(row)});
},

/* 사원 등록/수정 폼 */
_staffForm(row=null){
  const isEdit=!!row;
  Modal.open({title:isEdit?'✏️ 사원 수정':'+ 사원 등록', size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._staffSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <div class="fgroup ff"><label class="fl req">아이디</label>
        <input class="fc" id="sfId" value="${H.e(row?.username||'')}" placeholder="로그인 아이디" ${isEdit?'readonly':''}></div>
      <div class="fgroup ff"><label class="fl req">이름</label>
        <input class="fc" id="sfName" value="${H.e(row?.name||'')}" placeholder="홍길동"></div>
      <div class="fgroup"><label class="fl">부서</label>
        <input class="fc" id="sfDept" value="${H.e(row?.department||'')}" placeholder="품질팀"></div>
      <div class="fgroup"><label class="fl">연락처</label>
        <input class="fc" id="sfTel" value="${H.e(row?.tel||row?.phone||'')}" placeholder="010-0000-0000"></div>
      <div class="fgroup ff"><label class="fl">E-MAIL</label>
        <input class="fc" id="sfEmail" value="${H.e(row?.email||'')}" placeholder="email@company.com"></div>
      ${!isEdit?`<div class="fgroup ff"><label class="fl req">비밀번호</label>
        <input class="fc" type="password" id="sfPw" placeholder="8자 이상"></div>`:''}
    </div>`,
  });
  window._staffEditId=row?.id||null;
},

async _staffSave(){
  const id=document.getElementById('sfId')?.value.trim();
  const name=document.getElementById('sfName')?.value.trim();
  const dept=document.getElementById('sfDept')?.value.trim();
  const tel=document.getElementById('sfTel')?.value.trim();
  const email=document.getElementById('sfEmail')?.value.trim();
  const pw=document.getElementById('sfPw')?.value.trim();
  if(!id||!name){Toast.show('아이디와 이름은 필수입니다.','warn');return;}
  const editId=window._staffEditId;
  if(editId){
    /* 수정 */
    if(_sb) await _sb.from('users').update({name,department:dept,tel,email,updated_at:H.today()}).eq('id',editId);
    const u=DB.users.find(u=>u.id===editId);
    if(u){u.name=name;u.department=dept;u.tel=tel;u.email=email;}
  } else {
    /* 신규 등록 */
    if(!pw||pw.length<8){Toast.show('비밀번호는 8자 이상입니다.','warn');return;}
    const pwHash=await H.sha256(pw);
    const newUser={username:id,name,department:dept,tel,email,password:pwHash,role:'user',active:1,pending:0,created_at:H.today()};
    if(_sb){const {data}=await _sb.from('users').insert(newUser).select().single();if(data)DB.users.push(data);}
    else DB.users.push({id:Date.now(),...newUser});
  }
  Modal.close();
  Toast.show(editId?'수정되었습니다.':'등록되었습니다.','ok');
  Pages.users();
},

_staffFilter(){Pages._staffRender();},

_uFilter(){
  const s=(document.getElementById('uSearch')?.value||'').trim();
  const r=document.getElementById('uRoleF')?.value||'';
  const st=document.getElementById('uStatusF')?.value||'';
  const d=DB.users.filter(u=>{
    if(s&&!u.name.includes(s)&&!u.username.includes(s)&&!(u.department||'').includes(s)&&!(u.email||'').includes(s))return false;
    if(r&&u.role!==r)return false;
    if(st!==''&&String(u.active)!==st)return false;
    return true;
  });
  Pages._uRender(d);
},
_uRender(data){
  data=data||DB.users;
  const roleMap={admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'};
  const roleClr={admin:'bred',manager:'bamb',user:'bblu',viewer:'bgry'};
  Tbl.render({el:'#utbl',cols:[
    {key:'username',   label:'아이디',       w:'92px'},
    {key:'name',       label:'이름',         w:'82px',
      render:(v,row)=>`<span style="font-weight:600;color:var(--pri)">${H.e(v||'-')}</span>`},
    {key:'department', label:'부서',         w:'88px'},
    {key:'tel',        label:'연락처',       w:'112px', render:v=>H.e(v||'-')},
    {key:'email',      label:'E-MAIL',       w:'160px', render:v=>v?`<a href="mailto:${H.e(v)}" style="color:var(--acc)">${H.e(v)}</a>`:'-'},
    {key:'active',     label:'상태',         w:'52px',  align:'center',
      render:v=>`<span class="badge ${v?'bgrn':'bgry'}" style="pointer-events:none">${v?'활성':'비활성'}</span>`},
    {key:'created_at', label:'등록일',       w:'88px'},
    {key:'updated_at', label:'수정일',       w:'88px',  render:v=>v?H.e(v):''},
  ],data,onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 사원 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));
        Pages._uRender();
        const res=await SB.deleteUsers(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
      };
      Modal.confirm({
        title:'🗑️ 사원 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 사원를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    }});
},
_uForm(row=null){
  const e=!!row;
  const today=H.today();
  Modal.open({title:e?'👤 사용자 수정':'👤 사용자 등록',size:'mlg',
    body:`<div class="fg2">
      <!-- 1열: 아이디, 이름 -->
      <div class="fgroup"><label class="fl req">아이디</label>
        <input class="fc" id="uf_id" value="${H.e(row?.username||'')}" ${e?'readonly':''} placeholder="영문/숫자 조합"></div>
      <div class="fgroup"><label class="fl req">이름</label>
        <input class="fc" id="uf_name" value="${H.e(row?.name||'')}"></div>
      <!-- 2열: 비밀번호 -->
      <div class="fgroup"><label class="fl ${!e?'req':''}">비밀번호</label>
        <input class="fc" id="uf_pw" type="password" placeholder="${e?'변경 시만 입력 (8자 이상)':'8자 이상 입력'}"></div>
      <div class="fgroup"><label class="fl ${!e?'req':''}">비밀번호 확인</label>
        <input class="fc" id="uf_pw2" type="password" placeholder="${e?'변경 시만 입력':''}"></div>
      <!-- 3열: 부서, 연락처 -->
      <div class="fgroup"><label class="fl">부서</label>
        <input class="fc" id="uf_dept" value="${H.e(row?.department||'')}" placeholder="예) 품질팀"></div>
      <div class="fgroup"><label class="fl">연락처</label>
        <input class="fc" id="uf_tel" value="${H.e(row?.tel||'')}" placeholder="010-0000-0000"></div>
      <!-- 4열: E-MAIL, 권한 -->
      <div class="fgroup"><label class="fl">E-MAIL</label>
        <input class="fc" id="uf_email" type="email" value="${H.e(row?.email||'')}" placeholder="user@company.com"></div>
      <!-- [v2.394] 권한 설정은 설정 > 사용자 관리로 이동 -->
      <div class="fgroup"><label class="fl">권한</label>
        <div class="fc" style="background:#f8fafc;display:flex;align-items:center;gap:8px;color:var(--tm);font-size:12px">
          <span class="badge ${row?.role==='admin'?'berr':row?.role==='manager'?'bamb':'bblu'}">${{admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'}[row?.role||'user']||'사용자'}</span>
          <span>권한 변경은 <a style="color:var(--pri);cursor:pointer;text-decoration:underline" onclick="Modal.close();Nav.go('settings')">설정 > 사용자 관리</a>에서 가능합니다.</span>
        </div></div>
      <!-- 5열: 상태, (수정 시) 날짜 -->
      <div class="fgroup"><label class="fl">상태</label>
        <select class="fc" id="uf_active"><option value="1" ${!row||row.active?'selected':''}>활성</option><option value="0" ${row&&!row.active?'selected':''}>비활성</option></select></div>
      <div class="fgroup"></div>
      ${e?`<div class="fgroup"><label class="fl">등록일</label><input class="fc" value="${H.e(row?.created_at||today)}" readonly></div>
           <div class="fgroup"><label class="fl">수정일</label><input class="fc" value="${today}" readonly></div>`:''}
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          ${e&&Auth._u?.role==='admin'?`<button class="btn bamb bsm" onclick="Pages._uResetPw(${row.id},'${H.e(row.username)}')" title="임시 비밀번호 발급 (관리자 전용)">🔑 임시비밀번호 발급</button>`:''}
          ${e&&Auth._u?.role==='admin'?`<button class="btn bamb bsm" onclick="Pages._uResetPw(${row.id},'${H.e(row.username)}')" title="임시 비밀번호 발급">🔑 비번초기화</button> <button class="btn berr bsm" onclick="Modal.close();Pages._uDelete(${row.id})" title="사용자 삭제 (사유 입력 필수)">🗑️ 삭제</button>`:''}
          <button class="btn bpri btn-f8" onclick="Pages._uSave(${row?.id||'null'})">${e?'저장':'등록'} <span class="kbd">F8</span></button>`
  });
},
/* [v2.394] A2: SHA-256 해시 저장 + password 컬럼 포함
   기존: password 필드 row에 없음 → 로그인 불가
   수정: pw를 SHA-256 해시 후 password 컬럼으로 저장 */
async _uSave(id){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const uid=g('uf_id'),name=g('uf_name'),pw=g('uf_pw'),pw2=g('uf_pw2');
  if(!uid){Toast.show('아이디는 필수입니다.','warn');return}
  if(!name){Toast.show('이름은 필수입니다.','warn');return}
  if(!id&&!pw){Toast.show('비밀번호는 필수입니다.','warn');return}
  if(pw&&pw.length<8){Toast.show('비밀번호는 8자 이상이어야 합니다.','warn');return}
  if(pw&&pw!==pw2){Toast.show('비밀번호가 일치하지 않습니다.','warn');return}
  const email=g('uf_email');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){Toast.show('올바른 이메일 형식을 입력하세요.','warn');return}
  // 아이디 중복 검사 (신규 등록 시)
  if(!id){
    const dup=DB.users.find(u=>u.username===uid);
    if(dup){Toast.show(`⚠️ 아이디 "${uid}"는 이미 사용 중입니다.`,'err',5000);return}
  }
  const today=H.today();
  // SHA-256 해시 처리
  const pwHash=pw?await H.sha256(pw):null;
  const row={
    username:uid, name,
    department:g('uf_dept'), tel:g('uf_tel'), email,
    /* [v2.394] role은 설정 > 사용자 관리에서 변경
       신규 등록 시 기본값 'user', 수정 시 기존 role 유지 */
    role: id ? (DB.users.find(u=>u.id===id)?.role||'user') : 'user',
    active:Number(document.getElementById('uf_active')?.value||1),
  };
  // password 해시 포함 (신규 등록 시 필수, 수정 시 입력한 경우만)
  if(pwHash) row.password=pwHash;
  if(id){
    const res=await SB.updateUser(id,{...row,updated_at:today});
    if(!res.ok) return;
    // 로컬 캐시 갱신
    const idx=DB.users.findIndex(u=>u.id===id);
    if(idx>=0) DB.users[idx]={...DB.users[idx],...row,updated_at:today};
    Toast.show('사용자가 수정되었습니다.','ok');
    /* [v2.394] admin 계정 이메일 수정 시 로그인창 footer 반영 */
    if(Auth._u&&Auth._u.role==='admin'&&Auth._u.id===id){
      Auth._u={...Auth._u,...row};
      sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
      const eSpan=document.getElementById('adminContactEmail');
      if(eSpan&&email) eSpan.textContent=email;
    }
  } else {
    const res=await SB.addUser({...row,created_at:today,updated_at:today});
    if(!res.ok) return;
    Toast.show('사용자가 등록되었습니다.','ok');
  }
  /* [v2.394] 저장 후 사원관리 이동 제거 — 사용자관리 탭 유지 */
  Modal.close();
  /* [v2.394] settings 사용자관리 탭 내 목록 갱신 — window.renderUserMgmt 사용 */
  const settingsPw=document.getElementById('pw');
  if(settingsPw){
    const uPane=settingsPw.querySelector('.stab-pane[data-tab="usermgmt"]');
    if(uPane){
      const fresh=await SB.getUsers();
      if(fresh) DB.users=fresh;
      /* window에 노출된 함수 사용 (지역 스코프 문제 해결) */
      if(typeof window.renderUserMgmt==='function'){
        uPane.innerHTML=window.renderUserMgmt()+(typeof window.renderPermTable==='function'?window.renderPermTable():'');
      } else {
        /* fallback: settings 재로드 */
        await Pages.settings();
        setTimeout(()=>{
          const pw2=document.getElementById('pw');
          if(pw2){pw2.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b.dataset.tab==='usermgmt'));pw2.querySelectorAll('.stab-pane').forEach(p=>p.style.display=p.dataset.tab==='usermgmt'?'block':'none');}
        },50);
      }
    }
  }
},

/* ── 임시비밀번호 발급 (관리자 전용, B2안) ──
   [v2.394] 관리자가 사용자 비밀번호를 임시값으로 초기화
   임시 비밀번호: 8자리 랜덤 → SHA-256 해시 → DB 저장
   화면에 표시 후 관리자가 사용자에게 직접 전달 */
async _uResetPw(userId, username){
  if(Auth._u?.role!=='admin'){Toast.show('관리자만 사용할 수 있습니다.','err');return}
  const chars='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const tmpPw=Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
  const pwHash=await H.sha256(tmpPw);
  const res=await SB.updateUser(userId,{password:pwHash,updated_at:H.today()});
  if(!res.ok) return;
  const u=DB.users.find(u=>u.id===userId);if(u) u.password=pwHash;
  Modal.close();
  Modal.open({title:'🔑 임시비밀번호 발급 완료',size:'sm',
    body:`<div style="text-align:center;padding:16px 0">
      <div style="font-size:13px;color:var(--tm);margin-bottom:12px">
        <strong>${H.e(username)}</strong> 계정의 임시 비밀번호가 발급되었습니다.
      </div>
      <div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:10px;padding:18px;margin:8px 0">
        <div style="font-size:11px;color:#92400e;margin-bottom:6px">임시 비밀번호</div>
        <div style="font-size:28px;font-weight:700;color:#92400e;letter-spacing:4px">${tmpPw}</div>
      </div>
      <div style="font-size:11px;color:var(--tm);margin-top:12px">
        ⚠️ 사용자에게 직접 전달하세요.<br>
        로그인 후 반드시 비밀번호를 변경하도록 안내하세요.
      </div>
    </div>`,
    foot:`<button class="btn bpri" onclick="Modal.close()">확인</button>`
  });
},



/* ══════════════════════════════════════════════════════
   검사 5종 공통 렌더 (_insp)
   - 수입/공정/구매/외주/최종검사 모두 _insp(type)으로 처리
   - 17컬럼: 검사구분→거래처명→검사번호→검사일→검사자→
             품목코드→품목명→규격→검사방법→검사결과→
             검사수량→합격수량→불합격수량→불량률(%)→
             작업지시번호→특이사항
   - 거래처/품목: 기준정보 연동 (_validateVendor, _validateItem)
   - 날짜 퀵버튼: DateRange.applyTo() 사용
   - v2.394: 구매검사(insp_pu), 외주검사(insp_ou) 추가
            출하검사(insp_fi) → 최종검사로 명칭 변경
   ══════════════════════════════════════════════════════ */
/* ── 검사 5종 공통 렌더 ── */
insp_in(){this._insp('insp_in')},
insp_pr(){this._insp('insp_pr')},
insp_pu(){this._insp('insp_pu')},
insp_ou(){this._insp('insp_ou')},
insp_fi(){this._insp('insp_fi')},

async _insp(type){
  const w=document.getElementById('pw');
  const TYPES={
    insp_in:{lbl:'수입검사', icon:'🔍', key:'수입'},
    insp_pr:{lbl:'공정검사', icon:'⚙️', key:'공정'},
    insp_pu:{lbl:'구매검사', icon:'🛒', key:'구매'},
    insp_ou:{lbl:'외주검사', icon:'🏭', key:'외주'},
    insp_fi:{lbl:'최종검사', icon:'✅', key:'최종'},
  };
  const {lbl,icon,key}=TYPES[type];
  /* [v2.394 복원] _sbFetchAll 전체 로드 후 로컬 필터 방식
     Phase1은 DOM 순서 문제로 무한 스피너 버그 발생 → 복원 */
  w.innerHTML='<div class="spin"></div>';
  /* [v2.394] 항상 SB에서 최신 데이터 로드 */
  const allInsp=await SB.getInspections();
  DB.inspections=Array.isArray(allInsp)?allInsp:[];
  let data=DB.inspections.filter(r=>r.type===key);
  let fromV='',toV='';

  const render=()=>{
    /* [v2.394 복원] 로컬 필터 방식 */
    const sv=(document.getElementById('inspSV')?.value||'').trim();
    const rv=document.getElementById('inspRV')?.value||'';
    fromV=document.getElementById('inspFrom')?.value||'';
    toV=document.getElementById('inspTo')?.value||'';
    const fd=data.filter(r=>{
      if(sv&&!r.insp_no?.includes(sv)&&!r.item_name?.includes(sv)&&!r.item_code?.includes(sv)&&!r.vendor?.includes(sv))return false;
      if(rv&&r.result!==rv)return false;
      if(fromV&&r.insp_date<fromV)return false;
      if(toV&&r.insp_date>toV)return false;
      return true;
    });
    Tbl.render({el:'#inspTbl',cols:[
      /* 컬럼 순서: 검사구분→거래처명→검사번호→검사일→검사자→품목코드→품목명→규격→검사방법→검사결과→검사수량→합격수량→불합격수량→불량률→작업지시번호→특이사항→파일 */
      {key:'type',       label:'검사구분',    w:'78px',  align:'center', render:v=>`<span class="badge bblu">${H.e(v)}검사</span>`},
      {key:'vendor',     label:'거래처명',    w:'110px', render:v=>H.e(v||'-')},
      {key:'insp_no',    label:'검사번호', req:true,    w:'148px'},
      {key:'insp_date',  label:'검사일',   req:true,      w:'90px'},
      {key:'inspector',  label:'검사자',      w:'72px'},
      {key:'item_code',  label:'품목코드',    w:'95px',  render:v=>`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(v)}</span>`},
      {key:'item_name',  label:'품목명'},
      {key:'spec',       label:'규격',        w:'100px'},
      {key:'insp_method',label:'검사방법',    w:'120px'},
      {key:'result',     label:'검사결과',    w:'78px',  align:'center', render:v=>H.inspBadge(v)},
      {key:'qty',        label:'검사수량',    w:'78px',  align:'right',  render:v=>H.n(v)},
      {key:'pass_qty',   label:'합격수량',    w:'78px',  align:'right',  render:v=>`<span style="color:var(--ok);font-weight:600">${H.n(v)}</span>`},
      {key:'fail_qty',   label:'불합격수량',  w:'82px',  align:'right',  render:v=>v>0?`<span style="color:var(--err);font-weight:700">${H.n(v)}</span>`:'0'},
      {key:'defect_rate',label:'불량률(%)',   w:'75px',  align:'right',  render:v=>{const c=v>0?'var(--err)':'var(--ok)';const w=v>0?700:400;return`<span style="color:${c};font-weight:${w}">${Number(v||0).toFixed(1)}%</span>`}},
      {key:'wo_no',      label:'작업지시번호',w:'120px', render:v=>H.e(v||'-')},
      {key:'note',       label:'특이사항',               render:v=>H.e(v||'-')},
      /* 파일 컬럼 — FM(파일관리) 연동, Supabase Storage 배포 시 URL 교체 */
      {key:'id',         label:'파일',        w:'80px',  align:'center', render:(_v,row)=>FM.btn(`insp-${row.id}`)},
    ],data:fd,
    onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 검사 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        /* [v2.394] 즉시 로컬 제거 → 화면 먼저 갱신 */
        DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));
        render();
        /* SB 일괄 삭제 */
        const res=await SB.deleteInspections(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
      };
      Modal.confirm({
        title:'🗑️ 검사 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 검사를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    },
    onRow:row=>Pages._inspDetail2(row)});
  };

  /* 퀵버튼 HTML */
  const qbtns=[
    ['week','이번주'],['month','이번달'],['last_month','지난달'],
    ['h1','상반기'],['h2','하반기'],
    ['q1','1분기'],['q2','2분기'],['q3','3분기'],['q4','4분기'],
  ].map(([k,l])=>`<button class="btn bxs bout" onclick="DateRange.applyTo('inspFrom','inspTo','${k}');document.getElementById('inspFrom').dispatchEvent(new Event('change'))">${l}</button>`).join('');

  const tot=data.length,pass=data.filter(d=>d.result==='합격').length,partial=data.filter(d=>d.result==='부분합격').length,special=data.filter(d=>d.result==='특채').length,none=data.filter(d=>d.result==='무검사').length,hold=data.filter(d=>d.result==='보류').length,fail=data.filter(d=>d.result==='불합격').length;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">${icon}</div><div><div class="sd-val">${tot}</div><div class="sd-lbl">총 검사</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${pass}</div><div class="sd-lbl">합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ccfbf1;color:#0d9488">🔷</div><div><div class="sd-val">${partial}</div><div class="sd-lbl">부분합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⭐</div><div><div class="sd-val">${special}</div><div class="sd-lbl">특채</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">🔖</div><div><div class="sd-val">${none}</div><div class="sd-lbl">무검사</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#64748b">⏸</div><div><div class="sd-val">${hold}</div><div class="sd-lbl">보류</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">❌</div><div><div class="sd-val">${fail}</div><div class="sd-lbl">불합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📊</div><div><div class="sd-val">${tot>0?(pass/tot*100).toFixed(1):0}%</div><div class="sd-lbl">합격률</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px">
    <div><div class="ptit">${icon} ${lbl}</div><div class="psub">${lbl} 이력 관리 — 거래처·품목 기준정보 연동</div></div>
    <div class="pac">
      <button class="btn bpri btn-f2" onclick="Pages._inspForm2('${type}')">+ 검사 등록 <span class="kbd">F2</span></button>
      <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('${type}')">📥 양식 내려받기</button>
      <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('${type}')">📤 자료 일괄등록</button>
      <button class="btn bsm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none"
        onclick="ExcelMgr.openUploadAll('${type}')" title="통합 일괄등록">🗂️ 통합 일괄등록</button>
    </div>
  </div>
  <!-- 날짜 퀵버튼 + 기간 검색 -->
  <div class="tbar" style="flex-wrap:wrap;gap:5px;height:auto;padding:8px 14px">
    <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
      ${qbtns}
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <input type="date" id="inspFrom" class="fsel" style="width:130px" onchange="Pages._inspRender_${type}()">
      <span style="font-size:12px;color:var(--tm)">~</span>
      <input type="date" id="inspTo" class="fsel" style="width:130px" onchange="Pages._inspRender_${type}()">
    </div>
  </div>
  <div class="tbar">
    <div class="sw2"><input type="text" id="inspSV" placeholder="검사번호, 품목코드, 품목명, 거래처..." oninput="Pages._inspRender_${type}()"></div>
    <select class="fsel" id="inspRV" onchange="Pages._inspRender_${type}()"><option value="">전체 결과</option><option>합격</option><option>부분합격</option><option>특채</option><option>무검사</option><option>보류</option><option>불합격</option></select>
    <button class="btn bout bsm" onclick="SearchPop.open('${type}')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
  </div>
  <div id="inspTbl"></div>`;

  /* 동적 렌더 함수 등록 */
  Pages[`_inspRender_${type}`]=render;
  render();
},

_inspForm2(type){
  const TYPES={insp_in:'수입',insp_pr:'공정',insp_pu:'구매',insp_ou:'외주',insp_fi:'최종'};
  const key=TYPES[type]||'수입';
  const newNo=`INS-${H.today().replace(/-/g,'')}-${String(DB.inspections.length+1).padStart(3,'0')}`;
  Modal.open({title:`${key}검사 등록`,size:'mxl',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">검사구분</label>
        <select class="fc" id="if_type">
          ${['수입','공정','구매','외주','최종'].map(t=>`<option ${t===key?'selected':''}>${t}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl req">검사번호</label><input class="fc" id="if_no" value="${newNo}"></div>
      <div class="fgroup"><label class="fl req">검사일</label><input class="fc" id="if_date" type="date" value="${H.today()}"></div>
      <div class="fgroup"><label class="fl req">검사자</label><select class="fc" id="if_ins">
        <option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}
      </select></div>
      <div class="fgroup"><label class="fl">거래처명 <span style="font-size:10px;color:var(--tm)">(기준정보 연동)</span></label>
        <select class="fc" id="if_vendor"><option value="">선택</option>${DB.vendors.map(v=>`<option>${H.e(v.vendor_name)}</option>`).join('')}</select></div>
      <div class="fgroup"><label class="fl req">품목코드 <span style="font-size:10px;color:var(--tm)">(기준정보 연동)</span></label>
        <select class="fc" id="if_code" onchange="Pages._inspItemSelect()">
          <option value="">선택</option>${DB.items.map(i=>`<option value="${H.e(i.item_code)}" data-name="${H.e(i.item_name)}" data-spec="${H.e(i.spec||'')}">${H.e(i.item_code)} - ${H.e(i.item_name)}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl">품목명</label><input class="fc" id="if_name" readonly placeholder="품목코드 선택 시 자동입력" style="background:#f8fafc"></div>
      <div class="fgroup"><label class="fl">규격</label><input class="fc" id="if_spec" readonly style="background:#f8fafc"></div>
      <div class="fgroup"><label class="fl req">검사방법</label><select class="fc" id="if_method">
        ${['치수검사','외관검사','치수검사+외관검사','기능시험','기능시험+외관','성분검사','전수검사','샘플링검사','기타'].map(m=>`<option>${m}</option>`).join('')}
      </select></div>
      <div class="fgroup"><label class="fl req">검사결과</label><select class="fc" id="if_result"><option>합격</option><option>부분합격</option><option>특채</option><option>무검사</option><option>보류</option><option>불합격</option></select></div>
      <div class="fgroup"><label class="fl req">검사수량</label><input class="fc" id="if_qty" type="number" value="0" oninput="Pages._inspCalc()"></div>
      <div class="fgroup"><label class="fl req">합격수량</label><input class="fc" id="if_pqty" type="number" value="0" oninput="Pages._inspCalc()"></div>
      <div class="fgroup"><label class="fl">불합격수량</label><input class="fc" id="if_fqty" type="number" value="0" readonly style="background:#f8fafc"></div>
      <div class="fgroup"><label class="fl">불량률(%)</label><input class="fc" id="if_rate" readonly style="background:#f8fafc"></div>
      <div class="fgroup"><label class="fl">작업지시번호</label><input class="fc" id="if_wo" placeholder="WO/PO/SO 번호"></div>
      <div class="fgroup ff"><label class="fl">특이사항</label><textarea class="fc" id="if_note" rows="2"></textarea></div>
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._inspSave2('${type}')">등록 <span class="kbd">F8</span></button>`
  });
},
_inspItemSelect(){
  const sel=document.getElementById('if_code');
  if(!sel)return;
  const opt=sel.options[sel.selectedIndex];
  const nEl=document.getElementById('if_name');
  const sEl=document.getElementById('if_spec');
  if(nEl)nEl.value=opt?.dataset?.name||'';
  if(sEl)sEl.value=opt?.dataset?.spec||'';
},
_inspCalc(){
  const qty=Number(document.getElementById('if_qty')?.value||0);
  const pqty=Number(document.getElementById('if_pqty')?.value||0);
  const fqty=qty-pqty;
  const rate=qty>0?((fqty/qty)*100).toFixed(1):0;
  const fEl=document.getElementById('if_fqty'),rEl=document.getElementById('if_rate');
  if(fEl)fEl.value=Math.max(0,fqty);
  if(rEl)rEl.value=rate+'%';
},
_inspSave2(type){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const TYPES={insp_in:'수입',insp_pr:'공정',insp_pu:'구매',insp_ou:'외주',insp_fi:'최종'};
  const no=g('if_no'),date=g('if_date'),ins=g('if_ins');
  const code=g('if_code'),name=g('if_name');
  const vendor=g('if_vendor');
  if(!no){Toast.show('검사번호는 필수입니다.','warn');return}
  if(!date){Toast.show('검사일은 필수입니다.','warn');return}
  if(!ins){Toast.show('검사자를 선택해 주세요.','warn');return}
  if(!code){Toast.show('품목코드는 필수입니다. (기준정보 → 품목 등록에 등록된 품목만 사용 가능)','warn');return}
  // 품목코드 기준정보 검증
  if(!_validateItem(code)){Toast.show(`⚠️ 품목코드 "${code}"는 기준정보에 등록되지 않은 품목입니다.`,'err',4000);return}
  // 거래처 기준정보 검증 (공정/최종은 필수 아님)
  if(vendor&&!_validateVendor(vendor)){Toast.show(`⚠️ 거래처 "${vendor}"는 기준정보에 등록되지 않은 거래처입니다.`,'err',4000);return}
  const qty=Number(document.getElementById('if_qty')?.value||0);
  const pqty=Number(document.getElementById('if_pqty')?.value||0);
  const fqty=Math.max(0,qty-pqty);
  const rate=qty>0?Number(((fqty/qty)*100).toFixed(1)):0;
  const newId=Math.max(0,...DB.inspections.map(i=>i.id))+1;
  DB.inspections.push({
    id:newId,type:g('if_type')||TYPES[type],insp_no:no,insp_date:date,
    inspector:ins,wo_no:g('if_wo'),vendor,item_code:code,item_name:name,
    spec:g('if_spec'),insp_method:g('if_method'),result:g('if_result'),
    qty,pass_qty:pqty,fail_qty:fqty,defect_rate:rate,note:g('if_note'),
  });
  Toast.show('검사가 등록되었습니다.','ok');
  Modal.close();
  Pages._insp(type);
},
_inspDetail2(row){
  Modal.open({title:`검사 상세 — ${row.insp_no}`,size:'mlg',
    body:`<div class="g2" style="margin-bottom:12px">
      <div>
        <div class="ir"><div class="il">검사구분</div><div class="iv"><span class="badge bblu">${H.e(row.type)}검사</span></div></div>
        <div class="ir"><div class="il">검사번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.insp_no)}</div></div>
        <div class="ir"><div class="il">검사일</div><div class="iv">${H.e(row.insp_date)}</div></div>
        <div class="ir"><div class="il">검사자</div><div class="iv">${H.e(row.inspector)}</div></div>
        <div class="ir"><div class="il">거래처명</div><div class="iv">${H.e(row.vendor||'-')}</div></div>
      </div>
      <div>
        <div class="ir"><div class="il">품목코드</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.item_code)}</div></div>
        <div class="ir"><div class="il">품목명</div><div class="iv"><strong>${H.e(row.item_name)}</strong></div></div>
        <div class="ir"><div class="il">규격</div><div class="iv">${H.e(row.spec||'-')}</div></div>
        <div class="ir"><div class="il">검사방법</div><div class="iv">${H.e(row.insp_method)}</div></div>
        <div class="ir"><div class="il">작업지시번호</div><div class="iv">${H.e(row.wo_no||'-')}</div></div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:12px">
      ${[['검사수량',row.qty,'#475569'],['합격수량',row.pass_qty,'var(--ok)'],['불합격수량',row.fail_qty,'var(--err)'],['불량률',row.defect_rate+'%','var(--warn)']].map(([l,v,c])=>`
        <div style="flex:1;padding:10px;background:#f8fafc;border-radius:var(--r);text-align:center">
          <div style="font-size:11px;color:var(--tm);margin-bottom:4px">${l}</div>
          <div style="font-size:18px;font-weight:800;color:${c}">${typeof v==='number'?H.n(v):v}</div>
        </div>`).join('')}
      <div style="flex:1;padding:10px;background:${row.result==='합격'?'#f0fdf4':'#fff1f2'};border-radius:var(--r);text-align:center;border:2px solid ${row.result==='합격'?'#86efac':'#fca5a5'}">
        <div style="font-size:11px;color:var(--tm);margin-bottom:4px">최종판정</div>
        <div style="font-size:18px;font-weight:800;color:${row.result==='합격'?'var(--ok)':'var(--err)'}">${row.result==='합격'?'✅ 합격':'❌ 불합격'}</div>
      </div>
    </div>
    ${row.note?`<div class="ir"><div class="il">특이사항</div><div class="iv">${H.e(row.note)}</div></div>`:''}
    <div id="inspCmt2"></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
          <button class="btn bpri">수정</button>`
  });
  setTimeout(()=>Cmt.render('#inspCmt2',`insp-${row.id}`),80);
},

/* ── 품질현황 대시보드 (C안 — Modern SaaS Style)
   구성: 검색조건(검사종류 토글+날짜기간) → 미니차트 5개 → 누적 대형차트 → KPI 요약
   v2.394: 신규 추가
   ─────────────────────────────────────────────────────────── */
async quality_dash(){
  /* [v2.394] SB 최신 검사 데이터 로드 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [insp,ncData,equipData]=await Promise.all([
      SB.getInspections(),
      SB.getNc(),
      SB.getEquip(),
    ]);
    if(insp&&insp.length>=0) DB.inspections=insp;
    if(ncData&&ncData.length>=0) DB.nc=ncData;
    if(equipData&&equipData.length>=0) DB.equip=equipData;
  }catch(e){console.warn('[quality_dash] SB 로드 실패',e);}

  /* ── 상태 변수 (클로저로 유지) ── */
  const state={
    types:['수입','공정','구매','외주','최종'],
    from:'2026-01-01',
    to:'2026-05-31',
  };

  /* ── 데이터 집계 함수 ── */
  const aggregate=(types,from,to)=>{
    const fd=new Date(from), td=new Date(to);
    const filtered=DB.inspections.filter(i=>{
      const d=new Date(i.insp_date);
      return types.includes(i.type)&&d>=fd&&d<=td;
    });
    const months={};
    for(let m=1;m<=12;m++) months[m]={qty:0,pass:0,fail:0,cnt:0};
    filtered.forEach(i=>{
      const mo=Number(i.insp_date.split('-')[1]);
      months[mo].qty+=i.qty; months[mo].pass+=i.pass_qty;
      months[mo].fail+=i.fail_qty; months[mo].cnt++;
    });
    const byType={};
    ['수입','공정','구매','외주','최종'].forEach(t=>{
      const rows=DB.inspections.filter(i=>i.type===t&&new Date(i.insp_date)>=fd&&new Date(i.insp_date)<=td);
      const qty=rows.reduce((a,b)=>a+b.qty,0);
      const fail=rows.reduce((a,b)=>a+b.fail_qty,0);
      byType[t]={qty,fail,cnt:rows.length,rate:qty>0?(fail/qty*100):0,
        passRate:qty>0?((qty-fail)/qty*100):0};
    });
    const total=filtered.reduce((a,b)=>a+b.qty,0);
    const totalFail=filtered.reduce((a,b)=>a+b.fail_qty,0);
    /* [v2.394] NC/교정만료 KPI */
    const ncOpen=DB.nc.filter(n=>n.status!=='완료').length;
    const ncTotal=DB.nc.length;
    const ncDone=DB.nc.filter(n=>n.status==='완료').length;
    const calExpired=DB.equip.filter(e=>H.equipStatus(e.next||null)==='교정만료').length;
    const calDue7=DB.equip.filter(e=>{
      const s=H.equipStatus(e.next||null);
      return s==='교정만료'||s==='D-1'||s==='D-2'||s==='D-3'||s==='D-4'||s==='D-5'||s==='D-6'||s==='D-7';
    }).length;
    return{filtered,months,byType,total,totalFail,
      totalPass:total-totalFail,
      defectRate:total>0?(totalFail/total*100):0,
      passRate:total>0?((total-totalFail)/total*100):0,
      ncOpen,ncTotal,ncDone,calExpired,calDue7};
  };

  /* ── 미니 막대그래프 카드 ── */
  const miniBar=(type,data,selected)=>{
    const icons={수입:'🔍',공정:'⚙️',구매:'🛒',외주:'🏭',최종:'✅'};
    const colors={수입:'#3b82f6',공정:'#10b981',구매:'#f59e0b',외주:'#8b5cf6',최종:'#ef4444'};
    const d=data.byType[type]; const color=selected?colors[type]:'#cbd5e1';
    const pr=d.passRate;
    return`<div class="qdash-mini ${selected?'active':''}" onclick="Pages._qdashToggle('${type}')"
      style="border-color:${selected?colors[type]:'#e2e8f0'};background:${selected?'#fff':'#f8fafc'};
      padding:14px;border-radius:12px;border:2px solid;cursor:pointer;transition:.2s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:700;color:${selected?colors[type]:'#94a3b8'}">
          ${icons[type]} ${type}검사</span>
        <span style="font-size:11px;padding:2px 7px;border-radius:20px;font-weight:700;
          background:${selected?(pr>=99?'#dcfce7':pr>=95?'#fef9c3':'#fee2e2'):'#f1f5f9'};
          color:${selected?(pr>=99?'#166534':pr>=95?'#92400e':'#991b1b'):'#94a3b8'}">
          ${d.cnt>0?pr.toFixed(1)+'%':'N/A'}</span>
      </div>
      <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-bottom:6px">
        <div style="height:100%;width:${d.cnt>0?Math.min(pr,100).toFixed(1):0}%;
          background:${selected?color:'#e2e8f0'};border-radius:4px;transition:width .4s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8">
        <span>${H.n(d.qty)}ea</span>
        <span style="color:${selected&&d.fail>0?'#ef4444':'#94a3b8'}">불량 ${d.fail}ea</span>
      </div>
    </div>`;
  };

  /* ── SVG 월별 누적 차트 ── */
  const bigChart=(data)=>{
    const months=data.months;
    const TARGET=0.5;
    const W=760,CH=220,PAD={t:24,r:50,b:40,l:60};
    const cW=W-PAD.l-PAD.r, cH=CH-PAD.t-PAD.b;
    const maxQty=Math.max(...Object.values(months).map(m=>m.qty),1);
    const maxRate=Math.max(...Object.values(months).map(m=>m.qty>0?m.fail/m.qty*100:0),TARGET*2,1);
    const labels=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const rY=r=>PAD.t+cH-(r/maxRate)*cH;

    let bars='',line_pts=[],yAxis='',xLabels='';
    /* Y축 그리드 */
    for(let i=0;i<=4;i++){
      const val=Math.round(maxQty/4*i);
      const y=PAD.t+cH-Math.round(cH/4*i);
      yAxis+=`<line x1="${PAD.l-4}" y1="${y}" x2="${PAD.l+cW}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>
        <text x="${PAD.l-8}" y="${y+4}" font-size="10" fill="#94a3b8" text-anchor="end">${H.n(val)}</text>`;
    }
    /* 막대 + 꺾은선 포인트 */
    const bW=Math.floor(cW/12*0.55);
    for(let m=1;m<=12;m++){
      const mo=months[m];
      const x=PAD.l+(m-1)*(cW/12)+cW/24;
      xLabels+=`<text x="${x}" y="${PAD.t+cH+16}" font-size="10" fill="#94a3b8" text-anchor="middle">${labels[m-1]}</text>`;
      if(mo.qty>0){
        const bH=Math.round((mo.qty/maxQty)*cH);
        bars+=`<rect x="${x-bW/2}" y="${PAD.t+cH-bH}" width="${bW}" height="${bH}" fill="#bfdbfe" rx="3" opacity="0.85"/>`;
        if(mo.fail>0){
          const fH=Math.round((mo.fail/maxQty)*cH);
          bars+=`<rect x="${x-bW/2}" y="${PAD.t+cH-fH}" width="${bW}" height="${fH}" fill="#ef4444" rx="3" opacity="0.85"/>`;
        }
        const rate=mo.fail/mo.qty*100;
        line_pts.push({x,y:rY(rate),rate});
      }
    }
    /* 꺾은선 */
    const polyline=line_pts.length>1
      ?`<polyline points="${line_pts.map(p=>`${p.x},${p.y}`).join(' ')}"
        fill="none" stroke="#ef4444" stroke-width="2" opacity="0.8"/>`:'' ;
    const dots=line_pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#ef4444" stroke="#fff" stroke-width="2"/>`).join('');
    /* TARGET 선 */
    const tyY=rY(TARGET);
    const targetLine=`<line x1="${PAD.l}" y1="${tyY}" x2="${PAD.l+cW}" y2="${tyY}"
      stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.9"/>
      <text x="${PAD.l+cW+4}" y="${tyY+4}" font-size="10" fill="#f59e0b">${TARGET}%</text>`;
    /* 우측 Y축 (불량률) */
    const rAxisX=PAD.l+cW;
    for(let i=0;i<=4;i++){
      const val=(maxRate/4*i).toFixed(1);
      const y=PAD.t+cH-Math.round(cH/4*i);
      yAxis+=`<text x="${rAxisX+6}" y="${y+4}" font-size="9" fill="#ef444488" text-anchor="start">${val}%</text>`;
    }

    return`<svg viewBox="0 0 ${W} ${CH}" style="width:100%;height:${CH}px">
      ${yAxis}${xLabels}
      <line x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${PAD.t+cH}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${PAD.l}" y1="${PAD.t+cH}" x2="${PAD.l+cW}" y2="${PAD.t+cH}" stroke="#e2e8f0" stroke-width="1"/>
      ${bars}${targetLine}${polyline}${dots}
      <!-- 범례 -->
      <rect x="${PAD.l}" y="4" width="12" height="8" fill="#bfdbfe" rx="2"/>
      <text x="${PAD.l+15}" y="12" font-size="10" fill="#64748b">검사수량</text>
      <rect x="${PAD.l+72}" y="4" width="12" height="8" fill="#ef4444" rx="2"/>
      <text x="${PAD.l+87}" y="12" font-size="10" fill="#64748b">불량수량</text>
      <line x1="${PAD.l+145}" y1="8" x2="${PAD.l+162}" y2="8" stroke="#ef4444" stroke-width="2"/>
      <text x="${PAD.l+165}" y="12" font-size="10" fill="#64748b">불량률(우축)</text>
      <line x1="${PAD.l+240}" y1="8" x2="${PAD.l+257}" y2="8" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="${PAD.l+260}" y="12" font-size="10" fill="#f59e0b">TARGET ${TARGET}%</text>
    </svg>`;
  };

  /* ── 렌더 함수 ── */
  const render=()=>{
    const data=aggregate(state.types,state.from,state.to);
    const TYPES=['수입','공정','구매','외주','최종'];
    const COLORS={수입:'#3b82f6',공정:'#10b981',구매:'#f59e0b',외주:'#8b5cf6',최종:'#ef4444'};

    /* [v2.394] NC + 교정만료 KPI 카드 상단 추가 */
    const ncOpenCls=data.ncOpen>0?'#ef4444':'#059669';
    const calCls=data.calExpired>0?'#ef4444':data.calDue7>0?'#f59e0b':'#059669';
    w.innerHTML=`
    <!-- [v2.394] KPI 상단 요약 — 바로가기 ↗ 마크 추가 -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px">
      <!-- 전체 검사건수 (읽기전용) -->
      <div class="card" style="padding:14px 16px;text-align:center;position:relative">
        <div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">전체 검사건수</div>
        <div style="font-size:22px;font-weight:800;color:#2563eb">${H.n(data.total)}</div>
        <div style="font-size:11px;color:var(--tm)">ea</div>
      </div>
      <!-- 합격률 → 월별차트 스크롤 -->
      <div class="card" style="padding:14px 16px;text-align:center;position:relative;cursor:pointer"
        onclick="document.getElementById('qdChart')?.scrollIntoView({behavior:'smooth'})"
        title="월별 합격률 차트 보기">
        <span style="position:absolute;top:6px;right:8px;font-size:10px;color:#94a3b8;font-weight:600">차트 ↓</span>
        <div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">합격률</div>
        <div style="font-size:22px;font-weight:800;color:${data.passRate>=99?'#059669':'#ef4444'}">${data.total>0?data.passRate.toFixed(2)+'%':'N/A'}</div>
        <div style="font-size:11px;color:var(--tm)">TARGET 99.50%</div>
      </div>
      <!-- 불량률 → 월별차트 스크롤 -->
      <div class="card" style="padding:14px 16px;text-align:center;position:relative;cursor:pointer"
        onclick="document.getElementById('qdChart')?.scrollIntoView({behavior:'smooth'})"
        title="월별 불량률 차트 보기">
        <span style="position:absolute;top:6px;right:8px;font-size:10px;color:#94a3b8;font-weight:600">차트 ↓</span>
        <div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">불량률</div>
        <div style="font-size:22px;font-weight:800;color:${data.defectRate>0.5?'#ef4444':'#059669'}">${data.total>0?data.defectRate.toFixed(3)+'%':'N/A'}</div>
        <div style="font-size:11px;color:var(--tm)">TARGET 0.50%</div>
      </div>
      <!-- 미결 부적합 → nc 바로가기 ↗ -->
      <div class="card" style="padding:14px 16px;text-align:center;position:relative;cursor:pointer;border:1.5px solid ${data.ncOpen>0?'#fca5a5':'#e2e8f0'};transition:.15s"
        onclick="Nav.go('nc')"
        onmouseover="this.style.borderColor='#ef4444';this.style.background='#fff5f5'"
        onmouseout="this.style.borderColor='${data.ncOpen>0?'#fca5a5':'#e2e8f0'}';this.style.background=''"
        title="부적합 관리로 이동">
        <span style="position:absolute;top:6px;right:8px;font-size:11px;color:#ef4444;font-weight:700">↗</span>
        <div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">미결 부적합</div>
        <div style="font-size:22px;font-weight:800;color:${ncOpenCls}">${data.ncOpen}</div>
        <div style="font-size:11px;color:var(--tm)">전체 ${data.ncTotal}건</div>
      </div>
      <!-- 교정만료 → 계측기 바로가기 ↗ -->
      <div class="card" style="padding:14px 16px;text-align:center;position:relative;cursor:pointer;border:1.5px solid ${data.calExpired>0?'#fca5a5':data.calDue7>0?'#fde68a':'#e2e8f0'};transition:.15s"
        onclick="Nav.go('equip')"
        onmouseover="this.style.borderColor='${calCls}';this.style.background='#fffbf0'"
        onmouseout="this.style.borderColor='${data.calExpired>0?'#fca5a5':data.calDue7>0?'#fde68a':'#e2e8f0'}';this.style.background=''"
        title="계측기 관리로 이동">
        <span style="position:absolute;top:6px;right:8px;font-size:11px;color:${calCls};font-weight:700">↗</span>
        <div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">교정만료/7일내</div>
        <div style="font-size:22px;font-weight:800;color:${calCls}">${data.calExpired}</div>
        <div style="font-size:11px;color:var(--tm)">7일내 ${data.calDue7}대</div>
      </div>
    </div>
    <div class="ph">
      <div><div class="ptit">📊 품질현황 대시보드</div>
        <div class="psub">검사 5종 통합현황 · ${state.from} ~ ${state.to}</div></div>
      <div class="pac">
        <button class="btn bout bsm" onclick="Pages._qdashExcel()">📥 엑셀 내보내기</button>
      </div>
    </div>

    <!-- ① 검색 조건 -->
    <div class="card" style="margin-bottom:12px;padding:14px 18px">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
        <span style="font-size:12px;font-weight:600;color:var(--tm)">검사종류</span>
        <button class="btn bxs ${state.types.length===5?'bpri':'bout'}" onclick="Pages._qdashAll(true)">전체선택</button>
        <button class="btn bxs bout" onclick="Pages._qdashAll(false)">전체해제</button>
        ${TYPES.map(t=>{
          const sel=state.types.includes(t);
          const c=COLORS[t];
          return`<button style="padding:4px 13px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;
            border:2px solid ${sel?c:'#e2e8f0'};background:${sel?c:'#fff'};color:${sel?'#fff':'#94a3b8'};transition:.15s"
            onclick="Pages._qdashToggle('${t}')">${t}</button>`;
        }).join('')}
        <div style="display:flex;align-items:center;gap:6px;margin-left:auto;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:600;color:var(--tm)">기간</span>
          ${[['이번달','month'],['이번분기','quarter'],['올해','year'],['전체','all']].map(([lb,k])=>
            `<button class="btn bxs bout" onclick="Pages._qdashPeriod('${k}')">${lb}</button>`).join('')}
          <input type="date" class="fsel" value="${state.from}" id="qdFrom"
            onchange="Pages._qdashDate()" style="width:128px;font-size:12px">
          <span style="color:var(--tm)">~</span>
          <input type="date" class="fsel" value="${state.to}" id="qdTo"
            onchange="Pages._qdashDate()" style="width:128px;font-size:12px">
        </div>
      </div>
    </div>

    <!-- ② 검사종류별 미니차트 5개 -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px">
      ${TYPES.map(t=>miniBar(t,data,state.types.includes(t))).join('')}
    </div>

    <!-- ③ 누적 대형 차트 -->
    <div id="qdChart" class="card" style="margin-bottom:12px;padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div style="font-size:14px;font-weight:700;color:var(--tx)">
          📈 월별 검사 현황
          <span style="font-size:12px;font-weight:400;color:var(--tm);margin-left:8px">
            ${state.types.length===0?'검사종류 선택 없음':state.types.join(' · ')}</span>
        </div>
        <div style="display:flex;gap:14px;font-size:12px;color:var(--tm);flex-wrap:wrap">
          <span>총검사 <strong style="color:var(--tx)">${H.n(data.total)}ea</strong></span>
          <span>불량 <strong style="color:#ef4444">${H.n(data.totalFail)}ea</strong></span>
          <span>불량률 <strong style="color:${data.defectRate>0.5?'#ef4444':'#10b981'}">
            ${data.defectRate.toFixed(2)}%</strong></span>
        </div>
      </div>
      ${state.types.length===0
        ?`<div style="text-align:center;padding:60px 20px;color:var(--tm)">
            <div style="font-size:36px;margin-bottom:10px">📊</div>
            위의 검사종류 버튼을 선택하면 차트가 표시됩니다.</div>`
        :bigChart(data)}
    </div>

    <!-- ④ KPI 카드 -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      ${[
        {icon:'🔢',label:'총 검사건수',val:H.n(data.filtered.length)+'건',
          sub:'선택 검사 합계',color:'#3b82f6',bg:'#dbeafe'},
        {icon:'📦',label:'총 검사수량',val:H.n(data.total)+'ea',
          sub:'합격+불합격',color:'#10b981',bg:'#dcfce7'},
        {icon:'✅',label:'합격률',
          val:data.total>0?data.passRate.toFixed(2)+'%':'N/A',
          sub:`합격 ${H.n(data.totalPass)}ea`,
          color:data.passRate>=99.5?'#166534':data.passRate>=98?'#92400e':'#991b1b',
          bg:data.passRate>=99.5?'#dcfce7':data.passRate>=98?'#fef9c3':'#fee2e2'},
        {icon:'⚠️',label:'불량률',
          val:data.total>0?data.defectRate.toFixed(2)+'%':'N/A',
          sub:'TARGET 0.50%',
          color:data.defectRate<=0.5?'#166534':'#991b1b',
          bg:data.defectRate<=0.5?'#dcfce7':'#fee2e2'},
      ].map(k=>`
        <div style="background:${k.bg};border-radius:12px;padding:16px 18px;border:1.5px solid ${k.color}33">
          <div style="font-size:22px;margin-bottom:6px">${k.icon}</div>
          <div style="font-size:11px;color:${k.color};font-weight:600;margin-bottom:4px">${k.label}</div>
          <div style="font-size:22px;font-weight:800;color:${k.color}">${k.val}</div>
          <div style="font-size:10px;color:${k.color};opacity:.7;margin-top:4px">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- ⑤ 검사종류별 상세 테이블 -->
    <div class="card">
      <div style="font-size:14px;font-weight:700;color:var(--tx);margin-bottom:12px">📋 검사종류별 상세 현황</div>
      <div class="ts"><table class="dt">
        <thead><tr>
          <th>검사종류</th><th style="text-align:right">건수</th>
          <th style="text-align:right">총수량</th><th style="text-align:right">합격</th>
          <th style="text-align:right">불량</th><th style="text-align:right">합격률</th>
          <th style="text-align:right">불량률</th><th style="text-align:center">TARGET</th>
          <th style="text-align:center">판정</th>
        </tr></thead>
        <tbody>
        ${TYPES.map(t=>{
          const d=data.byType[t]; const sel=state.types.includes(t);
          const c=COLORS[t]; const ok=d.rate<=0.5;
          return`<tr style="${sel?'':'opacity:.4;background:#f8fafc'}">
            <td><span style="padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;
              background:${c}22;color:${c}">${t}검사</span></td>
            <td style="text-align:right">${H.n(d.cnt)}</td>
            <td style="text-align:right">${H.n(d.qty)}</td>
            <td style="text-align:right;color:#10b981;font-weight:600">${H.n(d.qty-d.fail)}</td>
            <td style="text-align:right;color:${d.fail>0?'#ef4444':'var(--tx)'};font-weight:${d.fail>0?700:400}">${H.n(d.fail)}</td>
            <td style="text-align:right;font-weight:700;color:${d.passRate>=99?'#10b981':d.passRate>=95?'#f59e0b':'#ef4444'}">
              ${d.cnt>0?d.passRate.toFixed(2)+'%':'-'}</td>
            <td style="text-align:right;color:${d.rate>0.5?'#ef4444':'var(--tm)'}">
              ${d.cnt>0?d.rate.toFixed(2)+'%':'-'}</td>
            <td style="text-align:center;color:var(--tm);font-size:12px">0.50%</td>
            <td style="text-align:center">${d.cnt>0
              ?`<span class="badge ${ok?'bgrn':'bred'}">${ok?'달성':'초과'}</span>`
              :`<span style="color:var(--tl);font-size:11px">-</span>`}</td>
          </tr>`;
        }).join('')}
        <tr style="background:#f8fafc;font-weight:700;border-top:2px solid var(--bd)">
          <td><strong>합 계</strong></td>
          <td style="text-align:right">${H.n(data.filtered.length)}</td>
          <td style="text-align:right">${H.n(data.total)}</td>
          <td style="text-align:right;color:#10b981">${H.n(data.totalPass)}</td>
          <td style="text-align:right;color:${data.totalFail>0?'#ef4444':'var(--tx)'}">${H.n(data.totalFail)}</td>
          <td style="text-align:right;color:${data.passRate>=99?'#10b981':'#ef4444'}">
            ${data.total>0?data.passRate.toFixed(2)+'%':'-'}</td>
          <td style="text-align:right;color:${data.defectRate>0.5?'#ef4444':'var(--tm)'}">
            ${data.total>0?data.defectRate.toFixed(2)+'%':'-'}</td>
          <td style="text-align:center;font-size:12px;color:var(--tm)">0.50%</td>
          <td style="text-align:center">${data.total>0
            ?`<span class="badge ${data.defectRate<=0.5?'bgrn':'bred'}">${data.defectRate<=0.5?'달성':'초과'}</span>`:'-'}</td>
        </tr>
        </tbody>
      </table>
`;
  };

  Pages._qdashState=state;
  Pages._qdashRender=render;
  render();
},

/* 검사종류 토글 */
_qdashToggle(type){
  const s=Pages._qdashState;
  const idx=s.types.indexOf(type);
  if(idx>=0) s.types.splice(idx,1); else s.types.push(type);
  Pages._qdashRender();
},

/* 전체선택/해제 */
_qdashAll(sel){
  Pages._qdashState.types=sel?['수입','공정','구매','외주','최종']:[];
  Pages._qdashRender();
},

/* 날짜 퀵버튼 */
_qdashPeriod(key){
  const s=Pages._qdashState;
  const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
  const fmt=d=>d.toISOString().slice(0,10);
  if(key==='month'){
    s.from=`${y}-${String(m).padStart(2,'0')}-01`;
    s.to=fmt(new Date(y,m,0));
  } else if(key==='quarter'){
    const q=Math.ceil(m/3), qs=(q-1)*3+1;
    s.from=`${y}-${String(qs).padStart(2,'0')}-01`;
    s.to=fmt(new Date(y,qs+2,0));
  } else if(key==='year'){
    s.from=`${y}-01-01`; s.to=`${y}-12-31`;
  } else {
    s.from='2020-01-01'; s.to=`${y}-12-31`;
  }
  Pages._qdashRender();
},

/* 날짜 직접 입력 */
_qdashDate(){
  const s=Pages._qdashState;
  const f=document.getElementById('qdFrom')?.value;
  const t=document.getElementById('qdTo')?.value;
  if(f) s.from=f; if(t) s.to=t;
  Pages._qdashRender();
},

/* 엑셀 내보내기 */
_qdashExcel(){Toast.show('엑셀 내보내기 — Supabase 연동 후 지원됩니다.','info');},

/* ── 부적합 ── */
async nc(){
  /* [v2.394] 부적합 관리 — SB 연동 + 필터 + F2 등록 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';

  /* SB 최신 데이터 로드 */
  const fresh=await SB.getNc();
  if(fresh&&fresh.length>=0) DB.nc=fresh;

  Pages._ncRender();
},

/* ── 부적합 목록 렌더 [v2.394] ── */
_ncRender(){
  const w=document.getElementById('pw');
  if(!w) return;
  const nc=DB.nc||[];
  const total=nc.length;
  const open=nc.filter(n=>n.status!=='완료').length;
  const done=nc.filter(n=>n.status==='완료').length;
  const inProg=nc.filter(n=>n.status==='처리중').length;

  /* 현재 필터 값 유지 */
  const q=(document.getElementById('ncSearch')?.value||'').toLowerCase();
  const st=document.getElementById('ncStatusF')?.value||'';
  const tp=document.getElementById('ncTypeF')?.value||'';
  const inout=document.getElementById('ncInOutF')?.value||'';

  const filtered=nc.filter(n=>{
    const mQ=!q||(n.no||'').toLowerCase().includes(q)
      ||(n.item_code||'').toLowerCase().includes(q)
      ||(n.item||'').toLowerCase().includes(q)
      ||(n.desc||'').toLowerCase().includes(q);
    const mS=!st||n.status===st;
    const mT=!tp||n.type===tp;
    const mIO=!inout||n.in_out===inout;
    return mQ&&mS&&mT&&mIO;
  });

  /* 번호 자동 생성 */
  const nextNo=()=>{
    const today=H.today().replace(/-/g,'');
    const todayNcs=nc.filter(n=>(n.no||'').startsWith('NC-'+today));
    return`NC-${today}-${String(todayNcs.length+1).padStart(3,'0')}`;
  };
  Pages._ncNextNo=nextNo;

  w.innerHTML=`
    <!-- [v2.394] 부적합 관리 상단 KPI -->
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⚠️</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div>
        <div><div class="sd-val">${open}</div><div class="sd-lbl">미결</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef9c3;color:#ca8a04">🔄</div>
        <div><div class="sd-val">${inProg}</div><div class="sd-lbl">처리중</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${done}</div><div class="sd-lbl">완료</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">⚠️ 부적합 관리</div>
        <div class="psub">부적합 발행 · 처리 · 이력 관리</div></div>
      <div class="pac">
        <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('nc')" title="엑셀 양식 내려받기">📥 양식</button>
        <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('nc')" title="엑셀 일괄등록">📤 일괄등록</button>
        <button class="btn bpri btn-f2" onclick="Pages._ncForm()">+ 부적합 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <!-- 필터 바 -->
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="ncSearch" placeholder="번호, 품목코드, 품목명, 내용 검색..."
          oninput="Pages._ncRender()" value="${q}">
      </div>
      <select class="fsel" id="ncInOutF" onchange="Pages._ncRender()">
        <option value="">사내외 전체</option>
        <option value="사내" ${inout==='사내'?'selected':''}>사내</option>
        <option value="사외" ${inout==='사외'?'selected':''}>사외</option>
      </select>
      <select class="fsel" id="ncTypeF" onchange="Pages._ncRender()">
        <option value="">전체 유형</option>
        ${['수입','공정','구매','외주','최종','고객'].map(t=>`<option value="${t}" ${tp===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <select class="fsel" id="ncStatusF" onchange="Pages._ncRender()">
        <option value="">전체 상태</option>
        ${['접수','처리중','완료'].map(s=>`<option value="${s}" ${st===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('nc')" title="통합검색 (F3)">🔎 <span class="kbd">F3</span></button>
    </div>
    <div id="nctbl"></div>`;

  /* 테이블 렌더 — 컬럼 순서: 선택>No>사내외>부적합번호>유형>품목코드>품목명>수량>발생일>내용>원인>조치>담당자>처리기한>상태>파일 */
  Tbl.render({
    el:'#nctbl',
    cols:[
      {key:'in_out',    label:'사내외',     req:true,   w:'54px',
        render:v=>`<span class="badge ${v==='사외'?'bblu':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'no',        label:'부적합번호', req:true,w:'138px',
        render:v=>`<span style="font-family:monospace;font-size:11px;font-weight:600;color:#1e293b">${H.e(v||'-')}</span>`},
      {key:'type',      label:'유형',     w:'58px', req:true,
        render:v=>`<span class="badge bblu" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'item_code', label:'품목코드', req:true, w:'90px',
        render:v=>v?`<span style="font-family:monospace;font-size:11px;color:#64748b">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'item',      label:'품목명',   w:'120px', req:true},
      {key:'qty',       label:'수량',     w:'54px', align:'right',
        render:v=>v?`${H.n(v)}`:'<span style="color:var(--tl)">-</span>'},
      {key:'date',      label:'발생일',   w:'88px'},
      {key:'desc',      label:'내용'},
      {key:'cause',     label:'원인',     w:'100px'},
      {key:'action',    label:'조치',     w:'100px'},
      {key:'assignee',  label:'담당자',   w:'68px'},
      {key:'due_date',  label:'처리기한', w:'88px',
        render:v=>{
          if(!v) return '<span style="color:var(--tl)">-</span>';
          const d=new Date(v)-new Date();
          const days=Math.ceil(d/(1000*60*60*24));
          const cls=days<0?'bred':days<=3?'bamb':'bgrn';
          return`<span class="badge ${cls}" style="font-size:10px">${v}<br><small>${days<0?'D+'+Math.abs(days):'D-'+days}</small></span>`;
        }},
      {key:'status',    label:'상태',     w:'62px',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='처리중'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'id',        label:'파일',     w:'46px',
        render:(v,row)=>row.file_url
          ?`<a href="${H.e(row.file_url)}" target="_blank" style="font-size:14px">📎</a>`
          :'<span style="color:var(--tl)">-</span>'},
    ],
    data:filtered,
    onRow:row=>Pages._ncDetail(row),
    onDel:async(ids)=>{
      if(!confirm(`${ids.length}건을 삭제하시겠습니까?`)) return;
      const numIds=ids.map(Number);
      if(typeof _sb!=='undefined'&&_sb){
        /* [v2.394] 소프트 삭제 */
        const res=await SB._softDelete('nonconformances',numIds);
        if(!res.ok) return;
      }
      DB.nc=DB.nc.filter(n=>!numIds.includes(Number(n.id)));
      Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
      Pages._ncRender();
    }
  });
},
_ncForm(row=null){
  /* [v2.394] 부적합 등록/수정 폼 — 사내외/품목코드/고객 유형 추가 */
  const isEdit=!!row;
  const nextNo=Pages._ncNextNo?Pages._ncNextNo():'NC-'+H.today().replace(/-/g,'')+'-001';
  /* 품목 목록 — 기준정보 items 연동 */
  const itemOpts=(DB.items||[]).map(it=>
    `<option value="${H.e(it.code||'')}" data-name="${H.e(it.name||'')}">`
    +`${H.e(it.code||'')} — ${H.e(it.name||'')}</option>`
  ).join('');

  Modal.open({
    title:isEdit?`✏️ 부적합 수정 — ${row.no}`:'+ 부적합 등록',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._ncSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <!-- 1행: 부적합번호 + 사내외 -->
      <div class="fgroup">
        <label class="fl">부적합번호</label>
        <input class="fc" id="ncNo" value="${H.e(isEdit?row.no:nextNo)}" ${isEdit?'readonly':''} placeholder="자동생성">
      </div>
      <div class="fgroup">
        <label class="fl req">사내외</label>
        <select class="fc" id="ncInOut">
          <option value="">-- 선택 --</option>
          <option value="사내" ${isEdit&&row.in_out==='사내'?'selected':''}>사내</option>
          <option value="사외" ${isEdit&&row.in_out==='사외'?'selected':''}>사외</option>
        </select>
      </div>
      <!-- 2행: 유형 + 발생일 -->
      <div class="fgroup">
        <label class="fl req">발생 유형</label>
        <select class="fc" id="ncType">
          <option value="">-- 선택 --</option>
          ${['수입','공정','구매','외주','최종','고객'].map(t=>`<option value="${t}" ${isEdit&&row.type===t?'selected':''}>${t}검사</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req">발생일</label>
        <input class="fc" type="date" id="ncDate" value="${isEdit?H.e(row.date||''):H.today()}">
      </div>
      <!-- 3행: 품목코드(연동) + 품목명 -->
      <div class="fgroup">
        <label class="fl">품목코드</label>
        <select class="fc" id="ncItemCode"
          onchange="const sel=this.options[this.selectedIndex];const nm=sel.dataset.name||'';document.getElementById('ncItem').value=nm||document.getElementById('ncItem').value">
          <option value="">-- 직접입력 또는 선택 --</option>
          ${itemOpts}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req">품목명</label>
        <input class="fc" id="ncItem" value="${H.e(isEdit?row.item||'':'')}" placeholder="품목명 또는 LOT번호">
      </div>
      <!-- 4행: 수량 + 담당자 -->
      <div class="fgroup">
        <label class="fl">수량 (ea)</label>
        <input class="fc" type="number" id="ncQty" value="${isEdit?row.qty||'':''}" placeholder="부적합 수량">
      </div>
      <div class="fgroup">
        <label class="fl">담당자</label>
        <input class="fc" id="ncAssignee" value="${H.e(isEdit?row.assignee||'':Auth._u?.name||'')}" placeholder="담당자명">
      </div>
      <!-- 5행: 부적합 내용 (전체 폭) -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req">부적합 내용</label>
        <textarea class="fc" id="ncDesc" rows="3" placeholder="부적합 현상을 구체적으로 기술">${H.e(isEdit?row.desc||'':'')}</textarea>
      </div>
      <!-- 6행: 원인 분석 -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">원인 분석</label>
        <textarea class="fc" id="ncCause" rows="2" placeholder="근본 원인 (5Why 등)">${H.e(isEdit?row.cause||'':'')}</textarea>
      </div>
      <!-- 7행: 조치 내용 -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">조치 내용</label>
        <textarea class="fc" id="ncAction" rows="2" placeholder="시정조치, 재작업, 반품, 폐기 등">${H.e(isEdit?row.action||'':'')}</textarea>
      </div>
      <!-- 8행: 처리기한 + 상태 -->
      <div class="fgroup">
        <label class="fl">처리 기한</label>
        <input class="fc" type="date" id="ncDue" value="${isEdit?H.e(row.due_date||''):''}">
      </div>
      <div class="fgroup">
        <label class="fl">상태</label>
        <select class="fc" id="ncStatus">
          ${['접수','처리중','완료'].map(s=>`<option value="${s}" ${(isEdit?row.status||'접수':'접수')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <!-- 파일 첨부 [v2.394] -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·이미지·문서)</span></label>
        <input class="fc" type="file" id="ncFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.hwp" style="padding:5px;font-size:12px">
        ${isEdit&&row.file_url
          ?`<div style="margin-top:5px;font-size:12px;display:flex;align-items:center;gap:8px">
              <span style="color:var(--tm)">현재 파일:</span>
              <a href="${H.e(row.file_url)}" target="_blank" style="color:#2563eb">📎 파일 보기</a>
              <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                <input type="checkbox" id="ncFileRemove"> 파일 삭제
              </label>
            </div>`
          :''}
      </div>
    </div>`,
  });
  /* 품목코드 select 기존값 복원 */
  if(isEdit&&row.item_code){
    setTimeout(()=>{
      const sel=document.getElementById('ncItemCode');
      if(sel) sel.value=row.item_code||'';
    },80);
  }
  window._ncEditId=row?.id||null;
},

/* ── 부적합 저장 [v2.394] ── */
async _ncSave(){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('ncNo'), type=g('ncType'), date=g('ncDate'), item=g('ncItem');
  const desc=g('ncDesc'), cause=g('ncCause'), action=g('ncAction');
  const assignee=g('ncAssignee'), due=g('ncDue'), status=g('ncStatus');
  const qty=Number(document.getElementById('ncQty')?.value)||0;

  if(!type){Toast.show('발생 유형을 선택하세요.','warn');return;}
  if(!date){Toast.show('발생일을 입력하세요.','warn');return;}
  if(!item){Toast.show('품목명을 입력하세요.','warn');return;}
  if(!in_out){Toast.show('사내외를 선택하세요.','warn');return;}
  if(!desc){Toast.show('부적합 내용을 입력하세요.','warn');return;}

  const editId=window._ncEditId;
  const in_out=document.getElementById('ncInOut')?.value||'';
  const item_code=document.getElementById('ncItemCode')?.value||'';
  /* [v2.394] 파일 업로드 처리 */
  let nc_file_url=(editId?(DB.nc||[]).find(n=>n.id===editId)?.file_url:null)||null;
  const ncFileRemove=document.getElementById('ncFileRemove')?.checked;
  if(ncFileRemove) nc_file_url=null;
  const ncFileEl=document.getElementById('ncFile');
  if(ncFileEl?.files?.length){
    const f=ncFileEl.files[0];
    const up=await SB.uploadFile('nc', f);
    if(up?.url) nc_file_url=up.url;
  }
  const row={no,type,in_out,item_code,item,desc,cause,action,assignee,
    due_date:due||null,status:status||'접수',qty,
    file_url:nc_file_url,
    created_by:Auth._u?.name||Auth._u?.username||'',
    updated_at:H.today()};

  if(editId){
    /* 수정 */
    const res=await SB.updateNc(editId,row);
    if(!res?.ok) return;
    const idx=DB.nc.findIndex(n=>n.id===editId);
    if(idx>=0) DB.nc[idx]={...DB.nc[idx],...row};
    Toast.show('부적합이 수정되었습니다.','ok');
  } else {
    /* 신규 */
    row.created_at=H.today();
    const res=await SB.addNc(row);
    if(!res?.ok) return;
    Toast.show('부적합이 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._ncRender();
},

/* ── 부적합 상세 팝업 [v2.394] ── */
_ncDetail(row){
  if(!row||typeof row!=='object'){Toast.show('데이터를 불러올 수 없습니다.','err');return;}
  const steps=['접수','처리중','완료'];
  const si=steps.indexOf(row.status||'접수');
  const stBar=steps.map((s,i)=>`
    <div class="pst">
      <div class="psd ${i===si?'ac':i<si?'dn':''}">${i+1}</div>
      <div class="psl ${i===si?'ac':''}">${s}</div>
    </div>`).join('');

  /* 처리기한 D-day */
  let dday='';
  if(row.due_date){
    const diff=Math.ceil((new Date(row.due_date)-new Date())/(1000*60*60*24));
    const cls=diff<0?'bred':diff<=3?'bamb':'bgrn';
    dday=`<span class="badge ${cls}" style="margin-left:8px">${diff<0?'D+'+Math.abs(diff):'D-'+diff}</span>`;
  }

  Modal.open({
    title:`⚠️ 부적합 상세 — ${H.e(row.no||'-')}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bgh" onclick="Modal.close();Pages._ncForm(Tbl._curData?.find(r=>r.id===${row.id})||${JSON.stringify(row).replace(/</g,'\u003c')})">✏️ 수정</button>`
        +`<button class="btn bpri" onclick="Pages._ncStatusChange(${row.id})">🔄 상태 변경</button>`,
    body:`
      <div class="psteps">${stBar}</div>
      <div class="card" style="margin:12px 0;padding:14px 18px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div class="ir"><div class="il">부적합번호</div>
            <div class="iv" style="font-family:monospace;font-weight:700">${H.e(row.no||'-')}</div></div>
          <div class="ir"><div class="il">유형</div>
            <div class="iv"><span class="badge bblu">${H.e(row.type||'-')}</span></div></div>
          <div class="ir"><div class="il">발생일</div>
            <div class="iv">${H.e(row.date||'-')}</div></div>
          <div class="ir"><div class="il">처리기한</div>
            <div class="iv">${H.e(row.due_date||'-')}${dday}</div></div>
          <div class="ir"><div class="il">품목명</div>
            <div class="iv">${H.e(row.item||'-')}</div></div>
          <div class="ir"><div class="il">수량</div>
            <div class="iv">${row.qty?H.n(row.qty)+'ea':'-'}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">부적합 내용</div>
            <div class="iv">${H.e(row.desc||'-')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">원인 분석</div>
            <div class="iv">${H.e(row.cause||'미작성')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">조치 내용</div>
            <div class="iv">${H.e(row.action||'미작성')}</div></div>
          <div class="ir"><div class="il">담당자</div>
            <div class="iv">${H.e(row.assignee||'-')}</div></div>
          <div class="ir"><div class="il">등록자</div>
            <div class="iv">${H.e(row.created_by||'-')}</div></div>
        </div>
      </div>
      <div id="ncCmt"></div>`,
  });
  setTimeout(()=>{
    if(typeof Cmt!=='undefined') Cmt.render('#ncCmt',`nc-${row.id}`);
  },80);
},

/* ── 부적합 상태 변경 [v2.394] ── */
async _ncStatusChange(id){
  const nc=DB.nc.find(n=>n.id===id);
  if(!nc){Toast.show('데이터를 찾을 수 없습니다.','err');return;}
  const steps=['접수','처리중','완료'];
  const cur=steps.indexOf(nc.status||'접수');
  const next=steps[(cur+1)%steps.length];
  Modal.confirm({
    title:'상태 변경',
    msg:`"${nc.no}" 상태를 <strong>${nc.status||'접수'}</strong> → <strong>${next}</strong>으로 변경하시겠습니까?`,
    onOk:async()=>{
      const res=await SB.updateNc(id,{status:next,updated_at:H.today()});
      if(!res?.ok) return;
      nc.status=next;
      Modal.close();
      Toast.show(`상태가 "${next}"으로 변경되었습니다.`,'ok');
      Pages._ncRender();
    }
  });
},
_ncDetail(row){Modal.open({title:`부적합 — ${row.no}`,size:'mlg',
  body:`<div class="psteps">${['접수','처리중','완료'].map((s,i)=>`<div class="pst"><div class="psd ${row.status===s?'ac':i<['접수','처리중','완료'].indexOf(row.status)?'dn':''}">${i+1}</div><div class="psl ${row.status===s?'ac':''}">${s}</div></div>`).join('')}</div>
  <div class="ir"><div class="il">부적합번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.no)}</div></div>
  <div class="ir"><div class="il">유형/품목</div><div class="iv"><span class="badge bblu">${H.e(row.type)}</span> ${H.e(row.item)}</div></div>
  <div class="ir"><div class="il">내용</div><div class="iv">${H.e(row.desc)}</div></div>
  <div class="ir"><div class="il">담당자</div><div class="iv">${H.e(row.assignee)}</div></div>
  <div id="ncCmt"></div>`,
  foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bok" onclick="Toast.show('상태변경(더미)','ok')">상태 변경</button><button class="btn bpri">수정</button>`
});setTimeout(()=>Cmt.render('#ncCmt',`nc-${row.id}`),80)},

/* ── 계측기 ── */
/* ══════════════════════════════════════════════════════
   [v2.394] 계측기 전용 업로드 — 재설계 (단순 3단계)
   1. _equipUploadOpen(): 팝업 + 양식 다운로드
   2. _equipParseFile(): 파일 읽기 → 미리보기
   3. _equipDoUpload(): DB 저장
   ══════════════════════════════════════════════════════ */

/* 컬럼 정의 — 단일 소스 (이 배열만 수정하면 모두 반영) */
_EQUIP_COLS:[
  {key:'code',    label:'계측기코드', req:true, req:true,  sample:'EQ-001'},
  {key:'name',    label:'계측기명',   req:true,  sample:'디지털버니어캘리퍼스'},
  {key:'model',   label:'모델번호',   req:false, sample:'CD-20APX'},
  {key:'maker',   label:'제조사',     req:false, sample:'미쓰토요'},
  {key:'range',   label:'측정범위',   req:false, sample:'0~200mm'},
  {key:'res',     label:'분해능',     req:false, sample:'0.01mm'},
  {key:'loc',     label:'보관위치',   req:false, sample:'품질실'},
  {key:'operator',label:'사용자',     req:false, sample:'홍길동'},
  {key:'last',    label:'최근교정일', req:false, sample:'2026-01-01'},
  {key:'next',    label:'차기교정일', req:false, sample:'2026-07-01'},
  {key:'active',  label:'사용여부',   req:false, sample:'사용'},
],

/* 1단계: 팝업 열기 */
_equipUploadOpen(){
  /* [v2.394] 계측기 업로드 팝업 */
  const cols=Pages._EQUIP_COLS;
  Modal.open({title:'📤 계측기 엑셀 일괄등록',size:'mxl',foot:'',body:`
    <div style="padding:12px">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:12px">
        <strong>📋 업로드 순서</strong><br>
        ① [양식 받기] 클릭 → 엑셀 파일 다운로드<br>
        ② 엑셀에 데이터 입력 후 저장<br>
        ③ [파일 선택] 클릭 → 데이터 확인<br>
        ④ [일괄등록] 클릭 → DB 저장
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="btn bpri bsm" onclick="Pages._equipDownload()">📥 양식 받기</button>
        <label class="btn bsm bout" style="cursor:pointer">
          📂 파일 선택
          <input type="file" accept=".xlsx,.xls" style="display:none"
            onchange="Pages._equipParseFile(this)">
        </label>
      </div>
      <div id="equipUploadPreview">
        <div style="text-align:center;padding:32px;color:var(--tm);font-size:12px">
          양식을 받아 데이터를 입력한 뒤 파일을 선택하세요.
        </div>
      </div>
    </div>
  `});
},

/* 양식 다운로드 */
_equipDownload(){
  /* [v2.394] 단순 양식 생성 — _EQUIP_COLS 직접 사용 */
  if(typeof XLSX==='undefined'){Toast.show('XLSX 라이브러리 로딩 중입니다.','warn');return;}
  const cols=Pages._EQUIP_COLS;
  const wb=XLSX.utils.book_new();
  /* 헤더 행 */
  const header=cols.map(c=>c.req?c.label+' *':c.label);
  /* 샘플 행 */
  const sample=cols.map(c=>c.sample||'');
  /* 안내 행 */
  const note=['※ 이 행은 삭제하세요. * 필수 항목입니다.'];
  const ws=XLSX.utils.aoa_to_sheet([header,sample,note]);
  /* 컬럼 너비 */
  ws['!cols']=cols.map(c=>({wch:Math.max(c.label.length*2+4,14)}));
  /* 헤더 스타일 */
  const range=XLSX.utils.decode_range(ws['!ref']||'A1');
  for(let C=0;C<=range.e.c;C++){
    const addr=XLSX.utils.encode_cell({r:0,c:C});
    if(!ws[addr]) continue;
    ws[addr].s={font:{bold:true,color:{rgb:cols[C]?.req?'CC0000':'1A4F8A'},sz:11},
      fill:{fgColor:{rgb:cols[C]?.req?'FFF2F2':'EFF6FF'},patternType:'solid'},
      alignment:{horizontal:'center'}};
  }
  XLSX.utils.book_append_sheet(wb,ws,'계측기');
  /* 파일명: qms_계측기_업로드양식_YYYY-MM-DD.xlsx */
  const d=new Date();
  const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  XLSX.writeFile(wb,`qms_계측기_업로드양식_${ds}.xlsx`);
  Toast.show('양식이 다운로드되었습니다.','ok');
},

/* 2단계: 파일 파싱 → 미리보기 */
_equipParseFile(inp){
  /* [v2.394] 파일 선택 시 즉시 파싱 */
  if(!inp.files||!inp.files[0]) return;
  if(typeof XLSX==='undefined'){Toast.show('XLSX 라이브러리 로딩 중입니다.','warn');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'array',cellDates:false});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    if(!raw||raw.length<2){Toast.show('데이터가 없습니다. 2행부터 데이터를 입력하세요.','warn');return;}
    Pages._equipRenderPreview(raw);
  };
  reader.readAsArrayBuffer(inp.files[0]);
},

/* 미리보기 렌더 */
_equipRenderPreview(raw){
  /* [v2.394] 파싱된 raw 데이터를 미리보기로 표시 */
  const cols=Pages._EQUIP_COLS;
  const el=document.getElementById('equipUploadPreview');
  if(!el) return;

  /* 헤더 행 — 대소문자/공백/접두사 무시하고 매핑 */
  const headerRow=raw[0].map(h=>String(h||'').replace(/\s*\*\s*$/,'').trim());
  /* 헤더 → key 매핑 */
  const h2k={};
  cols.forEach(c=>{h2k[c.label]=c.key;});
  /* 추가 별칭 */
  /* [v2.394] 한글 + A_/B_/C_ 접두사 모두 지원 */
  const alias={
    '계측기코드':'code','코드':'code','관리번호':'code',
    'A_계측기코드':'code',
    '계측기명':'name','기기명':'name','명칭':'name',
    'B_계측기명':'name',
    '모델번호':'model','모델':'model','형번':'model','Model':'model',
    'C_모델번호':'model',
    '제조사':'maker','메이커':'maker','Maker':'maker',
    'D_제조사':'maker',
    '측정범위':'range','범위':'range','Range':'range',
    'E_측정범위':'range',
    '분해능':'res','해상도':'res','Res':'res',
    'F_분해능':'res',
    '보관위치':'loc','위치':'loc','장소':'loc',
    'G_보관위치':'loc',
    '사용자':'operator','담당자':'operator','사용부서':'operator',
    'H_사용자':'operator',
    '최근교정일':'last','교정일':'last','직전교정일':'last',
    'I_최근교정일':'last',
    '차기교정일':'next','다음교정일':'next','예정교정일':'next',
    'J_차기교정일':'next',
    '사용여부':'active','활성여부':'active',
    'K_사용여부':'active',
  };
  Object.assign(h2k,alias);
  const colMap=headerRow.map(h=>h2k[h]||null);

  /* 데이터 행 파싱 (1행=헤더, 2행=샘플/안내 → 3행부터 실제 데이터) */
  /* 단, 2행이 안내문구면 스킵, 실제 데이터면 포함 */
  const isNote=(row)=>String(row[0]||'').startsWith('※');
  const dataRows=raw.slice(1).filter(r=>!isNote(r)&&r.some(v=>String(v).trim()));

  const parsed=dataRows.map(row=>{
    const obj={};
    colMap.forEach((key,i)=>{if(key) obj[key]=String(row[i]||'').trim();});
    cols.forEach(c=>{if(obj[c.key]===undefined) obj[c.key]='';});
    /* 중복 체크 */
    const dup=DB.equip.some(e=>e.code&&e.code===obj.code&&obj.code);
    return{...obj,_dup:dup,_err:!obj.code||!obj.name};
  }).filter(r=>r.code||r.name);  // 빈 행 제거

  Pages._equipParsed=parsed;

  if(parsed.length===0){
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--tm)">데이터가 없습니다. 코드와 계측기명을 확인하세요.</div>';
    return;
  }

  const okCnt=parsed.filter(r=>!r._dup&&!r._err).length;
  const dupCnt=parsed.filter(r=>r._dup).length;
  const errCnt=parsed.filter(r=>r._err).length;

  el.innerHTML=
    /* 요약 */
    '<div style="display:flex;gap:10px;margin-bottom:10px;font-size:12px">'
    +'<span style="color:#22c55e;font-weight:700">✅ 등록가능: '+okCnt+'건</span>'
    +(dupCnt?'<span style="color:#f59e0b;font-weight:700">⚠️ 중복(업데이트): '+dupCnt+'건</span>':'')
    +(errCnt?'<span style="color:#ef4444;font-weight:700">❌ 오류: '+errCnt+'건</span>':'')
    +'</div>'
    /* 미리보기 테이블 */
    +'<div style="overflow:auto;max-height:320px">'
    +'<table class="dt" style="width:100%;font-size:11px">'
    +'<thead><tr>'
    +'<th>#</th>'
    +cols.map(c=>'<th>'+H.e(c.label)+'</th>').join('')
    +'<th style="background:#e0f2fe;color:#0369a1">결과</th>'
    +'</tr></thead><tbody>'
    +parsed.map((r,i)=>{
      const bg=r._err?'#fff2f2':r._dup?'#fffbeb':'';
      const tds=cols.map(c=>'<td>'+H.e(r[c.key]||'-')+'</td>').join('');
      const res=r._err?'<span style="color:#ef4444">❌ 오류</span>'
        :r._dup?'<span style="color:#f59e0b">⚠️ 중복</span>'
        :'<span style="color:#22c55e">✅ 등록</span>';
      return '<tr style="background:'+bg+'"><td>'+(i+1)+'</td>'+tds+'<td>'+res+'</td></tr>';
    }).join('')
    +'</tbody></table></div>'
    /* 등록 버튼 */
    +(okCnt+dupCnt>0
      ?'<div style="margin-top:12px;text-align:right">'
       +'<button class="btn bpri" onclick="Pages._equipDoUpload()">'
       +'✅ '+(okCnt+dupCnt)+'건 일괄등록</button></div>'
      :'');
},

/* 3단계: DB 저장 */
async _equipDoUpload(){
  /* [v2.394] parsed 데이터를 SB.addEquip으로 저장 */
  const parsed=Pages._equipParsed;
  if(!parsed||!parsed.length){Toast.show('업로드할 데이터가 없습니다.','warn');return;}
  const targets=parsed.filter(r=>!r._err);
  if(!targets.length){Toast.show('등록 가능한 데이터가 없습니다.','warn');return;}

  let ok=0,fail=0;
  const btn=document.querySelector('#equipUploadPreview .btn.bpri');
  if(btn){btn.disabled=true;btn.textContent='⏳ 등록 중...';}

  for(const row of targets){
    /* status 자동 계산 */
    row.status=H.equipStatus(row.next||null);
    const res=await SB.addEquip(row);
    if(res?.ok) ok++;
    else fail++;
  }

  Modal.close();
  Toast.show(`✅ ${ok}건 등록 완료${fail?` / ❌ ${fail}건 실패`:''}`,ok?'ok':'err',3000);
  await Pages.equip();
},


async equip(){
  const w=document.getElementById('pw');
  /* [v2.394] 항상 SB에서 최신 데이터 로드 */
  if(_sb){const d=await SB.getEquip();if(d)DB.equip=d;}
  /* [v2.394] status null인 데이터 실시간 재계산 */
  /* [v2.394] status 항상 재계산 — DB 저장값 무시하고 next 날짜 기준으로 */
  DB.equip.forEach(e=>{
    e.status=H.equipStatus(e.next||null);
  });
  const eqByLoc={};DB.equip.forEach(e=>{eqByLoc[e.loc]=(eqByLoc[e.loc]||0)+1});
  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#cffafe;color:#0891b2">🔬</div><div><div class="sd-val">${DB.equip.length}</div><div class="sd-lbl">전체 계측기</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${DB.equip.filter(e=>e.status==='정상').length}</div><div class="sd-lbl">정상</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🔧</div><div><div class="sd-val">${DB.equip.filter(e=>e.status==='교정중').length}</div><div class="sd-lbl">교정중</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div><div><div class="sd-val" style="color:var(--err)">${DB.equip.filter(e=>e.status==='교정만료').length}</div><div class="sd-lbl">교정만료</div></div></div>
      ${Object.entries(eqByLoc).map(([l,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${l||"미지정"}</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
    </div>
    <div class="ph" style="margin-top:14px"><div><div class="ptit">🔬 계측기 등록</div></div>
    <div class="pac">
      <button class="btn bpri btn-f2" onclick="Pages._eqForm()">+ 계측기 등록 <span class="kbd">F2</span></button>
      <button class="btn btn-xl-up bpri" onclick="Pages._equipUploadOpen()" title="계측기 엑셀 일괄등록">📤 엑셀 일괄등록</button>
      <button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._eqPrint()" title="계측기 관리대장 인쇄">🖨️ 관리대장 인쇄</button>
    </div></div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="eqSrch" placeholder="코드, 계측기명 검색..." oninput="Pages._eqFilter()"></div>
      <select class="fsel" id="eqStat" onchange="Pages._eqFilter()"><option value="">전체 상태</option><option>정상</option><option>교정중</option><option>교정만료</option><option>폐기</option></select>
      <button class="btn bout bsm" onclick="SearchPop.open('equip')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="eqTbl"></div>`;
  Tbl.render({el:'#eqTbl',cols:[
    /* [v2.394] 컬럼 순서: 요청사항 기준 재정의 + model 복구 */
    {key:'code',     label:'계측기코드', req:true, w:'96px'},
    {key:'name',     label:'계측기명', req:true,   w:'130px'},
    {key:'model',    label:'모델번호',   w:'100px'},
    {key:'maker',    label:'제조사',     w:'80px'},
    {key:'range',    label:'측정범위',   w:'100px'},
    {key:'res',      label:'분해능',     w:'70px'},
    {key:'loc',      label:'보관위치',   w:'80px'},
    {key:'operator', label:'사용자',     w:'72px'},
    {key:'last',     label:'최근교정일', w:'96px'},
    {key:'next',     label:'차기교정일', w:'96px',
      render:v=>{
        if(!v) return '-';
        const d=Math.ceil((new Date(v)-new Date())/(864e5));
        const cls=d<0?'bred':d<30?'bamb':'';
        const tag=d<0?' (만료)':d<=30?' (D-'+d+')':'';
        return cls?'<span class="badge '+cls+'">'+v+tag+'</span>':(v+tag);
      }},
    {key:'active',   label:'사용여부',   w:'68px', align:'center',
      render:v=>`<span class="badge ${v===0||v==='0'||v==='불용'?'bred':'bgrn'}" style="pointer-events:none">${v===0||v==='0'||v==='불용'?'불용':'사용'}</span>`},
    {key:'status',   label:'상태',       w:'66px',
      render:(v,row)=>{
        const s=H.equipStatus(row.next||null);
        const cls=s==='정상'?'bgrn':s==='교정중'?'bamb':'bred';
        return `<span class="badge ${cls}">${s}</span>`;
      }},
    {key:'file_url', label:'파일',       w:'64px', align:'center',  /* [v2.394] */
      render:(v,row)=>v
        ?`<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
            onclick="event.stopPropagation();Pages._equipFilePreview('${H.e(v)}','${H.e(row?.code||'')}')">📎 보기</button>`
        :'<span style="color:var(--tl);font-size:11px">-</span>'},
  ],data:DB.equip,onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 계측기 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        /* [v2.394] SB 삭제 + 로컬 동기화 */
        if(_sb){
          /* [v2.394] 소프트 삭제 */
          const res=await SB._softDelete('equipment',numIds);
          if(!res.ok) return;
        }
        DB.equip=DB.equip.filter(e=>!numIds.includes(Number(e.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.equip();
      };
      Modal.confirm({
        title:'🗑️ 계측기 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 계측기를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    },onRow:row=>Pages._eqDetail(row)});
},
/* [v2.394] 계측기 상세 팝업 — row 데이터 연결 */
_eqDetail(row){
  if(!row) return;
  const d=row.next?Math.ceil((new Date(row.next)-new Date())/(864e5)):null;
  const statusColor=row.status==='교정만료'?'#ef4444':row.status==='교정중'?'#f59e0b':'#22c55e';
  Modal.open({title:'🔬 계측기 상세',size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'
         +'<button class="btn bpri" id="eqDetailEdit">✏️ 수정</button>',
    body:'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;font-size:13px">'
      +'<div><span style="color:var(--tm)">계측기코드</span><div style="font-weight:700;margin-top:2px">'+H.e(row.code||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">계측기명</span><div style="font-weight:700;margin-top:2px">'+H.e(row.name||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">모델번호</span><div style="margin-top:2px">'+H.e(row.model||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">제조사</span><div style="margin-top:2px">'+H.e(row.maker||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">측정범위</span><div style="margin-top:2px">'+H.e(row.range||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">분해능</span><div style="margin-top:2px">'+H.e(row.res||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">보관위치</span><div style="margin-top:2px">'+H.e(row.loc||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">사용자</span><div style="margin-top:2px">'+H.e(row.operator||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">최근교정일</span><div style="margin-top:2px">'+H.e(row.last||'-')+'</div></div>'
      +'<div><span style="color:var(--tm)">차기교정일</span><div style="margin-top:2px">'+H.e(row.next||'-')+(d!==null?'<span style="margin-left:6px;font-size:11px;color:'+statusColor+'">'+( d<0?'만료':'D-'+d)+'</span>':'')+'</div></div>'
      +'<div><span style="color:var(--tm)">사용여부</span><div style="margin-top:2px"><span class="badge '+(row.active===0||row.active==='0'?'bred':'bgrn')+'">'+(row.active===0||row.active==='0'?'불용':'사용')+'</span></div></div>'
      +'<div><span style="color:var(--tm)">상태</span><div style="margin-top:2px"><span class="badge" style="background:'+statusColor+';color:#fff">'+H.e(row.status||'-')+'</span></div></div>'
      +'</div>',
  });
  setTimeout(()=>{
    const b=document.getElementById('eqDetailEdit');
    if(b) b.onclick=()=>{Modal.close();Pages._eqForm(row);};
  },50);
},

_eqForm(row=null){
  const isEdit=!!row;
  const optSel=c=>c?' selected':'';
  Modal.open({title:isEdit?'계측기 수정':'계측기 등록',size:'mlg',
    body:'<div class="fg2">'
      +'<div class="fgroup"><label class="fl req">계측기코드</label>'
      +'<input id="ef_code" class="fc" value="'+H.e(row?.code||'')+'" placeholder="EQ-001" '+(isEdit?'readonly':'')+'></div>'
      +'<div class="fgroup"><label class="fl req">계측기명</label>'
      +'<input id="ef_name" class="fc" value="'+H.e(row?.name||'')+'" placeholder="높이게이지"></div>'
      +'<div class="fgroup"><label class="fl">모델번호</label>'
      +'<input id="ef_model" class="fc" value="'+H.e(row?.model||'')+'" placeholder="HG-200"></div>'
      +'<div class="fgroup"><label class="fl">제조사</label>'
      +'<input id="ef_maker" class="fc" value="'+H.e(row?.maker||'')+'" placeholder="미쓰토요"></div>'
      +'<div class="fgroup"><label class="fl">측정범위</label>'
      +'<input id="ef_range" class="fc" value="'+H.e(row?.range||'')+'" placeholder="0~200mm"></div>'
      +'<div class="fgroup"><label class="fl">분해능</label>'
      +'<input id="ef_res" class="fc" value="'+H.e(row?.res||'')+'" placeholder="0.01mm"></div>'
      +'<div class="fgroup"><label class="fl">보관위치</label>'
      +'<input id="ef_loc" class="fc" value="'+H.e(row?.loc||'')+'" placeholder="품질실"></div>'
      +'<div class="fgroup"><label class="fl">사용자</label>'
      +'<input id="ef_operator" class="fc" value="'+H.e(row?.operator||'')+'" placeholder="홍길동"></div>'
      +'<div class="fgroup"><label class="fl">최근교정일</label>'
      +'<input id="ef_last" class="fc" type="date" value="'+H.e(row?.last||'')+'">'+'</div>'
      +'<div class="fgroup"><label class="fl">차기교정일</label>'
      +'<input id="ef_next" class="fc" type="date" value="'+H.e(row?.next||'')+'">'+'</div>'
      +'<div class="fgroup"><label class="fl">사용여부</label>'
      +'<select id="ef_active" class="fc">'
      +'<option value="1"'+optSel(!row||row.active!==0)+'>사용</option>'
      +'<option value="0"'+optSel(!!row&&row.active===0)+'>불용</option>'
      +'</select></div>'
      +'<div class="fgroup" style="grid-column:1/-1">'
      +'<label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·이미지·문서)</span></label>'
      +'<input class="fc" type="file" id="eqFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">'
      +(row&&row.file_url
        ?'<div style="margin-top:5px;font-size:12px;display:flex;align-items:center;gap:8px">'
          +'<span style="color:var(--tm)">현재 파일:</span>'
          +'<a href="'+H.e(row.file_url)+'" target="_blank" style="color:#2563eb">📎 파일 보기</a>'
          +'<button type="button" class="btn bxs berr" style="font-size:10px;padding:2px 8px"'
          +'</div>'
        :'')
      +'</div></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" id="ef_ok">'+(isEdit?'💾 수정':'✅ 등록')+'</button>',
  });
  setTimeout(()=>{const b=document.getElementById('ef_ok');if(b)b.onclick=()=>Pages._eqSave(row||null);},50);
},
async _eqSave(orig){
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const code=g('ef_code'),name=g('ef_name');
  if(!code){Toast.show('계측기코드를 입력하세요.','warn');return}
  if(!name){Toast.show('계측기명을 입력하세요.','warn');return}
  /* [v2.394] 파일 업로드 처리 */
  let eq_file_url=orig?.file_url||null;
  const eqFileEl=document.getElementById('eqFile');
  if(eqFileEl?.files?.length){
    const f=eqFileEl.files[0];
    const up=await SB.uploadFile('equip', f);
    if(up?.url) eq_file_url=up.url;
  }
  const row={code,name,
    model:g('ef_model'),maker:g('ef_maker'),range:g('ef_range'),
    res:g('ef_res'),loc:g('ef_loc'),operator:g('ef_operator'),
    last:g('ef_last')||null,next:g('ef_next')||null,
    active:Number(document.getElementById('ef_active')?.value??1),
    file_url:eq_file_url,
  };
  row.status=H.equipStatus(row.next);
  if(orig?.id) row.id=orig.id;

  /* [v2.394 Phase1] 수정 시 변경 이력 자동 기록 */
  if(orig){
    const by=Auth.cur()?.username||'system';
    const _LOG_FIELDS=[
      {key:'operator', label:'사용자'},
      {key:'loc',      label:'보관위치'},
      {key:'active',   label:'사용여부'},
      {key:'status',   label:'상태'},
      {key:'next',     label:'차기교정일'},
      {key:'last',     label:'최근교정일'},
      {key:'maker',    label:'제조사'},
      {key:'range',    label:'측정범위'},
      {key:'res',      label:'분해능'},
      {key:'name',     label:'계측기명', req:true},
    ];
    for(const{key,label}of _LOG_FIELDS){
      const oldV=String(orig[key]??''), newV=String(row[key]??'');
      if(oldV!==newV){
        await SB.addLog({equip_code:orig.code,change_type:'수정',field_name:label,old_value:oldV,new_value:newV,changed_by:by});
      }
    }
  }

  const res=await SB.addEquip(row);
  if(!res.ok){Toast.show('저장 실패','err');return}
  Modal.close();
  Toast.show((orig?'수정':'등록')+'되었습니다.','ok');
  DB.equip=await SB.getEquip();
  Pages.equip();
},

/* [v2.394 Phase3] 계측기 관리대장 인쇄 */
_eqPrint(){
  /* 검색 조건 팝업 → 필터 → 인쇄 */
  const statusOpts=['전체','정상','교정중','교정만료'].map(s=>`<option>${s}</option>`).join('');
  const activeOpts='<option value="">전체</option><option value="1">사용</option><option value="0">불용</option>';
  const locs=[...new Set(DB.equip.map(e=>e.loc).filter(Boolean))].map(l=>`<option>${H.e(l)}</option>`).join('');
  Modal.open({title:'🖨️ 관리대장 인쇄',size:'msm',
    body:'<div class="fg2" style="gap:8px">'+
      '<div class="fgroup"><label class="fl">상태</label>'+
      '<select id="pr_status" class="fc">'+statusOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">사용여부</label>'+
      '<select id="pr_active" class="fc">'+activeOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">보관위치</label>'+
      '<select id="pr_loc" class="fc"><option value="">전체</option>'+locs+'</select></div>'+
      '<div class="fgroup"><label class="fl">교정기간</label>'+
      '<input id="pr_from" class="fc" type="date" style="width:calc(50% - 10px)"> ~ '+
      '<input id="pr_to" class="fc" type="date" style="width:calc(50% - 10px)"></div>'+
      '<div style="font-size:11px;color:var(--tm);margin-top:4px">※ 조건 미선택 시 전체 출력</div>'+
      '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
      '<button class="btn bpri" onclick="Pages._eqPrintExec()">🖨️ 인쇄 미리보기</button>',
  });
},
_eqPrintExec(){
  const g=id=>document.getElementById(id)?.value||'';
  const st=g('pr_status'),ac=g('pr_active'),loc=g('pr_loc'),fr=g('pr_from'),to=g('pr_to');
  let data=[...DB.equip];
  if(st&&st!=='전체')   data=data.filter(e=>e.status===st);
  if(ac!=='')           data=data.filter(e=>String(e.active||1)===ac);
  if(loc)               data=data.filter(e=>e.loc===loc);
  if(fr||to){
    data=data.filter(e=>{
      if(!e.next) return false;
      if(fr&&e.next<fr) return false;
      if(to&&e.next>to) return false;
      return true;
    });
  }
  Modal.close();

  /* 인쇄 HTML 생성 */
  const cond=[
    st&&st!=='전체'?`상태: ${st}`:'',
    ac!==''?`사용여부: ${ac==='1'?'사용':'불용'}`:'',
    loc?`위치: ${loc}`:'',
    (fr||to)?`교정기간: ${fr||''}~${to||''}`:'',
  ].filter(Boolean).join(' | ')||'전체';

  const logo=App.logo?`<img src="${App.logo}" style="height:36px;object-fit:contain">`:'<strong>INNODIS</strong>';
  const today=H.today();

  let rows=data.map((e,i)=>{
    const cals=(DB.cals||[]).filter(c=>c.code===e.code||c.equip_code===e.code)
      .sort((a,b)=>(b.cal_date||b.date||'').localeCompare(a.cal_date||a.date||''));
    const lastCal=cals[0];
    const dTag=e.next?(()=>{const d=Math.ceil((new Date(e.next)-new Date())/(864e5));return d<0?'<span style="color:#ef4444">(만료)</span>':d<30?`<span style="color:#d97706">(D-${d})</span>`:''})():'';
    return `<tr class="pr-row">
      <td>${i+1}</td>
      <td class="mono">${H.e(e.code)}</td>
      <td><strong>${H.e(e.name)}</strong></td>
      <td>${H.e(e.maker||'-')}</td>
      <td>${H.e(e.range||'-')}</td>
      <td>${H.e(e.res||'-')}</td>
      <td>${H.e(e.loc||'-')}</td>
      <td>${H.e(e.operator||'-')}</td>
      <td>${e.last||'-'}</td>
      <td>${e.next||'-'}${dTag}</td>
      <td><span style="color:${e.active===0?'#ef4444':'#22c55e'}">${e.active===0?'불용':'사용'}</span></td>
      <td><span style="color:${e.status==='정상'?'#22c55e':e.status==='교정중'?'#d97706':'#ef4444'}">${H.e(e.status||'-')}</span></td>
    </tr>
    ${lastCal?`<tr class="pr-cal"><td colspan="12" style="padding:2px 8px 4px 32px;font-size:10px;color:#64748b;background:#f8fafc">
      📐 최근교정: ${lastCal.cal_date||lastCal.date||'-'} | 기관: ${H.e(lastCal.agency||'-')} | 성적서: ${H.e(lastCal.cert_no||lastCal.cert||'-')} | 결과: ${lastCal.result||'-'} | 비용: ${lastCal.cost?Number(lastCal.cost).toLocaleString()+'원':'-'}
    </td></tr>`:''}`;
  }).join('');

  const printWin=window.open('','_blank','width=1100,height=800');
  printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>계측기 관리대장</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;font-size:11px;color:#1e293b;padding:16px}
    .pr-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #1e293b}
    .pr-title{font-size:18px;font-weight:700;text-align:center;flex:1}
    .pr-meta{font-size:10px;color:#64748b;text-align:right;min-width:160px}
    .pr-cond{font-size:10px;color:#475569;margin-bottom:10px;padding:4px 8px;background:#f1f5f9;border-radius:4px}
    table{width:100%;border-collapse:collapse;font-size:10.5px}
    thead tr{background:#1e293b;color:#fff}
    th{padding:5px 4px;text-align:center;font-weight:600;white-space:nowrap}
    td{padding:4px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
    .pr-row td:first-child{text-align:center;color:#94a3b8}
    .mono{font-family:monospace;font-weight:600}
    .pr-summary{margin-top:10px;font-size:10px;color:#64748b;text-align:right;padding-top:6px;border-top:1px solid #e2e8f0}
    @media print{
      body{padding:8px}
      button{display:none}
      .pr-row{page-break-inside:avoid}
    }
  </style>
  </head><body>
  <div class="pr-header">
    <div style="min-width:120px">${logo}</div>
    <div class="pr-title">계 측 기 관 리 대 장</div>
    <div class="pr-meta">출력일: ${today}<br>총 ${data.length}건</div>
  </div>
  <div class="pr-cond">검색조건: ${H.e(cond)}</div>
  <table>
    <thead><tr>
      <th style="width:30px">No</th>
      <th style="width:80px">계측기코드</th>
      <th style="min-width:100px">계측기명</th>
      <th style="width:70px">제조사</th>
      <th style="width:80px">측정범위</th>
      <th style="width:60px">분해능</th>
      <th style="width:70px">보관위치</th>
      <th style="width:60px">사용자</th>
      <th style="width:80px">최근교정일</th>
      <th style="width:90px">차기교정일</th>
      <th style="width:40px">사용</th>
      <th style="width:60px">상태</th>
    </tr></thead>
    <tbody>${rows||'<tr><td colspan="12" style="text-align:center;padding:20px;color:#94a3b8">조건에 맞는 계측기가 없습니다.</td></tr>'}</tbody>
  </table>
  <div class="pr-summary">총 ${data.length}개 | 정상: ${data.filter(e=>e.status==='정상').length} | 교정중: ${data.filter(e=>e.status==='교정중').length} | 만료: ${data.filter(e=>e.status==='교정만료').length}</div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`);
  printWin.document.close();
},

_eqDetail(row){
  /* [v2.394 Phase2] 탭 구조: 기본정보 / 교정이력 / 변경이력 */
  const sCls=H.equipStatus(row.next)==='교정만료'?'bred':H.equipStatus(row.next)==='교정중'?'bamb':'bgrn';
  const d2=row.next?Math.ceil((new Date(row.next)-new Date())/(864e5)):null;
  const expired=d2!==null&&0>d2;
  const near=d2!==null&&!expired&&30>=d2;
  const dTag=d2===null?'':(expired?' <span class="badge bred">만료</span>':(near?' <span class="badge bamb">D-'+d2+'</span>':''));

  /* 기본정보 HTML */
  const infoHtml=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="ir"><div class="il">계측기코드</div><div class="iv" style="font-family:monospace;font-weight:700">'+H.e(row.code)+'</div></div>'+
    '<div class="ir"><div class="il">계측기명</div><div class="iv">'+H.e(row.name)+'</div></div>'+
    '<div class="ir"><div class="il">제조사/모델</div><div class="iv">'+H.e(row.maker||'-')+' / '+H.e(row.model||'-')+'</div></div>'+
    '<div class="ir"><div class="il">측정범위/분해능</div><div class="iv">'+H.e(row.range||'-')+' / '+H.e(row.res||'-')+'</div></div>'+
    '<div class="ir"><div class="il">보관위치</div><div class="iv">'+H.e(row.loc||'-')+'</div></div>'+
    '<div class="ir"><div class="il">사용자</div><div class="iv">'+H.e(row.operator||'-')+'</div></div>'+
    '<div class="ir"><div class="il">최근교정일</div><div class="iv">'+(row.last||'-')+'</div></div>'+
    '<div class="ir"><div class="il">차기교정일</div><div class="iv">'+(row.next||'-')+dTag+'</div></div>'+
    '<div class="ir"><div class="il">사용여부</div><div class="iv"><span class="badge '+(row.active===0?'bred':'bgrn')+'">'+(row.active===0?'불용':'사용')+'</span></div></div>'+
    '<div class="ir"><div class="il">상태</div><div class="iv"><span class="badge '+sCls+'">'+H.e(H.equipStatus(row.next))+'</span></div></div>'+
    '</div>';

  /* 탭 컨테이너 */
  const body=
    '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:2px solid var(--bd)">'+
    '<button class="eq-dtab on" data-tab="info" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--pri);border-bottom:2px solid var(--pri);margin-bottom:-2px">📋 기본정보</button>'+
    '<button class="eq-dtab" data-tab="cal" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--tm)">📐 교정이력</button>'+
    '<button class="eq-dtab" data-tab="log" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--tm)">📝 변경이력</button>'+
    '</div>'+
    '<div id="eqDPane_info">'+infoHtml+'</div>'+
    '<div id="eqDPane_cal" style="display:none"><div class="spin"></div></div>'+
    '<div id="eqDPane_log" style="display:none"><div class="spin"></div></div>'+
    '<div id="eqCmt" style="margin-top:12px"></div>';

  const foot=
    '<button class="btn bout" onclick="Modal.close()">닫기</button>'+
    '<button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._eqQR(&quot;'+H.e(row.code)+'&quot;,&quot;'+H.e(row.name)+'&quot;)">📱 QR</button>'+
    '<button class="btn bgh" onclick="Pages._calForm(&quot;'+H.e(row.code)+'&quot;)">📐 교정 등록</button>'+
    '<button class="btn bpri" onclick="Pages._eqForm('+JSON.stringify(row).replace(/"/g,'&quot;')+')" title="수정">✏️ 수정</button>';

  Modal.open({title:'계측기 상세 — '+H.e(row.name),size:'mlg',body,foot});

  /* 교정이력 + 댓글 비동기 로드 */
  setTimeout(async()=>{
    const calPane=document.getElementById('eqDPane_cal');
    const logPane=document.getElementById('eqDPane_log');
    /* 변경이력 탭에 code 전달 */
    if(logPane) logPane._equip_code=row.code;
    if(!calPane) return;
    if(!DB.cals||!DB.cals.length){const ld=await SB.getCals();if(ld)DB.cals=ld;}
    /* [v2.394 P2] cal_date 기준 내림차순 정렬 */
    const recs=(DB.cals||[]).filter(c=>(c.code===row.code||c.equip_code===row.code))
      .sort((a,b)=>(b.cal_date||b.date||'').localeCompare(a.cal_date||a.date||''))
      .sort((a,b)=>(b.cal_date||b.date||'').localeCompare(a.cal_date||a.date||''));
    if(!recs.length){
      calPane.innerHTML='<div style="color:var(--tm);font-size:12px;padding:12px 0">교정 이력이 없습니다.</div>';
    } else {
      let t='<table style="width:100%;font-size:12px;border-collapse:collapse">'+
        '<thead><tr style="background:var(--bg)">'+
        '<th style="padding:5px 8px;text-align:left">교정일</th>'+
        '<th style="padding:5px 8px;text-align:left">교정기관</th>'+
        '<th style="padding:5px 8px;text-align:left">성적서번호</th>'+
        '<th style="padding:5px 8px;text-align:center">결과</th>'+
        '<th style="padding:5px 8px;text-align:left">차기교정일</th>'+
        '<th style="padding:5px 8px;text-align:right">비용(원)</th>'+
        '<th style="padding:5px 8px;text-align:center">관리</th>'+
        '</tr></thead><tbody>';
      recs.forEach(c=>{
        t+='<tr style="border-bottom:1px solid var(--bd)">'+
          '<td style="padding:5px 8px">'+(c.cal_date||c.date||'-')+'</td>'+
          '<td style="padding:5px 8px">'+H.e(c.agency||'-')+'</td>'+
          '<td style="padding:5px 8px;font-family:monospace">'+H.e(c.cert_no||c.cert||'-')+'</td>'+
          '<td style="padding:5px 8px;text-align:center"><span class="badge '+(c.result==='합격'?'bgrn':c.result==='조건부합격'?'bamb':'bred')+'">'+H.e(c.result||'-')+'</span></td>'+
          '<td style="padding:5px 8px">'+(c.next_date||c.next||'-')+'</td>'+
          '<td style="padding:5px 8px;text-align:right">'+(c.cost?(Number(c.cost).toLocaleString()):'—')+'</td>'+
          '<td style="padding:5px 8px;text-align:center;white-space:nowrap">'+
          '<button class="btn bxs bgh" onclick="Pages._calForm(&quot;'+H.e(equip_code)+'&quot;,'+JSON.stringify(c).replace(/"/g,'&quot;')+')">수정</button> '+
          '<button class="btn bxs berr" onclick="Pages._calDel('+c.id+',&quot;'+H.e(row.code)+'&quot;)">삭제</button>'+
          '</td></tr>';
      });
      t+='</tbody></table>';
      calPane.innerHTML=t;
    }
    Cmt.render('#eqCmt','eq-'+row.id);
  },80);
},

/* [v2.394] 탭 전환 */
_eqDTab(btn){
  document.querySelectorAll('.eq-dtab').forEach(b=>{
    const on=b===btn;
    b.style.color=on?'var(--pri)':'var(--tm)';
    b.style.borderBottom=on?'2px solid var(--pri)':'2px solid transparent';
    b.classList.toggle('on',on);
  });
  const tab=btn.dataset.tab;
  ['info','cal','log'].forEach(t=>{
    const p=document.getElementById('eqDPane_'+t);
    if(p) p.style.display=t===tab?'block':'none';
  });
  /* 변경이력 탭: 첫 진입 시 로드 */
  if(tab==='log'){
    const logPane=document.getElementById('eqDPane_log');
    if(logPane&&logPane.querySelector('.spin')){
      Pages._loadEquipLogs(logPane);
    }
  }
},

async _loadEquipLogs(pane){
  /* [v2.394] 변경이력 탭 비동기 로드 */
  const equip=pane._equip_code;
  if(!equip){pane.innerHTML='<div style="color:var(--tm);font-size:12px;padding:12px">코드를 식별할 수 없습니다.</div>';return;}
  const logs=await SB.getLogs(equip);
  if(!logs.length){
    pane.innerHTML='<div style="color:var(--tm);font-size:12px;padding:12px 0">변경 이력이 없습니다.</div>';
    return;
  }
  let t='<table style="width:100%;font-size:12px;border-collapse:collapse">'+
    '<thead><tr style="background:var(--bg)">'+
    '<th style="padding:5px 8px;text-align:left">변경일시</th>'+
    '<th style="padding:5px 8px;text-align:left">항목</th>'+
    '<th style="padding:5px 8px;text-align:left">변경 전</th>'+
    '<th style="padding:5px 8px;text-align:left">변경 후</th>'+
    '<th style="padding:5px 8px;text-align:left">변경자</th>'+
    '</tr></thead><tbody>';
  logs.forEach(l=>{
    const dt=(l.changed_at||'').replace('T',' ').slice(0,16);
    t+='<tr style="border-bottom:1px solid var(--bd)">'+
      '<td style="padding:5px 8px;font-size:11px;color:var(--tm)">'+dt+'</td>'+
      '<td style="padding:5px 8px;font-weight:600">'+H.e(l.field_name||l.change_type||'-')+'</td>'+
      '<td style="padding:5px 8px;color:#ef4444">'+H.e(l.old_value||'-')+'</td>'+
      '<td style="padding:5px 8px;color:#22c55e">'+H.e(l.new_value||'-')+'</td>'+
      '<td style="padding:5px 8px">'+H.e(l.changed_by||'-')+'</td>'+
      '</tr>';
  });
  t+='</tbody></table>';
  pane.innerHTML=t;
},

async _calDel(calId, equip_code){
  /* [v2.394] 교정이력 삭제 */
  Modal.confirm({title:'교정이력 삭제',msg:'이 교정 이력을 삭제하시겠습니까?',danger:true,onOk:async()=>{
    const res=await SB.deleteCal(calId);
    if(!res.ok) return;
    Toast.show('삭제되었습니다.','ok');
    DB.cals=await SB.getCals();
    /* 상세 팝업 교정이력 탭 갱신 */
    const pane=document.getElementById('eqDPane_cal');
    if(pane){
      const recs=(DB.cals||[]).filter(c=>c.code===equip_code||c.equip_code===equip_code)
        .sort((a,b)=>(b.cal_date||b.date||'').localeCompare(a.cal_date||a.date||''));
      if(!recs.length){pane.innerHTML='<div style="color:var(--tm);font-size:12px;padding:12px 0">교정 이력이 없습니다.</div>';return;}
      pane.querySelector('tbody').innerHTML=recs.map(c=>
        '<tr style="border-bottom:1px solid var(--bd)">'+
        '<td style="padding:5px 8px">'+(c.cal_date||c.date||'-')+'</td>'+
        '<td style="padding:5px 8px">'+H.e(c.agency||'-')+'</td>'+
        '<td style="padding:5px 8px;font-family:monospace">'+H.e(c.cert_no||c.cert||'-')+'</td>'+
        '<td style="padding:5px 8px;text-align:center"><span class="badge '+(c.result==='합격'?'bgrn':c.result==='조건부합격'?'bamb':'bred')+'">'+H.e(c.result||'-')+'</span></td>'+
        '<td style="padding:5px 8px">'+(c.next_date||c.next||'-')+'</td>'+
        '<td style="padding:5px 8px;text-align:right">'+(c.cost?(Number(c.cost).toLocaleString()):'—')+'</td>'+
        '<td style="padding:5px 8px;text-align:center;white-space:nowrap">'+
        '<button class="btn bxs bgh" onclick="Pages._calForm(&quot;'+H.e(equip_code)+'&quot;,'+JSON.stringify(c).replace(/"/g,'&quot;')+')">수정</button> '+
        '<button class="btn bxs berr" onclick="Pages._calDel('+c.id+',&quot;'+H.e(equip_code)+'&quot;)">삭제</button>'+
        '</td></tr>').join('');
    }
  }});
},


/* ── 교정 ── */
cal(){
  const w=document.getElementById('pw');
  /* [v2.394 Phase3] D-30 이내 + 아직 만료 안된 계측기 */
  const _now=new Date();
  const soon=DB.equip.filter(e=>{
    if(!e.next) return false;
    const d=Math.ceil((new Date(e.next)-_now)/(864e5));
    return d>=0&&d<30;
  });
  w.innerHTML=`<div class="ph"><div><div class="ptit">📐 교정 관리</div></div><div class="pac"><button class="btn bpri btn-f2" onclick="Pages._calForm(null)">+ 교정 등록 <span class="kbd">F2</span></button></div></div>
    <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('cal')" title="엑셀 양식 내려받기">📥 양식 내려받기</button><button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('cal')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
    ${soon.length?`<div class="card" style="margin-bottom:12px;border-left:4px solid var(--warn)"><div class="ct" style="margin-bottom:9px">🔔 교정 예정/만료 알림 (30일 이내)</div>
    ${soon.map(e=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:13px"><div><strong>${H.e(e.name)}</strong> <span style="color:var(--tm);font-size:11px">(${H.e(e.code)})</span></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:var(--tm)">차기: ${e.next}</span><span class="badge ${e.status==='교정만료'?'bred':'bamb'}">${H.e(e.status)}</span></div></div>`).join('')}
    </div>`:''}
    <div class="tbar">
      <button class="btn bout bsm" onclick="SearchPop.open('cal')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="calTbl"></div>
    <div id="calCostChart" style="margin-top:16px"></div>`;
  /* [v2.394 P4-3] 교정비용 통계 차트 */
  Pages._calCostChart();
  Tbl.render({el:'#calTbl',cols:[
    {key:'code',label:'계측기코드', req:true,w:'100px'},
    {key:'name',label:'계측기명',w:'130px'},
    {key:'cal_date',label:'교정일',w:'88px',render:(v,row)=>v||row.date||'-'},
    {key:'agency',label:'교정기관',w:'110px'},
    {key:'cert_no',label:'성적서번호',w:'110px',render:(v,row)=>v||row.cert||'-'},
    {key:'result',label:'결과',w:'72px',align:'center',
      render:v=>`<span class="badge ${v==='합격'?'bgrn':v==='조건부합격'?'bamb':'bred'}">${H.e(v||'-')}</span>`},
    {key:'next_date',label:'차기교정일',w:'92px',render:(v,row)=>v||row.next||'-'},
    {key:'cost',label:'비용(원)',w:'86px',align:'right',
      render:v=>v?Number(v).toLocaleString():'—'},
    {key:'file_url',label:'파일',w:'60px',align:'center',  /* [v2.394] */
      render:(v,row)=>v
        ?`<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
            onclick="event.stopPropagation();Pages._calFilePreview('${H.e(v)}')">📎 보기</button>`
        :'<span style="color:var(--tl);font-size:11px">-</span>'},
  ],data:DB.cals,onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 교정관리 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        DB.cals=DB.cals.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.cal_list?.();
      };
      Modal.confirm({
        title:'🗑️ 교정관리 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 교정관리를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    }});
},
_calForm(equip_code, calRow){
  /* [v2.394 Phase2] 교정 등록/수정 폼 */
  const isEdit=!!calRow;
  const equip=DB.equip.find(e=>e.code===equip_code)||{};
  const equipOpts=DB.equip.map(e=>'<option value="'+H.e(e.code)+'"'+(e.code===equip_code?' selected':'')+'>' +H.e(e.code+' '+e.name)+'</option>').join('');
  Modal.open({title:isEdit?'교정이력 수정':'교정 등록',size:'mlg',
    body:'<div class="fg2">'
      +'<div class="fgroup ff"><label class="fl req">계측기</label>'
      +'<select id="cf_code" class="fc"'+(isEdit?' disabled':'')+'>'+equipOpts+'</select></div>'
      +'<div class="fgroup"><label class="fl req">교정일</label>'
      +'<input id="cf_date" class="fc" type="date" value="'+(calRow?.cal_date||calRow?.date||H.today())+'"></div>'
      +'<div class="fgroup"><label class="fl req">교정기관</label>'
      +'<input id="cf_agency" class="fc" value="'+H.e(calRow?.agency||'')+'" placeholder="예) 한국교정원"></div>'
      +'<div class="fgroup"><label class="fl">성적서번호</label>'
      +'<input id="cf_cert" class="fc" value="'+H.e(calRow?.cert_no||calRow?.cert||'')+'" placeholder="CAL-YYYY-NNN"></div>'
      +'<div class="fgroup"><label class="fl">결과</label>'
      +'<select id="cf_result" class="fc">'
      +'<option value="합격"'+((!calRow||calRow.result==='합격')?' selected':'')+'>합격</option>'
      +'<option value="불합격"'+(calRow?.result==='불합격'?' selected':'')+'>불합격</option>'
      +'<option value="조건부합격"'+(calRow?.result==='조건부합격'?' selected':'')+'>조건부합격</option>'
      +'</select></div>'
      +'<div class="fgroup"><label class="fl req">차기교정일</label>'
      +'<div style="display:flex;gap:6px;align-items:center">'
      +'<input id="cf_next" class="fc" type="date" value="'+(calRow?.next_date||calRow?.next||'')+'">'
      +'<select id="cf_cycle" class="fc" style="width:90px" title="교정 주기" onchange="Pages._calAutoNext()">'
      +'<option value="">주기선택</option>'
      +'<option value="3">3개월</option><option value="6">6개월</option>'
      +'<option value="12">12개월</option><option value="24">24개월</option>'
      +'<option value="36">36개월</option>'
      +'</select>'
      +'<button class="btn bgh bsm" onclick="Pages._calAutoNext()" title="교정일 기준 자동계산">⚡ 자동</button>'
      +'</div></div>'
      +'<div class="fgroup"><label class="fl">교정비용 (원)</label>'
      +'<input id="cf_cost" class="fc" type="number" value="'+(calRow?.cost||'')+'" placeholder="150000" min="0"></div>'
      +'<div class="fgroup ff"><label class="fl">비고</label>'
      +'<textarea id="cf_note" class="fc" rows="2" placeholder="특이사항 등">'+H.e(calRow?.note||'')+'</textarea></div>'
      +'<div class="fgroup" style="grid-column:1/-1">'   /* [v2.394] 파일 첨부 */
      +'<label class="fl">첨부파일</label>'
      +'<input class="fc" type="file" id="calFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">'
      +(calRow&&calRow.file_url
        ?'<div style="margin-top:5px;font-size:12px"><a href="'+H.e(calRow.file_url)+'" target="_blank" style="color:#2563eb">📎 현재 파일 보기</a></div>'
        :'')
      +'</div>'
      +'</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" id="cf_ok">'+(isEdit?'💾 수정':'✅ 등록')+'</button>',
  });
  setTimeout(()=>{
    const b=document.getElementById('cf_ok');
    if(b) b.onclick=()=>Pages._calSave(calRow||null);
  },50);
},
async _calSave(orig){
  /* [v2.394 Phase2] 교정 저장 + equipment.next 자동 갱신 */
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const equip_code=g('cf_code'),cal_date=g('cf_date'),agency=g('cf_agency'),next_date=g('cf_next');
  if(!equip_code){Toast.show('계측기를 선택하세요.','warn');return}
  if(!cal_date){Toast.show('교정일을 입력하세요.','warn');return}
  if(!agency){Toast.show('교정기관을 입력하세요.','warn');return}
  if(!next_date){Toast.show('차기교정일을 입력하세요.','warn');return}
  /* [v2.394] 파일 업로드 처리 */
  let cal_file_url=orig?.file_url||null;
  const calFileEl=document.getElementById('calFile');
  if(calFileEl?.files?.length){
    const f=calFileEl.files[0];
    const up=await SB.uploadFile('cal', f);
    if(up?.url) cal_file_url=up.url;
  }
  const row={
    equip_code,code:equip_code,
    cal_date,date:cal_date,
    agency,
    cert_no:g('cf_cert'),cert:g('cf_cert'),
    result:document.getElementById('cf_result')?.value||'합격',
    next_date,next:next_date,
    cost:Number(g('cf_cost'))||null,
    note:g('cf_note'),
    created_by:Auth.cur()?.username||'system',
    file_url:cal_file_url,
  };
  if(orig?.id) row.id=orig.id;
  const res=orig?await SB.updateCal(orig.id,row):await SB.addCal(row);
  if(!res.ok){Toast.show('저장 실패','err');return}
  /* equipment.last, next 자동 갱신 */
  const equip=DB.equip.find(e=>e.code===equip_code);
  if(equip){
    const patch={last:cal_date,next:next_date,status:H.equipStatus(next_date),updated_at:H.today()};
    await SB.updateEquip(equip.id,patch);
    Toast.show('교정이력 저장 및 계측기 교정일 자동 갱신 완료','ok');
  } else {
    Toast.show((orig?'수정':'등록')+'되었습니다.','ok');
  }
  Modal.close();
  DB.cals=await SB.getCals();
  DB.equip=await SB.getEquip();
  /* 열려있는 탭 새로고침 */
  const curPage=Nav._cur;
  if(curPage==='cal') Pages.cal();
  else if(curPage==='equip') Pages.equip();
},

/* [v2.394 P4-1] QR코드 생성 */
_eqQR(code, name){
  const url=location.origin+location.pathname+'?eq='+encodeURIComponent(code);
  const qrApi='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(url);
  const body=
    '<div style="text-align:center;padding:12px">'+
    '<img src="'+qrApi+'" width="180" height="180" style="border:1px solid var(--bd);border-radius:8px;margin-bottom:10px">'+
    '<div style="font-size:13px;font-weight:700;margin-bottom:4px">'+H.e(code)+' '+H.e(name)+'</div>'+
    '<div style="font-size:10px;color:var(--tm);word-break:break-all;margin-bottom:10px">'+H.e(url)+'</div>'+
    '<button class="btn bpri bsm" onclick="Pages._eqQRPrint(&quot;'+H.e(code)+'&quot;,&quot;'+H.e(name)+'&quot;,&quot;'+encodeURIComponent(url)+'&quot;)">🖨️ 인쇄</button>'+
    '</div>';
  Modal.open({title:'📱 QR코드 — '+H.e(name),size:'msm',body});
},
_eqQRPrint(code,name,encodedUrl){
  const url=decodeURIComponent(encodedUrl);
  const qrApi='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(url);
  const win=window.open('','_blank','width=420,height=520');
  const d=win.document;
  d.open();
  d.write('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  d.write('<style>body{font-family:sans-serif;text-align:center;padding:24px}.c{font-size:16px;font-weight:700;margin:8px 0}.u{font-size:9px;color:#64748b;word-break:break-all;max-width:260px;margin:0 auto}@media print{button{display:none}}</style></head><body>');
  d.write('<img src="'+qrApi+'" width="200" height="200" style="margin:10px auto;display:block">');
  d.write('<div class="c">'+H.e(code)+'</div>');
  d.write('<div style="font-size:13px;margin-bottom:4px">'+H.e(name)+'</div>');
  d.write('<div class="u">'+H.e(url)+'</div>');
  d.write('<button onclick="window.print()" style="margin-top:14px;padding:6px 18px;cursor:pointer">🖨️ 인쇄</button>');
  d.write('</body></html>');
  d.close();
},
/* [v2.394 P4-5] 교정 주기 기반 차기교정일 자동 계산 */
_calAutoNext(){
  const dateEl=document.getElementById('cf_date');
  const nextEl=document.getElementById('cf_next');
  const cycleEl=document.getElementById('cf_cycle');
  if(!dateEl||!nextEl||!cycleEl) return;
  const months=parseInt(cycleEl.value)||0;
  const base=dateEl.value;
  if(!months){Toast.show('주기를 선택하세요.','warn');return;}
  if(!base){Toast.show('교정일을 먼저 입력하세요.','warn');return;}
  const d=new Date(base);
  d.setMonth(d.getMonth()+months);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
  nextEl.value=`${y}-${m}-${dd}`;
  Toast.show(`${months}개월 주기 → ${nextEl.value} 자동설정`,'ok',2000);
},
/* [v2.394 P4-3] 교정비용 연도별 + 계측기별 통계 차트 */
_calCostChart(){
  const el=document.getElementById('calCostChart');
  if(!el) return;
  const cals=DB.cals||[];
  if(!cals.length){el.innerHTML='';return;}
  const byYear={};
  cals.forEach(c=>{
    const y=(c.cal_date||c.date||'').slice(0,4);
    const cost=Number(c.cost)||0;
    if(!y) return;
    if(!byYear[y]) byYear[y]={year:y,total:0,count:0};
    byYear[y].total+=cost; byYear[y].count+=1;
  });
  const years=Object.values(byYear).sort((a,b)=>a.year.localeCompare(b.year));
  const byEquip={};
  cals.forEach(c=>{
    const code=c.equip_code||c.code||'?';
    const cost=Number(c.cost)||0;
    if(!byEquip[code]) byEquip[code]={code,name:DB.equip.find(e=>e.code===code)?.name||code,total:0};
    byEquip[code].total+=cost;
  });
  const top5=Object.values(byEquip).filter(e=>e.total>0).sort((a,b)=>b.total-a.total).slice(0,5);
  if(!years.length&&!top5.length){el.innerHTML='';return;}
  const maxY=Math.max(...years.map(y=>y.total),1);
  const maxE=Math.max(...top5.map(e=>e.total),1);
  const totalCost=cals.reduce((s,c)=>s+(Number(c.cost)||0),0);
  const yearBars=years.map(y=>{
    const pct=Math.round((y.total/maxY)*100);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <div style="width:40px;text-align:right;font-size:11px;color:var(--tm)">${y.year}</div>
      <div style="flex:1;position:relative;height:26px;background:var(--bd);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:4px"></div>
        <span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:600;color:${pct>55?'#fff':'var(--tx)'}">
          ${y.total?'₩'+Number(y.total).toLocaleString():'—'} (${y.count}건)
        </span>
      </div></div>`;
  }).join('');
  const equipBars=top5.map(e=>{
    const pct=Math.round((e.total/maxE)*100);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <div style="width:90px;text-align:right;font-size:10px;color:var(--tm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${H.e(e.code)}</div>
      <div style="flex:1;position:relative;height:26px;background:var(--bd);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:4px"></div>
        <span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:600;color:${pct>55?'#fff':'var(--tx)'}">
          ₩${Number(e.total).toLocaleString()}
        </span>
      </div></div>`;
  }).join('');
  el.innerHTML=
    '<div class="card" style="margin-top:0">'+
    '<div class="ch"><div class="ct">📊 교정비용 통계</div>'+
    '<span style="font-size:11px;color:var(--tm)">누적 총비용: <strong>₩'+Number(totalCost).toLocaleString()+'</strong></span></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:4px 0">'+
    '<div><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:8px">연도별 교정비용</div>'+yearBars+'</div>'+
    (top5.length?'<div><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:8px">계측기별 Top5</div>'+equipBars+'</div>':'')+
    '</div></div>';
},
/* [v2.394 P4-6] 계측기 실시간 검색/필터 */
_eqFilter(){
  const q=(document.getElementById('eqSrch')?.value||'').toLowerCase();
  const st=document.getElementById('eqStat')?.value||'';
  /* [v2.394] status null 방어 — 실시간 재계산 */
  const filtered=DB.equip.filter(e=>{
    const mQ=!q||(e.code||'').toLowerCase().includes(q)||(e.name||'').toLowerCase().includes(q)
           ||(e.maker||'').toLowerCase().includes(q)||(e.model||'').toLowerCase().includes(q);
    /* [v2.394] next 기준 실시간 재계산 */
    const realStatus=H.equipStatus(e.next||null);
    const mS=!st||realStatus===st;
    return mQ&&mS;
  });
  Tbl.render({el:'#eqTbl',cols:[
    /* [v2.394] 컬럼 순서: 요청사항 기준 재정의 + model 복구 */
    {key:'code',     label:'계측기코드', req:true, w:'96px'},
    {key:'name',     label:'계측기명', req:true,   w:'130px'},
    {key:'model',    label:'모델번호',   w:'100px'},
    {key:'maker',    label:'제조사',     w:'80px'},
    {key:'range',    label:'측정범위',   w:'100px'},
    {key:'res',      label:'분해능',     w:'70px'},
    {key:'loc',      label:'보관위치',   w:'80px'},
    {key:'operator', label:'사용자',     w:'72px'},
    {key:'last',     label:'최근교정일', w:'96px'},
    {key:'next',     label:'차기교정일', w:'108px',
      render:v=>{
        if(!v) return '-';
        const d=Math.ceil((new Date(v)-new Date())/(864e5));
        const cls=d<0?'bred':d<30?'bamb':'';
        const tag=d<0?' (만료)':d<=30?' (D-'+d+')':'';
        return cls?'<span class="badge '+cls+'">'+v+tag+'</span>':(v+tag);
      }},
    {key:'active',   label:'사용여부',   w:'68px', align:'center',
      render:v=>`<span class="badge ${v===0||v==='0'?'bred':'bgrn'}">${v===0||v==='0'?'불용':'사용'}</span>`},
    {key:'status',   label:'상태',       w:'66px',
      render:(v,row)=>{
        const s=H.equipStatus(row.next||null);
        const cls=s==='정상'?'bgrn':s==='교정중'?'bamb':'bred';
        return `<span class="badge ${cls}">${s}</span>`;
      }},
    {key:'file_url', label:'파일',       w:'64px', align:'center',  /* [v2.394] */
      render:(v,row)=>v
        ?`<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
            onclick="event.stopPropagation();Pages._equipFilePreview('${H.e(v)}','${H.e(row?.code||'')}')">📎 보기</button>`
        :'<span style="color:var(--tl);font-size:11px">-</span>'},
  ],data:filtered,
  /* [v2.394] onDel 복구 */
  onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 계측기 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
    if(typeof _sb!=='undefined'&&_sb){
      const {error}=await _sb.from('equipment').delete().in('id',numIds);
      if(error){Toast.show('삭제 실패: '+error.message,'err');return;}
    }
    DB.equip=DB.equip.filter(e=>!numIds.includes(Number(e.id)));
    Toast.show(numIds.length+'건 삭제되었습니다.','ok');
    Pages.equip();
      };
      Modal.confirm({
        title:'🗑️ 계측기 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 계측기를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    },
  onRow:row=>Pages._eqDetail(row)});
},


/* ── MSA ── */
msa(){
  const w=document.getElementById('pw');
  w.innerHTML=`<div class="ph"><div><div class="ptit">📈 MSA 분석</div><div class="psub">측정시스템 분석 (Gauge R&R, 반복성·재현성)</div></div><div class="pac"><button class="btn bpri btn-f2">+ MSA 등록 <span class="kbd">F2</span></button></div></div>
  <div class="tabs"><div class="tbtn on" onclick="Pages._msaTab(this,'tGrr')">게이지 R&R</div><div class="tbtn" onclick="Pages._msaTab(this,'tLin')">직선성·편향</div><div class="tbtn" onclick="Pages._msaTab(this,'tAtt')">계수형 MSA</div></div>
  <div id="tGrr" class="tpanel on"><div class="card" style="margin-bottom:12px"><div class="ch"><div class="ct">📊 게이지 R&R 분석 결과 (샘플 데이터)</div></div>
    <div class="g3" style="margin-bottom:15px">
      <div style="text-align:center;padding:13px;background:var(--bg);border-radius:var(--r)"><div style="font-size:25px;font-weight:800;color:var(--ok)">8.42%</div><div style="font-size:12px;color:var(--tm);margin-top:3px">%GR&R ✅ 합격</div></div>
      <div style="text-align:center;padding:13px;background:var(--bg);border-radius:var(--r)"><div style="font-size:25px;font-weight:800;color:var(--pri)">5.21%</div><div style="font-size:12px;color:var(--tm);margin-top:3px">반복성 (EV)</div></div>
      <div style="text-align:center;padding:13px;background:var(--bg);border-radius:var(--r)"><div style="font-size:25px;font-weight:800;color:var(--info)">6.53%</div><div style="font-size:12px;color:var(--tm);margin-top:3px">재현성 (AV)</div></div>
    </div>
    <div class="ts"><table class="dt" style="font-size:12px"><thead><tr><th>측정자</th><th>부품1</th><th>부품2</th><th>부품3</th><th>부품4</th><th>부품5</th><th>평균</th><th>범위(R)</th></tr></thead><tbody>
      <tr><td>측정자A(시도1)</td><td>10.02</td><td>9.98</td><td>10.01</td><td>10.05</td><td>9.99</td><td><strong>10.01</strong></td><td>0.07</td></tr>
      <tr><td>측정자A(시도2)</td><td>10.01</td><td>9.97</td><td>10.02</td><td>10.04</td><td>10.00</td><td><strong>10.01</strong></td><td>0.07</td></tr>
      <tr><td>측정자B(시도1)</td><td>10.03</td><td>9.99</td><td>10.00</td><td>10.06</td><td>9.98</td><td><strong>10.01</strong></td><td>0.08</td></tr>
    </tbody></table></div>
  </div>
  <div class="card"><div class="ct" style="margin-bottom:9px">판정 기준</div>
    <div style="font-size:13px;line-height:2.2">🟢 <strong>10% 미만</strong>: 측정시스템 적합 &nbsp;&nbsp; 🟡 <strong>10~30%</strong>: 조건부 사용 &nbsp;&nbsp; 🔴 <strong>30% 초과</strong>: 개선 필수</div>
  </div></div>
  <div id="tLin" class="tpanel"><div class="card"><div class="es"><div class="es-icon">📏</div><div>직선성·편향 분석 — 백엔드 연동 후 활성화</div></div></div></div>
  <div id="tAtt" class="tpanel"><div class="card"><div class="es"><div class="es-icon">🔢</div><div>계수형 MSA — 백엔드 연동 후 활성화</div></div></div></div>`;
},
_msaTab(btn,id){
  document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.tpanel').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');const el=document.getElementById(id);if(el)el.classList.add('on');
},

/* ════════════════════════════════════════════════════════════
   문서관리 고도화 페이지 함수 [v2.399]
   ────────────────────────────────────────────────────────────
   v2.395   2026-06-01  최초 구현
   v2.395.1 2026-06-01  버그수정 — 버전표기/메뉴/결재함/이력빈화면
   v2.395.2 2026-06-01  버그수정 — Pages is not defined
   v2.396   2026-06-01  공통 UI 규칙 전면 준수
                         · stat-dash 클릭 시 해당 필터 이동
                         · Tbl.render 기반 테이블 (체크박스+정렬 내장)
                         · SearchPop F3 버튼 추가
                         · 칸반 탭 추가 (목록/칸반 전환)
                         · 기록관리 구현 (doc_type=record 조회)
                         · 결재함 사용자 매칭 강화 (설정→사용자등록 연동)
   ════════════════════════════════════════════════════════════ */

/* ── 상수: 상태·유형 한글 레이블 ── */
_DS:{draft:'초안',in_review:'검토중',pending:'승인대기',active:'유효',obsolete:'폐기',archived:'보관'},
_DT:{procedure:'절차서',instruction:'작업지시서',form:'양식',record:'기록',other:'기타'},
_dBadge:function(s){
  var m={draft:'bgry',in_review:'bblu',pending:'bamb',active:'bgrn',obsolete:'bred',archived:'bgry'};
  return'<span class="badge '+(m[s]||'bgry')+'">'+(Pages._DS[s]||s)+'</span>';
},
_dDay:function(dt){
  if(!dt)return'';
  var d=Math.ceil((new Date(dt)-new Date())/86400000);
  if(d<0)  return'<span class="badge bred" title="검토 만료">만료</span>';
  if(d<=7) return'<span class="badge bred">D-'+d+'</span>';
  if(d<=30)return'<span class="badge bamb">D-'+d+'</span>';
  return'';
},

/* ══════════════════════════════════════════════════
   D1: 문서 목록 [v2.399]
   기존 QMS UI 규칙: stat-dash + Tbl.render + F3 + 칸반
   ══════════════════════════════════════════════════ */
async docs(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  window._docRows=[];
  try{ window._docRows=await SB.getDocMaster(); }catch(e){ Toast.show('문서 조회 실패: '+e.message,'err'); }

  var rows=window._docRows;
  var cnt={all:rows.length,active:0,in_review:0,draft:0,obsolete:0};
  rows.forEach(function(r){if(cnt[r.status]!==undefined)cnt[r.status]++;});
  var byType={};
  rows.forEach(function(r){var t=Pages._DT[r.doc_type]||r.doc_type||'-';byType[t]=(byType[t]||0)+1;});

  w.innerHTML=
    /* ① stat-dash — 클릭 시 해당 상태 필터 + 목록 이동 */
    '<div class="stat-dash">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'\',\'all\')" title="전체 목록">'+
        '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📄</div>'+
        '<div><div class="sd-val">'+cnt.all+'</div><div class="sd-lbl">전체 문서</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'active\',\'유효\')" title="유효 문서만">'+
        '<div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+cnt.active+'</div><div class="sd-lbl">유효</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'in_review\',\'검토중\')" title="검토중 문서만">'+
        '<div class="sd-icon" style="background:#dbeafe;color:#2563eb">🔄</div>'+
        '<div><div class="sd-val">'+cnt.in_review+'</div><div class="sd-lbl">검토중</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'draft\',\'초안\')" title="초안만">'+
        '<div class="sd-icon" style="background:#fef3c7;color:#d97706">📝</div>'+
        '<div><div class="sd-val">'+cnt.draft+'</div><div class="sd-lbl">초안</div></div>'+
      '</div>'+
      Object.entries(byType).map(function(e){
        return'<div class="sd-card sd-sm" style="cursor:pointer" onclick="Pages._docTypeClick(\''+e[0]+'\')" title="'+e[0]+' 보기">'+
          '<div class="sd-lbl">'+e[0]+'</div>'+
          '<div class="sd-val" style="font-size:17px">'+e[1]+'</div>'+
        '</div>';
      }).join('')+
    '</div>'+

    /* ② 페이지 헤더 */
    '<div class="ph" style="margin-top:14px"><div><div class="ptit">📄 문서 목록</div></div>'+
      '<div class="pac">'+
        '<button class="btn bpri btn-f2" onclick="Pages._docForm()">+ 문서 등록 <span class="kbd">F2</span></button>'+
      '</div>'+
    '</div>'+

    /* ③ 툴바 — 엑셀 + 검색 + F3 */
    '<button class="btn btn-xl-down bsm" onclick="Pages._docExcelDown()" title="목록 내려받기">📥 목록 내려받기</button>'+
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="docKw" placeholder="문서번호, 제목, 태그..." oninput="Pages._docKwFilter(this.value)"></div>'+
      '<select class="fsel" id="docTypeF" onchange="Pages._docTpFilter(this.value)">'+
        '<option value="">전체 유형</option>'+
        Object.entries(Pages._DT).map(function(e){return'<option value="'+e[0]+'">'+e[1]+'</option>';}).join('')+
      '</select>'+
      '<button class="btn bout bsm" onclick="SearchPop.open(\'docs\')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>'+
    '</div>'+

    /* ④ 목록/칸반 탭 */
    '<div class="tbar" style="border-bottom:2px solid var(--brd);padding-bottom:0;gap:0" id="docViewTabs">'+
      '<button class="stab-btn on" data-tab="list"   onclick="Pages._docViewTab(\'list\',this)">📋 목록</button>'+
      '<button class="stab-btn"   data-tab="kanban" onclick="Pages._docViewTab(\'kanban\',this)">📌 칸반</button>'+
    '</div>'+

    /* ⑤ 목록/칸반 영역 */
    '<div id="docListPane"><div id="docTbl"></div></div>'+
    '<div id="docKanbanPane" style="display:none"><div id="docKanban"></div></div>';

  /* 전역 필터 초기화 */
  window._docSt=''; window._docTp=''; window._docKw='';
  Pages._docRender();
  Pages._docKanban();
},

/* stat-dash 클릭 → 상태 필터 + 목록 탭 활성 */
_docStatClick:function(st,label){
  window._docSt=st; window._docTp=''; window._docKw='';
  var kw=document.getElementById('docKw'); if(kw)kw.value='';
  var tp=document.getElementById('docTypeF'); if(tp)tp.value='';
  Pages._docViewTab('list', document.querySelector('#docViewTabs [data-tab="list"]'));
  Pages._docRender();
},
/* 유형 sd-card 클릭 → 유형 필터 */
_docTypeClick:function(typeName){
  var key=Object.keys(Pages._DT).find(function(k){return Pages._DT[k]===typeName;})||'';
  window._docTp=key; window._docSt=''; window._docKw='';
  var tp=document.getElementById('docTypeF'); if(tp)tp.value=key;
  Pages._docViewTab('list', document.querySelector('#docViewTabs [data-tab="list"]'));
  Pages._docRender();
},
/* 목록/칸반 탭 전환 */
_docViewTab:function(tab,btn){
  document.querySelectorAll('#docViewTabs .stab-btn').forEach(function(b){b.classList.remove('on');});
  if(btn)btn.classList.add('on');
  var lp=document.getElementById('docListPane');
  var kp=document.getElementById('docKanbanPane');
  if(tab==='list'){
    if(lp)lp.style.display=''; if(kp)kp.style.display='none';
  } else {
    if(lp)lp.style.display='none'; if(kp)kp.style.display='';
    Pages._docKanban();
  }
},
/* 인라인 필터 핸들러 */
_docKwFilter:function(v){window._docKw=v; Pages._docRender();},
_docTpFilter:function(v){window._docTp=v; Pages._docRender();},
/* 필터 적용 후 rows 반환 */
_docFiltered:function(){
  var rows=window._docRows||[];
  var st=window._docSt||''; var tp=window._docTp||''; var kw=(window._docKw||'').toLowerCase();
  if(st) rows=rows.filter(function(r){return r.status===st;});
  if(tp) rows=rows.filter(function(r){return r.doc_type===tp;});
  if(kw) rows=rows.filter(function(r){
    return (r.title||'').toLowerCase().includes(kw)||
           (r.doc_no||'').toLowerCase().includes(kw)||
           (r.tags||[]).some(function(t){return t.toLowerCase().includes(kw);});
  });
  return rows;
},

/* ── 목록 렌더링 — Tbl.render (체크박스+정렬 기본 내장) ── */
_docRender:function(){
  var rows=Pages._docFiltered();
  Tbl.render({
    el:'#docTbl',
    cols:[
      {key:'doc_no',        label:'문서번호',   w:'130px',
        render:function(v,row){
          return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';
        }},
      {key:'title',         label:'제목',
        render:function(v,row){
          var chips=(row.tags||[]).map(function(t){
            return'<span style="background:#f1f5f9;color:#475569;font-size:10px;padding:1px 4px;border-radius:3px;margin-left:3px">'+H.e(t)+'</span>';
          }).join('');
          return'<span style="font-weight:500;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>'+chips;
        }},
      {key:'doc_type',      label:'유형',       w:'78px', align:'center',
        render:function(v){return'<span class="badge bblu" style="font-size:10px">'+(Pages._DT[v]||v||'-')+'</span>';}},
      {key:'current_ver',   label:'버전',       w:'58px', align:'center',
        render:function(v){return'<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px">'+H.e(v||'-')+'</span>';}},
      {key:'status',        label:'상태',       w:'72px', align:'center',
        render:function(v){return Pages._dBadge(v);}},
      {key:'next_review_at',label:'다음 검토일', w:'120px',
        render:function(v,row){return H.e(v||'-')+' '+Pages._dDay(v);}},
      {key:'dept',          label:'부서',       w:'68px', align:'center'},
      {key:'id',            label:'파일',       w:'58px', align:'center',
        render:function(v,row){return FM.btn('doc-'+v);}},
    ],
    data:rows,
    onDel:async function(ids){
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      var hasActive=(window._docRows||[]).some(function(r){return ids.includes(r.id)&&r.status==='active';});
      if(hasActive){Toast.show('유효(Active) 문서는 삭제할 수 없습니다.','warn');return;}
      Modal.confirm({
        title:'🗑️ 문서 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+
            '<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">'+ids.length+'건</b>의 문서를 삭제합니다.</div>'+
            '<div style="font-size:12px;color:#64748b">연결된 버전 이력도 함께 삭제됩니다.</div></div>',
        danger:true,
        onOk:async function(){
          for(var i=0;i<ids.length;i++) await SB.deleteDocMaster(ids[i]);
          window._docRows=(window._docRows||[]).filter(function(x){return!ids.includes(x.id);});
          Pages._docRender(); Pages._docKanban();
          Toast.show(ids.length+'건 삭제되었습니다.','ok');
        }
      });
    },
    onRow:function(row){if(row)Pages._docDetail(row);},
  });
},

/* ── 칸반 보드 [v2.399] ── */
/* ── 칸반 보드 [v2.397.2 UI개선] ── */
_docKanban:function(){
  var el=document.getElementById('docKanban'); if(!el)return;
  var rows=window._docRows||[];
  var cols=[
    {key:'draft',     icon:'📝',label:'초안',   hdrBg:'#f1f5f9',hdrClr:'#475569',brdClr:'#e2e8f0',cnt:'bgry'},
    {key:'in_review', icon:'🔄',label:'검토중', hdrBg:'#eff6ff',hdrClr:'#1d4ed8',brdClr:'#bfdbfe',cnt:'bblu'},
    {key:'active',    icon:'✅',label:'유효',   hdrBg:'#f0fdf4',hdrClr:'#15803d',brdClr:'#86efac',cnt:'bgrn'},
    {key:'obsolete',  icon:'🗄',label:'폐기',   hdrBg:'#fff5f5',hdrClr:'#b91c1c',brdClr:'#fca5a5',cnt:'bred'},
  ];
  el.innerHTML=
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px 0">'+
    cols.map(function(col){
      var colRows=rows.filter(function(r){return r.status===col.key;});
      return'<div style="background:var(--bg2);border:1.5px solid '+col.brdClr+';border-radius:12px;overflow:hidden;display:flex;flex-direction:column">'+
        /* 컬럼 헤더 */
        '<div style="background:'+col.hdrBg+';padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid '+col.brdClr+'">'+
          '<div style="display:flex;align-items:center;gap:6px">'+
            '<span style="font-size:14px">'+col.icon+'</span>'+
            '<span style="font-size:13px;font-weight:700;color:'+col.hdrClr+'">'+col.label+'</span>'+
          '</div>'+
          '<span class="badge '+col.cnt+'" style="font-size:11px;font-weight:700">'+colRows.length+'</span>'+
        '</div>'+
        /* 카드 목록 */
        '<div style="padding:8px;flex:1;min-height:80px">'+
        colRows.map(function(r){
          var dday=Pages._dDay(r.next_review_at);
          var dtLabel=Pages._DT[r.doc_type]||r.doc_type||'';
          return'<div style="background:var(--card);border:1px solid var(--brd);border-radius:8px;padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:all .15s" '+
            'onclick="Pages.doc_history('+r.id+')" '+
            'onmouseover="this.style.borderColor=\''+col.brdClr+'\';this.style.boxShadow=\'0 3px 10px rgba(0,0,0,.09)\';this.style.transform=\'translateY(-1px)\'" '+
            'onmouseout="this.style.borderColor=\'var(--brd)\';this.style.boxShadow=\'\';this.style.transform=\'\'">'+
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'+
              '<span style="font-family:monospace;font-size:10px;font-weight:700;color:'+col.hdrClr+';background:'+col.hdrBg+';padding:1px 5px;border-radius:3px">'+H.e(r.doc_no||'-')+'</span>'+
              '<span style="background:#ede9fe;color:#5b21b6;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px">'+H.e(r.current_ver||'-')+'</span>'+
            '</div>'+
            '<div style="font-weight:600;font-size:12px;line-height:1.4;margin-bottom:6px;color:var(--text)">'+H.e(r.title||'-')+'</div>'+
            '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">'+
              (dtLabel?'<span style="background:#f1f5f9;color:#64748b;font-size:10px;padding:1px 5px;border-radius:3px">'+dtLabel+'</span>':'')+
              (r.dept?'<span style="background:#f1f5f9;color:#64748b;font-size:10px;padding:1px 5px;border-radius:3px">'+H.e(r.dept)+'</span>':'')+
              (dday?'<span style="margin-left:auto">'+dday+'</span>':'')+
            '</div>'+
          '</div>';
        }).join('')+
        (!colRows.length?
          '<div style="text-align:center;padding:24px 8px;color:var(--muted)">'+
            '<div style="font-size:22px;opacity:.35;margin-bottom:4px">'+col.icon+'</div>'+
            '<div style="font-size:11px">해당 문서 없음</div>'+
          '</div>':'')+
        '</div>'+
      '</div>';
    }).join('')+
    '</div>';
},

/* ── 문서 상세 팝업 [v2.399] ── */
_docDetail:function(row){
  Modal.open({title:'문서 상세 — '+H.e(row.doc_no||'-'),size:'mlg',
    body:
      '<div class="ir"><div class="il">문서번호</div><div class="iv" style="font-family:monospace;font-weight:700;color:#1a5fa8">'+H.e(row.doc_no||'-')+'</div></div>'+
      '<div class="ir"><div class="il">제목</div><div class="iv"><strong>'+H.e(row.title||'-')+'</strong></div></div>'+
      '<div class="ir"><div class="il">유형</div><div class="iv"><span class="badge bblu">'+(Pages._DT[row.doc_type]||row.doc_type||'-')+'</span></div></div>'+
      '<div class="ir"><div class="il">버전 / 상태</div><div class="iv">'+H.e(row.current_ver||'-')+' '+Pages._dBadge(row.status)+'</div></div>'+
      '<div class="ir"><div class="il">담당 부서</div><div class="iv">'+H.e(row.dept||'-')+'</div></div>'+
      '<div class="ir"><div class="il">다음 검토일</div><div class="iv">'+H.e(row.next_review_at||'-')+' '+Pages._dDay(row.next_review_at)+'</div></div>'+
      '<div class="ir"><div class="il">태그</div><div class="iv">'+
        (row.tags||[]).map(function(t){return'<span style="background:#f1f5f9;color:#475569;font-size:11px;padding:2px 7px;border-radius:4px;margin-right:4px">'+H.e(t)+'</span>';}).join('')+
      '</div></div>',
    foot:
      '<button class="btn bout" onclick="Modal.close()">닫기</button>'+
      '<button class="btn bout" onclick="Modal.close();Pages.doc_history('+row.id+')">🕐 이력</button>'+
      '<button class="btn bpri" onclick="Modal.close();Pages._docRevForm('+row.id+')">✏️ 개정 기안</button>',
  });
},

/* ── D2: 문서 등록 [v2.399] ── */
_docForm:function(editDoc){
  editDoc=editDoc||null;
  SB.getUsers().then(function(users){
    var uOpts=users.map(function(u){return'<option value="'+u.id+'">'+H.e(u.name||u.username)+'('+H.e(u.dept||'')+')</option>';}).join('');
    var dtOpts=Object.entries(Pages._DT).map(function(e){
      return'<option value="'+e[0]+'"'+(editDoc&&editDoc.doc_type===e[0]?' selected':'')+'>'+e[1]+'</option>';
    }).join('');
    Modal.open({title:'신규 문서 등록',size:'mlg',body:
      '<div class="fg2">'+
      '<div class="fgroup"><label class="fl req">문서번호</label><input class="fc" id="fnDocNo" placeholder="예: QP-001" value="'+H.e(editDoc?editDoc.doc_no:'')+'"></div>'+
      '<div class="fgroup"><label class="fl req">문서 제목</label><input class="fc" id="fnTitle" placeholder="예: 수입검사 절차서" value="'+H.e(editDoc?editDoc.title:'')+'"></div>'+
      '<div class="fgroup"><label class="fl req">문서 유형</label><select class="fc" id="fnType">'+dtOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">분류</label><select class="fc" id="fnCat"><option value="">선택 안함</option>'+['품질','생산','구매','안전','환경','기타'].map(function(x){return'<option'+(editDoc&&editDoc.category===x?' selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
      '<div class="fgroup"><label class="fl">검토 주기</label><select class="fc" id="fnCycle"><option value="annual">연간</option><option value="biannual">반기</option><option value="quarterly">분기</option><option value="monthly">매월</option></select></div>'+
      '<div class="fgroup"><label class="fl">담당 부서</label><input class="fc" id="fnDept" value="'+H.e(editDoc?editDoc.dept:'')+'"></div>'+
      '<div class="fgroup ff"><label class="fl">태그</label><input class="fc" id="fnTags" placeholder="쉼표로 구분 (예: ISO9001, 품질관리)" value="'+H.e(editDoc?(editDoc.tags||[]).join(', '):'')+'"></div>'+
      '<div class="fgroup"><label class="fl">최종 결재자</label><select class="fc" id="fnApprover"><option value="">선택 안함</option>'+uOpts+'</select></div>'+
      '<div class="fgroup ff"><label class="fl">개정 사유</label><input class="fc" id="fnSummary" placeholder="신규 등록 시 생략 가능"></div>'+
      '<div class="fgroup ff"><label class="fl">첨부 파일</label>'+
        '<label style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1.5px dashed var(--bd);border-radius:var(--r);cursor:pointer;font-size:12px;color:var(--tm)">'+
          '📁 파일 선택 (모든 형식)'+
          '<input type="file" multiple id="fnFile" style="display:none" onchange="FM.add(&quot;doc-new&quot;,this)">'+
        '</label>'+
        '<button class="btn bout bsm" style="margin-left:8px" onclick="FM.modal(&quot;doc-new&quot;)">📎 파일 목록</button>'+
      '</div>'+
      '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri" onclick="Pages._docSave(null)">등록</button>'});
  });
},
_docSave:async function(editId){
  var docNo=document.getElementById('fnDocNo')?.value?.trim();
  var title=document.getElementById('fnTitle')?.value?.trim();
  if(!docNo){Toast.show('문서번호를 입력하세요.','warn');return;}
  if(!title){Toast.show('문서 제목을 입력하세요.','warn');return;}
  var tags=(document.getElementById('fnTags')?.value||'').split(',').map(function(t){return t.trim();}).filter(Boolean);
  var row={doc_no:docNo,title:title,doc_type:document.getElementById('fnType')?.value,
           category:document.getElementById('fnCat')?.value||null,
           review_cycle:document.getElementById('fnCycle')?.value||'annual',
           dept:document.getElementById('fnDept')?.value?.trim()||null,
           tags:tags,status:'draft',current_ver:'v1.0'};
  var r=await SB.addDocMaster(row); if(!r.ok)return;
  var allDocs=await SB.getDocMaster();
  var newDoc=allDocs.find(function(d){return d.doc_no===docNo;});
  if(newDoc){
    var vr=await SB.addDocVersion({doc_id:newDoc.id,ver_no:'v1.0',
      change_summary:document.getElementById('fnSummary')?.value?.trim()||'신규 등록',status:'draft'});
    var appId=document.getElementById('fnApprover')?.value;
    if(appId&&vr.ok&&vr.id){
      await SB.addDocApprovals([{doc_ver_id:vr.id,approver_id:parseInt(appId),step_order:99,step_type:'approver',action:'pending'}]);
      await SB.updateDocMaster(newDoc.id,{status:'in_review'});
      await SB.updateDocVersion(vr.id,{status:'in_review'});
      var cur=Auth.cur();
      await SB.addMention({from:cur?cur.name||cur.username:'시스템',to:String(appId),
        text:'[문서 결재 요청] '+title+' (v1.0) 결재를 요청드립니다.',ref:'doc_approval'});
    }
  }
  /* 파일 이동: doc-new → doc-{id} */
  if(newDoc&&App.files['doc-new']&&App.files['doc-new'].length){
    App.files['doc-'+newDoc.id]=App.files['doc-new'];
    delete App.files['doc-new'];
  }
  Toast.show('문서가 등록되었습니다.','ok'); Modal.close();
  window._docRows=await SB.getDocMaster(); Pages._docRender(); Pages._docKanban();
},
_docExcelDown:function(){
  var rows=Pages._docFiltered();
  if(!rows.length){Toast.show('출력할 데이터가 없습니다.','warn');return;}
  var hdrs=['문서번호','제목','유형','분류','버전','상태','담당부서','다음검토일','태그'];
  var data=rows.map(function(r){return[r.doc_no,r.title,Pages._DT[r.doc_type]||r.doc_type,r.category,r.current_ver,Pages._DS[r.status]||r.status,r.dept,r.next_review_at,(r.tags||[]).join(',')];});
  if(typeof downloadExcel==='function') downloadExcel('문서목록',hdrs,data);
  else Toast.show('엑셀 기능을 찾을 수 없습니다.','warn');
},

/* ── D2-B: 개정 기안 [v2.399] ── */
_docRevForm:async function(docId){
  var doc=await SB.getDocMasterById(docId);
  if(!doc){Toast.show('문서 정보를 불러올 수 없습니다.','err');return;}
  var users=await SB.getUsers();
  var uOpts=users.map(function(u){return'<option value="'+u.id+'">'+H.e(u.name||u.username)+'('+H.e(u.dept||'')+')</option>';}).join('');
  var curVer=doc.current_ver||'v1.0';
  var m=curVer.match(/v?(\d+)\.(\d+)/);
  var nextVer=m?'v'+m[1]+'.'+(parseInt(m[2])+1):'v1.1';
  Modal.open({title:'개정 기안 — '+H.e(doc.doc_no)+' '+H.e(doc.title),size:'mlg',body:
    '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:13px;color:#1e40af">'+
    '현재 버전: <b>'+H.e(curVer)+'</b> → 신규 버전: <b>'+H.e(nextVer)+'</b></div>'+
    '<div class="fg2">'+
    '<div class="fgroup ff"><label class="fl req">개정 사유</label><input class="fc" id="rvSummary" placeholder="예: 작업 절차 변경에 따른 내용 수정"></div>'+
    '<div class="fgroup ff"><label class="fl">세부 변경 내용</label><textarea class="fc" id="rvDetail" rows="3"></textarea></div>'+
    '<div class="fgroup"><label class="fl req">신규 버전 번호</label><input class="fc" id="rvVerNo" value="'+H.e(nextVer)+'"></div>'+
    '<div class="fgroup"><label class="fl">최종 결재자</label><select class="fc" id="rvApprover"><option value="">선택 안함</option>'+uOpts+'</select></div>'+
    '<div class="fgroup ff"><label class="fl">개정 파일 첨부</label>'+
      '<label style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1.5px dashed var(--bd);border-radius:var(--r);cursor:pointer;font-size:12px;color:var(--tm)">'+
        '📁 파일 선택'+
        '<input type="file" multiple id="rvFile" style="display:none" onchange="FM.add(\'doc-rev-'+docId+'\',this)">'+
      '</label>'+
        '<button class="btn bout bsm" style="margin-left:8px" onclick="FM.modal(\'doc-rev-'+docId+'\')">📎 파일 목록</button>'+
    '</div>'+
    '</div>',
  foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
       '<button class="btn bpri" onclick="Pages._docRevSave('+docId+')">개정 기안 제출</button>'});
},
_docRevSave:async function(docId){
  var summary=document.getElementById('rvSummary')?.value?.trim();
  var detail=document.getElementById('rvDetail')?.value?.trim();
  var verNo=document.getElementById('rvVerNo')?.value?.trim();
  var appId=document.getElementById('rvApprover')?.value;
  if(!summary){Toast.show('개정 사유를 입력하세요.','warn');return;}
  if(!verNo){Toast.show('버전 번호를 입력하세요.','warn');return;}
  var vr=await SB.addDocVersion({doc_id:docId,ver_no:verNo,change_summary:summary,change_detail:detail||null,status:'in_review'});
  if(!vr.ok)return;
  if(appId&&vr.id){
    await SB.addDocApprovals([{doc_ver_id:vr.id,approver_id:parseInt(appId),step_order:99,step_type:'approver',action:'pending'}]);
    var doc=await SB.getDocMasterById(docId); var cur=Auth.cur();
    await SB.addMention({from:cur?cur.name||cur.username:'시스템',to:String(appId),
      text:'[개정 결재 요청] '+(doc?doc.title:'')+'('+verNo+') 결재를 요청드립니다.',ref:'doc_approval'});
  }
  await SB.updateDocMaster(docId,{status:'in_review'});
  /* 파일: doc-rev-{docId} → doc-{docId} 병합 */
  var revKey='doc-rev-'+docId;
  if(App.files[revKey]&&App.files[revKey].length){
    if(!App.files['doc-'+docId]) App.files['doc-'+docId]=[];
    App.files['doc-'+docId]=App.files['doc-'+docId].concat(App.files[revKey]);
    delete App.files[revKey];
  }
  Toast.show('개정 기안이 제출되었습니다.','ok'); Modal.close();
  window._docRows=await SB.getDocMaster(); Pages._docRender(); Pages._docKanban();
},

/* ══════════════════════════════════════════════════
   D3: 내 결재함 [v2.399]
   설정→사용자관리(users 테이블)와 직접 연동
   ══════════════════════════════════════════════════ */
async doc_approval(){
  var w=document.getElementById('pw');
  var user=Auth.cur();
  if(!user){
    w.innerHTML='<div class="ph"><div><div class="ptit">✍️ 내 결재함</div></div></div>'+
      '<div class="card"><div class="es"><div class="es-icon">🔒</div><div>로그인이 필요합니다.</div></div></div>';
    return;
  }
  w.innerHTML=
    '<div class="ph"><div><div class="ptit">✍️ 내 결재함</div>'+
    '<div style="font-size:12px;color:var(--muted)">문서 결재 대기 목록</div></div></div>'+
    '<div id="approvalList"><div class="es"><div class="es-icon">⏳</div><div>조회 중...</div></div></div>';

  var el=document.getElementById('approvalList');
  try{
    /* [v2.399] users 테이블(설정→사용자관리)에서 현재 로그인 사용자 매칭
       Auth._u = users row 전체. id/name/username 순으로 매칭 */
    var users=await SB.getUsers();
    var meId=null;

    /* [v2.399] 사용자 매칭 강화 — 설정→사용자관리 users 테이블과 연동
       Auth._u = 로그인 성공 시 DB.users 에서 찾은 row
       Auth._cur = 로그인 username 문자열 */

    /* 1순위: Auth._u.id 직접 매핑 */
    if(user.id){
      var byId=users.find(function(u){return Number(u.id)===Number(user.id);});
      if(byId) meId=Number(byId.id);
    }
    /* 2순위: username (로그인 아이디) 매칭 */
    if(!meId){
      var loginId=user.username||Auth._cur||'';
      var loginNm=user.name||'';
      var byUser=users.find(function(u){
        return (loginId && (u.username===loginId||u.name===loginId)) ||
               (loginNm && (u.name===loginNm||u.username===loginNm));
      });
      if(byUser) meId=Number(byUser.id);
    }

    if(!meId){
      el.innerHTML=
        '<div style="padding:40px;text-align:center;color:var(--muted)">'+
        '<div style="font-size:36px;margin-bottom:10px">👤</div>'+
        '<div style="font-weight:600;font-size:14px;margin-bottom:8px">사용자 매칭 실패</div>'+
        '<div style="font-size:13px;line-height:1.6">'+
          '로그인 계정 <b>'+H.e(user.name||user.username||'-')+'</b>이<br>'+
          '<b>시스템 → 설정 → 사용자 관리</b>에 등록된<br>'+
          '사용자의 이름(name)과 일치하지 않습니다.'+
        '</div>'+
        '<button class="btn bout bsm" style="margin-top:14px" onclick="Nav.go(\'users\')">⚙️ 사용자 관리로 이동</button>'+
        '</div>';
      return;
    }

    var list=await SB.getMyPendingApprovals(meId);
    if(!list.length){
      el.innerHTML=
        '<div style="padding:48px;text-align:center;color:var(--muted)">'+
        '<div style="font-size:36px;margin-bottom:10px">✅</div>'+
        '<div style="font-size:15px;font-weight:500">결재 대기 없음</div>'+
        '<div style="font-size:13px;margin-top:4px">현재 처리할 결재 문서가 없습니다.</div>'+
        '</div>';
      return;
    }

    var html='<div style="display:flex;flex-direction:column;gap:10px">';
    list.forEach(function(a){
      var ver=a.doc_ver||{};
      var dm=ver.doc_master||{};
      var docTitle=dm.title||'(문서 제목 없음)';
      var verNo=ver.ver_no||'-';
      var summary=ver.change_summary||'(개정 사유 없음)';
      html+=
        '<div style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:16px 18px">'+
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">'+
          '<span style="font-size:18px">'+(a.step_type==='approver'?'🔏':'🔍')+'</span>'+
          '<div style="flex:1">'+
            '<div style="font-weight:700;font-size:14px;margin-bottom:3px">'+H.e(docTitle)+'</div>'+
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+
              '<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px">'+H.e(verNo)+'</span>'+
              '<span class="badge bblu" style="font-size:10px">'+(a.step_type==='approver'?'🔏 최종 결재':'🔍 검토')+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;padding:8px 10px;background:var(--bg2);border-radius:6px">📝 '+H.e(summary)+'</div>'+
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+
          '<input type="text" id="cmt_'+a.id+'" style="flex:1;min-width:160px;padding:7px 10px;border:1px solid var(--brd);border-radius:6px;font-size:12px;background:var(--bg)" placeholder="의견 입력 (반려 시 필수)">'+
          '<button class="btn bgrn bsm" onclick="Pages._doApprove('+a.id+','+(ver.doc_id||0)+','+(ver.id||0)+',\''+H.e(verNo).replace(/'/g,"\\'")+'\','+meId+')">✅ 승인</button>'+
          '<button class="btn bred bsm" onclick="Pages._doReject('+a.id+')">❌ 반려</button>'+
          '<button class="btn bout bsm" onclick="Pages.doc_history('+(ver.doc_id||0)+')">🕐 이력</button>'+
        '</div>'+
        '</div>';
    });
    el.innerHTML=html+'</div>';
  }catch(e){
    el.innerHTML='<div style="padding:40px;text-align:center;color:var(--err)">⚠️ 결재 목록 로드 실패: '+H.e(e.message)+'</div>';
  }
},
_doApprove:async function(approvalId,docId,verId,verNo,meId){
  var comment=document.getElementById('cmt_'+approvalId)?.value||'';
  var r=await SB.processApproval(approvalId,'approved',comment); if(!r.ok)return;
  if(docId&&verId&&verNo){
    var approvals=await SB.getDocApprovals(verId);
    var allDone=approvals.every(function(a){return a.action==='approved';});
    if(allDone){
      await SB.activateDocVersion(docId,verId,verNo,meId||null);
      Toast.show('✅ 승인 완료! 유효 문서로 발행되었습니다.','ok',3000);
    } else {
      Toast.show('승인 처리되었습니다.','ok');
    }
  } else { Toast.show('승인 처리되었습니다.','ok'); }
  Pages.doc_approval();
},
_doReject:async function(approvalId){
  var comment=document.getElementById('cmt_'+approvalId)?.value?.trim();
  if(!comment){Toast.show('반려 시 사유를 입력해야 합니다.','warn');return;}
  var r=await SB.processApproval(approvalId,'rejected',comment); if(!r.ok)return;
  Toast.show('반려 처리되었습니다.','ok'); Pages.doc_approval();
},

/* ══════════════════════════════════════════════════
   D4: 개정 이력 타임라인 [v2.399]
   ══════════════════════════════════════════════════ */
/* [v2.399] 개정이력: 사이드바·탭 클릭 시 문서 목록으로 이동 + 안내 */
doc_history_home:async function(){
  await Pages.docs();
  /* 문서 목록 로드 완료 후 상단에 안내 배너 삽입 */
  var w=document.getElementById('pw');
  if(!w)return;
  var banner=document.createElement('div');
  banner.style.cssText='background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:8px';
  banner.innerHTML='<span style="font-size:16px">🕐</span><span>개정 이력을 보려면 아래 목록에서 <b>문서번호 또는 제목</b>을 클릭하세요.</span>';
  /* stat-dash 다음에 삽입 */
  var ph=w.querySelector('.ph');
  if(ph) ph.insertAdjacentElement('beforebegin', banner);
  else w.insertBefore(banner, w.firstChild);
},
async doc_history(docId){
  if(!docId){Nav.go('docs');return;}
  var w=document.getElementById('pw');
  w.innerHTML=
    '<div class="ph"><div>'+
      '<button class="btn bout bsm" onclick="Nav.go(\'docs\')" style="margin-right:8px">← 목록으로</button>'+
      '<div class="ptit" id="vHistTitle">📋 개정 이력</div>'+
    '</div><div class="pac" id="vHistActions"></div></div>'+
    '<div id="vDocInfo" style="background:var(--bg2);border:1px solid var(--brd);border-radius:10px;padding:14px 18px;margin-bottom:18px"></div>'+
    '<div id="vTimeline"><div class="es"><div class="es-icon">⏳</div><div>이력 조회 중...</div></div></div>';
  try{
    var res=await Promise.all([SB.getDocMasterById(docId),SB.getDocVersions(docId)]);
    var doc=res[0]; var vers=res[1];
    if(!doc){
      document.getElementById('vTimeline').innerHTML='<div class="es"><div class="es-icon">⚠️</div><div>문서를 찾을 수 없습니다.</div></div>';
      return;
    }
    document.getElementById('vHistTitle').textContent='📋 '+doc.doc_no+' — '+doc.title;
    document.getElementById('vHistActions').innerHTML=
      '<button class="btn bout bsm" onclick="Pages._docRevForm('+docId+')">✏️ 개정 기안</button>'+
      '<button class="btn bout bsm" onclick="Pages._docHistExcel('+docId+')">📥 이력 출력</button>';
    /* [v2.399] 문서 정보 배너 — 깔끔한 카드 그리드 UI */
    var filesBtnHtml=FM.btn('doc-'+docId);
    /* [v2.397.2 UI개선] 개정이력 문서 정보 배너 */
    document.getElementById('vDocInfo').innerHTML=
      /* 헤더: 그라디언트 배경 + 문서번호/제목/유형/버전 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;overflow:hidden">'+
        '<div style="background:linear-gradient(135deg,#1a5fa8 0%,#2563eb 100%);padding:14px 18px;color:#fff">'+
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
            '<span style="font-family:monospace;font-size:12px;font-weight:700;background:rgba(255,255,255,.22);padding:3px 10px;border-radius:6px">'+H.e(doc.doc_no||'-')+'</span>'+
            '<span style="font-size:15px;font-weight:700">'+H.e(doc.title||'-')+'</span>'+
            '<span style="margin-left:auto;display:flex;gap:6px;align-items:center">'+
              '<span style="background:rgba(255,255,255,.22);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px">'+(Pages._DT[doc.doc_type]||doc.doc_type||'-')+'</span>'+
              '<span style="background:rgba(255,255,255,.22);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px">'+H.e(doc.current_ver||'-')+'</span>'+
            '</span>'+
          '</div>'+
        '</div>'+
        /* 하단: 메타 그리드 */
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));">'+
          [['📌 상태',Pages._dBadge(doc.status)],
           ['🏢 담당부서',H.e(doc.dept||'-')],
           ['📅 다음 검토일',H.e(doc.next_review_at||'-')+' '+Pages._dDay(doc.next_review_at)],
           ['📎 첨부 파일',filesBtnHtml],
          ].map(function(x){
            return'<div style="padding:12px 16px;border-right:1px solid var(--brd);border-top:1px solid var(--brd)">'+
              '<div style="font-size:10px;color:var(--muted);font-weight:600;letter-spacing:.03em;margin-bottom:4px">'+x[0]+'</div>'+
              '<div style="font-size:13px;font-weight:500">'+x[1]+'</div>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>';
    var tl=document.getElementById('vTimeline');
    if(!vers.length){
      tl.innerHTML='<div class="es"><div class="es-icon">📭</div><div>버전 이력이 없습니다.</div></div>';
      return;
    }
    tl.innerHTML='<div style="font-size:12px;color:var(--muted);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--brd)">총 <b>'+vers.length+'</b>개 버전</div><div>'+
      vers.map(function(v,i){
        var isLatest=i===0; var isObs=v.status==='obsolete';
        var dotBg=isLatest?'#d1fae5':isObs?'#f1f5f9':'#ede9fe';
        var dotClr=isLatest?'#059669':isObs?'#94a3b8':'#7c3aed';
        var apDate=v.approved_at?new Date(v.approved_at).toLocaleDateString('ko-KR'):'';
        var safeFile=v.file_url?(H.e(v.file_name||v.ver_no).replace(/'/g,'&#39;')):'';
        return'<div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--brd);opacity:'+(isObs?'.65':'1')+'">'+
          '<div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:'+dotBg+';color:'+dotClr+';display:flex;align-items:center;justify-content:center;font-size:14px;margin-top:2px">'+(isLatest?'⭐':'🕐')+'</div>'+
          '<div style="flex:1">'+
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">'+
              '<span style="background:'+(isLatest?'#dcfce7':'#ede9fe')+';color:'+(isLatest?'#166534':'#5b21b6')+';font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px">'+H.e(v.ver_no)+'</span>'+
              Pages._dBadge(v.status)+
              (isLatest?'<span class="badge bblu" style="font-size:10px">최신</span>':'')+
              (isObs?'<span style="font-size:11px;color:#94a3b8">🔒 폐기</span>':'')+
              '<span style="font-size:11px;color:var(--muted);margin-left:auto">'+new Date(v.created_at).toLocaleDateString('ko-KR')+'</span>'+
            '</div>'+
            '<div style="font-size:13px;margin-bottom:6px">'+H.e(v.change_summary||'(개정 사유 없음)')+'</div>'+
            '<div style="display:flex;gap:12px;font-size:11px;color:var(--muted);flex-wrap:wrap;margin-bottom:8px">'+
              (v.creator?'<span>기안: '+H.e(v.creator.name||'-')+'</span>':'')+
              (v.approver?'<span>승인: '+H.e(v.approver.name||'-')+'</span>':'')+
              (apDate?'<span>승인일: '+apDate+'</span>':'')+
            '</div>'+
            '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
              (v.file_url?'<button class="btn bout bxs" onclick="Pages._docDownload('+docId+','+v.id+',\''+v.file_url+'\',\''+safeFile+'\')">📥 파일 다운로드</button>':'')+
              '<button class="btn bout bxs" onclick="Pages._showApprovals('+v.id+')">📋 결재 현황</button>'+
            '</div>'+
          '</div></div>';
      }).join('')+'</div>';
  }catch(e){
    document.getElementById('vTimeline').innerHTML='<div class="es"><div class="es-icon">⚠️</div><div>'+H.e(e.message)+'</div></div>';
  }
},
_docDownload:async function(docId,verId,fileUrl,fileName){
  await SB.addDistLog({doc_id:docId,doc_ver_id:verId,action:'download'});
  var a=document.createElement('a'); a.href=fileUrl; a.download=fileName; a.target='_blank'; a.click();
},
_showApprovals:async function(verId){
  var list=[]; try{list=await SB.getDocApprovals(verId);}catch(e){}
  var sL={reviewer:'🔍 검토',approver:'🔏 최종 결재'};
  var aC={pending:'bamb',approved:'bgrn',rejected:'bred'};
  var aT={pending:'대기',approved:'승인',rejected:'반려'};
  var body=list.length
    ?'<div style="display:flex;flex-direction:column;gap:8px">'+
      list.map(function(a){
        return'<div style="display:flex;gap:10px;background:var(--bg2);border-radius:8px;padding:10px 12px">'+
          '<div style="width:26px;height:26px;border-radius:50%;background:var(--card);border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">'+(a.step_order===99?'최종':a.step_order)+'</div>'+
          '<div style="flex:1">'+
            '<div style="display:flex;align-items:center;gap:6px;font-size:13px;margin-bottom:3px;flex-wrap:wrap">'+
              '<span style="font-size:11px;background:var(--card);border-radius:3px;padding:1px 5px;color:var(--muted)">'+(sL[a.step_type]||a.step_type)+'</span>'+
              '<span>'+H.e(a.approver?a.approver.name:'-')+'</span>'+
              '<span class="badge '+(aC[a.action]||'bgry')+'" style="font-size:10px">'+(aT[a.action]||a.action)+'</span>'+
            '</div>'+
            (a.comment?'<div style="font-size:12px;color:var(--muted);font-style:italic">"'+H.e(a.comment)+'"</div>':'')+
            (a.signed_at?'<div style="font-size:11px;color:var(--muted)">'+new Date(a.signed_at).toLocaleString('ko-KR')+'</div>':'')+
          '</div></div>';
      }).join('')+'</div>'
    :'<div style="padding:30px;text-align:center;color:var(--muted)"><div style="font-size:28px">📋</div><div>등록된 결재 정보가 없습니다.</div></div>';
  Modal.open({title:'결재 현황',size:'sm',body:body,
    foot:'<button class="btn bpri" onclick="Modal.close()">닫기</button>'});
},
_docHistExcel:async function(docId){
  try{
    var res=await Promise.all([SB.getDocMasterById(docId),SB.getDocVersions(docId)]);
    var doc=res[0]; var vers=res[1];
    var hdrs=['버전','상태','개정 사유','기안자','승인자','승인일','파일명'];
    var data=vers.map(function(v){return[v.ver_no,Pages._DS[v.status]||v.status,v.change_summary||'',v.creator?v.creator.name:'',v.approver?v.approver.name:'',v.approved_at?new Date(v.approved_at).toLocaleDateString('ko-KR'):'',v.file_name||''];});
    if(typeof downloadExcel==='function') downloadExcel((doc?doc.doc_no:'doc')+'_개정이력',hdrs,data);
  }catch(e){Toast.show('이력 출력 실패: '+e.message,'err');}
},

/* ══════════════════════════════════════════════════
   지식 검색 허브 [v2.399]
   ══════════════════════════════════════════════════ */
async doc_search(){
  var w=document.getElementById('pw');
  w.innerHTML=
    '<div class="ph"><div><div class="ptit">🔍 지식 검색 허브</div>'+
    '<div style="font-size:12px;color:var(--muted)">문서번호 · 제목 · 태그 통합 실시간 검색</div></div></div>'+
    '<div style="margin-bottom:16px"><input type="text" id="dsKw" style="width:100%;padding:12px 16px;border:2px solid var(--brd);border-radius:10px;font-size:15px;background:var(--bg);color:var(--text);box-sizing:border-box" placeholder="🔍 문서 제목, 번호, 태그를 입력하세요..." oninput="Pages._dsSearch(this.value)" autofocus></div>'+
    '<div id="dsResult"><div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:36px">🔍</div><div>검색어를 입력하면 바로 결과가 표시됩니다.</div></div></div>';
  if(!window._docRows||!window._docRows.length) window._docRows=await SB.getDocMaster();
},
_dsSearch:function(kw){
  var el=document.getElementById('dsResult');
  if(!kw||kw.length<1){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:36px">🔍</div><div>검색어를 입력하세요.</div></div>';return;}
  var rows=(window._docRows||[]).filter(function(r){
    return (r.title||'').toLowerCase().includes(kw.toLowerCase())||
           (r.doc_no||'').toLowerCase().includes(kw.toLowerCase())||
           (r.tags||[]).some(function(t){return t.toLowerCase().includes(kw.toLowerCase());});
  });
  if(!rows.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:32px">📭</div><div>\''+H.e(kw)+'\' 검색 결과가 없습니다.</div></div>';return;}
  var html='<div style="font-size:12px;color:var(--muted);margin-bottom:10px">\'<b>'+H.e(kw)+'</b>\' 검색 결과 <b>'+rows.length+'</b>건</div><div style="display:flex;flex-direction:column;gap:8px">';
  rows.forEach(function(r){
    html+='<div style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:14px 16px;cursor:pointer" onclick="Pages.doc_history('+r.id+')" onmouseover="this.style.borderColor=\'#93c5fd\';this.style.background=\'#eff6ff\'" onmouseout="this.style.borderColor=\'var(--brd)\';this.style.background=\'var(--card)\'">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">'+
        '<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
        '<span style="font-weight:600;font-size:14px">'+H.e(r.title)+'</span>'+
        Pages._dBadge(r.status)+
        '<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px">'+H.e(r.current_ver||'-')+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
        (r.tags||[]).map(function(t){return'<span style="background:#f1f5f9;color:#475569;font-size:11px;padding:1px 6px;border-radius:3px">'+H.e(t)+'</span>';}).join('')+
      '</div></div>';
  });
  el.innerHTML=html+'</div>';
},


/* ══════════════════════════════════════════════════
   D5: 배포 관리 [v2.397.2 Phase 2]
   ══════════════════════════════════════════════════ */
async doc_distribution(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  var docs=[];var summary={byAction:{},byDoc:[],total:0};
  try{docs=await SB.getDocMaster();summary=await SB.getDistLogSummary();}catch(e){}
  var ba=summary.byAction||{};var totalCnt=summary.total||0;
  w.innerHTML=
    '<div class="stat-dash">'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._distFilter(\'all\')">'+
      '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📊</div>'+
      '<div><div class="sd-val">'+totalCnt+'</div><div class="sd-lbl">전체(30일)</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._distFilter(\'download\')">'+
      '<div class="sd-icon" style="background:#d1fae5;color:#059669">⬇️</div>'+
      '<div><div class="sd-val">'+(ba.download||0)+'</div><div class="sd-lbl">다운로드</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._distFilter(\'view\')">'+
      '<div class="sd-icon" style="background:#ede9fe;color:#7c3aed">👁️</div>'+
      '<div><div class="sd-val">'+(ba.view||0)+'</div><div class="sd-lbl">열람</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._distFilter(\'share\')">'+
      '<div class="sd-icon" style="background:#fef3c7;color:#d97706">🔗</div>'+
      '<div><div class="sd-val">'+(ba.share||0)+'</div><div class="sd-lbl">외부공유</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">📤 배포 관리</div>'+
      '<div style="font-size:12px;color:var(--muted)">열람·다운로드·공유 이력 (최근 30일)</div>'+
    '</div></div>'+
    '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">'+
      '<div style="flex:1;min-width:200px">'+
        '<div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px">문서 선택</div>'+
        '<select class="fsel" id="distDocSel" style="width:100%;padding:8px 10px" onchange="Pages._distLoadLog(this.value)">'+
          '<option value="">— 전체 문서 이력 —</option>'+
          docs.map(function(d){return'<option value="'+d.id+'">'+H.e(d.doc_no)+' '+H.e(d.title)+'</option>';}).join('')+
        '</select>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px">외부 공유 링크</div>'+
        '<div style="display:flex;gap:6px">'+
          '<select class="fsel" id="distShareHours" style="width:110px">'+
            '<option value="24">24시간</option><option value="72" selected>72시간</option>'+
            '<option value="168">7일</option><option value="720">30일</option>'+
          '</select>'+
          '<button class="btn bpri bsm" onclick="Pages._distCreateShare()">🔗 링크 발급</button>'+
        '</div>'+
      '</div>'+
      '<button class="btn bout bsm" onclick="Pages._distExcel()">📥 이력 출력</button>'+
    '</div>'+
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="distKw" placeholder="문서번호, 이름, 부서..." oninput="Pages._distKwFilter(this.value)"></div>'+
      '<select class="fsel" id="distActionF" onchange="Pages._distActionFilter(this.value)">'+
        '<option value="">전체 액션</option><option value="view">열람</option>'+
        '<option value="download">다운로드</option><option value="share">외부공유</option>'+
      '</select>'+
    '</div>'+
    '<div id="distTbl"></div>'+
    '<div style="margin-top:20px">'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--muted)">📈 최근 30일 인기 문서 TOP 10</div>'+
      '<div style="border:1px solid var(--brd);border-radius:8px;overflow:hidden">'+
        (summary.byDoc&&summary.byDoc.length
          ?'<table style="width:100%;border-collapse:collapse;font-size:12px">'+
            '<thead><tr style="background:var(--bg2)"><th style="padding:8px 12px;width:36px">순위</th>'+
            '<th style="padding:8px 12px;width:120px">문서번호</th><th style="padding:8px 12px">제목</th>'+
            '<th style="padding:8px 12px;text-align:right;width:60px">이용수</th></tr></thead><tbody>'+
            summary.byDoc.map(function(d,i){
              return'<tr style="border-bottom:1px solid var(--brd)">'+
                '<td style="padding:7px 12px;text-align:center;font-weight:700;color:'+(i<3?'#f59e0b':'var(--muted)')+'">'+
                  (i<3?['🥇','🥈','🥉'][i]:i+1)+'</td>'+
                '<td style="padding:7px 12px;font-family:monospace;font-size:11px;color:#1a5fa8">'+H.e(d.doc_no)+'</td>'+
                '<td style="padding:7px 12px">'+H.e(d.title)+'</td>'+
                '<td style="padding:7px 12px;text-align:right;font-weight:700">'+d.count+'</td></tr>';
            }).join('')+'</tbody></table>'
          :'<div style="padding:24px;text-align:center;color:var(--muted)">아직 배포 이력이 없습니다.</div>')+
      '</div>'+
    '</div>';
  window._distRows=[];window._distActionF='';window._distKw='';
  Pages._distLoadLog('');
},
_distLoadLog:async function(docId){
  var rows=[];
  try{
    if(docId){rows=await SB.getDocDistLog(Number(docId),'all',200);}
    else if(_sb){
      var res=await _sb.from('doc_dist_log')
        .select('*, user:user_id(id,name,dept), doc:doc_id(doc_no,title)')
        .order('created_at',{ascending:false}).limit(100);
      rows=res.data||[];
    }
  }catch(e){}
  window._distRows=rows;Pages._distRender(rows);
},
_distRender:function(rows){
  var lb={view:'👁️ 열람',download:'⬇️ 다운로드',share:'🔗 공유',distribute:'📤 배포',revision_submit:'📝 기안',print:'🖨️ 인쇄'};
  var cls={view:'bblu',download:'bgrn',share:'bamb',distribute:'bpri',revision_submit:'bgry'};
  var data=(rows||[]).map(function(r){
    return{id:r.id,
      created_at:r.created_at?new Date(r.created_at).toLocaleString('ko-KR'):'',
      doc_no:r.doc&&r.doc.doc_no||'-',
      doc_title:r.doc&&r.doc.title||'-',
      action:r.action||'-',
      user_name:r.user&&r.user.name||'외부',
      dept:r.user&&r.user.dept||r.dept||'-',
      share_token:r.share_token||'',
      expires_at:r.expires_at?new Date(r.expires_at).toLocaleString('ko-KR'):'',
    };
  });
  Tbl.render({el:'#distTbl',cols:[
    {key:'created_at',  label:'일시',       w:'140px'},
    {key:'doc_no',      label:'문서번호',   w:'120px',render:function(v){return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8">'+H.e(v)+'</span>';}},
    {key:'doc_title',   label:'문서 제목'},
    {key:'action',      label:'액션',       w:'100px',align:'center',render:function(v){return'<span class="badge '+(cls[v]||'bgry')+'" style="font-size:10px">'+(lb[v]||H.e(v))+'</span>';}},
    {key:'user_name',   label:'사용자',     w:'80px'},
    {key:'dept',        label:'부서',       w:'70px'},
    {key:'share_token', label:'공유토큰',   w:'100px',render:function(v){return v?'<span style="font-family:monospace;font-size:10px;color:var(--muted)">'+H.e(v.slice(0,8))+'...</span>':'-';}},
    {key:'expires_at',  label:'만료일',     w:'120px',render:function(v){return v?'<span style="font-size:11px">'+H.e(v)+'</span>':'-';}},
  ],data:data});
},
_distFilter:function(action){window._distActionF=action;var s=document.getElementById('distActionF');if(s)s.value=action==='all'?'':action;Pages._distApplyFilter();},
_distActionFilter:function(v){window._distActionF=v;Pages._distApplyFilter();},
_distKwFilter:function(v){window._distKw=v;Pages._distApplyFilter();},
_distApplyFilter:function(){
  var rows=window._distRows||[];
  var af=window._distActionF||'';var kw=(window._distKw||'').toLowerCase();
  if(af&&af!=='all')rows=rows.filter(function(r){return r.action===af;});
  if(kw)rows=rows.filter(function(r){
    return (r.doc&&r.doc.doc_no||'').toLowerCase().includes(kw)||
           (r.doc&&r.doc.title||'').toLowerCase().includes(kw)||
           (r.user&&r.user.name||'').toLowerCase().includes(kw)||
           (r.user&&r.user.dept||r.dept||'').toLowerCase().includes(kw);
  });
  Pages._distRender(rows);
},
_distCreateShare:async function(){
  var docId=document.getElementById('distDocSel')?.value;
  if(!docId){Toast.show('공유할 문서를 먼저 선택하세요.','warn');return;}
  var hours=parseInt(document.getElementById('distShareHours')?.value||'72');
  var doc=(window._docRows||[]).find(function(d){return String(d.id)===String(docId);});
  var r=await SB.createShareToken(Number(docId),null,hours);
  if(!r.ok){Toast.show('링크 발급에 실패했습니다.','err');return;}
  var expireStr=new Date(r.expiresAt).toLocaleString('ko-KR');
  Modal.open({title:'🔗 외부 공유 링크 발급 완료',size:'sm',
    body:'<div style="text-align:center;padding:8px 0">'+
      '<div style="font-size:13px;color:var(--muted);margin-bottom:12px">'+(doc?'<b>'+H.e(doc.doc_no)+' '+H.e(doc.title)+'</b><br>':'')+'</div>'+
      '<div style="background:var(--bg2);border:1px solid var(--brd);border-radius:8px;padding:12px;margin-bottom:12px">'+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">공유 토큰</div>'+
        '<div style="font-family:monospace;font-size:13px;font-weight:700;word-break:break-all">'+H.e(r.token)+'</div>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--muted)">⏰ 만료: <b>'+expireStr+'</b> ('+hours+'시간 후)</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:8px">※ 토큰을 복사하여 외부 수신자에게 전달하세요.</div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
         '<button class="btn bpri" onclick="navigator.clipboard&&navigator.clipboard.writeText(\''+r.token+'\').then(function(){Toast.show(\'복사되었습니다.\',\'ok\');})">📋 토큰 복사</button>',
  });
  Pages._distLoadLog(docId);
},
_distExcel:function(){
  var rows=window._distRows||[];
  if(!rows.length){Toast.show('출력할 이력이 없습니다.','warn');return;}
  var hdrs=['일시','문서번호','제목','액션','사용자','부서','공유토큰','만료일'];
  var data=rows.map(function(r){return[
    r.created_at?new Date(r.created_at).toLocaleString('ko-KR'):'',
    r.doc&&r.doc.doc_no||'-',r.doc&&r.doc.title||'-',r.action||'-',
    r.user&&r.user.name||'외부',r.user&&r.user.dept||r.dept||'-',
    r.share_token||'',r.expires_at?new Date(r.expires_at).toLocaleString('ko-KR'):'',
  ];});
  if(typeof downloadExcel==='function') downloadExcel('배포이력',hdrs,data);
  else Toast.show('엑셀 기능을 찾을 수 없습니다.','warn');
},

/* ══════════════════════════════════════════════════
   D6: 검토 주기 관리 [v2.397.2 Phase 2]
   ══════════════════════════════════════════════════ */
async doc_review_cycle(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  var rows=[];
  try{rows=await SB.getDocMaster();}catch(e){}
  var today=new Date();
  var expired=[],d7=[],d30=[];
  rows.forEach(function(r){
    if(!r.next_review_at||r.status!=='active')return;
    var d=Math.ceil((new Date(r.next_review_at)-today)/86400000);
    if(d<0)expired.push(r);else if(d<=7)d7.push(r);else if(d<=30)d30.push(r);
  });
  w.innerHTML=
    '<div class="stat-dash">'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'expired\')">'+
      '<div class="sd-icon" style="background:#fee2e2;color:#dc2626">🚨</div>'+
      '<div><div class="sd-val">'+expired.length+'</div><div class="sd-lbl">만료됨</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'d7\')">'+
      '<div class="sd-icon" style="background:#fef3c7;color:#d97706">⚠️</div>'+
      '<div><div class="sd-val">'+d7.length+'</div><div class="sd-lbl">D-7 이내</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'d30\')">'+
      '<div class="sd-icon" style="background:#fef9c3;color:#ca8a04">📅</div>'+
      '<div><div class="sd-val">'+d30.length+'</div><div class="sd-lbl">D-30 이내</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'all\')">'+
      '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>'+
      '<div><div class="sd-val">'+rows.filter(function(r){return r.status==="active";}).length+'</div><div class="sd-lbl">전체 유효</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">🔔 검토 주기 관리</div>'+
      '<div style="font-size:12px;color:var(--muted)">만료 임박 문서 현황 및 검토 주기 설정</div>'+
    '</div><div class="pac">'+
      '<button class="btn bred bsm" onclick="Pages._rcSendAlert(7)">🚨 D-7 긴급알림</button>'+
      '<button class="btn bamb bsm" onclick="Pages._rcSendAlert(30)">🔔 D-30 알림발송</button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="rcKw" placeholder="문서번호, 제목, 부서..." oninput="Pages._rcKwFilter(this.value)"></div>'+
      '<select class="fsel" id="rcCycleF" onchange="Pages._rcCycleFilter(this.value)">'+
        '<option value="">전체 주기</option><option value="monthly">매월</option>'+
        '<option value="quarterly">분기</option><option value="biannual">반기</option><option value="annual">연간</option>'+
      '</select>'+
      '<button class="btn bout bsm" onclick="Pages._rcBulkChange()">⚙️ 일괄 주기 변경</button>'+
    '</div>'+
    '<div id="rcTbl"></div>';
  window._rcAllRows=rows;window._rcFilter_val='all';window._rcKw='';window._rcCycle='';
  Pages._rcRender(rows.filter(function(r){return r.status==='active';}));
},
_rcFilter:function(f){window._rcFilter_val=f;Pages._rcApplyFilter();},
_rcKwFilter:function(v){window._rcKw=v;Pages._rcApplyFilter();},
_rcCycleFilter:function(v){window._rcCycle=v;Pages._rcApplyFilter();},
_rcApplyFilter:function(){
  var rows=(window._rcAllRows||[]).filter(function(r){return r.status==='active';});
  var today=new Date();var f=window._rcFilter_val||'all';
  if(f==='expired')rows=rows.filter(function(r){return r.next_review_at&&Math.ceil((new Date(r.next_review_at)-today)/86400000)<0;});
  else if(f==='d7') rows=rows.filter(function(r){var d=r.next_review_at&&Math.ceil((new Date(r.next_review_at)-today)/86400000);return d>=0&&d<=7;});
  else if(f==='d30')rows=rows.filter(function(r){var d=r.next_review_at&&Math.ceil((new Date(r.next_review_at)-today)/86400000);return d>=0&&d<=30;});
  var kw=(window._rcKw||'').toLowerCase();var cy=window._rcCycle||'';
  if(kw)rows=rows.filter(function(r){return(r.title||'').toLowerCase().includes(kw)||(r.doc_no||'').toLowerCase().includes(kw)||(r.dept||'').toLowerCase().includes(kw);});
  if(cy)rows=rows.filter(function(r){return r.review_cycle===cy;});
  Pages._rcRender(rows);
},
_rcRender:function(rows){
  var cycleOpts=function(cur){return['monthly','quarterly','biannual','annual'].map(function(k){return'<option value="'+k+'"'+(cur===k?' selected':'')+'>'+{monthly:'매월',quarterly:'분기',biannual:'반기',annual:'연간'}[k]+'</option>';}).join('');};
  Tbl.render({el:'#rcTbl',cols:[
    {key:'doc_no',        label:'문서번호',   w:'120px',render:function(v,row){return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';}},
    {key:'title',         label:'제목',       render:function(v,row){return'<span style="font-weight:500;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';}},
    {key:'review_cycle',  label:'검토 주기',  w:'100px',align:'center',
      render:function(v,row){return'<select class="fsel" style="font-size:11px;padding:2px 4px" onchange="Pages._rcUpdateCycle('+row.id+',this.value)">'+cycleOpts(v)+'</select>';}},
    {key:'next_review_at',label:'다음 검토일',w:'140px',
      render:function(v,row){return'<input type="date" style="font-size:11px;padding:2px 6px;border:1px solid var(--brd);border-radius:4px;background:var(--bg)" value="'+H.e(v||'')+'" onchange="Pages._rcUpdateDate('+row.id+',this.value)">';}},
    {key:'next_review_at',label:'D-day',      w:'80px',align:'center',render:function(v){return Pages._dDay(v)||'<span style="font-size:11px;color:var(--muted)">-</span>';}},
    {key:'dept',          label:'부서',       w:'70px',align:'center'},
    {key:'id',            label:'검토완료',   w:'80px',align:'center',
      render:function(v,row){return'<button class="btn bgrn bxs" onclick="Pages._rcComplete('+v+',\''+H.e(row.review_cycle||'annual')+'\')" title="완료처리-다음주기자동계산">✅ 완료</button>';}},
  ],data:rows,onDel:null});
},
_rcUpdateCycle:async function(docId,cycle){
  var r=await SB.bulkUpdateReviewCycle([docId],cycle);
  if(r.ok){var row=(window._rcAllRows||[]).find(function(x){return x.id===docId;});if(row)row.review_cycle=cycle;Toast.show('검토 주기 변경됨','ok');}
},
_rcUpdateDate:async function(docId,date){
  if(!date)return;
  var r=await SB.updateNextReviewDate(docId,date);
  if(r.ok){var row=(window._rcAllRows||[]).find(function(x){return x.id===docId;});if(row)row.next_review_at=date;Toast.show('검토일 변경됨','ok');Pages._rcApplyFilter();}
},
_rcComplete:async function(docId,cycle){
  var r=await SB.completeReview(docId,cycle);
  if(r.ok){var row=(window._rcAllRows||[]).find(function(x){return x.id===docId;});if(row)row.next_review_at=r.nextDate;Toast.show('검토 완료! 다음 검토일: '+r.nextDate,'ok',3000);Pages._rcApplyFilter();}
},
_rcBulkChange:function(){
  var ids=Tbl.getSel();
  if(!ids.length){Toast.show('변경할 문서를 선택하세요.','warn');return;}
  Modal.open({title:'⚙️ 일괄 검토 주기 변경',size:'sm',
    body:'<div style="margin-bottom:12px"><div style="font-size:13px;margin-bottom:10px">선택된 <b>'+ids.length+'건</b> 검토 주기 변경</div>'+
      '<select class="fc" id="bulkCycleVal"><option value="monthly">매월</option><option value="quarterly">분기</option>'+
      '<option value="biannual">반기</option><option value="annual" selected>연간</option></select></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._rcBulkSave('+JSON.stringify(ids)+')">변경</button>',
  });
},
_rcBulkSave:async function(ids){
  var cycle=document.getElementById('bulkCycleVal')?.value||'annual';
  var r=await SB.bulkUpdateReviewCycle(ids,cycle);
  if(r.ok){ids.forEach(function(id){var row=(window._rcAllRows||[]).find(function(x){return Number(x.id)===Number(id);});if(row)row.review_cycle=cycle;});Toast.show(r.updated+'건 변경 완료','ok');Modal.close();Pages._rcApplyFilter();}
},
_rcSendAlert:async function(days){
  var btn=event&&event.target;if(btn){btn.disabled=true;btn.textContent='발송 중...';}
  try{
    var r=await SB.sendReviewAlerts(days);
    if(r.ok){if(r.sent>0)Toast.show('📬 알림 '+r.sent+'건 발송 완료!','ok',4000);else Toast.show('발송 대상 없음 (담당자 미지정 문서 제외)','warn',3000);}
  }finally{if(btn){btn.disabled=false;btn.textContent=days===7?'🚨 D-7 긴급알림':'🔔 D-30 알림발송';}}
},
/* ══════════════════════════════════════════════════
   D7: 연관 문서 추천 [v2.399 Phase 3]
   동일 태그 기반 연관 문서 패널 + 유사 문서 추천
   ══════════════════════════════════════════════════ */

/**
 * [v2.399] D7: 연관 문서 추천 페이지
 * [UI 구성]
 *  ① 문서 선택 → 해당 문서의 태그 표시
 *  ② 동일 태그를 가진 연관 문서 목록 (태그 일치도순 정렬)
 *  ③ 문서 유형별 추천 그룹
 *  ④ 전체 태그 클라우드 (태그 클릭 → 해당 태그 문서 표시)
 */
async doc_recommend(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';

  var rows=[];
  try{ rows=await SB.getDocMaster(); }catch(e){}

  /* 태그 빈도 집계 */
  var tagMap={};
  rows.forEach(function(r){
    (r.tags||[]).forEach(function(t){
      tagMap[t]=(tagMap[t]||0)+1;
    });
  });
  var tagList=Object.entries(tagMap).sort(function(a,b){return b[1]-a[1];});

  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">💡 연관 문서 추천</div>'+
      '<div style="font-size:12px;color:var(--muted)">태그 기반 연관 문서 탐색 · 유사 문서 추천</div>'+
    '</div></div>'+

    /* ① 문서 선택 */
    '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:16px 18px;margin-bottom:16px">'+
      '<div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px">📄 기준 문서 선택</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
        '<select class="fsel" id="rcDocSel" style="flex:1;min-width:220px;padding:9px 12px" onchange="Pages._rcLoadRecommend(this.value)">'+
          '<option value="">— 문서를 선택하세요 —</option>'+
          rows.filter(function(r){return r.status==='active';}).map(function(r){
            return'<option value="'+r.id+'">'+H.e(r.doc_no)+' '+H.e(r.title)+'</option>';
          }).join('')+
        '</select>'+
        '<div id="rcTagBadges" style="display:flex;gap:4px;flex-wrap:wrap"></div>'+
      '</div>'+
    '</div>'+

    /* ② 연관 문서 결과 */
    '<div id="rcResult">'+
      '<div style="text-align:center;padding:32px;color:var(--muted)">'+
        '<div style="font-size:32px;margin-bottom:8px">💡</div>'+
        '<div>위에서 기준 문서를 선택하면<br>연관 문서를 추천해 드립니다.</div>'+
      '</div>'+
    '</div>'+

    /* ③ 태그 클라우드 */
    '<div style="margin-top:20px">'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--muted)">🏷️ 전체 태그 현황 <span style="font-size:11px;font-weight:400">(클릭 시 해당 태그 문서 표시)</span></div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px">'+
        tagList.map(function(e){
          var t=e[0], cnt=e[1];
          /* 빈도에 따라 폰트 크기 조절 */
          var maxCnt=tagList[0]?tagList[0][1]:1;
          var sz=Math.round(10+((cnt/maxCnt)*6));
          return'<button style="background:var(--bg2);border:1px solid var(--brd);border-radius:999px;padding:4px 10px;font-size:'+sz+'px;cursor:pointer;color:var(--text);transition:all .15s" '+
            'onclick="Pages._rcTagFilter(\''+H.e(t).replace(/'/g,"\\'")+'\')" '+
            'onmouseover="this.style.background=\'#eff6ff\';this.style.borderColor=\'#93c5fd\'" '+
            'onmouseout="this.style.background=\'var(--bg2)\';this.style.borderColor=\'var(--brd)\'">'+
            H.e(t)+' <span style="font-size:10px;color:var(--muted)">'+cnt+'</span>'+
          '</button>';
        }).join('')+
        (!tagList.length?'<div style="color:var(--muted);font-size:13px">등록된 태그가 없습니다.</div>':'')+
      '</div>'+
    '</div>';

  window._rcDocRows=rows;
},

/* 선택 문서 기준 연관 문서 로드 */
_rcLoadRecommend:function(docId){
  if(!docId){
    document.getElementById('rcTagBadges').innerHTML='';
    document.getElementById('rcResult').innerHTML=
      '<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px">💡</div><div>문서를 선택해 주세요.</div></div>';
    return;
  }
  var rows=window._rcDocRows||[];
  var base=rows.find(function(r){return String(r.id)===String(docId);});
  if(!base) return;
  var baseTags=base.tags||[];

  /* 기준 문서 태그 배지 표시 */
  var badgesEl=document.getElementById('rcTagBadges');
  if(badgesEl){
    badgesEl.innerHTML=baseTags.length
      ?baseTags.map(function(t){
          return'<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600">'+H.e(t)+'</span>';
        }).join('')
      :'<span style="font-size:12px;color:var(--muted)">태그 없음</span>';
  }

  /* 연관도 계산: 공통 태그 수 기준 */
  var others=rows.filter(function(r){return String(r.id)!==String(docId);});
  var scored=others.map(function(r){
    var rTags=r.tags||[];
    var common=baseTags.filter(function(t){return rTags.includes(t);});
    return{row:r, score:common.length, common:common};
  }).filter(function(x){return x.score>0;})
    .sort(function(a,b){return b.score-a.score;});

  var el=document.getElementById('rcResult');
  if(!scored.length){
    el.innerHTML=
      '<div style="background:var(--bg2);border-radius:10px;padding:24px;text-align:center;color:var(--muted)">'+
        '<div style="font-size:28px;margin-bottom:8px">📭</div>'+
        '<div>연관 문서가 없습니다.<br><span style="font-size:12px">태그를 추가하면 더 많은 문서를 추천받을 수 있습니다.</span></div>'+
      '</div>';
    return;
  }

  /* 결과 렌더 */
  el.innerHTML=
    '<div style="font-size:13px;color:var(--muted);margin-bottom:10px">'+
      '<b>'+H.e(base.doc_no)+'</b> 기준 — 연관 문서 <b>'+scored.length+'</b>건'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px">'+
    scored.map(function(x){
      var r=x.row;
      var pct=Math.round((x.score/Math.max(baseTags.length,1))*100);
      /* 연관도 색상 */
      var barClr=pct>=80?'#059669':pct>=50?'#2563eb':'#94a3b8';
      return'<div style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:13px 16px;cursor:pointer;transition:all .15s" '+
        'onclick="Pages.doc_history('+r.id+')" '+
        'onmouseover="this.style.borderColor=\'#93c5fd\';this.style.background=\'#eff6ff\'" '+
        'onmouseout="this.style.borderColor=\'var(--brd)\';this.style.background=\'var(--card)\'">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">'+
          '<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
          '<span style="font-weight:600;font-size:13px;flex:1">'+H.e(r.title||'-')+'</span>'+
          Pages._dBadge(r.status)+
          '<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px">'+H.e(r.current_ver||'-')+'</span>'+
        '</div>'+
        /* 공통 태그 */
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+
          '<span style="font-size:10px;color:var(--muted)">공통 태그:</span>'+
          x.common.map(function(t){
            return'<span style="background:#fef9c3;color:#92400e;border:1px solid #fde68a;font-size:10px;padding:1px 6px;border-radius:3px;font-weight:600">'+H.e(t)+'</span>';
          }).join('')+
        '</div>'+
        /* 연관도 바 */
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:10px;color:var(--muted);width:40px">연관도</span>'+
          '<div style="flex:1;height:5px;background:var(--brd);border-radius:3px;overflow:hidden">'+
            '<div style="height:100%;background:'+barClr+';width:'+pct+'%;border-radius:3px;transition:width .3s"></div>'+
          '</div>'+
          '<span style="font-size:11px;font-weight:700;color:'+barClr+';width:34px;text-align:right">'+pct+'%</span>'+
        '</div>'+
      '</div>';
    }).join('')+
    '</div>';
},

/* 태그 클라우드 클릭 → 해당 태그 문서 목록 표시 */
_rcTagFilter:function(tag){
  var rows=window._rcDocRows||[];
  var filtered=rows.filter(function(r){return(r.tags||[]).includes(tag);});

  /* 선택 해제 */
  var sel=document.getElementById('rcDocSel');
  if(sel) sel.value='';
  var badges=document.getElementById('rcTagBadges');
  if(badges) badges.innerHTML='<span style="background:#fef9c3;color:#92400e;border:1px solid #fde68a;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px">🏷️ '+H.e(tag)+'</span>';

  var el=document.getElementById('rcResult');
  if(!filtered.length){
    el.innerHTML='<div style="padding:32px;text-align:center;color:var(--muted)"><div style="font-size:28px">📭</div><div>\''+H.e(tag)+'\' 태그 문서가 없습니다.</div></div>';
    return;
  }

  el.innerHTML=
    '<div style="font-size:13px;color:var(--muted);margin-bottom:10px">'+
      '🏷️ <b>'+H.e(tag)+'</b> 태그 문서 <b>'+filtered.length+'</b>건'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">'+
    filtered.map(function(r){
      return'<div style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .15s" '+
        'onclick="Pages.doc_history('+r.id+')" '+
        'onmouseover="this.style.borderColor=\'#93c5fd\';this.style.background=\'#eff6ff\'" '+
        'onmouseout="this.style.borderColor=\'var(--brd)\';this.style.background=\'var(--card)\'">'+
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">'+
          '<span style="font-family:monospace;font-size:10px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
          Pages._dBadge(r.status)+
        '</div>'+
        '<div style="font-weight:600;font-size:12px;margin-bottom:6px;line-height:1.4">'+H.e(r.title||'-')+'</div>'+
        '<div style="display:flex;gap:4px;flex-wrap:wrap">'+
          (r.tags||[]).map(function(t){
            var isMatch=(t===tag);
            return'<span style="background:'+(isMatch?'#fef9c3':'#f1f5f9')+';color:'+(isMatch?'#92400e':'#475569')+';border:1px solid '+(isMatch?'#fde68a':'transparent')+';font-size:10px;padding:1px 5px;border-radius:3px;'+(isMatch?'font-weight:600':'')+'\">'+H.e(t)+'</span>';
          }).join('')+
        '</div>'+
      '</div>';
    }).join('')+
    '</div>';
},

/* ══════════════════════════════════════════════════
   D8: 문서 현황 대시보드 [v2.399 Phase 4]
   KPI 카드 · 유형 분포 · 상태 현황 · 심사 준비율 게이지
   ══════════════════════════════════════════════════ */

/**
 * [v2.399] D8: 문서 현황 대시보드
 * [UI 구성]
 *  ① KPI 카드 4종 (전체/유효/검토중/만료임박)
 *  ② 유형별 분포 — 바 차트 (Canvas)
 *  ③ 상태별 현황 — 도넛 차트 (Canvas)
 *  ④ 심사 준비율 게이지
 *  ⑤ 최근 등록/개정 이력 5건
 */
async doc_dashboard(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>대시보드 로딩 중...</div></div>';

  var rows=[];
  try{ rows=await SB.getDocMaster(); }catch(e){}

  /* ── 집계 ── */
  var total=rows.length;
  var byStatus={draft:0,in_review:0,active:0,obsolete:0};
  rows.forEach(function(r){if(byStatus[r.status]!==undefined)byStatus[r.status]++;});

  var byType={};
  rows.forEach(function(r){
    var t=Pages._DT[r.doc_type]||r.doc_type||'기타';
    byType[t]=(byType[t]||0)+1;
  });

  var today=new Date();
  var expiring=rows.filter(function(r){
    if(!r.next_review_at||r.status!=='active')return false;
    var d=Math.ceil((new Date(r.next_review_at)-today)/86400000);
    return d<=30;
  }).length;

  /* 심사 준비율: 유효(active) / 전체 유효+검토중 */
  var readyBase=byStatus.active+byStatus.in_review;
  var readyPct=readyBase>0?Math.round((byStatus.active/readyBase)*100):0;

  /* 최근 등록/개정 5건 (created_at 기준) */
  var recent=rows.slice().sort(function(a,b){
    return new Date(b.created_at||0)-new Date(a.created_at||0);
  }).slice(0,5);

  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">📊 문서 현황 대시보드</div>'+
      '<div style="font-size:12px;color:var(--muted)">ISO 9001 문서화된 정보 관리 현황</div>'+
    '</div><div class="pac">'+
      '<button class="btn bout bsm" onclick="Pages._dashRefresh()">🔄 새로고침</button>'+
    '</div></div>'+

    /* ① KPI 카드 */
    '<div class="stat-dash" style="margin-bottom:20px">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'\',\'all\')">'+
        '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📄</div>'+
        '<div><div class="sd-val">'+total+'</div><div class="sd-lbl">전체 문서</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'active\',\'유효\')">'+
        '<div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+byStatus.active+'</div><div class="sd-lbl">유효(Active)</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'in_review\',\'검토중\')">'+
        '<div class="sd-icon" style="background:#dbeafe;color:#2563eb">🔄</div>'+
        '<div><div class="sd-val">'+byStatus.in_review+'</div><div class="sd-lbl">검토중</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages.doc_review_cycle()">'+
        '<div class="sd-icon" style="background:'+(expiring>0?'#fee2e2':'#f0fdf4')+';color:'+(expiring>0?'#dc2626':'#059669')+'">'+
          (expiring>0?'⚠️':'✅')+
        '</div>'+
        '<div><div class="sd-val" style="color:'+(expiring>0?'#dc2626':'#059669')+'">'+expiring+'</div>'+
        '<div class="sd-lbl">D-30 만료임박</div></div>'+
      '</div>'+
    '</div>'+

    /* ② 차트 영역 */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'+

      /* 유형별 분포 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:16px">'+
        '<div style="font-size:13px;font-weight:600;margin-bottom:12px">📂 유형별 분포</div>'+
        '<div id="dashTypeChart"></div>'+
      '</div>'+

      /* 상태별 현황 + 심사준비율 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:16px">'+
        '<div style="font-size:13px;font-weight:600;margin-bottom:12px">📊 상태별 현황</div>'+
        '<div id="dashStatusChart"></div>'+
        /* 심사 준비율 게이지 */
        '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--brd)">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
            '<span style="font-size:12px;font-weight:600">🏅 심사 준비율</span>'+
            '<span style="font-size:16px;font-weight:500;color:'+(readyPct>=80?'#059669':readyPct>=60?'#d97706':'#dc2626')+'">'+readyPct+'%</span>'+
          '</div>'+
          '<div style="height:10px;background:var(--brd);border-radius:5px;overflow:hidden">'+
            '<div style="height:100%;background:'+(readyPct>=80?'#059669':readyPct>=60?'#f59e0b':'#ef4444')+';width:'+readyPct+'%;border-radius:5px;transition:width .6s ease"></div>'+
          '</div>'+
          '<div style="font-size:11px;color:var(--muted);margin-top:4px">'+
            '유효 '+byStatus.active+'건 / (유효+검토중) '+readyBase+'건 기준'+
          '</div>'+
        '</div>'+
      '</div>'+

    '</div>'+

    /* ③ 최근 등록/개정 */
    '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:16px">'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:12px">🕐 최근 등록/개정 문서</div>'+
      (recent.length
        ?'<table style="width:100%;border-collapse:collapse;font-size:12px">'+
          '<thead><tr style="background:var(--bg2)">'+
            '<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--muted);width:130px">문서번호</th>'+
            '<th style="padding:8px 12px;text-align:left;font-weight:600;color:var(--muted)">제목</th>'+
            '<th style="padding:8px 12px;text-align:center;font-weight:600;color:var(--muted);width:80px">버전</th>'+
            '<th style="padding:8px 12px;text-align:center;font-weight:600;color:var(--muted);width:80px">상태</th>'+
            '<th style="padding:8px 12px;text-align:right;font-weight:600;color:var(--muted);width:120px">등록일</th>'+
          '</tr></thead><tbody>'+
          recent.map(function(r){
            return'<tr style="border-bottom:1px solid var(--brd)" onmouseover="this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'\'">'+
              '<td style="padding:8px 12px"><span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+r.id+')">'+H.e(r.doc_no||'-')+'</span></td>'+
              '<td style="padding:8px 12px;font-weight:500;cursor:pointer" onclick="Pages.doc_history('+r.id+')">'+H.e(r.title||'-')+'</td>'+
              '<td style="padding:8px 12px;text-align:center"><span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px">'+H.e(r.current_ver||'-')+'</span></td>'+
              '<td style="padding:8px 12px;text-align:center">'+Pages._dBadge(r.status)+'</td>'+
              '<td style="padding:8px 12px;text-align:right;font-size:11px;color:var(--muted)">'+
                (r.created_at?new Date(r.created_at).toLocaleDateString('ko-KR'):'-')+
              '</td>'+
            '</tr>';
          }).join('')+
          '</tbody></table>'
        :'<div style="padding:24px;text-align:center;color:var(--muted)">등록된 문서가 없습니다.</div>')+
    '</div>';

  /* 차트 렌더 (약간의 딜레이로 DOM 완성 후 실행) */
  window._dashByType=byType;
  window._dashByStatus=byStatus;
  setTimeout(function(){ Pages._dashRenderCharts(); }, 100);
},

/* 차트 렌더 */
_dashRenderCharts:function(){
  var byType=window._dashByType||{};
  var byStatus=window._dashByStatus||{};

  /* ① 유형별 분포 — 수평 바 차트 (CSS 기반, Chart.js 불필요) */
  var typeEl=document.getElementById('dashTypeChart');
  if(typeEl){
    var entries=Object.entries(byType).sort(function(a,b){return b[1]-a[1];});
    var maxVal=entries.length?entries[0][1]:1;
    var colors=['#2563eb','#059669','#d97706','#7c3aed','#dc2626','#0891b2'];
    typeEl.innerHTML=entries.map(function(e,i){
      var pct=Math.round((e[1]/maxVal)*100);
      return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<div style="width:64px;font-size:11px;color:var(--muted);text-align:right;flex-shrink:0">'+H.e(e[0])+'</div>'+
        '<div style="flex:1;height:18px;background:var(--bg2);border-radius:4px;overflow:hidden">'+
          '<div style="height:100%;background:'+(colors[i%colors.length])+';width:'+pct+'%;border-radius:4px;transition:width .5s ease;display:flex;align-items:center;padding-left:6px">'+
            '<span style="font-size:10px;color:#fff;font-weight:600;white-space:nowrap">'+e[1]+'건</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')||'<div style="color:var(--muted);font-size:12px">데이터 없음</div>';
  }

  /* ② 상태별 현황 — 컬러 스택 바 */
  var statusEl=document.getElementById('dashStatusChart');
  if(statusEl){
    var statusDef=[
      {key:'active',    label:'유효',   clr:'#059669'},
      {key:'in_review', label:'검토중', clr:'#2563eb'},
      {key:'draft',     label:'초안',   clr:'#94a3b8'},
      {key:'obsolete',  label:'폐기',   clr:'#dc2626'},
    ];
    var total2=Object.values(byStatus).reduce(function(s,v){return s+v;},0)||1;

    statusEl.innerHTML=
      /* 스택 바 */
      '<div style="height:24px;border-radius:6px;overflow:hidden;display:flex;margin-bottom:10px">'+
        statusDef.filter(function(s){return byStatus[s.key]>0;}).map(function(s){
          var pct=Math.round((byStatus[s.key]/total2)*100);
          return'<div style="background:'+s.clr+';width:'+pct+'%;display:flex;align-items:center;justify-content:center" title="'+s.label+': '+byStatus[s.key]+'건">'+
            (pct>8?'<span style="font-size:10px;color:#fff;font-weight:600">'+pct+'%</span>':'')+
          '</div>';
        }).join('')+
      '</div>'+
      /* 범례 */
      '<div style="display:flex;flex-wrap:wrap;gap:8px">'+
        statusDef.map(function(s){
          return'<div style="display:flex;align-items:center;gap:4px">'+
            '<div style="width:10px;height:10px;border-radius:2px;background:'+s.clr+'"></div>'+
            '<span style="font-size:11px;color:var(--muted)">'+s.label+' '+byStatus[s.key]+'</span>'+
          '</div>';
        }).join('')+
      '</div>';
  }
},

/* 대시보드 새로고침 */
_dashRefresh:async function(){
  window._docRows=null;
  await Pages.doc_dashboard();
},
/* ══════════════════════════════════════════════════
   Q&A 페이지 [v2.399.4]
   사이드바 메인 4번째 메뉴 — 매뉴얼/Q&A/팁 통합
   ══════════════════════════════════════════════════ */
async qna(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';

  var rows=[];
  try{ rows=await SB.getQna(); }catch(e){ Toast.show('Q&A 로드 실패: '+e.message,'err'); }

  var cnt={all:rows.length,manual:0,qna:0,tip:0,open:0,resolved:0};
  rows.forEach(function(r){
    if(cnt[r.category]!==undefined) cnt[r.category]++;
    if(r.status==='open'||r.status==='in_progress') cnt.open++;
    if(r.status==='resolved') cnt.resolved++;
  });

  w.innerHTML=
    /* ① stat-dash */
    '<div class="stat-dash">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaFilter(\'all\')" title="전체">'+
        '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>'+
        '<div><div class="sd-val">'+cnt.all+'</div><div class="sd-lbl">전체</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaFilter(\'manual\')" title="매뉴얼">'+
        '<div class="sd-icon" style="background:#dbeafe;color:#1d4ed8">📖</div>'+
        '<div><div class="sd-val">'+cnt.manual+'</div><div class="sd-lbl">매뉴얼</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaFilter(\'qna\')" title="Q&A">'+
        '<div class="sd-icon" style="background:#fef3c7;color:#92400e">❓</div>'+
        '<div><div class="sd-val">'+cnt.qna+'</div><div class="sd-lbl">Q&A</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaFilter(\'tip\')" title="팁">'+
        '<div class="sd-icon" style="background:#d1fae5;color:#065f46">💡</div>'+
        '<div><div class="sd-val">'+cnt.tip+'</div><div class="sd-lbl">팁</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaStatusFilter(\'open\')">'+
        '<div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div>'+
        '<div><div class="sd-val">'+cnt.open+'</div><div class="sd-lbl">미해결</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._qnaStatusFilter(\'resolved\')">'+
        '<div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+cnt.resolved+'</div><div class="sd-lbl">해결됨</div></div></div>'+
    '</div>'+

    /* ② 헤더 */
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">❓ Q&A</div>'+
      '<div style="font-size:12px;color:var(--muted)">매뉴얼 · 질문/오류 접수 · 팁 & 기타</div>'+
    '</div><div class="pac">'+
      '<button class="btn bpri btn-f2" onclick="Pages._qnaForm()">+ 등록 <span class="kbd">F2</span></button>'+
    '</div></div>'+

    /* ③ 툴바 */
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="qnaKw" placeholder="제목, 내용 검색..." oninput="Pages._qnaKwFilter(this.value)"></div>'+
      '<select class="fsel" id="qnaCatF" onchange="Pages._qnaCatFilter(this.value)">'+
        '<option value="">전체 분류</option>'+
        '<option value="manual">📖 매뉴얼</option>'+
        '<option value="qna">❓ Q&A</option>'+
        '<option value="tip">💡 팁</option>'+
      '</select>'+
      '<select class="fsel" id="qnaStF" onchange="Pages._qnaStFilter(this.value)">'+
        '<option value="">전체 상태</option>'+
        '<option value="open">🔴 접수</option>'+
        '<option value="in_progress">🔵 처리중</option>'+
        '<option value="resolved">✅ 해결됨</option>'+
        '<option value="closed">⬜ 닫힘</option>'+
      '</select>'+
    '</div>'+
    '<div id="qnaTbl"></div>';

  window._qnaRows=rows;
  window._qnaCat=''; window._qnaSt=''; window._qnaKw='';
  Pages._qnaRender(rows);
},

/* 필터 핸들러 */
_qnaFilter:function(cat){
  window._qnaCat=cat==='all'?'':cat; window._qnaSt=''; window._qnaKw='';
  var sel=document.getElementById('qnaCatF');if(sel)sel.value=cat==='all'?'':cat;
  var sel2=document.getElementById('qnaStF');if(sel2)sel2.value='';
  Pages._qnaApply();
},
_qnaStatusFilter:function(st){
  window._qnaSt=st; window._qnaCat=''; window._qnaKw='';
  var sel=document.getElementById('qnaStF');if(sel)sel.value=st;
  var sel2=document.getElementById('qnaCatF');if(sel2)sel2.value='';
  Pages._qnaApply();
},
_qnaKwFilter:function(v){window._qnaKw=v;Pages._qnaApply();},
_qnaCatFilter:function(v){window._qnaCat=v;Pages._qnaApply();},
_qnaStFilter:function(v){window._qnaSt=v;Pages._qnaApply();},
_qnaApply:function(){
  var rows=window._qnaRows||[];
  var cat=window._qnaCat||'';var st=window._qnaSt||'';var kw=(window._qnaKw||'').toLowerCase();
  if(cat) rows=rows.filter(function(r){return r.category===cat;});
  if(st){
    if(st==='open') rows=rows.filter(function(r){return r.status==='open'||r.status==='in_progress';});
    else rows=rows.filter(function(r){return r.status===st;});
  }
  if(kw) rows=rows.filter(function(r){
    return (r.title||'').toLowerCase().includes(kw)||(r.body||'').toLowerCase().includes(kw);
  });
  Pages._qnaRender(rows);
},

/* 목록 렌더 — Tbl.render */
_qnaRender:function(rows){
  var catL={manual:'📖 매뉴얼',qna:'❓ Q&A',tip:'💡 팁'};
  var catC={manual:'bblu',qna:'bamb',tip:'bgrn'};
  var stL={open:'접수',in_progress:'처리중',resolved:'해결됨',closed:'닫힘'};
  var stC={open:'bamb',in_progress:'bblu',resolved:'bgrn',closed:'bgry'};
  Tbl.render({
    el:'#qnaTbl',
    cols:[
      {key:'is_pinned',  label:'',       w:'28px', align:'center',
        render:function(v){return v?'<span style="color:#f59e0b">📌</span>':'';}},
      {key:'category',   label:'분류',   w:'80px', align:'center',
        render:function(v){return'<span class="badge '+(catC[v]||'bgry')+'" style="font-size:10px">'+(catL[v]||v)+'</span>';}},
      {key:'title',      label:'제목',
        render:function(v,row){
          var fileIcon=(row.file_url?'📎 ':'');
          return'<span style="font-weight:600;cursor:pointer" onclick="Pages._qnaDetail('+row.id+')">'+fileIcon+H.e(v||'-')+'</span>';}},
      {key:'status',     label:'상태',   w:'72px', align:'center',
        render:function(v){return'<span class="badge '+(stC[v]||'bgry')+'" style="font-size:10px">'+(stL[v]||v)+'</span>';}},
      {key:'author',     label:'작성자', w:'70px', align:'center'},
      {key:'view_count', label:'조회',   w:'48px', align:'center',
        render:function(v){return'<span style="font-size:11px;color:var(--muted)">'+((v||0))+'</span>';}},
      {key:'created_at', label:'등록일', w:'90px',
        render:function(v){return v?'<span style="font-size:11px">'+new Date(v).toLocaleDateString('ko-KR')+'</span>':'-';}},
    ],
    data:rows,
    onDel:async function(ids){
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({title:'🗑️ Q&A 삭제',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div><div>선택한 <b style="color:#dc2626">'+ids.length+'건</b>을 삭제합니다.</div></div>',
        danger:true,onOk:async function(){
          for(var i=0;i<ids.length;i++) await SB.deleteQna(ids[i]);
          window._qnaRows=(window._qnaRows||[]).filter(function(x){return!ids.includes(x.id);});
          Pages._qnaRender(window._qnaRows);
          Toast.show(ids.length+'건 삭제되었습니다.','ok');
        }
      });
    },
    onRow:function(row){if(row)Pages._qnaDetail(row.id);},
  });
},

/* 상세 보기 */
_qnaDetail:async function(id){
  var r=await SB.getQnaById(id);
  if(!r){Toast.show('항목을 불러올 수 없습니다.','err');return;}
  var catL={manual:'📖 매뉴얼',qna:'❓ Q&A',tip:'💡 팁'};
  var stL={open:'접수됨',in_progress:'처리중',resolved:'해결됨',closed:'닫힘'};
  var stC={open:'bamb',in_progress:'bblu',resolved:'bgrn',closed:'bgry'};
  var isAdmin=Auth._u&&(Auth._u.role==='admin'||Auth._u.role==='manager');
  var me=Auth._u?(Auth._u.name||Auth._u.username):'';
  var replies=r.replies||[];

  Modal.open({title:'Q&A 상세',size:'mlg',body:
    '<div style="padding:4px 0">'+
      /* 헤더 */
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
        '<span class="badge '+(({manual:'bblu',qna:'bamb',tip:'bgrn'})[r.category]||'bgry')+'">'+(catL[r.category]||r.category)+'</span>'+
        '<span class="badge '+(stC[r.status]||'bgry')+'">'+(stL[r.status]||r.status)+'</span>'+
        (r.is_pinned?'<span style="color:#f59e0b;font-size:12px">📌 고정</span>':'')+
        (isAdmin?'<select class="fsel" style="font-size:11px;padding:2px 6px;margin-left:auto" onchange="Pages._qnaChgStatus('+r.id+',this.value)">'+
          '<option value="open"'+(r.status==='open'?' selected':'')+'>접수</option>'+
          '<option value="in_progress"'+(r.status==='in_progress'?' selected':'')+'>처리중</option>'+
          '<option value="resolved"'+(r.status==='resolved'?' selected':'')+'>해결됨</option>'+
          '<option value="closed"'+(r.status==='closed'?' selected':'')+'>닫힘</option>'+
        '</select>':'')+
      '</div>'+
      '<div style="font-size:16px;font-weight:700;margin-bottom:6px">'+H.e(r.title)+'</div>'+
      '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap">'+
        '<span>✍️ '+H.e(r.author)+'</span>'+
        '<span>'+(r.created_at?new Date(r.created_at).toLocaleDateString('ko-KR'):'-')+'</span>'+
        '<span>👁️ '+(r.view_count||0)+' 조회</span>'+
      '</div>'+
      /* 본문 */
      '<div style="font-size:13px;line-height:1.7;white-space:pre-wrap;padding:14px;background:var(--bg2);border-radius:var(--r);margin-bottom:14px">'+H.e(r.body||'')+'</div>'+
      /* 첨부파일 */
      (r.file_url?'<div style="margin-bottom:14px"><a href="'+H.e(r.file_url)+'" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);font-size:12px;color:var(--acc);text-decoration:none">📎 '+H.e(r.file_name||'첨부파일')+' <span style="font-size:10px;color:var(--muted)">다운로드</span></a></div>':'')+
      /* 답변 목록 */
      '<div style="font-size:13px;font-weight:600;margin-bottom:10px">💬 답변 '+replies.length+'건</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">'+
      replies.map(function(rep){
        return'<div style="background:'+(rep.is_answer?'#f0fdf4':'var(--bg2)')+';border:1px solid '+(rep.is_answer?'#86efac':'var(--brd)')+';border-radius:var(--r);padding:10px 14px">'+
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap">'+
            (rep.is_answer?'<span style="font-size:10px;font-weight:700;background:#d1fae5;color:#065f46;padding:1px 6px;border-radius:3px">✅ 공식 답변</span>':'')+
            '<span style="font-size:12px;font-weight:600">'+H.e(rep.author)+'</span>'+
            '<span style="font-size:11px;color:var(--muted)">'+(rep.created_at?new Date(rep.created_at).toLocaleDateString('ko-KR'):'')+'</span>'+
            (isAdmin?'<button class="btn bxs berr" style="margin-left:auto" onclick="Pages._qnaDelReply('+rep.id+','+r.id+')">삭제</button>':'')+
          '</div>'+
          '<div style="font-size:13px;line-height:1.6;white-space:pre-wrap">'+H.e(rep.body)+'</div>'+
        '</div>';
      }).join('')+
      (!replies.length?'<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px">아직 답변이 없습니다.</div>':'')+
      '</div>'+
      /* 답변 작성 */
      '<div style="border-top:1px solid var(--brd);padding-top:14px">'+
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px">답변 작성</div>'+
        '<textarea id="qnaReplyTxt" rows="3" class="fc" placeholder="답변 내용 입력..."></textarea>'+
        '<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:6px">'+
          (isAdmin?'<button class="btn bgrn bsm" onclick="Pages._qnaReply('+r.id+',true)">✅ 공식 답변</button>':'')+
          '<button class="btn bpri bsm" onclick="Pages._qnaReply('+r.id+',false)">📝 답변 등록</button>'+
        '</div>'+
      '</div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
      (isAdmin?'<button class="btn bout" onclick="Modal.close();Pages._qnaForm('+r.id+')">✏️ 수정</button>'+
               '<button class="btn bred bsm" onclick="Pages._qnaDel('+r.id+')">🗑️ 삭제</button>':''),
  });
},

/* 답변 등록 */
_qnaReply:async function(qnaId,isAnswer){
  var txt=document.getElementById('qnaReplyTxt')?.value?.trim();
  if(!txt){Toast.show('답변 내용을 입력하세요.','warn');return;}
  var me=Auth._u?(Auth._u.name||Auth._u.username):'관리자';
  var r=await SB.addQnaReply(qnaId,txt,me,isAnswer);
  if(r.ok){Toast.show(isAnswer?'✅ 공식 답변 등록':'답변 등록','ok');Modal.close();Pages._qnaDetail(qnaId);Pages.qna();}
},
_qnaDelReply:async function(replyId,qnaId){
  Modal.confirm({title:'답변 삭제',msg:'이 답변을 삭제하시겠습니까?',danger:true,
    onOk:async function(){var r=await SB.deleteQnaReply(replyId);if(r.ok){Toast.show('삭제됨','ok');Modal.close();Pages._qnaDetail(qnaId);}}
  });
},
_qnaChgStatus:async function(id,st){
  var r=await SB.updateQna(id,{status:st});
  if(r.ok){Toast.show('상태 변경됨','ok');window._qnaRows=await SB.getQna();Pages._qnaApply();}
},
_qnaDel:async function(id){
  Modal.confirm({title:'Q&A 삭제',msg:'삭제하시겠습니까?',danger:true,
    onOk:async function(){var r=await SB.deleteQna(id);if(r.ok){Toast.show('삭제됨','ok');Modal.close();window._qnaRows=await SB.getQna();Pages._qnaApply();}}
  });
},

/* 등록/수정 폼 — 파일 첨부 포함 */
_qnaForm:async function(editId){
  var edit=null;
  if(editId){try{edit=await SB.getQnaById(editId);}catch(e){}}
  var me=Auth._u?(Auth._u.name||Auth._u.username):'관리자';
  var menuOpts=[{v:'',l:'— 메뉴 선택 안함 —'},{v:'docs',l:'문서관리'},{v:'items',l:'품목 등록'},
    {v:'vendors',l:'거래처'},{v:'insp_in',l:'수입검사'},{v:'nc',l:'부적합'},{v:'car',l:'시정조치'},
    {v:'equip',l:'계측기'},{v:'quality_dash',l:'품질현황'}];
  var isAdmin=Auth._u&&(Auth._u.role==='admin'||Auth._u.role==='manager');

  Modal.open({title:edit?'Q&A 수정':'Q&A 등록',size:'mlg',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">분류</label>'+
      '<select class="fc" id="qfCat">'+
        '<option value="qna"'+((!edit||edit.category==='qna')?' selected':'')+'>❓ Q&A / 오류 접수</option>'+
        '<option value="tip"'+(edit&&edit.category==='tip'?' selected':'')+'>💡 팁 & 기타</option>'+
        '<option value="manual"'+(edit&&edit.category==='manual'?' selected':'')+'>📖 매뉴얼</option>'+
      '</select></div>'+
    '<div class="fgroup"><label class="fl">관련 메뉴</label>'+
      '<select class="fc" id="qfMenu">'+
        menuOpts.map(function(o){return'<option value="'+o.v+'"'+(edit&&edit.menu_ref===o.v?' selected':'')+'>'+o.l+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup ff"><label class="fl req">제목</label>'+
      '<input class="fc" id="qfTitle" placeholder="제목을 입력하세요" value="'+H.e(edit?edit.title:'')+'"></div>'+
    '<div class="fgroup ff"><label class="fl req">내용</label>'+
      '<textarea class="fc" id="qfBody" rows="5" placeholder="내용을 입력하세요">'+H.e(edit?edit.body:'')+'</textarea></div>'+
    '<div class="fgroup ff"><label class="fl">첨부 파일</label>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<label style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1.5px dashed var(--brd);border-radius:var(--r);cursor:pointer;font-size:12px;color:var(--muted)">'+
          '📁 파일 선택'+
          '<input type="file" id="qfFile" style="display:none" onchange="Pages._qnaFilePreview(this)">'+
        '</label>'+
        '<span id="qfFileName" style="font-size:11px;color:var(--muted)">'+(edit&&edit.file_name?'📎 '+H.e(edit.file_name):'선택된 파일 없음')+'</span>'+
      '</div>'+
    '</div>'+
    (isAdmin?'<div class="fgroup"><label class="fl">고정글</label>'+
      '<select class="fc" id="qfPin"><option value="0">일반</option>'+
      '<option value="1"'+(edit&&edit.is_pinned?' selected':'')+'>📌 고정</option></select></div>':'')+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._qnaSave('+(editId||'null')+')">저장</button>',
  });
},
_qnaFilePreview:function(inp){
  var lbl=document.getElementById('qfFileName');
  if(inp.files&&inp.files[0]&&lbl) lbl.textContent='📎 '+inp.files[0].name;
},
_qnaSave:async function(editId){
  var title=document.getElementById('qfTitle')?.value?.trim();
  var body=document.getElementById('qfBody')?.value?.trim();
  if(!title){Toast.show('제목을 입력하세요.','warn');return;}
  if(!body){Toast.show('내용을 입력하세요.','warn');return;}
  var me=Auth._u?(Auth._u.name||Auth._u.username):'관리자';
  var isAdmin=Auth._u&&(Auth._u.role==='admin'||Auth._u.role==='manager');
  var row={
    category:document.getElementById('qfCat')?.value||'qna',
    menu_ref:document.getElementById('qfMenu')?.value||null,
    title:title,body:body,author:me,
    is_pinned:document.getElementById('qfPin')?.value==='1'||false,
    file_url:null,file_name:null,
  };
  /* 파일 업로드 */
  var fileInput=document.getElementById('qfFile');
  if(fileInput&&fileInput.files&&fileInput.files[0]){
    try{
      var uploaded=await SB.uploadFile('qna',fileInput.files[0]);
      if(uploaded&&uploaded.url){row.file_url=uploaded.url;row.file_name=fileInput.files[0].name;}
    }catch(e){console.warn('파일 업로드 실패:',e.message);}
  }
  var r;
  if(editId){r=await SB.updateQna(editId,row);}
  else{row.status='open';r=await SB.addQna(row);}
  if(r.ok){
    Toast.show(editId?'수정되었습니다.':'등록되었습니다.','ok');
    Modal.close();
    window._qnaRows=await SB.getQna();Pages._qnaApply();
  }
},
/* ══════════════════════════════════════════════════
   기록 관리 [v2.396 — doc_type='record' 조회]
   Phase 1 포함 기능: doc_master record 유형 문서 관리
   ══════════════════════════════════════════════════ */
async rec(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  window._recRows=[];
  try{ window._recRows=await SB.getDocMaster({doc_type:'record'}); }catch(e){ Toast.show('기록 조회 실패: '+e.message,'err'); }

  var rows=window._recRows;
  var cnt={all:rows.length,active:0,draft:0};
  rows.forEach(function(r){if(r.status==='active')cnt.active++;if(r.status==='draft')cnt.draft++;});

  w.innerHTML=
    '<div class="stat-dash">'+
      '<div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>'+
        '<div><div class="sd-val">'+cnt.all+'</div><div class="sd-lbl">전체 기록</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+cnt.active+'</div><div class="sd-lbl">유효</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📝</div>'+
        '<div><div class="sd-val">'+cnt.draft+'</div><div class="sd-lbl">초안</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div><div class="ptit">📋 기록 관리</div></div>'+
      '<div class="pac">'+
        '<button class="btn bpri btn-f2" onclick="Pages._recForm()">+ 기록 등록 <span class="kbd">F2</span></button>'+
      '</div>'+
    '</div>'+
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="recKw" placeholder="기록번호, 제목..." oninput="Pages._recKwFilter(this.value)"></div>'+
      '<button class="btn bout bsm" onclick="SearchPop.open(\'docs\')" title="통합 검색 (F3)">🔎 Search <span class="kbd">F3</span></button>'+
    '</div>'+
    '<div id="recTbl"></div>';

  Pages._recRender(rows);
},
_recKwFilter:function(kw){
  var rows=window._recRows||[];
  if(kw) rows=rows.filter(function(r){
    return (r.title||'').toLowerCase().includes(kw.toLowerCase())||
           (r.doc_no||'').toLowerCase().includes(kw.toLowerCase());
  });
  Pages._recRender(rows);
},
_recRender:function(rows){
  Tbl.render({
    el:'#recTbl',
    cols:[
      {key:'doc_no',        label:'기록번호',   w:'130px',
        render:function(v,row){
          return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';
        }},
      {key:'title',         label:'제목',
        render:function(v,row){
          return'<span style="font-weight:500;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';
        }},
      {key:'current_ver',   label:'버전',       w:'58px', align:'center',
        render:function(v){return'<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px">'+H.e(v||'-')+'</span>';}},
      {key:'status',        label:'상태',       w:'72px', align:'center',
        render:function(v){return Pages._dBadge(v);}},
      {key:'next_review_at',label:'다음 검토일', w:'110px',
        render:function(v){return H.e(v||'-')+' '+Pages._dDay(v);}},
      {key:'dept',          label:'부서',       w:'68px', align:'center'},
      {key:'id',            label:'파일',       w:'58px', align:'center',
        render:function(v,row){return FM.btn('doc-'+v);}},
    ],
    data:rows,
    onDel:async function(ids){
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({
        title:'🗑️ 기록 삭제',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+
            '<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">'+ids.length+'건</b>을 삭제합니다.</div></div>',
        danger:true,
        onOk:async function(){
          for(var i=0;i<ids.length;i++) await SB.deleteDocMaster(ids[i]);
          window._recRows=(window._recRows||[]).filter(function(x){return!ids.includes(x.id);});
          Pages._recRender(window._recRows);
          Toast.show(ids.length+'건 삭제되었습니다.','ok');
        }
      });
    },
    onRow:function(row){if(row)Pages._docDetail(row);},
  });
},
_recForm:function(){
  SB.getUsers().then(function(users){
    var uOpts=users.map(function(u){return'<option value="'+u.id+'">'+H.e(u.name||u.username)+'('+H.e(u.dept||'')+')</option>';}).join('');
    Modal.open({title:'기록 등록',size:'mlg',body:
      '<div class="fg2">'+
      '<div class="fgroup"><label class="fl req">기록 번호</label><input class="fc" id="fnDocNo" placeholder="예: REC-001"></div>'+
      '<div class="fgroup"><label class="fl req">기록 제목</label><input class="fc" id="fnTitle" placeholder="예: 수입검사 성적서"></div>'+
      '<div class="fgroup" style="display:none"><select class="fc" id="fnType"><option value="record" selected>기록</option></select></div>'+
      '<div class="fgroup"><label class="fl">분류</label><select class="fc" id="fnCat"><option value="">선택 안함</option>'+['품질','생산','구매','안전','환경','기타'].map(function(x){return'<option>'+x+'</option>';}).join('')+'</select></div>'+
      '<div class="fgroup"><label class="fl">검토 주기</label><select class="fc" id="fnCycle"><option value="annual">연간</option><option value="quarterly">분기</option><option value="monthly">매월</option></select></div>'+
      '<div class="fgroup"><label class="fl">담당 부서</label><input class="fc" id="fnDept"></div>'+
      '<div class="fgroup ff"><label class="fl">태그</label><input class="fc" id="fnTags" placeholder="쉼표로 구분 (예: 검사기록, 품질)"></div>'+
      '<div class="fgroup"><label class="fl">결재자</label><select class="fc" id="fnApprover"><option value="">선택 안함</option>'+uOpts+'</select></div>'+
      '<div class="fgroup ff"><label class="fl">비고</label><input class="fc" id="fnSummary"></div>'+
      '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._docSave(null)">등록</button>'});
  });
},
/* ── 시정조치 ── */
car(){
  const w=document.getElementById('pw');
  const carByStatus={접수:0,처리중:0,완료:0};DB.cars.forEach(c=>{if(carByStatus[c.status]!==undefined)carByStatus[c.status]++});
  const carBySrc={};DB.cars.forEach(c=>{carBySrc[c.src]=(carBySrc[c.src]||0)+1});
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🔧</div><div><div class="sd-val">${DB.cars.length}</div><div class="sd-lbl">전체 CAR</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#64748b">📋</div><div><div class="sd-val">${carByStatus['접수']}</div><div class="sd-lbl">접수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⏳</div><div><div class="sd-val">${carByStatus['처리중']}</div><div class="sd-lbl">처리중</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${carByStatus['완료']}</div><div class="sd-lbl">완료</div></div></div>
    ${Object.entries(carBySrc).map(([s,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${s}</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">🔧 시정조치 (CAR)</div></div><div class="pac"><button class="btn bpri btn-f2" onclick="Pages._carForm()">+ CAR 등록 <span class="kbd">F2</span></button></div></div>
    <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('car')" title="엑셀 양식 내려받기">📥 양식 내려받기</button><button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('car')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
    <div class="tbar"><div class="sw2"><input type="text" placeholder="CAR번호, 제목..."></div>
      <select class="fsel"><option value="">전체 상태</option><option>접수</option><option>처리중</option><option>완료</option></select>
      <button class="btn bout bsm" onclick="SearchPop.open('car')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div><div id="carTbl"></div>`;
  Tbl.render({el:'#carTbl',cols:[
    {key:'no',label:'CAR번호',w:'142px'},{key:'src',label:'발생원',w:'72px',render:v=>`<span class="badge bpur">${H.e(v)}</span>`},
    {key:'title',label:'제목'},{key:'open',label:'개시일',w:'86px'},{key:'due',label:'완료기한',w:'86px'},
    {key:'assignee',label:'담당자',w:'72px'},
    {key:'status',label:'상태',w:'66px',render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='처리중'?'bamb':'bgry'}">${H.e(v)}</span>`},
  ],data:DB.cars,onDel:async(ids)=>{
      /* [v2.394] 삭제 경고 팝업 — 시정조치 */
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      const _doDelete=async()=>{
        const numIds=ids.map(Number);
        DB.cars=DB.cars.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.car?.();
      };
      Modal.confirm({
        title:'🗑️ 시정조치 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+`<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 시정조치를 삭제합니다.</div>`+'<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
        danger:true,
        onOk:_doDelete
      });
    },onRow:row=>Pages._carDetail(row)});
},
_carForm(){Modal.open({title:'CAR 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">발생원</label><select class="fc">${['부적합','내부심사','고객불만','외부심사','기타'].map(s=>`<option>${s}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">개시일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup ff"><label class="fl req">제목</label><input class="fc"></div>
  <div class="fgroup ff"><label class="fl">발생 내용</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup ff"><label class="fl">근본 원인 (5-Why)</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup ff"><label class="fl">시정 조치</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup ff"><label class="fl">예방 조치</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup"><label class="fl">담당자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl">완료 기한</label><input class="fc" type="date"></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
_carDetail(row){Modal.open({title:`CAR — ${row.no}`,size:'mlg',
  body:`<div class="psteps">${['접수','처리중','검증','완료'].map((s,i)=>`<div class="pst"><div class="psd ${row.status===s?'ac':i<['접수','처리중','검증','완료'].indexOf(row.status)?'dn':''}">${i+1}</div><div class="psl ${row.status===s?'ac':''}">${s}</div></div>`).join('')}</div>
  <div class="ir"><div class="il">CAR번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.no)}</div></div>
  <div class="ir"><div class="il">발생원</div><div class="iv"><span class="badge bpur">${H.e(row.src)}</span></div></div>
  <div class="ir"><div class="il">제목</div><div class="iv"><strong>${H.e(row.title)}</strong></div></div>
  <div class="ir"><div class="il">기간</div><div class="iv">${row.open} ~ ${row.due}</div></div>
  <div class="ir"><div class="il">담당자</div><div class="iv">${H.e(row.assignee)}</div></div>
  <div id="carCmt"></div>`,
  foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bok" onclick="Toast.show('상태변경(더미)','ok')">상태 변경</button><button class="btn bpri">수정</button>`
});setTimeout(()=>Cmt.render('#carCmt',`car-${row.id}`),80)},
audit(){document.getElementById('pw').innerHTML=`<div class="ph"><div><div class="ptit">🔎 내부심사</div></div><div class="pac"><button class="btn bpri btn-f2">+ 심사 등록 <span class="kbd">F2</span></button></div></div><div class="card"><div class="es"><div class="es-icon">🔎</div><div>내부심사 — 백엔드 연동 후 활성화</div></div></div>`},

/* ── 멘션함 ── */
/* ── 멘션함 ──
   Supabase 배포 시:
   - 조회: supabase.from('mentions').select('*,replies(*)').order('created_at',{ascending:false})
   - 작성: supabase.from('mentions').insert({from,to,text,ref,read:false})
   - 수정: supabase.from('mentions').update({text}).eq('id',id)
   - 삭제: supabase.from('mentions').delete().eq('id',id)
   - 히스토리: deleted_at 필드로 soft delete 관리 (백엔드) */
/* [v2.394] C1: SB.getMentions 연동 */
async mentions(){
  /* [v2.394] 멘션함 고도화
     - 받은함 / 보낸함 / 칸반 탭
     - 새 멘션 작성 폼
     - 읽음 처리 + TopNav 배지 연동
     - 검색 + 필터
     - @멘션 자동완성 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';

  /* SB 최신 데이터 로드 — mentions + users 동시 로드 */
  try{
    const [freshM, freshU]=await Promise.all([
      SB.getMentions(),
      SB.getUsers(),
    ]);
    if(Array.isArray(freshM)) DB.mentions=freshM;
    if(Array.isArray(freshU)&&freshU.length) DB.users=freshU;
  }catch(e){console.warn('[mentions]',e);}

  const me=Auth._cur||'admin';
  const isAdmin=(Auth._u?.role==='admin');

  /* 읽지 않은 것 자동 읽음 처리 */
  const unreadIds=(DB.mentions||[])
    .filter(m=>(m.to===me||(m.to_list||[]).includes(me)||isAdmin)&&!m.read&&m.from!==me)
    .map(m=>m.id);
  if(unreadIds.length){
    unreadIds.forEach(async id=>{
      await SB.updateMention(id,{read:true});
      const m=(DB.mentions||[]).find(m=>m.id===id);
      if(m) m.read=true;
    });
    /* TopNav 배지 갱신 */
    Pages._updateMentionBadge();
  }

  if(w.querySelector('#mentionWrap')){Pages._mentionRefresh();return;}
  Pages._mentionBuildLayout(w,me,isAdmin);
},

/* ── 레이아웃 최초 생성 [v2.394] ── */
_mentionBuildLayout(w,me,isAdmin){
  /* [v2.394] UI 전면 개선 — 탭/필터/칸반/전체 */
  const users=(DB.users||[]).filter(u=>u.active!==0&&u.active!==false&&!u.pending);
  const userOpts=users.length
    ? users.map(u=>`<option value="${H.e(u.username)}">${H.e(u.name||u.username)} (${H.e(u.department||'')})</option>`).join('')
    : '<option value="" disabled>사용자 없음</option>';

  w.innerHTML=`<div id="mentionWrap" style="font-size:13px">
    <!-- KPI 카드 -->
    <div class="stat-dash" id="mentionKpi" style="margin-bottom:14px"></div>

    <!-- 헤더 -->
    <div class="ph" style="margin-bottom:10px">
      <div>
        <div class="ptit">💬 멘션함</div>
        <div class="psub">팀원 알림 · 업무 협업 · 멘션 관리</div>
      </div>
      <div class="pac">
        <button class="btn bpri" style="font-size:12px" onclick="Pages._mentionForm()">✏️ 새 멘션 작성</button>
      </div>
    </div>

    <!-- 탭 -->
    <div style="display:flex;gap:4px;margin-bottom:10px;border-bottom:2px solid var(--bd);padding-bottom:0">
      <button class="mtab-btn active" data-tab="inbox"  onclick="Pages._mentionTab('inbox',this)"  style="padding:6px 14px;font-size:12px;border:none;border-bottom:2px solid #2563eb;background:none;color:#2563eb;font-weight:700;cursor:pointer;margin-bottom:-2px">📥 받은함</button>
      <button class="mtab-btn"        data-tab="sent"   onclick="Pages._mentionTab('sent',this)"   style="padding:6px 14px;font-size:12px;border:none;border-bottom:2px solid transparent;background:none;color:var(--tm);cursor:pointer;margin-bottom:-2px">📤 보낸함</button>
      <button class="mtab-btn"        data-tab="saved"  onclick="Pages._mentionTab('saved',this)"  style="padding:6px 14px;font-size:12px;border:none;border-bottom:2px solid transparent;background:none;color:var(--tm);cursor:pointer;margin-bottom:-2px">📌 보관함</button>
      <button class="mtab-btn"        data-tab="kanban" onclick="Pages._mentionTab('kanban',this)" style="padding:6px 14px;font-size:12px;border:none;border-bottom:2px solid transparent;background:none;color:var(--tm);cursor:pointer;margin-bottom:-2px">📌 칸반</button>
      <button class="mtab-btn"        data-tab="all"    onclick="Pages._mentionTab('all',this)"    style="padding:6px 14px;font-size:12px;border:none;border-bottom:2px solid transparent;background:none;color:var(--tm);cursor:pointer;margin-bottom:-2px">📋 전체</button>
    </div>

    <!-- 필터 바 -->
    <div class="tbar" style="margin-bottom:10px">
      <div class="sw2" style="min-width:200px">
        <input type="text" id="mentionSearch" placeholder="내용·발신자·수신자 검색..."
          style="font-size:12px" oninput="Pages._mentionRefresh()">
      </div>
      <select class="fsel" id="mentionReadF" style="font-size:12px" onchange="Pages._mentionRefresh()">
        <option value="">전체</option>
        <option value="unread">읽지 않음</option>
        <option value="read">읽음</option>
      </select>
      <button class="btn bout bsm" style="font-size:11px" onclick="Pages._mentionMarkAllRead()">✅ 전체 읽음</button>
    </div>

    <!-- 목록/칸반 영역 -->
    <div id="mentionList"></div>
    <select id="mentionUserPool" style="display:none">${userOpts}</select>
  </div>`;
  Pages._mentionRefresh();
},

/* ── 탭 전환 [v2.394] ── */
_mentionTab(tab, btn){
  /* [v2.394] 탭 스타일 전환 */
  document.querySelectorAll('.mtab-btn').forEach(b=>{
    const on=b===btn;
    b.style.borderBottomColor=on?'#2563eb':'transparent';
    b.style.color=on?'#2563eb':'var(--tm)';
    b.style.fontWeight=on?'700':'400';
  });
  window._mentionTab=tab;
  Pages._mentionRefresh();
},

/* ── 목록 갱신 [v2.394] ── */
_mentionRefresh(){
  /* [v2.394] 목록형 + 칸반 탭 + UI 전면 개선 */
  const me=Auth._cur||'admin';
  const isAdmin=(Auth._u?.role==='admin');
  const tab=window._mentionTab||'inbox';
  const q=(document.getElementById('mentionSearch')?.value||'').toLowerCase();
  const readF=document.getElementById('mentionReadF')?.value||'';
  const all=DB.mentions||[];

  /* 수신자 표시명 헬퍼 */
  const toLabel=to=>{
    if(!to||to==='all') return '📢 전체공지';
    const u=(DB.users||[]).find(u=>u.username===to);
    return u?(u.name||u.username)+(u.department?` (${u.department})`:''):to;
  };

  let filtered=[];
  if(tab==='inbox'){
    filtered=all.filter(m=>m.to===me||(m.to_list||[]).includes(me)||(m.to==='all')||
      (isAdmin&&(m.to==='all')));
  } else if(tab==='sent'){
    filtered=all.filter(m=>m.from===me);
  } else if(tab==='saved'){
    filtered=all.filter(m=>m.saved===true);
  } else if(tab==='kanban'){
    Pages._mentionKanban(all,me,isAdmin,toLabel);
    return;
  } else {
    filtered=isAdmin?all:all.filter(m=>m.to===me||m.from===me||
      (m.to_list||[]).includes(me)||m.to==='all');
  }
  if(q) filtered=filtered.filter(m=>
    (m.text||m.message||'').toLowerCase().includes(q)||
    (m.from||'').toLowerCase().includes(q)||
    (m.to||'').toLowerCase().includes(q)
  );
  if(readF==='unread') filtered=filtered.filter(m=>!m.read);
  if(readF==='read')   filtered=filtered.filter(m=>m.read);
  filtered.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));

  /* KPI */
  const unread=all.filter(m=>(m.to===me||(m.to_list||[]).includes(me)||m.to==='all')&&!m.read).length;
  const kpiEl=document.getElementById('mentionKpi');
  if(kpiEl) kpiEl.innerHTML=`
    <div class="sd-card"><div class="sd-icon" style="background:#eff6ff;color:#2563eb;font-size:16px">💬</div>
      <div><div class="sd-val" style="font-size:18px">${all.length}</div><div class="sd-lbl">전체</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626;font-size:16px">🔴</div>
      <div><div class="sd-val" style="font-size:18px">${unread}</div><div class="sd-lbl">읽지않음</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#059669;font-size:16px">📤</div>
      <div><div class="sd-val" style="font-size:18px">${all.filter(m=>m.from===me).length}</div><div class="sd-lbl">보낸함</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706;font-size:16px">📌</div>
      <div><div class="sd-val" style="font-size:18px">${all.filter(m=>m.saved).length}</div><div class="sd-lbl">보관함</div></div></div>`;

  const listEl=document.getElementById('mentionList');
  if(!listEl) return;

  if(!filtered.length){
    listEl.innerHTML='<div class="card" style="text-align:center;padding:40px;color:var(--tl)">'
      +'<div style="font-size:28px;margin-bottom:8px">💬</div>'
      +'<div style="font-size:13px">멘션이 없습니다.</div></div>';
    return;
  }

  /* 상단 일괄 버튼 */
  let h='<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">'
       +'<button class="btn berr bsm" onclick="Pages._mentionBulkDel()" style="font-size:11px">🗑 선택 삭제</button>'
       +'<button class="btn bout bsm" onclick="Pages._mentionBulkSave()" style="font-size:11px">📌 선택 보관</button>'
       +'<span id="mentionSelCount" style="font-size:11px;color:var(--tm)">0개 선택</span>'
       +'</div>';

  /* 테이블 */
  h+='<div style="overflow-x:auto;border:1px solid var(--bd);border-radius:6px">';
  h+='<table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:auto">';
  h+='<thead>';
  h+='<tr style="background:var(--bg2);border-bottom:2px solid var(--bd)">';
  h+='<th style="padding:8px;width:32px;text-align:center"><input type="checkbox" id="mentionChkAll" onchange="Pages._mentionChkAll(this)"></th>';
  h+='<th style="padding:8px;width:36px;text-align:center;color:var(--tm);font-size:11px;font-weight:600;white-space:nowrap">No</th>';
  h+='<th style="padding:8px;text-align:left;font-weight:600;cursor:pointer;white-space:nowrap" data-sort="text" onclick="Pages._mentionSort(this.dataset.sort,this)">내용 ⇅</th>';
  h+='<th style="padding:8px;width:90px;text-align:center;font-weight:600;cursor:pointer;white-space:nowrap" data-sort="from" onclick="Pages._mentionSort(this.dataset.sort,this)">발신자 ⇅</th>';
  h+='<th style="padding:8px;width:110px;text-align:center;font-weight:600;white-space:nowrap">수신자</th>';
  h+='<th style="padding:8px;width:120px;text-align:center;font-weight:600;cursor:pointer;white-space:nowrap" data-sort="created_at" onclick="Pages._mentionSort(this.dataset.sort,this)">시간 ⇅</th>';
  h+='<th style="padding:8px;width:58px;text-align:center;font-weight:600;white-space:nowrap">상태</th>';
  h+='<th style="padding:8px;width:56px;text-align:center;font-weight:600;white-space:nowrap">파일</th>';
  h+='<th style="padding:8px;width:80px;text-align:center;font-weight:600;white-space:nowrap">액션</th>';
  h+='</tr></thead><tbody>';

  filtered.forEach((m,i)=>{
    const isUnread=!m.read&&m.from!==me;
    const isSaved=!!m.saved;
    const txt=m.text||m.message||'(내용 없음)';
    const ts=(m.created_at||'').slice(0,16).replace('T',' ');
    /* 수신자 표시 */
    const toDisp=toLabel(m.to);
    const bg=i%2===0?'#fff':'#f9fafb';
    h+=`<tr style="background:${bg};border-bottom:1px solid var(--bd);${isUnread?'font-weight:600':''}" >`;
    h+=`<td style="padding:7px 8px;text-align:center"><input type="checkbox" class="mention-chk" data-id="${m.id}" onchange="Pages._mentionChkCount()"></td>`;
    h+=`<td style="padding:7px 8px;text-align:center;color:var(--tm);font-size:11px">${i+1}</td>`;
    /* 내용 — 한 줄, 말줄임 */
    h+=`<td style="padding:7px 10px;cursor:pointer;max-width:0;width:100%" onclick="Pages._mentionDetail(${m.id})">`;
    h+=`<div style="display:flex;align-items:center;gap:5px;overflow:hidden">`;
    if(isUnread) h+=`<span style="flex-shrink:0;width:7px;height:7px;border-radius:50%;background:#dc2626;display:inline-block"></span>`;
    if(isSaved)  h+=`<span style="flex-shrink:0;color:#d97706;font-size:11px">📌</span>`;
    if(m.ref)    h+=`<span class="badge bgry" style="flex-shrink:0;font-size:10px">${H.e(m.ref)}</span>`;
    h+=`<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px">${H.e(txt)}</span>`;
    h+=`</div></td>`;
    h+=`<td style="padding:7px 8px;text-align:center;font-size:12px;white-space:nowrap">${H.e(m.from||'-')}</td>`;
    h+=`<td style="padding:7px 8px;text-align:center;font-size:12px;white-space:nowrap">${H.e(toDisp)}</td>`;
    h+=`<td style="padding:7px 8px;text-align:center;color:var(--tm);font-size:11px;white-space:nowrap">${ts}</td>`;
    h+=`<td style="padding:7px 8px;text-align:center">`;
    h+=isUnread
      ? `<span class="badge bred" style="font-size:10px">미읽음</span>`
      : `<span class="badge bgry" style="font-size:10px">읽음</span>`;
    h+=`</td>`;
    /* 파일 셀 */
    h+=`<td style="padding:7px 8px;text-align:center">`;
    if(m.file_url){
      h+=`<button class="btn bxs bblu" style="font-size:10px;padding:2px 6px"
        title="파일 보기" onclick="event.stopPropagation();Pages._mentionFilePreview('${H.e(m.file_url||'')}')">📎</button>`;
    } else {
      h+=`<span style="color:var(--tl);font-size:11px">-</span>`;
    }
    h+=`</td>`;
    h+=`<td style="padding:7px 8px;text-align:center;white-space:nowrap">`;
    h+=`<button class="btn bxs bout" style="font-size:10px;padding:2px 6px" title="답장" onclick="event.stopPropagation();Pages._mentionReply(${m.id},'${H.e(m.from||'')}')">↩</button> `;
    h+=`<button class="btn bxs" style="font-size:10px;padding:2px 6px;background:${isSaved?'#fef3c7':'var(--bg2)'};border:1px solid var(--bd)" title="${isSaved?'보관 해제':'보관'}" onclick="event.stopPropagation();Pages._mentionToggleSave(${m.id})">${isSaved?'📌':'🔖'}</button> `;
    h+=`<button class="btn bxs berr" style="font-size:10px;padding:2px 6px" title="삭제" onclick="event.stopPropagation();Pages._mentionDel(${m.id})">🗑</button>`;
    h+=`</td></tr>`;
  });
  h+='</tbody></table></div>';
  listEl.innerHTML=h;
},

/* 전체 선택 [v2.394] */
_mentionChkAll(el){
  document.querySelectorAll('.mention-chk').forEach(c=>c.checked=el.checked);
  Pages._mentionChkCount();
},

/* 컬럼 정렬 [v2.394] */
_mentionSort(key, th){
  const asc = th.dataset.asc !== 'true';
  th.dataset.asc = asc;
  /* 모든 헤더 화살표 초기화 */
  document.querySelectorAll('[data-sort]').forEach(h=>{
    const k=h.dataset.sort;
    h.textContent=h.textContent.replace(/[↑↓⇅]/g,'')+(k===key?(asc?'↑':'↓'):'⇅');
  });
  DB.mentions=(DB.mentions||[]).sort((a,b)=>{
    const va=String(a[key]||''), vb=String(b[key]||'');
    return asc?va.localeCompare(vb):vb.localeCompare(va);
  });
  Pages._mentionRefresh();
},

/* 칸반 보기 [v2.394] */
_mentionKanban(all, me, isAdmin, toLabel){
  const listEl=document.getElementById('mentionList');
  if(!listEl) return;
  const visible=isAdmin?all:all.filter(m=>m.to===me||m.from===me||
    (m.to_list||[]).includes(me)||m.to==='all');

  const cols=[
    {key:'unread', label:'미읽음', color:'#dc2626', bg:'#fff5f5',
     items:visible.filter(m=>!m.read&&m.from!==me)},
    {key:'read',   label:'읽음',   color:'#2563eb', bg:'#eff6ff',
     items:visible.filter(m=>m.read&&!m.saved)},
    {key:'saved',  label:'보관',   color:'#d97706', bg:'#fef3c7',
     items:visible.filter(m=>m.saved)},
    {key:'sent',   label:'보낸함', color:'#059669', bg:'#f0fdf4',
     items:visible.filter(m=>m.from===me)},
  ];

  let h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
  cols.forEach(col=>{
    h+=`<div style="border-radius:8px;overflow:hidden;border:1px solid var(--bd)">`;
    h+=`<div style="background:${col.color};color:#fff;padding:8px 12px;font-size:12px;font-weight:700">`;
    h+=`${col.label} <span style="background:rgba(255,255,255,.25);border-radius:20px;padding:1px 8px">${col.items.length}</span></div>`;
    h+=`<div style="padding:6px;background:${col.bg};min-height:80px">`;
    col.items.slice(0,10).forEach(m=>{
      const txt=m.text||m.message||'(내용 없음)';
      const ts=(m.created_at||'').slice(0,10);
      h+=`<div class="card" style="padding:8px 10px;margin-bottom:6px;cursor:pointer;font-size:12px"
        onclick="Pages._mentionDetail(${m.id})">
        <div style="font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${H.e(txt.slice(0,40))}</div>
        <div style="font-size:11px;color:var(--tm);margin-top:3px;display:flex;justify-content:space-between">
          <span>${H.e(m.from||'-')} → ${H.e(toLabel(m.to))}</span>
          <span>${ts}</span>
        </div>
      </div>`;
    });
    if(!col.items.length) h+=`<div style="text-align:center;padding:16px;font-size:12px;color:var(--tl)">없음</div>`;
    h+='</div></div>';
  });
  h+='</div>';
  listEl.innerHTML=h;
},

/* 선택 개수 갱신 [v2.394] */
_mentionChkCount(){
  const cnt=document.querySelectorAll('.mention-chk:checked').length;
  const el=document.getElementById('mentionSelCount');
  if(el) el.textContent=cnt+'개 선택';
},

/* 일괄 삭제 [v2.394] */
async _mentionBulkDel(){
  const ids=[...document.querySelectorAll('.mention-chk:checked')].map(c=>Number(c.dataset.id));
  if(!ids.length){Toast.show('삭제할 멘션을 선택하세요.','warn');return;}
  Modal.confirm({
    title:'🗑️ 멘션 일괄 삭제',
    msg:`<div style="text-align:center"><div style="font-size:28px">⚠️</div><div style="font-size:14px;font-weight:700;margin:8px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>을 삭제합니다.</div></div>`,
    danger:true,
    onOk:async()=>{
      for(const id of ids) await SB.deleteMention(id);
      DB.mentions=(DB.mentions||[]).filter(m=>!ids.includes(m.id));
      Pages._updateMentionBadge();
      Toast.show(ids.length+'건 삭제되었습니다.','ok');
      Pages._mentionRefresh();
    }
  });
},

/* 보관 토글 [v2.394] */
async _mentionToggleSave(id){
  const m=(DB.mentions||[]).find(m=>m.id===id);
  if(!m) return;
  const saved=!m.saved;
  await SB.updateMention(id,{read:m.read,saved});
  m.saved=saved;
  Toast.show(saved?'보관함에 추가했습니다.':'보관 해제했습니다.','ok');
  Pages._mentionRefresh();
},

/* 멘션 파일 미리보기 [v2.394] */
_mentionFilePreview(url){
  if(!url){Toast.show('파일이 없습니다.','warn');return;}
  const ext=(url.split('.').pop()||'').toLowerCase().split('?')[0];
  const isImage=['jpg','jpeg','png','gif','webp'].includes(ext);
  const isPdf=ext==='pdf';
  const fileName=decodeURIComponent(url.split('/').pop()||'파일');
  Modal.open({
    title:'📎 첨부파일 미리보기',
    size:'mlg',
    foot:`<a href="${H.e(url)}" download target="_blank" class="btn bout bsm" style="font-size:12px">⬇ 다운로드</a>
          <button class="btn bout" onclick="Modal.close()">닫기</button>`,
    body: isImage
      ? `<div style="text-align:center;padding:10px">
           <img src="${H.e(url)}" alt="첨부 이미지"
             style="max-width:100%;max-height:70vh;border-radius:6px;box-shadow:0 2px 12px #0002">
         </div>`
      : isPdf
      ? `<div style="height:70vh">
           <iframe src="${H.e(url)}" style="width:100%;height:100%;border:none;border-radius:6px"></iframe>
         </div>`
      : `<div style="text-align:center;padding:40px">
           <div style="font-size:40px;margin-bottom:12px">📄</div>
           <div style="font-size:13px;color:var(--tm);margin-bottom:16px">${H.e(fileName)}</div>
           <a href="${H.e(url)}" download target="_blank" class="btn bpri">⬇ 다운로드</a>
         </div>`,
  });
},

/* 계측기 파일 미리보기 [v2.394] */
_equipFilePreview(url, code){
  Pages._filePreviewModal(url, '계측기 파일 — '+(code||''));
},

/* 교정 파일 미리보기 [v2.394] */
_calFilePreview(url){
  Pages._filePreviewModal(url, '교정 파일');
},

/* 8D 파일 미리보기 [v2.394] */
_reportFilePreview(url){
  Pages._filePreviewModal(url, '8D 첨부파일');
},

/* 공통 파일 미리보기 [v2.394] */
_filePreviewModal(url, title){
  if(!url){Toast.show('파일이 없습니다.','warn');return;}
  const ext=(url.split('.').pop()||'').toLowerCase().split('?')[0];
  const isImage=['jpg','jpeg','png','gif','webp'].includes(ext);
  const isPdf=ext==='pdf';
  const fileName=decodeURIComponent(url.split('/').pop()||'파일');
  Modal.open({
    title:'📎 '+H.e(title||'파일 미리보기'),
    size:'mlg',
    foot:`<a href="${H.e(url)}" download target="_blank" class="btn bout bsm" style="font-size:12px">⬇ 다운로드</a>
          <button class="btn bout" onclick="Modal.close()">닫기</button>`,
    body: isImage
      ? `<div style="text-align:center;padding:10px">
           <img src="${H.e(url)}" alt="첨부 이미지"
             style="max-width:100%;max-height:70vh;border-radius:6px;box-shadow:0 2px 12px #0002">
         </div>`
      : isPdf
      ? `<div style="height:70vh">
           <iframe src="${H.e(url)}" style="width:100%;height:100%;border:none;border-radius:6px"></iframe>
         </div>`
      : `<div style="text-align:center;padding:40px">
           <div style="font-size:40px;margin-bottom:12px">📄</div>
           <div style="font-size:13px;color:var(--tm);margin-bottom:16px">${H.e(fileName)}</div>
           <a href="${H.e(url)}" download target="_blank" class="btn bpri">⬇ 다운로드</a>
         </div>`,
  });
},

/* 일괄 보관 [v2.394] */
async _mentionBulkSave(){
  const ids=[...document.querySelectorAll('.mention-chk:checked')].map(c=>Number(c.dataset.id));
  if(!ids.length){Toast.show('보관할 멘션을 선택하세요.','warn');return;}
  for(const id of ids){
    const m=(DB.mentions||[]).find(m=>m.id===id);
    if(m&&!m.saved){await SB.updateMention(id,{read:m.read,saved:true});m.saved=true;}
  }
  Toast.show(ids.length+'건을 보관함에 추가했습니다.','ok');
  Pages._mentionRefresh();
},

/* ── 멘션 상세 팝업 [v2.394] ── */
async _mentionDetail(id){
  /* [v2.394] 멘션 상세 — 파일 미리보기+다운로드, 문자열 방식으로 안전하게 처리 */
  const m=(DB.mentions||[]).find(m=>Number(m.id)===Number(id));
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return;}
  const me=Auth._cur||'admin';
  if(!m.read&&m.from!==me){
    await SB.updateMention(id,{read:true});
    m.read=true;
    Pages._updateMentionBadge&&Pages._updateMentionBadge();
    Pages._mentionRefresh&&Pages._mentionRefresh();
  }
  const ts=(m.created_at||'').slice(0,16).replace('T',' ');
  const mid=Number(m.id);
  const mfrom=H.e(m.from||'');

  /* 파일 블록 — 순수 문자열 조합으로 백틱 충돌 방지 */
  let fileHtml='';
  if(m.file_url){
    const fu=m.file_url;
    const fn=H.e(fu.split('/').pop()||'첨부파일');
    const fuE=H.e(fu);
    fileHtml=''
      +'<div style="margin-top:10px;padding:10px 12px;background:#eff6ff;'
      +'border:1px solid #bfdbfe;border-radius:6px;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:20px">📎</span>'
      +'<span style="font-size:12px;color:#1d4ed8;flex:1;overflow:hidden;'
      +'text-overflow:ellipsis;white-space:nowrap">'+fn+'</span>'
      +'<button class="btn bxs bblu" style="font-size:11px;padding:3px 12px"'
      +' data-fu="'+fuE+'" onclick="Pages._mentionFilePreview(this.dataset.fu)">👁 미리보기</button>'
      +'<a href="'+fuE+'" download target="_blank"'
      +' class="btn bxs bout" style="font-size:11px;padding:3px 12px">⬇ 다운로드</a>'
      +'</div>';
  }

  const toLabel=m.to==='all'?'📢 전체공지':H.e(m.to||'-');

  Modal.open({
    title:'💬 멘션 상세',
    size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'
        +'<button class="btn bgry bsm" data-mid="'+mid+'" data-from="'+mfrom+'"'
        +' onclick="Modal.close();Pages._mentionReply(+this.dataset.mid,this.dataset.from)">↩ 답장</button>',
    body:'<div class="card" style="padding:14px 18px">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">'
        +'<div class="ir"><div class="il">발신자</div>'
        +'<div class="iv" style="font-weight:700">'+H.e(m.from||'-')+'</div></div>'
        +'<div class="ir"><div class="il">수신자</div>'
        +'<div class="iv">'+toLabel+'</div></div>'
        +'<div class="ir"><div class="il">부서</div>'
        +'<div class="iv">'+H.e(m.dept||'-')+'</div></div>'
        +'<div class="ir"><div class="il">시간</div>'
        +'<div class="iv" style="color:var(--tm)">'+ts+'</div></div>'
        +(m.ref?'<div class="ir" style="grid-column:1/-1"><div class="il">참조</div>'
               +'<div class="iv"><span class="badge bgry">'+H.e(m.ref)+'</span></div></div>':'')
        +'</div>'
        +'<div style="margin-top:10px;padding:12px;background:var(--bg2);'
        +'border-radius:6px;font-size:14px;line-height:1.7;white-space:pre-wrap">'
        +H.e(m.text||m.message||'')+'</div>'
        +fileHtml
        +'</div>',
  });
},

/* ── 새 멘션 작성 폼 [v2.394] ── */
async _mentionForm(){
  /* [v2.394] 사용자 목록 없으면 SB에서 로드 */
  if(!(DB.users||[]).length){
    try{
      const fresh=await SB.getUsers();
      if(Array.isArray(fresh)&&fresh.length) DB.users=fresh;
    }catch(e){console.warn('[mentionForm] users 로드 실패',e);}
  }
  const users=(DB.users||[]).filter(u=>u.active!==0&&u.active!==false&&!u.pending);
  const me=Auth._u;
  const userOpts=users.map(u=>
    `<option value="${H.e(u.username)}">${H.e(u.name||u.username)} (${H.e(u.department||'')})</option>`
  ).join('');
  Modal.open({
    title:'✏️ 새 멘션 작성',
    size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._mentionSend()">📨 전송</button>',
    body:`<div class="fg2">
      <div class="fgroup ff">
        <label class="fl req">수신자</label>
        <select class="fc" id="mnTo" multiple style="height:90px">
          <option value="all">📢 전체 공지</option>
          ${userOpts}
        </select>
        <div style="font-size:11px;color:var(--tm);margin-top:4px">Ctrl+클릭으로 여러 명 선택</div>
      </div>
      <div class="fgroup ff">
        <label class="fl">참조 (업무 링크)</label>
        <input class="fc" id="mnRef" placeholder="예) NC-20260601-001, HOLD-001">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req">내용</label>
        <textarea class="fc" id="mnText" rows="5" placeholder="@사용자명 태그 또는 내용 입력...
업무 관련 멘션, 부적합 알림, 협조 요청 등"></textarea>
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·이미지·문서)</span></label>
        <input class="fc" type="file" id="mnFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.hwp"
          style="padding:5px;font-size:12px">
      </div>
    </div>`,
  });
},

/* ── 멘션 전송 [v2.394] ── */
async _mentionSend(){
  const toSel=document.getElementById('mnTo');
  const toList=toSel?Array.from(toSel.selectedOptions).map(o=>o.value):[];
  const text=(document.getElementById('mnText')?.value||'').trim();
  const ref=(document.getElementById('mnRef')?.value||'').trim();
  const me=Auth._u;
  const meName=me?.name||me?.username||'관리자';
  const dept=me?.department||'';
  if(!toList.length){Toast.show('수신자를 선택하세요.','warn');return;}
  if(!text){Toast.show('내용을 입력하세요.','warn');return;}

  /* [v2.394] 파일 업로드 먼저 처리 */
  let file_url=null;
  const fileEl=document.getElementById('mnFile');
  if(fileEl?.files?.length){
    const file=fileEl.files[0];
    Toast.show('파일 업로드 중... ('+file.name+')','info');
    try{
      const uploadRes=await SB.uploadFile('mentions',file);
      if(uploadRes?.url){
        file_url=uploadRes.url;
        Toast.show('파일 업로드 완료','ok');
      } else {
        Toast.show('파일 업로드 실패 — Storage 버킷을 확인하세요','warn',4000);
        console.warn('[mentionSend] uploadFile 반환값:', uploadRes);
      }
    }catch(uploadErr){
      console.error('[mentionSend] 파일 업로드 오류:', uploadErr);
      Toast.show('파일 업로드 오류: '+uploadErr.message,'err',5000);
    }
  }

  /* 수신자별로 전송 */
  let success=0;
  for(const to of toList){
    const row={
      from:meName, to, to_list:toList,
      text, message:text, dept, ref,
      reply_to:null, read:false,
      file_url,                          /* [v2.394] 파일 URL */
      created_at:new Date().toISOString(),
    };
    const res=await SB.addMention(row);
    if(res.ok) success++;
  }
  if(success>0){
    Modal.close();
    Toast.show(`${success}명에게 멘션을 전송했습니다.`,'ok');
    /* 로컬 갱신 */
    const fresh=await SB.getMentions();
    if(Array.isArray(fresh)) DB.mentions=fresh;
    Pages._mentionRefresh();
  } else {
    Toast.show('전송에 실패했습니다.','err');
  }
},

/* ── 읽음 처리 [v2.394] ── */
async _mentionMarkRead(id){
  await SB.updateMention(id,{read:true});
  const m=(DB.mentions||[]).find(m=>m.id===id);
  if(m) m.read=true;
  Pages._updateMentionBadge();
  Pages._mentionRefresh();
},

/* ── 전체 읽음 [v2.394] ── */
async _mentionMarkAllRead(){
  const me=Auth._cur||'admin';
  const unread=(DB.mentions||[]).filter(m=>
    (m.to===me||(m.to_list||[]).includes(me))&&!m.read&&m.from!==me
  );
  for(const m of unread){
    await SB.updateMention(m.id,{read:true});
    m.read=true;
  }
  Pages._updateMentionBadge();
  Pages._mentionRefresh();
  Toast.show('전체 읽음 처리했습니다.','ok');
},

/* ── TopNav 배지 갱신 [v2.394] ── */
_updateMentionBadge(){
  const me=Auth._cur||'admin';
  const unread=(DB.mentions||[]).filter(m=>
    (m.to===me||(m.to_list||[]).includes(me))&&!m.read
  ).length;
  /* 상단 알림 배지 */
  document.querySelectorAll('.mention-badge,.notif-badge').forEach(el=>{
    el.textContent=unread>0?unread:'';
    el.style.display=unread>0?'inline-block':'none';
  });
  /* 사이드바 배지 */
  const sideEl=document.querySelector('.mc-card-sub[onclick*="mentions"] .badge');
  if(sideEl){sideEl.textContent=unread;sideEl.style.display=unread>0?'':'none';}
},

/* ════════════════════════════════════════
   검사 고도화 — 검사 성적서 [v2.394]
   ════════════════════════════════════════ */
async insp_cert(){
  /* [v2.394] spin → 레이아웃 없을 때만, 있으면 데이터만 갱신 */
  const w=document.getElementById('pw');
  if(!w.querySelector('#certTbl')){
    w.innerHTML='<div class="spin"></div>';
  }
  try{
    const fresh=await SB.getInspections();
    if(Array.isArray(fresh)) DB.inspections=fresh;
  }catch(e){ console.warn('[insp_cert] 조회 실패',e); }

  if(w.querySelector('#certTbl')){Pages._certRefreshTable();return;}
  const types=['수입','공정','구매','외주','최종'];
  w.innerHTML=`
    <div class="ph">
      <div><div class="ptit">📜 검사 성적서</div>
        <div class="psub">검사 완료 기록 · 합부 판정 이력 · 성적서 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._certForm()">+ 성적서 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="certSearch" placeholder="검사번호, 품목코드, 품목명 검색..."
          oninput="Pages._certRefreshTable()">
      </div>
      <select class="fsel" id="certTypeF" onchange="Pages._certRefreshTable()">
        <option value="">전체 유형</option>
        ${types.map(t=>`<option>${t}</option>`).join('')}
      </select>
      <select class="fsel" id="certResultF" onchange="Pages._certRefreshTable()">
        <option value="">전체 판정</option>
        <option>합격</option><option>불합격</option><option>조건부합격</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('insp_cert')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="certTbl"></div>`;
  Pages._certRefreshTable();
},

_certRefreshTable(){
  const q=(document.getElementById('certSearch')?.value||'').toLowerCase();
  const tp=document.getElementById('certTypeF')?.value||'';
  const rs=document.getElementById('certResultF')?.value||'';
  const data=(DB.inspections||[]).filter(r=>r.cert_no||r.result);
  const filtered=data.filter(r=>{
    const mQ=!q||(r.insp_no||'').toLowerCase().includes(q)||(r.item_code||'').toLowerCase().includes(q)||(r.item_name||'').toLowerCase().includes(q);
    const mT=!tp||r.type===tp;
    const mR=!rs||r.result===rs;
    return mQ&&mT&&mR;
  });
  Tbl.render({
    el:'#certTbl',
    cols:[
      {key:'insp_no',    label:'검사번호',  w:'130px', req:true},
      {key:'type',       label:'검사유형',  w:'70px',  req:true,
        render:v=>`<span class="badge bblu" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'item_code',  label:'품목코드',  w:'100px'},
      {key:'item_name',  label:'품목명',    w:'140px'},
      {key:'lot_no',     label:'LOT번호',   w:'120px'},
      {key:'insp_date',  label:'검사일',    w:'90px',  req:true},
      {key:'qty',        label:'검사수량',  w:'70px',  align:'right'},
      {key:'result',     label:'판정',      w:'90px',
        render:v=>`<span class="badge ${v==='합격'?'bgrn':v==='불합격'?'bred':'bamb'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'inspector',  label:'검사원',    w:'70px'},
      {key:'cert_no',    label:'성적서번호', w:'120px'},
      {key:'note',       label:'비고'},
    ],
    data:filtered,
    onRow:row=>{
      Modal.open({
        title:`📜 검사 성적서 — ${H.e(row.insp_no||'-')}`,
        size:'mlg',
        foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>',
        body:`<div class="card" style="padding:16px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div class="ir"><div class="il">검사번호</div><div class="iv" style="font-weight:700">${H.e(row.insp_no||'-')}</div></div>
          <div class="ir"><div class="il">검사유형</div><div class="iv"><span class="badge bblu">${H.e(row.type||'-')}</span></div></div>
          <div class="ir"><div class="il">품목코드</div><div class="iv">${H.e(row.item_code||'-')}</div></div>
          <div class="ir"><div class="il">품목명</div><div class="iv">${H.e(row.item_name||'-')}</div></div>
          <div class="ir"><div class="il">LOT번호</div><div class="iv">${H.e(row.lot_no||'-')}</div></div>
          <div class="ir"><div class="il">검사일</div><div class="iv">${H.e(row.insp_date||'-')}</div></div>
          <div class="ir"><div class="il">검사수량</div><div class="iv">${row.qty||'-'}</div></div>
          <div class="ir"><div class="il">판정</div><div class="iv"><span class="badge ${row.result==='합격'?'bgrn':'bred'}">${H.e(row.result||'-')}</span></div></div>
          <div class="ir"><div class="il">검사원</div><div class="iv">${H.e(row.inspector||'-')}</div></div>
          <div class="ir"><div class="il">성적서번호</div><div class="iv">${H.e(row.cert_no||'-')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">비고</div><div class="iv">${H.e(row.note||'-')}</div></div>
        </div></div>`,
      });
    },
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      const _doDelete=async()=>{
        const res=await SB._softDelete('inspections',numIds);
        if(!res.ok) return;
        DB.inspections=DB.inspections.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(numIds.length+'건 삭제','ok');
        Pages._certRefreshTable();
      };
      Modal.confirm({title:'🗑️ 성적서 삭제',msg:`선택 ${ids.length}건을 삭제하시겠습니까?`,danger:true,onOk:_doDelete});
    }
  });
},

/* ════════════════════════════════════════
   검사 고도화 — Hold 관리 [v2.394]
   ════════════════════════════════════════ */
async insp_hold(){
  /* [v2.394] SB holds 로드 — spin 최초1회 hasLayout */
  const w=document.getElementById('pw');
  const hasLayout=!!w.querySelector('#holdTbl');
  if(!hasLayout) w.innerHTML='<div class="spin"></div>';
  try{
    const fresh=await SB.getHolds();
    if(Array.isArray(fresh)) DB.holds=fresh;
    else if(!DB.holds) DB.holds=[];
  }catch(e){console.warn('[insp_hold] SB 로드 실패',e);if(!DB.holds)DB.holds=[];}
  if(hasLayout){Pages._holdRefreshTable();return;}
  w.innerHTML=`
    <div class="ph">
      <div><div class="ptit">🚫 Hold 관리</div>
        <div class="psub">불합격 LOT Hold 발령 · 처리 · 해제 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._holdForm()">+ Hold 발령 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="holdSearch" placeholder="Hold번호, 품목코드, LOT 검색..."
          oninput="Pages._holdRefreshTable()">
      </div>
      <select class="fsel" id="holdStatusF" onchange="Pages._holdRefreshTable()">
        <option value="">전체 상태</option>
        <option>Hold중</option><option>조사중</option><option>해제</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('insp_hold')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="holdTbl"></div>`;
  Pages._holdRefreshTable();
},

_holdRefreshTable(){
  const q=(document.getElementById('holdSearch')?.value||'').toLowerCase();
  const st=document.getElementById('holdStatusF')?.value||'';
  const data=DB.holds||[];
  const filtered=data.filter(r=>{
    const mQ=!q||(r.hold_no||'').toLowerCase().includes(q)||(r.item_code||'').toLowerCase().includes(q)||(r.lot_no||'').toLowerCase().includes(q);
    const mS=!st||r.status===st;
    return mQ&&mS;
  });
  Tbl.render({
    el:'#holdTbl',
    cols:[
      {key:'hold_no',   label:'Hold번호',   w:'130px', req:true},
      {key:'lot_no',    label:'LOT번호',    w:'120px', req:true},
      {key:'item_code', label:'품목코드',   w:'100px'},
      {key:'item_name', label:'품목명',     w:'130px'},
      {key:'qty',       label:'Hold수량',  w:'80px', align:'right'},
      {key:'reason',    label:'Hold사유'},
      {key:'issued_by', label:'발령자',    w:'70px'},
      {key:'issued_date',label:'발령일',   w:'90px', req:true},
      {key:'status',    label:'상태',      w:'80px',
        render:v=>`<span class="badge ${v==='Hold중'?'bred':v==='해제'?'bgrn':'bamb'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'resolved_date',label:'처리일', w:'90px'},
    ],
    data:filtered,
    onRow:row=>Pages._holdDetail(row),
    onDel:async(ids)=>{
      const _doDelete=async()=>{
        /* [v2.394] SB 소프트 삭제 */
        const numIds=ids.map(Number);
        if(numIds.length===1){
          await SB.deleteHold(numIds[0]);
        } else {
          await SB._softDelete('holds',numIds);
        }
        DB.holds=(DB.holds||[]).filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(ids.length+'건 삭제되었습니다.','ok');
        Pages._holdRefreshTable();
      };
      Modal.confirm({title:'🗑️ Hold 삭제',msg:`선택 ${ids.length}건 삭제하시겠습니까?`,danger:true,onOk:_doDelete});
    }
  });
},

_holdDetail(row){
  Modal.open({
    title:`🚫 Hold 상세 — ${H.e(row.hold_no||'-')}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bpri" onclick="Modal.close();Pages._holdForm(${JSON.stringify(row).replace(/</g,'\u003c')})">✏️ 수정</button>`,
    body:`<div class="card" style="padding:16px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div class="ir"><div class="il">Hold번호</div><div class="iv" style="font-weight:700">${H.e(row.hold_no||'-')}</div></div>
      <div class="ir"><div class="il">상태</div><div class="iv"><span class="badge ${row.status==='Hold중'?'bred':row.status==='해제'?'bgrn':'bamb'}">${H.e(row.status||'-')}</span></div></div>
      <div class="ir"><div class="il">품목코드</div><div class="iv">${H.e(row.item_code||'-')}</div></div>
      <div class="ir"><div class="il">LOT번호</div><div class="iv">${H.e(row.lot_no||'-')}</div></div>
      <div class="ir"><div class="il">Hold수량</div><div class="iv">${row.qty||'-'}</div></div>
      <div class="ir"><div class="il">발령일</div><div class="iv">${H.e(row.issued_date||'-')}</div></div>
      <div class="ir" style="grid-column:1/-1"><div class="il">Hold사유</div><div class="iv">${H.e(row.reason||'-')}</div></div>
    </div></div>`,
  });
},

_holdForm(row=null){
  const isEdit=!!row;
  Modal.open({
    title:isEdit?`✏️ Hold 수정 — ${row.hold_no}`:'+ Hold 발령',
    size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bgry bsm" onclick="Modal.close();Pages._mentionForm()" title="Hold 관련 멘션">💬 멘션</button>'
        +'<button class="btn bpri" onclick="Pages._holdSave()">저장</button>',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">Hold번호</label>
        <input class="fc" id="hdNo" value="${H.e(isEdit?row.hold_no||'':'HOLD-'+H.today().replace(/-/g,''))}" ${isEdit?'readonly':''}></div>
      <div class="fgroup"><label class="fl req">LOT번호</label>
        <input class="fc" id="hdLot" value="${isEdit?H.e(row.lot_no||''):''}">
        </div>
      <div class="fgroup"><label class="fl">품목코드</label>
        <input class="fc" id="hdCode" value="${isEdit?H.e(row.item_code||''):''}"></div>
      <div class="fgroup"><label class="fl req">발령일</label>
        <input class="fc" type="date" id="hdDate" value="${isEdit?row.issued_date||H.today():H.today()}"></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl req">Hold사유</label>
        <textarea class="fc" id="hdReason" rows="3">${H.e(isEdit?row.reason||'':'')}</textarea></div>
      <div class="fgroup"><label class="fl">작성자</label>
        <input class="fc" id="hdCreatedBy" value="${H.e(isEdit?row.created_by||'':Auth._u?.name||'')}"></div>
      <div class="fgroup"><label class="fl">담당자</label>
        <input class="fc" id="hdAssignee" value="${H.e(isEdit?row.assignee||'':'' )}"></div>
    </div>`,
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bgry bsm" onclick="Modal.close();Pages._mentionForm()" title="Hold 관련 멘션">💬 멘션</button>'
      +'<button class="btn bpri" onclick="Pages._holdSave()">💾 저장</button>',
  });
  window._holdEditRow=row;
},

async _holdSave(){
  /* [v2.394] SB 연동 저장 */
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('hdNo'),lot=g('hdLot'),date=g('hdDate'),reason=g('hdReason'),code=g('hdCode');
  if(!no){Toast.show('Hold번호를 입력하세요.','warn');return;}
  if(!lot){Toast.show('LOT번호를 입력하세요.','warn');return;}
  if(!reason){Toast.show('Hold사유를 입력하세요.','warn');return;}
  const row=window._holdEditRow;
  const created_by=g('hdCreatedBy')||Auth._u?.name||'';
  const assignee=g('hdAssignee')||'';
  const newRow={hold_no:no,lot_no:lot,item_code:code,issued_date:date,reason,
    status:row?.status||'Hold중',issued_by:Auth._u?.name||'',
    created_by, assignee};

  let saved=false;
  if(row&&row.id){
    const res=await SB.updateHold(row.id,newRow);
    if(!res.ok) return;
    Toast.show('수정되었습니다.','ok');
    saved=true;
  } else {
    const res=await SB.addHold(newRow);
    if(!res.ok) return;
    Toast.show('Hold가 발령되었습니다.','ok');
    saved=true;
  }

  /* [v2.394] Hold 발령 시 자동 멘션 전송 */
  if(saved){
    try{
      /* 담당자가 지정된 경우 해당 담당자에게, 없으면 all */
      const toUsers = assignee
        ? (DB.users||[]).filter(u=>(u.name||u.username)===assignee).map(u=>u.username)
        : ['all'];
      const targets = toUsers.length>0 ? toUsers : ['all'];
      const me = Auth._u?.name || Auth._u?.username || '시스템';
      const dept = Auth._u?.department || '';
      const holdMsg = row?.id
        ? '[Hold 수정] '+no+' / LOT: '+lot+(code?' / 품목:'+code:'')+' / 사유: '+reason
        : '[Hold 발령] '+no+' / LOT: '+lot+(code?' / 품목:'+code:'')+' / 사유: '+reason;

      for(const to of targets){
        await SB.addMention({
          from:me, to, to_list:targets,
          text:holdMsg, message:holdMsg,
          dept, ref:'hold:'+no,
          reply_to:null, read:false,
          file_url:null,
          created_at:new Date().toISOString(),
        });
      }
      Toast.show('멘션 전송 완료','ok');
      /* 멘션 목록 갱신 */
      const freshM=await SB.getMentions();
      if(Array.isArray(freshM)) DB.mentions=freshM;
      Pages._updateMentionBadge&&Pages._updateMentionBadge();
    }catch(mentionErr){
      console.warn('[holdSave] 멘션 전송 실패:',mentionErr);
    }
  }

  Modal.close();
  Pages._holdRefreshTable();
},

/* ════════════════════════════════════════
   검사 고도화 — 재검사 관리 [v2.394]
   ════════════════════════════════════════ */
async insp_reinsp(){
  /* [v2.394] SB reinspections 로드 — spin 최초1회 */
  const w=document.getElementById('pw');
  if(!w.querySelector('#reinspTbl')){
    w.innerHTML='<div class="spin"></div>';
  }
  try{
    const fresh=await SB.getReinspections();
    if(Array.isArray(fresh)) DB.reinspections=fresh;
    else if(!DB.reinspections) DB.reinspections=[];
  }catch(e){console.warn('[insp_reinsp] SB 로드 실패',e);if(!DB.reinspections)DB.reinspections=[];}
  if(w.querySelector('#reinspTbl')){Pages._reinspRefreshTable();return;}
  w.innerHTML=`
    <div class="ph">
      <div><div class="ptit">🔄 재검사 관리</div>
        <div class="psub">불합격 LOT 재검사 요청 · 결과 · 이력 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._reinspForm()">+ 재검사 요청 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="reinspSearch" placeholder="재검사번호, 품목코드, LOT 검색..."
          oninput="Pages._reinspRefreshTable()">
      </div>
      <select class="fsel" id="reinspStatusF" onchange="Pages._reinspRefreshTable()">
        <option value="">전체 상태</option>
        <option>요청</option><option>진행중</option><option>합격</option><option>불합격</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('insp_reinsp')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="reinspTbl"></div>`;
  Pages._reinspRefreshTable();
},

_reinspRefreshTable(){
  const q=(document.getElementById('reinspSearch')?.value||'').toLowerCase();
  const st=document.getElementById('reinspStatusF')?.value||'';
  const data=DB.reinspections||[];
  const filtered=data.filter(r=>{
    const mQ=!q||(r.reinsp_no||'').toLowerCase().includes(q)||(r.item_code||'').toLowerCase().includes(q)||(r.lot_no||'').toLowerCase().includes(q);
    const mS=!st||r.status===st;
    return mQ&&mS;
  });
  Tbl.render({
    el:'#reinspTbl',
    cols:[
      {key:'reinsp_no',  label:'재검사번호', w:'130px', req:true},
      {key:'orig_no',    label:'원검사번호', w:'120px'},
      {key:'lot_no',     label:'LOT번호',   w:'120px', req:true},
      {key:'item_code',  label:'품목코드',  w:'100px'},
      {key:'item_name',  label:'품목명',    w:'130px'},
      {key:'req_date',   label:'요청일',    w:'90px',  req:true},
      {key:'insp_date',  label:'검사일',    w:'90px'},
      {key:'inspector',  label:'검사원',    w:'70px'},
      {key:'result',     label:'판정',      w:'80px',
        render:v=>v?`<span class="badge ${v==='합격'?'bgrn':v==='불합격'?'bred':'bamb'}" style="font-size:10px">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'status',     label:'진행상태',  w:'80px',
        render:v=>`<span class="badge ${v==='합격'?'bgrn':v==='불합격'?'bred':v==='진행중'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'note',       label:'비고'},
    ],
    data:filtered,
    onRow:row=>{
      Modal.open({
        title:`🔄 재검사 상세 — ${H.e(row.reinsp_no||'-')}`,
        size:'mlg',
        foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>',
        body:`<div class="card" style="padding:16px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div class="ir"><div class="il">재검사번호</div><div class="iv" style="font-weight:700">${H.e(row.reinsp_no||'-')}</div></div>
          <div class="ir"><div class="il">원검사번호</div><div class="iv">${H.e(row.orig_no||'-')}</div></div>
          <div class="ir"><div class="il">LOT번호</div><div class="iv">${H.e(row.lot_no||'-')}</div></div>
          <div class="ir"><div class="il">요청일</div><div class="iv">${H.e(row.req_date||'-')}</div></div>
          <div class="ir"><div class="il">판정</div><div class="iv"><span class="badge ${row.result==='합격'?'bgrn':'bred'}">${H.e(row.result||'미결')}</span></div></div>
          <div class="ir"><div class="il">진행상태</div><div class="iv">${H.e(row.status||'-')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">비고</div><div class="iv">${H.e(row.note||'-')}</div></div>
        </div></div>`,
      });
    },
    onDel:async(ids)=>{
      const _doDelete=async()=>{
        /* [v2.394] SB 소프트 삭제 */
        const numIds=ids.map(Number);
        if(numIds.length===1){
          await SB.deleteReinsp(numIds[0]);
        } else {
          await SB._softDelete('reinspections',numIds);
        }
        DB.reinspections=(DB.reinspections||[]).filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(ids.length+'건 삭제되었습니다.','ok');
        Pages._reinspRefreshTable();
      };
      Modal.confirm({title:'🗑️ 재검사 삭제',msg:`선택 ${ids.length}건 삭제하시겠습니까?`,danger:true,onOk:_doDelete});
    }
  });
},

_reinspForm(row=null){
  const isEdit=!!row;
  Modal.open({
    title:isEdit?'✏️ 재검사 수정':'+ 재검사 요청',
    size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._reinspSave()">저장</button>',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">재검사번호</label>
        <input class="fc" id="riNo" value="${isEdit?H.e(row.reinsp_no||''):'REINSP-'+H.today().replace(/-/g,'')}" ${isEdit?'readonly':''}></div>
      <div class="fgroup"><label class="fl">원검사번호</label>
        <input class="fc" id="riOrig" value="${H.e(isEdit?row.orig_no||'':'' )}"></div>
      <div class="fgroup"><label class="fl req">LOT번호</label>
        <input class="fc" id="riLot" value="${H.e(isEdit?row.lot_no||'':'' )}"></div>
      <div class="fgroup"><label class="fl">품목코드</label>
        <input class="fc" id="riCode" value="${H.e(isEdit?row.item_code||'':'' )}"></div>
      <div class="fgroup"><label class="fl">품목명</label>
        <input class="fc" id="riItem" value="${H.e(isEdit?row.item_name||'':'' )}"></div>
      <div class="fgroup"><label class="fl req">요청일</label>
        <input class="fc" type="date" id="riDate" value="${isEdit?row.req_date||H.today():H.today()}"></div>
      <div class="fgroup"><label class="fl">검사일</label>
        <input class="fc" type="date" id="riInspDate" value="${isEdit?row.insp_date||'':''  }"></div>
      <div class="fgroup"><label class="fl">검사원</label>
        <input class="fc" id="riInspector" value="${H.e(isEdit?row.inspector||Auth._u?.name||'':'' )}"></div>
      <div class="fgroup"><label class="fl">판정</label>
        <select class="fc" id="riResult">
          ${['','합격','불합격','보류'].map(v=>'<option value="'+v+'" '+(( isEdit?row.result||'':'')===v?'selected':'')+'>'+( v||'선택')+'</option>').join('')}
        </select></div>
      <div class="fgroup"><label class="fl">진행상태</label>
        <select class="fc" id="riStatus">
          ${['요청','검사중','완료','반려'].map(v=>'<option value="'+v+'" '+((isEdit?row.status||'요청':'요청')===v?'selected':'')+'>'+v+'</option>').join('')}
        </select></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">비고</label>
        <textarea class="fc" id="riNote" rows="2">${H.e(isEdit?row.note||'':'' )}</textarea></div>
    </div>`,
  });
  window._reinspEditRow=row;
},

async _reinspSave(){
  /* [v2.394] SB 연동 저장 */
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('riNo'),lot=g('riLot'),date=g('riDate'),orig=g('riOrig');
  if(!no){Toast.show('재검사번호를 입력하세요.','warn');return;}
  if(!lot){Toast.show('LOT번호를 입력하세요.','warn');return;}
  const row=window._reinspEditRow;
  /* [v2.394] 추가 필드 */
  const item_code=g('riCode'), item_name=g('riItem');
  const insp_date=g('riInspDate'), inspector=g('riInspector');
  const result=document.getElementById('riResult')?.value||'';
  const status_val=document.getElementById('riStatus')?.value||'요청';
  const note=g('riNote');
  const newRow={reinsp_no:no,lot_no:lot,orig_no:orig,req_date:date,
    item_code,item_name,insp_date:insp_date||null,inspector,
    result,status:status_val,note,
    created_by:Auth._u?.name||''};
  if(row&&row.id){
    const res=await SB.updateReinsp(row.id,newRow);
    if(!res.ok) return;
  } else {
    const res=await SB.addReinsp(newRow);
    if(!res.ok) return;
  }
  Modal.close();
  Toast.show('저장되었습니다.','ok');
  Pages._reinspRefreshTable();
},

_certForm(){
  Toast.show('성적서 등록은 각 검사(수입/공정 등)에서 검사 결과 저장 시 자동 생성됩니다.','info');
},
/* ══════════════════════════════════════════
   설정 [v2.394] — 일반설정 / 사용자 등록 / SB 대시보드
   ══════════════════════════════════════════ */
async settings(){
  /* [v2.394] settings 복구 — 3탭: ⚙️일반설정 / 👥사용자관리 / 🔌SB대시보드 */
  const w=document.getElementById('pw');
  if(!Auth._u){await new Promise(r=>setTimeout(r,150));}
  if(!DB.users||DB.users.length===0){
    const fresh=await SB.getUsers();
    if(fresh&&fresh.length>0) DB.users=fresh;
  }
  const isAdmin=Auth._u?.role==='admin';
  /* [v2.399] 공지사항 최신 로드 — Supabase 영속화
     [버그수정] RLS 오류/네트워크 오류 시 App.notices(더미) 유지
     [버그수정] notices 테이블 미생성 시 빈 배열 대신 기존 목록 유지 */
  try{
    var freshNotices=await SB.getNotices();
    /* 정상 배열이고 length > 0 이거나 DB가 확실히 연결된 경우만 덮어씀
       → 빈 배열 반환 = 테이블 없음/오류 가능성 → 기존 더미 유지 */
    if(Array.isArray(freshNotices) && (freshNotices.length > 0 || !window._noticesDBChecked)){
      App.notices = freshNotices;
      window._noticesDBChecked = true;  // 한 번이라도 성공하면 빈 배열도 허용
    }
  }catch(e){ console.warn('[settings] 공지 로드 실패:', e.message); }
  const notices=App.notices;

  const renderTab=(tab)=>{
    document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
    document.querySelectorAll('.stab-pane').forEach(p=>p.style.display=p.dataset.tab===tab?'block':'none');
    if(tab==='sbdash') setTimeout(()=>Pages._renderSbDash(),0);
  };

  const MENU_GROUPS=[
    {group:'기준정보', pages:[
      {page:'items',    label:'품목 등록'},
      {page:'vendors',  label:'거래처 등록'},
    ]},
    {group:'품질관리', pages:[
      {page:'quality_dash', label:'품질현황 대시보드'},
      {page:'insp_in',  label:'수입검사'},
      {page:'insp_pr',  label:'공정검사'},
      {page:'insp_pu',  label:'구매검사'},
      {page:'insp_ou',  label:'외주검사'},
      {page:'insp_fi',  label:'최종검사'},
      {page:'nc',       label:'부적합 관리'},
    ]},
    {group:'계측기관리', pages:[
      {page:'equip',    label:'장비 현황'},
      {page:'cal',      label:'교정 관리'},
    ]},
    {group:'문서관리', pages:[
      {page:'docs',     label:'문서 목록'},
      {page:'car',      label:'시정조치'},
    ]},
  ];
  const ROLES=['admin','manager','user','viewer'];
  const ROLE_LABEL={admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'};
  const ROLE_COLOR={admin:'background:#7c3aed;color:#fff',manager:'background:#2563eb;color:#fff',
    user:'background:#059669;color:#fff',viewer:'background:#64748b;color:#fff'};
  const DEFAULT_PERM={admin:true,manager:true,user:true,viewer:false};
  const App_perms=App.perms=App.perms||{};
  const permKey=(page,role)=>`${page}_${role}`;
  const getPerm=(page,role)=>App_perms[permKey(page,role)]??DEFAULT_PERM[role]??false;

  const renderUserMgmt=()=>{
    const allUsers=DB.users;
    const pendingUsers=allUsers.filter(u=>u.pending||(!u.active&&u.active!==undefined));
    const activeUsers=allUsers.filter(u=>!u.pending&&u.active!==0);
    let no=0;
    return (pendingUsers.length?`<div class="card" style="margin-bottom:14px;border:1px solid #f59e0b">
      <div class="ch" style="background:#fef3c7"><div class="ct">⏳ 승인 대기 (${pendingUsers.length}명)</div></div>
      <div class="ts"><table class="dt"><thead><tr>
        <th>아이디</th><th>이름</th><th>부서</th><th>이메일</th><th>신청일</th><th>처리</th>
      </tr></thead><tbody>${pendingUsers.map(u=>`<tr>
        <td><strong>${H.e(u.username)}</strong></td><td>${H.e(u.name)}</td>
        <td>${H.e(u.department||'-')}</td><td>${H.e(u.email||'-')}</td>
        <td>${H.e(u.created_at||'-')}</td>
        <td style="display:flex;gap:4px">
          <button class="btn bsm bgrn" onclick="Pages._approveUser(${u.id},'${H.e(u.username)}')">✅ 승인</button>
          <button class="btn bsm berr" onclick="Pages._rejectUser(${u.id},'${H.e(u.username)}')">❌ 거절</button>
        </td>
      </tr>`).join('')}</tbody></table></div></div>`:'')
    +`<div class="card" style="margin-bottom:14px">
      <div class="ch"><div class="ct">👥 사용자 목록 (${activeUsers.length}명)</div>
        <button class="btn bpri bsm" onclick="Pages._uForm(null)">+ 사용자 등록</button>
      </div>
      <div class="ts"><table class="dt" style="font-size:12px">
        <thead><tr>
          <th style="width:28px"><input type="checkbox" id="umgmtAllChk"
            onchange="document.querySelectorAll('.umgmt-chk').forEach(c=>c.checked=this.checked)"></th>
          <th style="width:36px">No</th>
          <th>이름</th><th>아이디</th><th>부서</th>
          <th style="width:110px">연락처</th>
          <th style="width:160px">E-MAIL</th>
          <th>권한</th><th>상태</th>
          <th style="width:90px">등록일</th>
          <th style="width:90px">수정일</th>
          <th style="width:110px">최근 로그인</th>
          <th>비밀번호</th>
          <th style="width:56px">수정</th>
        </tr></thead>
        <tbody>${activeUsers.length===0
          ?'<tr><td colspan="13" style="text-align:center;padding:20px;color:var(--tm)">등록된 사용자가 없습니다.</td></tr>'
          :activeUsers.map(u=>{
            no++;
            const roleOpts=ROLES.map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLE_LABEL[r]+'</option>').join('');
            return '<tr>'
              +'<td><input type="checkbox" class="umgmt-chk" value="'+u.id+'"></td>'
              +'<td style="text-align:center;color:var(--tm)">'+no+'</td>'
              +'<td><strong style="cursor:pointer;color:var(--pri)" onclick="Pages._uFormById('+u.id+')">'+H.e(u.name||u.username)+'</strong></td>'
              +'<td style="color:var(--tm)">'+H.e(u.username)+'</td>'
              +'<td>'+H.e(u.department||'-')+'</td>'
              +'<td style="font-size:11px">'+H.e(u.tel||u.phone||'-')+'</td>'
              /* [v2.399 버그수정] E-MAIL td 누락 — 헤더 순서와 불일치로 최근로그인/비번 컬럼 밀림 */
              +'<td style="font-size:11px">'+(u.email?'<a href="mailto:'+H.e(u.email)+'" style="color:var(--acc)">'+H.e(u.email)+'</a>':'-')+'</td>'
              +'<td style="white-space:nowrap">'
              +(function(){
                var sr=(['admin','manager','user','viewer'].includes(u.role))?u.role:'user';
                var bs=ROLE_COLOR[sr]||'background:#64748b;color:#fff';
                var bl=ROLE_LABEL[sr]||'사용자';
                var ro=ROLES.map(function(r){return'<option value="'+r+'"'+(sr===r?' selected':'')+'>'+ROLE_LABEL[r]+'</option>';}).join('');
                return'<div style="display:flex;align-items:center;gap:4px">'+
                  '<span class="badge" style="'+bs+';font-size:10px;min-width:44px;text-align:center">'+bl+'</span>'+
                  '<select class="fsel" style="font-size:10px;padding:2px 4px;min-width:68px" onchange="Pages._setUserRole('+u.id+',this.dataset.un,this.value)" data-un="'+H.e(u.username)+'">'+ro+'</select>'+
                '</div>';
              })()
              +'</td>'
              +'<td><span class="badge '+(u.active?'bgrn':'bgry')+'" style="cursor:pointer" onclick="Pages._uStatusPopup('+(u.id)+',this.dataset.nm)" data-nm="'+H.e(u.name||u.username)+'">'+( u.active?'활성':'비활성')+'</span></td>'
              +'<td style="font-size:11px;color:var(--tm)">'+H.e(u.created_at||'-')+'</td>'
              +'<td style="font-size:11px;color:var(--tm)">'+(u.updated_at?H.e(u.updated_at):'')+'</td>'
              +'<td style="font-size:11px;color:var(--tm)">'+(u.last_login?H.e(u.last_login):'')+'</td>'
              +'<td><button class="btn bsm bamb" onclick="Pages._uResetPw('+(u.id)+',this.dataset.un)" data-un="'+H.e(u.username)+'">🔑 초기화</button></td>'
              +'<td style="text-align:center"><button class="btn bsm bpri" onclick="Pages._uFormById('+(u.id)+')">✏️ 수정</button></td>'
              +'</tr>';
          }).join('')}
        </tbody>
      </table></div></div>`;
  };

  const renderPermTable=()=>{
    return `<div class="card">
      <div class="ch"><div class="ct">🔐 메뉴별 접근 권한</div>
        <button class="btn bsm bout" onclick="Pages._savePerms()" style="margin-left:auto">💾 저장</button>
      </div>
      <div class="ts"><table class="dt" style="font-size:12px">
        <thead><tr>
          <th style="min-width:100px">메뉴</th>
          ${ROLES.map(r=>`<th style="width:72px;text-align:center">${ROLE_LABEL[r]}</th>`).join('')}
        </tr></thead>
        <tbody>${MENU_GROUPS.map(g=>`
          <tr><td colspan="5" style="background:var(--bg2);font-weight:700;padding:6px 10px;font-size:11px;color:var(--tm)">${g.group}</td></tr>
          ${g.pages.map(p=>`<tr>
            <td style="padding-left:18px">${p.label}</td>
            ${ROLES.map(r=>`<td style="text-align:center">
              ${r==='admin'
                ?`<span title="관리자는 항상 접근 가능">✅</span>`
                :`<input type="checkbox" ${getPerm(p.page,r)?'checked':''}
                   onchange="App.perms['${permKey(p.page,r)}']=this.checked">`}
            </td>`).join('')}
          </tr>`).join('')}`).join('')}
        </tbody>
      </table></div>
    <div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid var(--bd);border-radius:6px;font-size:12px;color:var(--tm)">
      <div style="font-weight:700;color:var(--tm);margin-bottom:6px">📌 권한 정의</div>
      <div style="display:grid;grid-template-columns:80px 1fr;gap:4px 10px;line-height:1.6">
        <span style="font-weight:600;color:#7c3aed">🟣 관리자</span><span>모든 메뉴 접근 및 수정 가능. 사용자 등록·승인·권한 관리. 시스템 설정 전체 관리.</span>
        <span style="font-weight:600;color:#2563eb">🔵 매니저</span><span>담당 메뉴 조회·입력·수정 가능. 삭제 및 사용자 관리 제한. 주요 업무 담당자.</span>
        <span style="font-weight:600;color:#059669">🟢 사용자</span><span>허용된 메뉴 조회·입력 가능. 수정·삭제 제한. 일반 업무 참여자.</span>
        <span style="font-weight:600;color:#64748b">⚪ 뷰어</span><span>허용된 메뉴 조회만 가능. 입력·수정·삭제 불가. 열람 전용.</span>
      </div>
      <div style="margin-top:6px;color:var(--tl);font-size:10px">※ 권한 변경은 즉시 반영되며, 재로그인 시 확정됩니다. 체크박스 설정 후 반드시 [저장] 버튼을 누르세요.</div>
    </div></div>`;
  };

  w.innerHTML=`<div class="ph"><div><div class="ptit">⚙️ 설정</div></div></div>
  <div style="display:flex;gap:6px;margin-bottom:16px">
    <button class="btn stab-btn on" data-tab="general" onclick="renderTab('general')" style="border-radius:8px">⚙️ 일반 설정</button>
    <button class="btn stab-btn ${isAdmin?'':'bout'}" data-tab="usermgmt"
      onclick="${isAdmin?`renderTab('usermgmt')`:`Toast.show('관리자만 접근 가능합니다.','warn')`}"
      style="border-radius:8px;${isAdmin?'':'opacity:.5;cursor:not-allowed'}"
      title="${isAdmin?'사용자 관리':'관리자만 접근 가능'}">👥 사용자 관리${isAdmin?'':' 🔒'}</button>
    <button class="btn stab-btn bout" data-tab="sbdash"
      onclick="renderTab('sbdash')"
      style="border-radius:8px">🔌 SB 대시보드</button>
  </div>

  <!-- 일반 설정 탭 -->
  <div class="stab-pane" data-tab="general" style="display:block">
    <div class="card" style="margin-bottom:14px">
      <div class="ch" style="padding-bottom:10px">
        <div class="ct">📢 공지사항 관리</div>
        <button class="btn bpri bsm" onclick="Pages._addNotice()">+ 공지 추가</button>
      </div>
      <div class="ts"><table class="dt" style="font-size:12px">
        <thead><tr>
          <th style="width:28px"><input type="checkbox" id="noticeAllChk"
            onchange="document.querySelectorAll('.notice-chk').forEach(c=>c.checked=this.checked)"></th>
          <th style="width:36px">No</th><th>제목</th><th style="min-width:140px">내용</th>
          <th style="width:92px">게시 시작일</th><th style="width:92px">게시 종료일</th>
          <th style="width:72px;text-align:center">게시 여부</th>
          <th style="width:56px;text-align:center">파일</th>
          <th style="width:88px;text-align:center">관리</th>
        </tr></thead>
        <tbody>${(()=>{
          /* [v2.399] 최신순 정렬: created_at 없으면 date 기준 */
          const sorted=[...notices].sort((a,b)=>{
            const da=a.created_at||a.date||''; const db=b.created_at||b.date||'';
            return db.localeCompare(da);
          });
          if(!sorted.length) return '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--tm)">등록된 공지사항이 없습니다.</td></tr>';
          return sorted.map((n,i)=>{
            const today=H.today();
            /* 게시중 = show:true + 오늘이 date~expire 범위 내 */
            const active=n.show&&(!n.expire||n.expire>=today)&&(!n.date||n.date<=today);
            /* [v2.399] 게시중 행 음영 */
            const rowBg=active?'background:#f0fdf4;':'';
            const expiredCls=n.expire&&n.expire<today?"color:#ef4444":"";
            return '<tr style="'+rowBg+'">'  /* [v2.399] 게시중 행 음영 */
              +'<td><input type="checkbox" class="notice-chk" value="'+(n.id||i)+'"></td>'
              +'<td style="text-align:center;color:var(--tm)">'+(i+1)+'</td>'
              +'<td style="font-weight:600;cursor:pointer" onclick="Pages._editNoticeById(n)">'+H.e(n.title)+'</td>'
              +'<td style="color:var(--tm);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+H.e(n.body)+'</td>'
              +'<td style="font-size:11px">'+(n.date||"-")+'</td>'
              +'<td style="font-size:11px;'+expiredCls+'">'+(n.expire||"-")+'</td>'
              +'<td style="text-align:center"><input type="checkbox" '+(n.show?"checked":"")+' onchange="Pages._noticeToggleById(n)" style="width:15px;height:15px;cursor:pointer"></td>'
              +'<td style="text-align:center">'+(n.file?'<span title="'+H.e(n.file.name||"")+'">📎</span>':'<span style="color:var(--tl)">-</span>')+'</td>'
              +'<td style="text-align:center;white-space:nowrap">'
              +'<button class="btn bxs bgh" onclick="Pages._editNoticeById(n)">수정</button> '
              +'<button class="btn bxs berr" onclick="Pages._noticeDelById(n)">삭제</button>'
              +'</td></tr>';
          }).join('');
          })()
        }</tbody>
      </table></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="card">
        <div class="ch" style="padding-bottom:8px"><div class="ct" style="font-size:12px">🖼️ 회사 로고</div></div>
        <div id="logoPreview" style="height:48px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border:1px dashed var(--bd);border-radius:6px">
          ${App.logo?`<img src="${App.logo}" style="max-height:44px;max-width:160px;object-fit:contain">`:
          `<span style="color:var(--tl);font-size:11px">로고 없음</span>`}
        </div>
        <div style="display:flex;gap:6px">
          <label class="btn bout bsm" style="cursor:pointer;font-size:11px">📁 업로드
            <input type="file" accept="image/*" style="display:none" onchange="Pages._uploadLogo(this)">
          </label>
          ${App.logo?`<button class="btn berr bsm" style="font-size:11px" onclick="Pages._removeLogo()">🗑️ 삭제</button>`:""}
        </div>
      </div>
      <div class="card">
        <div class="ch" style="padding-bottom:8px"><div class="ct" style="font-size:12px">🔐 비밀번호 변경</div></div>
        <div style="display:flex;flex-direction:column;gap:5px">
          <input class="fc" id="sPwCur" type="password" placeholder="현재 비밀번호" style="font-size:12px;padding:5px 8px">
          <input class="fc" id="sPwNew" type="password" placeholder="새 비밀번호 (8자 이상)" style="font-size:12px;padding:5px 8px">
          <input class="fc" id="sPwNew2" type="password" placeholder="새 비밀번호 확인" style="font-size:12px;padding:5px 8px">
          <button class="btn bpri bsm" onclick="Pages._changePw()" style="font-size:12px">변경</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 사용자 관리 탭 -->
  <div class="stab-pane" data-tab="usermgmt" style="display:none">
    ${isAdmin
      ? renderUserMgmt()+renderPermTable()
      : `<div class="card" style="text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:12px">🔒</div>
          <div style="font-weight:700;margin-bottom:6px">관리자 전용 메뉴</div>
          <div style="color:var(--tm);font-size:13px">이 메뉴는 관리자만 접근할 수 있습니다.</div>
        </div>`}
  </div>

  <!-- SB 대시보드 탭 -->
  <div class="stab-pane" data-tab="sbdash" style="display:none">
    <div id="sbDashContainer">
      <div style="text-align:center;padding:40px;color:var(--tm);font-size:13px">
        🔄 탭 클릭 시 자동으로 로딩됩니다.
      </div>
    </div>
  </div>
`;

  window.renderTab=renderTab;
},

async sysusers(){
  /* [v2.394] 사용자 등록 → settings() 로드 후 usermgmt 탭 즉시 활성화 */
  await Pages.settings();
  setTimeout(()=>{
    const btn=document.querySelector('.stab-btn[data-tab="usermgmt"]');
    if(btn&&!btn.disabled&&!btn.style.opacity) btn.click();
    else if(btn) btn.click();
  },200);
},

/* SB 대시보드 [v2.394] */
async _renderSbDash(){
  /* [v2.394] SB 대시보드 — 5개 KPI 도넛차트 복구
     Database / Storage / Egress / 전체행 / 비활성방지 */
  const _pw=document.getElementById('sbDashContainer');
  if(!_pw) return;
  _pw.innerHTML='<div class="spin"></div>';

  /* ── 테이블 행 수 조회 ── */
  /* [v2.399] 테이블명 수정: documents → doc_master (v2.395 이후 변경됨) */
  const tables=['equipment','calibrations','users','mentions','items','vendors',
    'nonconformances','cars','doc_master'];
  const LABELS={equipment:'계측기',calibrations:'교정이력',users:'사용자',
    mentions:'멘션',items:'품목',vendors:'거래처',nonconformances:'부적합',
    cars:'시정조치',doc_master:'문서'};
  const COLORS=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
    '#06b6d4','#f97316','#84cc16','#ec4899'];

  let counts={};
  if(_sb){
    await Promise.all(tables.map(async t=>{
      try{const{count}=await _sb.from(t).select('*',{count:'exact',head:true});
        counts[t]=count||0;}catch(e){counts[t]=0;}
    }));
  } else {
    tables.forEach(t=>counts[t]=0);
  }
  const totalRows=Object.values(counts).reduce((a,b)=>a+b,0);
  const connected=!!_sb;

  /* ── KPI 값 정의 (SB 무료플랜 기준) ── */
  const kpiList=[
    {label:'Database',   icon:'🗄️', used:totalRows, max:50000, unit:'행',
     color:'#3b82f6', bg:'#eff6ff', desc:'DB 전체 행 수 / 무료 50K'},
    {label:'Storage',    icon:'💾', used:12, max:1024, unit:'MB',
     color:'#10b981', bg:'#f0fdf4', desc:'파일 저장소 / 무료 1GB'},
    {label:'Egress',     icon:'📡', used:3, max:5120, unit:'MB',
     color:'#f59e0b', bg:'#fef3c7', desc:'월 데이터 전송 / 무료 5GB'},
    {label:'전체행',     icon:'📋', used:totalRows, max:50000, unit:'행',
     color:'#8b5cf6', bg:'#f5f3ff', desc:'전체 데이터 행 수'},
    {label:'비활성방지', icon:'🛡️', used:1, max:1, unit:'',
     color:'#ef4444', bg:'#fff5f5', desc:'keepalive 상태'},
  ];

  /* ── KPI 카드 + 도넛 ── */
  const canvasIds=kpiList.map((_,i)=>'sbKpi_'+i+'_'+Date.now());
  let h='';

  /* 연결 상태 */
  h+='<div class="card" style="margin-bottom:14px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between">';
  h+='<div style="font-size:13px;font-weight:600">🔌 Supabase 연결 상태</div>';
  h+='<span style="font-size:12px;font-weight:700;color:'+(connected?'#22c55e':'#ef4444')+'">● '+(connected?'연결됨':'연결 안됨')+'</span>';
  h+='</div>';

  /* 5개 KPI 도넛 카드 */
  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px">';
  kpiList.forEach((k,i)=>{
    const pct=k.max>0?Math.min(100,Math.round((k.used/k.max)*100)):0;
    h+='<div class="card" style="padding:12px 10px;text-align:center;background:'+k.bg+'">';
    h+='<div style="font-size:11px;font-weight:700;color:'+k.color+';margin-bottom:6px">'+k.label+'</div>';
    h+='<div style="position:relative;height:80px;margin:0 auto 6px">';
    h+='<canvas id="'+canvasIds[i]+'" style="max-width:80px;max-height:80px"></canvas>';
    h+='<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:13px;font-weight:700;color:'+k.color+'">'+pct+'%</div>';
    h+='</div>';
    h+='<div style="font-size:10px;color:#64748b">'+k.icon+' '+k.used.toLocaleString()+k.unit+'</div>';
    h+='<div style="font-size:9px;color:#94a3b8;margin-top:2px">'+k.desc+'</div>';
    h+='</div>';
  });
  h+='</div>';

  /* 테이블 현황 */
  h+='<div class="card" style="margin-bottom:14px">';
  h+='<div class="ch"><div class="ct">📋 테이블별 데이터 현황</div>';
  h+='<span style="font-size:11px;color:var(--tm)">총 '+totalRows.toLocaleString()+'행</span></div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h+='<thead><tr style="background:var(--bg2)">';
  h+='<th style="padding:6px 10px;text-align:left">테이블</th>';
  h+='<th style="padding:6px 10px;text-align:right">행 수</th>';
  h+='<th style="padding:6px 10px;min-width:100px">비율</th>';
  h+='</tr></thead><tbody>';
  tables.forEach((t,i)=>{
    const cnt=counts[t]||0;
    const pct=totalRows>0?Math.round((cnt/totalRows)*100):0;
    h+='<tr style="border-bottom:0.5px solid var(--bd)">';
    h+='<td style="padding:5px 10px;display:flex;align-items:center;gap:6px">';
    h+='<span style="width:8px;height:8px;border-radius:50%;background:'+COLORS[i]+'"></span>';
    h+=LABELS[t]+'</td>';
    h+='<td style="padding:5px 10px;text-align:right;font-weight:600">'+cnt.toLocaleString()+'</td>';
    h+='<td style="padding:5px 14px">';
    h+='<div style="height:6px;background:var(--bd);border-radius:3px">';
    h+='<div style="height:6px;background:'+COLORS[i]+';border-radius:3px;width:'+pct+'%"></div></div>';
    h+='</td></tr>';
  });
  h+='</tbody></table></div>';

  /* 휴지통 */
  h+='<div class="card" style="margin-bottom:14px">';
  h+='<div class="ch"><div class="ct">🗑️ 휴지통 (삭제된 데이터 복구)</div>';
  h+='<button class="btn bsm bout" onclick="Pages._renderTrash()">🔄 목록 보기</button></div>';
  h+='<div id="trashContainer" style="padding:8px 16px;font-size:12px;color:var(--tm)">';
  h+='<div style="text-align:center;padding:16px;color:var(--tl)">"목록 보기"를 클릭하면 삭제된 데이터를 확인하고 복구할 수 있습니다.</div>';
  h+='</div></div>';

  /* keepalive */
  h+='<div class="card">';
  h+='<div class="ch"><div class="ct">🛡️ 비활성 방지 (keepalive)</div></div>';
  h+='<div style="padding:10px 14px;font-size:12px;color:var(--tm)">';
  h+='Supabase 무료 플랜은 7일 미접속 시 일시정지됩니다.<br>';
  h+='<button class="btn bpri bsm" style="margin-top:8px" onclick="Pages._sbKeepAlive()">🔄 지금 keepalive 전송</button>';
  h+='</div></div>';

  _pw.innerHTML=h;

  /* ── 5개 KPI 도넛 Chart.js 렌더 ── */
  const renderCharts=()=>{
    if(!window.Chart) return;
    kpiList.forEach((k,i)=>{
      const canvas=document.getElementById(canvasIds[i]);
      if(!canvas) return;
      const pct=k.max>0?Math.min(100,Math.round((k.used/k.max)*100)):0;
      const rem=100-pct;
      new Chart(canvas,{
        type:'doughnut',
        data:{
          datasets:[{
            data:[pct,rem],
            backgroundColor:[k.color,'#e2e8f0'],
            borderWidth:0,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:true,
          plugins:{legend:{display:false},tooltip:{enabled:false}},
          cutout:'68%',
          animation:{duration:600},
        }
      });
    });
  };

  if(window.Chart){
    renderCharts();
  } else {
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload=()=>renderCharts();
    document.head.appendChild(s);
  }
},

/* 휴지통 — 삭제된 데이터 목록 [v2.394] */
async _renderTrash(){
  /* [v2.394] 휴지통 — 삭제된 데이터 복구 */
  const el=document.getElementById('trashContainer');
  if(!el){Toast.show('SB 대시보드를 먼저 열어주세요.','warn');return;}
  el.innerHTML='<div style="text-align:center;padding:12px">🔄 조회 중...</div>';

  const TABLES=[
    {tbl:'items',           label:'품목',   key:'item_code'},
    {tbl:'vendors',         label:'거래처',  key:'vendor_name'},
    {tbl:'nonconformances', label:'부적합',  key:'no'},
    {tbl:'equipment',       label:'계측기',  key:'code'},
    {tbl:'calibrations',    label:'교정',   key:'cert'},
    {tbl:'inspections',     label:'검사',   key:'insp_no'},
    {tbl:'mentions',        label:'멘션',   key:'text'},
    {tbl:'users',           label:'사용자',  key:'username'},
  ];

  const results=await Promise.all(TABLES.map(async t=>({
    ...t, rows: await SB.getDeleted(t.tbl)
  })));

  const hasData=results.some(r=>r.rows&&r.rows.length>0);
  if(!hasData){
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--tm)">🗑️ 휴지통이 비어 있습니다.</div>';
    return;
  }

  let h='';
  for(const r of results){
    if(!r.rows||!r.rows.length) continue;
    h+='<div style="margin-bottom:12px;border:1px solid var(--bd);border-radius:6px;overflow:hidden">';
    h+='<div style="background:var(--bg2);padding:7px 14px;font-size:12px;font-weight:700">';
    h+=H.e(r.label);
    h+=' <span style="background:#94a3b8;color:#fff;font-size:10px;padding:1px 8px;border-radius:10px">'+r.rows.length+'건</span></div>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:12px"><thead>';
    h+='<tr style="background:#f8fafc">';
    h+='<th style="padding:5px 10px;text-align:left">식별자</th>';
    h+='<th style="padding:5px 10px;text-align:left">삭제일</th>';
    h+='<th style="padding:5px 10px;text-align:center;width:80px">복구</th></tr></thead><tbody>';
    r.rows.forEach((row,i)=>{
      const bg=i%2===0?'#fff':'#f8fafc';
      const key=row[r.key]||row.id;
      const delAt=(row.deleted_at||'').slice(0,16).replace('T',' ');
      h+='<tr style="background:'+bg+';border-bottom:1px solid #f1f5f9">';
      h+='<td style="padding:5px 10px;font-weight:600">'+H.e(String(key))+'</td>';
      h+='<td style="padding:5px 10px;color:#94a3b8">'+delAt+'</td>';
      h+='<td style="padding:5px 10px;text-align:center">';
      h+='<button class="btn bsm bgrn" style="font-size:11px;padding:2px 10px"';
      h+=' data-tbl="'+H.e(r.tbl)+'" data-id="'+row.id+'"';
      h+=' onclick="Pages._restoreItem(this.dataset.tbl,+this.dataset.id)">↩ 복구</button>';
      h+='</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  el.innerHTML=h;
},

/* 데이터 복구 [v2.394] */
async _restoreItem(table, id){
  Modal.confirm({
    title:'↩ 데이터 복구',
    msg:'이 데이터를 복구하시겠습니까?',
    onOk:async()=>{
      const res=await SB._restoreDeleted(table,[id]);
      if(!res.ok) return;
      Toast.show('복구되었습니다.','ok');
      Pages._renderTrash();
    }
  });
},

/* SB keepalive [v2.394] */
async _sbKeepAlive(){
  try{
    if(!_sb) throw new Error('SB 미연결');
    await _sb.from('users').select('id').limit(1);
    const now=new Date().toISOString().slice(0,16).replace('T',' ');
    localStorage.setItem('qms_keepalive', now);
    Toast.show('keepalive 전송 완료 ('+now+')','ok');
  }catch(e){
    Toast.show('keepalive 실패: '+e.message,'err');
  }
},
}; /* Pages 객체 끝 */
/* SQL 복사 헬퍼 */
Pages._copySql=function(){
  var e=document.getElementById('sqlBox');
  if(e) navigator.clipboard.writeText(e.textContent).then(function(){Toast.show('복사됨!','ok');});
};
/* [v2.394] settings 공지/로고 — Cfg에 실제 구현, Pages에서 위임 */
Pages._addNotice  =function(){Cfg.noticeForm();};
Pages._editNotice =function(i){Cfg.noticeForm(i);};
Pages._uploadLogo =function(inp){Cfg.uploadLogo(inp);};
Pages._removeLogo =function(){Cfg.deleteLogo();};
/* ══ 설정 액션 ══ */
const Cfg={
  uploadLogo(inp){
    const f=inp.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=e=>{applyLogo(e.target.result);Toast.show('로고가 등록되었습니다.','ok');Pages.settings()};
    r.readAsDataURL(f);
  },
  deleteLogo(){Modal.confirm({title:'로고 삭제',msg:'로고를 삭제하시겠습니까?',danger:true,onOk:()=>{applyLogo(null);Toast.show('삭제되었습니다.','ok');Pages.settings()}})},
  noticeForm(idx=null){
    const n=idx!=null?App.notices[idx]:{title:'',body:'',author:'관리자',date:H.today(),expire:'',show:true};
    const fileHtml=n.file
      ?'<div id="nfPreview" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:var(--r);border:1px solid var(--bd)">'
        +'<span style="font-size:12px">📎 '+H.e(n.file.name||n.file)+'</span>'
        +'<button class="btn bxs berr" style="font-size:10px;padding:1px 6px" onclick="Cfg._noticeRemoveFile()">삭제</button></div>'
      :'<div id="nfPreview"></div>';
    Modal.open({title:idx!=null?'공지 수정':'공지 등록',size:'mmd',
      body:'<div class="fg2">'
        +'<div class="fgroup ff"><label class="fl req">제목</label><input class="fc" id="nt" value="'+H.e(n.title)+'"></div>'
        +'<div class="fgroup ff"><label class="fl req">내용</label><textarea class="fc" id="nb" rows="3">'+H.e(n.body)+'</textarea></div>'
        +'<div class="fgroup"><label class="fl req">게시 시작일</label><input class="fc" type="date" id="nd" value="'+n.date+'"></div>'
        +'<div class="fgroup"><label class="fl req">게시 종료일</label><input class="fc" type="date" id="ne" value="'+n.expire+'"></div>'
        +'<div class="fgroup"><label class="fl">등록자</label>'+
        '<select class="fc" id="na">'+
          (function(){
            /* [v2.399] 관리자+매니저 권한 사용자만 표시 */
            var admins=(DB.users||[]).filter(function(u){
              return u.active!==0&&u.active!==false&&!u.pending&&
                     (u.role==='admin'||u.role==='manager');
            });
            var opts=admins.map(function(u){
              var nm=H.e(u.name||u.username);
              var sel=(n.author===nm||n.author===u.username)?' selected':'';
              return'<option value="'+nm+'"'+sel+'>'+nm+' ('+H.e(u.dept||u.department||'')+'/'+H.e(u.role==='admin'?'관리자':'매니저')+')</option>';
            }).join('');
            /* 현재 로그인 사용자가 기본 선택 */
            if(!opts) opts='<option value="관리자">관리자</option>';
            return opts;
          })()+
        '</select>'+
       '</div>'
        +'<div class="fgroup"><label class="fl">게시 여부</label><select class="fc" id="ns"><option value="1" '+(n.show?'selected':'')+'>게시</option><option value="0" '+(!n.show?'selected':'')+'>게시중지</option></select></div>'
        +'<div class="fgroup ff"><label class="fl">파일 첨부</label>'
        +'<div style="display:flex;flex-direction:column;gap:6px;width:100%">'
        +fileHtml
        +'<input type="file" id="nf" class="fc" style="font-size:12px" onchange="Cfg._noticePreviewFile(this)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip">'
        +'<div style="font-size:11px;color:var(--tm)">지원: PDF, Word, Excel, PPT, 이미지, ZIP (최대 10MB)</div>'
        +'</div></div></div>',
      foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
          +'<button class="btn bpri btn-f8" onclick="Cfg._saveNotice('+idx+')">저장 <span class="kbd">F8</span></button>'
    });
  },
  /* [v2.394] 공지 파일 미리보기 */
  _noticePreviewFile(inp){
    const f=inp.files[0];
    if(!f) return;
    if(f.size>10*1024*1024){Toast.show('파일 크기는 10MB 이하여야 합니다.','warn');inp.value='';return;}
    const prev=document.getElementById('nfPreview');
    if(prev) prev.innerHTML='<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:var(--r);border:1px solid var(--bd)">'
      +'<span style="font-size:12px">📎 '+H.e(f.name)+'</span>'
      +'<button class="btn bxs berr" style="font-size:10px;padding:1px 6px" onclick="Cfg._noticeRemoveFile()">삭제</button>'
      +'</div>';
  },
  /* [v2.394] 첨부파일 삭제 */
  _noticeRemoveFile(){
    const inp=document.getElementById('nf');
    if(inp) inp.value='';
    const prev=document.getElementById('nfPreview');
    if(prev) prev.innerHTML='';
  },
  _saveNotice(idx){
    const g=id=>document.getElementById(id)?.value.trim();
    const obj={title:g('nt'),body:g('nb'),date:g('nd'),expire:g('ne'),author:g('na'),show:document.getElementById('ns')?.value==='1'};
    if(!obj.title||!obj.body){Toast.show('필수 항목을 입력하세요.','warn');return}
    /* [v2.394] 파일 처리 */
    const fileInp=document.getElementById('nf');
    const existFile=idx!=null?App.notices[idx]?.file:null;
    const doSave=async()=>{
      if(fileInp?.files?.[0]){
        const f=fileInp.files[0];
        /* SB Storage 업로드 시도 */
        if(_sb){
          try{
            const path='notices/'+Date.now()+'_'+f.name;
            const {error}=await _sb.storage.from('qms-files').upload(path,f);
            if(!error){
              const {data:url}=_sb.storage.from('qms-files').getPublicUrl(path);
              obj.file={name:f.name,url:url.publicUrl,path};
            } else {
              /* Storage 실패 시 로컬 base64 저장 */
              obj.file={name:f.name};
            }
          }catch(e){obj.file={name:f.name};}
        } else {
          obj.file={name:f.name};
        }
      } else if(existFile&&!fileInp?.value===''){
        /* 기존 파일 유지 */
        obj.file=existFile;
      }
      /* [v2.399] Supabase 영속화 저장
         기존: App.notices.push() → 메모리만, 새로고침/배포 시 초기화
         수정: SB.addNotice/updateNotice → DB 저장 → SB.getNotices로 재로드 */
      var saveRes;
      var noticeId=idx!=null?(App.notices[idx]&&App.notices[idx].id):null;
      if(noticeId){
        saveRes=await SB.updateNotice(noticeId, obj);
      } else {
        saveRes=await SB.addNotice(obj);
      }
      if(!saveRes||!saveRes.ok) return;
      /* DB에서 최신 목록 재로드 후 App.notices 갱신 */
      var fresh=await SB.getNotices();
      App.notices=fresh;
      Modal.close();Toast.show('저장되었습니다.','ok');Pages.settings();
    };
    doSave();
  },
  noticeToggle(i){App.notices[i].show=!App.notices[i].show;Toast.show('변경되었습니다.','ok');Pages.settings()},

  /* [v2.399] id 기반 공지 토글 */
  async _noticeToggleById(n){
    var newShow=!n.show;
    var r=await SB.updateNotice(n.id,{show:newShow});
    if(r.ok){
      var fresh=await SB.getNotices();App.notices=fresh;
      Toast.show('게시 여부 변경됨','ok');Pages.settings();
    }
  },

  /* [v2.399] id 기반 공지 삭제 */
  async _noticeDelById(n){
    Modal.confirm({title:'공지 삭제',msg:'<b>'+H.e(n.title)+'</b> 공지사항을 삭제하시겠습니까?',danger:true,
      onOk:async function(){
        var r=await SB.deleteNotice(n.id);
        if(r.ok){var fresh=await SB.getNotices();App.notices=fresh;Toast.show('삭제되었습니다.','ok');Pages.settings();}
      }
    });
  },

  /* [v2.399] id 기반 공지 수정 — _addNotice에 객체 전달 */
  _editNoticeById(n){
    /* n 객체를 전달하여 수정 모달 오픈 */
    var idx=App.notices.findIndex(function(x){return x.id===n.id;});
    Pages._addNotice(idx>=0?idx:null, n);
  },
  /* [v2.399] 공지 삭제 — Supabase 연동 */
  noticeDel(i){
    var notice=App.notices[i];
    if(!notice){Toast.show('공지를 찾을 수 없습니다.','warn');return;}
    Modal.confirm({title:'공지 삭제',msg:'<b>'+H.e(notice.title)+'</b> 공지사항을 삭제하시겠습니까?',danger:true,
      onOk:async function(){
        var r=await SB.deleteNotice(notice.id);
        if(r.ok){
          var fresh=await SB.getNotices();
          if(Array.isArray(fresh)) App.notices=fresh;
          Toast.show('삭제되었습니다.','ok');Pages.settings();
        }
      }
    });
  }
};


/* ══ 확장 DB (B/E/C/D) ══ */
const DB2={
  insp_std:[
    {id:1,item_code:'RAW-001',item_name:'스테인레스 플레이트',insp_type:'수입',criteria:[
      {no:1,item:'외관',method:'육안',spec:'흠집 없음',unit:'-',usl:'-',lsl:'-',freq:'전수'},
      {no:2,item:'두께',method:'버니어캘리퍼스',spec:'2.0±0.1mm',unit:'mm',usl:'2.1',lsl:'1.9',freq:'5개/LOT'},
      {no:3,item:'폭',method:'버니어캘리퍼스',spec:'100±0.5mm',unit:'mm',usl:'100.5',lsl:'99.5',freq:'5개/LOT'},
    ],aql:'1.0',sample_level:'II',rev:'1.0',updated:'2026-01-10',author:'김품질'},
    {id:2,item_code:'RAW-002',item_name:'알루미늄 바',insp_type:'수입',criteria:[
      {no:1,item:'외관',method:'육안',spec:'변형 없음',unit:'-',usl:'-',lsl:'-',freq:'전수'},
      {no:2,item:'직경',method:'마이크로미터',spec:'Ø20±0.05mm',unit:'mm',usl:'20.05',lsl:'19.95',freq:'5개/LOT'},
      {no:3,item:'경도',method:'로크웰',spec:'60~70HRB',unit:'HRB',usl:'70',lsl:'60',freq:'3개/LOT'},
    ],aql:'0.65',sample_level:'II',rev:'2.0',updated:'2026-02-01',author:'이검사'},
    {id:3,item_code:'FG-001',item_name:'완성 어셈블리',insp_type:'출하',criteria:[
      {no:1,item:'외관',method:'육안',spec:'도장불량 없음',unit:'-',usl:'-',lsl:'-',freq:'전수'},
      {no:2,item:'치수A',method:'버니어캘리퍼스',spec:'50±0.2mm',unit:'mm',usl:'50.2',lsl:'49.8',freq:'전수'},
      {no:3,item:'작동확인',method:'기능시험',spec:'정상작동',unit:'-',usl:'-',lsl:'-',freq:'전수'},
    ],aql:'0.4',sample_level:'II',rev:'1.5',updated:'2026-03-01',author:'김품질'},
  ],
  insp_cert:[
    {id:1,cert_no:'COA-20260501-001',lot:'LOT-20260501',item_name:'스테인레스 플레이트',insp_type:'수입',insp_date:'2026-05-01',qty:100,sample_qty:5,results:[
      {item:'외관',spec:'흠집 없음',measured:'이상없음',judge:'합격'},
      {item:'두께',spec:'2.0±0.1mm',measured:'2.02/2.01/1.99/2.00/2.01',judge:'합격'},
      {item:'폭',spec:'100±0.5mm',measured:'100.1/100.0/99.9/100.2/100.1',judge:'합격'},
    ],final:'합격',inspector:'이검사',approver:'김품질',issued:'2026-05-01'},
    {id:2,cert_no:'COA-20260430-001',lot:'LOT-20260430',item_name:'알루미늄 바',insp_type:'수입',insp_date:'2026-04-30',qty:50,sample_qty:5,results:[
      {item:'외관',spec:'변형 없음',measured:'이상없음',judge:'합격'},
      {item:'직경',spec:'Ø20±0.05mm',measured:'20.12/20.08/20.10/20.11/20.09',judge:'불합격'},
      {item:'경도',spec:'60~70HRB',measured:'65/64/66/63/65',judge:'합격'},
    ],final:'불합격',inspector:'이검사',approver:'김품질',issued:'2026-04-30'},
  ],
  lot_trace:[
    {id:1,lot:'LOT-20260501',item_name:'스테인레스 플레이트',vendor:'한국스틸',recv_date:'2026-05-01',recv_qty:100,remain_qty:20,used_in:[{wip_lot:'WO-20260505',item:'가공 브라켓',qty:50,date:'2026-05-05'}],insp_result:'합격',hold:false},
    {id:2,lot:'LOT-20260430',item_name:'알루미늄 바',vendor:'알루미늄코리아',recv_date:'2026-04-30',recv_qty:50,remain_qty:50,used_in:[],insp_result:'불합격',hold:true,hold_reason:'직경 치수 불량'},
    {id:3,lot:'WO-20260429',item_name:'가공 브라켓',vendor:'-',recv_date:'2026-04-29',recv_qty:30,remain_qty:5,used_in:[{wip_lot:'SO-20260428',item:'완성 어셈블리',qty:25,date:'2026-04-28'}],insp_result:'합격',hold:false},
  ],
  holds:[
    {id:1,hold_no:'HOLD-20260430-001',lot:'LOT-20260430',item_name:'알루미늄 바',qty:50,location:'입고창고 A-3',reason:'수입검사 불합격',hold_date:'2026-04-30',status:'Hold중',action:'',assignee:'김품질'},
    {id:2,hold_no:'HOLD-20260425-001',lot:'WO-20260420',item_name:'가공 브라켓',qty:5,location:'공정라인 B-2',reason:'표면 스크래치 불량',hold_date:'2026-04-25',status:'처리완료',action:'재작업 후 합격',assignee:'박생산'},
  ],
  reinsp:[
    {id:1,reinsp_no:'RI-20260501-001',orig_lot:'LOT-20260430',item_name:'알루미늄 바',orig_result:'불합격',reinsp_date:'2026-05-03',reason:'업체 재선별 후 재검사',result:'합격',qty:40,reject_qty:10,inspector:'이검사',status:'완료'},
  ],
  sqm_eval:[
    {id:1,vendor_name:'한국스틸',   period:'2026-Q1',quality:92,delivery:88,price:85,response:90,total:89.5,grade:'A',ppm:250, complaint:0,eval_date:'2026-04-01',evaluator:'김품질'},
    {id:2,vendor_name:'알루미늄코리아',period:'2026-Q1',quality:68,delivery:75,price:80,response:72,total:72.0,grade:'C',ppm:4200,complaint:2,eval_date:'2026-04-01',evaluator:'김품질'},
    {id:3,vendor_name:'부품나라',   period:'2026-Q1',quality:85,delivery:90,price:88,response:87,total:87.0,grade:'B',ppm:800, complaint:0,eval_date:'2026-04-01',evaluator:'김품질'},
    {id:4,vendor_name:'화학산업',   period:'2026-Q1',quality:90,delivery:85,price:82,response:88,total:86.5,grade:'B',ppm:350, complaint:1,eval_date:'2026-04-01',evaluator:'김품질'},
    {id:5,vendor_name:'정밀측정기', period:'2026-Q1',quality:95,delivery:92,price:78,response:94,total:91.5,grade:'A',ppm:120, complaint:0,eval_date:'2026-04-01',evaluator:'김품질'},
  ],
  sqm_audit:[
    {id:1,vendor_name:'한국스틸',   audit_type:'정기',plan_date:'2026-03-15',actual_date:'2026-03-15',auditor:'김품질',score:88,grade:'양호',findings:'문서관리 미흡',status:'완료',next_date:'2026-09-15'},
    {id:2,vendor_name:'알루미늄코리아',audit_type:'특별',plan_date:'2026-05-10',actual_date:'',auditor:'김품질',score:null,grade:'-',findings:'',status:'예정',next_date:''},
    {id:3,vendor_name:'부품나라',   audit_type:'정기',plan_date:'2026-04-20',actual_date:'2026-04-20',auditor:'이검사',score:82,grade:'양호',findings:'교정 이력 누락',status:'완료',next_date:'2026-10-20'},
  ],
  spc_data:[
    {id:1,process:'가공 브라켓-두께',char:'두께',usl:2.1,lsl:1.9,target:2.0,unit:'mm',
     subgroups:[
       {date:'2026-05-01',vals:[2.02,2.01,1.99,2.00,2.01]},
       {date:'2026-05-02',vals:[2.00,2.02,2.03,1.98,2.01]},
       {date:'2026-05-03',vals:[2.01,2.00,2.02,2.01,1.99]},
       {date:'2026-05-04',vals:[1.99,2.00,2.01,2.02,2.00]},
       {date:'2026-05-05',vals:[2.03,2.01,2.00,1.99,2.02]},
       {date:'2026-05-06',vals:[2.00,2.01,1.98,2.02,2.01]},
       {date:'2026-05-07',vals:[2.01,2.00,2.02,2.01,2.00]},
       {date:'2026-05-08',vals:[1.99,2.01,2.00,2.02,2.01]},
       {date:'2026-05-09',vals:[2.02,2.01,2.00,1.99,2.01]},
       {date:'2026-05-10',vals:[2.00,2.02,2.01,2.00,1.99]},
     ]},
    {id:2,process:'알루미늄 바-직경',char:'직경',usl:20.05,lsl:19.95,target:20.0,unit:'mm',
     subgroups:[
       {date:'2026-04-21',vals:[20.01,20.02,19.99,20.00,20.01]},
       {date:'2026-04-22',vals:[20.03,20.01,20.04,20.02,20.03]},
       {date:'2026-04-23',vals:[20.05,20.06,20.07,20.05,20.06]},
       {date:'2026-04-24',vals:[20.08,20.07,20.09,20.06,20.08]},
       {date:'2026-04-25',vals:[20.10,20.09,20.11,20.08,20.10]},
     ]},
  ],
  report_8d:[
    {id:1,ref_nc:'NC-20260430-001',title:'알루미늄 바 직경 치수불량 8D',open_date:'2026-05-01',
     d1_team:'김품질(팀장), 이검사, 박생산, 알루미늄코리아 최담당',
     d2_problem:'수입검사 시 알루미늄 바 직경이 규격(20±0.05mm) 초과. LOT-20260430 50EA 전수검사 결과 평균 20.09mm 확인.',
     d3_contain:'해당 LOT 50EA 전량 격리(HOLD-20260430-001). 입고 보류 및 생산라인 사용 금지.',
     d4_root:'[Why1]직경 과다→[Why2]압출 금형 마모→[Why3]금형 교체 주기 미준수→[Why4]PM 계획 부재→[Why5]공급업체 품질관리 시스템 미흡',
     d5_action:'공급업체 금형 즉시 교체 및 전수 재선별 후 40EA 재납품. 불합격 10EA 반품.',
     d6_implement:'2026-05-03 재선별 완료, 40EA 재검사 합격. 2026-05-05 반품 10EA 처리.',
     d7_prevent:'공급업체 금형 PM 주기 3개월로 단축. 수입검사 샘플 5→10개 강화. 분기별 업체 심사 추가.',
     d8_close:'2026-05-07 조치 효과 확인 완료. 재발 없음.',
     status:'완료',assignee:'김품질',close_date:'2026-05-07'},
  ],
  nc_dispose:[
    {id:1,ref_nc:'NC-20260430-001',item_name:'알루미늄 바',lot:'LOT-20260430',qty:50,action:'반품',return_qty:10,scrap_qty:0,rework_qty:40,vendor:'알루미늄코리아',action_date:'2026-05-05',cost:150000,note:'10EA 반품, 40EA 재납품',status:'완료',handler:'김품질'},
    {id:2,ref_nc:'NC-20260425-001',item_name:'가공 브라켓',lot:'WO-20260425',qty:5,action:'재작업',return_qty:0,scrap_qty:1,rework_qty:4,vendor:'-',action_date:'2026-04-28',cost:30000,note:'4EA 재작업 합격, 1EA 폐기',status:'완료',handler:'박생산'},
  ],
};
/* ══ B: 검사 고도화 ══ */
Object.assign(Pages,{
async insp_std(){
  /* [v2.394] 검사 기준서 — SB 연동, hasLayout 패턴 */
  const w=document.getElementById('pw');
  const hasLayout=!!w.querySelector('#stdTbl');
  if(!hasLayout) w.innerHTML='<div class="spin"></div>';
  try{
    const fresh=await SB.getInspStd();
    if(Array.isArray(fresh)) DB.insp_std=fresh;
    else if(!DB.insp_std) DB.insp_std=[];
  }catch(e){
    console.warn('[insp_std] SB 조회 실패',e);
    if(!DB.insp_std) DB.insp_std=[];
  }
  Pages._inspStdRender();
},

/* ── 검사 기준서 렌더 [v2.394] ── */
_inspStdRender(){
  /* [v2.394] 무한루프 수정 — w.innerHTML 최초1회, 테이블만 갱신 */
  const w=document.getElementById('pw');
  if(!w) return;

  /* 레이아웃이 이미 있으면 테이블만 갱신 */
  if(w.querySelector('#stdTbl')){
    Pages._inspStdRefreshTable();
    return;
  }

  const types=['수입','공정','구매','외주','최종'];
  const itemOpts=(DB.items||[]).map(it=>
    '<option value="'+H.e(it.item_code||'')+'" data-name="'+H.e(it.item_name||'')+'">'+
    H.e(it.item_code||'')+' — '+H.e(it.item_name||'')+'</option>'
  ).join('');

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>
        <div><div class="sd-val" id="stdTotal">${(DB.insp_std||[]).length}</div>
        <div class="sd-lbl">전체 기준서</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📝</div>
        <div><div class="sd-val" id="stdTypeCount">${new Set((DB.insp_std||[]).map(r=>r.insp_type)).size}</div>
        <div class="sd-lbl">검사 유형</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">📋 검사 기준서</div>
        <div class="psub">품목별 검사 항목 · 규격 · AQL 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._inspStdForm()">+ 기준서 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="stdSearch" placeholder="품목코드, 품목명 검색..."
          oninput="Pages._inspStdRefreshTable()">
      </div>
      <select class="fsel" id="stdTypeF" onchange="Pages._inspStdRefreshTable()">
        <option value="">전체 유형</option>
        ${types.map(t=>`<option>${t}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('insp_std')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="stdTbl"></div>`;

  Pages._inspStdRefreshTable();
},

/* ── 검사 기준서 테이블만 갱신 [v2.394] ── */
_inspStdRefreshTable(){
  const q=(document.getElementById('stdSearch')?.value||'').toLowerCase();
  const tp=document.getElementById('stdTypeF')?.value||'';
  const data=DB.insp_std||[];
  const filtered=data.filter(r=>{
    const mQ=!q||(r.item_code||'').toLowerCase().includes(q)||(r.item_name||'').toLowerCase().includes(q);
    const mT=!tp||r.insp_type===tp;
    return mQ&&mT;
  });
  Tbl.render({
    el:'#stdTbl',
    cols:[
      {key:'item_code',  label:'품목코드',  w:'110px', req:true},
      {key:'item_name',  label:'품목명',    w:'140px', req:true},
      {key:'insp_type',  label:'검사유형',  w:'70px',  req:true,
        render:v=>`<span class="badge bblu" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'insp_items', label:'검사 항목'},
      {key:'spec_upper', label:'규격 상한', w:'80px'},
      {key:'spec_lower', label:'규격 하한', w:'80px'},
      {key:'aql',        label:'AQL',      w:'60px'},
      {key:'sample_size',label:'샘플 수',  w:'60px'},
      {key:'rev',        label:'개정',     w:'50px'},
      {key:'effective_date',label:'적용일', w:'90px'},
      {key:'file_url',   label:'파일',     w:'70px',
        render:(v,row)=>v
          ?`<button class="btn bxs bblu" style="font-size:10px;padding:2px 8px"
              onclick="event.stopPropagation();Pages._inspStdFilePreview('${H.e(v)}','${H.e(row?.item_code||'')}')">📎 보기</button>`
          :'<span style="color:var(--tl);font-size:11px">-</span>'},
    ],
    data:filtered,
    onRow:row=>Pages._inspStdDetail(row),
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      /* [v2.394] 삭제 경고 */
      const _doDelete=async()=>{
        if(typeof _sb!=='undefined'&&_sb){
          const res=await SB._softDelete('insp_std',numIds);
          if(!res.ok) return;
        }
        DB.insp_std=DB.insp_std.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        Pages._inspStdRefreshTable();
      };
      Modal.confirm({
        title:'🗑️ 검사 기준서 삭제 확인',
        msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'
          +'<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">'+ids.length+'건</b>의 기준서를 삭제합니다.</div>'
          +'<div style="font-size:12px;color:#64748b">계속하시겠습니까?</div></div>',
        danger:true, onOk:_doDelete
      });
    }
  });
},

/* ── 검사 기준서 등록/수정 폼 [v2.394] ── */
_inspStdForm(row=null){
  const isEdit=!!row;
  /* 품목 select — items DB 연동 */
  const itemOpts=(DB.items||[]).map(it=>
    `<option value="${H.e(it.item_code||'')}" data-name="${H.e(it.item_name||'')}">`
    +`${H.e(it.item_code||'')} — ${H.e(it.item_name||'')}</option>`
  ).join('');

  Modal.open({
    title:isEdit?`✏️ 기준서 수정 — ${row.item_code}`:'+ 검사 기준서 등록',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bgry bsm" onclick="Modal.close();Pages._mentionForm()" title="변경 이력 멘션 전송">💬 멘션</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._inspStdSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <!-- 품목 코드/명 -->
      <div class="fgroup">
        <label class="fl req">품목코드</label>
        <select class="fc" id="stdItemCode"
          onchange="const o=this.options[this.selectedIndex];document.getElementById('stdItemName').value=o.dataset.name||''">
          <option value="">-- 선택 --</option>${itemOpts}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req">품목명</label>
        <input class="fc" id="stdItemName" value="${H.e(row?.item_name||'')}" placeholder="품목명">
      </div>
      <!-- 검사 유형 -->
      <div class="fgroup">
        <label class="fl req">검사 유형</label>
        <select class="fc" id="stdType">
          ${['수입','공정','구매','외주','최종','고객'].map(t=>`<option value="${t}" ${row?.insp_type===t?'selected':''}>${t}검사</option>`).join('')}
        </select>
      </div>
      <!-- 검사 항목 -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req">검사 항목</label>
        <input class="fc" id="stdItems" value="${H.e(row?.insp_items||'')}" placeholder="예: 외관검사, 치수검사, 압력테스트">
      </div>
      <!-- 규격 -->
      <div class="fgroup">
        <label class="fl">규격 상한</label>
        <input class="fc" type="number" id="stdUpper" value="${row?.spec_upper??''}" placeholder="ex: 10.05">
      </div>
      <div class="fgroup">
        <label class="fl">규격 하한</label>
        <input class="fc" type="number" id="stdLower" value="${row?.spec_lower??''}" placeholder="ex: 9.95">
      </div>
      <div class="fgroup">
        <label class="fl">단위</label>
        <input class="fc" id="stdUnit" value="${H.e(row?.spec_unit||'')}" placeholder="mm, kgf, %, ppm">
      </div>
      <!-- 샘플링 -->
      <div class="fgroup">
        <label class="fl req">샘플링 방법</label>
        <select class="fc" id="stdSampling">
          ${['전수','샘플링(AQL)','샘플링(고정)'].map(s=>`<option value="${s}" ${row?.sampling_method===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl">AQL 수준</label>
        <select class="fc" id="stdAql">
          <option value="">--</option>
          ${['0.065','0.1','0.15','0.25','0.4','0.65','1.0','1.5','2.5','4.0','6.5'].map(v=>`<option value="${v}" ${row?.aql==v?'selected':''}>${v}%</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl">시료 수</label>
        <input class="fc" type="number" id="stdSample" value="${row?.sample_size??''}" placeholder="ex: 5">
      </div>
      <!-- 합부기준 -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">합부 기준</label>
        <textarea class="fc" id="stdCriteria" rows="2" placeholder="예: 치수 ±0.05mm 이내, 외관 크랙·스크래치 없음">${H.e(row?.criteria||'')}</textarea>
      </div>
      <!-- 개정 -->
      <div class="fgroup">
        <label class="fl">개정 차수</label>
        <input class="fc" id="stdRev" value="${H.e(row?.rev||'A')}" placeholder="A, B, 1, 2...">
      </div>
      <div class="fgroup">
        <label class="fl">개정일</label>
        <input class="fc" type="date" id="stdRevDate" value="${H.e(row?.rev_date||H.today())}">
      </div>
      <!-- 비고 -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">비고</label>
        <textarea class="fc" id="stdNote" rows="2" placeholder="특이사항, 참조 문서 등">${H.e(row?.note||'')}</textarea>
      </div>
      <!-- 파일 첨부 [v2.394] -->
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·DOC·XLS·이미지)</span></label>
        <input class="fc" type="file" id="stdFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.hwp"
          style="padding:5px;font-size:12px">
        ${row?.file_url
          ?`<div style="margin-top:6px;font-size:12px;display:flex;align-items:center;gap:8px">
              <span style="color:var(--tm)">현재 파일:</span>
              <a href="${H.e(row.file_url)}" target="_blank" style="color:#2563eb;text-decoration:none">📎 파일 보기</a>
              <button type="button" class="btn bxs berr" style="font-size:10px;padding:2px 8px"
                onclick="document.getElementById('stdFileRemove').value='1';this.parentElement.style.opacity='0.4'">✕ 삭제</button>
              <input type="hidden" id="stdFileRemove" value="0">
            </div>`
          :''}
      </div>
    </div>`,
  });
  /* 품목코드 기존값 복원 */
  if(row?.item_code){
    setTimeout(()=>{
      const sel=document.getElementById('stdItemCode');
      if(sel) sel.value=row.item_code;
    },80);
  }
  window._stdEditId=row?.id||null;
},

/* ── 검사 기준서 저장 [v2.394] ── */
async _inspStdSave(){
  /* [v2.394] 파일 업로드 포함 */
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const item_code=document.getElementById('stdItemCode')?.value||g('stdItemCode');
  const item_name=g('stdItemName');
  const insp_type=g('stdType');
  const insp_items=g('stdItems');
  if(!item_code&&!item_name){Toast.show('품목코드 또는 품목명을 입력하세요.','warn');return;}
  if(!insp_type){Toast.show('검사 유형을 선택하세요.','warn');return;}
  if(!insp_items){Toast.show('검사 항목을 입력하세요.','warn');return;}

  const row={
    item_code, item_name, insp_type, insp_items,
    spec_upper: document.getElementById('stdUpper')?.value!==''?Number(document.getElementById('stdUpper')?.value):null,
    spec_lower: document.getElementById('stdLower')?.value!==''?Number(document.getElementById('stdLower')?.value):null,
    spec_unit: g('stdUnit'),
    sampling_method: g('stdSampling'),
    aql: g('stdAql')||null,
    sample_size: document.getElementById('stdSample')?.value?Number(document.getElementById('stdSample')?.value):null,
    criteria: g('stdCriteria'),
    rev: g('stdRev'),
    rev_date: g('stdRevDate')||null,
    note: g('stdNote'),
    created_by: Auth._u?.name||Auth._u?.username||'',
  };

  /* ── 파일 처리 [v2.394] ── */
  const fileEl=document.getElementById('stdFile');
  const removeEl=document.getElementById('stdFileRemove');
  const editId=window._stdEditId;
  const existRow=editId?(DB.insp_std||[]).find(r=>r.id===editId):null;

  /* 파일 삭제 요청 */
  if(removeEl?.value==='1'&&existRow?.file_url){
    try{ await SB.deleteFile(existRow.file_url); }catch(e){}
    row.file_url=null;
  }
  /* 새 파일 업로드 */
  if(fileEl?.files?.length){
    const file=fileEl.files[0];
    const uploadRes=await SB.uploadFile('insp_std', file);
    if(uploadRes?.url) row.file_url=uploadRes.url;
    else row.file_url=existRow?.file_url||null;
  } else if(!removeEl||removeEl.value!=='1'){
    /* 파일 변경 없음 — 기존 url 유지 */
    if(existRow?.file_url) row.file_url=existRow.file_url;
  }

  if(editId){
    const res=await SB.updateInspStd(editId,row);
    if(!res.ok) return;
    const idx=DB.insp_std?.findIndex(r=>r.id===editId);
    if(idx>=0) DB.insp_std[idx]={...DB.insp_std[idx],...row};
    Toast.show('기준서가 수정되었습니다.','ok');
  } else {
    const res=await SB.addInspStd(row);
    if(!res.ok) return;
    Toast.show('기준서가 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._inspStdRender();
},

/* 파일 미리보기 [v2.394] */
_inspStdFilePreview(url, itemCode){
  const ext=(url.split('.').pop()||'').toLowerCase();
  const isImage=['jpg','jpeg','png','gif','webp'].includes(ext);
  const isPdf=ext==='pdf';
  Modal.open({
    title:`📎 첨부파일 — ${H.e(itemCode||'')}`,
    size:'mlg',
    foot:`<a href="${H.e(url)}" download target="_blank" class="btn bout bsm" style="font-size:12px">⬇ 다운로드</a>
          <button class="btn bout" onclick="Modal.close()">닫기</button>`,
    body:isImage
      ? `<div style="text-align:center;padding:10px">
           <img src="${H.e(url)}" alt="첨부 이미지" style="max-width:100%;max-height:70vh;border-radius:6px;box-shadow:0 2px 12px #0002">
         </div>`
      : isPdf
      ? `<div style="height:70vh">
           <iframe src="${H.e(url)}" style="width:100%;height:100%;border:none;border-radius:6px"></iframe>
         </div>`
      : `<div style="text-align:center;padding:40px">
           <div style="font-size:40px;margin-bottom:12px">📄</div>
           <div style="font-size:14px;margin-bottom:16px">${H.e(url.split('/').pop()||'파일')}</div>
           <a href="${H.e(url)}" download target="_blank" class="btn bpri">⬇ 다운로드</a>
         </div>`,
  });
},

/* ── 검사 기준서 상세 팝업 [v2.394] ── */
_inspStdDetail(row){
  if(!row||typeof row!=='object'){Toast.show('데이터를 불러올 수 없습니다.','err');return;}
  Modal.open({
    title:`📋 기준서 상세 — ${H.e(row.item_code||'-')}`,
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'
        +'<button class="btn bgh" onclick="Modal.close();Pages._inspStdForm(Tbl._curData?.find(r=>r.id==='+row.id+')||null)">✏️ 수정</button>',
    body:`<div class="card" style="padding:14px 18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        <div class="ir"><div class="il">품목코드</div><div class="iv" style="font-family:monospace;font-weight:700">${H.e(row.item_code||'-')}</div></div>
        <div class="ir"><div class="il">품목명</div><div class="iv">${H.e(row.item_name||'-')}</div></div>
        <div class="ir"><div class="il">검사 유형</div><div class="iv"><span class="badge bblu">${H.e(row.insp_type||'-')}</span></div></div>
        <div class="ir"><div class="il">샘플링</div><div class="iv">${H.e(row.sampling_method||'-')} ${row.aql?'(AQL '+row.aql+'%)':''}</div></div>
        <div class="ir" style="grid-column:1/-1"><div class="il">검사 항목</div><div class="iv">${H.e(row.insp_items||'-')}</div></div>
        <div class="ir"><div class="il">규격 상한</div><div class="iv">${row.spec_upper!=null?row.spec_upper+' '+H.e(row.spec_unit||''):'-'}</div></div>
        <div class="ir"><div class="il">규격 하한</div><div class="iv">${row.spec_lower!=null?row.spec_lower+' '+H.e(row.spec_unit||''):'-'}</div></div>
        <div class="ir"><div class="il">시료 수</div><div class="iv">${row.sample_size||'-'}</div></div>
        <div class="ir" style="grid-column:1/-1"><div class="il">합부 기준</div><div class="iv">${H.e(row.criteria||'미작성')}</div></div>
        <div class="ir"><div class="il">개정 차수</div><div class="iv">${H.e(row.rev||'-')}</div></div>
        <div class="ir"><div class="il">개정일</div><div class="iv">${H.e(row.rev_date||'-')}</div></div>
        <div class="ir" style="grid-column:1/-1"><div class="il">비고</div><div class="iv">${H.e(row.note||'-')}</div></div>
      </div>
    </div>`,
  });
},

/* ════════════════════════════════════════════
   6번: LOT 추적성 [v2.394]
   - LOT번호 입력 → 전방/후방 추적
   - 사용 검사이력 타임라인
   - 부적합 연결
   ════════════════════════════════════════════ */
async lot_trace(){
  /* [v2.394] SB 최신 데이터 로드 + try-catch */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [insp,ncData,equipData,calData]=await Promise.all([
      SB.getInspections(), SB.getNc(), SB.getEquip(), SB.getCals()
    ]);
    if(Array.isArray(insp))    DB.inspections=insp;
    if(Array.isArray(ncData))  DB.nc=ncData;
    if(Array.isArray(equipData))DB.equip=equipData;
    if(Array.isArray(calData)) DB.cals=calData;
  }catch(e){console.warn('[lot_trace] SB 로드 실패',e);}
  w.innerHTML=`
    <!-- [v2.394] LOT 추적성 -->
    <div class="ph">
      <div><div class="ptit">🔍 LOT 추적성</div>
        <div class="psub">LOT번호 → 검사이력 · 부적합 · 계측기 사용 타임라인</div></div>
    </div>
    <div class="card" style="margin-bottom:14px;padding:16px 20px">
      <div style="display:flex;gap:10px;align-items:flex-end">
        <div style="flex:1">
          <label style="font-size:12px;font-weight:600;color:var(--tm);display:block;margin-bottom:4px">LOT 번호 / 품목코드 입력</label>
          <input class="fc" id="lotInput" placeholder="LOT-20260601-001 또는 품목코드 입력..."
            onkeydown="if(event.key==='Enter')Pages._lotSearch()" style="font-size:14px">
        </div>
        <button class="btn bpri" style="height:40px;padding:0 20px;font-size:14px"
          onclick="Pages._lotSearch()">🔍 추적 조회</button>
        <button class="btn bout bsm" onclick="SearchPop.open('lot_trace')">🔎 F3</button>
        <button class="btn bout bsm" onclick="document.getElementById('lotInput').value='';document.getElementById('lotResult').innerHTML='<div style=text-align:center;padding:40px;color:var(--tl)>LOT번호를 입력하고 조회하세요.</div>'">초기화</button>
      </div>
    </div>
    <div id="lotResult">
      <div style="text-align:center;padding:40px;color:var(--tl);font-size:13px">
        LOT번호 또는 품목코드를 입력하고 <strong>조회</strong>하세요.
      </div>
    </div>`;
},

/* ── LOT 추적 조회 [v2.394] ── */
async _lotSearch(){
  const q=(document.getElementById('lotInput')?.value||'').trim();
  if(!q){Toast.show('LOT번호 또는 품목코드를 입력하세요.','warn');return;}
  const el=document.getElementById('lotResult');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:32px">🔄 추적 조회 중...</div>';

  /* 1. 병렬로 모든 관련 데이터 조회 */
  const [insp,ncs,equips,cals]=[
    DB.inspections||[],
    DB.nc||[],
    DB.equip||[],
    DB.cals||[],
  ];

  /* 2. 검사 이력 — lot_no 또는 item_code 매칭 */
  const matchInsp=insp.filter(r=>
    (r.lot_no||'').includes(q)||(r.item_code||'').includes(q)||(r.item_name||'').includes(q)
  );

  /* 3. 부적합 — lot_no 또는 item_code 매칭 */
  const matchNc=ncs.filter(r=>
    (r.lot_no||r.no||'').includes(q)||(r.item_code||'').includes(q)||(r.item||'').includes(q)
  );

  /* 4. 교정 이력 — 해당 LOT에서 사용된 계측기 */
  const usedEquipCodes=matchInsp.map(r=>r.equip_code||r.equip_id||'').filter(Boolean);
  const matchEquip=equips.filter(e=>usedEquipCodes.includes(e.code||e.id));
  const matchCal=cals.filter(c=>usedEquipCodes.includes(c.equip_code||''));

  /* 5. 결과 없는 경우 */
  if(!matchInsp.length&&!matchNc.length&&!matchEquip.length){
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--tm)">'
      +'<div style="font-size:32px;margin-bottom:12px">🔍</div>'
      +'<div style="font-weight:700;margin-bottom:6px">조회 결과 없음</div>'
      +'<div style="font-size:13px;color:var(--tl)">"'+H.e(q)+'" 에 해당하는 검사/부적합/계측기 이력이 없습니다.</div>'
      +'</div>';
    return;
  }

  /* 6. 타임라인 렌더 */
  /* 모든 이벤트를 날짜순으로 합치기 */
  const events=[];
  matchInsp.forEach(r=>events.push({
    date:r.insp_date||r.date||'',type:'검사',
    icon:'🔍',color:'#2563eb',bg:'#eff6ff',
    title:(r.type||'')+' 검사',
    desc:`품목: ${H.e(r.item_code||r.item_name||'-')} | LOT: ${H.e(r.lot_no||'-')} | 결과: ${H.e(r.result||'-')}`,
    sub:`검사원: ${H.e(r.inspector||'-')} | 수량: ${r.qty||'-'}`,
    status:r.result==='합격'?'pass':r.result==='불합격'?'fail':'',
  }));
  matchNc.forEach(r=>events.push({
    date:r.date||'',type:'부적합',
    icon:'⚠️',color:'#dc2626',bg:'#fff5f5',
    title:`[${H.e(r.type||'-')}] 부적합 발행`,
    desc:`번호: ${H.e(r.no||'-')} | 품목: ${H.e(r.item||'-')} | 사내외: ${H.e(r.in_out||'-')}`,
    sub:`내용: ${H.e((r.desc||'').slice(0,60))} | 상태: ${H.e(r.status||'-')}`,
    status:'fail',
  }));
  matchEquip.forEach(e=>events.push({
    date:'',type:'계측기',
    icon:'⚙️',color:'#7c3aed',bg:'#f5f3ff',
    title:`계측기 사용: ${H.e(e.name||'-')}`,
    desc:`코드: ${H.e(e.code||'-')} | 상태: ${H.e(e.status||'-')}`,
    sub:`교정만료: ${H.e(e.next||'-')}`,
    status:'',
  }));
  matchCal.forEach(c=>events.push({
    date:c.date||'',type:'교정',
    icon:'📐',color:'#059669',bg:'#f0fdf4',
    title:`교정 완료: ${H.e(c.equip_code||'-')}`,
    desc:`교정기관: ${H.e(c.agency||'-')} | 성적서: ${H.e(c.cert||'-')}`,
    sub:`유효기간: ${H.e(c.next_date||'-')}`,
    status:'pass',
  }));

  /* 날짜순 정렬 */
  events.sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  /* 렌더 */
  let h='';

  /* 요약 카드 */
  h+='<div class="stat-dash" style="margin-bottom:16px">';
  h+='<div class="sd-card"><div class="sd-icon" style="background:#eff6ff;color:#2563eb">🔍</div>'
    +'<div><div class="sd-val">'+matchInsp.length+'</div><div class="sd-lbl">검사 이력</div></div></div>';
  h+='<div class="sd-card"><div class="sd-icon" style="background:#fff5f5;color:#dc2626">⚠️</div>'
    +'<div><div class="sd-val">'+matchNc.length+'</div><div class="sd-lbl">부적합</div></div></div>';
  h+='<div class="sd-card"><div class="sd-icon" style="background:#f5f3ff;color:#7c3aed">⚙️</div>'
    +'<div><div class="sd-val">'+matchEquip.length+'</div><div class="sd-lbl">사용 계측기</div></div></div>';
  h+='<div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#059669">📐</div>'
    +'<div><div class="sd-val">'+matchCal.length+'</div><div class="sd-lbl">교정 이력</div></div></div>';
  h+='</div>';

  /* 검색 결과 제목 */
  h+='<div style="font-size:13px;font-weight:700;color:var(--tx);margin-bottom:12px">'
    +'🔗 "'+H.e(q)+'" 추적 결과 — 총 '+events.length+'건</div>';

  /* 타임라인 */
  h+='<div style="position:relative;padding-left:28px">';
  /* 세로선 */
  h+='<div style="position:absolute;left:9px;top:0;bottom:0;width:2px;background:var(--bd)"></div>';

  events.forEach((ev,i)=>{
    h+='<div style="position:relative;margin-bottom:16px">';
    /* 타임라인 점 */
    h+='<div style="position:absolute;left:-24px;top:4px;width:14px;height:14px;border-radius:50%;'
      +'background:'+ev.color+';border:2px solid #fff;box-shadow:0 0 0 2px '+ev.color+'"></div>';
    /* 카드 */
    h+='<div class="card" style="padding:12px 16px;border-left:3px solid '+ev.color+';background:'+ev.bg+'">';
    /* 헤더 */
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    h+='<span style="font-size:14px">'+ev.icon+'</span>';
    h+='<span style="font-size:13px;font-weight:700;color:'+ev.color+'">'+H.e(ev.title)+'</span>';
    if(ev.date) h+='<span style="font-size:11px;color:var(--tm);margin-left:auto">'+H.e(ev.date)+'</span>';
    if(ev.status==='pass') h+='<span class="badge bgrn" style="font-size:10px">합격</span>';
    if(ev.status==='fail') h+='<span class="badge bred" style="font-size:10px">불합격</span>';
    h+='</div>';
    /* 내용 */
    h+='<div style="font-size:12px;color:#374151;margin-bottom:4px">'+ev.desc+'</div>';
    h+='<div style="font-size:11px;color:var(--tm)">'+ev.sub+'</div>';
    h+='</div></div>';
  });

  if(!events.length){
    h+='<div style="text-align:center;padding:20px;color:var(--tl)">이벤트 없음</div>';
  }
  h+='</div>';  /* 타임라인 end */

  el.innerHTML=h;
},
_inspStdDetail(row){
  Modal.open({title:`📋 검사 기준서 — ${row.item_name}`,size:'mxl',
    body:`<div class="g2" style="margin-bottom:14px">
      <div><div class="ir"><div class="il">품목코드</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.item_code)}</div></div>
      <div class="ir"><div class="il">품목명</div><div class="iv"><strong>${H.e(row.item_name)}</strong></div></div>
      <div class="ir"><div class="il">검사유형</div><div class="iv"><span class="badge bblu">${H.e(row.insp_type)}</span></div></div></div>
      <div><div class="ir"><div class="il">AQL</div><div class="iv">${H.e(row.aql)}</div></div>
      <div class="ir"><div class="il">검사수준</div><div class="iv">${H.e(row.sample_level)}</div></div>
      <div class="ir"><div class="il">개정번호/일</div><div class="iv">Rev.${H.e(row.rev)} / ${row.updated}</div></div></div>
    </div>
    <div style="font-size:13px;font-weight:700;margin-bottom:9px">📌 검사 항목 (${row.criteria.length}개)</div>
    <div class="xl-result"><table><thead><tr><th>No</th><th>검사항목</th><th>측정방법</th><th>규격/기준</th><th>단위</th><th>USL</th><th>LSL</th><th>검사빈도</th></tr></thead>
    <tbody>${row.criteria.map(c=>`<tr><td style="text-align:center">${c.no}</td><td><strong>${H.e(c.item)}</strong></td><td>${H.e(c.method)}</td><td>${H.e(c.spec)}</td><td style="text-align:center">${H.e(c.unit)}</td><td style="text-align:center;color:var(--err)">${H.e(c.usl)}</td><td style="text-align:center;color:var(--acc)">${H.e(c.lsl)}</td><td style="text-align:center">${H.e(c.freq)}</td></tr>`).join('')}</tbody></table></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bpri" onclick="Toast.show('수정 기능 — 추가 개발 예정','info')">수정</button>`});
},
_inspStdForm(){
  Modal.open({title:'📋 검사 기준서 등록',size:'mxl',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">품목</label><select class="fc"><option value="">선택</option>${DB.items.map(i=>`<option>${H.e(i.item_code)}-${H.e(i.item_name)}</option>`).join('')}</select></div>
      <div class="fgroup"><label class="fl req">검사유형</label><select class="fc"><option>수입</option><option>공정</option><option>출하</option></select></div>
      <div class="fgroup"><label class="fl">AQL</label><select class="fc">${['0.065','0.1','0.25','0.4','0.65','1.0','1.5','2.5'].map(v=>`<option>${v}</option>`).join('')}</select></div>
      <div class="fgroup"><label class="fl">검사수준</label><select class="fc"><option>I</option><option selected>II</option><option>III</option></select></div>
      <div class="fgroup"><label class="fl">개정번호</label><input class="fc" value="1.0"></div>
      <div class="fgroup"><label class="fl">개정일</label><input class="fc" type="date" value="${H.today()}"></div>
    </div>
    <div style="margin-top:14px"><div style="font-size:13px;font-weight:700;margin-bottom:9px">검사 항목</div>
    <table class="ctbl"><thead><tr><th>No</th><th>항목</th><th>측정방법</th><th>규격/기준</th><th>단위</th><th>USL</th><th>LSL</th><th>빈도</th><th></th></tr></thead>
    <tbody id="stdBody"><tr><td style="text-align:center;color:var(--tm)">1</td><td><input class="fc" placeholder="외관"></td><td><input class="fc" placeholder="육안"></td><td><input class="fc"></td><td><input class="fc" style="width:50px"></td><td><input class="fc" style="width:65px"></td><td><input class="fc" style="width:65px"></td><td><input class="fc" placeholder="전수"></td><td><button onclick="this.closest('tr').remove()" style="color:var(--err)">✕</button></td></tr></tbody></table>
    <button class="btn bsm bout" style="margin-top:7px" onclick="Pages._addStdRow()">+ 항목 추가</button></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('기준서가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`});
},
_addStdRow(){
  const b=document.getElementById('stdBody');if(!b)return;
  const n=b.rows.length+1;const tr=document.createElement('tr');
  tr.innerHTML=`<td style="text-align:center;color:var(--tm)">${n}</td><td><input class="fc"></td><td><input class="fc"></td><td><input class="fc"></td><td><input class="fc" style="width:50px"></td><td><input class="fc" style="width:65px"></td><td><input class="fc" style="width:65px"></td><td><input class="fc"></td><td><button onclick="this.closest('tr').remove()" style="color:var(--err)">✕</button></td>`;
  b.appendChild(tr);
},
_certDetail(row){
  Modal.open({title:`📜 검사 성적서 — ${row.cert_no}`,size:'mxl',
    body:`<div style="border:2px solid var(--pri);border-radius:var(--rl);overflow:hidden">
      <div style="background:var(--pri);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-size:18px;font-weight:800">검사 성적서 (COA)</div><div style="font-size:12px;opacity:.8">QMS 품질경영시스템</div></div>
        <div style="text-align:right;font-size:13px"><div style="font-weight:700">${H.e(row.cert_no)}</div><div style="opacity:.8">${row.issued}</div></div>
      </div>
      <div style="padding:16px 20px">
        <div class="g2" style="margin-bottom:14px">
          <div><div class="ir"><div class="il">품목명</div><div class="iv"><strong>${H.e(row.item_name)}</strong></div></div>
          <div class="ir"><div class="il">LOT번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.lot)}</div></div>
          <div class="ir"><div class="il">검사유형</div><div class="iv"><span class="badge bblu">${H.e(row.insp_type)}</span></div></div></div>
          <div><div class="ir"><div class="il">검사일</div><div class="iv">${row.insp_date}</div></div>
          <div class="ir"><div class="il">수량/샘플</div><div class="iv">${H.n(row.qty)}EA / ${row.sample_qty}EA</div></div>
          <div class="ir"><div class="il">검사자/승인</div><div class="iv">${H.e(row.inspector)} / ${H.e(row.approver)}</div></div></div>
        </div>
        <div class="xl-result"><table><thead><tr><th>검사항목</th><th>규격/기준</th><th>측정값</th><th>판정</th></tr></thead>
        <tbody>${row.results.map(r=>`<tr class="${r.judge==='합격'?'row-ok':'row-dup'}"><td><strong>${H.e(r.item)}</strong></td><td>${H.e(r.spec)}</td><td style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.measured)}</td><td><span class="badge ${r.judge==='합격'?'bgrn':'bred'}">${H.e(r.judge)}</span></td></tr>`).join('')}</tbody></table></div>
        <div style="margin-top:14px;padding:12px 16px;border-radius:var(--r);background:${row.final==='합격'?'#f0fdf4':'#fff1f2'};border:2px solid ${row.final==='합격'?'#86efac':'#fca5a5'};display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:16px;font-weight:800;color:${row.final==='합격'?'var(--ok)':'var(--err)'}">최종 판정: ${row.final==='합격'?'✅ 합격':'❌ 불합격'}</div>
          <div style="font-size:12px;color:var(--tm)">발행일: ${row.issued}</div>
        </div>
      </div></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bout" onclick="window.print()">🖨️ 인쇄</button><button class="btn bpri" onclick="Toast.show('PDF 저장—백엔드 연동 후','info')">📥 PDF 저장</button>`});
},
_lotDetail(row){
  Modal.open({title:`🔗 LOT 추적 — ${row.lot}`,size:'mlg',
    body:`<div class="ir"><div class="il">LOT번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.lot)}</div></div>
    <div class="ir"><div class="il">품목명</div><div class="iv"><strong>${H.e(row.item_name)}</strong></div></div>
    <div class="ir"><div class="il">공급업체</div><div class="iv">${H.e(row.vendor)}</div></div>
    <div class="ir"><div class="il">수량/잔여</div><div class="iv">${H.n(row.recv_qty)}EA / 잔여 ${H.n(row.remain_qty)}EA</div></div>
    <div class="ir"><div class="il">검사결과</div><div class="iv"><span class="badge ${row.insp_result==='합격'?'bgrn':'bred'}">${H.e(row.insp_result)}</span></div></div>
    <div class="ir"><div class="il">Hold</div><div class="iv">${row.hold?`<span class="badge bred">Hold 중</span> <span style="font-size:12px;color:var(--tm)">${H.e(row.hold_reason||'')}</span>`:`<span class="badge bgrn">정상</span>`}</div></div>
    ${row.used_in.length?`<div style="margin-top:14px"><div style="font-size:13px;font-weight:700;margin-bottom:9px">📦 사용처 (${row.used_in.length}건)</div><div class="xl-result"><table><thead><tr><th>LOT</th><th>품목</th><th>수량</th><th>처리일</th></tr></thead><tbody>${row.used_in.map(u=>`<tr><td style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(u.wip_lot)}</td><td>${H.e(u.item)}</td><td style="text-align:right">${H.n(u.qty)}EA</td><td>${u.date}</td></tr>`).join('')}</tbody></table></div></div>`:`<div style="margin-top:14px;padding:12px;background:var(--bg);border-radius:var(--r);text-align:center;color:var(--tm)">사용 이력 없음</div>`}`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>${row.hold?`<button class="btn bok" onclick="Toast.show('Hold 해제(더미)','ok')">Hold 해제</button>`:''}`});
},
_reinspDetail(row){
  Modal.open({title:'재검사 상세',size:'mmd',
    body:`<div class="ir"><div class="il">재검사번호</div><div class="iv">${H.e(row.reinsp_no)}</div></div>
    <div class="ir"><div class="il">원 LOT</div><div class="iv">${H.e(row.orig_lot)}</div></div>
    <div class="ir"><div class="il">품목명</div><div class="iv">${H.e(row.item_name)}</div></div>
    <div class="ir"><div class="il">재검사일</div><div class="iv">${H.e(row.reinsp_date)}</div></div>
    <div class="ir"><div class="il">수량/불합격</div><div class="iv">${H.n(row.qty)}EA / 불합격 ${row.reject_qty}EA</div></div>
    <div class="ir"><div class="il">사유</div><div class="iv">${H.e(row.reason)}</div></div>
    <div class="ir"><div class="il">검사자</div><div class="iv">${H.e(row.inspector)}</div></div>
    <div class="ir"><div class="il">결과</div><div class="iv"><span class="badge ${row.result==='합격'?'bgrn':'bred'}">${H.e(row.result)}</span></div></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`});
},
});

/* ══ E: SQM ══ */
Object.assign(Pages,{
async sqm_eval(){
  /* [v2.394] 업체 평가 — SB 연동 + 자동 집계 + F3 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [evals,vendors,insp,nc]=await Promise.all([
      SB.getVendorEvals(),SB.getVendors(),SB.getInspections(),SB.getNc()
    ]);
    if(Array.isArray(evals))  DB.vendor_evals=evals;
    if(Array.isArray(vendors))DB.vendors=vendors;
    if(Array.isArray(insp))   DB.inspections=insp;
    if(Array.isArray(nc))     DB.nc=nc;
  }catch(e){console.warn('[sqm_eval]',e);}
  if(!DB.vendor_evals) DB.vendor_evals=[];

  if(w.querySelector('#evalTbl')){Pages._sqmEvalRefresh();return;}

  const GC={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  const GL={A:'우수',B:'양호',C:'주의 (개선)',D:'부적격 (검토)'};
  const ev=DB.vendor_evals;
  const cnt={A:ev.filter(e=>e.grade==='A').length,B:ev.filter(e=>e.grade==='B').length,
             C:ev.filter(e=>e.grade==='C').length,D:ev.filter(e=>e.grade==='D').length};
  const avgScore=ev.length?(ev.reduce((s,e)=>s+(e.total||0),0)/ev.length).toFixed(1):'N/A';

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⭐</div>
        <div><div class="sd-val">${ev.length}</div><div class="sd-lbl">전체 평가</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">🏆</div>
        <div><div class="sd-val">${cnt.A+cnt.B}</div><div class="sd-lbl">우수+양호</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📊</div>
        <div><div class="sd-val">${avgScore}</div><div class="sd-lbl">평균점수</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div>
        <div><div class="sd-val">${cnt.D}</div><div class="sd-lbl">부적격</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">⭐ 공급업체 평가</div>
        <div class="psub">품질·납기·가격·대응 종합평가 — A/B/C/D 등급 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._sqmEvalForm()">+ 평가 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="evalSearch" placeholder="거래처명, 평가기간 검색..."
          oninput="Pages._sqmEvalRefresh()">
      </div>
      <select class="fsel" id="evalGradeF" onchange="Pages._sqmEvalRefresh()">
        <option value="">전체 등급</option>
        ${['A','B','C','D'].map(g=>`<option value="${g}">${g}등급 — ${GL[g]}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_eval')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="evalTbl"></div>`;
  Pages._sqmEvalRefresh();
},

_sqmEvalRefresh(){
  const q=(document.getElementById('evalSearch')?.value||'').toLowerCase();
  const gr=document.getElementById('evalGradeF')?.value||'';
  const filtered=(DB.vendor_evals||[]).filter(r=>{
    const mQ=!q||(r.vendor_name||'').toLowerCase().includes(q)||(r.period||'').toLowerCase().includes(q);
    const mG=!gr||r.grade===gr;
    return mQ&&mG;
  });
  const GC={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  Tbl.render({
    el:'#evalTbl',
    cols:[
      {key:'vendor_name', label:'거래처명', req:true},
      {key:'period',      label:'평가기간', w:'90px'},
      {key:'quality',     label:'품질(40%)',w:'78px',align:'center',
        render:v=>`<span style="font-weight:700;color:${v>=90?'#059669':v>=70?'#d97706':'#dc2626'}">${v||'-'}</span>`},
      {key:'delivery',    label:'납기(30%)',w:'78px',align:'center',
        render:v=>`<span style="font-weight:700;color:${v>=90?'#059669':v>=70?'#d97706':'#dc2626'}">${v||'-'}</span>`},
      {key:'price',       label:'가격(20%)',w:'78px',align:'center'},
      {key:'response',    label:'대응(10%)',w:'78px',align:'center'},
      {key:'total',       label:'종합점수', w:'82px',align:'center',
        render:v=>`<span style="font-weight:800;font-size:14px;color:${v>=90?'#059669':v>=70?'#d97706':'#dc2626'}">${v||'-'}</span>`},
      {key:'grade',       label:'등급',     w:'58px',align:'center',
        render:v=>{const c={A:'bgrn',B:'bblu',C:'bamb',D:'bred'};return`<span class="badge ${c[v]||'bgry'}" style="font-size:12px;font-weight:800">${v||'-'}</span>`;}},
      {key:'ppm',         label:'PPM',      w:'68px',align:'right',
        render:v=>`<span style="font-weight:700;color:${v>1000?'#dc2626':v>500?'#d97706':'#059669'}">${H.n(v)||'-'}</span>`},
      {key:'complaint',   label:'클레임',   w:'62px',align:'center',
        render:v=>`<span style="${v>0?'color:#dc2626;font-weight:700':''}">${v||'0'}</span>`},
      {key:'eval_date',   label:'평가일',   w:'90px'},
      {key:'evaluator',   label:'평가자',   w:'70px'},
    ],
    data:filtered,
    onRow:row=>Pages._sqmEvalDetail(row),
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      const _doDelete=async()=>{
        for(const id of numIds) await SB.deleteVendorEval(id);
        Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        Pages._sqmEvalRefresh();
      };
      Modal.confirm({title:'🗑️ 평가 삭제',
        msg:`<div style="text-align:center"><div style="font-size:28px">⚠️</div><div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 평가를 삭제합니다.</div></div>`,
        danger:true,onOk:_doDelete});
    }
  });
},
_sqmEvalDetail(row){
  const gc={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  const gl={A:'우수 (계속 거래)',B:'양호 (유지)',C:'주의 (개선 요청)',D:'부적격 (거래 중단 검토)'};
  Modal.open({title:`⭐ 업체 평가 상세 — ${row.vendor_name}`,size:'mlg',
    body:`<div style="text-align:center;margin-bottom:18px">
      <div style="display:inline-block;background:${gc[row.grade]||'#475569'};color:#fff;border-radius:50%;width:68px;height:68px;line-height:68px;font-size:28px;font-weight:900">${row.grade}</div>
      <div style="font-size:12px;margin-top:7px;color:var(--tm)">${gl[row.grade]||''}</div>
      <div style="font-size:22px;font-weight:800;color:${row.total>=90?'var(--ok)':row.total>=70?'var(--warn)':'var(--err)'}">${row.total}점</div>
    </div>
    <div class="g2" style="margin-bottom:14px">
      ${[['품질(40%)',row.quality,'var(--ok)'],['납기(30%)',row.delivery,'#3b82f6'],['가격(20%)',row.price,'#8b5cf6'],['대응(10%)',row.response,'#f59e0b']].map(([lbl,val,color])=>`
      <div style="padding:12px;background:var(--bg);border-radius:var(--r)"><div style="font-size:12px;color:var(--tm);margin-bottom:5px">${lbl}</div>
      <div style="background:#e5e7eb;border-radius:999px;height:8px;margin-bottom:4px"><div style="background:${color};width:${val}%;height:100%;border-radius:999px"></div></div>
      <div style="font-size:17px;font-weight:700;color:${color}">${val}점</div></div>`).join('')}
    </div>
    <div class="ir"><div class="il">PPM</div><div class="iv" style="font-weight:700;color:${row.ppm<500?'var(--ok)':row.ppm<2000?'var(--warn)':'var(--err)'}">${H.n(row.ppm)} PPM</div></div>
    <div class="ir"><div class="il">클레임</div><div class="iv" style="${row.complaint>0?'color:var(--err);font-weight:700':''}">${row.complaint}건</div></div>
    <div class="ir"><div class="il">평가기간/일</div><div class="iv">${H.e(row.period)} / ${row.eval_date}</div></div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bpri" onclick="Toast.show('평가서 인쇄(더미)','info')">🖨️ 인쇄</button>`});
},
_sqmEvalForm(row=null){
  /* [v2.394] 업체 평가 등록/수정 폼 */
  const isEdit=!!row;
  const vendorOpts=(DB.vendors||[]).map(v=>
    `<option value="${H.e(v.id||v.vendor_name)}" data-name="${H.e(v.vendor_name)}"
      ${isEdit&&row.vendor_name===v.vendor_name?'selected':''}>${H.e(v.vendor_name)}</option>`
  ).join('');
  const staffOpts=(DB.users||[]).map(u=>
    `<option value="${H.e(u.name||u.username)}"
      ${isEdit&&row.evaluator===(u.name||u.username)?'selected':''}>${H.e(u.name||u.username)}</option>`
  ).join('');
  Modal.open({
    title:isEdit?`✏️ 평가 수정 — ${row.vendor_name}`:'⭐ 업체 평가 등록',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._sqmEvalSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">거래처</label>
        <select class="fc" id="evVendor"
          onchange="const s=this.options[this.selectedIndex];document.getElementById('evVName').value=s.dataset.name||s.value">
          <option value="">-- 선택 --</option>${vendorOpts}</select>
        <input type="hidden" id="evVName" value="${H.e(isEdit?row.vendor_name||'':'')}">
      </div>
      <div class="fgroup"><label class="fl req">평가기간</label>
        <input class="fc" id="evPeriod" value="${isEdit?H.e(row.period||''):''}" placeholder="예) 2026-Q2">
      </div>
      <div class="fgroup"><label class="fl req">품질 점수 (40%)</label>
        <input class="fc" type="number" id="evQuality" min="0" max="100"
          value="${isEdit?row.quality||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">납기 점수 (30%)</label>
        <input class="fc" type="number" id="evDelivery" min="0" max="100"
          value="${isEdit?row.delivery||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">가격 점수 (20%)</label>
        <input class="fc" type="number" id="evPrice" min="0" max="100"
          value="${isEdit?row.price||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">대응 점수 (10%)</label>
        <input class="fc" type="number" id="evResponse" min="0" max="100"
          value="${isEdit?row.response||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup">
        <label class="fl">종합점수 (자동)</label>
        <input class="fc" id="evTotal" value="${isEdit?row.total||'':''}" readonly
          style="font-weight:800;font-size:16px;color:#2563eb">
      </div>
      <div class="fgroup">
        <label class="fl">등급 (자동)</label>
        <input class="fc" id="evGrade" value="${isEdit?row.grade||'':''}" readonly
          style="font-weight:800;font-size:16px">
      </div>
      <div class="fgroup"><label class="fl">PPM</label>
        <input class="fc" type="number" id="evPpm" value="${isEdit?row.ppm||'0':'0'}" min="0">
      </div>
      <div class="fgroup"><label class="fl">클레임 건수</label>
        <input class="fc" type="number" id="evComplaint" value="${isEdit?row.complaint||'0':'0'}" min="0">
      </div>
      <div class="fgroup"><label class="fl req">평가일</label>
        <input class="fc" type="date" id="evDate" value="${isEdit?H.e(row.eval_date||''):H.today()}">
      </div>
      <div class="fgroup"><label class="fl">평가자</label>
        <select class="fc" id="evEvaluator">
          <option value="">-- 선택 --</option>${staffOpts}</select>
      </div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">비고</label>
        <textarea class="fc" id="evNote" rows="2">${H.e(isEdit?row.note||'':'')}</textarea>
      </div>
    </div>`,
  });
  window._sqmEvalEditRow=row;
  if(isEdit) setTimeout(()=>Pages._sqmCalcTotal(),80);
},

/* 종합점수 자동 계산 [v2.394] */
_sqmCalcTotal(){
  const g=id=>Number(document.getElementById(id)?.value||0);
  const total=+(g('evQuality')*0.4+g('evDelivery')*0.3+g('evPrice')*0.2+g('evResponse')*0.1).toFixed(1);
  const grade=total>=90?'A':total>=80?'B':total>=70?'C':'D';
  const tEl=document.getElementById('evTotal');
  const gEl=document.getElementById('evGrade');
  if(tEl){tEl.value=total;tEl.style.color=total>=90?'#059669':total>=80?'#2563eb':total>=70?'#d97706':'#dc2626';}
  if(gEl){gEl.value=grade;gEl.style.color=total>=90?'#059669':total>=80?'#2563eb':total>=70?'#d97706':'#dc2626';}
},

/* 업체 평가 저장 [v2.394] */
async _sqmEvalSave(){
  const g=id=>document.getElementById(id)?.value||'';
  const vName=g('evVName')||g('evVendor');
  const period=g('evPeriod').trim();
  const quality=Number(g('evQuality')),delivery=Number(g('evDelivery'));
  const price=Number(g('evPrice')),response=Number(g('evResponse'));
  const total=Number(g('evTotal'));
  const grade=g('evGrade');
  const evalDate=g('evDate');
  if(!vName){Toast.show('거래처를 선택하세요.','warn');return;}
  if(!period){Toast.show('평가기간을 입력하세요.','warn');return;}
  if(!quality&&!delivery){Toast.show('점수를 입력하세요.','warn');return;}
  if(!evalDate){Toast.show('평가일을 입력하세요.','warn');return;}
  const row=window._sqmEvalEditRow;
  const newRow={vendor_name:vName,period,quality,delivery,price,response,
    total,grade,ppm:Number(g('evPpm'))||0,complaint:Number(g('evComplaint'))||0,
    eval_date:evalDate,evaluator:g('evEvaluator'),note:g('evNote')};
  if(row?.id){
    const res=await SB.updateVendorEval(row.id,newRow);
    if(!res.ok) return;
    Toast.show('평가가 수정되었습니다.','ok');
  } else {
    const res=await SB.addVendorEval(newRow);
    if(!res.ok) return;
    Toast.show('평가가 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._sqmEvalRefresh();
},
async sqm_audit(){
  /* [v2.394] 업체 심사 — SB 연동 + 계획/진도/칸반 탭 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [audits,vendors]=await Promise.all([SB.getVendorAudits(),SB.getVendors()]);
    if(Array.isArray(audits)) DB.vendor_audits=audits;
    if(Array.isArray(vendors))DB.vendors=vendors;
  }catch(e){console.warn('[sqm_audit]',e);}
  if(!DB.vendor_audits) DB.vendor_audits=[];
  if(w.querySelector('#auditTbl')){Pages._auditRefresh();return;}

  const auds=DB.vendor_audits;
  const plan=auds.filter(a=>a.status==='계획').length;
  const ing=auds.filter(a=>a.status==='진행중').length;
  const done=auds.filter(a=>a.status==='완료').length;

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#eff6ff;color:#2563eb">📅</div>
        <div><div class="sd-val">${auds.length}</div><div class="sd-lbl">전체 심사</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📋</div>
        <div><div class="sd-val">${plan}</div><div class="sd-lbl">계획</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🔄</div>
        <div><div class="sd-val">${ing}</div><div class="sd-lbl">진행중</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${done}</div><div class="sd-lbl">완료</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">🔎 공급업체 심사</div>
        <div class="psub">정기/수시/특별 심사 계획 · 진도 · 결과 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._sqmAuditForm()">+ 심사 등록 <span class="kbd">F2</span></button>
      </div>
    </div>
    <!-- 탭: 목록 / 칸반 -->
    <div class="stabs" style="margin-bottom:10px">
      <button class="stab-btn on" data-tab="list" onclick="Pages._auditTab('list',this)">📋 목록</button>
      <button class="stab-btn" data-tab="kanban" onclick="Pages._auditTab('kanban',this)">📌 칸반</button>
    </div>
    <div class="tbar" id="auditTbar">
      <div class="sw2"><input type="text" id="auditSearch" placeholder="거래처명, 심사유형 검색..."
        oninput="Pages._auditRefresh()"></div>
      <select class="fsel" id="auditStatusF" onchange="Pages._auditRefresh()">
        <option value="">전체 상태</option>
        ${['계획','진행중','완료','보류'].map(s=>`<option>${s}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_audit')">🔎 <span class="kbd">F3</span></button>
    </div>
    <div class="stab-pane" data-tab="list" style="display:block"><div id="auditTbl"></div></div>
    <div class="stab-pane" data-tab="kanban" style="display:none"><div id="auditKanban"></div></div>`;
  Pages._auditRefresh();
},

_auditTab(tab,btn){
  document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b===btn));
  document.querySelectorAll('.stab-pane[data-tab]').forEach(p=>
    p.style.display=p.dataset.tab===tab?'block':'none');
  if(tab==='kanban') Pages._auditKanban();
},

_auditRefresh(){
  const q=(document.getElementById('auditSearch')?.value||'').toLowerCase();
  const st=document.getElementById('auditStatusF')?.value||'';
  const filtered=(DB.vendor_audits||[]).filter(r=>{
    const mQ=!q||(r.vendor_name||'').toLowerCase().includes(q)||(r.audit_type||'').toLowerCase().includes(q);
    const mS=!st||r.status===st;
    return mQ&&mS;
  });
  Tbl.render({
    el:'#auditTbl',
    cols:[
      {key:'vendor_name', label:'거래처명',  req:true},
      {key:'audit_type',  label:'심사유형',  w:'70px',
        render:v=>`<span class="badge ${v==='정기'?'bblu':v==='수시'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'plan_date',   label:'계획일',   w:'90px', req:true},
      {key:'actual_date', label:'실시일',   w:'90px', render:v=>v||'-'},
      {key:'auditor',     label:'심사자',   w:'72px'},
      {key:'score',       label:'점수',     w:'60px', align:'center',
        render:v=>v!=null?`<span style="font-weight:700;color:${v>=80?'#059669':v>=60?'#d97706':'#dc2626'}">${v}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'findings',    label:'지적사항'},
      {key:'status',      label:'상태',     w:'68px',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='진행중'?'bblu':v==='보류'?'bred':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'next_date',   label:'차기심사',  w:'90px', render:v=>v||'-'},
    ],
    data:filtered,
    onRow:row=>Pages._sqmAuditDetail(row),
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      const _doDelete=async()=>{
        for(const id of numIds) await SB.deleteVendorAudit(id);
        Toast.show(numIds.length+'건 삭제','ok');
        Pages._auditRefresh();
      };
      Modal.confirm({title:'🗑️ 심사 삭제',
        msg:`<div style="text-align:center"><div style="font-size:28px">⚠️</div><div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 심사를 삭제합니다.</div></div>`,
        danger:true,onOk:_doDelete});
    }
  });
},

/* 칸반 보드 [v2.394] */
_auditKanban(){
  const el=document.getElementById('auditKanban');
  if(!el) return;
  const cols=['계획','진행중','완료','보류'];
  const CC={계획:'#2563eb',진행중:'#d97706',완료:'#059669',보류:'#dc2626'};
  let h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">';
  cols.forEach(st=>{
    const items=(DB.vendor_audits||[]).filter(a=>a.status===st);
    h+=`<div style="background:var(--bg2);border-radius:8px;padding:0;border-top:3px solid ${CC[st]}">`;
    h+=`<div style="padding:10px 14px;font-size:13px;font-weight:700;color:${CC[st]}">${st} <span style="background:${CC[st]};color:#fff;border-radius:20px;padding:1px 8px;font-size:11px">${items.length}</span></div>`;
    h+='<div style="padding:4px 8px 8px">';
    items.forEach(a=>{
      h+=`<div class="card" style="padding:10px 12px;margin-bottom:8px;cursor:pointer;border-left:3px solid ${CC[st]}"
        onclick="Pages._sqmAuditDetail(${JSON.stringify(a).replace(/</g,'\u003c').replace(/"/g,'&quot;')})">`;
      h+=`<div style="font-size:12px;font-weight:700;margin-bottom:4px">${H.e(a.vendor_name||'-')}</div>`;
      h+=`<div style="font-size:11px;color:var(--tm)">${H.e(a.audit_type||'-')} | ${H.e(a.plan_date||'-')}</div>`;
      if(a.score!=null) h+=`<div style="font-size:11px;margin-top:3px">점수: <b>${a.score}</b></div>`;
      h+=`<div style="display:flex;gap:4px;margin-top:6px">
        <button style="font-size:10px;padding:2px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer"
          onclick="event.stopPropagation();Pages._sqmAuditForm(${JSON.stringify(a).replace(/</g,'\u003c').replace(/"/g,'&quot;')})">✏️</button>
        <button style="font-size:10px;padding:2px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer"
          onclick="event.stopPropagation();Pages._auditStatusChange(${a.id})">→ 다음단계</button>
      </div></div>`;
    });
    if(!items.length) h+='<div style="text-align:center;padding:20px;font-size:12px;color:var(--tl)">없음</div>';
    h+='</div></div>';
  });
  h+='</div>';
  el.innerHTML=h;
},

/* 심사 상태 다음단계로 변경 [v2.394] */
async _auditStatusChange(id){
  const a=(DB.vendor_audits||[]).find(r=>r.id===id);
  if(!a) return;
  const flow=['계획','진행중','완료'];
  const cur=flow.indexOf(a.status);
  if(cur<0||cur>=flow.length-1){Toast.show('이미 최종 단계입니다.','info');return;}
  const next=flow[cur+1];
  const res=await SB.updateVendorAudit(id,{status:next});
  if(!res.ok) return;
  a.status=next;
  Toast.show(`"${next}"으로 변경되었습니다.`,'ok');
  Pages._auditKanban();
  Pages._auditRefresh();
},

/* 심사 상세 팝업 [v2.394] */
_sqmAuditDetail(row){
  if(!row||typeof row==='number'){
    row=(DB.vendor_audits||[]).find(r=>r.id===row)||{};
  }
  Modal.open({
    title:`🔎 심사 상세 — ${H.e(row.vendor_name||'-')}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bgry bsm" onclick="Modal.close();Pages._sqmAuditForm(${JSON.stringify(row).replace(/</g,'\u003c')})">✏️ 수정</button>`
        +(row.status!=='완료'?`<button class="btn bgrn bsm" onclick="Modal.close();Pages._auditStatusChange(${row.id})">→ 다음단계</button>`:'')
        +`<button class="btn bpri bsm" onclick="Pages._auditSendMail(${row.id})">📧 결과 통보</button>`,
    body:`<div class="card" style="padding:16px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div class="ir"><div class="il">거래처</div><div class="iv" style="font-weight:700">${H.e(row.vendor_name||'-')}</div></div>
      <div class="ir"><div class="il">심사유형</div><div class="iv"><span class="badge bblu">${H.e(row.audit_type||'-')}</span></div></div>
      <div class="ir"><div class="il">계획일</div><div class="iv">${H.e(row.plan_date||'-')}</div></div>
      <div class="ir"><div class="il">실시일</div><div class="iv">${H.e(row.actual_date||'-')}</div></div>
      <div class="ir"><div class="il">심사자</div><div class="iv">${H.e(row.auditor||'-')}</div></div>
      <div class="ir"><div class="il">점수</div><div class="iv" style="font-weight:700;font-size:16px;color:${(row.score||0)>=80?'#059669':(row.score||0)>=60?'#d97706':'#dc2626'}">${row.score??'-'}</div></div>
      <div class="ir"><div class="il">상태</div><div class="iv"><span class="badge ${row.status==='완료'?'bgrn':row.status==='진행중'?'bblu':'bgry'}">${H.e(row.status||'-')}</span></div></div>
      <div class="ir"><div class="il">차기심사</div><div class="iv">${H.e(row.next_date||'-')}</div></div>
      <div class="ir" style="grid-column:1/-1"><div class="il">지적사항</div><div class="iv">${H.e(row.findings||'-')}</div></div>
      <div class="ir" style="grid-column:1/-1"><div class="il">시정조치 요청</div><div class="iv">${H.e(row.corrective_req||'-')}</div></div>
    </div></div>`,
  });
},

/* 심사 등록/수정 폼 [v2.394] */
_sqmAuditForm(row=null){
  const isEdit=!!row;
  const vOpts=(DB.vendors||[]).map(v=>
    `<option value="${H.e(v.vendor_name)}" ${isEdit&&row.vendor_name===v.vendor_name?'selected':''}>${H.e(v.vendor_name)}</option>`
  ).join('');
  const uOpts=(DB.users||[]).map(u=>
    `<option value="${H.e(u.name||u.username)}" ${isEdit&&row.auditor===(u.name||u.username)?'selected':''}>${H.e(u.name||u.username)}</option>`
  ).join('');
  Modal.open({
    title:isEdit?`✏️ 심사 수정 — ${row.vendor_name}`:'🔎 업체 심사 등록',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._sqmAuditSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl req">거래처</label>
        <select class="fc" id="auVendor"><option value="">-- 선택 --</option>${vOpts}</select></div>
      <div class="fgroup"><label class="fl req">심사유형</label>
        <select class="fc" id="auType">
          ${['정기','수시','특별','인증'].map(t=>`<option ${isEdit&&row.audit_type===t?'selected':''}>${t}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl req">계획일</label>
        <input class="fc" type="date" id="auPlanDate" value="${isEdit?H.e(row.plan_date||''):H.today()}"></div>
      <div class="fgroup"><label class="fl">실시일</label>
        <input class="fc" type="date" id="auActualDate" value="${isEdit?H.e(row.actual_date||''):''}"></div>
      <div class="fgroup"><label class="fl">심사자</label>
        <select class="fc" id="auAuditor"><option value="">-- 선택 --</option>${uOpts}</select></div>
      <div class="fgroup"><label class="fl">점수 (0~100)</label>
        <input class="fc" type="number" min="0" max="100" id="auScore" value="${isEdit?row.score||'':''}"></div>
      <div class="fgroup"><label class="fl">상태</label>
        <select class="fc" id="auStatus">
          ${['계획','진행중','완료','보류'].map(s=>`<option ${isEdit&&row.status===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label class="fl">차기 심사일</label>
        <input class="fc" type="date" id="auNextDate" value="${isEdit?H.e(row.next_date||''):''}"></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">지적사항</label>
        <textarea class="fc" id="auFindings" rows="2">${H.e(isEdit?row.findings||'':'')}</textarea></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">시정조치 요청</label>
        <textarea class="fc" id="auCorrective" rows="2">${H.e(isEdit?row.corrective_req||'':'')}</textarea></div>
    </div>`,
  });
  window._sqmAuditEditRow=row;
},

/* 심사 저장 [v2.394] */
async _sqmAuditSave(){
  const g=id=>document.getElementById(id)?.value||'';
  const vendor=g('auVendor').trim();
  const planDate=g('auPlanDate');
  if(!vendor){Toast.show('거래처를 선택하세요.','warn');return;}
  if(!planDate){Toast.show('계획일을 입력하세요.','warn');return;}
  const row=window._sqmAuditEditRow;
  const newRow={vendor_name:vendor,audit_type:g('auType'),plan_date:planDate,
    actual_date:g('auActualDate')||null,auditor:g('auAuditor'),
    score:g('auScore')?Number(g('auScore')):null,
    status:g('auStatus')||'계획',next_date:g('auNextDate')||null,
    findings:g('auFindings'),corrective_req:g('auCorrective')};
  if(row?.id){
    const res=await SB.updateVendorAudit(row.id,newRow);
    if(!res.ok) return;
    Toast.show('심사가 수정되었습니다.','ok');
  } else {
    const res=await SB.addVendorAudit(newRow);
    if(!res.ok) return;
    Toast.show('심사가 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._auditRefresh();
  Pages._auditKanban();
},

/* 심사 결과 메일 발송 [v2.394] — Gmail MCP 연동 */
async _auditSendMail(id){
  const a=(DB.vendor_audits||[]).find(r=>r.id===id);
  if(!a){Toast.show('심사 데이터를 찾을 수 없습니다.','err');return;}
  /* 거래처 이메일 조회 */
  const vendor=(DB.vendors||[]).find(v=>v.vendor_name===a.vendor_name);
  const email=vendor?.email||'';
  Modal.open({
    title:'📧 심사 결과 통보 메일',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._auditMailSend()">📧 발송</button>',
    body:`<div class="fg2">
      <div class="fgroup ff"><label class="fl req">수신 이메일</label>
        <input class="fc" id="mailTo" value="${H.e(email)}" placeholder="vendor@company.com"></div>
      <div class="fgroup ff"><label class="fl req">제목</label>
        <input class="fc" id="mailSubj" value="[INNODIS QMS] ${H.e(a.vendor_name)} 공급업체 심사 결과 통보 (${H.e(a.plan_date||'')})"></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">내용</label>
        <textarea class="fc" id="mailBody" rows="8">${H.e(`안녕하세요.

INNODIS 품질관리팀에서 공급업체 심사 결과를 통보드립니다.

◈ 심사 개요
  - 업체명: ${a.vendor_name}
  - 심사유형: ${a.audit_type||'-'}
  - 심사일: ${a.actual_date||a.plan_date||'-'}
  - 심사자: ${a.auditor||'-'}
  - 심사점수: ${a.score!=null?a.score+'점':'-'}
  - 현재상태: ${a.status||'-'}

◈ 지적사항
${a.findings||'없음'}

◈ 시정조치 요청사항
${a.corrective_req||'없음'}

상기 내용에 대한 시정조치 계획을 30일 이내에 회신해 주시기 바랍니다.

INNODIS 품질관리팀 드림`)}</textarea></div>
    </div>`,
  });
  window._auditMailId=id;
},

async _auditMailSend(){
  const to=document.getElementById('mailTo')?.value.trim();
  const subj=document.getElementById('mailSubj')?.value.trim();
  const body=document.getElementById('mailBody')?.value.trim();
  if(!to){Toast.show('수신 이메일을 입력하세요.','warn');return;}
  if(!subj){Toast.show('제목을 입력하세요.','warn');return;}
  /* Gmail MCP 연동 — 없으면 mailto: 폴백 */
  try{
    const res=await fetch('https://gmailmcp.googleapis.com/mcp/v1',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send_email',to,subject:subj,body,format:'text'})
    });
    if(res.ok){
      /* 발송 이력 저장 */
      const id=window._auditMailId;
      if(id) await SB.updateVendorAudit(id,{result_sent:true,notify_sent:true});
      Modal.close();
      Toast.show('메일이 발송되었습니다.','ok');
    } else {
      throw new Error('발송 실패');
    }
  }catch(e){
    /* 폴백: mailto: */
    const mailHref=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(mailHref,'_blank');
    Modal.close();
    Toast.show('메일 앱이 열렸습니다. 직접 발송해 주세요.','info');
  }
},

/* SQM 대시보드 [v2.394] */
async sqm_dash(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [evals,audits,vendors]=await Promise.all([
      SB.getVendorEvals(),SB.getVendorAudits(),SB.getVendors()
    ]);
    if(Array.isArray(evals))  DB.vendor_evals=evals;
    if(Array.isArray(audits)) DB.vendor_audits=audits;
    if(Array.isArray(vendors))DB.vendors=vendors;
  }catch(e){console.warn('[sqm_dash]',e);}

  const ev=DB.vendor_evals||[];
  const au=DB.vendor_audits||[];
  const vd=DB.vendors||[];
  const GC={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  const GL={A:'우수',B:'양호',C:'주의',D:'부적격'};
  const cnt={A:0,B:0,C:0,D:0};
  ev.forEach(e=>{ if(e.grade) cnt[e.grade]=(cnt[e.grade]||0)+1; });
  const avgScore=ev.length?(ev.reduce((s,e)=>s+(e.total||0),0)/ev.length).toFixed(1):'N/A';
  const auPlan=au.filter(a=>a.status==='계획').length;
  const auIng=au.filter(a=>a.status==='진행중').length;

  w.innerHTML=`
    <div class="ph"><div><div class="ptit">📊 SQM 대시보드</div>
      <div class="psub">공급업체 품질 종합 현황 — 등급 · 심사 진도 · KPI</div></div></div>

    <!-- KPI 카드 -->
    <div class="stat-dash" style="margin-bottom:16px">
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🏢</div>
        <div><div class="sd-val">${vd.length}</div><div class="sd-lbl">총 협력업체</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">⭐</div>
        <div><div class="sd-val">${avgScore}</div><div class="sd-lbl">평균 평가점수</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div>
        <div><div class="sd-val">${cnt.D||0}</div><div class="sd-lbl">부적격 업체</div></div></div>
      <div class="sd-card" style="cursor:pointer" onclick="Nav.go('sqm_audit')">
        <span style="position:absolute;top:6px;right:8px;font-size:11px;color:#2563eb;font-weight:700">↗</span>
        <div class="sd-icon" style="background:#eff6ff;color:#2563eb">📅</div>
        <div><div class="sd-val">${auPlan+auIng}</div><div class="sd-lbl">진행중 심사</div></div></div>
    </div>

    <!-- 등급 분포 + 업체별 점수 -->
    <div class="g2" style="margin-bottom:14px">
      <div class="card">
        <div class="ch"><div class="ct">⭐ 등급 분포</div></div>
        <div style="padding:14px">
          ${['A','B','C','D'].map(g=>{
            const n=cnt[g]||0;
            const pct=ev.length>0?Math.round(n/ev.length*100):0;
            return`<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                <span style="font-weight:700;color:${GC[g]}">${g}등급 — ${GL[g]}</span>
                <span style="color:var(--tm)">${n}개 (${pct}%)</span>
              </div>
              <div style="background:#e5e7eb;border-radius:999px;height:8px">
                <div style="background:${GC[g]};border-radius:999px;height:8px;width:${pct}%;transition:.3s"></div>
              </div></div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="ch"><div class="ct">📅 심사 진도 현황</div></div>
        <div style="padding:14px">
          ${['계획','진행중','완료','보류'].map(st=>{
            const n=au.filter(a=>a.status===st).length;
            const CC2={계획:'#2563eb',진행중:'#d97706',완료:'#059669',보류:'#dc2626'};
            const pct=au.length>0?Math.round(n/au.length*100):0;
            return`<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                <span style="font-weight:700;color:${CC2[st]}">${st}</span>
                <span style="color:var(--tm)">${n}건 (${pct}%)</span>
              </div>
              <div style="background:#e5e7eb;border-radius:999px;height:8px">
                <div style="background:${CC2[st]};border-radius:999px;height:8px;width:${pct}%;transition:.3s"></div>
              </div></div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- 업체별 최근 평가 테이블 -->
    <div class="card">
      <div class="ch"><div class="ct">📋 업체별 최근 평가</div>
        <button class="btn bout bsm" onclick="Nav.go('sqm_eval')">전체보기 ↗</button>
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--bg2)">
          <th style="padding:8px;text-align:left;font-weight:700">거래처</th>
          <th style="padding:8px;text-align:center;font-weight:700">등급</th>
          <th style="padding:8px;text-align:center;font-weight:700">종합점수</th>
          <th style="padding:8px;text-align:center;font-weight:700">PPM</th>
          <th style="padding:8px;text-align:center;font-weight:700">클레임</th>
          <th style="padding:8px;text-align:left;font-weight:700">평가기간</th>
        </tr></thead>
        <tbody>${ev.slice(0,10).map((e,i)=>`
          <tr style="border-bottom:1px solid var(--bd);background:${i%2===0?'#fff':'var(--bg2)'}">
            <td style="padding:7px 8px;font-weight:600">${H.e(e.vendor_name||'-')}</td>
            <td style="padding:7px 8px;text-align:center"><span class="badge ${e.grade==='A'?'bgrn':e.grade==='B'?'bblu':e.grade==='C'?'bamb':'bred'}" style="font-size:11px">${e.grade||'-'}</span></td>
            <td style="padding:7px 8px;text-align:center;font-weight:700;color:${(e.total||0)>=90?'#059669':(e.total||0)>=70?'#d97706':'#dc2626'}">${e.total||'-'}</td>
            <td style="padding:7px 8px;text-align:center">${H.n(e.ppm)||'0'}</td>
            <td style="padding:7px 8px;text-align:center;${(e.complaint||0)>0?'color:#dc2626;font-weight:700':''}">${e.complaint||'0'}</td>
            <td style="padding:7px 8px;color:var(--tm)">${H.e(e.period||'-')}</td>
          </tr>`).join('')}
        ${!ev.length?'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--tl)">평가 데이터 없음</td></tr>':''}
        </tbody>
      </table></div>
    </div>`;
},

/* 심사 계획 관리 [v2.394] */
async sqm_plan(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  try{
    const [audits,vendors]=await Promise.all([SB.getVendorAudits(),SB.getVendors()]);
    if(Array.isArray(audits)) DB.vendor_audits=audits;
    if(Array.isArray(vendors))DB.vendors=vendors;
  }catch(e){console.warn('[sqm_plan]',e);}
  if(!DB.vendor_audits) DB.vendor_audits=[];

  const au=DB.vendor_audits;
  const today=H.today();
  const upcoming=au.filter(a=>a.plan_date&&a.plan_date>=today&&a.status==='계획')
    .sort((a,b)=>a.plan_date.localeCompare(b.plan_date)).slice(0,5);

  w.innerHTML=`
    <div class="ph">
      <div><div class="ptit">📅 심사 계획 관리</div>
        <div class="psub">심사 일정 계획 · 진도 관리 · 칸반 보드</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._sqmAuditForm()">+ 심사 등록 <span class="kbd">F2</span></button>
      </div>
    </div>

    <!-- 예정 심사 알림 -->
    ${upcoming.length?`<div class="card" style="margin-bottom:14px;border:1.5px solid #fde68a;background:#fefce8;padding:14px 18px">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:10px">📅 예정된 심사 (${upcoming.length}건)</div>
      ${upcoming.map(a=>{
        const dDay=Math.ceil((new Date(a.plan_date)-new Date())/(1000*60*60*24));
        return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px">
          <span class="badge ${dDay<=3?'bred':dDay<=7?'bamb':'bblu'}" style="min-width:50px;text-align:center">D-${dDay}</span>
          <span style="font-weight:600">${H.e(a.vendor_name)}</span>
          <span style="color:var(--tm)">${H.e(a.audit_type)} | ${H.e(a.plan_date)}</span>
          <button style="margin-left:auto;font-size:11px;padding:2px 8px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer"
            onclick="Pages._auditSendMail(${a.id})">📧 통보</button>
        </div>`;
      }).join('')}
    </div>`:''}

    <!-- 칸반 보드 -->
    <div class="card">
      <div class="ch"><div class="ct">📌 심사 칸반 보드</div>
        <button class="btn bout bsm" onclick="Nav.go('sqm_audit')">심사 전체목록 ↗</button>
      </div>
      <div id="planKanban" style="padding:14px"></div>
    </div>`;

  /* 칸반 렌더 */
  const el=document.getElementById('planKanban');
  if(el){
    const cols=['계획','진행중','완료','보류'];
    const CC={계획:'#2563eb',진행중:'#d97706',완료:'#059669',보류:'#dc2626'};
    let h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">';
    cols.forEach(st=>{
      const items=au.filter(a=>a.status===st);
      h+=`<div style="background:var(--bg2);border-radius:8px;border-top:3px solid ${CC[st]}">`;
      h+=`<div style="padding:10px 14px;font-size:13px;font-weight:700;color:${CC[st]}">${st} <span style="background:${CC[st]};color:#fff;border-radius:20px;padding:1px 8px;font-size:11px">${items.length}</span></div>`;
      h+='<div style="padding:4px 8px 8px">';
      items.forEach(a=>{
        h+=`<div class="card" style="padding:10px 12px;margin-bottom:8px;cursor:pointer"
          onclick="Pages._sqmAuditDetail(${JSON.stringify(a).replace(/</g,'\u003c').replace(/"/g,'&quot;')})">
          <div style="font-size:12px;font-weight:700">${H.e(a.vendor_name||'-')}</div>
          <div style="font-size:11px;color:var(--tm);margin-top:3px">${H.e(a.audit_type||'-')} | ${H.e(a.plan_date||'-')}</div>
          ${a.score!=null?`<div style="font-size:11px;margin-top:3px">점수: <b>${a.score}</b></div>`:''}
        </div>`;
      });
      if(!items.length) h+='<div style="text-align:center;padding:16px;font-size:12px;color:var(--tl)">없음</div>';
      h+='</div></div>';
    });
    h+='</div>';
    el.innerHTML=h;
  }
},

/* 납품 이력 [v2.394] */
async sqm_delivery(){
  /* [v2.394] spin 최초1회만 */
  const w=document.getElementById('pw');
  const hasLayout=!!w.querySelector('#delivTbl');
  if(!hasLayout) w.innerHTML='<div class="spin"></div>';
  try{
    const [insp,vendors,nc]=await Promise.all([SB.getInspections(),SB.getVendors(),SB.getNc()]);
    if(Array.isArray(insp))    DB.inspections=insp;
    if(Array.isArray(vendors)) DB.vendors=vendors;
    if(Array.isArray(nc))      DB.nc=nc;
  }catch(e){console.warn('[sqm_delivery]',e);}
  if(w.querySelector('#delivTbl')){Pages._delivRefresh();return;}

  w.innerHTML=`
    <div class="ph">
      <div><div class="ptit">🚚 납품 이력</div>
        <div class="psub">거래처별 납품 검사 이력 · 합부율 · 부적합 현황</div></div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="delivSearch" placeholder="거래처명, 품목코드, LOT번호 검색..."
        oninput="Pages._delivRefresh()"></div>
      <select class="fsel" id="delivResultF" onchange="Pages._delivRefresh()">
        <option value="">전체 판정</option>
        <option>합격</option><option>불합격</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_delivery')">🔎 <span class="kbd">F3</span></button>
    </div>
    <div id="delivTbl"></div>`;
  Pages._delivRefresh();
},

_delivRefresh(){
  const q=(document.getElementById('delivSearch')?.value||'').toLowerCase();
  const rs=document.getElementById('delivResultF')?.value||'';
  /* 수입검사 기준으로 납품 이력 표시 */
  const insp=(DB.inspections||[]).filter(r=>r.type==='수입'||r.insp_type==='수입');
  const filtered=insp.filter(r=>{
    const mQ=!q||(r.vendor_name||r.item_name||'').toLowerCase().includes(q)
      ||(r.item_code||'').toLowerCase().includes(q)||(r.lot_no||'').toLowerCase().includes(q);
    const mR=!rs||r.result===rs;
    return mQ&&mR;
  });
  /* 합부율 계산 */
  const total=filtered.length;
  const pass=filtered.filter(r=>r.result==='합격').length;
  const passRate=total>0?(pass/total*100).toFixed(1):'N/A';

  Tbl.render({
    el:'#delivTbl',
    cols:[
      {key:'insp_date',   label:'검사일',   w:'90px', req:true},
      {key:'vendor_name', label:'거래처명'},
      {key:'item_code',   label:'품목코드', w:'100px'},
      {key:'item_name',   label:'품목명',   w:'130px'},
      {key:'lot_no',      label:'LOT번호',  w:'120px'},
      {key:'qty',         label:'수량',     w:'70px', align:'right'},
      {key:'result',      label:'판정',     w:'80px',
        render:v=>`<span class="badge ${v==='합격'?'bgrn':'bred'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'inspector',   label:'검사원',   w:'72px'},
      {key:'cert_no',     label:'성적서',   w:'110px'},
    ],
    data:filtered,
    onRow:row=>{
      /* 해당 거래처 부적합 이력도 표시 */
      const vendorNc=(DB.nc||[]).filter(n=>
        n.item_code===row.item_code||n.lot_no===row.lot_no
      );
      Modal.open({
        title:`🚚 납품 상세 — ${H.e(row.item_name||'-')}`,
        size:'mlg',
        foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>',
        body:`<div class="card" style="padding:14px;margin-bottom:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
            <div class="ir"><div class="il">검사일</div><div class="iv">${H.e(row.insp_date||'-')}</div></div>
            <div class="ir"><div class="il">판정</div><div class="iv"><span class="badge ${row.result==='합격'?'bgrn':'bred'}">${H.e(row.result||'-')}</span></div></div>
            <div class="ir"><div class="il">품목코드</div><div class="iv">${H.e(row.item_code||'-')}</div></div>
            <div class="ir"><div class="il">품목명</div><div class="iv">${H.e(row.item_name||'-')}</div></div>
            <div class="ir"><div class="il">LOT번호</div><div class="iv">${H.e(row.lot_no||'-')}</div></div>
            <div class="ir"><div class="il">수량</div><div class="iv">${row.qty||'-'}</div></div>
          </div>
        </div>
        ${vendorNc.length?`<div class="card" style="padding:14px">
          <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:10px">⚠️ 관련 부적합 (${vendorNc.length}건)</div>
          ${vendorNc.map(n=>`<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--bd)">
            <span class="badge bred" style="font-size:10px;margin-right:6px">${H.e(n.type||'-')}</span>
            ${H.e(n.no||'-')} — ${H.e(n.desc||'-')} (${H.e(n.status||'-')})
          </div>`).join('')}
        </div>`:'<div style="font-size:12px;color:var(--tm);padding:10px">관련 부적합 없음</div>'}`,
      });
    }
  });
},
});

/* ══ C: SPC ══ */
Object.assign(Pages,{
spc_chart(){
  const w=document.getElementById('pw');const data=DB2.spc_data[0];
  const means=data.subgroups.map(sg=>sg.vals.reduce((s,v)=>s+v,0)/sg.vals.length);
  const ranges=data.subgroups.map(sg=>Math.max(...sg.vals)-Math.min(...sg.vals));
  const Xbar=(means.reduce((s,v)=>s+v,0)/means.length).toFixed(4);
  const Rbar=(ranges.reduce((s,v)=>s+v,0)/ranges.length).toFixed(4);
  const A2=0.577,D3=0,D4=2.114;
  const UCLx=(parseFloat(Xbar)+A2*parseFloat(Rbar)).toFixed(4);
  const LCLx=(parseFloat(Xbar)-A2*parseFloat(Rbar)).toFixed(4);
  const UCLr=(D4*parseFloat(Rbar)).toFixed(4);
  const LCLr=(D3*parseFloat(Rbar)).toFixed(4);
  const xPass=v=>v>=parseFloat(LCLx)&&v<=parseFloat(UCLx);
  const rPass=v=>v>=parseFloat(LCLr)&&v<=parseFloat(UCLr);
  const mn_x=Math.min(...means,parseFloat(LCLx))-0.02,mx_x=Math.max(...means,parseFloat(UCLx))+0.02;
  const mn_r=-0.001,mx_r=Math.max(...ranges,parseFloat(UCLr))+0.005;
  const n=means.length,cW=580,cH=155,pad=38;
  const sy=(v,mn,mx)=>pad+(cH-2*pad)*(1-(v-mn)/(mx-mn||1));
  const sx=i=>pad+(cW-2*pad)*i/(n-1);
  const mkPath=(vals,mn,mx)=>vals.map((v,i)=>`${i===0?'M':'L'}${sx(i)},${sy(v,mn,mx)}`).join(' ');
  const mkDots=(vals,mn,mx,pf)=>vals.map((v,i)=>{const col=pf(v)?'var(--ok)':'var(--err)';return`<circle cx="${sx(i)}" cy="${sy(v,mn,mx)}" r="4" fill="${col}"/>`}).join('');
  w.innerHTML=`<div class="ph"><div><div class="ptit">📈 관리도 (X-bar R Chart)</div><div class="psub">공정 안정성 모니터링</div></div></div>
  <div class="tbar"><select class="fsel" style="min-width:220px">${DB2.spc_data.map((d,i)=>`<option value="${i}" ${i===0?'selected':''}>${H.e(d.process)}</option>`).join('')}</select></div>
  <div class="g2" style="margin-bottom:13px">
    <div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 X-bar 관리도</div>
      <svg width="100%" viewBox="0 0 ${cW} ${cH}" style="overflow:visible">
        <line x1="${pad}" y1="${sy(parseFloat(UCLx),mn_x,mx_x)}" x2="${cW-pad}" y2="${sy(parseFloat(UCLx),mn_x,mx_x)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4"/>
        <text x="${cW-pad+3}" y="${sy(parseFloat(UCLx),mn_x,mx_x)+4}" font-size="10" fill="#ef4444">UCL=${UCLx}</text>
        <line x1="${pad}" y1="${sy(parseFloat(Xbar),mn_x,mx_x)}" x2="${cW-pad}" y2="${sy(parseFloat(Xbar),mn_x,mx_x)}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,2"/>
        <text x="${cW-pad+3}" y="${sy(parseFloat(Xbar),mn_x,mx_x)+4}" font-size="10" fill="#2563eb">X̄=${Xbar}</text>
        <line x1="${pad}" y1="${sy(parseFloat(LCLx),mn_x,mx_x)}" x2="${cW-pad}" y2="${sy(parseFloat(LCLx),mn_x,mx_x)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4"/>
        <text x="${cW-pad+3}" y="${sy(parseFloat(LCLx),mn_x,mx_x)+4}" font-size="10" fill="#ef4444">LCL=${LCLx}</text>
        <path d="${mkPath(means,mn_x,mx_x)}" fill="none" stroke="#475569" stroke-width="1.5"/>
        ${mkDots(means,mn_x,mx_x,xPass)}
        ${means.map((v,i)=>`<text x="${sx(i)}" y="${cH-5}" font-size="9" text-anchor="middle" fill="#94a3b8">${data.subgroups[i].date.slice(5)}</text>`).join('')}
      </svg>
    </div>
    <div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 R 관리도 (범위)</div>
      <svg width="100%" viewBox="0 0 ${cW} ${cH}" style="overflow:visible">
        <line x1="${pad}" y1="${sy(parseFloat(UCLr),mn_r,mx_r)}" x2="${cW-pad}" y2="${sy(parseFloat(UCLr),mn_r,mx_r)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4"/>
        <text x="${cW-pad+3}" y="${sy(parseFloat(UCLr),mn_r,mx_r)+4}" font-size="10" fill="#ef4444">UCL=${UCLr}</text>
        <line x1="${pad}" y1="${sy(parseFloat(Rbar),mn_r,mx_r)}" x2="${cW-pad}" y2="${sy(parseFloat(Rbar),mn_r,mx_r)}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,2"/>
        <text x="${cW-pad+3}" y="${sy(parseFloat(Rbar),mn_r,mx_r)+4}" font-size="10" fill="#2563eb">R̄=${Rbar}</text>
        <path d="${mkPath(ranges,mn_r,mx_r)}" fill="none" stroke="#475569" stroke-width="1.5"/>
        ${mkDots(ranges,mn_r,mx_r,rPass)}
        ${ranges.map((v,i)=>`<text x="${sx(i)}" y="${cH-5}" font-size="9" text-anchor="middle" fill="#94a3b8">${data.subgroups[i].date.slice(5)}</text>`).join('')}
      </svg>
    </div>
  </div>
  <div class="g2">
    <div class="card"><div class="ct" style="margin-bottom:10px">📋 관리 한계선</div>
      <table style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th style="padding:7px 10px;text-align:left;border-bottom:2px solid var(--bd)">항목</th><th style="padding:7px 10px;text-align:center;border-bottom:2px solid var(--bd)">UCL</th><th style="padding:7px 10px;text-align:center;border-bottom:2px solid var(--bd)">중심선</th><th style="padding:7px 10px;text-align:center;border-bottom:2px solid var(--bd)">LCL</th></tr></thead>
      <tbody><tr style="border-bottom:1px solid var(--bd)"><td style="padding:7px 10px;font-weight:600">X-bar</td><td style="padding:7px 10px;text-align:center;color:var(--err)">${UCLx}</td><td style="padding:7px 10px;text-align:center;color:#2563eb;font-weight:700">${Xbar}</td><td style="padding:7px 10px;text-align:center;color:var(--acc)">${LCLx}</td></tr>
      <tr><td style="padding:7px 10px;font-weight:600">R</td><td style="padding:7px 10px;text-align:center;color:var(--err)">${UCLr}</td><td style="padding:7px 10px;text-align:center;color:#2563eb;font-weight:700">${Rbar}</td><td style="padding:7px 10px;text-align:center;color:var(--acc)">${LCLr}</td></tr></tbody></table>
    </div>
    <div class="card"><div class="ct" style="margin-bottom:10px">✅ 이상점 판정</div>
      ${means.some(v=>!xPass(v))||ranges.some(v=>!rPass(v))?`<div style="padding:11px;background:#fff1f2;border:1px solid #fca5a5;border-radius:var(--r);color:var(--err);font-size:13px;font-weight:600">⚠️ 관리 한계 이탈 점 발견</div>`:`<div style="padding:11px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--r);color:var(--ok);font-size:13px;font-weight:600">✅ 공정 안정 — 이상점 없음</div>`}
      <div style="margin-top:10px;font-size:12px;color:var(--tm)"><div>• X-bar 이탈: ${means.filter(v=>!xPass(v)).length}/${n}점</div><div>• R 이탈: ${ranges.filter(v=>!rPass(v)).length}/${n}점</div></div>
    </div>
  </div>`;
},
spc_cpk(){
  const w=document.getElementById('pw');const data=DB2.spc_data[0];
  const allVals=data.subgroups.flatMap(sg=>sg.vals);
  const n=allVals.length;
  const mean=allVals.reduce((s,v)=>s+v,0)/n;
  const std=Math.sqrt(allVals.reduce((s,v)=>s+(v-mean)**2,0)/(n-1));
  const usl=data.usl,lsl=data.lsl,target=data.target;
  const cp=((usl-lsl)/(6*std)).toFixed(3);
  const cpu=((usl-mean)/(3*std)).toFixed(3);
  const cpl=((mean-lsl)/(3*std)).toFixed(3);
  const cpk=Math.min(parseFloat(cpu),parseFloat(cpl)).toFixed(3);
  const cpkG=parseFloat(cpk)>=1.67?'A':parseFloat(cpk)>=1.33?'B':parseFloat(cpk)>=1.0?'C':'D';
  const cpkL={A:'우수',B:'양호',C:'보통',D:'개선 필수'};
  const cpkC={A:'var(--ok)',B:'#2563eb',C:'var(--warn)',D:'var(--err)'};
  const hist=Array(10).fill(0);const step=(usl-lsl)/10;
  allVals.forEach(v=>{const bin=Math.min(9,Math.max(0,Math.floor((v-lsl)/step)));hist[bin]++;});
  const maxH=Math.max(...hist)||1;
  w.innerHTML=`<div class="ph"><div><div class="ptit">🎯 공정능력 (Cp/Cpk)</div><div class="psub">공정이 규격을 얼마나 잘 만족하는지 수치화</div></div></div>
  <div class="tbar"><select class="fsel" style="min-width:220px">${DB2.spc_data.map((d,i)=>`<option value="${i}" ${i===0?'selected':''}>${H.e(d.process)}</option>`).join('')}</select></div>
  <div class="stat-dash" style="margin:14px 0">
    <div class="sd-card"><div class="sd-icon" style="background:${cpkC[cpkG]}22;color:${cpkC[cpkG]};font-size:18px;font-weight:900">${cpkG}</div><div><div class="sd-val" style="color:${cpkC[cpkG]}">${cpk}</div><div class="sd-lbl">Cpk</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📏</div><div><div class="sd-val">${cp}</div><div class="sd-lbl">Cp</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">⬆️</div><div><div class="sd-val">${cpu}</div><div class="sd-lbl">Cpu</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⬇️</div><div><div class="sd-val">${cpl}</div><div class="sd-lbl">Cpl</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#475569">〜</div><div><div class="sd-val">${mean.toFixed(4)}</div><div class="sd-lbl">평균</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">σ</div><div><div class="sd-val">${std.toFixed(4)}</div><div class="sd-lbl">표준편차</div></div></div>
  </div>
  <div class="g2">
    <div class="card"><div class="ct" style="margin-bottom:12px">📊 히스토그램</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:110px;padding:0 8px">
        ${hist.map((h,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="width:100%;background:var(--pri);opacity:0.8;height:${Math.round(h/maxH*90)}px;border-radius:3px 3px 0 0;min-height:2px"></div><div style="font-size:8px;color:var(--tm)">${(lsl+step*(i+0.5)).toFixed(2)}</div></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tm);margin-top:6px;padding:0 8px"><span style="color:var(--acc)">LSL:${lsl}</span><span style="color:var(--pri);font-weight:700">T:${target}</span><span style="color:var(--err)">USL:${usl}</span></div>
    </div>
    <div class="card"><div class="ct" style="margin-bottom:12px">📋 공정능력 판정</div>
      <div style="padding:12px;background:${cpkC[cpkG]}15;border:2px solid ${cpkC[cpkG]};border-radius:var(--r);text-align:center;margin-bottom:12px"><div style="font-size:20px;font-weight:900;color:${cpkC[cpkG]}">${cpkL[cpkG]}</div></div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        ${[['1.67 이상','A','우수','#059669'],['1.33~1.67','B','양호','#2563eb'],['1.00~1.33','C','보통','#d97706'],['1.00 미만','D','개선필수','#dc2626']].map(([r,g,l,c])=>`<tr style="border-bottom:1px solid var(--bd);background:${g===cpkG?c+'15':''}"><td style="padding:6px 10px">${r}</td><td style="padding:6px 10px;text-align:center"><span class="badge" style="background:${c}22;color:${c};font-weight:800">${g}</span></td><td style="padding:6px 10px;color:${c};font-weight:${g===cpkG?700:400}">${l}</td></tr>`).join('')}
      </table>
    </div>
  </div>`;
},
spc_pareto(){
  const w=document.getElementById('pw');
  const defects={'치수불량':5,'외관불량':3,'재료불량':2,'포장불량':1,'기타':1};
  const sorted=Object.entries(defects).sort((a,b)=>b[1]-a[1]);
  const total=sorted.reduce((s,[,n])=>s+n,0);
  let cum=0;
  const data=sorted.map(([cat,cnt])=>{cum+=cnt;return{cat,cnt,cum,pct:Math.round(cum/total*100)}});
  const maxN=Math.max(...data.map(d=>d.cnt));
  w.innerHTML=`<div class="ph"><div><div class="ptit">📊 파레토 분석</div><div class="psub">불량 유형별 빈도 분석 (80/20 법칙)</div></div></div>
  <div class="stat-dash" style="margin-bottom:16px">
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div><div><div class="sd-val">${total}</div><div class="sd-lbl">총 불량</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🏆</div><div><div class="sd-val">${data[0].cat}</div><div class="sd-lbl">1위 불량유형</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📉</div><div><div class="sd-val">${Math.round(data[0].cnt/total*100)}%</div><div class="sd-lbl">1위 점유율</div></div></div>
  </div>
  <div class="card">
    <div class="ct" style="margin-bottom:16px">📊 파레토 차트</div>
    <div style="display:flex;align-items:flex-end;gap:0;height:155px;padding:0 10px">
      ${data.map(d=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="font-size:11px;font-weight:700;color:var(--pri);margin-bottom:3px">${d.cnt}</div><div style="width:80%;background:${d.pct<=80?'var(--pri)':'var(--tm)'};height:${Math.round(d.cnt/maxN*125)}px;border-radius:3px 3px 0 0"></div></div>`).join('')}
    </div>
    <div style="display:flex;padding:0 10px">${data.map(d=>`<div style="flex:1;text-align:center;font-size:11px;color:var(--tm);padding-top:4px;border-top:1px solid var(--bd)">${H.e(d.cat)}</div>`).join('')}</div>
    <div style="margin-top:14px">${data.map(d=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px">
      <div style="width:78px;font-weight:500">${H.e(d.cat)}</div>
      <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px"><div style="background:${d.pct<=80?'var(--err)':'var(--tm)'};width:${Math.round(d.cnt/maxN*100)}%;height:100%;border-radius:999px"></div></div>
      <div style="width:26px;text-align:right;font-weight:700">${d.cnt}</div>
      <div style="width:40px;text-align:right;color:var(--tm)">${Math.round(d.cnt/total*100)}%</div>
      <div style="width:50px;text-align:right;font-weight:700;color:${d.pct<=80?'var(--err)':'var(--tm)'}">누적${d.pct}%</div>
    </div>`).join('')}</div>
    <div style="margin-top:10px;padding:10px;background:#eff6ff;border-radius:var(--r);font-size:12px;color:#1d4ed8">
      💡 상위 ${data.filter(d=>d.pct<=80).length}개 유형이 전체 불량의 ${data.filter(d=>d.pct<=80).slice(-1)[0]?.pct||100}%를 차지합니다.
    </div>
  </div>`;
},
});

/* ══ D: 부적합 심화 ══ */
Object.assign(Pages,{
nc_8d(){
  /* [v2.394] 8D Report — DB.reports 기반, tbar+F3+file_url */
  const w=document.getElementById('pw');
  const data=(DB.reports||DB.nc_8d||[]);  /* [v2.394] DB2 제거 */
  const total=data.length;
  const open8d=data.filter(r=>r.status!=='완료'&&r.status!=='종결').length;
  const closed=data.filter(r=>r.status==='완료'||r.status==='종결').length;

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체 8D</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div>
        <div><div class="sd-val">${open8d}</div><div class="sd-lbl">진행중</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#059669">✅</div>
        <div><div class="sd-val">${closed}</div><div class="sd-lbl">완료</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">📋 8D Report</div>
        <div class="psub">품질 문제 8단계 해결 방법론 보고서</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._8dForm()">+ 8D 등록 <span class="kbd">F2</span></button>
        <button class="btn bout bsm btn-f3" onclick="SearchPop.open('nc_8d')">🔍 검색 <span class="kbd">F3</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="8dSearch" placeholder="8D번호, 제목, 담당자 검색..."
          oninput="Pages._8dRefresh()">
      </div>
      <select class="fsel" id="8dStatusF" onchange="Pages._8dRefresh()">
        <option value="">전체 상태</option>
        <option>D1-팀구성</option><option>D2-문제기술</option><option>D3-임시조치</option>
        <option>D4-근본원인</option><option>D5-영구조치</option><option>D6-효과검증</option>
        <option>D7-재발방지</option><option>D8-팀인정</option><option>완료</option>
      </select>
    </div>
    <div id="8dTbl"></div>`;
  Pages._8dRefresh();
},

/* 8D 목록 갱신 [v2.394] */
_8dRefresh(){
  const q=(document.getElementById('8dSearch')?.value||'').toLowerCase();
  const sf=document.getElementById('8dStatusF')?.value||'';
  const data=(DB.reports||DB.nc_8d||[]);  /* [v2.394] */
  let filtered=data.filter(r=>
    (!q||(r.title||r.no||'').toLowerCase().includes(q)||(r.owner||'').toLowerCase().includes(q))&&
    (!sf||r.status===sf)
  );
  const el=document.getElementById('8dTbl');
  if(!el) return;
  Tbl.render({
    el,
    cols:[
      {key:'no',         label:'8D번호',   req:true, w:'120px'},
      {key:'title',      label:'제목',      req:true},
      {key:'nc_ref',     label:'부적합참조', w:'110px'},
      {key:'owner',      label:'담당자',     w:'80px'},
      {key:'d1_date',    label:'시작일',     w:'90px'},
      {key:'status',     label:'단계',       w:'80px',
        render:v=>`<span class="badge ${v==='완료'||v==='D8-팀인정'?'bgrn':'bblu'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'file_url',   label:'파일',       w:'60px',  /* [v2.394] */
        render:(v,row)=>v
          ?`<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
              onclick="event.stopPropagation();Pages._reportFilePreview('${H.e(v)}')">📎</button>`
          :'<span style="color:var(--tl);font-size:11px">-</span>'},
    ],
    data:filtered,
    onRow:row=>Pages._8dDetail(row),
    onDel:async(ids)=>{
      const _del=async()=>{
        ids.forEach(id=>{DB.reports=(DB.reports||[]).filter(r=>r.id!==id)});
        Pages._8dRefresh();Toast.show(ids.length+'건 삭제','ok');
      };
      Modal.confirm({title:'🗑️ 8D 삭제',msg:'선택한 8D Report를 삭제합니다.',danger:true,onOk:_del});
    }
  });
},

/* 8D Report 저장 [v2.394] */
async _8dSave(){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('8d_no')||'8D-'+Date.now().toString().slice(-6);
  const title=g('8d_title');
  const nc_ref=g('8d_ncref');
  const owner=g('8d_owner')||Auth._u?.name||'';
  const d1_date=g('8d_d1')||H.today();
  if(!title){Toast.show('제목을 입력하세요.','warn');return;}
  /* 파일 업로드 */
  let file_url=null;
  const fileEl=document.getElementById('8dFile');
  if(fileEl?.files?.length){
    const f=fileEl.files[0];
    const up=await SB.uploadFile('8d', f);
    if(up?.url) file_url=up.url;
  }
  const row={
    id:Date.now(), no, title, nc_ref, owner, d1_date,
    status:'D1-팀구성', file_url,
    d1:g('8d_d1t'),d2:g('8d_d2'),d3:g('8d_d3'),d4:g('8d_d4'),
    d5:g('8d_d5'),d6:g('8d_d6'),d7:g('8d_d7'),d8:g('8d_d8'),
    created_at:new Date().toISOString(),
  };
  if(!DB.reports) DB.reports=[];
  DB.reports.unshift(row);
  Modal.close();
  Toast.show('8D Report가 등록되었습니다.','ok');
  Pages._8dRefresh();
},
_8dDetail(row){
  const steps=[
    {no:'D1',title:'팀 구성',       content:row.d1_team,      icon:'👥',color:'var(--pri)'},
    {no:'D2',title:'문제 기술',     content:row.d2_problem,   icon:'📋',color:'var(--pri)'},
    {no:'D3',title:'즉시 억제 조치',content:row.d3_contain,   icon:'🚫',color:'var(--pri)'},
    {no:'D4',title:'근본 원인 분석',content:row.d4_root,      icon:'🔍',color:'var(--pri)'},
    {no:'D5',title:'시정 조치 계획',content:row.d5_action,    icon:'📝',color:'var(--ok)'},
    {no:'D6',title:'시정 조치 실행',content:row.d6_implement, icon:'⚙️',color:'var(--ok)'},
    {no:'D7',title:'재발 방지 조치',content:row.d7_prevent,   icon:'🛡️',color:'var(--ok)'},
    {no:'D8',title:'팀 인정·종결',  content:row.d8_close,     icon:'✅',color:'var(--acc)'},
  ];
  Modal.open({title:`📝 8D Report — ${row.title}`,size:'mxl',
    body:`<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:14px;padding:11px 15px;background:var(--bg);border-radius:var(--r)">
      <span style="font-size:12px;color:var(--tm)">연계: <strong>${H.e(row.ref_nc)}</strong></span>
      <span style="font-size:12px;color:var(--tm)">담당: <strong>${H.e(row.assignee)}</strong></span>
      <span style="font-size:12px;color:var(--tm)">개시: <strong>${row.open_date}</strong></span>
      <span class="badge ${row.status==='완료'?'bgrn':'bamb'}">${H.e(row.status)}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${steps.map(s=>`<div style="border-left:4px solid ${s.color};padding:12px 16px;background:var(--bg);border-radius:0 var(--r) var(--r) 0"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="background:${s.color};color:#fff;border-radius:50%;width:25px;height:25px;line-height:25px;text-align:center;font-size:11px;font-weight:800;flex-shrink:0">${s.no}</span><span>${s.icon}</span><strong style="font-size:13px">${s.title}</strong></div><div style="font-size:13px;line-height:1.65;white-space:pre-wrap">${H.e(s.content||'-')}</div></div>`).join('')}
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
          <button class="btn bout" onclick="window.print()">🖨️ 인쇄</button>
          <button class="btn bpri" onclick="Toast.show('PDF 저장—백엔드 연동 후','info')">📥 PDF 저장</button>`});
},
_8dForm(){
  Modal.open({title:'📝 8D Report 등록',size:'mxl',body:`<div class="fg2">
    <div class="fgroup"><label class="fl req">연계 부적합번호</label><select class="fc"><option value="">선택</option>${DB.nc.map(n=>`<option>${H.e(n.no)}</option>`).join('')}</select></div>
    <div class="fgroup"><label class="fl req">제목</label><input class="fc" placeholder="8D 보고서 제목"></div>
    <div class="fgroup"><label class="fl req">개시일</label><input class="fc" type="date" value="${H.today()}"></div>
    <div class="fgroup"><label class="fl">책임자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
    <div class="fgroup ff"><label class="fl req">D1. 팀 구성</label><input class="fc" placeholder="팀원 명단"></div>
    <div class="fgroup ff"><label class="fl req">D2. 문제 기술</label><textarea class="fc" rows="2" placeholder="5W1H로 문제 기술"></textarea></div>
    <div class="fgroup ff"><label class="fl req">D3. 즉시 억제 조치</label><textarea class="fc" rows="2"></textarea></div>
    <div class="fgroup ff"><label class="fl req">D4. 근본 원인 분석</label><textarea class="fc" rows="2" placeholder="5-Why 분석 결과"></textarea></div>
    <div class="fgroup ff"><label class="fl">D5. 시정 조치 계획</label><textarea class="fc" rows="2"></textarea></div>
    <div class="fgroup ff"><label class="fl">D6. 시정 조치 실행</label><textarea class="fc" rows="2"></textarea></div>
    <div class="fgroup ff"><label class="fl">D7. 재발 방지 조치</label><textarea class="fc" rows="2"></textarea></div>
    <div class="fgroup ff"><label class="fl">D8. 종결</label><textarea class="fc" rows="1"></textarea></div>
  <!-- 파일 첨부 [v2.394] -->
  <div class="fgroup ff">
    <label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·이미지·문서)</span></label>
    <input class="fc" type="file" id="8dFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">
  </div>
  </div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
    <button class="btn bpri btn-f8" onclick="Pages._8dSave()">등록 <span class="kbd">F8</span></button>`});
},
nc_dispose(){
  /* [v2.394] 반품/폐기처리 — DB.disposals 기반, tbar+F3+F2+onRow */
  const w=document.getElementById('pw');
  const data=(DB.disposals||DB2?.nc_dispose||[]);
  const total=data.length;
  const pending=data.filter(r=>r.status==='대기'||r.status==='처리중'||!r.status).length;
  const done=data.filter(r=>r.status==='완료'||r.status==='처리완료').length;

  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📦</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⏳</div>
        <div><div class="sd-val">${pending}</div><div class="sd-lbl">처리대기</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#059669">✅</div>
        <div><div class="sd-val">${done}</div><div class="sd-lbl">처리완료</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">♻️ 반품/폐기 처리</div>
        <div class="psub">부적합 제품 처리 현황 · 반품/폐기/재작업 이력 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._disposeForm()">+ 처리 등록 <span class="kbd">F2</span></button>
        <button class="btn bout bsm btn-f3" onclick="SearchPop.open('nc_dispose')">🔍 검색 <span class="kbd">F3</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2">
        <input type="text" id="dispSearch" placeholder="등록번호, 품목코드, 품목명 검색..."
          oninput="Pages._dispRefresh()">
      </div>
      <select class="fsel" id="dispTypeF" onchange="Pages._dispRefresh()">
        <option value="">전체 유형</option>
        <option>반품</option><option>폐기</option><option>재작업</option><option>특채</option>
      </select>
      <select class="fsel" id="dispStatusF" onchange="Pages._dispRefresh()">
        <option value="">전체 상태</option>
        <option>대기</option><option>처리중</option><option>완료</option>
      </select>
      <button class="btn bout bsm" onclick="Pages._disposePrint()" title="선택 항목 인쇄">🖨️ 인쇄</button>
    </div>
    <div id="dispTbl"></div>`;
  Pages._dispRefresh();
},

/* 반품/폐기 목록 갱신 [v2.394] */
_dispRefresh(){
  const q=(document.getElementById('dispSearch')?.value||'').toLowerCase();
  const tf=document.getElementById('dispTypeF')?.value||'';
  const sf=document.getElementById('dispStatusF')?.value||'';
  const data=(DB.disposals||DB2?.nc_dispose||[]);
  let filtered=data.filter(r=>
    (!q||(r.no||r.ref_nc||'').toLowerCase().includes(q)||
      (r.item_name||'').toLowerCase().includes(q)||
      (r.item_code||'').toLowerCase().includes(q))&&
    (!tf||r.type===tf)&&
    (!sf||r.status===sf)
  );
  const el=document.getElementById('dispTbl');
  if(!el) return;
  Tbl.render({
    el,
    cols:[
      {key:'no',         label:'처리번호',  req:true, w:'120px'},
      {key:'ref_nc',     label:'부적합번호', w:'120px'},
      {key:'item_code',  label:'품목코드',   w:'90px'},
      {key:'item_name',  label:'품목명',     req:true},
      {key:'qty',        label:'수량',       w:'60px', align:'right'},
      {key:'type',       label:'처리유형',   w:'70px',
        render:v=>`<span class="badge ${v==='반품'?'bred':v==='폐기'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'proc_date',  label:'처리일',     w:'90px'},
      {key:'handler',    label:'처리자',     w:'70px'},
      {key:'status',     label:'상태',       w:'70px',
        render:v=>`<span class="badge ${v==='완료'||v==='처리완료'?'bgrn':v==='처리중'?'bblu':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
    ],
    data:filtered,
    onRow:row=>Pages._disposeDetail(row),
    onDel:async(ids)=>{
      const _del=async()=>{
        DB.disposals=(DB.disposals||[]).filter(r=>!ids.includes(r.id));
        Pages._dispRefresh();Toast.show(ids.length+'건 삭제','ok');
      };
      Modal.confirm({title:'🗑️ 처리이력 삭제',msg:'선택한 처리이력을 삭제합니다.',danger:true,onOk:_del});
    }
  });
},

/* 반품/폐기 등록/수정 폼 [v2.394] */
/* 반품/폐기 등록/수정 폼 [v2.394] */
_disposeForm(row=null){
  const isEdit=!!row;
  Modal.open({
    title:isEdit?'♻️ 처리이력 수정':'♻️ 반품/폐기 처리 등록',
    size:'mmd',
    body:'<div class="fg2">'
      +'<div class="fgroup"><label class="fl req">처리번호</label>'
      +'<input class="fc" id="dp_no" value="'+H.e(row?.no||('DISP-'+Date.now().toString().slice(-6)))+'"></div>'
      +'<div class="fgroup"><label class="fl">부적합 참조번호</label>'
      +'<input class="fc" id="dp_ref" value="'+H.e(row?.ref_nc||'')+'"></div>'
      +'<div class="fgroup"><label class="fl req">품목코드</label>'
      +'<input class="fc" id="dp_code" value="'+H.e(row?.item_code||'')+'"></div>'
      +'<div class="fgroup"><label class="fl req">품목명</label>'
      +'<input class="fc" id="dp_name" value="'+H.e(row?.item_name||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">수량</label>'
      +'<input class="fc" id="dp_qty" type="number" value="'+(row?.qty||'')+'"></div>'
      +'<div class="fgroup"><label class="fl req">처리유형</label>'
      +'<select class="fc" id="dp_type">'
      +'<option value="">선택</option>'
      +['반품','폐기','재작업','특채'].map(function(t){return '<option'+(row?.type===t?' selected':'')+'>'+t+'</option>';}).join('')
      +'</select></div>'
      +'<div class="fgroup"><label class="fl">처리일</label>'
      +'<input class="fc" type="date" id="dp_date" value="'+(row?.proc_date||H.today())+'"></div>'
      +'<div class="fgroup"><label class="fl">처리자</label>'
      +'<input class="fc" id="dp_handler" value="'+H.e(row?.handler||Auth._u?.name||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">상태</label>'
      +'<select class="fc" id="dp_status">'
      +['대기','처리중','완료'].map(function(s){return '<option'+(row?.status===s?' selected':'')+'>'+s+'</option>';}).join('')
      +'</select></div>'
      +'<div class="fgroup" style="grid-column:1/-1"><label class="fl">비고</label>'
      +'<textarea class="fc" id="dp_note" rows="2">'+H.e(row?.note||'')+'</textarea></div>'
      +'</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._disposeSave(window._disposeEditRow)">'+( isEdit?'💾 수정':'✅ 등록')+'</button>',
  });
  window._disposeEditRow=row||null;
},

/* 반품/폐기 인쇄 [v2.394] */
_disposePrint(){
  /* [v2.394] Tbl 체크박스: class=rck, value=row.id */
  const checked=[...document.querySelectorAll('input.rck:checked')];
  const ids=checked.length>0?checked.map(c=>Number(c.value)):null;
  const data=(DB.disposals||[]).filter(r=>ids?ids.includes(r.id):true);
  if(!data.length){Toast.show('인쇄할 항목을 선택하거나 목록에 데이터가 있어야 합니다.','warn');return;}
  const rows=data.map(function(r,i){
    return '<tr>'
      +'<td>'+(i+1)+'</td><td>'+(r.no||'-')+'</td><td>'+(r.ref_nc||'-')+'</td>'
      +'<td>'+(r.item_code||'-')+'</td><td>'+(r.item_name||'-')+'</td><td>'+(r.qty||0)+'</td>'
      +'<td>'+(r.type||'-')+'</td><td>'+(r.proc_date||'-')+'</td>'
      +'<td>'+(r.handler||'-')+'</td><td>'+(r.status||'-')+'</td>'
      +'</tr>';
  }).join('');
  const html='<!DOCTYPE html><html><head><meta charset="utf-8">'
    +'<title>반품/폐기 처리 현황</title>'
    +'<style>body{font-family:sans-serif;font-size:12px}'
    +'table{width:100%;border-collapse:collapse}'
    +'th,td{border:1px solid #ccc;padding:5px 8px;text-align:center}'
    +'th{background:#f1f5f9;font-weight:600}h2{text-align:center}</style></head>'
    +'<body><h2>♻️ 반품/폐기 처리 현황</h2>'
    +'<p style="text-align:right">출력일: '+H.today()+'</p>'
    +'<table><thead><tr>'
    +'<th>No</th><th>처리번호</th><th>부적합번호</th><th>품목코드</th><th>품목명</th>'
    +'<th>수량</th><th>유형</th><th>처리일</th><th>처리자</th><th>상태</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></body></html>';
  /* [v2.394] 팝업 차단 우회 — blob URL 방식 */
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,'_blank');
  if(!w){
    /* 팝업 차단 시 현재 창에서 인쇄 */
    const iframe=document.createElement('iframe');
    iframe.style.display='none';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  } else {
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
},

/* 반품/폐기 저장 [v2.394] */
_disposeSave(row=null){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('dp_no'), code=g('dp_code'), name=g('dp_name'), type=g('dp_type');
  if(!no){Toast.show('처리번호를 입력하세요.','warn');return;}
  if(!name){Toast.show('품목명을 입력하세요.','warn');return;}
  if(!type){Toast.show('처리유형을 선택하세요.','warn');return;}
  const newRow={
    id:row?.id||Date.now(),
    no, ref_nc:g('dp_ref'), item_code:code, item_name:name,
    qty:Number(document.getElementById('dp_qty')?.value)||0,
    type, proc_date:g('dp_date'), handler:g('dp_handler'),
    status:g('dp_status'), note:g('dp_note'),
  };
  if(!DB.disposals) DB.disposals=[];
  if(row?.id){
    const idx=DB.disposals.findIndex(r=>r.id===row.id);
    if(idx>=0) DB.disposals[idx]=newRow;
  } else {
    DB.disposals.unshift(newRow);
  }
  Modal.close();
  Toast.show(row?'수정되었습니다.':'등록되었습니다.','ok');
  Pages._dispRefresh();
},

/* 반품/폐기 상세 팝업 [v2.394] */
_disposeDetail(row){
  Modal.open({
    title:`♻️ 처리이력 상세 — ${H.e(row.no||'-')}`,
    size:'mmd',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
          <button class="btn bgry bsm" onclick="Modal.close();Pages._disposeForm(${JSON.stringify(row).replace(/</g,'\u003c')})">✏️ 수정</button>`,
    body:`<div class="card" style="padding:14px 18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        <div class="ir"><div class="il">처리번호</div><div class="iv" style="font-weight:700">${H.e(row.no||'-')}</div></div>
        <div class="ir"><div class="il">부적합 참조</div><div class="iv">${H.e(row.ref_nc||'-')}</div></div>
        <div class="ir"><div class="il">품목코드</div><div class="iv">${H.e(row.item_code||'-')}</div></div>
        <div class="ir"><div class="il">품목명</div><div class="iv">${H.e(row.item_name||'-')}</div></div>
        <div class="ir"><div class="il">수량</div><div class="iv">${row.qty||'-'}</div></div>
        <div class="ir"><div class="il">처리유형</div><div class="iv"><span class="badge ${row.type==='반품'?'bred':row.type==='폐기'?'bamb':'bgry'}">${H.e(row.type||'-')}</span></div></div>
        <div class="ir"><div class="il">처리일</div><div class="iv">${H.e(row.proc_date||'-')}</div></div>
        <div class="ir"><div class="il">처리자</div><div class="iv">${H.e(row.handler||'-')}</div></div>
        <div class="ir"><div class="il">상태</div><div class="iv"><span class="badge ${row.status==='완료'||row.status==='처리완료'?'bgrn':row.status==='처리중'?'bblu':'bgry'}">${H.e(row.status||'-')}</span></div></div>
        <div class="ir"><div class="il">비고</div><div class="iv">${H.e(row.note||'-')}</div></div>
      </div>
    </div>`,
  });
},
_disposeForm(){Modal.open({title:'♻️ 반품/폐기 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">연계 부적합</label><select class="fc"><option value="">선택</option>${DB.nc.map(n=>`<option>${H.e(n.no)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">처리일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl req">품목</label><select class="fc"><option value="">선택</option>${DB.items.map(i=>`<option>${H.e(i.item_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">LOT번호</label><input class="fc"></div>
  <div class="fgroup"><label class="fl req">총 수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl req">처리방법</label><select class="fc"><option>반품</option><option>폐기</option><option>재작업</option><option>특채</option></select></div>
  <div class="fgroup"><label class="fl">반품 수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">폐기 수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">재작업 수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">처리 비용(원)</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup ff"><label class="fl">비고</label><textarea class="fc" rows="2"></textarea></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('처리가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
nc_trend(){
  const w=document.getElementById('pw');
  const months=['1월','2월','3월','4월','5월'];
  const ncCounts=[0,1,2,3,2];
  const ppmData=[0,800,1200,3500,2800];
  const maxNC=Math.max(...ncCounts)||1;
  const maxPPM=Math.max(...ppmData)||1;
  const ncByType={수입:DB.nc.filter(n=>n.type==='수입').length,공정:DB.nc.filter(n=>n.type==='공정').length,출하:DB.nc.filter(n=>n.type==='출하').length};
  const ncByStatus={접수:DB.nc.filter(n=>n.status==='접수').length,처리중:DB.nc.filter(n=>n.status==='처리중').length,완료:DB.nc.filter(n=>n.status==='완료').length};
  w.innerHTML=`<div class="ph"><div><div class="ptit">📉 불량 트렌드</div><div class="psub">부적합 발생 추이 및 PPM 모니터링</div></div></div>
  <div class="stat-dash" style="margin-bottom:16px">
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div><div><div class="sd-val">${DB.nc.length}</div><div class="sd-lbl">총 부적합</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⏳</div><div><div class="sd-val">${DB.nc.filter(n=>n.status!=='완료').length}</div><div class="sd-lbl">미결</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${DB.nc.filter(n=>n.status==='완료').length}</div><div class="sd-lbl">완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📊</div><div><div class="sd-val">3,500</div><div class="sd-lbl">최고 PPM</div></div></div>
  </div>
  <div class="g2" style="margin-bottom:13px">
    <div class="card"><div class="ct" style="margin-bottom:13px">📈 월별 부적합 발생 건수</div>
      <div style="display:flex;align-items:flex-end;gap:16px;height:130px;padding:0 8px">
        ${months.map((m,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:12px;font-weight:700;color:${ncCounts[i]>2?'var(--err)':ncCounts[i]>0?'var(--warn)':'var(--ok)'}">${ncCounts[i]}</div>
          <div style="width:100%;background:${ncCounts[i]>2?'var(--err)':ncCounts[i]>0?'var(--warn)':'#d1fae5'};height:${Math.round(ncCounts[i]/maxNC*100)}px;border-radius:4px 4px 0 0;min-height:4px"></div>
          <div style="font-size:11px;color:var(--tm)">${m}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="card"><div class="ct" style="margin-bottom:13px">📉 월별 PPM <span style="font-size:11px;color:var(--tm);font-weight:400">(목표: 1,000 이하)</span></div>
      <div style="display:flex;align-items:flex-end;gap:16px;height:130px;padding:0 8px">
        ${months.map((m,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;font-weight:700;color:${ppmData[i]>2000?'var(--err)':ppmData[i]>1000?'var(--warn)':'var(--ok)'}">${ppmData[i]>0?H.n(ppmData[i]):'-'}</div>
          <div style="width:100%;background:${ppmData[i]>2000?'var(--err)':ppmData[i]>1000?'var(--warn)':'var(--ok)'};height:${Math.round(ppmData[i]/maxPPM*100)}px;border-radius:4px 4px 0 0;min-height:${ppmData[i]>0?4:0}px"></div>
          <div style="font-size:11px;color:var(--tm)">${m}</div>
        </div>`).join('')}
      </div>
      <div style="margin-top:8px;padding:4px 8px;background:#eff6ff;border-radius:var(--r);font-size:11px;color:#1d4ed8">⚠️ 4월 PPM 급등 → 알루미늄 바 치수불량 LOT 영향. 5월 감소세.</div>
    </div>
  </div>
  <div class="g2">
    <div class="card"><div class="ct" style="margin-bottom:12px">📋 유형별 현황</div>
      ${Object.entries(ncByType).map(([t,n])=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px">
        <div style="width:68px;font-weight:500">${t}검사</div>
        <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px"><div style="background:var(--pri);width:${DB.nc.length?Math.round(n/DB.nc.length*100):0}%;height:100%;border-radius:999px"></div></div>
        <div style="width:28px;text-align:right;font-weight:700">${n}</div><div style="width:38px;text-align:right;color:var(--tm)">${DB.nc.length?Math.round(n/DB.nc.length*100):0}%</div>
      </div>`).join('')}
    </div>
    <div class="card"><div class="ct" style="margin-bottom:12px">⏳ 상태별 현황</div>
      ${Object.entries(ncByStatus).map(([s,n])=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px">
        <div style="width:48px;font-weight:500">${s}</div>
        <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px"><div style="background:${s==='완료'?'var(--ok)':s==='처리중'?'var(--warn)':'var(--tm)'};width:${DB.nc.length?Math.round(n/DB.nc.length*100):0}%;height:100%;border-radius:999px"></div></div>
        <div style="width:28px;text-align:right;font-weight:700">${n}</div>
        <span class="badge ${s==='완료'?'bgrn':s==='처리중'?'bamb':'bgry'}">${Math.round(n/(DB.nc.length||1)*100)}%</span>
      </div>`).join('')}
    </div>
  </div>`;
},
});

/* ══ Excel 관리 (ExcelMgr) ══ */
const ExcelMgr={
  /* ── 모듈별 컬럼 정의 ──
     key: DB 필드명, label: 헤더, req: 필수여부, sample: 샘플값 */
  _schemas:{
    items:{
      title:'품목등록',
      cols:[
        {key:'major_category',label:'대분류',    req:false, sample:'VALVE'},
        {key:'category',  label:'품목분류',  req:true,  sample:'원자재'},
        {key:'item_code', label:'품목코드', req:true,  req:true,  sample:'RAW-001'},
        {key:'item_name', label:'품목명',   req:true,    req:true,  sample:'스테인레스 플레이트'},
        {key:'spec',      label:'규격',      req:false, sample:'SUS304 2T'},
        {key:'unit',      label:'단위',      req:false, sample:'EA'},
        {key:'material',  label:'재질',      req:false, sample:'SUS304'},
        {key:'vendor_name',label:'주 거래처',req:false, sample:'㈜한국스틸'},
        {key:'active',    label:'사용여부',  req:false, sample:'사용'},
        {key:'remark',    label:'비고',       req:false, sample:''},
      ],
      /* [v2.394] 품목코드만 중복 확인, 필수값 외 빈칸 허용 */
      dupKey:'item_code',
      dupLabel:'품목코드',
      dupOnly:true,        // 중복 확인만, 빈칸은 무시
      getData:()=>DB.items,
    },
    vendors:{
      title:'거래처등록',
      cols:[
        {key:'vendor_type',   label:'유형',         req:false, sample:'원자재'},
        {key:'biz_no',        label:'사업자번호',   req:false, sample:'123-45-67890'},
        {key:'vendor_name',   label:'거래처명',     req:true,  sample:'새거래처㈜'},
        {key:'ceo_name',      label:'대표자',       req:false, sample:'홍길동'},
        {key:'tel',           label:'전화번호',     req:false, sample:'02-0000-0000'},
        {key:'fax',           label:'FAX번호',      req:false, sample:'02-0000-0001'},
        {key:'email',         label:'E-MAIL',       req:false, sample:'info@company.co.kr'},
        {key:'manager',       label:'담당자',       req:false, sample:'김담당'},
        {key:'manager_tel',   label:'담당자 연락처',req:false, sample:'010-0000-0000'},
        {key:'manager_email', label:'담당자 E-MAIL',req:false, sample:'manager@company.co.kr'},
      ],
      /* [v2.394] 거래처명만 중복 확인, 필수값 외 빈칸 허용 */
      dupKey:'vendor_name',
      dupLabel:'거래처명',
      dupOnly:true,
      getData:()=>DB.vendors,
    },
    users:{
      title:'사용자등록',
      cols:[
        {key:'username',   label:'아이디',   req:true,  sample:'user01'},
        {key:'name',       label:'이름',     req:true,  sample:'홍길동'},
        {key:'department', label:'부서',     req:false, sample:'품질팀'},
        {key:'tel',        label:'연락처',   req:false, sample:'010-0000-0000'},
        {key:'email',      label:'E-MAIL',   req:false, sample:'user@company.com'},
        {key:'role',       label:'권한',     req:false, sample:'user'},
      ],
      dupKey:'username',
      dupLabel:'아이디',
      getData:()=>DB.users,
    },
    insp_in:{
      title:'수입검사',
      cols:[
        {key:'type',        label:'검사구분',    req:false, sample:'수입'},
        {key:'vendor',      label:'거래처명',    req:true,  sample:'㈜한국스틸'},
        {key:'insp_no',     label:'검사번호',    req:true,  sample:'INS-20260601-001'},
        {key:'insp_date',   label:'검사일',      req:true,  sample:'2026-06-01'},
        {key:'inspector',   label:'검사자',      req:false, sample:'이검사'},
        {key:'item_code',   label:'품목코드',    req:true,  sample:'RAW-001', note:'품목등록에 있는 품목코드만 사용'},
        {key:'item_name',   label:'품목명',      req:false, sample:'스테인레스 플레이트'},
        {key:'spec',        label:'규격',        req:false, sample:'SUS304 2T'},
        {key:'insp_method', label:'검사방법',    req:false, sample:'치수검사+외관검사'},
        {key:'result',      label:'검사결과',    req:true,  sample:'합격'},
        {key:'qty',         label:'검사수량',    req:true,  sample:'100'},
        {key:'pass_qty',    label:'합격수량',    req:false, sample:'100'},
        {key:'fail_qty',    label:'불합격수량',  req:false, sample:'0'},
        {key:'defect_rate', label:'불량률(%)',   req:false, sample:'0'},
        {key:'wo_no',       label:'작업지시번호',req:false, sample:''},
        {key:'note',        label:'특이사항',    req:false, sample:''},
      ],
      /* [v2.394] 품목코드+거래처명 없으면 등록 안 됨, 동일시트 중복 허용 */
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      getData:()=>DB.inspections.filter(i=>i.type==='수입'),
      validateRow:(row)=>{
        if(!row.item_code) return '품목코드 필수';
        if(!row.vendor)    return '거래처명 필수';
        return null;
      },
    },
    insp_pr:{
      title:'공정검사',
      cols:[
        {key:'type',        label:'검사구분',    req:false, sample:'공정'},
        {key:'vendor',      label:'거래처명',    req:false, sample:''},
        {key:'insp_no',     label:'검사번호',    req:true,  sample:'INS-20260601-001'},
        {key:'insp_date',   label:'검사일',      req:true,  sample:'2026-06-01'},
        {key:'inspector',   label:'검사자',      req:true,  sample:'김품질'},
        {key:'item_code',   label:'품목코드',    req:true,  sample:'SFG-001', note:'품목등록에 있는 품목코드만 사용'},
        {key:'item_name',   label:'품목명',      req:false, sample:'가공 브라켓'},
        {key:'spec',        label:'규격',        req:false, sample:'도면 A-001'},
        {key:'insp_method', label:'검사방법',    req:false, sample:'치수검사+외관'},
        {key:'result',      label:'검사결과',    req:true,  sample:'합격'},
        {key:'qty',         label:'검사수량',    req:true,  sample:'30'},
        {key:'pass_qty',    label:'합격수량',    req:false, sample:'30'},
        {key:'fail_qty',    label:'불합격수량',  req:false, sample:'0'},
        {key:'defect_rate', label:'불량률(%)',   req:false, sample:'0'},
        {key:'wo_no',       label:'작업지시번호',req:false, sample:'WO-20260601'},
        {key:'note',        label:'특이사항',    req:false, sample:''},
      ],
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      /* [v2.394] 품목코드+거래처명 필수, 동일시트 중복 허용 */
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      getData:()=>DB.inspections.filter(i=>i.type==='공정'),
      validateRow:(row)=>{if(!row.item_code) return '품목코드 필수'; if(!row.vendor) return '거래처명 필수'; return null;},
      validateRow:(row)=>{
        if(!DB.items.some(i=>i.item_code===row.item_code))
          return `품목코드 "${row.item_code}" 미등록`;
        return null;
      },
    },
    insp_pu:{
      title:'구매검사',
      cols:[
        {key:'type',        label:'검사구분',    req:false, sample:'구매'},
        {key:'vendor',      label:'거래처명',    req:true,  sample:'화학산업㈜', note:'거래처등록에 있는 거래처만 사용'},
        {key:'insp_no',     label:'검사번호',    req:true,  sample:'INS-20260601-001'},
        {key:'insp_date',   label:'검사일',      req:true,  sample:'2026-06-01'},
        {key:'inspector',   label:'검사자',      req:true,  sample:'이검사'},
        {key:'item_code',   label:'품목코드',    req:true,  sample:'CONS-001', note:'품목등록에 있는 품목코드만 사용'},
        {key:'item_name',   label:'품목명',      req:false, sample:'방청오일'},
        {key:'spec',        label:'규격',        req:false, sample:'ISO VG 32'},
        {key:'insp_method', label:'검사방법',    req:false, sample:'외관검사+성분'},
        {key:'result',      label:'검사결과',    req:true,  sample:'합격'},
        {key:'qty',         label:'검사수량',    req:true,  sample:'50'},
        {key:'pass_qty',    label:'합격수량',    req:false, sample:'50'},
        {key:'fail_qty',    label:'불합격수량',  req:false, sample:'0'},
        {key:'defect_rate', label:'불량률(%)',   req:false, sample:'0'},
        {key:'wo_no',       label:'작업지시번호',req:false, sample:'PO-20260601'},
        {key:'note',        label:'특이사항',    req:false, sample:''},
      ],
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      /* [v2.394] 품목코드+거래처명 필수, 동일시트 중복 허용 */
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      getData:()=>DB.inspections.filter(i=>i.type==='구매'),
      validateRow:(row)=>{if(!row.item_code) return '품목코드 필수'; if(!row.vendor) return '거래처명 필수'; return null;},
      validateRow:(row)=>{
        if(row.vendor&&!DB.vendors.some(v=>v.vendor_name===row.vendor))
          return `거래처 "${row.vendor}" 미등록`;
        if(!DB.items.some(i=>i.item_code===row.item_code))
          return `품목코드 "${row.item_code}" 미등록`;
        return null;
      },
    },
    insp_ou:{
      title:'외주검사',
      cols:[
        {key:'type',        label:'검사구분',    req:false, sample:'외주'},
        {key:'vendor',      label:'거래처명',    req:true,  sample:'정밀측정기㈜', note:'거래처등록에 있는 거래처만 사용'},
        {key:'insp_no',     label:'검사번호',    req:true,  sample:'INS-20260601-001'},
        {key:'insp_date',   label:'검사일',      req:true,  sample:'2026-06-01'},
        {key:'inspector',   label:'검사자',      req:true,  sample:'김품질'},
        {key:'item_code',   label:'품목코드',    req:true,  sample:'SFG-002', note:'품목등록에 있는 품목코드만 사용'},
        {key:'item_name',   label:'품목명',      req:false, sample:'정밀 가공품'},
        {key:'spec',        label:'규격',        req:false, sample:'도면 C-003'},
        {key:'insp_method', label:'검사방법',    req:false, sample:'치수검사 전수'},
        {key:'result',      label:'검사결과',    req:true,  sample:'합격'},
        {key:'qty',         label:'검사수량',    req:true,  sample:'15'},
        {key:'pass_qty',    label:'합격수량',    req:false, sample:'15'},
        {key:'fail_qty',    label:'불합격수량',  req:false, sample:'0'},
        {key:'defect_rate', label:'불량률(%)',   req:false, sample:'0'},
        {key:'wo_no',       label:'작업지시번호',req:false, sample:'OUT-20260601'},
        {key:'note',        label:'특이사항',    req:false, sample:''},
      ],
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      /* [v2.394] 품목코드+거래처명 필수, 동일시트 중복 허용 */
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      getData:()=>DB.inspections.filter(i=>i.type==='외주'),
      validateRow:(row)=>{if(!row.item_code) return '품목코드 필수'; if(!row.vendor) return '거래처명 필수'; return null;},
      validateRow:(row)=>{
        if(row.vendor&&!DB.vendors.some(v=>v.vendor_name===row.vendor))
          return `거래처 "${row.vendor}" 미등록`;
        if(!DB.items.some(i=>i.item_code===row.item_code))
          return `품목코드 "${row.item_code}" 미등록`;
        return null;
      },
    },
    insp_fi:{
      title:'최종검사',
      cols:[
        {key:'type',        label:'검사구분',    req:false, sample:'최종'},
        {key:'vendor',      label:'거래처명',    req:false, sample:''},
        {key:'insp_no',     label:'검사번호',    req:true,  sample:'INS-20260601-001'},
        {key:'insp_date',   label:'검사일',      req:true,  sample:'2026-06-01'},
        {key:'inspector',   label:'검사자',      req:true,  sample:'김품질'},
        {key:'item_code',   label:'품목코드',    req:true,  sample:'FG-001', note:'품목등록에 있는 품목코드만 사용'},
        {key:'item_name',   label:'품목명',      req:false, sample:'완성 어셈블리'},
        {key:'spec',        label:'규격',        req:false, sample:'조립도 B-002'},
        {key:'insp_method', label:'검사방법',    req:false, sample:'기능시험+외관'},
        {key:'result',      label:'검사결과',    req:true,  sample:'합격'},
        {key:'qty',         label:'검사수량',    req:true,  sample:'20'},
        {key:'pass_qty',    label:'합격수량',    req:false, sample:'20'},
        {key:'fail_qty',    label:'불합격수량',  req:false, sample:'0'},
        {key:'defect_rate', label:'불량률(%)',   req:false, sample:'0'},
        {key:'wo_no',       label:'작업지시번호',req:false, sample:'SO-20260601'},
        {key:'note',        label:'특이사항',    req:false, sample:''},
      ],
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      /* [v2.394] 품목코드+거래처명 필수, 동일시트 중복 허용 */
      dupKey:'insp_no', dupLabel:'검사번호',
      allowFileDup:true,
      getData:()=>DB.inspections.filter(i=>i.type==='최종'),
      validateRow:(row)=>{if(!row.item_code) return '품목코드 필수'; if(!row.vendor) return '거래처명 필수'; return null;},
      validateRow:(row)=>{
        if(!DB.items.some(i=>i.item_code===row.item_code))
          return `품목코드 "${row.item_code}" 미등록`;
        return null;
      },
    },
    nc:{
      /* [v2.394] 부적합 스키마 — 사내외/품목코드/수량/원인/조치/기한 추가 */
      title:'부적합관리',
      cols:[
        {key:'no',        label:'부적합번호', req:true, req:true,  sample:'NC-20260601-001'},
        {key:'in_out',    label:'사내외',     req:true,     req:true,  sample:'사내'},
        {key:'type',      label:'유형',       req:true,  sample:'수입'},
        {key:'item_code', label:'품목코드', req:true,   req:false, sample:'ITM-001'},
        {key:'item',      label:'품목명',     req:true,  sample:'알루미늄 바'},
        {key:'qty',       label:'수량',       req:false, sample:'10'},
        {key:'date',      label:'발생일',     req:true,  sample:'2026-06-01'},
        {key:'desc',      label:'부적합내용', req:false, sample:'치수 불량'},
        {key:'cause',     label:'원인분석',   req:false, sample:'금형 마모'},
        {key:'action',    label:'조치내용',   req:false, sample:'전량 반품'},
        {key:'assignee',  label:'담당자',     req:false, sample:'김품질'},
        {key:'due_date',  label:'처리기한',   req:false, sample:'2026-06-15'},
        {key:'status',    label:'상태',       req:false, sample:'접수'},
      ],
      dupKey:'no', dupLabel:'부적합번호', getData:()=>DB.nc,
    },
    equip:{
      title:'계측기등록',
      cols:[
        {key:'code',     label:'계측기코드', req:true,  req:true,  sample:'EQ-006',    note:'필수'},
        {key:'name',     label:'계측기명', req:true,    req:false, sample:'높이게이지'},
        {key:'maker',    label:'제조사',      req:false, sample:'미쓰토요'},
        {key:'range',    label:'측정범위',    req:false, sample:'0~200mm'},
        {key:'res',      label:'분해능',      req:false, sample:'0.01mm'},
        {key:'loc',      label:'보관위치',    req:false, sample:'품질실'},
        {key:'operator', label:'사용자',      req:false, sample:'홍길동'},
        {key:'last',     label:'최근교정일',  req:false, sample:'2026-01-01', note:'YYYY-MM-DD'},
        {key:'next',     label:'차기교정일',  req:false, sample:'2026-07-01', note:'YYYY-MM-DD'},
        {key:'active',   label:'사용여부',    req:false, sample:'사용',       note:'사용/불용'},
      ],
      dupKey:'code', dupLabel:'계측기코드', getData:()=>DB.equip,
    },
    cal:{
      title:'교정관리',
      cols:[
        {key:'code',   label:'계측기코드', req:true,  sample:'EQ-001'},
        {key:'name',   label:'계측기명',   req:false, sample:'버니어캘리퍼스'},
        {key:'date',   label:'교정일',   req:true,     req:true,  sample:'2026-06-01'},
        {key:'agency', label:'교정기관', req:true,   req:true,  sample:'㈜정밀측정'},
        {key:'cert',   label:'성적서번호', req:true, req:false, sample:'CAL-2026-010'},
        {key:'result', label:'결과',       req:true,  sample:'합격'},
        {key:'next',   label:'차기교정일', req:true,  sample:'2026-12-01'},
      ],
      dupKey:'cert', dupLabel:'성적서번호', getData:()=>DB.cals,
    },
    docs:{
      title:'문서관리',
      cols:[
        {key:'no',     label:'문서번호', req:true,  sample:'QP-20260601-001'},
        {key:'type',   label:'유형',     req:true,  sample:'절차서'},
        {key:'title',  label:'제목',     req:true,  sample:'신규 절차서'},
        {key:'rev',    label:'개정번호', req:false, sample:'1.0'},
        {key:'date',   label:'발행일',   req:false, sample:'2026-06-01'},
        {key:'author', label:'작성자',   req:false, sample:'김품질'},
        {key:'status', label:'상태',     req:false, sample:'초안'},
      ],
      dupKey:'no', dupLabel:'문서번호', getData:()=>DB.docs,
    },
    car:{
      title:'시정조치(CAR)',
      cols:[
        {key:'no',       label:'CAR번호',  req:true,  sample:'CAR-20260601-001'},
        {key:'src',      label:'발생원',   req:true,  sample:'부적합'},
        {key:'title',    label:'제목',     req:true,  sample:'개선 조치'},
        {key:'open',     label:'개시일',   req:false, sample:'2026-06-01'},
        {key:'due',      label:'완료기한', req:false, sample:'2026-06-30'},
        {key:'assignee', label:'담당자',   req:false, sample:'김품질'},
        {key:'status',   label:'상태',     req:false, sample:'접수'},
      ],
      dupKey:'no', dupLabel:'CAR번호', getData:()=>DB.cars,
    },

    insp_cert:{
      title:'검사성적서',
      cols:[
        {key:'insp_no',   label:'검사번호',  req:true,  sample:'INSP-20260601-001'},
        {key:'type',      label:'검사유형',  req:true,  sample:'수입'},
        {key:'item_code', label:'품목코드',  req:false, sample:'ITM-001'},
        {key:'item_name', label:'품목명',    req:true,  sample:'알루미늄 바'},
        {key:'lot_no',    label:'LOT번호',   req:false, sample:'LOT-20260601'},
        {key:'insp_date', label:'검사일',    req:true,  sample:'2026-06-01'},
        {key:'qty',       label:'검사수량',  req:false, sample:'100'},
        {key:'result',    label:'판정',      req:true,  sample:'합격'},
        {key:'inspector', label:'검사원',    req:false, sample:'김품질'},
        {key:'cert_no',   label:'성적서번호', req:false, sample:'CERT-2026-001'},
        {key:'note',      label:'비고',      req:false, sample:''},
      ],
      dupKey:'insp_no', dupLabel:'검사번호', getData:()=>DB.inspections||[],
      save:async(rows)=>{
        for(const row of rows){
          const exists=(DB.inspections||[]).find(r=>r.insp_no===row.insp_no);
          if(exists) await SB.updateInspection(exists.id,row);
          else await SB.addInspection(row);
        }
        const fresh=await SB.getInspections();if(fresh) DB.inspections=fresh;
      }
    },

    insp_hold:{
      title:'Hold관리',
      cols:[
        {key:'hold_no',     label:'Hold번호', req:true,  sample:'HOLD-20260601-001'},
        {key:'lot_no',      label:'LOT번호',  req:true,  sample:'LOT-20260601'},
        {key:'item_code',   label:'품목코드', req:false, sample:'ITM-001'},
        {key:'item_name',   label:'품목명',   req:false, sample:'알루미늄 바'},
        {key:'qty',         label:'Hold수량', req:false, sample:'50'},
        {key:'reason',      label:'Hold사유', req:true,  sample:'치수 불량'},
        {key:'issued_by',   label:'발령자',   req:false, sample:'김품질'},
        {key:'issued_date', label:'발령일',   req:true,  sample:'2026-06-01'},
        {key:'status',      label:'상태',     req:false, sample:'Hold중'},
        {key:'ref_insp_no', label:'원검사번호',req:false, sample:'INSP-20260601-001'},
      ],
      dupKey:'hold_no', dupLabel:'Hold번호', getData:()=>DB.holds||[],
      save:async(rows)=>{
        for(const row of rows){
          const exists=(DB.holds||[]).find(r=>r.hold_no===row.hold_no);
          if(exists) await SB.updateHold(exists.id,row);
          else await SB.addHold(row);
        }
        const fresh=await SB.getHolds();if(fresh) DB.holds=fresh;
      }
    },

    insp_reinsp:{
      title:'재검사관리',
      cols:[
        {key:'reinsp_no',  label:'재검사번호', req:true,  sample:'REINSP-20260601-001'},
        {key:'orig_no',    label:'원검사번호', req:false, sample:'INSP-20260601-001'},
        {key:'lot_no',     label:'LOT번호',   req:true,  sample:'LOT-20260601'},
        {key:'item_code',  label:'품목코드',  req:false, sample:'ITM-001'},
        {key:'item_name',  label:'품목명',    req:false, sample:'알루미늄 바'},
        {key:'qty',        label:'수량',      req:false, sample:'50'},
        {key:'req_date',   label:'요청일',    req:true,  sample:'2026-06-01'},
        {key:'insp_date',  label:'검사일',    req:false, sample:'2026-06-05'},
        {key:'inspector',  label:'검사원',    req:false, sample:'이검사'},
        {key:'result',     label:'판정',      req:false, sample:'합격'},
        {key:'status',     label:'상태',      req:false, sample:'요청'},
        {key:'note',       label:'비고',      req:false, sample:''},
      ],
      dupKey:'reinsp_no', dupLabel:'재검사번호', getData:()=>DB.reinspections||[],
      save:async(rows)=>{
        for(const row of rows){
          const exists=(DB.reinspections||[]).find(r=>r.reinsp_no===row.reinsp_no);
          if(exists) await SB.updateReinsp(exists.id,row);
          else await SB.addReinsp(row);
        }
        const fresh=await SB.getReinspections();if(fresh) DB.reinspections=fresh;
      }
    },

    sqm_eval:{
      title:'업체평가',
      cols:[
        {key:'vendor_name', label:'거래처명',  req:true,  sample:'한국스틸㈜'},
        {key:'period',      label:'평가기간',  req:true,  sample:'2026-Q2'},
        {key:'eval_date',   label:'평가일',    req:true,  sample:'2026-06-30'},
        {key:'quality',     label:'품질점수',  req:true,  sample:'90'},
        {key:'delivery',    label:'납기점수',  req:true,  sample:'88'},
        {key:'price',       label:'가격점수',  req:false, sample:'85'},
        {key:'response',    label:'대응점수',  req:false, sample:'90'},
        {key:'total',       label:'종합점수',  req:false, sample:'89.5'},
        {key:'grade',       label:'등급',      req:false, sample:'A'},
        {key:'ppm',         label:'PPM',       req:false, sample:'250'},
        {key:'complaint',   label:'클레임건수', req:false, sample:'0'},
        {key:'evaluator',   label:'평가자',    req:false, sample:'김품질'},
        {key:'note',        label:'비고',      req:false, sample:''},
      ],
      dupKey:'period', dupLabel:'평가기간', getData:()=>DB.vendor_evals||[],
      save:async(rows)=>{
        for(const row of rows){
          await SB.addVendorEval(row);
        }
        const fresh=await SB.getVendorEvals();if(fresh)DB.vendor_evals=fresh;
      }
    },

    sqm_audit:{
      title:'업체심사',
      cols:[
        {key:'vendor_name',   label:'거래처명',    req:true,  sample:'한국스틸㈜'},
        {key:'audit_type',    label:'심사유형',    req:true,  sample:'정기'},
        {key:'plan_date',     label:'계획일',      req:true,  sample:'2026-06-15'},
        {key:'actual_date',   label:'실시일',      req:false, sample:'2026-06-15'},
        {key:'auditor',       label:'심사자',      req:false, sample:'이품질'},
        {key:'score',         label:'점수',        req:false, sample:'85'},
        {key:'findings',      label:'지적사항',    req:false, sample:''},
        {key:'corrective_req',label:'시정조치요청', req:false, sample:''},
        {key:'status',        label:'상태',        req:false, sample:'계획'},
        {key:'next_date',     label:'차기심사일',  req:false, sample:'2026-12-15'},
      ],
      dupKey:'plan_date', dupLabel:'계획일', getData:()=>DB.vendor_audits||[],
      save:async(rows)=>{
        for(const row of rows){
          await SB.addVendorAudit(row);
        }
        const fresh=await SB.getVendorAudits();if(fresh)DB.vendor_audits=fresh;
      }
    },

    insp_std:{
      title:'검사기준서',
      cols:[
        {key:'item_code',       label:'품목코드',   req:true,  sample:'ITM-001'},
        {key:'item_name',       label:'품목명',     req:true,  sample:'알루미늄 바'},
        {key:'insp_type',       label:'검사유형',   req:true,  sample:'수입'},
        {key:'insp_items',      label:'검사항목',   req:true,  sample:'외관,치수,압력'},
        {key:'spec_upper',      label:'규격상한',   req:false, sample:'10.05'},
        {key:'spec_lower',      label:'규격하한',   req:false, sample:'9.95'},
        {key:'spec_unit',       label:'단위',       req:false, sample:'mm'},
        {key:'sampling_method', label:'샘플링방법', req:true,  sample:'전수'},
        {key:'aql',             label:'AQL',        req:false, sample:'1.0'},
        {key:'sample_size',     label:'시료수',     req:false, sample:'5'},
        {key:'criteria',        label:'합부기준',   req:false, sample:'치수 ±0.05mm 이내'},
        {key:'rev',             label:'개정차수',   req:false, sample:'A'},
        {key:'rev_date',        label:'개정일',     req:false, sample:'2026-06-01'},
        {key:'note',            label:'비고',       req:false, sample:''},
      ],
      dupKey:'item_code', dupLabel:'품목코드', getData:()=>DB.insp_std||[],
    }},

  /* ── 양식 내려받기 ── */
  download(page){
    const sc=this._schemas[page];
    if(!sc){Toast.show('엑셀 양식을 지원하지 않는 메뉴입니다.','warn');return}
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도하세요.','warn');return}

    const wb=XLSX.utils.book_new();
    // 헤더 행 데이터
    const headerRow=sc.cols.map(c=>c.req?`${c.label} *`:c.label);
    // 샘플 데이터 행 (2행)
    const sampleRow=sc.cols.map(c=>c.sample||'');
    // 워크시트 생성
    const ws=XLSX.utils.aoa_to_sheet([headerRow,sampleRow]);

    // 컬럼 너비 설정
    ws['!cols']=sc.cols.map(c=>({wch:Math.max(c.label.length*2+4, 14)}));

    // 헤더 스타일 — 필수값 빨간색
    const range=XLSX.utils.decode_range(ws['!ref']);
    for(let C=range.s.c;C<=range.e.c;C++){
      const cellAddr=XLSX.utils.encode_cell({r:0,c:C});
      if(!ws[cellAddr])continue;
      const isReq=sc.cols[C]?.req;
      ws[cellAddr].s={
        font:{bold:true, color:{rgb: isReq?'CC0000':'1A4F8A'}, sz:11},
        fill:{fgColor:{rgb: isReq?'FFF2F2':'EFF6FF'}, patternType:'solid'},
        alignment:{horizontal:'center',vertical:'center'},
        border:{bottom:{style:'medium',color:{rgb:'CBD5E1'}}}
      };
    }
    // 샘플 행 스타일
    for(let C=range.s.c;C<=range.e.c;C++){
      const cellAddr=XLSX.utils.encode_cell({r:1,c:C});
      if(!ws[cellAddr])continue;
      ws[cellAddr].s={
        font:{color:{rgb:'64748B'},italic:true,sz:10},
        fill:{fgColor:{rgb:'F8FAFC'},patternType:'solid'},
        alignment:{horizontal:'left'}
      };
    }
    // 안내 메모 셀 추가 (A3)
    const noteCell=XLSX.utils.encode_cell({r:2,c:0});
    ws[noteCell]={v:'※ 2행은 샘플입니다. 삭제 후 실제 데이터를 입력하세요. 빨간색(*) 항목은 필수입력입니다.',t:'s',
      s:{font:{color:{rgb:'CC0000'},sz:9},alignment:{horizontal:'left'}}};
    if(!ws['!ref'])ws['!ref']='A1:A3';
    else{const r=XLSX.utils.decode_range(ws['!ref']);r.e.r=Math.max(r.e.r,2);ws['!ref']=XLSX.utils.encode_range(r);}
    ws['!merges']=[{s:{r:2,c:0},e:{r:2,c:sc.cols.length-1}}];

    XLSX.utils.book_append_sheet(wb,ws,sc.title);
    XLSX.writeFile(wb,`QMS_${sc.title}_양식.xlsx`);
    Toast.show(`${sc.title} 양식이 다운로드되었습니다.`,'ok');
  },

  /* ── 일괄등록 모달 열기 ── */
  openUpload(page){
    const sc=this._schemas[page];
    if(!sc){Toast.show('일괄등록을 지원하지 않는 메뉴입니다.','warn');return}
    Modal.open({
      title:`📥 ${sc.title} 일괄등록`,size:'mxl',
      body:`
        <div style="margin-bottom:14px;padding:12px 14px;background:#eff6ff;border-radius:var(--r);border:1px solid #bfdbfe;font-size:12px;line-height:1.8">
          <strong>📋 일괄등록 안내</strong><br>
          ① <strong>양식 내려받기</strong>로 엑셀 양식을 다운로드하세요.<br>
          ② 2행(샘플)을 삭제하고 데이터를 입력하세요. 빨간색(*) 항목은 필수입니다.<br>
          ③ 완성된 파일을 아래에 업로드하세요. <strong>${sc.dupLabel}</strong>이(가) 중복된 행은 등록되지 않습니다.
        </div>
        <div class="xl-drop" id="xlDrop" onclick="document.getElementById('xlFileInp').click()"
          ondragover="event.preventDefault();this.classList.add('over')"
          ondragleave="this.classList.remove('over')"
          ondrop="event.preventDefault();this.classList.remove('over');ExcelMgr._parseFile(event.dataTransfer.files[0],'${page}')">
          <div class="xl-drop-icon">📂</div>
          <div class="xl-drop-text">엑셀 파일을 드래그하거나 클릭하여 선택</div>
          <div class="xl-drop-sub">.xlsx, .xls 파일 지원</div>
          <input type="file" id="xlFileInp" accept=".xlsx,.xls" style="display:none"
            onchange="ExcelMgr._parseFile(this.files[0],'${page}')">
        </div>
        <div id="xlResultWrap"></div>`,
      foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
            <button class="btn bpri btn-f8" id="xlRegBtn" style="display:none" onclick="ExcelMgr._register('${page}')">
              ✅ 일괄등록 <span class="kbd">F8</span>
            </button>`
    });
    this._parsed=null;
    this._page=page;
  },

  /* ── 파일 파싱 ── */
  _parseFile(file,page){
    if(!file)return;
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리를 불러오는 중입니다.','warn');return}
    const ext=(file.name||'').split('.').pop().toLowerCase();
    if(!['xlsx','xls'].includes(ext)){Toast.show('.xlsx 또는 .xls 파일만 지원합니다.','warn');return}

    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'array',cellDates:false});
        const ws=wb.Sheets[wb.SheetNames[0]];
        this._ws=ws; /* [v2.394] ws 저장 — 날짜 변환에 사용 */
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        /* [v2.394] 날짜 필드 변환 — 엑셀 시리얼/Date객체 → YYYY-MM-DD */
        const _DATE_KEYS=new Set(['insp_date','created_at','updated_at','date','open','due','last','next','cal_date']);
        const _cvDate=(v,ci,ri)=>{
          try{
            const addr=XLSX.utils.encode_cell({r:ri,c:ci});
            const cell=ws[addr];
            if(cell&&(cell.t==='d'||cell.t==='n')){
              if(cell.w&&/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(cell.w)){
                const m=cell.w.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
                if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
              }
              const n=Number(cell.v);
              if(!isNaN(n)&&n>30000&&n<100000){
                const d=new Date(Math.round((n-25569)*86400)*1000);
                return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
              }
            }
          }catch(e){}
          const s=String(v||'').trim();
          if(!s) return '';
          if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
          const n=Number(s);
          if(!isNaN(n)&&n>30000&&n<100000){
            const d=new Date(Math.round((n-25569)*86400)*1000);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
          }
          return s;
        };
        const sc=this._schemas[page];
        const hdrRow=raw[0]||[];
        const lblToKey={};
        (sc?.cols||[]).forEach(c=>{lblToKey[c.label]=c.key;});
        const keyMap=hdrRow.map(h=>lblToKey[String(h||'').replace(/\s*\*\s*$/,'').trim()]||null);
        /* 날짜 변환 적용 */
        const converted=raw.map((row,ri)=>{
          if(ri===0) return row;
          return row.map((val,ci)=>{
            const key=keyMap[ci];
            if(key&&_DATE_KEYS.has(key)) return _cvDate(val,ci,ri);
            return val;
          });
        });
        this._renderPreview(converted,page);
      }catch(err){
        Toast.show('파일을 읽을 수 없습니다. 올바른 엑셀 파일인지 확인하세요.','err');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  /* ── 미리보기 + 중복 체크 ── */
  _renderPreview(raw,page){
    const sc=this._schemas[page];
    if(!raw||raw.length<2){Toast.show('데이터가 없습니다. 2행부터 데이터를 입력하세요.','warn');return}

    /* ── 헤더행(0행) 처리 ──
       [v2.394 버그수정] 인덱스 기반 → 헤더 레이블 기반 파싱
       이전: sc.cols[i] 순서에 맞춰 i번째 셀 매핑 → 엑셀 열 순서가 다르면 오매핑
       수정: 엑셀 헤더 레이블로 key 찾아 매핑 → 열 순서 무관 */
    const headerRow = raw[0].map(h=>String(h||'').replace(/\s*\*\s*$/,'').trim()); // 필수(*) 표시 제거
    // 헤더→key 역매핑 테이블
    const labelToKey={};
    sc.cols.forEach(c=>{labelToKey[c.label]=c.key;});
    // 헤더 인덱스 매핑: colMap[i] = key (없으면 null)
    const colMap=headerRow.map(h=>labelToKey[h]||null);
    // 헤더 매핑 여부 로그
    const mappedCols=colMap.filter(Boolean).length;
    if(mappedCols===0){
      Toast.show('엑셀 헤더와 양식이 일치하지 않습니다. 양식을 다시 내려받아 사용하세요.','err',5000);
      return;
    }

    // 빈 행 제거, 안내문(※로 시작) 제외
    const dataRows=raw.slice(1).filter(r=>r.some(v=>String(v||'').trim()!=='')&&!String(r[0]||'').startsWith('※'));
    if(!dataRows.length){Toast.show('유효한 데이터가 없습니다.','warn');return}

    const existingKeys=new Set((sc.getData()||[]).map(r=>String(r[sc.dupKey]||'').trim()));

    let okCnt=0,dupCnt=0,validErrCnt=0;
    const parsed=dataRows.map(row=>{
      const obj={};
      // 헤더 기반 매핑: 열 순서 무관하게 레이블로 찾아서 저장
      colMap.forEach((key,i)=>{
        if(key) obj[key]=String(row[i]||'').trim();
      });
      // 매핑되지 않은 컬럼은 빈 문자열로 보완
      sc.cols.forEach(c=>{if(obj[c.key]===undefined) obj[c.key]='';});
      const keyVal=obj[sc.dupKey]||'';
      const isDup=keyVal!==''&&existingKeys.has(keyVal);
      const validErr=(!isDup&&sc.validateRow)?sc.validateRow(obj):null;
      if(isDup)dupCnt++;
      else if(validErr)validErrCnt++;
      else okCnt++;
      return{...obj,_dup:isDup,_validErr:validErr,_keyVal:keyVal};
    });
    this._parsed=parsed;
    this._page=page;

    // 결과 렌더링
    const wrap=document.getElementById('xlResultWrap');
    const regBtn=document.getElementById('xlRegBtn');
    if(!wrap)return;

    const thCols=sc.cols.map(c=>`<th>${H.e(c.label)}${c.req?'<span style="color:var(--err)">*</span>':''}</th>`).join('');
    const tRows=parsed.map(r=>{
      const tds=sc.cols.map(c=>`<td>${H.e(r[c.key]||'-')}</td>`).join('');
      let statusTd;
      if(r._dup)
        statusTd=`<td><span class="xl-dup-badge">⚠️ 중복</span></td>`;
      else if(r._validErr)
        statusTd=`<td><span style="background:#fef3c7;color:#92400e;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700">🚫 ${H.e(r._validErr)}</span></td>`;
      else
        statusTd=`<td><span class="xl-ok-badge">✅ 등록가능</span></td>`;
      return`<tr class="${r._dup?'row-dup':r._validErr?'row-dup':'row-ok'}">${tds}${statusTd}</tr>`;
    }).join('');

    wrap.innerHTML=`
      <div class="xl-summary">
        <div class="xl-sum-item xl-sum-total">전체 ${parsed.length}행</div>
        <div class="xl-sum-item xl-sum-ok">✅ 등록가능 ${okCnt}건</div>
        ${dupCnt>0?`<div class="xl-sum-item xl-sum-dup">⚠️ 중복 ${dupCnt}건</div>`:''}
        ${validErrCnt>0?`<div class="xl-sum-item" style="background:#fef3c7;color:#92400e">🚫 미등록 ${validErrCnt}건</div>`:''}
      </div>
      ${dupCnt>0?`<div style="margin-top:8px;padding:9px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:var(--r);font-size:12px;color:#9a3412">
        ⚠️ <strong>${sc.dupLabel}</strong> 중복 ${dupCnt}건은 등록에서 제외됩니다.
      </div>`:''}
      ${validErrCnt>0?`<div style="margin-top:6px;padding:9px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:var(--r);font-size:12px;color:#92400e">
        🚫 거래처명 또는 품목코드가 기준정보에 등록되지 않은 <strong>${validErrCnt}건</strong>은 업로드되지 않습니다. 기준정보에 먼저 등록하세요.
      </div>`:''}
      <div class="xl-result" style="max-height:300px;overflow-y:auto;margin-top:10px">
        <table><thead><tr>${thCols}<th style="background:#e0f2fe;color:#0369a1;min-width:80px">상태</th></tr></thead>
        <tbody>${tRows}</tbody></table>
      </div>`;

    if(regBtn){
      if(okCnt>0){
        regBtn.style.display='';
        regBtn.innerHTML=`✅ 등록가능 ${okCnt}건 일괄등록 <span class="kbd">F8</span>`;
      } else {
        regBtn.style.display='none';
        Toast.show('등록가능한 데이터가 없습니다. 중복을 확인하세요.','warn');
      }
    }
  },

  /* ── 일괄등록 실행 ──
     [v2.394 수정]
     - 버그: active '사용'→1 변환 누락 수정 (Number('사용')=NaN→0 문제)
     - 버그: failCnt 이중 계산 수정
     - 버그: 500건 청크 → Supabase payload 초과로 실패
       해결: 100건 청크 + 50ms 딜레이 (분당 제한 회피)
     - 안전: try/catch 로 청크 실패시 건별 재시도 후 계속 진행
     - 등록 건수 제한: 없음 (Supabase DB 용량 500MB만 제한) */
  async _register(page){
    if(!this._parsed){Toast.show('먼저 파일을 업로드하세요.','warn');return}
    const toRegister=this._parsed.filter(r=>!r._dup&&!r._validErr);
    if(!toRegister.length){Toast.show('등록가능한 데이터가 없습니다.','warn');return}
    const sc=this._schemas[page];
    const today=H.today();

    /* ── 데이터 전처리 ── */
    const rows=toRegister.map(r=>{
      const row={...r};
      delete row._dup; delete row._keyVal; delete row._validErr;
      if(row.qty!==undefined)         row.qty=Number(row.qty)||0;
      if(row.pass_qty!==undefined)    row.pass_qty=Number(row.pass_qty)||0;
      if(row.fail_qty!==undefined)    row.fail_qty=Number(row.fail_qty)||0;
      if(row.defect_rate!==undefined) row.defect_rate=Number(row.defect_rate)||0;
      /* active: '사용'→1, '미사용'→0, 숫자→그대로 */
      if(typeof row.active==='string'){
        row.active=row.active==='사용'?1:row.active==='미사용'?0:1;
      } else {
        row.active=row.active!==undefined?Number(row.active):1;
      }
      if(!row.created_at) row.created_at=today;
      if(!row.updated_at) row.updated_at=today;
      return row;
    });

    /* ── 더미 모드 ── */
    if(!_sb){
      const data=sc.getData();
      let nextId=data.length>0?Math.max(...data.map(r=>r.id||0))+1:1;
      rows.forEach(row=>data.push({id:nextId++,...row}));
      Toast.show(`${rows.length}건이 등록되었습니다.`,'ok');
      Modal.close();
      if(Nav&&page) Nav.go(page);
      return;
    }

    /* ── items 허용 컬럼 추출 함수 ── */
    const toAllowed=row=>{
      /* [v2.394] 테이블별 허용 컬럼만 추출 — SB schema 오류 방지 */
      if(page==='items') return{
        major_category:row.major_category||'',
        category:      row.category||'',
        item_code:     row.item_code||'',
        item_name:     row.item_name||'',
        spec:          row.spec||'',
        unit:          row.unit||'EA',
        material:      row.material||'',
        vendor_id:     row.vendor_id||null,
        vendor_name:   row.vendor_name||'',
        active:        row.active,
        remark:        row.remark||'',
        created_at:    row.created_at||null,
        updated_at:    row.updated_at||null,
      };
      if(page==='equipment'||page==='equip') return{
        code:        row.code||'',
        name:        row.name||'',
        model:       row.model||'',
        maker:       row.maker||'',
        range:       row.range||'',
        res:         row.res||'',
        loc:         row.loc||'',
        operator:    row.operator||'',
        active:      (row.active==='불용'||row.active===0||row.active==='0')?0:1,
        status:      H.equipStatus(row.next),
        next:        row.next||null,
        last:        row.last||null,
        updated_at:  null,
        created_at:  row.created_at||null,
      };
      if(page==='inspections'||page?.startsWith('insp_')) return{
        type:        row.type||'',
        vendor:      row.vendor||'',
        insp_no:     row.insp_no||'',
        insp_date:   row.insp_date||null,
        inspector:   row.inspector||'',
        item_code:   row.item_code||'',
        item_name:   row.item_name||'',
        spec:        row.spec||'',
        insp_method: row.insp_method||'',
        result:      row.result||'합격',
        qty:         Number(row.qty)||0,
        pass_qty:    Number(row.pass_qty)||0,
        fail_qty:    Number(row.fail_qty)||0,
        defect_rate: Number(row.defect_rate)||0,
        wo_no:       row.wo_no||'',
        note:        row.note||'',
        created_at:  row.created_at||null,
        updated_at:  null,
      };
      /* 기타: 내부 필드(_dup, _validErr 등) 제거 후 반환 */
      const clean={...row};
      delete clean._dup; delete clean._keyVal;
      delete clean._validErr; delete clean._rowNum;
      delete clean._errors;
      return clean;
    };

    /* ── 테이블 매핑 ── */
    const tableMap={
      items:'items', vendors:'vendors', users:'users',
      insp_in:'inspections', insp_pr:'inspections',
      insp_pu:'inspections', insp_ou:'inspections', insp_fi:'inspections',
      nc:'nonconformances', equip:'equipment',
      cal:'calibrations', docs:'documents', car:'corrective_actions',
    };
    const tableName=tableMap[page]||page;

    /* ── 테이블별 unique 키 정의 (ON CONFLICT DO NOTHING 처리용) ──
       item_code UNIQUE 제약 위반 시 청크 전체 실패하던 버그 수정
       upsert({ignoreDuplicates:true}) → 중복 행은 건너뛰고 나머지 정상 등록 */
    const conflictMap={
      items:'item_code',
      vendors:'biz_no',
      users:'username',
      inspections:'insp_no',
      equipment:'code',
      equip:'code',
      cal:'cert',
    };
    const conflictCol=conflictMap[page]||null;

    /* [v2.394] equip: SB.addEquip 헬퍼 직접 호출 (검사5종 방식과 동일)
       — bulk insert 경로 우회 → toAllowed/insertOne 의존 제거
       — addEquip 내부에서 allowed 컬럼 필터 + 동적 컬럼 오류 자동 제거 */
    if((page==='equip'||page==='equipment')&&_sb){
      let cnt=0;
      for(const row of rows){
        const res=await SB.addEquip(row);
        if(res.ok){successCnt++;cnt++;}
        else{failCnt++;console.error('[SB] addEquip 실패:',row.code||row.name);}
        if(cnt>0&&cnt%50===0){
          document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
          Toast.show('계측기 등록 중... '+successCnt+'/'+rows.length+'건','info',30000);
        }
        await new Promise(r=>setTimeout(r,30));
      }
      const msg=failCnt>0
        ?`✅ ${successCnt}건 등록 / ❌ ${failCnt}건 실패`
        :`✅ ${successCnt}건 모두 등록 완료`;
      Toast.show(msg, failCnt>0?'warn':'ok', 4000);
      if(successCnt>0){
        await new Promise(r=>setTimeout(r,400));
        DB.equip=await SB.getEquip();
        Modal.close();
        Pages.equip();
      }
      return;
    }

    /* ── Supabase bulk insert ──
       [v2.394 수정] 1000건 제한 해결
       원인: 50ms 딜레이가 너무 짧아 Supabase rate limit 도달
       해결:
         1. 청크간 딜레이 200ms (rate limit 회피)
         2. rate limit(429) 감지 시 지수 백오프 대기 후 재시도
         3. 청크 실패 시 중단 없이 다음 청크 계속 진행
         4. 등록 건수 제한 없음 (Supabase DB 용량 500MB만 제한) */
    const CHUNK=50;  // 100→50으로 축소: payload 크기 줄여 안정성 향상
    let successCnt=0, failCnt=0;
    const totalChunks=Math.ceil(rows.length/CHUNK);

    /* 지수 백오프 딜레이 */
    const sleep=ms=>new Promise(res=>setTimeout(res,ms));
    const isRateLimit=err=>err&&(err.status===429||err.message?.includes('rate')||err.message?.includes('Too Many'));

    const showProgress=done=>{
      document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
      const pct=Math.round(done/rows.length*100);
      Toast.show(`등록 중... ${done}/${rows.length}건 (${pct}%)`,'info',60000);
    };

    /* 단건 upsert/insert (재시도 지원) */
    const insertOne=async(row,retries=3)=>{
      for(let attempt=0;attempt<retries;attempt++){
        try{
          let error;
          if(conflictCol){
            ({error}=await _sb.from(tableName)
              .upsert(row,{onConflict:conflictCol,ignoreDuplicates:true}));
          } else {
            ({error}=await _sb.from(tableName).insert(row));
          }
          if(!error) return {ok:true};
          if(isRateLimit(error)){
            const wait=Math.pow(2,attempt)*1000; // 1s, 2s, 4s
            console.warn(`[SB] rate limit → ${wait}ms 대기 후 재시도`);
            await sleep(wait);
            continue;
          }
          return {ok:false, msg:error.message};
        }catch(e){ return {ok:false, msg:String(e)}; }
      }
      return {ok:false, msg:'max retries exceeded'};
    };

    /* 청크 단위 upsert/insert (실패 시 단건 재시도) */
    const insertChunk=async(insertRows,ci)=>{
      try{
        let error;
        if(conflictCol){
          ({error}=await _sb.from(tableName)
            .upsert(insertRows,{onConflict:conflictCol,ignoreDuplicates:true}));
        } else {
          ({error}=await _sb.from(tableName).insert(insertRows));
        }
        if(!error){ successCnt+=insertRows.length; return; }

        /* rate limit → 충분히 대기 후 청크 재시도 1회 */
        if(isRateLimit(error)){
          console.warn(`[SB] 청크${ci} rate limit → 3s 대기 후 재시도`);
          await sleep(3000);
          let err2;
          if(conflictCol){
            ({error:err2}=await _sb.from(tableName)
              .upsert(insertRows,{onConflict:conflictCol,ignoreDuplicates:true}));
          } else {
            ({error:err2}=await _sb.from(tableName).insert(insertRows));
          }
          if(!err2){ successCnt+=insertRows.length; return; }
        }

        /* 기타 오류 → 단건 재시도 */
        console.warn(`[SB] 청크${ci} 실패(${error.message}) → 단건 재시도`);
        for(const row of insertRows){
          const r=await insertOne(row);
          if(r.ok) successCnt++;
          else { failCnt++; console.error('[SB] 단건 실패:', r.msg); }
          await sleep(50); // 단건 간격
        }
      }catch(e){
        /* 예외 → 단건 재시도 */
        console.error(`[SB] 청크${ci} 예외:`, e);
        for(const row of insertRows){
          const r=await insertOne(row);
          if(r.ok) successCnt++; else failCnt++;
          await sleep(30);
        }
      }
    };

    for(let ci=0;ci<totalChunks;ci++){
      const chunk=rows.slice(ci*CHUNK,(ci+1)*CHUNK);
      showProgress(ci*CHUNK);
      const insertRows=chunk.map(toAllowed);
      await insertChunk(insertRows,ci);

      /* 청크간 딜레이 200ms (rate limit 방지 핵심) */
      if(ci<totalChunks-1) await sleep(200);
    }
    showProgress(rows.length);


    document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
    const msg=failCnt>0
      ?`✅ ${successCnt}건 등록 / ❌ ${failCnt}건 실패`
      :`✅ ${successCnt}건 모두 등록 완료`;
    Toast.show(msg,failCnt>0?'warn':'ok',6000);
    Modal.close();
    if(Nav&&page) Nav.go(page);
  },

  /* ── 엑셀 다운로드 (현재 목록) ── */
  downloadCurrent(page){
    const sc=this._schemas[page];
    if(!sc||typeof XLSX==='undefined'){Toast.show('다운로드 준비 중...','warn');return}
    const data=sc.getData();
    const header=sc.cols.map(c=>c.label);
    const rows=data.map(r=>sc.cols.map(c=>r[c.key]??''));
    const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
    ws['!cols']=sc.cols.map(c=>({wch:Math.max(c.label.length*2+4,14)}));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,sc.title);
    XLSX.writeFile(wb,`QMS_${sc.title}_목록.xlsx`);
    Toast.show(`현재 목록 ${data.length}건을 다운로드했습니다.`,'ok');
  },

  /* ════════════════════════════════════════════════════
     A+C안: 멀티시트 통합 업로드 [v2.394 신규]
     A: 하나의 파일에 품목/거래처/사용자/수입검사 시트 포함
     C: 전체 정합성 검사 통과 시에만 등록 버튼 활성화
        오류 행에 결과 열 자동 추가, 결과 엑셀 내보내기
     ════════════════════════════════════════════════════ */

  /* 멀티시트 양식 다운로드
     [v2.394] pageFilter: 특정 시트만 포함 (null=전체) */
  downloadAll(pageFilter=''){
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리 로딩 중입니다.','warn');return}
    const wb=XLSX.utils.book_new();
    const ALL_KEYS=['items','vendors','users','insp_in','insp_pr','insp_pu','insp_ou','insp_fi','equip'];
    const keys=pageFilter?[pageFilter]:ALL_KEYS;
    keys.forEach(key=>{
      const sc=this._schemas[key];
      if(!sc) return;
      const header=[...sc.cols.map(c=>c.req?c.label+' *':c.label),'결과'];
      const sample=[...sc.cols.map(c=>c.sample||''),'← 샘플행: 삭제 후 작성'];
      const ws=XLSX.utils.aoa_to_sheet([header,sample]);
      ws['!cols']=[...sc.cols.map(c=>({wch:Math.max(c.label.length*2+4,14)})),{wch:30}];
      XLSX.utils.book_append_sheet(wb,ws,sc.title);
    });
    const fname=pageFilter&&this._schemas[pageFilter]
      ?`QMS_${this._schemas[pageFilter].title}_양식_${H.today()}.xlsx`
      :`QMS_통합업로드양식_${H.today()}.xlsx`;
    XLSX.writeFile(wb,fname);
    Toast.show(`양식이 다운로드되었습니다. (${keys.length}개 시트)`,'ok');
  },

  /* 멀티시트 업로드 모달
     [v2.394] pageFilter: 특정 시트만 표시 (예: 'vendors', 'insp_in' 등)
             null이면 전체 8개 시트 표시 */
  openUploadAll(pageFilter=null){
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리 로딩 중입니다.','warn');return}
    this._multiParsed=null;
    this._pageFilter=pageFilter; // 필터 저장

    /* 표시할 시트 제목 */
    const filterLabels={
      items:'품목등록', vendors:'거래처등록', users:'사용자등록',
      insp_in:'수입검사', insp_pr:'공정검사', insp_pu:'구매검사',
      insp_ou:'외주검사', insp_fi:'최종검사',
      equip:'계측기등록', equipment:'계측기등록',
    };
    const targetLabel=pageFilter?filterLabels[pageFilter]||pageFilter:'전체 (8개 시트)';

    Modal.open({title:`📊 통합 자료 일괄등록 — ${targetLabel}`,size:'mxl',
      body:`
        <div style="padding:12px 14px;background:#eff6ff;border-radius:var(--r);border:1px solid #bfdbfe;font-size:12px;line-height:1.9;margin-bottom:14px">
          <strong>📋 통합 일괄등록 안내</strong><br>
          ① <strong>통합 양식 내려받기</strong>로 멀티시트 양식을 다운로드하세요.<br>
          ② 데이터를 입력하고 빨간색(*) 필수 항목, 샘플 행(2행)은 삭제 후 작성하세요.<br>
          ③ 업로드 후 <strong>전체 정합성 검사</strong>를 통과해야 등록 버튼이 활성화됩니다.<br>
          ④ 오류 시 <strong>결과 열</strong>에 오류 원인 표시 → 수정 후 재업로드하세요.
        </div>
        <div style="margin-bottom:12px">
          <button class="btn bpri bsm" onclick="ExcelMgr.downloadAll('${pageFilter||''}')">📥 양식 내려받기</button>
        </div>
        <div class="xl-drop" id="xlDropAll"
          onclick="document.getElementById('xlFileAll').click()"
          ondragover="event.preventDefault();this.classList.add('over')"
          ondragleave="this.classList.remove('over')"
          ondrop="event.preventDefault();this.classList.remove('over');ExcelMgr._parseMultiSheet(event.dataTransfer.files[0])">
          <div class="xl-drop-icon">📂</div>
          <div class="xl-drop-text">엑셀 파일을 드래그하거나 클릭하여 선택</div>
          <div class="xl-drop-sub">.xlsx, .xls 파일 지원</div>
          <input type="file" id="xlFileAll" accept=".xlsx,.xls" style="display:none"
            onchange="ExcelMgr._parseMultiSheet(this.files[0])">
        </div>
        <div id="multiValidResult" style="margin-top:14px"></div>
      `,
      foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
        <button class="btn bpri" id="btnRegisterAll" disabled
          style="opacity:.4;cursor:not-allowed" onclick="ExcelMgr._registerAll()">
          ✅ 전체 등록 (검증 통과 후 활성화)
        </button>`
    });
  },


  /* 멀티시트 파싱 + 단계별 정합성 검사 */
  async _parseMultiSheet(file){
    if(!file) return;
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리 로딩 중입니다.','warn');return}
    const ext=(file.name||'').split('.').pop().toLowerCase();
    if(!['xlsx','xls'].includes(ext)){Toast.show('.xlsx 또는 .xls 파일만 지원합니다.','warn');return}
    const resEl=document.getElementById('multiValidResult');
    if(resEl) resEl.innerHTML='<div style="text-align:center;padding:20px"><div class="spin"></div><div style="margin-top:8px;color:var(--tm);font-size:13px">파일 분석 중...</div></div>';
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const wb=XLSX.read(ev.target.result,{type:'array'});
        /* 시트명 → 스키마 키 매핑 — [v2.394] 검사 4종 추가 */
        const SMAP_ALL={'품목등록':'items','거래처등록':'vendors','사용자등록':'users',
          '수입검사':'insp_in','공정검사':'insp_pr','구매검사':'insp_pu',
          '외주검사':'insp_ou','최종검사':'insp_fi',
          '계측기등록':'equip'};
        /* [v2.394] pageFilter: 특정 시트만 파싱 */
        const pf=this._pageFilter;
        const SMAP=pf
          ?Object.fromEntries(Object.entries(SMAP_ALL).filter(([,v])=>v===pf))
          :SMAP_ALL;
        const results={};
        let totalOk=0,totalErr=0,totalDup=0;
        /* [v2.394 버그수정] SB 최신 데이터 강제 로드
           실패 시 빈 배열로 초기화 → 구 캐시로 인한 중복 오판 방지 */
        if(_sb){
          try{
            DB.items=await SB.getItems();
            DB.vendors=await SB.getVendors();
            DB.users=await SB.getUsers();
            /* [v2.394] 계측기 중복 체크용 */
            DB.equip=await SB.getEquip();
          }catch(e2){
            DB.items=[]; DB.vendors=[]; DB.users=[]; DB.equip=[];
            console.warn('[멀티업로드] SB 로드 실패, 빈 캐시로 진행');
          }
        }
        for(const [sName,pKey] of Object.entries(SMAP)){
          const ws=wb.Sheets[sName];
          if(!ws){results[pKey]={skip:true,sheetName:sName};continue;}
          const sc=this._schemas[pKey];
          /* [v2.394] raw:true 유지 — 셀 직접 접근으로 날짜 변환 처리 */
          const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
          if(!raw||raw.length<2){results[pKey]={skip:true,sheetName:sName,reason:'데이터 없음'};continue;}
          /* 헤더 기반 매핑 */
          const hdr=raw[0].map(h=>String(h||'').replace(/\s*\*\s*$/,'').trim());
          const lblToKey={};
          sc.cols.forEach(c=>{lblToKey[c.label]=c.key;});
          const cMap=hdr.map(h=>lblToKey[h]||null);
          /* 데이터행: 샘플행 제외 */
          const dataRows=raw.slice(1).filter(r=>{
            const f=String(r[0]||'').trim();
            const last=String(r[sc.cols.length]||'');
            return f!==''&&!f.startsWith('※')&&!last.includes('샘플행');
          });
          if(!dataRows.length){results[pKey]={skip:true,sheetName:sName,reason:'유효 데이터 없음'};continue;}
          /* 파일 내 키 중복 추적 */
          const fileKeys=new Set();
          /* DB 기존 키 */
          const dbKeys=new Set((sc.getData()||[]).map(r=>String(r[sc.dupKey]||'').trim()));
          /* 허용값 정의 */
          const ALLOWED={
            category:['원자재','부자재','반제품','완제품','소모품',''],
            active:['사용','미사용','1','0',''],
            result:['합격','부분합격','특채','무검사','보류','불합격',''],
          };
          const parsedRows=dataRows.map((row,ri)=>{
            const obj={};
            /* [v2.394] 날짜 변환 헬퍼
             우선순위: ① ws 셀의 .w(포맷문자열) ② 시리얼숫자 변환 ③ 원본값
             엑셀 날짜 시리얼(46027 등)을 YYYY-MM-DD로 변환 */
          const _cellToDateStr=(colIdx,rowIdx,rawVal)=>{
            try{
              const addr=XLSX.utils.encode_cell({r:rowIdx,c:colIdx});
              const cell=ws[addr];
              if(cell){
                /* 날짜 타입 셀: .w는 포맷된 문자열 */
                if(cell.t==='d'||cell.t==='n'){
                  /* .w가 날짜 형식이면 사용 */
                  if(cell.w&&/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(cell.w)){
                    const m=cell.w.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
                    if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
                  }
                  /* .v가 시리얼 숫자면 변환 */
                  const n=Number(cell.v);
                  if(!isNaN(n)&&n>30000&&n<100000){
                    const d=new Date(Math.round((n-25569)*86400)*1000);
                    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
                  }
                }
              }
            }catch(e){}
            /* 폴백: rawVal 직접 처리 */
            const s=String(rawVal||'').trim();
            if(!s) return '';
            if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
            const n=Number(s);
            if(!isNaN(n)&&n>30000&&n<100000){
              const d=new Date(Math.round((n-25569)*86400)*1000);
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
            }
            return s;
          };
          const _DATE_KEYS=new Set(['insp_date','created_at','updated_at','date','open','due','last','next','cal_date','expire_date']);
          cMap.forEach((key,i)=>{
            if(!key) return;
            const rawVal=row[i];
            if(_DATE_KEYS.has(key)){
              /* 실제 행 인덱스: raw.slice(1)에서 ri번째 → ws 행 인덱스는 ri+1 */
              obj[key]=_cellToDateStr(i, ri+1, rawVal)||'';
            } else {
              obj[key]=String(rawVal||'').trim();
            }
          });
            sc.cols.forEach(c=>{if(obj[c.key]===undefined) obj[c.key]='';});
            obj._rowNum=ri+2;
            obj._errors=[];
            /* ① 필수값 — dupOnly=true(품목/거래처)이면 req 외 빈칸 허용
               validateRow가 있으면 validateRow로 검사 */
            if(sc.validateRow){
              const vErr=sc.validateRow(obj);
              if(vErr) obj._errors.push(vErr);
            } else if(!sc.dupOnly){
              sc.cols.filter(c=>c.req).forEach(c=>{
                if(!obj[c.key]) obj._errors.push('필수값 누락: '+c.label);
              });
            } else {
              /* dupOnly=true: 최소 필수값(dupKey)만 체크 */
              if(!obj[sc.dupKey]) obj._errors.push('필수값 누락: '+sc.dupLabel);
            }
            /* ② 허용값 */
            Object.entries(ALLOWED).forEach(([k,vals])=>{
              if(obj[k]!==undefined&&obj[k]!==''&&!vals.includes(obj[k]))
                obj._errors.push('허용값 오류: '+k+'="'+obj[k]+'" (허용: '+vals.filter(v=>v).join('/')+')');
            });
            /* ③ 참조 검사 — dupOnly=true(품목/거래처)는 참조 검사 제외
               검사 시트(validateRow 있음)만 item_code/vendor 참조 확인 */
            if(!sc.dupOnly&&!sc.validateRow){
              /* 검사 외 시트에서도 참조 필요한 경우 향후 추가 */
            }
            /* 검사 시트: validateRow에서 이미 처리 (①에서 호출됨) */
            /* ④ 파일 내 중복 — allowFileDup=true면 건너뜀 (검사류) */
            const kv=obj[sc.dupKey]||'';
            if(kv&&!sc.allowFileDup){
              if(fileKeys.has(kv)) obj._errors.push('파일 내 중복: '+sc.dupLabel+'="'+kv+'"');
              else fileKeys.add(kv);
            } else if(kv&&sc.allowFileDup){
              fileKeys.add(kv); // 추적은 하되 오류는 아님
            }
            /* ⑤ DB 중복 — dupOnly=true면 중복만 체크 (다른 오류 무시) */
            if(kv&&dbKeys.has(kv)){
              obj._dup=true;
              obj._errors.push('DB 중복: '+sc.dupLabel+'="'+kv+'"');
            }
            return obj;
          });
          const errRows=parsedRows.filter(r=>r._errors.length>0);
          const dupRows=parsedRows.filter(r=>r._dup);
          const okRows=parsedRows.filter(r=>r._errors.length===0&&!r._dup);
          totalOk+=okRows.length; totalErr+=errRows.length; totalDup+=dupRows.length;
          results[pKey]={sheetName:sName,rows:parsedRows,okRows,errRows,dupRows,ok:errRows.length===0};
        }
        this._multiParsed=results;
        /* 결과 렌더링 */
        const allOk=totalErr===0;
        const summaryHtml=
          '<div style="display:flex;gap:10px;margin-bottom:12px">'+
          '<div class="sd-card" style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--ok)">'+totalOk+'</div><div style="font-size:11px;color:var(--tm)">✅ 등록 가능</div></div>'+
          '<div class="sd-card" style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--err)">'+totalErr+'</div><div style="font-size:11px;color:var(--tm)">❌ 오류 행</div></div>'+
          '<div class="sd-card" style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--warn)">'+totalDup+'</div><div style="font-size:11px;color:var(--tm)">⚠️ 중복 행</div></div>'+
          '</div>'+
          (allOk
            ?'<div style="padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--r);font-size:13px;font-weight:600;color:var(--ok);margin-bottom:10px">✅ 전체 정합성 검사 통과! 등록 버튼이 활성화됩니다.</div>'
            :'<div style="padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--r);font-size:13px;font-weight:600;color:var(--err);margin-bottom:10px">❌ '+totalErr+'건 오류 있음. 수정 후 재업로드하세요. <button class="btn bsm berr" onclick="ExcelMgr._exportResult()">📥 오류 결과 다운로드</button></div>');
        const detailHtml=Object.entries({'items':'품목등록','vendors':'거래처등록','users':'사용자등록','insp_in':'수입검사'}).map(([pKey,sName])=>{
          const r=results[pKey];
          if(!r) return '';
          if(r.skip) return '<div style="padding:8px 12px;background:var(--bg);border-radius:var(--r);border:1px solid var(--bd);margin-bottom:8px;font-size:12px;color:var(--tm)">📄 <strong>'+sName+'</strong> — '+(r.reason||'시트 없음 (건너뜀)')+'</div>';
          const sc=this._schemas[pKey];
          const keyField=sc.dupKey;
          return '<div style="margin-bottom:10px;border:1px solid '+(r.ok?'#86efac':'#fca5a5')+';border-radius:var(--r);overflow:hidden">'+
            '<div style="padding:8px 12px;background:'+(r.ok?'#f0fdf4':'#fef2f2')+';display:flex;align-items:center;gap:8px">'+
            '<span>'+(r.ok?'✅':'❌')+'</span><strong style="font-size:13px">'+sName+'</strong>'+
            '<span class="badge '+(r.ok?'bgrn':'berr')+'" style="font-size:11px">'+r.rows.length+'행</span>'+
            '<span class="badge bgrn" style="font-size:11px">등록가능 '+r.okRows.length+'</span>'+
            (r.errRows.length?'<span class="badge berr" style="font-size:11px">오류 '+r.errRows.length+'</span>':'')+
            (r.dupRows.length?'<span class="badge bamb" style="font-size:11px">중복 '+r.dupRows.length+'</span>':'')+
            '</div>'+
            (r.errRows.length?
              '<div style="max-height:160px;overflow-y:auto;padding:8px"><table style="width:100%;font-size:11px;border-collapse:collapse">'+
              '<thead><tr style="background:var(--bg2)"><th style="padding:4px 8px;text-align:left;border-bottom:1px solid var(--bd)">행</th>'+
              '<th style="padding:4px 8px;text-align:left;border-bottom:1px solid var(--bd)">키값</th>'+
              '<th style="padding:4px 8px;text-align:left;border-bottom:1px solid var(--bd)">오류 원인</th></tr></thead><tbody>'+
              r.errRows.slice(0,20).map(row=>'<tr style="border-bottom:1px solid var(--bd)"><td style="padding:3px 8px;color:var(--tm)">'+row._rowNum+'행</td>'+
                '<td style="padding:3px 8px">'+H.e(row[keyField]||'')+'</td>'+
                '<td style="padding:3px 8px;color:var(--err)">'+row._errors.join(' | ')+'</td></tr>').join('')+
              (r.errRows.length>20?'<tr><td colspan="3" style="padding:4px 8px;color:var(--tm);text-align:center">... 외 '+(r.errRows.length-20)+'건</td></tr>':'')+
              '</tbody></table></div>':'')+
            '</div>';
        }).join('');
        if(resEl) resEl.innerHTML=summaryHtml+detailHtml;
        /* 등록 버튼 활성화 */
        const btn=document.getElementById('btnRegisterAll');
        if(btn){
          if(allOk&&totalOk>0){
            btn.disabled=false; btn.style.opacity='1'; btn.style.cursor='pointer';
            btn.textContent='✅ 전체 '+totalOk+'건 등록';
          } else {
            btn.disabled=true; btn.style.opacity='.4'; btn.style.cursor='not-allowed';
            btn.textContent='✅ 전체 등록 ('+totalErr+'건 오류 수정 필요)';
          }
        }
      }catch(err){
        console.error('[멀티업로드]',err);
        if(resEl) resEl.innerHTML='<div style="color:var(--err);padding:16px">파일 읽기 실패: '+H.e(err.message)+'</div>';
      }
    };
    reader.readAsArrayBuffer(file);
  },

  /* 전체 등록 실행 (정합성 통과 후) */
  /* 전체 등록 실행 (정합성 통과 후) */
  /* 전체 등록 실행 */
  /* 전체 등록 실행 (정합성 통과 후) */
  async _registerAll(){
    if(!this._multiParsed){Toast.show('먼저 파일을 업로드하세요.','warn');return}
    const today=H.today();
    const sleep=ms=>new Promise(res=>setTimeout(res,ms));
    const CHUNK=50;
    const isRL=e=>e&&(e.status===429||String(e.message||'').includes('rate'));
    const isColErr=e=>e&&(e.message?.includes('column')||e.message?.includes('schema'));
    const tblMap={items:'items',vendors:'vendors',users:'users',
      insp_in:'inspections',insp_pr:'inspections',
      insp_pu:'inspections',insp_ou:'inspections',insp_fi:'inspections',
      equip:'equipment',equipment:'equipment',cal:'calibrations'};
    const cfMap={items:'item_code',vendors:null,users:'username',inspections:'insp_no',equipment:'code',calibrations:'cert'};
    const SAFE_COLS={
      inspections:['type','vendor','insp_no','insp_date','inspector',
        'item_code','item_name','spec','insp_method','result',
        'qty','pass_qty','fail_qty','defect_rate','wo_no','note',
        'created_at','updated_at'],
    };
    const REQUIRED_SQL={
      inspections:"-- 검사 테이블 컬럼 추가\nALTER TABLE inspections ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '';\nALTER TABLE inspections ADD COLUMN IF NOT EXISTS insp_method TEXT DEFAULT '';\nALTER TABLE inspections ADD COLUMN IF NOT EXISTS wo_no TEXT DEFAULT '';\nALTER TABLE inspections ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';\nALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_rate NUMERIC DEFAULT 0;",
    };
    /* [v2.394] 엑셀 날짜 → YYYY-MM-DD (Date객체/시리얼/문자열 모두 처리) */
    const _toDate=(v)=>{
      if(!v&&v!==0) return null;
      /* JS Date 객체 */
      if(v instanceof Date){
        const y=v.getUTCFullYear(),mo=v.getUTCMonth()+1,dy=v.getUTCDate();
        return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
      }
      const s=String(v).trim();
      if(!s) return null;
      /* YYYY-MM-DD 형식 */
      if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      /* 로케일 날짜 문자열 (Thu Jan 15 2026...) */
      if(s.includes(' ')&&s.length>8){
        const d=new Date(s);
        if(!isNaN(d.getTime())){
          const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();
          return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
        }
      }
      /* 엑셀 시리얼 숫자 */
      const n=Number(s);
      if(!isNaN(n)&&n>30000&&n<100000){
        const d=new Date(Math.round((n-25569)*86400)*1000);
        const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();
        return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
      }
      return s||null;
    };
    const toFullRow=(pKey,r)=>{
      if(pKey==='items') return{major_category:r.major_category||'',category:r.category||'',item_code:r.item_code||'',item_name:r.item_name||'',spec:r.spec||'',unit:r.unit||'EA',material:r.material||'',vendor_name:r.vendor_name||'',vendor_id:null,active:typeof r.active==='number'?r.active:1,remark:r.remark||'',created_at:r.created_at||null,updated_at:r.updated_at||null};
      /* [v2.394] 검사5종 — SB.addInspection allowed와 동일 컬럼 */
      if(['insp_in','insp_pr','insp_pu','insp_ou','insp_fi'].includes(pKey)){
        const typeMap={insp_in:'수입',insp_pr:'공정',insp_pu:'구매',insp_ou:'외주',insp_fi:'최종'};
        return{type:r.type||typeMap[pKey]||'',vendor:r.vendor||'',insp_no:r.insp_no||'',
          insp_date:_toDate(r.insp_date),inspector:r.inspector||'',item_code:r.item_code||'',
          item_name:r.item_name||'',spec:r.spec||'',insp_method:r.insp_method||'',
          result:r.result||'합격',qty:Number(r.qty)||0,pass_qty:Number(r.pass_qty)||0,
          fail_qty:Number(r.fail_qty)||0,defect_rate:Number(r.defect_rate)||0,
          wo_no:r.wo_no||'',note:r.note||'',created_at:_toDate(r.created_at),updated_at:null};
      }
      /* [v2.394] 계측기 — SB.addEquip allowed와 동일 컬럼 */
      if(pKey==='equipment') return{code:r.code||'',name:r.name||'',model:r.model||'',
        maker:r.maker||'',range:r.range||'',res:r.res||'',loc:r.loc||'',
        operator:r.operator||'',
        active:(r.active==='불용'||r.active===0||r.active==='0')?0:1,
        status:H.equipStatus(r.next),next:_toDate(r.next),last:_toDate(r.last),
        updated_at:null,created_at:_toDate(r.created_at)};
      if(tblMap[pKey]==='inspections') return{type:r.type||'',vendor:r.vendor||'',insp_no:r.insp_no||'',insp_date:r.insp_date||'',inspector:r.inspector||'',item_code:r.item_code||'',item_name:r.item_name||'',spec:r.spec||'',insp_method:r.insp_method||'',result:r.result||'',qty:Number(r.qty)||0,pass_qty:Number(r.pass_qty)||0,fail_qty:Number(r.fail_qty)||0,defect_rate:Number(r.defect_rate)||0,wo_no:r.wo_no||'',note:r.note||'',created_at:r.created_at||null,updated_at:r.updated_at||null};
      return r;
    };
    const toSafeRow=(pKey,r)=>{const tbl=tblMap[pKey];const safe=SAFE_COLS[tbl];if(!safe)return toFullRow(pKey,r);return Object.fromEntries(safe.map(k=>[k,r[k]!==undefined?r[k]:'']));};
    let totalSuccess=0,totalFail=0;
    const failMsgs=[],colErrors={};
    const btn=document.getElementById('btnRegisterAll');
    if(btn){btn.disabled=true;btn.textContent='등록 중...';}
    for(const [pKey,result] of Object.entries(this._multiParsed)){
      if(result.skip||!result.okRows?.length) continue;
      const sc=this._schemas[pKey];if(!sc) continue;
      const tbl=tblMap[pKey]||pKey;const cfCol=cfMap[tbl]||null;
      const rows=result.okRows.map(r=>{
        const row={};sc.cols.forEach(c=>{const v=r[c.key];row[c.key]=(v===undefined||v===null)?'':v;});
        if(row.active==='사용')row.active=1;else if(row.active==='미사용')row.active=0;else row.active=Number(row.active)||1;
        ['qty','pass_qty','fail_qty','defect_rate'].forEach(k=>{if(row[k]!==undefined)row[k]=Number(row[k])||0;});
        row.created_at=today;row.updated_at=today;return row;
      });
      /* vendors: SB.addVendor 직접 호출 (컬럼 오류 자동 처리 내장) */
      if(pKey==='vendors'&&_sb){
        let cnt=0;
        for(const r of rows){
          const res=await SB.addVendor(toFullRow(pKey,r));
          if(res.ok){totalSuccess++;cnt++;}
          else{totalFail++;failMsgs.push('[vendors] '+H.e((r.vendor_name||'')));}
          if(cnt>0&&cnt%100===0){
            document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
            Toast.show('거래처 등록 중... '+totalSuccess+'/'+rows.length+'건','info',30000);
          }
          await sleep(30);
        }
        continue;
      }
      /* [v2.394] 계측기: SB.addEquip 직접 호출 */
      if((pKey==='equip'||pKey==='equipment')&&_sb){
        let cnt=0;
        for(const r of rows){
          const res=await SB.addEquip(toFullRow(pKey,r));
          if(res.ok){totalSuccess++;cnt++;}
          else{totalFail++;failMsgs.push('[equip] '+H.e((r.code||r.name||'')));}
          if(cnt>0&&cnt%50===0){
            document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
            Toast.show('계측기 등록 중... '+totalSuccess+'/'+rows.length+'건','info',30000);
          }
          await sleep(30);
        }
        continue;
      }
      /* [v2.394] 검사5종: SB.addInspection 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
      if(['insp_in','insp_pr','insp_pu','insp_ou','insp_fi'].includes(pKey)&&_sb){
        let cnt=0;
        for(const r of rows){
          const res=await SB.addInspection(toFullRow(pKey,r));
          if(res.ok){totalSuccess++;cnt++;}
          else{totalFail++;failMsgs.push('['+pKey+'] '+H.e((r.insp_no||r.item_name||'')));}
          if(cnt>0&&cnt%100===0){
            document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
            Toast.show('검사 등록 중... '+totalSuccess+'/'+rows.length+'건','info',30000);
          }
          await sleep(30);
        }
        continue;
      }
      /* [v2.394] 계측기: SB.addEquip 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
      if(pKey==='equipment'&&_sb){
        let cnt=0;
        for(const r of rows){
          const res=await SB.addEquip(toFullRow(pKey,r));
          if(res.ok){totalSuccess++;cnt++;}
          else{totalFail++;failMsgs.push('[equipment] '+H.e((r.code||r.name||'')));}
          if(cnt>0&&cnt%100===0){
            document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
            Toast.show('계측기 등록 중... '+totalSuccess+'/'+rows.length+'건','info',30000);
          }
          await sleep(30);
        }
        continue;
      }
      /* items/inspections/users: 청크 upsert */
      const totalC=Math.ceil(rows.length/CHUNK);
      for(let ci=0;ci<totalC;ci++){
        const chunk=rows.slice(ci*CHUNK,(ci+1)*CHUNK);
        let ins=chunk.map(r=>toFullRow(pKey,r));
        if(!_sb){const data=sc.getData();let nid=data.length>0?Math.max(...data.map(x=>x.id||0))+1:1;ins.forEach(x=>data.push({id:nid++,...x}));totalSuccess+=chunk.length;continue;}
        let att=0,ok=false;
        while(att<3&&!ok){
          try{
            let error;
            if(cfCol){({error}=await _sb.from(tbl).upsert(ins,{onConflict:cfCol,ignoreDuplicates:false}));}
            else{({error}=await _sb.from(tbl).insert(ins));}
            if(!error){totalSuccess+=chunk.length;ok=true;}
            else if(isRL(error)){await sleep(Math.pow(2,att)*1500);att++;}
            else if(isColErr(error)){
              colErrors[tbl]=error.message;
              const fb=chunk.map(r=>toSafeRow(pKey,r));
              let e2;
              if(cfCol){({error:e2}=await _sb.from(tbl).upsert(fb,{onConflict:cfCol,ignoreDuplicates:false}));}
              else{({error:e2}=await _sb.from(tbl).insert(fb));}
              /* [v2.394] SAFE 저장 성공하면 colErrors 제거 — SQL 실행 후 팝업 억제 */
              if(!e2){totalSuccess+=chunk.length;ok=true;delete colErrors[tbl];}

              else{totalFail+=chunk.length;failMsgs.push('['+tbl+'] '+e2.message);ok=true;}
            }
            else{totalFail+=chunk.length;ok=true;if(failMsgs.length<3)failMsgs.push('['+tbl+'] '+error.message);}
          }catch(e){totalFail+=chunk.length;ok=true;failMsgs.push('['+tbl+'] '+String(e).slice(0,60));}
        }
        if(!ok)totalFail+=chunk.length;
        if(ci<totalC-1)await sleep(200);
      }
    }
    document.getElementById('tcont')?.querySelectorAll('.toast').forEach(e=>e.remove());
    Modal.close();
    if(Object.keys(colErrors).length>0){
      const sq=Object.keys(colErrors).map(t=>REQUIRED_SQL[t]||'').filter(Boolean).join('\n\n');
      Modal.open({title:'\u26a0\ufe0f \ucef4\ub7fc \ub204\ub77d \uc548\ub0b4',size:'mxl',
        body:'<div style="padding:10px 14px;background:#fef3c7;border:1px solid #f59e0b;border-radius:var(--r);font-size:13px;margin-bottom:12px">'
          +'<strong>\u2705 '+totalSuccess+'\uac74 \uc800\uc7a5 \uc644\ub8cc</strong> (\uc548\uc804 \ucef4\ub7fc)<br>'
          +'\uc544\ub798 SQL \uc2e4\ud589 \ud6c4 \uc7ac\uc5c5\ub85c\ub4dc\ud558\uba74 \ubaa8\ub4e0 \ucef4\ub7fc \uc800\uc7a5</div>'
          +'<div style="position:relative">'
          +'<pre id="sqlBox" style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:var(--r);font-size:11px;white-space:pre-wrap">'+H.e(sq)+'</pre>'
          +'<button class="btn bsm bpri" style="position:absolute;top:8px;right:8px" onclick="Pages._copySql()">\uD83D\uDCCB \ubcf5\uc0ac</button>'
          +'</div>',
        foot:'<button class="btn bpri" onclick="Modal.close()">\ud655\uc778</button>'});
    } else if(totalFail>0){
      const ed=failMsgs.map((m,i)=>'<div style="padding:3px 0;font-size:11px">'+(i+1)+'. '+H.e(m)+'</div>').join('');
      Modal.open({title:'\u274c \ub4f1\ub85d \uc2e4\ud328 \uc6d0\uc778',size:'mlg',
        body:'<div style="padding:8px;background:#fef2f2;border-radius:var(--r);margin-bottom:10px;font-size:13px">\u2705 '+totalSuccess+'\uac74 \uc131\uacf5 / \u274c '+totalFail+'\uac74 \uc2e4\ud328</div>'
          +'<div style="background:#1e293b;color:#e2e8f0;padding:10px;border-radius:var(--r);max-height:180px;overflow-y:auto">'+ed+'</div>',
        foot:'<button class="btn bpri" onclick="Modal.close()">\ud655\uc778</button>'});
    } else {
      Toast.show('\u2705 '+totalSuccess+'\uac74 \uc804\uccb4 \ub4f1\ub85d \uc644\ub8cc','ok',5000);
    }
    this._multiParsed=null;
    const pf2=this._pageFilter;this._pageFilter=null;
    if(totalSuccess>0){
      /* [v2.394] SB 반영 대기 후 페이지 이동 */
      await new Promise(r=>setTimeout(r,600));
      if(pf2==='vendors'){DB.vendors=await SB.getVendors();Nav.go('vendors');}
      else if(pf2==='equip'||pf2==='equipment'){
        DB.equip=await SB.getEquip();Nav.go('equip');
      }
      else if(pf2&&pf2.startsWith('insp')){
        DB.inspections=await SB.getInspections();
        /* _insp가 또 getInspections를 호출하므로 미리 로드 */
        const pf2page=pf2;
        Nav.go(pf2page);
      }
      else{DB.items=await SB.getItems();Nav.go('items');}
    }
  },

  /* 오류 결과 엑셀 내보내기 */
  _exportResult(){
    if(!this._multiParsed){Toast.show('분석된 데이터가 없습니다.','warn');return}
    if(typeof XLSX==='undefined'){Toast.show('엑셀 라이브러리 로딩 중입니다.','warn');return}
    const wb=XLSX.utils.book_new();
    [['items','품목등록'],['vendors','거래처등록'],['users','사용자등록'],
      ['insp_in','수입검사'],['insp_pr','공정검사'],['insp_pu','구매검사'],
      ['insp_ou','외주검사'],['insp_fi','최종검사']].forEach(([pKey,sName])=>{
      const r=this._multiParsed[pKey];
      if(!r||r.skip||!r.rows?.length) return;
      const sc=this._schemas[pKey];
      const header=[...sc.cols.map(c=>c.label),'결과'];
      const dataRows=r.rows.map(row=>[
        ...sc.cols.map(c=>row[c.key]||''),
        row._errors.length>0?'❌ '+row._errors.join(' | '):(row._dup?'⚠️ 중복':'✅ 등록가능'),
      ]);
      const ws=XLSX.utils.aoa_to_sheet([header,...dataRows]);
      ws['!cols']=[...sc.cols.map(c=>({wch:Math.max(c.label.length*2+4,14)})),{wch:60}];
      XLSX.utils.book_append_sheet(wb,ws,sName);
    });
    XLSX.writeFile(wb,'QMS_업로드결과_'+H.today()+'.xlsx');
    Toast.show('결과 파일이 다운로드되었습니다.','ok');
  },

};

/* ══ Search 팝업 (F3) ══ */
const SearchPop={
  _page:'',
  _cfg:{
    items:{title:'품목 검색',
      fields:[{id:'sq_cat',label:'분류',type:'select',opts:['','원자재','부자재','반제품','완제품','소모품']},{id:'sq_code',label:'품목코드',type:'text',ph:'예) RAW-001'},{id:'sq_name',label:'품목명',type:'text',ph:'품목명'},{id:'sq_spec',label:'규격',type:'text',ph:'규격'},{id:'sq_mat',label:'재질',type:'text',ph:'재질'},{id:'sq_vendor',label:'주거래처',type:'text',ph:'거래처명'},{id:'sq_use',label:'사용여부',type:'select',opts:['','사용','미사용']}],
      cols:['분류','품목코드','품목명','규격','단위','재질','주 거래처','사용'],
      get:(f)=>DB.items.filter(r=>{if(f.sq_cat&&r.category!==f.sq_cat)return false;if(f.sq_code&&!r.item_code.includes(f.sq_code))return false;if(f.sq_name&&!r.item_name.includes(f.sq_name))return false;if(f.sq_spec&&!(r.spec||'').includes(f.sq_spec))return false;if(f.sq_mat&&!(r.material||'').includes(f.sq_mat))return false;if(f.sq_vendor&&!(r.vendor_name||'').includes(f.sq_vendor))return false;if(f.sq_use==='사용'&&!r.active)return false;if(f.sq_use==='미사용'&&r.active)return false;return true;}),
      row:(r)=>[`<span class="badge bblu">${H.e(r.category)}</span>`,H.e(r.item_code),H.e(r.item_name),H.e(r.spec||'-'),H.e(r.unit),H.e(r.material||'-'),H.e(r.vendor_name),`<span class="badge ${r.active?'bgrn':'bgry'}">${r.active?'사용':'미사용'}</span>`]},
    vendors:{title:'거래처 검색',
      fields:[
        {id:'sv_type', label:'유형',     type:'select',opts:['','원자재','부자재','소모품','외주','기타']},
        {id:'sv_name', label:'거래처명', type:'text',  ph:'거래처명'},
        {id:'sv_biz',  label:'사업자번호',type:'text', ph:'000-00-00000'},
        {id:'sv_ceo',  label:'대표자',   type:'text',  ph:'대표자명'},
        {id:'sv_mgr',  label:'담당자',   type:'text',  ph:'담당자명'},
      ],
      cols:['거래처명','유형','사업자번호','대표자','전화번호','담당자','담당자 연락처','상태'],
      get:(f)=>DB.vendors.filter(r=>{
        if(f.sv_type&&r.vendor_type!==f.sv_type)return false;
        if(f.sv_name&&!(r.vendor_name||'').includes(f.sv_name))return false;
        if(f.sv_biz &&!(r.biz_no||'').includes(f.sv_biz))return false;
        if(f.sv_ceo &&!(r.ceo_name||'').includes(f.sv_ceo))return false;
        if(f.sv_mgr &&!(r.manager||'').includes(f.sv_mgr))return false;
        return true;
      }),
      row:(r)=>[
        H.e(r.vendor_name),
        `<span class="badge bpur">${H.e(r.vendor_type||'-')}</span>`,
        H.e(r.biz_no||'-'),H.e(r.ceo_name||'-'),H.e(r.tel||'-'),
        H.e(r.manager||'-'),H.e(r.manager_tel||'-'),
        `<span class="badge ${r.active?'bgrn':'bgry'}">${r.active?'정상':'비활성'}</span>`
      ]},
    users:{title:'사용자 검색',
      fields:[{id:'su_name',label:'이름',type:'text',ph:'이름'},{id:'su_id',label:'아이디',type:'text',ph:'아이디'},{id:'su_dept',label:'부서',type:'text',ph:'부서명'},{id:'su_email',label:'E-MAIL',type:'text',ph:'이메일'},{id:'su_role',label:'권한',type:'select',opts:['','admin','manager','user','viewer']}],
      cols:['아이디','이름','부서','연락처','E-MAIL','권한','상태','등록일'],
      get:(f)=>DB.users.filter(r=>{if(f.su_name&&!r.name.includes(f.su_name))return false;if(f.su_id&&!r.username.includes(f.su_id))return false;if(f.su_dept&&!(r.department||'').includes(f.su_dept))return false;if(f.su_email&&!(r.email||'').includes(f.su_email))return false;if(f.su_role&&r.role!==f.su_role)return false;return true;}),
      row:(r)=>{const lbl={admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'},cls={admin:'bred',manager:'bamb',user:'bblu',viewer:'bgry'};return[H.e(r.username),H.e(r.name),H.e(r.department),H.e(r.tel||'-'),H.e(r.email||'-'),`<span class="badge ${cls[r.role]||'bgry'}">${lbl[r.role]||r.role}</span>`,`<span class="badge ${r.active?'bgrn':'bgry'}">${r.active?'활성':'비활성'}</span>`,H.e(r.created_at)]}},
    insp_in:{title:'수입검사 검색',
      fields:[
        {id:'si_no',    label:'검사번호',type:'text',  ph:'INS-'},
        {id:'si_code',  label:'품목코드',type:'text',  ph:'품목코드'},
        {id:'si_item',  label:'품목명',  type:'text',  ph:'품목명'},
        {id:'si_vendor',label:'거래처명',type:'text',  ph:'거래처명'},
        {id:'si_from',  label:'검사일(시작)',type:'date'},
        {id:'si_to',    label:'검사일(종료)',type:'date'},
        {id:'si_result',label:'결과',    type:'select',opts:['','합격','부분합격','특채','보류','불합격']},
      ],
      quickDate:true,
      cols:['검사구분','거래처명','검사번호','검사일','검사자','품목코드','품목명','규격','검사방법','검사결과','검사수량','합격수량','불합격수량','불량률(%)','작업지시번호','특이사항'],
      get:(f)=>DB.inspections.filter(r=>{
        if(r.type!=='수입')return false;
        if(f.si_no&&!r.insp_no?.includes(f.si_no))return false;
        if(f.si_code&&!r.item_code?.includes(f.si_code))return false;
        if(f.si_item&&!r.item_name?.includes(f.si_item))return false;
        if(f.si_vendor&&!r.vendor?.includes(f.si_vendor))return false;
        if(f.si_from&&r.insp_date<f.si_from)return false;
        if(f.si_to&&r.insp_date>f.si_to)return false;
        if(f.si_result&&r.result!==f.si_result)return false;
        return true;
      }),
      row:(r)=>[`<span class="badge bblu">${H.e(r.type)}검사</span>`,H.e(r.vendor||'-'),H.e(r.insp_no),H.e(r.insp_date),H.e(r.inspector),`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.item_code)}</span>`,H.e(r.item_name),H.e(r.spec||'-'),H.e(r.insp_method),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.n(r.qty),H.n(r.pass_qty),`<span style="${r.fail_qty>0?'color:var(--err);font-weight:700':''}">${H.n(r.fail_qty)}</span>`,`${r.defect_rate?.toFixed(1)||0}%`,H.e(r.wo_no||'-'),H.e(r.note||'-')]},
    insp_pr:{title:'공정검사 검색',
      fields:[
        {id:'si_no',   label:'검사번호',type:'text',ph:'INS-'},
        {id:'si_code', label:'품목코드',type:'text',ph:'품목코드'},
        {id:'si_item', label:'품목명',  type:'text',ph:'품목명'},
        {id:'si_wo',   label:'작업지시번호',type:'text',ph:'WO번호'},
        {id:'si_from', label:'검사일(시작)',type:'date'},
        {id:'si_to',   label:'검사일(종료)',type:'date'},
        {id:'si_result',label:'결과',   type:'select',opts:['','합격','부분합격','특채','보류','불합격']},
      ],
      quickDate:true,
      cols:['검사구분','거래처명','검사번호','검사일','검사자','품목코드','품목명','규격','검사방법','검사결과','검사수량','합격수량','불합격수량','불량률(%)','작업지시번호','특이사항'],
      get:(f)=>DB.inspections.filter(r=>{
        if(r.type!=='공정')return false;
        if(f.si_no&&!r.insp_no?.includes(f.si_no))return false;
        if(f.si_code&&!r.item_code?.includes(f.si_code))return false;
        if(f.si_item&&!r.item_name?.includes(f.si_item))return false;
        if(f.si_wo&&!r.wo_no?.includes(f.si_wo))return false;
        if(f.si_from&&r.insp_date<f.si_from)return false;
        if(f.si_to&&r.insp_date>f.si_to)return false;
        if(f.si_result&&r.result!==f.si_result)return false;
        return true;
      }),
      row:(r)=>[`<span class="badge bblu">${H.e(r.type)}검사</span>`,H.e(r.vendor||'-'),H.e(r.insp_no),H.e(r.insp_date),H.e(r.inspector),`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.item_code)}</span>`,H.e(r.item_name),H.e(r.spec||'-'),H.e(r.insp_method),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.n(r.qty),H.n(r.pass_qty),`<span style="${r.fail_qty>0?'color:var(--err);font-weight:700':''}">${H.n(r.fail_qty)}</span>`,`${r.defect_rate?.toFixed(1)||0}%`,H.e(r.wo_no||'-'),H.e(r.note||'-')]},
    insp_pu:{title:'구매검사 검색',
      fields:[
        {id:'si_no',    label:'검사번호',type:'text',  ph:'INS-'},
        {id:'si_code',  label:'품목코드',type:'text',  ph:'품목코드'},
        {id:'si_item',  label:'품목명',  type:'text',  ph:'품목명'},
        {id:'si_vendor',label:'거래처명',type:'text',  ph:'거래처명'},
        {id:'si_from',  label:'검사일(시작)',type:'date'},
        {id:'si_to',    label:'검사일(종료)',type:'date'},
        {id:'si_result',label:'결과',    type:'select',opts:['','합격','부분합격','특채','보류','불합격']},
      ],
      quickDate:true,
      cols:['검사구분','거래처명','검사번호','검사일','검사자','품목코드','품목명','규격','검사방법','검사결과','검사수량','합격수량','불합격수량','불량률(%)','작업지시번호','특이사항'],
      get:(f)=>DB.inspections.filter(r=>{
        if(r.type!=='구매')return false;
        if(f.si_no&&!r.insp_no?.includes(f.si_no))return false;
        if(f.si_code&&!r.item_code?.includes(f.si_code))return false;
        if(f.si_item&&!r.item_name?.includes(f.si_item))return false;
        if(f.si_vendor&&!r.vendor?.includes(f.si_vendor))return false;
        if(f.si_from&&r.insp_date<f.si_from)return false;
        if(f.si_to&&r.insp_date>f.si_to)return false;
        if(f.si_result&&r.result!==f.si_result)return false;
        return true;
      }),
      row:(r)=>[`<span class="badge bblu">${H.e(r.type)}검사</span>`,H.e(r.vendor||'-'),H.e(r.insp_no),H.e(r.insp_date),H.e(r.inspector),`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.item_code)}</span>`,H.e(r.item_name),H.e(r.spec||'-'),H.e(r.insp_method),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.n(r.qty),H.n(r.pass_qty),`<span style="${r.fail_qty>0?'color:var(--err);font-weight:700':''}">${H.n(r.fail_qty)}</span>`,`${r.defect_rate?.toFixed(1)||0}%`,H.e(r.wo_no||'-'),H.e(r.note||'-')]},
    insp_ou:{title:'외주검사 검색',
      fields:[
        {id:'si_no',    label:'검사번호',type:'text',  ph:'INS-'},
        {id:'si_code',  label:'품목코드',type:'text',  ph:'품목코드'},
        {id:'si_item',  label:'품목명',  type:'text',  ph:'품목명'},
        {id:'si_vendor',label:'거래처명',type:'text',  ph:'거래처명'},
        {id:'si_from',  label:'검사일(시작)',type:'date'},
        {id:'si_to',    label:'검사일(종료)',type:'date'},
        {id:'si_result',label:'결과',    type:'select',opts:['','합격','부분합격','특채','보류','불합격']},
      ],
      quickDate:true,
      cols:['검사구분','거래처명','검사번호','검사일','검사자','품목코드','품목명','규격','검사방법','검사결과','검사수량','합격수량','불합격수량','불량률(%)','작업지시번호','특이사항'],
      get:(f)=>DB.inspections.filter(r=>{
        if(r.type!=='외주')return false;
        if(f.si_no&&!r.insp_no?.includes(f.si_no))return false;
        if(f.si_code&&!r.item_code?.includes(f.si_code))return false;
        if(f.si_item&&!r.item_name?.includes(f.si_item))return false;
        if(f.si_vendor&&!r.vendor?.includes(f.si_vendor))return false;
        if(f.si_from&&r.insp_date<f.si_from)return false;
        if(f.si_to&&r.insp_date>f.si_to)return false;
        if(f.si_result&&r.result!==f.si_result)return false;
        return true;
      }),
      row:(r)=>[`<span class="badge bblu">${H.e(r.type)}검사</span>`,H.e(r.vendor||'-'),H.e(r.insp_no),H.e(r.insp_date),H.e(r.inspector),`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.item_code)}</span>`,H.e(r.item_name),H.e(r.spec||'-'),H.e(r.insp_method),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.n(r.qty),H.n(r.pass_qty),`<span style="${r.fail_qty>0?'color:var(--err);font-weight:700':''}">${H.n(r.fail_qty)}</span>`,`${r.defect_rate?.toFixed(1)||0}%`,H.e(r.wo_no||'-'),H.e(r.note||'-')]},
    insp_fi:{title:'최종검사 검색',
      fields:[
        {id:'si_no',   label:'검사번호',type:'text',ph:'INS-'},
        {id:'si_code', label:'품목코드',type:'text',ph:'품목코드'},
        {id:'si_item', label:'품목명',  type:'text',ph:'품목명'},
        {id:'si_wo',   label:'작업지시번호',type:'text',ph:'SO번호'},
        {id:'si_from', label:'검사일(시작)',type:'date'},
        {id:'si_to',   label:'검사일(종료)',type:'date'},
        {id:'si_result',label:'결과',   type:'select',opts:['','합격','부분합격','특채','보류','불합격']},
      ],
      quickDate:true,
      cols:['검사구분','거래처명','검사번호','검사일','검사자','품목코드','품목명','규격','검사방법','검사결과','검사수량','합격수량','불합격수량','불량률(%)','작업지시번호','특이사항'],
      get:(f)=>DB.inspections.filter(r=>{
        if(r.type!=='최종')return false;
        if(f.si_no&&!r.insp_no?.includes(f.si_no))return false;
        if(f.si_code&&!r.item_code?.includes(f.si_code))return false;
        if(f.si_item&&!r.item_name?.includes(f.si_item))return false;
        if(f.si_wo&&!r.wo_no?.includes(f.si_wo))return false;
        if(f.si_from&&r.insp_date<f.si_from)return false;
        if(f.si_to&&r.insp_date>f.si_to)return false;
        if(f.si_result&&r.result!==f.si_result)return false;
        return true;
      }),
      row:(r)=>[`<span class="badge bblu">${H.e(r.type)}검사</span>`,H.e(r.vendor||'-'),H.e(r.insp_no),H.e(r.insp_date),H.e(r.inspector),`<span style="font-family:'JetBrains Mono',monospace;font-size:11px">${H.e(r.item_code)}</span>`,H.e(r.item_name),H.e(r.spec||'-'),H.e(r.insp_method),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.n(r.qty),H.n(r.pass_qty),`<span style="${r.fail_qty>0?'color:var(--err);font-weight:700':''}">${H.n(r.fail_qty)}</span>`,`${r.defect_rate?.toFixed(1)||0}%`,H.e(r.wo_no||'-'),H.e(r.note||'-')]},
    nc:{title:'부적합 검색',
      fields:[
        {id:'sn_inout', label:'사내외',  type:'select',opts:['','사내','사외']},
        {id:'sn_type',  label:'유형',    type:'select',opts:['','수입','공정','구매','외주','최종','고객']},
        {id:'sn_no',    label:'부적합번호',type:'text', ph:'NC번호'},
        {id:'sn_code',  label:'품목코드',type:'text',  ph:'품목코드'},
        {id:'sn_item',  label:'품목명',  type:'text',  ph:'품목명'},
        {id:'sn_status',label:'상태',    type:'select',opts:['','접수','처리중','완료']},
        {id:'sn_from',  label:'발생일(시작)',type:'date'},
        {id:'sn_to',    label:'발생일(종료)',type:'date'},
      ],
      cols:['부적합번호','사내외','유형','품목코드','품목명','발생일','담당자','상태'],
      get:(f)=>DB.nc.filter(r=>{
        if(f.sn_inout&&r.in_out!==f.sn_inout)return false;
        if(f.sn_type&&r.type!==f.sn_type)return false;
        if(f.sn_no&&!(r.no||'').includes(f.sn_no))return false;
        if(f.sn_code&&!(r.item_code||'').includes(f.sn_code))return false;
        if(f.sn_item&&!(r.item||'').includes(f.sn_item))return false;
        if(f.sn_status&&r.status!==f.sn_status)return false;
        if(f.sn_from&&(r.date||'')<f.sn_from)return false;
        if(f.sn_to&&(r.date||'')>f.sn_to)return false;
        return true;
      }),
      row:(r)=>[H.e(r.no),H.e(r.in_out||'-'),`<span class="badge bblu">${H.e(r.type)}</span>`,H.e(r.item_code||'-'),H.e(r.item||'-'),H.e(r.date||'-'),H.e(r.assignee||'-'),H.e(r.status||'-')],
      cols:['계측기코드','계측기명','제조사','측정범위','분해능','보관위치','사용자','최근교정일','차기교정일','사용여부'],
      get:(f)=>DB.equip.filter(r=>{
        if(f.se_code  &&!r.code.includes(f.se_code))   return false;
        if(f.se_name  &&!r.name.includes(f.se_name))   return false;
        if(f.se_maker &&!(r.maker||'').includes(f.se_maker)) return false;
        if(f.se_loc   &&!(r.loc||'').includes(f.se_loc))     return false;
        if(f.se_status&&r.status!==f.se_status)        return false;
        return true;
      }),
      row:(r)=>[
        H.e(r.code),
        H.e(r.name),
        H.e(r.maker||'-'),
        H.e(r.range||'-'),
        H.e(r.res||'-'),
        H.e(r.loc||'-'),
        H.e(r.operator||'-'),
        H.e(r.last||'-'),
        H.e(r.next||'-'),
        `<span class="badge ${r.active===0||r.active==='0'?'bred':'bgrn'}">${r.active===0||r.active==='0'?'불용':'사용'}</span>`,
      ]},
    equip:{title:'계측기 검색',
      fields:[
        {id:'se_code',  label:'계측기코드', type:'text',   ph:'EQ-001'},
        {id:'se_name',  label:'계측기명',   type:'text',   ph:'계측기명'},
        {id:'se_maker', label:'제조사',     type:'text',   ph:'제조사'},
        {id:'se_loc',   label:'보관위치',   type:'text',   ph:'보관위치'},
        {id:'se_status',label:'상태',       type:'select', opts:['','정상','교정중','교정만료']},
      ],
      cols:['계측기코드','계측기명','제조사','측정범위','분해능','보관위치','사용자','최근교정일','차기교정일','사용여부'],
      get:(f)=>DB.equip.filter(r=>{
        if(f.se_code  &&!r.code.includes(f.se_code))   return false;
        if(f.se_name  &&!r.name.includes(f.se_name))   return false;
        if(f.se_maker &&!(r.maker||'').includes(f.se_maker)) return false;
        if(f.se_loc   &&!(r.loc||'').includes(f.se_loc))     return false;
        if(f.se_status&&r.status!==f.se_status)        return false;
        return true;
      }),
      row:(r)=>[
        H.e(r.code),
        H.e(r.name),
        H.e(r.maker||'-'),
        H.e(r.range||'-'),
        H.e(r.res||'-'),
        H.e(r.loc||'-'),
        H.e(r.operator||'-'),
        H.e(r.last||'-'),
        H.e(r.next||'-'),
        `<span class="badge ${r.active===0||r.active==='0'?'bred':'bgrn'}">${r.active===0||r.active==='0'?'불용':'사용'}</span>`,
      ]},
    cal:{title:'교정 검색',fields:[{id:'sc_code',label:'계측기코드',type:'text',ph:'EQ-001'},{id:'sc_name',label:'계측기명',type:'text',ph:'계측기명'},{id:'sc_agency',label:'교정기관',type:'text',ph:'교정기관'},{id:'sc_from',label:'교정일(시작)',type:'date'},{id:'sc_to',label:'교정일(종료)',type:'date'},{id:'sc_result',label:'결과',type:'select',opts:['','합격','부분합격','특채','보류','불합격']}],cols:['계측기코드','계측기명','교정일','교정기관','성적서번호','결과','차기교정일'],get:(f)=>DB.cals.filter(r=>{if(f.sc_code&&!r.code.includes(f.sc_code))return false;if(f.sc_name&&!r.name.includes(f.sc_name))return false;if(f.sc_agency&&!r.agency.includes(f.sc_agency))return false;if(f.sc_from&&r.date<f.sc_from)return false;if(f.sc_to&&r.date>f.sc_to)return false;if(f.sc_result&&r.result!==f.sc_result)return false;return true;}),row:(r)=>[H.e(r.code),H.e(r.name),H.e(r.date),H.e(r.agency),H.e(r.cert),`<span class="badge ${r.result==='합격'?'bgrn':'bred'}">${H.e(r.result)}</span>`,H.e(r.next)]},
    docs:{title:'문서 검색',fields:[{id:'sd_type',label:'유형',type:'select',opts:['','절차서','지침서','양식','매뉴얼','규정']},{id:'sd_no',label:'문서번호',type:'text',ph:'QP-...'},{id:'sd_title',label:'제목',type:'text',ph:'문서 제목'},{id:'sd_author',label:'작성자',type:'text',ph:'작성자'},{id:'sd_status',label:'상태',type:'select',opts:['','초안','유효','폐기']}],cols:['문서번호','유형','제목','개정번호','발행일','작성자','상태'],get:(f)=>DB.docs.filter(r=>{if(f.sd_type&&r.type!==f.sd_type)return false;if(f.sd_no&&!r.no.includes(f.sd_no))return false;if(f.sd_title&&!r.title.includes(f.sd_title))return false;if(f.sd_author&&!r.author.includes(f.sd_author))return false;if(f.sd_status&&r.status!==f.sd_status)return false;return true;}),row:(r)=>[H.e(r.no),`<span class="badge bblu">${H.e(r.type)}</span>`,H.e(r.title),`Rev.${H.e(r.rev)}`,H.e(r.date),H.e(r.author),`<span class="badge ${r.status==='유효'?'bgrn':r.status==='초안'?'bamb':'bgry'}">${H.e(r.status)}</span>`]},
    car:{title:'시정조치 검색',fields:[{id:'sc2_src',label:'발생원',type:'select',opts:['','부적합','내부심사','고객불만','외부심사','기타']},{id:'sc2_no',label:'CAR번호',type:'text',ph:'CAR번호'},{id:'sc2_title',label:'제목',type:'text',ph:'제목 검색'},{id:'sc2_assignee',label:'담당자',type:'text',ph:'담당자'},{id:'sc2_status',label:'상태',type:'select',opts:['','접수','처리중','완료']},{id:'sc2_from',label:'개시일(시작)',type:'date'},{id:'sc2_to',label:'개시일(종료)',type:'date'}],cols:['CAR번호','발생원','제목','개시일','완료기한','담당자','상태'],get:(f)=>DB.cars.filter(r=>{if(f.sc2_src&&r.src!==f.sc2_src)return false;if(f.sc2_no&&!r.no.includes(f.sc2_no))return false;if(f.sc2_title&&!r.title.includes(f.sc2_title))return false;if(f.sc2_assignee&&!r.assignee.includes(f.sc2_assignee))return false;if(f.sc2_status&&r.status!==f.sc2_status)return false;if(f.sc2_from&&r.open<f.sc2_from)return false;if(f.sc2_to&&r.open>f.sc2_to)return false;return true;}),row:(r)=>[H.e(r.no),`<span class="badge bpur">${H.e(r.src)}</span>`,H.e(r.title),H.e(r.open),H.e(r.due),H.e(r.assignee),`<span class="badge ${r.status==='완료'?'bgrn':r.status==='처리중'?'bamb':'bgry'}">${H.e(r.status)}</span>`]},

    insp_std:{title:'검사 기준서 검색',
      fields:[
        {id:'sis_code', label:'품목코드', type:'text', ph:'품목코드'},
        {id:'sis_name', label:'품목명',   type:'text', ph:'품목명'},
        {id:'sis_type', label:'검사유형', type:'select', opts:['','수입','공정','구매','외주','최종']},
      ],
      cols:['품목코드','품목명','검사유형','검사항목','AQL','적용일'],
      get:(f)=>(DB.insp_std||[]).filter(r=>{
        if(f.sis_code&&!(r.item_code||'').includes(f.sis_code))return false;
        if(f.sis_name&&!(r.item_name||'').includes(f.sis_name))return false;
        if(f.sis_type&&r.insp_type!==f.sis_type)return false;
        return true;
      }),
      row:(r)=>[H.e(r.item_code||'-'),H.e(r.item_name||'-'),H.e(r.insp_type||'-'),H.e(r.insp_items||'-'),H.e(r.aql||'-'),H.e(r.effective_date||'-')],
    },

    insp_cert:{title:'검사 성적서 검색',
      fields:[
        {id:'sc_no',  label:'검사번호',  type:'text', ph:'검사번호'},
        {id:'sc_code',label:'품목코드',  type:'text', ph:'품목코드'},
        {id:'sc_type',label:'검사유형',  type:'select', opts:['','수입','공정','구매','외주','최종']},
        {id:'sc_res', label:'판정',      type:'select', opts:['','합격','불합격','조건부합격']},
      ],
      cols:['검사번호','검사유형','품목코드','품목명','검사일','판정'],
      get:(f)=>(DB.inspections||[]).filter(r=>{
        if(f.sc_no   &&!(r.insp_no||'').includes(f.sc_no))   return false;
        if(f.sc_code &&!(r.item_code||'').includes(f.sc_code))return false;
        if(f.sc_type && r.type!==f.sc_type)                   return false;
        if(f.sc_res  && r.result!==f.sc_res)                  return false;
        return true;
      }),
      row:(r)=>[H.e(r.insp_no||'-'),H.e(r.type||'-'),H.e(r.item_code||'-'),H.e(r.item_name||'-'),H.e(r.insp_date||'-'),H.e(r.result||'-')],
    },

    lot_trace:{title:'LOT 추적 검색',
      fields:[
        {id:'slt_lot', label:'LOT번호',  type:'text', ph:'LOT-20260601-001'},
        {id:'slt_code',label:'품목코드', type:'text', ph:'품목코드'},
        {id:'slt_item',label:'품목명',   type:'text', ph:'품목명'},
      ],
      cols:['유형','번호/LOT','품목코드','품목명','날짜','결과/상태'],
      get:(f)=>{
        const q=f.slt_lot||f.slt_code||f.slt_item||'';
        if(!q) return [];
        const insp=(DB.inspections||[]).filter(r=>
          (r.lot_no||'').includes(q)||(r.item_code||'').includes(q)||(r.item_name||'').includes(q)
        ).map(r=>({_type:'검사',no:r.insp_no||'-',code:r.item_code||'-',name:r.item_name||'-',date:r.insp_date||'-',status:r.result||'-'}));
        const ncs=(DB.nc||[]).filter(r=>
          (r.lot_no||r.no||'').includes(q)||(r.item_code||'').includes(q)||(r.item||'').includes(q)
        ).map(r=>({_type:'부적합',no:r.no||'-',code:r.item_code||'-',name:r.item||'-',date:r.date||'-',status:r.status||'-'}));
        return [...insp,...ncs];
      },
      row:(r)=>[H.e(r._type||'-'),H.e(r.no||'-'),H.e(r.code||'-'),H.e(r.name||'-'),H.e(r.date||'-'),H.e(r.status||'-')],
    },

    insp_hold:{title:'Hold 검색',
      fields:[
        {id:'sh_no',  label:'Hold번호', type:'text', ph:'HOLD-번호'},
        {id:'sh_lot', label:'LOT번호',  type:'text', ph:'LOT번호'},
        {id:'sh_st',  label:'상태',     type:'select', opts:['','Hold중','조사중','해제']},
      ],
      cols:['Hold번호','LOT번호','품목코드','Hold사유','발령일','상태'],
      get:(f)=>(DB.holds||[]).filter(r=>{
        if(f.sh_no  &&!(r.hold_no||'').includes(f.sh_no))  return false;
        if(f.sh_lot &&!(r.lot_no||'').includes(f.sh_lot))  return false;
        if(f.sh_st  && r.status!==f.sh_st)                 return false;
        return true;
      }),
      row:(r)=>[H.e(r.hold_no||'-'),H.e(r.lot_no||'-'),H.e(r.item_code||'-'),H.e(r.reason||'-'),H.e(r.issued_date||'-'),H.e(r.status||'-')],
    },

    insp_reinsp:{title:'재검사 검색',
      fields:[
        {id:'sr_no',  label:'재검사번호', type:'text', ph:'REINSP-번호'},
        {id:'sr_lot', label:'LOT번호',    type:'text', ph:'LOT번호'},
        {id:'sr_st',  label:'상태',       type:'select', opts:['','요청','진행중','합격','불합격']},
      ],
      cols:['재검사번호','원검사번호','LOT번호','요청일','판정','상태'],
      get:(f)=>(DB.reinspections||[]).filter(r=>{
        if(f.sr_no  &&!(r.reinsp_no||'').includes(f.sr_no)) return false;
        if(f.sr_lot &&!(r.lot_no||'').includes(f.sr_lot))   return false;
        if(f.sr_st  && r.status!==f.sr_st)                  return false;
        return true;
      }),
      row:(r)=>[H.e(r.reinsp_no||'-'),H.e(r.orig_no||'-'),H.e(r.lot_no||'-'),H.e(r.req_date||'-'),H.e(r.result||'-'),H.e(r.status||'-')],
    },

    sqm_eval:{title:'업체 평가 검색',
      fields:[
        {id:'sqe_vn',  label:'거래처명', type:'text', ph:'거래처명'},
        {id:'sqe_gr',  label:'등급',     type:'select', opts:['','A','B','C','D']},
        {id:'sqe_per', label:'평가기간', type:'text', ph:'예) 2026-Q2'},
      ],
      cols:['거래처','평가기간','종합점수','등급','PPM','클레임'],
      get:(f)=>(DB.vendor_evals||[]).filter(r=>{
        if(f.sqe_vn &&!(r.vendor_name||'').includes(f.sqe_vn))return false;
        if(f.sqe_gr && r.grade!==f.sqe_gr)return false;
        if(f.sqe_per&&!(r.period||'').includes(f.sqe_per))return false;
        return true;
      }),
      row:(r)=>[H.e(r.vendor_name||'-'),H.e(r.period||'-'),H.e(String(r.total||'-')),H.e(r.grade||'-'),H.e(String(r.ppm||'0')),H.e(String(r.complaint||'0'))],
    },

    sqm_audit:{title:'업체 심사 검색',
      fields:[
        {id:'sqa_vn',  label:'거래처명', type:'text', ph:'거래처명'},
        {id:'sqa_tp',  label:'심사유형', type:'select', opts:['','정기','수시','특별','인증']},
        {id:'sqa_st',  label:'상태',     type:'select', opts:['','계획','진행중','완료','보류']},
      ],
      cols:['거래처','심사유형','계획일','심사자','점수','상태'],
      get:(f)=>(DB.vendor_audits||[]).filter(r=>{
        if(f.sqa_vn&&!(r.vendor_name||'').includes(f.sqa_vn))return false;
        if(f.sqa_tp&&r.audit_type!==f.sqa_tp)return false;
        if(f.sqa_st&&r.status!==f.sqa_st)return false;
        return true;
      }),
      row:(r)=>[H.e(r.vendor_name||'-'),H.e(r.audit_type||'-'),H.e(r.plan_date||'-'),H.e(r.auditor||'-'),H.e(String(r.score??'-')),H.e(r.status||'-')],
    },

    sqm_delivery:{title:'납품 이력 검색',
      fields:[
        {id:'sqd_vn',  label:'거래처명', type:'text', ph:'거래처명'},
        {id:'sqd_cd',  label:'품목코드', type:'text', ph:'품목코드'},
        {id:'sqd_rs',  label:'판정',     type:'select', opts:['','합격','불합격']},
      ],
      cols:['검사일','거래처','품목코드','품목명','LOT번호','판정'],
      get:(f)=>(DB.inspections||[]).filter(r=>{
        if(f.sqd_vn&&!(r.vendor_name||'').includes(f.sqd_vn))return false;
        if(f.sqd_cd&&!(r.item_code||'').includes(f.sqd_cd))return false;
        if(f.sqd_rs&&r.result!==f.sqd_rs)return false;
        return true;
      }),
      row:(r)=>[H.e(r.insp_date||'-'),H.e(r.vendor_name||'-'),H.e(r.item_code||'-'),H.e(r.item_name||'-'),H.e(r.lot_no||'-'),H.e(r.result||'-')],
    },
    /* [v2.394] 8D Report + 반품/폐기 검색 */
    nc_8d:{title:'8D Report 검색',
      fields:[
        {id:'s8d_no',    label:'8D번호',   type:'text',   ph:'8D-'},
        {id:'s8d_title', label:'제목',      type:'text',   ph:''},
        {id:'s8d_ncref', label:'부적합참조', type:'text',   ph:'NC-'},
        {id:'s8d_owner', label:'담당자',    type:'text',   ph:''},
        {id:'s8d_status',label:'단계',      type:'select',
          opts:['','D1-팀구성','D2-문제기술','D3-임시조치','D4-근본원인',
                'D5-영구조치','D6-효과검증','D7-재발방지','D8-팀인정','완료']},
      ],
      cols:['8D번호','제목','부적합참조','담당자','시작일','단계','파일'],
      get:(f)=>(DB.reports||DB.nc_8d||[]).filter(r=>
        (!f.s8d_no    ||r.no?.includes(f.s8d_no))&&
        (!f.s8d_title ||r.title?.includes(f.s8d_title))&&
        (!f.s8d_ncref ||r.nc_ref?.includes(f.s8d_ncref))&&
        (!f.s8d_owner ||r.owner?.includes(f.s8d_owner))&&
        (!f.s8d_status||r.status===f.s8d_status)
      ),
      row:(r)=>[H.e(r.no||'-'),H.e(r.title||'-'),H.e(r.nc_ref||'-'),
                H.e(r.owner||'-'),H.e(r.d1_date||'-'),H.e(r.status||'-'),
                r.file_url?'📎 있음':'-'],
    },
    nc_dispose:{title:'반품/폐기 검색',
      fields:[
        {id:'sdp_no',    label:'처리번호', type:'text', ph:'DISP-'},
        {id:'sdp_ref',   label:'부적합번호',type:'text', ph:'NC-'},
        {id:'sdp_code',  label:'품목코드', type:'text', ph:''},
        {id:'sdp_name',  label:'품목명',   type:'text', ph:''},
        {id:'sdp_type',  label:'처리유형', type:'select',
          opts:['','반품','폐기','재작업','특채']},
        {id:'sdp_status',label:'상태',     type:'select',
          opts:['','대기','처리중','완료']},
      ],
      cols:['처리번호','부적합번호','품목코드','품목명','수량','처리유형','처리일','처리자','상태'],
      get:(f)=>(DB.disposals||[]).filter(r=>
        (!f.sdp_no    ||r.no?.includes(f.sdp_no))&&
        (!f.sdp_ref   ||r.ref_nc?.includes(f.sdp_ref))&&
        (!f.sdp_code  ||r.item_code?.includes(f.sdp_code))&&
        (!f.sdp_name  ||r.item_name?.includes(f.sdp_name))&&
        (!f.sdp_type  ||r.type===f.sdp_type)&&
        (!f.sdp_status||r.status===f.sdp_status)
      ),
      row:(r)=>[H.e(r.no||'-'),H.e(r.ref_nc||'-'),H.e(r.item_code||'-'),
                H.e(r.item_name||'-'),(r.qty||0)+'',H.e(r.type||'-'),
                H.e(r.proc_date||'-'),H.e(r.handler||'-'),H.e(r.status||'-')],
    }},

  open(page){
    const cfg=this._cfg[page];
    if(!cfg){Toast.show('이 화면에서는 Search를 사용할 수 없습니다.','warn');return}
    this._page=page;
    document.getElementById('spTitle').textContent=cfg.title;
    const cond=document.getElementById('spCond');
    // sp-box 드래그 초기화 (열 때마다 중앙으로)
    const spBox=document.querySelector('.sp-box');
    if(spBox){spBox.style.transform='';spBox.style.left='';spBox.style.top='';spBox.style.position='';}
    this._initDrag();

    /* 날짜 퀵버튼 */
    const qbtnsHtml=cfg.quickDate?`<div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--bd)">
      <span style="font-size:11px;color:var(--tm);font-weight:600;margin-right:4px">기간:</span>
      ${[['week','이번주'],['month','이번달'],['last_month','지난달'],['h1','상반기'],['h2','하반기'],['q1','1분기'],['q2','2분기'],['q3','3분기'],['q4','4분기']].map(([k,l])=>`<button class="btn bxs bout" onclick="(function(){const [f,t]=DateRange.get('${k}');const fe=document.getElementById('si_from'),te=document.getElementById('si_to');if(fe)fe.value=f;if(te)te.value=t;SearchPop.search();})()">${l}</button>`).join('')}
    </div>`:'';

    cond.innerHTML=qbtnsHtml+`<div class="sp-cond-row" style="flex-wrap:wrap;gap:8px">${cfg.fields.map(f=>`
      <div style="display:flex;align-items:center;gap:5px">
        <label class="sp-cond-label">${H.e(f.label)}</label>
        ${f.type==='select'
          ?`<select class="sp-cond-inp fsel" id="${f.id}" style="min-width:110px"><option value="">${f.label} 전체</option>${(f.opts||[]).filter(o=>o!=='').map(o=>`<option>${H.e(o)}</option>`).join('')}</select>`
          :f.type==='date'
          ?`<input type="date" class="sp-cond-inp" id="${f.id}" style="min-width:130px">`
          :`<input type="text" class="sp-cond-inp" id="${f.id}" placeholder="${H.e(f.ph||f.label)}" style="min-width:110px">`}
      </div>`).join('')}
    </div>`;
    document.getElementById('spResult').innerHTML=`<div class="sp-empty"><div class="sp-empty-icon">🔍</div><div>검색 조건을 입력 후 Search를 클릭하세요.</div></div>`;
    document.getElementById('spInfo').textContent='';
    document.getElementById('spOverlay').classList.remove('hidden');
    setTimeout(()=>cond.querySelector('input,select')?.focus(),80);
  },

  search(){
    const cfg=this._cfg[this._page];if(!cfg)return;
    const f={};
    cfg.fields.forEach(fd=>{const el=document.getElementById(fd.id);if(el)f[fd.id]=(el.value||'').trim()});
    const data=cfg.get(f);
    const result=document.getElementById('spResult');
    document.getElementById('spInfo').textContent=`검색 결과: 총 ${data.length.toLocaleString()}건`;
    if(!data.length){result.innerHTML=`<div class="sp-empty"><div class="sp-empty-icon">📭</div><div style="font-weight:600;margin-bottom:4px">검색 결과가 없습니다.</div><div style="font-size:12px">조건을 변경해 보세요.</div></div>`;return}
    result.innerHTML=`<table><thead><tr>${cfg.cols.map(c=>`<th>${H.e(c)}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr onclick="SearchPop.close()">${cfg.row(r).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  },

  reset(){
    const cfg=this._cfg[this._page];if(!cfg)return;
    cfg.fields.forEach(f=>{const el=document.getElementById(f.id);if(el)el.value=''});
    document.getElementById('spResult').innerHTML=`<div class="sp-empty"><div class="sp-empty-icon">🔍</div><div>검색 조건을 입력 후 Search를 클릭하세요.</div></div>`;
    document.getElementById('spInfo').textContent='';
    setTimeout(()=>document.querySelector('#spCond input,#spCond select')?.focus(),60);
  },

  /* SearchPop 드래그 이동 — .sp-head 헤더 잡고 이동 */
  _initDrag(){
    const box=document.querySelector('.sp-box');
    const hd=document.querySelector('.sp-head');
    if(!box||!hd||hd._spDragBound) return;
    hd._spDragBound=true;
    let ox=0,oy=0;
    const onDown=e=>{
      if(e.target.closest('button')) return;
      const r=box.getBoundingClientRect();
      ox=e.clientX-r.left; oy=e.clientY-r.top;
      box.style.position='fixed';
      box.style.left=r.left+'px'; box.style.top=r.top+'px';
      box.style.margin='0'; box.style.transform='none';
      const ov=document.getElementById('spOverlay');
      ov.style.alignItems='flex-start'; ov.style.justifyContent='flex-start';
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    };
    const onMove=e=>{
      const nx=e.clientX-ox, ny=e.clientY-oy;
      const maxX=window.innerWidth-box.offsetWidth;
      const maxY=window.innerHeight-box.offsetHeight;
      box.style.left=Math.max(0,Math.min(nx,maxX))+'px';
      box.style.top=Math.max(0,Math.min(ny,maxY))+'px';
    };
    const onUp=()=>{
      document.removeEventListener('mousemove',onMove);
      document.removeEventListener('mouseup',onUp);
    };
    hd.addEventListener('mousedown',onDown);
  },
_deactivateUser(id){
  /* [v2.394] 사용자 비활성화 */
  Modal.confirm({title:'사용자 비활성화',msg:'해당 사용자를 비활성화하시겠습니까?',danger:true,onOk:async()=>{
    await SB.updateUser(id,{active:0});
    const u=DB.users.find(u=>u.id===id);if(u) u.active=0;
    Toast.show('비활성화되었습니다.','ok');
    Pages._renderSysUsers();
  }});
},

  close(){
    document.getElementById('spOverlay').classList.add('hidden');
    // 위치 초기화
    const ov=document.getElementById('spOverlay');
    ov.style.alignItems=''; ov.style.justifyContent='';
  }
};

/* ══ 전역 단축키 ══ */
function setupHotkeys(){
  document.addEventListener('keydown',ev=>{
    if(ev.key==='F2'){
      ev.preventDefault();
      const mOpen=!document.getElementById('gmo').classList.contains('hidden');
      (mOpen?document.querySelector('#gmo .btn-f2'):document.querySelector('.btn-f2'))?.click();
    }
    else if(ev.key==='F3'){
      ev.preventDefault();
      const spOpen=!document.getElementById('spOverlay').classList.contains('hidden');
      if(spOpen){SearchPop.search();return}
      const page=document.querySelector('.ni.active')?.dataset?.p;
      if(page)SearchPop.open(page);
      else Toast.show('홈 화면에서는 Search를 사용할 수 없습니다.','warn');
    }
    else if(ev.key==='F5'){
      /* [v2.394] F5 브라우저 새로고침 방지 — 앱 내부에서 현재 페이지 재렌더 */
      ev.preventDefault();
      if(Auth._u){
        const page=document.querySelector('.ni.active')?.dataset?.p||'home';
        Nav.go(page);
        Toast.show('화면을 새로고침했습니다.','info',1500);
      }
    }
    else if(ev.key==='F8'){
      ev.preventDefault();
      if(!document.getElementById('gmo').classList.contains('hidden'))
        document.querySelector('#gmo .btn-f8')?.click();
    }
    else if(ev.key==='Escape'){
      if(!document.getElementById('spOverlay').classList.contains('hidden'))SearchPop.close();
      else Modal.close();
    }
  });
  // Search 팝업 Enter → search
  document.getElementById('spCond')?.addEventListener('keydown',ev=>{if(ev.key==='Enter')SearchPop.search()});
}

/* ══ 초기화 ══ */
(function init(){
  const dateFmt=()=>new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'});
  const tbdEl=document.getElementById('tbd');if(tbdEl)tbdEl.textContent=dateFmt();
  setInterval(()=>{const e=document.getElementById('tbd');if(e)e.textContent=dateFmt()},60000);
  document.getElementById('lpw')?.addEventListener('keydown',e=>{if(e.key==='Enter')Auth.login()});
  const bdot=document.getElementById('bdot');if(bdot)bdot.style.display='block';
  setupHotkeys();

  /* C안: F5 새로고침 후 로그인 상태 + 마지막 페이지 복원
     1. sessionStorage에 저장된 로그인 정보 확인
     2. 있으면 → 앱 진입 + 마지막 페이지로 이동
     3. 파일 캐시는 FM.get() 호출 시 자동 복원 (lazy loading)
     4. 없으면 → 로그인 화면 표시 */
  const savedAuth = sessionStorage.getItem('qms_auth');
  if(savedAuth){
    try{
      const {cur, u} = JSON.parse(savedAuth);
      /* [v2.394 수정] 복원 시 저장된 사용자 정보로 표시 (admin 하드코딩 제거) */
      Auth._cur = cur;
      Auth._u   = u;
      const roleLabel={'admin':'관','manager':'장','user':'사'};
      ['uav','uname','urole','tbuser'].forEach((id,i)=>{
        const el=document.getElementById(id);
        if(el)el.textContent=[(u.name||u.username||'?')[0],u.name||u.username,roleLabel[u.role]||'사용자',u.name||u.username][i];
      });
      document.getElementById('loginOv').style.display='none';
      document.getElementById('app').classList.remove('hidden');
      /* [v2.394] 설정 메뉴: 세션 복원 시에도 admin만 표시 */
      const sm=document.getElementById('ni_settings');
      if(sm) sm.style.display=(u.role==='admin')?'':'none';
      const savedPage = sessionStorage.getItem('qms_page') || 'home';
      /* [v2.394] DB 일괄 로드 완료 후 페이지 이동 — 빈 DB로 렌더 방지 */
      (async()=>{
        try{
          if(_sb){
            const [eq,ca,it,nc,us,me,docs,cars,vd] = await Promise.all([
              SB.getEquip(), SB.getCals(), SB.getItems(), SB.getNCs(),
              SB.getUsers(), SB.getMentions(), SB.getDocs(), SB.getCars(),
              SB.getVendors()
            ]);
            if(eq)   DB.equip   = eq;
            if(ca)   DB.cals    = ca;
            if(it)   DB.items   = it;
            if(nc)   DB.nc      = nc;
            if(us)   DB.users   = us;
            if(me)   DB.mentions= me;
            if(docs) DB.docs    = docs;
            if(cars) DB.cars    = cars;
            if(vd)   DB.vendors = vd;
          }
        }catch(e){ console.warn('[세션복원] DB 로드 오류:', e); }
        Nav.go(savedPage);
        if(savedPage !== 'home'){
          Toast.show('마지막 화면으로 돌아왔습니다.','info',2000);
        }
      })();
    }catch(e){}
  }
})();
