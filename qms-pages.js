/* qms-pages.js — Pages 페이지 렌더러 [v2.327] */
"use strict";


const Pages={

/* ── 홈 (메인화면) ──
   레이아웃: hw(flex row) = hw-main(카드그리드) + hw-side(멘션/공지)
   카드 클릭: mc-card-sub onclick → Nav.go(page) 직접 이동
   v2.10: C안 우측 패널 고정, 카드 높이 5배, stopPropagation 제거 */
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
     subs:[{icon:'⭐',label:'업체 평가',page:'sqm_eval'},{icon:'🔎',label:'업체 심사',page:'sqm_audit'},{icon:'📊',label:'SQM 대시보드',page:'sqm_dash'}]},
    {c:'mc-c5',icon:'📈',name:'SPC 통계관리',badge:0,
     subs:[{icon:'📈',label:'관리도',page:'spc_chart'},{icon:'🎯',label:'Cp/Cpk',page:'spc_cpk'},{icon:'📊',label:'파레토 분석',page:'spc_pareto'}]},
    {c:'mc-c6',icon:'🔬',name:'계측기관리',badge:eqE,
     subs:[{icon:'🔬',label:'계측기 등록',page:'equip'},{icon:'📐',label:'교정 관리',page:'cal'},{icon:'📈',label:'MSA 분석',page:'msa'}]},
    {c:'mc-c7',icon:'📄',name:'문서관리',badge:0,
     subs:[{icon:'📄',label:'문서 관리',page:'docs'},{icon:'📋',label:'기록 관리',page:'rec'}]},
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
          <div class="hw-hdr-sub">Quality Management System · v2.327</div>
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

      <!-- [v2.307 Phase3] 교정 D-30 알림 패널 -->
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
            <!-- [v2.327 PhaseB] 미처리 멘션 D-day 패널 -->
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
/* ── 멘션 답장 [v2.24→v2.29] ── */
  /* [v2.29 A안] _mentionReply 전체 재작성 — 문자열 연결 방식 (백틱 중첩 제거) */
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
  /* [v2.327 PhaseB] thread_id 기반 SB 스레드 저장 */
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
  /* [v2.327] 입력창 초기화 + 배지 갱신 + 팝업 재렌더 */
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
  /* [v2.305] 승인 후 화면 유지 — usermgmt 탭 그대로 */
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

/* ── 사용자 권한 변경 (설정 > 사용자 관리, v2.23) ── */
async _setUserRole(userId, username, newRole){
  if(Auth._u?.role!=='admin'){Toast.show('관리자만 권한을 변경할 수 있습니다.','err');return}
  const res=await SB.updateUser(userId,{role:newRole,updated_at:H.today()});
  if(!res.ok) return;
  const u=DB.users.find(u=>u.id===userId);
  if(u) u.role=newRole;
  Toast.show(`${username} 권한이 ${{admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'}[newRole]||newRole}으로 변경되었습니다.`,'ok');
},

/* 접근 권한 저장 (sessionStorage, v2.23) */
/* [v2.327] perms 저장 — sessionStorage + SB users 테이블 */
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

