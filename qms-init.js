/* qms-init.js — hotkeys + 초기화 [v2.315] */
"use strict";


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
      /* [v2.315] F5 브라우저 새로고침 방지 — 앱 내부에서 현재 페이지 재렌더 */
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
  /* [v2.315] 날짜형식: 2026년 5월 25일(월) */
  const DAYS=['일','월','화','수','목','금','토'];
  const dateFmt=()=>{
    const d=new Date();
    const base=d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
    return base+'('+DAYS[d.getDay()]+')';
  };
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
      /* [v2.315] DB 일괄 로드 완료 후 페이지 이동 — 빈 DB로 렌더 방지 */
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
    } catch(e){
      sessionStorage.removeItem('qms_auth');
      sessionStorage.removeItem('qms_page');
    }
  }
})();
