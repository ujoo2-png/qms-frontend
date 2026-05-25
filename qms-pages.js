/* qms-pages.js — Pages 페이지 렌더러 [v2.307] */
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
     subs:[{icon:'📦',label:'품목 등록',page:'items'},{icon:'🏢',label:'거래처 등록',page:'vendors'},{icon:'👥',label:'사원관리',page:'users'}]},
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
          <div class="hw-hdr-sub">Quality Management System · v2.305</div>
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
  const text=(document.getElementById('rplyText')?.value||'').trim();
  const to=(document.getElementById('rplyTo')?.value||'').trim();
  if(!text){Toast.show('내용을 입력하세요.','warn');return}
  const me=Auth._u;
  const meUser=DB.users.find(u=>u.username===(me?.username||Auth._cur))||{name:'관리자',department:'IT팀'};
  const toUser=DB.users.find(u=>u.username===to);
  const reply={
    from:      meUser.name||me?.name||'관리자',
    dept:      meUser.department||'',
    to:        toUser?.name||to,
    text,
    message:   text,
    created_at:H.today(),
    read:      false,
    reply_to:  parentId,
    ref:       DB.mentions.find(m=>m.id===parentId)?.ref||'',
  };
  const res=await SB.addMention(reply);
  if(!res.ok) return;
  /* 로컬 replies 배열에도 추가 */
  const parent=DB.mentions.find(m=>m.id===parentId);
  if(parent){
    if(!parent.replies) parent.replies=[];
    parent.replies.push({...reply,id:res.id||Date.now()});
  }
  Modal.close();
  Toast.show('답장이 발송되었습니다.','ok');
  Pages.mentions();
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
_savePerms(){
  try{
    sessionStorage.setItem('qms_perms',JSON.stringify(App.perms||{}));
    Toast.show('권한 설정이 저장되었습니다.','ok');
  }catch(e){Toast.show('저장 실패','err');}
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
      </table></div>
    </div>`;
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
      <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('equip')" title="엑셀 양식 내려받기">📥 양식 내려받기</button>
      <button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('equip')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
      <button class="btn btn-xl-up bpur" onclick="ExcelMgr.openUploadAll('equip')" title="통합 일괄등록">🗂️ 통합 일괄등록</button>
      <button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._eqPrint()" title="계측기 관리대장 인쇄">🖨️ 관리대장 인쇄</button>
    </div></div>
    <div class="tbar">
      <div class="sw2"><input type="text" placeholder="코드, 계측기명 검색..."></div>
      <select class="fsel"><option value="">전체 상태</option><option>정상</option><option>교정중</option><option>만료</option><option>폐기</option></select>
      <button class="btn bout bsm" onclick="SearchPop.open('equip')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="eqTbl"></div>`;
  Tbl.render({el:'#eqTbl',cols:[
    {key:'code',     label:'계측기코드', w:'102px'},
    {key:'name',     label:'계측기명',   w:'140px'},
    {key:'maker',    label:'제조사',     w:'88px'},
    {key:'range',    label:'측정범위',   w:'120px'},
    {key:'res',      label:'분해능',     w:'78px'},
    {key:'loc',      label:'보관위치',   w:'88px'},
    {key:'operator', label:'사용자',     w:'80px'},
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

/* [v2.307 Phase3] 계측기 관리대장 인쇄 */
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
    const recs=(DB.cals||[]).filter(c=>(c.code===row.code||c.equip_code===row.code))
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
  /* [v2.307 Phase3] D-30 이내 + 아직 만료 안된 계측기 */
  const _now=new Date();
  const soon=DB.equip.filter(e=>{
    if(!e.next) return false;
    const d=Math.ceil((new Date(e.next)-_now)/(864e5));
    return d>=0&&d<30;
  });
  w.innerHTML=`<div class="ph"><div><div class="ptit">📐 교정 관리</div></div><div class="pac"><button class="btn bpri btn-f2" onclick="Pages._calForm()">+ 교정 등록 <span class="kbd">F2</span></button></div></div>
    <button class="btn btn-xl-down bsm" onclick="ExcelMgr.download('cal')" title="엑셀 양식 내려받기">📥 양식 내려받기</button><button class="btn btn-xl-up bsm" onclick="ExcelMgr.openUpload('cal')" title="엑셀 일괄등록">📤 자료 일괄등록</button>
    ${soon.length?`<div class="card" style="margin-bottom:12px;border-left:4px solid var(--warn)"><div class="ct" style="margin-bottom:9px">🔔 교정 예정/만료 알림 (30일 이내)</div>
    ${soon.map(e=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:13px"><div><strong>${H.e(e.name)}</strong> <span style="color:var(--tm);font-size:11px">(${H.e(e.code)})</span></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:var(--tm)">차기: ${e.next}</span><span class="badge ${e.status==='교정만료'?'bred':'bamb'}">${H.e(e.status)}</span></div></div>`).join('')}
    </div>`:''}
    <div class="tbar">
      <button class="btn bout bsm" onclick="SearchPop.open('cal')" title="통합 검색 팝업 (F3)">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="calTbl"></div>`;
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
      +'<input id="cf_next" class="fc" type="date" value="'+(calRow?.next_date||calRow?.next||'')+'">'+'</div>'
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
  /* SB에서 멘션 목록 로드 */
  const allMentions=await SB.getMentions();
  /* [v2.28] null/undefined 방어 */
  DB.mentions=Array.isArray(allMentions)?allMentions:[];
  const me=Auth._cur||'admin';
  const isAdmin=(Auth._u?.role==='admin');

  const render=()=>{
    /* [v2.27] B안: 테이블형 레이아웃 — 문자열 연결 방식 (중첩 백틱 방지) */
    const thead='<thead><tr>'
      +'<th style="width:28px"><input type="checkbox" id="mentionAllChk" onchange="document.querySelectorAll(\'.mention-chk\').forEach(c=>c.checked=this.checked)"></th>'
      +'<th style="min-width:70px">발신자</th>'
      +'<th style="min-width:60px">수신자</th>'
      +'<th style="min-width:80px">메뉴/분류</th>'
      +'<th>내용 요약</th>'
      +'<th style="width:80px">시간</th>'
      +'<th style="width:34px;text-align:center">읽음</th>'
      +'<th style="width:100px;text-align:center">작업</th>'
      +'</tr></thead>';
    const tbody=DB.mentions.map(m=>{
      const isMine=(m.from===me)||(me==='admin'&&m.from==='관리자');
      const hasReply=(m.replies||[]).length>0;
      const canDel=isAdmin||(isMine&&!hasReply);
      const unread=!m.read;
      const bg=unread?'background:var(--bg2);font-weight:600':'';
      const dot=unread?'<span style="width:6px;height:6px;background:var(--err);border-radius:50%;display:inline-block;margin-left:3px"></span>':'';
      const readBtn=m.read
        ?'<span style="color:var(--ok);font-size:13px">✓</span>'
        :'<button class="btn bxs bpri" style="font-size:10px;padding:1px 5px" onclick="Pages._mentionRead('+m.id+')">읽음</button>';
      const editBtn=isMine?'<button class="btn bxs bout" style="font-size:10px" onclick="Pages._mentionEdit('+m.id+')">수정</button>':'';
      const delBtn=canDel?'<button class="btn bxs berr" style="font-size:10px" onclick="Pages._mentionDel('+m.id+')">삭제</button>':'';
      const replyBtn='<button class="btn bxs" style="background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe;font-size:10px" onclick="Pages._mentionReply('+m.id+','+JSON.stringify(m.from||'')+')">↩</button>';
      const txt=m.text||m.message||'';
      const replySuffix=m.reply_to?'<span style="color:var(--tm);font-size:10px">↩ </span>':'';
      return '<tr id="mention-'+m.id+'" style="'+bg+'">'
        +'<td><input type="checkbox" class="mention-chk" value="'+m.id+'"></td>'
        +'<td><div style="display:flex;align-items:center;gap:4px"><div class="cav" style="width:22px;height:22px;font-size:10px;flex-shrink:0">'+H.e((m.from||'?').charAt(0))+'</div>'+H.e(m.from||'-')+dot+'</div></td>'
        +'<td><span style="color:var(--pri)">@'+H.e(m.to||'-')+'</span></td>'
        +'<td><span class="badge bpur" style="font-size:10px">'+H.e(m.ref||'-')+'</span></td>'
        +'<td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+H.e(txt)+'">'+replySuffix+H.e(txt.slice(0,60))+(txt.length>60?'…':'')+'</td>'
        +'<td style="color:var(--tm);font-size:11px;white-space:nowrap">'+H.e(m.time||m.created_at||'')+'</td>'
        +'<td style="text-align:center">'+readBtn+'</td>'
        +'<td style="text-align:center"><div style="display:flex;gap:2px;justify-content:center">'+replyBtn+editBtn+delBtn+'</div></td>'
        +'</tr>';
    }).join('');
    const tableHtml=DB.mentions.length===0
      ?'<div class="es"><div class="es-icon">💬</div><div>멘션이 없습니다.</div></div>'
      :'<div class="ts"><table class="dt" style="font-size:12px">'+thead+'<tbody>'+tbody+'</tbody></table></div>';
    w.innerHTML=
      '<div class="ph"><div><div class="ptit">💬 멘션함</div></div>'
      +'<div class="pac"><button class="btn bpri btn-f2" onclick="Pages._mentionWrite()">+ 작성하기 <span class=\"kbd\">F2</span></button></div></div>'
      +'<div class="card" style="padding:0;overflow:hidden">'+tableHtml+'</div>';
  };
  render();
  Pages._mentionRender=render;
  // 단축키 F2
  document.addEventListener('keydown',function _mKey(e){
    if(e.key==='F2'){Pages._mentionWrite();e.preventDefault();}
    if(e.key==='Escape'){document.removeEventListener('keydown',_mKey);}
  });
},

/* [v2.28] _mentionRead: 읽음 처리 */
_mentionRead(id){
  const m=DB.mentions.find(x=>Number(x.id)===Number(id));
  if(!m) return;
  m.read=true;
  /* SB 업데이트 */
  if(_sb) _sb.from('mentions').update({read:true}).eq('id',Number(id))
    .then(({error})=>{ if(error) console.warn('[SB] _mentionRead 오류',error.message); });
  Toast.show('읽음 처리되었습니다.','ok',1500);
  if(Pages._mentionRender) Pages._mentionRender();
  /* 홈 멘션 뱃지 업데이트 */
  const badge=document.getElementById('mentionBadge');
  if(badge){const unread=DB.mentions.filter(x=>!x.read).length;badge.textContent=unread;badge.style.display=unread?'':'none';}
},


/* 멘션 작성하기 팝업 */
_mentionWrite(editId=null){
  const me=Auth._cur||'admin';
  const meUser=DB.users.find(u=>u.username===me)||{name:'관리자'};
  const existing=editId?DB.mentions.find(m=>m.id===editId):null;
  const refMenus=['수입검사','공정검사','구매검사','외주검사','최종검사',
    '부적합관리','시정조치','계측기관리','문서관리','기준정보','SPC','기타'];
  const recipients=[...new Set(DB.users.map(u=>u.name).concat(['관리자','전체']))];

  Modal.open({title:editId?'✏️ 멘션 수정':'✉️ 멘션 작성하기',size:'mmd',
    body:`<div class="fg2">
      <div class="fgroup ff">
        <label class="fl req">수신자</label>
        <select class="fc" id="mto">
          <option value="">수신자 선택</option>
          ${recipients.map(r=>`<option ${existing?.to===r?'selected':''}>${H.e(r)}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup ff">
        <label class="fl req">참조 메뉴</label>
        <select class="fc" id="mref">
          ${refMenus.map(r=>`<option ${(existing?.ref||'')===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup ff">
        <label class="fl req">내용</label>
        <textarea class="fc" id="mtext" rows="4" placeholder="@수신자명 메시지를 입력하세요...">${existing?H.e(existing.text):''}</textarea>
      </div>
      <div style="font-size:11px;color:var(--tm);margin-top:-8px">
        💡 @이름 형식으로 멘션을 표시할 수 있습니다.<br>
        Supabase 배포 시: mentions 테이블에 저장, 실시간 알림(Realtime) 연동 예정
      </div>
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._mentionSave(${editId||'null'})">
            ${editId?'수정':'등록'} <span class="kbd">F8</span>
          </button>`
  });
  setTimeout(()=>document.getElementById('mtext')?.focus(),80);
},

/* 멘션 저장 (등록/수정) */
/* 멘션 저장 (등록/수정) — SB 연동 */
async _mentionSave(editId){
  const to=(document.getElementById('mto')?.value||'').trim();
  const ref=document.getElementById('mref')?.value||'기타';
  const text=(document.getElementById('mtext')?.value||'').trim();
  if(!to){Toast.show('수신자를 선택하세요.','warn');return}
  if(!text){Toast.show('내용을 입력하세요.','warn');return}
  const me=Auth._cur||'admin';
  const meUser=DB.users.find(u=>u.username===me)||{name:'관리자',dept:''};

  if(editId){
    const res=await SB.updateMention(editId,{text,to,ref});
    if(!res.ok)return;
    Toast.show('멘션이 수정되었습니다.','ok');
  } else {
    const row={from:meUser.name,to,dept:meUser.dept||'',text,ref,
               time:'방금 전',read:false,replies:[],
               created_at:new Date().toISOString()};
    const res=await SB.addMention(row);
    if(!res.ok)return;
    Toast.show('멘션이 등록되었습니다.','ok');
  }
  Modal.close();
  Pages.mentions();
},

/* 멘션 수정 팝업 열기 */
_mentionEdit(id){
  this._mentionWrite(id);
},

/* 멘션 삭제 — SB 연동 (soft delete: deleted_at) */
_mentionDel(id){
  const isAdmin=(Auth._u?.role==='admin');
  const m=DB.mentions.find(m=>m.id===id);
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return}
  const isMine=m.from===(Auth._u?.name||'관리자');
  const hasReply=(m.replies||[]).length>0;
  if(!isAdmin&&hasReply){Toast.show('댓글이 있는 멘션은 삭제할 수 없습니다.','warn');return}
  if(!isAdmin&&!isMine){Toast.show('본인이 작성한 멘션만 삭제할 수 있습니다.','warn');return}

  Modal.confirm({
    title:'멘션 삭제',
    msg:`${isAdmin&&!isMine?'<div style="margin-bottom:8px;padding:7px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e">⚠️ 관리자 권한으로 삭제합니다.</div>':''}<p>이 멘션을 삭제하시겠습니까?</p>`,
    danger:true,
    onOk:async()=>{
      const res=await SB.deleteMention(id);
      if(!res.ok)return;
      Toast.show('삭제되었습니다.','ok');
      Pages.mentions();
    }
  });
},



/* ── 설정 ── */
settings(){
  const w=document.getElementById('pw');
  const isAdmin=Auth._u?.role==='admin';
  const notices=App.notices;

  /* [v2.23] 3-A: 탭 구조 (기존 설정 + 사용자 관리)
     사용자 관리 탭은 관리자만 활성화 */
  const renderTab=(tab)=>{
    document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
    document.querySelectorAll('.stab-pane').forEach(p=>p.style.display=p.dataset.tab===tab?'block':'none');
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
      </table></div>
    </div>`;
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
      </table></div>
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
  </div>
  <!-- 사용자 관리 탭 (관리자만) -->
  <div class="stab-pane" data-tab="usermgmt" style="display:none">
    ${isAdmin
      ? renderUserMgmt()+renderPermTable()
      : `<div class="card" style="text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:12px">🔒</div>
          <div style="font-weight:700;margin-bottom:6px">관리자 전용 메뉴</div>
          <div style="color:var(--tm);font-size:13px">이 메뉴는 관리자만 접근할 수 있습니다.</div>
        </div>`}
  </div>`;

  /* renderTab을 전역으로 등록 */
  window.renderTab=renderTab;
},
}; /* Pages 객체 끝 */