/* 비밀번호 변경 (설정 탭, v2.23) */
async _changePw(){
  const g=k=>document.getElementById(k)?.value.trim()||'';
  const cur=g('sPwCur'),nw=g('sPwNew'),nw2=g('sPwNew2');
  if(!cur){Toast.show('현재 비밀번호를 입력하세요.','warn');return}
  if(!nw||nw.length<8){Toast.show('새 비밀번호는 8자 이상이어야 합니다.','warn');return}
  if(nw!==nw2){Toast.show('새 비밀번호가 일치하지 않습니다.','warn');return}
  const user=Auth._u;
  if(!user){Toast.show('로그인 정보를 찾을 수 없습니다.','err');return}
  /* admin 계정 */
  if(user.username==='admin'){
    if(cur!=='admin1234'){Toast.show('현재 비밀번호가 올바르지 않습니다.','err');return}
  } else {
    const curHash=await H.sha256(cur);
    if(curHash!==user.password){Toast.show('현재 비밀번호가 올바르지 않습니다.','err');return}
  }
  const newHash=await H.sha256(nw);
  if(user.id&&user.username!=='admin'){
    const res=await SB.updateUser(user.id,{password:newHash,updated_at:H.today()});
    if(!res.ok) return;
  }
  if(Auth._u) Auth._u.password=newHash;
  sessionStorage.setItem('qms_auth',JSON.stringify({cur:Auth._cur||'user',u:Auth._u}));
  ['sPwCur','sPwNew','sPwNew2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  Toast.show('비밀번호가 변경되었습니다.','ok');
},
/* ── 개인정보 팝업 ──
   [v2.23] 2-B: 로그인 사용자 실제 정보 표시
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
/* [v2.29] 설정 사용자관리 이름 클릭 → id로 사용자 찾아 수정 팝업 */
_uFormById(userId){
  const u=DB.users.find(x=>Number(x.id)===Number(userId));
  if(u) Pages._uForm(u);
  else Toast.show('사용자 정보를 찾을 수 없습니다.','err');
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
/* [v2.29] 사용자 활성/비활성 토글 */
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
/* [v2.23] _profileSave —
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
     [v2.19 수정] 통계 카드 실시간 재계산:
     render() 호출 시마다 data 기준으로 통계 재계산
     삭제/등록 후 즉시 숫자 반영 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  /* [v2.28 수정] _sbFetchAll 전체 로드 복원
     Phase1 _sbPage는 count 오류로 데이터 사라짐 버그 발생
     → _sbFetchAll로 안전하게 전체 로드 후 로컬 필터 방식 유지
     대용량 시: 향후 올바른 페이지네이션 방식으로 단계적 전환 */
  const allItems=await SB.getItems();
  DB.items=Array.isArray(allItems)?allItems:[];
  let data=[...DB.items], search='', cat='';

  const COLS=[
    {key:'major_category',label:'대분류',  w:'80px', render:v=>`<span class="badge bgry">${H.e(v||'-')}</span>`},
    {key:'category',      label:'품목분류', w:'78px', render:v=>`<span class="badge bblu">${H.e(v||'-')}</span>`},
    {key:'item_code', label:'품목코드', w:'100px',
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
    {key:'vendor_name',   label:'주 거래처',w:'110px'},
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
        const numIds=ids.map(Number);
        /* [v2.25] 즉시 로컬 제거 → 화면 먼저 갱신 */
        DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
        data=data.filter(i=>!numIds.includes(Number(i.id)));
        render();
        /* SB 일괄 삭제 (IN 쿼리 1번) */
        const res=await SB.deleteItems(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
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
  /* [v2.19] SB 연동 + 통계 실시간 갱신 */
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
  /* [v2.19] 통계 카드 실시간 갱신 */
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
    {key:'vendor_name',label:'거래처명',
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
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));
        Pages._vRender();
        const res=await SB.deleteVendors(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
      },onRow:row=>Pages._vForm(row)});
},
/* ── 품목 상세/등록/수정 팝업 ──
   [v2.19] 행 클릭 또는 품목코드 클릭 시 상세 팝업 열림 */
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
},
/* [v2.20 수정] async로 전환 + SB.addVendor/updateVendor 연동
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
  /* [v2.19] SB 연동 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const allUsers=await SB.getUsers();
  DB.users=allUsers;
  /* [v2.305] 기준정보 사원관리 = 활성 사용자만 표시 (list 개념, pending 제외) */
  const utotal=DB.users.filter(u=>!u.pending&&u.active!==0).length,
        uactive=DB.users.filter(u=>u.active&&!u.pending).length;
  const uroles={};DB.users.forEach(u=>{uroles[u.role]=(uroles[u.role]||0)+1});
  const udepts=new Set(DB.users.map(u=>u.department)).size;
  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">👥</div><div><div class="sd-val">${utotal}</div><div class="sd-lbl">전체 사용자</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${uactive}</div><div class="sd-lbl">활성</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div><div><div class="sd-val">${utotal-uactive}</div><div class="sd-lbl">비활성</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🏢</div><div><div class="sd-val">${udepts}</div><div class="sd-lbl">부서 수</div></div></div>
      ${Object.entries(uroles).map(([r,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${{admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'}[r]||r}</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">👥 사원관리</div><div class="psub">시스템 사용자 및 권한 관리</div></div>
      <div class="pac">
        <button class="btn bpri btn-f2" onclick="Pages._uForm()">+ 사용자 등록 <span class="kbd">F2</span></button>
        <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('users')">📥 양식 내려받기</button>
        <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('users')">📤 자료 일괄등록</button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="uSearch" placeholder="이름, 아이디, 부서 검색..." oninput="Pages._uFilter()"></div>
      <select class="fsel" id="uRoleF" onchange="Pages._uFilter()">
        <option value="">전체 권한</option><option value="admin">관리자</option><option value="manager">매니저</option><option value="user">사용자</option><option value="viewer">뷰어</option>
      </select>
      <select class="fsel" id="uStatusF" onchange="Pages._uFilter()">
        <option value="">전체 상태</option><option value="1">활성</option><option value="0">비활성</option>
      </select>
    </div>
    <div id="utbl"></div>`;
  Pages._uRender();
},
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
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));
        Pages._uRender();
        const res=await SB.deleteUsers(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
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
      <!-- [v2.23] 권한 설정은 설정 > 사용자 관리로 이동 -->
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
          <button class="btn bpri btn-f8" onclick="Pages._uSave(${row?.id||'null'})">${e?'저장':'등록'} <span class="kbd">F8</span></button>`
  });
},
/* [v2.22] A2: SHA-256 해시 저장 + password 컬럼 포함
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
    /* [v2.23] role은 설정 > 사용자 관리에서 변경
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
  } else {
    const res=await SB.addUser({...row,created_at:today,updated_at:today});
    if(!res.ok) return;
    Toast.show('사용자가 등록되었습니다.','ok');
  }
  Modal.close();Pages.users();
},

/* ── 임시비밀번호 발급 (관리자 전용, B2안) ──
   [v2.22] 관리자가 사용자 비밀번호를 임시값으로 초기화
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
   - v2.10: 구매검사(insp_pu), 외주검사(insp_ou) 추가
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
  /* [v2.28 복원] _sbFetchAll 전체 로드 후 로컬 필터 방식
     Phase1은 DOM 순서 문제로 무한 스피너 버그 발생 → 복원 */
  w.innerHTML='<div class="spin"></div>';
  /* [v2.29] 항상 SB에서 최신 데이터 로드 */
  const allInsp=await SB.getInspections();
  DB.inspections=Array.isArray(allInsp)?allInsp:[];
  let data=DB.inspections.filter(r=>r.type===key);
  let fromV='',toV='';

  const render=()=>{
    /* [v2.28 복원] 로컬 필터 방식 */
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
      {key:'insp_no',    label:'검사번호',    w:'148px'},
      {key:'insp_date',  label:'검사일',      w:'90px'},
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
        const numIds=ids.map(Number);
        if(!numIds.length) return;
        /* [v2.26] 즉시 로컬 제거 → 화면 먼저 갱신 */
        DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));
        render();
        /* SB 일괄 삭제 */
        const res=await SB.deleteInspections(numIds);
        if(res.ok) Toast.show(numIds.length+'건 삭제되었습니다.','ok');
        else Toast.show('삭제 오류: '+(res.msg||''),'warn',5000);
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
   v2.16: 신규 추가
   ─────────────────────────────────────────────────────────── */
quality_dash(){
  const w=document.getElementById('pw');

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
    return{filtered,months,byType,total,totalFail,
      totalPass:total-totalFail,
      defectRate:total>0?(totalFail/total*100):0,
      passRate:total>0?((total-totalFail)/total*100):0};
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

    w.innerHTML=`
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
    <div class="card" style="margin-bottom:12px;padding:18px">
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
nc(){
  const w=document.getElementById('pw');
  const nctotal=DB.nc.length,ncopen=DB.nc.filter(n=>n.status!=='완료').length,ncdone=DB.nc.filter(n=>n.status==='완료').length;
  const ncByType={};DB.nc.forEach(n=>{ncByType[n.type]=(ncByType[n.type]||0)+1});
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⚠️</div><div><div class="sd-val">${nctotal}</div><div class="sd-lbl">전체</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div><div><div class="sd-val">${ncopen}</div><div class="sd-lbl">미결</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${ncdone}</div><div class="sd-lbl">완료</div></div></div>
    ${Object.entries(ncByType).map(([t,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${t}검사</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">⚠️ 부적합 관리</div></div><div class="pac"><button class="btn bpri btn-f2" onclick="Pages._ncForm()">+ 부적합 등록 <span class="kbd">F2</span></button></div></div>
    <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('nc')" title="엑셀 양식 내려받기">📥 양식 내려받기</button><button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('nc')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
    <div class="tbar"><div class="sw2"><input type="text" placeholder="부적합번호, 품목명..."></div>
      <select class="fsel"><option value="">전체 상태</option><option>접수</option><option>처리중</option><option>완료</option></select>
      <button class="btn bout bsm" onclick="SearchPop.open('nc')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div><div id="nctbl"></div>`;
  Tbl.render({el:'#nctbl',cols:[
    {key:'no',label:'부적합번호',w:'142px'},{key:'type',label:'유형',w:'60px',render:v=>`<span class="badge bblu">${H.e(v)}</span>`},
    {key:'item',label:'품목명'},{key:'date',label:'발생일',w:'86px'},{key:'desc',label:'내용'},{key:'assignee',label:'담당자',w:'72px'},
    {key:'status',label:'상태',w:'68px',render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='처리중'?'bamb':'bgry'}">${H.e(v)}</span>`},
  ],data:DB.nc,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        DB.nc=DB.nc.filter(n=>!numIds.includes(Number(n.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.nc();
      },onRow:row=>Pages._ncDetail(row)});
},
_ncForm(){Modal.open({title:'부적합 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">발생 유형</label><select class="fc"><option>수입</option><option>공정</option><option>출하</option><option>기타</option></select></div>
  <div class="fgroup"><label class="fl req">발생일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl">품목</label><select class="fc"><option value="">선택</option>${DB.items.map(i=>`<option>${H.e(i.item_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl">수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup ff"><label class="fl req">부적합 내용</label><textarea class="fc" rows="3"></textarea></div>
  <div class="fgroup ff"><label class="fl">원인 분석</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup ff"><label class="fl">즉시 조치</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup"><label class="fl">담당자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl">처리 기한</label><input class="fc" type="date"></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
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
   [v2.327] 계측기 전용 업로드 — 재설계 (단순 3단계)
   1. _equipUploadOpen(): 팝업 + 양식 다운로드
   2. _equipParseFile(): 파일 읽기 → 미리보기
   3. _equipDoUpload(): DB 저장
   ══════════════════════════════════════════════════════ */

/* 컬럼 정의 — 단일 소스 (이 배열만 수정하면 모두 반영) */
_EQUIP_COLS:[
  {key:'code',    label:'계측기코드', req:true,  sample:'EQ-001'},
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
  /* [v2.327] 계측기 업로드 팝업 */
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
  /* [v2.327] 단순 양식 생성 — _EQUIP_COLS 직접 사용 */
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
  /* [v2.327] 파일 선택 시 즉시 파싱 */
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
  /* [v2.327] 파싱된 raw 데이터를 미리보기로 표시 */
  const cols=Pages._EQUIP_COLS;
  const el=document.getElementById('equipUploadPreview');
  if(!el) return;

  /* 헤더 행 — 대소문자/공백/접두사 무시하고 매핑 */
  const headerRow=raw[0].map(h=>String(h||'').replace(/\s*\*\s*$/,'').trim());
  /* 헤더 → key 매핑 */
  const h2k={};
  cols.forEach(c=>{h2k[c.label]=c.key;});
  /* 추가 별칭 */
  const alias={
    '계측기코드':'code','코드':'code',
    '계측기명':'name','기기명':'name',
    '모델번호':'model','모델':'model','형번':'model',
    '제조사':'maker','메이커':'maker',
    '측정범위':'range','범위':'range',
    '분해능':'res','해상도':'res',
    '보관위치':'loc','위치':'loc',
    '사용자':'operator','담당자':'operator',
    '최근교정일':'last','교정일':'last',
    '차기교정일':'next','다음교정일':'next',
    '사용여부':'active',
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
  /* [v2.327] parsed 데이터를 SB.addEquip으로 저장 */
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
  /* [v2.29] 항상 SB에서 최신 데이터 로드 */
  if(_sb){const d=await SB.getEquip();if(d)DB.equip=d;}
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
      /* [v2.327] 단순화 — 계측기 전용 업로드 버튼 */
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
    /* [v2.327] 컬럼 순서: 요청사항 기준 재정의 + model 복구 */
    {key:'code',     label:'계측기코드', w:'96px'},
    {key:'name',     label:'계측기명',   w:'130px'},
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
      render:v=>`<span class="badge ${v==='정상'?'bgrn':v==='교정중'?'bamb':'bred'}">${H.e(v||'-')}</span>`},
    {key:'id',       label:'파일',       w:'64px', align:'center',
      render:(v,row)=>FM.btn('equip-'+v)},
  ],data:DB.equip,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        /* [v2.29] SB 삭제 + 로컬 동기화 */
        if(_sb){
          const {error}=await _sb.from('equipment').delete().in('id',numIds);
          if(error){Toast.show('삭제 실패: '+error.message,'err');return;}
        }
        DB.equip=DB.equip.filter(e=>!numIds.includes(Number(e.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.equip();
      },onRow:row=>Pages._eqDetail(row)});
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
      +'</select></div></div>',
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
  const row={code,name,
    model:g('ef_model'),maker:g('ef_maker'),range:g('ef_range'),
    res:g('ef_res'),loc:g('ef_loc'),operator:g('ef_operator'),
    last:g('ef_last')||null,next:g('ef_next')||null,
    active:Number(document.getElementById('ef_active')?.value??1),
  };
  row.status=H.equipStatus(row.next);
  if(orig?.id) row.id=orig.id;

  /* [v2.305 Phase1] 수정 시 변경 이력 자동 기록 */
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
      {key:'name',     label:'계측기명'},
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

/* [v2.327 Phase3] 계측기 관리대장 인쇄 */
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
  /* [v2.305 Phase2] 탭 구조: 기본정보 / 교정이력 / 변경이력 */
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
    /* [v2.327 P2] cal_date 기준 내림차순 정렬 */
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

/* [v2.305] 탭 전환 */
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
  /* [v2.305] 변경이력 탭 비동기 로드 */
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
  /* [v2.305] 교정이력 삭제 */
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
  /* [v2.327 Phase3] D-30 이내 + 아직 만료 안된 계측기 */
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
  /* [v2.327 P4-3] 교정비용 통계 차트 */
  Pages._calCostChart();
  Tbl.render({el:'#calTbl',cols:[
    {key:'code',label:'계측기코드',w:'100px'},
    {key:'name',label:'계측기명',w:'130px'},
    {key:'cal_date',label:'교정일',w:'88px',render:(v,row)=>v||row.date||'-'},
    {key:'agency',label:'교정기관',w:'110px'},
    {key:'cert_no',label:'성적서번호',w:'110px',render:(v,row)=>v||row.cert||'-'},
    {key:'result',label:'결과',w:'72px',align:'center',
      render:v=>`<span class="badge ${v==='합격'?'bgrn':v==='조건부합격'?'bamb':'bred'}">${H.e(v||'-')}</span>`},
    {key:'next_date',label:'차기교정일',w:'92px',render:(v,row)=>v||row.next||'-'},
    {key:'cost',label:'비용(원)',w:'86px',align:'right',
      render:v=>v?Number(v).toLocaleString():'—'},
  ],data:DB.cals,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        DB.cals=DB.cals.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.cal_list?.();
      }});
},
_calForm(equip_code, calRow){
  /* [v2.305 Phase2] 교정 등록/수정 폼 */
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
  /* [v2.305 Phase2] 교정 저장 + equipment.next 자동 갱신 */
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const equip_code=g('cf_code'),cal_date=g('cf_date'),agency=g('cf_agency'),next_date=g('cf_next');
  if(!equip_code){Toast.show('계측기를 선택하세요.','warn');return}
  if(!cal_date){Toast.show('교정일을 입력하세요.','warn');return}
  if(!agency){Toast.show('교정기관을 입력하세요.','warn');return}
  if(!next_date){Toast.show('차기교정일을 입력하세요.','warn');return}
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

/* [v2.327 P4-1] QR코드 생성 */
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
/* [v2.327 P4-5] 교정 주기 기반 차기교정일 자동 계산 */
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
/* [v2.327 P4-3] 교정비용 연도별 + 계측기별 통계 차트 */
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
/* [v2.327 P4-6] 계측기 실시간 검색/필터 */
_eqFilter(){
  const q=(document.getElementById('eqSrch')?.value||'').toLowerCase();
  const st=document.getElementById('eqStat')?.value||'';
  const filtered=DB.equip.filter(e=>{
    const mQ=!q||(e.code||'').toLowerCase().includes(q)||(e.name||'').toLowerCase().includes(q);
    const mS=!st||e.status===st;
    return mQ&&mS;
  });
  Tbl.render({el:'#eqTbl',cols:[
    /* [v2.327] 컬럼 순서: 요청사항 기준 재정의 + model 복구 */
    {key:'code',     label:'계측기코드', w:'96px'},
    {key:'name',     label:'계측기명',   w:'130px'},
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
      render:v=>`<span class="badge ${v==='정상'?'bgrn':v==='교정중'?'bamb':'bred'}">${H.e(v||'-')}</span>`},
    {key:'id',       label:'파일',       w:'64px', align:'center',
      render:(v,row)=>FM.btn('equip-'+v)},
  ],data:filtered,onRow:row=>Pages._eqDetail(row)});
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

/* ── 문서 ── */
docs(){
  const w=document.getElementById('pw');
  const dByType={};DB.docs.forEach(d=>{dByType[d.type]=(dByType[d.type]||0)+1});
  const dValid=DB.docs.filter(d=>d.status==='유효').length;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📄</div><div><div class="sd-val">${DB.docs.length}</div><div class="sd-lbl">전체 문서</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${dValid}</div><div class="sd-lbl">유효</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📝</div><div><div class="sd-val">${DB.docs.filter(d=>d.status==='초안').length}</div><div class="sd-lbl">초안</div></div></div>
    ${Object.entries(dByType).map(([t,n])=>`<div class="sd-card sd-sm"><div class="sd-lbl">${t}</div><div class="sd-val" style="font-size:17px">${n}</div></div>`).join('')}
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">📄 문서 관리</div></div><div class="pac"><button class="btn bpri btn-f2" onclick="Pages._docForm()">+ 문서 등록 <span class="kbd">F2</span></button></div></div>
    <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('docs')" title="엑셀 양식 내려받기">📥 양식 내려받기</button><button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('docs')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
    <div class="tbar"><div class="sw2"><input type="text" placeholder="문서번호, 제목..."></div>
      <select class="fsel"><option value="">전체 유형</option><option>절차서</option><option>지침서</option><option>양식</option></select>
      <button class="btn bout bsm" onclick="SearchPop.open('docs')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div><div id="docTbl"></div>`;
  Tbl.render({el:'#docTbl',cols:[
    {key:'no',label:'문서번호',w:'142px'},{key:'type',label:'유형',w:'70px',render:v=>`<span class="badge bblu">${H.e(v)}</span>`},
    {key:'title',label:'제목'},{key:'rev',label:'개정번호',w:'72px',align:'center'},
    {key:'date',label:'발행일',w:'86px'},{key:'author',label:'작성자',w:'72px'},
    {key:'status',label:'상태',w:'62px',render:v=>`<span class="badge ${v==='유효'?'bgrn':v==='초안'?'bamb':'bgry'}">${H.e(v)}</span>`},
  ],data:DB.docs,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        DB.docs=DB.docs.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.docs?.();
      },onRow:row=>Pages._docDetail(row)});
},
_docForm(row=null){Modal.open({title:row?'문서 수정':'문서 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">유형</label><select class="fc">${['절차서','지침서','양식','매뉴얼','규정'].map(t=>`<option ${row?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">개정번호</label><input class="fc" value="${H.e(row?.rev||'1.0')}"></div>
  <div class="fgroup ff"><label class="fl req">제목</label><input class="fc" value="${H.e(row?.title||'')}"></div>
  <div class="fgroup"><label class="fl">발행일</label><input class="fc" type="date" value="${row?.date||H.today()}"></div>
  <div class="fgroup"><label class="fl">상태</label><select class="fc">${['초안','검토중','유효','폐기'].map(s=>`<option ${row?.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
  <div class="fgroup ff"><label class="fl">내용 요약</label><textarea class="fc" rows="3"></textarea></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('저장되었습니다.','ok');Modal.close()">${row?'저장':'등록'} <span class="kbd">F8</span></button>`})},
_docDetail(row){Modal.open({title:`문서 상세 — ${row.no}`,size:'mlg',
  body:`<div class="ir"><div class="il">문서번호</div><div class="iv" style="font-family:'JetBrains Mono',monospace">${H.e(row.no)}</div></div>
  <div class="ir"><div class="il">유형/제목</div><div class="iv"><span class="badge bblu">${H.e(row.type)}</span> <strong>${H.e(row.title)}</strong></div></div>
  <div class="ir"><div class="il">개정/발행일</div><div class="iv">Rev.${H.e(row.rev)} / ${row.date}</div></div>
  <div class="ir"><div class="il">작성자</div><div class="iv">${H.e(row.author)}</div></div>
  <div class="ir"><div class="il">상태</div><div class="iv"><span class="badge ${row.status==='유효'?'bgrn':'bamb'}">${H.e(row.status)}</span></div></div>
  <div id="docCmt"></div>`,
  foot:`<button class="btn bout" onclick="Modal.close()">닫기</button><button class="btn bpri" onclick="Pages._docForm(${JSON.stringify(row).replace(/"/g,'&quot;')})">수정</button>`
});setTimeout(()=>Cmt.render('#docCmt',`doc-${row.id}`),80)},
rec(){document.getElementById('pw').innerHTML=`<div class="ph"><div><div class="ptit">📋 기록 관리</div></div></div><div class="card"><div class="es"><div class="es-icon">📋</div><div>기록 관리 — 백엔드 연동 후 활성화</div></div></div>`},

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
        const numIds=ids.map(Number);
        DB.cars=DB.cars.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        Pages.car?.();
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
/* [v2.22] C1: SB.getMentions 연동 */
async mentions(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const allM=await SB.getMentions();
  DB.mentions=Array.isArray(allM)?allM:[];
  const me=Auth._cur||'admin';
  const isAdmin=(Auth._u?.role==='admin');

  /* [v2.327 PhaseA] 채널 정의 — 8대 메뉴 */
  const CHANNELS=[
    {key:'all',    label:'전체',     icon:'💬'},
    {key:'reference', label:'기준정보', icon:'📦'},
    {key:'quality',   label:'품질관리', icon:'🔍'},
    {key:'inspection',label:'검사고도화',icon:'📋'},
    {key:'supplier',  label:'공급업체', icon:'⭐'},
    {key:'calibration',label:'계측기',  icon:'🔬'},
    {key:'spc',       label:'SPC통계', icon:'📈'},
    {key:'improvement',label:'개선활동',icon:'🔧'},
    {key:'document',  label:'문서관리', icon:'📄'},
  ];
  const TYPES={mention:'💬 멘션',task:'📋 태스크',notice:'📢 공지',approval:'✅ 승인요청'};
  const PRIORITY={urgent:{label:'긴급',cls:'bred'},normal:{label:'일반',cls:'bpri'},low:{label:'낮음',cls:'bgh'}};
  const STATUS={open:{label:'열림',cls:'bamb'},in_progress:{label:'진행중',cls:'bpri'},done:{label:'완료',cls:'bgrn'}};

  /* 필터 상태 */
  let curCh='all', curType='', curStatus='', curQ='';

  const unread=DB.mentions.filter(m=>!m.read&&(m.to===me||(m.to_list||[]).includes(me)));
  const myTask=DB.mentions.filter(m=>m.type==='task'&&(m.to===me||(m.to_list||[]).includes(me))&&m.status!=='done');

  /* 렌더 함수 */
  const renderList=()=>{
    let items=[...DB.mentions];
    if(curCh!=='all') items=items.filter(m=>(m.channel||'general')===curCh);
    if(curType)        items=items.filter(m=>(m.type||'mention')===curType);
    if(curStatus)      items=items.filter(m=>(m.status||'open')===curStatus);
    if(curQ){
      const q=curQ.toLowerCase();
      items=items.filter(m=>(m.text||'').toLowerCase().includes(q)||(m.from||'').toLowerCase().includes(q));
    }
    const pinned=items.filter(m=>m.pinned);
    const normal=items.filter(m=>!m.pinned).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));

    const cardHtml=(m)=>{
    /* [v2.327] 멘션 1행 — dt 클래스 방식, 폰트 inherit, 클릭 완전 구현 */
    const isMe=(m.from===me)||(me==='admin'&&m.from==='관리자');
    const isMy=(m.to===me)||(m.to_list||[]).includes(me)||isAdmin;
    const pCls=m.priority==='urgent'?'bred':m.priority==='low'?'bgh':'bpri';
    const sCls=m.status==='done'?'bgrn':m.status==='in_progress'?'bpri':'bamb';
    const tIcon={'mention':'💬','task':'📋','notice':'📢','approval':'✅'}[m.type||'mention']||'💬';
    const unread=(!m.read&&isMy);
    const replyN=(m.replies||[]).length+(DB.mentions||[]).filter(mn=>mn.thread_id===m.id).length;
    const dt=(m.created_at||m.time||'').replace('T',' ').slice(0,16);
    const due=m.due_date?(()=>{const d=Math.ceil((new Date(m.due_date)-new Date())/(864e5));return d<0?'<span class="badge bred" style="font-size:10px">D+'+Math.abs(d)+'</span>':d<=3?'<span class="badge bamb" style="font-size:10px">D-'+d+'</span>':''})():'';
    const linkTag=m.link_id
      ?'<span style="font-size:10px;color:#3b82f6;background:#eff6ff;border-radius:3px;padding:0 4px;margin-left:4px;cursor:pointer" onclick="event.stopPropagation();Pages._mentionLinkGo(&quot;'+H.e(m.link_type)+'&quot;,&quot;'+H.e(m.link_id)+'&quot;)" title="바로가기">🔗'+H.e(m.link_id)+'</span>':'';
    const fileTag=m.file_url?'<span style="font-size:10px;color:#16a34a;margin-left:4px">📎</span>':'';
    const replyTag=replyN?'<span style="font-size:10px;color:#6366f1;background:#f5f3ff;border-radius:3px;padding:0 4px;margin-left:4px">💬'+replyN+'</span>':'';
    return (
      '<tr style="cursor:pointer;font-size:13px;'+(unread?'font-weight:700;':'background:transparent;')+(m.pinned?'background:#fefce8;':'')+'"'
      +' onclick="Pages._mentionReplyView('+m.id+')">'
      /* 미읽음 점 */
      +'<td style="width:18px;text-align:center">'+(unread?'<span style="display:inline-block;width:7px;height:7px;background:#ef4444;border-radius:50%"></span>':'')+'</td>'
      /* 유형 아이콘 */
      +'<td style="width:24px;text-align:center">'+tIcon+'</td>'
      /* 고정 핀 */
      +'<td style="width:18px;text-align:center">'+(m.pinned?'📌':'')+'</td>'
      /* 발신자 */
      +'<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px">'+H.e(m.from||'?')+'</td>'
      /* 수신자 */
      +'<td style="color:var(--tm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px">'+H.e((m.to_list||[m.to]).slice(0,2).join(','))+((m.to_list||[]).length>2?'…':'')+'</td>'
      /* 내용 */
      +'<td>'+H.e((m.text||'').slice(0,60))+((m.text||'').length>60?'…':'')+linkTag+fileTag+replyTag+due+'</td>'
      /* 우선순위 */
      +'<td style="white-space:nowrap;text-align:center"><span class="badge '+pCls+'" style="font-size:10px">'+(m.priority==='urgent'?'긴급':m.priority==='low'?'낮음':'일반')+'</span></td>'
      /* 상태 */
      +'<td style="white-space:nowrap;text-align:center"><span class="badge '+sCls+'" style="font-size:10px">'+(m.status==='done'?'완료':m.status==='in_progress'?'진행중':'열림')+'</span></td>'
      /* 일시 */
      +'<td style="color:var(--tm);white-space:nowrap;text-align:right">'+dt+'</td>'
      /* 액션 — 이벤트 전파 차단 */
      +'<td style="white-space:nowrap;text-align:center" onclick="event.stopPropagation()">'
        +(m.status!=='done'&&(isMy||isAdmin)?'<button class="btn bxs bgrn" style="font-size:10px" onclick="Pages._mentionStatus('+m.id+',&quot;done&quot;)" title="완료">✅</button> ':'')
        +(!m.read&&isMy?'<button class="btn bxs" style="font-size:10px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac" onclick="Pages._mentionRead('+m.id+')" title="읽음">읽음</button> ':'')
        +'<button class="btn bxs" style="font-size:10px;background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe" onclick="Pages._mentionReplyView('+m.id+')" title="답글">💬</button>'
        +(isMe?'<button class="btn bxs bout" style="font-size:10px" onclick="Pages._mentionEdit('+m.id+')" title="수정">✏️</button>':'')
        +((isAdmin||(isMe&&!(m.replies||[]).length))?'<button class="btn bxs berr" style="font-size:10px" onclick="Pages._mentionDel('+m.id+')" title="삭제">🗑</button>':'')
      +'</td>'
      +'</tr>'
    );
  };;;

    const listEl=document.getElementById('mlist');
    if(!listEl) return;
    /* [v2.327] 목록 헤더 */
    /* [v2.327] 멘션 table: width 100%, font inherit(기존 메뉴와 동일) */
    const headerHtml=
      '<table class="dt" style="width:100%;table-layout:auto">'

      +'<thead><tr>'
      +'<th></th>'
      +'<th>유형</th>'
      +'<th></th>'
      +'<th>발신자</th>'
      +'<th>수신자</th>'
      +'<th>내용</th>'
      +'<th>우선순위</th>'
      +'<th>상태</th>'
      +'<th>일시</th>'
      +'<th>액션</th>'
      +'</tr></thead>';
    const pinnedHtml=pinned.length
      ?'<div style="border-bottom:1px dashed var(--bd);margin-bottom:10px;padding-bottom:6px"><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:6px">📌 고정 메시지</div>'+pinned.map(cardHtml).join('')+'</div>':'';
    listEl.innerHTML=headerHtml
      +'<tbody>'
      +(pinned.length?pinned.map(cardHtml).join(''):'')
      +(normal.length?normal.map(cardHtml).join(''):'<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--tm);font-size:12px">📭 멘션이 없습니다.</td></tr>')+'</tbody></table>';
  };

  /* 채널 탭 HTML */
  const chTabs=CHANNELS.map(c=>{
    const cnt=c.key==='all'?DB.mentions.length:DB.mentions.filter(m=>(m.channel||'general')===c.key).length;
    return '<button class="btn bsm men-chtab" data-ch="'+c.key+'" onclick="Pages._menChTab(this)" style="'
      +'border-radius:20px;padding:4px 12px;font-size:11px;margin:2px;'
      +(c.key==='all'?'background:var(--pri);color:#fff;':'background:var(--bg2);color:var(--tx);')
      +'">'+c.icon+' '+c.label+(cnt?' <span style="background:rgba(0,0,0,.15);border-radius:10px;padding:0 5px;font-size:10px">'+cnt+'</span>':'')+'</button>';
  }).join('');

  w.innerHTML='<div class="ph"><div><div class="ptit">💬 멘션함</div></div>'
    +'<div class="pac" style="gap:6px">'
    +'<button class="btn bsm bout" onclick="Pages._mentionStats()" title="통계">📊 통계</button>'
    +'<button class="btn bsm" style="background:#f5f3ff;color:#7c3aed" onclick="Pages._mentionFollowUp()" title="미응답 팔로우업">🔄 팔로우업</button>'
    +'<button class="btn bpri bsm" onclick="Pages._mentionWrite()">✉️ 새 멘션</button>'
    +'</div></div>'
    +'<div style="display:grid;grid-template-columns:180px 1fr;gap:12px;height:calc(100vh - 130px)">'
    /* 좌측 사이드 */
    +'<div style="display:flex;flex-direction:column;gap:4px;padding:4px 0">'
    +'<div class="men-side-item active" onclick="Pages._menSideFilter(this,\'all\')" style="cursor:pointer;padding:6px 10px;border-radius:6px;background:var(--bg2);display:flex;justify-content:space-between;align-items:center"><span>💬 전체</span><span class="badge bpri" style="font-size:10px">'+DB.mentions.length+'</span></div>'
    +'<div class="men-side-item" onclick="Pages._menSideFilter(this,\'unread\')" style="cursor:pointer;padding:6px 10px;border-radius:6px;display:flex;justify-content:space-between;align-items:center"><span>🔴 미읽음</span>'+(unread.length?'<span class="badge bred" style="font-size:10px">'+unread.length+'</span>':'')+'</div>'
    +'<div class="men-side-item" onclick="Pages._menSideFilter(this,\'mine\')" style="cursor:pointer;padding:6px 10px;border-radius:6px;display:flex;justify-content:space-between;align-items:center"><span>📋 내 담당</span>'+(myTask.length?'<span class="badge bamb" style="font-size:10px">'+myTask.length+'</span>':'')+'</div>'
    +'<div class="men-side-item" onclick="Pages._menSideFilter(this,\'sent\')" style="cursor:pointer;padding:6px 10px;border-radius:6px">📤 보낸 것</div>'
    +'<div class="men-side-item" onclick="Pages._menSideFilter(this,\'done\')" style="cursor:pointer;padding:6px 10px;border-radius:6px">✅ 완료</div>'
    +'<div class="men-side-item" onclick="Pages._menSideFilter(this,\'pinned\')" style="cursor:pointer;padding:6px 10px;border-radius:6px">📌 고정</div>'
    +'</div>'
    /* 우측 메인 */
    +'<div style="display:flex;flex-direction:column;overflow:hidden">'
    /* 채널 탭 */
    +'<div style="background:var(--bg2);border-radius:8px;padding:6px;margin-bottom:10px;display:flex;flex-wrap:wrap">'+chTabs+'</div>'
    /* 필터 바 */
    +'<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">'
    +'<select class="fc" id="mTypeFilter" style="width:110px;font-size:12px" onchange="Pages._menFilter()">'
    +'<option value="">전체 유형</option>'
    +Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')
    +'</select>'
    +'<select class="fc" id="mStatFilter" style="width:100px;font-size:12px" onchange="Pages._menFilter()">'
    +'<option value="">전체 상태</option>'
    +Object.entries(STATUS).map(([k,v])=>'<option value="'+k+'">'+v.label+'</option>').join('')
    +'</select>'
    +'<div style="flex:1;position:relative">'
    +'<input class="fc" id="mSearch" placeholder="🔍 내용/발신자/연결ID 검색..." style="font-size:12px;width:100%" oninput="Pages._menFilter()">'
    +'</div>'
    +'<span style="font-size:11px;color:var(--tm)" id="mCount"></span>'
    +'</div>'
    /* 목록 */
    +'<div id="mlist" style="overflow:auto;flex:1"></div>'
    +'</div>'
    +'</div>';

  /* 필터 함수들 */
  w._menChTab = (btn)=>{
    document.querySelectorAll('.men-chtab').forEach(b=>{
      b.style.background=b===btn?'var(--pri)':'var(--bg2)';
      b.style.color=b===btn?'#fff':'var(--tx)';
    });
    curCh=btn.dataset.ch;
    renderList();
    const cnt=document.getElementById('mlist')?.children.length||0;
    const cntEl=document.getElementById('mCount');
    if(cntEl) cntEl.textContent=cnt+'건';
  };
  Pages._menChTab=w._menChTab;
  /* [v2.327] 채널 탭 전환 배지 갱신 래퍼 */
  const _origChTab=Pages._menChTab;
  Pages._menChTab=(btn)=>{ _origChTab(btn); TopNav.updateMentionBadge(); };

  Pages._menSideFilter=(el,type)=>{
    document.querySelectorAll('.men-side-item').forEach(i=>i.style.background='');
    el.style.background='var(--bg2)'; el.style.fontWeight='600';
    curType=''; curStatus=''; curCh='all';
    if(type==='unread')      {DB.mentions=DB.mentions.filter(m=>!m.read);}
    else if(type==='mine')   {DB.mentions=DB.mentions.filter(m=>m.to===me||(m.to_list||[]).includes(me));}
    else if(type==='sent')   {DB.mentions=DB.mentions.filter(m=>m.from===me);}
    else if(type==='done')   {curStatus='done';}
    else if(type==='pinned') {DB.mentions=DB.mentions.filter(m=>m.pinned);}
    else                     {DB.mentions=Array.isArray(allM)?allM:[];}
    renderList();
  };

  Pages._menFilter=()=>{
    curType  = document.getElementById('mTypeFilter')?.value||'';
    curStatus= document.getElementById('mStatFilter')?.value||'';
    curQ     = document.getElementById('mSearch')?.value||'';
    const from   = document.getElementById('mFromFilter')?.value||'';
    const dateFrom= document.getElementById('mDateFrom')?.value||'';
    const dateTo  = document.getElementById('mDateTo')?.value||'';
    /* 임시 필터 함수 오버라이드 */
    const _baseFilter = (items)=>{
      let r=[...items];
      if(curCh!=='all') r=r.filter(m=>(m.channel||'general')===curCh);
      if(curType)        r=r.filter(m=>(m.type||'mention')===curType);
      if(curStatus)      r=r.filter(m=>(m.status||'open')===curStatus);
      if(from)           r=r.filter(m=>m.from===from);
      if(dateFrom)       r=r.filter(m=>(m.created_at||m.time||'')>=dateFrom);
      if(dateTo)         r=r.filter(m=>(m.created_at||m.time||'').slice(0,10)<=dateTo);
      if(curQ){
        const q=curQ.toLowerCase();
        r=r.filter(m=>(m.text||'').toLowerCase().includes(q)||(m.from||'').toLowerCase().includes(q)||(m.link_id||'').toLowerCase().includes(q));
      }
      return r;
    };
    const filtered=_baseFilter(DB.mentions);
    const cntEl=document.getElementById('mCount');
    if(cntEl) cntEl.textContent=filtered.length+'건';
    renderList();
  };
  /* [v2.327 PhaseC] 필터 초기화 */
  Pages._menFilterReset=()=>{
    ['mTypeFilter','mStatFilter','mFromFilter','mSearch'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value='';
    });
    ['mDateFrom','mDateTo'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value='';
    });
    curType=''; curStatus=''; curQ='';
    renderList();
  };

  renderList();
},

/* [v2.327 PhaseA] 멘션 작성/수정 폼 */
_mentionWrite(editId=null){
  const me=Auth._cur||'admin';
  const meUser=DB.users.find(u=>u.username===me)||{name:'관리자'};
  const existing=editId?DB.mentions.find(m=>m.id===editId):null;

  const CHANNELS_MAP={
    general:'일반',reference:'기준정보',quality:'품질관리',
    inspection:'검사고도화',supplier:'공급업체',
    calibration:'계측기관리',spc:'SPC통계',
    improvement:'개선활동',document:'문서관리'
  };
  const recipients=[...new Set(DB.users.filter(u=>u.active!==0&&!u.pending).map(u=>u.name||u.username).concat(['전체']))];

  const chOpts=Object.entries(CHANNELS_MAP).map(([k,v])=>
    '<option value="'+k+'"'+(existing?.channel===k?' selected':(!existing&&k==='general'?' selected':''))+'>'+v+'</option>'
  ).join('');
  const typeOpts=[['mention','💬 멘션'],['task','📋 태스크'],['notice','📢 공지'],['approval','✅ 승인요청']].map(([k,v])=>
    '<option value="'+k+'"'+(existing?.type===k?' selected':'')+'>'+v+'</option>'
  ).join('');
  const prioOpts=[['urgent','🔴 긴급'],['normal','🟡 일반'],['low','⚪ 낮음']].map(([k,v])=>
    '<option value="'+k+'"'+(existing?.priority===k?' selected':'')+(k==='normal'&&!existing?.priority?' selected':'')+'>'+v+'</option>'
  ).join('');

  const curTo=(existing?.to_list||[existing?.to]).filter(Boolean);
  const toTags=curTo.map(t=>'<span class="badge bpri" style="font-size:11px;cursor:pointer" onclick="this.remove()">'+H.e(t)+' ×</span>').join('');

  Modal.open({title:editId?'✏️ 멘션 수정':'✉️ 새 멘션 작성',size:'mlg',
    body:'<div class="fg2">'
      +'<div class="fgroup"><label class="fl">채널</label>'
      +'<select class="fc" id="mwCh">'+chOpts+'</select></div>'
      +'<div class="fgroup"><label class="fl">유형</label>'
      +'<select class="fc" id="mwType">'+typeOpts+'</select></div>'
      +'<div class="fgroup"><label class="fl">우선순위</label>'
      +'<select class="fc" id="mwPrio">'+prioOpts+'</select></div>'
      +'<div class="fgroup ff"><label class="fl req">수신자</label>'
      +'<div style="display:flex;gap:6px;align-items:center">'
      +'<select class="fc" id="mwToSel" style="flex:1">'
      +'<option value="">-- 선택 --</option>'
      +recipients.map(r=>'<option value="'+H.e(r)+'">'+H.e(r)+'</option>').join('')
      +'</select>'
      +'<button class="btn bgh bsm" onclick="Pages._menAddTo()">+ 추가</button>'
      +'</div>'
      +'<div id="mwToList" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">'+toTags+'</div></div>'
      +'<div class="fgroup ff"><label class="fl req">내용</label>'
      +'<textarea class="fc" id="mwText" rows="3" placeholder="@대상자 내용을 입력하세요...">'+H.e(existing?.text||'')+'</textarea></div>'
      +'<div class="fgroup"><label class="fl">마감일</label>'
      +'<input class="fc" type="date" id="mwDue" value="'+(existing?.due_date||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">업무 연결</label>'
      +'<div style="display:flex;gap:6px">'
      +'<select class="fc" id="mwLinkType" style="width:110px">'
      +'<option value="">없음</option><option value="nc">부적합</option>'
      +'<option value="equip">계측기</option><option value="car">시정조치</option>'
      +'<option value="insp_in">수입검사</option><option value="docs">문서</option>'
      +'</select>'
      +'<input class="fc" id="mwLinkId" placeholder="레코드 번호 (예: NC-001)" value="'+(existing?.link_id||'')+'" ></div></div>'
      +'<div class="fgroup ff"><label class="fl">파일 첨부</label>'
      +'<input type="file" id="mwFile" class="fc" style="font-size:11px" accept="image/*,.pdf,.xlsx,.docx,.zip">'
      +'</div>'
      +'</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" onclick="Pages._mentionSave('+(editId||'null')+')">'+( editId?'💾 수정':'📤 전송')+'</button>',
  });
  setTimeout(()=>{
    const b=document.getElementById('mwToList');
    if(b&&curTo.length===0){
      const myTag=document.createElement('span');
      myTag.className='badge bpri'; myTag.style.cssText='font-size:11px;cursor:pointer';
      myTag.setAttribute('data-to','');
      myTag.onclick=()=>myTag.remove();
    }
  },50);
},

/* 수신자 추가 */
_menAddTo(){
  const sel=document.getElementById('mwToSel');
  const list=document.getElementById('mwToList');
  if(!sel||!list||!sel.value) return;
  const existing=[...list.querySelectorAll('span')].map(s=>s.textContent.replace(' ×',''));
  if(existing.includes(sel.value)) return;
  const span=document.createElement('span');
  span.className='badge bpri'; span.style.cssText='font-size:11px;cursor:pointer;margin:2px';
  span.textContent=sel.value+' ×';
  span.onclick=()=>span.remove();
  list.appendChild(span);
  sel.value='';
},
async _mentionSave(editId){
  const toList=[...document.querySelectorAll('#mwToList span')].map(s=>s.textContent.replace(' ×','').trim()).filter(Boolean);
  const text=(document.getElementById('mwText')?.value||'').trim();
  if(!toList.length){Toast.show('수신자를 추가하세요.','warn');return}
  if(!text){Toast.show('내용을 입력하세요.','warn');return}
  const me=Auth._cur||'admin';
  const meUser=DB.users.find(u=>u.username===me)||{name:'관리자',dept:''};
  const row={
    from:     meUser.name||me,
    dept:     meUser.dept||'',
    to:       toList[0],
    to_list:  toList,
    text,
    channel:  document.getElementById('mwCh')?.value||'general',
    type:     document.getElementById('mwType')?.value||'mention',
    priority: document.getElementById('mwPrio')?.value||'normal',
    status:   'open',
    due_date: document.getElementById('mwDue')?.value||null,
    link_type:document.getElementById('mwLinkType')?.value||null,
    link_id:  document.getElementById('mwLinkId')?.value||null,
    ref:      document.getElementById('mwCh')?.value||'general',
    read:     false,
    replies:  [],
    created_at:new Date().toISOString(),
  };
  /* [v2.327 PhaseC] 파일 첨부 처리 */
  const fileEl=document.getElementById('mwFile');
  if(fileEl?.files?.length){
    const f=fileEl.files[0];
    const uploaded=await SB.uploadFile('mentions',f);
    if(uploaded?.url) row.file_url=uploaded.url;
  }
  /* [v2.327 PhaseC] 파일 첨부 */
  const _fEl=document.getElementById('mwFile');
  if(_fEl?.files?.length){
    const _fUp=await SB.uploadFile('mentions',_fEl.files[0]);
    if(_fUp?.url) row.file_url=_fUp.url;
  }
  if(editId){
    const res=await SB.updateMention(editId,{text:row.text,to:row.to,to_list:row.to_list,
      channel:row.channel,type:row.type,priority:row.priority,
      due_date:row.due_date,link_type:row.link_type,link_id:row.link_id,file_url:row.file_url});
    if(!res.ok) return;
    Toast.show('멘션이 수정되었습니다.','ok');
  } else {
    const res=await SB.addMention(row);
    if(!res.ok) return;
    Toast.show('멘션이 전송되었습니다.','ok');
  }
  Modal.close();
  /* [v2.327] 전송 후 배지 갱신 */
  setTimeout(()=>TopNav.updateMentionBadge(),300);
  Pages.mentions();
},

/* [v2.327 PhaseA] 상태 변경 (완료/진행중) */
async _mentionStatus(id, status){
  const m=DB.mentions.find(m=>m.id===id);
  if(!m) return;
  const res=await SB.updateMention(id,{status,read:true});
  if(!res.ok) return;
  m.status=status; m.read=true;
  Toast.show(status==='done'?'완료 처리되었습니다.':'진행중으로 변경되었습니다.','ok');
  TopNav.updateMentionBadge();
  Pages.mentions();
},

/* [v2.327 PhaseA] 읽음 처리 */
async _mentionRead(id){
  const m=DB.mentions.find(m=>m.id===id);
  if(!m) return;
  await SB.updateMention(id,{read:true});
  m.read=true;
  /* [v2.327 PhaseB] 배지 업데이트 — 내 미읽음 기준 */
  const _me2=Auth._cur||'admin';
  const unread=DB.mentions.filter(m=>!m.read&&(m.to===_me2||(m.to_list||[]).includes(_me2)||Auth._u?.role==='admin')).length;
  const nb=document.getElementById('mnb');
  if(nb){nb.textContent=unread||'';nb.style.display=unread?'':'none';}
  Pages.mentions();
  TopNav.updateMentionBadge();
},

/* [v2.327 PhaseA] 고정/해제 */
async _mentionPin(id, pinned){
  const m=DB.mentions.find(m=>m.id===id);
  if(!m) return;
  await SB.updateMention(id,{pinned});
  m.pinned=pinned;
  Toast.show(pinned?'고정되었습니다.':'고정이 해제되었습니다.','ok');
  Pages.mentions();
},

/* [v2.327 PhaseA] 반응(Reaction) */
async _mentionReact(id, emoji){
  const m=DB.mentions.find(m=>m.id===id);
  if(!m) return;
  const me=Auth._u?.name||Auth._cur||'admin';
  const reactions={...m.reactions||{}};
  if(!reactions[emoji]) reactions[emoji]=[];
  const idx=reactions[emoji].indexOf(me);
  if(idx>=0) reactions[emoji].splice(idx,1);
  else reactions[emoji].push(me);
  if(!reactions[emoji].length) delete reactions[emoji];
  await SB.updateMention(id,{reactions});
  m.reactions=reactions;
  Pages.mentions();
},
/* [v2.327 PhaseB] 업무 레코드 바로가기 링크 맵 */
_mentionLinkGo(linkType, linkId){
  const NAV_MAP={
    nc:'nc', equip:'equip', cal:'cal', car:'car',
    insp_in:'insp_in', insp_pr:'insp_pr', insp_pu:'insp_pu',
    insp_ou:'insp_ou', insp_fi:'insp_fi',
    docs:'docs', rec:'rec', sqm_eval:'sqm_eval',
  };
  const page=NAV_MAP[linkType];
  if(!page){Toast.show('해당 메뉴로 이동할 수 없습니다.','warn');return;}
  Modal.close();
  Nav.go(page);
  Toast.show('🔗 '+linkId+' — '+page+' 페이지로 이동했습니다.','info',2500);
},

/* [v2.327 PhaseB] 반응 이모지 선택 팝업 */
_mentionReactPop(id){
  const EMOJIS=['👍','✅','🔄','🔥','❓','⚠️','💡','👀'];
  const m=DB.mentions.find(m=>m.id===id);
  if(!m) return;
  const me=Auth._u?.name||Auth._cur||'admin';
  const reactions=m.reactions||{};
  const body='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px">'
    +EMOJIS.map(e=>{
      const cnt=(reactions[e]||[]).length;
      const mine=(reactions[e]||[]).includes(me);
      return '<button class="btn" style="font-size:22px;padding:10px;'
        +(mine?'background:var(--bg2);border:2px solid var(--pri)':'')
        +'" onclick="Pages._mentionReact('+id+',&quot;'+e+'&quot;);Modal.close();Pages.mentions()">'+e
        +(cnt?'<div style="font-size:10px;color:var(--tm)">'+cnt+'</div>':'')+'</button>';
    }).join('')
    +'</div>';
  Modal.open({title:'반응 선택',size:'msm',body});
},

/* [v2.327 PhaseB] 스레드 답글 — SB 연동 */
_mentionReplyView(id){
  /* [v2.327] 멘션 상세팝업 — renderBody 제거, 단순 문자열 직접 구성 */
  const m=DB.mentions.find(mn=>mn.id===id);
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','warn');return;}
  /* 자동 읽음 */
  const me=Auth._cur||'admin';
  if(!m.read&&(m.to===me||(m.to_list||[]).includes(me)||Auth._u?.role==='admin')){
    SB.updateMention(id,{read:true}).then(()=>{m.read=true;TopNav.updateMentionBadge();});
  }
  /* 답글 목록 */
  const threads=(DB.mentions||[]).filter(mn=>mn.thread_id===id)
    .sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));
  const localReplies=m.replies||[];
  const allReplies=[...threads,...localReplies.filter(r=>!threads.find(t=>t.id===r.id))];
  /* 배지 */
  const PRIO_CLS={urgent:'bred',normal:'bamb',low:'bgh'};
  const PRIO_LBL={urgent:'🔴 긴급',normal:'🟡 일반',low:'⚪ 낮음'};
  const STAT_CLS={open:'bamb',in_progress:'bpri',done:'bgrn'};
  const STAT_LBL={open:'열림',in_progress:'진행중',done:'완료'};
  const TYPE_LBL={mention:'💬 멘션',task:'📋 태스크',notice:'📢 공지',approval:'✅ 승인요청'};
  /* 답글 HTML */
  const replyHtml=allReplies.length
    ?allReplies.map(r=>{
      const dt2=(r.created_at||r.time||'').replace('T',' ').slice(0,16);
      const isMeR=(r.from===me);
      return '<div style="display:flex;gap:8px;padding:8px 4px;border-bottom:1px solid var(--bd)">'
        +'<div style="width:28px;height:28px;border-radius:50%;background:'+(isMeR?'var(--pri)':'var(--bd)')+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:'+(isMeR?'#fff':'var(--tm)')+';flex-shrink:0">'+(r.from||'?')[0]+'</div>'
        +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
        +'<span style="font-size:11px;font-weight:700">'+H.e(r.from||'?')+'</span>'
        +'<span style="font-size:10px;color:var(--tm)">'+dt2+'</span>'
        +'</div>'
        +'<div style="font-size:13px;line-height:1.5;word-break:break-all">'+H.e(r.text||r.message||'')+'</div>'
        +'</div></div>';
    }).join('')
    :'<div style="text-align:center;padding:20px;color:var(--tm);font-size:12px">💬 아직 답글이 없습니다.</div>';
  /* 상태 변경 버튼 */
  const statusBar=m.status!=='done'
    ?'<button class="btn bgrn bsm" style="font-size:11px" onclick="Pages._mentionStatus('+id+',&quot;done&quot;);Pages._mentionReplyView('+id+')">✅ 완료처리</button>'
    :'<button class="btn bout bsm" style="font-size:11px" onclick="Pages._mentionStatus('+id+',&quot;open&quot;);Pages._mentionReplyView('+id+')">↩ 재열기</button>';
  /* 업무연결 바로가기 */
  const linkBtn=m.link_type&&m.link_id
    ?'<button class="btn bgh bsm" style="font-size:11px;margin-top:6px" onclick="Pages._mentionLinkGo(&quot;'+H.e(m.link_type)+'&quot;,&quot;'+H.e(m.link_id)+'&quot;)">🔗 '+H.e(m.link_id)+' 바로가기</button>'
    :'';
  /* 전체 body */
  const body=
    '<div style="background:var(--bg2);border-radius:8px;padding:12px;margin-bottom:12px">'
    /* 메타 배지 */
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'
    +'<span style="font-size:11px;color:var(--tm)">'+(TYPE_LBL[m.type||'mention']||'💬')+'</span>'
    +'<span class="badge '+(PRIO_CLS[m.priority||'normal']||'bamb')+'" style="font-size:10px">'+(PRIO_LBL[m.priority||'normal'])+'</span>'
    +'<span class="badge '+(STAT_CLS[m.status||'open']||'bamb')+'" style="font-size:10px">'+(STAT_LBL[m.status||'open'])+'</span>'
    +(m.channel?'<span style="font-size:10px;background:#f1f5f9;color:#475569;border-radius:3px;padding:1px 6px">#'+H.e(m.channel)+'</span>':'')
    +'</div>'
    /* 발신→수신 */
    +'<div style="font-size:12px;font-weight:700;margin-bottom:6px">'
    +H.e(m.from||'?')+'<span style="font-weight:400;color:var(--tm)"> → '+H.e((m.to_list||[m.to]).join(', '))+'</span>'
    +(m.due_date?'<span style="float:right;font-size:11px;color:var(--tm)">📅 마감: '+m.due_date+'</span>':'')
    +'</div>'
    /* 원본 내용 */
    +'<div style="font-size:13px;line-height:1.6;word-break:break-all;white-space:pre-wrap">'+H.e(m.text||'')+'</div>'
    +(linkBtn?'<div>'+linkBtn+'</div>':'')
    +(m.file_url?'<div style="margin-top:6px"><a href="'+H.e(m.file_url)+'" target="_blank" class="btn bxs" style="font-size:11px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac">📎 첨부파일</a></div>':'')
    +'</div>'
    /* 상태 변경 */
    +'<div style="display:flex;gap:6px;margin-bottom:10px">'+statusBar+'</div>'
    /* 답글 목록 */
    +'<div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:6px">답글 '+allReplies.length+'개</div>'
    +'<div id="replyList" style="max-height:220px;overflow-y:auto;margin-bottom:12px;border:1px solid var(--bd);border-radius:6px">'+replyHtml+'</div>'
    /* 답글 입력창 */
    +'<div style="display:flex;gap:8px;align-items:flex-start">'
    +'<textarea class="fc" id="rtext" rows="2" placeholder="답글 입력... (Enter:전송, Shift+Enter:줄바꿈)" style="flex:1;font-size:12px;resize:none;line-height:1.5"></textarea>'
    +'<div style="display:flex;flex-direction:column;gap:4px">'
    +'<button class="btn bpri bsm" onclick="Pages._mentionReplySend('+id+')" style="white-space:nowrap">📤 전송</button>'
    +'<button class="btn bout bsm" onclick="Modal.close()" style="white-space:nowrap">닫기</button>'
    +'</div></div>';
  Modal.open({title:'💬 '+H.e(m.from||'')+'의 멘션',size:'mmd',body,foot:''});
  /* Enter 단축키 바인딩 — innerHTML 삽입 후 addEventListener 방식 (따옴표 충돌 방지) */
  setTimeout(()=>{
    const rtEl=document.getElementById('rtext');
    if(rtEl){
      rtEl.focus();
      rtEl.addEventListener('keydown',function(ev){
        if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();Pages._mentionReplySend(id);}
      });
    }
    const rl=document.getElementById('replyList');
    if(rl) rl.scrollTop=rl.scrollHeight;
  },80);
},
/* 멘션 수정 */
_mentionEdit(id){
  this._mentionWrite(id);
},

/* [v2.327 PhaseA] 멘션 삭제 */
async _mentionDel(id){
  const isAdmin=(Auth._u?.role==='admin');
  const m=DB.mentions.find(m=>m.id===id);
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return}
  const me=Auth._cur||'admin';
  const isMine=(m.from===me)||(me==='admin'&&m.from==='관리자');
  if(!isAdmin&&!isMine){Toast.show('삭제 권한이 없습니다.','err');return}
  Modal.confirm({title:'멘션 삭제',msg:'이 멘션을 삭제하시겠습니까?',danger:true,onOk:async()=>{
    const res=await SB.deleteMention(id);
    if(!res.ok) return;
    DB.mentions=DB.mentions.filter(m=>m.id!==id);
    Toast.show('삭제되었습니다.','ok');
    Pages.mentions();
  }});
},
/* [v2.327 PhaseC] 멘션 → 태스크 격상 */
async _mentionToTask(id){
  const m=DB.mentions.find(m=>m.id===id);
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return;}
  if(m.type==='task'){Toast.show('이미 태스크로 지정되어 있습니다.','warn');return;}
  /* 마감일 입력 팝업 */
  Modal.open({title:'📋 태스크로 격상',size:'msm',
    body:'<div class="fg2">'
      +'<div style="background:var(--bg2);border-radius:6px;padding:10px;margin-bottom:10px;font-size:12px">'+H.e((m.text||'').slice(0,80))+'</div>'
      +'<div class="fgroup"><label class="fl">마감일 <span style="color:#ef4444">*</span></label>'
      +'<input class="fc" type="date" id="taskDue" value="'+(m.due_date||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">우선순위</label>'
      +'<select class="fc" id="taskPrio">'
      +'<option value="urgent"'+(m.priority==='urgent'?' selected':'')+'>🔴 긴급</option>'
      +'<option value="normal"'+(m.priority==='normal'||!m.priority?' selected':'')+'>🟡 일반</option>'
      +'<option value="low"'+(m.priority==='low'?' selected':'')+'>⚪ 낮음</option>'
      +'</select></div>'
      +'</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" onclick="Pages._mentionToTaskSave('+id+')">📋 태스크로 격상</button>',
  });
},
async _mentionToTaskSave(id){
  const due=document.getElementById('taskDue')?.value;
  if(!due){Toast.show('마감일을 입력하세요.','warn');return;}
  const prio=document.getElementById('taskPrio')?.value||'normal';
  const res=await SB.updateMention(id,{type:'task',priority:prio,due_date:due,status:'open'});
  if(!res.ok) return;
  const m=DB.mentions.find(m=>m.id===id);
  if(m){m.type='task';m.priority=prio;m.due_date=due;}
  Modal.close();
  Toast.show('태스크로 격상되었습니다.','ok');
  Pages.mentions();
},

