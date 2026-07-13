
/* [v2.111] 변경이력:
   1. setupHotkeys 중복 정의 제거 (qms-pages.js) → qms-init.js 최신 버전 사용
   2. SearchPop._cfg.equip: fields에 serial_no/purpose/cal_method/교정구분 추가, cols 확장
   3. Tbl.render eqTbl: v2.110 신규 컬럼 목록 반영 (cal_method, cal_cycle, fixture_type, purpose, purchase_date, inactive_reason)
   4. _EQUIP_COLS: 엑셀 양식 신규 컬럼 10개 추가
   5. alias 매핑 신규 컬럼 별칭 추가
   6. index.html: Search 버튼 F8→F3 표기 수정
*/
/* qms-pages.js — Pages 페이지 렌더러 [v2.65]
   v2.394→v2.395  문서관리 고도화 페이지 함수 추가 */
"use strict";


const Pages={

/* ── 홈 (메인화면) ──
   레이아웃: hw(flex row) = hw-main(카드그리드) + hw-side(멘션/공지)
   카드 클릭: mc-card-sub onclick → Nav.go(page) 직접 이동
   v2.394: C안 우측 패널 고정, 카드 높이 5배, stopPropagation 제거 */
async home(){
  const w=document.getElementById('pw');
  w.classList.add('home-mode');
  /* [v2.65] EMS 설비 데이터 캐싱 (홈 패널용) */
  if(!window._eqRows || !window._eqRows.length){
    try{ window._eqRows=await SB.getEquipment(); }catch(e){ window._eqRows=[]; }
  }
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
     subs:[{icon:'📋',label:'검사 기준서',page:'insp_std'},{icon:'📜',label:'검사 성적서',page:'insp_cert'},{icon:'🔗',label:'LOT 추적성',page:'lot_trace'},{icon:'🚫',label:'Hold 관리',page:'insp_hold'},{icon:'🔄',label:'재검사 관리',page:'insp_reinsp'}]},
    {c:'mc-c4',icon:'⭐',name:'공급업체 품질',badge:0,
     subs:[{icon:'📅',label:'심사 계획 관리',page:'sqm_plan'},{icon:'🔎',label:'업체 심사',page:'sqm_audit'},{icon:'⭐',label:'업체 평가',page:'sqm_eval'},{icon:'🚚',label:'납품 이력',page:'sqm_delivery'},{icon:'📊',label:'SQM 대시보드',page:'sqm_dash'}]},
    {c:'mc-c5',icon:'📈',name:'SPC 통계관리',badge:0,
     subs:[{icon:'📋',label:'관리 항목',page:'spc_items'},{icon:'📈',label:'관리도',page:'spc_chart'},{icon:'🎯',label:'Cp/Cpk',page:'spc_cpk'},{icon:'📊',label:'파레토 분석',page:'spc_pareto'}]},
    {c:'mc-c6',icon:'🔬',name:'계측기관리',badge:eqE,
     subs:[{icon:'🔬',label:'계측기 등록',page:'equip'},{icon:'📐',label:'교정 관리',page:'cal'},{icon:'📈',label:'MSA 분석',page:'msa'}]},
    {c:'mc-c7',icon:'📄',name:'문서관리',badge:0,
     subs:[{icon:'📊',label:'현황 대시보드',page:'doc_dashboard'},{icon:'📄',label:'문서 목록',page:'docs'},{icon:'✍️',label:'결재함',page:'doc_approval'},{icon:'🕐',label:'개정 이력',page:'doc_history_home'},{icon:'🔍',label:'지식 검색',page:'doc_search'},{icon:'📋',label:'기록 관리',page:'rec'},{icon:'💡',label:'연관 문서',page:'doc_recommend'},{icon:'📤',label:'배포 관리',page:'doc_distribution'},{icon:'🔔',label:'검토 주기',page:'doc_review_cycle'}]},
    {c:'mc-c8',icon:'🔧',name:'개선활동',badge:carO,
     subs:[{icon:'🔧',label:'시정조치(CAR)',page:'car'},{icon:'🔎',label:'내부심사',page:'audit'}]},
    /* [v2.65] 제조설비관리(EMS) 9번째 카드 */
    {c:'mc-c9',icon:'🏭',name:'제조설비관리',badge:0,
     subs:[
       {icon:'🏭',label:'설비 등록',    page:'eq_mgmt'},
       {icon:'📋',label:'예방정비(PM)', page:'eq_pm'},
       {icon:'🔧',label:'고장/AS',      page:'eq_as'},
       {icon:'📊',label:'OEE 대시보드', page:'eq_dashboard'},
       {icon:'🪪',label:'마이머신카드', page:'eq_machine_card'},
     ]},
  ];

  const cardEl=(card,idx)=>`<div class="mc-card ${card.c}" draggable="true" data-idx="${idx}" data-name="${card.name}">
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
    <!-- 좌측: 헤더 + 2×5 카드 그리드 (9장) -->
    <div class="hw-main">

      <!-- 헤더 행: 로고 | 타이틀 | 상태 | 프로필 -->
      <div class="hw-hdr">
        ${App.logo
          ?`<img class="hw-hdr-logo" src="${App.logo}" alt="INNODIS">`
          :`<span class="hw-hdr-logo-def">QMS</span>`}
        <div class="hw-hdr-center">
          <div class="hw-hdr-title">QMS 품질경영시스템</div>
          <!-- ★★★ 버전표기: 홈화면 카드 헤더 — 버전 변경 시 반드시 이 줄 수정 ★★★ -->
          <div class="hw-hdr-sub">Quality Management System · v2.182</div>
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

      <!-- 2×5 카드 그리드 (9장) -->
      <div class="mc-grid">
        ${cards.map((c,i)=>cardEl(c,i)).join('')}
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

    <!-- [v2.65] EMS 설비 현황 패널 -->
    ${(()=>{
      /* 제조설비관리 간략 현황 — 수리중/PM예정 설비 */
      const _eqWarn=(window._eqRows||[]).filter(function(e){
        return e.status==='수리중'||e.status==='점검중';
      });
      if(!_eqWarn.length) return '';
      return `<div class="hw-panel" style="border-left:3px solid #6366f1">
        <div class="hw-panel-head">
          <div class="hw-panel-title">🏭 설비 주의 현황
            <span class="badge bblu" style="margin-left:6px;font-size:10px">${_eqWarn.length}</span>
          </div>
          <span class="hw-panel-more" onclick="Nav.go('eq_mgmt')">설비관리 →</span>
        </div>
        <div class="hw-panel-body">
          ${_eqWarn.slice(0,4).map(e=>`<div class="hw-mention" onclick="Nav.go('eq_mgmt')" style="cursor:pointer">
            <span style="color:#6366f1;font-size:15px">🏭</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600">${H.e(e.name)}</div>
              <div style="font-size:11px;color:var(--tm)">${H.e(e.dept||'')} · <span style="color:#dc2626;font-weight:600">${H.e(e.status)}</span></div>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
    })()}
  </div>
  </div>`;

  /* [v2.65] 카드 순서 복원 (localStorage) */
  Pages._homeApplyCardOrder();
  /* [v2.65] 드래그앤드롭 초기화 */
  Pages._homeInitDrag();
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
  /* [v2.139] rtext→rplyText 수정 — _mentionReply가 생성하는 textarea id와 일치시킴 */
  const text=(document.getElementById('rplyText')?.value||'').trim();
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
  Toast.show('답글이 전송되었습니다.','ok');
  TopNav.updateMentionBadge();
  /* [v2.139] _mentionReplyView 미정의 → Modal 닫고 목록 새로고침 */
  Modal.close();
  const fresh=await SB.getMentions();
  if(Array.isArray(fresh)) DB.mentions=fresh;
  Pages._mentionRefresh();
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

/* [v2.128] 메뉴별 접근 권한 — 그룹 단위 전체 켜기/끄기 */
_permToggleGroup(groupIdx,role){
  const g=(window._menuGroupsRef||[])[groupIdx];
  if(!g) return;
  const chks=g.pages.map(p=>document.querySelector(`.permChk[data-page="${p.page}"][data-role="${role}"]`));
  const allOn=chks.every(c=>c&&c.checked);
  const next=!allOn;
  g.pages.forEach((p,i)=>{
    App.perms[`${p.page}_${role}`]=next;
    if(chks[i]) chks[i].checked=next;
  });
},
/* 접근 권한 저장 (sessionStorage, v2.394) */
/* [v2.394] perms 저장 — sessionStorage + SB users 테이블 */
async _savePerms(){
  try{
    const permsStr=JSON.stringify(App.perms||{});
    sessionStorage.setItem('qms_perms',permsStr);
    /* [v2.128] 전역 설정 테이블(app_settings)에 저장 — 모든 사용자/세션 공통 적용.
       기존엔 로그인한 관리자 개인의 users.perms에 저장되어 다른 사용자/세션에서
       보이지 않고, 다시 읽어오는 코드도 없어 sessionStorage만으로 동작하던 버그 수정 */
    const res=await SB.saveRolePerms(App.perms||{});
    if(!res.ok) return;
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
  w.innerHTML=`<div class="ph"><div><div class="ptit">📊 대시보드</div><div class="psub">품질경영시스템 종합 현황</div></div>
    <div class="pac">
      <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiHomeInsight()" title="AI로 품질 현황 종합 인사이트">🤖 AI 인사이트</button>
    </div></div>
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
        <div style="position:relative">
          <input class="fc" id="ivn" list="ivnList" placeholder="직접 입력 또는 목록에서 선택" 
            value="${H.e(row?.vendor_name||DB.vendors.find(v=>v.id===row?.vendor_id)?.vendor_name||'')}"
            oninput="(function(){var v=document.getElementById('ivn').value.trim();var ok=(DB.vendors||[]).some(function(x){return x.vendor_name===v;});document.getElementById('ivn').style.borderColor=ok?'var(--pri)':'';document.getElementById('ivn').style.background=ok?'#eff6ff':'';})()">
          <datalist id="ivnList">
            ${DB.vendors.map(v=>`<option value="${H.e(v.vendor_name)}">`).join('')}
          </datalist>
        </div></div>
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
    body:`
    <div style="padding:4px 0">
      <!-- 아이디 / 이름 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">
            <b style="color:#e11d48">아이디 *</b>
          </label>
          <input class="fc" id="uf_id" value="${H.e(row?.username||'')}" ${e?'readonly':''} placeholder="영문/숫자 조합" style="background:${e?'var(--bg2)':''}">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">
            <b style="color:#e11d48">이름 *</b>
          </label>
          <input class="fc" id="uf_name" value="${H.e(row?.name||'')}">
        </div>
      </div>
      <!-- 비밀번호 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">
            ${!e?'<b style="color:#e11d48">비밀번호 *</b>':'<span>비밀번호</span>'}
          </label>
          <input class="fc" id="uf_pw" type="password" placeholder="${e?'변경 시만 입력 (8자 이상)':'8자 이상 입력'}">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">
            ${!e?'<b style="color:#e11d48">비밀번호 확인 *</b>':'<span>비밀번호 확인</span>'}
          </label>
          <input class="fc" id="uf_pw2" type="password" placeholder="${e?'변경 시만 입력':''}">
        </div>
      </div>
      <!-- 서명 이미지 [v2.145] — 향후 출력물 결재란에 사용 -->
      <div style="margin-bottom:12px">
        <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">서명 이미지 <span style="font-size:10px;color:var(--tm);font-weight:400">(결재란 출력용)</span></label>
        <div style="display:flex;align-items:center;gap:10px">
          ${row?.signature_url
            ?`<img src="${H.e(row.signature_url)}" alt="서명" style="height:44px;max-width:120px;object-fit:contain;border:1px solid var(--brd);border-radius:6px;background:#fff;padding:2px">
               <button type="button" class="btn bxs bred bsm" onclick="window._sigDel=true;this.previousElementSibling.style.opacity='0.3';this.nextElementSibling.textContent='(삭제 예정)'">🗑️ 삭제</button>
               <span style="font-size:11px;color:var(--err)"></span>`
            :'<span style="font-size:12px;color:var(--tm)">등록된 서명 없음</span>'}
          <label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px dashed var(--brd);border-radius:6px;cursor:pointer;font-size:12px;color:var(--muted)">
            🖊️ 이미지 선택<input type="file" id="uf_sig" accept="image/png,image/jpeg,image/jpg" style="display:none"
              onchange="this.closest('div').nextElementSibling?.remove();var n=document.createElement('span');n.style.cssText='font-size:11px;color:var(--pri);margin-left:4px';n.textContent=this.files[0]?.name||'';this.closest('label').insertAdjacentElement('afterend',n)">
          </label>
        </div>
      </div>
      <!-- 부서 / 연락처 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">부서</label>
          <input class="fc" id="uf_dept" value="${H.e(row?.department||'')}" placeholder="예) 품질팀">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">연락처</label>
          <input class="fc" id="uf_tel" value="${H.e(row?.tel||'')}" placeholder="010-0000-0000">
        </div>
      </div>
      <!-- E-MAIL / 권한 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">E-MAIL</label>
          <input class="fc" id="uf_email" type="email" value="${H.e(row?.email||'')}" placeholder="example@company.com">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">
            <b style="color:#e11d48">권한 *</b>
          </label>
          <select class="fc" id="uf_role">
            ${['admin','manager','user','viewer'].map(r=>`<option value="${r}"${(row?.role||'user')===r?' selected':''}>${{admin:'관리자',manager:'매니저',user:'사용자',viewer:'뷰어'}[r]}</option>`).join('')}
          </select>
        </div>
      </div>
      <!-- 상태 (수정 시만) -->
      ${e?`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">상태</label>
          <select class="fc" id="uf_active">
            <option value="1" ${!row||row.active?'selected':''}>활성</option>
            <option value="0" ${row&&!row.active?'selected':''}>비활성</option>
          </select>
        </div>
        <div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">등록일</label>
          <input class="fc" value="${H.e(row?.created_at||today)}" readonly style="background:var(--bg2)">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px">수정일</label>
          <input class="fc" value="${today}" readonly style="background:var(--bg2)">
        </div>
      </div>`:''}
      <div style="font-size:11px;color:#94a3b8;margin-top:10px"><b style="color:#e11d48">*</b> 표시는 필수 항목입니다.</div>
    </div>`,
        foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          ${e&&Auth._u?.role==='admin'?`<button class="btn bamb bsm" onclick="Pages._uResetPw(${row.id},'${H.e(row.username)}')" title="비밀번호 랜덤 초기화 (관리자 전용)">🔑 비밀번호 초기화</button> <button class="btn berr bsm" onclick="Modal.close();Pages._uDelete(${row.id})" title="사용자 삭제">🗑️ 삭제</button>`:''}
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
  const roleVal = document.getElementById('uf_role')?.value || (id ? undefined : 'user');
  /* [v2.145] 서명 이미지 업로드/삭제 처리 */
  let signature_url=id?(DB.users.find(u=>u.id===id)?.signature_url||null):null;
  if(window._sigDel){signature_url=null;window._sigDel=false;}
  const sigEl=document.getElementById('uf_sig');
  if(sigEl?.files?.length){
    const up=await SB.uploadFile('signature',sigEl.files[0]);
    if(up?.url) signature_url=up.url;
    else Toast.show('서명 이미지 업로드 실패. 다른 정보는 저장됩니다.','warn');
  }
  const row={
    username:uid, name,
    department:g('uf_dept'), tel:g('uf_tel'), email,
    /* [v2.65 fix S3] roleVal 우선 적용, 기존값 fallback */
    role: roleVal || (id ? (DB.users.find(u=>u.id===id)?.role||'user') : 'user'),
    active:Number(document.getElementById('uf_active')?.value||1),
    signature_url,
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
/* ── 검사 5종 진입점 ──────────────────────────────────────────
   Nav.go('insp_in') → Pages.insp_in() → this._insp('insp_in')
   ─────────────────────────────────────────────────────────────── */
insp_in(){this._insp('insp_in')},  /* 수입검사 */
insp_pr(){this._insp('insp_pr')},  /* 공정검사 */
insp_pu(){this._insp('insp_pu')},  /* 구매검사 */
insp_ou(){this._insp('insp_ou')},  /* 외주검사 */
insp_fi(){this._insp('insp_fi')},  /* 최종검사 */

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

  /* [v2.135] 최초/최근 검사일 — 검사일(insp_date) 기준 */
  const dateRange=(()=>{
    if(!data.length) return null;
    const dates=data.map(r=>r.insp_date).filter(Boolean).sort();
    if(!dates.length) return null;
    return {first:dates[0].slice(0,10), last:dates[dates.length-1].slice(0,10)};
  })();

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
  ${dateRange?`<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
    <div style="font-size:11px;color:var(--tm);background:var(--bg2);border:1px solid var(--bd);border-radius:6px;padding:4px 10px;line-height:1.7;text-align:right">
      <div>최초 검사일: <b style="color:var(--tx)">${dateRange.first}</b></div>
      <div>최근 검사일: <b style="color:var(--tx)">${dateRange.last}</b></div>
    </div>
  </div>`:''}
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

/* ════════════════════════════════════════════════════════════════
   quality_dash — 품질현황 대시보드
   ▶ 검사 5종 합계 stat-dash + 유형별 선택 버튼 + miniBar + bigChart
   ▶ state: {types, from, to} → Pages._qdashState로 외부 접근 가능
   ▶ render: 공통 렌더 함수 → Pages._qdashRender로 외부 접근 가능
   ════════════════════════════════════════════════════════════════ */
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
        <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiQualityDash()" title="AI로 품질 현황 종합 분석">🤖 AI 분석</button>
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
_qdashExcel(){
  /* [v2.65 Q7] SheetJS 실제 엑셀 생성 */
  var rows=DB.inspections||[];
  if(!rows.length){Toast.show('내보낼 검사 데이터가 없습니다.','warn');return;}
  var header=['유형','LOT번호','품목코드','품목명','검사일','검사수량','합격수량','불량수량','불량률(%)','결과','검사자','비고'];
  var data=[header].concat(rows.map(function(r){
    var rate=r.qty>0?+(r.fail_qty/r.qty*100).toFixed(2):0;
    return[r.type||'',r.lot_no||'',r.item_code||'',r.item_name||r.item||'',
      r.insp_date||'',r.qty||0,r.pass_qty||0,r.fail_qty||0,rate,r.result||'',r.inspector||'',r.note||''];
  }));
  try{
    var wb=XLSX.utils.book_new();
    var ws=XLSX.utils.aoa_to_sheet(data);
    /* 열 너비 */
    ws['!cols']=[{wch:8},{wch:16},{wch:12},{wch:20},{wch:12},{wch:10},{wch:10},{wch:10},{wch:10},{wch:8},{wch:10},{wch:16}];
    XLSX.utils.book_append_sheet(wb,ws,'품질현황');
    XLSX.writeFile(wb,'품질현황_'+H.today().replace(/-/g,'')+'.xlsx');
    Toast.show('엑셀 파일이 다운로드됩니다.','ok');
  }catch(e){Toast.show('엑셀 생성 실패: '+e.message,'err');}
},

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
        <button class="btn btn-xl-down bsm" onclick="Pages._ncExcelDown()" title="엑셀 양식 내려받기">📥 양식</button>
        <button class="btn btn-xl-up bsm" onclick="Pages._ncExcelUp()" title="엑셀 일괄등록">📤 일괄등록</button>
        <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiNcAnalyze()" title="AI로 부적합 패턴 분석">🤖 AI 분석</button>
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
      /* [v2.65 Q6] 컬럼 순서: 사내외→번호→발생일→검사자→유형→고객사→귀책처→작업지시→품목코드→품목명→검사수량→양품수량→불량수량→부적합률→내용→원인→조치→담당자→처리기한→상태→비고→파일 */
      {key:'in_out',        label:'사내외',     w:'56px',req:true,
        render:function(v){return'<span class="badge '+(v==='사외'?'bblu':'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
      {key:'no',            label:'부적합번호', w:'138px',req:true,
        render:function(v){return'<span style="font-family:monospace;font-size:11px;font-weight:600;color:#1e293b">'+H.e(v||'-')+'</span>';}},
      {key:'date',          label:'발생일',     w:'90px'},
      {key:'inspector',     label:'검사자',     w:'68px'},
      {key:'type',          label:'유형',       w:'58px',req:true,
        render:function(v){return'<span class="badge bblu" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
      {key:'customer',      label:'고객사',     w:'88px'},
      {key:'responsible',   label:'귀책처',     w:'80px'},
      {key:'work_order_no', label:'작업지시번호',w:'110px'},
      {key:'item_code',     label:'품목코드',   w:'90px',req:true,
        render:function(v){return v?'<span style="font-family:monospace;font-size:11px;color:#64748b">'+H.e(v)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'item',          label:'품목명',     w:'110px'},
      {key:'insp_qty',      label:'검사수량',   w:'70px',align:'right',
        render:function(v){return v?H.n(v):'<span style="color:var(--tl)">-</span>';}},
      {key:'pass_qty',      label:'양품수량',   w:'70px',align:'right',
        render:function(v){return v?H.n(v):'<span style="color:var(--tl)">-</span>';}},
      {key:'bad_qty',       label:'불량수량',   w:'70px',align:'right',
        render:function(v){return v?'<span style="color:#dc2626;font-weight:500">'+H.n(v)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'nc_rate',       label:'부적합률',   w:'72px',align:'right',
        render:function(v,row){
          var r=(row.insp_qty&&row.bad_qty)?+(row.bad_qty/row.insp_qty*100).toFixed(1):null;
          if(r===null) return '<span style="color:var(--tl)">-</span>';
          var cls=r>=5?'bred':r>=2?'bamb':'bgrn';
          return'<span class="badge '+cls+'" style="font-size:10px">'+r.toFixed(1)+'%</span>';
        }},
      {key:'desc',          label:'내용(불량유형)', w:'*'},
      {key:'cause',         label:'원인',       w:'100px'},
      {key:'action',        label:'조치',       w:'100px'},
      {key:'assignee',      label:'담당자',     w:'68px'},
      {key:'due_date',      label:'처리기한',   w:'88px',
        render:function(v){
          if(!v) return '<span style="color:var(--tl)">-</span>';
          var d=Math.ceil((new Date(v)-new Date())/864e5);
          var cls=d<0?'bred':d<=3?'bamb':'bgrn';
          return'<span class="badge '+cls+'" style="font-size:10px">'+v+'</span>';
        }},
      {key:'status',        label:'상태',       w:'62px',
        render:function(v){return'<span class="badge '+(v==='완료'?'bgrn':v==='처리중'?'bamb':'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
      {key:'note',          label:'비고',       w:'90px'},
      {key:'id',            label:'파일',       w:'46px',
        render:function(v,row){return row.file_url?'<a href="'+H.e(row.file_url)+'" target="_blank" style="font-size:14px">📎</a>':'<span style="color:var(--tl)">-</span>';}},
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
  /* [v2.65 Q2+Q3+Q4] 담당자→DB.users select / 품목코드→datalist 자연어 검색 / 품목명 자동완성 */
  const isEdit=!!row;
  const nextNo=Pages._ncNextNo?Pages._ncNextNo():'NC-'+H.today().replace(/-/g,'')+'-001';
  const userOpts=(DB.users||[]).filter(function(u){return u.active!==false;}).map(function(u){
    var sel=(isEdit&&row.assignee===u.username)||(!isEdit&&Auth._u?.username===u.username)?'selected':'';
    return'<option value="'+H.e(u.username)+'" '+sel+'>'+H.e(u.name||u.username)+(u.department?' ('+H.e(u.department)+')':'')+'</option>';
  }).join('');
  const itemDatalist=(DB.items||[]).map(function(it){
    return'<option value="'+H.e(it.item_code||it.code||'')+'">'+H.e((it.item_code||it.code||'')+' — '+(it.name||it.item_name||''))+'</option>';
  }).join('');
  Modal.open({
    title:isEdit?`✏️ 부적합 수정 — ${row.no}`:'+ 부적합 등록',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri btn-f8" onclick="Pages._ncSave()">저장 <span class="kbd">F8</span></button>',
    body:`<div class="fg2">
      <div class="fgroup">
        <label class="fl">부적합번호</label>
        <input class="fc" id="ncNo" value="${H.e(isEdit?row.no:nextNo)}" ${isEdit?'readonly':''}>
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">사내외 *</b></label>
        <select class="fc" id="ncInOut">
          <option value="">선택</option>
          <option value="사내" ${isEdit&&row.in_out==='사내'?'selected':''}>사내</option>
          <option value="사외" ${isEdit&&row.in_out==='사외'?'selected':''}>사외</option>
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">발생 유형 *</b></label>
        <select class="fc" id="ncType">
          <option value="">선택</option>
          ${['수입','공정','구매','외주','최종','고객'].map(function(t){return'<option value="'+t+'" '+(isEdit&&row.type===t?'selected':'')+'>'+t+'검사</option>';}).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">발생일 *</b></label>
        <input class="fc" type="date" id="ncDate" value="${isEdit?H.e(row.date||''):H.today()}">
      </div>
      <div class="fgroup">
        <label class="fl">검사자 <span style="font-size:10px;color:var(--tm)">직접입력 또는 목록에서 선택</span></label>
        <input class="fc" id="ncInspector" list="ncInspList"
          value="${H.e(isEdit?row.inspector||'':'')}"
          placeholder="이름 입력 또는 선택...">
        <datalist id="ncInspList">${(DB.users||[]).filter(function(u){return u.active!==false;}).map(function(u){
          return'<option value="'+H.e(u.name||u.username)+'">'+(u.department?H.e(u.department):'')+'</option>';
        }).join('')}</datalist>
      </div>
      <div class="fgroup">
        <label class="fl"><b style="color:#e11d48">담당자 *</b> <span style="font-size:10px;color:var(--tm)">직접입력 또는 목록에서 선택</span></label>
        <input class="fc" id="ncAssignee" list="ncAssignList"
          value="${H.e(isEdit?row.assignee||'':'')}"
          placeholder="담당자 이름 입력 또는 선택...">
        <datalist id="ncAssignList">${(DB.users||[]).filter(function(u){return u.active!==false;}).map(function(u){
          return'<option value="'+H.e(u.name||u.username)+'">'+(u.department?H.e(u.department):'')+'</option>';
        }).join('')}</datalist>
      </div>
      <div class="fgroup">
        <label class="fl">고객사</label>
        <input class="fc" id="ncCustomer" value="${H.e(isEdit?row.customer||'':'')}" placeholder="예) ㈜대한전자">
      </div>
      <div class="fgroup">
        <label class="fl">귀책처</label>
        <input class="fc" id="ncResponsible" value="${H.e(isEdit?row.responsible||'':'')}" placeholder="예) ㈜부품공급사">
      </div>
      <div class="fgroup">
        <label class="fl">작업지시번호</label>
        <input class="fc" id="ncWorkOrder" value="${H.e(isEdit?row.work_order_no||'':'')}" placeholder="예) WO-20260608-001">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">처리기한 *</b></label>
        <input class="fc" type="date" id="ncDue" value="${isEdit?H.e(row.due_date||''):H.addDays(H.today(),7)}">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req"><b style="color:#e11d48">품목코드 *</b> <span style="font-size:10px;color:var(--tm)">직접 입력 또는 검색</span></label>
        <input class="fc" id="ncItemCode" list="ncItemList"
          value="${H.e(isEdit?row.item_code||'':'')}"
          placeholder="코드 또는 품목명으로 검색..."
          oninput="(function(){var v=document.getElementById('ncItemCode').value.split(' — ')[0].trim();var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||'')===(v);});if(it){document.getElementById('ncItem').value=it.name||it.item_name||'';document.getElementById('ncItem').style.color='var(--pri)';}else{document.getElementById('ncItem').value='';document.getElementById('ncItem').style.color='';}})()"
          onblur="(function(){var v=document.getElementById('ncItemCode').value.split(' — ')[0].trim();if(!v)return;var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||'')===(v);});if(!it&&v)Toast.show('미등록 품목코드입니다. 기준정보 > 품목 등록에서 신규 등록하세요.','warn');})()">
        <datalist id="ncItemList">${itemDatalist}</datalist>
      </div>
      <div class="fgroup">
        <label class="fl">품목명 <span style="font-size:10px;color:var(--tm)">자동완성</span></label>
        <input class="fc" id="ncItem" value="${H.e(isEdit?row.item||'':'')}" placeholder="품목코드 입력 시 자동 입력" style="background:var(--bg2)">
      </div>
      <div class="fgroup">
        <label class="fl">검사수량</label>
        <input class="fc" type="number" id="ncInspQty" value="${isEdit?row.insp_qty||'':''}" placeholder="0"
          oninput="Pages._ncCalcRate()">
      </div>
      <div class="fgroup">
        <label class="fl">양품수량</label>
        <input class="fc" type="number" id="ncPassQty" value="${isEdit?row.pass_qty||'':''}" placeholder="0"
          oninput="Pages._ncCalcRate()">
      </div>
      <div class="fgroup">
        <label class="fl">불량수량</label>
        <input class="fc" type="number" id="ncBadQty" value="${isEdit?row.bad_qty||'':''}" placeholder="0"
          oninput="Pages._ncCalcRate()">
      </div>
      <div class="fgroup">
        <label class="fl">부적합률 <span style="font-size:10px;color:var(--tm)">자동계산</span></label>
        <input class="fc" id="ncRate" readonly style="background:var(--bg2);color:#dc2626;font-weight:500" placeholder="—">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req"><b style="color:#e11d48">내용 (불량 유형) *</b></label>
        <textarea class="fc" id="ncDesc" rows="2" placeholder="불량 유형 및 내용 입력">${H.e(isEdit?row.desc||'':'')}</textarea>
      </div>
      <div class="fgroup">
        <label class="fl">원인</label>
        <input class="fc" id="ncCause" value="${H.e(isEdit?row.cause||'':'')}" placeholder="원인 입력">
      </div>
      <div class="fgroup">
        <label class="fl">조치</label>
        <input class="fc" id="ncAction" value="${H.e(isEdit?row.action||'':'')}" placeholder="조치 내용 입력">
      </div>
      <div class="fgroup">
        <label class="fl">상태</label>
        <select class="fc" id="ncStatus">
          ${['접수','처리중','완료'].map(function(s){return'<option value="'+s+'" '+(isEdit&&row.status===s?'selected':'')+'>'+s+'</option>';}).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl">비고</label>
        <input class="fc" id="ncNote" value="${H.e(isEdit?row.note||'':'')}" placeholder="비고">
      </div>
      <div class="fgroup ff">
        <label class="fl">첨부파일</label>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${isEdit&&row.file_url
            ?`<a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 현재 파일 보기</a>
               <button type="button" class="btn bxs bred bsm" onclick="window._ncFileDel=true;this.parentNode.querySelector('.nc-fn').textContent='(삭제 예정)';this.style.display='none'">🗑️ 삭제</button>`
            :''}
          <label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px dashed var(--bd);border-radius:6px;cursor:pointer;font-size:12px;color:var(--tm)">
            📁 파일 선택<input type="file" id="ncFile" accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.zip" style="display:none">
          </label>
          <span class="nc-fn" style="font-size:11px;color:var(--tm)"></span>
        </div>
      </div>
    </div>`
  });
  /* 초기 부적합률 계산 */
  if(isEdit&&row.insp_qty&&row.bad_qty) Pages._ncCalcRate();
},
_ncCalcRate:function(){
  var insp=parseFloat(document.getElementById('ncInspQty')?.value)||0;
  var bad =parseFloat(document.getElementById('ncBadQty')?.value)||0;
  var el  =document.getElementById('ncRate');
  if(!el) return;
  if(insp>0&&bad>=0){el.value=(bad/insp*100).toFixed(1)+'%';}
  else{el.value='';}
},

/* ── 부적합 저장 [v2.394] ── */
async _ncSave(){
  /* [v2.75] 파일 업로드 처리 */
  let _ncFileUrl=null;
  const _ncFEl=document.getElementById('ncFile');
  if(_ncFEl?.files?.length>0){
    const up=await SB.uploadFile('nc',_ncFEl.files[0]);
    if(up?.url)_ncFileUrl=up.url;
    else Toast.show('파일 업로드 실패. 저장은 계속됩니다.','warn');
  }
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
    if(_ncFileUrl)row.file_url=_ncFileUrl;
    else if(window._ncFileDel){row.file_url='';window._ncFileDel=false;}
    const res=await SB.updateNc(editId,row);
    if(!res?.ok) return;
    const idx=DB.nc.findIndex(n=>n.id===editId);
    if(idx>=0) DB.nc[idx]={...DB.nc[idx],...row};
    Toast.show('부적합이 수정되었습니다.','ok');
  } else {
    /* 신규 */
    row.created_at=H.today();
    if(_ncFileUrl)row.file_url=_ncFileUrl;
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

  /* 연계된 CAR 있는지 확인 */
  const linkedCar=(DB.cars||[]).filter(c=>c.nc_id===row.id||c.nc_no===row.no);

  window._ncRow=row;
  Modal.open({
    title:`⚠️ 부적합 상세 — ${H.e(row.no||'-')}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bgh bsm" onclick="Pages._ncPrint(window._ncRow)">🖨️ 인쇄</button>`
        +`<button class="btn bgh" onclick="Modal.close();Pages._ncForm(window._ncRow)">✏️ 수정</button>`
        +`<button class="btn bamb" onclick="Modal.close();Pages._carForm(null,{nc_id:window._ncRow.id,nc_no:window._ncRow.no,title:window._ncRow.desc||window._ncRow.title||'',item_code:window._ncRow.item_code||'',item:window._ncRow.item||''})">🔧 CAR 발행</button>`
        +`<button class="btn bpri" onclick="Pages._ncStatusChange(window._ncRow?.id)">🔄 상태 변경</button>`,
    body:`
      <div class="psteps">${stBar}</div>
      ${linkedCar.length?`<div style="background:#ede9fe;border-radius:8px;padding:8px 12px;margin:10px 0;font-size:13px">
        🔧 연계 CAR: ${linkedCar.map(c=>`<span style="font-family:monospace;font-weight:700;color:#7c3aed;cursor:pointer" onclick="Modal.close();Nav.go('car')">${H.e(c.no)}</span> <span class="badge ${c.status==='완료'?'bgrn':'bamb'}" style="font-size:10px">${H.e(c.status)}</span>`).join(' / ')}
      </div>`:''}
      <div class="card" style="margin:12px 0;padding:14px 18px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div class="ir"><div class="il">부적합번호</div>
            <div class="iv" style="font-family:monospace;font-weight:700;font-size:13px">${H.e(row.no||'-')}</div></div>
          <div class="ir"><div class="il">유형</div>
            <div class="iv"><span class="badge bblu">${H.e(row.type||'-')}</span></div></div>
          <div class="ir"><div class="il">발생일</div>
            <div class="iv">${H.e(row.date||'-')}</div></div>
          <div class="ir"><div class="il">처리기한</div>
            <div class="iv">${H.e(row.due_date||'-')}${dday}</div></div>
          <div class="ir"><div class="il">품목코드</div>
            <div class="iv" style="font-family:monospace;font-size:13px">${H.e(row.item_code||'-')}</div></div>
          <div class="ir"><div class="il">품목명</div>
            <div class="iv">${H.e(row.item||'-')}</div></div>
          <div class="ir"><div class="il">수량</div>
            <div class="iv">${row.insp_qty?H.n(row.insp_qty)+'개 검사 / 불량 '+H.n(row.bad_qty||0)+'개':'-'}</div></div>
          <div class="ir"><div class="il">담당자</div>
            <div class="iv">${H.e(row.assignee||'-')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">부적합 내용</div>
            <div class="iv">${H.e(row.desc||'-')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">원인 분석</div>
            <div class="iv">${H.e(row.cause||'미작성')}</div></div>
          <div class="ir" style="grid-column:1/-1"><div class="il">조치 내용</div>
            <div class="iv">${H.e(row.action||'미작성')}</div></div>
          <div class="ir"><div class="il">등록자</div>
            <div class="iv">${H.e(row.created_by||'-')}</div></div>
          ${row.file_url?`<div class="ir"><div class="il">첨부파일</div>
            <div class="iv"><a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 파일 보기</a></div></div>`:''}
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
  /* [v2.107] DB.nc 의존 제거 → window._ncRow 직접 사용 */
  const nc=window._ncRow;
  if(!nc){Toast.show('데이터를 찾을 수 없습니다.','err');return;}
  const steps=['접수','처리중','완료'];
  const cur=steps.indexOf(nc.status||'접수');
  const next=steps[(cur+1)%steps.length];
  Modal.confirm({
    title:'상태 변경',
    msg:`"${H.e(nc.no||'-')}" 상태를 <strong>${nc.status||'접수'}</strong> → <strong>${next}</strong>으로 변경하시겠습니까?`,
    onOk:async()=>{
      const res=await SB.updateNc(nc.id,{status:next});
      if(!res?.ok){Toast.show('상태 변경 실패','err');return;}
      window._ncRow={...nc,status:next};
      Modal.close();
      Toast.show(`상태가 "${next}"으로 변경되었습니다.`,'ok');
      Pages._ncRender();
    }
  });
},


/* ── 계측기 ── */
/* ══════════════════════════════════════════════════════
   [v2.394] 계측기 전용 업로드 — 재설계 (단순 3단계)
   1. _equipUploadOpen(): 팝업 + 양식 다운로드
   2. _equipParseFile(): 파일 읽기 → 미리보기
   3. _equipDoUpload(): DB 저장
   ══════════════════════════════════════════════════════ */

/* 컬럼 정의 — 단일 소스 (이 배열만 수정하면 모두 반영) */
_EQUIP_COLS:[
  {key:'code',          label:'계측기코드', req:true,  sample:'EQ-001'},
  {key:'name',          label:'계측기명',   req:true,  sample:'디지털버니어캘리퍼스'},
  {key:'model',         label:'모델번호',   req:false, sample:'CD-20APX'},
  {key:'serial_no',     label:'제조번호',   req:false, sample:'B16013027'},       /* [v2.111] */
  {key:'maker',         label:'제조사',     req:false, sample:'미쓰토요'},
  {key:'range',         label:'측정범위',   req:false, sample:'0~200mm'},
  {key:'res',           label:'분해능',     req:false, sample:'0.01mm'},
  {key:'loc',           label:'보관위치',   req:false, sample:'품질실'},
  {key:'operator',      label:'사용자',     req:false, sample:'홍길동'},
  {key:'last',          label:'최근교정일', req:false, sample:'2026-01-01'},
  {key:'next',          label:'차기교정일', req:false, sample:'2026-07-01'},
  {key:'active',        label:'사용여부',   req:false, sample:'사용'},
  {key:'fixture_type',  label:'계측기구분',   req:false, sample:'측정기기'},          /* [v2.111] */
  {key:'purpose',       label:'사용용도',   req:false, sample:'외경,내경,깊이'},    /* [v2.111] */
  {key:'cal_method',    label:'교정구분',   req:false, sample:'사외교정'},          /* [v2.111] */
  {key:'cal_cycle',     label:'교정주기(년)',req:false, sample:'1'},                /* [v2.111] */
  {key:'purchase_date', label:'구입일',     req:false, sample:'2020-03-15'},        /* [v2.111] */
  {key:'purchase_cost', label:'구입가격',   req:false, sample:'350000'},            /* [v2.111] */
  {key:'inactive_reason',label:'불용사유',  req:false, sample:''},                 /* [v2.111] */
  {key:'accessories',   label:'부속장비',   req:false, sample:'케이스,충전기'},     /* [v2.111] */
  {key:'note',          label:'비고',       req:false, sample:''},
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
    '제조번호':'serial_no','시리얼':'serial_no','S/N':'serial_no',      /* [v2.111] */
    'D_제조번호':'serial_no',
    '제조사':'maker','메이커':'maker','Maker':'maker',
    'E_제조사':'maker',
    '측정범위':'range','범위':'range','Range':'range',
    'F_측정범위':'range',
    '분해능':'res','해상도':'res','Res':'res',
    'G_분해능':'res',
    '보관위치':'loc','위치':'loc','장소':'loc',
    'H_보관위치':'loc',
    '사용자':'operator','담당자':'operator','사용부서':'operator',
    'I_사용자':'operator',
    '최근교정일':'last','교정일':'last','직전교정일':'last',
    'J_최근교정일':'last',
    '차기교정일':'next','다음교정일':'next','예정교정일':'next',
    'K_차기교정일':'next',
    '사용여부':'active','활성여부':'active',
    'L_사용여부':'active',
    '계측기구분':'fixture_type','구분':'fixture_type',                      /* [v2.111] */
    '사용용도':'purpose','용도':'purpose',                                /* [v2.111] */
    '교정구분':'cal_method','교정방법':'cal_method',                      /* [v2.111] */
    '교정주기':'cal_cycle','교정주기(년)':'cal_cycle',                    /* [v2.111] */
    '구입일':'purchase_date','구매일':'purchase_date',                    /* [v2.111] */
    '구입가격':'purchase_cost','구매가격':'purchase_cost','가격':'purchase_cost', /* [v2.111] */
    '불용사유':'inactive_reason','사용무_사유':'inactive_reason',         /* [v2.111] */
    '부속장비':'accessories','부속품':'accessories',                      /* [v2.111] */
    '비고':'note','특이사항':'note',
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
      <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiEquipAnalyze()" title="AI로 계측기 교정 현황 분석">🤖 AI 분석</button>
      <button class="btn bpri btn-f2" onclick="Pages._equipCalForm()">+ 계측기 등록 <span class="kbd">F2</span></button>
      <button class="btn btn-xl-up bpri" onclick="Pages._equipUploadOpen()" title="계측기 엑셀 일괄등록">📤 엑셀 일괄등록</button>
      <button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._eqPrint()" title="계측기 관리대장 인쇄">🖨️ 관리대장 인쇄</button>
    </div></div>
    <div class="tbar" style="flex-wrap:wrap;gap:6px;align-items:center">
      <!-- ★ [v2.113] F3 의존 제거: 인라인 필터 드롭다운 방식으로 교체 ★ -->
      <div class="sw2"><input type="text" id="eqSrch" placeholder="코드·계측기명·제조사 검색..." oninput="Pages._equipMsaFilter()"></div>
      <select class="fsel" id="eqFixType" onchange="Pages._equipMsaFilter()" title="계측기구분"><option value="">계측기구분 전체</option><option>측정기기</option><option>시험기기</option><option>검사기기</option><option>기타</option></select>
      <select class="fsel" id="eqCalM" onchange="Pages._equipMsaFilter()" title="교정구분"><option value="">교정구분 전체</option><option>사내교정</option><option>사외교정</option></select>
      <select class="fsel" id="eqStat" onchange="Pages._equipMsaFilter()" title="상태"><option value="">상태 전체</option><option>정상</option><option>교정중</option><option>교정만료</option><option>폐기</option></select>
      <span style="font-size:11px;color:var(--tm);white-space:nowrap">최근교정일</span>
      <input type="date" class="fsel" id="eqLastFrom" onchange="Pages._equipMsaFilter()" style="width:120px" title="최근교정일 시작">
      <span style="font-size:11px;color:var(--tm)">~</span>
      <input type="date" class="fsel" id="eqLastTo"   onchange="Pages._equipMsaFilter()" style="width:120px" title="최근교정일 종료">
      <span style="font-size:11px;color:var(--tm);white-space:nowrap">차기교정일</span>
      <input type="date" class="fsel" id="eqNextFrom" onchange="Pages._equipMsaFilter()" style="width:120px" title="차기교정일 시작">
      <span style="font-size:11px;color:var(--tm)">~</span>
      <input type="date" class="fsel" id="eqNextTo"   onchange="Pages._equipMsaFilter()" style="width:120px" title="차기교정일 종료">
      <button class="btn bout bsm" onclick="Pages._equipMsaFilterReset()" title="필터 초기화">↺ 초기화</button>
    </div>
    <div id="eqTbl"></div>`;
  /* [v2.113] 컬럼 정의 단일화 — _equipMsaRender() 한 곳에서 관리 */
  Pages._equipMsaRender(DB.equip);
},
/* [v2.114] 구버전 _equipMsaDetail 제거, _equipMsaForm 연결 */
_equipMsaForm(row=null){
  window._efFileDeleted=false;
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
      /* [v2.110] 계측기 이력카드용 11개 필드 추가 */
      +'<div class="fgroup"><label class="fl">계측기구분</label>'
      +'<input id="ef_fixture_type" class="fc" value="'+H.e(row?.fixture_type||'')+'" placeholder="측정기기"></div>'
      +'<div class="fgroup"><label class="fl">Code_No</label>'
      +'<input id="ef_code_no" class="fc" value="'+H.e(row?.code_no||'')+'" placeholder="500-182-30"></div>'
      +'<div class="fgroup"><label class="fl">제조번호</label>'
      +'<input id="ef_serial_no" class="fc" value="'+H.e(row?.serial_no||'')+'" placeholder="B16013027"></div>'
      +'<div class="fgroup"><label class="fl">사용용도</label>'
      +'<input id="ef_purpose" class="fc" value="'+H.e(row?.purpose||'')+'" placeholder="외경, 내경, 깊이"></div>'
      +'<div class="fgroup"><label class="fl">교정구분</label>'
      +'<select id="ef_cal_method" class="fc">'
      +'<option value=""'+optSel(!row?.cal_method)+'>선택</option>'
      +'<option value="사내교정"'+optSel(row?.cal_method==='사내교정')+'>사내교정</option>'
      +'<option value="사외교정"'+optSel(row?.cal_method==='사외교정')+'>사외교정</option>'
      +'</select></div>'
      +'<div class="fgroup"><label class="fl">교정주기(년)</label>'
      +'<input id="ef_cal_cycle" class="fc" type="number" step="0.5" value="'+H.e(row?.cal_cycle||'')+'" placeholder="1"></div>'
      +'<div class="fgroup"><label class="fl">구입일</label>'
      +'<input id="ef_purchase_date" class="fc" type="date" value="'+H.e(row?.purchase_date||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">구입가격</label>'
      +'<input id="ef_purchase_cost" class="fc" type="number" value="'+H.e(row?.purchase_cost||'')+'" placeholder="0"></div>'
      +'<div class="fgroup"><label class="fl">사용무_사유</label>'
      +'<input id="ef_inactive_reason" class="fc" value="'+H.e(row?.inactive_reason||'')+'" placeholder="불용 시 사유"></div>'
      +'<div class="fgroup ff"><label class="fl">부속장비</label>'
      +'<input id="ef_accessories" class="fc" value="'+H.e(row?.accessories||'')+'" placeholder="케이스, 충전기 등"></div>'
      +'<div class="fgroup ff"><label class="fl">특이사항</label>'
      +'<input id="ef_note" class="fc" value="'+H.e(row?.note||'')+'" placeholder="특이사항 메모"></div>'
      +'<div class="fgroup" style="grid-column:1/-1">'
      +'<label class="fl">첨부파일 <span style="font-size:10px;color:var(--tm)">(PDF·이미지·문서)</span></label>'
      +'<input class="fc" type="file" id="eqFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">'
      +(row&&row.file_url
        ?'<div style="margin-top:5px;font-size:12px;display:flex;align-items:center;gap:8px" id="efFileWrap">'
          +'<span style="color:var(--tm)">현재 파일:</span>'
          +'<a href="'+H.e(row.file_url)+'" target="_blank" style="color:#2563eb">📎 파일 보기</a>'
          +'<button type="button" class="btn bxs berr" style="font-size:10px;padding:2px 8px" onclick="Pages._equipMsaFileDelete()">🗑️ 삭제</button>'
          +'</div>'
        :'')
      +'</div></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
      +'<button class="btn bpri" id="ef_ok">'+(isEdit?'💾 수정':'✅ 등록')+'</button>',
  });
  setTimeout(()=>{const b=document.getElementById('ef_ok');if(b)b.onclick=()=>Pages._equipMsaSave(row||null);},50);
},
/* [v2.123] 계측기(MSA) 저장 — _equipMsaForm이 잘못 EMS의 _eqSave를 호출하던 버그 수정.
   _eqSave는 SB.updateEquipment/addEquipment(제조설비 전용, efName/efDept 등 id 기대)를
   호출하는 함수라 계측기 폼의 ef_name/ef_code 같은 id와 전혀 매칭되지 않았음
   (그래서 항상 "설비명을 입력하세요" 오류). SB.addEquip/updateEquip(계측기 전용,
   code/name/loc/operator/fixture_type 등 허용 컬럼)을 호출하도록 신규 작성 */
async _equipMsaSave(row){
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const code=g('ef_code'),name=g('ef_name');
  if(!code){Toast.show('계측기코드를 입력하세요.','warn');return;}
  if(!name){Toast.show('계측기명을 입력하세요.','warn');return;}
  const data={
    code, name,
    model:g('ef_model'), maker:g('ef_maker'), range:g('ef_range'), res:g('ef_res'),
    loc:g('ef_loc'), operator:g('ef_operator'),
    last:g('ef_last')||null, next:g('ef_next')||null,
    active:Number(document.getElementById('ef_active')?.value||1),
    fixture_type:g('ef_fixture_type'), code_no:g('ef_code_no'), serial_no:g('ef_serial_no'),
    purpose:g('ef_purpose'), cal_method:g('ef_cal_method'),
    cal_cycle:g('ef_cal_cycle')||null, purchase_date:g('ef_purchase_date')||null,
    purchase_cost:g('ef_purchase_cost')||null, inactive_reason:g('ef_inactive_reason'),
    accessories:g('ef_accessories'), note:g('ef_note'),
    file_url:window._efFileDeleted?null:(row?.file_url||null),
  };
  /* 첨부파일 업로드 — 새 파일을 선택하면 삭제 플래그보다 우선 적용 */
  const fileEl=document.getElementById('eqFile');
  if(fileEl?.files?.length){
    const up=await SB.uploadFile('equip', fileEl.files[0]);
    if(up?.url) data.file_url=up.url;
  }
  const res=row?.id?await SB.updateEquip(row.id,data):await SB.addEquip(data);
  if(!res.ok){return;}
  window._efFileDeleted=false;
  Toast.show(row?.id?'계측기가 수정되었습니다.':'계측기가 등록되었습니다.','ok');
  Modal.close();
  await Pages.equip();
},
/* [v2.124] 계측기 수정 폼 — 기존 첨부파일 삭제 (미완성 코드 완성, _equipCalFileDelete와 동일 패턴:
   즉시 삭제하지 않고 플래그를 세워 저장 시점에 file_url을 null로 반영) */
_equipMsaFileDelete(){
  window._efFileDeleted=true;
  const wrap=document.getElementById('efFileWrap');
  if(wrap) wrap.innerHTML='<span style="color:#d97706">⚠️ 저장 시 기존 파일이 삭제됩니다.</span>';
  Toast.show('저장 시 파일이 삭제됩니다.','warn');
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
    /* [v2.110] 계측기 이력카드용 11개 필드 */
    fixture_type:g('ef_fixture_type'),
    code_no:g('ef_code_no'),
    serial_no:g('ef_serial_no'),
    purpose:g('ef_purpose'),
    cal_method:g('ef_cal_method'),
    cal_cycle:g('ef_cal_cycle')||null,
    purchase_date:g('ef_purchase_date')||null,
    purchase_cost:g('ef_purchase_cost')?Number(g('ef_purchase_cost')):null,
    inactive_reason:g('ef_inactive_reason'),
    accessories:g('ef_accessories'),
    note:g('ef_note'),
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

_equipMsaDetail(row){
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

  /* 탭 컨테이너 — [v2.117] 수리이력 탭 복구 (기존 _equipCalDetail에 있던 기능) */
  const body=
    '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:2px solid var(--bd)">'+
    '<button class="eq-dtab on" data-tab="info" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--pri);border-bottom:2px solid var(--pri);margin-bottom:-2px">📋 기본정보</button>'+
    '<button class="eq-dtab" data-tab="cal" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--tm)">📐 교정이력</button>'+
    '<button class="eq-dtab" data-tab="repair" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--tm)">🔧 수리이력</button>'+
    '<button class="eq-dtab" data-tab="log" onclick="Pages._eqDTab(this)" style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--tm)">📝 변경이력</button>'+
    '</div>'+
    '<div id="eqDPane_info">'+infoHtml+'</div>'+
    '<div id="eqDPane_cal" style="display:none"><div class="spin"></div></div>'+
    '<div id="eqDPane_repair" style="display:none"><div id="eqDetailRepair"><div class="spin"></div></div></div>'+
    '<div id="eqDPane_log" style="display:none"><div class="spin"></div></div>'+
    '<div id="eqCmt" style="margin-top:12px"></div>';

  const foot=
    '<button class="btn bout" onclick="Modal.close()">닫기</button>'+
    '<button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._equipMsaHistoryCardOpen(this)">🪪 이력카드</button>'+
    '<button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._eqQR(&quot;'+H.e(row.code)+'&quot;,&quot;'+H.e(row.name)+'&quot;)">📱 QR</button>'+
    '<button class="btn bgh" onclick="Pages._calForm(&quot;'+H.e(row.code)+'&quot;)">📐 교정 등록</button>'+
    '<button class="btn bpri" onclick="Pages._equipMsaForm('+JSON.stringify(row).replace(/"/g,'&quot;')+')" title="수정">✏️ 수정</button>';

  Modal.open({title:'계측기 상세 — '+H.e(row.name),size:'mlg',body,foot});
  window._curEqRow=row; /* [v2.115] 이력카드 버튼용 현재 row 보관 */

  /* 교정이력 + 댓글 비동기 로드 */
  setTimeout(async()=>{
    const calPane=document.getElementById('eqDPane_cal');
    const logPane=document.getElementById('eqDPane_log');
    /* 변경이력 탭에 code 전달 */
    if(logPane) logPane._equip_code=row.code;
    if(!calPane) return;
    try{
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
          '<button class="btn bxs bgh" onclick="Pages._calForm(&quot;'+H.e(row.code)+'&quot;,'+JSON.stringify(c).replace(/"/g,'&quot;')+')">수정</button> '+
          '<button class="btn bxs berr" onclick="Pages._calDel('+c.id+',&quot;'+H.e(row.code)+'&quot;)">삭제</button>'+
          '</td></tr>';
      });
      t+='</tbody></table>';
      calPane.innerHTML=t;
    }
    Cmt.render('#eqCmt','eq-'+row.id);
    }catch(err){
      /* [v2.118] 교정이력 렌더링 중 예외 발생 시 무한로딩 대신 에러 안내 표시 */
      console.error('[_equipMsaDetail] 교정이력 로드 오류:',err);
      calPane.innerHTML='<div style="color:#dc2626;font-size:12px;padding:12px 0">교정이력 로드 중 오류가 발생했습니다: '+(err.message||err)+'</div>';
    }
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
  ['info','cal','repair','log'].forEach(t=>{
    const p=document.getElementById('eqDPane_'+t);
    if(p) p.style.display=t===tab?'block':'none';
  });
  /* [v2.117] 수리이력 탭: 첫 진입 시 로드 */
  if(tab==='repair'){
    const repairPane=document.getElementById('eqDPane_repair');
    if(repairPane&&repairPane.querySelector('.spin')){
      Pages._loadEquipRepairs();
    }
  }
  /* 변경이력 탭: 첫 진입 시 로드 */
  if(tab==='log'){
    const logPane=document.getElementById('eqDPane_log');
    if(logPane&&logPane.querySelector('.spin')){
      Pages._loadEquipLogs(logPane);
    }
  }
},
/* [v2.117] 수리이력 탭 최초 진입 시 비동기 로드 — window._curEqRow 기준 */
async _loadEquipRepairs(){
  const row=window._curEqRow;
  if(!row){const el=document.getElementById('eqDetailRepair');if(el)el.innerHTML='<div style="color:var(--tm);font-size:12px;padding:12px">계측기 정보를 찾을 수 없습니다.</div>';return;}
  try{
    window._curRepairs=(typeof SB!=='undefined'&&SB.getRepairs)?await SB.getRepairs(row.code):[];
  }catch(e){
    window._curRepairs=[];
    Toast.show('수리이력 로드 실패: '+(e.message||e),'err');
  }
  Pages._repairRenderList();
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
  w.innerHTML=`<div class="ph"><div><div class="ptit">📐 교정 관리</div></div></div>
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
  window._calRows = DB.cals;  /* [v2.190] 열람 분할 뷰용 */
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
    /* [v2.190] 열람 컬럼 — 화면 분할 미리보기 (문서관리와 동일 패턴) */
    {key:'id',label:'열람',w:'60px',align:'center',
      render:(v,row)=>{
        const safeId=Number(v);
        const hasFile=!!(row.file_url);
        if(!hasFile) return '<span style="color:var(--tl);font-size:11px">-</span>';
        return `<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
              title="교정성적서 열람"
              onclick="event.stopPropagation();
                window._calViewTarget={id:${safeId},fileUrl:'${H.e(row.file_url||'')}',
                  certNo:'${H.e(row.cert_no||row.cert||'')}',name:'${H.e(row.name||'')}',
                  calDate:'${H.e(row.cal_date||row.date||'')}'};
                Pages._calSplitView(window._calViewTarget)">👁 열람</button>`;
      }},
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
/* [v2.115] 계측기 상세 팝업 — 이력카드 버튼 핸들러
   window._curEqRow(현재 상세 row) 기준으로 수리이력 비동기 로드 후 이력카드 출력 */
async _equipMsaHistoryCardOpen(btn){
  const row=window._curEqRow;
  if(!row){Toast.show('계측기 정보를 찾을 수 없습니다.','err');return;}
  const origText=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='로딩 중...';}
  try{
    window._curRepairs=(typeof SB!=='undefined'&&SB.getRepairs)?await SB.getRepairs(row.code):[];
    if(!DB.cals||!DB.cals.length){const ld=await SB.getCals();if(ld)DB.cals=ld;}
    Pages._equipMsaHistoryCard(row);
  }catch(e){
    Toast.show('이력카드 데이터 로드 실패: '+(e.message||e),'err');
  }finally{
    if(btn){btn.disabled=false;btn.textContent=origText;}
  }
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
/* [v2.113] 계측기 실시간 필터 — 인라인 드롭다운 방식 (SearchPop 의존 제거)
   필터 항목: 텍스트검색 / 계측기구분 / 교정구분 / 상태 / 최근교정일 범위 / 차기교정일 범위 */
_equipMsaFilter(){
  const q        =(document.getElementById('eqSrch')?.value||'').toLowerCase();
  const fixType  = document.getElementById('eqFixType')?.value||'';
  const calM     = document.getElementById('eqCalM')?.value||'';
  const st       = document.getElementById('eqStat')?.value||'';
  const lastFrom = document.getElementById('eqLastFrom')?.value||'';
  const lastTo   = document.getElementById('eqLastTo')?.value||'';
  const nextFrom = document.getElementById('eqNextFrom')?.value||'';
  const nextTo   = document.getElementById('eqNextTo')?.value||'';

  const filtered = DB.equip.filter(e=>{
    const realStatus = H.equipStatus(e.next||null);
    if(q && ![(e.code||''),(e.name||''),(e.maker||''),(e.model||''),(e.serial_no||''),
              (e.loc||''),(e.operator||'')].some(v=>v.toLowerCase().includes(q))) return false;
    if(fixType && (e.fixture_type||'')!==fixType) return false;
    if(calM   && (e.cal_method||'')!==calM)       return false;
    if(st     && realStatus!==st)                  return false;
    if(lastFrom && (e.last||'') < lastFrom)        return false;
    if(lastTo   && (e.last||'') > lastTo)          return false;
    if(nextFrom && (e.next||'') < nextFrom)        return false;
    if(nextTo   && (e.next||'') > nextTo)          return false;
    return true;
  });
  /* 필터 결과를 메인 equip() 와 동일한 컬럼 정의로 렌더 */
  Pages._equipMsaRender(filtered);
},
/* [v2.113] 필터 초기화 */
_equipMsaFilterReset(){
  ['eqSrch','eqFixType','eqCalM','eqStat','eqLastFrom','eqLastTo','eqNextFrom','eqNextTo']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  Pages._equipMsaRender(DB.equip);
},
/* [v2.113] 공통 렌더 함수 — equip()과 _equipMsaFilter() 모두 이 함수 호출
   ★ 컬럼 정의를 여기 한 곳에서만 관리 (중복 방지) ★ */
_equipMsaRender(data){
  Tbl.render({el:'#eqTbl',cols:[
    /* [v2.113] 확정 컬럼 순서: 계측기구분→교정구분→코드→명→모델→제조번호→제조사
                →범위→분해능→위치→사용자→최근교정일→차기교정일→사용여부→상태→사용용도→구입일→불용사유→파일 */
    {key:'fixture_type', label:'계측기구분', w:'80px',
      render:v=>v||'-'},
    {key:'cal_method',   label:'교정구분',   w:'72px', align:'center',
      render:v=>v?`<span class="badge bblu" style="font-size:10px">${v}</span>`:'<span style="color:var(--tl);font-size:11px">-</span>'},
    {key:'code',         label:'계측기코드', req:true,  w:'96px'},
    {key:'name',         label:'계측기명',   req:true,  w:'130px'},
    {key:'model',        label:'모델번호',              w:'100px'},
    {key:'serial_no',    label:'제조번호',              w:'100px'},
    {key:'maker',        label:'제조사',                w:'80px'},
    {key:'range',        label:'측정범위',              w:'100px'},
    {key:'res',          label:'분해능',                w:'70px'},
    {key:'loc',          label:'보관위치',              w:'80px'},
    {key:'operator',     label:'사용자',                w:'72px'},
    {key:'last',         label:'최근교정일',            w:'96px'},
    {key:'next',         label:'차기교정일',            w:'96px',
      render:v=>{
        if(!v) return '-';
        const d=Math.ceil((new Date(v)-new Date())/(864e5));
        const cls=d<0?'bred':d<30?'bamb':'';
        const tag=d<0?' (만료)':d<=30?' (D-'+d+')':'';
        return cls?'<span class="badge '+cls+'">'+v+tag+'</span>':(v+tag);
      }},
    {key:'active',       label:'사용여부',  w:'68px', align:'center',
      render:v=>`<span class="badge ${v===0||v==='0'||v==='불용'?'bred':'bgrn'}" style="pointer-events:none">${v===0||v==='0'||v==='불용'?'불용':'사용'}</span>`},
    {key:'status',       label:'상태',      w:'66px',
      render:(v,row)=>{
        const s=H.equipStatus(row.next||null);
        const cls=s==='정상'?'bgrn':s==='교정중'?'bamb':'bred';
        return `<span class="badge ${cls}">${s}</span>`;
      }},
    {key:'purpose',      label:'사용용도',  w:'110px', render:v=>v||'-'},
    {key:'purchase_date',label:'구입일',    w:'88px',  render:v=>v||'-'},
    {key:'inactive_reason',label:'불용사유',w:'100px', render:v=>v||'-'},
    {key:'file_url',     label:'파일',      w:'64px', align:'center',
      render:(v,row)=>v
        ?`<button class="btn bxs bblu" style="font-size:10px;padding:1px 7px"
            onclick="event.stopPropagation();Pages._equipFilePreview('${H.e(v)}','${H.e(row?.code||'')}')">📎 보기</button>`
        :'<span style="color:var(--tl);font-size:11px">-</span>'},
  ],data,
  onDel:async(ids)=>{
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
      msg:'<div style="text-align:center"><div style="font-size:28px">⚠️</div>'+
          `<div style="font-size:14px;font-weight:700;margin:6px 0">선택한 <b style="color:#dc2626">${ids.length}건</b>의 계측기를 삭제합니다.</div>`+
          '<div style="font-size:12px;color:#64748b">삭제된 데이터는 복구가 어렵습니다. 계속하시겠습니까?</div></div>',
      danger:true, onOk:_doDelete
    });
  },
  onRow:row=>Pages._equipMsaDetail(row)});
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
   문서관리 고도화 페이지 함수 [v2.65]
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
/* [v2.65 D1-3] 문서 분류 목록 — 코드관리 탭에서 추가/삭제 가능 */
_DC:{경영:'경영',ESG:'ESG',품질:'품질',생산:'생산',구매:'구매',안전:'안전',환경:'환경',기타:'기타'},
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
   D1: 문서 목록 [v2.65]
   기존 QMS UI 규칙: stat-dash + Tbl.render + F3 + 칸반
   ══════════════════════════════════════════════════ */
async docs(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  window._docRows=[];
  /* [v2.78] code_types DB에서 _DT/_DC 동적 로드 */
  try{
    const ctypes=await SB.getCodeTypes();
    ctypes.filter(c=>c.category==='doc_type').forEach(c=>{Pages._DT[c.code]=c.label;});
    ctypes.filter(c=>c.category==='doc_cat').forEach(c=>{Pages._DC[c.code]=c.label;});
  }catch(e){console.warn('[docs] code_types 로드 실패:',e);}
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
        '<button class="btn berr bsm" onclick="Pages._docBulkDelete()" title="체크된 문서 삭제">🗑️ 선택삭제</button>'+
      '<button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiDocAnalyze()" title="AI로 문서 현황 분석">🤖 AI 분석</button>'+
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
  rows=rows.filter(function(r){return r.status!=='deleted';});
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
  /* [v2.134 EQS] 문서번호 헤더 너비 글자수 비례 동적 조정 */
  var docNoMaxLen=Math.max(8,...rows.map(r=>(r.doc_no||'').length));
  var docNoW=Math.min(160,Math.max(100,docNoMaxLen*9+24))+'px';
  Tbl.render({
    el:'#docTbl',
    cols:[
      {key:'doc_no',        label:'문서번호',   w:docNoW,
        render:function(v,row){
          return'<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';
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
      {key:'created_by',    label:'작성자',     w:'70px', align:'center',
        render:function(v){return v?'<span style="font-size:13px">'+H.e(v)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'created_at',    label:'작성일',     w:'88px', align:'center',
        render:function(v){return v?'<span style="font-size:13px">'+(v||'').slice(0,10)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'id',            label:'파일',       w:'58px', align:'center',
        render:function(v,row){
          /* [v2.143] doc_master.file_url(단일파일, v2.131 이전 등록분)도 인식 —
             doc_files만 보던 FM.btn은 구버전 등록 파일을 표시 못했음 */
          var k='doc-'+v;
          if(row.file_url && !(App.files[k]&&App.files[k].length)){
            App.files[k]=[{name:row.file_name||'첨부파일',path:null,url:row.file_url,size:'',date:''}];
          }
          return FM.btn(k);
        }},
      /* [v2.152] 열람 컬럼 — 클릭 시 화면 분할하며 우측에 미리보기
         window._docViewTarget에 title 저장 후 참조(이스케이프 충돌 방지) */
      {key:'id', label:'열람', w:'52px', align:'center',
        render:function(v,row){
          var safeId=Number(v);
          /* 클릭 시 전역 변수에 메타 저장 후 splitView 호출 */
          return '<button class="btn bxs bblu" style="font-size:11px;padding:3px 8px" '
            +'title="문서 열람(화면 분할)" '
            +'data-doc-id="'+safeId+'" data-doc-title="'+H.e(row.title||'')+'"'
            +' onclick="event.stopPropagation();'
            +'window._docViewTarget={id:+this.dataset.docId,title:this.dataset.docTitle};'
            +'Pages._docSplitView(window._docViewTarget.id,window._docViewTarget.title)">👁 열람</button>';
        }},
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
          /* [v2.65 D1-1] 소프트 삭제 — filter 제거 → status 마킹으로 통일 */
          for(var i=0;i<ids.length;i++) await SB.deleteDocMaster(ids[i]);
          (window._docRows||[]).forEach(function(x){if(ids.includes(x.id)) x.status='deleted';});
          Pages._docRender(); Pages._docKanban();
          Toast.show(ids.length+'건 삭제되었습니다.','ok');
        }
      });
    },
    onRow:function(row){if(row)Pages._docDetail(row);},
  });
},

/* ── 칸반 보드 [v2.65] ── */
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
              '<span style="font-family:monospace;font-size:13px;font-weight:700;color:'+col.hdrClr+';background:'+col.hdrBg+';padding:1px 5px;border-radius:3px">'+H.e(r.doc_no||'-')+'</span>'+
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

/* ── 문서 상세 팝업 [v2.65] ── */
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
      '<button class="btn bout" onclick="Modal.close();Pages.'+(row.doc_type==='record'?'_recForm':'_docForm')+'('+JSON.stringify(row).replace(/"/g,'&quot;')+')">✏️ 수정</button>'+
      '<button class="btn bpri" onclick="Modal.close();Pages._docRevForm('+row.id+')">✏️ 개정 기안</button>',
  });
},

/* ── D2: 문서 등록 [v2.65] ── */
_docForm:function(editDoc){
  editDoc=editDoc||null;
  SB.getUsers().then(function(users){
    var uOpts=users.map(function(u){return'<option value="'+u.id+'">'+H.e(u.name||u.username)+'('+H.e(u.dept||'')+')</option>';}).join('');
    var dtOpts=Object.entries(Pages._DT).map(function(e){
      return'<option value="'+e[0]+'"'+(editDoc&&editDoc.doc_type===e[0]?' selected':'')+'>'+e[1]+'</option>';
    }).join('');
    Modal.open({title:editDoc?'✏️ 문서 수정 — '+H.e(editDoc.doc_no||''):'신규 문서 등록',size:'mlg',body:
      '<div class="fg2">'+
      '<div class="fgroup"><label class="fl req">문서번호</label><input class="fc" id="fnDocNo" placeholder="예: QP-001" value="'+H.e(editDoc?editDoc.doc_no:'')+'"></div>'+
      '<div class="fgroup"><label class="fl req">문서 제목</label><input class="fc" id="fnTitle" placeholder="예: 수입검사 절차서" value="'+H.e(editDoc?editDoc.title:'')+'"></div>'+
      '<div class="fgroup"><label class="fl req">문서 유형</label><select class="fc" id="fnType">'+dtOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">분류</label><select class="fc" id="fnCat"><option value="">선택 안함</option>'+Object.keys(Pages._DC).map(function(x){return'<option value="'+x+'"'+(editDoc&&editDoc.category===x?' selected':'')+'>'+Pages._DC[x]+'</option>';}).join('')+'</select></div>'+
      '<div class="fgroup"><label class="fl">검토 주기</label><select class="fc" id="fnCycle">'+
        ['annual','biannual','quarterly','monthly'].map(function(c){
          var lbl={annual:'연간',biannual:'반기',quarterly:'분기',monthly:'매월'}[c];
          return '<option value="'+c+'"'+(editDoc&&editDoc.review_cycle===c?' selected':(!editDoc&&c==='annual'?' selected':''))+'>'+lbl+'</option>';
        }).join('')+
      '</select></div>'+
      '<div class="fgroup"><label class="fl">다음 검토일</label><input class="fc" id="fnNextReview" type="date" value="'+H.e(editDoc?(editDoc.next_review_at||''):'')+'"></div>'+
      '<div class="fgroup"><label class="fl">담당 부서</label><input class="fc" id="fnDept" value="'+H.e(editDoc?editDoc.dept:'')+'"></div>'+
      '<div class="fgroup ff"><label class="fl">태그</label><input class="fc" id="fnTags" placeholder="쉼표로 구분 (예: ISO9001, 품질관리)" value="'+H.e(editDoc?(editDoc.tags||[]).join(', '):'')+'"></div>'+
      '<div class="fgroup"><label class="fl">최종 결재자</label><select class="fc" id="fnApprover"><option value="">선택 안함</option>'+uOpts+'</select></div>'+
      '<div class="fgroup ff"><label class="fl">개정 사유</label><input class="fc" id="fnSummary" placeholder="신규 등록 시 생략 가능"></div>'+
      '<div class="fgroup ff"><label class="fl">첨부 파일</label>'+
        '<input type="hidden" id="fnExistingFileUrl" value="'+(editDoc?H.e(editDoc.file_url||''):'')+'">'+
        '<input type="hidden" id="fnExistingFileName" value="'+(editDoc?H.e(editDoc.file_name||''):'')+'">'+
        '<input type="file" id="fnFile" style="width:100%;margin-top:4px;font-size:12px" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip,.hwp">'+
        '<div id="fnFilePreview" style="font-size:11px;color:var(--tm);margin-top:3px"></div>'+
      '</div>'+
      '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button><button class="btn bpri" onclick="Pages._docSave('+(editDoc?editDoc.id:'null')+')">'+(editDoc?'수정 저장':'등록')+'</button>'});
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
           next_review_at:document.getElementById('fnNextReview')?.value||null,
           dept:document.getElementById('fnDept')?.value?.trim()||null,
           tags:tags};
  /* [v2.132] 수정 모드 — doc_master 기본 정보만 UPDATE, 신규 버전/결재 요청 로직은 건너뜀 */
  if(editId){
    var ur=await SB.updateDocMaster(editId,row); if(!ur.ok)return;
    var fInpE=document.getElementById('fnFile');
    var existUrlE=document.getElementById('fnExistingFileUrl')?.value||'';
    var existNameE=document.getElementById('fnExistingFileName')?.value||'';
    if(fInpE&&fInpE.files&&fInpE.files[0]){
      try{
        var upE=await SB.uploadFile('docs',fInpE.files[0]);
        if(upE&&upE.url){ await SB.updateDocMaster(editId,{file_url:upE.url,file_name:fInpE.files[0].name}); }
        else { Toast.show('파일 업로드 실패: Storage [docs] 버킷을 확인하세요.','err'); }
      }catch(e){Toast.show('파일 업로드 오류: '+e.message,'warn');}
    } else if(existUrlE){
      await SB.updateDocMaster(editId,{file_url:existUrlE,file_name:existNameE});
    }
    Toast.show('문서가 수정되었습니다.','ok'); Modal.close();
    var freshE=await SB.getDocMaster(); if(freshE&&freshE.length) window._docRows=freshE; Pages._docRender(); Pages._docKanban();
    return;
  }
  row.status='draft'; row.current_ver='v1.0';
  /* [v2.151] 작성자 저장 */
  row.created_by=Auth._u?.name||Auth._u?.username||Auth._cur||null;
  /* [v2.65 D1-2] r.id 직접 사용 — getDocMaster 타이밍 이슈 해소 */
  var r=await SB.addDocMaster(row); if(!r.ok)return;
  var newDoc=r.id ? {id:r.id,doc_no:docNo} : (await SB.getDocMaster()).find(function(d){return d.doc_no===docNo;});
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
  /* [v2.65 fix D1] 파일 업로드 → doc_master.file_url 직접 저장 */
  if(newDoc){
    /* [v2.78] fnFile 업로드 → doc_master.file_url 즉시 저장 */
    var fInp=document.getElementById('fnFile');
    var existUrl=document.getElementById('fnExistingFileUrl')?.value||'';
    var existName=document.getElementById('fnExistingFileName')?.value||'';
    if(fInp&&fInp.files&&fInp.files[0]){
      try{
        var up=await SB.uploadFile('docs',fInp.files[0]);
        if(up&&up.url){
          await SB.updateDocMaster(newDoc.id,{file_url:up.url,file_name:fInp.files[0].name});
          Toast.show('파일이 첨부되었습니다.','ok');
        } else { Toast.show('파일 업로드 실패: Storage [docs] 버킷을 확인하세요.','err'); }
      }catch(e){Toast.show('파일 업로드 오류: '+e.message,'warn');}
    } else if(existUrl){
      /* [v2.82] 기존 파일 URL 보존 — 수정 시 파일 사라짐 방지 */
      await SB.updateDocMaster(newDoc.id,{file_url:existUrl,file_name:existName});
    }
    if(App.files['doc-new']&&App.files['doc-new'].length){
      App.files['doc-'+newDoc.id]=App.files['doc-new'];
      delete App.files['doc-new'];
      /* [v2.131] doc-new로 미리 업로드된 파일들을 DB(doc_files)에 영속 기록 */
      for(const f of App.files['doc-'+newDoc.id]){
        if(f.path){ try{await SB.addDocFile(newDoc.id,f);}catch(e){console.warn('[doc] doc_files 저장 실패',e);} }
      }
    }
  }
  Toast.show('문서가 등록되었습니다.','ok'); Modal.close();
  var fresh=await SB.getDocMaster(); if(fresh&&fresh.length) window._docRows=fresh; Pages._docRender(); Pages._docKanban();
},
_docExcelDown:function(){
  var rows=Pages._docFiltered();
  if(!rows.length){Toast.show('출력할 데이터가 없습니다.','warn');return;}
  var hdrs=['문서번호','제목','유형','분류','버전','상태','담당부서','다음검토일','태그'];
  var data=rows.map(function(r){return[r.doc_no,r.title,Pages._DT[r.doc_type]||r.doc_type,r.category,r.current_ver,Pages._DS[r.status]||r.status,r.dept,r.next_review_at,(r.tags||[]).join(',')];});
  if(typeof downloadExcel==='function') downloadExcel('문서목록',hdrs,data);
  else Toast.show('엑셀 기능을 찾을 수 없습니다.','warn');
},

/* ── D2-B: 개정 기안 [v2.65] ── */
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
  var fresh=await SB.getDocMaster(); if(fresh&&fresh.length) window._docRows=fresh; Pages._docRender(); Pages._docKanban();
},

/* ══════════════════════════════════════════════════
   D3: 내 결재함 [v2.65]
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
    '<div style="font-size:13px;color:var(--muted)">문서 결재 대기 목록</div></div></div>'+
    '<div id="approvalList"><div class="es"><div class="es-icon">⏳</div><div>조회 중...</div></div></div>';

  var el=document.getElementById('approvalList');
  try{
    /* [v2.65] users 테이블(설정→사용자관리)에서 현재 로그인 사용자 매칭
       Auth._u = users row 전체. id/name/username 순으로 매칭 */
    var users=await SB.getUsers();
    var meId=null;

    /* [v2.65] 사용자 매칭 강화 — 설정→사용자관리 users 테이블과 연동
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

    var html='<div style="overflow-x:auto"><table class="dt" style="width:100%;font-size:13px;table-layout:fixed">'+
      '<colgroup><col style="width:60px"><col><col style="width:90px"><col style="width:95px">'+
      '<col style="width:260px"><col style="width:280px"></colgroup>'+
      '<thead><tr>'+
        '<th>구분</th><th>문서 제목</th><th>버전</th><th>유형</th><th>개정 사유</th><th>처리</th>'+
      '</tr></thead><tbody>';
    list.forEach(function(a){
      var ver=a.doc_ver||{};
      var dm=ver.doc_master||{};
      var docTitle=dm.title||'(문서 제목 없음)';
      var verNo=ver.ver_no||'-';
      var summary=ver.change_summary||'(개정 사유 없음)';
      html+=
        '<tr>'+
          '<td style="text-align:center;font-size:16px">'+(a.step_type==='approver'?'🔏':'🔍')+'</td>'+
          '<td style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+H.e(docTitle)+'">'+H.e(docTitle)+'</td>'+
          '<td style="text-align:center"><span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px">'+H.e(verNo)+'</span></td>'+
          '<td style="text-align:center"><span class="badge bblu" style="font-size:10px">'+(a.step_type==='approver'?'🔏 최종결재':'🔍 검토')+'</span></td>'+
          '<td style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)" title="'+H.e(summary)+'">📝 '+H.e(summary)+'</td>'+
          '<td>'+
            '<div style="display:flex;gap:5px;align-items:center;flex-wrap:nowrap">'+
              '<input type="text" id="cmt_'+a.id+'" style="flex:1;min-width:70px;padding:5px 8px;border:1px solid var(--brd);border-radius:6px;font-size:12px;background:var(--bg)" placeholder="의견(반려 시 필수)">'+
              '<button class="btn bgrn bsm" style="white-space:nowrap" onclick="Pages._doApprove('+a.id+','+(ver.doc_id||0)+','+(ver.id||0)+',\''+H.e(verNo).replace(/'/g,"\\'")+'\','+meId+')">✅ 승인</button>'+
              '<button class="btn bred bsm" style="white-space:nowrap" onclick="Pages._doReject('+a.id+')">❌ 반려</button>'+
              '<button class="btn bout bsm" style="white-space:nowrap" onclick="Pages.doc_history('+(ver.doc_id||0)+')">🕐</button>'+
              /* [v2.151] 문서 열람 버튼 */
              '<button class="btn bblu bsm" style="white-space:nowrap" onclick="FM.modal(\'doc-'+(ver.doc_id||0)+'\')">📄 열람</button>'+
            '</div>'+
          '</td>'+
        '</tr>';
    });
    el.innerHTML=html+'</tbody></table></div>';
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
   D4: 개정 이력 타임라인 [v2.65]
   ══════════════════════════════════════════════════ */
/* [v2.65] 개정이력: 사이드바·탭 클릭 시 문서 목록으로 이동 + 안내 */
/* [v2.65] ── 교정 계획 & 이력 ──────────────────────────── */
async cal(){
  const w=document.getElementById('pw');
  if(_sb){const d=await SB.getCal();if(d)DB.cals=d;}
  const now=new Date(); const yr=now.getFullYear().toString();
  /* ── stat-dash 계산 ── */
  const doneCnt=DB.cals.filter(function(c){return(c.cal_date||c.date||'').startsWith(yr)&&c.result==='합격';}).length;
  const soonCnt=DB.equip.filter(function(e){
    if(!e.next)return false;
    const d=Math.ceil((new Date(e.next)-now)/864e5);
    return d>=0&&d<=30;
  }).length;
  const expCnt=DB.equip.filter(function(e){
    return e.next&&new Date(e.next)<now;
  }).length;
  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0284c7">📋</div>
        <div><div class="sd-val">${DB.cals.length}</div><div class="sd-lbl">전체 이력</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${doneCnt}</div><div class="sd-lbl">${yr}년 완료</div></div></div>
      <div class="sd-card" style="cursor:pointer" onclick="Pages._calTabSwitch('plan')">
        <div class="sd-icon" style="background:#fef3c7;color:#d97706">⏰</div>
        <div><div class="sd-val" style="${soonCnt>0?'color:#d97706':''}">${soonCnt}</div><div class="sd-lbl">30일 내 예정</div></div></div>
      <div class="sd-card" style="cursor:pointer" onclick="Pages._calTabSwitch('plan')">
        <div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div>
        <div><div class="sd-val" style="${expCnt>0?'color:var(--err)':''}">
          ${expCnt}</div><div class="sd-lbl">교정 만료</div></div></div>
    </div>
    <!-- [v2.71] 탭 메뉴 -->
    <div style="display:flex;gap:0;border-bottom:2px solid var(--bd);margin:14px 0 0">
      <button id="calTabHist" class="btn bout bsm" onclick="Pages._calTabSwitch('hist')"
        style="border-radius:6px 6px 0 0;border-bottom:none;font-weight:600;
               background:var(--pri);color:#fff;border-color:var(--pri)">
        📋 교정 이력
      </button>
      <button id="calTabPlan" class="btn bout bsm" onclick="Pages._calTabSwitch('plan')"
        style="border-radius:6px 6px 0 0;border-bottom:none;margin-left:4px">
        ⏰ 교정 예정
        ${(soonCnt+expCnt)>0?`<span class="badge bred bsm" style="margin-left:4px;font-size:10px">${soonCnt+expCnt}</span>`:''}
      </button>
    </div>
    <!-- 이력 탭 -->
    <div id="calPaneHist">
      <div class="ph" style="margin-top:10px">
        <div><div class="ptit" style="font-size:13px">교정 완료 이력 — calibrations 테이블</div></div>
        <div class="pac">
          <button class="btn btn-xl-down bsm" onclick="Pages._calExcelDown()" title="엑셀 양식 내려받기">📥 양식</button>
          <button class="btn btn-xl-up bsm" onclick="Pages._calExcelUp()" title="엑셀 일괄등록">📤 일괄등록</button>
          <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiCalAnalyze()" title="AI로 교정 이력 분석">🤖 AI 분석</button>
          <button class="btn bpri btn-f2" onclick="Pages._calForm()">+ 교정 등록 <span class="kbd">F2</span></button>
        </div>
      </div>
      <div class="tbar">
        <div class="sw2"><input type="text" id="calKw" placeholder="계측기코드·계측기명·교정기관 검색..." oninput="Pages._calFilter()"></div>
        <select class="fsel" id="calRes" onchange="Pages._calFilter()">
          <option value="">전체 결과</option>
          <option value="합격">합격</option>
          <option value="불합격">불합격</option>
        </select>
        <select class="fsel" id="calYr" onchange="Pages._calFilter()">
          <option value="">전체 연도</option>
          ${[yr,(+yr-1).toString()].map(function(y){return`<option value="${y}">${y}년</option>`;}).join('')}
        </select>
      </div>
      <div id="calTbl"></div>
    </div>
    <!-- 예정 탭 -->
    <div id="calPanePlan" style="display:none">
      <div class="ph" style="margin-top:10px">
        <div><div class="ptit" style="font-size:13px">교정 예정 목록 — 계측기 차기교정일 기준</div></div>
        <div class="pac">
          <select class="fsel" id="calPlanFilter" onchange="Pages._calPlanRender()">
            <option value="">전체</option>
            <option value="exp">만료</option>
            <option value="soon">30일 내</option>
            <option value="upcoming">31~90일</option>
          </select>
        </div>
      </div>
      <div id="calPlanTbl"></div>
    </div>`;
  Pages._calRender();
},
/* [v2.71] 탭 전환 */
_calTabSwitch:function(tab){
  var hist=document.getElementById('calPaneHist');
  var plan=document.getElementById('calPanePlan');
  var btnH=document.getElementById('calTabHist');
  var btnP=document.getElementById('calTabPlan');
  if(!hist||!plan) return;
  if(tab==='plan'){
    hist.style.display='none'; plan.style.display='';
    if(btnH){btnH.style.background='';btnH.style.color='';btnH.style.borderColor='';}
    if(btnP){btnP.style.background='var(--pri)';btnP.style.color='#fff';btnP.style.borderColor='var(--pri)';}
    Pages._calPlanRender();
  } else {
    hist.style.display=''; plan.style.display='none';
    if(btnH){btnH.style.background='var(--pri)';btnH.style.color='#fff';btnH.style.borderColor='var(--pri)';}
    if(btnP){btnP.style.background='';btnP.style.color='';btnP.style.borderColor='';}
  }
},
/* [v2.71] 교정 예정 탭 렌더 */
_calPlanRender:function(){
  const now=new Date();
  const filter=document.getElementById('calPlanFilter')?.value||'';
  var rows=DB.equip.filter(function(e){
    if(!e.next) return false;
    const d=Math.ceil((new Date(e.next)-now)/864e5);
    if(filter==='exp')    return d<0;
    if(filter==='soon')   return d>=0&&d<=30;
    if(filter==='upcoming') return d>30&&d<=90;
    return d<=90; /* 전체: 90일 이내만 표시 */
  }).map(function(e){
    const d=Math.ceil((new Date(e.next)-now)/864e5);
    return Object.assign({},e,{_dday:d});
  }).sort(function(a,b){return a._dday-b._dday;});

  Tbl.render({el:'#calPlanTbl',
    cols:[
      {key:'code',     label:'계측기코드', w:'96px',req:true},
      {key:'name',     label:'계측기명',   w:'130px'},
      {key:'model',    label:'모델번호',   w:'100px'},
      {key:'loc',      label:'보관위치',   w:'90px'},
      {key:'operator', label:'사용자',     w:'70px'},
      {key:'last',     label:'최근교정일', w:'96px', render:function(v){return v||'-';}},
      {key:'next',     label:'차기교정일', w:'96px', render:function(v,row){
        if(!v) return '-';
        const d=row._dday;
        const cls=d<0?'bred':d<=30?'bamb':'bblu';
        const tag=d<0?' (만료 '+Math.abs(d)+'일)':' (D-'+d+')';
        return'<span class="badge '+cls+'">'+v+tag+'</span>';
      }},
      {key:'_dday',    label:'D-day',      w:'72px', align:'center', render:function(v){
        const cls=v<0?'bred':v<=30?'bamb':'bblu';
        return'<span class="badge '+cls+'">'+(v<0?'만료':'D-'+v)+'</span>';
      }},
      {key:'id', label:'교정 등록', w:'88px', align:'center',
        render:function(v,row){
          return'<button class="btn bpri bsm" onclick="event.stopPropagation();Pages._calFormByEquip('+v+')">+ 교정 등록</button>';
        }},
    ],
    data:rows,
  });
},
/* [v2.71] 예정 탭에서 직접 교정 등록 */
_calFormByEquip:function(equipId){
  const eq=(DB.equip||[]).find(function(e){return e.id===equipId;});
  if(!eq){Toast.show('계측기 정보를 찾을 수 없습니다.','err');return;}
  /* _calForm에 계측기 코드 pre-fill */
  Pages._calForm(null, eq.code);
},
_calRender:function(){
  const kw=(document.getElementById('calKw')?.value||'').toLowerCase();
  const res=document.getElementById('calRes')?.value||'';
  const yr=document.getElementById('calYr')?.value||'';
  var rows=DB.cals.filter(function(c){
    const d=c.cal_date||c.date||'';
    return(!kw||(c.equip_code||'').toLowerCase().includes(kw)||(c.name||'').toLowerCase().includes(kw)||(c.agency||'').toLowerCase().includes(kw))
      &&(!res||c.result===res)
      &&(!yr||d.startsWith(yr));
  });
  Tbl.render({el:'#calTbl',
    cols:[
      {key:'equip_code', label:'계측기코드',  req:true, w:'96px'},
      {key:'name',     label:'계측기명',    w:'120px',
        render:function(v,row){
          if(v) return H.e(v);
          var eq=(DB.equip||[]).find(function(e){return e.code===row.equip_code;});
          return eq?H.e(eq.name||'-'):'-';
        }},
      {key:'cal_type', label:'교정구분',    w:'80px', render:v=>v||'-'},
      {key:'request_date', label:'교정의뢰일', w:'96px', render:v=>v||'-'},
      {key:'cal_date', label:'교정일',      w:'96px', render:v=>v||'-'},
      {key:'agency',   label:'교정기관',    w:'110px'},
      {key:'cert_no',  label:'성적서번호',  w:'110px'},
      {key:'result',   label:'결과',        w:'72px',
        render:v=>'<span class="badge '+(v==='합격'?'bgrn':'bred')+'">'+H.e(v||'-')+'</span>'},
      {key:'next_date',label:'다음교정일',  w:'96px',
        render:function(v){
          if(!v) return '-';
          const d=Math.ceil((new Date(v)-new Date())/864e5);
          const cls=d<0?'bred':d<=30?'bamb':'';
          const tag=d<0?' (만료)':d<=30?' (D-'+d+')':'';
          return cls?'<span class="badge '+cls+'">'+v+tag+'</span>':(v+tag);
        }},
      {key:'cost', label:'비용',w:'88px',
        render:v=>v?Number(v).toLocaleString()+'원':'-'},
      {key:'note', label:'비고',w:'*'},
      /* [v2.191] 파일 컬럼 — 파일 있으면 수량+오렌지 배경 표시 */
      {key:'file_url', label:'파일', w:'56px', align:'center',
        render:function(v,row){
          if(!v) return '<span style="color:var(--tl);font-size:11px">-</span>';
          return '<span style="background:#f97316;color:#fff;font-size:10px;font-weight:700;' +
            'padding:2px 7px;border-radius:12px;white-space:nowrap">📎 1</span>';
        }},
      /* [v2.191] 열람 컬럼 — 클릭 시 화면 분할 미리보기 */
      {key:'id', label:'열람', w:'56px', align:'center',
        render:function(v,row){
          const safeId=Number(v);
          if(!row.file_url) return '<span style="color:var(--tl);font-size:11px">-</span>';
          return '<button class="btn bxs bblu" style="font-size:10px;padding:2px 6px" ' +
            'title="성적서 열람(화면 분할)" ' +
            'onclick="event.stopPropagation();' +
            'window._calViewTarget={' +
              'id:'+safeId+',' +
              'fileUrl:\''+H.e(row.file_url||'')+'\',' +
              'certNo:\''+H.e(row.cert_no||row.cert||'')+'\',' +
              'name:\''+H.e(row.name||'')+'\',' +
              'calDate:\''+H.e(row.cal_date||row.date||'')+'\',' +
              'equipCode:\''+H.e(row.equip_code||row.code||'')+'\'};' +
            'Pages._calSplitView(window._calViewTarget)">👁 열람</button>';
        }},
    ],
    data:rows,
    onRow:function(){ window._calRows = rows; },  /* [v2.191] 분할뷰용 */
    onDel:async function(ids){
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({title:'교정 이력 삭제',
        body:'<b>'+ids.length+'건</b>의 교정 이력을 삭제합니다.',danger:true,
        onOk:async function(){
          for(var i=0;i<ids.length;i++) await SB.deleteCal(ids[i]);
          Toast.show(ids.length+'건 삭제되었습니다.','ok');
          Pages.cal();
        }});
    },
    onRow:function(row){Pages._calForm(row);}
  });
},
_calFilter:function(){Pages._calRender();},
_calForm:function(row, preCode){
  const e=!!row;
  const _pre=preCode||'';
  /* [v2.107] 계측기코드만 옵션 텍스트로 표시 — 계측기명은 별도 읽기전용 필드로 분리 */
  const equipCodes=DB.equip.map(function(eq){
    const sel=((row&&row.equip_code)===eq.code||eq.code===_pre)?' selected':'';
    return `<option value="${H.e(eq.code)}" data-name="${H.e(eq.name||'')}"${sel}>${H.e(eq.code)}</option>`;
  }).join('');
  const curEq=DB.equip.find(function(eq){return eq.code===((row&&row.equip_code)||_pre);})||{};
  const fileHtml=(e&&row.file_url)?
    '<div class="fo-exist" style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
    '<span style="font-size:12px">\ud83d\udcce '+H.e(row.file_name||'\ud604\uc7ac \ud30c\uc77c')+'</span>'+
    '<a href="'+H.e(row.file_url)+'" target="_blank" class="btn bxs bblu bsm">\uBCF4\uAE30</a>'+
    '<button type="button" class="btn bxs berr bsm" onclick="window._calFileRemove=true;this.closest(\'.fo-exist\').remove()">\ud83d\uddd1\ufe0f \uc0ad\uc81c</button>'+
    '</div>':'';
  window._calFileRemove=false;
  Modal.open({title:e?'\uad50\uc815 \uc774\ub825 \uc218\uc815':'\uad50\uc815 \uB4F1\uB85D',size:'mlg',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">\uACC4\uCE21\uAE30\uCF54\uB4DC *</b></label>
        <select class="fc" id="cfCode" onchange="(function(){var s=document.getElementById('cfCode');var o=s.options[s.selectedIndex];var nm=document.getElementById('cfName');if(nm)nm.value=o?o.dataset.name||'':'';})()">
          <option value="">\uc120\ud0dd</option>${equipCodes}</select></div>
      <div class="fgroup"><label class="fl">\uACC4\uCE21\uAE30\uBA85</label>
        <input class="fc" id="cfName" readonly value="${H.e(curEq.name||'')}" style="background:var(--bg2)"></div>
      <div class="fgroup"><label class="fl">\uAD50\uC815\uAD6C\uBD84</label>
        <select class="fc" id="cfCalType">
          <option value="">\uC120\uD0DD</option>
          <option value="\uC0AC\uB0B4\uAD50\uC815"${row?.cal_type==='\uC0AC\uB0B4\uAD50\uC815'?' selected':''}>\uC0AC\uB0B4\uAD50\uC815</option>
          <option value="\uC0AC\uC678\uAD50\uC815"${!row?.cal_type||row?.cal_type==='\uC0AC\uC678\uAD50\uC815'?' selected':''}>\uC0AC\uC678\uAD50\uC815</option>
        </select></div>
      <div class="fgroup"><label class="fl">\uAD50\uC815\uC758\uB8B0\uC77C</label>
        <input class="fc" type="date" id="cfReqDate" value="${H.e(row?.request_date||'')}"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">\uad50\uc815\uc77c *</b></label>
        <input class="fc" type="date" id="cfDate" value="${H.e(row?.cal_date||row?.date||H.today())}"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">\uad50\uc815\uae30\uad00 *</b></label>
        <input class="fc" id="cfAgency" placeholder="\uc608) \u3231\uC815\uBC00\uCE21\uC815" value="${H.e(row?.agency||'')}"></div>
      <div class="fgroup"><label class="fl">\uc131\uc801\uc11c\ubc88\ud638</label>
        <input class="fc" id="cfCert" placeholder="\uc608) CAL-2026-001" value="${H.e(row?.cert_no||row?.cert||'')}"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">\uacb0\uacfc *</b></label>
        <select class="fc" id="cfResult">
          <option value="\ud569\uaca9"${(row?.result||'\ud569\uaca9')==='\ud569\uaca9'?' selected':''}>\ud569\uaca9</option>
          <option value="\ubd88\ud569\uaca9"${row?.result==='\ubd88\ud569\uaca9'?' selected':''}>\ubd88\ud569\uaca9</option>
        </select></div>
      <div class="fgroup"><label class="fl">\ub2e4\uc74c \uad50\uc815\uc77c</label>
        <input class="fc" type="date" id="cfNext" value="${H.e(row?.next_date||row?.next||'')}"></div>
      <div class="fgroup"><label class="fl">\ube44\uc6a9 (\uc6d0)</label>
        <input class="fc" type="number" id="cfCost" placeholder="0" value="${H.e(row?.cost||'')}"></div>
      <div class="fgroup ff"><label class="fl">\ube44\uace0</label>
        <input class="fc" id="cfNote" value="${H.e(row?.note||'')}"></div>
      <div class="fgroup ff"><label class="fl">\ud30c\uc77c \uCCA8\uBD80</label>
        <div>${fileHtml}<input type="file" id="cfFile" class="fc" style="font-size:12px" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.zip"></div></div>
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">\ucde8\uc18c</button>
          <button class="btn bpri btn-f8" onclick="Pages._calSave(${e?row.id:'null'})">
            ${e?'\uc800\uc7a5':'\uB4F1\uB85D'} <span class="kbd">F8</span></button>`
  });
},
async _calSave(id){
  const g=k=>document.getElementById(k)?.value?.trim()||'';
  const code=g('cfCode'); const date=g('cfDate'); const agency=g('cfAgency');
  if(!code){Toast.show('계측기코드를 선택하세요.','warn');return;}
  if(!date){Toast.show('교정일을 입력하세요.','warn');return;}
  if(!agency){Toast.show('교정기관을 입력하세요.','warn');return;}
  const eq=DB.equip.find(e=>e.code===code)||{};
  /* [v2.107] calibrations 실제 컬럼만 — code/date/next/cert 중복키 제거 */
  const row={
    equip_code:code,
    cal_date:date,
    agency,
    cert_no:g('cfCert'),
    result:g('cfResult')||'합격',
    next_date:g('cfNext')||null,
    cost:g('cfCost')?Number(g('cfCost')):null,
    note:g('cfNote'),
    /* [v2.110] 교정구분/교정의뢰일 추가 */
    cal_type:g('cfCalType')||null,
    request_date:g('cfReqDate')||null,
  };
  if(window._calFileRemove){row.file_url=null;row.file_name=null;}
  var fileEl=document.getElementById('cfFile');
  if(fileEl&&fileEl.files&&fileEl.files.length){
    Toast.show('파일 업로드 중...','info');
    var up=await SB.uploadFile('cal',fileEl.files[0]);
    if(up&&up.url){row.file_url=up.url;row.file_name=fileEl.files[0].name;}
    else{Toast.show('파일 업로드 실패','warn');}
  }
  if(id&&id!=='null'){
    const r=await SB.updateCal(Number(id),row);
    if(!r.ok)return;
    Toast.show('교정 이력이 수정되었습니다.','ok');
  } else {
    const r=await SB.addCal(row);
    if(!r.ok)return;
    Toast.show('교정 이력이 등록되었습니다.','ok');
  }
  Modal.close();
  /* 교정 완료 시 계측기 next_date 자동 업데이트 */
  if(eq.id&&row.next_date){
    await SB.updateEquip(eq.id,{next:row.next_date,last:date,status:'정상'});
    const e2=DB.equip.find(e=>e.id===eq.id);
    if(e2){e2.next=row.next_date;e2.last=date;e2.status='정상';}
  }
  Pages.cal();
},

/* [v2.65] ── MSA 게이지 R&R ─────────────────────────────── */
async msa(){
  const w=document.getElementById('pw');
  if(_sb){const d=await SB.getMsa();if(d)DB.msa=d;}
  const passC=DB.msa.filter(m=>m.result==='pass').length;
  const failC=DB.msa.filter(m=>m.result==='fail').length;
  const avgGrr=DB.msa.length
    ?Math.round(DB.msa.reduce(function(s,m){return s+(m.grr||0);},0)/DB.msa.length*10)/10
    :0;
  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#e0e7ff;color:#4f46e5">📈</div>
        <div><div class="sd-val">${DB.msa.length}</div><div class="sd-lbl">전체 연구</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>
        <div><div class="sd-val">${passC}</div><div class="sd-lbl">적합 (%GRR&lt;30)</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div>
        <div><div class="sd-val" style="${failC>0?'color:var(--err)':''}">${failC}</div>
          <div class="sd-lbl">부적합 (%GRR≥30)</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📊</div>
        <div><div class="sd-val">${avgGrr}%</div><div class="sd-lbl">평균 %GRR</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">📈 MSA 게이지 R&R 분석</div></div>
      <div class="pac">
        <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiMsaAnalyze()" title="AI로 MSA 측정 시스템 분석">🤖 AI 분석</button>
        <button class="btn bpri btn-f2" onclick="Pages._msaForm()">+ 신규 연구 <span class="kbd">F2</span></button>
      </div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="msaKw" placeholder="계측기코드·연구명 검색..." oninput="Pages._msaFilter()"></div>
      <select class="fsel" id="msaRes" onchange="Pages._msaFilter()">
        <option value="">전체 결과</option><option value="pass">적합</option><option value="fail">부적합</option>
      </select>
    </div>
    <div id="msaTbl"></div>`;
  Pages._msaRender();
},
_msaRender:function(){
  const kw=(document.getElementById('msaKw')?.value||'').toLowerCase();
  const res=document.getElementById('msaRes')?.value||'';
  var rows=DB.msa.filter(function(m){
    return(!kw||(m.equip_code||'').toLowerCase().includes(kw)||(m.name||'').toLowerCase().includes(kw))
      &&(!res||m.result===res);
  });
  Tbl.render({el:'#msaTbl',
    cols:[
      {key:'equip_code',label:'계측기코드', w:'96px'},
      {key:'name',      label:'연구명',     w:'*'},
      {key:'date',      label:'측정일',     w:'96px'},
      {key:'parts',     label:'부품 수',    w:'68px',align:'center'},
      {key:'appraisers',label:'측정자 수',  w:'78px',align:'center'},
      {key:'trials',    label:'반복 횟수',  w:'78px',align:'center'},
      {key:'ev',        label:'반복성(%)',  w:'82px',align:'right',
        render:function(v){return v!=null?v.toFixed(1)+'%':'-';}},
      {key:'av',        label:'재현성(%)',  w:'82px',align:'right',
        render:function(v){return v!=null?v.toFixed(1)+'%':'-';}},
      {key:'grr',       label:'%GRR',      w:'78px',align:'right',
        render:function(v){
          if(v==null)return'-';
          var cls=v<10?'bgrn':v<30?'bamb':'bred';
          return '<span class="badge '+cls+'">'+v.toFixed(1)+'%</span>';
        }},
      {key:'result',    label:'판정',      w:'72px',align:'center',
        render:function(v){return v?'<span class="badge '+(v==='pass'?'bgrn':'bred')+'">'+(v==='pass'?'적합':'부적합')+'</span>':'-';}},
      {key:'note',      label:'비고',      w:'100px'},
    ],
    data:rows,
    onDel:async function(ids){
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({title:'MSA 연구 삭제',
        body:'<b>'+ids.length+'건</b>의 MSA 연구를 삭제합니다.',danger:true,
        onOk:async function(){
          for(var i=0;i<ids.length;i++) await SB.deleteMsa(ids[i]);
          Toast.show(ids.length+'건 삭제되었습니다.','ok'); Pages.msa();
        }});
    },
    onRow:function(row){Pages._msaDetail(row);}
  });
},
_msaFilter:function(){Pages._msaRender();},
_msaForm:function(){
  const equipOpts=DB.equip.map(function(e){
    return'<option value="'+H.e(e.code)+'">'+H.e(e.code)+' — '+H.e(e.name)+'</option>';
  }).join('');
  Modal.open({title:'MSA 측정 연구 등록',size:'mlg',
    body:`<div class="fg2">
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">연구명 *</b></label>
        <input class="fc" id="mfName" placeholder="예) 버니어캘리퍼스 R&R 연구"></div>
      <div class="fgroup"><label class="fl">계측기</label>
        <select class="fc" id="mfCode"><option value="">선택 안함</option>${equipOpts}</select></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">측정일 *</b></label>
        <input class="fc" type="date" id="mfDate" value="${H.today()}"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">부품 수 *</b></label>
        <input class="fc" type="number" id="mfParts" value="5" min="2" max="20"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">측정자 수 *</b></label>
        <input class="fc" type="number" id="mfApp" value="3" min="2" max="5"></div>
      <div class="fgroup"><label class="fl"><b style="color:#e11d48">반복 횟수 *</b></label>
        <input class="fc" type="number" id="mfTrial" value="2" min="2" max="5"></div>
      <div class="fgroup"><label class="fl">공차 (mm)</label>
        <input class="fc" type="number" id="mfTol" placeholder="예) 0.1" step="0.001"></div>
    </div>
    <div style="background:var(--bg2);border-radius:var(--r);padding:10px 14px;margin-top:8px;font-size:12px;color:var(--tm)">
      측정 데이터는 등록 후 상세 화면에서 입력할 수 있습니다.
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._msaSave()">등록 <span class="kbd">F8</span></button>`
  });
},
async _msaSave(){
  const g=k=>document.getElementById(k)?.value?.trim()||'';
  const name=g('mfName');
  if(!name){Toast.show('연구명을 입력하세요.','warn');return;}
  if(!g('mfDate')){Toast.show('측정일을 입력하세요.','warn');return;}
  const row={
    name,equip_code:g('mfCode'),date:g('mfDate'),
    parts:parseInt(g('mfParts'))||5,
    appraisers:parseInt(g('mfApp'))||3,
    trials:parseInt(g('mfTrial'))||2,
    tolerance:g('mfTol')?parseFloat(g('mfTol')):null,
    study_data:[],ev:null,av:null,grr:null,tv:null,result:null,note:''
  };
  const r=await SB.addMsa(row);
  if(!r.ok)return;
  Toast.show('MSA 연구가 등록되었습니다. 상세에서 데이터를 입력하세요.','ok');
  Modal.close(); Pages.msa();
},
_msaDetail:function(row){
  /* R&R 결과 표시 + 데이터 입력 안내 */
  var hasResult=row.grr!=null;
  var grr=hasResult?row.grr.toFixed(1)+' %':'-';
  var ev=hasResult?row.ev.toFixed(1)+' %':'-';
  var av=hasResult?row.av.toFixed(1)+' %':'-';
  var tv=hasResult?row.tv.toFixed(1)+' %':'-';
  var cls=hasResult?(row.grr<10?'#059669':row.grr<30?'#d97706':'#dc2626'):'#64748b';
  var judgeText=hasResult?(row.result==='pass'
    ?'<span style="color:#059669;font-weight:500">✅ 적합 — 게이지 변동이 허용 범위 내입니다.</span>'
    :'<span style="color:#dc2626;font-weight:500">⚠️ 부적합 — 게이지 변동이 30%를 초과합니다. 재교정 또는 교체를 검토하세요.</span>')
    :'<span style="color:#64748b">측정 데이터 미입력</span>';
  Modal.open({title:'📈 MSA 연구 상세 — '+H.e(row.name),size:'mlg',
    body:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      <div style="background:var(--bg2);border-radius:var(--r);padding:12px">
        <div style="font-size:11px;color:var(--tm);margin-bottom:8px">연구 정보</div>
        <table style="width:100%;font-size:12px">
          <tr><td style="color:var(--tm);padding:2px 0">계측기</td><td>${H.e(row.equip_code||'-')}</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">측정일</td><td>${H.e(row.date||'-')}</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">부품 수</td><td>${row.parts}개</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">측정자</td><td>${row.appraisers}명</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">반복</td><td>${row.trials}회</td></tr>
          ${row.tolerance?'<tr><td style="color:var(--tm);padding:2px 0">공차</td><td>±'+row.tolerance+'mm</td></tr>':''}
        </table>
      </div>
      <div style="background:var(--bg2);border-radius:var(--r);padding:12px">
        <div style="font-size:11px;color:var(--tm);margin-bottom:8px">R&R 분석 결과</div>
        <table style="width:100%;font-size:12px">
          <tr><td style="color:var(--tm);padding:2px 0">반복성 (EV)</td><td>${ev}</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">재현성 (AV)</td><td>${av}</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0;font-weight:500">%GRR</td>
            <td style="font-weight:500;color:${cls}">${grr}</td></tr>
          <tr><td style="color:var(--tm);padding:2px 0">%TV</td><td>${tv}</td></tr>
        </table>
        <div style="margin-top:10px;font-size:12px">${judgeText}</div>
      </div>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:12px;color:#1e40af">
      📌 측정 데이터 직접 입력이 필요하면 담당자에게 문의하거나 엑셀로 정리한 뒤 비고란에 요약을 기재하세요.
    </div>`,
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>
          <button class="btn berr bsm" onclick="Modal.close();Pages._msaDelete(${row.id})">삭제</button>`
  });
},
async _msaDelete(id){
  Modal.confirm({title:'MSA 연구 삭제',body:'이 연구를 삭제합니다.',danger:true,
    onOk:async function(){
      await SB.deleteMsa(id);
      Toast.show('삭제되었습니다.','ok'); Pages.msa();
    }
  });
},

/* [v2.65] ── 개정 이력 전용 뷰 ─────────────────────────── */
doc_history_home:async function(){
  var w=document.getElementById('pw');
  if(!w)return;
  /* doc_master 로드 */
  if(_sb){const d=await SB.getDocMaster();if(d&&d.length)window._docRows=d;}
  const rows=window._docRows||[];
  /* 각 버전 이력: doc_versions 일괄 로드 */
  var allVers=[];
  if(_sb){
    try{
      const {data}=await _sb.from('doc_versions').select('*').order('created_at',{ascending:false}).limit(500);
      if(data) allVers=data;
    }catch(e){allVers=[];}
  }
  /* 문서정보 Map */
  const docMap={};
  rows.filter(function(r){return r.status!=='deleted';})
    .forEach(function(r){docMap[r.id]=r;});
  /* 이력 목록 구성 (문서 기준, 최신 버전 포함) */
  var histList=allVers.filter(function(v){return docMap[v.doc_id];}).map(function(v){
    var doc=docMap[v.doc_id]||{};
    return {
      id:v.id, doc_id:v.doc_id,
      doc_no:doc.doc_no||'-', title:doc.title||'-',
      doc_type:doc.doc_type||'-', dept:doc.dept||'-',
      ver_no:v.ver_no||'v1.0',
      change_summary:v.change_summary||'-',
      created_at:(v.created_at||'').slice(0,10),
      status:doc.status||'-',
    };
  });
  /* SB 없는 경우: DB.cals 기반 더미 이력 */
  if(!allVers.length){
    histList=rows.filter(function(r){return r.status!=='deleted';}).map(function(r){
      return{id:r.id,doc_id:r.id,doc_no:r.doc_no||'-',title:r.title||'-',
        doc_type:r.doc_type||'-',dept:r.dept||'-',ver_no:r.current_ver||'v1.0',
        change_summary:'최초 등록',created_at:(r.created_at||'').slice(0,10),status:r.status};
    });
  }
  /* stat-dash */
  const total=histList.length;
  const thisY=new Date().getFullYear().toString();
  const thisYCnt=histList.filter(function(h){return(h.created_at||'').startsWith(thisY);}).length;
  const typeMap={};
  histList.forEach(function(h){typeMap[h.doc_type]=(typeMap[h.doc_type]||0)+1;});
  const topType=Object.entries(typeMap).sort(function(a,b){return b[1]-a[1];})[0];
  w.innerHTML=`
    <div class="stat-dash">
      <div class="sd-card"><div class="sd-icon" style="background:#e0e7ff;color:#4f46e5">🕐</div>
        <div><div class="sd-val">${total}</div><div class="sd-lbl">전체 개정 이력</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">📅</div>
        <div><div class="sd-val">${thisYCnt}</div><div class="sd-lbl">${thisY}년 개정</div></div></div>
      <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📄</div>
        <div><div class="sd-val">${topType?H.e(Pages._DT[topType[0]]||topType[0]):'-'}</div>
          <div class="sd-lbl">최다 개정 유형</div></div></div>
    </div>
    <div class="ph" style="margin-top:14px">
      <div><div class="ptit">🕐 개정 이력</div></div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="dhKw" placeholder="문서번호·제목·변경요약 검색..."
        oninput="Pages._dhFilter()"></div>
      <select class="fsel" id="dhType" onchange="Pages._dhFilter()">
        <option value="">전체 유형</option>
        ${Object.entries(Pages._DT).map(([k,v])=>`<option value="${H.e(k)}">${H.e(v)}</option>`).join('')}
      </select>
      <select class="fsel" id="dhYr" onchange="Pages._dhFilter()">
        <option value="">전체 연도</option>
        ${[thisY,(+thisY-1).toString()].map(y=>`<option value="${y}">${y}년</option>`).join('')}
      </select>
    </div>
    <div id="dhTbl"></div>`;
  window._dhHist=histList;
  Pages._dhRender();
},
_dhFilter:function(){Pages._dhRender();},
_dhRender:function(){
  const kw=(document.getElementById('dhKw')?.value||'').toLowerCase();
  const tp=document.getElementById('dhType')?.value||'';
  const yr=document.getElementById('dhYr')?.value||'';
  var rows=(window._dhHist||[]).filter(function(h){
    return(!kw||(h.doc_no||'').toLowerCase().includes(kw)||(h.title||'').toLowerCase().includes(kw)||(h.change_summary||'').toLowerCase().includes(kw))
      &&(!tp||h.doc_type===tp)
      &&(!yr||(h.created_at||'').startsWith(yr));
  });
  /* [v2.133] 헤더 너비 글자수 비례 동적 조정 */
  const docNoMaxLen=Math.max(8,...rows.map(r=>(r.doc_no||'').length));
  const summaryMaxLen=Math.max(6,...rows.map(r=>(r.change_summary||'').length));
  const docNoW=Math.min(160,Math.max(100,docNoMaxLen*9+24))+'px';
  const summaryW=Math.min(260,Math.max(120,summaryMaxLen*12+24))+'px';
  Tbl.render({el:'#dhTbl',
    cols:[
      {key:'doc_no',        label:'문서번호',   w:docNoW,
        render:function(v,row){return '<span style="font-family:monospace;font-size:13px;font-weight:700;color:var(--pri);cursor:pointer" onclick="Pages.doc_history('+(row.doc_id||0)+')">'+(H.e(v)||'-')+'</span>';}},
      {key:'title',         label:'문서명',      w:'*'},
      {key:'doc_type',      label:'유형',        w:'80px',
        render:function(v){return H.e(Pages._DT[v]||v||'-');}},
      {key:'ver_no',        label:'버전',        w:'72px',
        render:function(v){return '<span class="badge bblu">'+H.e(v)+'</span>';}},
      {key:'change_summary',label:'변경 요약',   w:summaryW},
      {key:'created_at',    label:'개정일',      w:'96px'},
      {key:'status',        label:'상태',        w:'80px',
        render:function(v){
          const m={draft:'bgry',in_review:'bblu',pending:'bamb',active:'bgrn',obsolete:'bred',deleted:'bgry'};
          const lbl={draft:'초안',in_review:'검토중',pending:'결재대기',active:'유효',obsolete:'폐기',deleted:'삭제'};
          return '<span class="badge '+(m[v]||'bgry')+'">'+(lbl[v]||v||'-')+'</span>';
        }},
      {key:'dept',label:'담당부서',w:'80px'},
      {key:'created_by', label:'작성자',  w:'70px', align:'center',
        render:function(v){return v?H.e(v):'<span style="color:var(--tl)">-</span>';}},
      {key:'created_at', label:'작성일',  w:'88px', align:'center',
        render:function(v){return v?(v||'').slice(0,10):'<span style="color:var(--tl)">-</span>';}},
      /* [v2.152] 열람 컬럼 — doc_id 기반 화면 분할 열람 */
      {key:'doc_id', label:'열람', w:'52px', align:'center',
        render:function(v,row){
          return '<button class="btn bxs bblu" style="font-size:11px;padding:3px 8px" '
            +'data-doc-id="'+(v||row.id||0)+'" data-doc-title="'+H.e(row.title||row.doc_no||'')+'"'
            +' onclick="event.stopPropagation();'
            +'window._docViewTarget={id:+(this.dataset.docId),title:this.dataset.docTitle};'
            +'Pages._docSplitView(window._docViewTarget.id,window._docViewTarget.title)">👁 열람</button>';
        }},
    ],
    data:rows,
  });
},
/* ── 문서 열람창 [v2.151 신규] ──────────────────────────────────────────
   파일 타입에 따라 인라인 뷰어 제공:
   - PDF: iframe 직접 임베드 (브라우저 네이티브 PDF 뷰어)
   - 이미지(jpg/png/gif/webp/svg): img 태그로 표시
   - Office(xlsx/docx/pptx): Google Docs Viewer 임베드
   - 기타: 다운로드 안내
   파일이 없는 경우 FM.modal(파일 관리)로 연결
   ─────────────────────────────────────────────────────────────────── */
_docSplitView:async function(docId, title){
  /* [v2.153] 문서 열람 — pw.innerHTML 전체를 분할 레이아웃으로 교체
     좌측(45%): 목록 테이블 그대로 유지
     우측(55%): 파일 미리보기
     닫기: Nav.go(현재 페이지)로 재진입 → 완전 복원 보장
     파일 소스: doc_master.file_url(구버전) + doc_files 테이블(신버전) 모두 조회 */
  var w=document.getElementById('pw');
  if(!w) return;

  /* ① 현재 페이지 저장 (닫기 시 복원용) */
  var curPage=sessionStorage.getItem('qms_page')||'docs';

  /* ② 파일 URL 조회 — doc_master.file_url + doc_files 둘 다 확인 */
  var fileUrl=null, fileName=null;
  try{
    var docRow=(window._docRows||window._recRows||[]).find(function(r){
      return Number(r.id)===Number(docId);
    });
    if(docRow&&docRow.file_url){fileUrl=docRow.file_url;fileName=docRow.file_name||null;}
    if(typeof SB!=='undefined'&&SB.getDocFiles){
      var docFiles=await SB.getDocFiles(Number(docId));
      if(docFiles&&docFiles.length>0){
        var latest=docFiles[docFiles.length-1];
        if(latest.url){fileUrl=latest.url;fileName=latest.name||fileName;}
      }
    }
  }catch(e){console.warn('[docSplitView] 파일 조회 실패:',e);}

  /* ③ 파일 타입별 미리보기 HTML 생성 */
  var ext=(fileName||fileUrl||'').split('.').pop().toLowerCase().split('?')[0];
  var imgExts=['jpg','jpeg','png','gif','webp','svg','bmp'];
  var officeExts=['xlsx','xls','docx','doc','pptx','ppt'];
  var safeUrl=H.e(fileUrl||'');
  var safeTitle=H.e(title||fileName||'문서');
  var previewHtml='';
  if(!fileUrl){
    previewHtml='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:300px;gap:14px;padding:40px 20px;text-align:center">'
      +'<div style="font-size:48px">📭</div>'
      +'<div style="font-size:15px;font-weight:700;color:var(--text)">등록된 파일이 없습니다</div>'
      +'<div style="font-size:13px;color:var(--muted)">파일 관리에서 문서 파일을 먼저 첨부해 주세요.</div>'
      +'<button class="btn bpri" onclick="Modal.close&&Modal.close();FM.modal(\'doc-'+docId+'\')">📎 파일 관리 열기</button>'
      +'</div>';
  } else if(ext==='pdf'){
    previewHtml='<iframe src="'+safeUrl+'" style="width:100%;height:100%;border:none;display:block" title="'+safeTitle+'"></iframe>';
  } else if(imgExts.indexOf(ext)>=0){
    previewHtml='<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f8fafc;padding:16px">'
      +'<img src="'+safeUrl+'" alt="'+safeTitle+'" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12)">'
      +'</div>';
  } else if(officeExts.indexOf(ext)>=0){
    var encoded=encodeURIComponent(fileUrl);
    previewHtml='<div style="font-size:11px;color:var(--muted);text-align:center;padding:6px;background:var(--bg2)">Google Docs Viewer를 통해 표시됩니다</div>'
      +'<iframe src="https://docs.google.com/viewer?url='+encoded+'&embedded=true" style="width:100%;height:calc(100% - 28px);border:none;display:block" title="'+safeTitle+'"></iframe>';
  } else {
    previewHtml='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:40px 20px;text-align:center">'
      +'<div style="font-size:48px">📄</div>'
      +'<div style="font-size:14px;font-weight:700;color:var(--text)">'+H.e(fileName||'파일')+'</div>'
      +'<div style="font-size:12px;color:var(--muted)">이 파일 형식('+H.e(ext)+')은 브라우저에서 직접 볼 수 없습니다.</div>'
      +'<a href="'+safeUrl+'" download target="_blank" class="btn bpri">⬇ 파일 다운로드</a>'
      +'</div>';
  }

  /* ④ pw.innerHTML을 분할 레이아웃으로 완전 교체
     - 좌측(45%): 목록 테이블(Tbl.render 결과를 그대로 복원)
     - 우측(55%): 미리보기 패널(sticky, 전체 높이) */
  w.innerHTML=
    '<div style="display:flex;gap:14px;align-items:flex-start;min-height:0">'+
      /* 좌측 목록 */
      '<div id="splitListPane" style="flex:0 0 45%;min-width:0;overflow-x:auto">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
          '<div style="font-size:13px;font-weight:700;color:var(--text)">📋 문서 목록</div>'+
          '<button class="btn bout bsm" onclick="Pages._docSplitClose(\''+curPage+'\')">← 목록으로</button>'+
        '</div>'+
        '<div id="splitListTbl"></div>'+
      '</div>'+
      /* 우측 미리보기 */
      '<div style="flex:1;min-width:0;position:sticky;top:12px">'+
        '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;height:88vh">'+
          /* 헤더 */
          '<div style="background:linear-gradient(135deg,#1a5fa8 0%,#2563eb 100%);padding:10px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0">'+
            '<span style="font-size:20px">📄</span>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="color:#fff;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+safeTitle+'</div>'+
              (fileUrl?'<div style="color:rgba(255,255,255,.7);font-size:11px">'+H.e(fileName||ext.toUpperCase())+'</div>':'')+
            '</div>'+
            (fileUrl?'<a href="'+safeUrl+'" download target="_blank" class="btn bxs" style="background:rgba(255,255,255,.2);color:#fff;font-size:11px;padding:3px 10px;border:1px solid rgba(255,255,255,.3)">⬇ 다운로드</a>':'')+
            '<button class="btn bxs" style="background:rgba(255,255,255,.15);color:#fff;padding:3px 10px;font-size:12px;border:1px solid rgba(255,255,255,.3)" '+
              'onclick="Pages._docSplitClose(\''+curPage+'\')">✕ 닫기</button>'+
          '</div>'+
          /* 미리보기 본문 */
          '<div id="docSplitPreview" style="flex:1;overflow:auto;min-height:0">'+
            previewHtml+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';

  /* ⑤ 좌측 목록 재렌더 — splitListTbl 안에 각 페이지용 div id를 미리 생성 후 렌더
     _recRender/_dhRender/_docRender가 해당 id를 찾아 렌더하므로 id가 DOM에 있어야 함 */
  var slot=document.getElementById('splitListTbl');
  if(!slot) return;
  if(curPage==='rec'){
    slot.innerHTML='<div id="recTbl"></div>';
    Pages._recRender(window._recRows||[]);
  } else if(curPage==='doc_history_home'){
    slot.innerHTML='<div id="dhTbl"></div>';
    Pages._dhRender();
  } else {
    slot.innerHTML='<div id="docListPane"><div id="docTbl"></div></div>';
    Pages._docRender(window._docRows||[]);
  }
},

/* [v2.190] 교정관리 화면 분할 미리보기
   문서관리 _docSplitView와 동일한 패턴
   좌측: 교정이력 목록, 우측: 성적서 파일 미리보기 */
async _calSplitView(target){
  const w = document.getElementById('pw');
  if(!w) return;
  const curPage = sessionStorage.getItem('qms_page') || 'cal';
  const fileUrl  = target?.fileUrl  || '';
  const certNo   = target?.certNo   || '';
  const calName  = target?.name     || '';
  const calDate  = target?.calDate  || '';

  /* 파일 타입별 미리보기 HTML */
  const ext = fileUrl.split('.').pop().toLowerCase().split('?')[0];
  const imgExts    = ['jpg','jpeg','png','gif','webp','svg','bmp'];
  const officeExts = ['xlsx','xls','docx','doc','pptx','ppt'];
  const safeUrl    = H.e(fileUrl);
  const safeTitle  = H.e(certNo ? `성적서 ${certNo}` : `${calName} 교정성적서`);
  const subTitle   = H.e(`${calName}${calDate ? ' · ' + calDate : ''}`);

  let previewHtml = '';
  if(!fileUrl){
    previewHtml = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;min-height:300px;gap:14px;padding:40px 20px;text-align:center">
      <div style="font-size:48px">📭</div>
      <div style="font-size:15px;font-weight:700;color:var(--text)">첨부된 성적서가 없습니다</div>
      <div style="font-size:13px;color:var(--muted)">교정 등록 시 파일을 첨부해 주세요.</div>
    </div>`;
  } else if(ext === 'pdf'){
    previewHtml = `<iframe src="${safeUrl}" style="width:100%;height:100%;border:none;display:block" title="${safeTitle}"></iframe>`;
  } else if(imgExts.indexOf(ext) >= 0){
    previewHtml = `<div style="display:flex;align-items:center;justify-content:center;
        height:100%;background:#f8fafc;padding:16px">
      <img src="${safeUrl}" alt="${safeTitle}"
        style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12)">
    </div>`;
  } else if(officeExts.indexOf(ext) >= 0){
    const encoded = encodeURIComponent(fileUrl);
    previewHtml = `<div style="font-size:11px;color:var(--muted);text-align:center;padding:6px;background:var(--bg2)">
        Google Docs Viewer를 통해 표시됩니다</div>
      <iframe src="https://docs.google.com/viewer?url=${encoded}&embedded=true"
        style="width:100%;height:calc(100% - 28px);border:none;display:block" title="${safeTitle}"></iframe>`;
  } else {
    previewHtml = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;gap:14px;padding:40px 20px;text-align:center">
      <div style="font-size:48px">📄</div>
      <div style="font-size:14px;font-weight:700;color:var(--text)">${safeTitle}</div>
      <div style="font-size:12px;color:var(--muted)">이 파일 형식(${H.e(ext)})은 브라우저에서 직접 볼 수 없습니다.</div>
      <a href="${safeUrl}" download target="_blank" class="btn bpri">⬇ 파일 다운로드</a>
    </div>`;
  }

  /* 화면 분할 레이아웃 */
  w.innerHTML =
    '<div style="display:flex;gap:14px;align-items:flex-start;min-height:0">' +
      /* 좌측: 교정이력 목록 */
      '<div id="calSplitListPane" style="flex:0 0 45%;min-width:0;overflow-x:auto">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
          '<div style="font-size:13px;font-weight:700;color:var(--text)">📋 교정 이력</div>' +
          '<button class="btn bout bsm" onclick="Pages._calSplitClose()">← 목록으로</button>' +
        '</div>' +
        '<div id="calSplitTbl"></div>' +
      '</div>' +
      /* 우측: 성적서 미리보기 */
      '<div style="flex:1;min-width:0;position:sticky;top:12px">' +
        '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;' +
          'overflow:hidden;display:flex;flex-direction:column;height:88vh">' +
          /* 헤더 */
          '<div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);' +
            'padding:10px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0">' +
            '<span style="font-size:20px">📋</span>' +
            '<div style="flex:1;min-width:0">' +
              `<div style="color:#fff;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${safeTitle}</div>` +
              `<div style="color:rgba(255,255,255,.75);font-size:11px">${subTitle}</div>` +
            '</div>' +
            (fileUrl ? `<a href="${safeUrl}" download target="_blank" class="btn bxs"
              style="background:rgba(255,255,255,.2);color:#fff;font-size:11px;padding:3px 10px;border:1px solid rgba(255,255,255,.3)">⬇ 다운로드</a>` : '') +
            '<button class="btn bxs" style="background:rgba(255,255,255,.15);color:#fff;' +
              'padding:3px 10px;font-size:12px;border:1px solid rgba(255,255,255,.3)"' +
              'onclick="Pages._calSplitClose()">✕ 닫기</button>' +
          '</div>' +
          /* 미리보기 본문 */
          `<div style="flex:1;overflow:auto;min-height:0">${previewHtml}</div>` +
        '</div>' +
      '</div>' +
    '</div>';

  /* [v2.191] 좌측 교정이력 목록 재렌더 — _calRender() 직접 호출 */
  const slot = document.getElementById('calSplitTbl');
  if(!slot) return;
  slot.innerHTML = '<div id="calTbl"></div>'
    + '<div id="calCostChart"></div>';  /* _calRender가 참조하는 id 포함 */
  window._calRows = window._calRows || DB.cals || [];
  Pages._calRender();
},

/* [v2.190] 교정관리 분할 닫기 */
_calSplitClose(){
  Nav.go(sessionStorage.getItem('qms_page') || 'cal');
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
    /* [v2.151] window._docViewTarget으로 파일 정보를 전달 — 이스케이프 충돌 방지 */
    window._docViewTarget={id:docId,title:doc.title||'',file_url:doc.file_url||null,file_name:doc.file_name||null};
    document.getElementById('vHistActions').innerHTML=
      '<button class="btn bout bsm" onclick="Pages._docRevForm('+docId+')">✏️ 개정 기안</button>'+
      '<button class="btn bout bsm" onclick="Pages._docHistExcel('+docId+')">📥 이력 출력</button>'+
      /* [v2.152] _docViewer(팝업) → _docSplitView(화면 분할) 교체 */
      '<button class="btn bpri bsm" onclick="Pages._docSplitView(window._docViewTarget.id,window._docViewTarget.title)">📄 문서 열람</button>';
    /* [v2.65] 문서 정보 배너 — 깔끔한 카드 그리드 UI */
    /* [v2.143] doc_master.file_url(단일파일, 구버전 등록분)도 인식 */
    var fKey='doc-'+docId;
    if(doc.file_url && !(App.files[fKey]&&App.files[fKey].length)){
      App.files[fKey]=[{name:doc.file_name||'첨부파일',path:null,url:doc.file_url,size:'',date:''}];
    }
    var filesBtnHtml=FM.btn(fKey);
    /* [v2.397.2 UI개선] 개정이력 문서 정보 배너 */
    document.getElementById('vDocInfo').innerHTML=
      /* 헤더: 그라디언트 배경 + 문서번호/제목/유형/버전 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;overflow:hidden">'+
        '<div style="background:linear-gradient(135deg,#1a5fa8 0%,#2563eb 100%);padding:14px 18px;color:#fff">'+
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
            '<span style="font-family:monospace;font-size:13px;font-weight:700;background:rgba(255,255,255,.22);padding:3px 10px;border-radius:6px">'+H.e(doc.doc_no||'-')+'</span>'+
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
   지식 검색 허브 [v2.65]
   ══════════════════════════════════════════════════ */
async doc_search(){
  var w=document.getElementById('pw');
  w.innerHTML=
    '<div class="ph"><div><div class="ptit">🔍 지식 검색 허브</div>'+
    '<div style="font-size:13px;color:var(--muted)">문서번호 · 제목 · 태그 통합 실시간 검색</div></div></div>'+
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
  var html='<div style="font-size:13px;color:var(--muted);margin-bottom:10px">\'<b>'+H.e(kw)+'</b>\' 검색 결과 <b>'+rows.length+'</b>건</div><div style="display:flex;flex-direction:column;gap:8px">';
  rows.forEach(function(r){
    html+='<div style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:14px 16px;cursor:pointer" onclick="Pages.doc_history('+r.id+')" onmouseover="this.style.borderColor=\'#93c5fd\';this.style.background=\'#eff6ff\'" onmouseout="this.style.borderColor=\'var(--brd)\';this.style.background=\'var(--card)\'">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">'+
        '<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
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
  /* [v2.134 EQS] TOP10 표 문서번호 헤더 너비 글자수 비례 동적 조정 */
  var top10NoMaxLen=Math.max(8,...(summary.byDoc||[]).map(d=>(d.doc_no||'').length));
  var top10NoW=Math.min(160,Math.max(100,top10NoMaxLen*9+24));
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
      '<div style="font-size:13px;color:var(--muted)">열람·다운로드·공유 이력 (최근 30일)</div>'+
    '</div></div>'+
    '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">'+
      '<div style="flex:1;min-width:200px">'+
        '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">문서 선택</div>'+
        '<select class="fsel" id="distDocSel" style="width:100%;padding:8px 10px" onchange="Pages._distLoadLog(this.value)">'+
          '<option value="">— 전체 문서 이력 —</option>'+
          docs.map(function(d){return'<option value="'+d.id+'">'+H.e(d.doc_no)+' '+H.e(d.title)+'</option>';}).join('')+
        '</select>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">외부 공유 링크</div>'+
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
      '<div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--text)">📈 최근 30일 인기 문서 TOP 10</div>'+
      '<div style="border:1px solid var(--brd);border-radius:8px;overflow:hidden">'+
        (summary.byDoc&&summary.byDoc.length
          ?'<table style="width:100%;border-collapse:collapse;font-size:13px">'+
            '<thead><tr style="background:var(--bg2)"><th style="padding:9px 12px;width:36px;font-weight:700;color:var(--muted)">순위</th>'+
            '<th style="padding:9px 12px;width:'+top10NoW+'px;font-weight:700;color:var(--muted)">문서번호</th><th style="padding:9px 12px;font-weight:700;color:var(--muted)">제목</th>'+
            '<th style="padding:9px 12px;text-align:right;width:60px;font-weight:700;color:var(--muted)">이용수</th></tr></thead><tbody>'+
            summary.byDoc.map(function(d,i){
              return'<tr style="border-bottom:1px solid var(--brd)">'+
                '<td style="padding:9px 12px;text-align:center;font-weight:700;color:'+(i<3?'#d6952f':'var(--muted)')+'">'+
                  (i<3?['🥇','🥈','🥉'][i]:i+1)+'</td>'+
                '<td style="padding:9px 12px;font-family:monospace;font-size:13px;color:#3b82c4">'+H.e(d.doc_no)+'</td>'+
                '<td style="padding:9px 12px">'+H.e(d.title)+'</td>'+
                '<td style="padding:9px 12px;text-align:right;font-weight:700">'+d.count+'</td></tr>';
            }).join('')+'</tbody></table>'
          :'<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">아직 배포 이력이 없습니다.</div>')+
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
  /* [v2.134 EQS] 문서번호 헤더 너비 글자수 비례 동적 조정 */
  var distNoMaxLen=Math.max(8,...data.map(r=>(r.doc_no||'').length));
  var distNoW=Math.min(160,Math.max(100,distNoMaxLen*9+24))+'px';
  Tbl.render({el:'#distTbl',cols:[
    {key:'created_at',  label:'일시',       w:'140px'},
    {key:'doc_no',      label:'문서번호',   w:distNoW,render:function(v){return'<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">'+H.e(v)+'</span>';}},
    {key:'doc_title',   label:'문서 제목'},
    {key:'action',      label:'액션',       w:'100px',align:'center',render:function(v){return'<span class="badge '+(cls[v]||'bgry')+'" style="font-size:10px">'+(lb[v]||H.e(v))+'</span>';}},
    {key:'user_name',   label:'사용자',     w:'80px'},
    {key:'dept',        label:'부서',       w:'70px'},
    {key:'share_token', label:'공유토큰',   w:'100px',render:function(v){return v?'<span style="font-family:monospace;font-size:13px;color:var(--muted)">'+H.e(v.slice(0,8))+'...</span>':'-';}},
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
      '<div class="sd-icon" style="background:#fbe9ea;color:#cd5b63">🚨</div>'+
      '<div><div class="sd-val">'+expired.length+'</div><div class="sd-lbl">만료됨</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'d7\')">'+
      '<div class="sd-icon" style="background:#fbeed4;color:#d6952f">⚠️</div>'+
      '<div><div class="sd-val">'+d7.length+'</div><div class="sd-lbl">D-7 이내</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'d30\')">'+
      '<div class="sd-icon" style="background:#fdf6dd;color:#bf932e">📅</div>'+
      '<div><div class="sd-val">'+d30.length+'</div><div class="sd-lbl">D-30 이내</div></div></div>'+
    '<div class="sd-card" style="cursor:pointer" onclick="Pages._rcFilter(\'all\')">'+
      '<div class="sd-icon" style="background:#e8f4fd;color:#3b82c4">📋</div>'+
      '<div><div class="sd-val">'+rows.filter(function(r){return r.status==="active";}).length+'</div><div class="sd-lbl">전체 유효</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">🔔 검토 주기 관리</div>'+
      '<div style="font-size:13px;color:var(--muted)">만료 임박 문서 현황 및 검토 주기 설정</div>'+
    '</div><div class="pac">'+
      '<button class="btn bred bsm" onclick="Pages._rcSendAlert(7)">🚨 D-7 긴급알림</button>'+
      '<button class="btn bamb bsm" onclick="Pages._rcSendAlert(30)">🔔 D-30 알림발송</button>'+
      '<button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiDocReviewPlan()" title="AI로 검토 우선순위 추천">🤖 AI 검토 계획</button>'+
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
  /* [v2.134 EQS] 문서번호 헤더 너비 글자수 비례 동적 조정 */
  var rcNoMaxLen=Math.max(8,...(rows||[]).map(r=>(r.doc_no||'').length));
  var rcNoW=Math.min(160,Math.max(100,rcNoMaxLen*9+24))+'px';
  Tbl.render({el:'#rcTbl',cols:[
    {key:'doc_no',        label:'문서번호',   w:rcNoW,render:function(v,row){return'<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';}},
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
   D7: 연관 문서 추천 [v2.65 Phase 3]
   동일 태그 기반 연관 문서 패널 + 유사 문서 추천
   ══════════════════════════════════════════════════ */

/**
 * [v2.65] D7: 연관 문서 추천 페이지
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
      '<div style="font-size:13px;color:var(--muted)">태그 기반 연관 문서 탐색 · 유사 문서 추천</div>'+
    '</div></div>'+

    /* ① 문서 선택 */
    '<div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:16px 18px;margin-bottom:16px">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">📄 기준 문서 선택</div>'+
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
      '<div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--text)">🏷️ 전체 태그 현황 <span style="font-size:12px;font-weight:400;color:var(--muted)">(클릭 시 해당 태그 문서 표시)</span></div>'+
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
          '<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
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
          '<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">'+H.e(r.doc_no||'-')+'</span>'+
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
   D8: 문서 현황 대시보드 [v2.65 Phase 4]
   KPI 카드 · 유형 분포 · 상태 현황 · 심사 준비율 게이지
   ══════════════════════════════════════════════════ */

/**
 * [v2.65] D8: 문서 현황 대시보드
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
  /* [v2.134 EQS] 문서번호 헤더 너비 글자수 비례 동적 조정 */
  var recentNoMaxLen=Math.max(8,...recent.map(r=>(r.doc_no||'').length));
  var recentNoW=Math.min(160,Math.max(100,recentNoMaxLen*9+24));

  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">📊 문서 현황 대시보드</div>'+
      '<div style="font-size:13px;color:var(--muted);margin-top:2px">ISO 9001 문서화된 정보 관리 현황</div>'+
    '</div><div class="pac">'+
      '<button class="btn bout bsm" onclick="Pages._dashRefresh()">🔄 새로고침</button>'+
      '<button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiDocDashAnalyze()" title="AI로 문서 현황 종합 분석">🤖 AI 현황 분석</button>'+
    '</div></div>'+

    /* ① KPI 카드 */
    '<div class="stat-dash" style="margin-bottom:22px">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'\',\'all\')">'+
        '<div class="sd-icon" style="background:#e8f4fd;color:#3b82c4">📄</div>'+
        '<div><div class="sd-val">'+total+'</div><div class="sd-lbl">전체 문서</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'active\',\'유효\')">'+
        '<div class="sd-icon" style="background:#e3f6ec;color:#3fa873">✅</div>'+
        '<div><div class="sd-val">'+byStatus.active+'</div><div class="sd-lbl">유효(Active)</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._docStatClick(\'in_review\',\'검토중\')">'+
        '<div class="sd-icon" style="background:#e7eefc;color:#4a7cd4">🔄</div>'+
        '<div><div class="sd-val">'+byStatus.in_review+'</div><div class="sd-lbl">검토중</div></div>'+
      '</div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages.doc_review_cycle()">'+
        '<div class="sd-icon" style="background:'+(expiring>0?'#fbe9ea':'#e3f6ec')+';color:'+(expiring>0?'#cd5b63':'#3fa873')+'">'+
          (expiring>0?'⚠️':'✅')+
        '</div>'+
        '<div><div class="sd-val" style="color:'+(expiring>0?'#cd5b63':'#3fa873')+'">'+expiring+'</div>'+
        '<div class="sd-lbl">D-30 만료임박</div></div>'+
      '</div>'+
    '</div>'+

    /* ② 차트 영역 */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">'+

      /* 유형별 분포 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:20px">'+
        '<div style="font-size:14px;font-weight:700;margin-bottom:16px;color:var(--text)">📂 유형별 분포</div>'+
        '<div id="dashTypeChart"></div>'+
      '</div>'+

      /* 상태별 현황 + 심사준비율 */
      '<div style="background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:20px">'+
        '<div style="font-size:14px;font-weight:700;margin-bottom:16px;color:var(--text)">📊 상태별 현황</div>'+
        '<div id="dashStatusChart"></div>'+
        /* 심사 준비율 게이지 */
        '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--brd)">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
            '<span style="font-size:13px;font-weight:700;color:var(--text)">🏅 심사 준비율</span>'+
            '<span style="font-size:18px;font-weight:700;color:'+(readyPct>=80?'#3fa873':readyPct>=60?'#d6952f':'#cd5b63')+'">'+readyPct+'%</span>'+
          '</div>'+
          '<div style="height:12px;background:var(--bg2);border-radius:6px;overflow:hidden">'+
            '<div style="height:100%;background:'+(readyPct>=80?'#5fbf94':readyPct>=60?'#e3ab52':'#e08089')+';width:'+readyPct+'%;border-radius:6px;transition:width .6s ease"></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-top:6px">'+
            '유효 '+byStatus.active+'건 / (유효+검토중) '+readyBase+'건 기준'+
          '</div>'+
        '</div>'+
      '</div>'+

    '</div>'+

    /* ③ 최근 등록/개정 */
    '<div style="background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:20px">'+
      '<div style="font-size:14px;font-weight:700;margin-bottom:14px;color:var(--text)">🕐 최근 등록/개정 문서</div>'+
      (recent.length
        ?'<table style="width:100%;border-collapse:collapse;font-size:13px">'+
          '<thead><tr style="background:var(--bg2)">'+
            '<th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--muted);width:'+recentNoW+'px;border-radius:8px 0 0 8px">문서번호</th>'+
            '<th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--muted)">제목</th>'+
            '<th style="padding:10px 14px;text-align:center;font-weight:700;color:var(--muted);width:84px">버전</th>'+
            '<th style="padding:10px 14px;text-align:center;font-weight:700;color:var(--muted);width:84px">상태</th>'+
            '<th style="padding:10px 14px;text-align:right;font-weight:700;color:var(--muted);width:124px;border-radius:0 8px 8px 0">등록일</th>'+
          '</tr></thead><tbody>'+
          recent.map(function(r){
            return'<tr style="border-bottom:1px solid var(--brd)" onmouseover="this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'\'">'+
              '<td style="padding:11px 14px"><span style="font-family:monospace;font-size:12.5px;font-weight:700;color:#3b82c4;cursor:pointer" onclick="Pages.doc_history('+r.id+')">'+H.e(r.doc_no||'-')+'</span></td>'+
              '<td style="padding:11px 14px;font-weight:500;cursor:pointer" onclick="Pages.doc_history('+r.id+')">'+H.e(r.title||'-')+'</td>'+
              '<td style="padding:11px 14px;text-align:center"><span style="background:#ede9fe;color:#6d4fb8;font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px">'+H.e(r.current_ver||'-')+'</span></td>'+
              '<td style="padding:11px 14px;text-align:center">'+Pages._dBadge(r.status)+'</td>'+
              '<td style="padding:11px 14px;text-align:right;font-size:12px;color:var(--muted)">'+
                (r.created_at?new Date(r.created_at).toLocaleDateString('ko-KR'):'-')+
              '</td>'+
            '</tr>';
          }).join('')+
          '</tbody></table>'
        :'<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">등록된 문서가 없습니다.</div>')+
    '</div>'+

    /* ④ 업무 흐름도 — 가로형, 각 박스 클릭 시 해당 메뉴로 이동 */
    Pages._dashFlowSvg()+
    '';

  /* 차트 렌더 (약간의 딜레이로 DOM 완성 후 실행) */
  window._dashByType=byType;
  window._dashByStatus=byStatus;
  setTimeout(function(){ Pages._dashRenderCharts(); }, 100);
},

/* [v2.144] 문서관리 업무 흐름도 — 가로형 SVG, 박스 클릭 시 Nav.go로 해당 메뉴 이동
   작성(문서목록/기록관리) → 승인(결재함) → 확정(개정이력) → 활용(배포/검색/연관문서)
   검토주기는 개정이력에서 분기되어 만료를 감시하는 역할로 별도 표시 */
_dashFlowSvg(){
  var C={blue:'#3b82c4',coral:'#cd5b63',teal:'#3fa873',amber:'#d6952f'};
  var bg={blue:'#e8f4fd',coral:'#fbe9ea',teal:'#e3f6ec',amber:'#fdf3e3'};
  function box(x,y,w,h,page,icon,title,sub,c){
    return '<g style="cursor:pointer" onclick="Nav.go(\''+page+'\')">'+
      '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="'+bg[c]+'" stroke="'+C[c]+'" stroke-width="1" opacity="0.95"/>'+
      '<text x="'+(x+w/2)+'" y="'+(y+22)+'" text-anchor="middle" font-size="13" font-weight="700" fill="'+C[c]+'">'+icon+' '+title+'</text>'+
      '<text x="'+(x+w/2)+'" y="'+(y+40)+'" text-anchor="middle" font-size="11" fill="var(--muted)">'+sub+'</text>'+
    '</g>';
  }
  function arrow(x1,y1,x2,y2,dashed){
    var dash=dashed?' stroke-dasharray="4,3"':'';
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="var(--brd)" stroke-width="1.5" marker-end="url(#dashArrow)"'+dash+'/>';
  }
  var svg=''+
  '<div style="background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:20px;margin-top:18px">'+
    '<div style="font-size:14px;font-weight:700;margin-bottom:4px;color:var(--text)">🔀 문서관리 업무 흐름</div>'+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:14px">박스를 클릭하면 해당 메뉴로 이동합니다</div>'+
    '<div style="width:100%;overflow-x:auto">'+
    '<svg viewBox="0 0 860 230" style="width:100%;min-width:760px;height:auto" preserveAspectRatio="xMinYMid meet">'+
      '<defs><marker id="dashArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'+
        '<path d="M1 1L8 5L1 9" fill="none" stroke="var(--brd)" stroke-width="1.6"/></marker></defs>'+

      /* 단계 라벨 */
      '<text x="40" y="14" font-size="11" font-weight="700" fill="var(--muted)">① 작성</text>'+
      '<text x="260" y="14" font-size="11" font-weight="700" fill="var(--muted)">② 승인</text>'+
      '<text x="430" y="14" font-size="11" font-weight="700" fill="var(--muted)">③ 확정</text>'+
      '<text x="600" y="14" font-size="11" font-weight="700" fill="var(--muted)">④ 활용</text>'+

      /* ① 작성 */
      box(40,24,150,56,'docs','📄','문서 목록','등록 · 파일첨부','blue')+
      box(40,96,150,56,'rec','📋','기록 관리','증빙 기록 등록','blue')+

      /* 화살표: 작성 → 승인 */
      arrow(190,52,256,52,false)+
      arrow(190,124,256,52,false)+

      /* ② 승인 */
      box(260,24,150,56,'doc_approval','✍️','결재함','승인 · 반려','coral')+
      arrow(410,52,426,52,false)+

      /* ③ 확정 */
      box(430,24,150,56,'doc_history_home','🕐','개정 이력','버전별 기록','coral')+
      arrow(580,52,596,52,false)+

      /* ④ 활용 (세로 3단) */
      box(600,24,150,52,'doc_distribution','📤','배포 관리','열람 · 공유 이력','teal')+
      box(600,84,150,52,'doc_search','🔍','지식 검색','통합 키워드 검색','teal')+
      box(600,144,150,52,'doc_recommend','💡','연관 문서','태그 기반 추천','teal')+

      /* 검토 주기 — 개정이력에서 분기되어 만료 감시 (점선) */
      arrow(505,80,505,150,true)+
      '<text x="515" y="118" font-size="10" fill="var(--muted)">감시</text>'+
      box(430,154,150,56,'doc_review_cycle','🔔','검토 주기','만료 임박 알림','amber')+

    '</svg>'+
    '</div>'+
  '</div>';
  return svg;
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
    var colors=['#4a7cd4','#3fa873','#d6952f','#8b6fcf','#cd5b63','#3b9cb0'];
    typeEl.innerHTML=entries.map(function(e,i){
      var pct=Math.round((e[1]/maxVal)*100);
      return'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
        '<div style="width:78px;font-size:12.5px;color:var(--muted);text-align:right;flex-shrink:0;font-weight:500">'+H.e(e[0])+'</div>'+
        '<div style="flex:1;height:22px;background:var(--bg2);border-radius:6px;overflow:hidden">'+
          '<div style="height:100%;background:'+(colors[i%colors.length])+';width:'+pct+'%;border-radius:6px;transition:width .5s ease;display:flex;align-items:center;padding-left:8px">'+
            '<span style="font-size:11.5px;color:#fff;font-weight:700;white-space:nowrap">'+e[1]+'건</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')||'<div style="color:var(--muted);font-size:13px">데이터 없음</div>';
  }

  /* ② 상태별 현황 — 컬러 스택 바 */
  var statusEl=document.getElementById('dashStatusChart');
  if(statusEl){
    var statusDef=[
      {key:'active',    label:'유효',   clr:'#5fbf94'},
      {key:'in_review', label:'검토중', clr:'#5e8ddb'},
      {key:'draft',     label:'초안',   clr:'#b6bfca'},
      {key:'obsolete',  label:'폐기',   clr:'#e08089'},
    ];
    var total2=Object.values(byStatus).reduce(function(s,v){return s+v;},0)||1;

    statusEl.innerHTML=
      /* 스택 바 */
      '<div style="height:28px;border-radius:8px;overflow:hidden;display:flex;margin-bottom:14px">'+
        statusDef.filter(function(s){return byStatus[s.key]>0;}).map(function(s){
          var pct=Math.round((byStatus[s.key]/total2)*100);
          return'<div style="background:'+s.clr+';width:'+pct+'%;display:flex;align-items:center;justify-content:center" title="'+s.label+': '+byStatus[s.key]+'건">'+
            (pct>8?'<span style="font-size:11.5px;color:#fff;font-weight:700">'+pct+'%</span>':'')+
          '</div>';
        }).join('')+
      '</div>'+
      /* 범례 */
      '<div style="display:flex;flex-wrap:wrap;gap:12px">'+
        statusDef.map(function(s){
          return'<div style="display:flex;align-items:center;gap:6px">'+
            '<div style="width:11px;height:11px;border-radius:3px;background:'+s.clr+'"></div>'+
            '<span style="font-size:12.5px;color:var(--muted);font-weight:500">'+s.label+' '+byStatus[s.key]+'</span>'+
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
   Q&A 페이지 [v2.65]
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
      {key:'file_url',   label:'파일',   w:'48px', align:'center',
        render:function(v){return v?'<a href="'+H.e(v)+'" target="_blank" title="첨부파일 열기" style="font-size:16px;text-decoration:none">📎</a>':'<span style="color:var(--tl)">—</span>';}},
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
      '<button class="btn bout bsm" onclick="SearchPop.open(\'rec\')" title="통합 검색 (F3)">🔎 Search <span class="kbd">F3</span></button>'+
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
  /* [v2.134 EQS] 기록번호 헤더 너비 글자수 비례 동적 조정 */
  var recNoMaxLen=Math.max(8,...(rows||[]).map(r=>(r.doc_no||'').length));
  var recNoW=Math.min(160,Math.max(100,recNoMaxLen*9+24))+'px';
  Tbl.render({
    el:'#recTbl',
    cols:[
      {key:'doc_no',        label:'기록번호',   w:recNoW,
        render:function(v,row){
          return'<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8;cursor:pointer" onclick="Pages.doc_history('+row.id+')">'+H.e(v||'-')+'</span>';
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
      {key:'created_by',    label:'작성자',     w:'70px', align:'center',
        render:function(v){return v?'<span style="font-size:13px">'+H.e(v)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'created_at',    label:'작성일',     w:'88px', align:'center',
        render:function(v){return v?'<span style="font-size:13px">'+(v||'').slice(0,10)+'</span>':'<span style="color:var(--tl)">-</span>';}},
      {key:'id',            label:'파일',       w:'58px', align:'center',
        render:function(v,row){
          /* [v2.143] doc_master.file_url(단일파일, v2.131 이전 등록분)도 인식 —
             doc_files만 보던 FM.btn은 구버전 등록 파일을 표시 못했음 */
          var k='doc-'+v;
          if(row.file_url && !(App.files[k]&&App.files[k].length)){
            App.files[k]=[{name:row.file_name||'첨부파일',path:null,url:row.file_url,size:'',date:''}];
          }
          return FM.btn(k);
        }},
      /* [v2.152] 열람 컬럼 — 클릭 시 화면 분할하며 우측에 미리보기
         window._docViewTarget에 title 저장 후 참조(이스케이프 충돌 방지) */
      {key:'id', label:'열람', w:'52px', align:'center',
        render:function(v,row){
          var safeId=Number(v);
          /* 클릭 시 전역 변수에 메타 저장 후 splitView 호출 */
          return '<button class="btn bxs bblu" style="font-size:11px;padding:3px 8px" '
            +'title="문서 열람(화면 분할)" '
            +'data-doc-id="'+safeId+'" data-doc-title="'+H.e(row.title||'')+'"'
            +' onclick="event.stopPropagation();'
            +'window._docViewTarget={id:+this.dataset.docId,title:this.dataset.docTitle};'
            +'Pages._docSplitView(window._docViewTarget.id,window._docViewTarget.title)">👁 열람</button>';
        }},
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
_recForm:function(editRec){
  editRec=editRec||null;
  SB.getUsers().then(function(users){
    var uOpts=users.map(function(u){return'<option value="'+u.id+'">'+H.e(u.name||u.username)+'('+H.e(u.dept||'')+')</option>';}).join('');
    var catOpts=['품질','생산','구매','안전','환경','기타'].map(function(x){
      return'<option'+(editRec&&editRec.category===x?' selected':'')+'>'+x+'</option>';
    }).join('');
    var cycleOpts=['annual','quarterly','monthly'].map(function(c){
      var lbl={annual:'연간',quarterly:'분기',monthly:'매월'}[c];
      return '<option value="'+c+'"'+(editRec&&editRec.review_cycle===c?' selected':(!editRec&&c==='annual'?' selected':''))+'>'+lbl+'</option>';
    }).join('');
    Modal.open({title:editRec?'✏️ 기록 수정 — '+H.e(editRec.doc_no||''):'기록 등록',size:'mlg',body:
      '<div class="fg2">'+
      '<div class="fgroup"><label class="fl req">기록 번호</label><input class="fc" id="fnDocNo" placeholder="예: REC-001" value="'+H.e(editRec?editRec.doc_no:'')+'"></div>'+
      '<div class="fgroup"><label class="fl req">기록 제목</label><input class="fc" id="fnTitle" placeholder="예: 수입검사 성적서" value="'+H.e(editRec?editRec.title:'')+'"></div>'+
      '<div class="fgroup" style="display:none"><select class="fc" id="fnType"><option value="record" selected>기록</option></select></div>'+
      '<div class="fgroup"><label class="fl">분류</label><select class="fc" id="fnCat"><option value="">선택 안함</option>'+catOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">검토 주기</label><select class="fc" id="fnCycle">'+cycleOpts+'</select></div>'+
      '<div class="fgroup"><label class="fl">다음 검토일</label><input class="fc" id="fnNextReview" type="date" value="'+H.e(editRec?(editRec.next_review_at||''):'')+'"></div>'+
      '<div class="fgroup"><label class="fl">담당 부서</label><input class="fc" id="fnDept" value="'+H.e(editRec?editRec.dept:'')+'"></div>'+
      '<div class="fgroup ff"><label class="fl">태그</label><input class="fc" id="fnTags" placeholder="쉼표로 구분 (예: 검사기록, 품질)" value="'+H.e(editRec?(editRec.tags||[]).join(', '):'')+'"></div>'+
      '<div class="fgroup"><label class="fl">결재자</label><select class="fc" id="fnApprover"><option value="">선택 안함</option>'+uOpts+'</select></div>'+
      '<div class="fgroup ff"><label class="fl">비고</label><input class="fc" id="fnSummary"></div>'+
      '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._docSave('+(editRec?editRec.id:'null')+')">'+(editRec?'수정 저장':'등록')+'</button>'});
  });
},
/* ── 시정조치 ── */
/* ════ 개선활동 — 시정조치(CAR) [v2.139 전면재작성] ════
   흐름: 부적합 등록 → 부적합통보서 발행 → 대책접수 → 대책실시 → 유효성 평가
   NC 연계: NC 상세에서 "CAR 발행" 버튼 → nc_id/nc_no 자동 채움
   ═══════════════════════════════════════════════════════ */
async car(){
  /* [v2.192] 시정조치 조회 — 목록형+칸반형, 검색조건, 결정(반려/승인/종료) */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const fresh=await SB.getCars();
  if(fresh&&fresh.length>=0) DB.cars=fresh;
  const data=DB.cars||[];
  const open=data.filter(c=>c.status!=='완료'&&c.status!=='종결').length;
  const byStatus={접수:0,대책접수:0,대책실시:0,유효성평가:0,완료:0,반려:0,종결:0};
  data.forEach(c=>{if(byStatus[c.status]!==undefined)byStatus[c.status]++;});

  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">🔍 시정조치 조회</div>
         <div class="psub">접수된 시정조치 검토 · 반려 · 승인 · 종료 결정</div></div>
    <div class="pac">
      <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiCarAnalyze()">🤖 AI 분석</button>
      <button class="btn bout bsm" onclick="Nav.go('car_input')">✍️ 시정조치 입력</button>
    </div>
  </div>
  <div class="stat-dash" style="margin-bottom:12px">
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🔧</div>
      <div><div class="sd-val">${data.length}</div><div class="sd-lbl">전체</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">📋</div>
      <div><div class="sd-val">${byStatus['접수']||0}</div><div class="sd-lbl">접수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fce7f3;color:#ec4899">⚙️</div>
      <div><div class="sd-val">${(byStatus['대책접수']||0)+(byStatus['대책실시']||0)}</div><div class="sd-lbl">진행</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#dcfce7;color:#16a34a">✅</div>
      <div><div class="sd-val">${byStatus['완료']||0}</div><div class="sd-lbl">완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🚫</div>
      <div><div class="sd-val">${byStatus['반려']||0}</div><div class="sd-lbl">반려</div></div></div>
  </div>

  <!-- 검색 필터 -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">
    <input class="fc" id="carSearch" style="width:220px;font-size:13px"
      placeholder="🔍 CAR번호·제목·품목·담당자"
      oninput="Pages._carRender()">
    <select class="fsel" id="carSrcF" onchange="Pages._carRender()">
      <option value="">전체 발생원</option>
      ${['부적합','내부심사','고객불만','외부심사','기타'].map(s=>`<option value="${s}">${s}</option>`).join('')}
    </select>
    <select class="fsel" id="carStatusF" onchange="Pages._carRender()">
      <option value="">전체 상태</option>
      ${['접수','대책접수','대책실시','유효성평가','완료','반려','종결'].map(s=>`<option value="${s}">${s}</option>`).join('')}
    </select>
    <select class="fsel" id="carAssigneeF" onchange="Pages._carRender()">
      <option value="">전체 담당자</option>
      ${[...new Set(data.map(c=>c.assignee||'').filter(Boolean))].sort().map(a=>`<option value="${a}">${H.e(a)}</option>`).join('')}
    </select>
    <button class="btn bout bsm" onclick="document.getElementById('carSearch').value='';document.getElementById('carSrcF').value='';document.getElementById('carStatusF').value='';document.getElementById('carAssigneeF').value='';Pages._carRender()">🔄 초기화</button>
  </div>

  <!-- 탭: 목록/칸반 -->
  <div class="stabs" style="margin-bottom:10px">
    <button class="stab-btn on" data-tab="list" onclick="Pages._carTab('list',this)">📋 목록</button>
    <button class="stab-btn" data-tab="kanban" onclick="Pages._carTab('kanban',this)">📌 칸반</button>
  </div>
  <div id="carListPane"><div id="carTbl"></div></div>
  <div id="carKanbanPane" style="display:none"></div>`;

  Pages._carRender();
},

/* ── CAR 목록 렌더 ── */
/* [v2.192] 시정조치 조회 — 목록 렌더 + 결정 버튼 */
_carRender(){
  const data=DB.cars||[];
  const q=(document.getElementById('carSearch')?.value||'').toLowerCase();
  const src=document.getElementById('carSrcF')?.value||'';
  const st=document.getElementById('carStatusF')?.value||'';
  const as=document.getElementById('carAssigneeF')?.value||'';
  const filtered=data.filter(c=>{
    if(q&&![(c.no||''),(c.title||''),(c.item||''),(c.assignee||'')].join(' ').toLowerCase().includes(q))return false;
    if(src&&c.source!==src)return false;
    if(st&&c.status!==st)return false;
    if(as&&c.assignee!==as)return false;
    return true;
  });
  Tbl.render({
    el:'#carTbl',
    rowStyle:(row)=>{
      if(row.status==='완료'||row.status==='종결') return '';
      if(row.status==='반려') return 'background:rgba(254,226,226,0.4);';
      if(row.due){
        const d=Math.ceil((new Date(row.due)-new Date())/86400000);
        if(d<0) return 'background:rgba(254,226,226,0.5);';
        if(d<=3) return 'background:rgba(254,243,199,0.5);';
      }
      return '';
    },
    cols:[
      {key:'status',   label:'상태',    w:'80px', align:'center',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='유효성평가'?'bblu':v==='대책실시'?'bamb':v==='대책접수'?'bpur':v==='반려'?'bred':v==='종결'?'bgry':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'no',       label:'CAR번호', w:'150px', req:true,
        render:v=>`<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">${H.e(v||'-')}</span>`},
      {key:'source',      label:'발생원',  w:'72px',
        render:v=>`<span class="badge bpur" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'nc_no',    label:'NC참조',  w:'130px',
        render:v=>v?`<span style="font-family:monospace;font-size:12px;color:#7c3aed">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'title',    label:'제목',    w:'*'},
      {key:'assignee', label:'담당자',  w:'72px'},
      {key:'date',     label:'개시일',  w:'88px'},
      {key:'close_date',      label:'완료기한',w:'88px',
        render:v=>{
          if(!v) return '<span style="color:var(--tl)">-</span>';
          const d=Math.ceil((new Date(v)-new Date())/86400000);
          const cls=d<0?'bred':d<=3?'bamb':'bgrn';
          return`<span class="badge ${cls}" style="font-size:10px">${v}</span>`;
        }},
      /* [v2.202] 메일 발송 컬럼 — key:'no' 사용(id 중복 방지) */
      {key:'no', label:'메일', w:'56px', align:'center',
        render:(v,row)=>{
          const rowId=Number(row.id);
          const sent=!!(row.mail_sent);
          return sent
            ?`<span style="background:#f97316;color:#fff;font-size:10px;font-weight:700;
                padding:2px 8px;border-radius:12px">📧 발송</span>`
            :`<button class="btn bxs bout" style="font-size:10px;padding:2px 6px"
                onclick="event.stopPropagation();
                  window._carMailRow=(DB.cars||[]).find(c=>Number(c.id)===${rowId});
                  Pages._carInputMail()">📧</button>`;
        }},
      /* [v2.202] 결정 버튼 컬럼 — row.id 직접 사용(id 중복 방지) */
      {key:'assignee', label:'결정', w:'140px', align:'center',
        render:(v,row)=>{
          const rowId=Number(row.id);
          const done=row.status==='완료'||row.status==='종결'||row.status==='반려';
          if(done) return `<span style="font-size:11px;color:var(--muted)">${H.e(row.status)}</span>`;
          return `<div style="display:flex;gap:3px;justify-content:center">
            <button class="btn bxs bgrn" style="font-size:10px;padding:2px 6px"
              onclick="event.stopPropagation();Pages._carDecide(${rowId},'승인')">✅승인</button>
            <button class="btn bxs bred" style="font-size:10px;padding:2px 6px"
              onclick="event.stopPropagation();Pages._carDecide(${rowId},'반려')">🚫반려</button>
            <button class="btn bxs bgry" style="font-size:10px;padding:2px 6px"
              onclick="event.stopPropagation();Pages._carDecide(${rowId},'종결')">⛔종료</button>
          </div>`;
        }},
    ],
    data:filtered,
    onRow:row=>Nav.go('car_input',{carId:row.id}),
    onDel:async(ids)=>{
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({title:'🗑️ CAR 삭제 확인',
        msg:`선택한 <b style="color:#dc2626">${ids.length}건</b>의 시정조치를 삭제합니다.`,
        danger:true,
        onOk:async()=>{
          const numIds=ids.map(Number);
          if(_sb) for(const id of numIds){await _sb.from('corrective_actions').delete().eq('id',id);}
          DB.cars=(DB.cars||[]).filter(c=>!numIds.includes(Number(c.id)));
          Toast.show(`${numIds.length}건 삭제됐습니다.`,'ok');
          Pages._carRender();
        }
      });
    }
  });
  /* 칸반도 같이 갱신 */
  const kb=document.getElementById('carKanbanPane');
  if(kb&&kb.style.display!=='none') Pages._carKanbanRender(filtered);
},

/* [v2.192] 탭 전환 */
_carTab(tab, btn){
  document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b===btn));
  document.getElementById('carListPane').style.display=tab==='list'?'':'none';
  const kb=document.getElementById('carKanbanPane');
  kb.style.display=tab==='kanban'?'':'none';
  if(tab==='kanban'){
    const data=DB.cars||[];
    const q=(document.getElementById('carSearch')?.value||'').toLowerCase();
    const src=document.getElementById('carSrcF')?.value||'';
    const st=document.getElementById('carStatusF')?.value||'';
    const as=document.getElementById('carAssigneeF')?.value||'';
    const filtered=data.filter(c=>{
      if(q&&![(c.no||''),(c.title||''),(c.assignee||'')].join(' ').toLowerCase().includes(q))return false;
      if(src&&c.source!==src)return false;
      if(st&&c.status!==st)return false;
      if(as&&c.assignee!==as)return false;
      return true;
    });
    Pages._carKanbanRender(filtered);
  }
},

/* [v2.192] 칸반 렌더 */
_carKanbanRender(data){
  const el=document.getElementById('carKanbanPane');
  if(!el) return;
  const steps=['접수','대책접수','대책실시','유효성평가','완료'];
  const colors={접수:'#6366f1',대책접수:'#a855f7',대책실시:'#f59e0b',유효성평가:'#3b82f6',완료:'#22c55e'};
  const byStep={};
  steps.forEach(s=>{byStep[s]=data.filter(c=>c.status===s);});
  el.innerHTML=`<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px">
  ${steps.map(s=>`
    <div style="flex:0 0 220px;background:var(--bg2);border-radius:10px;padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:${colors[s]}">${s}</div>
        <span style="background:${colors[s]};color:#fff;border-radius:99px;padding:1px 8px;font-size:11px">${byStep[s].length}</span>
      </div>
      ${byStep[s].length===0?`<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">없음</div>`
        :byStep[s].map(c=>{
          const d=c.close_date?Math.ceil((new Date(c.close_date)-new Date())/86400000):null;
          const dday=d!==null?`<span style="font-size:10px;color:${d<0?'#dc2626':d<=3?'#d97706':'#16a34a'}">${d<0?'D+'+Math.abs(d):'D-'+d}</span>`:'';
          return`<div style="background:var(--card);border:1px solid var(--brd);border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer"
            onclick="Nav.go('car_input',{carId:${Number(c.id)}})">
            <div style="font-size:11px;font-family:monospace;color:#1a5fa8;margin-bottom:4px">${H.e(c.no||'-')}</div>
            <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${H.e(c.title||'')}">${H.e(c.title||'-')}</div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;color:var(--muted)">${H.e(c.assignee||'-')}</span>
              ${dday}
            </div>
          </div>`;
        }).join('')}
    </div>`).join('')}
  </div>`;
},

/* [v2.192] 결정 처리 — 반려/승인/종결 + 사유 입력 */
async _carDecide(carId, action){
  const car=(DB.cars||[]).find(c=>Number(c.id)===carId);
  if(!car){Toast.show('데이터를 찾을 수 없습니다.','err');return;}
  const actionColors={승인:'#16a34a',반려:'#dc2626',종결:'#6b7280'};
  const actionBadge={승인:'bgrn',반려:'bred',종결:'bgry'};
  Modal.open({
    title:`📋 ${action} 처리 — ${H.e(car.no||'')}`,
    size:'mmd',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri" style="background:${actionColors[action]}" onclick="Pages._carDecideExec(${carId},'${action}')">✅ ${action} 확정</button>`,
    body:`<div style="padding:8px 0">
      <div style="background:var(--bg2);border-radius:8px;padding:12px;margin-bottom:14px">
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">CAR번호</div>
        <div style="font-weight:700;color:#1a5fa8;font-family:monospace">${H.e(car.no||'')}</div>
        <div style="font-size:12px;margin-top:6px">${H.e(car.title||'')}</div>
      </div>
      <div style="margin-bottom:6px">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">
          <b style="color:#e11d48">${action} 사유 *</b>
        </label>
        <textarea id="carDecideReason" class="fc" rows="4"
          placeholder="${action==='승인'?'승인 의견을 입력하세요...':action==='반려'?'반려 사유를 상세히 입력하세요...':'종결 사유를 입력하세요...'}"
          style="resize:vertical"></textarea>
      </div>
      <div style="font-size:11px;color:var(--muted)">
        • 결정자: ${H.e(Auth._u?.name||Auth._u?.username||'현재 사용자')}<br>
        • 결정일시: ${new Date().toLocaleString('ko-KR')}
      </div>
    </div>`,
  });
},

async _carDecideExec(carId, action){
  const reason=(document.getElementById('carDecideReason')?.value||'').trim();
  if(!reason){Toast.show('사유를 입력하세요.','warn');return;}
  const statusMap={승인:'유효성평가',반려:'반려',종결:'종결'};
  const newStatus=statusMap[action];
  const res=await SB.updateCar(carId,{status:newStatus});
  if(!res?.ok){Toast.show('처리 실패','err');return;}
  /* 이력 저장 */
  await SB.addCarHistory({
    car_id:carId, action, reason,
    changed_by:Auth._u?.name||Auth._u?.username||'',
    changed_at:new Date().toISOString(),
  });
  /* 멘션 알림 */
  const car=(DB.cars||[]).find(c=>Number(c.id)===carId);
  if(car?.assignee){
    await SB.addMention({
      from:Auth._u?.name||'시스템',
      to:car.assignee,
      to_list:[car.assignee],
      text:`[시정조치 ${action}] ${car.no} — ${reason.slice(0,50)}`,
      message:`시정조치 ${car.no}이(가) ${action} 처리됐습니다. 사유: ${reason}`,
      ref:`car:${carId}`,
    });
  }
  const idx=(DB.cars||[]).findIndex(c=>Number(c.id)===carId);
  if(idx>=0) DB.cars[idx]={...DB.cars[idx],status:newStatus};
  Modal.close();
  Toast.show(`${action} 처리됐습니다.`,'ok');
  Pages._carRender();
},



/* ════════════════════════════════════════════════════════════
   [v2.192] car_input — 시정조치 입력 (전체화면 폼)
   기본정보 헤더 + 대책내용 BODY + 버튼 하단
   파일첨부, 멘션 연동, 엑셀 다운/업로드, 버전 이력 관리
   ════════════════════════════════════════════════════════════ */
async car_input(params={}){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';

  /* 데이터 로딩 */
  const fresh=await SB.getCars();
  if(fresh) DB.cars=fresh;
  const carId=params?.carId||window._carInputId||null;
  let row=carId?(DB.cars||[]).find(c=>Number(c.id)===Number(carId)):null;
  window._carInputId=carId;
  window._carInputRow=row||null;

  /* 버전 이력 로딩 */
  let versions=[];
  if(carId&&SB.getCarHistory) {
    const hist=await SB.getCarHistory(carId);
    versions=hist||[];
  }

  const isEdit=!!row;
  const today=H.today();
  const nextNo=(()=>{
    const d=today.replace(/-/g,'');
    const todayCars=(DB.cars||[]).filter(c=>(c.no||'').startsWith('CAR-'+d));
    return`CAR-${d}-${String(todayCars.length+1).padStart(3,'0')}`;
  })();
  const v=(key,fb='')=>isEdit?(row[key]!=null?row[key]:fb):fb;

  const userOpts=(DB.users||[]).filter(u=>u.active!==false).map(u=>{
    const nm=H.e(u.name||u.username);
    const sel=isEdit&&row.assignee===nm?'selected':(!isEdit&&(Auth._u?.name||Auth._u?.username)===nm?'selected':'');
    return`<option value="${nm}" ${sel}>${nm}${u.dept?' ('+H.e(u.dept)+')':''}</option>`;
  }).join('');

  const userMentionOpts=(DB.users||[]).filter(u=>u.active!==false)
    .map(u=>`<option value="${H.e(u.name||u.username)}">`).join('');

  const steps=['접수','대책접수','대책실시','유효성평가','완료','반려','종결'];
  const curStep=isEdit?(steps.indexOf(row.status||'접수')):-1;
  const stepColors={접수:'#6366f1',대책접수:'#a855f7',대책실시:'#f59e0b',유효성평가:'#3b82f6',완료:'#22c55e',반려:'#ef4444',종결:'#6b7280'};

  /* 단계 스텝바 */
  const mainSteps=['접수','대책접수','대책실시','유효성평가','완료'];
  const si=mainSteps.indexOf(row?.status||'접수');
  const stepBar=mainSteps.map((s,i)=>{
    const done=i<si; const active=i===si;
    return`<div style="display:flex;flex-direction:column;align-items:center;flex:1">
      <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        background:${done?'#22c55e':active?stepColors[s]:'#e5e7eb'};color:${done||active?'#fff':'#9ca3af'};
        font-size:12px;font-weight:700;margin-bottom:4px">${done?'✓':i+1}</div>
      <div style="font-size:10px;font-weight:${active?700:400};color:${active?stepColors[s]:'var(--muted)'}">${s}</div>
    </div>
    ${i<mainSteps.length-1?`<div style="flex:1;height:2px;background:${i<si?'#22c55e':'#e5e7eb'};margin-top:14px;max-width:60px"></div>`:''}`;
  }).join('');

  /* 버전 탭 */
  const versionTabs=versions.length>0
    ?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <button class="stab-btn on" onclick="Pages._carInputVersion('current',this)">현재</button>
        ${versions.slice(0,5).map((v,i)=>`<button class="stab-btn" onclick="Pages._carInputVersion(${i},this)">${v.version||('v'+(versions.length-i))}</button>`).join('')}
      </div>`
    :'';

  w.innerHTML=`
  <!-- 진행 스텝바 -->
  ${isEdit?`<div class="card" style="padding:14px 20px;margin-bottom:12px">
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">진행 단계</div>
    <div style="display:flex;align-items:center">${stepBar}</div>
  </div>`:''}

  <!-- 상단 액션 버튼 -->
  <div class="ph" style="margin-bottom:12px">
    <div>
      <div class="ptit">${isEdit?`✏️ 시정조치 수정 — ${H.e(row.no||'')}` : '✍️ 시정조치 입력'}</div>
      <div class="psub">${isEdit?H.e(row.title||''):'새 시정조치 등록'}</div>
    </div>
    <div class="pac" style="gap:6px">
      <button class="btn bout bsm" onclick="Nav.go('car')">← 목록</button>
      ${isEdit?`<button class="btn bsm" style="background:#f97316;color:#fff;border:none" onclick="Pages._carInputMail()">📧 메일</button>`:''}
      ${isEdit?`<button class="btn bout bsm" onclick="Pages._carInputPrint()">🖨️ 인쇄</button>`:''}
      ${isEdit?`<button class="btn bout bsm" onclick="Pages._carInputPreview()">👁 미리보기</button>`:''}
      <button class="btn bout bsm" onclick="ExcelMgr.download('car')" title="엑셀 양식 내려받기">📥 양식</button>
      <button class="btn bout bsm" onclick="ExcelMgr.openUpload('car')" title="엑셀 일괄 업로드">📤 업로드</button>
      <button class="btn bamb bsm" onclick="Pages._carInputSave('temp')">⏳ 임시저장</button>
      ${isEdit?`<button class="btn berr bsm" onclick="Pages._carInputDelete(${Number(carId)})">🗑️ 삭제</button>`:''}
      <button class="btn bpri" onclick="Pages._carInputSave('${isEdit?row.id:'new'}')">💾 저장</button>
    </div>
  </div>

  <div id="carInputVersionTabs">${versionTabs}</div>

  <!-- ① 기본정보 헤더 -->
  <div class="card" style="margin-bottom:12px;padding:18px 20px">
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
      📋 기본정보
      ${isEdit?`<span class="badge ${row.status==='완료'?'bgrn':row.status==='반려'?'bred':'bblu'}">${H.e(row.status||'접수')}</span>`:''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
      <input type="hidden" id="carInputId" value="${isEdit?row.id:''}">
      <input type="hidden" id="carInputNcId" value="${H.e(v('nc_id'))}">
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">CAR 번호</label>
        <input class="fc" id="carInputNo" value="${H.e(v('no',nextNo))}" ${isEdit?'readonly':''}
          style="font-family:monospace;font-weight:700;color:#1a5fa8">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px"><b style="color:#e11d48">발생원 *</b></label>
        <select class="fc" id="carInputSrc">
          ${['부적합','내부심사','고객불만','외부심사','기타'].map(s=>`<option value="${s}" ${v('source','부적합')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">NC 참조번호</label>
        <input class="fc" id="carInputNcNo" value="${H.e(v('nc_no'))}"
          placeholder="NC-20260601-001" style="font-family:monospace;color:#7c3aed"
          onblur="Pages._carInputNcAutofill(this.value)">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px"><b style="color:#e11d48">개시일 *</b></label>
        <input class="fc" type="date" id="carInputOpen" value="${H.e(v('date',today))}">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px"><b style="color:#e11d48">완료 기한 *</b></label>
        <input class="fc" type="date" id="carInputDue" value="${H.e(v('close_date',H.addDays(today,14)))}">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px"><b style="color:#e11d48">담당자 *</b></label>
        <select class="fc" id="carInputAssignee"><option value="">선택</option>${userOpts}</select>
      </div>
      <div style="grid-column:1/-1">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px"><b style="color:#e11d48">제목 *</b></label>
        <input class="fc" id="carInputTitle" value="${H.e(v('title'))}" placeholder="시정조치 제목">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">품목코드</label>
        <input class="fc" id="carInputItemCode" value="${H.e(v('item_code'))}"
          list="carInputItemList" placeholder="코드 검색..."
          oninput="(function(){var v=document.getElementById('carInputItemCode').value.split(' — ')[0].trim();var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||'')===v;});if(it)document.getElementById('carInputItem').value=it.name||it.item_name||'';})()">
        <datalist id="carInputItemList">
          ${(DB.items||[]).map(it=>`<option value="${H.e(it.item_code||it.code||'')}">${H.e((it.item_code||it.code||'')+' — '+(it.name||it.item_name||''))}</option>`).join('')}
        </datalist>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">품목명</label>
        <input class="fc" id="carInputItem" value="${H.e(v('item'))}" placeholder="품목코드 입력 시 자동완성" style="background:var(--bg2)">
      </div>
      <!-- [v2.198] 고객사 / 공급처 / 작업지시번호 -->
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">고객사</label>
        <input class="fc" id="carInputCustomer" value="${H.e(v('customer'))}"
          placeholder="예) ㈜대한전자">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">공급처</label>
        <input class="fc" id="carInputVendor" value="${H.e(v('vendor_name'))}"
          list="carInputVendorList" placeholder="거래처 검색..."
          oninput="Pages._carInputVendorAutofill()">
        <datalist id="carInputVendorList">
          ${(DB.vendors||[]).map(vn=>`<option value="${H.e(vn.vendor_name||'')}"></option>`).join('')}
        </datalist>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">작업지시번호</label>
        <input class="fc" id="carInputWorkOrder" value="${H.e(v('work_order'))}"
          placeholder="예) WO-20260710-001">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">상태</label>
        <select class="fc" id="carInputStatus">
          ${steps.map(s=>`<option value="${s}" ${v('status','접수')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <!-- [v2.201] 수량/불량률/유형/현상/처리방법/손실비용 -->
    <div style="border-top:1px solid var(--brd);margin-top:12px;padding-top:12px">
      <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">📊 수량 / 불량 정보</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">납품수량</label>
          <input class="fc" id="carInputShipQty" type="number" value="${H.e(v('ship_qty'))}" placeholder="0"
            oninput="Pages._carInputCalcRate()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">검사수량</label>
          <input class="fc" id="carInputInspQty" type="number" value="${H.e(v('insp_qty'))}" placeholder="0"
            oninput="Pages._carInputCalcRate()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">불량수량</label>
          <input class="fc" id="carInputBadQty" type="number" value="${H.e(v('bad_qty'))}" placeholder="0"
            oninput="Pages._carInputCalcRate()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">불량률 (%)</label>
          <input class="fc" id="carInputDefectRate" value="${H.e(v('defect_rate'))}" placeholder="자동계산"
            style="background:var(--bg2)" readonly>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">불량유형</label>
          <input class="fc" id="carInputDefectType" value="${H.e(v('defect_type'))}"
            placeholder="예) 치수불량, 외관불량">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">처리방법</label>
          <select class="fc" id="carInputActionType">
            ${['','선별','반품','폐기','특채','수리','기타'].map(s=>`<option value="${s}" ${v('action_type')===s?'selected':''}>${s||'선택'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="margin-top:8px">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">불량현상</label>
        <input class="fc" id="carInputDefectDesc" value="${H.e(v('defect_desc'))}"
          placeholder="불량현상 상세 기술">
      </div>
      <div style="margin-top:8px">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">부적합 비고</label>
        <input class="fc" id="carInputNcNote" value="${H.e(v('nc_note'))}" placeholder="부적합 관련 비고">
      </div>
    </div>
    <!-- [v2.201] 손실비용 -->
    <div style="border-top:1px solid var(--brd);margin-top:12px;padding-top:12px">
      <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">💰 손실비용</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">자재비 (원)</label>
          <input class="fc" id="carInputCostMat" type="number" value="${H.e(v('cost_material'))}" placeholder="0"
            oninput="Pages._carInputCalcCost()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">가공비 (원)</label>
          <input class="fc" id="carInputCostProc" type="number" value="${H.e(v('cost_process'))}" placeholder="0"
            oninput="Pages._carInputCalcCost()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">기타 (원)</label>
          <input class="fc" id="carInputCostEtc" type="number" value="${H.e(v('cost_etc'))}" placeholder="0"
            oninput="Pages._carInputCalcCost()">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">합계 (원)</label>
          <input class="fc" id="carInputCostTotal" value="${H.e(v('cost_total'))}" placeholder="자동계산"
            style="background:var(--bg2);font-weight:700;color:#dc2626" readonly>
        </div>
      </div>
    </div>
  </div>

  <!-- ② 대책 내용 BODY -->
  <div class="card" style="margin-bottom:12px;padding:18px 20px">
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">📝 대책 내용 (단계별 입력)</div>
    <div style="display:flex;flex-direction:column;gap:14px">

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ① 팀 구성 (D1) <span style="font-size:11px;color:var(--muted)">담당팀 및 구성원</span>
        </label>
        <textarea class="fc" id="carInputD1" rows="2" maxlength="500"
          placeholder="대책팀 구성 및 역할 기재..."
          oninput="document.getElementById('carInputD1cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d1_team'))}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--muted)"><span id="carInputD1cnt">${(v('d1_team')||'').length}</span>/500</div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ② 문제 기술 (D2) <span style="font-size:11px;color:var(--muted)">부적합 현상 및 문제 내용</span>
        </label>
        <textarea class="fc" id="carInputD2" rows="4" maxlength="500"
          placeholder="부적합 현상 및 문제 내용 상세 기술..."
          oninput="document.getElementById('carInputD2cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d2_desc'))}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--muted)"><span id="carInputD2cnt">${(v('d2_desc')||'').length}</span>/500</div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ③ 임시 대책 (D3) <span style="font-size:11px;color:var(--muted)">즉각적 임시 조치</span>
        </label>
        <textarea class="fc" id="carInputD3" rows="3" maxlength="500"
          placeholder="즉각적 임시 조치 내용..."
          oninput="document.getElementById('carInputD3cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d3_action'))}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--muted)"><span id="carInputD3cnt">${(v('d3_action')||'').length}</span>/500</div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ④ 근본 원인 분석 (D4 — 5-Why)
        </label>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[1,2,3,4,5].map(n=>`
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="background:#fef3c7;color:#d97706;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;margin-top:8px">Why ${n}</span>
            <textarea class="fc" id="carInputWhy${n}" rows="2" maxlength="500"
              placeholder="Why ${n}: ${n===1?'왜 발생했는가?':n===2?'왜 그 원인이 발생했는가?':n===3?'왜 막지 못했는가?':n===4?'왜 관리 기준이 없었는가?':'근본 원인은 무엇인가?'}"
              style="flex:1;resize:vertical">${H.e(v('d4_why'+n))}</textarea>
          </div>`).join('')}
        </div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ⑤ 대책 실시 (D5) <span style="font-size:11px;color:var(--muted)">실시한 시정조치</span>
        </label>
        <textarea class="fc" id="carInputD5" rows="3" maxlength="500"
          placeholder="실시한 시정조치 내용..."
          oninput="document.getElementById('carInputD5cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d5_action'))}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;color:var(--muted)">대책 실시일:
            <input class="fc" type="date" id="carInputD5Date" value="${H.e(v('d5_date'))}"
              style="width:140px;display:inline-block;margin-left:6px">
          </label>
          <span style="font-size:11px;color:var(--muted)"><span id="carInputD5cnt">${(v('d5_action')||'').length}</span>/500</span>
        </div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ⑥ 유효성 평가 (D6) <span style="font-size:11px;color:var(--muted)">시정조치 효과 확인</span>
        </label>
        <textarea class="fc" id="carInputD6" rows="3" maxlength="500"
          placeholder="시정조치 효과 확인 결과..."
          oninput="document.getElementById('carInputD6cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d6_verify'))}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:10px;align-items:center">
            <label style="font-size:12px;color:var(--muted)">평가 결과:
              <select class="fc" id="carInputD6Result" style="width:120px;display:inline-block;margin-left:6px">
                ${['','유효','일부유효','무효'].map(r=>`<option value="${r}" ${v('d6_result')===r?'selected':''}>${r||'선택'}</option>`).join('')}
              </select>
            </label>
            <label style="font-size:12px;color:var(--muted)">평가일:
              <input class="fc" type="date" id="carInputD6Date" value="${H.e(v('d6_date'))}"
                style="width:140px;display:inline-block;margin-left:6px">
            </label>
          </div>
          <span style="font-size:11px;color:var(--muted)"><span id="carInputD6cnt">${(v('d6_verify')||'').length}</span>/500</span>
        </div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">
          ⑦ 재발 방지 (D7) <span style="font-size:11px;color:var(--muted)">수평전개 및 재발 방지</span>
        </label>
        <textarea class="fc" id="carInputD7" rows="3" maxlength="500"
          placeholder="수평전개 및 재발 방지 대책..."
          oninput="document.getElementById('carInputD7cnt').textContent=this.value.length"
          style="resize:vertical">${H.e(v('d7_prevent'))}</textarea>
        <div style="text-align:right;font-size:11px;color:var(--muted)"><span id="carInputD7cnt">${(v('d7_prevent')||'').length}</span>/500</div>
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">비고</label>
        <input class="fc" id="carInputNote" value="${H.e(v('note'))}" placeholder="비고">
      </div>

    </div>
  </div>

  <!-- ③ 파일 첨부 -->
  <div class="card" style="margin-bottom:12px;padding:18px 20px">
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">📎 파일 첨부</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      ${isEdit&&row.file_url
        ?`<a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 현재 파일</a>
           <button type="button" class="btn bxs bred bsm"
             onclick="window._carInputFileDel=true;this.textContent='🗑️ 삭제 예정'">🗑️ 파일 삭제</button>`:''}
      <label style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;
        border:1.5px dashed var(--brd);border-radius:8px;cursor:pointer;font-size:13px;color:var(--muted);
        background:var(--bg2)">
        📁 파일 선택
        <input type="file" id="carInputFile"
          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.zip"
          style="display:none"
          onchange="document.getElementById('carInputFileName').textContent=this.files[0]?.name||''">
      </label>
      <span id="carInputFileName" style="font-size:12px;color:var(--pri)"></span>
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--muted)">지원 형식: PDF, Excel, Word, 이미지(JPG/PNG), ZIP · 최대 10MB</div>
  </div>

  <!-- ④ 멘션 연동 -->
  <div class="card" style="margin-bottom:12px;padding:18px 20px">
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">📣 담당자 알림 (멘션)</div>
    <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">수신자</label>
        <input class="fc" id="carInputMentionTo" list="carMentionUserList" placeholder="담당자 선택">
        <datalist id="carMentionUserList">${userMentionOpts}</datalist>
      </div>
      <div style="flex:2;min-width:300px">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">알림 메시지</label>
        <input class="fc" id="carInputMentionMsg"
          placeholder="예) 시정조치 검토 요청드립니다. 기한 내 검토 부탁드립니다.">
      </div>
      <button class="btn bpri bsm" onclick="Pages._carInputSendMention()" style="white-space:nowrap">📣 알림 발송</button>
    </div>
    ${isEdit?`<div style="margin-top:10px;font-size:11px;color:var(--muted)">저장 시 담당자(${H.e(row.assignee||'')})에게 자동 알림이 발송됩니다.</div>`:''}
  </div>

  <!-- ⑤ 변경 이력 -->
  ${isEdit&&versions.length>0?`
  <div class="card" style="margin-bottom:12px;padding:18px 20px">
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">🕐 변경 이력</div>
    <div style="overflow-x:auto">
      <table class="dt" style="width:100%;font-size:12px">
        <thead><tr>
          <th style="width:140px">일시</th>
          <th style="width:70px">액션</th>
          <th style="width:80px">처리자</th>
          <th>사유/내용</th>
        </tr></thead>
        <tbody>
          ${versions.map(h=>`<tr>
            <td style="color:var(--muted)">${(h.changed_at||h.created_at||'').replace('T',' ').slice(0,16)}</td>
            <td><span class="badge ${h.action==='승인'?'bgrn':h.action==='반려'?'bred':h.action==='수정'?'bblu':'bgry'}"
              style="font-size:10px">${H.e(h.action||'-')}</span></td>
            <td>${H.e(h.changed_by||'-')}</td>
            <td>${H.e(h.reason||'-')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`:''}

  <!-- ⑥ 하단 버튼 바 -->
  <div style="position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--brd);
    padding:12px 20px;display:flex;justify-content:space-between;align-items:center;
    border-radius:0 0 12px 12px;z-index:10">
    <div style="display:flex;gap:6px">
      <button class="btn bout bsm" onclick="Nav.go('car')">← 목록</button>
      ${isEdit?`<button class="btn bsm" style="background:#f97316;color:#fff;border:none" onclick="Pages._carInputMail()">📧 메일 발송</button>`:''}
      ${isEdit?`<button class="btn bout bsm" onclick="Pages._carInputPrint()">🖨️ 인쇄</button>`:''}
      ${isEdit?`<button class="btn bout bsm" onclick="Pages._carInputPreview()">👁 미리보기</button>`:''}
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn bamb bsm" onclick="Pages._carInputSave('temp')">⏳ 임시저장</button>
      ${isEdit?`<button class="btn berr bsm" onclick="Pages._carInputDelete(${Number(carId)})">🗑️ 삭제</button>`:''}
      <button class="btn bpri" onclick="Pages._carInputSave('${isEdit?row.id:'new'}')">💾 저장</button>
    </div>
  </div>`;
},

/* ── 시정조치 입력 — 저장 ── */
async _carInputSave(editId){
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const title=g('carInputTitle');
  const open=g('carInputOpen');
  const assignee=g('carInputAssignee');
  if(!title){Toast.show('제목을 입력하세요.','warn');return;}
  if(!open){Toast.show('개시일을 입력하세요.','warn');return;}
  if(!assignee){Toast.show('담당자를 선택하세요.','warn');return;}

  const isTemp=editId==='temp';
  const isNew=editId==='new';
  const realId=(!isTemp&&!isNew)?Number(editId):null;

  /* 파일 업로드 */
  let file_url=realId?(DB.cars||[]).find(c=>c.id===realId)?.file_url||null:null;
  if(window._carInputFileDel){file_url=null;window._carInputFileDel=false;}
  const fileEl=document.getElementById('carInputFile');
  if(fileEl?.files?.length){
    const up=await SB.uploadFile('car',fileEl.files[0]);
    if(up?.url) file_url=up.url;
    else Toast.show('파일 업로드 실패. 저장은 계속됩니다.','warn');
  }

  const itemCode=g('carInputItemCode').split(' — ')[0].trim();
  const row={
    no:g('carInputNo'), source:g('carInputSrc'),
    title, nc_id:document.getElementById('carInputNcId')?.value||null,
    nc_no:g('carInputNcNo')||null,
    customer:g('carInputCustomer')||null,       /* [v2.198] 고객사 */
    vendor_name:g('carInputVendor')||null,      /* [v2.198] 공급처 */
    work_order:g('carInputWorkOrder')||null,    /* [v2.198] 작업지시번호 */
    /* [v2.201] 수량/불량률/유형/현상/처리방법/손실비용 */
    ship_qty:g('carInputShipQty')||null,
    insp_qty:g('carInputInspQty')||null,
    bad_qty:g('carInputBadQty')||null,
    defect_rate:g('carInputDefectRate')||null,
    defect_type:g('carInputDefectType')||null,
    defect_desc:g('carInputDefectDesc')||null,
    action_type:g('carInputActionType')||null,
    nc_note:g('carInputNcNote')||null,
    cost_material:g('carInputCostMat')||null,
    cost_process:g('carInputCostProc')||null,
    cost_etc:g('carInputCostEtc')||null,
    cost_total:g('carInputCostTotal').replace(/[원,]/g,'')||null,
    item_code:itemCode||null, item:g('carInputItem')||null,
    open, close_date:g('carInputDue')||null,
    assignee, status:isTemp?'접수':g('carInputStatus')||'접수',
    d1_team:g('carInputD1')||null,
    d2_desc:g('carInputD2')||null,
    d3_action:g('carInputD3')||null,
    d4_why1:g('carInputWhy1')||null, d4_why2:g('carInputWhy2')||null,
    d4_why3:g('carInputWhy3')||null, d4_why4:g('carInputWhy4')||null,
    d4_why5:g('carInputWhy5')||null,
    d5_action:g('carInputD5')||null, d5_date:g('carInputD5Date')||null,
    d6_verify:g('carInputD6')||null, d6_result:g('carInputD6Result')||null,
    d6_date:g('carInputD6Date')||null,
    d7_prevent:g('carInputD7')||null,
    note:g('carInputNote')||null, file_url,
    created_by:Auth._u?.name||Auth._u?.username||'',
  };

  let savedId=realId;
  if(realId){
    const res=await SB.updateCar(realId,row);
    if(!res?.ok) return;
    const idx=(DB.cars||[]).findIndex(c=>c.id===realId);
    if(idx>=0) DB.cars[idx]={...DB.cars[idx],...row};
    /* 수정 이력 저장 */
    await SB.addCarHistory({
      car_id:realId, action:'수정',
      reason:`${isTemp?'임시저장':'수정'} — ${title}`,
      changed_by:Auth._u?.name||Auth._u?.username||'',
      changed_at:new Date().toISOString(),
    });
    Toast.show(isTemp?'임시저장됐습니다.':'시정조치가 수정됐습니다.','ok');
  } else {
    const res=await SB.addCar(row);
    if(!res?.ok) return;
    savedId=res.id;
    /* 등록 이력 저장 */
    if(savedId) await SB.addCarHistory({
      car_id:savedId, action:'등록',
      reason:`신규 등록 — ${title}`,
      changed_by:Auth._u?.name||Auth._u?.username||'',
      changed_at:new Date().toISOString(),
    });
    Toast.show('시정조치가 등록됐습니다.','ok');
  }

  /* 담당자 멘션 알림 */
  if(assignee&&!isTemp){
    await SB.addMention({
      from:Auth._u?.name||'시스템',
      to:assignee, to_list:[assignee],
      text:`[시정조치 ${realId?'수정':'등록'}] ${row.no} — ${title}`,
      message:`시정조치 ${row.no}이(가) ${realId?'수정':'등록'}됐습니다. 검토 부탁드립니다.`,
      ref:`car:${savedId||realId}`,
    });
  }

  /* 저장 후 현재 페이지 새로고침 */
  window._carInputId=savedId||realId;
  await Pages.car_input({carId:window._carInputId});
},

/* ── 시정조치 입력 — 삭제 ── */
async _carInputDelete(carId){
  Modal.confirm({title:'🗑️ 삭제 확인',
    msg:'이 시정조치를 삭제합니다. 복구가 어렵습니다.',
    danger:true,
    onOk:async()=>{
      if(_sb) await _sb.from('corrective_actions').delete().eq('id',carId);
      DB.cars=(DB.cars||[]).filter(c=>Number(c.id)!==carId);
      Toast.show('삭제됐습니다.','ok');
      Nav.go('car');
    }
  });
},

/* ── 시정조치 입력 — 멘션 발송 ── */
async _carInputSendMention(){
  const to=(document.getElementById('carInputMentionTo')?.value||'').trim();
  const msg=(document.getElementById('carInputMentionMsg')?.value||'').trim();
  const no=(document.getElementById('carInputNo')?.value||'');
  if(!to){Toast.show('수신자를 선택하세요.','warn');return;}
  if(!msg){Toast.show('메시지를 입력하세요.','warn');return;}
  await SB.addMention({
    from:Auth._u?.name||'시스템',
    to, to_list:[to],
    text:`[CAR 알림] ${no} — ${msg}`,
    message:msg,
    ref:`car:${window._carInputId||''}`,
  });
  Toast.show(`${to}님께 알림을 발송했습니다.`,'ok');
  document.getElementById('carInputMentionMsg').value='';
},

/* ── [v2.201] 불량률 자동 계산 ── */
_carInputCalcRate(){
  const insp=Number(document.getElementById('carInputInspQty')?.value||0);
  const bad=Number(document.getElementById('carInputBadQty')?.value||0);
  const rateEl=document.getElementById('carInputDefectRate');
  if(rateEl) rateEl.value=insp>0?(bad/insp*100).toFixed(2)+'%':'';
},

/* ── [v2.201] 손실비용 합계 자동 계산 ── */
_carInputCalcCost(){
  const mat=Number(document.getElementById('carInputCostMat')?.value||0);
  const proc=Number(document.getElementById('carInputCostProc')?.value||0);
  const etc=Number(document.getElementById('carInputCostEtc')?.value||0);
  const totalEl=document.getElementById('carInputCostTotal');
  if(totalEl) totalEl.value=(mat+proc+etc).toLocaleString()+'원';
},

/* ── [v2.198] NC 번호 자동채우기 ── */
_carInputNcAutofill(ncNo){
  /* [v2.202] NC 번호로 부적합 전체 데이터 자동채우기
     NC에 등록된 모든 필드를 car_input 폼에 연동 */
  if(!ncNo) return;
  const nc=(DB.nc||[]).find(r=>r.no===ncNo.trim());
  if(!nc){Toast.show('NC 데이터를 찾을 수 없습니다. NC 참조번호를 확인하세요.','warn');return;}

  const setVal=(id,val)=>{
    const el=document.getElementById(id);
    if(el&&val){el.value=val;}
  };
  const setSelect=(id,val)=>{
    const el=document.getElementById(id);
    if(!el||!val) return;
    const opt=[...el.options].find(o=>o.value===val);
    if(opt) el.value=val;
  };

  /* ① 기본정보 */
  setVal('carInputItemCode', nc.item_code||'');
  setVal('carInputItem',     nc.item||nc.item_name||'');
  setVal('carInputCustomer', nc.customer||'');
  setVal('carInputVendor',   nc.vendor||nc.vendor_name||'');
  setVal('carInputWorkOrder',nc.work_order||nc.work_order_no||'');
  /* 제목 — NC 내용 기반 */
  setVal('carInputTitle',    nc.desc||nc.title||'');
  /* 발생원 */
  const srcEl=document.getElementById('carInputSrc');
  if(srcEl){
    const srcMap={'외부':'부적합','내부':'내부심사','고객':'고객불만'};
    srcEl.value=srcMap[nc.in_out]||nc.in_out||'부적합';
  }
  /* 담당자 */
  setVal('carInputAssignee', nc.assignee||'');
  /* 기한 — NC 처리기한 기준 */
  setVal('carInputDue', nc.due_date||nc.due||'');
  /* NC ID 저장 */
  const ncIdEl=document.getElementById('carInputNcId');
  if(ncIdEl) ncIdEl.value=nc.id||'';

  /* ② 수량/불량 정보 */
  setVal('carInputShipQty',    nc.ship_qty||'');
  setVal('carInputInspQty',    nc.insp_qty||nc.qty||'');
  setVal('carInputBadQty',     nc.qty||nc.bad_qty||'');
  setVal('carInputDefectType', nc.type||'');
  setVal('carInputDefectDesc', nc.desc||'');
  setVal('carInputNcNote',     nc.note||'');
  /* 처리방법 */
  setSelect('carInputActionType', nc.action_type||'');
  /* 불량률 자동계산 */
  Pages._carInputCalcRate();

  /* ③ D2 문제기술 — NC 발생내용으로 초기값 */
  const d2El=document.getElementById('carInputD2');
  if(d2El&&!d2El.value&&nc.desc) d2El.value=nc.desc;
  /* D3 임시대책 — NC 처리방법으로 초기값 */
  const d3El=document.getElementById('carInputD3');
  if(d3El&&!d3El.value&&nc.action) d3El.value=nc.action;

  Toast.show(`NC ${ncNo} 정보가 자동으로 채워졌습니다.`,'ok');
},

/* ── [v2.198] 공급처 선택 시 자동채우기 ── */
_carInputVendorAutofill(){
  const vendorName=(document.getElementById('carInputVendor')?.value||'').trim();
  if(!vendorName) return;
  const vendor=(DB.vendors||[]).find(v=>(v.vendor_name||'')==vendorName);
  if(!vendor) return;
  /* 멘션 수신자에 담당자 자동 설정 */
  const mentionTo=document.getElementById('carInputMentionTo');
  if(mentionTo&&!mentionTo.value&&vendor.manager){mentionTo.value=vendor.manager;}
},

/* ── [v2.198] 메일 발송 — 발생원별 수신자 자동결정 + 추가 수신자 + 미리보기 ── */
async _carInputMail(){
  const g=id=>document.getElementById(id)?.value||'';
  const no=g('carInputNo')||window._carInputRow?.no||'';
  const title=g('carInputTitle')||window._carInputRow?.title||'';
  const source=g('carInputSrc')||window._carInputRow?.source||'';
  const vendor=g('carInputVendor')||window._carInputRow?.vendor_name||'';
  const customer=g('carInputCustomer')||window._carInputRow?.customer||'';
  const assignee=g('carInputAssignee')||window._carInputRow?.assignee||'';

  /* 발생원별 수신자 자동 결정 */
  let autoEmail='', autoName='', emailType='';
  if(source==='공급사 귀책'||source==='부적합'){
    /* 공급처 귀책 — 거래처 등록 메일 */
    const vendorData=(DB.vendors||[]).find(v=>(v.vendor_name||'')==vendor);
    if(vendorData){
      autoEmail=vendorData.manager_email||vendorData.email||'';
      autoName=vendorData.manager||vendorData.vendor_name||vendor;
      emailType='공급처';
    }
  } else {
    /* 내부 — 담당자 사내 메일 */
    const userD=(DB.users||[]).find(u=>(u.name||u.username)===assignee);
    autoEmail=userD?.email||'';
    autoName=assignee;
    emailType='내부담당자';
  }

  /* 메일 발송 팝업 — 미리보기 포함 */
  Modal.open({
    title:`📧 시정조치 메일 발송 — ${H.e(no)}`,
    size:'mlg',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri" onclick="Pages._carInputMailSend()">📧 발송</button>`,
    body:`<div style="padding:4px 0">
      <div style="background:var(--bg2);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px">
        <b>${H.e(no)}</b> — ${H.e(title)}
        ${emailType?`<span style="margin-left:8px;font-size:11px;color:var(--muted)">[${emailType} 발송]</span>`:''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">
            <b style="color:#e11d48">수신자 *</b> ${autoName?`<span style="color:#059669">(자동: ${H.e(autoName)})</span>`:''}
          </label>
          <input class="fc" id="carMailTo" value="${H.e(autoEmail)}" placeholder="이메일 주소">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">추가 수신자</label>
          <input class="fc" id="carMailCc" placeholder="추가 이메일 (쉼표로 구분)">
        </div>
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">제목</label>
        <input class="fc" id="carMailSubject" value="[시정조치요청] ${H.e(no)} — ${H.e(title)}">
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">내용</label>
        <textarea class="fc" id="carMailBody" rows="6" style="resize:vertical">${H.e(
`안녕하세요.

아래와 같이 시정조치를 요청드립니다.

■ CAR 번호: ${no}
■ 제 목: ${title}
■ 발 생 원: ${source}
${vendor?'■ 공 급 처: '+vendor+'\n':''}${customer?'■ 고 객 사: '+customer+'\n':''}■ 완료기한: ${g('carInputDue')||window._carInputRow?.close_date||''}
■ 담 당 자: ${assignee}

조속한 조치 및 회신 부탁드립니다.

감사합니다.
INNODIS 품질팀`)}</textarea>
      </div>
      <div style="font-size:11px;color:var(--muted);padding:6px 10px;background:#fef3c7;border-radius:6px">
        💡 발송 버튼 클릭 시 기본 메일 앱이 열립니다. 시스템 SMTP 설정이 있으면 자동 발송됩니다.
      </div>
    </div>`,
  });
},

async _carInputMailSend(){
  const to=(document.getElementById('carMailTo')?.value||'').trim();
  const cc=(document.getElementById('carMailCc')?.value||'').trim();
  const subject=(document.getElementById('carMailSubject')?.value||'').trim();
  const body=(document.getElementById('carMailBody')?.value||'').trim();
  if(!to){Toast.show('수신자 이메일을 입력하세요.','warn');return;}

  /* mailto 발송 */
  const mailtoUrl=`mailto:${encodeURIComponent(to)}${cc?'?cc='+encodeURIComponent(cc):''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl.replace('?cc=','&cc=').replace('?subject=',cc?'&subject=':'?subject='),'_blank');

  /* 메일 발송 이력 저장 */
  const carId=window._carInputId||window._carInputRow?.id;
  if(carId){
    await SB.addCarHistory({
      car_id:Number(carId), action:'메일발송',
      reason:`수신: ${to}${cc?', '+cc:''} / 제목: ${subject}`,
      changed_by:Auth._u?.name||Auth._u?.username||'',
      changed_at:new Date().toISOString(),
    });
    /* DB 로컬 업데이트 — 메일발송 표시용 */
    const carIdx=(DB.cars||[]).findIndex(c=>Number(c.id)===Number(carId));
    if(carIdx>=0) DB.cars[carIdx].mail_sent=true;
    Toast.show(`메일 발송 완료 — ${to}`,'ok');
  }
  Modal.close();
},

/* ── 시정조치 입력 — 인쇄 ── */
_carInputPrint(){
  const row=window._carInputRow;
  if(!row){Toast.show('저장 후 인쇄할 수 있습니다.','warn');return;}
  window.print();
},

/* ── 시정조치 입력 — 미리보기 ── */
_carInputPreview(){
  /* [v2.200] 미리보기 — _carPrint와 동일한 양식 재사용
     저장 전에도 폼 입력값으로 즉시 미리보기 가능 */
  const g=id=>document.getElementById(id)?.value||'';
  const row={
    no:g('carInputNo'), date:g('carInputOpen'), source:g('carInputSrc'),
    title:g('carInputTitle'), assignee:g('carInputAssignee'),
    customer:g('carInputCustomer'), vendor_name:g('carInputVendor'),
    work_order:g('carInputWorkOrder'),
    item_code:g('carInputItemCode').split(' — ')[0].trim(),
    item:g('carInputItem'), close_date:g('carInputDue'),
    nc_no:g('carInputNcNo'),
    /* [v2.201] 수량/불량률/유형/손실비용 */
    ship_qty:g('carInputShipQty'), insp_qty:g('carInputInspQty'),
    bad_qty:g('carInputBadQty'), defect_rate:g('carInputDefectRate'),
    defect_type:g('carInputDefectType'), defect_desc:g('carInputDefectDesc'),
    action_type:g('carInputActionType'), nc_note:g('carInputNcNote'),
    cost_material:g('carInputCostMat'), cost_process:g('carInputCostProc'),
    cost_etc:g('carInputCostEtc'), cost_total:g('carInputCostTotal'),
    status:g('carInputStatus'),
    d1_team:g('carInputD1'),
    d2_desc:g('carInputD2'), d3_action:g('carInputD3'),
    d4_why1:g('carInputWhy1'), d4_why2:g('carInputWhy2'),
    d4_why3:g('carInputWhy3'), d4_why4:g('carInputWhy4'),
    d4_why5:g('carInputWhy5'),
    d5_action:g('carInputD5'), d5_date:g('carInputD5Date'),
    d6_verify:g('carInputD6'), d6_result:g('carInputD6Result'),
    d6_date:g('carInputD6Date'), d7_prevent:g('carInputD7'),
    note:g('carInputNote'),
    created_by:window._carInputRow?.created_by||
               Auth?._u?.name||Auth?._u?.username||'',
  };
  Pages._carPrint(row);
},

/* ── 버전 탭 선택 ── */
_carInputVersion(idx, btn){
  document.querySelectorAll('#carInputVersionTabs .stab-btn').forEach(b=>b.classList.toggle('on',b===btn));
  if(idx==='current'){
    /* 현재 버전 — 이미 렌더된 폼 유지 */
    Toast.show('현재 버전입니다.','info');
  } else {
    /* 이전 버전 — 읽기 전용 표시 */
    Toast.show('이전 버전은 조회만 가능합니다.','info');
  }
},

/* ════════════════════════════════════════
   [v2.192] car_status — 시정조치 현황
   승인(유효성평가/완료) 문서 + 상태 이력
   ════════════════════════════════════════ */
async car_status(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const fresh=await SB.getCars();
  if(fresh) DB.cars=fresh;
  const allData=DB.cars||[];
  /* 승인 = 유효성평가 이상 상태 */
  const approvedData=allData.filter(c=>['유효성평가','완료'].includes(c.status));
  const byStatus={유효성평가:0,완료:0};
  approvedData.forEach(c=>{if(byStatus[c.status]!==undefined)byStatus[c.status]++;});

  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">📊 시정조치 현황</div>
         <div class="psub">승인된 시정조치 현황 · 상태 변경 이력 조회</div></div>
    <div class="pac">
      <button class="btn bout bsm" onclick="Nav.go('car_input')">✍️ 신규 입력</button>
    </div>
  </div>
  <div class="stat-dash" style="margin-bottom:12px">
    <div class="sd-card"><div class="sd-icon" style="background:#eff6ff;color:#2563eb">📋</div>
      <div><div class="sd-val">${approvedData.length}</div><div class="sd-lbl">승인 건수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#16a34a">✅</div>
      <div><div class="sd-val">${byStatus['완료']||0}</div><div class="sd-lbl">완료</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">⚙️</div>
      <div><div class="sd-val">${byStatus['유효성평가']||0}</div><div class="sd-lbl">유효성평가</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f5f3ff;color:#7c3aed">📈</div>
      <div><div class="sd-val">${allData.length>0?Math.round(byStatus['완료']/allData.length*100):0}%</div><div class="sd-lbl">완료율</div></div></div>
  </div>

  <!-- 검색 -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
    <input class="fc" id="carStatusSearch" style="width:200px;font-size:13px"
      placeholder="🔍 CAR번호·제목·담당자"
      oninput="Pages._carStatusRender()">
    <select class="fsel" id="carStatusFilter" onchange="Pages._carStatusRender()">
      <option value="">승인 전체</option>
      <option value="유효성평가">유효성평가</option>
      <option value="완료">완료</option>
    </select>
    <button class="btn bout bsm" onclick="document.getElementById('carStatusSearch').value='';document.getElementById('carStatusFilter').value='';Pages._carStatusRender()">🔄 초기화</button>
  </div>

  <!-- 탭 -->
  <div class="stabs" style="margin-bottom:10px">
    <button class="stab-btn on" data-tab="list" onclick="Pages._carStatusTab('list',this)">📋 목록</button>
    <button class="stab-btn" data-tab="kanban" onclick="Pages._carStatusTab('kanban',this)">📌 칸반</button>
  </div>
  <div id="carStatusListPane"><div id="carStatusTbl"></div></div>
  <div id="carStatusKanbanPane" style="display:none"></div>`;

  window._carStatusData=approvedData;
  Pages._carStatusRender();
},

_carStatusRender(){
  const data=window._carStatusData||[];
  const q=(document.getElementById('carStatusSearch')?.value||'').toLowerCase();
  const st=document.getElementById('carStatusFilter')?.value||'';
  const filtered=data.filter(c=>{
    if(q&&![(c.no||''),(c.title||''),(c.assignee||'')].join(' ').toLowerCase().includes(q))return false;
    if(st&&c.status!==st)return false;
    return true;
  });
  Tbl.render({
    el:'#carStatusTbl',
    cols:[
      {key:'status',   label:'상태',    w:'80px', align:'center',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':'bblu'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'no',       label:'CAR번호', w:'150px', req:true,
        render:v=>`<span style="font-family:monospace;font-weight:700;color:#1a5fa8">${H.e(v||'-')}</span>`},
      {key:'source',      label:'발생원',  w:'72px',
        render:v=>`<span class="badge bpur" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'title',    label:'제목',    w:'*'},
      {key:'assignee', label:'담당자',  w:'72px'},
      {key:'date',     label:'개시일',  w:'88px'},
      {key:'close_date',      label:'완료기한',w:'88px'},
      {key:'d6_result',label:'평가결과',w:'80px', align:'center',
        render:v=>v?`<span class="badge ${v==='유효'?'bgrn':v==='무효'?'bred':'bamb'}" style="font-size:10px">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
    ],
    data:filtered,
    onRow:row=>Nav.go('car_input',{carId:row.id}),
  });
  const kb=document.getElementById('carStatusKanbanPane');
  if(kb&&kb.style.display!=='none') Pages._carStatusKanbanRender(filtered);
},

_carStatusTab(tab, btn){
  document.querySelectorAll('.stab-btn').forEach(b=>b.classList.toggle('on',b===btn));
  document.getElementById('carStatusListPane').style.display=tab==='list'?'':'none';
  const kb=document.getElementById('carStatusKanbanPane');
  kb.style.display=tab==='kanban'?'':'none';
  if(tab==='kanban') Pages._carStatusKanbanRender(window._carStatusData||[]);
},

_carStatusKanbanRender(data){
  const el=document.getElementById('carStatusKanbanPane');
  if(!el) return;
  const steps=['유효성평가','완료'];
  const colors={유효성평가:'#3b82f6',완료:'#22c55e'};
  const byStep={};
  steps.forEach(s=>{byStep[s]=data.filter(c=>c.status===s);});
  el.innerHTML=`<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px">
  ${steps.map(s=>`
    <div style="flex:0 0 280px;background:var(--bg2);border-radius:10px;padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:${colors[s]}">${s}</div>
        <span style="background:${colors[s]};color:#fff;border-radius:99px;padding:1px 8px;font-size:11px">${byStep[s].length}</span>
      </div>
      ${byStep[s].map(c=>`
        <div style="background:var(--card);border:1px solid var(--brd);border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer"
          onclick="Nav.go('car_input',{carId:${Number(c.id)}})">
          <div style="font-size:11px;font-family:monospace;color:#1a5fa8;margin-bottom:4px">${H.e(c.no||'-')}</div>
          <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${H.e(c.title||'-')}</div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
            <span>${H.e(c.assignee||'-')}</span>
            ${c.d6_result?`<span class="badge ${c.d6_result==='유효'?'bgrn':c.d6_result==='무효'?'bred':'bamb'}" style="font-size:10px">${H.e(c.d6_result)}</span>`:''}
          </div>
        </div>`).join('')}
      ${byStep[s].length===0?`<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">없음</div>`:''}
    </div>`).join('')}
  </div>`;
},


_carForm(row=null, prefillNc=null){
  const isEdit=!!row;
  const today=H.today();
  const nextNo=(()=>{
    const d=today.replace(/-/g,'');
    const todayCars=(DB.cars||[]).filter(c=>(c.no||'').startsWith('CAR-'+d));
    return`CAR-${d}-${String(todayCars.length+1).padStart(3,'0')}`;
  })();
  const itemDatalist=(DB.items||[]).map(it=>
    `<option value="${H.e(it.item_code||it.code||'')}">${H.e((it.item_code||it.code||'')+' — '+(it.name||it.item_name||''))}</option>`
  ).join('');
  const userOpts=(DB.users||[]).filter(u=>u.active!==false).map(u=>{
    const nm=H.e(u.name||u.username);
    const sel=(isEdit&&row.assignee===nm)||(!isEdit&&(Auth._u?.name||Auth._u?.username)===nm)?'selected':'';
    return`<option value="${nm}" ${sel}>${nm}${u.dept?' ('+H.e(u.dept)+')':''}</option>`;
  }).join('');
  const steps=['접수','대책접수','대책실시','유효성평가','완료'];
  const statusOpts=steps.map(s=>`<option value="${s}" ${(isEdit&&row.status===s)||(!isEdit&&s==='접수')?'selected':''}>${s}</option>`).join('');

  /* NC 연계 프리필 */
  const pf=prefillNc||{};
  const v=(key,fb='')=>isEdit?(row[key]||fb):(pf[key]||fb);

  Modal.open({title:isEdit?`✏️ CAR 수정 — ${row.no}`:'+ CAR 등록',size:'mxl',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>`
        +`<button class="btn bpri btn-f8" onclick="Pages._carSave(${isEdit?row.id:'null'})">💾 저장 <span class="kbd">F8</span></button>`,
    body:`<div class="fg2">
      <input type="hidden" id="carId" value="${isEdit?row.id:''}">
      <input type="hidden" id="carNcId" value="${v('nc_id')}">
      <div class="fgroup">
        <label class="fl">CAR번호</label>
        <input class="fc" id="carNo" value="${H.e(v('no',nextNo))}" ${isEdit?'readonly':''}
          style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">발생원 *</b></label>
        <select class="fc" id="carSrc">
          ${['부적합','내부심사','고객불만','외부심사','기타'].map(s=>`<option value="${s}" ${v('source','부적합')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl">NC 참조번호</label>
        <input class="fc" id="carNcNo" value="${H.e(v('nc_no'))}"
          placeholder="NC-20260601-001" style="font-family:monospace;font-size:13px;color:#7c3aed">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">개시일 *</b></label>
        <input class="fc" type="date" id="carOpen" value="${H.e(v('date',today))}">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req"><b style="color:#e11d48">제목 *</b></label>
        <input class="fc" id="carTitle" value="${H.e(v('title'))}" placeholder="시정조치 제목 입력">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req"><b style="color:#e11d48">품목코드 *</b> <span style="font-size:10px;color:var(--tm)">직접입력 또는 검색</span></label>
        <input class="fc" id="carItemCode" list="carItemList" value="${H.e(v('item_code'))}"
          placeholder="코드 또는 품목명으로 검색..."
          oninput="(function(){var v=document.getElementById('carItemCode').value.split(' — ')[0].trim();var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||'')===v;});if(it){document.getElementById('carItem').value=it.name||it.item_name||'';document.getElementById('carItem').style.color='var(--pri)';}else{document.getElementById('carItem').style.color='';}})()"
          onblur="(function(){var v=document.getElementById('carItemCode').value.split(' — ')[0].trim();if(!v)return;var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||'')===v;});if(!it&&v)Toast.show('미등록 품목코드입니다.','warn');})()">
        <datalist id="carItemList">${itemDatalist}</datalist>
      </div>
      <div class="fgroup">
        <label class="fl">품목명 <span style="font-size:10px;color:var(--tm)">자동완성</span></label>
        <input class="fc" id="carItem" value="${H.e(v('item'))}" placeholder="품목코드 입력 시 자동 입력" style="background:var(--bg2)">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">담당자 *</b></label>
        <select class="fc" id="carAssignee"><option value="">선택</option>${userOpts}</select>
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">완료 기한 *</b></label>
        <input class="fc" type="date" id="carDue" value="${H.e(v('close_date',H.addDays(today,14)))}">
      </div>
      <div class="fgroup">
        <label class="fl">상태</label>
        <select class="fc" id="carStatus">${statusOpts}</select>
      </div>
    </div>
    <div style="margin-top:14px;border-top:1px solid var(--brd);padding-top:14px">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">📋 대책 내용 (단계별 입력)</div>
      <div class="fg1" style="gap:10px">
        <div class="fgroup ff"><label class="fl">① 문제 기술 (D2)</label>
          <textarea class="fc" id="carD2" rows="2" placeholder="부적합 현상 및 문제 내용 상세 기술">${H.e(v('d2_desc'))}</textarea></div>
        <div class="fgroup ff"><label class="fl">② 임시 대책 (D3)</label>
          <textarea class="fc" id="carD3" rows="2" placeholder="즉각적 임시 조치 내용">${H.e(v('d3_action'))}</textarea></div>
        <div class="fgroup ff"><label class="fl">③ 근본 원인 분석 (D4 — 5-Why)</label>
          <div style="display:grid;gap:6px;margin-top:4px">
            ${[1,2,3,4,5].map(n=>`<input class="fc" id="carWhy${n}" value="${H.e(v('d4_why'+n))}" placeholder="Why ${n}: ${n===1?'왜 발생했는가?':n===2?'왜 그 원인이 발생했는가?':n===3?'왜 막지 못했는가?':n===4?'왜 관리 기준이 없었는가?':'근본 원인은 무엇인가?'}">`).join('')}
          </div>
        </div>
        <div class="fgroup ff"><label class="fl">④ 대책 실시 (D5)</label>
          <textarea class="fc" id="carD5" rows="2" placeholder="실시한 시정조치 내용">${H.e(v('d5_action'))}</textarea></div>
        <div class="fgroup">
          <label class="fl">대책 실시일 (D5)</label>
          <input class="fc" type="date" id="carD5Date" value="${H.e(v('d5_date'))}">
        </div>
        <div class="fgroup ff"><label class="fl">⑤ 유효성 평가 (D6)</label>
          <textarea class="fc" id="carD6" rows="2" placeholder="시정조치 효과 확인 결과">${H.e(v('d6_verify'))}</textarea></div>
        <div class="fgroup">
          <label class="fl">유효성 평가 결과</label>
          <select class="fc" id="carD6Result">
            ${['','유효','일부유효','무효'].map(r=>`<option value="${r}" ${v('d6_result')===r?'selected':''}>${r||'선택'}</option>`).join('')}
          </select>
        </div>
        <div class="fgroup">
          <label class="fl">유효성 평가일</label>
          <input class="fc" type="date" id="carD6Date" value="${H.e(v('d6_date'))}">
        </div>
        <div class="fgroup ff"><label class="fl">⑥ 재발 방지 (D7)</label>
          <textarea class="fc" id="carD7" rows="2" placeholder="수평전개 및 재발 방지 대책">${H.e(v('d7_prevent'))}</textarea></div>
        <div class="fgroup">
          <label class="fl">비고</label>
          <input class="fc" id="carNote" value="${H.e(v('note'))}" placeholder="비고">
        </div>
        <div class="fgroup">
          <label class="fl">첨부파일</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${isEdit&&row.file_url
              ?`<a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 현재 파일</a>
                 <button type="button" class="btn bxs bred bsm" onclick="window._carFileDel=true;this.style.display='none';this.nextElementSibling.textContent='(삭제 예정)'">🗑️ 삭제</button>
                 <span style="font-size:11px;color:var(--muted)"></span>`:''}
            <label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px dashed var(--brd);border-radius:6px;cursor:pointer;font-size:13px;color:var(--muted)">
              📁 파일 선택<input type="file" id="carFile" accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.zip" style="display:none"
                onchange="this.parentElement.querySelector('span')||this.parentElement.insertAdjacentHTML('beforeend','<span style=\\'font-size:11px;color:var(--pri)\\'>');this.closest('label').nextElementSibling&&(this.closest('label').nextElementSibling.textContent=this.files[0]?.name||'')">
            </label>
            <span style="font-size:11px;color:var(--pri)"></span>
          </div>
        </div>
      </div>
    </div>`
  });
},

/* ── CAR 저장 [v2.139] ── */
async _carSave(editId){
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const title=g('carTitle');
  const src=g('carSrc');
  const open=g('carOpen');
  const due=g('carDue');
  const assignee=g('carAssignee');
  const itemCode=g('carItemCode').split(' — ')[0].trim();
  if(!title){Toast.show('제목을 입력하세요.','warn');return;}
  if(!open){Toast.show('개시일을 입력하세요.','warn');return;}
  if(!assignee){Toast.show('담당자를 선택하세요.','warn');return;}

  /* 파일 업로드 */
  let file_url=editId?(DB.cars||[]).find(c=>c.id===editId)?.file_url||null:null;
  if(window._carFileDel){file_url=null;window._carFileDel=false;}
  const fileEl=document.getElementById('carFile');
  if(fileEl?.files?.length){
    const up=await SB.uploadFile('car',fileEl.files[0]);
    if(up?.url) file_url=up.url;
    else Toast.show('파일 업로드 실패. 저장은 계속됩니다.','warn');
  }

  const row={
    no:g('carNo'), source:src, title,
    nc_id:document.getElementById('carNcId')?.value||null,
    nc_no:g('carNcNo')||null,
    item_code:itemCode||null, item:g('carItem')||null,
    date:open||null, close_date:due||null, assignee, status:g('carStatus')||'접수',
    d2_desc:g('carD2')||null, d3_action:g('carD3')||null,
    d4_why1:g('carWhy1')||null, d4_why2:g('carWhy2')||null,
    d4_why3:g('carWhy3')||null, d4_why4:g('carWhy4')||null,
    d4_why5:g('carWhy5')||null,
    d5_action:g('carD5')||null, d5_date:g('carD5Date')||null,
    d6_verify:g('carD6')||null, d6_result:g('carD6Result')||null, d6_date:g('carD6Date')||null,
    d7_prevent:g('carD7')||null,
    note:g('carNote')||null, file_url,
    created_by:Auth._u?.name||Auth._u?.username||'',
  };

  if(editId){
    const res=await SB.updateCar(editId,row);
    if(!res?.ok) return;
    const idx=(DB.cars||[]).findIndex(c=>c.id===editId);
    if(idx>=0) DB.cars[idx]={...DB.cars[idx],...row};
    Toast.show('CAR가 수정되었습니다.','ok');
  } else {
    const res=await SB.addCar(row);
    if(!res?.ok) return;
    Toast.show('CAR가 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._carRender();
},

/* ── CAR 상세 팝업 [v2.139] ── */
_carDetail(row){
  if(!row||typeof row!=='object'){Toast.show('데이터를 불러올 수 없습니다.','err');return;}
  window._carRow=row;
  const steps=['접수','대책접수','대책실시','유효성평가','완료'];
  const si=steps.indexOf(row.status||'접수');
  const stBar=steps.map((s,i)=>
    `<div class="pst"><div class="psd ${i===si?'ac':i<si?'dn':''}">${i+1}</div>
     <div class="psl ${i===si?'ac':''}" style="font-size:11px">${s}</div></div>`
  ).join('');
  const dday=(()=>{
    if(!row.due) return '';
    const d=Math.ceil((new Date(row.due)-new Date())/86400000);
    const cls=d<0?'bred':d<=3?'bamb':'bgrn';
    return`<span class="badge ${cls}" style="margin-left:8px">${d<0?'D+'+Math.abs(d):'D-'+d}</span>`;
  })();
  const why=([row.d4_why1,row.d4_why2,row.d4_why3,row.d4_why4,row.d4_why5].filter(Boolean));
  Modal.open({
    title:`🔧 CAR 상세 — ${H.e(row.no||'-')}`,size:'mxl',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bout bsm" onclick="Pages._carPrint(window._carRow)">🖨️ 인쇄</button>`
        +`<button class="btn bout" onclick="Modal.close();Pages._carForm(window._carRow)">✏️ 수정</button>`
        +`<button class="btn bpri" onclick="Pages._carNextStep(window._carRow)">▶ 다음 단계</button>`,
    body:`
      <div class="psteps">${stBar}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div>
          <div class="ir"><div class="il">CAR번호</div>
            <div class="iv" style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">${H.e(row.no||'-')}</div></div>
          <div class="ir"><div class="il">발생원</div>
            <div class="iv"><span class="badge bpur" style="font-size:11px">${H.e(row.src||'-')}</span></div></div>
          ${row.nc_no?`<div class="ir"><div class="il">NC 참조</div>
            <div class="iv"><span style="font-family:monospace;font-size:13px;color:#7c3aed;cursor:pointer" onclick="Modal.close();Nav.go('nc')">${H.e(row.nc_no)}</span></div></div>`:''}
          <div class="ir"><div class="il">품목코드</div>
            <div class="iv" style="font-family:monospace;font-size:13px">${H.e(row.item_code||'-')}</div></div>
          <div class="ir"><div class="il">품목명</div>
            <div class="iv">${H.e(row.item||'-')}</div></div>
          <div class="ir"><div class="il">제목</div>
            <div class="iv"><strong>${H.e(row.title||'-')}</strong></div></div>
        </div>
        <div>
          <div class="ir"><div class="il">담당자</div>
            <div class="iv">${H.e(row.assignee||'-')}</div></div>
          <div class="ir"><div class="il">개시일</div>
            <div class="iv">${H.e(row.open||'-')}</div></div>
          <div class="ir"><div class="il">완료기한</div>
            <div class="iv">${H.e(row.due||'-')}${dday}</div></div>
          ${row.d5_date?`<div class="ir"><div class="il">대책 실시일</div>
            <div class="iv">${H.e(row.d5_date)}</div></div>`:''}
          ${row.d6_date?`<div class="ir"><div class="il">유효성 평가일</div>
            <div class="iv">${H.e(row.d6_date)} <span class="badge ${row.d6_result==='유효'?'bgrn':row.d6_result==='무효'?'bred':'bamb'}" style="font-size:11px">${H.e(row.d6_result||'미평가')}</span></div></div>`:''}
          ${row.file_url?`<div class="ir"><div class="il">첨부파일</div>
            <div class="iv"><a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 파일 보기</a></div></div>`:''}
        </div>
      </div>
      ${row.d2_desc?`<div class="ir" style="margin-top:10px"><div class="il">① 문제 기술</div><div class="iv">${H.e(row.d2_desc)}</div></div>`:''}
      ${row.d3_action?`<div class="ir"><div class="il">② 임시 대책</div><div class="iv">${H.e(row.d3_action)}</div></div>`:''}
      ${why.length?`<div class="ir"><div class="il">③ 근본원인<br><small style="font-size:10px">(5-Why)</small></div>
        <div class="iv"><ol style="margin:0;padding-left:18px">${why.map(w=>`<li style="font-size:13px;margin-bottom:4px">${H.e(w)}</li>`).join('')}</ol></div></div>`:''}
      ${row.d5_action?`<div class="ir"><div class="il">④ 대책 실시</div><div class="iv">${H.e(row.d5_action)}</div></div>`:''}
      ${row.d6_verify?`<div class="ir"><div class="il">⑤ 유효성 평가</div><div class="iv">${H.e(row.d6_verify)}</div></div>`:''}
      ${row.d7_prevent?`<div class="ir"><div class="il">⑥ 재발 방지</div><div class="iv">${H.e(row.d7_prevent)}</div></div>`:''}
      ${row.note?`<div class="ir"><div class="il">비고</div><div class="iv">${H.e(row.note)}</div></div>`:''}
      <div id="carCmt" style="margin-top:14px"></div>`
  });
  setTimeout(()=>{if(typeof Cmt!=='undefined')Cmt.render('#carCmt',`car-${row.id}`);},80);
},

/* ── CAR 다음 단계 ── */
async _carNextStep(row){
  const steps=['접수','대책접수','대책실시','유효성평가','완료'];
  const cur=steps.indexOf(row.status||'접수');
  if(cur>=steps.length-1){Toast.show('이미 완료 상태입니다.','info');return;}
  const next=steps[cur+1];
  Modal.confirm({title:'▶ 단계 진행',
    msg:`<strong>${H.e(row.no)}</strong>의 상태를<br><b>${H.e(row.status)}</b> → <b style="color:var(--pri)">${next}</b>으로 진행하시겠습니까?`,
    onOk:async()=>{
      const res=await SB.updateCar(row.id,{status:next});
      if(!res?.ok){Toast.show('상태 변경 실패','err');return;}
      const idx=(DB.cars||[]).findIndex(c=>c.id===row.id);
      if(idx>=0) DB.cars[idx].status=next;
      window._carRow={...row,status:next};
      Modal.close();
      Toast.show(`"${next}"으로 진행되었습니다.`,'ok');
      Pages._carRender();
    }
  });
},

/* ── CAR 인쇄 [v2.139] ── */
_carPrint(row){
  /* [v2.200] 시정조치 요청서 — 완전 재설계
     구조: 상단헤더(결재란+제목) / 기본정보 / BODY(D1~D7) / 하단헤더(회람) / 바닥글
     CSS Grid 기반 → 칸 너비 정밀 제어, 깔끔한 A4 출력 */
  if(!row){Toast.show('인쇄할 CAR 데이터가 없습니다.','warn');return;}
  var w=window.open('','_blank','width=900,height=1100,scrollbars=yes');
  if(!w){Toast.show('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.','warn');return;}
  var e=function(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');};
  var eq=function(v){return String(v||'');};

  /* 데이터 매핑 */
  var no=e(row.no||''), rdate=e(row.date||row.open||''),
      customer=e(row.customer||''), vendor=e(row.vendor_name||''),
      work_order=e(row.work_order||''), nc_no=e(row.nc_no||''),
      item_code=e(row.item_code||''), item=e(row.item||''),
      title=e(row.title||''), assignee=e(row.assignee||''),
      close_date=e(row.close_date||row.due||''),
      source=e(row.source||row.src||''), status=e(row.status||'접수'),
      d1=e(row.d1_team||''), d2=e(row.d2_desc||''),
      d3=e(row.d3_action||''), note=e(row.note||''),
      why1=e(row.d4_why1||''), why2=e(row.d4_why2||''),
      why3=e(row.d4_why3||''), why4=e(row.d4_why4||''),
      why5=e(row.d4_why5||''),
      d5=e(row.d5_action||''), d5date=e(row.d5_date||''),
      d6=e(row.d6_verify||''), d6result=e(row.d6_result||''),
      d6date=e(row.d6_date||''), d7=e(row.d7_prevent||''),
      created_by=e(row.created_by||assignee);

  var html='<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'+
  '<title>시정조치 요청서 '+eq(row.no)+'</title><style>'+
  /* === 기본 리셋 === */
  '*{box-sizing:border-box;margin:0;padding:0}'+
  'html,body{background:#f0f0f0;font-family:"맑은 고딕","Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:9pt;color:#111}'+
  /* === 인쇄 페이지 === */
  '@page{size:A4 landscape;margin:7mm 8mm}'+
  '@media print{'+
    'html,body{background:#fff}'+
    '.page{box-shadow:none!important;margin:0!important;border-radius:0!important}'+
    '.no-print{display:none!important}'+
    'button{display:none!important}'+
  '}'+
  /* === A4 페이지 컨테이너 === */
  '.page{'+
    'width:276mm;min-height:190mm;'+
    'background:#fff;'+
    'margin:10mm auto;'+
    'padding:8mm 9mm 6mm;'+
    'box-shadow:0 2px 20px rgba(0,0,0,0.15);'+
    'display:flex;flex-direction:column;gap:0;'+
  '}'+
  /* === 공통 테이블 스타일 === */
  'table{border-collapse:collapse;width:100%;table-layout:fixed}'+
  'td,th{border:0.4pt solid #444;padding:2px 5px;vertical-align:middle;'+
    'font-size:8pt;line-height:1.4;word-break:break-word}'+
  /* === 셀 유형 === */
  '.h{background:#d6e4f0;font-weight:700;text-align:center;'+
    'font-size:7.5pt;white-space:nowrap;color:#1a1a2e}'+  /* 헤더셀 */
  '.v{background:#fff;vertical-align:top;padding:3px 5px}'+  /* 값셀 */
  '.vc{background:#fff;text-align:center}'+  /* 중앙정렬 값셀 */
  '.vm{background:#fff;vertical-align:middle}'+  /* 중간정렬 */
  '.area{background:#fff;vertical-align:top;padding:4px 5px;min-height:18mm}'+  /* 입력영역 */
  '.ro{writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap;'+
    'text-align:center;letter-spacing:1.5px;font-weight:700;font-size:8pt;'+
    'background:#d6e4f0;padding:4px 2px}'+  /* 세로 제목 */
  /* === 제목 === */
  '.doc-title{font-size:18pt;font-weight:900;text-align:center;'+
    'letter-spacing:6px;color:#1a1a2e;border:none;background:transparent;'+
    'padding:2mm 0}'+
  /* === 결재란 === */
  '.ap-box{width:100%}'+
  '.ap-h{background:#d6e4f0;font-weight:700;text-align:center;font-size:7pt;'+
    'height:12px;padding:1px}'+
  '.ap-v{height:22px;background:#fff;text-align:center;font-size:7pt;'+
    'vertical-align:middle}'+
  /* === 섹션 구분선 === */
  '.sec{margin-top:1.5mm}'+
  /* === Why 번호 === */
  '.why-num{background:#fef9c3;font-weight:700;text-align:center;'+
    'font-size:7.5pt;width:14mm;color:#92400e;border:0.4pt solid #444}'+
  /* === 상태 배지 === */
  '.badge{display:inline-block;padding:1px 6px;border-radius:10px;'+
    'font-size:7pt;font-weight:700;background:#dbeafe;color:#1e40af}'+
  /* === 인쇄 버튼 === */
  '.print-area{text-align:center;padding:8px;margin-top:6px}'+
  'button.print-btn{padding:8px 24px;background:#1a56db;color:#fff;'+
    'border:none;border-radius:6px;font-size:13px;cursor:pointer;'+
    'box-shadow:0 2px 8px rgba(26,86,219,.4)}'+
  'button.print-btn:hover{background:#1e40af}'+
  '</style></head><body>';

  /* ======================================================
     페이지 시작
     ====================================================== */
  html+='<div class="page">';

  /* ── 상단 헤더: 결재란 + 제목 ── */
  html+='<table style="margin-bottom:1.5mm">'+
    '<colgroup>'+
      '<col style="width:11mm"><col style="width:11mm"><col style="width:11mm"><col style="width:11mm">'+  /* 조치부서 결재 4칸 */
      '<col>'+  /* 제목 */
      '<col style="width:11mm"><col style="width:11mm"><col style="width:11mm">'+  /* 발행부서 결재 3칸 */
    '</colgroup>'+
    '<tr>'+
      '<td colspan="4" class="ap-h">조 치 부 서 결 재</td>'+
      '<td rowspan="3" class="doc-title">시 정 조 치 요 청 서</td>'+
      '<td colspan="3" class="ap-h">발 행 부 서 결 재</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="ap-h">작성</td><td class="ap-h">검토</td><td class="ap-h">검토</td><td class="ap-h">승인</td>'+
      '<td class="ap-h">작성</td><td class="ap-h">검토</td><td class="ap-h">승인</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="ap-v">'+created_by+'</td>'+
      '<td class="ap-v"></td><td class="ap-v"></td><td class="ap-v"></td>'+
      '<td class="ap-v">'+created_by+'</td>'+
      '<td class="ap-v"></td><td class="ap-v"></td>'+
    '</tr>'+
  '</table>';

  /* ── 기본정보 ── */
  html+='<table class="sec">'+
    '<colgroup>'+
      '<col style="width:18mm"><col style="width:32mm">'+
      '<col style="width:14mm"><col style="width:25mm">'+
      '<col style="width:14mm"><col style="width:25mm">'+
      '<col style="width:14mm"><col>'+
    '</colgroup>'+
    '<tr>'+
      '<td class="h">CAR 번호</td>'+
      '<td class="vm" style="font-family:monospace;font-weight:700;color:#1a5fa8;font-size:8.5pt">'+no+'</td>'+
      '<td class="h">개시일</td><td class="vm">'+rdate+'</td>'+
      '<td class="h">완료기한</td><td class="vm">'+close_date+'</td>'+
      '<td class="h">상태</td><td class="vm"><span class="badge">'+status+'</span></td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">제&nbsp;&nbsp;&nbsp;&nbsp;목</td>'+
      '<td colspan="7" class="vm" style="font-weight:700;font-size:9pt">'+title+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">품목코드</td><td class="vm" style="font-family:monospace">'+item_code+'</td>'+
      '<td class="h">품&nbsp;목&nbsp;명</td><td colspan="3" class="vm">'+item+'</td>'+
      '<td class="h">작업지시</td><td class="vm">'+work_order+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">발 생 원</td><td class="vm">'+source+'</td>'+
      '<td class="h">고 객 사</td><td class="vm">'+customer+'</td>'+
      '<td class="h">공 급 처</td><td class="vm">'+vendor+'</td>'+
      '<td class="h">NC 참조</td><td class="vm" style="font-family:monospace;color:#7c3aed">'+nc_no+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">담 당 자</td><td class="vm">'+assignee+'</td>'+
      '<td class="h">발행부서</td><td class="vm">품질팀</td>'+
      '<td class="h">비&nbsp;&nbsp;&nbsp;&nbsp;고</td><td colspan="3" class="v">'+note+'</td>'+
    '</tr>'+
    /* [v2.201] 누락 항목 추가 — 수량/불량률/유형/현상/처리방법 */
    '<tr>'+
      '<td class="h">납품수량</td><td class="vm">'+e(row.ship_qty||'')+'</td>'+
      '<td class="h">검사수량</td><td class="vm">'+e(row.insp_qty||'')+'</td>'+
      '<td class="h">불량수량</td><td class="vm">'+e(row.bad_qty||'')+'</td>'+
      '<td class="h">불&nbsp;량&nbsp;률</td><td class="vm">'+e(row.defect_rate||'')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">불량유형</td><td class="vm">'+e(row.defect_type||'')+'</td>'+
      '<td class="h">불량현상</td><td colspan="3" class="v">'+e(row.defect_desc||row.d2_desc||'')+'</td>'+
      '<td class="h">처리방법</td><td class="vm">'+e(row.action_type||row.d3_action||'')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">부적합비고</td><td colspan="7" class="v">'+e(row.nc_note||row.note||'')+'</td>'+
    '</tr>'+
  '</table>';

  /* ── 손실비용 ── */
  html+='<table class="sec">'+
    '<colgroup>'+
      '<col style="width:18mm"><col style="width:18mm">'+
      '<col><col><col><col style="width:22mm">'+
    '</colgroup>'+
    '<tr>'+
      '<td class="h" rowspan="2">상세내역</td>'+
      '<td class="h" rowspan="2">손실비용</td>'+
      '<td class="h">자 재 비</td>'+
      '<td class="h">가 공 비</td>'+
      '<td class="h">기&nbsp;&nbsp;&nbsp;&nbsp;타</td>'+
      '<td class="h">합&nbsp;&nbsp;&nbsp;&nbsp;계</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="vm" style="text-align:right;height:10mm">'+e(row.cost_material||'')+'</td>'+
      '<td class="vm" style="text-align:right">'+e(row.cost_process||'')+'</td>'+
      '<td class="vm" style="text-align:right">'+e(row.cost_etc||'')+'</td>'+
      '<td class="vm" style="text-align:right;font-weight:700">'+
        (row.cost_total||((Number(row.cost_material||0)+Number(row.cost_process||0)+Number(row.cost_etc||0))||''))+
      '</td>'+
    '</tr>'+
  '</table>';

  /* ── BODY: D1 팀구성 + D2 문제기술 ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:8mm"><col style="width:46%"><col style="width:8mm"><col></colgroup>'+
    '<tr>'+
      '<td class="ro" rowspan="1">D1<br>팀</td>'+
      '<td class="area" style="min-height:10mm">'+d1+'</td>'+
      '<td class="ro" rowspan="1">D2<br>문제<br>기술</td>'+
      '<td class="area" style="min-height:10mm">'+d2+'</td>'+
    '</tr>'+
  '</table>';

  /* ── D3 임시대책 + 부적합 구분 ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:8mm"><col style="width:46%"><col></colgroup>'+
    '<tr>'+
      '<td class="ro">D3<br>임시<br>대책</td>'+
      '<td class="area" style="min-height:12mm">'+d3+'</td>'+
      '<td class="v" style="vertical-align:top;padding:4px 6px">'+
        '<div style="font-weight:700;font-size:7.5pt;margin-bottom:3px;color:#374151">부적합 구분</div>'+
        '<div style="font-size:7.5pt;line-height:2">'+
          '□ 사람 &nbsp;□ 설비 &nbsp;□ 자재<br>□ 방법 &nbsp;□ 기타(　　　　)'+
        '</div>'+
      '</td>'+
    '</tr>'+
  '</table>';

  /* ── D4 근본원인 5-Why ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:8mm"><col style="width:14mm"><col><col style="width:8mm"><col></colgroup>'+
    '<tr>'+
      '<td class="ro" rowspan="7">D4<br>근본<br>원인<br>분석</td>'+
      '<td class="h" colspan="2">발 생 원 인 (Why)</td>'+
      '<td class="h" colspan="2">참 원 인 / 비 고</td>'+
    '</tr>'+
    '<tr><td class="why-num">Why 1</td><td class="v" style="min-height:8mm">'+why1+'</td>'+
      '<td class="why-num" rowspan="5" style="background:#fef9c3;color:#92400e;font-weight:700;text-align:center;vertical-align:middle;font-size:7.5pt">참<br>원<br>인</td>'+
      '<td class="area" rowspan="5" style="font-size:8pt">'+
        [why1,why2,why3,why4,why5].filter(function(x){return x&&x!=='';}).join('<br>↓<br>')+
      '</td>'+
    '</tr>'+
    '<tr><td class="why-num">Why 2</td><td class="v">'+why2+'</td></tr>'+
    '<tr><td class="why-num">Why 3</td><td class="v">'+why3+'</td></tr>'+
    '<tr><td class="why-num">Why 4</td><td class="v">'+why4+'</td></tr>'+
    '<tr><td class="why-num">Why 5</td><td class="v">'+why5+'</td></tr>'+
    '<tr>'+
      '<td class="h" colspan="4" style="font-size:7.5pt;text-align:left;padding:2px 6px">'+
        '※ 근본원인(결론): '+[why1,why2,why3,why4,why5].filter(function(x){return x&&x!=='';}).pop()+''+
      '</td>'+
    '</tr>'+
  '</table>';

  /* ── D5 대책실시 + D6 유효성평가 ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:8mm"><col><col style="width:20mm"><col style="width:8mm"><col><col style="width:18mm"><col style="width:16mm"></colgroup>'+
    '<tr>'+
      '<td class="ro">D5<br>대책<br>실시</td>'+
      '<td class="area" style="min-height:14mm">'+d5+'</td>'+
      '<td class="vm" style="text-align:center;font-size:7pt"><div class="h" style="border:none;padding:2px">실시일</div><div style="padding:2px 4px">'+d5date+'</div></td>'+
      '<td class="ro">D6<br>유효<br>성</td>'+
      '<td class="area" style="min-height:14mm">'+d6+'</td>'+
      '<td class="vm" style="text-align:center;font-size:7.5pt"><div class="h" style="border:none">평가결과</div><div style="padding:2px">'+d6result+'</div></td>'+
      '<td class="vm" style="text-align:center;font-size:7.5pt"><div class="h" style="border:none">평가일</div><div style="padding:2px">'+d6date+'</div></td>'+
    '</tr>'+
  '</table>';

  /* ── D7 재발방지 ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:8mm"><col style="width:10mm"><col><col style="width:20mm"><col><col style="width:20mm"></colgroup>'+
    '<tr>'+
      '<td class="ro" rowspan="3">D7<br>재발<br>방지</td>'+
      '<td class="h"></td>'+
      '<td class="h">발 생 방 지 대 책</td>'+
      '<td class="h">완료일</td>'+
      '<td class="h">유 출 방 지 대 책</td>'+
      '<td class="h">완료일</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h" style="font-size:7pt">단기</td>'+
      '<td class="v" style="min-height:9mm">'+d7+'</td>'+
      '<td class="vc">'+close_date+'</td>'+
      '<td class="v"></td><td class="vc"></td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h" style="font-size:7pt">중기</td>'+
      '<td class="v" style="min-height:7mm"></td><td class="vc"></td>'+
      '<td class="v"></td><td class="vc"></td>'+
    '</tr>'+
  '</table>';

  /* ── 하단 헤더: 회람 + 표준류 반영 ── */
  html+='<table class="sec">'+
    '<colgroup>'+
      '<col style="width:9mm"><col style="width:22mm"><col style="width:9mm">'+
      '<col style="width:22mm"><col style="width:9mm">'+
      '<col><col><col><col>'+
    '</colgroup>'+
    '<tr>'+
      '<td class="h" rowspan="4">회<br>람</td>'+
      '<td class="h">성명</td><td class="h" rowspan="2">서명</td>'+
      '<td class="h">성명</td>'+
      '<td class="h" rowspan="4" style="writing-mode:vertical-rl;font-size:7.5pt">표준류<br>반영</td>'+
      '<td class="h" colspan="2" style="font-size:7.5pt">□ 관리계획서</td>'+
      '<td class="h" colspan="2" style="font-size:7.5pt">□ FMEA</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="ap-v" style="height:11px">'+assignee+'</td>'+
      '<td class="ap-v"></td>'+
      '<td class="v" colspan="2" style="font-size:7.5pt">□ 작업표준서</td>'+
      '<td class="v" colspan="2" style="font-size:7.5pt">□ 검사기준서</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="h">성명</td><td class="h" rowspan="2">서명</td>'+
      '<td class="h">성명</td>'+
      '<td class="v" colspan="4" rowspan="2"></td>'+
    '</tr>'+
    '<tr><td class="ap-v" style="height:11px"></td><td class="ap-v"></td></tr>'+
  '</table>';

  /* ── 바닥글 ── */
  html+='<table class="sec">'+
    '<colgroup><col style="width:33%"><col style="width:34%"><col style="width:33%"></colgroup>'+
    '<tr>'+
      '<td style="border:0.4pt solid #666;background:#e8eaf6;font-size:7pt;padding:2px 5px;color:#444">'+
        'IPD-806-01 (Rev.01)'+
      '</td>'+
      '<td style="border:0.4pt solid #666;background:#e8eaf6;font-size:7pt;text-align:center;color:#444">'+
        '㈜ 이 노 디 스'+
      '</td>'+
      '<td style="border:0.4pt solid #666;background:#e8eaf6;font-size:7pt;text-align:right;padding:2px 5px;color:#444">'+
        'A4 (210mm × 297mm)'+
      '</td>'+
    '</tr>'+
  '</table>';

  html+='</div>';  /* .page 끝 */

  /* ── 인쇄 버튼 (인쇄 시 숨김) ── */
  html+='<div class="print-area no-print">'+
    '<button class="print-btn" onclick="window.print()">🖨️ 인쇄</button>'+
  '</div>';

  html+='</body></html>';
  w.document.open();
  w.document.write(html);
  w.document.close();
},

/* [v2.199] _carInputPrint — car_input 폼 현재 값으로 인쇄 */
_carInputPrint(){
  const g=id=>document.getElementById(id)?.value||'';
  const row={
    no:g('carInputNo'), date:g('carInputOpen'), source:g('carInputSrc'),
    title:g('carInputTitle'), assignee:g('carInputAssignee'),
    customer:g('carInputCustomer'), vendor_name:g('carInputVendor'),
    work_order:g('carInputWorkOrder'),
    item_code:g('carInputItemCode').split(' — ')[0].trim(),
    item:g('carInputItem'), close_date:g('carInputDue'),
    nc_no:g('carInputNcNo'),
    d2_desc:g('carInputD2'), d3_action:g('carInputD3'),
    d4_why1:g('carInputWhy1'), d4_why2:g('carInputWhy2'),
    d4_why3:g('carInputWhy3'), d4_why4:g('carInputWhy4'),
    d4_why5:g('carInputWhy5'),
    d5_action:g('carInputD5'), d5_date:g('carInputD5Date'),
    d6_verify:g('carInputD6'), d6_result:g('carInputD6Result'),
    d6_date:g('carInputD6Date'), d7_prevent:g('carInputD7'),
    note:g('carInputNote'), status:g('carInputStatus'),
    created_by:window._carInputRow?.created_by||'',
  };
  Pages._carPrint(row);
},

/* [v2.198] _carInputPrint — car_input 폼에서 인쇄 */
_carInputPrint(){
  const g=id=>document.getElementById(id)?.value||'';
  const row={
    no:g('carInputNo'), date:g('carInputOpen'), source:g('carInputSrc'),
    title:g('carInputTitle'), assignee:g('carInputAssignee'),
    customer:g('carInputCustomer'), vendor_name:g('carInputVendor'),
    work_order:g('carInputWorkOrder'), item_code:g('carInputItemCode').split(' — ')[0].trim(),
    item:g('carInputItem'), close_date:g('carInputDue'),
    d2_desc:g('carInputD2'), d3_action:g('carInputD3'),
    d4_why1:g('carInputWhy1'), d4_why2:g('carInputWhy2'), d4_why3:g('carInputWhy3'),
    d4_why4:g('carInputWhy4'), d4_why5:g('carInputWhy5'),
    d5_action:g('carInputD5'), d5_date:g('carInputD5Date'),
    d6_verify:g('carInputD6'), d6_result:g('carInputD6Result'), d6_date:g('carInputD6Date'),
    d7_prevent:g('carInputD7'), note:g('carInputNote'),
  };
  Pages._carPrint(row);
},


/* ════ 개선활동 — 내부심사(Internal Audit) [v2.149 전면 신규개발] ════
   흐름: 연간 심사계획 수립 → 심사 실시(체크리스트) → 부적합 발견사항 →
        CAR 발행 연계 → 후속조치 확인 → 심사보고서 종결
   ═══════════════════════════════════════════════════════════════ */
async audit(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="spin"></div>';
  const fresh=await SB.getAudits();
  if(fresh&&fresh.length>=0) DB.audits=fresh;
  const data=DB.audits||[];
  const total=data.length;
  const byStatus={계획:0,실시중:0,보고:0,완료:0};
  data.forEach(a=>{if(byStatus[a.status]!==undefined)byStatus[a.status]++;});
  const totalFindings=data.reduce((s,a)=>s+(a.findings_count||0),0);

  const noMaxLen=Math.max(8,...data.map(r=>(r.no||'').length));
  const noW=Math.min(160,Math.max(120,noMaxLen*9+24))+'px';

  w.innerHTML=`
  <div class="stat-dash">
    <div class="sd-card"><div class="sd-icon" style="background:#e8f4fd;color:#3b82c4">🔎</div>
      <div><div class="sd-val">${total}</div><div class="sd-lbl">전체 심사</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e3f6ec;color:#3fa873">📅</div>
      <div><div class="sd-val">${byStatus['계획']||0}</div><div class="sd-lbl">계획</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fdf3e3;color:#d6952f">🔍</div>
      <div><div class="sd-val">${byStatus['실시중']||0}</div><div class="sd-lbl">실시중</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">📋</div>
      <div><div class="sd-val">${byStatus['보고']||0}</div><div class="sd-lbl">보고</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fbe9ea;color:#cd5b63">⚠️</div>
      <div><div class="sd-val">${totalFindings}</div><div class="sd-lbl">총 발견사항</div></div></div>
  </div>
  <div class="ph" style="margin-top:14px">
    <div><div class="ptit">🔎 내부심사</div>
      <div style="font-size:13px;color:var(--muted)">ISO 9001 9.2 — 계획 → 실시(체크리스트) → 발견사항 → CAR연계 → 종결</div></div>
    <div class="pac">
      <button class="btn bpri btn-f2" onclick="Pages._auditForm()">+ 심사 등록 <span class="kbd">F2</span></button>
    </div>
  </div>
  <div class="tbar">
    <div class="sw2">
      <input type="text" id="auditSearch" placeholder="심사번호, 범위, 심사원, 피심사부서 검색..."
        oninput="Pages._auditRender2()" value="">
    </div>
    <select class="fsel" id="auditTypeF" onchange="Pages._auditRender2()">
      <option value="">전체 유형</option>
      ${['정기','특별','추가'].map(s=>`<option>${s}</option>`).join('')}
    </select>
    <select class="fsel" id="auditStatusF" onchange="Pages._auditRender2()">
      <option value="">전체 상태</option>
      ${['계획','실시중','보고','완료'].map(s=>`<option>${s}</option>`).join('')}
    </select>
    <button class="btn bout bsm" onclick="SearchPop.open('audit')" title="통합검색 (F3)">🔎 <span class="kbd">F3</span></button>
  </div>
  <div id="auditTbl"></div>`;

  Pages._auditRender2();
},

/* ── 내부심사 목록 렌더 ── */
_auditRender2(){
  const data=DB.audits||[];
  const q=(document.getElementById('auditSearch')?.value||'').toLowerCase();
  const tp=document.getElementById('auditTypeF')?.value||'';
  const st=document.getElementById('auditStatusF')?.value||'';
  const filtered=data.filter(a=>{
    if(q&&![(a.no||''),(a.scope||''),(a.auditor||''),(a.auditee_dept||'')].join(' ').toLowerCase().includes(q))return false;
    if(tp&&a.audit_type!==tp)return false;
    if(st&&a.status!==st)return false;
    return true;
  });
  const noMaxLen=Math.max(8,...filtered.map(r=>(r.no||'').length));
  const noW=Math.min(160,Math.max(120,noMaxLen*9+24))+'px';
  Tbl.render({
    el:'#auditTbl',
    rowStyle:(row)=>{
      if(row.status==='완료') return '';
      if(row.plan_date){
        const today=new Date().toISOString().slice(0,10);
        if(row.plan_date<today && row.status==='계획') return 'background:rgba(254,226,226,0.5);';
      }
      return '';
    },
    cols:[
      {key:'status',     label:'상태',     w:'76px', align:'center',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='보고'?'bpur':v==='실시중'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'no',         label:'심사번호', w:noW, req:true,
        render:v=>`<span style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">${H.e(v||'-')}</span>`},
      {key:'audit_type', label:'유형',     w:'72px',
        render:v=>`<span class="badge bblu" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'scope',      label:'심사 범위',w:'*'},
      {key:'auditee_dept',label:'피심사부서',w:'100px'},
      {key:'plan_date',  label:'계획일',   w:'88px'},
      {key:'actual_date',label:'실시일',   w:'88px', render:v=>v||'-'},
      {key:'auditor',    label:'심사원',   w:'80px'},
      {key:'findings_count',label:'발견사항',w:'70px', align:'center',
        render:v=>v?`<span class="badge bred" style="font-size:10px">${v}건</span>`:`<span style="color:var(--tl)">0</span>`},
      {key:'file_url',   label:'파일',     w:'46px', align:'center',
        render:v=>v?`<a href="${H.e(v)}" target="_blank" onclick="event.stopPropagation()" style="font-size:14px">📎</a>`:'<span style="color:var(--tl)">-</span>'},
    ],
    data:filtered,
    onRow:row=>Pages._auditDetail(row),
    onDel:async(ids)=>{
      if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
      Modal.confirm({title:'🗑️ 내부심사 삭제 확인',
        msg:`선택한 <b style="color:#dc2626">${ids.length}건</b>의 내부심사 기록을 삭제합니다.<br><small style="color:#64748b">삭제된 데이터는 복구가 어렵습니다.</small>`,
        danger:true,
        onOk:async()=>{
          const numIds=ids.map(Number);
          if(_sb){
            for(const id of numIds){const {error}=await _sb.from('internal_audits').delete().eq('id',id);if(error){Toast.show('삭제 실패: '+error.message,'err');return;}}
          }
          DB.audits=(DB.audits||[]).filter(a=>!numIds.includes(Number(a.id)));
          Toast.show(`${numIds.length}건 삭제되었습니다.`,'ok');
          Pages._auditRender2();
        }
      });
    }
  });
},

/* ── 내부심사 등록/수정 폼 [v2.149] ── */
_auditForm(row=null){
  const isEdit=!!row;
  const today=H.today();
  const nextNo=(()=>{
    const d=today.replace(/-/g,'');
    const todayAudits=(DB.audits||[]).filter(a=>(a.no||'').startsWith('IA-'+d));
    return`IA-${d}-${String(todayAudits.length+1).padStart(3,'0')}`;
  })();
  const userOpts=(DB.users||[]).filter(u=>u.active!==false).map(u=>{
    const nm=H.e(u.name||u.username);
    const sel=(isEdit&&row.auditor===nm)||(!isEdit&&(Auth._u?.name||Auth._u?.username)===nm)?'selected':'';
    return`<option value="${nm}" ${sel}>${nm}${u.dept?' ('+H.e(u.dept)+')':''}</option>`;
  }).join('');
  const steps=['계획','실시중','보고','완료'];
  const statusOpts=steps.map(s=>`<option value="${s}" ${(isEdit&&row.status===s)||(!isEdit&&s==='계획')?'selected':''}>${s}</option>`).join('');

  /* 체크리스트 항목 — 기본 ISO 9001 조항 템플릿, 수정 시 기존 값 복원 */
  let checklist=[];
  if(isEdit&&row.checklist){
    try{checklist=JSON.parse(row.checklist);}catch(e){checklist=[];}
  }
  if(!checklist.length){
    checklist=[
      {clause:'4.4', item:'프로세스 운영 및 상호작용', result:'', note:''},
      {clause:'7.5', item:'문서화된 정보 관리', result:'', note:''},
      {clause:'8.5', item:'생산 및 서비스 제공 관리', result:'', note:''},
      {clause:'8.7', item:'부적합 출력의 관리', result:'', note:''},
      {clause:'9.1', item:'모니터링, 측정, 분석 및 평가', result:'', note:''},
    ];
  }
  window._auditChecklist=checklist;

  Modal.open({title:isEdit?`✏️ 내부심사 수정 — ${row.no}`:'+ 내부심사 등록',size:'mxl',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>`
        +`<button class="btn bpri btn-f8" onclick="Pages._auditSave(${isEdit?row.id:'null'})">💾 저장 <span class="kbd">F8</span></button>`,
    body:`<div class="fg2">
      <input type="hidden" id="auditId" value="${isEdit?row.id:''}">
      <div class="fgroup">
        <label class="fl">심사번호</label>
        <input class="fc" id="auditNo" value="${H.e(row?.no||nextNo)}" ${isEdit?'readonly':''}
          style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">심사유형 *</b></label>
        <select class="fc" id="auditType">
          ${['정기','특별','추가'].map(s=>`<option value="${s}" ${(row?.audit_type||'정기')===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">계획일 *</b></label>
        <input class="fc" type="date" id="auditPlanDate" value="${H.e(row?.plan_date||today)}">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <label class="fl req"><b style="color:#e11d48">심사 범위 *</b></label>
        <input class="fc" id="auditScope" value="${H.e(row?.scope||'')}" placeholder="예) 품질경영시스템 전반 / 생산 공정 / 검사 프로세스">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">피심사부서 *</b></label>
        <input class="fc" id="auditDept" value="${H.e(row?.auditee_dept||'')}" placeholder="예) 생산팀, 품질팀">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">심사원 *</b></label>
        <select class="fc" id="auditAuditor"><option value="">선택</option>${userOpts}</select>
      </div>
      <div class="fgroup">
        <label class="fl">실시일</label>
        <input class="fc" type="date" id="auditActualDate" value="${H.e(row?.actual_date||'')}">
      </div>
      <div class="fgroup">
        <label class="fl">상태</label>
        <select class="fc" id="auditStatus">${statusOpts}</select>
      </div>
    </div>
    <div style="margin-top:14px;border-top:1px solid var(--brd);padding-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;color:var(--text)">📋 심사 체크리스트</div>
        <button class="btn bout bxs" onclick="Pages._auditChecklistAdd()">+ 항목 추가</button>
      </div>
      <div id="auditChecklistArea"></div>
    </div>
    <div style="margin-top:14px;border-top:1px solid var(--brd);padding-top:14px">
      <div class="fg1" style="gap:10px">
        <div class="fgroup ff"><label class="fl">종합 결론</label>
          <textarea class="fc" id="auditConclusion" rows="2" placeholder="심사 종합 평가 및 결론">${H.e(row?.conclusion||'')}</textarea></div>
        <div class="fgroup">
          <label class="fl">보고일</label>
          <input class="fc" type="date" id="auditReportDate" value="${H.e(row?.report_date||'')}">
        </div>
        <div class="fgroup">
          <label class="fl">첨부파일</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${isEdit&&row.file_url
              ?`<a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 현재 파일</a>
                 <button type="button" class="btn bxs bred bsm" onclick="window._auditFileDel=true;this.style.display='none';this.nextElementSibling.textContent='(삭제 예정)'">🗑️ 삭제</button>
                 <span style="font-size:11px;color:var(--muted)"></span>`:''}
            <label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px dashed var(--brd);border-radius:6px;cursor:pointer;font-size:13px;color:var(--muted)">
              📁 파일 선택<input type="file" id="auditFile" accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png" style="display:none"
                onchange="this.closest('label').nextElementSibling&&(this.closest('label').nextElementSibling.textContent=this.files[0]?.name||'')">
            </label>
            <span style="font-size:11px;color:var(--pri)"></span>
          </div>
        </div>
      </div>
    </div>`
  });
  Pages._auditChecklistRender();
},

/* ── 체크리스트 렌더/조작 ── */
_auditChecklistRender(){
  const el=document.getElementById('auditChecklistArea');
  if(!el) return;
  const list=window._auditChecklist||[];
  el.innerHTML=`<table class="ctbl" style="width:100%"><thead><tr>
      <th style="width:60px">조항</th><th>점검 항목</th><th style="width:90px">판정</th><th>비고</th><th style="width:40px"></th>
    </tr></thead><tbody>
    ${list.map((c,i)=>`<tr>
      <td><input class="fc" style="font-size:12px" value="${H.e(c.clause)}" onchange="window._auditChecklist[${i}].clause=this.value"></td>
      <td><input class="fc" style="font-size:12px" value="${H.e(c.item)}" onchange="window._auditChecklist[${i}].item=this.value"></td>
      <td><select class="fc" style="font-size:12px" onchange="window._auditChecklist[${i}].result=this.value">
        ${['','적합','경미부적합','중대부적합','관찰사항'].map(r=>`<option value="${r}" ${c.result===r?'selected':''}>${r||'선택'}</option>`).join('')}
      </select></td>
      <td><input class="fc" style="font-size:12px" value="${H.e(c.note)}" onchange="window._auditChecklist[${i}].note=this.value"></td>
      <td style="text-align:center"><button class="btn bxs bred" onclick="Pages._auditChecklistDel(${i})">✕</button></td>
    </tr>`).join('')}
  </tbody></table>`;
},
_auditChecklistAdd(){
  window._auditChecklist=window._auditChecklist||[];
  window._auditChecklist.push({clause:'',item:'',result:'',note:''});
  Pages._auditChecklistRender();
},
_auditChecklistDel(i){
  window._auditChecklist.splice(i,1);
  Pages._auditChecklistRender();
},

/* ── 내부심사 저장 [v2.149] ── */
async _auditSave(editId){
  const g=id=>document.getElementById(id)?.value?.trim()||'';
  const scope=g('auditScope');
  const planDate=g('auditPlanDate');
  const dept=g('auditDept');
  const auditor=g('auditAuditor');
  if(!scope){Toast.show('심사 범위를 입력하세요.','warn');return;}
  if(!planDate){Toast.show('계획일을 입력하세요.','warn');return;}
  if(!dept){Toast.show('피심사부서를 입력하세요.','warn');return;}
  if(!auditor){Toast.show('심사원을 선택하세요.','warn');return;}

  /* 체크리스트에서 부적합/관찰사항 건수 집계 */
  const checklist=window._auditChecklist||[];
  const findingsCount=checklist.filter(c=>c.result==='경미부적합'||c.result==='중대부적합').length;

  /* 파일 업로드 */
  let file_url=editId?(DB.audits||[]).find(a=>a.id===editId)?.file_url||null:null;
  if(window._auditFileDel){file_url=null;window._auditFileDel=false;}
  const fileEl=document.getElementById('auditFile');
  if(fileEl?.files?.length){
    const up=await SB.uploadFile('audit',fileEl.files[0]);
    if(up?.url) file_url=up.url;
    else Toast.show('파일 업로드 실패. 저장은 계속됩니다.','warn');
  }

  const row={
    no:g('auditNo'), audit_type:g('auditType'), scope, auditee_dept:dept,
    plan_date:planDate, actual_date:g('auditActualDate')||null,
    auditor, status:g('auditStatus')||'계획',
    checklist:JSON.stringify(checklist), findings_count:findingsCount,
    conclusion:g('auditConclusion')||null, report_date:g('auditReportDate')||null,
    file_url, created_by:Auth._u?.name||Auth._u?.username||'',
  };

  if(editId){
    const res=await SB.updateAudit(editId,row);
    if(!res?.ok) return;
    const idx=(DB.audits||[]).findIndex(a=>a.id===editId);
    if(idx>=0) DB.audits[idx]={...DB.audits[idx],...row};
    Toast.show('내부심사가 수정되었습니다.','ok');
  } else {
    const res=await SB.addAudit(row);
    if(!res?.ok) return;
    Toast.show('내부심사가 등록되었습니다.','ok');
  }
  Modal.close();
  Pages._auditRender2();
},

/* ── 내부심사 상세 팝업 [v2.149] ── */
_auditDetail(row){
  if(!row||typeof row!=='object'){Toast.show('데이터를 불러올 수 없습니다.','err');return;}
  window._auditRow=row;
  const steps=['계획','실시중','보고','완료'];
  const si=steps.indexOf(row.status||'계획');
  const stBar=steps.map((s,i)=>
    `<div class="pst"><div class="psd ${i===si?'ac':i<si?'dn':''}">${i+1}</div>
     <div class="psl ${i===si?'ac':''}" style="font-size:11px">${s}</div></div>`
  ).join('');
  let checklist=[];
  try{checklist=JSON.parse(row.checklist||'[]');}catch(e){checklist=[];}
  const findings=checklist.filter(c=>c.result==='경미부적합'||c.result==='중대부적합');

  /* 연계된 CAR 확인 (nc_no 형식으로 audit 번호 참조 가정 — CAR의 src='내부심사', nc_no에 audit.no 저장) */
  const linkedCar=(DB.cars||[]).filter(c=>c.src==='내부심사'&&c.nc_no===row.no);

  Modal.open({
    title:`🔎 내부심사 상세 — ${H.e(row.no||'-')}`,size:'mxl',
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`
        +`<button class="btn bout bsm" onclick="Pages._auditPrint(window._auditRow)">🖨️ 인쇄</button>`
        +`<button class="btn bout" onclick="Modal.close();Pages._auditForm(window._auditRow)">✏️ 수정</button>`
        +(findings.length?`<button class="btn bamb" onclick="Pages._auditToCar(window._auditRow)">🔧 CAR 발행</button>`:'')
        +`<button class="btn bpri" onclick="Pages._auditNextStep(window._auditRow)">▶ 다음 단계</button>`,
    body:`
      <div class="psteps">${stBar}</div>
      ${linkedCar.length?`<div style="background:#ede9fe;border-radius:8px;padding:8px 12px;margin:10px 0;font-size:13px">
        🔧 연계 CAR: ${linkedCar.map(c=>`<span style="font-family:monospace;font-weight:700;color:#7c3aed;cursor:pointer" onclick="Modal.close();Nav.go('car')">${H.e(c.no)}</span> <span class="badge ${c.status==='완료'?'bgrn':'bamb'}" style="font-size:10px">${H.e(c.status)}</span>`).join(' / ')}
      </div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div>
          <div class="ir"><div class="il">심사번호</div>
            <div class="iv" style="font-family:monospace;font-size:13px;font-weight:700;color:#1a5fa8">${H.e(row.no||'-')}</div></div>
          <div class="ir"><div class="il">유형</div>
            <div class="iv"><span class="badge bblu" style="font-size:11px">${H.e(row.audit_type||'-')}</span></div></div>
          <div class="ir"><div class="il">심사 범위</div>
            <div class="iv">${H.e(row.scope||'-')}</div></div>
          <div class="ir"><div class="il">피심사부서</div>
            <div class="iv">${H.e(row.auditee_dept||'-')}</div></div>
        </div>
        <div>
          <div class="ir"><div class="il">심사원</div>
            <div class="iv">${H.e(row.auditor||'-')}</div></div>
          <div class="ir"><div class="il">계획일</div>
            <div class="iv">${H.e(row.plan_date||'-')}</div></div>
          <div class="ir"><div class="il">실시일</div>
            <div class="iv">${H.e(row.actual_date||'-')}</div></div>
          ${row.file_url?`<div class="ir"><div class="il">첨부파일</div>
            <div class="iv"><a href="${H.e(row.file_url)}" target="_blank" class="btn bxs bblu bsm">📎 파일 보기</a></div></div>`:''}
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="il" style="margin-bottom:6px">심사 체크리스트</div>
        <table class="ctbl" style="width:100%"><thead><tr><th style="width:60px">조항</th><th>점검 항목</th><th style="width:90px">판정</th><th>비고</th></tr></thead><tbody>
        ${checklist.map(c=>`<tr>
          <td>${H.e(c.clause)}</td><td>${H.e(c.item)}</td>
          <td><span class="badge ${c.result==='적합'?'bgrn':c.result==='중대부적합'?'bred':c.result==='경미부적합'?'bamb':c.result==='관찰사항'?'bblu':'bgry'}" style="font-size:10px">${H.e(c.result||'-')}</span></td>
          <td>${H.e(c.note||'-')}</td>
        </tr>`).join('')}
        </tbody></table>
      </div>
      ${row.conclusion?`<div class="ir" style="margin-top:10px"><div class="il">종합 결론</div><div class="iv">${H.e(row.conclusion)}</div></div>`:''}
      <div id="auditCmt" style="margin-top:14px"></div>`
  });
  setTimeout(()=>{if(typeof Cmt!=='undefined')Cmt.render('#auditCmt',`audit-${row.id}`);},80);
},

/* ── 내부심사 발견사항 → CAR 발행 연계 ── */
_auditToCar(row){
  let checklist=[];
  try{checklist=JSON.parse(row.checklist||'[]');}catch(e){checklist=[];}
  const findings=checklist.filter(c=>c.result==='경미부적합'||c.result==='중대부적합');
  const titleSummary=findings.map(f=>`[${f.clause}] ${f.item}: ${f.note||f.result}`).join(' / ');
  Modal.close();
  Pages._carForm(null,{
    src:'내부심사', nc_no:row.no,
    title:`내부심사 발견사항 — ${row.scope}`,
    note:titleSummary,
  });
},

/* ── 내부심사 다음 단계 ── */
async _auditNextStep(row){
  const steps=['계획','실시중','보고','완료'];
  const cur=steps.indexOf(row.status||'계획');
  if(cur>=steps.length-1){Toast.show('이미 완료 상태입니다.','info');return;}
  const next=steps[cur+1];
  Modal.confirm({title:'▶ 단계 진행',
    msg:`<strong>${H.e(row.no)}</strong>의 상태를<br><b>${H.e(row.status)}</b> → <b style="color:var(--pri)">${next}</b>으로 진행하시겠습니까?`,
    onOk:async()=>{
      const res=await SB.updateAudit(row.id,{status:next});
      if(!res?.ok){Toast.show('상태 변경 실패','err');return;}
      const idx=(DB.audits||[]).findIndex(a=>a.id===row.id);
      if(idx>=0) DB.audits[idx].status=next;
      window._auditRow={...row,status:next};
      Modal.close();
      Toast.show(`"${next}"으로 진행되었습니다.`,'ok');
      Pages._auditRender2();
    }
  });
},

/* ── 내부심사 인쇄 [v2.149] — 내부심사 보고서 ── */
_auditPrint(row){
  if(!row){Toast.show('인쇄할 심사 데이터가 없습니다.','warn');return;}
  const w=window.open('','_blank','width=1000,height=780,scrollbars=yes');
  if(!w){Toast.show('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.','warn');return;}
  const e=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let checklist=[];
  try{checklist=JSON.parse(row.checklist||'[]');}catch(err){checklist=[];}
  const steps=['계획','실시중','보고','완료'];
  const si=steps.indexOf(row.status||'계획');
  const stepsHtml=steps.map((s,i)=>`<td style="text-align:center;background:${i===si?'#dce6f1':i<si?'#e8f5e9':'#fff'};font-weight:${i===si?'bold':'normal'}">${i+1}.${s}</td>`).join('');
  const checklistHtml=checklist.map(c=>`<tr>
    <td style="text-align:center">${e(c.clause)}</td><td>${e(c.item)}</td>
    <td style="text-align:center">${e(c.result||'-')}</td><td>${e(c.note||'')}</td>
  </tr>`).join('');
  const html=`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>내부심사 보고서 — ${e(row.no)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:"맑은 고딕","Malgun Gothic",sans-serif}
body{background:#fff;color:#000;font-size:9pt;padding:0}
@page{size:A4 portrait;margin:10mm 12mm}
@media print{.no-print{display:none!important}}
.wrap{width:186mm;margin:0 auto}
h1{font-size:14pt;font-weight:bold;text-align:center;padding:8px 0;letter-spacing:2px;border-bottom:2pt solid #000;margin-bottom:8px}
table{border-collapse:collapse;width:100%;margin-bottom:6px}
td,th{border:.7pt solid #444;padding:3px 6px;vertical-align:middle;font-size:8.5pt}
.lb{background:#dce6f1;font-weight:bold;white-space:nowrap;width:80px;text-align:center}
.area{vertical-align:top;padding:4px 6px;min-height:40px}
.sign td{height:32px;text-align:center}
.step td{padding:4px;font-size:8pt}
.hdr{background:#dce6f1;font-weight:bold;text-align:center;font-size:8pt}
.print-btn{position:fixed;bottom:20px;right:20px;padding:10px 20px;background:#1a5fa8;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer}
</style></head><body>
<div class="wrap">
  <h1>내 부 심 사 보 고 서</h1>
  <table class="sign" style="margin-bottom:8px">
    <tr><td class="hdr" rowspan="2" style="width:60px">작성</td>
        <td class="hdr" style="width:60px">검토</td>
        <td class="hdr" style="width:60px">승인</td>
        <td class="lb" style="width:70px">문서번호</td>
        <td>IPD-IA-01</td>
        <td class="lb" style="width:60px">계획일</td>
        <td>${e(row.plan_date||'')}</td></tr>
    <tr><td></td><td></td>
        <td class="lb">심사번호</td>
        <td style="font-family:monospace;font-weight:bold;color:#1a5fa8">${e(row.no)}</td>
        <td class="lb">진행 상태</td>
        <td>${e(row.status||'계획')}</td></tr>
  </table>
  <table class="step" style="margin-bottom:8px"><tr class="hdr"><td colspan="4" class="hdr">■ 진행 단계</td></tr><tr>${stepsHtml}</tr></table>
  <table>
    <tr><td class="lb">심사유형</td><td>${e(row.audit_type||'')}</td>
        <td class="lb">피심사부서</td><td>${e(row.auditee_dept||'')}</td></tr>
    <tr><td class="lb">심사원</td><td>${e(row.auditor||'')}</td>
        <td class="lb">실시일</td><td>${e(row.actual_date||'-')}</td></tr>
    <tr><td class="lb">심사범위</td><td colspan="3">${e(row.scope||'')}</td></tr>
  </table>
  <table style="margin-top:6px">
    <tr><td class="hdr" colspan="4">■ 심사 체크리스트</td></tr>
    <tr><td class="hdr" style="width:50px">조항</td><td class="hdr">점검 항목</td><td class="hdr" style="width:70px">판정</td><td class="hdr">비고</td></tr>
    ${checklistHtml}
  </table>
  <table style="margin-top:6px">
    <tr><td class="hdr" colspan="2">■ 종합 결론</td></tr>
    <tr><td colspan="2" class="area" style="min-height:50px">${e(row.conclusion||'')}</td></tr>
  </table>
  <table style="margin-top:8px;font-size:7.5pt">
    <tr><td style="background:#dce6f1;width:33%">㈜이노디스 — IPD-IA-01(Rev01)</td>
        <td style="background:#dce6f1;text-align:center">내부심사보고서</td>
        <td style="background:#dce6f1;text-align:right">A4(210×297mm)</td></tr>
  </table>
</div>
<button class="print-btn no-print" onclick="window.print()">🖨️ 인쇄</button>
</body></html>`;
  w.document.open();w.document.write(html);w.document.close();
},

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
      const failed=[];
      for(const id of ids){
        const res=await SB.deleteMention(id);
        if(!res.ok) failed.push(id);
      }
      const okIds=ids.filter(id=>!failed.includes(id));
      DB.mentions=(DB.mentions||[]).filter(m=>!okIds.includes(m.id));
      Pages._updateMentionBadge();
      if(failed.length){
        Toast.show(`${okIds.length}건 삭제, ${failed.length}건 실패`,'warn');
      } else {
        Toast.show(ids.length+'건 삭제되었습니다.','ok');
      }
      Pages._mentionRefresh();
    }
  });
},
/* [v2.131] 개별 멘션 삭제 — 호출만 있고 정의가 없어 TypeError 발생하던 버그 수정 */
_mentionDel(id){
  Modal.confirm({title:'🗑️ 멘션 삭제',msg:'이 멘션을 삭제하시겠습니까?',danger:true,onOk:async()=>{
    const res=await SB.deleteMention(id);
    if(!res.ok) return;
    DB.mentions=(DB.mentions||[]).filter(m=>m.id!==id);
    Pages._updateMentionBadge();
    Toast.show('삭제되었습니다.','ok');
    Pages._mentionRefresh();
  }});
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
  /* [v2.394] 멘션 상세 — 파일 미리보기+다운로드 */
  /* [v2.150] 수정 버튼 복귀 + 답장 스레드 표시 추가 */
  const m=(DB.mentions||[]).find(m=>Number(m.id)===Number(id));
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return;}
  const me=Auth._cur||'admin';
  const isMine=m.from===me;
  if(!m.read&&!isMine){
    await SB.updateMention(id,{read:true});
    m.read=true;
    Pages._updateMentionBadge&&Pages._updateMentionBadge();
    Pages._mentionRefresh&&Pages._mentionRefresh();
  }
  const ts=(m.created_at||'').slice(0,16).replace('T',' ');
  const mid=Number(m.id);
  const mfrom=H.e(m.from||'');

  /* 파일 블록 */
  let fileHtml='';
  if(m.file_url){
    const fu=m.file_url;
    const fn=H.e(fu.split('/').pop()||'첨부파일');
    const fuE=H.e(fu);
    fileHtml='<div style="margin-top:10px;padding:10px 12px;background:#eff6ff;'
      +'border:1px solid #bfdbfe;border-radius:6px;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:20px">📎</span>'
      +'<span style="font-size:13px;color:#1d4ed8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+fn+'</span>'
      +'<button class="btn bxs bblu" style="font-size:11px;padding:3px 12px"'
      +' data-fu="'+fuE+'" onclick="Pages._mentionFilePreview(this.dataset.fu)">👁 미리보기</button>'
      +'<a href="'+fuE+'" download target="_blank"'
      +' class="btn bxs bout" style="font-size:11px;padding:3px 12px">⬇ 다운로드</a>'
      +'</div>';
  }

  const toLabel=m.to==='all'?'📢 전체공지':H.e(m.to||'-');

  /* [v2.150] 답장 스레드: DB.mentions에서 thread_id 또는 reply_to가 이 멘션을 가리키는 항목 */
  const replies=(DB.mentions||[]).filter(r=>
    (r.thread_id===mid||r.reply_to===mid) && Number(r.id)!==mid
  ).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));

  let replyHtml='';
  if(replies.length){
    replyHtml='<div style="margin-top:14px;border-top:1px solid var(--brd);padding-top:12px">'
      +'<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">↩ 답장 '+replies.length+'건</div>'
      +replies.map(r=>{
        const rts=(r.created_at||'').slice(0,16).replace('T',' ');
        return '<div style="background:var(--bg2);border-radius:8px;padding:10px 14px;margin-bottom:8px;border-left:3px solid #6366f1">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
          +'<span style="font-size:13px;font-weight:700;color:#6366f1">'+H.e(r.from||'-')+'</span>'
          +'<span style="font-size:11px;color:var(--muted)">'+rts+'</span>'
          +'</div>'
          +'<div style="font-size:13px;line-height:1.6;white-space:pre-wrap;color:var(--text)">'+H.e(r.text||r.message||'')+'</div>'
          +'</div>';
      }).join('')
      +'</div>';
  }

  Modal.open({
    title:'💬 멘션 상세',
    size:'mmd',
    /* [v2.150] 수정 버튼 복귀 — isMine일 때만 표시 */
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'
        +(isMine?'<button class="btn bgry bsm" onclick="Modal.close();Pages._mentionEdit('+mid+')">✏️ 수정</button>':'')
        +'<button class="btn bgry bsm" data-mid="'+mid+'" data-from="'+mfrom+'"'
        +' onclick="Modal.close();Pages._mentionReply(+this.dataset.mid,this.dataset.from)">↩ 답장</button>',
    body:'<div class="card" style="padding:14px 18px">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">'
        +'<div class="ir"><div class="il">발신자</div>'
        +'<div class="iv" style="font-weight:700;font-size:13px">'+H.e(m.from||'-')+'</div></div>'
        +'<div class="ir"><div class="il">수신자</div>'
        +'<div class="iv" style="font-size:13px">'+toLabel+'</div></div>'
        +'<div class="ir"><div class="il">부서</div>'
        +'<div class="iv" style="font-size:13px">'+H.e(m.dept||'-')+'</div></div>'
        +'<div class="ir"><div class="il">시간</div>'
        +'<div class="iv" style="color:var(--tm);font-size:13px">'+ts+'</div></div>'
        +(m.ref?'<div class="ir" style="grid-column:1/-1"><div class="il">참조</div>'
               +'<div class="iv"><span class="badge bgry">'+H.e(m.ref)+'</span></div></div>':'')
        +'</div>'
        +'<div style="margin-top:10px;padding:12px;background:var(--bg2);'
        +'border-radius:6px;font-size:13px;line-height:1.7;white-space:pre-wrap">'
        +H.e(m.text||m.message||'')+'</div>'
        +fileHtml
        +replyHtml
        +'</div>',
  });
},

/* [v2.150] 멘션 수정 — 내가 보낸 멘션만 수정 가능 */
async _mentionEdit(id){
  const m=(DB.mentions||[]).find(m=>Number(m.id)===Number(id));
  if(!m){Toast.show('멘션을 찾을 수 없습니다.','err');return;}
  const me=Auth._cur||'admin';
  if(m.from!==me){Toast.show('본인이 보낸 멘션만 수정할 수 있습니다.','warn');return;}
  Modal.open({
    title:'✏️ 멘션 수정',
    size:'mmd',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._mentionEditSave('+Number(id)+')">💾 저장</button>',
    body:'<div class="fgroup" style="padding:12px">'
        +'<label class="fl" style="font-size:13px;font-weight:600;margin-bottom:6px">내용</label>'
        +'<textarea class="fc" id="mentionEditText" rows="5" style="font-size:13px;line-height:1.6">'
        +H.e(m.text||m.message||'')+'</textarea>'
        +'</div>',
  });
},
async _mentionEditSave(id){
  const text=(document.getElementById('mentionEditText')?.value||'').trim();
  if(!text){Toast.show('내용을 입력하세요.','warn');return;}
  const res=await SB.updateMention(id,{text,message:text});
  if(!res?.ok){Toast.show('수정 실패','err');return;}
  const m=(DB.mentions||[]).find(m=>Number(m.id)===Number(id));
  if(m){m.text=text;m.message=text;}
  Toast.show('수정되었습니다.','ok');
  Modal.close();
  Pages._mentionRefresh&&Pages._mentionRefresh();
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
      <button class="btn bout bsm" onclick="Pages._certPrint()">🖨️ 인쇄</button>
      <button class="btn bout bsm" onclick="SearchPop.open('insp_cert')">🔎 Search <span class="kbd">F3</span></button>
    </div>
    <div id="certTbl"></div>`;
  Pages._certRefreshTable();
},

/* [v2.78] 검사 성적서 인쇄
   선택 행 없으면 전체 조회 결과 출력, 있으면 선택 건만 출력 */
_certPrint(){
  /* 선택 체크박스 확인 */
  var checked=[...document.querySelectorAll('#certTbl .rck:checked')].map(function(c){return parseInt(c.value);});
  var rows=checked.length>0
    ? (DB.inspections||[]).filter(function(r){return checked.includes(r.id);})
    : Pages._certFiltered ? Pages._certFiltered() : (DB.inspections||[]);
  if(!rows.length){Toast.show('출력할 성적서가 없습니다.','warn');return;}
  var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>검사 성적서</title><style>'+
    '@page{size:A4 landscape;margin:10mm}'+
    'body{font-family:"맑은 고딕","Apple SD Gothic Neo",sans-serif;font-size:9px;color:#000}'+
    'h2{text-align:center;font-size:14px;margin:0 0 8px}'+
    'table{width:100%;border-collapse:collapse;margin-bottom:12px}'+
    'th{background:#dce6f1;padding:3px 5px;border:1px solid #888;font-size:8px;text-align:center}'+
    'td{padding:3px 5px;border:1px solid #aaa;font-size:8px;vertical-align:top}'+
    '.ok{color:#059669;font-weight:700}.ng{color:#dc2626;font-weight:700}'+
    '@media print{.no-print{display:none}}'+
  '</style></head><body>'+
    '<h2>검사 성적서</h2>'+
    '<table><thead><tr>'+
      '<th>검사번호</th><th>유형</th><th>품목코드</th><th>품목명</th>'+
      '<th>거래처</th><th>검사일</th><th>검사자</th>'+
      '<th>검사수량</th><th>합격수량</th><th>불량수량</th>'+
      '<th>판정</th><th>비고</th>'+
    '</tr></thead><tbody>'+
    rows.map(function(r){
      var cls=r.result==='합격'?'ok':r.result==='불합격'?'ng':'';
      return'<tr>'+
        '<td>'+H.e(r.insp_no||r.no||'-')+'</td>'+
        '<td>'+H.e(r.type||'-')+'</td>'+
        '<td>'+H.e(r.item_code||'-')+'</td>'+
        '<td>'+H.e(r.item||r.item_name||'-')+'</td>'+
        '<td>'+H.e(r.vendor||r.customer||'-')+'</td>'+
        '<td>'+H.e(r.insp_date||r.date||'-')+'</td>'+
        '<td>'+H.e(r.inspector||'-')+'</td>'+
        '<td style="text-align:right">'+H.e(String(r.insp_qty||r.qty||'-'))+'</td>'+
        '<td style="text-align:right">'+H.e(String(r.pass_qty||'-'))+'</td>'+
        '<td style="text-align:right">'+H.e(String(r.fail_qty||r.bad_qty||'-'))+'</td>'+
        '<td class="'+cls+'" style="text-align:center">'+H.e(r.result||'-')+'</td>'+
        '<td>'+H.e(r.note||'-')+'</td>'+
      '</tr>';
    }).join('')+
    '</tbody></table>'+
    '<div style="font-size:10px;color:#64748b;text-align:right">출력일시: '+new Date().toLocaleString('ko-KR')+'</div>'+
  '</body></html>';
  var w=window.open('','_blank','width=1100,height=700');
  if(!w){Toast.show('팝업이 차단됐습니다. 팝업 허용 후 다시 시도하세요.','warn');return;}
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function(){w.print();},400);
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
  /* [v2.128] 메뉴별 접근 권한 — 전역 설정(app_settings)에서 최신값 로드.
     sessionStorage 캐시만 있던 경우(다른 세션/재로그인) 서버값으로 갱신 */
  try{
    const rolePerms=await SB.getRolePerms();
    if(rolePerms) App.perms=rolePerms;
  }catch(e){console.warn('[settings] role_perms 로드 실패',e);}
  const isAdmin=Auth._u?.role==='admin';
  /* [v2.65] 공지사항 최신 로드 — Supabase 영속화
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
    if(tab==='aidash') setTimeout(()=>Pages._renderAiDash(),0);
    if(tab==='codemgmt') Pages._renderCodeMgmt();
  };

  const MENU_GROUPS=[
    {group:'기준정보', pages:[
      {page:'items',     label:'품목 등록'},
      {page:'vendors',   label:'거래처 등록'},
      {page:'users',     label:'사원관리'},
    ]},
    {group:'품질관리', pages:[
      {page:'quality_dash', label:'품질현황 대시보드'},
      {page:'insp_in',   label:'수입검사'},
      {page:'insp_pr',   label:'공정검사'},
      {page:'insp_pu',   label:'구매검사'},
      {page:'insp_ou',   label:'외주검사'},
      {page:'insp_fi',   label:'최종검사'},
      {page:'nc',        label:'부적합 관리'},
      {page:'nc_8d',     label:'8D Report'},
      {page:'nc_dispose',label:'반품/폐기 처리'},
      {page:'nc_trend',  label:'불량 트렌드'},
    ]},
    {group:'검사 고도화', pages:[
      {page:'insp_std',  label:'검사 기준서'},
      {page:'insp_cert', label:'검사 성적서'},
      {page:'lot_trace', label:'LOT 추적성'},
      {page:'insp_hold', label:'Hold 관리'},
      {page:'insp_reinsp',label:'재검사 관리'},
    ]},
    {group:'공급업체 품질', pages:[
      {page:'sqm_plan',    label:'심사계획관리'},
      {page:'sqm_audit',   label:'업체 심사'},
      {page:'sqm_eval',    label:'업체 평가'},
      {page:'sqm_delivery',label:'납품이력'},
      {page:'sqm_dash',    label:'SQM 대시보드'},
    ]},
    {group:'SPC 통계관리', pages:[
      {page:'spc_chart',  label:'관리도'},
      {page:'spc_cpk',    label:'공정능력 (Cp/Cpk)'},
      {page:'spc_pareto', label:'파레토 분석'},
    ]},
    {group:'계측기관리', pages:[
      {page:'equip',          label:'계측기 등록'},
      {page:'cal',            label:'교정 관리'},
      {page:'msa',            label:'MSA 분석'},
      {page:'eq_mgmt',        label:'설비 등록 관리'},
      {page:'eq_pm',          label:'예방정비(PM)'},
      {page:'eq_as',          label:'고장/AS 관리'},
      {page:'eq_cost',        label:'유지보수 비용'},
      {page:'eq_manual',      label:'설비 매뉴얼'},
      {page:'eq_machine_card',label:'마이머신카드'},
      {page:'eq_dashboard',   label:'OEE/KPI 대시보드'},
      {page:'eq_dept',        label:'부서별 보유현황'},
    ]},
    {group:'문서관리', pages:[
      {page:'docs',             label:'문서 목록'},
      {page:'doc_history_home', label:'개정 이력'},
      {page:'doc_search',       label:'지식 검색'},
      {page:'doc_recommend',    label:'연관 문서'},
      {page:'doc_dashboard',    label:'현황 대시보드'},
      {page:'doc_distribution', label:'배포 관리'},
      {page:'doc_review_cycle', label:'검토 주기'},
      {page:'doc_approval',     label:'결재함'},
      {page:'rec',              label:'기록 관리'},
    ]},
    {group:'개선활동', pages:[
      {page:'car',   label:'시정조치 (CAR)'},
      {page:'audit', label:'내부심사'},
    ]},
  ];
  window._menuGroupsRef=MENU_GROUPS; /* [v2.128] _permToggleGroup에서 참조용 */
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
              /* [v2.65 버그수정] E-MAIL td 누락 — 헤더 순서와 불일치로 최근로그인/비번 컬럼 밀림 */
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
        <tbody>${MENU_GROUPS.map((g,gi)=>`
          <tr><td style="background:var(--bg2);font-weight:700;padding:6px 10px;font-size:11px;color:var(--tm)">${g.group}</td>
          ${ROLES.map(r=>r==='admin'
            ?`<td style="background:var(--bg2);text-align:center">-</td>`
            :`<td style="background:var(--bg2);text-align:center">
                <button type="button" class="btn bxs bout" style="font-size:9px;padding:2px 5px"
                  onclick="Pages._permToggleGroup(${gi},'${r}')" title="${g.group} 전체 켜기/끄기">전체</button>
              </td>`).join('')}
          </tr>
          ${g.pages.map(p=>`<tr>
            <td style="padding-left:18px">${p.label}</td>
            ${ROLES.map(r=>`<td style="text-align:center">
              ${r==='admin'
                ?`<span title="관리자는 항상 접근 가능">✅</span>`
                :`<input type="checkbox" class="permChk" data-page="${p.page}" data-role="${r}" ${getPerm(p.page,r)?'checked':''}
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
    <button class="btn stab-btn bout" data-tab="aidash"
      onclick="renderTab('aidash')"
      style="border-radius:8px">🤖 AI 대시보드</button>
    <button class="btn stab-btn ${isAdmin?'':'bout'}" data-tab="codemgmt" onclick="${isAdmin?`renderTab('codemgmt')`:`Toast.show('관리자만 접근 가능합니다.','warn')`}" style="border-radius:8px;${isAdmin?'':'opacity:.5;cursor:not-allowed'}">&#128203; 코드 관리${isAdmin?'':' 🔒'}</button>
  </div>

  <!-- 일반 설정 탭 -->
  <div class="stab-pane" data-tab="general" style="display:block">
    <div class="card" style="margin-bottom:14px">
      <div class="ch" style="padding-bottom:10px">
        <div class="ct">📢 공지사항 관리</div>
        <button class="btn bpri bsm" onclick="Pages._noticeOpen(null)">+ 공지 추가</button>
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
          /* [v2.65] 최신순 정렬: created_at 없으면 date 기준 */
          const sorted=[...notices].sort((a,b)=>{
            const da=a.created_at||a.date||''; const db=b.created_at||b.date||'';
            return db.localeCompare(da);
          });
          if(!sorted.length) return '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--tm)">등록된 공지사항이 없습니다.</td></tr>';
          return sorted.map((n,i)=>{
            const today=H.today();
            /* 게시중 = show:true + 오늘이 date~expire 범위 내 */
            const active=n.show&&(!n.expire||n.expire>=today)&&(!n.date||n.date<=today);
            /* [v2.65] 게시중 행 음영 */
            const rowBg=active?'background:#f0fdf4;':'';
            const expiredCls=n.expire&&n.expire<today?"color:#ef4444":"";
            return '<tr style="'+rowBg+'">'  /* [v2.65] 게시중 행 음영 */
              +'<td><input type="checkbox" class="notice-chk" value="'+(n.id||i)+'"></td>'
              +'<td style="text-align:center;color:var(--tm)">'+(i+1)+'</td>'
              +'<td style="font-weight:600;cursor:pointer" onclick="Pages._noticeOpen('+i+')" style="cursor:pointer;text-decoration:underline">'+H.e(n.title)+'</td>'
              +'<td style="color:var(--tm);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+H.e(n.body)+'</td>'
              +'<td style="font-size:11px">'+(n.date||"-")+'</td>'
              +'<td style="font-size:11px;'+expiredCls+'">'+(n.expire||"-")+'</td>'
              +'<td style="text-align:center"><input type="checkbox" '+(n.show?"checked":"")+' onchange="Pages._noticeToggleById(n)" style="width:15px;height:15px;cursor:pointer"></td>'
              +'<td style="text-align:center">'+(n.file?'<span title="'+H.e(n.file.name||"")+'">📎</span>':'<span style="color:var(--tl)">-</span>')+'</td>'
              +'<td style="text-align:center;white-space:nowrap">'
              +'<button class="btn bxs bgh" onclick="Pages._noticeOpen('+i+')">수정</button> '
              +'<button class="btn bxs berr" onclick="Pages._noticeRemove('+i+')">삭제</button>'
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
      <!-- [v2.107] 관리자 이메일 설정 -->
      <div class="card" style="margin-top:12px;padding:14px 16px">
        <div class="ct" style="font-size:12px">📧 관리자 문의 이메일</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
          <input class="fc" id="sAdminEmail" type="email"
            placeholder="admin@company.com"
            value="${localStorage.getItem('qms_admin_email')||''}"
            style="font-size:12px;padding:5px 8px;flex:1">
          <button class="btn bpri bsm" onclick="Pages._saveAdminEmail()" style="font-size:12px">저장</button>
        </div>
        <div style="font-size:11px;color:var(--tm);margin-top:4px">로그인 화면 '관리자 문의'에 사용되는 이메일입니다.</div>
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
  <div class="stab-pane" data-tab="aidash" style="display:none">
    <div id="aiDashContainer"><div class="es"><div class="es-icon">🤖</div><div>AI 대시보드 탭을 클릭하세요</div></div></div>
  </div>

  <div class="stab-pane" data-tab="sbdash" style="display:none">
    <div id="sbDashContainer">
      <div style="text-align:center;padding:40px;color:var(--tm);font-size:13px">
        🔄 탭 클릭 시 자동으로 로딩됩니다.
      </div>
    </div>
  </div>

  <!-- 코드 관리 탭 [v2.65] -->
  <div class="stab-pane" data-tab="codemgmt" style="display:none">
    <!-- 문서 유형 카드 -->
    <div class="card" style="margin-bottom:14px">
      <div class="ch">
        <div class="ct">&#128203; 문서 유형 관리</div>
        <button class="btn bpri bsm" onclick="Pages._codeAdd('doc_type')">+ 유형 추가</button>
      </div>
      <div class="ts"><table class="dt" style="font-size:12px">
        <thead><tr><th>코드</th><th>명칭</th><th>사용 문서</th><th>관리</th></tr></thead>
        <tbody id="codeTypeBody"></tbody>
      </table></div>
    </div>
    <!-- 문서 분류 카드 [v2.65 D1-3] -->
    <div class="card">
      <div class="ch">
        <div class="ct">&#128194; 문서 분류 관리</div>
        <button class="btn bpri bsm" onclick="Pages._codeAdd('doc_cat')">+ 분류 추가</button>
      </div>
      <div class="ts"><table class="dt" style="font-size:12px">
        <thead><tr><th>코드</th><th>명칭</th><th>사용 문서</th><th>관리</th></tr></thead>
        <tbody id="codeCatBody"></tbody>
      </table></div>
    </div>
  </div>`;

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

/* ════════════════════════════════════════════════════════════
   AI 분석 함수 모음 [v2.168]
   - _renderAiDash(): 설정 > AI 대시보드 렌더
   - _aiNcAnalyze(): 부적합 AI 분석
   - _aiSqmPlan(): SQM 분기 계획 AI 생성
   - _aiSpcAnalyze(): SPC 이상 원인 분석
   - _aiHomeInsight(): 홈 종합 인사이트
   ════════════════════════════════════════════════════════════ */

/* ── AI 대시보드 (설정 탭) ── */
async _renderAiDash(){
  const el=document.getElementById('aiDashContainer');
  if(!el) return;
  const u=GeminiAI.getUsage();
  const logs=u.logs||[];

  /* 오늘 날짜 사용량 집계 */
  const today=new Date().toISOString().slice(0,10);
  const todayLogs=logs.filter(l=>l.time.startsWith(today));
  const todayCalls=todayLogs.length;
  const todayTokens=todayLogs.reduce((s,l)=>s+(l.totalTokens||0),0);

  /* 모드별 집계 */
  const modeMap={};
  logs.forEach(l=>{modeMap[l.mode]=(modeMap[l.mode]||0)+1;});
  const modeLabels={'nc':'부적합 분석','sqm':'SQM 계획','spc':'SPC 분석','home':'종합 인사이트','general':'기타'};

  /* 무료 한도: Groq 일 1,000회, 분 30회 */
  const dailyLimit=1000;
  const pct=Math.min(100,Math.round(todayCalls/dailyLimit*100));

  el.innerHTML=`
  <div class="stat-dash" style="margin-bottom:16px">
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">🤖</div>
      <div><div class="sd-val">${u.totalCalls||0}</div><div class="sd-lbl">총 AI 호출 횟수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#dbeafe;color:#2563eb">📊</div>
      <div><div class="sd-val">${(u.totalTokens||0).toLocaleString()}</div><div class="sd-lbl">총 사용 토큰</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#dcfce7;color:#16a34a">📅</div>
      <div><div class="sd-val">${todayCalls}</div><div class="sd-lbl">오늘 호출 횟수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef9c3;color:#ca8a04">⚡</div>
      <div><div class="sd-val">${todayTokens.toLocaleString()}</div><div class="sd-lbl">오늘 토큰 사용량</div></div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <div class="card">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text)">📈 일일 무료 한도 사용률</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px">
        <span>오늘 ${todayCalls}회 사용</span>
        <span>한도 ${dailyLimit.toLocaleString()}회/일</span>
      </div>
      <div style="background:#e5e7eb;border-radius:999px;height:12px;margin-bottom:8px">
        <div style="background:${pct>=90?'#ef4444':pct>=70?'#f59e0b':'#22c55e'};width:${pct}%;height:100%;border-radius:999px;transition:width .3s"></div>
      </div>
      <div style="font-size:12px;color:${pct>=90?'#ef4444':'var(--muted)'}">
        ${pct>=90?'⚠️ 한도 초과 임박':'✅ 여유 있음'} (${pct}% 사용)
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--muted);padding:8px;background:var(--bg2);border-radius:6px">
        💡 Groq 무료 티어 (llama-3.3-70b)<br>
        · 일 1,000회 / 분당 30회<br>
        · 신용카드 불필요<br>
        · 추가 비용 없음
      </div>
    </div>
    <div class="card">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text)">🏷️ 기능별 사용 현황</div>
      ${Object.keys(modeMap).length===0
        ?'<div class="es" style="padding:20px"><div style="color:var(--muted)">아직 AI를 사용하지 않았습니다.</div></div>'
        :Object.entries(modeMap).sort((a,b)=>b[1]-a[1]).map(([m,cnt])=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px">
            <div style="width:90px;color:var(--text)">${modeLabels[m]||m}</div>
            <div style="flex:1;background:#e5e7eb;border-radius:999px;height:8px">
              <div style="background:#7c3aed;width:${Math.round(cnt/(u.totalCalls||1)*100)}%;height:100%;border-radius:999px"></div>
            </div>
            <div style="width:36px;text-align:right;font-weight:700;color:var(--text)">${cnt}회</div>
          </div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700;color:var(--text)">📋 최근 AI 호출 이력 (최대 100건)</div>
      <button class="btn berr bsm" onclick="if(confirm('사용량 기록을 초기화하시겠습니까?')){GeminiAI.clearUsage();Pages._renderAiDash();}">🗑️ 초기화</button>
    </div>
    ${logs.length===0
      ?'<div class="es" style="padding:24px"><div style="color:var(--muted)">이력 없음</div></div>'
      :`<div style="overflow-x:auto"><table class="dt" style="width:100%;font-size:12px">
        <thead><tr>
          <th style="width:140px">시간</th>
          <th style="width:90px">기능</th>
          <th style="width:70px;text-align:right">입력</th>
          <th style="width:70px;text-align:right">출력</th>
          <th style="width:70px;text-align:right">합계</th>
        </tr></thead>
        <tbody>${logs.slice(0,50).map(l=>`<tr>
          <td style="color:var(--muted)">${l.time.replace('T',' ').slice(0,19)}</td>
          <td><span class="badge" style="background:#ede9fe;color:#7c3aed">${modeLabels[l.mode]||l.mode}</span></td>
          <td style="text-align:right">${(l.promptTokens||0).toLocaleString()}</td>
          <td style="text-align:right">${(l.outputTokens||0).toLocaleString()}</td>
          <td style="text-align:right;font-weight:700">${(l.totalTokens||0).toLocaleString()}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
  </div>`;
},

/* ── 1. 부적합 AI 분석 (NC) ── */
async _aiNcAnalyze(){
  const ncData=await SB.getNc?.() || DB.nc || [];
  if(!ncData.length){Toast.show('부적합 데이터가 없습니다.','warn');return;}
  const prompt=`당신은 QMS(품질경영시스템) 전문가입니다. 아래는 제조업체의 부적합(불량) 발생 데이터입니다.
다음 항목을 한국어로 분석해 주세요:
1. **주요 불량 패턴 요약** (발생 빈도, 유형별 분류)
2. **반복 발생 품목/공정 식별** (동일 항목 2회 이상)
3. **처리 현황** (완료/처리중/접수 비율 및 위험 평가)
4. **이번 달 개선 액션 3가지** (구체적이고 실행 가능한 것)
5. **향후 예방 조치 제안**
분석은 간결하고 실무 중심으로 작성해 주세요.`;
  /* [v2.184] NC 전체 raw data 전달 */
  const summary={
    total:ncData.length,
    byStatus:{},byType:{},
    thisMonth:ncData.filter(r=>(r.date||'').startsWith(new Date().toISOString().slice(0,7))).length,
    records:ncData.slice(0,15).map(r=>({
      no:r.no, type:r.type, item:r.item, date:r.date,
      status:r.status, desc:r.desc, assignee:r.assignee,
      cause:r.cause||'', action:r.action||'', result:r.result||''
    })),
  };
  ncData.forEach(r=>{
    summary.byStatus[r.status||'미정']=(summary.byStatus[r.status||'미정']||0)+1;
    summary.byType[r.type||'기타']=(summary.byType[r.type||'기타']||0)+1;
  });
  const res=await GeminiAI.analyze(prompt, summary, 'nc');
  if(res.ok) GeminiAI.showResult(`부적합 AI 분석 (${ncData.length}건)`, res.result, res.usage);
},

/* ── 2. SQM 분기 계획 AI 생성 ── */
async _aiSqmPlan(){
  const evals=await SB.getVendorEvals?.() || DB.vendor_evals || [];
  const audits=await SB.getVendorAudits?.() || DB.vendor_audits || [];
  const vendors=await SB.getVendors?.() || DB.vendors || [];
  if(!vendors.length){Toast.show('공급사 데이터가 없습니다.','warn');return;}
  const today=new Date();
  const quarter=Math.floor(today.getMonth()/3)+1;
  const year=today.getFullYear();
  const prompt=`당신은 공급사 품질 관리(SQM) 전문가입니다. 아래는 공급사 평가 및 심사 이력 데이터입니다.
현재 날짜: ${year}년 ${quarter}분기
다음을 한국어로 작성해 주세요:
1. **이번 분기(${quarter}Q) 우선 조치 사항** (평가 점수 낮은 공급사 집중 관리)
2. **다음 분기 심사 계획** (점수 기반 우선순위 결정)
3. **위험 공급사 목록** (점수 80점 미만 또는 하락 추세)
4. **개선 권고 사항** (공급사별 구체적 액션)
5. **이번 분기 달성 목표** (측정 가능한 KPI 3가지)`;
  /* [v2.185] 공급사 전체 raw data 전달 */
  const data={
    quarter:`${year}Q${quarter}`, today:today.toISOString().slice(0,10),
    /* 전체 공급사 목록 */
    vendors: vendors.map(v=>({
      name:v.name||v.vendor_name, code:v.code||'',
      type:v.type||'', items:v.items||'', contact:v.contact||'',
      grade:v.grade||'', status:v.status||''
    })),
    /* 전체 평가 이력 */
    allEvals: evals.map(e=>({
      vendor:e.vendor_name, period:e.period, evalDate:e.eval_date||'',
      quality:e.quality, delivery:e.delivery, price:e.price, service:e.service,
      total:e.total, grade:e.grade||'', note:e.note||''
    })),
    /* 전체 심사 이력 */
    allAudits: audits.map(a=>({
      vendor:a.vendor_name, planDate:a.plan_date||'', auditDate:a.audit_date||'',
      type:a.audit_type||a.type||'', result:a.result||a.status||'',
      score:a.score||'', note:a.note||''
    })),
    /* 저점수 공급사 */
    lowScore: evals.filter(e=>(e.total||0)<80).map(e=>({
      vendor:e.vendor_name, total:e.total, period:e.period
    })),
  };
  const res=await GeminiAI.analyze(prompt, data, 'sqm');
  if(res.ok) GeminiAI.showResult(`SQM ${year}Q${quarter} AI 분기 계획`, res.result, res.usage);
},

/* ── 3. SPC 이상 원인 분석 ── */
async _aiSpcAnalyze(itemId){
  const items=window._spcItems||await SB.getSpcItems();
  const item=items.find(it=>it.id===Number(itemId));
  if(!item){Toast.show('관리 항목을 선택하세요.','warn');return;}
  const subs=await SB.getSpcSubgroups(itemId);
  if(subs.length<3){Toast.show('데이터가 부족합니다. (최소 3개 서브그룹 필요)','warn');return;}
  const n=item.subgroup_size||5;
  const C=Pages._spcConst[n]||Pages._spcConst[5];
  const groups=subs.map(s=>{
    let vals=[];
    try{vals=typeof s.values==='string'?JSON.parse(s.values):s.values;}catch(e){}
    return{date:s.measured_at,vals:vals.map(Number).filter(v=>!isNaN(v))};
  }).filter(g=>g.vals.length>0);
  const means=groups.map(g=>g.vals.reduce((s,v)=>s+v,0)/g.vals.length);
  const ranges=groups.map(g=>Math.max(...g.vals)-Math.min(...g.vals));
  const Xbar=means.reduce((s,v)=>s+v,0)/means.length;
  const Rbar=ranges.reduce((s,v)=>s+v,0)/ranges.length;
  const UCLx=Xbar+C.A2*Rbar, LCLx=Xbar-C.A2*Rbar;
  const outOfCtrl=groups.filter((g,i)=>means[i]>UCLx||means[i]<LCLx);
  const prompt=`당신은 SPC(통계적 공정관리) 전문가입니다. 아래 X-bar R 관리도 데이터를 분석해 주세요.
다음을 한국어로 작성해 주세요:
1. **공정 안정성 평가** (관리 한계선 이탈 패턴 분석)
2. **이탈 원인 가설** (연속 이탈/주기적/돌발 패턴 구분)
3. **즉시 조치 사항** (공정 복구를 위한 구체적 액션)
4. **장기 개선 방향** (근본 원인 제거를 위한 계획)`;
  /* [v2.185] SPC 전체 측정 raw data 전달 */
  const data={
    item:{name:item.item_name, process:item.process, char:item.char_name,
          unit:item.unit, itemCode:item.item_code||''},
    spec:{usl:item.spec_upper, lsl:item.spec_lower, target:item.target},
    control:{Xbar:+Xbar.toFixed(4), Rbar:+Rbar.toFixed(4),
             UCLx:+UCLx.toFixed(4), LCLx:+LCLx.toFixed(4)},
    subgroupSize:n, totalGroups:groups.length,
    outOfControlCount:outOfCtrl.length,
    outOfControlDates:outOfCtrl.map(g=>g.date),
    /* 전체 측정 데이터 */
    allGroups:groups.slice(0,30).map((g,i)=>({
      date:g.date,
      mean:+means[i].toFixed(4),
      range:+ranges[i].toFixed(4),
      values:g.vals.map(v=>+v.toFixed(4)),
      outOfControl:means[i]>UCLx||means[i]<LCLx
    })),
  };
  const res=await GeminiAI.analyze(prompt, data, 'spc');
  if(res.ok) GeminiAI.showResult(`SPC AI 분석 — ${item.process} / ${item.char_name}`, res.result, res.usage);
},

/* ── 4. 홈 종합 인사이트 ── */
async _aiHomeInsight(){
  const nc=DB.nc||[];
  const insps=DB.inspections||[];
  const cars=DB.car||[];
  const evals=DB.vendor_evals||[];
  const today=new Date().toISOString().slice(0,10);
  const thisMonth=today.slice(0,7);
  const prompt=`당신은 제조업 QMS 컨설턴트입니다. 아래는 품질경영시스템의 이번 달 현황 데이터입니다.
다음을 한국어로 간결하게 작성해 주세요:
1. **이번 달 품질 현황 요약** (3줄 이내)
2. **즉시 조치 필요 사항** (위험 신호 TOP 3)
3. **이번 주 집중 업무 추천** (실행 가능한 3가지)
4. **다음 달 준비 사항** (사전 예방적 조치)
실무자가 아침에 읽고 바로 행동할 수 있도록 간결하게 작성해 주세요.`;
  /* [v2.185] 홈 인사이트 — 전체 DB 종합 raw data */
  const equip=DB.equip||[];
  const docs=DB.docs||[];
  const r8d=DB.reports||[];
  const thisYear=today.slice(0,4);
  const data={
    today, thisMonth,
    /* 부적합 */
    nc:{
      total:nc.length,
      open:nc.filter(r=>r.status!=='완료').length,
      thisMonth:nc.filter(r=>(r.date||'').startsWith(thisMonth)).length,
      byType:{},byStatus:{},
      recent:nc.slice(0,10).map(r=>({no:r.no,type:r.type,item:r.item,date:r.date,status:r.status,desc:(r.desc||'').slice(0,50)})),
    },
    /* 검사 */
    inspection:{
      total:insps.length,
      fail:insps.filter(r=>r.result==='불합격').length,
      thisMonth:insps.filter(r=>(r.insp_date||'').startsWith(thisMonth)).length,
      failRate:insps.length?Math.round(insps.filter(r=>r.result==='불합격').length/insps.length*100):0,
      recent:insps.filter(r=>r.result==='불합격').slice(0,10).map(r=>({
        no:r.insp_no,type:r.type,item:r.item_name,date:r.insp_date,vendor:r.vendor
      })),
    },
    /* CAR */
    car:{
      total:cars.length,
      open:cars.filter(r=>r.status!=='완료'&&r.status!=='closed').length,
      overdue:cars.filter(r=>r.due_date&&r.due_date<today&&r.status!=='완료').length,
      recent:cars.slice(0,10).map(r=>({no:r.no,title:r.title,status:r.status,dueDate:r.due_date})),
    },
    /* 8D */
    r8d:{total:r8d.length, open:r8d.filter(r=>r.status!=='완료').length},
    /* 공급사 */
    vendorEval:{
      total:evals.length,
      lowScore:evals.filter(r=>(r.total||0)<80).length,
      recent:evals.slice(0,10).map(e=>({vendor:e.vendor_name,total:e.total,period:e.period})),
    },
    /* 계측기 */
    equip:{
      total:equip.length,
      expired:equip.filter(r=>r.status==='교정만료').length,
      soon:equip.filter(r=>r.next_cal&&Math.ceil((new Date(r.next_cal)-new Date())/86400000)<=30&&r.status!=='교정만료').length,
    },
    /* 문서 */
    docs:{total:docs.length, active:docs.filter(r=>r.status==='active').length,
          overdueReview:docs.filter(r=>r.next_review_at&&new Date(r.next_review_at)<new Date()&&r.status==='active').length},
  };
  nc.forEach(r=>{data.nc.byType[r.type||'기타']=(data.nc.byType[r.type||'기타']||0)+1;});
  nc.forEach(r=>{data.nc.byStatus[r.status||'미정']=(data.nc.byStatus[r.status||'미정']||0)+1;});
  const res=await GeminiAI.analyze(prompt, data, 'home');
  if(res.ok) GeminiAI.showResult('품질 현황 AI 종합 인사이트', res.result, res.usage);
},
/* ════ 문서관리 AI 분석 함수 [v2.169] ════
   _aiDocAnalyze(): 문서 목록 AI 현황 분석
   _aiDocReviewPlan(): 정기검토 주기 AI 우선순위 계획
   _aiDocDashAnalyze(): 대시보드 통합 AI 분석
   ════════════════════════════════════════ */

/* ── 문서 목록 AI 현황 분석 ── */
async _aiDocAnalyze(){
  let docs=[];
  try{docs=await SB.getDocMaster();}catch(e){docs=DB.docs||[];}
  if(!docs.length){Toast.show('문서 데이터가 없습니다.','warn');return;}

  const today=new Date().toISOString().slice(0,10);
  /* 상태별 집계 */
  const byStatus={draft:0,in_review:0,active:0,obsolete:0};
  docs.forEach(r=>{if(byStatus[r.status]!==undefined)byStatus[r.status]++;});
  /* 유형별 집계 */
  const byType={};
  docs.forEach(r=>{const t=Pages._DT?.[r.doc_type]||r.doc_type||'기타';byType[t]=(byType[t]||0)+1;});
  /* 검토 임박(30일 이내) */
  const expiring=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    const d=Math.ceil((new Date(r.next_review_at)-new Date())/86400000);
    return d>=0&&d<=30;
  });
  /* 미완료(초안/검토중) */
  const pending=docs.filter(r=>r.status==='draft'||r.status==='in_review');

  const prompt=`당신은 ISO 9001 문서관리 전문가입니다. 아래는 회사의 QMS 문서 현황입니다.
다음을 한국어로 분석해 주세요:
1. **문서 관리 현황 요약** (3줄 이내, 전체적인 건강도 평가)
2. **즉시 조치 필요 문서** (초안/검토중 장기 미완료, 검토 임박 문서)
3. **문서 유형별 불균형 분석** (누락 또는 과잉 문서 유형)
4. **ISO 9001 준수 관점 위험 요소** (심사 시 지적될 수 있는 사항)
5. **이번 달 문서 관리 액션 3가지** (구체적이고 실행 가능한 것)
6. **문서별 상세 검토 의견** (검토 필요 문서 목록의 우선순위와 이유)`;

  const data={
    totalDocs:docs.length,
    byStatus,
    byType,
    expiringCount:expiring.length,
    expiringSoon:expiring.slice(0,10).map(r=>({
      no:r.doc_no, title:r.title, type:r.doc_type,
      nextReview:r.next_review_at
    })),
    pendingCount:pending.length,
    pendingDocs:pending.slice(0,10).map(r=>({
      no:r.doc_no, title:r.title, status:r.status,
      createdAt:(r.created_at||'').slice(0,10)
    })),
    analysisDate:today
  };

  const res=await GeminiAI.analyze(prompt, data, 'doc');
  if(res.ok) GeminiAI.showResult(`문서 AI 현황 분석 (총 ${docs.length}건)`, res.result, res.usage);
},

/* ── 정기검토 주기 AI 계획 수립 ── */
async _aiDocReviewPlan(){
  let docs=[];
  try{docs=await SB.getDocMaster();}catch(e){docs=DB.docs||[];}
  const today=new Date();

  /* 검토 필요 문서 분류 */
  const overdue=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    return new Date(r.next_review_at)<today;
  });
  const within30=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    const d=Math.ceil((new Date(r.next_review_at)-today)/86400000);
    return d>=0&&d<=30;
  });
  const within90=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    const d=Math.ceil((new Date(r.next_review_at)-today)/86400000);
    return d>30&&d<=90;
  });

  if(!overdue.length&&!within30.length&&!within90.length){
    Toast.show('검토 예정 문서가 없습니다. 모든 문서가 최신 상태입니다.','ok');
    return;
  }

  const prompt=`당신은 ISO 9001 문서 검토 관리 전문가입니다. 아래는 문서 정기 검토 현황입니다.
다음을 한국어로 작성해 주세요:
1. **지금 당장 검토해야 할 문서** (기한 초과 문서 우선순위 결정)
2. **이번 달 검토 일정** (D-30 이내 문서 주별 검토 계획)
3. **다음 분기 검토 일정** (D-90 이내 문서 월별 계획)
4. **검토 효율화 방안** (유사 문서 묶음 검토, 담당자 배분 등)
5. **미검토 시 리스크** (ISO 심사, 현장 적용 오류 등)
간결하고 실행 가능한 계획으로 작성해 주세요.`;

  const data={
    today:today.toISOString().slice(0,10),
    overdue:overdue.slice(0,15).map(r=>({
      no:r.doc_no, title:r.title, type:r.doc_type,
      nextReview:r.next_review_at,
      daysOverdue:Math.ceil((today-new Date(r.next_review_at))/86400000)
    })),
    within30Days:within30.slice(0,15).map(r=>({
      no:r.doc_no, title:r.title, type:r.doc_type,
      nextReview:r.next_review_at,
      daysLeft:Math.ceil((new Date(r.next_review_at)-today)/86400000)
    })),
    within90Days:within90.slice(0,15).map(r=>({
      no:r.doc_no, title:r.title, type:r.doc_type,
      nextReview:r.next_review_at,
      daysLeft:Math.ceil((new Date(r.next_review_at)-today)/86400000)
    })),
    summary:{overdueCount:overdue.length, within30Count:within30.length, within90Count:within90.length}
  };

  const res=await GeminiAI.analyze(prompt, data, 'doc');
  if(res.ok) GeminiAI.showResult(
    `문서 검토 AI 계획 (초과 ${overdue.length}건 · D-30 ${within30.length}건)`,
    res.result, res.usage
  );
},

/* ── 문서 대시보드 AI 통합 분석 ── */
async _aiDocDashAnalyze(){
  let docs=[];
  try{docs=await SB.getDocMaster();}catch(e){docs=DB.docs||[];}
  if(!docs.length){Toast.show('문서 데이터가 없습니다.','warn');return;}

  const today=new Date();
  const thisMonth=today.toISOString().slice(0,7);
  const byStatus={draft:0,in_review:0,active:0,obsolete:0};
  docs.forEach(r=>{if(byStatus[r.status]!==undefined)byStatus[r.status]++;});
  const byType={};
  docs.forEach(r=>{const t=Pages._DT?.[r.doc_type]||r.doc_type||'기타';byType[t]=(byType[t]||0)+1;});
  const overdueCount=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    return new Date(r.next_review_at)<today;
  }).length;
  const newThisMonth=docs.filter(r=>(r.created_at||'').startsWith(thisMonth)).length;

  const prompt=`당신은 ISO 9001 품질 컨설턴트입니다. 아래 QMS 문서 대시보드 데이터를 분석하고
경영자/품질팀장에게 보고할 수 있는 종합 인사이트를 작성해 주세요.
다음 항목을 한국어로 작성해 주세요:
1. **문서 관리 종합 평가** (A/B/C/D 등급 및 근거)
2. **핵심 성과 지표(KPI) 분석** (목표 대비 현황)
3. **리스크 TOP 3** (즉시 조치 필요 사항)
4. **개선 기회** (효율화, 디지털화, 통합 등)
5. **다음 달 목표** (측정 가능한 3가지 목표)
경영자가 읽기 쉽고 행동 가능한 인사이트로 작성해 주세요.`;

  /* [v2.185] 문서 전체 raw data 전달 */
  const overdueDocs=docs.filter(r=>{
    if(!r.next_review_at||r.status!=='active') return false;
    return new Date(r.next_review_at)<today;
  });
  const data={
    analysisDate:today.toISOString().slice(0,10),
    totalDocs:docs.length, byStatus, byType,
    overdueReviewCount:overdueCount, newThisMonth,
    activeRate:docs.length>0?Math.round(byStatus.active/docs.length*100):0,
    /* 전체 문서 목록 */
    allDocs:docs.slice(0,15).map(r=>({
      no:r.doc_no||'', title:r.title||'', type:r.doc_type||'',
      status:r.status||'', version:r.version||'',
      owner:r.owner||r.author||'', dept:r.dept||'',
      createdAt:(r.created_at||'').slice(0,10),
      nextReview:r.next_review_at||'', reviewCycle:r.review_cycle||''
    })),
    /* 검토 기한 초과 문서 */
    overdueDocs:overdueDocs.slice(0,20).map(r=>({
      no:r.doc_no, title:r.title, nextReview:r.next_review_at,
      overdueDays:Math.ceil((today-new Date(r.next_review_at))/86400000)
    })),
  };

  const res=await GeminiAI.analyze(prompt, data, 'doc');
  if(res.ok) GeminiAI.showResult('문서 현황 AI 종합 분석', res.result, res.usage);
},
/* ════ 추가 AI 분석 함수 [v2.174] ════
   _aiCarAnalyze: 개선활동(CAR) 분석
   _aiQualityDash: 품질현황 대시보드 분석
   _aiEquipAnalyze: 계측기 교정 현황 분석
   _aiCalAnalyze: 교정 이력 분석
   _aiMsaAnalyze: MSA 측정 시스템 분석
   ════════════════════════════════════ */

async _ai8dAnalyze(){
  /* [v2.175] 8D Report AI 분석
     - 전체 8D 현황 요약 (완료율, 진행 단계 분포)
     - 미완성 8D의 막힌 단계 분석
     - D4(근본원인)/D5(영구대책) 품질 평가
     - 반복 발생 불량 패턴 식별
     - 완료 촉진 액션 플랜 */
  const data8d = DB.reports || DB.nc_8d || [];
  if(!data8d.length){Toast.show('8D Report 데이터가 없습니다.','warn');return;}

  const today = new Date().toISOString().slice(0,10);
  const open  = data8d.filter(r=>r.status!=='완료'&&r.status!=='종결'&&r.status!=='D8-팀인정');
  const closed= data8d.filter(r=>r.status==='완료'||r.status==='종결'||r.status==='D8-팀인정');

  /* D 단계별 진행 현황 집계 */
  const byStage={};
  data8d.forEach(r=>{ byStage[r.status||'미정']=(byStage[r.status||'미정']||0)+1; });

  /* 미완성 8D에서 막힌 단계 분석 */
  const stuckAt={};
  open.forEach(r=>{
    /* D1~D8 중 마지막으로 내용 있는 단계 찾기 */
    let lastFilled='D1';
    for(let n=1;n<=8;n++){
      if(r[`d${n}`]&&r[`d${n}`].trim()) lastFilled=`D${n}`;
    }
    stuckAt[lastFilled]=(stuckAt[lastFilled]||0)+1;
  });

  const prompt=`당신은 8D 문제 해결 방법론 전문가입니다. 아래는 8D Report 현황 데이터입니다.
다음을 한국어로 분석해 주세요:
1. **8D 현황 요약** (완료율, 평균 소요 기간 추정, 단계별 분포)
2. **정체 단계 분석** (가장 많이 막히는 D 단계와 원인)
3. **D4/D5 품질 평가** (근본원인 및 영구대책의 충실도 평가)
4. **반복 발생 패턴** (유사 제목/원인의 반복 여부)
5. **완료 촉진 액션 플랜** (단계별 구체적 지원 방안)
6. **이번 달 완료 목표** (실행 가능한 3건 선정 근거)
8D 방법론(AIAG/Ford 기준) 관점에서 실무적으로 분석해 주세요.
각 진행 중인 8D의 D4(근본원인)와 D5(영구대책)가 부실하면 구체적인 개선 방향도 제시해 주세요.`;

  const payload={
    total: data8d.length,
    completionRate: Math.round(closed.length/data8d.length*100)+'%',
    byStage,
    stuckAt,
    openCount: open.length,
    closedCount: closed.length,
    /* 진행 중 8D 상세 (최근 15건) */
    openDetails: open.slice(0,15).map(r=>({
      no:    r.no,
      title: r.title,
      ncRef: r.nc_ref,
      owner: r.owner,
      stage: r.status,
      d1:    (r.d1||'').slice(0,50)||'미입력',
      d2:    (r.d2||'').slice(0,50)||'미입력',
      d3:    (r.d3||'').slice(0,50)||'미입력',
      d4:    (r.d4||'').slice(0,80)||'미입력',  /* 근본원인 — 중요 */
      d5:    (r.d5||'').slice(0,80)||'미입력',  /* 영구대책 — 중요 */
      d6:    (r.d6||'').slice(0,50)||'미입력',
      d7:    (r.d7||'').slice(0,50)||'미입력',
      d8:    (r.d8||'').slice(0,50)||'미입력',
      startDate: r.d1_date,
    })),
    /* 완료 8D 요약 (최근 5건) */
    recentClosed: closed.slice(0,5).map(r=>({
      no:r.no, title:r.title, d4:(r.d4||'').slice(0,60), d5:(r.d5||'').slice(0,60)
    })),
  };

  const res=await GeminiAI.analyze(prompt, payload, '8d');
  if(res.ok) GeminiAI.showResult(
    `8D Report AI 분석 (총 ${data8d.length}건 · 진행 ${open.length}건 · 완료 ${closed.length}건)`,
    res.result, res.usage
  );
},

async _aiCarAnalyze(){
  const cars=await SB.getCars?.() || DB.car || DB.cars || [];
  if(!cars.length){Toast.show('CAR 데이터가 없습니다.','warn');return;}
  const today=new Date().toISOString().slice(0,10);
  const open=cars.filter(r=>r.status!=='완료'&&r.status!=='closed');
  const overdue=open.filter(r=>r.due_date&&r.due_date<today);
  const prompt=`당신은 ISO 9001 시정조치 전문가입니다. 아래는 CAR(시정조치요구서) 현황입니다.
다음을 한국어로 분석해 주세요:
1. **전체 CAR 현황 요약** (완료율, 지연율, 주요 발생 원인)
2. **즉시 조치 필요 건** (기한 초과 CAR 우선순위)
3. **반복 발생 패턴** (동일 원인 2회 이상 반복)
4. **근본 원인 분석** (8D/5Why 관점)
5. **이번 달 완료 목표** (실행 가능한 계획)`;
  /* [v2.185] CAR 전체 raw data 전달 */
  const data={
    total:cars.length, today,
    openCount:open.length, overdueCount:overdue.length,
    byStatus:{},
    /* 전체 CAR 목록 */
    allCars:cars.slice(0,15).map(r=>({
      no:r.no, title:r.title||r.item||'', src:r.src||'',
      status:r.status||'', dueDate:r.due_date||r.dueDate||'',
      assignee:r.assignee||r.responsible||'',
      openDate:r.open||r.open_date||'',
      cause:r.cause||'', action:r.action||'', result:r.result||'',
      ncRef:r.nc_id||r.nc_no||''
    })),
    /* 기한초과 CAR */
    overdueCars:overdue.map(r=>({
      no:r.no, title:r.title||r.item, dueDate:r.due_date,
      overdueDays:r.due_date?Math.ceil((new Date()-new Date(r.due_date))/86400000):0,
      assignee:r.assignee||r.responsible
    })),
  };
  cars.forEach(r=>{data.byStatus[r.status||'미정']=(data.byStatus[r.status||'미정']||0)+1;});
  const res=await GeminiAI.analyze(prompt, data, 'car');
  if(res.ok) GeminiAI.showResult(`CAR 개선활동 AI 분석 (총 ${cars.length}건)`, res.result, res.usage);
},

async _aiQualityDash(){
  const insps=DB.inspections||[];
  const nc=DB.nc||[];
  const cars=DB.car||DB.cars||[];
  const today=new Date();
  const thisMonth=today.toISOString().slice(0,7);
  const failInsps=insps.filter(r=>r.result==='불합격');
  const failRate=insps.length>0?Math.round(failInsps.length/insps.length*100):0;
  const prompt=`당신은 제조업 품질 컨설턴트입니다. 아래는 품질현황 대시보드 데이터입니다.
경영진에게 보고할 수 있는 품질 현황 보고서를 작성해 주세요:
1. **이번 달 품질 KPI 요약** (불합격률, 부적합 건수, CAR 완료율)
2. **품질 트렌드 분석** (개선/악화 여부)
3. **핵심 위험 요소** TOP 3
4. **즉시 대응 필요 사항**
5. **다음 달 품질 목표** (수치 포함)`;
  /* [v2.185] 품질현황 전체 raw data 전달 */
  const data={
    today:today.toISOString().slice(0,10), thisMonth,
    /* 검사 전체 */
    inspection:{
      total:insps.length, fail:failInsps.length, failRate:failRate+'%',
      thisMonth:insps.filter(r=>(r.insp_date||'').startsWith(thisMonth)).length,
      byType:{}, byResult:{},
      recentFails:failInsps.slice(0,10).map(r=>({
        no:r.insp_no||'', type:r.type||'', vendor:r.vendor||'',
        item:r.item_name||'', date:r.insp_date||'',
        failQty:r.fail_qty||0, note:r.note||''
      })),
    },
    /* NC 전체 */
    nc:{
      total:nc.length, open:nc.filter(r=>r.status!=='완료').length,
      thisMonth:nc.filter(r=>(r.date||'').startsWith(thisMonth)).length,
      byType:{},
      recent:nc.slice(0,10).map(r=>({no:r.no,type:r.type,item:r.item,date:r.date,status:r.status,desc:(r.desc||'').slice(0,50)})),
    },
    /* CAR 전체 */
    car:{
      total:cars.length, open:cars.filter(r=>r.status!=='완료'&&r.status!=='closed').length,
      overdue:cars.filter(r=>r.due_date&&r.due_date<today.toISOString().slice(0,10)&&r.status!=='완료').length,
      recent:cars.slice(0,10).map(r=>({no:r.no,title:r.title||r.item,status:r.status,dueDate:r.due_date})),
    },
  };
  insps.forEach(r=>{data.inspection.byType[r.type||'기타']=(data.inspection.byType[r.type||'기타']||0)+1;});
  insps.forEach(r=>{data.inspection.byResult[r.result||'미정']=(data.inspection.byResult[r.result||'미정']||0)+1;});
  nc.forEach(r=>{data.nc.byType[r.type||'기타']=(data.nc.byType[r.type||'기타']||0)+1;});
  const res=await GeminiAI.analyze(prompt, data, 'quality');
  if(res.ok) GeminiAI.showResult('품질현황 AI 종합 분석', res.result, res.usage);
},

async _aiEquipAnalyze(){
  const equip=DB.equip||[];
  if(!equip.length){Toast.show('계측기 데이터가 없습니다.','warn');return;}
  const today=new Date().toISOString().slice(0,10);
  const expired=equip.filter(r=>r.status==='교정만료'||(r.next_cal&&r.next_cal<today));
  const soon=equip.filter(r=>r.next_cal&&r.next_cal>=today&&Math.ceil((new Date(r.next_cal)-new Date())/86400000)<=30);
  const prompt=`당신은 계측기 관리 전문가입니다. 아래는 계측기 교정 현황 데이터입니다.
다음을 한국어로 분석해 주세요:
1. **교정 현황 요약** (만료/정상/임박 비율)
2. **즉시 교정 필요 계측기** (만료된 계측기 목록 및 위험도)
3. **30일 이내 교정 예정** (일정 계획 수립)
4. **교정 주기 최적화 제안** (사용 빈도 및 중요도 기준)
5. **ISO 9001 MSA 관점 위험 요소**`;
  /* [v2.184] 전체 raw data 전달 — 실제 계측기명/교정이력 포함 */
  const data={
    total:equip.length,
    today,
    expiredCount:expired.length,
    soonCount:soon.length,
    /* 전체 계측기 목록 (최대 50건) */
    allEquip:equip.slice(0,15).map(r=>({
      no:r.no, name:r.name||r.equip_name||'', code:r.equip_code||r.code||'',
      type:r.equip_type||r.type||'', maker:r.maker||'', range:r.range||'',
      lastCal:r.last_cal||'', nextCal:r.next_cal||'',
      calCycle:r.cal_cycle||r.cycle||'', status:r.status||'정상',
      location:r.location||r.loc||'', operator:r.operator||''
    })),
    /* 만료/임박 상세 */
    expiredList:expired.map(r=>({
      name:r.name||r.equip_name, code:r.equip_code||r.code,
      nextCal:r.next_cal, lastCal:r.last_cal,
      overdueDays:r.next_cal?Math.ceil((new Date()-new Date(r.next_cal))/86400000):0
    })),
    soonList:soon.map(r=>({
      name:r.name||r.equip_name, code:r.equip_code||r.code,
      nextCal:r.next_cal,
      daysLeft:Math.ceil((new Date(r.next_cal)-new Date())/86400000)
    })),
  };
  const res=await GeminiAI.analyze(prompt, data, 'equip');
  if(res.ok) GeminiAI.showResult(`계측기 교정 AI 분석 (총 ${equip.length}개)`, res.result, res.usage);
},

async _aiCalAnalyze(){
  const cals=DB.calibrations||DB.cal||[];
  if(!cals.length){Toast.show('교정 데이터가 없습니다.','warn');return;}
  const today=new Date().toISOString().slice(0,10);
  const thisYear=today.slice(0,4);
  const prompt=`당신은 계측기 교정 관리 전문가입니다. 아래는 교정 이력 데이터입니다.
다음을 한국어로 분석해 주세요:
1. **교정 이력 현황 요약** (연간 교정 건수, 합격/불합격률)
2. **불합격 계측기 패턴** (반복 불합격 계측기 식별)
3. **교정 비용 최적화** (외부교정 vs 자체교정 권고)
4. **교정 주기 준수율** (예정일 대비 실제 교정일 분석)
5. **내년도 교정 계획** (우선순위 기반)`;
  /* [v2.184] 교정 전체 raw data 전달 */
  const data={
    total:cals.length,
    thisYear:cals.filter(r=>(r.cal_date||r.date||'').startsWith(thisYear)).length,
    byResult:{},
    allCals:cals.slice(0,15).map(r=>({
      no:r.no||'', name:r.name||r.equip_name||'', code:r.equip_code||r.code||'',
      calDate:r.cal_date||r.date||'', nextCal:r.next_cal||'',
      result:r.result||'', calType:r.cal_type||r.type||'',
      agency:r.agency||r.cal_agency||'', cost:r.cost||'',
      inspector:r.inspector||'', note:r.note||''
    })),
  };
  cals.forEach(r=>{const rs=r.result||'미정';data.byResult[rs]=(data.byResult[rs]||0)+1;});
  const res=await GeminiAI.analyze(prompt, data, 'cal');
  if(res.ok) GeminiAI.showResult(`교정 이력 AI 분석 (총 ${cals.length}건)`, res.result, res.usage);
},

async _aiMsaAnalyze(){
  const msa=DB.msa||[];
  if(!msa.length){Toast.show('MSA 연구 데이터가 없습니다.','warn');return;}
  const prompt=`당신은 MSA(측정 시스템 분석) 전문가입니다. 아래는 R&R 연구 데이터입니다.
다음을 한국어로 분석해 주세요:
1. **측정 시스템 전반 평가** (%GR&R 기준: <10% 우수, 10-30% 수용, >30% 불량)
2. **개선 필요 측정 시스템** (%GR&R 30% 초과 계측기)
3. **측정 변동 원인 분석** (계측기 변동 vs 측정자 변동)
4. **측정 능력 개선 방안** (재교육, 계측기 교체, 측정 방법 개선)
5. **AIAG MSA 4th Edition 기준 적합성 평가**`;
  /* [v2.185] MSA 전체 raw data 전달 */
  const data={
    total:msa.length,
    /* 전체 MSA 연구 목록 */
    allStudies:msa.slice(0,10).map(r=>({
      name:r.name||'', equipCode:r.equip_code||'', equipName:r.equip_name||'',
      studyDate:r.study_date||r.date||'', studyType:r.study_type||r.type||'',
      parts:r.parts||0, appraisers:r.appraisers||0, trials:r.trials||0,
      grr:r.grr_pct||r.grr||0, ev:r.ev||0, av:r.av||0,
      tolerance:r.tolerance||0, ndcCount:r.ndc||0,
      ptRatio:r.pt_ratio||0, result:r.result||''
    })),
    /* 불량(%GR&R>30%) 시스템 */
    poorSystems:msa.filter(r=>(r.grr_pct||r.grr||0)>30).map(r=>({
      name:r.name, equip:r.equip_name||r.equip_code,
      grr:r.grr_pct||r.grr
    })),
    /* 수용(%GR&R 10~30%) */
    marginalSystems:msa.filter(r=>{const g=r.grr_pct||r.grr||0;return g>=10&&g<=30;}).length,
  };
  const res=await GeminiAI.analyze(prompt, data, 'msa');
  if(res.ok) GeminiAI.showResult(`MSA 측정 시스템 AI 분석 (총 ${msa.length}건)`, res.result, res.usage);
},



async _renderSbDash(){
  /* [v2.394] SB 대시보드 — 5개 KPI 도넛차트 복구
     Database / Storage / Egress / 전체행 / 비활성방지 */
  const _pw=document.getElementById('sbDashContainer');
  if(!_pw) return;
  _pw.innerHTML='<div class="spin"></div>';

  /* ── 테이블 행 수 조회 ── */
  /* [v2.65] 테이블명 수정: documents → doc_master (v2.395 이후 변경됨) */
  /* [v2.78] 전체 테이블 목록 — 누락 테이블 추가 */
  /* [v2.79] 테이블 트리 구조 */
  const treeGroups=[
    {group:'기준정보',     items:[{t:'items',l:'품목 등록'},{t:'vendors',l:'거래처 등록'},{t:'users',l:'사원관리'}]},
    {group:'품질관리',     items:[{t:'inspections',l:'검사이력'},{t:'nonconformances',l:'부적합관리'},{t:'insp_std',l:'검사기준서'}]},
    {group:'검사고도화',   items:[{t:'holds',l:'Hold관리'},{t:'reinspections',l:'재검사관리'}]},
    {group:'공급업체 품질',items:[{t:'vendor_evals',l:'업체평가'},{t:'vendor_audits',l:'업체심사'}]},
    {group:'계측기관리',   items:[{t:'equipment',l:'계측기 등록'},{t:'calibrations',l:'교정이력'}]},
    {group:'문서관리',     items:[{t:'doc_master',l:'문서 마스터'},{t:'doc_versions',l:'문서 버전'},{t:'doc_approvals',l:'결재 이력'},{t:'doc_dist_log',l:'배포 이력'}]},
    {group:'제조설비',     items:[{t:'ems_equipment',l:'설비 등록'},{t:'eq_pm_log',l:'PM 점검'},{t:'eq_as',l:'AS 이력'},{t:'eq_cost',l:'유지비용'},{t:'eq_manual',l:'설비매뉴얼'}]},
    {group:'시스템',       items:[{t:'qna',l:'Q&A'},{t:'qna_replies',l:'Q&A 답변'},{t:'notices',l:'공지사항'},{t:'mentions',l:'멘션'},{t:'code_types',l:'코드관리'}]},
  ];
  const tables=treeGroups.flatMap(g=>g.items.map(i=>i.t));
  const LABELS=Object.fromEntries(treeGroups.flatMap(g=>g.items.map(i=>[i.t,i.l])));
  const COLORS=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#0ea5e9','#d946ef','#14b8a6','#a855f7','#eab308','#64748b','#78716c','#dc2626','#2563eb','#16a34a','#9333ea','#c026d3','#0891b2','#b45309','#4f46e5','#db2777','#047857','#6366f1','#92400e'];

  let counts={};
  const errors={};
  if(_sb){
    await Promise.all(tables.map(async t=>{
      try{
        const{count,error}=await _sb.from(t).select('*',{count:'exact',head:true});
        if(error){counts[t]=0;errors[t]=error.message;}
        else{counts[t]=count||0;errors[t]=null;}
      }catch(e){counts[t]=0;errors[t]=e.message;}
    }));
  } else {
    tables.forEach(t=>counts[t]=0);
  }
  const totalRows=Object.values(counts).reduce((a,b)=>a+b,0);
  const connected=!!_sb;

  /* ── Storage 실제 조회 (docs 버킷 파일 크기 합산) ── */
  let storageMB=0;
  if(_sb){
    try{
      const {data:files}=await _sb.storage.from('docs').list('',{limit:1000});
      if(files) storageMB=Math.round(files.reduce((s,f)=>s+(f.metadata?.size||0),0)/1024/1024*10)/10;
    }catch(e){}
    /* equip 버킷도 합산 */
    try{
      const {data:f2}=await _sb.storage.from('equip').list('',{limit:1000});
      if(f2) storageMB+=Math.round(f2.reduce((s,f)=>s+(f.metadata?.size||0),0)/1024/1024*10)/10;
    }catch(e){}
    try{
      const {data:f3}=await _sb.storage.from('nc').list('',{limit:1000});
      if(f3) storageMB+=Math.round(f3.reduce((s,f)=>s+(f.metadata?.size||0),0)/1024/1024*10)/10;
    }catch(e){}
  }

  /* ── KPI 값 정의 (SB 무료플랜 기준) ── */
  /* [v2.82] C안: 행수 기반 추정값 */
  /* [v2.174] DB크기/Egress — localStorage 저장값 사용 (Supabase 대시보드 실제값 입력)
     초기값: Supabase 대시보드 Usage 화면의 실제 값 사용
     사용자가 설정에서 직접 입력하거나 자동 갱신 버튼으로 업데이트 */
  const sbUsage=JSON.parse(localStorage.getItem('qms_sb_usage')||'{}');
  const dbSizeMB  = sbUsage.dbSizeMB   || Math.round(totalRows * 0.7 / 1024 * 10)/10;
  const egressMB  = sbUsage.egressMB   || 0;
  /* storageMB는 실제 조회값 우선, 없으면 저장값 사용 */
  if(!storageMB && sbUsage.storageMB) storageMB = sbUsage.storageMB;
  const kpiList=[
    {/* [v2.174] KPI — Supabase 실제값 기반으로 재설계
       Database: 실제 DB 크기(MB), 한도 500MB (Free Plan)
       Storage: 실제 파일 스토리지(MB), 한도 1,024MB
       Egress: 실제 아웃바운드(MB), 한도 5,120MB/월
       ※ 실제 DB 크기는 Supabase REST API로 조회 불가 → 직접 입력 방식 안내
       사진 기준: DB=0.044GB=44MB, Storage=0.102GB=104MB, Egress=0.603GB=617MB */
    label:'Database',   icon:'🗄️',
     used:dbSizeMB, max:500, unit:'MB',
     color:dbSizeMB>400?'#ef4444':dbSizeMB>300?'#f59e0b':'#3b82f6',
     bg:dbSizeMB>400?'#fef2f2':'#eff6ff',
     desc:'DB 크기 '+dbSizeMB+'MB / 무료 500MB'},
    {label:'Storage',    icon:'💾',
     used:storageMB, max:1024, unit:'MB',
     color:storageMB>900?'#ef4444':storageMB>700?'#f59e0b':'#10b981', bg:'#f0fdf4',
     desc:'파일 스토리지 '+storageMB+'MB / 무료 1,024MB'},
    {label:'Egress',     icon:'📡',
     used:egressMB, max:5120, unit:'MB',
     color:egressMB>4500?'#ef4444':egressMB>3000?'#f59e0b':'#f59e0b', bg:'#fef3c7',
     desc:'월 아웃바운드 '+egressMB+'MB / 무료 5,120MB',
     link:'https://supabase.com/dashboard/project/phxlsnghgvowrxdlcsph/reports'},
    {label:'DB 행 수',   icon:'📋',
     used:totalRows, max:50000, unit:'행',
     color:totalRows>45000?'#ef4444':totalRows>30000?'#f59e0b':'#8b5cf6', bg:'#f5f3ff',
     desc:'전체 '+totalRows.toLocaleString()+'행 / 참고용'},
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

  /* [v2.174] 실제값 직접 입력 패널 — Supabase 대시보드 Usage 화면 값 입력 */
  const _su=JSON.parse(localStorage.getItem('qms_sb_usage')||'{}');
  h+='<div class="card" style="margin-bottom:14px;padding:14px 16px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h+='<div style="font-size:13px;font-weight:700;color:var(--text)">📊 실제 사용량 입력</div>';
  h+='<a href="https://supabase.com/dashboard/project/phxlsnghgvowrxdlcsph/settings/billing" target="_blank" style="font-size:11px;color:#3b82f6">Supabase 대시보드 →</a>';
  h+='</div>';
  h+='<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Supabase → Settings → Usage 화면의 실제 값을 MB 단위로 입력하세요. (예: 0.044 GB = 44 MB)</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
  h+='<div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">🗄️ Database (MB)</label>';
  h+='<input id="sbInputDb" type="number" step="0.1" class="fc" style="font-size:12px" placeholder="예) 44" value="'+(_su.dbSizeMB||'')+'"></div>';
  h+='<div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">💾 Storage (MB)</label>';
  h+='<input id="sbInputSt" type="number" step="0.1" class="fc" style="font-size:12px" placeholder="예) 104" value="'+(_su.storageMB||'')+'"></div>';
  h+='<div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">📡 Egress (MB)</label>';
  h+='<input id="sbInputEg" type="number" step="0.1" class="fc" style="font-size:12px" placeholder="예) 617" value="'+(_su.egressMB||'')+'"></div>';
  h+='</div>';
  h+='<div style="margin-top:8px;display:flex;gap:6px">';
  h+='<button class="btn bpri bsm" onclick="(function(){';
  h+='const d=parseFloat(document.getElementById(\'sbInputDb\')?.value)||0;';
  h+='const s=parseFloat(document.getElementById(\'sbInputSt\')?.value)||0;';
  h+='const e=parseFloat(document.getElementById(\'sbInputEg\')?.value)||0;';
  h+='localStorage.setItem(\'qms_sb_usage\',JSON.stringify({dbSizeMB:d,storageMB:s,egressMB:e}));';
  h+='Toast.show(\'사용량이 저장됐습니다. 새로고침합니다.\',\'ok\');';
  h+='setTimeout(()=>Pages._renderSbDash(),500);})()">💾 저장 및 갱신</button>';
  h+='<button class="btn bout bsm" onclick="localStorage.removeItem(\'qms_sb_usage\');Pages._renderSbDash()">🔄 초기화</button>';
  h+='</div>';
  h+='</div>';

  /* 5개 KPI 도넛 카드 */
  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px">';
  kpiList.forEach((k,i)=>{
    const rawPct=k.max>0?Math.round((k.used/k.max)*100):0;
    const pct=Math.min(100,rawPct);
    const overPct=rawPct>100;
    h+='<div class="card" style="padding:12px 10px;text-align:center;background:'+k.bg+'">';
    h+='<div style="font-size:11px;font-weight:700;color:'+k.color+';margin-bottom:6px">'+k.label+'</div>';
    h+='<div style="position:relative;height:80px;margin:0 auto 6px">';
    h+='<canvas id="'+canvasIds[i]+'" style="max-width:80px;max-height:80px"></canvas>';
    h+='<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:13px;font-weight:700;color:'+k.color+'">'+(rawPct>100?'⚠️ '+rawPct+'%':pct+'%')+'</div>';
    h+='</div>';
    h+='<div style="font-size:10px;color:#64748b">'+k.icon+' '+k.used.toLocaleString()+k.unit+'</div>';
    h+='<div style="font-size:9px;color:#94a3b8;margin-top:2px">'+(k.link?'<a href="'+k.link+'" target="_blank" style="color:inherit;text-decoration:underline">'+k.desc+'</a>':k.desc)+'</div>';
    h+='</div>';
  });
  h+='</div>';

  /* 테이블 현황 */
  h+='<div class="card" style="margin-bottom:14px">';
  h+='<div class="ch"><div class="ct">📋 테이블별 데이터 현황</div>';
  h+='<span style="font-size:11px;color:var(--tm)">총 '+totalRows.toLocaleString()+'행</span></div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  h+='<thead><tr style="background:var(--bg2)">';
  h+='<th style="padding:6px 10px;text-align:left">테이블 (모듈)</th>';
  h+='<th style="padding:6px 10px;text-align:right">행 수</th>';
  h+='<th style="padding:6px 10px;min-width:80px">비율</th>';
  h+='<th style="padding:6px 10px;text-align:center">권한(RLS)</th>';
  h+='</tr></thead><tbody>';
  /* [v2.80] 트리 구조 렌더 */
  let colorIdx=0;
  treeGroups.forEach(g=>{
    h+='<tr style="background:var(--bg2)"><td colspan="4" style="padding:6px 10px;font-size:12px;font-weight:700;color:var(--pri)">📁 '+H.e(g.group)+'</td></tr>';
    g.items.forEach(item=>{
      const t=item.t,cnt=counts[t]||0,pct=totalRows>0?Math.min(100,Math.round((cnt/totalRows)*100)):0;
      const col=COLORS[colorIdx++%COLORS.length];
      h+='<tr>';
      h+='<td style="padding:4px 10px 4px 22px;font-size:12px">└ '+H.e(item.l)+' <span style="font-family:monospace;font-size:10px;color:#94a3b8">('+t+')</span></td>';
      h+='<td style="padding:4px 10px;text-align:right;font-weight:700">'+cnt.toLocaleString()+'</td>';
      h+='<td style="padding:4px 14px"><div style="height:5px;background:var(--bd);border-radius:3px"><div style="height:5px;background:'+col+';border-radius:3px;width:'+pct+'%"></div></div></td>';
      if(errors[t]) h+='<td style="padding:4px 10px;text-align:center" title="'+errors[t]+'"><span style="color:#ef4444;font-size:11px">❌ 오류</span></td>';
      else h+='<td style="padding:4px 10px;text-align:center"><span style="color:#22c55e;font-size:11px">✅ 정상</span></td>';
      h+='</tr>';
    });
  });;
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
      const rawPct=k.max>0?Math.round((k.used/k.max)*100):0;
      const pct=Math.min(100,rawPct);
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

/* ══════════════════════════════════════════════════════════════
   제조설비관리 (EMS — Equipment Management System) [v2.65]
   ══════════════════════════════════════════════════════════════
   M1. eq_mgmt        설비 등록 관리
   M2. eq_pm          예방정비(PM) 점검표
   M3. eq_as          고장/AS 관리
   M4. eq_cost        유지보수 비용
   M5. eq_manual      설비 매뉴얼
   M6. eq_machine_card 마이머신카드
   M7. eq_dashboard   OEE/KPI 대시보드
   M8. eq_dept        부서별 보유현황
   ══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   M1. 설비 등록 관리
   ─────────────────────────────────────────────────────────────- */
async eq_mgmt(){
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es" style="margin:60px auto"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  var rows=[];
  try{ rows=await SB.getEquipment(); }catch(e){ rows=[]; }

  var cnt={total:rows.length,active:0,repair:0,inspect:0,decommission:0};
  rows.forEach(function(r){
    if(r.status==='정상')cnt.active++;
    else if(r.status==='수리중')cnt.repair++;
    else if(r.status==='점검중')cnt.inspect++;
    else if(r.status==='폐기'||r.status==='폐기예정')cnt.decommission++;
  });

  w.innerHTML=
    '<div class="stat-dash">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._eqFilter(\'\')">'+
        '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🏭</div>'+
        '<div><div class="sd-val">'+cnt.total+'</div><div class="sd-lbl">전체 설비</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._eqFilter(\'정상\')">'+
        '<div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+cnt.active+'</div><div class="sd-lbl">정상 가동</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._eqFilter(\'수리중\')">'+
        '<div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔧</div>'+
        '<div><div class="sd-val">'+cnt.repair+'</div><div class="sd-lbl">수리중</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._eqFilter(\'점검중\')">'+
        '<div class="sd-icon" style="background:#fef3c7;color:#d97706">⚠️</div>'+
        '<div><div class="sd-val">'+cnt.inspect+'</div><div class="sd-lbl">점검중</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._eqFilter(\'폐기예정\')">'+
        '<div class="sd-icon" style="background:#f1f5f9;color:#64748b">⛔</div>'+
        '<div><div class="sd-val">'+cnt.decommission+'</div><div class="sd-lbl">폐기/예정</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">🏭 설비 등록 관리</div>'+
      '<div style="font-size:12px;color:var(--muted)">설비 기본정보 · 사양 · 관리대장 일괄 업로드</div>'+
    '</div><div class="pac">'+
      /* [v2.65] Excel 일괄 업로드 버튼 */
      '<label class="btn bout bsm" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px">'+
        '📥 Excel 일괄 업로드'+
        '<input type="file" id="eqExcelFile" accept=".xlsx,.xls" style="display:none" onchange="Pages._eqBulkUpload(this)">'+
      '</label>'+
      '<button class="btn bout bsm" onclick="Pages._eqExportExcel()">📤 Excel 다운로드</button>'+
      '<button class="btn bpri btn-f2" onclick="Pages._eqForm()">+ 설비 등록 <span class="kbd">F2</span></button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<button class="btn bout bsm btn-f3" onclick="Pages._emsSearch()" title="설비 검색 (F3)">🔎 F3</button>'+
      '<input type="text" id="eqNoF" placeholder="설비번호..." style="width:130px" oninput="Pages._eqNoFilter(this.value)">'+
      '<div class="sw2"><input type="text" id="eqKw" placeholder="🔍 설비명, 부서 검색..." oninput="Pages._eqKwFilter(this.value)"></div>'+
      '<select class="fsel" id="eqTypeF" onchange="Pages._eqTypeFilter(this.value)">'+
        '<option value="">전체 유형</option>'+
        '<option value="생산설비">생산설비</option><option value="검사설비">검사설비</option>'+
        '<option value="유틸리티">유틸리티</option><option value="운반설비">운반설비</option><option value="기타">기타</option>'+
      '</select>'+
      '<select class="fsel" id="eqDeptF" onchange="Pages._eqDeptFilter(this.value)">'+
        '<option value="">전체 부서</option>'+
        (function(){
          var depts=[...new Set((rows||[]).map(function(r){return r.dept||'';}).filter(Boolean))];
          return depts.map(function(d){return'<option value="'+H.e(d)+'">'+H.e(d)+'</option>';}).join('');
        })()+
      '</select>'+
    '</div>'+
    '<div id="eqTbl"></div>';

  window._eqRows=rows; window._eqStatus=''; window._eqType=''; window._eqDept=''; window._eqKw='';
  Pages._eqRender(rows);
},
_eqFilter:function(st){ window._eqStatus=st; Pages._eqApply(); },
_eqTypeFilter:function(v){ window._eqType=v; Pages._eqApply(); },
_eqDeptFilter:function(v){ window._eqDept=v; Pages._eqApply(); },
_eqKwFilter:function(v){ window._eqKw=v; Pages._eqApply(); },
/* [v2.65] 설비번호 전용 필터 */
_eqNoFilter:function(v){ window._eqNo=v; Pages._eqApply(); },

/* [v2.65] Excel 일괄 업로드 ─────────────────────────────────────
   컬럼 매핑 (관리대장 1행 헤더 기준):
   일련번호 | 유형* | 설비번호* | 설비명* | 모델명* | S/N | 제조사* |
   제작일자 | 도입일* | 취득원가 | 담당부서 | 담당자(정)* | 관리자(부)* |
   장비Size | 정격전압(V) | 정격용량(KW) | 소비전력(W) | 사용작동유 |
   상태 | 비고
   ────────────────────────────────────────────────────────────── */
_eqBulkUpload:async function(inp){
  var file=inp.files&&inp.files[0];
  if(!file){return;}
  inp.value=''; /* 같은 파일 재선택 허용 */

  if(typeof XLSX==='undefined'){
    Toast.show('XLSX 라이브러리가 로드되지 않았습니다.','err'); return;
  }

  Toast.show('📊 엑셀 파일 분석 중...','info',2000);

  var reader=new FileReader();
  reader.onload=async function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});

      if(!raw||raw.length<2){Toast.show('데이터가 없습니다.','warn');return;}

      /* 헤더 행 파악 (1행) */
      var headers=raw[0].map(function(h){return String(h).trim();});

      /* 관리대장 헤더 → DB 컬럼 매핑 */
      var COL_MAP={
        '일련번호':       null,           /* 무시 */
        '유형*':          'type',
        '설비번호*':      'eq_no',
        '설비명*':        'name',
        '모델명*':        'model',
        'S/N':            'serial_no',
        '제조사*':        'maker',
        '제작일자':       'manufacture_date',
        '도입일*':        'install_date',
        '취득원가':       'cost',
        '담당부서':       'dept',
        '담당자(정)*':    'manager',
        '관리자(부)*':    'backup_manager2',
        '장비Size':       'size_spec',
        '정격전압(V)':    'rated_voltage',
        '정격용량(KW)':   'rated_capacity',
        '소비전력(W)':    'power_consumption',
        '사용작동유':     'hydraulic_oil',
        '상태':           'status',
        '비고':           'memo',
      };

      /* 컬럼 인덱스 매핑 */
      var colIdx={};
      headers.forEach(function(h,i){ if(COL_MAP[h]!==undefined) colIdx[COL_MAP[h]]=i; });

      /* 필수 컬럼 확인 */
      var required=['type','name','eq_no'];
      var missing=required.filter(function(c){return colIdx[c]===undefined;});
      if(missing.length){
        Toast.show('필수 컬럼 누락: '+missing.join(', '),'err',4000); return;
      }

      /* 데이터 행 파싱 */
      var rows=[];
      var errors=[];
      for(var i=1;i<raw.length;i++){
        var r=raw[i];
        if(!r||r.every(function(v){return v===''||v===null;})) continue;

        var name=String(r[colIdx['name']]||'').trim();
        var type=String(r[colIdx['type']]||'').trim();
        if(!name||!type){errors.push('행'+(i+1)+': 설비명/유형 필수'); continue;}

        var row={
          name:name,
          type:type,
          eq_no:    colIdx['eq_no']!==undefined?String(r[colIdx['eq_no']]||'').trim()||null:null,
          model:    colIdx['model']!==undefined?String(r[colIdx['model']]||'').trim()||null:null,
          serial_no:colIdx['serial_no']!==undefined?String(r[colIdx['serial_no']]||'').trim()||null:null,
          maker:    colIdx['maker']!==undefined?String(r[colIdx['maker']]||'').trim()||null:null,
          manufacture_date: colIdx['manufacture_date']!==undefined?Pages._parseDate(r[colIdx['manufacture_date']]):null,
          install_date:     colIdx['install_date']!==undefined?Pages._parseDate(r[colIdx['install_date']]):null,
          cost:     colIdx['cost']!==undefined&&r[colIdx['cost']]!==''?parseFloat(r[colIdx['cost']])||null:null,
          dept:     colIdx['dept']!==undefined?String(r[colIdx['dept']]||'').trim()||null:null,
          manager:  colIdx['manager']!==undefined?String(r[colIdx['manager']]||'').trim()||null:null,
          backup_manager2: colIdx['backup_manager2']!==undefined?String(r[colIdx['backup_manager2']]||'').trim()||null:null,
          size_spec: colIdx['size_spec']!==undefined?String(r[colIdx['size_spec']]||'').trim()||null:null,
          rated_voltage:    colIdx['rated_voltage']!==undefined?String(r[colIdx['rated_voltage']]||'').trim()||null:null,
          rated_capacity:   colIdx['rated_capacity']!==undefined?String(r[colIdx['rated_capacity']]||'').trim()||null:null,
          power_consumption:colIdx['power_consumption']!==undefined?String(r[colIdx['power_consumption']]||'').trim()||null:null,
          hydraulic_oil:    colIdx['hydraulic_oil']!==undefined?String(r[colIdx['hydraulic_oil']]||'').trim()||null:null,
          status:   colIdx['status']!==undefined?String(r[colIdx['status']]||'정상').trim()||'정상':'정상',
          memo:     colIdx['memo']!==undefined?String(r[colIdx['memo']]||'').trim()||null:null,
        };
        rows.push(row);
      }

      if(!rows.length){Toast.show('파싱된 데이터가 없습니다.','warn');return;}

      /* 미리보기 확인 팝업 */
      var existNos=(window._eqRows||[]).map(function(e){return e.eq_no;});
      var dupes=rows.filter(function(r){return r.eq_no&&existNos.includes(r.eq_no);});
      var news=rows.filter(function(r){return !r.eq_no||!existNos.includes(r.eq_no);});

      Modal.confirm({
        title:'📥 설비 일괄 등록 확인',
        msg:'<div style="text-align:center">'+
            '<div style="font-size:14px;margin-bottom:8px">총 <b>'+rows.length+'건</b> 파싱 완료</div>'+
            '<div style="display:flex;justify-content:center;gap:20px;font-size:13px">'+
              '<span>🆕 신규: <b style="color:#059669">'+news.length+'건</b></span>'+
              '<span>⚠️ 중복(eq_no): <b style="color:#d97706">'+dupes.length+'건</b></span>'+
              (errors.length?'<span>❌ 오류: <b style="color:#dc2626">'+errors.length+'건</b></span>':'')+'</div>'+
            (dupes.length?'<div style="font-size:11px;color:var(--muted);margin-top:6px">중복 설비번호는 건너뜁니다.</div>':'')+
          '</div>',
        onOk:async function(){
          var ok=0; var fail=0;
          for(var i=0;i<rows.length;i++){
            /* 중복 eq_no 스킵 */
            if(rows[i].eq_no&&existNos.includes(rows[i].eq_no)){continue;}
            var r=await SB.addEquipment(rows[i]);
            if(r.ok) ok++; else fail++;
          }
          Toast.show('✅ 등록 완료: '+ok+'건'+(fail?' / 실패:'+fail+'건':''),'ok',4000);
          await Pages.eq_mgmt();
        }
      });

    }catch(ex){
      Toast.show('파일 읽기 오류: '+ex.message,'err',4000);
    }
  };
  reader.readAsArrayBuffer(file);
},

/* 날짜 파싱 헬퍼 */
_parseDate:function(v){
  if(!v) return null;
  var s=String(v).trim();
  if(!s||s===''||s==='null') return null;
  /* YYYY-MM-DD 형식 */
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  /* Excel 숫자 날짜 */
  var n=parseFloat(s);
  if(!isNaN(n)&&n>10000){
    var d=new Date((n-25569)*86400000);
    if(!isNaN(d.getTime()))
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  /* YYYY.MM.DD 또는 YYYY년MM월DD일 */
  var m=s.match(/(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/);
  if(m) return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  return null;
},

/* [v2.65] Excel 다운로드 */
_eqExportExcel:function(){
  var rows=window._eqRows||[];
  if(!rows.length){Toast.show('다운로드할 데이터가 없습니다.','warn');return;}
  var headers=['일련번호','유형*','설비번호*','설비명*','모델명*','S/N','제조사*',
               '제작일자','도입일*','취득원가','담당부서','담당자(정)*','관리자(부)*',
               '장비Size','정격전압(V)','정격용량(KW)','소비전력(W)','사용작동유','상태','비고'];
  var data=rows.map(function(r,i){return[
    i+1, r.type||'', r.eq_no||'', r.name||'', r.model||'', r.serial_no||'',
    r.maker||'', r.manufacture_date||'', r.install_date||'', r.cost||'',
    r.dept||'', r.manager||'', r.backup_manager2||'', r.size_spec||'',
    r.rated_voltage||'', r.rated_capacity||'', r.power_consumption||'',
    r.hydraulic_oil||'', r.status||'', r.memo||'',
  ];});
  if(typeof XLSX!=='undefined'){
    var wb=XLSX.utils.book_new();
    var ws=XLSX.utils.aoa_to_sheet([headers,...data]);
    /* 컬럼 너비 설정 */
    ws['!cols']=[
      {wch:6},{wch:8},{wch:12},{wch:14},{wch:10},{wch:10},{wch:10},
      {wch:10},{wch:10},{wch:10},{wch:8},{wch:8},{wch:8},
      {wch:12},{wch:10},{wch:10},{wch:10},{wch:10},{wch:6},{wch:14}
    ];
    XLSX.utils.book_append_sheet(wb,'설비관리대장',ws);
    XLSX.writeFile(wb,'제조설비관리대장_'+new Date().toISOString().slice(0,10)+'.xlsx');
  } else {
    Toast.show('XLSX 라이브러리가 로드되지 않았습니다.','err');
  }
},
_eqApply:function(){
  var rows=window._eqRows||[];
  var st=window._eqStatus||''; var tp=window._eqType||''; var dp=window._eqDept||'';
  var kw=(window._eqKw||'').toLowerCase(); var no=(window._eqNo||'').toLowerCase();
  if(st) rows=rows.filter(function(r){return r.status===st;});
  if(tp) rows=rows.filter(function(r){return r.type===tp;});
  if(dp) rows=rows.filter(function(r){return r.dept===dp;});
  /* [v2.65] 설비번호 전용 필터 */
  if(no) rows=rows.filter(function(r){return (r.eq_no||'').toLowerCase().includes(no);});
  if(kw) rows=rows.filter(function(r){
    return (r.name||'').toLowerCase().includes(kw)||(r.dept||'').toLowerCase().includes(kw);
  });
  Pages._eqRender(rows);
},
_eqRender:function(rows){
  var stCls={정상:'bgrn',수리중:'bred',점검중:'bamb',폐기:'bgry',폐기예정:'bgry'};
  /* [v2.65] 관리대장 기준 컬럼 순서 */
  Tbl.render({el:'#eqTbl',cols:[
    {key:'eq_no',           label:'설비번호',
      render:function(v,row){return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--pri);cursor:pointer" onclick="Pages._eqDetail('+row.id+')">'+H.e(v||'-')+'</span>';}},
    {key:'type',            label:'유형',  align:'center'},
    {key:'name',            label:'설비명',
      render:function(v,row){
        var img=row.photo_urls&&row.photo_urls[0]?'<img src="'+H.e(row.photo_urls[0])+'" style="width:24px;height:24px;border-radius:3px;object-fit:cover;margin-right:5px;vertical-align:middle">':'';
        return img+'<span style="font-weight:600;cursor:pointer" onclick="Pages._eqDetail('+row.id+')">'+H.e(v||'-')+'</span>';}},
    {key:'model',           label:'모델명'},
    {key:'serial_no',       label:'S/N',  render:function(v){return v?'<span style="font-size:11px;font-family:monospace">'+H.e(v)+'</span>':'-';}},
    {key:'maker',           label:'제조사'},
    {key:'manufacture_date',label:'제작일자',  render:function(v){return v?'<span style="font-size:11px">'+H.e(v)+'</span>':'-';}},
    {key:'install_date',    label:'도입일',  render:function(v){return v?'<span style="font-size:11px">'+H.e(v)+'</span>':'-';}},
    {key:'cost',            label:'취득원가',  align:'right',
      render:function(v){return v?'<span style="font-size:11px">'+Number(v).toLocaleString()+'</span>':'-';}},
    {key:'dept',            label:'담당부서',  align:'center'},
    {key:'manager',         label:'담당자(정)',  align:'center'},
    {key:'backup_manager2', label:'관리자(부)',  align:'center'},
    {key:'size_spec',       label:'장비Size'},
    {key:'rated_voltage',   label:'정격전압',  align:'center'},
    {key:'rated_capacity',  label:'정격용량',  align:'center'},
    {key:'power_consumption',label:'소비전력',  align:'center'},
    {key:'hydraulic_oil',   label:'사용작동유'},
    {key:'status',          label:'상태',  align:'center',
      render:function(v){return'<span class="badge '+(stCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    {key:'memo',            label:'비고',        render:function(v){return v?'<span style="font-size:11px">'+H.e(v)+'</span>':'-';}},
    {key:'photo_urls',       label:'파일',  w:'52px', align:'center',
      render:function(v,row){
        var urls=(v&&typeof v==='string')?v.split(',').filter(Boolean):(v||[]);
        if(!urls.length) return '<span style="color:var(--tl)">—</span>';
        return'<button class="btn bxs bsm bblu" onclick="event.stopPropagation();Pages._eqPhotoView(this.dataset.url,this.dataset.no)" data-url="'+H.e(urls[0])+'" data-no="'+H.e(row.eq_no||'')+'" style="font-size:11px">📎 '+urls.length+'</button>';
      }},
  ],
  data:rows,
  onDel:async function(ids){
    if(!ids.length){Toast.show('삭제할 설비를 선택하세요.','warn');return;}
    Modal.confirm({title:'🗑️ 설비 삭제',
      msg:'<div style="text-align:center"><b style="color:#dc2626">'+ids.length+'건</b>을 삭제합니다.<br><small>관련 PM이력/AS이력도 삭제됩니다.</small></div>',
      danger:true,onOk:async function(){
        for(var i=0;i<ids.length;i++) await SB.deleteEquipment(ids[i]);
        window._eqRows=(window._eqRows||[]).filter(function(x){return!ids.includes(x.id);});
        Pages._eqRender(window._eqRows);
        Toast.show(ids.length+'건 삭제됨','ok');
      }
    });
  },
  onRow:function(row){if(row)Pages._eqDetail(row.id);}
  });
},
_eqDetail:async function(id){
  var row=(window._eqRows||[]).find(function(r){return r.id===id;});
  if(!row){ Toast.show('설비 정보를 찾을 수 없습니다.','err'); return; }
  var isAdmin=Auth._u&&(Auth._u.role==='admin'||Auth._u.role==='manager');
  /* 사진 갤러리 */
  var photos=row.photo_urls||[];
  var gallery=photos.length
    ?'<div class="eq-gallery">'+
      photos.map(function(url,i){
        return'<img src="'+H.e(url)+'" style="width:80px;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid var(--brd)" onclick="Pages._eqPhotoView('+JSON.stringify(photos)+','+i+')">';
      }).join('')+'</div>'
    :'<div style="padding:16px;background:var(--bg2);border-radius:6px;text-align:center;color:var(--muted);margin-bottom:14px;font-size:12px">📷 등록된 사진 없음</div>';

  Modal.open({title:'🏭 설비 상세 — '+H.e(row.name||''),size:'mlg',body:
    gallery+
    /* [v2.65] 관리대장 기준 전체 필드 표시 */
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl">설비번호</label><div class="fc-readonly">'+H.e(row.eq_no||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">유형</label><div class="fc-readonly">'+H.e(row.type||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">설비명</label><div class="fc-readonly">'+H.e(row.name||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">모델명</label><div class="fc-readonly">'+H.e(row.model||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">S/N</label><div class="fc-readonly">'+H.e(row.serial_no||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">제조사</label><div class="fc-readonly">'+H.e(row.maker||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">제작일자</label><div class="fc-readonly">'+H.e(row.manufacture_date||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">도입일</label><div class="fc-readonly">'+H.e(row.install_date||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">취득원가</label><div class="fc-readonly">'+(row.cost?Number(row.cost).toLocaleString()+'원':'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당부서</label><div class="fc-readonly">'+H.e(row.dept||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당자(정)</label><div class="fc-readonly">'+H.e(row.manager||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">관리자(부)</label><div class="fc-readonly">'+H.e(row.backup_manager2||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">장비 Size</label><div class="fc-readonly">'+H.e(row.size_spec||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">정격전압(V)</label><div class="fc-readonly">'+H.e(row.rated_voltage||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">정격용량(KW)</label><div class="fc-readonly">'+H.e(row.rated_capacity||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">소비전력(W)</label><div class="fc-readonly">'+H.e(row.power_consumption||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">사용작동유</label><div class="fc-readonly">'+H.e(row.hydraulic_oil||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">설치위치</label><div class="fc-readonly">'+H.e(row.location||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">상태</label><div class="fc-readonly">'+H.e(row.status||'-')+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">비고</label><div class="fc-readonly">'+H.e(row.memo||'-')+'</div></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
      '<button class="btn bout" onclick="Modal.close();Nav.go(\'eq_pm\')">📋 PM 점검</button>'+
      '<button class="btn bout" onclick="Modal.close();Nav.go(\'eq_as\')">🔧 AS 접수</button>'+
      (isAdmin?'<button class="btn bpri" onclick="Modal.close();Pages._eqForm('+row.id+')">✏️ 수정</button>':''),
  });
},
_eqPhotoView:function(urls,idx){
  /* 사진 전체화면 뷰어 */
  var i=idx||0;
  var html='<div id="pvWrap" style="text-align:center">'+
    '<img id="pvImg" src="'+H.e(urls[i])+'" style="max-width:100%;max-height:60vh;border-radius:8px">'+
    '<div style="margin-top:10px;display:flex;justify-content:center;gap:8px">'+
    urls.map(function(u,j){
      return'<img src="'+H.e(u)+'" style="width:48px;height:48px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid '+(j===i?'var(--pri)':'var(--brd)')+'" onclick="document.getElementById(\'pvImg\').src=\''+H.e(u)+'\'">'; 
    }).join('')+'</div></div>';
  Modal.open({title:'📷 설비 사진',size:'mlg',body:html,foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'});
},
_eqForm:async function(editId){
  /* [v2.65] 관리대장 기준 전체 필드 */
  var row=editId?(window._eqRows||[]).find(function(r){return r.id===editId;}):null;
  Modal.open({title:row?'✏️ 설비 수정':'🏭 설비 등록',size:'mlg',body:
    '<div class="fg2">'+
    /* 설비번호 */
    '<div class="fgroup"><label class="fl">설비번호</label>'+
      '<input class="fc" id="efNo" placeholder="직접 입력 (비우면 EQ-YYYY-NNN 자동생성)" value="'+H.e(row?row.eq_no||'':'')+'">'+
      '<div style="font-size:11px;color:var(--muted);margin-top:3px">📌 비워두면 자동 생성됩니다.</div>'+
    '</div>'+
    /* 유형 + 상태 */
    '<div class="fgroup"><label class="fl req">유형</label>'+
      '<select class="fc" id="efType">'+
        ['생산설비','검사설비','유틸리티','운반설비','기타'].map(function(t){
          return'<option value="'+t+'"'+(row&&row.type===t?' selected':'')+'>'+t+'</option>';
        }).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">설비명</label>'+
      '<input class="fc" id="efName" placeholder="설비 정식 명칭" value="'+H.e(row?row.name||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">모델명</label>'+
      '<input class="fc" id="efModel" placeholder="모델명" value="'+H.e(row?row.model||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">S/N (시리얼번호)</label>'+
      '<input class="fc" id="efSerial" placeholder="시리얼번호" value="'+H.e(row?row.serial_no||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">제조사</label>'+
      '<input class="fc" id="efMaker" placeholder="제조사명" value="'+H.e(row?row.maker||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">제작일자</label>'+
      '<input type="date" class="fc" id="efMfDate" value="'+H.e(row?row.manufacture_date||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">도입일</label>'+
      '<input type="date" class="fc" id="efInstall" value="'+H.e(row?row.install_date||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">취득원가</label>'+
      '<input type="number" class="fc" id="efCost" placeholder="0" value="'+(row?row.cost||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">담당부서</label>'+
      '<input class="fc" id="efDept" placeholder="부서명" value="'+H.e(row?row.dept||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">담당자(정)</label>'+
      '<input class="fc" id="efManager" placeholder="담당자 이름" value="'+H.e(row?row.manager||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">관리자(부)</label>'+
      '<input class="fc" id="efManager2" placeholder="부 관리자" value="'+H.e(row?row.backup_manager2||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">장비 Size</label>'+
      '<input class="fc" id="efSize" placeholder="예) 1020*510 (L*W)" value="'+H.e(row?row.size_spec||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">정격전압(V)</label>'+
      '<input class="fc" id="efVoltage" placeholder="예) 380V / 3상 380V" value="'+H.e(row?row.rated_voltage||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">정격용량(KW)</label>'+
      '<input class="fc" id="efCapacity" placeholder="예) 7.5KW" value="'+H.e(row?row.rated_capacity||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">소비전력(W)</label>'+
      '<input class="fc" id="efPower" placeholder="예) 3.7KW" value="'+H.e(row?row.power_consumption||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">사용작동유</label>'+
      '<input class="fc" id="efOil" placeholder="예) ISO VG 68" value="'+H.e(row?row.hydraulic_oil||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">설치위치</label>'+
      '<input class="fc" id="efLoc" placeholder="라인/공정 위치" value="'+H.e(row?row.location||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl req">상태</label>'+
      '<select class="fc" id="efStatus">'+
        ['정상','수리중','점검중','폐기예정','폐기'].map(function(s){
          var sel=(row&&row.status===s)||(!row&&s==='정상');return'<option value="'+s+'"'+(sel?' selected':'')+'>'+s+'</option>';
        }).join('')+
      '</select></div>'+
    '<div class="fgroup ff"><label class="fl">설비 사진</label>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<label style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1.5px dashed var(--brd);border-radius:var(--r);cursor:pointer;font-size:12px;color:var(--muted)">'+
          '📁 사진 선택 (최대 5장)'+
          '<input type="file" id="efPhoto" multiple accept="image/*" style="display:none" onchange="Pages._eqPhotoPreview(this)">'+
        '</label>'+
        '<span id="efPhotoName" style="font-size:11px;color:var(--muted)">선택된 파일 없음</span>'+
      '</div></div>'+
    '<div class="fgroup ff"><label class="fl">비고</label>'+
      '<textarea class="fc" id="efMemo" rows="2" placeholder="특이사항">'+H.e(row?row.memo||'':'')+'</textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._eqSave('+(editId||'null')+')">저장</button>',
  });
},
_eqPhotoPreview:function(inp){
  var lbl=document.getElementById('efPhotoName');
  if(inp.files&&lbl) lbl.textContent='📷 '+inp.files.length+'장 선택됨';
},
_eqSave:async function(editId){
  var name=document.getElementById('efName')?.value?.trim();
  var dept=document.getElementById('efDept')?.value?.trim();
  if(!name){Toast.show('설비명을 입력하세요.','warn');return;}
  if(!dept){Toast.show('담당부서를 입력하세요.','warn');return;}
  /* [v2.65] 설비번호: 입력값 우선, 없으면 DB에서 자동생성 */
  var inputNo = document.getElementById('efNo')?.value?.trim();
  /* [v2.65] 관리대장 기준 전체 필드 저장 */
  var row={
    name:name,
    type:document.getElementById('efType')?.value||'생산설비',
    dept:dept,
    location:document.getElementById('efLoc')?.value||null,
    status:document.getElementById('efStatus')?.value||'정상',
    model:document.getElementById('efModel')?.value||null,
    serial_no:document.getElementById('efSerial')?.value||null,
    maker:document.getElementById('efMaker')?.value||null,
    manufacture_date:document.getElementById('efMfDate')?.value||null,
    install_date:document.getElementById('efInstall')?.value||null,
    cost:parseFloat(document.getElementById('efCost')?.value)||null,
    manager:document.getElementById('efManager')?.value||null,
    backup_manager2:document.getElementById('efManager2')?.value||null,
    size_spec:document.getElementById('efSize')?.value||null,
    rated_voltage:document.getElementById('efVoltage')?.value||null,
    rated_capacity:document.getElementById('efCapacity')?.value||null,
    power_consumption:document.getElementById('efPower')?.value||null,
    hydraulic_oil:document.getElementById('efOil')?.value||null,
    memo:document.getElementById('efMemo')?.value||null,
    eq_no: inputNo || null,
  };
  /* 사진 업로드 */
  var fileInp=document.getElementById('efPhoto');
  if(fileInp&&fileInp.files&&fileInp.files.length){
    var urls=[];
    for(var i=0;i<Math.min(fileInp.files.length,5);i++){
      try{
        var up=await SB.uploadFile('equipment',fileInp.files[i]);
        if(up&&up.url) urls.push(up.url);
      }catch(e){console.warn('사진 업로드 실패:',e.message);}
    }
    if(urls.length) row.photo_urls=urls;
  }
  var r=editId?await SB.updateEquipment(editId,row):await SB.addEquipment(row);
  if(r.ok){Toast.show(editId?'수정됨':'등록됨','ok');Modal.close();await Pages.eq_mgmt();}
},

/* ──────────────────────────────────────────────────────────────
   M2. 예방정비(PM) 점검표
   ─────────────────────────────────────────────────────────────- */
async eq_pm(){
  /* [v2.65] PM 화면 — 설비 목록 기반 (PM 로그 없어도 설비 표시) */
  var w=document.getElementById('pw');
  w.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  var eqs=[]; var logs=[];
  try{ eqs=await SB.getEquipment(); }catch(e){}
  try{ logs=await SB.getEqPmLogs(); }catch(e){}

  if(!eqs.length){
    w.innerHTML='<div style="text-align:center;margin-top:60px;color:var(--tm)">'+
      '<div style="font-size:48px;margin-bottom:12px">🏭</div>'+
      '<div style="font-size:15px;font-weight:600;margin-bottom:6px">등록된 설비가 없습니다</div>'+
      '<button class="btn bpri" style="margin-top:16px" onclick="Nav.go(\'eq_mgmt\')">→ 설비 등록하러 가기</button></div>';
    return;
  }

  /* stat-dash */
  var done2=logs.filter(function(l){return l.status==='완료';}).length;
  var overdue2=logs.filter(function(l){return l.status==='미완료'&&new Date(l.check_date)<new Date();}).length;
  var planned2=logs.filter(function(l){return l.status==='예정';}).length;
  var pmRate2=logs.length?Math.round(done2/logs.length*100):0;
  var pmRateColor2=pmRate2>=90?'#059669':pmRate2>=70?'#d97706':'#dc2626';

  /* 설비별 최근 PM 상태 맵 */
  var eqPmMap={};
  logs.forEach(function(l){
    if(!eqPmMap[l.eq_id]) eqPmMap[l.eq_id]={};
    var cy=l.cycle||'일일';
    if(!eqPmMap[l.eq_id][cy]||l.check_date>eqPmMap[l.eq_id][cy].check_date)
      eqPmMap[l.eq_id][cy]=l;
  });

  var CYCLES=['일일','주간','월간','반기','연간'];
  var stCls={완료:'bgrn',예정:'bamb',미완료:'bred'};
  var stMark={완료:'✅',예정:'📅',미완료:'🚨'};

  w.innerHTML=
    '<div class="stat-dash">'+
      '<div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">🏭</div>'+
        '<div><div class="sd-val">'+eqs.length+'</div><div class="sd-lbl">관리 설비</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._pmStatusFilter(\'완료\')"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+done2+'</div><div class="sd-lbl">완료</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._pmStatusFilter(\'예정\')"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📅</div>'+
        '<div><div class="sd-val">'+planned2+'</div><div class="sd-lbl">예정</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._pmStatusFilter(\'미완료\')"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🚨</div>'+
        '<div><div class="sd-val">'+overdue2+'</div><div class="sd-lbl">미완료</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">📊</div>'+
        '<div><div class="sd-val" style="color:'+pmRateColor2+'">'+pmRate2+'%</div><div class="sd-lbl">PM 준수율 (목표≥90%)</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">📋 예방정비(PM) 점검표</div>'+
      '<div style="font-size:12px;color:var(--muted)">설비별 점검 현황 · 일일·주간·월간·반기·연간</div>'+
    '</div><div class="pac">'+
      '<button class="btn bout bsm btn-f3" onclick="Pages._emsSearch()" title="설비 검색 (F3)">🔎 F3</button>'+
      '<button class="btn bpri bsm" onclick="Pages._pmPrint()">🖨️ 점검표 출력</button>'+
      '<button class="btn bpri btn-f2" onclick="Pages._pmForm()">+ 점검 등록 <span class="kbd">F2</span></button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<input type="text" id="pmNoF" placeholder="설비번호..." style="width:120px" oninput="Pages._pmNoFilter(this.value)">'+
      '<input type="text" id="pmKw2" placeholder="설비명/부서..." style="width:120px" oninput="Pages._pmKw2Filter(this.value)">'+
      '<select class="fsel" id="pmCycleF2" onchange="Pages._pmCycleFilter(this.value)">'+
        '<option value="">전체 주기</option>'+
        ['일일','주간','월간','반기','연간'].map(function(c){return'<option value="'+c+'">'+c+'</option>';}).join('')+
      '</select>'+
    '</div>'+
    '<div id="pmEqTbl"></div>';  /* 설비 목록 테이블 */

  window._pmEqs=eqs; window._pmLogs=logs; window._pmEqMap=eqPmMap;
  window._pmNoF2=''; window._pmKw2=''; window._pmCyc2='';
  Pages._pmEqRender(eqs);
},

/* 설비별 PM 현황 테이블 렌더 */
_pmEqRender:function(eqs){
  var logs=window._pmLogs||[];
  var eqPmMap=window._pmEqMap||{};
  var CYCLES=['일일','주간','월간','반기','연간'];
  var stCls={완료:'bgrn',예정:'bamb',미완료:'bred'};

  Tbl.render({el:'#pmEqTbl',cols:[
    {key:'eq_no',  label:'설비번호',
      render:function(v){return'<span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--pri)">'+H.e(v||'-')+'</span>';}},
    {key:'name',   label:'설비명',   render:function(v,row){
      return'<span style="font-weight:600;cursor:pointer" onclick="Pages._pmEqDetail('+row.id+')">'+H.e(v||'-')+'</span>';}},
    {key:'model_name', label:'모델명',    w:'90px',
      render:function(v,row){return H.e(v||row.model||'-');}},
    {key:'maker',      label:'제조사',    w:'80px',
      render:function(v){return H.e(v||'-');}},
    {key:'dept',   label:'담당부서'},
    {key:'status', label:'설비상태', align:'center',
      render:function(v){var c={정상:'bgrn',수리중:'bred',점검중:'bamb'};
        return'<span class="badge '+(c[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    /* 주기별 최근 점검 상태 */
    ...CYCLES.map(function(cy){return{
      key:'id', label:cy, align:'center',
      render:function(v,row){
        var pm=(eqPmMap[row.id]||{})[cy];
        if(!pm) return'<span style="color:var(--muted);font-size:11px">-</span>';
        var cls={완료:'#059669',예정:'#d97706',미완료:'#dc2626'}[pm.status]||'#888';
        var mark={완료:'✅',예정:'📅',미완료:'🚨'}[pm.status]||'';
        return'<span title="'+H.e(pm.check_date||'')+'" style="font-size:13px;cursor:pointer" onclick="Pages._pmLogDetail('+pm.id+')">'+mark+'</span>';
      }
    };}),
    {key:'next_pm_date', label:'다음PM일',
      render:function(v){
        if(!v) return'-';
        var d=Math.ceil((new Date(v)-new Date())/86400000);
        var cls=d<0?'color:#dc2626;font-weight:700':d<=7?'color:#d97706;font-weight:600':'color:var(--muted)';
        return'<span style="font-size:11px;'+cls+'">'+H.e(v)+(d<=0?' (D'+d+')':d<=7?' (D-'+d+')':'')+'</span>';}},
  ],
  data:eqs,
  onRow:function(row){if(row)Pages._pmEqDetail(row.id);}
  });
},

/* 설비별 PM 이력 상세 드릴다운 */
_pmEqDetail:function(eqId){
  var eqs=window._pmEqs||[];
  var logs=window._pmLogs||[];
  var eq=eqs.find(function(e){return e.id===eqId;})||{};
  var eqLogs=logs.filter(function(l){return l.eq_id===eqId;});
  var stCls={완료:'bgrn',예정:'bamb',미완료:'bred'};

  var rows=eqLogs.map(function(l,i){
    return'<tr style="border-bottom:1px solid var(--brd);background:'+(i%2?'var(--bg2)':'var(--sur)')+'">'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(l.check_date||'-')+'</td>'+
      '<td style="padding:6px 8px;text-align:center"><span class="badge '+(stCls[l.cycle]||'bgry')+'" style="font-size:10px">'+H.e(l.cycle||'-')+'</span></td>'+
      '<td style="padding:6px 8px;text-align:center"><span class="badge '+(stCls[l.status]||'bgry')+'" style="font-size:10px">'+H.e(l.status||'-')+'</span></td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(l.checker||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(l.note||'-')+'</td>'+
      '<td style="padding:6px 8px;text-align:center"><button class="btn bxs bout" onclick="Pages._pmDetailEdit('+l.id+')">✏️</button></td>'+
    '</tr>';
  }).join('');

  Modal.open({title:'📋 '+H.e(eq.name||'')+'  PM 이력',size:'mlg',body:
    '<div style="font-size:12px;color:var(--muted);margin-bottom:10px">'+
      '설비번호: <b>'+H.e(eq.eq_no||'-')+'</b> · 담당부서: '+H.e(eq.dept||'-')+' · 담당자: '+H.e(eq.manager||'-')+
    '</div>'+
    '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
    '<thead><tr style="background:var(--bg2)">'+
      '<th style="padding:7px 8px">점검일자</th><th style="padding:7px 8px">주기</th>'+
      '<th style="padding:7px 8px">상태</th><th style="padding:7px 8px">점검자</th>'+
      '<th style="padding:7px 8px">특이사항</th><th style="padding:7px 8px;width:40px">수정</th>'+
    '</tr></thead>'+
    '<tbody>'+
      (rows||'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">PM 이력 없음 — 아래 [+ 점검 등록]으로 추가하세요</td></tr>')+
    '</tbody></table>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
         '<button class="btn bpri" onclick="Modal.close();Pages._pmForm(null,'+eqId+')">+ 점검 등록</button>',
  });
},

/* PM 로그 상세 */
_pmLogDetail:function(logId){
  var logs=window._pmLogs||[];
  var l=logs.find(function(x){return x.id===logId;})||{};
  Pages._pmDetail(l);
},

/* PM 수정 */
_pmDetailEdit:function(logId){
  var logs=window._pmLogs||[];
  var l=logs.find(function(x){return x.id===logId;})||{};
  Modal.close();
  Pages._pmForm(l);
},

/* 필터 함수들 */
_pmNoFilter:function(v){window._pmNoF2=v;Pages._pmApplyFilter();},
_pmKw2Filter:function(v){window._pmKw2=v;Pages._pmApplyFilter();},
_pmCycleFilter:function(v){window._pmCyc2=v;Pages._pmApplyFilter();},
_pmStatusFilter:function(v){window._pmSt=v;Pages._pmApplyFilter();},
_pmEqFilter:function(v){window._pmEqF=v;Pages._pmApplyFilter();},
_pmApply:function(){Pages._pmApplyFilter();},
_pmApplyFilter:function(){
  var eqs=window._pmEqs||[];
  var no=(window._pmNoF2||'').toLowerCase();
  var kw=(window._pmKw2||'').toLowerCase();
  if(no) eqs=eqs.filter(function(e){return(e.eq_no||'').toLowerCase().includes(no);});
  if(kw) eqs=eqs.filter(function(e){
    return(e.name||'').toLowerCase().includes(kw)||(e.dept||'').toLowerCase().includes(kw);
  });
  Pages._pmEqRender(eqs);
},

/* ── [v2.65] PM 점검 등록 폼 — 항목별 체크박스 ── */
_pmForm:function(editRow, preEqId){
  var eqs=window._pmEqs||[];
  var ITEMS={
    '일일':['전원 ON/OFF 상태','Air 압력 상태 (기계 Air 압력 알람 확인)',
            '축(X,Y) 이동 시 소음 및 작동 상태','OIL 급유 및 누유 상태 (급유통 게이지 확인)',
            '각종 BUTTON & S/W 작동 상태','터렛 작동 상태 (시운전 터렛 회전 확인)',
            '안전 장치 작동 상태 (비상 버튼 확인)','설비 작동 기압 값 상태 (0.5MPa)',
            '절삭유 농도 측정 (5~15%)'],
    '주간': ['외관 청결 상태','볼트·너트 조임 상태','필터 청소 상태','안전장치 작동 확인'],
    '월간': ['PCB 오염(먼지) 상태','냉각수 상태 (보충여부)','BATTERY 점검 상태 (전극상태)',
            '베어링 소음 점검','벨트 장력 및 마모 확인'],
    '반기': ['오일 교환 여부','전기 접속부 점검','주요 부품 마모도 확인','성능 테스트 실시'],
    '연간': ['전체 오버홀 점검','법적 검사 이행 여부','내용연수 재평가','외부 전문가 점검'],
  };

  var defCycle=editRow?editRow.cycle||'일일':'일일';
  var defEq=preEqId||( editRow?editRow.eq_id:'');

  /* 기존 results JSON 파싱 */
  var savedResults={};
  if(editRow&&editRow.results){
    try{savedResults=JSON.parse(editRow.results);}catch(e){}
  }

  function buildItems(cycle){
    var items=ITEMS[cycle]||[];
    return items.map(function(item,i){
      var saved=savedResults[i]||'';
      return'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--brd)">'+
        '<span style="font-size:12px;min-width:20px;color:var(--muted)">'+(i+1)+'</span>'+
        '<span style="flex:1;font-size:12px">'+H.e(item)+'</span>'+
        ['○','△','X'].map(function(mark){
          var ck=saved===mark?'checked':'';
          var col=mark==='○'?'#059669':mark==='X'?'#dc2626':'#d97706';
          return'<label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:13px;font-weight:700;color:'+col+'">'+
            '<input type="radio" name="pm_item_'+i+'" value="'+mark+'" '+ck+
            ' style="accent-color:'+col+'"> '+mark+'</label>';
        }).join('')+
      '</div>';
    }).join('');
  }

  Modal.open({title:editRow?'📋 PM 점검 수정':'📋 PM 점검 등록',size:'mlg',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비 선택</label>'+
      '<select class="fc" id="pmfEq" onchange="Pages._pmFormItems()">'+
        eqs.map(function(e){return'<option value="'+e.id+'"'+(defEq&&String(defEq)===String(e.id)?' selected':'')+'>'+
          H.e(e.eq_no?'['+e.eq_no+'] ':'')+H.e(e.name)+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">점검 주기</label>'+
      '<select class="fc" id="pmfCycle" onchange="Pages._pmFormItems()">'+
        ['일일','주간','월간','반기','연간'].map(function(c){
          return'<option value="'+c+'"'+(c===defCycle?' selected':'')+'>'+c+'</option>';
        }).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">점검일자</label>'+
      '<input type="date" class="fc" id="pmfDate" value="'+(editRow?editRow.check_date||H.today():H.today())+'"></div>'+
    '<div class="fgroup"><label class="fl req">점검자</label>'+
      '<input class="fc" id="pmfChecker" value="'+H.e(editRow?editRow.checker||'':'')+'" placeholder="점검자 이름"></div>'+
    '<div class="fgroup"><label class="fl req">상태</label>'+
      '<select class="fc" id="pmfStatus">'+
        ['완료','예정','미완료'].map(function(s){return'<option value="'+s+'"'+(editRow&&editRow.status===s?' selected':s==='완료'?' selected':'')+'>'+s+'</option>';}).join('')+
      '</select></div>'+
    /* 항목별 체크박스 */
    '<div class="fgroup ff"><label class="fl">점검 항목 <span style="font-size:10px;color:var(--muted)">(○정상 △점검요 X고장)</span></label>'+
      '<div style="margin:4px 0 6px;display:flex;gap:6px;align-items:center">'+
        '<button type="button" class="btn bsm" style="background:#059669;color:#fff;border-color:#059669" '+
          'onclick="(function(){'+
            'document.querySelectorAll(\'#pmItemsArea input[type=radio]\').forEach(function(r){if(r.value===\'○\')r.checked=true;});'+
            'Toast.show(\'전체 정상(○) 일괄 적용\',\'ok\');'+
          '})()">✅ 전체 정상(○) 일괄 적용</button>'+
        '<span style="font-size:11px;color:var(--tm)">개별 수정은 항목에서 직접 선택</span>'+
      '</div>'+
      '<div id="pmItemsArea" style="border:1px solid var(--brd);border-radius:var(--r);padding:10px;max-height:260px;overflow-y:auto">'+
        buildItems(defCycle)+
      '</div></div>'+
    '<div class="fgroup ff"><label class="fl">특이사항</label>'+
      '<textarea class="fc" id="pmfNote" rows="2" placeholder="이상 발견 내용 등">'+H.e(editRow?editRow.note||'':'')+'</textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._pmSave('+(editRow?editRow.id:'null')+')">저장</button>',
  });
},

/* 주기 변경 시 항목 목록 갱신 */
_pmFormItems:function(){
  var cycle=document.getElementById('pmfCycle')?.value||'일일';
  var ITEMS={
    '일일':['전원 ON/OFF 상태','Air 압력 상태 (기계 Air 압력 알람 확인)',
            '축(X,Y) 이동 시 소음 및 작동 상태','OIL 급유 및 누유 상태 (급유통 게이지 확인)',
            '각종 BUTTON & S/W 작동 상태','터렛 작동 상태 (시운전 터렛 회전 확인)',
            '안전 장치 작동 상태 (비상 버튼 확인)','설비 작동 기압 값 상태 (0.5MPa)',
            '절삭유 농도 측정 (5~15%)'],
    '주간': ['외관 청결 상태','볼트·너트 조임 상태','필터 청소 상태','안전장치 작동 확인'],
    '월간': ['PCB 오염(먼지) 상태','냉각수 상태 (보충여부)','BATTERY 점검 상태 (전극상태)',
            '베어링 소음 점검','벨트 장력 및 마모 확인'],
    '반기': ['오일 교환 여부','전기 접속부 점검','주요 부품 마모도 확인','성능 테스트 실시'],
    '연간': ['전체 오버홀 점검','법적 검사 이행 여부','내용연수 재평가','외부 전문가 점검'],
  };
  var items=ITEMS[cycle]||[];
  var el=document.getElementById('pmItemsArea');
  if(!el) return;
  el.innerHTML=items.map(function(item,i){
    return'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--brd)">'+
      '<span style="font-size:12px;min-width:20px;color:var(--muted)">'+(i+1)+'</span>'+
      '<span style="flex:1;font-size:12px">'+H.e(item)+'</span>'+
      ['○','△','X'].map(function(mark){
        var col=mark==='○'?'#059669':mark==='X'?'#dc2626':'#d97706';
        return'<label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:13px;font-weight:700;color:'+col+'">'+
          '<input type="radio" name="pm_item_'+i+'" value="'+mark+'" style="accent-color:'+col+'"> '+mark+'</label>';
      }).join('')+
    '</div>';
  }).join('');
},

_pmSave:async function(editId){
  var eq_id=document.getElementById('pmfEq')?.value;
  var check_date=document.getElementById('pmfDate')?.value;
  var checker=document.getElementById('pmfChecker')?.value?.trim();
  if(!eq_id||!check_date||!checker){Toast.show('필수 항목을 입력하세요.','warn');return;}

  /* 항목별 체크 결과 수집 */
  var results={};
  var allDone=true; var anyBad=false;
  var radios=document.querySelectorAll('[name^="pm_item_"]');
  var groupSet={};
  radios.forEach(function(r){if(r.checked){
    var idx=r.name.replace('pm_item_','');
    results[parseInt(idx)]=r.value;
    groupSet[r.name]=true;
    if(r.value==='X') anyBad=true;
    if(r.value!=='○') allDone=false;
  }});

  var status=document.getElementById('pmfStatus')?.value||'완료';

  var row={
    eq_id:parseInt(eq_id),
    cycle:document.getElementById('pmfCycle')?.value||'일일',
    check_date:check_date, checker:checker, status:status,
    results:JSON.stringify(results),
    note:document.getElementById('pmfNote')?.value||null,
  };

  var r=editId?await SB.updateEqPmLog(editId,row):await SB.addEqPmLog(row);
  if(r.ok){
    /* next_pm_date 자동 계산 */
    if(status==='완료'){
      var CYCLE_DAYS={일일:1,주간:7,월간:30,반기:180,연간:365};
      var days=CYCLE_DAYS[row.cycle]||30;
      var next=new Date(check_date);
      next.setDate(next.getDate()+days);
      await SB.updateEquipment(parseInt(eq_id),{next_pm_date:next.toISOString().slice(0,10)});
    }
    Toast.show(editId?'수정됨':'점검 등록됨','ok');
    Modal.close();
    await Pages.eq_pm();
  }
},

_pmDetail:function(row){
  var eqs=window._pmEqs||[];
  var eq=(eqs||[]).find(function(e){return e.id===row.eq_id;})||{};
  var results={};
  try{if(row.results)results=JSON.parse(row.results);}catch(e){}
  var ITEMS={일일:['전원 ON/OFF','Air 압력','축 이동 소음','OIL 급유','BUTTON S/W','터렛 작동','안전장치','기압 값','절삭유 농도'],주간:['외관 청결','볼트 조임','필터 청소','안전장치'],월간:['PCB 오염','냉각수','BATTERY','베어링','벨트'],반기:['오일 교환','전기 점검','부품 마모','성능 테스트'],연간:['오버홀','법적 검사','내용연수','외부 점검']};
  var items=ITEMS[row.cycle]||[];
  var markColor={'○':'#059669','△':'#d97706','X':'#dc2626'};
  var resultHtml=items.map(function(item,i){
    var mk=results[i]||'-';
    return'<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--brd)">'+
      '<span style="min-width:20px;color:var(--muted)">'+(i+1)+'</span>'+
      '<span style="flex:1;font-size:12px">'+H.e(item)+'</span>'+
      '<span style="font-weight:700;color:'+(markColor[mk]||'#888')+'">'+mk+'</span>'+
    '</div>';
  }).join('');
  Modal.open({title:'📋 PM 상세',size:'sm',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl">설비번호</label><div class="fc-readonly">'+H.e(eq.eq_no||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">설비명</label><div class="fc-readonly">'+H.e(eq.name||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당부서</label><div class="fc-readonly">'+H.e(eq.dept||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당자</label><div class="fc-readonly">'+H.e(eq.manager||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">제조사/모델</label><div class="fc-readonly">'+H.e(eq.maker||'-')+(eq.model?' / '+H.e(eq.model):'')+'</div></div>'+
    '<div style="height:1px;background:var(--brd);margin:8px 0"></div>'+
    '<div class="fgroup"><label class="fl">점검 주기</label><div class="fc-readonly">'+H.e(row.cycle||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">점검일자</label><div class="fc-readonly">'+H.e(row.check_date||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">점검자</label><div class="fc-readonly">'+H.e(row.checker||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">상태</label><div class="fc-readonly">'+H.e(row.status||'-')+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">점검 결과</label>'+
      '<div style="border:1px solid var(--brd);border-radius:var(--r);padding:8px">'+resultHtml+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">특이사항</label><div class="fc-readonly" style="min-height:40px">'+H.e(row.note||'-')+'</div></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
         '<button class="btn bpri" onclick="Modal.close();Pages._pmDetailEdit('+row.id+')">✏️ 수정</button>',
  });
},


async eq_as(){
  var w=document.getElementById('pw');
  var rows=[]; var eqs=[];
  try{ rows=await SB.getEqAs(); }catch(e){}
  try{ eqs=await SB.getEquipment(); }catch(e){}

  var cnt={open:0,inprogress:0,waiting:0,done:0};
  rows.forEach(function(r){
    if(r.status==='접수')cnt.open++;
    else if(r.status==='처리중')cnt.inprogress++;
    else if(r.status==='부품대기')cnt.waiting++;
    else if(r.status==='완료')cnt.done++;
  });

  /* [v2.65] 반복고장 감지 — 동일 설비 + 동일 유형 3회 이상 */
  var repeatMap={};
  rows.forEach(function(r){
    var key=r.eq_id+'_'+r.fault_type;
    repeatMap[key]=(repeatMap[key]||0)+1;
  });
  var repeatAlerts=[];
  Object.keys(repeatMap).forEach(function(k){
    if(repeatMap[k]>=3){
      var parts=k.split('_');
      var eqId=parseInt(parts[0]);
      var ftype=parts.slice(1).join('_');
      var eq=(eqs||[]).find(function(e){return e.id===eqId;})||{};
      repeatAlerts.push({name:eq.name||'설비ID '+eqId, ftype:ftype, cnt:repeatMap[k]});
    }
  });

  w.innerHTML=
    /* [v2.65] 반복고장 경고 배너 */
    (repeatAlerts.length?
      '<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:var(--r);padding:10px 14px;margin-bottom:12px;display:flex;align-items:flex-start;gap:10px">'+
        '<span style="font-size:18px">⚠️</span>'+
        '<div><div style="font-size:13px;font-weight:600;color:#92400e">반복 고장 감지 — '+repeatAlerts.length+'건</div>'+
        '<div style="font-size:11px;color:#92400e;margin-top:3px">'+
          repeatAlerts.map(function(a){return'<span style="margin-right:10px">🏭 '+H.e(a.name)+' · '+H.e(a.ftype)+' · <b>'+a.cnt+'회</b></span>';}).join('')+
        '</div></div></div>':'') +
    '<div class="stat-dash">'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._asStatusFilter(\'접수\')"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">🔴</div>'+
        '<div><div class="sd-val">'+cnt.open+'</div><div class="sd-lbl">접수</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._asStatusFilter(\'처리중\')"><div class="sd-icon" style="background:#dbeafe;color:#1d4ed8">🔵</div>'+
        '<div><div class="sd-val">'+cnt.inprogress+'</div><div class="sd-lbl">처리중</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._asStatusFilter(\'부품대기\')"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🟡</div>'+
        '<div><div class="sd-val">'+cnt.waiting+'</div><div class="sd-lbl">부품대기</div></div></div>'+
      '<div class="sd-card" style="cursor:pointer" onclick="Pages._asStatusFilter(\'완료\')"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+cnt.done+'</div><div class="sd-lbl">완료</div></div></div>'+
    '</div>'+
    '<div class="ph" style="margin-top:14px"><div>'+
      '<div class="ptit">🔧 고장/AS 관리</div>'+
      '<div style="font-size:12px;color:var(--muted)">직접입력 · NC연동 · PM발견 — 접수→처리→완료 워크플로우</div>'+
    '</div><div class="pac">'+
      '<button class="btn bpri btn-f2" onclick="Pages._asForm()">+ AS 접수 <span class="kbd">F2</span></button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<button class="btn bout bsm btn-f3" onclick="Pages._emsSearch()" title="설비 검색 (F3)">🔎 F3</button>'+
      '<input type="text" id="asNoF" placeholder="설비번호..." style="width:110px" oninput="Pages._asNoFilter(this.value)">'+
      '<input type="text" id="asKw" placeholder="설비명/증상..." style="width:130px" oninput="Pages._asKwFilter(this.value)">'+
      '<select class="fsel" id="asStF" onchange="Pages._asStatusFilter(this.value)">'+
        '<option value="">전체 상태</option>'+
        '<option value="접수">🔴 접수</option><option value="처리중">🔵 처리중</option>'+
        '<option value="부품대기">🟡 부품대기</option><option value="완료">✅ 완료</option>'+
      '</select>'+
      '<select class="fsel" id="asSrcF" onchange="Pages._asSrcFilter(this.value)">'+
        '<option value="">전체 접수경로</option>'+
        '<option value="직접입력">직접입력</option>'+
        '<option value="NC연동">NC연동</option>'+
        '<option value="PM발견">PM발견</option>'+
      '</select>'+
    '</div>'+
    '<div id="asTbl"></div>';

  window._asRows=rows; window._asEqs=eqs; window._asSt=''; window._asSrc=''; window._asKw='';
  Pages._asRender(rows);
},
/* [v2.65] AS 설비번호 필터 */
_asNoFilter:function(v){window._asNo=v;Pages._asApply();},
_asStatusFilter:function(v){window._asSt=v;var s=document.getElementById('asStF');if(s)s.value=v;Pages._asApply();},
_asSrcFilter:function(v){window._asSrc=v;Pages._asApply();},
_asKwFilter:function(v){window._asKw=v;Pages._asApply();},
_asApply:function(){
  var rows=window._asRows||[];
  var st=window._asSt||''; var src=window._asSrc||''; var kw=(window._asKw||'').toLowerCase();
  var asNo=(window._asNo||'').toLowerCase();
  if(st) rows=rows.filter(function(r){return r.status===st;});
  if(src) rows=rows.filter(function(r){return r.source===src;});
  /* [v2.65] 설비번호 필터 */
  if(asNo){ var eqsN=window._asEqs||[]; rows=rows.filter(function(r){var eq=eqsN.find(function(e){return e.id===r.eq_id;})||{};return (eq.eq_no||'').toLowerCase().includes(asNo);}); }
  if(kw){
    var eqs=window._asEqs||[];
    rows=rows.filter(function(r){
      var eq=(eqs||[]).find(function(e){return e.id===r.eq_id;})||{};
      return (eq.name||'').toLowerCase().includes(kw)||(r.symptom||'').toLowerCase().includes(kw);
    });
  }
  Pages._asRender(rows);
},
_asRender:function(rows){
  var eqs=window._asEqs||[];
  var stCls={접수:'bred',처리중:'bblu',부품대기:'bamb',완료:'bgrn'};
  var srcCls={직접입력:'bgry',NC연동:'bred',PM발견:'bamb'};
  var urgCls={긴급:'bred',높음:'bamb',보통:'bgry',낮음:'bgry'};
  Tbl.render({el:'#asTbl',cols:[
    {key:'eq_id',     label:'설비명',  render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return'<span style="font-weight:600">'+H.e(eq.name||'-')+'</span>';}},
    /* [v2.65] 설비번호 컬럼 */
    {key:'eq_id', label:'설비번호', render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return eq.eq_no?'<span style="font-size:11px;font-family:monospace;color:var(--pri);font-weight:600">'+H.e(eq.eq_no)+'</span>':'-';}},
    {key:'fault_type',label:'고장유형',align:'center'},
    {key:'symptom',   label:'증상',    render:function(v){return'<span style="font-size:12px">'+H.e(v||'-')+'</span>';}},
    {key:'urgency',   label:'긴급도',align:'center',render:function(v){return'<span class="badge '+(urgCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    {key:'status',    label:'상태',align:'center',render:function(v){return'<span class="badge '+(stCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    {key:'source',    label:'접수경로',align:'center',render:function(v){return'<span class="badge '+(srcCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'직접입력')+'</span>';}},
    {key:'assignee',  label:'담당기술자',align:'center'},
    {key:'cost',      label:'AS비용',align:'right',render:function(v){return v?'<span style="font-size:11px">'+Number(v).toLocaleString()+'원</span>':'-';}},
    {key:'created_at',label:'접수일',render:function(v){return v?'<span style="font-size:11px">'+new Date(v).toLocaleDateString('ko-KR')+'</span>':'-';}},
  ],data:rows,
  onDel:async function(ids){
    Modal.confirm({title:'AS 이력 삭제',msg:ids.length+'건 삭제합니까?',danger:true,
      onOk:async function(){
        for(var i=0;i<ids.length;i++) await SB.deleteEqAs(ids[i]);
        window._asRows=(window._asRows||[]).filter(function(x){return!ids.includes(x.id);});
        Pages._asApply(); Toast.show('삭제됨','ok');
      }});
  },
  onRow:function(row){if(row)Pages._asDetail(row);}
  });
},
_asForm:function(editRow,preEqId){
  var eqs=window._asEqs||[];
  Modal.open({title:'🔧 AS 접수 등록',size:'mlg',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비</label>'+
      '<select class="fc" id="asfEq">'+
        eqs.map(function(e){return'<option value="'+e.id+'"'+(preEqId&&preEqId===e.id?' selected':editRow&&editRow.eq_id===e.id?' selected':'')+'>'+H.e(e.name)+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">고장 유형</label>'+
      '<select class="fc" id="asfType">'+
        ['기계적','전기적','소프트웨어','운전 미숙','기타'].map(function(t){return'<option value="'+t+'"'+(editRow&&editRow.fault_type===t?' selected':'')+'>'+t+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">긴급도</label>'+
      '<select class="fc" id="asfUrgency">'+
        ['긴급','높음','보통','낮음'].map(function(u){return'<option value="'+u+'"'+(editRow&&editRow.urgency===u?' selected':'')+'>'+u+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">접수 경로</label>'+
      '<select class="fc" id="asfSource">'+
        '<option value="직접입력" selected>직접입력</option>'+
        '<option value="NC연동">NC연동 (부적합 연결)</option>'+
        '<option value="PM발견">PM발견 (점검 중 발견)</option>'+
      '</select></div>'+
    '<div class="fgroup ff"><label class="fl req">증상 / 고장 내용</label>'+
      '<textarea class="fc" id="asfSymptom" rows="3" placeholder="고장 증상을 상세히 입력하세요">'+H.e(editRow?editRow.symptom||'':'')+'</textarea></div>'+
    '<div class="fgroup"><label class="fl">담당 기술자</label>'+
      '<input class="fc" id="asfAssignee" value="'+H.e(editRow?editRow.assignee||'':'')+'"></div>'+
    '<div class="fgroup"><label class="fl">상태</label>'+
      '<select class="fc" id="asfStatus">'+
        ['접수','처리중','부품대기','완료'].map(function(s){return'<option value="'+s+'"'+(editRow&&editRow.status===s?' selected':s==='접수'?' selected':'')+'>'+s+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl">AS 비용(원)</label>'+
      '<input type="number" class="fc" id="asfCost" value="'+(editRow?editRow.cost||'':'')+'" placeholder="0"></div>'+
    '<div class="fgroup ff"><label class="fl">조치 내용</label>'+
      '<textarea class="fc" id="asfAction" rows="3" placeholder="수행한 조치 내용">'+H.e(editRow?editRow.action_note||'':'')+'</textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._asSave('+(editRow?editRow.id:'null')+')">저장</button>',
  });
},
_asSave:async function(editId){
  var eq_id=document.getElementById('asfEq')?.value;
  var symptom=document.getElementById('asfSymptom')?.value?.trim();
  if(!eq_id||!symptom){Toast.show('설비와 증상을 입력하세요.','warn');return;}
  var row={
    eq_id:parseInt(eq_id),
    fault_type:document.getElementById('asfType')?.value||'기계적',
    urgency:document.getElementById('asfUrgency')?.value||'보통',
    source:document.getElementById('asfSource')?.value||'직접입력',
    symptom:symptom,
    assignee:document.getElementById('asfAssignee')?.value||null,
    status:document.getElementById('asfStatus')?.value||'접수',
    cost:parseFloat(document.getElementById('asfCost')?.value)||null,
    action_note:document.getElementById('asfAction')?.value||null,
  };
  var r=editId?await SB.updateEqAs(editId,row):await SB.addEqAs(row);
  if(r.ok){Toast.show(editId?'수정됨':'접수됨','ok');Modal.close();await Pages.eq_as();}
},
_asDetail:function(row){
  /* [v2.65] AS 상세보기 (읽기전용) → 수정 버튼으로 _asForm 진입 */
  var eqs=window._asEqs||[];
  var eq=(eqs||[]).find(function(e){return e.id===row.eq_id;})||{};
  var stCls={접수:'bred',처리중:'bblu',부품대기:'bamb',완료:'bgrn'};
  var srcLbl={직접입력:'직접입력',NC연동:'NC 연동',PM발견:'PM 점검 중 발견'};
  Modal.open({title:'🔧 AS 상세',size:'mlg',body:
    '<div class="fg2">'+
    /* 설비 기본정보 */
    '<div class="fgroup"><label class="fl">설비번호</label><div class="fc-readonly">'+H.e(eq.eq_no||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">설비명</label><div class="fc-readonly">'+H.e(eq.name||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당부서</label><div class="fc-readonly">'+H.e(eq.dept||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당자</label><div class="fc-readonly">'+H.e(eq.manager||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">제조사/모델</label><div class="fc-readonly">'+H.e(eq.maker||'-')+(eq.model?' / '+H.e(eq.model):'')+'</div></div>'+
    '<div style="height:1px;background:var(--brd);margin:8px 0"></div>'+
    /* AS 내용 */
    '<div class="fgroup"><label class="fl">고장 유형</label><div class="fc-readonly">'+H.e(row.fault_type||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">긴급도</label><div class="fc-readonly">'+H.e(row.urgency||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">상태</label><div class="fc-readonly"><span class="badge '+(stCls[row.status]||'bgry')+'" style="font-size:11px">'+H.e(row.status||'-')+'</span></div></div>'+
    '<div class="fgroup"><label class="fl">접수경로</label><div class="fc-readonly">'+H.e(srcLbl[row.source]||row.source||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">담당 기술자</label><div class="fc-readonly">'+H.e(row.assignee||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">AS 비용</label><div class="fc-readonly">'+(row.cost?Number(row.cost).toLocaleString()+'원':'-')+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">증상/고장내용</label><div class="fc-readonly" style="min-height:50px;white-space:pre-wrap">'+H.e(row.symptom||'-')+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">조치 내용</label><div class="fc-readonly" style="min-height:50px;white-space:pre-wrap">'+H.e(row.action_note||'-')+'</div></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
         '<button class="btn bpri" onclick="Modal.close();Pages._asForm('+JSON.stringify(row).replace(/"/g,"'").replace(/'/g,"\'").replace(/\\/g,"\\")+'  )">✏️ 수정</button>',
  });
},

/* ──────────────────────────────────────────────────────────────
   M4. 유지보수 비용
   ─────────────────────────────────────────────────────────────- */
async eq_cost(){
  var w=document.getElementById('pw');
  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">💰 유지보수 비용 관리</div>'+
      '<div style="font-size:12px;color:var(--muted)">AS비용·부품비·인건비·예산 대비 실적</div>'+
    '</div><div class="pac">'+
      '<button class="btn bpri btn-f2" onclick="Pages._costForm()">+ 비용 등록</button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<button class="btn bout bsm btn-f3" onclick="Pages._emsSearch()" title="설비 검색 (F3)">🔎 F3</button>'+
      '<input type="text" id="costNoF" placeholder="설비번호..." style="width:120px" oninput="Pages._costNoFilter(this.value)">'+
      '<select class="fsel" id="costYM" onchange="Pages._costLoad()">'+
        (function(){
          var opts=''; var now=new Date();
          for(var i=0;i<12;i++){
            var d=new Date(now.getFullYear(),now.getMonth()-i,1);
            var ym=d.getFullYear()+'-'+(String(d.getMonth()+1).padStart(2,'0'));
            opts+='<option value="'+ym+'"'+(i===0?' selected':'')+'>'+ym+'</option>';
          }
          return opts;
        })()+
      '</select>'+
    '</div>'+
    '<div id="costTbl"></div>'+
    '<div id="costSummary" style="margin-top:16px;padding:14px;background:var(--bg2);border-radius:8px;font-size:13px"></div>';
  await Pages._costLoad();
},
_costLoad:async function(){
  var ym=document.getElementById('costYM')?.value||new Date().toISOString().slice(0,7);
  var rows=[]; var eqs=[];
  try{ rows=await SB.getEqCost(ym); }catch(e){}
  try{ eqs=await SB.getEquipment(); }catch(e){}
  window._costRows=rows; window._costEqs=eqs;
  var total={as:0,parts:0,labor:0,pm:0};
  rows.forEach(function(r){
    var amt=r.amount||0;
    if(r.cost_type==='AS수리비')total.as+=amt;
    else if(r.cost_type==='부품비')total.parts+=amt;
    else if(r.cost_type==='인건비')total.labor+=amt;
    else if(r.cost_type==='예방정비비')total.pm+=amt;
  });
  var totalAll=total.as+total.parts+total.labor+total.pm;
  var typCls={'AS수리비':'bred','부품비':'bamb','인건비':'bblu','예방정비비':'bgrn','기타':'bgry'};
  Tbl.render({el:'#costTbl',cols:[
    {key:'date',      label:'날짜'},
    {key:'eq_id',     label:'설비명',   render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return H.e(eq.name||'-');}},
    /* [v2.65] 설비번호 컬럼 */
    {key:'eq_id', label:'설비번호', render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return eq.eq_no?'<span style="font-size:11px;font-family:monospace;color:var(--pri);font-weight:600">'+H.e(eq.eq_no)+'</span>':'-';}},
    {key:'cost_type', label:'비용유형',align:'center',render:function(v){return'<span class="badge '+(typCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    {key:'amount',    label:'금액(원)',align:'right',render:function(v){return'<b>'+Number(v||0).toLocaleString()+'</b>';}},
    {key:'vendor',    label:'업체/공급사'},
    {key:'note',      label:'비고',     render:function(v){return H.e(v||'-');}},
    /* [v2.65] 수정 버튼 컬럼 추가 */
    {key:'id',        label:'', align:'center',
      render:function(v,row){return'<button class="btn bxs bout" onclick="Pages._costEdit('+v+')">✏️</button>';}},
  ],data:rows,onDel:async function(ids){
    for(var i=0;i<ids.length;i++) await SB.deleteEqCost(ids[i]);
    await Pages._costLoad(); Toast.show('삭제됨','ok');
  }});
  var summEl=document.getElementById('costSummary');
  if(summEl) summEl.innerHTML=
    '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">'+
    '<span>🔴 AS수리: <b>'+total.as.toLocaleString()+'원</b></span>'+
    '<span>🔵 부품비: <b>'+total.parts.toLocaleString()+'원</b></span>'+
    '<span>🟢 인건비: <b>'+total.labor.toLocaleString()+'원</b></span>'+
    '<span>🟣 예방정비: <b>'+total.pm.toLocaleString()+'원</b></span>'+
    '<span style="font-size:14px;font-weight:700;color:var(--pri)">📊 합계: '+totalAll.toLocaleString()+'원</span>'+
    '</div>';
},
_costForm:function(){
  var eqs=window._costEqs||[];
  Modal.open({title:'💰 비용 등록',size:'sm',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비</label>'+
      '<select class="fc" id="cfEq" onchange="Pages._costFormEqInfo(this)">'+eqs.map(function(e){return'<option value="'+e.id+'">'+H.e(e.eq_no?'['+e.eq_no+'] ':'')+H.e(e.name)+'</option>';}).join('')+'</select></div>'+
    '<div id="cfEqInfo" style="font-size:11px;color:var(--muted);background:var(--bg2);border-radius:6px;padding:6px 10px;margin:-4px 0 8px"></div>'+
    '<div class="fgroup"><label class="fl req">비용 유형</label>'+
      '<select class="fc" id="cfType">'+['AS수리비','부품비','인건비','예방정비비','기타'].map(function(t){return'<option>'+t+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl req">금액(원)</label><input type="number" class="fc" id="cfAmt" min="0" placeholder="0"></div>'+
    '<div class="fgroup"><label class="fl">날짜</label><input type="date" class="fc" id="cfDate" value="'+H.today()+'"></div>'+
    '<div class="fgroup"><label class="fl">업체/공급사</label><input class="fc" id="cfVendor"></div>'+
    '<div class="fgroup ff"><label class="fl">비고</label><textarea class="fc" id="cfNote" rows="2"></textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._costSave()">저장</button>',
  });
},
_costSave:async function(){
  var eq_id=document.getElementById('cfEq')?.value;
  var amt=parseFloat(document.getElementById('cfAmt')?.value);
  if(!eq_id||!amt){Toast.show('설비와 금액을 입력하세요.','warn');return;}
  var row={
    eq_id:parseInt(eq_id), cost_type:document.getElementById('cfType')?.value,
    amount:amt, date:document.getElementById('cfDate')?.value||H.today(),
    vendor:document.getElementById('cfVendor')?.value||null,
    note:document.getElementById('cfNote')?.value||null,
  };
  var r=await SB.addEqCost(row);
  if(r.ok){Toast.show('등록됨','ok');Modal.close();await Pages._costLoad();}
},

/* [v2.65] 비용 수정 폼 */
_costEdit:function(id){
  var row=(window._costRows||[]).find(function(r){return r.id===id;});
  if(!row){Toast.show('항목을 찾을 수 없습니다.','err');return;}
  var eqs=window._costEqs||[];
  Modal.open({title:'💰 비용 수정',size:'sm',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비</label>'+
      '<select class="fc" id="ceEq">'+eqs.map(function(e){return'<option value="'+e.id+'"'+(row.eq_id===e.id?' selected':'')+'>'+H.e(e.name)+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl req">비용 유형</label>'+
      '<select class="fc" id="ceType">'+['AS수리비','부품비','인건비','예방정비비','기타'].map(function(t){return'<option value="'+t+'"'+(row.cost_type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl req">금액(원)</label><input type="number" class="fc" id="ceAmt" min="0" value="'+(row.amount||0)+'"></div>'+
    '<div class="fgroup"><label class="fl">날짜</label><input type="date" class="fc" id="ceDate" value="'+(row.date||H.today())+'"></div>'+
    '<div class="fgroup"><label class="fl">업체/공급사</label><input class="fc" id="ceVendor" value="'+H.e(row.vendor||'')+'"></div>'+
    '<div class="fgroup ff"><label class="fl">비고</label><textarea class="fc" id="ceNote" rows="2">'+H.e(row.note||'')+'</textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._costEditSave('+id+')">저장</button>',
  });
},
_costEditSave:async function(id){
  var amt=parseFloat(document.getElementById('ceAmt')?.value);
  if(!amt){Toast.show('금액을 입력하세요.','warn');return;}
  var patch={
    eq_id:parseInt(document.getElementById('ceEq')?.value),
    cost_type:document.getElementById('ceType')?.value,
    amount:amt,
    date:document.getElementById('ceDate')?.value||H.today(),
    vendor:document.getElementById('ceVendor')?.value||null,
    note:document.getElementById('ceNote')?.value||null,
  };
  var r=await SB.updateEqCost(id,patch);
  if(r.ok){Toast.show('수정됨','ok');Modal.close();await Pages._costLoad();}
},

/* [v2.65] 비용 목록 설비번호 필터 */
/* [v2.65] 비용등록 폼 — 설비 선택 시 정보 표시 */
_costFormEqInfo:function(sel){
  var eqs=window._costEqs||[];
  var eq=eqs.find(function(e){return String(e.id)===String(sel.value);})||{};
  var el=document.getElementById('cfEqInfo');
  if(el) el.innerHTML=eq.name
    ?'설비번호: <b>'+H.e(eq.eq_no||'-')+'</b> | 부서: <b>'+H.e(eq.dept||'-')+'</b> | 담당자: <b>'+H.e(eq.manager||'-')+'</b> | 제조사: '+H.e(eq.maker||'-')
    :'';
},
_costNoFilter:function(v){
  window._costNo=v;
  var rows=window._costRows||[];
  var no=(v||'').toLowerCase();
  var eqs=window._costEqs||[];
  if(no) rows=rows.filter(function(r){var eq=eqs.find(function(e){return e.id===r.eq_id;})||{};return (eq.eq_no||'').toLowerCase().includes(no);});
  var typCls={'AS수리비':'bred','부품비':'bamb','인건비':'bblu','예방정비비':'bgrn','기타':'bgry'};
  Tbl.render({el:'#costTbl',cols:[
    {key:'date',label:'날짜',w:'90px'},
    {key:'eq_id',label:'설비명',render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return H.e(eq.name||'-');}},
    {key:'eq_id',label:'설비번호',w:'110px',render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return eq.eq_no?'<span style="font-size:11px;font-family:monospace;color:var(--pri);font-weight:600">'+H.e(eq.eq_no)+'</span>':'-';}},
    {key:'cost_type',label:'비용유형',w:'90px',align:'center',render:function(v){return'<span class="badge '+(typCls[v]||'bgry')+'" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
    {key:'amount',label:'금액(원)',w:'100px',align:'right',render:function(v){return'<b>'+Number(v||0).toLocaleString()+'</b>';}},
    {key:'vendor',label:'업체/공급사',w:'100px'},
    {key:'note',label:'비고',render:function(v){return H.e(v||'-');}},
    {key:'id',label:'',w:'60px',align:'center',render:function(v){return'<button class="btn bxs bout" onclick="Pages._costEdit('+v+')">✏️</button>';}},
  ],data:rows,onDel:async function(ids){
    for(var i=0;i<ids.length;i++) await SB.deleteEqCost(ids[i]);
    await Pages._costLoad(); Toast.show('삭제됨','ok');
  }});
},

/* ──────────────────────────────────────────────────────────────
   M5. 설비 매뉴얼
   ─────────────────────────────────────────────────────────────- */
async eq_manual(){
  var w=document.getElementById('pw');
  var rows=[]; var eqs=[];
  try{ rows=await SB.getEqManuals(); }catch(e){}
  try{ eqs=await SB.getEquipment(); }catch(e){}
  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">📖 설비 매뉴얼</div>'+
      '<div style="font-size:12px;color:var(--muted)">매뉴얼 파일 등록 · 버전관리 · 검색</div>'+
    '</div><div class="pac">'+
      '<button class="btn bpri btn-f2" onclick="Pages._manualForm()">+ 매뉴얼 등록</button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<button class="btn bout bsm btn-f3" onclick="Pages._emsSearch()" title="설비 검색 (F3)">🔎 F3</button>'+
      '<input type="text" id="manNoF" placeholder="설비번호..." style="width:110px" oninput="Pages._manualNoFilter(this.value)">'+
      '<input type="text" id="manKw" placeholder="설비명/제목..." style="width:120px" oninput="Pages._manualKw(this.value)">'+
      '<select class="fsel" id="manEqF" onchange="Pages._manualEqFilter(this.value)">'+
        '<option value="">전체 설비</option>'+
        eqs.map(function(e){return'<option value="'+e.id+'">'+H.e(e.name)+'</option>';}).join('')+
      '</select>'+
    '</div>'+
    '<div id="manTbl"></div>';
  window._manRows=rows; window._manEqs=eqs; window._manKw=''; window._manEqF='';
  Pages._manualRender(rows);
},
_manualKw:function(v){window._manKw=v;Pages._manualApply();},
/* [v2.65] 매뉴얼 설비번호 필터 */
_manualNoFilter:function(v){window._manNo=v;Pages._manualApply();},
_manualEqFilter:function(v){window._manEqF=v;Pages._manualApply();},
_manualApply:function(){
  var rows=window._manRows||[];
  var kw=(window._manKw||'').toLowerCase(); var ef=window._manEqF||'';
  var manNo=(window._manNo||'').toLowerCase();
  var eqs=window._manEqs||[];
  if(ef) rows=rows.filter(function(r){return String(r.eq_id)===String(ef);});
  /* [v2.65] 설비번호 필터 */
  if(manNo) rows=rows.filter(function(r){var eq=eqs.find(function(e){return e.id===r.eq_id;})||{};return (eq.eq_no||'').toLowerCase().includes(manNo);});
  if(kw) rows=rows.filter(function(r){
    var eq=(eqs||[]).find(function(e){return e.id===r.eq_id;})||{};
    return (eq.name||'').toLowerCase().includes(kw)||(r.title||'').toLowerCase().includes(kw);
  });
  Pages._manualRender(rows);
},
_manualRender:function(rows){
  var eqs=window._manEqs||[];
  Tbl.render({el:'#manTbl',cols:[
    {key:'eq_id',    label:'설비명', render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return H.e(eq.name||'-');}},
    /* [v2.65] 설비번호 컬럼 */
    {key:'eq_id', label:'설비번호', render:function(v){var eq=(eqs||[]).find(function(e){return e.id===v;})||{};return eq.eq_no?'<span style="font-size:11px;font-family:monospace;color:var(--pri);font-weight:600">'+H.e(eq.eq_no)+'</span>':'-';}},
    {key:'title',    label:'매뉴얼 제목', render:function(v,row){
      return row.file_url
        ?'<a href="'+H.e(row.file_url)+'" target="_blank" style="color:var(--pri);font-weight:600">📎 '+H.e(v||'-')+'</a>'
        :'<span style="font-weight:600">'+H.e(v||'-')+'</span>';}},
    {key:'version',  label:'버전', align:'center'},
    {key:'author',   label:'등록자', align:'center'},
    {key:'created_at',label:'등록일',render:function(v){return v?new Date(v).toLocaleDateString('ko-KR'):'-';}},
  ],data:rows,
  onDel:async function(ids){
    for(var i=0;i<ids.length;i++) await SB.deleteEqManual(ids[i]);
    window._manRows=(window._manRows||[]).filter(function(x){return!ids.includes(x.id);});
    Pages._manualApply(); Toast.show('삭제됨','ok');
  }});
},
_manualForm:function(){
  var eqs=window._manEqs||[];
  Modal.open({title:'📖 매뉴얼 등록',size:'sm',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비</label>'+
      '<select class="fc" id="mfEq">'+eqs.map(function(e){return'<option value="'+e.id+'">'+H.e(e.eq_no?'['+e.eq_no+'] ':'')+H.e(e.name)+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl req">제목</label><input class="fc" id="mfTitle" placeholder="매뉴얼 제목"></div>'+
    '<div class="fgroup"><label class="fl">버전</label><input class="fc" id="mfVer" value="v1.0" placeholder="v1.0"></div>'+
    '<div class="fgroup ff"><label class="fl">파일</label>'+
      '<label style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1.5px dashed var(--brd);border-radius:var(--r);cursor:pointer;font-size:12px;color:var(--muted)">'+
        '📁 파일 선택 (PDF/Word/이미지)'+
        '<input type="file" id="mfFile" style="display:none" accept=".pdf,.doc,.docx,.jpg,.png" onchange="document.getElementById(\'mfFileName\').textContent=this.files[0]?this.files[0].name:\'없음\'">'+
      '</label>'+
      '<span id="mfFileName" style="font-size:11px;color:var(--muted);margin-left:8px">없음</span>'+
    '</div>'+
    '<div class="fgroup ff"><label class="fl">비고</label><textarea class="fc" id="mfNote" rows="2"></textarea></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._manualSave()">저장</button>',
  });
},
_manualSave:async function(){
  var title=document.getElementById('mfTitle')?.value?.trim();
  var eq_id=document.getElementById('mfEq')?.value;
  if(!title||!eq_id){Toast.show('설비와 제목을 입력하세요.','warn');return;}
  var me=Auth._u?(Auth._u.name||Auth._u.username):'관리자';
  var row={eq_id:parseInt(eq_id),title:title,version:document.getElementById('mfVer')?.value||'v1.0',author:me,note:document.getElementById('mfNote')?.value||null,file_url:null,file_name:null};
  var fileInp=document.getElementById('mfFile');
  if(fileInp&&fileInp.files&&fileInp.files[0]){
    try{var up=await SB.uploadFile('eq_manuals',fileInp.files[0]);if(up&&up.url){row.file_url=up.url;row.file_name=fileInp.files[0].name;}}catch(e){console.warn(e);}
  }
  var r=await SB.addEqManual(row);
  if(r.ok){Toast.show('등록됨','ok');Modal.close();await Pages.eq_manual();}
},

/* ──────────────────────────────────────────────────────────────
   M6. 마이머신카드
   ─────────────────────────────────────────────────────────────- */
async eq_machine_card(){
  var w=document.getElementById('pw');
  var eqs=[];
  try{ eqs=await SB.getEquipment(); }catch(e){}
  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">🪪 마이머신카드</div>'+
      '<div style="font-size:12px;color:var(--muted)">설비별 현장 부착 카드 — QR코드 포함 PDF 출력</div>'+
    '</div><div class="pac">'+
      '<span id="cardSelCount" style="font-size:12px;color:var(--pri);font-weight:600;margin-right:8px"></span>'+'<button class="btn bout bsm" onclick="window._cardSelected=new Set();Pages._cardRender(window._cardEqs||[]);var el=document.getElementById(\'cardSelCount\');if(el)el.textContent=\'\'">선택해제</button>'+'<button class="btn bpri bsm" onclick="Pages._cardPrintAll()">🖨️ 선택 일괄출력</button>'+
    '</div></div>'+
    '<div class="tbar">'+
      '<div class="sw2"><input type="text" id="cardKw" placeholder="설비명, 부서 검색..." oninput="Pages._cardKw(this.value)"></div>'+
      '<select class="fsel" id="cardDeptF" onchange="Pages._cardDeptFilter(this.value)">'+
        '<option value="">전체 부서</option>'+
        (function(){var depts=[...new Set(eqs.map(function(e){return e.dept||''}).filter(Boolean))];return depts.map(function(d){return'<option value="'+H.e(d)+'">'+H.e(d)+'</option>';}).join('');})() +
      '</select>'+
    '</div>'+
    /* 카드 그리드 뷰 */
    '<div id="cardGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:14px"></div>';
  window._cardEqs=eqs; window._cardKw=''; window._cardDept='';
  Pages._cardRender(eqs);
},
/* [v2.65 fix] 카드 선택 토글 */
_cardToggle:function(eqId){
  if(!window._cardSelected) window._cardSelected=new Set();
  if(window._cardSelected.has(eqId)) window._cardSelected.delete(eqId);
  else window._cardSelected.add(eqId);
  Pages._cardRender(window._cardEqs||[]);
  /* 선택 카운트 업데이트 */
  var cnt=document.getElementById('cardSelCount');
  if(cnt) cnt.textContent=window._cardSelected.size?'선택 '+window._cardSelected.size+'대':'';
},
_cardKw:function(v){window._cardKw=v;Pages._cardApply();},
_cardDeptFilter:function(v){window._cardDept=v;Pages._cardApply();},
_cardApply:function(){
  var eqs=window._cardEqs||[];
  var kw=(window._cardKw||'').toLowerCase(); var dp=window._cardDept||'';
  if(kw) eqs=eqs.filter(function(e){return (e.name||'').toLowerCase().includes(kw)||(e.dept||'').toLowerCase().includes(kw);});
  if(dp) eqs=eqs.filter(function(e){return e.dept===dp;});
  Pages._cardRender(eqs);
},
_cardRender:function(eqs){
  var grid=document.getElementById('cardGrid');
  if(!grid) return;
  /* [v2.65 fix] 선택 상태 초기화 */
  if(!window._cardSelected) window._cardSelected=new Set();
  var stCls={정상:'#059669',수리중:'#dc2626',점검중:'#d97706'};
  grid.innerHTML=(eqs||[]).map(function(e){
    var sel=window._cardSelected.has(e.id);
    return'<div id="card-'+e.id+'" onclick="Pages._cardToggle('+e.id+')" style="background:var(--sur);border:'+(sel?'2px solid var(--pri)':'1px solid var(--brd)')+';border-radius:10px;padding:14px;box-shadow:var(--sh);cursor:pointer;position:relative">'+
      /* [v2.65 fix] 좌상단 체크박스 */
      '<div style="position:absolute;top:8px;left:8px;width:20px;height:20px;border-radius:4px;border:2px solid '+(sel?'var(--pri)':'var(--brd)')+';background:'+(sel?'var(--pri)':'var(--sur)')+';display:flex;align-items:center;justify-content:center;z-index:1">'+
        (sel?'<span style="color:#fff;font-size:12px;font-weight:700">✓</span>':'')+
      '</div>'+
      /* 카드 헤더 */
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
        '<div>'+
          '<div style="font-size:10px;color:var(--muted);font-family:monospace;font-weight:700">'+H.e(e.eq_no||'EQ-???')+'</div>'+
          '<div style="font-size:14px;font-weight:700;margin-top:2px">'+H.e(e.name||'설비명')+'</div>'+
          '<div style="font-size:11px;color:var(--muted)">'+H.e(e.model||'-')+'</div>'+
          '<div style="font-size:11px;color:var(--muted)">'+H.e(e.dept||'-')+'</div>'+
        '</div>'+
        '<span style="font-size:10px;font-weight:700;background:'+(stCls[e.status]||'#64748b')+'20;color:'+(stCls[e.status]||'#64748b')+';padding:2px 8px;border-radius:999px;border:1px solid '+(stCls[e.status]||'#64748b')+'40">'+H.e(e.status||'-')+'</span>'+
      '</div>'+
      /* 설비 사진 */
      (e.photo_urls&&e.photo_urls[0]
        ?'<img src="'+H.e(e.photo_urls[0])+'" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:10px">'
        :'<div style="height:60px;background:var(--bg2);border-radius:6px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;font-size:24px">🏭</div>')+
      /* 정보 */
      '<div style="font-size:11px;color:var(--muted);display:flex;flex-direction:column;gap:3px;margin-bottom:10px">'+
        '<span>📅 도입일: '+H.e(e.install_date||'-')+'</span>'+
        '<span>👤 담당자: '+H.e(e.manager||'-')+'</span>'+
        '<span>🏷️ 제조사: '+H.e(e.maker||'-')+(e.model?' / '+H.e(e.model):'')+'</span>'+
      '</div>'+
      /* 버튼 */
      '<div style="display:flex;gap:6px">'+
        '<button class="btn bout bsm" style="flex:1" onclick="Pages._cardPrint('+e.id+')">🖨️ 출력</button>'+
        '<button class="btn bpri bsm" style="flex:1" onclick="Pages._eqDetail('+e.id+')">상세보기</button>'+
      '</div>'+
    '</div>';
  }).join('');
},
_cardPrint:function(eqId){
  /* [v2.65] MY MACHINE CARD — 설비명세표 양식 완전 동일 재현 */
  var e=(window._cardEqs||[]).find(function(x){return x.id===eqId;});
  if(!e){Toast.show('설비 정보를 찾을 수 없습니다.','err');return;}
  var qrUrl='https://innodis-qms.vercel.app/?page=eq_mgmt&eq='+eqId;
  var photoHtml=e.photo_urls&&e.photo_urls[0]
    ?'<img src="'+H.e(e.photo_urls[0])+'" style="width:100%;height:100%;object-fit:cover">'
    :'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#aaa;background:#f8f9fa">🏭</div>';

  var html='<html><head><title>MY MACHINE CARD — '+H.e(e.name||'')+'</title>'+
  '<style>'+
  '@page{size:A4;margin:12mm}'+
  'body{font-family:"맑은 고딕","Apple SD Gothic Neo",Arial,sans-serif;font-size:10px;color:#1a1a1a;margin:0}'+
  /* 상단 타이틀 */
  '.card-title{text-align:center;font-size:20px;font-weight:700;letter-spacing:4px;'+
    'color:#fff;background:#1e3a5f;padding:10px;margin-bottom:0}'+
  '.card-subtitle{text-align:center;font-size:11px;color:#fff;background:#2e5b8c;padding:4px;margin-bottom:6px}'+
  /* 메인 테이블 */
  '.main-tbl{border-collapse:collapse;width:100%;table-layout:fixed}'+
  '.main-tbl td,.main-tbl th{border:1px solid #999;padding:4px 6px;vertical-align:middle}'+
  '.lbl{background:#dce6f1;font-weight:700;font-size:9.5px;color:#1e3a5f;width:72px;text-align:center;white-space:nowrap}'+
  '.lbl2{background:#d4edda;font-weight:700;font-size:9.5px;color:#155724;width:30px;text-align:center}'+
  '.val{font-size:10px;font-weight:500}'+
  '.photo-td{width:170px;height:200px;padding:0;border:1px solid #999;vertical-align:top}'+
  '.qr-td{text-align:center;padding:6px;vertical-align:middle;border:1px solid #999}'+
  /* 사전점검 */
  '.pm-tbl{border-collapse:collapse;width:100%;table-layout:fixed;margin-top:6px}'+
  '.pm-tbl td,.pm-tbl th{border:1px solid #999;padding:3px 5px;font-size:9px;vertical-align:middle}'+
  '.pm-tbl th{background:#dce6f1;font-weight:700;text-align:center}'+
  '.pm-lbl{background:#f8f9fa;font-weight:600;color:#1e3a5f}'+
  '.sign-row td{height:32px;text-align:center;font-size:8.5px;border:1px solid #999}'+
  '.sign-lbl{background:#dce6f1;font-weight:700}'+
  '</style></head><body>'+
  '<div class="card-title">MY MACHINE CARD &nbsp;·&nbsp; 설 비 명 세 표</div>'+
  '<div class="card-subtitle">INNODIS Quality Management System</div>'+
  '<table class="main-tbl">'+
    '<tr>'+
      '<td class="photo-td" rowspan="12">'+photoHtml+'</td>'+
      '<td class="lbl">관리번호</td>'+
      '<td class="val" colspan="3"><b style="font-family:monospace;color:#1e3a5f;font-size:11px">'+H.e(e.eq_no||'INE-???')+'</b></td>'+
    '</tr>'+
    /* 관리책임자 정 */
    '<tr>'+
      '<td class="lbl" rowspan="2">관리<br>책임자</td>'+
      '<td class="lbl2">정</td>'+
      '<td class="val" style="width:80px">'+H.e(e.manager||'-')+'</td>'+
      '<td class="lbl" style="width:55px">설비명</td>'+
    '</tr>'+
    /* 관리책임자 부 → 다음행에 설비명 값 */
    '<tr>'+
      '<td class="lbl2">부</td>'+
      '<td class="val">'+H.e(e.backup_manager2||'-')+'</td>'+
      '<td class="val" style="font-weight:700;font-size:11px">'+H.e(e.name||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">모델명</td>'+
      '<td class="val" colspan="3">'+H.e(e.model||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">제조번호</td>'+
      '<td class="val" colspan="3" style="font-family:monospace">'+H.e(e.serial_no||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">제조사</td>'+
      '<td class="val" colspan="3">'+H.e(e.maker||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">제조일자</td>'+
      '<td class="val" colspan="3">'+H.e(e.manufacture_date||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">구입일자</td>'+
      '<td class="val" colspan="3">'+H.e(e.install_date||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">정격전압/용량</td>'+
      '<td class="val" colspan="3">'+H.e(e.rated_voltage||'-')+(e.rated_capacity?' / '+H.e(e.rated_capacity):'')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">소비전력</td>'+
      '<td class="val" colspan="3">'+H.e(e.power_consumption||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">설비크기</td>'+
      '<td class="val" colspan="3">'+H.e(e.size_spec||'-')+'</td>'+
    '</tr>'+
    '<tr>'+
      '<td class="lbl">사용작동유</td>'+
      '<td class="val" colspan="3">'+H.e(e.hydraulic_oil||'-')+'</td>'+
    '</tr>'+
  '</table>'+
  /* 사전점검사항 */
  '<table class="pm-tbl">'+
    '<tr><th colspan="5" style="text-align:left;padding:4px 6px;font-size:10px">📋 사전점검사항</th></tr>'+
    '<tr><th style="width:120px">점검항목</th><th>관리기준</th><th style="width:40px">기록</th><th style="width:55px">관리주기</th><th style="width:45px">관리자</th></tr>'+
    '<tr><td class="pm-lbl">전원상태</td><td>전원이 ON 상태 유무</td><td>설비점검시트</td><td>작업 전</td><td>작업자</td></tr>'+
    '<tr><td class="pm-lbl">기계이상유무</td><td>공회전 10~15분 실시</td><td>설비점검시트</td><td>작업 전</td><td>작업자</td></tr>'+
    '<tr><td class="pm-lbl">안전·비상장치</td><td>작동상태 일치</td><td>설비점검시트</td><td>작업 전</td><td>작업자</td></tr>'+
    '<tr><td class="pm-lbl">비고</td><td colspan="4">'+H.e(e.memo||'')+'</td></tr>'+
  '</table>'+
  /* 서명란 + QR */
  '<table class="main-tbl" style="margin-top:6px">'+
    '<tr>'+
      '<td class="sign-lbl" style="width:40px;text-align:center;font-size:8.5px">담 당</td>'+
      '<td class="sign-row" style="width:60px"></td>'+
      '<td class="sign-lbl" style="width:40px;text-align:center;font-size:8.5px">검 토</td>'+
      '<td class="sign-row" style="width:60px"></td>'+
      '<td class="sign-lbl" style="width:40px;text-align:center;font-size:8.5px">승 인</td>'+
      '<td class="sign-row" style="width:60px"></td>'+
      '<td class="qr-td" style="width:90px" rowspan="2">'+
        '<div id="qr-'+eqId+'" style="width:75px;height:75px;margin:0 auto"></div>'+
        '<div style="font-size:7.5px;color:#888;margin-top:2px">QR → 설비상세</div>'+
      '</td>'+
    '</tr>'+
    '<tr>'+
      '<td colspan="6" style="font-size:8px;color:#888;padding:3px 6px">'+
        '문서번호: INDS-EQ-MMC-'+H.e(e.eq_no||'???')+'&nbsp;&nbsp;출력일: '+new Date().toLocaleDateString('ko-KR')+'&nbsp;&nbsp;INNODIS QMS — MY MACHINE CARD'+
      '</td>'+
    '</tr>'+
  '</table>'+
  '<script>'+
    'try{new QRCode(document.getElementById("qr-'+eqId+'"),{text:"'+qrUrl+'",width:75,height:75,correctLevel:QRCode.CorrectLevel.M});}'+
    'catch(ex){document.getElementById("qr-'+eqId+'").innerHTML="<div style=font-size:9px>QR</div>";}'+
  '<\/script>'+
  '</body></html>';

  var win=window.open('','_blank','width=750,height:1060');
  win.document.write(html);
  win.document.close();
  setTimeout(function(){win.print();},700);
},
_cardPrintAll:function(){
  Toast.show('일괄출력: 설비 목록에서 체크박스 선택 후 진행하세요.','info',3000);
},

/* ──────────────────────────────────────────────────────────────
   M7. OEE/KPI 대시보드
   ──────────────────────────────────────────────────────────────
   [현재 구현] A방안: OEE 수동 입력 방식
   - 작업자가 일별 가동시간/계획수량/실생산량/불량수 직접 입력
   - OEE = 가동률 × 성능률 × 양품률 자동 계산

   [추후 확장 — B방안: QMS 검사현황 자동 연동]
   - 검사 테이블(insp_in, insp_pr 등)에 eq_id 컬럼 추가
   - 검사 불량 데이터에서 설비코드 연결 → 양품률 자동 계산
   - 활성화 조건: SB.getInspByEq(eq_id, date) 구현 후
     아래 _oeeCalc 함수에서 'manual' → 'auto' 모드 전환
   ─────────────────────────────────────────────────────────────- */
async eq_dashboard(){
  var w=document.getElementById('pw');
  var eqs=[]; var asRows=[]; var pmLogs=[];
  try{ eqs=await SB.getEquipment(); }catch(e){}
  try{ asRows=await SB.getEqAs(); }catch(e){}
  try{ pmLogs=await SB.getEqPmLogs(); }catch(e){}

  /* KPI 계산 */
  var totalEq=eqs.length;
  var activeEq=eqs.filter(function(e){return e.status==='정상';}).length;
  var repairEq=eqs.filter(function(e){return e.status==='수리중';}).length;

  /* MTBF, MTTR — AS 완료 건 기준 */
  var doneAs=asRows.filter(function(r){return r.status==='완료'&&r.start_at&&r.end_at;});
  var totalRepairHrs=doneAs.reduce(function(s,r){
    return s+Math.abs(new Date(r.end_at)-new Date(r.start_at))/3600000;
  },0);
  var mttr=doneAs.length?Math.round(totalRepairHrs/doneAs.length*10)/10:0;
  var mtbf=doneAs.length&&totalEq?(Math.round((30*24*totalEq/doneAs.length)*10)/10):0;

  /* PM 준수율 */
  var pmTotal=pmLogs.length;
  var pmDone=pmLogs.filter(function(l){return l.status==='완료';}).length;
  var pmRate=pmTotal?Math.round(pmDone/pmTotal*100):0;

  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">📊 OEE/KPI 대시보드</div>'+
      '<div style="font-size:12px;color:var(--muted)">설비 종합 효율 · 유지보수 KPI</div>'+
    '</div><div class="pac">'+
      '<button class="btn bpri bsm" onclick="Pages._oeeForm()">+ OEE 입력 (일보)</button>'+
    '</div></div>'+

    /* KPI 카드 */
    '<div class="stat-dash" style="margin-top:14px">'+
      '<div class="sd-card"><div class="sd-icon" style="background:#d1fae5;color:#059669">✅</div>'+
        '<div><div class="sd-val">'+activeEq+'/'+totalEq+'</div><div class="sd-lbl">정상 가동 설비</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#dbeafe;color:#1d4ed8">⏱️</div>'+
        '<div><div class="sd-val">'+(mttr?mttr+'h':'-')+'</div><div class="sd-lbl">MTTR (평균수리시간)</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">🔄</div>'+
        '<div><div class="sd-val">'+(mtbf?mtbf+'h':'-')+'</div><div class="sd-lbl">MTBF (평균고장간격)</div></div></div>'+
      '<div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">📋</div>'+
        '<div><div class="sd-val">'+pmRate+'%</div><div class="sd-lbl">PM 준수율 (목표≥90%)</div></div></div>'+
    '</div>'+

    /* OEE 입력 및 현황 */
    '<div style="margin-top:20px">'+
      '<div style="font-size:13px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px">'+
        '📈 OEE 현황'+
        '<span style="font-size:11px;font-weight:400;color:var(--muted);background:var(--bg2);padding:2px 8px;border-radius:4px">'+
          'A방안: 수동입력 | 추후 B방안(검사연동)으로 자동화 예정'+
        '</span>'+
      '</div>'+
      '<div id="oeeTbl"></div>'+
    '</div>'+

    /* AS 발생 현황 */
    '<div style="margin-top:20px">'+
      '<div style="font-size:13px;font-weight:700;margin-bottom:10px">🔧 AS 접수 현황 (전체)</div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap">'+
        ['접수','처리중','부품대기','완료'].map(function(st){
          var cnt=asRows.filter(function(r){return r.status===st;}).length;
          var cls={접수:'#dc2626',처리중:'#1d4ed8',부품대기:'#d97706',완료:'#059669'};
          return'<div style="background:var(--sur);border:1px solid var(--brd);border-radius:8px;padding:12px 20px;text-align:center;min-width:80px">'+
            '<div style="font-size:22px;font-weight:700;color:'+(cls[st]||'#64748b')+'">'+cnt+'</div>'+
            '<div style="font-size:11px;color:var(--muted)">'+st+'</div></div>';
        }).join('')+
      '</div>'+
    '</div>';

  /* OEE 테이블 로드 */
  await Pages._oeeLoad();
},
_oeeLoad:async function(){
  var rows=[];
  try{ rows=await SB.getEqOee(); }catch(e){}
  var eqs=window._cardEqs||[];
  try{ if(!eqs.length) eqs=await SB.getEquipment(); }catch(e){}
  Tbl.render({el:'#oeeTbl',cols:[
    {key:'date',         label:'일자',      w:'90px'},
    {key:'eq_id',        label:'설비명',    render:function(v){var e=(eqs||[]).find(function(x){return x.id===v;})||{};return H.e(e.name||'-');}},
    /* [v2.65] 설비번호 컬럼 */
    {key:'eq_id', label:'설비번호', w:'110px', render:function(v){var eq=(eqs||[]).find(function(x){return x.id===v;})||{};return eq.eq_no?'<span style="font-size:11px;font-family:monospace;color:var(--pri);font-weight:600">'+H.e(eq.eq_no)+'</span>':'-';}},
    {key:'plan_time',    label:'계획가동(h)',w:'90px',align:'center'},
    {key:'actual_time',  label:'실가동(h)', w:'90px',align:'center'},
    {key:'plan_qty',     label:'계획수량',  w:'80px',align:'right'},
    {key:'actual_qty',   label:'실생산량',  w:'80px',align:'right'},
    {key:'defect_qty',   label:'불량수',    w:'70px',align:'right'},
    {key:'oee',          label:'OEE(%)',    w:'80px',align:'center',
      render:function(v){
        var cls=v>=85?'#059669':v>=70?'#d97706':'#dc2626';
        return v?'<b style="color:'+cls+'">'+v+'%</b>':'-';}},
  ],data:rows,onDel:async function(ids){
    for(var i=0;i<ids.length;i++) await SB.deleteEqOee(ids[i]);
    await Pages._oeeLoad(); Toast.show('삭제됨','ok');
  }});
},
_oeeForm:function(){
  var eqs=window._cardEqs||[];
  Modal.open({title:'📈 OEE 일보 입력',size:'sm',body:
    /* ── OEE 입력 설명 ──────────────────────────────────
       [A방안 — 수동입력 (현재)]
       OEE = 가동률(A) × 성능률(P) × 양품률(Q)
         A = 실가동시간 / 계획가동시간
         P = 실생산량 / (실가동시간 × 이상속도)
         Q = (실생산량 - 불량수) / 실생산량
       간편 계산: OEE ≈ (실생산량 - 불량수) / (계획가동시간 × 이상속도)

       [B방안 — 검사연동 (추후 구현)]
       검사 테이블에 eq_id 컬럼 추가 후:
         Q(양품률) = SB.getInspByEq(eq_id, date)에서 자동 계산
         불량수 입력 불필요 → 검사 데이터 자동 반영
    ── */
    '<div style="background:var(--bg2);border-radius:6px;padding:10px;font-size:11px;color:var(--muted);margin-bottom:14px">'+
      '💡 <b>OEE 계산:</b> 가동률 × 성능률 × 양품률 (자동 계산)<br>'+
      '현재: 수동 입력 방식 | 추후: 검사데이터 자동 연동 예정'+
    '</div>'+
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비</label>'+
      '<select class="fc" id="oefEq">'+eqs.map(function(e){return'<option value="'+e.id+'">'+H.e(e.name)+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl req">일자</label><input type="date" class="fc" id="oefDate" value="'+H.today()+'"></div>'+
    '<div class="fgroup"><label class="fl req">계획 가동시간(h)</label><input type="number" class="fc" id="oefPlanTime" min="0" max="24" step="0.5" placeholder="8"></div>'+
    '<div class="fgroup"><label class="fl req">실 가동시간(h)</label><input type="number" class="fc" id="oefActualTime" min="0" max="24" step="0.5" placeholder="7.5" oninput="Pages._oeePreview()"></div>'+
    '<div class="fgroup"><label class="fl req">계획 수량</label><input type="number" class="fc" id="oefPlanQty" min="0" placeholder="100" oninput="Pages._oeePreview()"></div>'+
    '<div class="fgroup"><label class="fl req">실 생산량</label><input type="number" class="fc" id="oefActualQty" min="0" placeholder="95" oninput="Pages._oeePreview()"></div>'+
    '<div class="fgroup"><label class="fl req">불량 수량</label>'+
      '<input type="number" class="fc" id="oefDefect" min="0" placeholder="2" oninput="Pages._oeePreview()">'+
      '<div style="font-size:10px;color:var(--muted);margin-top:3px">📌 B방안 적용 시 검사 데이터에서 자동 입력됩니다.</div></div>'+
    '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px;margin-top:8px">'+
      '<div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:4px">📊 OEE 미리보기</div>'+
      '<div id="oeePreview" style="font-size:13px;color:var(--darkGray)">값을 입력하면 자동 계산됩니다.</div>'+
    '</div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._oeeSave()">저장</button>',
  });
},
_oeePreview:function(){
  var pt=parseFloat(document.getElementById('oefPlanTime')?.value||0);
  var at=parseFloat(document.getElementById('oefActualTime')?.value||0);
  var pq=parseFloat(document.getElementById('oefPlanQty')?.value||0);
  var aq=parseFloat(document.getElementById('oefActualQty')?.value||0);
  var dq=parseFloat(document.getElementById('oefDefect')?.value||0);
  var el=document.getElementById('oeePreview');
  if(!el) return;
  if(pt&&at&&pq&&aq){
    var A=Math.min(at/pt,1);
    var P=Math.min(aq/pq,1);
    var Q=aq>0?(aq-dq)/aq:0;
    var oee=Math.round(A*P*Q*10000)/100;
    var cls=oee>=85?'#059669':oee>=70?'#d97706':'#dc2626';
    el.innerHTML='가동률(A): <b>'+(Math.round(A*1000)/10)+'%</b> × 성능률(P): <b>'+(Math.round(P*1000)/10)+'%</b> × 양품률(Q): <b>'+(Math.round(Q*1000)/10)+'%</b>'+
      ' = <span style="font-size:16px;font-weight:700;color:'+cls+'">OEE '+oee+'%</span>';
  } else {
    el.textContent='값을 입력하면 자동 계산됩니다.';
  }
},
_oeeSave:async function(){
  var eq_id=document.getElementById('oefEq')?.value;
  var date=document.getElementById('oefDate')?.value;
  var pt=parseFloat(document.getElementById('oefPlanTime')?.value||0);
  var at=parseFloat(document.getElementById('oefActualTime')?.value||0);
  var pq=parseFloat(document.getElementById('oefPlanQty')?.value||0);
  var aq=parseFloat(document.getElementById('oefActualQty')?.value||0);
  var dq=parseFloat(document.getElementById('oefDefect')?.value||0);
  if(!eq_id||!date||!pt||!pq){Toast.show('필수 항목을 입력하세요.','warn');return;}
  var A=pt?Math.min(at/pt,1):0; var P=pq?Math.min(aq/pq,1):0; var Q=aq?(aq-dq)/aq:0;
  var oee=Math.round(A*P*Q*10000)/100;
  var row={eq_id:parseInt(eq_id),date:date,plan_time:pt,actual_time:at,plan_qty:pq,actual_qty:aq,defect_qty:dq,oee:oee};
  var r=await SB.addEqOee(row);
  if(r.ok){Toast.show('OEE 저장됨 ('+oee+'%)','ok');Modal.close();await Pages._oeeLoad();}
},

/* ──────────────────────────────────────────────────────────────
   M8. 부서별 보유현황
   ─────────────────────────────────────────────────────────────- */
async eq_dept(){
  var w=document.getElementById('pw');
  var eqs=[];
  try{ eqs=await SB.getEquipment(); }catch(e){}

  /* 부서별 집계 */
  var deptMap={};
  eqs.forEach(function(e){
    var d=e.dept||'미지정';
    if(!deptMap[d]) deptMap[d]={dept:d,total:0,active:0,repair:0,old:0,list:[]};
    deptMap[d].total++;
    if(e.status==='정상') deptMap[d].active++;
    if(e.status==='수리중') deptMap[d].repair++;
    if(e.install_date){
      var age=Math.floor((new Date()-new Date(e.install_date))/86400000/365);
      if(age>=10) deptMap[d].old++;
    }
    deptMap[d].list.push(e);
  });
  var depts=Object.values(deptMap).sort(function(a,b){return b.total-a.total;});

  /* [v2.65] 빈 화면 처리 — 설비 미등록 시 안내 */
  var deptGridHTML;
  if(!depts.length){
    deptGridHTML=
      '<div style="margin-top:40px;text-align:center;color:var(--tm)">'+
        '<div style="font-size:48px;margin-bottom:12px">🏭</div>'+
        '<div style="font-size:15px;font-weight:600;margin-bottom:6px">등록된 설비가 없습니다</div>'+
        '<div style="font-size:13px">설비 등록 관리에서 설비를 먼저 등록해 주세요.</div>'+
        '<button class="btn bpri" style="margin-top:16px" onclick="Nav.go(\'eq_mgmt\')">→ 설비 등록하러 가기</button>'+
      '</div>';
  } else {
    deptGridHTML=
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:14px">'+
      depts.map(function(d){
        var rate=d.total?Math.round(d.active/d.total*100):0;
        var cls=rate>=90?'#059669':rate>=70?'#d97706':'#dc2626';
        return'<div style="background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:14px;box-shadow:var(--sh)">'+
          '<div style="font-size:15px;font-weight:700;margin-bottom:10px;color:var(--pri)">🏢 '+H.e(d.dept)+'</div>'+
          '<div style="display:flex;gap:12px;margin-bottom:10px">'+
            '<div style="text-align:center"><div style="font-size:20px;font-weight:700">'+d.total+'</div><div style="font-size:10px;color:var(--tm)">전체</div></div>'+
            '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#059669">'+d.active+'</div><div style="font-size:10px;color:var(--tm)">정상</div></div>'+
            '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#dc2626">'+d.repair+'</div><div style="font-size:10px;color:var(--tm)">수리중</div></div>'+
            '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#d97706">'+d.old+'</div><div style="font-size:10px;color:var(--tm)">10년↑</div></div>'+
          '</div>'+
          '<div style="font-size:11px;color:var(--tm);margin-bottom:4px">가동률 '+rate+'%</div>'+
          '<div style="background:var(--bg2);border-radius:999px;height:6px;overflow:hidden">'+
            '<div style="background:'+cls+';width:'+rate+'%;height:100%;transition:width .3s"></div>'+
          '</div>'+
          '<button class="btn bout bsm" style="margin-top:10px;width:100%" onclick="Pages._deptDetail(\''+H.e(d.dept)+'\')">설비 목록 보기</button>'+
        '</div>';
      }).join('')+
      '</div>';
  }

  w.innerHTML=
    '<div class="ph"><div>'+
      '<div class="ptit">🗂️ 부서별 설비 보유현황</div>'+
      '<div style="font-size:12px;color:var(--muted)">부서별 보유 대수 · 가동현황 · 노후화 현황</div>'+
    '</div><div class="pac">'+
      '<button class="btn bout bsm" onclick="Pages._deptExcel()">📥 엑셀 다운로드</button>'+
    '</div></div>'+
    deptGridHTML;
},

_deptDetail:function(dept){
  var eqs=(window._eqRows||[]).filter(function(e){return e.dept===dept;});
  Modal.open({title:'🏢 '+dept+' — 설비 목록',size:'mlg',body:
    '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
    '<thead><tr style="background:var(--bg2)"><th style="padding:8px;text-align:left">설비번호</th><th style="padding:8px;text-align:left">설비명</th><th style="padding:8px;text-align:center">상태</th><th style="padding:8px;text-align:center">도입일</th><th style="padding:8px;text-align:center">담당자</th></tr></thead>'+
    '<tbody>'+eqs.map(function(e,i){
      return'<tr style="border-bottom:1px solid var(--brd);background:'+(i%2?'var(--bg2)':'var(--sur)')+'">'+
        '<td style="padding:7px;font-family:monospace;font-size:11px;color:var(--pri)">'+H.e(e.eq_no||'-')+'</td>'+
        '<td style="padding:7px;font-weight:600">'+H.e(e.name||'-')+'</td>'+
        '<td style="padding:7px;text-align:center"><span class="badge '+(e.status==='정상'?'bgrn':e.status==='수리중'?'bred':'bamb')+'" style="font-size:10px">'+H.e(e.status||'-')+'</span></td>'+
        '<td style="padding:7px;text-align:center;font-size:11px">'+H.e(e.install_date||'-')+'</td>'+
        '<td style="padding:7px;text-align:center">'+H.e(e.manager||'-')+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>',
  });
},
_deptExcel:function(){
  var eqs=window._eqRows||[];
  var hdrs=['설비번호','설비명','유형','담당부서','설치위치','상태','도입일','제조사','모델명','담당자','내용연수','특이사항'];
  var data=eqs.map(function(e){return[e.eq_no||'',e.name||'',e.type||'',e.dept||'',e.location||'',e.status||'',e.install_date||'',e.maker||'',e.model||'',e.manager||'',e.lifespan||'',e.memo||''];});
  if(typeof downloadExcel==='function') downloadExcel('부서별설비현황',hdrs,data);
  else Toast.show('엑셀 기능을 찾을 수 없습니다.','warn');
},



/* ── [v2.65] 홈 카드 드래그앤드롭 ─────────────────────────────
   규칙: 위치 교환(swap)만 허용 / 중복 불허 / 순서 localStorage 저장
   ─────────────────────────────────────────────────────────── */
_homeInitDrag(){
  const grid = document.querySelector('.mc-grid');
  if(!grid) return;
  let dragSrcIdx = null;   // 드래그 시작 카드 인덱스

  grid.querySelectorAll('.mc-card').forEach(card => {
    /* ── 드래그 시작 ── */
    card.addEventListener('dragstart', e => {
      dragSrcIdx = parseInt(card.dataset.idx);
      card.classList.add('mc-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrcIdx);
    });

    /* ── 드래그 종료 ── */
    card.addEventListener('dragend', () => {
      grid.querySelectorAll('.mc-card').forEach(c => {
        c.classList.remove('mc-dragging', 'mc-drag-over');
      });
      dragSrcIdx = null;
    });

    /* ── 드래그 오버 (hover 표시) ── */
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetIdx = parseInt(card.dataset.idx);
      if(targetIdx !== dragSrcIdx) card.classList.add('mc-drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('mc-drag-over');
    });

    /* ── 드롭 (위치 교환) ── */
    card.addEventListener('drop', e => {
      e.preventDefault();
      const targetIdx = parseInt(card.dataset.idx);
      if(dragSrcIdx === null || dragSrcIdx === targetIdx) return;

      /* 현재 순서 배열 가져오기 */
      const cards = grid.querySelectorAll('.mc-card');
      const orderArr = Pages._homeGetOrder(cards.length);

      /* 두 카드 위치 교환 (swap) */
      const tmp = orderArr[dragSrcIdx];
      orderArr[dragSrcIdx] = orderArr[targetIdx];
      orderArr[targetIdx]  = tmp;

      /* 저장 + 재렌더 */
      try { localStorage.setItem('qms_card_order', JSON.stringify(orderArr)); } catch(e) {}
      Pages._homeReorderCards(orderArr);

      card.classList.remove('mc-drag-over');
    });
  });
},

/* 저장된 순서 불러오기 (없으면 기본 순서 반환) */
_homeGetOrder(n){
  try {
    const saved = localStorage.getItem('qms_card_order');
    if(saved) {
      const arr = JSON.parse(saved);
      /* 유효성 검사: 길이 일치 + 중복 없음 */
      if(arr.length === n && new Set(arr).size === n &&
         arr.every(v => v >= 0 && v < n)) return arr;
    }
  } catch(e) {}
  return Array.from({length:n}, (_,i) => i);  /* 기본: 0,1,2,...,n-1 */
},

/* 순서 배열 기반으로 카드 DOM 재정렬 */
_homeReorderCards(orderArr){
  const grid = document.querySelector('.mc-grid');
  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll('.mc-card'));
  /* 현재 DOM 카드를 data-idx 기준으로 맵핑 */
  const byIdx = {};
  cards.forEach(c => { byIdx[parseInt(c.dataset.idx)] = c; });

  /* orderArr 순서대로 appendChild */
  orderArr.forEach((origIdx, newPos) => {
    const card = byIdx[origIdx];
    if(card) {
      card.dataset.idx = newPos;   /* idx 업데이트 */
      grid.appendChild(card);
    }
  });

  /* 새 순서로 idx 재설정 */
  const reordered = grid.querySelectorAll('.mc-card');
  reordered.forEach((c, i) => { c.dataset.idx = i; });
},

/* 페이지 로드 시 저장된 순서 복원 */
_homeApplyCardOrder(){
  const grid = document.querySelector('.mc-grid');
  if(!grid) return;
  const cards = grid.querySelectorAll('.mc-card');
  const n = cards.length;
  const orderArr = Pages._homeGetOrder(n);
  /* 기본 순서면 재정렬 불필요 */
  const isDefault = orderArr.every((v,i) => v === i);
  if(!isDefault) Pages._homeReorderCards(orderArr);
},


/* ── [v2.65] PM 점검표 출력 ── */
_pmPrint:function(){
  var eqs=window._pmEqs||[];
  if(!eqs.length){Toast.show('설비가 없습니다.','warn');return;}
  Modal.open({title:'🖨️ 설비점검표 출력',size:'sm',style:'min-width:480px',body:
    '<div class="fg2">'+
    '<div class="fgroup"><label class="fl req">설비 선택</label>'+
      '<select class="fc" id="pmPrintEq">'+
        eqs.map(function(e){return'<option value="'+e.id+'">'+H.e(e.eq_no?'['+e.eq_no+'] ':'')+H.e(e.name)+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fgroup"><label class="fl req">적용 연월</label>'+
      '<input type="month" class="fc" id="pmPrintYM" value="'+new Date().toISOString().slice(0,7)+'"></div>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._pmPrintDo()">🖨️ 출력</button>',
  });
},
_pmPrintDo:function(){
  /* [v2.65 fix] 설비점검표 — A4 가로 1장 강제
     결재란: height 충분히 확보 / html/body overflow:hidden 1장 강제 */
  var eqs=window._pmEqs||[]; var logs=window._pmLogs||[];
  var eqId=parseInt(document.getElementById('pmPrintEq')?.value);
  var ym=document.getElementById('pmPrintYM')?.value||new Date().toISOString().slice(0,7);
  var eq=eqs.find(function(e){return e.id===eqId;})||{};
  Modal.close();
  var yr=parseInt(ym.slice(0,4)); var mo=parseInt(ym.slice(5,7));
  var dim=new Date(yr,mo,0).getDate();
  var logMap={};
  logs.filter(function(l){return l.eq_id===eqId&&l.check_date&&l.check_date.startsWith(ym);})
    .forEach(function(l){logMap[parseInt(l.check_date.slice(8,10))]=l.status;});

  var DAILY=['전원 ON/OFF 상태','Air 압력 상태 (기계 Air 압력 알람 확인)','축(X,Y) 이동 시 소음 및 작동 상태','OIL 급유 및 누유 상태 (급유통 게이지 확인)','각종 BUTTON & S/W 작동 상태','터렛 작동 상태 (시운전 터렛 회전 확인)','안전 장치 작동 상태 (비상 버튼 확인)','설비 작동 기압 값 상태 (0.5MPa)','절삭유 농도 측정 (5~15%)'];
  var MONTHLY=['PCB 오염(먼지) 상태','냉각수 상태 (보충여부)','BATTERY 점검 상태 (전극상태)','비고'];
  var MONTHS=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  var dayThs=''; for(var d=1;d<=dim;d++) dayThs+='<th>'+d+'</th>';
  var dailyRows='';
  DAILY.forEach(function(item,idx){
    var cells=''; for(var d=1;d<=dim;d++){var st=logMap[d]||'';var mk=st==='완료'?'○':st==='미완료'?'△':st==='접수'?'X':'';var col=mk==='○'?'#059669':mk==='X'?'#c00000':mk==='△'?'#d97706':'';cells+='<td style="text-align:center;font-weight:700;color:'+col+'">'+mk+'</td>';}
    var rs=idx===0?' rowspan="9"':'';
    dailyRows+='<tr>'+(idx===0?'<td class="sect"'+rs+'>일<br>일<br>점<br>검</td>':'')+
      '<td class="no">'+(idx+1)+'</td><td class="itm">'+item+'</td>'+cells+'</tr>';
  });
  var monThs=MONTHS.map(function(m2){return'<th>'+m2+'</th>';}).join('');
  var monRows=''; MONTHLY.forEach(function(item,idx){
    var rs=idx===0?' rowspan="4"':'';
    monRows+='<tr>'+(idx===0?'<td class="sect"'+rs+'>월<br>간<br>점<br>검</td>':'')+
      '<td class="no">'+(idx+1)+'</td><td class="itm">'+item+'</td>'+
      MONTHS.map(function(){return'<td></td>';}).join('')+'</tr>';
  });
  var hist=''; for(var h=0;h<4;h++) hist+='<tr style="height:20px"><td></td><td colspan="2"></td><td colspan="3"></td><td colspan="3"></td><td></td><td></td><td></td></tr>';

  var html='<html><head><title>설비점검표</title><style>'+
    '@page{size:297mm 210mm;margin:5mm 6mm}'+
    /* [v2.71] A4 표준 — 각 섹션 height 고정으로 1장 꽉 채우기 */
    'html,body{width:285mm;height:198mm;margin:0;padding:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;font-family:"맑은 고딕","Apple SD Gothic Neo",sans-serif;font-size:9px;color:#000}'+
    'table{border-collapse:collapse;width:100%;table-layout:fixed;height:100%}'+
    'th,td{border:1px solid #777;padding:1px 2px;vertical-align:middle;text-align:center;font-size:8.5px}'+
    'th{background:#dce6f1;font-weight:700}'+
    '.mlbl{background:#dce6f1;font-weight:700;white-space:nowrap;font-size:8.5px}'+
    '.sect{background:#dce6f1;font-weight:700;width:12px;writing-mode:vertical-rl;padding:0;font-size:8.5px}'+
    '.no{width:14px;background:#f5f5f5;font-size:8.5px}'+
    '.itm{text-align:left;padding:1px 4px;font-size:9px;white-space:nowrap;overflow:hidden}'+
    '.sec-wrap{overflow:hidden;display:block}'+
    '</style></head><body>'+

    /* [v2.71] 헤더 섹션: 46mm 고정 */
    '<div class="sec-wrap" style="height:46mm;margin-bottom:1px">'+
    '<table style="height:100%">'+
      '<colgroup>'+
        '<col style="width:52px"><col style="width:88px">'+
        '<col>'+
        '<col style="width:30px"><col style="width:48px">'+
        '<col style="width:30px"><col style="width:48px">'+
        '<col style="width:30px"><col style="width:48px">'+
      '</colgroup>'+
      '<tr>'+
        '<td class="mlbl">설비번호</td>'+
        '<td style="font-family:monospace;font-weight:700;font-size:8px">'+H.e(eq.eq_no||'-')+'</td>'+
        '<td rowspan="3" style="text-align:center;font-size:15px;font-weight:700;letter-spacing:3px;border-left:2px solid #555;border-right:2px solid #555">설 비 점 검 표</td>'+
        '<td class="mlbl" colspan="2" style="font-size:8px">담 당</td>'+
        '<td class="mlbl" colspan="2" style="font-size:8px">검 토</td>'+
        '<td class="mlbl" colspan="2" style="font-size:8px">승 인</td>'+
      '</tr>'+
      '<tr>'+
        '<td class="mlbl">설비명</td>'+
        '<td style="font-weight:700;font-size:8px">'+H.e(eq.name||'-')+'</td>'+
        '<td colspan="2" style="height:28px"><div style="height:28px"></div></td>'+
        '<td colspan="2" style="height:28px"><div style="height:28px"></div></td>'+
        '<td colspan="2" style="height:28px"><div style="height:28px"></div></td>'+
      '</tr>'+
      '<tr>'+
        '<td class="mlbl">사용부서</td>'+
        '<td style="font-size:8px">'+H.e(eq.dept||'-')+'</td>'+
        '<td colspan="2" style="height:20px"><div style="height:20px"></div></td>'+
        '<td colspan="2" style="height:20px"><div style="height:20px"></div></td>'+
        '<td colspan="2" style="height:20px"><div style="height:20px"></div></td>'+
      '</tr>'+
      '<tr>'+
        '<td class="mlbl">설비점검자</td><td></td>'+
        '<td style="text-align:left;padding:2px 5px;font-size:7.5px;border-left:2px solid #555;border-right:2px solid #555">'+
          '개정번호 <b>1</b>&nbsp;&nbsp;적용월 <b>'+yr+'년 '+mo+'월</b>&nbsp;&nbsp;점검시간 <b>08:30~08:40</b>&nbsp;&nbsp;'+
          '<span style="color:#555">범례: ○정상 △점검요 X고장</span></td>'+
        '<td colspan="6" style="font-size:7px;text-align:center;color:#666">일일이상유무점검일 (1회/1일)</td>'+
      '</tr>'+
    '</table>'+

    '</table></div>'+
    /* [v2.71] 일일점검 섹션: 78mm 고정 */
    '<div class="sec-wrap" style="height:69mm;margin-bottom:1px">'+
    '<table style="height:100%">'+
      '<colgroup><col style="width:11px"><col style="width:13px"><col style="width:190px">'+
      Array(dim).fill('<col style="width:14px">').join('')+
      '</colgroup>'+
      '<tr><th></th><th class="no">No.</th>'+
      '<th style="text-align:left;padding-left:4px">점 검 항 목</th>'+
      dayThs+'</tr>'+
    dailyRows+'</table></div>'+
    /* [v2.71] 월간점검 섹션: 36mm 고정 */
    '<div class="sec-wrap" style="height:32mm;margin-bottom:1px">'+
    '<table style="height:100%">'+
      '<colgroup><col style="width:11px"><col style="width:13px"><col style="width:190px">'+
      '<col span="12" style="width:30px"></colgroup>'+
      '<tr><th></th><th class="no">NO.</th>'+
      '<th style="text-align:left;padding-left:4px">점 검 항 목</th>'+
      monThs+'</tr>'+
    monRows+'</table></div>'+
    /* [v2.71] 이력+결재 섹션: 38mm 고정 */
    '<div class="sec-wrap" style="height:24mm">'+
    '<table>'+
    '<tr><td class="mlbl" colspan="12" style="text-align:left;padding:2px 5px">문제발생조치이력</td></tr>'+
    '<tr><th style="width:44px">점검일</th><th colspan="2">고장내역</th><th colspan="3">원 인</th>'+
    '<th colspan="3">대 책</th><th style="width:44px">완료일</th><th style="width:28px">담당</th><th style="width:28px">확인</th></tr>'+
    hist+'</table>'+
    '<div style="display:flex;justify-content:space-between;font-size:7px;color:#555;margin-top:2px">'+
    '<span>INDS-QP-005-03</span><span>㈜이노디스</span><span>A4(297*230)</span></div>'+
    '</table></div>'+
    '</body></html>';

  var win=window.open('','_blank','width=1250,height:950');
  win.document.write(html); win.document.close();
  setTimeout(function(){win.print();},600);
},

_cardPrint:function(eqId){
  /* [v2.65 fix] MY MACHINE CARD — A4 가로 1장 강제
     핵심: html/body height=210mm + overflow:hidden으로 2장 방지
     컨펌된 레이아웃: 좌44%(정/부 flex:1) + 우56%(9행 등간격+QR rowspan2) */
  var e=(window._cardEqs||[]).find(function(x){return x.id===eqId;});
  if(!e){Toast.show('설비 정보를 찾을 수 없습니다.','err');return;}
  var qrUrl='https://innodis-qms.vercel.app/?page=eq_mgmt&eq='+eqId;
  var photoHtml=e.photo_urls&&e.photo_urls[0]
    ?'<img src="'+H.e(e.photo_urls[0])+'" style="width:100%;height:100%;object-fit:cover;display:block">'
    :'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;background:#f5f5f5">&#128100;</div>';

  var html='<html><head><title>MY MACHINE CARD</title><style>'+
    '@page{size:A4 landscape;margin:8mm}'+
    /* 1장 강제: html/body를 정확한 용지 크기로 고정 */
    'html,body{width:281mm;height:194mm;margin:0;padding:0;overflow:hidden;font-family:"맑은 고딕","Apple SD Gothic Neo",Arial,sans-serif;color:#1a1a1a}'+
    '.wrap{display:flex;flex-direction:column;height:194mm}'+
    '.out{display:flex;border:2px solid #333;flex:1;overflow:hidden;min-height:0}'+
    /* 좌측 */
    '.lf{width:44%;border-right:2px solid #333;display:flex;flex-direction:column;overflow:hidden}'+
    '.lt{text-align:center;font-size:16px;font-weight:700;padding:10px 6px;border-bottom:2px solid #333;letter-spacing:2px;flex-shrink:0}'+
    '.rh{text-align:center;font-size:12px;font-weight:700;padding:6px;background:#f0f0f0;border-bottom:1px solid #999;flex-shrink:0}'+
    '.rows{display:flex;flex-direction:column;flex:1;overflow:hidden}'+
    '.rr{display:flex;flex:1;border-bottom:1px solid #999;min-height:0;overflow:hidden}'+
    '.rr:last-child{border-bottom:none}'+
    '.rm{width:48px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;border-right:1px solid #999;background:#fafafa;flex-shrink:0}'+
    '.rn{width:90px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border-right:1px solid #999;flex-shrink:0}'+
    '.rp{flex:1;overflow:hidden;min-width:0}'+
    /* 우측 */
    '.rf{width:56%;display:flex;flex-direction:column;overflow:hidden}'+
    '.rt{text-align:center;font-size:16px;font-weight:700;padding:10px 6px;border-bottom:2px solid #333;letter-spacing:2px;flex-shrink:0}'+
    '.it{border-collapse:collapse;width:100%;table-layout:fixed;flex:1}'+
    '.it td{border:1px solid #888;vertical-align:middle;font-size:13px;padding:0 10px;overflow:hidden}'+
    '.lb{background:#f0f0f0;font-weight:700;width:86px;white-space:nowrap}'+
    '.vl{font-size:14px;font-weight:500}'+
    '.qr-td{width:88px;text-align:center;vertical-align:middle;background:#fafafa;padding:4px}'+
    '.footer{font-size:8px;color:#888;text-align:right;padding:2px 0;flex-shrink:0}'+
    '</style></head><body>'+
    '<div class="wrap">'+
      '<div class="out">'+
        /* 좌측: MY MACHINE CARD */
        '<div class="lf">'+
          '<div class="lt">MY MACHINE CARD</div>'+
          '<div class="rh">관리책임자</div>'+
          '<div class="rows">'+
            '<div class="rr">'+
              '<div class="rm">정</div>'+
              '<div class="rn">'+H.e(e.manager||'-')+'</div>'+
              '<div class="rp">'+photoHtml+'</div>'+
            '</div>'+
            '<div class="rr">'+
              '<div class="rm">부</div>'+
              '<div class="rn">'+H.e(e.backup_manager2||'-')+'</div>'+
              '<div class="rp"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;background:#f5f5f5">&#128100;</div></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        /* 우측: 설비명세표 */
        '<div class="rf">'+
          '<div class="rt">설 비 명 세 표</div>'+
          '<table class="it">'+
            '<tr><td class="lb">관리번호</td><td class="vl" colspan="2" style="font-family:monospace;font-weight:700;color:#1e3a5f">'+H.e(e.eq_no||'-')+'</td></tr>'+
            '<tr><td class="lb">설비명</td><td class="vl" colspan="2" style="font-weight:700">'+H.e(e.name||'-')+'</td></tr>'+
            '<tr><td class="lb">모델명</td><td class="vl" colspan="2">'+H.e(e.model||'')+'</td></tr>'+
            '<tr><td class="lb">제조번호</td><td class="vl" colspan="2" style="font-family:monospace">'+H.e(e.serial_no||'')+'</td></tr>'+
            '<tr><td class="lb">제조사</td><td class="vl" colspan="2">'+H.e(e.maker||'')+'</td></tr>'+
            '<tr><td class="lb">구입일자</td><td class="vl" colspan="2">'+H.e(e.install_date||'')+'</td></tr>'+
            '<tr><td class="lb">정격전압</td><td class="vl" colspan="2">'+H.e(e.rated_voltage||'')+'</td></tr>'+
            /* 정격용량+크기 우측에 QR rowspan=2 */
            '<tr>'+
              '<td class="lb">정격용량</td>'+
              '<td class="vl">'+H.e(e.rated_capacity||'')+'</td>'+
              '<td class="qr-td" rowspan="2">'+
                '<div id="qr-'+eqId+'" style="width:76px;height:76px;margin:0 auto"></div>'+
                '<div style="font-size:8px;color:#888;margin-top:2px">QR → 설비상세</div>'+
              '</td>'+
            '</tr>'+
            '<tr><td class="lb">크기</td><td class="vl">'+H.e(e.size_spec||'')+'</td></tr>'+
          '</table>'+
        '</div>'+
      '</div>'+
      '<div class="footer">출력일: '+new Date().toLocaleDateString('ko-KR')+'&nbsp;&nbsp;INNODIS QMS — MY MACHINE CARD</div>'+
    '</div>'+
    '<script>'+
      'try{new QRCode(document.getElementById("qr-'+eqId+'"),{text:"'+qrUrl+'",width:76,height:76,correctLevel:QRCode.CorrectLevel.M});}'+
      'catch(ex){document.getElementById("qr-'+eqId+'").innerHTML="<div style=\\"font-size:9px;padding:6px\\">QR</div>";}'+
    '<\/script>'+
    '</body></html>';

  var win=window.open('','_blank','width=950,height:760');
  win.document.write(html); win.document.close();
  setTimeout(function(){win.print();},800);
},

_cardPrintAll:function(){
  /* [v2.65 fix] 선택된 카드 일괄 출력 */
  var selected=Array.from(window._cardSelected||new Set());
  if(!selected.length){Toast.show('출력할 설비를 카드에서 선택하세요. (카드 클릭 시 체크)','info',3000);return;}
  var eqs=window._cardEqs||[];
  Toast.show('총 '+selected.length+'대 출력 준비 중...','info',2000);
  /* 선택 순서대로 순차 출력 */
  var idx=0;
  function printNext(){
    if(idx>=selected.length) return;
    var eqId=selected[idx++];
    Pages._cardPrint(eqId);
    if(idx<selected.length) setTimeout(printNext,800);
  }
  setTimeout(printNext,200);
},


/* [v2.65] EMS 설비 검색 — F3 전용 자체 모달 */
_emsSearch:function(){
  var eqs=window._eqRows||window._pmEqs||window._cardEqs||[];
  if(!eqs.length){Toast.show('설비 목록을 먼저 불러오세요.','warn');return;}
  var rows=eqs.map(function(e,i){
    return'<tr style="cursor:pointer;border-bottom:1px solid var(--brd)" onclick="Pages._emsSearchPick('+e.id+')">'+
      '<td style="padding:6px 8px;font-family:monospace;font-size:11px;color:var(--pri)">'+H.e(e.eq_no||'-')+'</td>'+
      '<td style="padding:6px 8px;font-weight:600">'+H.e(e.name||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.type||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.dept||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.status||'-')+'</td>'+
    '</tr>';
  }).join('');
  Modal.open({title:'🔎 설비 검색 (F3)',size:'mlg',body:
    '<div style="margin-bottom:8px;display:flex;gap:6px">'+
      '<input id="emsSrchKw" class="fc" style="flex:1" placeholder="설비번호·설비명·부서 검색..." oninput="Pages._emsSearchFilter(this.value)">'+
    '</div>'+
    '<div style="max-height:360px;overflow-y:auto">'+
      '<table style="width:100%;border-collapse:collapse">'+
        '<thead><tr style="background:var(--bg2);font-size:11px">'+
          '<th style="padding:5px 8px;text-align:left">설비번호</th>'+
          '<th style="padding:5px 8px;text-align:left">설비명</th>'+
          '<th style="padding:5px 8px;text-align:left">유형</th>'+
          '<th style="padding:5px 8px;text-align:left">담당부서</th>'+
          '<th style="padding:5px 8px;text-align:left">상태</th>'+
        '</tr></thead>'+
        '<tbody id="emsSrchBody">'+rows+'</tbody>'+
      '</table>'+
    '</div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>',
  });
  setTimeout(function(){document.getElementById('emsSrchKw')?.focus();},100);
},
_emsSearchFilter:function(kw){
  var eqs=window._eqRows||window._pmEqs||window._cardEqs||[];
  var kl=(kw||'').toLowerCase();
  var filtered=kl?eqs.filter(function(e){
    return(e.eq_no||'').toLowerCase().includes(kl)||
           (e.name||'').toLowerCase().includes(kl)||
           (e.dept||'').toLowerCase().includes(kl);
  }):eqs;
  var el=document.getElementById('emsSrchBody');
  if(!el) return;
  el.innerHTML=filtered.map(function(e){
    return'<tr style="cursor:pointer;border-bottom:1px solid var(--brd)" onclick="Pages._emsSearchPick('+e.id+')">'+
      '<td style="padding:6px 8px;font-family:monospace;font-size:11px;color:var(--pri)">'+H.e(e.eq_no||'-')+'</td>'+
      '<td style="padding:6px 8px;font-weight:600">'+H.e(e.name||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.type||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.dept||'-')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px">'+H.e(e.status||'-')+'</td>'+
    '</tr>';
  }).join('');
},
_emsSearchPick:function(eqId){
  Modal.close();
  /* 현재 페이지에서 해당 설비 상세 열기 */
  var page=Nav._cur||sessionStorage.getItem('qms_page')||'';
  var eqs=window._eqRows||window._pmEqs||window._cardEqs||[];
  var eq=eqs.find(function(e){return e.id===eqId;});
  if(!eq) return;
  if(page==='eq_mgmt'&&Pages._eqDetail) Pages._eqDetail(eq);
  else if(page==='eq_pm'&&Pages._pmEqDetail) Pages._pmEqDetail(eqId);
  else if(page==='eq_machine_card'&&Pages._cardPrint) Pages._cardPrint(eqId);
  else Toast.show('['+H.e(eq.eq_no||'')+'] '+H.e(eq.name||''),'info',2000);
},

_docBulkDelete:async function(){
  /* [v2.65] 체크박스 선택된 문서 삭제 */
  var ids=[...document.querySelectorAll('#docTbl .rck:checked')].map(function(c){return parseInt(c.value);});
  if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
  var hasActive=(window._docRows||[]).some(function(r){return ids.includes(r.id)&&r.status==='active';});
  Modal.confirm({
    title:'문서 삭제',
    body:'<div><b>'+ids.length+'개</b> 문서를 삭제합니다.'+
         (hasActive?'<br><span style="color:#e11d48">활성 문서가 포함되어 있습니다!</span>':'')+
         '<div style="font-size:12px;color:#64748b;margin-top:8px">연결된 버전 이력도 함께 삭제됩니다.</div></div>',
    danger:true,
    onOk:async function(){
      for(var i=0;i<ids.length;i++) await SB.deleteDocMaster(ids[i]);
      (window._docRows||[]).forEach(function(x){if(ids.includes(x.id)) x.status='deleted';});
      Pages._docRender(); Pages._docKanban();
      Toast.show(ids.length+'개 문서가 삭제되었습니다.','ok');
    }
  });
},


/* [v2.65] 코드 관리 탭 렌더링 */
/* [v2.65 D1-3] 코드관리 탭 렌더링 — 유형 + 분류 모두 처리 */
_renderCodeMgmt:async function(){
  /* [v2.78] DB에서 코드 로드 후 _DT/_DC 갱신 */
  var dbCodes=await SB.getCodeTypes();
  dbCodes.filter(function(c){return c.category==='doc_type';}).forEach(function(c){Pages._DT[c.code]=c.label;});
  dbCodes.filter(function(c){return c.category==='doc_cat';}).forEach(function(c){Pages._DC[c.code]=c.label;});
  var dtIds={}, dcIds={};
  dbCodes.forEach(function(c){if(c.category==='doc_type')dtIds[c.code]=c.id;else dcIds[c.code]=c.id;});
  /* [v2.150] 집계 버그 수정: window._docRows 없으면 SB에서 직접 로드
     설정→코드관리 탭 직접 접근 시 _docRows가 비어있어 항상 0건이 나오던 문제 */
  var rows=window._docRows||[];
  if(!rows.length && typeof SB!=='undefined' && SB.getDocMaster){
    try{
      var fresh=await SB.getDocMaster();
      if(Array.isArray(fresh)&&fresh.length){window._docRows=fresh;rows=fresh;}
    }catch(e){console.warn('[코드관리] doc_master 로드 실패:',e);}
  }
  rows=rows.filter(function(r){return r.status!=='deleted';});
  /* 유형 tbody — 글자크기 13px 통일(기존 11px→13px) */
  var tbody=document.getElementById('codeTypeBody');
  if(tbody) tbody.innerHTML=Object.entries(Pages._DT).map(function(e){
    var k=e[0],v=e[1],cnt=rows.filter(function(r){return r.doc_type===k;}).length;
    var id=dtIds[k]||null;
    return '<tr>'+
      '<td style="font-family:monospace;font-size:13px;color:var(--pri)">'+H.e(k)+'</td>'+
      '<td style="font-size:13px">'+H.e(v)+'</td>'+
      '<td style="font-size:13px;text-align:center">'+(cnt?'<span class="badge bblu" style="font-size:11px">'+cnt+'건</span>':'<span style="color:var(--tl)">0건</span>')+'</td>'+
      '<td><button class="btn bxs berr bsm" data-k="'+H.e(k)+'" data-v="'+H.e(v)+'" data-c="'+cnt+'" data-kind="doc_type" data-id="'+(id||'')+'"'+
        ' onclick="var b=this;Pages._codeDelete(b.dataset.kind,b.dataset.k,b.dataset.v,+b.dataset.c,+b.dataset.id||null)">삭제</button></td>'+
    '</tr>';
  }).join('');
  /* 분류 tbody */
  var catbody=document.getElementById('codeCatBody');
  if(catbody) catbody.innerHTML=Object.entries(Pages._DC).map(function(e){
    var k=e[0],v=e[1],cnt=rows.filter(function(r){return r.category===k;}).length;
    var id=dcIds[k]||null;
    return '<tr>'+
      '<td style="font-family:monospace;font-size:13px;color:var(--pri)">'+H.e(k)+'</td>'+
      '<td style="font-size:13px">'+H.e(v)+'</td>'+
      '<td style="font-size:13px;text-align:center">'+(cnt?'<span class="badge bgrn" style="font-size:11px">'+cnt+'건</span>':'<span style="color:var(--tl)">0건</span>')+'</td>'+
      '<td><button class="btn bxs berr bsm" data-k="'+H.e(k)+'" data-v="'+H.e(v)+'" data-c="'+cnt+'" data-kind="doc_cat" data-id="'+(id||'')+'"'+
        ' onclick="var b=this;Pages._codeDelete(b.dataset.kind,b.dataset.k,b.dataset.v,+b.dataset.c,+b.dataset.id||null)">삭제</button></td>'+
    '</tr>';
  }).join('');
},
/* [v2.65] 유형 추가 */
_codeAdd:function(kind){
  var isDT=kind==='doc_type', isDC=kind==='doc_cat';
  if(!isDT&&!isDC) return;
  Modal.open({title:isDT?'문서 유형 추가':'문서 분류 추가',size:'sm',
    body:'<div class="fgroup"><label class="fl req"><b style="color:#e11d48">코드 *</b></label>'+
         '<input class="fc" id="codeKey" placeholder="예) manual (영문/숫자/언더바)"></div>'+
         '<div class="fgroup"><label class="fl req"><b style="color:#e11d48">명칭 *</b></label>'+
         '<input class="fc" id="codeVal" placeholder="예) 매뉴얼"></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
         '<button class="btn bpri" onclick="Pages._codeAddSave(\''+kind+'\')">추가</button>',
  });
},
_codeAddSave:function(kind){
  var k=(document.getElementById('codeKey')?.value||'').trim().replace(/[^a-zA-Z0-9_]/g,'');
  var v=(document.getElementById('codeVal')?.value||'').trim();
  if(!k){Toast.show('코드는 영문/숫자/언더바만 입력 가능합니다.','warn');return;}
  if(!v){Toast.show('명칭을 입력하세요.','warn');return;}
  /* [v2.145] 모달 title 텍스트로 추측하던 방식 제거 — _codeAdd 호출 시 전달받은
     kind('doc_type' 또는 'doc_cat')를 직접 사용. 기존엔 .modal .mtit 셀렉터가
     항상 null이라 분류를 추가해도 무조건 doc_type으로 저장되던 버그가 있었음 */
  if(Pages._DT[k]||Pages._DC[k]){Toast.show('이미 존재하는 코드입니다.','warn');return;}
  var cat=kind==='doc_cat'?'doc_cat':'doc_type';
  SB.addCodeType(cat,k,v).then(function(r){
    if(!r.ok) return;
    Toast.show((cat==='doc_cat'?'분류':'유형')+' 추가됨: '+v,'ok');
    Modal.close();
    Pages._renderCodeMgmt();
  });
},
/* [v2.65] 유형 삭제 — 연결 문서 수 확인 후 진행 */
_codeDelete:function(kind,key,label,cnt,dbId){
  var isDT=kind==='doc_type', isDC=kind==='doc_cat';
  if(!isDT&&!isDC) return;
  var targetField=isDT?'doc_type':'category';
  var targetObj=isDT?Pages._DT:Pages._DC;
  if(cnt>0){
    Modal.confirm({
      title:'문서 유형 삭제',
      body:'<div><b>'+H.e(label)+'</b> 유형을 삭제합니다.<br>'+
           '<span style="color:#e11d48"><b>'+cnt+'개</b> 문서가 이 유형을 사용 중입니다.</span><br>'+
           '<div style="font-size:12px;margin-top:8px;color:#64748b">삭제 시 해당 문서의 유형이 <b>기타(other)</b>로 변경됩니다.</div></div>',
      danger:true,
      onOk:async function(){
        /* [v2.65] 연결 문서 → 기타로 일괄 변경 */
        var linked=(window._docRows||[]).filter(function(r){return r[targetField]===key&&r.status!=='deleted';});
        var patch={};patch[targetField]='기타';
        for(var i=0;i<linked.length;i++){
          await SB.updateDocMaster(linked[i].id,patch);
          linked[i][targetField]='기타';
        }
        delete targetObj[key];
        Pages._renderCodeMgmt();
        Toast.show('삭제 완료. '+linked.length+'개 문서를 기타로 변경했습니다.','ok');
      }
    });
  } else {
    Modal.confirm({title:'문서 유형 삭제',
      body:'<b>'+H.e(label)+'</b> 유형을 삭제합니다. (사용 중인 문서 없음)',
      danger:true,
      onOk:function(){/* [v2.78] DB 삭제 */
      if(dbId){SB.deleteCodeType(dbId).then(function(r){if(r.ok){delete targetObj[key];Pages._renderCodeMgmt();Toast.show('삭제됨','ok');}});}
      else{delete targetObj[key];Pages._renderCodeMgmt();Toast.show('삭제됨','ok');}
    }
    });
  }
},





/* ── 계측기 전용 상세 팝업 ── */
async _equipCalDetail(id){
  var row=(DB.equip||[]).find(function(r){return r.id===id;});
  if(!row){Toast.show('계측기 정보를 찾을 수 없습니다.','err');return;}
  var nxt=row.next||null;
  var d=nxt?Math.ceil((new Date(nxt)-new Date())/864e5):null;
  var statusCls=d===null?'bgry':d<0?'bred':d<30?'bamb':'bgrn';
  var statusTxt=d===null?'미설정':d<0?'교정만료':'교정예정';
  window._curEqRow=row;
  /* [v2.110] 수리이력 미리 로드 */
  window._curRepairs=await SB.getRepairs(row.code);

  var basicRows=[
    ['계측기코드',row.code],['계측기명',row.name],['모델번호',row.model],
    ['제조사',row.maker],['측정범위',row.range],['분해능',row.res],
    ['보관위치',row.loc],['사용자',row.operator],
    ['최근교정일',row.last||'-'],['차기교정일',row.next||'-'],
    ['사용여부',row.active==0?'불용':'사용'],
    /* [v2.110] 이력카드 신규 11필드 */
    ['계측기구분',row.fixture_type||'-'],['Code_No',row.code_no||'-'],
    ['제조번호',row.serial_no||'-'],['사용용도',row.purpose||'-'],
    ['교정구분',row.cal_method||'-'],['교정주기(년)',row.cal_cycle||'-'],
    ['구입일',row.purchase_date||'-'],['구입가격',row.purchase_cost?Number(row.purchase_cost).toLocaleString()+'원':'-'],
    ['사용무_사유',row.inactive_reason||'-'],['부속장비',row.accessories||'-'],
    ['특이사항',row.note||'-'],
  ];
  var basicHtml='<table style="width:100%;font-size:13px;border-collapse:collapse">'+
    basicRows.map(function(r){
      return '<tr><td style="color:#64748b;padding:5px 8px;width:110px;border-bottom:1px solid #f1f5f9">'+r[0]+'</td>'+
             '<td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-weight:500">'+H.e(String(r[1]||'-'))+'</td></tr>';
    }).join('')+
    '<tr><td style="color:#64748b;padding:5px 8px">교정상태</td>'+
      '<td style="padding:5px 8px"><span class="badge '+statusCls+'">'+statusTxt+(d!==null&&d>=0?' (D-'+d+')':'')+'</span></td></tr>'+
  '</table>';

  Modal.open({title:'🔬 계측기 상세 — '+H.e(row.name||'-'),size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
         (row.file_url?'<a href="'+H.e(row.file_url)+'" target="_blank" class="btn bblu bsm">📎 파일 보기</a>':'')+
         '<button class="btn bsm" style="background:#475569;color:#fff" onclick="Pages._equipMsaHistoryCard(window._curEqRow)">🪪 이력카드</button>'+
         '<button class="btn bpri bsm" onclick="Modal.close();Pages._equipCalForm('+id+')">✏️ 수정</button>',
    body:'<div class="stabs" style="margin-bottom:10px">'+
      '<button class="stab-btn on" data-tab="basic" onclick="Pages._eqDetailTab(\'basic\',this)">📋 기본정보</button>'+
      '<button class="stab-btn" data-tab="repair" onclick="Pages._eqDetailTab(\'repair\',this)">🔧 수리이력</button>'+
      '</div>'+
      '<div id="eqDetailBasic">'+basicHtml+'</div>'+
      '<div id="eqDetailRepair" style="display:none"></div>',
  });
},
_eqDetailTab(tab,btn){
  document.querySelectorAll('.stab-btn').forEach(function(b){b.classList.remove('on');});
  if(btn)btn.classList.add('on');
  var basic=document.getElementById('eqDetailBasic');
  var repair=document.getElementById('eqDetailRepair');
  if(tab==='basic'){
    if(basic)basic.style.display='block';
    if(repair)repair.style.display='none';
  } else {
    if(basic)basic.style.display='none';
    if(repair){repair.style.display='block';Pages._repairRenderList();}
  }
},
_repairRenderList(){
  var row=window._curEqRow;
  var list=window._curRepairs||[];
  var el=document.getElementById('eqDetailRepair');
  if(!el||!row)return;
  var rows=list.map(function(r){
    return '<tr>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.request_date||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.dept||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.reason||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.content||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.agency||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.complete_date||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.checker||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;font-size:12px">'+H.e(r.result||'-')+'</td>'+
      '<td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:center">'+
        '<button class="btn bxs berr" style="font-size:10px;padding:1px 6px" onclick="Pages._repairDel('+r.id+')">🗑️</button></td>'+
    '</tr>';
  }).join('');
  el.innerHTML=
    '<div style="margin-bottom:8px;text-align:right">'+
      '<button class="btn bpri bsm" onclick="Pages._repairFormToggle()">+ 수리이력 등록</button></div>'+
    '<div id="repairFormArea"></div>'+
    '<table style="width:100%;font-size:12px;border-collapse:collapse">'+
    '<thead><tr style="background:var(--bg2)">'+
      ['수리요청일자','의뢰부서','의뢰사유','수리내역','수리기관','완료일자','확인자','결과',''].map(function(h){
        return '<th style="padding:4px 6px;text-align:left;font-weight:600">'+h+'</th>';
      }).join('')+
    '</tr></thead><tbody>'+
    (rows||'<tr><td colspan="9" style="padding:12px;text-align:center;color:var(--tm)">수리이력이 없습니다.</td></tr>')+
    '</tbody></table>';
},
_repairFormToggle(){
  var area=document.getElementById('repairFormArea');
  if(!area)return;
  if(area.innerHTML){area.innerHTML='';return;}
  area.innerHTML='<div class="fg2" style="background:var(--bg2);padding:10px;border-radius:8px;margin-bottom:10px">'+
    '<div class="fgroup"><label class="fl">수리요청일자</label><input class="fc" type="date" id="rpReqDate" value="'+H.today()+'"></div>'+
    '<div class="fgroup"><label class="fl">의뢰부서</label><input class="fc" id="rpDept"></div>'+
    '<div class="fgroup"><label class="fl">의뢰사유</label><input class="fc" id="rpReason"></div>'+
    '<div class="fgroup ff"><label class="fl">수리내역</label><input class="fc" id="rpContent"></div>'+
    '<div class="fgroup"><label class="fl">수리기관</label><input class="fc" id="rpAgency"></div>'+
    '<div class="fgroup"><label class="fl">완료일자</label><input class="fc" type="date" id="rpCompDate"></div>'+
    '<div class="fgroup"><label class="fl">확인자</label><input class="fc" id="rpChecker"></div>'+
    '<div class="fgroup"><label class="fl">결과</label><select class="fc" id="rpResult">'+
      '<option value="">선택</option><option value="완료">완료</option><option value="진행중">진행중</option></select></div>'+
    '<div class="fgroup ff" style="text-align:right">'+
      '<button class="btn bout bsm" onclick="Pages._repairFormToggle()">취소</button> '+
      '<button class="btn bpri bsm" onclick="Pages._repairSave()">저장</button></div>'+
  '</div>';
},
async _repairSave(){
  var g=function(id){return (document.getElementById(id)?.value||'').trim();};
  var row=window._curEqRow;
  if(!row){Toast.show('계측기 정보가 없습니다.','err');return;}
  var data={
    equip_code:row.code,
    request_date:g('rpReqDate')||null,
    dept:g('rpDept'),reason:g('rpReason'),content:g('rpContent'),
    agency:g('rpAgency'),complete_date:g('rpCompDate')||null,
    checker:g('rpChecker'),result:g('rpResult'),
  };
  var res=await SB.addRepair(data);
  if(!res.ok){Toast.show('수리이력 저장 실패','err');return;}
  Toast.show('수리이력이 등록되었습니다.','ok');
  window._curRepairs=await SB.getRepairs(row.code);
  document.getElementById('repairFormArea').innerHTML='';
  Pages._repairRenderList();
},
async _repairDel(id){
  var row=window._curEqRow;
  var res=await SB.deleteRepair(id);
  if(!res.ok)return;
  Toast.show('수리이력이 삭제되었습니다.','ok');
  window._curRepairs=await SB.getRepairs(row.code);
  Pages._repairRenderList();
},
_equipMsaHistoryCard(row){
  var code=row.code;
  var esc=function(s){return H.e(String(s==null?'':s));};
  var cals=(DB.cals||[]).filter(function(c){return c.equip_code===code;})
    .sort(function(a,b){return (b.cal_date||'').localeCompare(a.cal_date||'');});
  var repairs=(window._curRepairs||[]).filter(function(r){return r.equip_code===code;});

  /* 교정이력 6행/수리이력 3행 단위로 페이지 분할 */
  var calPages=[]; for(var i=0;i<Math.max(cals.length,1);i+=6) calPages.push(cals.slice(i,i+6));
  if(calPages.length===0) calPages=[[]];
  var repPages=[]; for(var i=0;i<Math.max(repairs.length,1);i+=3) repPages.push(repairs.slice(i,i+3));
  if(repPages.length===0) repPages=[[]];
  var totalPages=Math.max(calPages.length,repPages.length,1);

  var fmtCost=function(v){return v?Number(v).toLocaleString()+'원':'';};
  /* [v2.110] 데이터행 colspan을 헤더 colspan 합계(35)와 정확히 일치시킴
     교정이력 헤더: 4,4,4,4,4,4,7,4=35 / 수리이력 헤더: 4,3,5,9,4,3,4,3=35 */
  var calRow=function(c){
    return '<tr>'+
      '<td class="xl79" colspan="4">'+esc(c.cal_type)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(c.request_date)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(c.cal_date)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(c.agency)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(c.cert_no)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(c.result)+'</td>'+
      '<td class="xl74" colspan="7">'+esc(c.next_date)+'</td>'+
      '<td class="xl74" colspan="4">'+fmtCost(c.cost)+'</td>'+
    '</tr>';
  };
  var calEmptyRow='<tr>'+
    [4,4,4,4,4,4,7,4].map(function(cs){return '<td class="xl74" colspan="'+cs+'">&nbsp;</td>';}).join('')+
    '</tr>';
  var repRow=function(r){
    return '<tr>'+
      '<td class="xl79" colspan="4">'+esc(r.request_date)+'</td>'+
      '<td class="xl74" colspan="3">'+esc(r.dept)+'</td>'+
      '<td class="xl74" colspan="5">'+esc(r.reason)+'</td>'+
      '<td class="xl74" colspan="9">'+esc(r.content)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(r.agency)+'</td>'+
      '<td class="xl74" colspan="3">'+esc(r.complete_date)+'</td>'+
      '<td class="xl74" colspan="4">'+esc(r.checker)+'</td>'+
      '<td class="xl74" colspan="3">'+esc(r.result)+'</td>'+
    '</tr>';
  };
  var repEmptyRow='<tr>'+
    [4,3,5,9,4,3,4,3].map(function(cs){return '<td class="xl74" colspan="'+cs+'">&nbsp;</td>';}).join('')+
    '</tr>';

  var calTableHtml=function(pageIdx){
    var rows=calPages[pageIdx]||[];
    var html=rows.map(calRow).join('');
    var pad=6-rows.length;
    for(var i=0;i<pad;i++) html+=calEmptyRow;
    return html;
  };
  var repTableHtml=function(pageIdx){
    var rows=repPages[pageIdx]||[];
    var html=rows.map(repRow).join('');
    var pad=3-rows.length;
    for(var i=0;i<pad;i++) html+=repEmptyRow;
    return html;
  };

  /* 제품사진 */
  var fileUrl=row.file_url||'';
  var isImg=/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
  var photoHtml;
  if(fileUrl&&isImg){
    photoHtml='<img src="'+esc(fileUrl)+'" style="max-width:100%;max-height:230px;object-fit:contain">';
  }else if(fileUrl){
    photoHtml='<div style="font-size:9pt;padding:10px">📎 <a href="'+esc(fileUrl)+'" target="_blank">'+esc(row.file_name||'첨부파일 열기')+'</a></div>';
  }else{
    photoHtml='<div style="color:#999;font-size:9pt">사진 없음</div>';
  }

  /* 기본정보 4열(라벨/값/라벨/값) — sheet001 R06~R14 매핑 */
  var basicRows=[
    ['ID','',                         '보관위치',row.loc],
    ['구분',row.fixture_type,         '사용자',row.operator],
    ['계측기코드',row.code,           '사용용도',row.purpose],
    ['계측기명',row.name,             '측정범위',row.range],
    ['모델번호',row.model,            '교정구분',row.cal_method],
    ['Code_No',row.code_no,           '교정주기(년)',row.cal_cycle],
    ['제조번호',row.serial_no,        '사용여부',(row.active==0?'N':'Y')],
    ['제조사',row.maker,              '사용무_사유',row.inactive_reason],
    ['구입일',row.purchase_date,      '구입가격',fmtCost(row.purchase_cost)],
  ];
  var basicHtml=basicRows.map(function(r){
    var cls1=(r[0]==='계측기코드')?'xl119':(r[0]==='계측기명'||r[0]==='Code_No'||r[0]==='제조사')?'xl111':
             (r[0]==='제조번호')?'xl91':'xl65';
    var cls3=(r[2]==='사용용도'||r[2]==='사용자'||r[2]==='제조사'||r[2]==='사용무_사유')?'xl112':
             (r[2]==='교정구분'||r[2]==='교정주기(년)')?'xl92':'xl66';
    return '<tr>'+
      '<td class="'+cls1+'" colspan="4">'+esc(r[0])+'</td>'+
      '<td class="xl74" colspan="5">'+esc(r[1])+'</td>'+
      '<td class="'+cls3+'" colspan="4">'+esc(r[2])+'</td>'+
      '<td class="xl74" colspan="7">'+esc(r[3])+'</td>'+
    '</tr>';
  }).join('');
  basicHtml+=
    '<tr><td class="xl65" colspan="4" rowspan="2">부속장비</td><td class="xl66" colspan="16" rowspan="2">'+esc(row.accessories)+'</td></tr><tr></tr>'+
    '<tr><td class="xl65" colspan="4" rowspan="2">특이사항</td><td class="xl76" colspan="31" rowspan="2">'+esc(row.note)+'</td></tr><tr></tr>';

  /* 페이지 1장 빌드 */
  var buildPage=function(pageIdx,isFirst){
    var titleArea=isFirst?
      ('<table class="card-tbl"><colgroup><col span="35" style="width:23pt"></colgroup>'+
       '<tr><td class="xl67" colspan="26" rowspan="4">계측기 이력카드</td>'+
       '<td class="xl78" colspan="3">검교정 성적서</td>'+
       '<td class="xl71" colspan="2">작성</td><td class="xl71" colspan="2">검토</td><td class="xl71" colspan="2">승인</td></tr>'+
       '<tr><td class="xl70" colspan="3" rowspan="3">&nbsp;</td>'+
       '<td class="xl66" colspan="2" rowspan="2">&nbsp;</td><td class="xl66" colspan="2" rowspan="2">&nbsp;</td><td class="xl66" colspan="2" rowspan="2">&nbsp;</td></tr>'+
       '<tr></tr>'+
       '<tr><td class="xl87" colspan="2">/</td><td class="xl88" colspan="2">/</td><td class="xl88" colspan="2">/</td></tr>'+
       '</table>')
      :
      ('<table class="card-tbl"><colgroup><col span="35" style="width:23pt"></colgroup>'+
       '<tr><td class="xl94" colspan="35" style="text-align:left;font-size:12pt">계측기 이력카드 (계속) — '+esc(row.code)+' / '+esc(row.name)+'</td></tr>'+
       '</table>');

    var basicPhotoArea=isFirst?
      ('<table class="card-tbl"><colgroup><col span="35" style="width:23pt"></colgroup>'+
       '<tr><td class="xl99" colspan="20">&lt;기본 정보&gt;</td><td class="xl100" colspan="15">제품사진</td></tr>'+
       '<tr>'+basicRowsFirst()+'<td class="xl90" colspan="15" rowspan="11" style="text-align:center;vertical-align:middle">'+photoHtml+'</td></tr>'+
       basicRowsRest()+
       '</table>')
      :'';

    var calHeader=
      '<tr><td class="xl115" colspan="4">교정구분</td><td class="xl116" colspan="4">교정의뢰일</td>'+
      '<td class="xl117" colspan="4">교정일</td><td class="xl117" colspan="4">교정기관</td>'+
      '<td class="xl117" colspan="4">성적서번호</td><td class="xl117" colspan="4">결과</td>'+
      '<td class="xl117" colspan="7">다음교정일</td><td class="xl117" colspan="4">비용</td></tr>';

    var repHeader=
      '<tr><td class="xl91" colspan="4">수리요청일자</td><td class="xl92" colspan="3">의뢰부서</td>'+
      '<td class="xl92" colspan="5">의뢰사유</td><td class="xl92" colspan="9">수리내역</td>'+
      '<td class="xl92" colspan="4">수리기관</td><td class="xl92" colspan="3">완료일자</td>'+
      '<td class="xl92" colspan="4">확인자</td><td class="xl92" colspan="3">결과</td></tr>';

    var calArea=
      '<table class="card-tbl"><colgroup><col span="35" style="width:23pt"></colgroup>'+
      '<tr><td class="xl94" colspan="35"></td></tr>'+
      '<tr><td class="xl114" colspan="35">&lt;교정이력&gt;'+
        (calPages.length>1?' ('+(pageIdx+1)+'/'+calPages.length+'페이지)':'')+'</td></tr>'+
      calHeader+calTableHtml(pageIdx)+
      '</table>';

    var repArea=
      '<table class="card-tbl"><colgroup><col span="35" style="width:23pt"></colgroup>'+
      '<tr><td class="xl94" colspan="35"></td></tr>'+
      '<tr><td class="xl95" colspan="35">&lt;수리이력&gt;'+
        (repPages.length>1?' ('+(pageIdx+1)+'/'+repPages.length+'페이지)':'')+'</td></tr>'+
      repHeader+repTableHtml(pageIdx)+
      '</table>';

    return '<div class="card-page">'+titleArea+basicPhotoArea+calArea+repArea+'</div>';
  };

  function basicRowsFirst(){
    /* basicHtml의 첫 행(R06)만 분리 — 사진 셀과 같은 <tr>에 위치해야 함 */
    var firstRowMatch=basicHtml.match(/^<tr>(.*?)<\/tr>/);
    return firstRowMatch?firstRowMatch[1]:'';
  }
  function basicRowsRest(){
    return basicHtml.replace(/^<tr>.*?<\/tr>/,'');
  }

  var pagesHtml='';
  for(var pi=0;pi<totalPages;pi++) pagesHtml+=buildPage(pi,pi===0);

  var css=
    '@page{size:A4 landscape;margin:6mm}'+
    'body{font-family:"맑은 고딕","Malgun Gothic",sans-serif;margin:0;background:#fff}'+
    '@media print{.no-print{display:none!important}}'+
    '.card-page{page-break-after:always;padding:4px}'+
    '.card-page:last-child{page-break-after:auto}'+
    '.card-tbl{border-collapse:collapse;table-layout:fixed;width:100%;margin-bottom:2px}'+
    '.card-tbl td{border:.5pt solid #000;padding:2px 3px;text-align:center;vertical-align:middle;font-size:9pt;overflow:hidden;white-space:nowrap}'+
    '.xl65{border-left:1pt solid #000}'+
    '.xl66{border:.5pt solid #000}'+
    '.xl67{font-size:22pt;text-decoration:underline;border:1pt solid #000}'+
    '.xl70{border:.5pt solid #000}'+
    '.xl71{border:1pt solid #000}'+
    '.xl74{font-size:9pt;white-space:normal}'+
    '.xl76{text-align:left;vertical-align:top;white-space:normal;border-left:.5pt solid #000}'+
    '.xl78{font-size:9pt;border:1pt solid #000}'+
    '.xl79{font-size:9pt;border-left:1pt solid #000}'+
    '.xl87{border-bottom:1pt solid #000}'+
    '.xl88{border-bottom:1pt solid #000}'+
    '.xl90{}'+
    '.xl91{background:#CAEDFB;border-left:1pt solid #000}'+
    '.xl92{background:#CAEDFB}'+
    '.xl94{font-size:18pt;text-decoration:underline;border-top:1pt solid #000;text-align:left}'+
    '.xl95{font-size:11pt;font-weight:700;text-align:left;border-bottom:1pt solid #000}'+
    '.xl99{font-size:11pt;font-weight:700;text-align:left;border-bottom:1pt solid #000}'+
    '.xl100{font-weight:700;background:#CAEDFB;border-bottom:1pt solid #000}'+
    '.xl111{background:yellow;border-left:1pt solid #000}'+
    '.xl112{background:yellow}'+
    '.xl115{background:#CAEDFB;border:1pt solid #000;border-left:1pt solid #000}'+
    '.xl116{background:#CAEDFB;border:1pt solid #000}'+
    '.xl117{background:yellow;border:1pt solid #000}'+
    '.xl119{font-weight:700;background:yellow;border-left:1pt solid #000;border:.5pt solid #000}'+
    'img{display:block;margin:0 auto}'+
    '.print-btn{position:fixed;bottom:16px;right:16px;padding:8px 18px;background:#1a56db;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;z-index:999}';

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>계측기 이력카드 — '+esc(row.code)+'</title>'+
    '<style>'+css+'</style></head><body>'+pagesHtml+
    '<button class="print-btn no-print" onclick="window.print()">🖨️ 인쇄</button>'+
    '</body></html>';

  var win=window.open('','_blank','width=1300,height=900');
  if(!win){Toast.show('팝업이 차단됐습니다. 팝업 허용 후 다시 시도하세요.','warn');return;}
  win.document.write(html);
  win.document.close();
},

  /* ── [v2.89] 공지사항 함수 — Cfg 의존 제거, Pages에 직접 구현 ── */
  _noticeOpen:function(idx){
    /* idx=null: 신규, idx=숫자: 수정 */
    const notices=App.notices||[];
    const n=idx!=null?notices[idx]:{title:'',body:'',author:(Auth._u?.name||'관리자'),date:H.today(),expire:'',show:true};
    Modal.open({title:idx!=null?'공지 수정':'공지 등록',size:'mmd',
      body:`<div class="fg2">
        <div class="fgroup ff"><label class="fl req">제목</label><input class="fc" id="nt" value="${H.e(n.title||'')}"></div>
        <div class="fgroup ff"><label class="fl req">내용</label><textarea class="fc" id="nb" rows="3">${H.e(n.body||'')}</textarea></div>
        <div class="fgroup"><label class="fl req">게시 시작일</label><input class="fc" type="date" id="nd" value="${n.date||H.today()}"></div>
        <div class="fgroup"><label class="fl req">게시 종료일</label><input class="fc" type="date" id="ne" value="${n.expire||''}"></div>
        <div class="fgroup"><label class="fl">등록자</label><input class="fc" id="na" value="${H.e(n.author||'')}"></div>
        <div class="fgroup"><label class="fl">게시 여부</label><select class="fc" id="ns">
          <option value="1" ${n.show?'selected':''}>게시</option>
          <option value="0" ${!n.show?'selected':''}>게시중지</option>
        </select></div>
      </div>`,
      foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
            <button class="btn bpri btn-f8" onclick="Pages._noticeSave(${JSON.stringify(idx)})">저장 <span class="kbd">F8</span></button>`
    });
  },
  _noticeSave:async function(idx){
    const g=id=>document.getElementById(id)?.value.trim()||'';
    const obj={title:g('nt'),body:g('nb'),date:g('nd'),expire:g('ne'),author:g('na'),
                show:document.getElementById('ns')?.value==='1'};
    if(!obj.title||!obj.body){Toast.show('필수 항목을 입력하세요.','warn');return;}
    if(idx!=null){
      if(App.notices[idx]) Object.assign(App.notices[idx],obj);
      if(_sb) await SB.updateNotice(App.notices[idx]?.id||idx,obj);
    } else {
      App.notices=(App.notices||[]);
      const r=await SB.addNotice(obj);
      if(r?.id) obj.id=r.id;
      App.notices.push(obj);
    }
    Modal.close();
    Toast.show(idx!=null?'공지가 수정되었습니다.':'공지가 등록되었습니다.','ok');
    await Pages.settings();
    setTimeout(()=>document.querySelector('.stab-btn[data-tab="general"]')?.click(),100);
  },
  _noticeRemove:async function(i){
    Modal.confirm({title:'공지 삭제',msg:'공지사항을 삭제하시겠습니까?',danger:true,onOk:async()=>{
      const notices=App.notices||[];
      if(_sb&&notices[i]?.id) await SB.deleteNotice(notices[i].id);
      notices.splice(i,1);
      Toast.show('삭제되었습니다.','ok');
      await Pages.settings();
      setTimeout(()=>document.querySelector('.stab-btn[data-tab="general"]')?.click(),100);
    }});
  },



  async _stdFileOnly(row){
    if(!row) return;
    window._stdFileRemoveOnly=false;
    var existHtml=row.file_url?
      '<div class="fo-exist" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:var(--bg2);border-radius:var(--r)">'+
      '<span style="font-size:12px">📎 '+H.e(row.file_name||'현재 파일')+'</span>'+
      '<a href="'+H.e(row.file_url)+'" target="_blank" class="btn bxs bblu bsm">보기</a>'+
      '<button type="button" class="btn bxs berr bsm" onclick="window._stdFileRemoveOnly=true;this.closest(\".fo-exist\").remove()">🗑️ 삭제</button>'+
      '</div>':
      '<p style="font-size:12px;color:var(--tm);margin-bottom:12px">첨부 파일 없음</p>';
    Modal.open({
      title:'📎 파일 첨부/변경 — '+H.e(row.item_code||''),size:'msm',
      body:'<div style="padding:8px 0">'+existHtml+
        '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">새 파일 선택</label>'+
        '<input type="file" id="stdFileOnly" class="fc" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.zip"></div>',
      foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
           '<button class="btn bpri" onclick="Pages._stdFileSave('+JSON.stringify(row)+')" >저장</button>'
    });
  },

  async _stdFileSave(row){
    var fileEl=document.getElementById('stdFileOnly');
    var patch={};
    if(window._stdFileRemoveOnly){patch.file_url=null;patch.file_name=null;}
    if(fileEl&&fileEl.files&&fileEl.files.length){
      Toast.show('파일 업로드 중...','info');
      var up=await SB.uploadFile('insp_std',fileEl.files[0]);
      if(up&&up.url){patch.file_url=up.url;patch.file_name=fileEl.files[0].name;}
      else{Toast.show('업로드 실패','err');return;}
    }
    if(!Object.keys(patch).length){Modal.close();return;}
    var res=await SB.updateInspStd(row.id,patch);
    if(!res.ok) return;
    Toast.show('파일이 저장되었습니다.','ok');
    Modal.close();
    await Pages.insp_std();
  },
  async _stdFileOnly(row){
    if(!row) return;
    window._stdFileRemoveOnly=false;
    var delBtn='<button type="button" class="btn bxs berr bsm" onclick="window._stdFileRemoveOnly=true;document.getElementById(\'stdFOExist\').remove()">🗑️ 삭제</button>';
    var existHtml=row.file_url?
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:var(--bg2);border-radius:var(--r)" id="stdFOExist">'+
      '<span style="font-size:12px">📎 '+H.e(row.file_name||'현재 파일')+'</span>'+
      '<a href="'+H.e(row.file_url)+'" target="_blank" class="btn bxs bblu bsm">보기</a>'+
      delBtn+'</div>':
      '<p style="font-size:12px;color:var(--tm);margin-bottom:12px">첨부 파일 없음</p>';
    Modal.open({
      title:'📎 파일 첨부/변경 — '+H.e(row.item_code||''),size:'msm',
      body:'<div style="padding:8px 0">'+existHtml+
        '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">새 파일 선택</label>'+
        '<input type="file" id="stdFileOnly" class="fc" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.zip"></div>',
      foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
           '<button class="btn bpri" onclick="Pages._stdFileSave('+JSON.stringify(row)+')" >저장</button>'
    });
  },

  async _stdFileSave(row){
    var fileEl=document.getElementById('stdFileOnly');
    var patch={};
    if(window._stdFileRemoveOnly){patch.file_url=null;patch.file_name=null;}
    if(fileEl&&fileEl.files&&fileEl.files.length){
      Toast.show('파일 업로드 중...','info');
      var up=await SB.uploadFile('insp_std',fileEl.files[0]);
      if(up&&up.url){patch.file_url=up.url;patch.file_name=fileEl.files[0].name;}
      else{Toast.show('업로드 실패','err');return;}
    }
    if(!Object.keys(patch).length){Modal.close();return;}
    var res=await SB.updateInspStd(row.id,patch);
    if(!res.ok) return;
    Toast.show('파일이 저장되었습니다.','ok');
    Modal.close();
    await Pages.insp_std();
  },

/* ── 시정조치요청서 인쇄 [v2.96] ── */
_ncPrint(row){
  if(!row) return;
  var w=window.open('','_blank','width=1200,height=850,scrollbars=yes');
  if(!w){Toast.show('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.','warn');return;}
  /* [v2.107] 데이터 직접 삽입 방식 — replace/textContent 의존 없음 */
  var e=function(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
  var no=e(row.no),date=e(row.date),customer=e(row.customer||''),
      item_code=e(row.item_code||''),item=e(row.item||''),
      work_order=e(row.work_order||''),type=e(row.type||''),
      desc=e(row.desc||''),dwg=e(row.dwg_lc||''),action=e(row.action||''),
      ship_qty=e(row.ship_qty||''),insp_qty=e(row.insp_qty||row.qty||''),
      bad_qty=e(row.qty||''),rate=e(row.rate||''),note=e(row.note||''),
      responsible=e(row.responsible||''),assignee=e(row.assignee||''),
      cause=e(row.cause||''),due=e(row.due_date||''),
      created_by=e(row.created_by||'');
  var html='<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'+
    '<title>시정조치 요청서 — '+no+'</title>'+
    '<style>'+
    '*{box-sizing:border-box;margin:0;padding:0;font-family:"맑은 고딕","Malgun Gothic",sans-serif}'+
    'body{background:#fff;color:#000;font-size:8pt}'+
    '@page{size:A4 landscape;margin:8mm 8mm 6mm 8mm}'+
    '@media print{.no-print{display:none!important}}'+
    '.wrap{width:281mm}'+
    'table{border-collapse:collapse;width:100%}'+
    'td{border:.5pt solid #000;padding:1px 4px;vertical-align:middle;font-size:7.5pt}'+
    '.lb{background:#dce6f1;font-weight:bold;text-align:center;white-space:nowrap;font-size:7pt}'+
    '.val{background:#fff}'+
    '.area{vertical-align:top;padding:3px 4px;background:#fff}'+
    '.ap-hdr{background:#dce6f1;font-weight:bold;text-align:center;font-size:8pt;height:16px}'+
    '.ap-sign{height:28px;background:#fff}'+
    '.title{font-size:16pt;font-weight:bold;text-align:center;letter-spacing:3px;border:none;background:#fff}'+
    '.no-border{border:none;background:#fff}'+
    '.print-btn{position:fixed;bottom:14px;right:14px;padding:8px 18px;background:#1a56db;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer}'+
    '</style></head><body><div class="wrap">';
  /* ① 결재란 + 제목 — 가로 재설계 */
  html+='<table style="margin-bottom:2px;table-layout:fixed;width:100%">'+
    '<colgroup>'+
    '<col style="width:36px"><col style="width:36px"><col style="width:36px"><col style="width:36px">'+
    '<col style="width:auto">'+
    '<col style="width:36px"><col style="width:36px"><col style="width:36px">'+
    '</colgroup>'+
    '<tr>'+
    '<td colspan="4" class="ap-hdr">조치부서 결재</td>'+
    '<td class="title">시 정 조 치 요 청 서</td>'+
    '<td colspan="3" class="ap-hdr">발행부서 결재</td>'+
    '</tr><tr>'+
    '<td class="ap-hdr">작성</td><td class="ap-hdr">검토</td>'+
    '<td class="ap-hdr">검토</td><td class="ap-hdr">승인</td>'+
    '<td rowspan="2" class="no-border"></td>'+
    '<td class="ap-hdr">작성</td><td class="ap-hdr">검토</td><td class="ap-hdr">승인</td>'+
    '</tr><tr>'+
    '<td class="ap-sign" style="text-align:center;font-size:7pt">'+created_by+'</td>'+
    '<td class="ap-sign"></td><td class="ap-sign"></td><td class="ap-sign"></td>'+
    '<td class="ap-sign" style="text-align:center;font-size:7pt">'+created_by+'</td>'+
    '<td class="ap-sign"></td><td class="ap-sign"></td>'+
    '</tr></table>';
  /* ② 기본정보 */
  html+='<table><colgroup>'+
    '<col style="width:14mm"><col style="width:24mm"><col style="width:14mm"><col style="width:24mm">'+
    '<col style="width:14mm"><col style="width:22mm"><col style="width:14mm"><col style="width:30mm">'+
    '<col style="width:14mm"><col></colgroup>'+
    '<tr><td class="lb">등록번호</td><td class="val">'+no+'</td>'+
    '<td class="lb">등록일자</td><td class="val">'+date+'</td>'+
    '<td class="lb">발행부서</td><td class="val">품질팀</td>'+
    '<td class="lb">고객사명</td><td class="val">'+customer+'</td>'+
    '<td class="lb">품목코드</td><td class="val">'+item_code+'</td></tr>'+
    '<tr><td class="lb">품목명</td><td class="val" colspan="3">'+item+'</td>'+
    '<td class="lb" colspan="2" style="text-align:center">작업지시번호</td>'+
    '<td class="val" colspan="1">'+work_order+'</td>'+
    '<td class="lb">불량유형</td><td class="lb">불량현상</td><td class="val">'+desc+'</td></tr>'+
    '<tr><td class="lb">DWG_LC</td><td class="val">'+dwg+'</td>'+
    '<td class="lb">처리방법</td><td class="val" colspan="3">'+action+'</td>'+
    '<td class="lb">납품수량</td><td class="val">'+ship_qty+'</td>'+
    '<td class="lb">검사수량</td><td class="val">'+insp_qty+'</td></tr>'+
    '<tr><td class="lb">불량수량</td><td class="val">'+bad_qty+'</td>'+
    '<td class="lb">불량율</td><td class="val">'+rate+'</td>'+
    '<td class="lb" colspan="2" style="text-align:center">부적합_비고</td>'+
    '<td class="val" colspan="4">'+note+'</td></tr>'+
    '</table>';
  /* ③ 손실비용 */
  html+='<table><tr>'+
    '<td class="lb" rowspan="2" style="width:14mm">상세내역</td>'+
    '<td class="lb" rowspan="2" style="width:14mm">손실비용</td>'+
    '<td class="lb">자재비</td><td class="lb">가공비</td><td class="lb">기타</td><td class="lb">계</td></tr>'+
    '<tr><td class="val" style="height:12px"></td><td class="val"></td><td class="val"></td><td class="val" style="text-align:right">0</td></tr>'+
    '</table>';
  /* ④ 현상/조치 영역 */
  html+='<table><colgroup><col style="width:48%"><col style="width:36%"><col style="width:8mm"><col style="width:8mm"><col style="width:12mm"></colgroup>'+
    '<tr><td class="lb">현상 ( Photo / Sketch )</td>'+
    '<td class="lb">시정조치, 원인분석 및 재발방지대책</td>'+
    '<td class="lb" style="font-size:6.5pt">귀책처</td>'+
    '<td class="lb" style="font-size:6.5pt">C/Check</td>'+
    '<td class="lb" style="font-size:6.5pt">작업자</td></tr>'+
    '<tr><td class="val area" style="height:28mm"></td>'+
    '<td class="val area"></td>'+
    '<td class="val">'+responsible+'</td>'+
    '<td class="val"></td>'+
    '<td class="val">'+assignee+'</td></tr></table>';
  /* ⑤ 부적합 구분 */
  html+='<table><tr><td class="lb" colspan="2" style="width:30mm">부적합 구분</td>'+
    '<td class="val" style="font-size:7pt;padding:2px 6px">&nbsp;□사람 &nbsp;□설비 &nbsp;□자재 &nbsp;□방법 &nbsp;□기타(　　　　　)</td></tr></table>';
  /* ⑥ 즉시시정조치 + 원인분석 */
  html+='<table><colgroup><col style="width:14mm"><col style="width:46%"><col style="width:14mm"><col style="width:12mm"><col><col></colgroup>'+
    '<tr><td class="lb" rowspan="4" style="writing-mode:vertical-rl;letter-spacing:2px">즉시시정조치</td>'+
    '<td class="val area" style="height:9mm" rowspan="2">'+action+'</td>'+
    '<td class="lb" rowspan="7">원인분석</td>'+
    '<td class="lb"></td><td class="lb" style="text-align:center">발 생 원 인</td><td class="lb" style="text-align:center">유 출 원 인</td></tr>'+
    '<tr><td class="lb" style="font-size:6pt;text-align:center">1 Why</td>'+
    '<td class="val area" style="height:9mm">'+cause+'</td><td class="val area"></td></tr>'+
    '<tr><td class="val area" style="height:7mm"></td>'+
    '<td class="lb" style="font-size:6pt;text-align:center">2 Why</td>'+
    '<td class="val area"></td><td class="val area"></td></tr>'+
    '<tr><td class="val area" style="height:7mm"></td>'+
    '<td class="lb" style="font-size:6pt;text-align:center">3 Why</td>'+
    '<td class="val area"></td><td class="val area"></td></tr>'+
    '<tr><td class="lb" rowspan="3" colspan="2" style="text-align:center;font-size:7pt">참원인(결론)</td>'+
    '<td class="lb" style="font-size:6pt;text-align:center">참원인</td>'+
    '<td class="val area" style="height:7mm">'+cause+'</td><td class="val area"></td></tr>'+
    '<tr><td class="val area" colspan="3" style="height:6mm"></td></tr>'+
    '<tr><td class="val area" colspan="3" style="height:6mm"></td></tr>'+
    '</table>';
  /* ⑦ 재발방지대책 */
  html+='<table><colgroup><col style="width:14mm"><col style="width:12mm"><col><col style="width:14mm"><col><col style="width:14mm"></colgroup>'+
    '<tr><td class="lb" rowspan="4" style="writing-mode:vertical-rl;letter-spacing:2px">재발방지대책</td>'+
    '<td class="lb"></td><td class="lb" style="text-align:center">발 생 방 지</td>'+
    '<td class="lb" style="text-align:center">일정</td>'+
    '<td class="lb" style="text-align:center">유 출 방 지</td>'+
    '<td class="lb" style="text-align:center">일정</td></tr>'+
    '<tr><td class="lb" style="font-size:6.5pt;text-align:center">단기</td>'+
    '<td class="val area" style="height:8mm">'+action+'</td><td class="val">'+due+'</td>'+
    '<td class="val area"></td><td class="val"></td></tr>'+
    '<tr><td class="lb" style="font-size:6.5pt;text-align:center">중기</td>'+
    '<td class="val area" style="height:7mm"></td><td class="val"></td>'+
    '<td class="val area"></td><td class="val"></td></tr>'+
    '<tr><td class="lb" style="font-size:6.5pt;text-align:center">장기</td>'+
    '<td class="val area" style="height:7mm"></td><td class="val"></td>'+
    '<td class="val area"></td><td class="val"></td></tr>'+
    '</table>';
  /* ⑧ 회람 + 표준류 반영 */
  html+='<table><colgroup><col style="width:10mm"><col style="width:22mm"><col style="width:10mm"><col style="width:22mm">'+
    '<col style="width:12mm"><col><col><col><col><col style="width:12mm"></colgroup>'+
    '<tr><td class="lb" rowspan="4">회람</td>'+
    '<td class="lb" style="text-align:center">성명</td><td class="lb" rowspan="2">서명</td>'+
    '<td class="lb" style="text-align:center">성명</td>'+
    '<td class="lb" rowspan="4" style="writing-mode:vertical-rl;font-size:6.5pt;text-align:center">표준류반영</td>'+
    '<td class="lb" colspan="2" style="font-size:7pt">□ 관리계획서</td>'+
    '<td class="lb" colspan="2" style="font-size:7pt">□ FMEA</td>'+
    '<td class="lb" rowspan="4">첨부</td></tr>'+
    '<tr><td class="val" style="height:9mm">'+assignee+'</td>'+
    '<td class="val"></td>'+
    '<td class="val" colspan="2" style="font-size:7pt">□ 작업표준서</td>'+
    '<td class="val" colspan="2" style="font-size:7pt">□ 검사기준서</td></tr>'+
    '<tr><td class="lb" style="text-align:center">성명</td><td class="lb" rowspan="2">서명</td>'+
    '<td class="lb" style="text-align:center">성명</td>'+
    '<td class="val" colspan="4" rowspan="2"></td></tr>'+
    '<tr><td class="val" style="height:9mm"></td><td class="val"></td></tr>'+
    '</table>';
  /* ⑨ 하단 */
  html+='<table><tr>'+
    '<td style="border:.5pt solid #000;background:#dce6f1;font-size:7pt;width:33%">IPD-806-01(Rev01)</td>'+
    '<td style="border:.5pt solid #000;background:#dce6f1;font-size:7pt;text-align:center;width:34%">㈜이노디스</td>'+
    '<td style="border:.5pt solid #000;background:#dce6f1;font-size:7pt;text-align:right;width:33%">A4(210mm X 297mm)</td>'+
    '</tr></table>';
  html+='</div><button class="print-btn no-print" onclick="window.print()">🖨️ 인쇄</button></body></html>';
  w.document.open();
  w.document.write(html);
  w.document.close();
},

  /* [v2.107] ExcelMgr 래퍼 — 전역 참조 오류 방지 */
  _ncExcelDown(){
    var em=window.ExcelMgr;
    if(em&&em.download) em.download('nc');
    else Toast.show('엑셀 모듈 로딩 실패. 새로고침 후 시도하세요.','warn');
  },
  _ncExcelUp(){
    var em=window.ExcelMgr;
    if(em&&em.openUpload) em.openUpload('nc');
    else Toast.show('엑셀 모듈 로딩 실패. 새로고침 후 시도하세요.','warn');
  },

  _saveAdminEmail(){
    var email=(document.getElementById('sAdminEmail')?.value||'').trim();
    if(!email){Toast.show('이메일을 입력하세요.','warn');return;}
    localStorage.setItem('qms_admin_email',email);
    /* adminContactEmail span 업데이트 */
    var span=document.getElementById('adminContactEmail');
    if(span) span.textContent=email;
    Toast.show('관리자 이메일이 저장되었습니다.','ok');
  },

  /* [v2.107] ExcelMgr 래퍼 — 전역 참조 오류 방지 (IIFE 학습 패턴) */
  _calExcelDown(){
    var em=window.ExcelMgr;
    if(em&&em.download) em.download('cal');
    else Toast.show('엑셀 모듈 로딩 실패. 새로고침 후 시도하세요.','warn');
  },
  _calExcelUp(){
    var em=window.ExcelMgr;
    if(em&&em.openUpload) em.openUpload('cal');
    else Toast.show('엑셀 모듈 로딩 실패. 새로고침 후 시도하세요.','warn');
  },
}; /* Pages 객체 끝 */
/* ════ 계측기 전용 등록/수정 폼 ════ */
Object.assign(Pages,{
  /* [v2.67] _equipCalForm — 계측기 F2 폼 (EMS _eqForm과 완전 분리)
     equipment 테이블 저장: code/name/model/maker/range/res/loc/operator/last/next/active */
  async _equipCalForm(editId){
    var row=editId?(DB.equip||[]).find(function(r){return r.id===editId;}):null;
    var e=!!row;
    Modal.open({title:e?'🔬 계측기 수정':'🔬 계측기 등록',size:'mlg',
      foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
           '<button class="btn bpri btn-f8" onclick="Pages._equipCalSave('+(e?editId:'null')+')">저장 <span class="kbd">F8</span></button>',
      body:'<div class="fg2">'+
        '<div class="fgroup"><label class="fl"><b style="color:#e11d48">계측기코드 *</b></label>'+
          '<input class="fc" id="ecCode" placeholder="예) MC-001" value="'+H.e(row?row.code||'':'')+'" '+(e?'readonly':'')+' ></div>'+
        '<div class="fgroup"><label class="fl"><b style="color:#e11d48">계측기명 *</b></label>'+
          '<input class="fc" id="ecName" placeholder="예) 디지털 버니어 캘리퍼스" value="'+H.e(row?row.name||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">모델번호</label>'+
          '<input class="fc" id="ecModel" placeholder="예) 500-151-20" value="'+H.e(row?row.model||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">제조사</label>'+
          '<input class="fc" id="ecMaker" placeholder="예) Mitutoyo" value="'+H.e(row?row.maker||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">측정범위</label>'+
          '<input class="fc" id="ecRange" placeholder="예) 0~150mm" value="'+H.e(row?row.range||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">분해능</label>'+
          '<input class="fc" id="ecRes" placeholder="예) 0.01mm" value="'+H.e(row?row.res||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">보관위치</label>'+
          '<input class="fc" id="ecLoc" placeholder="예) 품질실 선반A" value="'+H.e(row?row.loc||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">사용자</label>'+
          '<input class="fc" id="ecOperator" placeholder="담당자명" value="'+H.e(row?row.operator||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">최근교정일</label>'+
          '<input type="date" class="fc" id="ecLast" value="'+H.e(row?row.last||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl"><b style="color:#e11d48">차기교정일 *</b></label>'+
          '<input type="date" class="fc" id="ecNext" value="'+H.e(row?row.next||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">사용여부</label>'+
          '<select class="fc" id="ecActive">'+
            '<option value="1"'+(!row||row.active!=0?' selected':'')+'>사용</option>'+
            '<option value="0"'+(row&&row.active==0?' selected':'')+'>불용</option>'+
          '</select></div>'+
        /* [v2.110] 계측기 이력카드용 10개 필드 추가 (특이사항=ecNote로 통합, 11번째) */
        '<div class="fgroup"><label class="fl">계측기구분</label>'+
          '<input class="fc" id="ecFixtureType" placeholder="예) 측정기기" value="'+H.e(row?row.fixture_type||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">Code_No</label>'+
          '<input class="fc" id="ecCodeNo" placeholder="예) 500-182-30" value="'+H.e(row?row.code_no||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">제조번호</label>'+
          '<input class="fc" id="ecSerialNo" placeholder="예) B16013027" value="'+H.e(row?row.serial_no||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">사용용도</label>'+
          '<input class="fc" id="ecPurpose" placeholder="예) 외경, 내경, 깊이" value="'+H.e(row?row.purpose||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">교정구분</label>'+
          '<select class="fc" id="ecCalMethod">'+
            '<option value=""'+(!row||!row.cal_method?' selected':'')+'>선택</option>'+
            '<option value="사내교정"'+(row&&row.cal_method==='사내교정'?' selected':'')+'>사내교정</option>'+
            '<option value="사외교정"'+(row&&row.cal_method==='사외교정'?' selected':'')+'>사외교정</option>'+
          '</select></div>'+
        '<div class="fgroup"><label class="fl">교정주기(년)</label>'+
          '<input class="fc" type="number" step="0.5" id="ecCalCycle" placeholder="예) 1" value="'+H.e(row?row.cal_cycle||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">구입일</label>'+
          '<input class="fc" type="date" id="ecPurchaseDate" value="'+H.e(row?row.purchase_date||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">구입가격</label>'+
          '<input class="fc" type="number" id="ecPurchaseCost" placeholder="0" value="'+H.e(row?row.purchase_cost||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">사용무_사유</label>'+
          '<input class="fc" id="ecInactiveReason" placeholder="불용 시 사유" value="'+H.e(row?row.inactive_reason||'':'')+'"></div>'+
        '<div class="fgroup"><label class="fl">부속장비</label>'+
          '<input class="fc" id="ecAccessories" placeholder="케이스, 충전기 등" value="'+H.e(row?row.accessories||'':'')+'"></div>'+
        '<div class="fgroup ff"><label class="fl">비고(특이사항)</label>'+
          '<input class="fc" id="ecNote" value="'+H.e(row?row.note||'':'')+'"></div>'+
      '<div class="fgroup ff"><label class="fl">첨부파일</label>'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
          (row&&row.file_url
            ?'<a href="'+H.e(row.file_url)+'" target="_blank" class="btn bxs bblu bsm">📎 현재 파일 보기</a>'+
             '<button class="btn bxs bred bsm" onclick="Pages._equipCalFileDelete()">🗑️ 삭제</button>'
            :'')+
          '<label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px dashed var(--bd);border-radius:6px;cursor:pointer;font-size:12px;color:var(--tm)">'+
            '📁 파일 선택'+
            '<input type="file" id="ecFile" accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png" style="display:none">'+
          '</label>'+
          '<span id="ecFileName" style="font-size:11px;color:var(--tm)"></span>'+
        '</div></div>'+
      '</div>',
    });
  },
  async _equipCalSave(editId){
    var g=function(id){return (document.getElementById(id)?.value||'').trim();};
    var code=g('ecCode'),name=g('ecName'),nxt=g('ecNext');
    if(!code){Toast.show('계측기코드를 입력하세요.','warn');return;}
    if(!name){Toast.show('계측기명을 입력하세요.','warn');return;}
    if(!nxt){Toast.show('차기교정일을 입력하세요.','warn');return;}
    /* [v2.69] 파일 업로드 처리 */
    var fileUrl=null;
    var fileEl=document.getElementById('ecFile');
    if(fileEl&&fileEl.files&&fileEl.files.length>0){
      var up=await SB.uploadFile('equip',fileEl.files[0]);
      if(up&&up.url) fileUrl=up.url;
      else{Toast.show('파일 업로드 실패. 저장은 계속 진행됩니다.','warn');}
    }
    var row={code,name,model:g('ecModel'),maker:g('ecMaker'),range:g('ecRange'),
      res:g('ecRes'),loc:g('ecLoc'),operator:g('ecOperator'),
      last:g('ecLast')||null,next:nxt,active:parseInt(g('ecActive'))||1,note:g('ecNote'),
      /* [v2.110] 계측기 이력카드용 10필드 */
      fixture_type:g('ecFixtureType'),
      code_no:g('ecCodeNo'),
      serial_no:g('ecSerialNo'),
      purpose:g('ecPurpose'),
      cal_method:g('ecCalMethod'),
      cal_cycle:g('ecCalCycle')||null,
      purchase_date:g('ecPurchaseDate')||null,
      purchase_cost:g('ecPurchaseCost')?Number(g('ecPurchaseCost')):null,
      inactive_reason:g('ecInactiveReason'),
      accessories:g('ecAccessories'),
    };
    if(fileUrl) row.file_url=fileUrl;
    else if(window._ecFileDeleted){row.file_url='';window._ecFileDeleted=false;}
    var r=editId&&editId!=='null'
      ? await SB.updateEquip(Number(editId),row)
      : await SB.addEquip(row);
    if(r?.ok){Toast.show(editId&&editId!=='null'?'수정되었습니다.':'등록되었습니다.','ok');Modal.close();Pages.equip();}
  },
  _equipCalFileDelete(){
    /* 파일 삭제: input 초기화 + file_url 표시 제거 */
    var fi=document.getElementById('ecFile');
    if(fi) fi.value='';
    var fn=document.getElementById('ecFileName');
    if(fn) fn.textContent='(기존 파일이 삭제됩니다. 저장 시 반영)';
    /* 삭제 플래그 — _equipCalSave에서 file_url='' 처리 */
    window._ecFileDeleted=true;
    Toast.show('저장 시 파일이 삭제됩니다.','warn');
  },
});



/* SQL 복사 헬퍼 */
Pages._copySql=function(){
  var e=document.getElementById('sqlBox');
  if(e) navigator.clipboard.writeText(e.textContent).then(function(){Toast.show('복사됨!','ok');});
};
/* [v2.394] settings 공지/로고 — Cfg에 실제 구현, Pages에서 위임 */
Pages._addNotice  =function(){Cfg.noticeForm();};
Pages._editNotice =function(i){Cfg.noticeForm(i);};
Pages._uploadLogo =function(inp){Cfg.uploadLogo(inp);};
Pages._removeLogo =function(){Cfg.deleteLogo();};;

;
/* ══ B: 검사 고도화 ══ */
Object.assign(Pages,{
async insp_std(){
  const w=document.getElementById('pw');
  if(!w) return;
  const list=await SB.getInspStd();
  window._stdData=list;
  const types=['수입','공정','구매','외주','최종'];
  const typeCnt={};types.forEach(t=>typeCnt[t]=(list.filter(r=>r.insp_type===t).length));
  w.innerHTML='<div class="stat-dash">'+
    '<div class="sd-card" style="cursor:pointer" onclick="document.getElementById(\'stdTypeF\').value=\'\';Pages._stdRender()">'+
    '<div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📋</div>'+
    '<div><div class="sd-val">'+list.length+'</div><div class="sd-lbl">전체 기준서</div></div></div>'+
    types.map(t=>'<div class="sd-card" style="cursor:pointer" onclick="document.getElementById(\'stdTypeF\').value=\''+t+'\';Pages._stdRender()">'+
    '<div class="sd-icon" style="background:#f0fdf4;color:#0f6e56">📝</div>'+
    '<div><div class="sd-val">'+typeCnt[t]+'</div><div class="sd-lbl">'+t+'</div></div></div>').join('')+
    '</div>'+
    '<div class="ph" style="margin-top:14px">'+
    '<div><div class="ptit">📋 검사 기준서</div><div class="psub">품목별 검사 항목 · AQL · 개정 관리</div></div>'+
    '<div class="pac"><button class="btn bpri btn-f2" onclick="Pages._stdForm(null)">+ 기준서 등록 <span class="kbd">F2</span></button></div></div>'+
    '<div class="tbar">'+
    '<input type="text" id="stdSearch" class="finp" style="width:200px" placeholder="품목코드, 품목명 검색..." oninput="Pages._stdRender()">'+
    '<select class="fsel" id="stdTypeF" onchange="Pages._stdRender()">'+
    '<option value="">전체 유형</option>'+types.map(t=>'<option>'+t+'</option>').join('')+'</select>'+
    '<button class="btn bout bsm" onclick="SearchPop.open(\'insp_std\')">🔎 Search <span class="kbd">F3</span></button></div>'+
    '<div id="stdList"></div>';
  Pages._stdRender();
},

_stdRender(){
  const q=(document.getElementById('stdSearch')?.value||'').toLowerCase();
  const tp=document.getElementById('stdTypeF')?.value||'';
  const filtered=(window._stdData||[]).filter(r=>{
    const mQ=!q||(r.item_code||'').toLowerCase().includes(q)||(r.item_name||'').toLowerCase().includes(q);
    return mQ&&(!tp||r.insp_type===tp);
  });
  Tbl.render({
    el:'#stdList',
    cols:[
      {key:'item_code',  label:'품목코드', w:'100px'},
      {key:'item_name',  label:'품목명',   w:'130px'},
      {key:'insp_type',  label:'검사유형', w:'70px',
        render:function(v){return '<span class="badge bblu" style="font-size:10px">'+H.e(v||'-')+'</span>';}},
      {key:'insp_items', label:'검사항목(수)', w:'90px',
        render:function(v){try{var a=JSON.parse(v||'[]');return'<b>'+a.length+'</b>개 항목';}catch(e){return '-';}}},
      {key:'aql',        label:'AQL',       w:'55px'},
      {key:'insp_level', label:'검사수준',  w:'70px',
        render:function(v){return v?'<span class="badge" style="background:#F1EFE8;color:#444441;font-size:10px">'+H.e(v)+'</span>':'-';}},
      {key:'sample_size',label:'샘플',      w:'55px'},
      {key:'rev',        label:'개정',      w:'50px'},
      {key:'rev_date',   label:'개정일',    w:'90px'},
      {key:'effective_date',label:'적용일', w:'90px'},
      {key:'created_by', label:'작성자',    w:'70px'},
      {key:'file_url',   label:'파일',      w:'55px',
        render:function(v){return v?'<button class="btn bxs bblu" style="font-size:10px;padding:2px 6px" onclick="event.stopPropagation();window.open(\''+H.e(v)+'\',\'_blank\')">📎</button>':'<span style="color:var(--tl);font-size:11px">-</span>';}}
    ],
    data:filtered,
    onRow:function(row){Pages._stdDetail(row);},
    onDel:async function(ids){
      Modal.confirm({title:'기준서 삭제',msg:ids.length+'건을 삭제하시겠습니까?',danger:true,onOk:async function(){
        for(var i2=0;i2<ids.length;i2++) await _sb.from('insp_std').update({deleted_at:new Date().toISOString()}).eq('id',ids[i2]);
        Toast.show(ids.length+'건 삭제되었습니다.','ok');
        await Pages.insp_std();
      }});
    }
  });
},

_stdForm(editRow){
  var r=editRow||{};
  var items=[];
  try{items=JSON.parse(r.insp_items||'[]');}catch(e){}
  if(!items.length) items=[{item:'',method:'',spec:'',unit:'',usl:'',lsl:'',freq:''}];
  var makeRow=function(it,idx){
    return '<tr><td style="text-align:center;color:var(--tm);font-size:11px">'+(idx+1)+'</td>'+
    '<td><input class="fc std-item" placeholder="외관" value="'+H.e(it.item||'')+'"></td>'+
    '<td><input class="fc std-method" placeholder="육안" value="'+H.e(it.method||'')+'"></td>'+
    '<td><input class="fc std-spec" placeholder="기준" value="'+H.e(it.spec||'')+'"></td>'+
    '<td><input class="fc std-unit" style="width:48px" value="'+H.e(it.unit||'')+'"></td>'+
    '<td><input class="fc std-usl" style="width:56px" value="'+H.e(it.usl||'')+'"></td>'+
    '<td><input class="fc std-lsl" style="width:56px" value="'+H.e(it.lsl||'')+'"></td>'+
    '<td><input class="fc std-freq" style="width:56px" placeholder="전수" value="'+H.e(it.freq||'')+'"></td>'+
    '<td style="text-align:center"><button type="button" class="btn bxs berr bsm" style="padding:1px 6px;font-size:11px" onclick="this.closest(\'tr\').remove()">✕</button></td></tr>';
  };
  var fileHtml=(editRow&&r.file_url)?
    '<div id="stdExistFile" style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
    '<a href="'+H.e(r.file_url||'')+'" target="_blank" class="btn bxs bblu bsm">📎 '+H.e(r.file_name||'파일 보기')+'</a>'+
    '<button type="button" class="btn bxs berr bsm" onclick="document.getElementById(\'stdExistFile\').remove();window._stdFileRemove=true;">🗑️ 삭제</button></div>':'';
  window._stdEditId=editRow?r.id:null;
  window._stdFileRemove=false;
  var aqls=['0.065','0.1','0.25','0.4','0.65','1.0','1.5','2.5','4.0'];
  var types=['수입','공정','구매','외주','최종'];
  var dlOpts=(DB.items||[]).map(function(it){return'<option value="'+H.e(it.item_code||'')+'">'+H.e(it.item_name||'')+'</option>';}).join('');
  var oi="(function(){var v=document.getElementById('stdItemCode').value.toUpperCase();"+
    "var it=(DB.items||[]).find(function(x){return(x.item_code||'').toUpperCase()===v;});"+
    "if(it)document.getElementById('stdItemName').value=it.item_name||'';})()";
  Modal.open({
    title:editRow?'📋 검사 기준서 수정':'📋 검사 기준서 등록',size:'mxl',
    body:'<div class="fg2" style="margin-bottom:14px">'+
    '<div class="fgroup"><label class="fl req">품목코드</label>'+
    '<input class="fc" id="stdItemCode" list="stdItemList" value="'+H.e(r.item_code||'')+'" placeholder="코드 입력 또는 목록 선택" oninput="'+H.e(oi)+'">'+
    '<datalist id="stdItemList">'+dlOpts+'</datalist></div>'+
    '<div class="fgroup"><label class="fl">품목명</label><input class="fc" id="stdItemName" value="'+H.e(r.item_name||'')+'" placeholder="자동 입력"></div>'+
    '<div class="fgroup"><label class="fl req">검사유형</label><select class="fc" id="stdInspType">'+
    types.map(function(t){return'<option value="'+t+'"'+(r.insp_type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl">AQL</label><select class="fc" id="stdAql"><option value="">선택</option>'+
    aqls.map(function(v){return'<option value="'+v+'"'+(r.aql===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl">검사수준</label><select class="fc" id="stdInspLevel">'+
    ['I','II','III'].map(function(v){return'<option value="'+v+'"'+((r.insp_level||'II')===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select></div>'+
    '<div class="fgroup"><label class="fl">샘플 수</label><input class="fc" id="stdSample" type="number" min="1" value="'+H.e(r.sample_size||'')+'"></div>'+
    '<div class="fgroup"><label class="fl">개정 번호</label><input class="fc" id="stdRev" value="'+H.e(r.rev||'A')+'"></div>'+
    '<div class="fgroup"><label class="fl">개정일</label><input class="fc" id="stdRevDate" type="date" value="'+H.e(r.rev_date||'')+'"></div>'+
    '<div class="fgroup"><label class="fl">적용일</label><input class="fc" id="stdEffDate" type="date" value="'+H.e(r.effective_date||'')+'"></div>'+
    '<div class="fgroup ff"><label class="fl">파일 첨부</label><div>'+fileHtml+
    '<input type="file" id="stdFile" class="fc" style="font-size:12px" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.zip"></div></div></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
    '<div style="font-size:13px;font-weight:700">검사 항목</div>'+
    '<button type="button" class="btn bpri bsm" onclick="Pages._stdAddRow()">+ 항목 추가</button></div>'+
    '<div style="overflow-x:auto"><table class="ctbl"><thead><tr>'+
    '<th>No</th><th>항목명 *</th><th>측정방법</th><th>규격/기준</th><th>단위</th><th>USL</th><th>LSL</th><th>빈도</th><th></th>'+
    '</tr></thead><tbody id="stdRows">'+items.map(makeRow).join('')+'</tbody></table></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'+
    '<button class="btn bpri btn-f8" onclick="Pages._stdSave()">저장 <span class="kbd">F8</span></button>'
  });
},

_stdAddRow(){
  var tbody=document.getElementById('stdRows');
  if(!tbody) return;
  var idx=tbody.rows.length+1;
  var tr=document.createElement('tr');
  tr.innerHTML='<td style="text-align:center;color:var(--tm);font-size:11px">'+idx+'</td>'+
    '<td><input class="fc std-item" placeholder="외관"></td>'+
    '<td><input class="fc std-method" placeholder="육안"></td>'+
    '<td><input class="fc std-spec"></td>'+
    '<td><input class="fc std-unit" style="width:48px"></td>'+
    '<td><input class="fc std-usl" style="width:56px"></td>'+
    '<td><input class="fc std-lsl" style="width:56px"></td>'+
    '<td><input class="fc std-freq" style="width:56px" placeholder="전수"></td>'+
    '<td style="text-align:center"><button type="button" class="btn bxs berr bsm" style="padding:1px 6px;font-size:11px" onclick="this.closest(\'tr\').remove()">✕</button></td>';
  tbody.appendChild(tr);
},

async _stdSave(){
  var g=function(id){return(document.getElementById(id)?.value||'').trim();};
  var item_code=g('stdItemCode').toUpperCase();
  var insp_type=g('stdInspType');
  if(!item_code){Toast.show('품목코드를 입력하세요.','warn');return;}
  if(!insp_type){Toast.show('검사유형을 선택하세요.','warn');return;}
  var tbody=document.getElementById('stdRows');
  var items=tbody?[...tbody.rows].map(function(tr){
    return{item:(tr.querySelector('.std-item')?.value||'').trim(),
      method:(tr.querySelector('.std-method')?.value||'').trim(),
      spec:(tr.querySelector('.std-spec')?.value||'').trim(),
      unit:(tr.querySelector('.std-unit')?.value||'').trim(),
      usl:(tr.querySelector('.std-usl')?.value||'').trim(),
      lsl:(tr.querySelector('.std-lsl')?.value||'').trim(),
      freq:(tr.querySelector('.std-freq')?.value||'').trim()};
  }).filter(function(it){return it.item;}) : [];
  if(!items.length){Toast.show('검사 항목을 1개 이상 입력하세요.','warn');return;}
  var row={item_code,item_name:g('stdItemName'),insp_type,
    insp_items:JSON.stringify(items),
    aql:g('stdAql')||null,insp_level:g('stdInspLevel')||'II',
    sample_size:g('stdSample')||null,rev:g('stdRev')||'A',
    rev_date:g('stdRevDate')||null,effective_date:g('stdEffDate')||null,
    created_by:Auth._u?.name||Auth._u?.username||''};
  if(window._stdFileRemove){row.file_url=null;row.file_name=null;}
  var fileEl=document.getElementById('stdFile');
  if(fileEl?.files?.length){
    var up=await SB.uploadFile('insp_std',fileEl.files[0]);
    if(up?.url){row.file_url=up.url;row.file_name=fileEl.files[0].name;}
    else Toast.show('파일 업로드 실패','warn');
  }
  var editId=window._stdEditId;
  var res=editId?await SB.updateInspStd(editId,row):await SB.addInspStd(row);
  if(!res.ok) return;
  Toast.show(editId?'기준서가 수정되었습니다.':'기준서가 등록되었습니다.','ok');
  Modal.close();
  await Pages.insp_std();
},

_stdDetail(row){
  if(!row) return;
  var items=[];try{items=JSON.parse(row.insp_items||'[]');}catch(e){}
  var itemRows=items.length?items.map(function(it,i){
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'+
    '<td>'+H.e(it.item||'-')+'</td><td>'+H.e(it.method||'-')+'</td>'+
    '<td>'+H.e(it.spec||'-')+'</td><td>'+H.e(it.unit||'-')+'</td>'+
    '<td>'+H.e(it.usl||'-')+'</td><td>'+H.e(it.lsl||'-')+'</td>'+
    '<td>'+H.e(it.freq||'-')+'</td></tr>';
  }).join(''):'<tr><td colspan="8" style="text-align:center;color:var(--tm)">검사항목 없음</td></tr>';
  var rowJson=JSON.stringify(row);
  Modal.open({title:'📋 '+H.e(row.item_code||'')+' — 기준서 상세',size:'mxl',
    body:'<div class="fg2" style="margin-bottom:14px">'+
    '<div class="fgroup"><label class="fl">품목코드</label><div class="fc-ro">'+H.e(row.item_code||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">품목명</label><div class="fc-ro">'+H.e(row.item_name||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">검사유형</label><div class="fc-ro">'+H.e(row.insp_type||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">AQL / 수준</label><div class="fc-ro">'+(row.aql||'-')+' / '+(row.insp_level||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">샘플</label><div class="fc-ro">'+(row.sample_size||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">개정 / 개정일</label><div class="fc-ro">'+(row.rev||'-')+' / '+(row.rev_date||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">적용일</label><div class="fc-ro">'+(row.effective_date||'-')+'</div></div>'+
    '<div class="fgroup"><label class="fl">작성자</label><div class="fc-ro">'+(row.created_by||'-')+'</div></div>'+
    '<div class="fgroup ff"><label class="fl">첨부파일</label>'+(row.file_url?'<div style="display:flex;align-items:center;gap:8px"><a href="'+H.e(row.file_url)+'" target="_blank" class="btn bxs bblu bsm">📎 '+H.e(row.file_name||'파일 보기')+'</a></div>':'<span style="color:var(--tm);font-size:12px">없음</span>')+'</div>'+
    '</div><div style="font-size:13px;font-weight:700;margin-bottom:8px">검사 항목 ('+items.length+'개)</div>'+
    '<div style="overflow-x:auto"><table class="ctbl"><thead><tr>'+
    '<th>No</th><th>항목명</th><th>측정방법</th><th>규격/기준</th><th>단위</th><th>USL</th><th>LSL</th><th>빈도</th>'+
    '</tr></thead><tbody>'+itemRows+'</tbody></table></div>',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'+
    '<button class="btn bgh" onclick="Modal.close();window._stdEditRow='+H.e(rowJson)+';setTimeout(function(){Pages._stdFileOnly(JSON.parse(window._stdEditRow));},50)">📎 파일</button>'+
    '<button class="btn bpri" onclick="Modal.close();window._stdEditRow='+H.e(rowJson)+';setTimeout(function(){Pages._stdForm(JSON.parse(window._stdEditRow));},50)">✏️ 수정</button>'
  });
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
/* [v2.78] 검사 기준서 항목 초기 행 HTML 생성 */
_buildStdRows(row){
  var its=[]; try{its=JSON.parse(row?.insp_items||'[]');}catch(e){}
  if(!its.length) its=[{}];
  return its.map(function(it,idx){
    return '<tr>'+
      '<td style="text-align:center;color:var(--tm)">'+(idx+1)+'</td>'+
      '<td><input class="fc" placeholder="항목명" value="'+H.e(it.item||'')+'"></td>'+
      '<td><input class="fc" placeholder="육안/측정" value="'+H.e(it.method||'')+'"></td>'+
      '<td><input class="fc" value="'+H.e(it.spec||'')+'"></td>'+
      '<td><input class="fc" value="'+H.e(it.unit||'')+'"></td>'+
      '<td><input class="fc" value="'+H.e(it.usl||'')+'"></td>'+
      '<td><input class="fc" value="'+H.e(it.lsl||'')+'"></td>'+
      '<td><input class="fc" placeholder="전수" value="'+H.e(it.freq||'')+'"></td>'+
      '<td><button type="button" onclick="this.closest(\'tr\').remove()" style="color:var(--err);font-size:14px;cursor:pointer">✕</button></td>'+
    '</tr>';
  }).join('');
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
        <button class="btn bpri btn-f2" onclick="Pages._sqmAuditPickForEval()">+ 평가 등록 <span class="kbd">F2</span></button>
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
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_eval')" title="검색 팝업">🔎 Search <span class="kbd">F3</span></button>
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
  /* [v2.119] 거래처명 컬럼 — 데이터 글자수에 비례한 동적 너비 (요청: "글자수가 많으면 넓은 너비") */
  const vnMaxLen=Math.max(6,...filtered.map(r=>(r.vendor_name||'').length));
  const vnWidth=Math.min(220,Math.max(100,vnMaxLen*15+24))+'px';
  Tbl.render({
    el:'#evalTbl',
    cols:[
      /* [v2.116/v2.119] 컬럼 너비 — 거래처명은 동적, 나머지는 표시값 글자수 기준 고정폭 */
      {key:'eval_no',     label:'등록번호', w:'120px', render:v=>v?`<span style="font-family:monospace;font-size:12px;color:#3b82c4;font-weight:700">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'vendor_name', label:'거래처명', req:true, w:vnWidth},
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
      {key:'writer',      label:'작성자',   w:'70px'},
      {key:'audit_id',    label:'등록방식', w:'82px',align:'center',
        render:v=>v
          ?`<span class="badge bblu" style="font-size:11px">🔗 심사연계</span>`
          :`<span class="badge bgry" style="font-size:11px">📝 직접등록</span>`},
      {key:'file_url',    label:'파일',     w:'64px',align:'center',
        render:v=>v?`<a href="${H.e(v)}" target="_blank" onclick="event.stopPropagation()" class="btn bxs bblu" style="font-size:10px;padding:1px 7px;text-decoration:none">📎 보기</a>`:'<span style="color:var(--tl);font-size:11px">-</span>'},
      {key:'_mail',       label:'메일',     w:'58px',align:'center',
        render:(v,row)=>`<button class="btn bxs" style="font-size:10px;padding:1px 7px;background:#475569;color:#fff" onclick="event.stopPropagation();Pages._evalSendMail(${row.id})">📧 통보</button>`},
    ],
    data:filtered,
    onRow:row=>Pages._sqmEvalDetail(row),
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      const _doDelete=async()=>{
        let okCnt=0;
        for(const id of numIds){const r=await SB.deleteVendorEval(id);if(r.ok)okCnt++;}
        if(okCnt>0)Toast.show(okCnt+'건 삭제되었습니다.','ok');
        if(okCnt<numIds.length)Toast.show((numIds.length-okCnt)+'건 삭제 실패','err');
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
    foot:`<button class="btn bout" onclick="Modal.close()">닫기</button>`+
      `<button class="btn bgry bsm" onclick="Modal.close();Pages._sqmEvalForm(${JSON.stringify(row).replace(/"/g,'&quot;').replace(/</g,'\u003c')})">✏️ 수정</button>`+
      `<button class="btn bpri bsm" onclick="Pages._evalSendMail(${row.id})">📧 결과 통보</button>`+
      `<button class="btn bpri" onclick="Pages._sqmEvalPrint(${row.id})">🖨️ 인쇄</button>`});
},
/* [v2.122] 업체평가 상세 인쇄 — 더미 토스트를 실제 출력 창으로 교체 */
_sqmEvalPrint(id){
  const row=(DB.vendor_evals||[]).find(r=>r.id===id);
  if(!row){Toast.show('평가 데이터를 찾을 수 없습니다.','err');return;}
  const gc={A:'#059669',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  const gl={A:'우수 (계속 거래)',B:'양호 (유지)',C:'주의 (개선 요청)',D:'부적격 (거래 중단 검토)'};
  const today=H.today();
  const printWin=window.open('','_blank');
  if(!printWin){Toast.show('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.','warn');return;}
  printWin.document.write(`<!DOCTYPE html><html><head><title>업체 평가서 — ${H.e(row.vendor_name)}</title>
  <style>
    body{font-family:'Malgun Gothic',sans-serif;padding:24px;color:#1e293b;font-size:13px}
    .pr-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:18px}
    .pr-title{font-size:20px;font-weight:800;letter-spacing:4px}
    .pr-meta{font-size:11px;color:#64748b;text-align:right}
    .pr-grade{text-align:center;margin-bottom:20px}
    .pr-grade-circle{display:inline-block;width:70px;height:70px;line-height:70px;border-radius:50%;color:#fff;font-size:28px;font-weight:900;background:${gc[row.grade]||'#475569'}}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #cbd5e1;padding:8px 10px;font-size:12px;text-align:center}
    th{background:#f1f5f9}
    @media print{button{display:none}}
  </style></head><body>
  <div class="pr-header">
    <div class="pr-title">업 체 평 가 서</div>
    <div class="pr-meta">출력일: ${today}</div>
  </div>
  <div class="pr-grade">
    <div class="pr-grade-circle">${H.e(row.grade||'-')}</div>
    <div style="margin-top:6px;font-size:12px;color:#64748b">${gl[row.grade]||''}</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px">${row.total??'-'}점</div>
  </div>
  <table>
    <tr><th>거래처</th><td>${H.e(row.vendor_name||'-')}</td><th>평가기간</th><td>${H.e(row.period||'-')}</td></tr>
    <tr><th>품질(40%)</th><td>${row.quality??'-'}점</td><th>납기(30%)</th><td>${row.delivery??'-'}점</td></tr>
    <tr><th>가격(20%)</th><td>${row.price??'-'}점</td><th>대응(10%)</th><td>${row.response??'-'}점</td></tr>
    <tr><th>PPM</th><td>${H.n(row.ppm)||0}</td><th>클레임</th><td>${row.complaint||0}건</td></tr>
    <tr><th>평가일</th><td>${H.e(row.eval_date||'-')}</td><th>평가자</th><td>${H.e(row.evaluator||'-')}</td></tr>
    <tr><th>비고</th><td colspan="3">${H.e(row.note||'-')}</td></tr>
  </table>
  <button onclick="window.print()" style="padding:8px 18px;border:none;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer">🖨️ 인쇄</button>
  </body></html>`);
  printWin.document.close();
},
_sqmEvalForm(row=null){
  /* [v2.394] 업체 평가 등록/수정 폼 */
  const isEdit=!!row;
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
        ${Pages._sqmVendorAcField('evVendorInput','evVName',isEdit?row.vendor_name:'')}
      </div>
      <div class="fgroup"><label class="fl req">평가기간</label>
        <input class="fc" id="evPeriod" value="${isEdit?H.e(row.period||''):''}" placeholder="예) 2026-Q2">
      </div>
      <div class="fgroup"><label class="fl req">품질 점수 (40% 반영)</label>
        <input class="fc" type="number" id="evQuality" min="0" max="100" placeholder="0~100점 입력"
          value="${isEdit?row.quality||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">납기 점수 (30% 반영)</label>
        <input class="fc" type="number" id="evDelivery" min="0" max="100" placeholder="0~100점 입력"
          value="${isEdit?row.delivery||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">가격 점수 (20% 반영)</label>
        <input class="fc" type="number" id="evPrice" min="0" max="100" placeholder="0~100점 입력"
          value="${isEdit?row.price||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup"><label class="fl req">대응 점수 (10% 반영)</label>
        <input class="fc" type="number" id="evResponse" min="0" max="100" placeholder="0~100점 입력"
          value="${isEdit?row.response||'':''}" oninput="Pages._sqmCalcTotal()">
      </div>
      <div class="fgroup">
        <label class="fl">종합점수 (100점 만점, 자동계산)</label>
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
      <div class="fgroup"><label class="fl req">작성자</label>
        <select class="fc" id="evWriter">
          <option value="">-- 선택 --</option>${(DB.users||[]).map(u=>{const nm=H.e(u.name||u.username);const cur=isEdit?row.writer:Auth._u?.name||Auth._u?.username||'';return`<option value="${nm}" ${nm===H.e(cur)?'selected':''}>${nm}</option>`;}).join('')}</select>
      </div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">비고</label>
        <textarea class="fc" id="evNote" rows="2">${H.e(isEdit?row.note||'':'')}</textarea>
      </div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">첨부파일</label>
        <input class="fc" type="file" id="evFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">
        ${isEdit&&row.file_url?'<div style="margin-top:5px;font-size:12px"><a href="'+H.e(row.file_url)+'" target="_blank" style="color:#2563eb">📎 현재 파일 보기</a></div>':''}
      </div>
    </div>`,
  });
  window._sqmEvalEditRow=row;
  if(!isEdit) window._sqmEvalAuditId=null; /* [v2.136] 직접 등록 시 audit_id 초기화 */
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
  /* [v2.116] 자동완성 확정값(hidden evVName) 우선, 미확정 시 입력창 텍스트 그대로 사용 */
  const vName=(g('evVName')||g('evVendorInput')).trim();
  const period=g('evPeriod').trim();
  /* [v2.137] 소수점 허용: Number() → parseFloat() */
  const quality=parseFloat(g('evQuality'))||0, delivery=parseFloat(g('evDelivery'))||0;
  const price=parseFloat(g('evPrice'))||0, response=parseFloat(g('evResponse'))||0;
  const total=parseFloat(g('evTotal'))||0;
  const grade=g('evGrade');
  const evalDate=g('evDate');
  if(!vName){Toast.show('거래처를 입력하세요.','warn');return;}
  if(!period){Toast.show('평가기간을 입력하세요.','warn');return;}
  if(!quality&&!delivery){Toast.show('점수를 입력하세요.','warn');return;}
  if(!evalDate){Toast.show('평가일을 입력하세요.','warn');return;}
  const row=window._sqmEvalEditRow;
  /* [v2.137] 2.2 중복 등록 방지 — 거래처+평가기간 조합 체크 (수정 모드 제외) */
  if(!row?.id){
    const dup=(DB.vendor_evals||[]).find(e=>
      e.vendor_name===vName && e.period===period
    );
    if(dup){
      Toast.show(`이미 등록된 평가입니다. (${vName} / ${period}) 수정 버튼으로 변경해 주세요.`,'warn');
      return;
    }
  }
  /* [v2.137] 자동 등록번호 생성 — EVAL-YYYYMMDD-NNN */
  let eval_no=row?.eval_no||null;
  if(!eval_no){
    const today=H.today().replace(/-/g,'');
    const todayEvals=(DB.vendor_evals||[]).filter(e=>(e.eval_no||'').startsWith('EVAL-'+today));
    const seq=String(todayEvals.length+1).padStart(3,'0');
    eval_no=`EVAL-${today}-${seq}`;
  }
  /* [v2.116] 첨부파일 업로드 처리 */
  let file_url=row?.file_url||null;
  const evFileEl=document.getElementById('evFile');
  if(evFileEl?.files?.length){
    const f=evFileEl.files[0];
    const up=await SB.uploadFile('sqm_eval', f);
    if(up?.url) file_url=up.url;
  }
  const newRow={eval_no,vendor_name:vName,period,quality,delivery,price,response,
    total,grade,ppm:parseFloat(g('evPpm'))||0,complaint:Number(g('evComplaint'))||0,
    eval_date:evalDate,evaluator:g('evEvaluator'),note:g('evNote'),file_url,
    writer:g('evWriter'),
    audit_id:window._sqmEvalAuditId||null};
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
        <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiSqmPlan()" title="AI로 분기 공급사 관리 계획 생성">🤖 AI 분기 계획</button>
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
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_audit')" title="검색 팝업">🔎 <span class="kbd">F3</span></button>
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
  /* [v2.119] 거래처명/지적사항 — 데이터 글자수에 비례한 동적 너비 */
  const vnMaxLen=Math.max(6,...filtered.map(r=>(r.vendor_name||'').length));
  const vnWidth=Math.min(220,Math.max(100,vnMaxLen*15+24))+'px';
  const fdMaxLen=Math.max(8,...filtered.map(r=>(r.findings||'').length));
  const fdWidth=Math.min(280,Math.max(100,fdMaxLen*9+24))+'px';
  Tbl.render({
    el:'#auditTbl',
    rowStyle:(row)=>{
      const today=new Date().toISOString().slice(0,10);
      if(row.plan_date && row.plan_date > today && row.status!=='완료'){
        return 'background:rgba(219,234,254,0.45);'; /* 계획일 미래 = 예정, 파란 음영 */
      }
      return '';
    },
    cols:[
      {key:'status',      label:'상태',     w:'80px', align:'center',
        render:v=>`<span class="badge ${v==='완료'?'bgrn':v==='진행중'?'bblu':v==='보류'?'bred':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'vendor_name', label:'거래처명',  req:true, w:vnWidth},
      {key:'audit_type',  label:'심사유형',  w:'90px', align:'center',
        render:v=>`<span class="badge ${v==='정기'?'bblu':v==='수시'?'bamb':'bgry'}" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'plan_date',   label:'계획일',   w:'90px', req:true},
      {key:'actual_date', label:'실시일',   w:'90px', render:v=>v||'-'},
      {key:'auditor',     label:'심사자',   w:'80px'},
      {key:'score',       label:'점수',     w:'70px', align:'center',
        render:v=>v!=null?`<span style="font-weight:700;color:${v>=80?'#059669':v>=60?'#d97706':'#dc2626'}">${v}</span>`:'<span style="color:var(--tl)">-</span>'},
      {key:'findings',    label:'지적사항', w:fdWidth},
      {key:'next_date',   label:'차기심사',  w:'90px', render:v=>v||'-'},
      {key:'file_url',    label:'파일',     w:'64px', align:'center',
        render:v=>v?`<a href="${H.e(v)}" target="_blank" onclick="event.stopPropagation()" class="btn bxs bblu" style="font-size:10px;padding:1px 7px;text-decoration:none">📎 보기</a>`:'<span style="color:var(--tl);font-size:11px">-</span>'},
      {key:'_mail',       label:'메일',     w:'58px', align:'center',
        render:(v,row)=>`<button class="btn bxs" style="font-size:10px;padding:1px 7px;background:#475569;color:#fff" onclick="event.stopPropagation();Pages._auditSendMail(${row.id})">📧 통보</button>`},
    ],
    data:filtered,
    onRow:row=>Pages._sqmAuditDetail(row),
    onDel:async(ids)=>{
      const numIds=ids.map(Number);
      const _doDelete=async()=>{
        let okCnt=0;
        for(const id of numIds){const r=await SB.deleteVendorAudit(id);if(r.ok)okCnt++;}
        if(okCnt>0)Toast.show(okCnt+'건 삭제되었습니다.','ok');
        if(okCnt<numIds.length)Toast.show((numIds.length-okCnt)+'건 삭제 실패','err');
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
        +`<button class="btn bgry bsm" onclick="Modal.close();Pages._sqmAuditForm(${JSON.stringify(row).replace(/"/g,'&quot;').replace(/</g,'\u003c')})">✏️ 수정</button>`
        +(row.status!=='완료'?`<button class="btn bgrn bsm" onclick="Modal.close();Pages._auditStatusChange(${row.id})">→ 다음단계</button>`:'')
        +(row.status==='완료'?`<button class="btn bamb bsm" onclick="Modal.close();Pages._sqmAuditToEval(${row.id})" title="심사 결과를 업체평가에 자동 반영">⭐ 평가 등록</button>`:'')
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

/* [v2.116] 협력사관리 고도화2 — 거래처 자연어검색 자동완성 공통 컴포넌트
   심사 등록(_sqmAuditForm) / 평가 등록(_sqmEvalForm) 양쪽에서 공용으로 사용.
   기존 <select> 방식은 거래처가 많아지면 찾기 어려워 텍스트 입력+검색 방식으로 교체.
   inputId: 화면에 보이는 입력창 id / hiddenId: 확정된 거래처명을 담는 hidden input id */
_sqmVendorAcField(inputId,hiddenId,curName){
  const v=H.e(curName||'');
  return `<div class="ac-wrap">
    <input type="text" class="fc ac-input" id="${inputId}" autocomplete="off"
      placeholder="거래처명을 입력해 검색 (예: 삼성, 엘지)" value="${v}"
      oninput="Pages._sqmVendorAcInput('${inputId}','${hiddenId}')"
      onfocus="Pages._sqmVendorAcInput('${inputId}','${hiddenId}')"
      onblur="setTimeout(()=>{const d=document.getElementById('${inputId}_drop');if(d)d.classList.remove('show')},150)">
    <div class="ac-drop" id="${inputId}_drop"></div>
    <input type="hidden" id="${hiddenId}" value="${v}">
  </div>`;
},
/* 입력값 기준 거래처 후보 검색 후 드롭다운 표시 */
_sqmVendorAcInput(inputId,hiddenId){
  const inp=document.getElementById(inputId);
  const drop=document.getElementById(inputId+'_drop');
  if(!inp||!drop) return;
  const q=inp.value.trim().toLowerCase();
  inp.classList.remove('ac-confirmed');
  const hidden=document.getElementById(hiddenId);
  if(hidden) hidden.value=''; /* 입력 중에는 확정 해제 */
  const list=(DB.vendors||[]).filter(v=>!q||(v.vendor_name||'').toLowerCase().includes(q));
  if(!list.length){
    drop.innerHTML='<div class="ac-empty">일치하는 거래처가 없습니다</div>';
    drop.classList.add('show');
    return;
  }
  drop.innerHTML=list.slice(0,15).map(v=>
    `<div class="ac-item" onmousedown="Pages._sqmVendorAcPick('${inputId}','${hiddenId}',${JSON.stringify(v.vendor_name).replace(/"/g,'&quot;')})">`+
      H.e(v.vendor_name||'-')+
      (v.ceo_name||v.biz_no?`<div class="ac-item-sub">${H.e(v.ceo_name||'')}${v.ceo_name&&v.biz_no?' · ':''}${H.e(v.biz_no||'')}</div>`:'')+
    `</div>`
  ).join('');
  drop.classList.add('show');
},
/* 후보 클릭 시 확정 — input/hidden 값 동시 설정, 드롭다운 닫기 */
_sqmVendorAcPick(inputId,hiddenId,name){
  const inp=document.getElementById(inputId);
  const hidden=document.getElementById(hiddenId);
  const drop=document.getElementById(inputId+'_drop');
  if(inp){inp.value=name;inp.classList.add('ac-confirmed');}
  if(hidden) hidden.value=name;
  if(drop) drop.classList.remove('show');
},

/* [v2.116] 심사→평가 자동연계 — 완료된 심사 데이터를 평가 등록 폼에 미리 채워서 전달
   (보류 문서 제안사항: "심사 완료 시 거래처명/심사일 등 자동 전달") */
/* [v2.136] 업체평가 등록 진입점 — 심사 목록 선택 팝업 (ISO 9001 프로세스 준수)
   흐름: 심사계획 → 실사(audit) → 결과점수 입력 → 업체평가 반영
   심사 선택 시 거래처명·기간·심사점수(→품질항목)·심사일 자동 채워짐
   직접 등록도 가능하도록 "심사 연계 없이 등록" 버튼 유지 */
_sqmAuditPickForEval(){
  const audits=(DB.vendor_audits||[]).filter(a=>a.status==='완료').sort((a,b)=>{
    return (b.actual_date||b.plan_date||'').localeCompare(a.actual_date||a.plan_date||'');
  });
  const rows=audits.map(a=>{
    const d=a.actual_date||a.plan_date||'-';
    return `<tr style="cursor:pointer" onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background=''"
      onclick="Modal.close();Pages._sqmAuditToEval(${a.id})">
      <td style="padding:9px 12px;font-family:monospace;font-size:12px;color:#3b82c4;font-weight:700">${H.e(a.vendor_name||'-')}</td>
      <td style="padding:9px 12px">${H.e(a.audit_type||'-')}</td>
      <td style="padding:9px 12px;text-align:center">${H.e(d)}</td>
      <td style="padding:9px 12px;text-align:center;font-weight:700;color:${(a.score||0)>=80?'var(--ok)':(a.score||0)>=60?'#d97706':'var(--err)'}">
        ${a.score!=null?a.score+'점':'-'}</td>
      <td style="padding:9px 12px;text-align:center"><span class="badge bgrn">완료</span></td>
    </tr>`;
  }).join('');
  Modal.open({title:'⭐ 업체평가 등록 — 심사 결과 선택',size:'mlg',
    body:`<div style="font-size:13px;color:var(--muted);margin-bottom:12px;padding:8px 12px;background:var(--bg2);border-radius:8px">
        📋 완료된 심사를 선택하면 거래처·심사점수가 자동으로 채워집니다.
      </div>
      ${rows.length
        ?`<table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:var(--bg2)">
            <th style="padding:9px 12px;text-align:left;font-weight:700;color:var(--muted)">거래처</th>
            <th style="padding:9px 12px;text-align:left;font-weight:700;color:var(--muted)">심사유형</th>
            <th style="padding:9px 12px;text-align:center;font-weight:700;color:var(--muted)">실시일</th>
            <th style="padding:9px 12px;text-align:center;font-weight:700;color:var(--muted)">점수</th>
            <th style="padding:9px 12px;text-align:center;font-weight:700;color:var(--muted)">상태</th>
          </tr></thead><tbody>${rows}</tbody></table>`
        :`<div style="text-align:center;padding:40px;color:var(--muted)">
          <div style="font-size:32px;margin-bottom:8px">📋</div>
          <div>완료된 심사가 없습니다.</div>
          <div style="font-size:12px;margin-top:4px">심사계획 → 실사 완료 후 평가를 등록하거나, 아래 버튼으로 직접 등록하세요.</div>
        </div>`}`,
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
      <button class="btn bout" onclick="Modal.close();Pages._sqmEvalForm()">📝 심사 연계 없이 직접 등록</button>`,
  });
},
_sqmAuditToEval(auditId){
  const a=(DB.vendor_audits||[]).find(r=>r.id===auditId);
  if(!a){Toast.show('심사 데이터를 찾을 수 없습니다.','err');return;}
  const d=new Date(a.actual_date||a.plan_date||H.today());
  const period=`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;
  const note=`[${a.audit_type||'정기'}심사 연계] 심사일 ${a.actual_date||a.plan_date||'-'} / 심사점수 ${a.score??'-'}점`+
              (a.findings?` / 지적사항: ${a.findings}`:'');
  Pages._sqmEvalForm(null);
  window._sqmEvalAuditId=auditId; /* [v2.136] 심사→평가 연계 추적 */
  /* [v2.136] 모달 렌더 직후 심사 데이터 자동 채움
     심사 점수 → 품질 항목 (심사는 품질 관점 실사), 나머지 항목은 수동 입력 */
  setTimeout(()=>{
    const vi=document.getElementById('evVendorInput'), vh=document.getElementById('evVName');
    if(vi) vi.value=a.vendor_name||'';
    if(vh) vh.value=a.vendor_name||'';
    const pe=document.getElementById('evPeriod'); if(pe) pe.value=period;
    const ed=document.getElementById('evDate');   if(ed) ed.value=a.actual_date||H.today();
    const nt=document.getElementById('evNote');   if(nt) nt.value=note;
    /* 심사 점수 → 품질 항목 자동 채움 */
    if(a.score!=null){
      const eq=document.getElementById('evQuality');
      if(eq){eq.value=a.score; Pages._sqmCalcTotal();}
    }
  },80);
},

/* 심사 등록/수정 폼 [v2.394] */
_sqmAuditForm(row=null){
  const isEdit=!!row;
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
        ${Pages._sqmVendorAcField('auVendorInput','auVendor',isEdit?row.vendor_name:'')}</div>
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
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">첨부파일</label>
        <input class="fc" type="file" id="auFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="padding:5px;font-size:12px">
        ${isEdit&&row.file_url?'<div style="margin-top:5px;font-size:12px"><a href="'+H.e(row.file_url)+'" target="_blank" style="color:#2563eb">📎 현재 파일 보기</a></div>':''}
      </div>
    </div>`,
  });
  window._sqmAuditEditRow=row;
},

/* 심사 저장 [v2.394] */
async _sqmAuditSave(){
  const g=id=>document.getElementById(id)?.value||'';
  /* [v2.116] 자동완성 확정값(hidden) 우선, 미확정 시 입력창 텍스트 그대로 사용(직접입력 허용) */
  const vendor=(g('auVendor')||g('auVendorInput')).trim();
  const planDate=g('auPlanDate');
  if(!vendor){Toast.show('거래처를 입력하세요.','warn');return;}
  if(!planDate){Toast.show('계획일을 입력하세요.','warn');return;}
  const row=window._sqmAuditEditRow;
  /* [v2.116] 첨부파일 업로드 처리 — 기존 교정등록(calFile)과 동일 패턴 */
  let file_url=row?.file_url||null;
  const auFileEl=document.getElementById('auFile');
  if(auFileEl?.files?.length){
    const f=auFileEl.files[0];
    const up=await SB.uploadFile('sqm_audit', f);
    if(up?.url) file_url=up.url;
  }
  const newRow={vendor_name:vendor,audit_type:g('auType'),plan_date:planDate,
    actual_date:g('auActualDate')||null,auditor:g('auAuditor'),
    score:g('auScore')?Number(g('auScore')):null,
    status:g('auStatus')||'계획',next_date:g('auNextDate')||null,
    findings:g('auFindings'),corrective_req:g('auCorrective'),file_url};
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
  /* [v2.122] 현재 페이지에 맞는 갱신 함수 호출 — sqm_plan 화면에서 등록 시
     _auditRefresh/_auditKanban은 sqm_audit 화면 전용 엘리먼트라 아무 효과가
     없어 F5 새로고침해야만 반영되던 버그 수정 */
  const _curPage=sessionStorage.getItem('qms_page');
  if(_curPage==='sqm_plan' && document.getElementById('planKanban')){
    Pages._sqmPlanRefresh();
  } else if(document.getElementById('auditTbl')){
    Pages._auditRefresh();
    Pages._auditKanban();
  }
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
  /* [v2.116] Gmail MCP 직접 fetch 방식 제거 — 브라우저에서 인증/CORS 문제로
     항상 실패하던 코드였음. mailto: 직행으로 단순화.
     ※ 향후 자동발송 필요 시: 이 블록을 EmailJS SDK 호출로 교체
        (emailjs.send() — 클라이언트 단독으로 동작, 서버 불필요) */
  try{
    const id=window._auditMailId;
    if(id) await SB.updateVendorAudit(id,{result_sent:true,notify_sent:true});
    const mailHref=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(mailHref,'_blank');
    Modal.close();
    Toast.show('메일 앱이 열렸습니다. 직접 발송해 주세요.','info');
  }catch(e){
    Toast.show('메일 정보 저장 중 오류가 발생했습니다: '+(e.message||e),'err');
  }
},

/* [v2.116] 업체평가 결과 통보 메일 — 보류 문서 제안사항 반영
   (업체심사 _auditSendMail/_auditMailSend와 동일 패턴, 평가 전용) */
async _evalSendMail(id){
  const ev=(DB.vendor_evals||[]).find(r=>r.id===id);
  if(!ev){Toast.show('평가 데이터를 찾을 수 없습니다.','err');return;}
  const vendor=(DB.vendors||[]).find(v=>v.vendor_name===ev.vendor_name);
  const email=vendor?.email||'';
  Modal.open({
    title:'📧 평가 결과 통보 메일',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">취소</button>'
        +'<button class="btn bpri" onclick="Pages._evalMailSend()">📧 발송</button>',
    body:`<div class="fg2">
      <div class="fgroup ff"><label class="fl req">수신 이메일</label>
        <input class="fc" id="mailTo" value="${H.e(email)}" placeholder="vendor@company.com"></div>
      <div class="fgroup ff"><label class="fl req">제목</label>
        <input class="fc" id="mailSubj" value="[INNODIS QMS] ${H.e(ev.vendor_name)} 공급업체 평가 결과 통보 (${H.e(ev.period||'')})"></div>
      <div class="fgroup" style="grid-column:1/-1"><label class="fl">내용</label>
        <textarea class="fc" id="mailBody" rows="8">${H.e(`안녕하세요.

INNODIS 품질관리팀에서 공급업체 평가 결과를 통보드립니다.

◈ 평가 개요
  - 업체명: ${ev.vendor_name}
  - 평가기간: ${ev.period||'-'}
  - 평가일: ${ev.eval_date||'-'}
  - 종합점수: ${ev.total??'-'}점 (${ev.grade||'-'}등급)

◈ 세부 점수
  - 품질(40%): ${ev.quality??'-'}점
  - 납기(30%): ${ev.delivery??'-'}점
  - 가격(20%): ${ev.price??'-'}점
  - 대응(10%): ${ev.response??'-'}점
  - PPM: ${ev.ppm??0} / 클레임: ${ev.complaint??0}건

◈ 비고
${ev.note||'없음'}

향후에도 지속적인 품질 향상에 협조해 주시기 바랍니다.

INNODIS 품질관리팀 드림`)}</textarea></div>
    </div>`,
  });
  window._evalMailId=id;
},
async _evalMailSend(){
  const to=document.getElementById('mailTo')?.value.trim();
  const subj=document.getElementById('mailSubj')?.value.trim();
  const body=document.getElementById('mailBody')?.value.trim();
  if(!to){Toast.show('수신 이메일을 입력하세요.','warn');return;}
  if(!subj){Toast.show('제목을 입력하세요.','warn');return;}
  try{
    const id=window._evalMailId;
    if(id) await SB.updateVendorEval(id,{notify_sent:true});
    const mailHref=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(mailHref,'_blank');
    Modal.close();
    Toast.show('메일 앱이 열렸습니다. 직접 발송해 주세요.','info');
  }catch(e){
    Toast.show('메일 정보 저장 중 오류가 발생했습니다: '+(e.message||e),'err');
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

    <!-- [v2.116] 검색조건 + 퀵서치 + F3 추가 -->
    <div class="tbar">
      <div class="sw2"><input type="text" id="planSearch" placeholder="거래처명, 심사유형 검색..."
        oninput="Pages._sqmPlanRefresh()"></div>
      <select class="fsel" id="planStatusF" onchange="Pages._sqmPlanRefresh()">
        <option value="">전체 상태</option>
        ${['계획','진행중','완료','보류'].map(s=>`<option>${s}</option>`).join('')}
      </select>
      <button class="btn bout bsm" onclick="Pages._sqmPlanQuick('upcoming')" title="계획 상태만 보기">⏰ 임박심사</button>
      <button class="btn bout bsm" onclick="Pages._sqmPlanQuick('')" title="필터 초기화">↺ 초기화</button>
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_plan')" title="검색 팝업">🔎 <span class="kbd">F3</span></button>
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

  Pages._sqmPlanRefresh();
},
/* [v2.116] 심사계획관리 — 검색/필터 적용 후 칸반 재렌더 */
_sqmPlanRefresh(){
  const q=(document.getElementById('planSearch')?.value||'').toLowerCase();
  const st=document.getElementById('planStatusF')?.value||'';
  const au=(DB.vendor_audits||[]).filter(a=>{
    const mQ=!q||(a.vendor_name||'').toLowerCase().includes(q)||(a.audit_type||'').toLowerCase().includes(q);
    const mS=!st||a.status===st;
    return mQ&&mS;
  });
  const el=document.getElementById('planKanban');
  if(el){
    const cols=['계획','진행중','완료','보류'];
    const CC={계획:'#2563eb',진행중:'#d97706',완료:'#059669',보류:'#dc2626'};
    let h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">';
    cols.forEach(stKey=>{
      const items=au.filter(a=>a.status===stKey);
      h+=`<div style="background:var(--bg2);border-radius:8px;border-top:3px solid ${CC[stKey]}">`;
      h+=`<div style="padding:10px 14px;font-size:13px;font-weight:700;color:${CC[stKey]}">${stKey} <span style="background:${CC[stKey]};color:#fff;border-radius:20px;padding:1px 8px;font-size:11px">${items.length}</span></div>`;
      h+='<div style="padding:4px 8px 8px">';
      items.forEach(a=>{
        h+=`<div class="card" style="padding:10px 12px;margin-bottom:8px;cursor:pointer"
          onclick="Pages._sqmAuditDetail(${JSON.stringify(a).replace(/</g,'\\u003c').replace(/"/g,'&quot;')})">
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
/* [v2.116] 퀵서치 버튼 — 'upcoming': 계획 상태만, '': 전체 초기화 */
_sqmPlanQuick(mode){
  const sEl=document.getElementById('planSearch'); if(sEl) sEl.value='';
  const stEl=document.getElementById('planStatusF'); if(stEl) stEl.value=mode==='upcoming'?'계획':'';
  Pages._sqmPlanRefresh();
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
        <div class="psub">거래처명 기준으로 수입·공정·구매·외주·최종검사 5종 통합 조회</div></div>
    </div>
    <div class="tbar">
      <div class="sw2"><input type="text" id="delivSearch" placeholder="거래처명으로 검색 (필수) — 품목코드/LOT번호도 가능"
        oninput="Pages._delivRefresh()"></div>
      <select class="fsel" id="delivTypeF" onchange="Pages._delivRefresh()">
        <option value="">검사구분 전체</option>
        <option value="수입">수입검사</option>
        <option value="공정">공정검사</option>
        <option value="구매">구매검사</option>
        <option value="외주">외주검사</option>
        <option value="최종">최종검사</option>
      </select>
      <select class="fsel" id="delivResultF" onchange="Pages._delivRefresh()">
        <option value="">전체 판정</option>
        <option>합격</option><option>불합격</option>
      </select>
      <button class="btn bout bsm" onclick="SearchPop.open('sqm_delivery')" title="검색 팝업">🔎 <span class="kbd">F3</span></button>
    </div>
    <div id="delivTbl"></div>`;
  Pages._delivRefresh();
},

/* [v2.122] 납품이력 — 거래처명 기준 검사 5종(수입/공정/구매/외주/최종) 통합 검색으로 재설계
   변경전: 수입검사(type==='수입')만 대상이라 공정/구매/외주/최종 데이터는 조회 불가했음
   변경후: 검사구분 필터(기본값 전체=5종 모두)로 type 제한 없이 조회,
           거래처명 검색이 비어있으면 안내 메시지 표시(데이터량이 많아 거래처명 입력을 유도) */
_delivRefresh(){
  const q=(document.getElementById('delivSearch')?.value||'').trim();
  const ql=q.toLowerCase();
  const tp=document.getElementById('delivTypeF')?.value||'';
  const rs=document.getElementById('delivResultF')?.value||'';
  /* [v2.122] 검사 5종(수입/공정/구매/외주/최종) 전체 대상 — type 필터는 선택사항 */
  const allInsp=(DB.inspections||[]).filter(r=>['수입','공정','구매','외주','최종'].includes(r.type));
  /* 거래처명 검색이 비어있으면 안내만 표시(전체 데이터가 많아 거래처명 입력을 유도) */
  if(!q){
    const tbl=document.getElementById('delivTbl');
    if(tbl) tbl.innerHTML='<div style="text-align:center;padding:40px;color:var(--tm)">거래처명을 입력하면 해당 거래처의 수입·공정·구매·외주·최종검사 이력을 모두 조회합니다.</div>';
    return;
  }
  const filtered=allInsp.filter(r=>{
    /* [v2.123] 거래처명(vendor) 우선 단독 검색 — inspections 테이블 실제 컬럼은
       vendor_name이 아니라 vendor임(addInspection 저장 로직과 동일하게 통일).
       이전엔 item_code/lot_no와 OR로 묶여 거래처명이 아닌 다른 필드로
       매칭되는 것처럼 보이던 버그 수정 */
    const mQ=(r.vendor||'').toLowerCase().includes(ql);
    const mT=!tp||r.type===tp;
    const mR=!rs||r.result===rs;
    return mQ&&mT&&mR;
  });
  /* 합부율 계산 */
  const total=filtered.length;
  const pass=filtered.filter(r=>r.result==='합격').length;
  const passRate=total>0?(pass/total*100).toFixed(1):'N/A';

  const vnMaxLen=Math.max(6,...filtered.map(r=>(r.vendor||'').length));
  const vnWidth=Math.min(180,Math.max(90,vnMaxLen*15+24))+'px';
  Tbl.render({
    el:'#delivTbl',
    cols:[
      {key:'insp_date',   label:'검사일',   w:'90px', req:true},
      {key:'type',        label:'검사구분', w:'80px', align:'center',
        render:v=>`<span class="badge bblu" style="font-size:10px">${H.e(v||'-')}</span>`},
      {key:'vendor',      label:'거래처명', w:vnWidth},
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
/* [v2.154] SPC 관리 항목 관리 페이지 */
async spc_items(){
  /* [v2.161] SPC 관리 항목 — 등록일/작성자 컬럼 추가, 접이식 인라인 검색 패널(F3)
     검색 조건: 등록일(시작~종료), 작성자, 품목코드, 품목명, 공정, 관리특성 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  const items=await SB.getSpcItems();
  window._spcItems=items;
  window._spcItemSearchOpen=false; /* 검색 패널 열림 상태 */

  const render=(list)=>{
    Tbl.render({
      el:'#spcItemTbl',
      cols:[
        {key:'item_code', label:'품목코드', w:'90px',
          render:v=>v?`<span style="font-family:monospace;font-size:12px">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
        {key:'item_name', label:'품목명', w:'*',
          render:v=>`<span style="font-weight:600">${H.e(v)}</span>`},
        {key:'process',   label:'공정',   w:'90px'},
        {key:'char_name', label:'관리특성', w:'90px'},
        {key:'spec_upper',label:'USL', w:'66px', align:'right',
          render:v=>`<span style="font-family:monospace;color:#dc2626;font-size:12px">${v??'-'}</span>`},
        {key:'spec_lower',label:'LSL', w:'66px', align:'right',
          render:v=>`<span style="font-family:monospace;color:#2563eb;font-size:12px">${v??'-'}</span>`},
        {key:'target',    label:'Target', w:'60px', align:'right',
          render:v=>v!=null?`<span style="font-family:monospace;font-size:12px">${v}</span>`:'<span style="color:var(--tl)">-</span>'},
        {key:'subgroup_size',label:'n', w:'36px', align:'center'},
        {key:'unit',      label:'단위', w:'44px', align:'center'},
        /* [v2.161] 등록일 컬럼 추가 */
        {key:'created_at',label:'등록일', w:'88px', align:'center',
          render:v=>v?`<span style="font-size:12px;color:var(--muted)">${(v||'').slice(0,10)}</span>`:'<span style="color:var(--tl)">-</span>'},
        /* [v2.161] 작성자 컬럼 추가 */
        {key:'created_by',label:'작성자', w:'72px', align:'center',
          render:v=>v?`<span style="font-size:12px">${H.e(v)}</span>`:'<span style="color:var(--tl)">-</span>'},
        {key:'id', label:'관리도', w:'56px', align:'center',
          render:v=>`<button class="btn bxs bblu bsm" title="관리도로 이동"
            onclick="event.stopPropagation();Nav.go('spc_chart');
              setTimeout(()=>{const s=document.getElementById('spcChartSel');
              if(s){s.value=${v};Pages._spcChartRender(${v});}},500)">📈</button>`},
      ],
      data:list,
      onRow:row=>Pages._spcItemForm(row),
      onDel:async(ids)=>{
        if(!ids.length){Toast.show('삭제할 항목을 선택하세요.','warn');return;}
        Modal.confirm({title:'🗑️ 항목 삭제',
          msg:`<b>${ids.length}건</b>의 관리 항목과 연결된 모든 측정 데이터가 삭제됩니다.`,
          danger:true,
          onOk:async()=>{
            for(const id of ids){await SB.deleteSpcItem(id);}
            window._spcItems=(window._spcItems||[]).filter(it=>!ids.includes(it.id));
            Toast.show('삭제되었습니다.','ok');Modal.close();Pages.spc_items();
          }
        });
      }
    });
  };

  /* 검색 필터 적용 함수 */
  const applyFilter=()=>{
    const sv=id=>(document.getElementById(id)?.value||'').trim().toLowerCase();
    const dateFrom=document.getElementById('spiFrom')?.value||'';
    const dateTo  =document.getElementById('spiTo')?.value||'';
    const author  =sv('spiAuthor');
    const code    =sv('spiSCode');
    const name    =sv('spiSName');
    const process =sv('spiSProc');
    const char    =sv('spiSChar');
    const filtered=(window._spcItems||[]).filter(it=>{
      const d=(it.created_at||'').slice(0,10);
      if(dateFrom&&d&&d<dateFrom) return false;
      if(dateTo&&d&&d>dateTo)   return false;
      if(author&&!(it.created_by||'').toLowerCase().includes(author)) return false;
      if(code&&!(it.item_code||'').toLowerCase().includes(code))      return false;
      if(name&&!(it.item_name||'').toLowerCase().includes(name))      return false;
      if(process&&!(it.process||'').toLowerCase().includes(process))  return false;
      if(char&&!(it.char_name||'').toLowerCase().includes(char))      return false;
      return true;
    });
    /* 건수 배지 갱신 */
    const badge=document.getElementById('spiFilterBadge');
    const isFiltered=dateFrom||dateTo||author||code||name||process||char;
    if(badge) badge.textContent=isFiltered?`${filtered.length}건`:'';
    render(filtered);
  };

  /* 검색 패널 토글 */
  window._spcItemToggleSearch=()=>{
    window._spcItemSearchOpen=!window._spcItemSearchOpen;
    const panel=document.getElementById('spiSearchPanel');
    const btn=document.getElementById('spiSearchBtn');
    if(!panel||!btn) return;
    panel.style.display=window._spcItemSearchOpen?'block':'none';
    btn.classList.toggle('bpri', window._spcItemSearchOpen);
    btn.classList.toggle('bout', !window._spcItemSearchOpen);
    if(window._spcItemSearchOpen){
      setTimeout(()=>document.getElementById('spiSCode')?.focus(),50);
    }
  };
  /* 검색 초기화 */
  window._spcItemResetSearch=()=>{
    ['spiFrom','spiTo','spiAuthor','spiSCode','spiSName','spiSProc','spiSChar']
      .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    render(window._spcItems||[]);
    const badge=document.getElementById('spiFilterBadge');
    if(badge) badge.textContent='';
  };

  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">📋 SPC 관리 항목</div>
         <div class="psub">X-bar R 관리도 / Cpk 분석 대상 품목·공정·규격 관리</div></div>
    <div class="pac">
      <button id="spiSearchBtn" class="btn bout bsm" onclick="_spcItemToggleSearch()">
        🔍 검색 <span id="spiFilterBadge" style="margin-left:4px;color:#ef4444;font-weight:700"></span>
        <span class="kbd">F3</span>
      </button>
      <button class="btn bout bsm" onclick="ExcelMgr.download('spc_items')" title="작성 양식 다운로드">📄 양식 다운로드</button>
      <button class="btn bout bsm" onclick="ExcelMgr.openUpload('spc_items')" title="엑셀 일괄 등록">📥 엑셀 업로드</button>
      <button class="btn bpri bsm btn-f2" onclick="Pages._spcItemForm()">+ 항목 등록 <span class="kbd">F2</span></button>
    </div>
  </div>

  <!-- [v2.161] 접이식 인라인 검색 패널 — 기본 숨김, F3/버튼으로 토글 -->
  <div id="spiSearchPanel" style="display:none;background:var(--card);border:1px solid var(--brd);
    border-radius:10px;padding:16px 20px;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;align-items:end">
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">등록일(시작)</label>
        <input type="date" class="fc" id="spiFrom" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">등록일(종료)</label>
        <input type="date" class="fc" id="spiTo" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">작성자</label>
        <input class="fc" id="spiAuthor" placeholder="이름 검색" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">품목코드</label>
        <input class="fc" id="spiSCode" placeholder="코드 검색" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">품목명</label>
        <input class="fc" id="spiSName" placeholder="품목명 검색" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">공정</label>
        <input class="fc" id="spiSProc" placeholder="공정 검색" oninput="applyFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">관리특성</label>
        <input class="fc" id="spiSChar" placeholder="특성 검색" oninput="applyFilter()">
      </div>
      <div style="align-self:end;display:flex;gap:6px">
        <button class="btn bpri bsm" onclick="applyFilter()">🔍 적용</button>
        <button class="btn bout bsm" onclick="_spcItemResetSearch()">🔄 초기화</button>
      </div>
    </div>
  </div>

  <div id="spcItemTbl"></div>`;

  render(items);
},


/* ════ SPC 통계관리 [v2.154 전면 재작성] ════
   기존: DB2 더미 데이터만 사용, 선택 변경 시 차트 미갱신, n=5 하드코딩
   변경: Supabase spc_items + spc_subgroups 실데이터 연동
         관리 항목 등록/수정/삭제 + 서브그룹 데이터 입력/삭제
         X-bar R 계수 n=2~10 동적 적용
         파레토: inspections 테이블 실데이터 연계 (더미 제거)
   ═══════════════════════════════════════════════════════════ */

/* ── X-bar R 차트 계수 (n=2~10) ──
   ASTM/KS A 3001 기준 A2, D3, D4 계수 */
_spcConst:{
  2:{A2:1.880,D3:0,D4:3.267},
  3:{A2:1.023,D3:0,D4:2.574},
  4:{A2:0.729,D3:0,D4:2.282},
  5:{A2:0.577,D3:0,D4:2.114},
  6:{A2:0.483,D3:0,D4:2.004},
  7:{A2:0.419,D3:0.076,D4:1.924},
  8:{A2:0.373,D3:0.136,D4:1.864},
  9:{A2:0.337,D3:0.184,D4:1.816},
  10:{A2:0.308,D3:0.223,D4:1.777},
},

/* ── SPC 공통 — 항목 select 옵션 생성 ── */
_spcItemOpts(items, selId){
  if(!items||!items.length) return '<option value="">등록된 항목 없음</option>';
  return items.map(it=>{
    /* [v2.159] 품목코드 · 품목명 — 관리특성 (단위) 포맷으로 표시 */
    const code=it.item_code?it.item_code+' · ':'';
    const name=it.item_name||'';
    const char=it.char_name||'';
    const unit=it.unit?` (${it.unit})`:'';
    const label=`${code}${name}${name&&char?' — ':''}${char}${unit}`;
    return `<option value="${it.id}" ${it.id==selId?'selected':''}>${H.e(label)}</option>`;
  }).join('');
},

/* ══════════════════════════════════════════════════
   1. 관리도 (X-bar R Chart)
   ══════════════════════════════════════════════════ */
async spc_chart(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  const items=await SB.getSpcItems();
  window._spcItems=items;

  if(!items.length){
    w.innerHTML=`<div class="ph"><div><div class="ptit">📈 X-bar R 관리도</div></div>
      <div class="pac"><button class="btn bpri" onclick="Pages._spcItemForm()">+ 관리 항목 등록</button></div></div>
      <div class="card"><div class="es"><div class="es-icon">📋</div>
      <div>등록된 관리 항목이 없습니다.</div>
      <button class="btn bpri" style="margin-top:12px" onclick="Pages._spcItemForm()">+ 첫 번째 항목 등록</button>
      </div></div>`;
    return;
  }
  const selId=items[0].id;
  window._spcSelId=selId;

  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">📈 X-bar R 관리도</div>
         <div class="psub">공정 안정성 모니터링 — 관리 한계선 이탈 자동 감지</div></div>
    <div class="pac">
      <button class="btn bout bsm" onclick="Pages._spcItemForm()">+ 항목 등록</button>
      <button class="btn bout bsm" onclick="ExcelMgr.download('spc_subgroups')" title="측정데이터 양식 다운로드">📄 양식</button>
      <button class="btn bout bsm" onclick="ExcelMgr.openUpload('spc_subgroups')" title="측정데이터 엑셀 일괄 업로드">📥 일괄 업로드</button>
      <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._aiSpcAnalyze(window._spcSelId)" title="AI로 이상 원인 분석">🤖 AI 분석</button>
      <button class="btn bpri bsm" onclick="Pages._spcDataForm(window._spcSelId)">+ 데이터 입력</button>
    </div>
  </div>
  <div class="tbar">
    <select class="fsel" id="spcChartSel" style="min-width:260px"
      onchange="window._spcSelId=+this.value;Pages._spcChartRender(window._spcSelId)">
      ${Pages._spcItemOpts(items,selId)}
    </select>
    <button class="btn bout bsm" onclick="Pages._spcItemEdit(window._spcSelId)">✏️ 항목 수정</button>
    <button class="btn bout bsm" onclick="Pages._spcItemList()">📋 전체 항목 관리</button>
  </div>
  <div id="spcChartArea"></div>`;

  await Pages._spcChartRender(selId);
},

async _spcChartRender(itemId){
  const el=document.getElementById('spcChartArea');
  if(!el) return;
  el.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>데이터 조회 중...</div></div>';

  const item=(window._spcItems||[]).find(it=>it.id===Number(itemId));
  if(!item){el.innerHTML='<div class="es"><div class="es-icon">⚠️</div><div>항목을 찾을 수 없습니다.</div></div>';return;}

  const subs=await SB.getSpcSubgroups(itemId);
  if(!subs.length){
    el.innerHTML=`<div class="card"><div class="es" style="padding:40px">
      <div class="es-icon">📊</div>
      <div>측정 데이터가 없습니다.</div>
      <button class="btn bpri" style="margin-top:12px" onclick="Pages._spcDataForm(${itemId})">+ 데이터 입력</button>
    </div></div>`;
    return;
  }

  /* 측정값 파싱 */
  const groups=subs.map(s=>{
    let vals=[];
    try{vals=typeof s.values==='string'?JSON.parse(s.values):s.values;}catch(e){}
    return{date:s.measured_at,vals:vals.map(Number).filter(v=>!isNaN(v)),id:s.id,memo:s.memo||''};
  }).filter(g=>g.vals.length>0);

  if(!groups.length){el.innerHTML='<div class="card es" style="padding:40px">유효한 측정값 없음</div>';return;}

  const n=item.subgroup_size||5;
  const C=Pages._spcConst[n]||Pages._spcConst[5];
  const means=groups.map(g=>g.vals.reduce((s,v)=>s+v,0)/g.vals.length);
  const ranges=groups.map(g=>Math.max(...g.vals)-Math.min(...g.vals));
  const Xbar=means.reduce((s,v)=>s+v,0)/means.length;
  const Rbar=ranges.reduce((s,v)=>s+v,0)/ranges.length;
  const UCLx=Xbar+C.A2*Rbar, LCLx=Xbar-C.A2*Rbar;
  const UCLr=C.D4*Rbar, LCLr=C.D3*Rbar;
  const fmt=v=>v.toFixed(4);

  const xPass=v=>v>=LCLx&&v<=UCLx;
  const rPass=v=>v>=LCLr&&v<=UCLr;
  const xOOC=means.filter(v=>!xPass(v)).length;
  const rOOC=ranges.filter(v=>!rPass(v)).length;

  /* SVG 생성 헬퍼 */
  const mkChart=(vals,ucl,cl,lcl,pf,label)=>{
    const cW=600,cH=160,pad=40;
    const mn=Math.min(...vals,lcl)-Math.abs(cl)*0.01;
    const mx=Math.max(...vals,ucl)+Math.abs(cl)*0.01;
    const sy=v=>pad+(cH-2*pad)*(1-(v-mn)/(mx-mn||1));
    const sx=i=>pad+(cW-2*pad)*i/(Math.max(vals.length-1,1));
    const path=vals.map((v,i)=>`${i===0?'M':'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    const dots=vals.map((v,i)=>`<circle cx="${sx(i).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="4" fill="${pf(v)?'#22c55e':'#ef4444'}"/>`).join('');
    const labels=groups.map((g,i)=>`<text x="${sx(i).toFixed(1)}" y="${cH-4}" font-size="9" text-anchor="middle" fill="#94a3b8">${g.date.slice(5)}</text>`).join('');
    const hline=(y,col,dash,txt)=>{
      const yy=sy(y).toFixed(1);
      return `<line x1="${pad}" y1="${yy}" x2="${cW-pad}" y2="${yy}" stroke="${col}" stroke-width="1.5" ${dash?'stroke-dasharray="4"':''}/>`
        +`<text x="${cW-pad+4}" y="${+yy+4}" font-size="9" fill="${col}">${txt}=${y.toFixed(4)}</text>`;
    };
    return `<div class="card" style="padding:14px 18px"><div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text)">${label}</div>
    <svg width="100%" viewBox="0 0 ${cW} ${cH}" style="overflow:visible">
      ${hline(ucl,'#ef4444',true,'UCL')}
      ${hline(cl,'#2563eb',false,'CL')}
      ${lcl>0?hline(lcl,'#ef4444',true,'LCL'):''}
      <path d="${path}" fill="none" stroke="#64748b" stroke-width="1.5"/>
      ${dots}${labels}
    </svg></div>`;
  };

  el.innerHTML=`
  <div class="stat-dash" style="margin-bottom:14px">
    <div class="sd-card"><div class="sd-icon" style="background:#dbeafe;color:#2563eb">n</div>
      <div><div class="sd-val">${n}</div><div class="sd-lbl">서브그룹 크기</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">k</div>
      <div><div class="sd-val">${groups.length}</div><div class="sd-lbl">서브그룹 수</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#dcfce7;color:#16a34a">X̄</div>
      <div><div class="sd-val">${fmt(Xbar)}</div><div class="sd-lbl">총 평균</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef9c3;color:#ca8a04">R̄</div>
      <div><div class="sd-val">${fmt(Rbar)}</div><div class="sd-lbl">평균 범위</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:${xOOC||rOOC?'#fee2e2':'#dcfce7'};color:${xOOC||rOOC?'#dc2626':'#16a34a'}">${xOOC||rOOC?'⚠️':'✅'}</div>
      <div><div class="sd-val" style="color:${xOOC||rOOC?'#dc2626':'#16a34a'}">${xOOC+rOOC}</div><div class="sd-lbl">이상점 합계</div></div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    ${mkChart(means,UCLx,Xbar,LCLx,xPass,'📊 X-bar 관리도 (평균)')}
    ${mkChart(ranges,UCLr,Rbar,LCLr,rPass,'📊 R 관리도 (범위)')}
  </div>
  <div class="card" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:var(--text)">📋 측정 데이터 목록</div>
      <button class="btn bpri bsm" onclick="Pages._spcDataForm(${itemId})">+ 데이터 추가</button>
    </div>
    <div style="overflow-x:auto"><table class="dt" style="width:100%;font-size:13px">
      <thead><tr><th style="width:88px">측정일</th><th>측정값 (${item.unit||''})</th>
        <th style="width:60px">평균</th><th style="width:60px">범위</th>
        <th style="width:50px">X판정</th><th style="width:50px">R판정</th>
        <th style="width:60px">메모</th><th style="width:48px">삭제</th></tr></thead>
      <tbody>${groups.map((g,i)=>`<tr>
        <td>${g.date}</td>
        <td style="font-family:monospace;font-size:12px">${g.vals.join(' / ')}</td>
        <td style="text-align:center;font-weight:700;color:${xPass(means[i])?'#16a34a':'#dc2626'}">${means[i].toFixed(4)}</td>
        <td style="text-align:center">${ranges[i].toFixed(4)}</td>
        <td style="text-align:center"><span class="badge ${xPass(means[i])?'bgrn':'bred'}" style="font-size:10px">${xPass(means[i])?'정상':'이탈'}</span></td>
        <td style="text-align:center"><span class="badge ${rPass(ranges[i])?'bgrn':'bred'}" style="font-size:10px">${rPass(ranges[i])?'정상':'이탈'}</span></td>
        <td style="color:var(--muted);font-size:12px">${H.e(g.memo)}</td>
        <td style="text-align:center"><button class="btn bxs berr" style="font-size:11px"
          onclick="Pages._spcSubgroupDel(${g.id},${itemId})">✕</button></td>
      </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
},

/* ══════════════════════════════════════════════════
   2. 공정능력 (Cp / Cpk)
   ══════════════════════════════════════════════════ */
async spc_cpk(){
  const w=document.getElementById('pw');
  w.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>로딩 중...</div></div>';
  const items=await SB.getSpcItems();
  window._spcItems=items;

  if(!items.length){
    w.innerHTML=`<div class="ph"><div><div class="ptit">🎯 공정능력 (Cp/Cpk)</div></div>
      <div class="pac"><button class="btn bpri" onclick="Pages._spcItemForm()">+ 관리 항목 등록</button></div></div>
      <div class="card"><div class="es"><div class="es-icon">📋</div><div>등록된 관리 항목이 없습니다.</div></div></div>`;
    return;
  }
  const selId=items[0].id;
  window._spcSelId=selId;

  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">🎯 공정능력 (Cp/Cpk)</div>
         <div class="psub">공정이 규격을 얼마나 잘 만족하는지 수치화</div></div>
    <div class="pac">
      <button class="btn bout bsm" onclick="ExcelMgr.download('spc_subgroups')" title="측정데이터 양식 다운로드">📄 양식</button>
      <button class="btn bout bsm" onclick="ExcelMgr.openUpload('spc_subgroups')" title="측정데이터 엑셀 일괄 업로드">📥 일괄 업로드</button>
      <button class="btn bpri bsm" onclick="Pages._spcDataForm(window._spcSelId)">+ 데이터 입력</button>
    </div>
  </div>
  <div class="tbar">
    <select class="fsel" id="spcCpkSel" style="min-width:260px"
      onchange="window._spcSelId=+this.value;Pages._spcCpkRender(window._spcSelId)">
      ${Pages._spcItemOpts(items,selId)}
    </select>
  </div>
  <div id="spcCpkArea"></div>`;

  await Pages._spcCpkRender(selId);
},

async _spcCpkRender(itemId){
  const el=document.getElementById('spcCpkArea');
  if(!el) return;
  el.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>계산 중...</div></div>';

  const item=(window._spcItems||[]).find(it=>it.id===Number(itemId));
  if(!item){el.innerHTML='<div class="es"><div class="es-icon">⚠️</div><div>항목 없음</div></div>';return;}

  const subs=await SB.getSpcSubgroups(itemId);
  const allVals=subs.flatMap(s=>{
    try{return(typeof s.values==='string'?JSON.parse(s.values):s.values).map(Number).filter(v=>!isNaN(v));}catch(e){return[];}
  });

  if(allVals.length<4){
    el.innerHTML=`<div class="card"><div class="es" style="padding:40px">
      <div class="es-icon">📊</div><div>Cpk 계산에는 최소 4개 이상의 측정값이 필요합니다.</div>
      <button class="btn bpri" style="margin-top:12px" onclick="Pages._spcDataForm(${itemId})">+ 데이터 입력</button>
    </div></div>`;
    return;
  }

  const n2=allVals.length;
  const mean=allVals.reduce((s,v)=>s+v,0)/n2;
  const std=Math.sqrt(allVals.reduce((s,v)=>s+(v-mean)**2,0)/(n2-1));
  const usl=item.spec_upper, lsl=item.spec_lower, tgt=item.target;
  if(usl==null||lsl==null){
    el.innerHTML='<div class="card es" style="padding:32px">⚠️ 관리 항목에 USL/LSL(규격 상/하한)을 등록해야 합니다.</div>';
    return;
  }
  const cp=((usl-lsl)/(6*std));
  const cpu=((usl-mean)/(3*std));
  const cpl=((mean-lsl)/(3*std));
  const cpk=Math.min(cpu,cpl);
  const grade=cpk>=1.67?'A':cpk>=1.33?'B':cpk>=1.0?'C':'D';
  const gLbl={A:'우수',B:'양호',C:'보통',D:'개선 필수'};
  const gCol={A:'#16a34a',B:'#2563eb',C:'#d97706',D:'#dc2626'};
  const col=gCol[grade];

  /* 히스토그램 */
  const bins=12;
  const step=(usl-lsl)/bins;
  const hist=Array(bins).fill(0);
  const outOfSpec=allVals.filter(v=>v<lsl||v>usl).length;
  allVals.forEach(v=>{
    const b=Math.min(bins-1,Math.max(0,Math.floor((v-lsl)/step)));
    hist[b]++;
  });
  const maxH=Math.max(...hist)||1;

  el.innerHTML=`
  <div class="stat-dash" style="margin:14px 0">
    <div class="sd-card" style="border:2px solid ${col}22">
      <div class="sd-icon" style="background:${col}22;color:${col};font-size:20px;font-weight:900">${grade}</div>
      <div><div class="sd-val" style="color:${col}">${cpk.toFixed(3)}</div><div class="sd-lbl">Cpk</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📏</div>
      <div><div class="sd-val">${cp.toFixed(3)}</div><div class="sd-lbl">Cp</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#dcfce7;color:#16a34a">⬆️</div>
      <div><div class="sd-val">${cpu.toFixed(3)}</div><div class="sd-lbl">Cpu</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef9c3;color:#ca8a04">⬇️</div>
      <div><div class="sd-val">${cpl.toFixed(3)}</div><div class="sd-lbl">Cpl</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f1f5f9;color:#475569">μ</div>
      <div><div class="sd-val">${mean.toFixed(4)}</div><div class="sd-lbl">평균</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#ede9fe;color:#7c3aed">σ</div>
      <div><div class="sd-val">${std.toFixed(4)}</div><div class="sd-lbl">표준편차</div></div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="card">
      <div style="font-size:13px;font-weight:700;margin-bottom:14px;color:var(--text)">📊 히스토그램</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:0 4px">
        ${hist.map((h,i)=>{
          const binVal=lsl+step*(i+0.5);
          const inSpec=binVal>=lsl&&binVal<=usl;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="width:100%;background:${inSpec?'#3b82c6':'#f87171'};height:${Math.round(h/maxH*100)}px;border-radius:2px 2px 0 0;min-height:${h>0?2:0}px"></div>
            <div style="font-size:7px;color:var(--muted);transform:rotate(-30deg);white-space:nowrap">${binVal.toFixed(2)}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:8px;padding:6px 4px;background:var(--bg2);border-radius:6px">
        <span style="color:#dc2626;font-weight:700">LSL: ${lsl}</span>
        ${tgt!=null?`<span style="color:#2563eb;font-weight:700">T: ${tgt}</span>`:''}
        <span style="color:#dc2626;font-weight:700">USL: ${usl}</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:${outOfSpec?'#dc2626':'#16a34a'}">
        규격 이탈: ${outOfSpec}/${n2}개 (${(outOfSpec/n2*100).toFixed(1)}%)
      </div>
    </div>
    <div class="card">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text)">📋 공정능력 판정 기준</div>
      <div style="padding:14px;background:${col}15;border:2px solid ${col}44;border-radius:8px;text-align:center;margin-bottom:12px">
        <div style="font-size:24px;font-weight:900;color:${col}">${gLbl[grade]}</div>
        <div style="font-size:13px;color:${col};margin-top:4px">Cpk = ${cpk.toFixed(3)}</div>
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        ${[['1.67 이상','A','우수','#16a34a'],['1.33 ~ 1.67','B','양호','#2563eb'],['1.00 ~ 1.33','C','보통','#d97706'],['1.00 미만','D','개선 필수','#dc2626']]
          .map(([r,g,l,c])=>`<tr style="border-bottom:1px solid var(--brd);background:${g===grade?c+'15':''}">
            <td style="padding:6px 10px">${r}</td>
            <td style="padding:6px 10px;text-align:center"><span class="badge" style="background:${c}22;color:${c};font-weight:800">${g}</span></td>
            <td style="padding:6px 10px;color:${c};font-weight:${g===grade?700:400}">${l}</td>
          </tr>`).join('')}
      </table>
    </div>
  </div>`;
},

/* ══════════════════════════════════════════════════
   3. 파레토 분석 — inspections 실데이터 연계
   ══════════════════════════════════════════════════ */
async spc_pareto(){
  /* [v2.159] 파레토 분석 — 검사 기간(시작~종료), 공급사, 불량유형 필터 추가
     부적합관리 선택 시 nonconformances(NC) 테이블과 연동 */
  const w=document.getElementById('pw');
  w.innerHTML='<div class="es"><div class="es-icon">⏳</div><div>데이터 로딩 중...</div></div>';
  let inspData=[];
  try{inspData=await SB.getInspections();}catch(e){inspData=DB.inspections||[];}
  window._spcInspData=inspData;
  window._spcNcData=DB.nc||[];

  const today=new Date().toISOString().slice(0,10);
  const sixMoAgo=new Date(); sixMoAgo.setMonth(sixMoAgo.getMonth()-6);
  const fromDate=sixMoAgo.toISOString().slice(0,10);

  Pages._spcParetoRender(inspData,{from:fromDate,to:today,type:'all',vendor:'',defect:''});
},

/* [v2.159] _spcParetoRender 전면 재작성
   filters: {from, to, type, vendor, defect}
   type = 'all'|'수입검사'|'공정검사'|'구매검사'|'외주검사'|'최종검사'|'부적합관리'
   부적합관리 선택 시 → DB.nc(nonconformances)에서 desc(불량내용) 기반 집계 */
_spcParetoRender(inspData, filters){
  /* [v2.166] 구조 분리 수정
     기존: 필터 변경마다 w.innerHTML 전체 재렌더 → pDefect 포커스 소실 → 타이핑 불가
     변경: 필터 UI는 최초 1회만 그리고, 차트 영역(#paretoChart)만 재렌더
     _spcParetoFilter → _spcParetoChartRender(filters) 분리 */
  const w=document.getElementById('pw');
  const f=filters||{};
  const from=f.from||''; const to=f.to||'';
  const type=f.type||'all';
  const vendor=(f.vendor||'').trim();
  const defect=(f.defect||'').trim();
  const isNc=(type==='부적합관리');

  /* 공급사 드롭다운 목록 */
  const vendors=[...new Set(inspData.map(r=>r.vendor||'').filter(Boolean))].sort();
  const typeOpts=[
    {val:'all',label:'전체'},
    {val:'수입검사',label:'수입검사'},{val:'공정검사',label:'공정검사'},
    {val:'구매검사',label:'구매검사'},{val:'외주검사',label:'외주검사'},
    {val:'최종검사',label:'최종검사'},{val:'부적합관리',label:'⚠️ 부적합관리'},
  ].map(t=>`<option value="${t.val}" ${t.val===type?'selected':''}>${t.label}</option>`).join('');
  const vendorOpts=`<option value="">전체 공급사</option>`
    +vendors.map(v=>`<option value="${H.e(v)}" ${v===vendor?'selected':''}>${H.e(v)}</option>`).join('');

  /* 필터 UI가 이미 있으면 값만 갱신하고 차트만 재렌더 */
  const existingPanel=document.getElementById('paretoFilterPanel');
  if(existingPanel){
    /* 검사유형이 바뀌면 공급사 드롭다운/레이블만 교체 */
    const vsel=document.getElementById('pVendor');
    if(vsel) vsel.disabled=isNc;

    Pages._spcParetoChartRender(inspData,{from,to,type,vendor,defect});
    return;
  }

  /* 최초 1회: 전체 UI 렌더 */
  w.innerHTML=`
  <div class="ph">
    <div><div class="ptit">📊 파레토 분석</div>
         <div class="psub">불량 유형별 빈도 분석 — 80/20 법칙</div></div>
  </div>
  <div id="paretoFilterPanel" style="background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;align-items:end">
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">검사일(시작)</label>
        <input type="date" class="fc" id="pFrom" value="${from}" onchange="Pages._spcParetoFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">검사일(종료)</label>
        <input type="date" class="fc" id="pTo" value="${to}" onchange="Pages._spcParetoFilter()">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">검사 유형</label>
        <select class="fc" id="pType" onchange="Pages._spcParetoFilter()">${typeOpts}</select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">공급사</label>
        <select class="fc" id="pVendor" onchange="Pages._spcParetoFilter()" ${isNc?'disabled style="opacity:0.4"':''}>${vendorOpts}</select>
      </div>
      <div>
        <label id="pDefectLabel" style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">${isNc?'불량내용 키워드':'불량유형 키워드'}</label>
        <input class="fc" id="pDefect" value="${H.e(defect)}" placeholder="예) 치수, 외관..."
          oninput="Pages._spcParetoFilter()">
      </div>
      <div style="align-self:end">
        <button class="btn bout bsm" onclick="Pages._spcParetoReset()">🔄 초기화</button>
      </div>
    </div>
  </div>
  <div id="paretoNotice"></div>
  <div id="paretoChart"></div>`;

  Pages._spcParetoChartRender(inspData,{from,to,type,vendor,defect});
},

/* [v2.166] _spcParetoFilter — 필터값 읽어 차트만 재렌더. 포커스 유지 */
_spcParetoFilter(){
  const get=id=>document.getElementById(id)?.value||'';
  const filters={
    from:   get('pFrom'),
    to:     get('pTo'),
    type:   get('pType')||'all',
    vendor: get('pVendor'),
    defect: get('pDefect'),
  };
  const isNc=filters.type==='부적합관리';
  /* 공급사 드롭다운 활성/비활성 갱신 */
  const vsel=document.getElementById('pVendor');
  if(vsel){vsel.disabled=isNc;vsel.style.opacity=isNc?'0.4':'1';}
  /* 레이블 갱신 */
  const lbl=document.getElementById('pDefectLabel');
  if(lbl) lbl.textContent=isNc?'불량내용 키워드':'불량유형 키워드';
  /* 차트만 재렌더 — 필터 UI 건드리지 않음 */
  Pages._spcParetoChartRender(window._spcInspData||[],filters);
},

/* [v2.166] _spcParetoReset — 초기화 */
_spcParetoReset(){
  const today=new Date().toISOString().slice(0,10);
  const sixMoAgo=new Date(); sixMoAgo.setMonth(sixMoAgo.getMonth()-6);
  const fromDate=sixMoAgo.toISOString().slice(0,10);
  ['pFrom','pTo'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=i===0?fromDate:today;});
  const pt=document.getElementById('pType');    if(pt) pt.value='all';
  const pv=document.getElementById('pVendor'); if(pv){pv.value='';pv.disabled=false;pv.style.opacity='1';}
  const pd=document.getElementById('pDefect'); if(pd) pd.value='';
  Pages._spcParetoFilter();
},

/* [v2.166] _spcParetoChartRender — 차트 영역(#paretoChart)만 재렌더 */
_spcParetoChartRender(inspData, filters){
  const el=document.getElementById('paretoChart');
  const noticeEl=document.getElementById('paretoNotice');
  if(!el) return;
  const f=filters||{};
  const from=f.from||''; const to=f.to||'';
  const type=f.type||'all';
  const vendor=(f.vendor||'').trim();
  const defect=(f.defect||'').trim();
  const isNc=(type==='부적합관리');
  const typeMap={'수입검사':'수입','공정검사':'공정','구매검사':'구매','외주검사':'외주','최종검사':'최종'};

  /* 집계 */
  let catMap={};
  if(isNc){
    const ncData=window._spcNcData||DB.nc||[];
    ncData.filter(r=>{
      if(from&&(r.date||'')<from) return false;
      if(to&&(r.date||'')>to) return false;
      if(defect&&!(r.desc||'').toLowerCase().includes(defect.toLowerCase())) return false;
      return true;
    }).forEach(r=>{
      const raw=(r.desc||r.item||'기타').trim()||'기타';
      const cat=raw.length>14?raw.slice(0,14)+'…':raw;
      catMap[cat]=(catMap[cat]||0)+1;
    });
  } else {
    const inspType=typeMap[type]||null;
    inspData.filter(r=>{
      if((r.fail_qty||0)<=0) return false;
      if(from&&(r.insp_date||'')<from) return false;
      if(to&&(r.insp_date||'')>to) return false;
      if(inspType&&r.type!==inspType) return false;
      if(vendor&&!(r.vendor||'').toLowerCase().includes(vendor.toLowerCase())) return false;
      if(defect){
        const hay=((r.note||'')+(r.item_name||'')).toLowerCase();
        if(!hay.includes(defect.toLowerCase())) return false;
      }
      return true;
    }).forEach(r=>{
      const raw=(r.note||r.item_name||'기타').trim()||'기타';
      const cat=raw.length>14?raw.slice(0,14)+'…':raw;
      catMap[cat]=(catMap[cat]||0)+(r.fail_qty||0);
    });
  }

  const sorted=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const total=sorted.reduce((s,[,n])=>s+n,0)||1;
  let cum=0;
  const rows=sorted.map(([cat,cnt])=>{cum+=cnt;return{cat,cnt,cum,pct:Math.round(cum/total*100)};});
  const maxN=sorted[0]?.[1]||1;

  /* 안내 박스 갱신 */
  if(noticeEl){
    noticeEl.innerHTML=isNc
      ?`<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:8px 14px;font-size:12px;color:#856404;margin-bottom:8px">
          ⚠️ 부적합관리 모드: <b>품질관리 → 부적합관리</b>의 발생 내용(desc) 기준으로 집계됩니다.
        </div>`
      :`<div style="background:#e8f4fd;border:1px solid #b3d9f7;border-radius:6px;padding:8px 14px;font-size:12px;color:#1565c0;margin-bottom:8px">
          💡 불량유형은 <b>검사 비고란(note)</b> 기준으로 집계됩니다.
        </div>`;
  }

  if(!sorted.length){
    el.innerHTML=`<div class="card"><div class="es" style="padding:40px">
      <div class="es-icon">📊</div><div>해당 조건에 데이터가 없습니다.</div>
    </div></div>`;
    return;
  }

  el.innerHTML=`
  <div class="stat-dash" style="margin-bottom:14px">
    <div class="sd-card"><div class="sd-icon" style="background:#fee2e2;color:#dc2626">⚠️</div>
      <div><div class="sd-val">${total}</div><div class="sd-lbl">${isNc?'총 부적합건수':'총 불량수'}</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#fef3c7;color:#d97706">🏆</div>
      <div><div class="sd-val" style="font-size:13px;font-weight:700">${rows[0]?.cat||'-'}</div><div class="sd-lbl">1위</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#e0f2fe;color:#0891b2">📉</div>
      <div><div class="sd-val">${Math.round((rows[0]?.cnt||0)/total*100)}%</div><div class="sd-lbl">1위 점유율</div></div></div>
    <div class="sd-card"><div class="sd-icon" style="background:#f0fdf4;color:#16a34a">📋</div>
      <div><div class="sd-val">${isNc?(window._spcNcData||DB.nc||[]).length:inspData.filter(r=>(r.fail_qty||0)>0).length}</div><div class="sd-lbl">대상 건수</div></div></div>
  </div>
  <div class="card">
    <div style="font-size:13px;font-weight:700;margin-bottom:16px;color:var(--text)">📊 파레토 차트</div>
    <div style="display:flex;align-items:flex-end;gap:3px;height:160px;padding:0 8px;margin-bottom:4px">
      ${rows.map((d,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center">
        <div style="font-size:10px;font-weight:700;color:var(--text);margin-bottom:3px">${d.cnt}</div>
        <div style="width:88%;background:${i<3?'#3b82c6':'#94a3b8'};height:${Math.round(d.cnt/maxN*130)}px;border-radius:3px 3px 0 0;min-height:2px"></div>
        ${d.pct<=80?'<div style="width:88%;height:3px;background:#ef4444;margin-top:1px"></div>':''}
      </div>`).join('')}
    </div>
    <div style="display:flex;padding:0 8px;border-top:1px solid var(--brd)">
      ${rows.map(d=>`<div style="flex:1;text-align:center;font-size:10px;color:var(--muted);padding-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${H.e(d.cat)}">${H.e(d.cat)}</div>`).join('')}
    </div>
    <div style="margin-top:14px">
      ${rows.map(d=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:13px">
        <div style="width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${H.e(d.cat)}</div>
        <div style="flex:1;background:#e5e7eb;border-radius:999px;height:10px">
          <div style="background:${d.pct<=80?'#ef4444':'#94a3b8'};width:${Math.round(d.cnt/maxN*100)}%;height:100%;border-radius:999px"></div>
        </div>
        <div style="width:36px;text-align:right;font-weight:700">${d.cnt}</div>
        <div style="width:44px;text-align:right;color:var(--muted)">${Math.round(d.cnt/total*100)}%</div>
        <div style="width:56px;text-align:right;font-weight:700;color:${d.pct<=80?'#ef4444':'#94a3b8'}">누적${d.pct}%</div>
      </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px 14px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1d4ed8">
      💡 상위 ${rows.filter(d=>d.pct<=80).length}개 유형이 전체의 ${rows.filter(d=>d.pct<=80).slice(-1)[0]?.pct||100}%를 차지합니다.
      ${isNc?'&nbsp; <a style="color:#7c3aed;cursor:pointer;text-decoration:underline" onclick="Nav.go(\'nc\')">→ 부적합관리 바로가기</a>':''}
    </div>
  </div>`;
},



/* ══════════════════════════════════════════════════
   4. SPC 관리 항목 등록/수정 폼
   ══════════════════════════════════════════════════ */
_spcItemForm(row=null){
  const isEdit=!!row;
  const g=k=>H.e(row?.[k]??'');
  Modal.open({
    title:isEdit?'✏️ SPC 관리 항목 수정':'+ SPC 관리 항목 등록',
    size:'mmd',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._spcItemSave(${isEdit?row.id:'null'})">💾 저장 <span class="kbd">F8</span></button>`,
    body:`<div class="fg2" style="padding:4px 0">
      <!-- [v2.156] 품목코드: 실시간 필터링 datalist(30개) + SearchPop 버튼 -->
      <datalist id="spiCodeList"></datalist>
      <div class="fgroup">
        <label class="fl">품목코드 <span style="font-size:11px;color:var(--muted)">(없으면 품목명 직접 입력)</span></label>
        <div style="display:flex;gap:6px">
          <input class="fc" id="spiCode" value="${g('item_code')}" placeholder="코드 입력 또는 검색..."
            list="spiCodeList" autocomplete="off"
            oninput="Pages._spcCodeFilter(this.value)">
          <button type="button" class="btn bout bsm" style="white-space:nowrap"
            title="전체 품목에서 검색"
            onclick="Pages._spcSearchItem()">🔍 검색</button>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">🔍 코드 입력 시 자동완성 · 검색 버튼으로 전체 품목 조회 가능</div>
      </div>
      <div class="fgroup">
        <label class="fl">품목명 <span style="font-size:11px;color:var(--muted)">(코드 선택 시 자동입력)</span></label>
        <input class="fc" id="spiName" value="${g('item_name')}" placeholder="코드 선택 시 자동입력 또는 직접 입력">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">공정 *</b></label>
        <input class="fc" id="spiProcess" value="${g('process')}" placeholder="예) 가공공정">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">관리특성 *</b></label>
        <input class="fc" id="spiChar" value="${g('char_name')}" placeholder="예) 두께, 직경, 경도">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">USL(규격상한) *</b></label>
        <input class="fc" type="number" step="any" id="spiUsl" value="${g('spec_upper')}">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">LSL(규격하한) *</b></label>
        <input class="fc" type="number" step="any" id="spiLsl" value="${g('spec_lower')}">
      </div>
      <div class="fgroup">
        <label class="fl">Target(목표값)</label>
        <input class="fc" type="number" step="any" id="spiTarget" value="${g('target')}">
      </div>
      <div class="fgroup">
        <label class="fl req"><b style="color:#e11d48">서브그룹 크기 *</b></label>
        <select class="fc" id="spiN">
          ${[2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${(row?.subgroup_size||5)==n?'selected':''}>${n}개</option>`).join('')}
        </select>
      </div>
      <div class="fgroup">
        <label class="fl">단위</label>
        <input class="fc" id="spiUnit" value="${g('unit')}" placeholder="예) mm, kg, °C">
      </div>
      <div class="fgroup ff">
        <label class="fl">비고</label>
        <input class="fc" id="spiNote" value="${g('note')}">
      </div>
    </div>`,
  });
},

/* [v2.156] 품목 검색 팝업 열기 — SearchPop.items.onRow를 spc 전용으로 임시 설정 */
_spcSearchItem(){
  if(!SearchPop._cfg||!SearchPop._cfg.items){Toast.show('품목 검색 설정이 없습니다.','warn');return;}
  SearchPop._cfg.items.onRow=function(r){
    var codeEl=document.getElementById('spiCode');
    var nameEl=document.getElementById('spiName');
    if(codeEl) codeEl.value=r.item_code||'';
    if(nameEl) nameEl.value=r.item_name||'';
    SearchPop.close();
  };
  SearchPop.open('items');
},
/* [v2.156] 품목코드 실시간 필터링 — 입력값으로 DB.items 전체(37,366건) 검색
   상위 30개만 datalist에 교체, 완전 일치 시 품목명 자동채움 */
_spcCodeFilter(val){
  const dl=document.getElementById('spiCodeList');
  if(!dl) return;
  if(!val||val.length<1){dl.innerHTML='';return;}
  const lower=val.toLowerCase();
  const matched=(DB.items||[]).filter(it=>
    (it.item_code||'').toLowerCase().includes(lower)||
    (it.item_name||'').toLowerCase().includes(lower)
  ).slice(0,30);
  dl.innerHTML=matched.map(it=>
    `<option value="${H.e(it.item_code||'')}">${H.e(it.item_code||'')} — ${H.e(it.item_name||'')}</option>`
  ).join('');
  /* 완전 일치 시 품목명 자동채움 (덮어쓰기 허용) */
  const exact=(DB.items||[]).find(it=>it.item_code===val);
  if(exact){
    const nameEl=document.getElementById('spiName');
    if(nameEl) nameEl.value=exact.item_name||'';
  }
},
async _spcItemSave(editId){
  const g=id=>(document.getElementById(id)?.value||'').trim();
  const name=g('spiName'), process=g('spiProcess'), charN=g('spiChar');
  const usl=g('spiUsl'), lsl=g('spiLsl');
  /* [v2.156] 품목명 필수 → 선택(코드 없어도 직접 입력 허용, 코드만 있어도 가능) */
  if(!process){Toast.show('공정을 입력하세요.','warn');return;}
  if(!charN){Toast.show('관리특성을 입력하세요.','warn');return;}
  if(!usl||!lsl){Toast.show('USL과 LSL을 입력하세요.','warn');return;}
  if(parseFloat(usl)<=parseFloat(lsl)){Toast.show('USL은 LSL보다 커야 합니다.','warn');return;}
  const row={
    item_code:g('spiCode')||null, item_name:name||g('spiCode')||'', process,
    char_name:charN, spec_upper:parseFloat(usl), spec_lower:parseFloat(lsl),
    target:g('spiTarget')?parseFloat(g('spiTarget')):null,
    subgroup_size:parseInt(document.getElementById('spiN')?.value||5),
    unit:g('spiUnit'), note:g('spiNote'),
    /* [v2.161] 신규 등록 시 현재 로그인 사용자 자동 세팅 */
    created_by:editId&&editId!='null'?undefined:(Auth._u?.name||Auth._u?.username||null),
  };
  let res;
  if(editId&&editId!='null'){res=await SB.updateSpcItem(editId,row);}
  else{res=await SB.addSpcItem(row);}
  if(!res?.ok) return;
  Toast.show(editId&&editId!='null'?'항목이 수정되었습니다.':'항목이 등록되었습니다.','ok');
  Modal.close();
  /* [v2.156] 복귀 버그 수정: spc_items 페이지에서 등록 시 spc_chart로 튕기던 문제 수정
     spc_items/spc_chart/spc_cpk 세 케이스 모두 처리 */
  const cur=sessionStorage.getItem('qms_page')||'spc_items';
  if(cur==='spc_cpk') Pages.spc_cpk();
  else if(cur==='spc_items') Pages.spc_items();
  else Pages.spc_chart();
},
_spcItemEdit(itemId){
  const item=(window._spcItems||[]).find(it=>it.id===Number(itemId));
  if(!item){Toast.show('항목 정보를 찾을 수 없습니다.','warn');return;}
  Pages._spcItemForm(item);
},

/* ── SPC 관리 항목 전체 목록 관리 ── */
async _spcItemList(){
  const items=window._spcItems||await SB.getSpcItems();
  Modal.open({
    title:'📋 SPC 관리 항목 전체',
    size:'mlg',
    foot:'<button class="btn bout" onclick="Modal.close()">닫기</button>'
        +'<button class="btn bpri" onclick="Modal.close();Pages._spcItemForm()">+ 항목 등록</button>',
    body:`<div style="overflow-x:auto"><table class="dt" style="width:100%;font-size:13px">
      <thead><tr><th>품목명</th><th>공정</th><th>관리특성</th><th style="width:70px">USL</th><th style="width:70px">LSL</th>
        <th style="width:50px">n</th><th style="width:40px">단위</th><th style="width:80px">관리</th></tr></thead>
      <tbody>${items.map(it=>`<tr>
        <td style="font-weight:600">${H.e(it.item_name)}</td>
        <td>${H.e(it.process)}</td><td>${H.e(it.char_name||'')}</td>
        <td style="text-align:right;font-family:monospace">${it.spec_upper??'-'}</td>
        <td style="text-align:right;font-family:monospace">${it.spec_lower??'-'}</td>
        <td style="text-align:center">${it.subgroup_size||5}</td>
        <td style="text-align:center">${H.e(it.unit||'')}</td>
        <td style="text-align:center">
          <button class="btn bxs bout bsm" onclick="Modal.close();Pages._spcItemEdit(${it.id})">✏️</button>
          <button class="btn bxs berr bsm" onclick="Pages._spcItemDel(${it.id})">🗑️</button>
        </td>
      </tr>`).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">등록된 항목 없음</td></tr>'}
      </tbody></table></div>`,
  });
},
async _spcItemDel(id){
  Modal.confirm({title:'🗑️ 항목 삭제',msg:'이 관리 항목과 연결된 모든 측정 데이터가 삭제됩니다.<br>계속하시겠습니까?',danger:true,
    onOk:async()=>{
      const res=await SB.deleteSpcItem(id);
      if(!res?.ok) return;
      window._spcItems=(window._spcItems||[]).filter(it=>it.id!==id);
      Toast.show('삭제되었습니다.','ok');
      Modal.close();
      Pages.spc_chart();
    }
  });
},

/* ══════════════════════════════════════════════════
   5. 측정 데이터 입력 폼
   ══════════════════════════════════════════════════ */
_spcDataForm(itemId){
  const item=(window._spcItems||[]).find(it=>it.id===Number(itemId));
  if(!item){Toast.show('관리 항목을 먼저 선택하세요.','warn');return;}
  const n=item.subgroup_size||5;
  const inputs=Array.from({length:n},(_,i)=>
    `<div class="fgroup"><label class="fl req"><b style="color:#e11d48">측정${i+1} *</b></label>
     <input class="fc" type="number" step="any" id="spcV${i}" placeholder="${item.target??''}"></div>`
  ).join('');
  Modal.open({
    title:`+ 측정 데이터 입력 — ${H.e(item.process)} / ${H.e(item.char_name||item.item_name)}`,
    size:'mmd',
    foot:`<button class="btn bout" onclick="Modal.close()">취소</button>
          <button class="btn bpri btn-f8" onclick="Pages._spcDataSave(${itemId},${n})">💾 저장 <span class="kbd">F8</span></button>`,
    body:`<div class="fg2" style="padding:4px 0">
      <div class="fgroup ff">
        <label class="fl req"><b style="color:#e11d48">측정일 *</b></label>
        <input class="fc" type="date" id="spcDate" value="${H.today()}">
      </div>
      ${inputs}
      <div class="fgroup ff">
        <label class="fl">메모</label>
        <input class="fc" id="spcMemo" placeholder="특이사항 등">
      </div>
      <div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:8px 10px;background:var(--bg2);border-radius:6px">
        규격: LSL ${item.spec_lower} ~ USL ${item.spec_upper} ${item.unit||''} / 서브그룹 크기: n=${n}
      </div>
    </div>`,
  });
},
async _spcDataSave(itemId,n){
  const date=(document.getElementById('spcDate')?.value||'').trim();
  if(!date){Toast.show('측정일을 입력하세요.','warn');return;}
  const vals=[];
  for(let i=0;i<n;i++){
    const v=document.getElementById(`spcV${i}`)?.value?.trim();
    if(v===''||v==null){Toast.show(`측정${i+1} 값을 입력하세요.`,'warn');return;}
    const num=parseFloat(v);
    if(isNaN(num)){Toast.show(`측정${i+1}에 숫자를 입력하세요.`,'warn');return;}
    vals.push(num);
  }
  const res=await SB.addSpcSubgroup({
    spc_item_id:itemId, measured_at:date,
    values:JSON.stringify(vals),
    memo:(document.getElementById('spcMemo')?.value||'').trim(),
  });
  if(!res?.ok) return;
  Toast.show('측정 데이터가 저장되었습니다.','ok');
  Modal.close();
  await Pages._spcChartRender(itemId);
},
async _spcSubgroupDel(subId,itemId){
  Modal.confirm({title:'🗑️ 데이터 삭제',msg:'이 측정 데이터를 삭제하시겠습니까?',danger:true,
    onOk:async()=>{
      const res=await SB.deleteSpcSubgroup(subId);
      if(!res?.ok) return;
      Toast.show('삭제되었습니다.','ok');
      Modal.close();
      await Pages._spcChartRender(itemId);
    }
  });
},
});;

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
        <button class="btn bsm ai-loading-btn" style="background:#fbbf24;color:#1f2937;border:none;font-weight:700" onclick="Pages._ai8dAnalyze()" title="AI로 8D Report 현황 분석 및 개선 방향 제시">🤖 AI 분석</button>
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
async nc_dispose(){
  /* [v2.126] Supabase 연동 — 항상 최신 데이터 로드 */
  try{const d=await SB.getDisposals();if(Array.isArray(d))DB.disposals=d;}catch(e){console.warn('[nc_dispose]',e);}
  /* [v2.394] 반품/폐기처리 — DB.disposals 기반, tbar+F3+F2+onRow */
  const w=document.getElementById('pw');
  const data=(DB.disposals||[]);
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
  const data=(DB.disposals||[]);
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
      {key:'responsible',label:'귀책처',     w:'100px'},
      {key:'lot_no',     label:'LOT번호',    w:'100px', render:v=>v||'-'},
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
        const failed=[];
        for(const id of ids){
          const res=await SB.deleteDisposal(id);
          if(!res.ok) failed.push(id);
        }
        const okIds=ids.filter(id=>!failed.includes(id));
        DB.disposals=(DB.disposals||[]).filter(r=>!okIds.includes(r.id));
        Pages._dispRefresh();
        Toast.show(failed.length?`${okIds.length}건 삭제, ${failed.length}건 실패`:ids.length+'건 삭제','ok');
      };
      Modal.confirm({title:'🗑️ 처리이력 삭제',msg:'선택한 처리이력을 삭제합니다.',danger:true,onOk:_del});
    }
  });
},

/* 반품/폐기 등록/수정 폼 [v2.394] */
/* 반품/폐기 등록/수정 폼 [v2.394] */
_disposeForm(row=null){
  const isEdit=!!row;
  /* [v2.127] 처리번호 자동 일련번호 — "반폐-YYYYMMDD-NNN" (부적합관리와 동일 패턴) */
  const nextDispNo=()=>{
    const today=H.today().replace(/-/g,'');
    const todayDisps=(DB.disposals||[]).filter(d=>(d.no||'').startsWith('반폐-'+today));
    return `반폐-${today}-${String(todayDisps.length+1).padStart(3,'0')}`;
  };
  Modal.open({
    title:isEdit?'♻️ 처리이력 수정':'♻️ 반품/폐기 처리 등록',
    size:'mmd',
    body:'<div class="fg2">'
      +'<div class="fgroup"><label class="fl req">처리번호</label>'
      +'<input class="fc" id="dp_no" value="'+H.e(row?.no||nextDispNo())+'" readonly></div>'
      +'<div class="fgroup"><label class="fl">연계 부적합</label>'
      +'<select class="fc" id="dp_ref" onchange="Pages._disposeFromNc(this.value)">'
      +'<option value="">선택 안 함 (직접 입력)</option>'
      +(DB.nc||[]).map(function(n){return '<option value="'+H.e(n.no)+'"'+(row?.ref_nc===n.no?' selected':'')+'>'+H.e(n.no)+' — '+H.e(n.item||n.item_name||'')+'</option>';}).join('')
      +'</select></div>'
      +'<div class="fgroup" style="grid-column:1/-1"><label class="fl req">품목코드 <span style="font-size:10px;color:var(--tm)">직접 입력 또는 검색</span></label>'
      +'<input class="fc" id="dp_code" list="dpItemList" value="'+H.e(row?.item_code||'')+'" placeholder="코드 또는 품목명으로 검색..."'
      +' oninput="(function(){var v=document.getElementById(\'dp_code\').value.split(\' — \')[0].trim();var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||\'\')===(v);});if(it){document.getElementById(\'dp_name\').value=it.name||it.item_name||\'\';document.getElementById(\'dp_name\').style.color=\'var(--pri)\';}else{document.getElementById(\'dp_name\').style.color=\'\';}})()"'
      +' onblur="(function(){var v=document.getElementById(\'dp_code\').value.split(\' — \')[0].trim();if(!v)return;var it=(DB.items||[]).find(function(x){return(x.item_code||x.code||\'\')===(v);});if(!it&&v)Toast.show(\'미등록 품목코드입니다. 기준정보 > 품목 등록에서 확인하세요.\',\'warn\');})()"></div>'
      +'<datalist id="dpItemList">'+(DB.items||[]).map(function(it){return '<option value="'+H.e(it.item_code||it.code||'')+'">'+H.e((it.item_code||it.code||'')+' — '+(it.name||it.item_name||''))+'</option>';}).join('')+'</datalist>'
      +'<div class="fgroup"><label class="fl req">품목명</label>'
      +'<input class="fc" id="dp_name" value="'+H.e(row?.item_name||'')+'"></div>'
      +'<div class="fgroup"><label class="fl">귀책처</label>'
      +'<input class="fc" id="dp_resp" value="'+H.e(row?.responsible||'')+'" placeholder="예) ㈜부품공급사"></div>'
      +'<div class="fgroup"><label class="fl">LOT번호 <span style="font-size:10px;color:var(--tm)">(선택)</span></label>'
      +'<input class="fc" id="dp_lot" value="'+H.e(row?.lot_no||'')+'"></div>'
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
/* [v2.125] 연계 부적합 선택 시 품목코드/품목명/귀책처/LOT번호 자동 채우기 */
_disposeFromNc(no){
  if(!no) return;
  const nc=(DB.nc||[]).find(n=>n.no===no);
  if(!nc){Toast.show('해당 부적합 데이터를 찾을 수 없습니다.','warn');return;}
  const set=(id,val)=>{const el=document.getElementById(id);if(el&&val) el.value=val;};
  set('dp_code', nc.item_code);
  set('dp_name', nc.item);
  set('dp_resp', nc.responsible);
  set('dp_lot',  nc.lot_no);
  Toast.show('부적합 정보가 자동으로 채워졌습니다.','info',1800);
},

/* 반품/폐기 인쇄 [v2.394] */
_disposePrint(){
  /* [v2.394] Tbl 체크박스: class=rck, value=row.id */
  const checked=[...document.querySelectorAll('input.rck:checked')];
  const ids=checked.length>0?checked.map(c=>Number(c.value)):null;
  const data=(DB.disposals||[]).filter(r=>ids?ids.includes(r.id):true);
  if(!data.length){Toast.show('인쇄할 항목을 선택하거나 목록에 데이터가 있어야 합니다.','warn');return;}
  /* [v2.127] 인수인계서 — A4 세로 1장에 동일 양식 상/하 A5 2매(절취선), 회사로고, 서명란 */
  const logo=App.logo?`<img src="${App.logo}" style="height:30px;object-fit:contain">`:'<strong style="font-size:14px">INNODIS</strong>';
  const today=H.today();
  const typeBadgeCls=t=>t==='반품'?'return':t==='폐기'?'dispose':t==='재작업'?'rework':'special';
  const half=r=>`
    <div class="half">
      <div class="doc-title">
        <div class="logo-wrap">${logo}</div>
        <div class="title-wrap"><h1>반품 / 폐기 인수인계서</h1></div>
        <div class="meta">출력일: ${H.e(today)}</div>
      </div>
      <table class="info">
        <tr><th>처리번호</th><td>${H.e(r.no||'-')}</td><th>부적합번호</th><td>${H.e(r.ref_nc||'-')}</td></tr>
        <tr><th>품목코드</th><td>${H.e(r.item_code||'-')}</td><th>품목명</th><td>${H.e(r.item_name||'-')}</td></tr>
        <tr><th>귀책처</th><td>${H.e(r.responsible||'-')}</td><th>LOT번호</th><td>${H.e(r.lot_no||'-')}</td></tr>
        <tr><th>처리유형</th><td><span class="badge ${typeBadgeCls(r.type)}">${H.e(r.type||'-')}</span></td><th>수량</th><td>${H.n(r.qty||0)}</td></tr>
        <tr><th>처리일</th><td>${H.e(r.proc_date||'-')}</td><th>처리자</th><td>${H.e(r.handler||'-')}</td></tr>
      </table>
      <div class="note-box"><div class="lbl">비고</div>${H.e(r.note||'-')}</div>
      <div class="sign-area">
        <div class="sign-box"><span class="role-lbl">인계자</span><span class="sign-line">(서명)</span></div>
        <div class="sign-box"><span class="role-lbl">인수자</span><span class="sign-line">(서명)</span></div>
      </div>
    </div>`;
  const pages=data.map(r=>`
    <div class="page">
      ${half(r)}
      <div class="cut-line"><span class="scissors">✂ 절취선 ✂</span></div>
      ${half(r)}
    </div>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>반품/폐기 인수인계서</title>
  <style>
    @page{size:210mm 297mm;margin:0}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Malgun Gothic',sans-serif}
    .page{width:210mm;height:297mm;position:relative;page-break-after:always;page-break-inside:avoid;overflow:hidden}
    .page:last-child{page-break-after:auto}
    .half{height:148mm;padding:9mm 14mm;position:relative;display:flex;flex-direction:column;overflow:hidden;page-break-inside:avoid}
    .cut-line{position:relative;border-top:1px dashed #94a3b8;height:0;line-height:0;font-size:0}
    .cut-line .scissors{position:absolute;background:#fff;padding:0 6px;font-size:11px;color:#64748b;left:50%;top:0;transform:translate(-50%,-50%)}
    .doc-title{display:flex;align-items:center;border-bottom:2px solid #1e293b;padding-bottom:6px;margin-bottom:10px;gap:10px}
    .logo-wrap{flex:0 0 auto}
    .title-wrap{flex:1;text-align:center}
    .doc-title h1{font-size:18px;font-weight:800;letter-spacing:3px}
    .meta{flex:0 0 auto;font-size:10px;color:#64748b;white-space:nowrap}
    table.info{width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:8px;table-layout:fixed}
    table.info th{background:#f8fafc;border:1px solid #cbd5e1;padding:5px 7px;text-align:center;width:78px;font-weight:700;color:#334155}
    table.info td{border:1px solid #cbd5e1;padding:5px 8px}
    .note-box{border:1px solid #cbd5e1;border-top:none;padding:6px 8px;font-size:11px;min-height:28px;color:#475569}
    .note-box .lbl{font-size:9.5px;color:#94a3b8;margin-bottom:2px}
    .sign-area{margin-top:auto;display:flex;gap:10px}
    .sign-box{flex:1;border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;display:flex;align-items:center;gap:10px}
    .sign-box .role-lbl{font-size:11px;font-weight:700;color:#334155;white-space:nowrap}
    .sign-box .sign-line{flex:1;border-bottom:1px solid #94a3b8;height:26px}
    .badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:700}
    .badge.return{background:#fee2e2;color:#991b1b}
    .badge.dispose{background:#fef3c7;color:#92400e}
    .badge.rework{background:#dbeafe;color:#1e40af}
    .badge.special{background:#f3e8ff;color:#6b21a8}
    @media print{.no-print{display:none}}
  </style></head>
  <body>
  <div class="no-print" style="position:fixed;top:8px;right:8px;z-index:10">
    <button onclick="window.print()" style="padding:8px 18px;border:none;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer">🖨️ 인쇄</button>
  </div>
  ${pages}
  </body></html>`;
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
async _disposeSave(row=null){
  const g=id=>document.getElementById(id)?.value.trim()||'';
  const no=g('dp_no'), code=g('dp_code'), name=g('dp_name'), type=g('dp_type');
  if(!no){Toast.show('처리번호를 입력하세요.','warn');return;}
  if(!name){Toast.show('품목명을 입력하세요.','warn');return;}
  if(!type){Toast.show('처리유형을 선택하세요.','warn');return;}
  const data={
    no, ref_nc:g('dp_ref'), item_code:code, item_name:name,
    responsible:g('dp_resp'), lot_no:g('dp_lot'),
    qty:Number(document.getElementById('dp_qty')?.value)||0,
    type, proc_date:g('dp_date'), handler:g('dp_handler'),
    status:g('dp_status'), note:g('dp_note'),
  };
  const res=row?.id?await SB.updateDisposal(row.id,data):await SB.addDisposal(data);
  if(!res.ok) return;
  if(!DB.disposals) DB.disposals=[];
  if(row?.id){
    const idx=DB.disposals.findIndex(r=>r.id===row.id);
    if(idx>=0) DB.disposals[idx]={...row,...data};
  } else {
    DB.disposals.unshift({id:res.id||Date.now(),...data});
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
          <button class="btn bgry bsm" onclick="Modal.close();Pages._disposeForm(${JSON.stringify(row).replace(/"/g,'&quot;').replace(/</g,'\u003c')})">✏️ 수정</button>`,
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
;

/* ══ Search 팝업 (F3) ══ */


/* [v2.65] F3 근본 해결 — EMS 페이지명을 ems_eq 설정으로 직접 별칭 등록
   F3 핸들러가 page명 그대로 SearchPop.open(page) 호출해도 동작 */
(function(){
  var EMS=['eq_mgmt','eq_pm','eq_as','eq_cost','eq_manual',
           'eq_machine_card','eq_dashboard','eq_dept'];
  EMS.forEach(function(pg){SearchPop._cfg[pg]=SearchPop._cfg['ems_eq'];});
})();

;

/* ══ 전역 단축키 ══ */
/* [v2.111] setupHotkeys 구버전 중복 정의 제거
   → qms-init.js의 최신 버전 사용 (EMS 페이지 별칭, sessionStorage fallback 등 포함)
   setupHotkeys(); 호출은 아래 init() 블록에서 qms-init.js가 담당 */
/* REMOVED: function setupHotkeys(){...} */

/* [v2.112] 초기화 블록 제거 — qms-init.js가 단독으로 담당
   (이전 중복 init 블록이 setupHotkeys 2회 호출 + 세션복원 2회 실행 버그 유발) */