/* [v2.327 PhaseC] 미응답 팔로우업 — 3일 경과 미처리 알림 */
_mentionFollowUp(){
  const me=Auth._cur||'admin';
  const isAdmin=Auth._u?.role==='admin';
  const now=new Date();
  /* 3일 이상 경과한 미완료 멘션 (내가 보낸 것) */
  const followUps=DB.mentions.filter(m=>{
    if(m.status==='done') return false;
    if(m.from!==Auth._u?.name&&m.from!==me) return false;
    const created=new Date(m.created_at||'');
    const elapsed=Math.floor((now-created)/(864e5));
    return elapsed>=3;
  }).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));
  if(!followUps.length){
    Toast.show('미응답 팔로우업 대상이 없습니다.','info');
    return;
  }
  const body='<div style="margin-bottom:10px;font-size:12px;color:var(--tm)">'
    +'총 '+followUps.length+'건의 미응답 멘션이 있습니다. 팔로우업 알림을 전송하시겠습니까?'
    +'</div>'
    +'<div style="max-height:240px;overflow-y:auto">'
    +followUps.slice(0,8).map(m=>{
      const days=Math.floor((now-new Date(m.created_at||''))/(864e5));
      return '<div style="padding:6px 8px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between">'
        +'<div style="font-size:12px">'+H.e((m.text||'').slice(0,40))+'</div>'
        +'<span class="badge '+(days>=7?'bred':'bamb')+'" style="font-size:10px">'+days+'일 경과</span>'
        +'</div>';
    }).join('')
    +(followUps.length>8?'<div style="text-align:center;font-size:11px;color:var(--tm);padding:6px">외 '+(followUps.length-8)+'건</div>':'')
    +'</div>';
  Modal.open({title:'🔄 팔로우업 알림',size:'mmd',body,
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" onclick="Pages._mentionFollowUpSend()">📤 팔로우업 전송</button>',
  });
  /* 대상 목록 저장 */
  Pages._followUpList=followUps;
},
async _mentionFollowUpSend(){
  const list=Pages._followUpList||[];
  if(!list.length) return;
  const me=Auth._u?.name||Auth._cur||'admin';
  const meUser=DB.users.find(u=>u.username===(Auth._cur||'admin'))||{name:'관리자',dept:''};
  let ok=0;
  for(const m of list){
    const fu={
      from:      meUser.name||me,
      dept:      meUser.dept||'',
      to:        m.to,
      to_list:   m.to_list||[m.to],
      text:      '[팔로우업] '+m.text.slice(0,60)+(m.text.length>60?'...':''),
      channel:   m.channel||'general',
      type:      'mention',
      priority:  'urgent',
      status:    'open',
      thread_id: m.id,
      reply_to:  m.id,
      ref:       m.ref||'',
      read:      false,
      created_at:new Date().toISOString(),
    };
    const res=await SB.addMention(fu);
    if(res.ok) ok++;
  }
  Modal.close();
  Toast.show(ok+'건 팔로우업 알림 전송 완료','ok');
  Pages.mentions();
},

/* [v2.327 PhaseC] 멘션 통계 대시보드 */
_mentionStats(){
  const all=DB.mentions||[];
  if(!all.length){Toast.show('멘션 데이터가 없습니다.','info');return;}
  /* 채널별 집계 */
  const byCh={};
  all.forEach(m=>{
    const ch=m.channel||'general';
    if(!byCh[ch]) byCh[ch]={total:0,done:0,urgent:0};
    byCh[ch].total++;
    if(m.status==='done') byCh[ch].done++;
    if(m.priority==='urgent') byCh[ch].urgent++;
  });
  const CH_LABEL={general:'일반',reference:'기준정보',quality:'품질관리',
    inspection:'검사고도화',supplier:'공급업체',calibration:'계측기',
    spc:'SPC통계',improvement:'개선활동',document:'문서관리'};
  const maxV=Math.max(...Object.values(byCh).map(v=>v.total),1);
  const bars=Object.entries(byCh).sort((a,b)=>b[1].total-a[1].total).map(([ch,v])=>{
    const pct=Math.round((v.total/maxV)*100);
    const donePct=v.total?Math.round((v.done/v.total)*100):0;
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
      +'<div style="width:72px;font-size:10px;color:var(--tm);text-align:right">'+H.e(CH_LABEL[ch]||ch)+'</div>'
      +'<div style="flex:1;position:relative;height:22px;background:var(--bd);border-radius:4px;overflow:hidden">'
      +'<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#6366f1,#818cf8);border-radius:4px"></div>'
      +'<span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;color:'+(pct>50?'#fff':'var(--tx)')+'">'+v.total+'건</span>'
      +'</div>'
      +'<span style="font-size:10px;color:#22c55e;width:36px">'+donePct+'%</span>'
      +(v.urgent?'<span class="badge bred" style="font-size:9px">긴급'+v.urgent+'</span>':'')
      +'</div>';
  }).join('');

  /* 유형별 */
  const byType={};
  all.forEach(m=>{byType[m.type||'mention']=(byType[m.type||'mention']||0)+1;});
  const typeHtml=Object.entries(byType).map(([t,n])=>
    '<div style="text-align:center;padding:10px;background:var(--bg2);border-radius:8px">'
    +'<div style="font-size:20px;margin-bottom:4px">'+(t==='task'?'📋':t==='notice'?'📢':t==='approval'?'✅':'💬')+'</div>'
    +'<div style="font-size:14px;font-weight:700">'+n+'</div>'
    +'<div style="font-size:10px;color:var(--tm)">'+(t==='task'?'태스크':t==='notice'?'공지':t==='approval'?'승인요청':'멘션')+'</div>'
    +'</div>'
  ).join('');

  const done=all.filter(m=>m.status==='done').length;
  const open=all.filter(m=>m.status==='open').length;
  const unread=all.filter(m=>!m.read).length;

  const body=
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">'
    +'<div style="text-align:center;padding:10px;background:#f0fdf4;border-radius:8px"><div style="font-size:20px;font-weight:700;color:#16a34a">'+done+'</div><div style="font-size:11px;color:var(--tm)">완료</div></div>'
    +'<div style="text-align:center;padding:10px;background:#fef3c7;border-radius:8px"><div style="font-size:20px;font-weight:700;color:#d97706">'+open+'</div><div style="font-size:11px;color:var(--tm)">처리중</div></div>'
    +'<div style="text-align:center;padding:10px;background:#fee2e2;border-radius:8px"><div style="font-size:20px;font-weight:700;color:#dc2626">'+unread+'</div><div style="font-size:11px;color:var(--tm)">미읽음</div></div>'
    +'</div>'
    +'<div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:6px">채널별 현황 (완료율)</div>'
    +bars
    +'<div style="font-size:11px;font-weight:600;color:var(--tm);margin:12px 0 6px">유형별</div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">'+typeHtml+'</div>';
  Modal.open({title:'📊 멘션 통계',size:'mlg',body});
},



/* ── 설정 ── */
settings(){
  const w=document.getElementById('pw');
  const isAdmin=Auth._u?.role==='admin';
  const notices=App.notices;

  /* [v2.23] 3-A: 탭 구조 (기존 설정 + 사용자 관리)
     사용자 관리 탭은 관리자만 활성화 */
  /* [v2.327] renderTab — sbdash 전용 처리 포함 */
  const renderTab=(tab)=>{
    document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
    document.querySelectorAll('.stab-pane').forEach(p=>p.style.display=p.dataset.tab===tab?'block':'none');
    /* SB 대시보드 탭 전환 시 즉시 렌더 */
    if(tab==='sbdash'){
      const el=document.getElementById('sbDashContainer');
      if(el&&el.innerHTML.includes('로딩 중')) Pages._renderSbDash();
    }
  };

  /* ── 메뉴별 접근 권한 정의 ── */
  const MENU_GROUPS=[
    {group:'기준정보', pages:[
      {page:'items',    label:'품목 등록'},
      {page:'vendors',  label:'거래처 등록'},
      {page:'users',    label:'사용자 등록'},
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
  /* [v2.28] 권한별 배지 색상 */
  const ROLE_COLOR={admin:'background:#7c3aed;color:#fff',manager:'background:#2563eb;color:#fff',user:'background:#16a34a;color:#fff',viewer:'background:#64748b;color:#fff'};
  /* 기본 권한: admin은 전체, manager는 대부분, user/viewer는 제한 */
  const DEFAULT_PERM={admin:true,manager:true,user:true,viewer:false};
  const App_perms=App.perms=App.perms||{};

  const permKey=(page,role)=>`${page}_${role}`;
  const getPerm=(page,role)=>App_perms[permKey(page,role)]??DEFAULT_PERM[role]??false;
  const setPerm=(page,role,val)=>{App_perms[permKey(page,role)]=val;};

  /* 사용자 목록 테이블 렌더 */
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
        </tr></thead>
        <tbody>${activeUsers.length===0
          ?'<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--tm)">등록된 사용자가 없습니다.</td></tr>'
          :activeUsers.map(u=>{
            no++;
            const roleOpts=ROLES.map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLE_LABEL[r]+'</option>').join('');
            return '<tr>'
              +'<td><input type="checkbox" class="umgmt-chk" value="'+u.id+'"></td>'
              +'<td style="text-align:center;color:var(--tm)">'+no+'</td>'
              +'<td><strong style="cursor:pointer;color:var(--pri)" title="클릭하여 수정" onclick="Pages._uFormById('+u.id+')">'+H.e(u.name||u.username)+'</strong></td>'
              +'<td style="color:var(--tm)">'+H.e(u.username)+'</td>'
              +'<td>'+H.e(u.department||'-')+'</td>'
              +'<td style="font-size:11px">'+H.e(u.tel||u.phone||'-')+'</td>'
              +'<td style="font-size:11px">'+(u.email?'<a href="mailto:'+H.e(u.email)+'" style="color:var(--acc)">'+H.e(u.email)+'</a>':'-')+'</td>'
              +'<td style="white-space:nowrap">'
              +'<span class="badge" style="'+ROLE_COLOR[u.role||'user']+';font-size:10px;margin-right:3px">'+ROLE_LABEL[u.role||'user']+'</span>'
              +'<select class="fsel" style="font-size:10px;padding:1px 2px" onchange="Pages._setUserRole('+u.id+',&#39;'+H.e(u.username)+'&#39;,this.value)">'+roleOpts+'</select>'
              +'</td>'
              +'<td><span class="badge '+(u.active?'bgrn':'bgry')+'" style="cursor:pointer" title="클릭하여 상태 변경" onclick="Pages._uStatusPopup('+u.id+',\''+H.e(u.name||u.username)+'\')">'+(u.active?'활성':'비활성')+'</span></td>'
              +'<td style="font-size:11px;color:var(--tm)">'+H.e(u.created_at||'-')+'</td>'
              +'<td style="font-size:11px;color:var(--tm)">'+(u.updated_at?H.e(u.updated_at):'')+'</td>'
              +'<td style="font-size:11px;color:var(--tm)">'+(u.last_login?H.e(u.last_login):'')+'</td>'
              +'<td><button class="btn bsm bamb" onclick="Pages._uResetPw('+u.id+',&#39;'+H.e(u.username)+'&#39;)">🔑 초기화</button></td>'
              +'</tr>';
          }).join('')}
        </tbody>
      </table>
    <!-- [v2.327] 권한 정의 각주 -->`;
  };

  /* 접근 권한 테이블 렌더 */
  const renderPermTable=()=>{
    return`<div class="card">
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
      </table>
    <!-- [v2.327] 권한 정의 각주 -->
    <div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid var(--bd);border-radius:6px;font-size:11px">
      <div style="font-weight:700;color:var(--tm);margin-bottom:6px">📌 권한 정의</div>
      <div style="display:grid;grid-template-columns:80px 1fr;gap:4px 10px;line-height:1.6">
        <span style="font-weight:600;color:#7c3aed">🟣 관리자</span>
        <span>모든 메뉴 접근 및 수정 가능. 사용자 등록·승인·권한 관리. 시스템 설정 전체 관리.</span>
        <span style="font-weight:600;color:#2563eb">🔵 매니저</span>
        <span>담당 메뉴 조회·입력·수정 가능. 삭제 및 사용자 관리 제한. 주요 업무 담당자.</span>
        <span style="font-weight:600;color:#059669">🟢 사용자</span>
        <span>허용된 메뉴 조회·입력 가능. 수정·삭제 제한. 일반 업무 참여자.</span>
        <span style="font-weight:600;color:#64748b">⚪ 뷰어</span>
        <span>허용된 메뉴 조회만 가능. 입력·수정·삭제 불가. 열람 전용.</span>
      </div>
      <div style="margin-top:6px;color:var(--tl);font-size:10px">※ 권한 변경은 즉시 반영되며, 재로그인 시 확정됩니다. 체크박스 설정 후 반드시 [저장] 버튼을 클릭하세요.</div>
    </div>
    </div>`;
  };

  w.innerHTML=`<div class="ph"><div><div class="ptit">⚙️ 설정</div></div></div>
  <!-- 탭 버튼 -->
  <div style="display:flex;gap:6px;margin-bottom:16px">
    <button class="btn stab-btn on" data-tab="general" onclick="renderTab('general')" style="border-radius:8px">⚙️ 일반 설정</button>
    <button class="btn stab-btn ${isAdmin?'':'bout'}" data-tab="usermgmt"
      onclick="${isAdmin?"renderTab('usermgmt')":`Toast.show('관리자만 접근 가능합니다.','warn')`}"
      style="border-radius:8px;${isAdmin?'':'opacity:.5;cursor:not-allowed'}"
      title="${isAdmin?'사용자 등록':'관리자만 접근 가능'}">👥 사용자 등록${isAdmin?'':' 🔒'}</button>
  </div>

  <!-- 일반 설정 탭 -->
  <div class="stab-pane" data-tab="general" style="display:block">
  <!-- ① 공지사항 관리 (메인) -->
  <div class="card" style="margin-bottom:14px">
    <div class="ch" style="padding-bottom:10px">
      <div class="ct">📢 공지사항 관리</div>
      <button class="btn bpri bsm" onclick="Pages._addNotice()">+ 공지 추가</button>
    </div>
    <div class="ts">
      <table class="dt" style="font-size:12px">
        <thead><tr>
          <th style="width:28px"><input type="checkbox" id="noticeAllChk"
            onchange="document.querySelectorAll('.notice-chk').forEach(c=>c.checked=this.checked)"></th>
          <th style="width:36px">No</th>
          <th>제목</th>
          <th style="min-width:140px">내용</th>
          <th style="width:92px">게시 시작일</th>
          <th style="width:92px">게시 종료일</th>
          <th style="width:72px;text-align:center">게시 여부</th>
          <th style="width:56px;text-align:center">파일</th>
          <th style="width:88px;text-align:center">관리</th>
        </tr></thead>
        <tbody>${notices.length===0
          ?'<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--tm)">등록된 공지사항이 없습니다.</td></tr>'
          :notices.map((n,i)=>{
            const today=H.today();
            const active=n.show&&(!n.expire||n.expire>=today)&&(!n.date||n.date<=today);
            const expiredCls=n.expire&&n.expire<today?"color:#ef4444":"";
            return '<tr>'
              +'<td><input type="checkbox" class="notice-chk" value="'+i+'"></td>'
              +'<td style="text-align:center;color:var(--tm)">'+(i+1)+'</td>'
              +'<td style="font-weight:600;cursor:pointer" onclick="Pages._editNotice('+i+')">'+H.e(n.title)+'</td>'
              +'<td style="color:var(--tm);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+H.e(n.body||"-")+'</td>'
              +'<td style="font-size:11px">'+(n.date||"-")+'</td>'
              +'<td style="font-size:11px;'+expiredCls+'">'+(n.expire||"-")+'</td>'
              +'<td style="text-align:center"><input type="checkbox" '+(n.show?"checked":"")+' onchange="App.notices['+i+'].show=this.checked;Pages.settings()"></td>'
              +'<td style="text-align:center">'+(n.file?'<span title="'+H.e(n.file.name||"")+'">📎</span>':'<span style="color:var(--tl)">없음</span>')+'</td>'
              +'<td style="text-align:center;white-space:nowrap">'
              +'<button class="btn bxs bgh" onclick="Pages._editNotice('+i+')">수정</button> '
              +'<button class="btn bxs berr" onclick="Cfg.noticeDel('+i+')">삭제</button>'
              +'</td></tr>';
          }).join("")}
        </tbody>
      </table>
    </div>
  </div>
  <!-- ② 하단: 로고 + 비밀번호 2열 소형 -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <!-- 회사 로고 -->
    <div class="card">
      <div class="ch" style="padding-bottom:8px"><div class="ct" style="font-size:12px">🖼️ 회사 로고</div></div>
      <div id="logoPreview" style="height:48px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border:1px dashed var(--bd);border-radius:6px;background:var(--bg)">
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
    <!-- 비밀번호 변경 -->
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

    <!-- [v2.327] Supabase 대시보드 (별도 카드, 상하 여백 명확) -->
    <div class="card" style="margin-top:14px">
      <div class="ch">
        <div class="ct">🔌 Supabase 대시보드</div>
        <button class="btn bsm bout" onclick="Pages._renderSbDash()">🔄 조회</button>
      </div>
      <div id="sbDashContainer">
        <div style="text-align:center;padding:24px;color:var(--tm);font-size:12px">
          위 [🔄 조회] 버튼을 클릭하면 Supabase 사용량과 테이블 현황을 표시합니다.
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
`;


  /* renderTab을 전역으로 등록 */
  window.renderTab=renderTab;
},
/* [v2.327] 시스템 → 사용자 등록 — 개인정보 및 권한 관리 */
async sysusers(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  /* 최신 데이터 로드 */
  const fresh=await SB.getUsers();
  if(fresh) DB.users=fresh;
  /* settings의 usermgmt 탭 내용을 독립 페이지로 표시 */
  w.innerHTML=`<div class="ph">
    <div><div class="ptit">👤 사용자 등록 / 권한 관리</div></div>
    <div class="pac">
      <button class="btn bpri btn-f2" onclick="Pages._addUser()">+ 사용자 등록 <span class="kbd">F2</span></button>
    </div>
  </div>
  <div id="sysUserBody"></div>`;
  /* renderUserMgmt 재활용 */
  const rumFn=Pages._getRenderUserMgmt?.();
  if(typeof renderUserMgmt==='function'){
    document.getElementById('sysUserBody').innerHTML=renderUserMgmt();
  } else {
    /* fallback: settings usermgmt 탭 내용 직접 렌더 */
    Pages._renderSysUsers();
  }
},

_renderSysUsers(){
  /* [v2.327] 사용자 등록/권한 관리 독립 렌더 */
  const el=document.getElementById('sysUserBody');
  if(!el) return;
  const ROLE_LABEL={admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'};
  const ROLE_COLOR={admin:'background:#7c3aed;color:#fff',manager:'background:#2563eb;color:#fff',
    user:'background:#059669;color:#fff',viewer:'background:#64748b;color:#fff'};
  const all=DB.users||[];
  const pending=all.filter(u=>u.pending);
  const active=all.filter(u=>!u.pending);
  el.innerHTML=
    (pending.length?
      '<div class="card" style="margin-bottom:12px;border-left:3px solid var(--warn)">'
      +'<div class="ch"><div class="ct">⏳ 승인 대기 ('+pending.length+'명)</div></div>'
      +'<div style="display:flex;flex-direction:column;gap:6px">'
      +pending.map(u=>'<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg2);border-radius:6px">'
        +'<span style="font-weight:600">'+H.e(u.name||u.username)+'</span>'
        +'<span style="color:var(--tm);font-size:11px">'+H.e(u.dept||'')+'</span>'
        +'<div style="margin-left:auto;display:flex;gap:6px">'
        +'<button class="btn bsm bgrn" onclick="Pages._approveUser('+u.id+',&quot;'+H.e(u.username)+'&quot;)">✅ 승인</button>'
        +'<button class="btn bsm berr" onclick="Pages._rejectUser('+u.id+',&quot;'+H.e(u.username)+'&quot;)">❌ 거부</button>'
        +'</div></div>').join('')
      +'</div></div>':'')
    +'<div class="card">'
    +'<div class="ch"><div class="ct">👥 사용자 목록 ('+active.length+'명)</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn bsm" onclick="Pages._renderSysUsers()">🔄 새로고침</button>'
    +'</div></div>'
    +'<table style="width:100%;min-width:700px;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--bg2)">'
    +'<th style="padding:8px;text-align:left">이름</th>'
    +'<th style="padding:8px;text-align:left">아이디</th>'
    +'<th style="padding:8px;text-align:left">부서</th>'
    +'<th style="padding:8px;text-align:center">권한</th>'
    +'<th style="padding:8px;text-align:center">상태</th>'
    +'<th style="padding:8px;text-align:center">최근로그인</th>'
    +'<th style="padding:8px;text-align:center">관리</th>'
    +'</tr></thead>'
    +'<tbody>'
    +active.map(u=>'<tr style="border-bottom:1px solid var(--bd)">'
      +'<td style="padding:8px;font-weight:600">'+H.e(u.name||u.username)+'</td>'
      +'<td style="padding:8px;color:var(--tm);font-family:monospace">'+H.e(u.username)+'</td>'
      +'<td style="padding:8px">'+H.e(u.dept||'-')+'</td>'
      +'<td style="padding:8px;text-align:center">'
      +'<select class="fsel" style="font-size:10px;padding:2px 4px" onchange="Pages._setUserRole('+u.id+',&quot;'+H.e(u.username)+'&quot;,this.value)">'
      +['admin','manager','user','viewer'].map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLE_LABEL[r]+'</option>').join('')
      +'</select></td>'
      +'<td style="padding:8px;text-align:center"><span class="badge '+(u.active!==0?'bgrn':'bred')+'" style="font-size:10px">'+(u.active!==0?'활성':'비활성')+'</span></td>'
      +'<td style="padding:8px;text-align:center;font-size:11px;color:var(--tm)">'+(u.last_login||'-')+'</td>'
      +'<td style="padding:8px;text-align:center;white-space:nowrap">'
      +'<button class="btn bxs bgh" onclick="Pages._profileEdit('+JSON.stringify(u).replace(/"/g,'&quot;')+')" style="font-size:10px">수정</button> '
      +'<button class="btn bxs berr" onclick="Pages._deactivateUser('+u.id+')" style="font-size:10px">비활성</button>'
      +'</td></tr>').join('')
    +'</tbody></table>'
    +'</div>'
    /* 권한 정의 각주 */
    +'<div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid var(--bd);border-radius:6px;font-size:11px">'
    +'<div style="font-weight:700;color:var(--tm);margin-bottom:6px">📌 권한 정의</div>'
    +'<div style="display:grid;grid-template-columns:80px 1fr;gap:4px 10px;line-height:1.6">'
    +'<span style="font-weight:600;color:#7c3aed">🟣 관리자</span><span>모든 메뉴 접근·수정 가능. 사용자 등록·승인·권한 관리. 시스템 설정 전체 관리.</span>'
    +'<span style="font-weight:600;color:#2563eb">🔵 매니저</span><span>담당 메뉴 조회·입력·수정 가능. 삭제 및 사용자 관리 제한.</span>'
    +'<span style="font-weight:600;color:#059669">🟢 사용자</span><span>허용된 메뉴 조회·입력 가능. 수정·삭제 제한.</span>'
    +'<span style="font-weight:600;color:#64748b">⚪ 뷰어</span><span>허용된 메뉴 조회만 가능. 입력·수정·삭제 불가.</span>'
    +'</div>'
    +'<div style="margin-top:6px;color:var(--tl);font-size:10px">※ 권한 변경은 즉시 반영됩니다.</div>'
    +'</div>';
},

/* [v2.327] SB 대시보드 — 사용량 + 비활성 방지 */
async _renderSbDash(){
  /* [v2.327] SB 대시보드 — 전체 테이블 누락 없이 */
  const el=document.getElementById('sbDashContainer');
  if(!el){ Toast.show('설정 > 일반설정 탭을 먼저 열어주세요.','warn'); return; }
  el.innerHTML='<div style="text-align:center;padding:32px;font-size:13px;color:var(--tm)">🔄 데이터 조회 중...</div>';

  /* ── 전체 테이블 목록 (누락 없이) ── */
  const tables=[
    {key:'equipment',        label:'계측기',          group:'계측기관리'},
    {key:'calibrations',     label:'교정이력',         group:'계측기관리'},
    {key:'equipment_logs',   label:'계측기변경이력',    group:'계측기관리'},
    {key:'inspections',      label:'검사(5종)',         group:'검사관리'},
    {key:'items',            label:'품목',             group:'기준정보'},
    {key:'vendors',          label:'거래처',           group:'기준정보'},
    {key:'users',            label:'사용자',           group:'시스템'},
    {key:'mentions',         label:'멘션',             group:'협업'},
    {key:'nonconformances',  label:'부적합',           group:'품질관리'},
    {key:'corrective_actions',label:'시정조치(CAR)',   group:'품질관리'},
    {key:'documents',        label:'문서',             group:'문서관리'},
  ];
  const AVG={equipment:800,calibrations:500,equipment_logs:300,inspections:600,
    items:300,vendors:350,users:400,mentions:600,
    nonconformances:1000,corrective_actions:800,documents:500};

  let counts={}, totalRows=0, estBytes=0;
  if(typeof _sb!=='undefined'&&_sb){
    await Promise.all(tables.map(async t=>{
      try{
        const {count,error}=await _sb.from(t.key).select('*',{count:'exact',head:true});
        counts[t.key]=error?0:(count||0);
      }catch(e){counts[t.key]=0;}
      totalRows+=counts[t.key]||0;
      estBytes+=(counts[t.key]||0)*(AVG[t.key]||400);
    }));
  }

  const DB_MAX=500;
  const DB_USED=Math.max(0.1,Math.round(estBytes/(1024*1024)*10)/10);
  const DB_PCT=Math.min(Math.round((DB_USED/DB_MAX)*100),100);
  const lastPing=localStorage.getItem('qms_keepalive')||'없음';
  const daysLeft=lastPing==='없음'?7:Math.max(0,7-Math.floor((new Date()-new Date(lastPing))/(864e5)));
  const aliveColor=daysLeft<=1?'#ef4444':daysLeft<=3?'#f59e0b':'#22c55e';

  /* 도넛 SVG */
  const donut=(pct,color,val,sub)=>{
    const R=40,circ=2*Math.PI*R,dash=(pct/100)*circ,gap=circ-dash;
    return '<svg width="110" height="110" viewBox="0 0 120 120">'
      +'<circle cx="60" cy="60" r="40" fill="none" stroke="#e2e8f0" stroke-width="14"/>'
      +'<circle cx="60" cy="60" r="40" fill="none" stroke="'+color+'" stroke-width="14"'
      +' stroke-dasharray="'+dash.toFixed(1)+' '+gap.toFixed(1)+'"'
      +' stroke-linecap="round" transform="rotate(-90 60 60)"/>'
      +'<text x="60" y="54" text-anchor="middle" font-size="13" font-weight="700" fill="#1e293b">'+val+'</text>'
      +'<text x="60" y="70" text-anchor="middle" font-size="9" fill="#64748b">'+sub+'</text>'
      +'<text x="60" y="84" text-anchor="middle" font-size="9" fill="'+color+'" font-weight="600">'+pct+'%</text>'
      +'</svg>';
  };

  /* 그룹별 소계 */
  const groups={};
  tables.forEach(t=>{
    if(!groups[t.group]) groups[t.group]={rows:0,bytes:0};
    groups[t.group].rows+=counts[t.key]||0;
    groups[t.group].bytes+=(counts[t.key]||0)*(AVG[t.key]||400);
  });

  el.innerHTML=
    /* 헤더 */
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<span style="font-size:12px;color:'+(typeof _sb!=='undefined'&&_sb?'#22c55e':'#ef4444')+';font-weight:700">'
    +(typeof _sb!=='undefined'&&_sb?'● SB 연결됨':'● 미연결')+'</span>'
    +'<button class="btn bsm bout" onclick="Pages._renderSbDash()">🔄 새로고침</button>'
    +'</div>'
    /* 도넛 차트 */
    +'<div class="card" style="margin-bottom:12px">'
    +'<div class="ch"><div class="ct">📊 사용량 현황</div></div>'
    +'<div style="display:flex;justify-content:space-around;padding:6px 0">'
    +'<div style="text-align:center"><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">DB 사용량</div>'
    +donut(DB_PCT,DB_PCT>80?'#ef4444':DB_PCT>50?'#f59e0b':'#3b82f6',DB_USED+'MB','/'+DB_MAX+'MB')+'</div>'
    +'<div style="text-align:center"><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">전체 행</div>'
    +donut(Math.min(100,Math.round(totalRows/500)),'#8b5cf6',totalRows,'rows')+'</div>'
    +'<div style="text-align:center"><div style="font-size:11px;font-weight:600;color:var(--tm);margin-bottom:4px">비활성 방지</div>'
    +donut(Math.min(100,Math.round((daysLeft/7)*100)),aliveColor,daysLeft+'일','/ 7일')+'</div>'
    +'</div></div>'
    /* 테이블별 현황 */
    +'<div class="card" style="margin-bottom:12px">'
    +'<div class="ch"><div class="ct">📋 테이블별 현황</div>'
    +'<span style="font-size:11px;color:var(--tm)">총 '+totalRows.toLocaleString()+'행 / 약 '+DB_USED+'MB</span>'
    +'</div>'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--bg2)">'
    +'<th style="padding:5px 8px;text-align:left">그룹</th>'
    +'<th style="padding:5px 8px;text-align:left">테이블</th>'
    +'<th style="padding:5px 8px;text-align:right">행 수</th>'
    +'<th style="padding:5px 8px;text-align:right">예상크기</th>'
    +'<th style="padding:5px 8px;min-width:80px">비율</th>'
    +'</tr></thead><tbody>'
    +tables.map(t=>{
      const cnt=counts[t.key]||0;
      const kb=Math.round(cnt*(AVG[t.key]||400)/1024);
      const pct2=estBytes>0?Math.min(100,Math.round(cnt*(AVG[t.key]||400)/estBytes*100)):0;
      return '<tr style="border-bottom:1px solid var(--bd)">'
        +'<td style="padding:5px 8px;font-size:10px;color:var(--tm)">'+H.e(t.group)+'</td>'
        +'<td style="padding:5px 8px;font-weight:600">'+H.e(t.label)+'</td>'
        +'<td style="padding:5px 8px;text-align:right">'+cnt.toLocaleString()+'</td>'
        +'<td style="padding:5px 8px;text-align:right;color:var(--tm)">'+kb+'KB</td>'
        +'<td style="padding:5px 8px"><div style="background:var(--bd);border-radius:3px;height:5px">'
        +'<div style="background:#3b82f6;height:5px;width:'+pct2+'%;border-radius:3px"></div>'
        +'</div></td></tr>';
    }).join('')
    +'</tbody></table></div>'
    /* Keepalive */
    +'<div class="card">'
    +'<div class="ch"><div class="ct">🛡️ 비활성 방지</div></div>'
    +'<div style="font-size:12px;color:var(--tm);margin-bottom:8px">'
    +'마지막 keepalive: <strong>'+lastPing+'</strong>'
    +(daysLeft<=3?' <span style="color:'+aliveColor+';font-weight:700">⚠️ D-'+daysLeft+'</span>':'')
    +'</div>'
    +'<button class="btn bpri bsm" onclick="Pages._sbKeepAlive()">🔄 keepalive 전송</button>'
    +'</div>';
},

async _sbKeepAlive(){
  /* [v2.327] Supabase keepalive — 7일 비활성 방지 */
  try{
    if(!_sb) throw new Error('SB 미연결');
    await _sb.from('users').select('id').limit(1);
    const now=new Date().toISOString().slice(0,16).replace('T',' ');
    localStorage.setItem('qms_keepalive', now);
    const el=document.getElementById('sbLastPing');
    if(el) el.textContent=now;
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
/* [v2.27] settings 공지/로고 — Cfg에 실제 구현, Pages에서 위임 */
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
    Modal.open({title:idx!=null?'공지 수정':'공지 등록',size:'mmd',
      body:`<div class="fg2">
        <div class="fgroup ff"><label class="fl req">제목</label><input class="fc" id="nt" value="${H.e(n.title)}"></div>
        <div class="fgroup ff"><label class="fl req">내용</label><textarea class="fc" id="nb" rows="3">${H.e(n.body)}</textarea></div>
        <div class="fgroup"><label class="fl req">게시 시작일</label><input class="fc" type="date" id="nd" value="${n.date}"></div>
        <div class="fgroup"><label class="fl req">게시 종료일</label><input class="fc" type="date" id="ne" value="${n.expire}"></div>
        <div class="fgroup"><label class="fl">등록자</label><input class="fc" id="na" value="${H.e(n.author)}"></div>
        <div class="fgroup"><label class="fl">게시 여부</label><select class="fc" id="ns"><option value="1" ${n.show?'selected':''}>게시</option><option value="0" ${!n.show?'selected':''}>게시중지</option></select></div>
        <div class="fgroup ff"><label class="fl">파일 첨부</label>
          <div style="display:flex;flex-direction:column;gap:6px;width:100%">
            ${n.file?`<div id="nfPreview" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:var(--r);border:1px solid var(--bd)">
              <span style="font-size:12px">📎 ${H.e(n.file.name||n.file)}</span>
              <button class="btn bxs berr" style="font-size:10px;padding:1px 6px" onclick="Cfg._noticeRemoveFile()">삭제</button>
            </div>`:'<div id="nfPreview"></div>'}
            <input type="file" id="nf" class="fc" style="font-size:12px"
              onchange="Cfg._noticePreviewFile(this)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip">
            <div style="font-size:11px;color:var(--tm)">지원: PDF, Word, Excel, PPT, 이미지, ZIP (최대 10MB)</div>
          </div>
        </div>
      </div>`,
      foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Cfg._saveNotice(${idx})">저장 <span class="kbd">F8</span></button>`
    });
  },
  /* [v2.28] 공지 파일 미리보기 */
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
  /* [v2.28] 첨부파일 삭제 */
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
    /* [v2.28] 파일 처리 */
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
      if(idx!=null)App.notices[idx]=obj;else App.notices.push(obj);
      Modal.close();Toast.show('저장되었습니다.','ok');Pages.settings();
    };
    doSave();
  },
  noticeToggle(i){App.notices[i].show=!App.notices[i].show;Toast.show('변경되었습니다.','ok');Pages.settings()},
  noticeDel(i){Modal.confirm({title:'공지 삭제',msg:'공지사항을 삭제하시겠습니까?',danger:true,onOk:()=>{App.notices.splice(i,1);Toast.show('삭제되었습니다.','ok');Pages.settings()}})}
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
insp_std(){
  const w=document.getElementById('pw');const data=DB2.insp_std;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">등록 기준서</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">🔍</div><div><div class="sd-val">${data.filter(d=>d.insp_type==='수입').length}</div><div class="sd-lbl">수입</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">✅</div><div><div class="sd-val">${data.filter(d=>d.insp_type==='출하').length}</div><div class="sd-lbl">출하</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">📋 검사 기준서</div><div class="psub">품목별 검사항목·기준·AQL 설정</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._inspStdForm()">+ 기준서 등록 <span class="kbd">F2</span></button></div>
  </div>
  <div class="tbar"><div class="sw2"><input type="text" placeholder="품목코드, 품목명 검색..."></div>
    <select class="fsel"><option value="">전체 유형</option><option>수입</option><option>공정</option><option>출하</option></select>
  </div><div id="stdTbl"></div>`;
  Tbl.render({el:'#stdTbl',cols:[
    {key:'item_code',label:'품목코드',w:'100px'},{key:'item_name',label:'품목명'},
    {key:'insp_type',label:'검사유형',w:'78px',render:v=>`<span class="badge bblu">${H.e(v)}</span>`},
    {key:'criteria',label:'항목수',w:'70px',align:'center',render:v=>`<strong>${v.length}개</strong>`},
    {key:'aql',label:'AQL',w:'58px',align:'center'},{key:'sample_level',label:'검사수준',w:'75px',align:'center'},
    {key:'rev',label:'Rev',w:'55px',align:'center'},{key:'updated',label:'개정일',w:'88px'},{key:'author',label:'작성자',w:'72px'},
  ],data,onRow:row=>Pages._inspStdDetail(row)});
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
insp_cert(){
  const w=document.getElementById('pw');const data=DB2.insp_cert;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📜</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">발행 성적서</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.final==='합격').length}</div><div class="sd-lbl">합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">❌</div><div><div class="sd-val">${data.filter(d=>d.final==='불합격').length}</div><div class="sd-lbl">불합격</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">📜 검사 성적서 (COA)</div><div class="psub">검사 결과 기반 성적서 자동 생성</div></div></div>
  <div class="tbar"><div class="sw2"><input type="text" placeholder="성적서번호, LOT, 품목명..."></div>
    <select class="fsel"><option value="">전체 결과</option><option>합격</option><option>불합격</option></select>
  </div><div id="certTbl"></div>`;
  Tbl.render({el:'#certTbl',cols:[
    {key:'cert_no',label:'성적서번호',w:'155px'},{key:'lot',label:'LOT번호',w:'128px'},
    {key:'item_name',label:'품목명'},{key:'insp_type',label:'검사유형',w:'78px',render:v=>`<span class="badge bblu">${H.e(v)}</span>`},
    {key:'insp_date',label:'검사일',w:'88px'},{key:'qty',label:'수량',w:'72px',align:'right',render:v=>H.n(v)},
    {key:'inspector',label:'검사자',w:'72px'},{key:'approver',label:'승인자',w:'72px'},
    {key:'final',label:'최종판정',w:'78px',align:'center',render:v=>H.inspBadge(v)},
  ],data,onRow:row=>Pages._certDetail(row)});
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
lot_trace(){
  const w=document.getElementById('pw');const data=DB2.lot_trace;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🔗</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">추적 LOT</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🚫</div><div><div class="sd-val">${data.filter(d=>d.hold).length}</div><div class="sd-lbl">Hold 중</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.insp_result==='합격').length}</div><div class="sd-lbl">합격</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">🔗 LOT 추적성</div><div class="psub">원자재 → 반제품 → 완제품 LOT 연결 추적</div></div></div>
  <div class="tbar"><div class="sw2"><input type="text" placeholder="LOT번호, 품목명..."></div></div><div id="lotTbl"></div>`;
  Tbl.render({el:'#lotTbl',cols:[
    {key:'lot',label:'LOT번호',w:'135px'},{key:'item_name',label:'품목명'},
    {key:'vendor',label:'공급업체',w:'110px'},{key:'recv_date',label:'입고일',w:'88px'},
    {key:'recv_qty',label:'수량',w:'58px',align:'right',render:v=>H.n(v)},{key:'remain_qty',label:'잔여',w:'58px',align:'right',render:v=>H.n(v)},
    {key:'insp_result',label:'검사결과',w:'78px',align:'center',render:v=>H.inspBadge(v)},
    {key:'hold',label:'Hold',w:'62px',align:'center',render:v=>v?`<span class="badge bred">Hold</span>`:`<span class="badge bgrn">정상</span>`},
    {key:'used_in',label:'사용처',w:'62px',align:'center',render:v=>`<span style="font-weight:700;color:var(--pri)">${v.length}건</span>`},
  ],data,onRow:row=>Pages._lotDetail(row)});
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
hold_mgmt(){
  const w=document.getElementById('pw');const data=DB2.holds;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🚫</div><div><div class="sd-val">${data.filter(d=>d.status==='Hold중').length}</div><div class="sd-lbl">Hold 중</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.status==='처리완료').length}</div><div class="sd-lbl">처리완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📦</div><div><div class="sd-val">${data.filter(d=>d.status==='Hold중').reduce((s,d)=>s+d.qty,0)}</div><div class="sd-lbl">Hold 수량</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">🚫 Hold 관리</div><div class="psub">불합격·부적합 자재 격리 관리</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._holdForm()">+ Hold 등록 <span class="kbd">F2</span></button></div>
  </div><div id="holdTbl"></div>`;
  Tbl.render({el:'#holdTbl',cols:[
    {key:'hold_no',label:'Hold번호',w:'148px'},{key:'lot',label:'LOT번호',w:'128px'},{key:'item_name',label:'품목명'},
    {key:'qty',label:'수량',w:'58px',align:'right',render:v=>H.n(v)},{key:'location',label:'보관위치',w:'118px'},
    {key:'reason',label:'Hold 사유'},{key:'hold_date',label:'Hold일',w:'86px'},{key:'assignee',label:'담당자',w:'70px'},
    {key:'status',label:'상태',w:'76px',render:v=>`<span class="badge ${v==='Hold중'?'bred':'bgrn'}">${H.e(v)}</span>`},
  ],data,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        data=data.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        render?.();
      },onRow:row=>Pages._holdDetail(row)});
},
_holdForm(){Modal.open({title:'🚫 Hold 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">LOT번호</label><input class="fc" placeholder="LOT번호 입력"></div>
  <div class="fgroup"><label class="fl req">Hold일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl">품목</label><select class="fc"><option value="">선택</option>${DB.items.map(i=>`<option>${H.e(i.item_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">보관위치</label><input class="fc" placeholder="창고-구역"></div>
  <div class="fgroup"><label class="fl">담당자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
  <div class="fgroup ff"><label class="fl req">Hold 사유</label><textarea class="fc" rows="2"></textarea></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('Hold가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
_holdDetail(row){Modal.open({title:`🚫 Hold 상세 — ${row.hold_no}`,size:'mmd',
  body:`<div class="ir"><div class="il">Hold번호</div><div class="iv">${H.e(row.hold_no)}</div></div>
  <div class="ir"><div class="il">품목/LOT</div><div class="iv">${H.e(row.item_name)} / ${H.e(row.lot)}</div></div>
  <div class="ir"><div class="il">수량</div><div class="iv">${H.n(row.qty)}EA</div></div>
  <div class="ir"><div class="il">보관위치</div><div class="iv">${H.e(row.location)}</div></div>
  <div class="ir"><div class="il">Hold 사유</div><div class="iv">${H.e(row.reason)}</div></div>
  <div class="ir"><div class="il">상태</div><div class="iv"><span class="badge ${row.status==='Hold중'?'bred':'bgrn'}">${H.e(row.status)}</span></div></div>`,
  foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>${row.status==='Hold중'?`<button class="btn bok" onclick="Toast.show('Hold 해제(더미)','ok');Modal.close()">✅ Hold 해제</button>`:''}`})},
reinsp(){
  const w=document.getElementById('pw');const data=DB2.reinsp;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🔄</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">재검사 건수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.result==='합격').length}</div><div class="sd-lbl">합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ccfbf1;color:#0d9488">🔷</div><div><div class="sd-val">${data.filter(d=>d.result==='부분합격').length}</div><div class="sd-lbl">부분합격</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⭐</div><div><div class="sd-val">${data.filter(d=>d.result==='특채').length}</div><div class="sd-lbl">특채</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">🔖</div><div><div class="sd-val">${data.filter(d=>d.result==='무검사').length}</div><div class="sd-lbl">무검사</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#64748b">⏸</div><div><div class="sd-val">${data.filter(d=>d.result==='보류').length}</div><div class="sd-lbl">보류</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">❌</div><div><div class="sd-val">${data.filter(d=>d.result==='불합격').length}</div><div class="sd-lbl">불합격</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">🔄 재검사 관리</div><div class="psub">불합격 후 재검사 등록 및 이력 연결</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._reinspForm()">+ 재검사 등록 <span class="kbd">F2</span></button></div>
  </div><div id="reinspTbl"></div>`;
  Tbl.render({el:'#reinspTbl',cols:[
    {key:'reinsp_no',label:'재검사번호',w:'148px'},{key:'orig_lot',label:'원LOT',w:'128px'},
    {key:'item_name',label:'품목명'},{key:'orig_result',label:'최초',w:'68px',render:v=>`<span class="badge bred">${H.e(v)}</span>`},
    {key:'reinsp_date',label:'재검사일',w:'86px'},{key:'qty',label:'수량',w:'58px',align:'right',render:v=>H.n(v)},
    {key:'reject_qty',label:'불합격',w:'58px',align:'right',render:v=>`<span style="color:var(--err);font-weight:700">${v}</span>`},
    {key:'inspector',label:'검사자',w:'70px'},{key:'result',label:'결과',w:'78px',render:v=>H.inspBadge(v)},
  ],data,onRow:row=>Pages._reinspDetail(row)});
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
_reinspForm(){Modal.open({title:'🔄 재검사 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">원 LOT번호</label><input class="fc"></div>
  <div class="fgroup"><label class="fl req">재검사일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl req">품목</label><select class="fc"><option value="">선택</option>${DB.items.map(i=>`<option>${H.e(i.item_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">재검사 수량</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup ff"><label class="fl req">재검사 사유</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup"><label class="fl">검사자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('재검사가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
});

/* ══ E: SQM ══ */
Object.assign(Pages,{
sqm_eval(){
  const w=document.getElementById('pw');const data=DB2.sqm_eval;
  const avgScore=(data.reduce((s,d)=>s+d.total,0)/data.length).toFixed(1);
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⭐</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">평가 업체</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">🏆</div><div><div class="sd-val">${data.filter(d=>d.grade==='A').length}</div><div class="sd-lbl">A등급</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📊</div><div><div class="sd-val">${avgScore}</div><div class="sd-lbl">평균 점수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">📉</div><div><div class="sd-val">${Math.round(data.reduce((s,e)=>s+e.ppm,0)/data.length).toLocaleString()}</div><div class="sd-lbl">평균 PPM</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">⭐ 공급업체 평가</div><div class="psub">품질·납기·가격·대응 항목별 점수화, 등급 산출</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._sqmEvalForm()">+ 평가 등록 <span class="kbd">F2</span></button></div>
  </div><div id="evalTbl"></div>`;
  Tbl.render({el:'#evalTbl',cols:[
    {key:'vendor_name',label:'거래처명'},{key:'period',label:'평가기간',w:'86px'},
    {key:'quality',label:'품질(40%)',w:'76px',align:'center',render:v=>`<span style="font-weight:700;color:${v>=90?'var(--ok)':v>=70?'var(--warn)':'var(--err)'}">${v}</span>`},
    {key:'delivery',label:'납기(30%)',w:'76px',align:'center',render:v=>`<span style="font-weight:700;color:${v>=90?'var(--ok)':v>=70?'var(--warn)':'var(--err)'}">${v}</span>`},
    {key:'price',label:'가격(20%)',w:'76px',align:'center'},{key:'response',label:'대응(10%)',w:'76px',align:'center'},
    {key:'total',label:'종합점수',w:'80px',align:'center',render:v=>`<span style="font-weight:800;font-size:14px;color:${v>=90?'var(--ok)':v>=70?'var(--warn)':'var(--err)'}">${v}</span>`},
    {key:'grade',label:'등급',w:'56px',align:'center',render:v=>{const c={A:'bgrn',B:'bblu',C:'bamb',D:'bred'};return`<span class="badge ${c[v]||'bgry'}" style="font-size:13px;font-weight:800">${v}</span>`}},
    {key:'ppm',label:'PPM',w:'66px',align:'right',render:v=>`<span style="font-weight:700;color:${v<500?'var(--ok)':v<2000?'var(--warn)':'var(--err)'}">${H.n(v)}</span>`},
    {key:'complaint',label:'클레임',w:'60px',align:'center',render:v=>`<span style="${v>0?'color:var(--err);font-weight:700':''}">${v}건</span>`},
  ],data,onRow:row=>Pages._sqmEvalDetail(row)});
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
_sqmEvalForm(){Modal.open({title:'⭐ 업체 평가 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">거래처</label><select class="fc"><option value="">선택</option>${DB.vendors.map(v=>`<option>${H.e(v.vendor_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">평가기간</label><input class="fc" placeholder="2026-Q2"></div>
  <div class="fgroup"><label class="fl req">품질 점수 (40%)</label><input class="fc" type="number" min="0" max="100"></div>
  <div class="fgroup"><label class="fl req">납기 점수 (30%)</label><input class="fc" type="number" min="0" max="100"></div>
  <div class="fgroup"><label class="fl req">가격 점수 (20%)</label><input class="fc" type="number" min="0" max="100"></div>
  <div class="fgroup"><label class="fl req">대응 점수 (10%)</label><input class="fc" type="number" min="0" max="100"></div>
  <div class="fgroup"><label class="fl">PPM</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">클레임 건수</label><input class="fc" type="number" value="0"></div>
  <div class="fgroup"><label class="fl">평가일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl">평가자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('평가가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
sqm_audit(){
  const w=document.getElementById('pw');const data=DB2.sqm_audit;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🔎</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">심사 건수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.status==='완료').length}</div><div class="sd-lbl">완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📅</div><div><div class="sd-val">${data.filter(d=>d.status==='예정').length}</div><div class="sd-lbl">예정</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">🔎 공급업체 심사</div><div class="psub">정기·수시 공급업체 심사 계획 및 결과 관리</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._sqmAuditForm()">+ 심사 등록 <span class="kbd">F2</span></button></div>
  </div><div id="sauditTbl"></div>`;
  Tbl.render({el:'#sauditTbl',cols:[
    {key:'vendor_name',label:'거래처명'},{key:'audit_type',label:'심사유형',w:'70px',render:v=>`<span class="badge ${v==='정기'?'bblu':'bamb'}">${H.e(v)}</span>`},
    {key:'plan_date',label:'계획일',w:'86px'},{key:'actual_date',label:'실시일',w:'86px',render:v=>v||'-'},
    {key:'auditor',label:'심사자',w:'70px'},{key:'score',label:'점수',w:'60px',align:'center',render:v=>v?`<span style="font-weight:700;color:${v>=85?'var(--ok)':v>=70?'var(--warn)':'var(--err)'}">${v}</span>`:'-'},
    {key:'findings',label:'지적사항'},{key:'status',label:'상태',w:'60px',render:v=>`<span class="badge ${v==='완료'?'bgrn':'bamb'}">${H.e(v)}</span>`},
    {key:'next_date',label:'차기심사일',w:'86px',render:v=>v||'-'},
  ],data,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        data=data.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        render?.();
      }});
},
_sqmAuditForm(){Modal.open({title:'🔎 업체 심사 등록',size:'mlg',body:`<div class="fg2">
  <div class="fgroup"><label class="fl req">거래처</label><select class="fc"><option value="">선택</option>${DB.vendors.map(v=>`<option>${H.e(v.vendor_name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl req">심사유형</label><select class="fc"><option>정기</option><option>특별</option><option>수시</option></select></div>
  <div class="fgroup"><label class="fl req">계획일</label><input class="fc" type="date" value="${H.today()}"></div>
  <div class="fgroup"><label class="fl">실시일</label><input class="fc" type="date"></div>
  <div class="fgroup"><label class="fl">심사자</label><select class="fc"><option value="">선택</option>${DB.users.map(u=>`<option>${H.e(u.name)}</option>`).join('')}</select></div>
  <div class="fgroup"><label class="fl">점수 (0~100)</label><input class="fc" type="number" min="0" max="100"></div>
  <div class="fgroup ff"><label class="fl">지적사항</label><textarea class="fc" rows="2"></textarea></div>
  <div class="fgroup"><label class="fl">차기 심사일</label><input class="fc" type="date"></div>
</div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri btn-f8" onclick="Toast.show('심사가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`})},
sqm_dash(){
  const w=document.getElementById('pw');const evals=DB2.sqm_eval;
  const gc={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  w.innerHTML=`<div class="ph"><div><div class="ptit">📊 SQM 대시보드</div><div class="psub">공급업체 품질 종합 현황</div></div></div>
  <div class="stat-dash" style="margin-bottom:16px">
    ${['A','B','C','D'].map(g=>{const cnt=evals.filter(e=>e.grade===g).length;return`<div class="sd-card"><div class="sd-icon" style="background:${gc[g]}22;color:${gc[g]};font-size:20px;font-weight:900">${g}</div><div><div class="sd-val" style="color:${gc[g]}">${cnt}</div><div class="sd-lbl">등급 ${g}</div></div></div>`}).join('')}
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📉</div><div><div class="sd-val">${Math.round(evals.reduce((s,e)=>s+e.ppm,0)/evals.length).toLocaleString()}</div><div class="sd-lbl">평균 PPM</div></div></div>
  </div>
  <div class="g2" style="margin-bottom:13px">
    <div class="card"><div class="ch"><div class="ct">⭐ 업체별 종합 점수</div></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${evals.sort((a,b)=>b.total-a.total).map(e=>`<div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
            <span style="font-weight:600">${H.e(e.vendor_name)}</span>
            <span style="display:flex;gap:8px;align-items:center"><span class="badge ${e.grade==='A'?'bgrn':e.grade==='B'?'bblu':e.grade==='C'?'bamb':'bred'}" style="font-size:12px;font-weight:800">${e.grade}</span><strong style="color:${e.total>=90?'var(--ok)':e.total>=70?'var(--warn)':'var(--err)'}">${e.total}점</strong></span>
          </div>
          <div style="background:#e5e7eb;border-radius:999px;height:8px"><div style="background:${gc[e.grade]};width:${e.total}%;height:100%;border-radius:999px"></div></div>
        </div>`).join('')}
      </div>
    </div>
    <div class="card"><div class="ch"><div class="ct">🔴 업체별 PPM</div></div>
      <div style="display:flex;align-items:flex-end;gap:14px;height:140px;padding:0 10px">
        ${evals.map(e=>{const h=Math.round((e.ppm/5000)*120);const col=e.ppm<500?'var(--ok)':e.ppm<2000?'var(--warn)':'var(--err)';return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="font-size:11px;font-weight:700;color:${col}">${H.n(e.ppm)}</div><div style="width:100%;background:${col};height:${h}px;border-radius:4px 4px 0 0;min-height:4px"></div><div style="font-size:10px;color:var(--tm);text-align:center">${H.e(e.vendor_name.substring(0,4))}</div></div>`}).join('')}
      </div>
      <div style="border-top:2px solid var(--bd);margin:0 10px"></div>
    </div>
  </div>`;
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
  const w=document.getElementById('pw');
  const data=DB2.report_8d;
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📝</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">전체 8D</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div><div><div class="sd-val">${data.filter(d=>d.status==='완료').length}</div><div class="sd-lbl">완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⏳</div><div><div class="sd-val">${data.filter(d=>d.status!=='완료').length}</div><div class="sd-lbl">진행중</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">📝 8D Report</div><div class="psub">8단계 문제해결 보고서</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._8dForm()">+ 8D 등록 <span class="kbd">F2</span></button></div>
  </div>
  <div id="d8Tbl"></div>`;
  Tbl.render({el:'#d8Tbl',cols:[
    {key:'ref_nc',label:'연계 부적합',w:'155px'},{key:'title',label:'제목'},
    {key:'open_date',label:'개시일',w:'88px'},{key:'assignee',label:'책임자',w:'72px'},
    {key:'close_date',label:'완료일',w:'88px',render:v=>v||'-'},
    {key:'status',label:'상태',w:'68px',render:v=>`<span class="badge ${v==='완료'?'bgrn':'bamb'}">${H.e(v)}</span>`},
  ],data,onRow:row=>Pages._8dDetail(row)});
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
  </div>`,foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
    <button class="btn bpri btn-f8" onclick="Toast.show('8D Report가 등록되었습니다.','ok');Modal.close()">등록 <span class="kbd">F8</span></button>`});
},
nc_dispose(){
  const w=document.getElementById('pw');
  const data=DB2.nc_dispose;
  const totalCost=data.reduce((s,d)=>s+d.cost,0);
  w.innerHTML=`<div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">♻️</div><div><div class="sd-val">${data.length}</div><div class="sd-lbl">처리 건수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🗑️</div><div><div class="sd-val">${data.reduce((s,d)=>s+d.scrap_qty,0)}</div><div class="sd-lbl">폐기 수량</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🔧</div><div><div class="sd-val">${data.reduce((s,d)=>s+d.rework_qty,0)}</div><div class="sd-lbl">재작업 수량</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">💰</div><div><div class="sd-val">${H.n(totalCost)}</div><div class="sd-lbl">처리 비용(원)</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px"><div><div class="ptit">♻️ 반품/폐기 처리</div><div class="psub">부적합품 반품·재작업·폐기 처리 및 비용 관리</div></div>
    <div class="pac"><button class="btn bpri btn-f2" onclick="Pages._disposeForm()">+ 처리 등록 <span class="kbd">F2</span></button></div>
  </div>
  <div id="disposeTbl"></div>`;
  Tbl.render({el:'#disposeTbl',cols:[
    {key:'ref_nc',label:'부적합번호',w:'148px'},{key:'item_name',label:'품목명'},
    {key:'lot',label:'LOT번호',w:'128px'},{key:'qty',label:'총수량',w:'62px',align:'right',render:v=>H.n(v)},
    {key:'action',label:'처리방법',w:'72px',render:v=>`<span class="badge ${v==='반품'?'bamb':v==='폐기'?'bred':'bblu'}">${H.e(v)}</span>`},
    {key:'return_qty',label:'반품',w:'55px',align:'right'},{key:'scrap_qty',label:'폐기',w:'55px',align:'right',render:v=>`<span style="${v>0?'color:var(--err);font-weight:700':''}">${v}</span>`},
    {key:'rework_qty',label:'재작업',w:'62px',align:'right'},
    {key:'cost',label:'비용(원)',w:'88px',align:'right',render:v=>`<strong>${H.n(v)}</strong>`},
    {key:'action_date',label:'처리일',w:'88px'},{key:'status',label:'상태',w:'68px',render:v=>`<span class="badge ${v==='완료'?'bgrn':'bamb'}">${H.e(v)}</span>`},
  ],data,onDel:async(ids)=>{
        const numIds=ids.map(Number);
        data=data.filter(r=>!numIds.includes(Number(r.id)));
        Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
        render?.();
      }});
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
        {key:'item_code', label:'품목코드',  req:true,  sample:'RAW-001'},
        {key:'item_name', label:'품목명',    req:true,  sample:'스테인레스 플레이트'},
        {key:'spec',      label:'규격',      req:false, sample:'SUS304 2T'},
        {key:'unit',      label:'단위',      req:false, sample:'EA'},
        {key:'material',  label:'재질',      req:false, sample:'SUS304'},
        {key:'vendor_name',label:'주 거래처',req:false, sample:'㈜한국스틸'},
        {key:'active',    label:'사용여부',  req:false, sample:'사용'},
        {key:'remark',    label:'비고',       req:false, sample:''},
      ],
      /* [v2.24] 품목코드만 중복 확인, 필수값 외 빈칸 허용 */
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
      /* [v2.24] 거래처명만 중복 확인, 필수값 외 빈칸 허용 */
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
      /* [v2.24] 품목코드+거래처명 없으면 등록 안 됨, 동일시트 중복 허용 */
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
      /* [v2.24] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.24] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.24] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.24] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      title:'부적합관리',
      cols:[
        {key:'no',       label:'부적합번호', req:true,  sample:'NC-20260601-001'},
        {key:'type',     label:'유형',       req:true,  sample:'수입'},
        {key:'item',     label:'품목명',     req:true,  sample:'알루미늄 바'},
        {key:'date',     label:'발생일',     req:true,  sample:'2026-06-01'},
        {key:'desc',     label:'부적합내용', req:false, sample:'치수 불량'},
        {key:'assignee', label:'담당자',     req:false, sample:'김품질'},
        {key:'status',   label:'상태',       req:false, sample:'접수'},
      ],
      dupKey:'no', dupLabel:'부적합번호', getData:()=>DB.nc,
    },
    equip:{
      title:'계측기등록',
      cols:[
        {key:'code',     label:'계측기코드',  req:true,  sample:'EQ-006',    note:'필수'},
        {key:'name',     label:'계측기명',    req:false, sample:'높이게이지'},
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
        {key:'date',   label:'교정일',     req:true,  sample:'2026-06-01'},
        {key:'agency', label:'교정기관',   req:true,  sample:'㈜정밀측정'},
        {key:'cert',   label:'성적서번호', req:false, sample:'CAL-2026-010'},
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
  },

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
        this._ws=ws; /* [v2.29] ws 저장 — 날짜 변환에 사용 */
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        /* [v2.29] 날짜 필드 변환 — 엑셀 시리얼/Date객체 → YYYY-MM-DD */
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
       [v2.20 버그수정] 인덱스 기반 → 헤더 레이블 기반 파싱
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
     [v2.17 수정]
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
      /* [v2.29] 테이블별 허용 컬럼만 추출 — SB schema 오류 방지 */
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

    /* [v2.293] equip: SB.addEquip 헬퍼 직접 호출 (검사5종 방식과 동일)
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
       [v2.20 수정] 1000건 제한 해결
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
     A+C안: 멀티시트 통합 업로드 [v2.23 신규]
     A: 하나의 파일에 품목/거래처/사용자/수입검사 시트 포함
     C: 전체 정합성 검사 통과 시에만 등록 버튼 활성화
        오류 행에 결과 열 자동 추가, 결과 엑셀 내보내기
     ════════════════════════════════════════════════════ */

  /* 멀티시트 양식 다운로드
     [v2.26] pageFilter: 특정 시트만 포함 (null=전체) */
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
     [v2.26] pageFilter: 특정 시트만 표시 (예: 'vendors', 'insp_in' 등)
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
        /* 시트명 → 스키마 키 매핑 — [v2.24] 검사 4종 추가 */
        const SMAP_ALL={'품목등록':'items','거래처등록':'vendors','사용자등록':'users',
          '수입검사':'insp_in','공정검사':'insp_pr','구매검사':'insp_pu',
          '외주검사':'insp_ou','최종검사':'insp_fi',
          '계측기등록':'equip'};
        /* [v2.26] pageFilter: 특정 시트만 파싱 */
        const pf=this._pageFilter;
        const SMAP=pf
          ?Object.fromEntries(Object.entries(SMAP_ALL).filter(([,v])=>v===pf))
          :SMAP_ALL;
        const results={};
        let totalOk=0,totalErr=0,totalDup=0;
        /* [v2.25 버그수정] SB 최신 데이터 강제 로드
           실패 시 빈 배열로 초기화 → 구 캐시로 인한 중복 오판 방지 */
        if(_sb){
          try{
            DB.items=await SB.getItems();
            DB.vendors=await SB.getVendors();
            DB.users=await SB.getUsers();
            /* [v2.293] 계측기 중복 체크용 */
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
          /* [v2.29] raw:true 유지 — 셀 직접 접근으로 날짜 변환 처리 */
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
            /* [v2.29] 날짜 변환 헬퍼
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
    /* [v2.29] 엑셀 날짜 → YYYY-MM-DD (Date객체/시리얼/문자열 모두 처리) */
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
      /* [v2.29] 검사5종 — SB.addInspection allowed와 동일 컬럼 */
      if(['insp_in','insp_pr','insp_pu','insp_ou','insp_fi'].includes(pKey)){
        const typeMap={insp_in:'수입',insp_pr:'공정',insp_pu:'구매',insp_ou:'외주',insp_fi:'최종'};
        return{type:r.type||typeMap[pKey]||'',vendor:r.vendor||'',insp_no:r.insp_no||'',
          insp_date:_toDate(r.insp_date),inspector:r.inspector||'',item_code:r.item_code||'',
          item_name:r.item_name||'',spec:r.spec||'',insp_method:r.insp_method||'',
          result:r.result||'합격',qty:Number(r.qty)||0,pass_qty:Number(r.pass_qty)||0,
          fail_qty:Number(r.fail_qty)||0,defect_rate:Number(r.defect_rate)||0,
          wo_no:r.wo_no||'',note:r.note||'',created_at:_toDate(r.created_at),updated_at:null};
      }
      /* [v2.29] 계측기 — SB.addEquip allowed와 동일 컬럼 */
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
      /* [v2.293] 계측기: SB.addEquip 직접 호출 */
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
      /* [v2.29] 검사5종: SB.addInspection 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
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
      /* [v2.29] 계측기: SB.addEquip 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
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
              /* [v2.29] SAFE 저장 성공하면 colErrors 제거 — SQL 실행 후 팝업 억제 */
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
      /* [v2.29] SB 반영 대기 후 페이지 이동 */
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
    nc:{title:'부적합 검색',fields:[{id:'sn_type',label:'유형',type:'select',opts:['','수입','공정','출하','기타']},{id:'sn_no',label:'부적합번호',type:'text',ph:'NC번호'},{id:'sn_item',label:'품목명',type:'text',ph:'품목명'},{id:'sn_status',label:'상태',type:'select',opts:['','접수','처리중','완료']},{id:'sn_from',label:'발생일(시작)',type:'date'},{id:'sn_to',label:'발생일(종료)',type:'date'}],cols:['부적합번호','유형','품목명','발생일','담당자','상태'],get:(f)=>DB.nc.filter(r=>{if(f.sn_type&&r.type!==f.sn_type)return false;if(f.sn_no&&!r.no.includes(f.sn_no))return false;if(f.sn_item&&!r.item.includes(f.sn_item))return false;if(f.sn_status&&r.status!==f.sn_status)return false;if(f.sn_from&&r.date<f.sn_from)return false;if(f.sn_to&&r.date>f.sn_to)return false;return true;}),row:(r)=>[H.e(r.no),`<span class="badge bblu">${H.e(r.type)}</span>`,H.e(r.item),H.e(r.date),H.e(r.assignee),`<span class="badge ${r.status==='완료'?'bgrn':r.status==='처리중'?'bamb':'bgry'}">${H.e(r.status)}</span>`]},
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
  },

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
  /* [v2.327] 사용자 비활성화 */
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
      /* [v2.327] F5 브라우저 새로고침 방지 — 앱 내부에서 현재 페이지 재렌더 */
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
      /* [v2.21 수정] 복원 시 저장된 사용자 정보로 표시 (admin 하드코딩 제거) */
      Auth._cur = cur;
      Auth._u   = u;
      const roleLabel={'admin':'관','manager':'장','user':'사'};
      ['uav','uname','urole','tbuser'].forEach((id,i)=>{
        const el=document.getElementById(id);
        if(el)el.textContent=[(u.name||u.username||'?')[0],u.name||u.username,roleLabel[u.role]||'사용자',u.name||u.username][i];
      });
      document.getElementById('loginOv').style.display='none';
      document.getElementById('app').classList.remove('hidden');
      /* [v2.29] 설정 메뉴: 세션 복원 시에도 admin만 표시 */
      const sm=document.getElementById('ni_settings');
      if(sm) sm.style.display=(u.role==='admin')?'':'none';
      const savedPage = sessionStorage.getItem('qms_page') || 'home';
      /* [v2.327] DB 일괄 로드 완료 후 페이지 이동 — 빈 DB로 렌더 방지 */
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
