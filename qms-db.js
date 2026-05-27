/* qms-db.js — DB 초기 데이터 + Supabase 객체 [v2.307] */
"use strict";

const SUPABASE_URL  = 'https://phxlsnghgvowrxdlcsph.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeGxzbmdoZ3Zvd3J4ZGxjc3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDUyNjAsImV4cCI6MjA5NDMyMTI2MH0.bddEx1cymfYIfKVWe01mb7qSZQMN3j-sNdFRyGzoGIA';

/* _sb: Supabase 클라이언트 — SDK 로드 후 생성 */
let _sb = null;
if(window.supabase){
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  console.log('[Supabase] 클라이언트 초기화 완료');
} else {
  console.warn('[Supabase] SDK 로드 실패 — 더미데이터 모드로 동작');
}

/* ── SB: Supabase DB 연동 헬퍼 ──
   각 함수는 _sb 연결 시 Supabase 사용, 미연결 시 DB.* 더미데이터 사용
   테이블 미생성 시 자동으로 더미데이터로 폴백

   [수정 이력]
   v2.13: SB 헬퍼 초기 구현 — getItems/getVendors/getInspections/getMentions 등
   v2.15: SB.uploadFile/deleteFile — Supabase Storage 연동
   v2.17: 일괄 버그 수정
     - insert().select().single() → insert() 로 변경 (전체 8개 함수)
       원인: anon 키는 SELECT 권한이 없어 RLS 오류 발생
       해결: .select().single() 제거, 로컬 캐시는 별도 push 처리
     - SB.addItem: 허용 컬럼만 추출하여 insert
       원인: 테이블에 없는 컬럼 포함 시 "schema cache" 오류
       해결: allowed 객체로 허용 컬럼만 전달
   [Supabase 필수 설정]
     DISABLE ROW LEVEL SECURITY (전체 테이블)
     GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
     GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
     GRANT USAGE ON SCHEMA public TO anon;
   ─────────────────────────────────────────── */
const SB={
  /* 연결 여부 확인 */
  ok(){return !!_sb},
  /* ── _sbFetchAll: Supabase 1000건 제한 완전 해제 ──
     [v2.26 근본수정] hasMore 로직 버그 수정
     CHUNK=1000으로 SB 기본 단위와 일치시켜 페이지네이션
     data.length < CHUNK 이면 마지막 페이지 → 종료 */
  async _sbFetchAll(table, orderCol='id', ascending=true, filter=null){
    if(!_sb) return null;
    const CHUNK=1000; // SB Free tier 기본 단위
    let all=[], from=0;
    while(true){
      let q=_sb.from(table).select('*').order(orderCol,{ascending});
      if(filter) q=filter(q);
      q=q.range(from, from+CHUNK-1);
      const {data,error}=await q;
      if(error){console.warn('[SB] '+table+' 조회 실패',error.message);return null;}
      if(!data||data.length===0) break;
      all=[...all,...data];
      if(data.length<CHUNK) break; // 마지막 페이지
      from+=CHUNK;
    }
    console.log('[SB] '+table+' 전체 '+all.length+'건 로드');
    return all;
  },

  /* ── [Phase 1 v2.28] 서버사이드 페이지네이션 헬퍼 ──
     대용량 데이터(10만건+)에서도 안정적으로 동작
     params: { table, orderCol, ascending, page, pageSize, filters, search }
     filters: [{col, op, val}]  op: eq|ilike|gte|lte|neq
     search:  [{col, kw}]       ilike '%kw%' OR 조건
     반환: { data:[], total:number, pages:number }  */
  async _sbPage({table, orderCol='id', ascending=false, page=0, pageSize=100, filters=[], search=[]}){
    if(!_sb) return {data:[],total:0,pages:0};
    const from=page*pageSize, to=from+pageSize-1;

    /* 데이터 쿼리 */
    let q=_sb.from(table).select('*',{count:'exact'})
      .order(orderCol,{ascending})
      .range(from,to);
    /* 필터 적용 */
    for(const f of filters){
      if(f.val===null||f.val===undefined||f.val==='') continue;
      if(f.op==='eq')   q=q.eq(f.col,f.val);
      if(f.op==='neq')  q=q.neq(f.col,f.val);
      if(f.op==='ilike')q=q.ilike(f.col,`%${f.val}%`);
      if(f.op==='gte')  q=q.gte(f.col,f.val);
      if(f.op==='lte')  q=q.lte(f.col,f.val);
    }
    /* 검색 (OR 조건: 여러 컬럼 중 하나라도 포함) */
    if(search.length>0&&search[0].kw){
      const kw=search[0].kw;
      const orStr=search.map(s=>`${s.col}.ilike.%${kw}%`).join(',');
      q=q.or(orStr);
    }

    const {data,error,count}=await q;
    if(error){console.warn('[SB] _sbPage 오류:',table,error.message);return {data:[],total:0,pages:0};}
    const total=count||0;
    return {data:data||[], total, pages:Math.ceil(total/pageSize)};
  },

  /* 품목 목록 조회 — 전체 반환 */
  async getItems(){
    if(!_sb) return DB.items;
    const data=await this._sbFetchAll('items','id',true);
    if(data===null){console.warn('[SB] items 조회 실패');return [];}
    return data;
  },

  /* 거래처 목록 조회 — 전체 반환 */
  /* 거래처 목록 조회 — 전체 반환 */
  async getVendors(){
    if(!_sb) return DB.vendors;
    const data=await this._sbFetchAll('vendors','id',true);
    if(data===null){console.warn('[SB] vendors 조회 실패');return [];}
    return data;
  },

  /* 검사 목록 조회 */
  async getInspections(type=null){
    if(!_sb) return type?DB.inspections.filter(i=>i.type===type):DB.inspections;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('inspections','insp_date',false,
      type?q=>q.eq('type',type):null);
    if(data===null){console.warn('[SB] inspections 조회 실패');return [];}
    return data;
  },

  /* 검사 등록 */
  async addInspection(row){
    if(!_sb){const id=Math.max(0,...DB.inspections.map(i=>i.id))+1;DB.inspections.push({id,...row});return {ok:true,id};}
    /* [v2.28] 허용 컬럼만 추출 — SB inspections 실제 컬럼만 포함
       SQL 미실행 시 없는 컬럼(spec, insp_method, wo_no, note, defect_rate) 자동 제거 */
    /* [v2.29] 엑셀 날짜 → YYYY-MM-DD (Date객체/시리얼/문자열 모두 처리) */
    const _fmtDate=(v)=>{
      if(!v&&v!==0) return null;
      if(v instanceof Date){const y=v.getUTCFullYear(),mo=v.getUTCMonth()+1,dy=v.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}
      const s=String(v).trim();
      if(!s) return null;
      if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      if(s.includes(' ')&&s.length>8){const d=new Date(s);if(!isNaN(d.getTime())){const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}}
      const n=Number(s);
      if(!isNaN(n)&&n>30000&&n<100000){const d=new Date(Math.round((n-25569)*86400)*1000);const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}
      return s||null;
    };
    const allowed={
      type:        row.type||'',
      vendor:      row.vendor||'',
      insp_no:     row.insp_no||'',
      insp_date:   _fmtDate(row.insp_date),
      inspector:   row.inspector||'',
      item_code:   row.item_code||'',
      item_name:   row.item_name||'',
      spec:        row.spec||'',
      insp_method: row.insp_method||'',
      result:      row.result||'',
      qty:         row.qty!=null?Number(row.qty):0,
      pass_qty:    row.pass_qty!=null?Number(row.pass_qty):0,
      fail_qty:    row.fail_qty!=null?Number(row.fail_qty):0,
      defect_rate: row.defect_rate!=null?Number(row.defect_rate):0,
      wo_no:       row.wo_no||'',
      note:        row.note||'',
      created_at:  row.created_at||null,
      updated_at:  null,  /* [v2.28] 등록 시 수정일 비움 */
    };
    /* [v2.29] upsert 시도, 실패시 insert 폴백 */
    let insertRow={...allowed};
    /* null 날짜를 undefined로 교체 (SB date 타입 오류 방지) */
    Object.keys(insertRow).forEach(k=>{
      if(insertRow[k]===null&&['insp_date','created_at','updated_at'].includes(k))
        insertRow[k]=undefined;
    });
    let {error}=await _sb.from('inspections').upsert(insertRow,{onConflict:'insp_no',ignoreDuplicates:false});
    /* upsert 실패 시 insert 폴백 */
    if(error&&(error.message?.includes('unique')||error.message?.includes('conflict')||error.message?.includes('duplicate'))){
      console.warn('[SB] upsert 실패, insert 폴백:',error.message);
      ({error}=await _sb.from('inspections').insert(insertRow));
    }
    let retries=0;
    while(error&&(error.message?.includes('column')||error.message?.includes('schema cache'))&&retries<8){
      retries++;
      const m=error.message.match(/['"`](\w+)['"`]\s*column/);
      if(m&&m[1]){delete insertRow[m[1]];console.warn('[SB] addInspection 컬럼 제거:',m[1]);}
      else break;
      ({error}=await _sb.from('inspections').upsert(insertRow,{onConflict:'insp_no',ignoreDuplicates:false}));
    }
    if(error){
      console.error('[SB] addInspection 최종 오류:',error.message,JSON.stringify(insertRow).slice(0,200));
      Toast.show('DB 저장 실패: '+error.message,'err');
      return {ok:false};
    }
    DB.inspections.unshift({id:Date.now(),...insertRow});
    return {ok:true};
  },

  /* 부적합 목록 조회 */
  async getNc(){
    if(!_sb) return DB.nc;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('nonconformances','date',false);
    if(data===null){console.warn('[SB] nc 조회 실패');return [];}
    return data;
  },

  /* 멘션 목록 조회 */
  async getMentions(){
    if(!_sb) return DB.mentions||[];
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('mentions','created_at',false);
    if(data===null){console.warn('[SB] mentions 조회 실패');return DB.mentions||[];}
    return data;
  },

  /* 멘션 등록 */
  async addMention(row){
    if(!_sb){const id=Math.max(0,...DB.mentions.map(m=>m.id))+1;DB.mentions.unshift({id,...row,replies:[]});return {ok:true};}
    /* [v2.28] 허용 컬럼만 추출 — SB mentions 테이블 실제 컬럼만 포함
       제거: ref_key, key, from_name, from_dept (테이블에 없음) */
    /* [v2.324 PhaseA] 멘션 고도화 — 채널/유형/우선순위/상태/스레드 */
    const allowed={
      from:       row.from||'',
      dept:       row.dept||'',
      to:         row.to||'',
      to_list:    row.to_list||[row.to||''],
      text:       row.text||row.message||'',
      message:    row.message||row.text||'',
      ref:        row.ref||row.ref_key||'',
      ref_key:    row.ref_key||row.ref||'',
      channel:    row.channel||'general',
      type:       row.type||'mention',
      priority:   row.priority||'normal',
      status:     row.status||'open',
      thread_id:  row.thread_id||null,
      link_type:  row.link_type||null,
      link_id:    row.link_id||null,
      due_date:   row.due_date||null,
      pinned:     row.pinned||false,
      reactions:  row.reactions||{},
      thread_id:  row.thread_id||null,
      reply_to:   row.reply_to||null,
      file_url:   row.file_url||null,
      read:       row.read||false,
      created_at: row.created_at||null,
    };
    /* 동적 컬럼 오류 제거 — 혹시 테이블 구조 다를 경우 자동 대응 */
    let insertRow={...allowed};
    let {error}=await _sb.from('mentions').insert(insertRow);
    let retries=0;
    while(error&&(error.message?.includes('column')||error.message?.includes('schema cache'))&&retries<5){
      retries++;
      const m=error.message.match(/['"`](\w+)['"`]\s*column/);
      if(m&&m[1]){delete insertRow[m[1]];console.warn('[SB] addMention 컬럼 제거:',m[1]);}
      else break;
      ({error}=await _sb.from('mentions').insert(insertRow));
    }
    if(error){Toast.show('멘션 저장 실패: '+error.message,'err');return {ok:false};}
    if(retries>0&&!SB._mentionColWarned){SB._mentionColWarned=true;SB._showMentionColSQL();}
    else{SB._mentionColWarned=false;}
    return {ok:true};
  },

  /* 멘션 수정 */
  async updateMention(id,patch){
    /* [v2.324 PhaseA] status/channel/type/priority/pinned/reactions 포함 */
    if(!_sb){const m=DB.mentions.find(m=>m.id===id);if(m)Object.assign(m,patch);return {ok:true};}
    const {error}=await _sb.from('mentions').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return {ok:false};}
    const m=DB.mentions.find(m=>m.id===id);if(m)Object.assign(m,patch);return {ok:true};
  },

  /* 멘션 삭제 (soft delete: deleted_at 기록) */
  async deleteMention(id){
    if(!_sb){DB.mentions=DB.mentions.filter(m=>m.id!==id);return {ok:true};}
    const {error}=await _sb.from('mentions').update({deleted_at:new Date().toISOString()}).eq('id',id);
    if(error){Toast.show('삭제 실패: '+error.message,'err');return {ok:false};}
    DB.mentions=DB.mentions.filter(m=>m.id!==id);return {ok:true};
  },

  /* 파일 업로드 (Supabase Storage: qms-files 버킷) */
  async uploadFile(key,file){
    if(!_sb) return null;
    const path=`${key}/${Date.now()}_${file.name}`;
    const {data,error}=await _sb.storage.from('qms-files').upload(path,file,{upsert:true});
    if(error){console.warn('[SB] 파일 업로드 실패',error.message);return null;}
    const {data:urlData}=_sb.storage.from('qms-files').getPublicUrl(path);
    return {path, url:urlData.publicUrl, name:file.name, size:H._fmtSize(file.size), date:H.today()};
  },

  /* 파일 삭제 */
  async deleteFile(path){
    if(!_sb) return;
    const {error}=await _sb.storage.from('qms-files').remove([path]);
    if(error) console.warn('[SB] 파일 삭제 실패',error.message);
  },

  /* [v2.26] deleteVendors: 일괄 삭제 */
  async deleteVendors(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));return{ok:true};}
    const {error}=await _sb.from('vendors').delete().in('id',numIds);
    DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));
    if(error){console.error('[SB] deleteVendors 실패:',error.message);return{ok:false,msg:error.message};}
    return{ok:true};
  },

  /* ── 사용자 ── */
  async getUsers(){
    if(!_sb) return DB.users;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('users','id',true);
    if(data===null){console.warn('[SB] users 조회 실패');return [];}
    return data;
  },
  async addUser(row){
    if(!_sb){const id=Math.max(0,...DB.users.map(u=>u.id))+1;DB.users.push({id,...row,updated_at:null});return{ok:true,id};}
    /* [v2.28] updated_at null로 명시 — 등록 시 수정일 비움 */
    const insertRow={...row, updated_at:null};
    const {error}=await _sb.from('users').insert(insertRow);
    if(error){Toast.show('사용자 저장 실패: '+error.message,'err');return{ok:false};}
    DB.users.push({id:Date.now(),...row});return{ok:true};
  },
  async updateUser(id,patch){
    if(!_sb){const u=DB.users.find(u=>u.id===id);if(u)Object.assign(u,patch);return{ok:true};}
    /* [v2.28] updated_at 오늘 날짜로 명시 — 수정 시만 기록 */
    const patchWithDate={...patch, updated_at:H.today()};
    const {error}=await _sb.from('users').update(patchWithDate).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const u=DB.users.find(u=>u.id===id);if(u)Object.assign(u,patch);return{ok:true};
  },
  async deleteUser(id){
    if(!_sb){DB.users=DB.users.filter(u=>u.id!==id);return{ok:true};}
    const {error}=await _sb.from('users').delete().eq('id',id);
    if(error){Toast.show('삭제 실패: '+error.message,'err');return{ok:false};}
    DB.users=DB.users.filter(u=>u.id!==id);return{ok:true};
  },
  /* [v2.26] deleteUsers: 일괄 삭제 */
  async deleteUsers(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));return{ok:true};}
    const {error}=await _sb.from('users').delete().in('id',numIds);
    DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));
    if(error){console.error('[SB] deleteUsers 실패:',error.message);return{ok:false,msg:error.message};}
    return{ok:true};
  },



  /* ── 품목 ── */
  async addItem(row){
    if(!_sb){
      const id=Math.max(0,...DB.items.map(i=>i.id))+1;
      DB.items.push({id,...row});
      return{ok:true,id};
    }
    /* Supabase items 테이블 허용 컬럼만 추출
       .select() 제거: insert 후 SELECT 시도 시 RLS 오류 방지 */
    const allowed={
      major_category: row.major_category||'',
      category:       row.category||'',
      item_code:      row.item_code||'',
      item_name:      row.item_name||'',
      spec:           row.spec||'',
      unit:           row.unit||'EA',
      material:       row.material||'',
      vendor_id:      row.vendor_id||null,
      vendor_name:    row.vendor_name||'',
      active:         row.active!==undefined?Number(row.active):1,
      remark:         row.remark||'',
      created_at:     row.created_at||null,
      updated_at:     row.updated_at||null,
    };
    const {error}=await _sb.from('items').insert(allowed);
    if(error){Toast.show('품목 저장 실패: '+error.message,'err');return{ok:false};}
    /* insert 성공 시 로컬 캐시에 추가 (id는 임시값) */
    DB.items.push({id:Date.now(),...allowed});
    return{ok:true};
  },
  async updateItem(id,patch){
    if(!_sb){const i=DB.items.find(i=>i.id===id);if(i)Object.assign(i,patch);return{ok:true};}
    /* 허용 컬럼만 추출 */
    const allowed={};
    const keys=['major_category','category','item_code','item_name','spec','unit',
      'material','vendor_id','vendor_name','active','remark','updated_at'];
    keys.forEach(k=>{if(patch[k]!==undefined)allowed[k]=patch[k];});
    const {error}=await _sb.from('items').update(allowed).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const i=DB.items.find(i=>i.id===id);if(i)Object.assign(i,patch);return{ok:true};
  },
  /* [v2.25] deleteItem: 단건/복수 삭제 지원 */
  async deleteItem(id){
    if(!_sb){
      DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
      return{ok:true};
    }
    const {error}=await _sb.from('items').delete().eq('id',Number(id));
    if(error){
      console.error('[SB] deleteItem 실패:',error.message);
      /* 오류 원인 출력 후에도 로컬 캐시에서는 제거 */
      DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
      return{ok:false,msg:error.message};
    }
    DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
    return{ok:true};
  },

  /* [v2.25] deleteItems: 복수 일괄 삭제 (IN 쿼리로 1번에 처리) */
  async deleteItems(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true}; /* 빈 배열 전달 시 전체 삭제 방지 */
    if(!_sb){
      DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
      return{ok:true};
    }
    const {error}=await _sb.from('items').delete().in('id',numIds);
    /* SB 성공 여부와 무관하게 로컬 캐시 즉시 제거 */
    DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
    if(error){
      console.error('[SB] deleteItems 실패:',error.message);
      return{ok:false,msg:error.message};
    }
    return{ok:true};
  },
  /* [v2.26] deleteInspections: 검사 일괄 삭제 */
  async deleteInspections(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));return{ok:true};}
    const {error}=await _sb.from('inspections').delete().in('id',numIds);
    DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));
    if(error){console.error('[SB] deleteInspections 실패:',error.message);return{ok:false,msg:error.message};}
    return{ok:true};
  },


  /* ── 거래처 ── */
    async addVendor(row){
    if(!_sb){const id=Math.max(0,...DB.vendors.map(v=>v.id))+1;DB.vendors.push({id,...row});return{ok:true,id};}
    /* [v2.27] 허용 컬럼만 추출 */
    const allowed={
      vendor_type:   row.vendor_type||'',
      biz_no:        row.biz_no||'',
      vendor_name:   row.vendor_name||'',
      ceo_name:      row.ceo_name||'',
      tel:           row.tel||'',
      fax:           row.fax||'',
      email:         row.email||'',
      manager:       row.manager||'',
      manager_tel:   row.manager_tel||'',
      manager_email: row.manager_email||'',
      address:       row.address||'',
      active:        row.active!==undefined?Number(row.active):1,
      created_at:    row.created_at||null,
      updated_at:    null,  /* [v2.28] 등록 시 수정일 비움 */
    };
    /* 1차 시도 */
    let insertRow={...allowed};
    let {error}=await _sb.from('vendors').insert(insertRow);
    /* 컬럼 오류 → 오류 난 컬럼을 제거하고 최대 5회 재시도 */
    let retries=0;
    while(error&&(error.message?.includes('column')||error.message?.includes('schema cache'))&&retries<5){
      retries++;
      /* 오류 메시지에서 컬럼명 추출: "Could not find the 'xxx' column" */
      const m=error.message.match(/['"`](\w+)['"`]\s*column/);
      if(m&&m[1]){
        delete insertRow[m[1]];
        console.warn('[SB] addVendor: 컬럼 제거 후 재시도 →',m[1]);
      } else {
        /* 컬럼명 추출 실패 → 최소 컬럼만 유지 */
        insertRow={vendor_name:allowed.vendor_name,biz_no:allowed.biz_no,tel:allowed.tel,email:allowed.email,active:allowed.active,created_at:allowed.created_at,updated_at:allowed.updated_at};
        retries=5; // 더 이상 반복 안 함
      }
      ({error}=await _sb.from('vendors').insert(insertRow));
    }
    if(error){
      Toast.show('거래처 저장 실패: '+error.message,'err');
      return{ok:false};
    }
    /* 누락 컬럼이 있었으면 SQL 안내 */
    if(retries>0&&!SB._vendorColWarned){
      SB._vendorColWarned=true;
      SB._showVendorColSQL();
    } else {
      SB._vendorColWarned=false;
    }
    DB.vendors.push({id:Date.now(),...insertRow});
    return{ok:true};
  },
  /* [v2.27] vendors 컬럼 추가 SQL 안내 팝업 */
  _showVendorColSQL(){
    const sqlText='-- vendors 테이블 누락 컬럼 추가\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ceo_name TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fax TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS manager TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS manager_tel TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS manager_email TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address TEXT DEFAULT \'\';\n'
      +'ALTER TABLE vendors ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1;';
    setTimeout(()=>Modal.open({title:'⚠️ 거래처 컬럼 추가 필요',size:'mlg',
      body:'<div style="padding:10px;background:#fef3c7;border:1px solid #f59e0b;border-radius:var(--r);font-size:13px;margin-bottom:10px">'
        +'기본 컬럼으로만 저장됐습니다. <strong>아래 SQL 실행 후 재등록하세요.</strong></div>'
        +'<div style="position:relative"><pre id="sqlBox" style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:var(--r);font-size:11px;white-space:pre-wrap">'+H.e(sqlText)+'</pre>'
        +'<button class="btn bsm bpri" style="position:absolute;top:8px;right:8px" onclick="Pages._copySql()">📋 복사</button></div>',
      foot:'<button class="btn bpri" onclick="Modal.close();SB._vendorColWarned=false">확인</button>'
    }),100);
  },
  /* [v2.290] equipment 누락 컬럼 SQL 안내 */
  _showEquipColSQL(){
    const sql=
      '-- equipment 테이블 누락 컬럼 추가\n'
      +'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last DATE;\n'
      +'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next DATE;\n'
      +'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS updated_at DATE;\n'
      +'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();';
    setTimeout(()=>Modal.open({title:'\u26a0\ufe0f equipment 컬럼 추가 필요',size:'mlg',
      body:'<div style="padding:10px 14px;background:#fef3c7;border:1px solid #f59e0b;border-radius:var(--r);font-size:13px;margin-bottom:10px">'
        +'<strong>아래 SQL을 Supabase SQL Editor에서 실행 후 재업로드하세요.</strong><br>'
        +'추가 컬럼: last(최근교정일), next(차기교정일), updated_at, created_at</div>'
        +'<div style="position:relative">'
        +'<pre id="equipSqlBox" style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:var(--r);font-size:11px;white-space:pre-wrap">'+H.e(sql)+'</pre>'
        +'<button class="btn bsm bpri" style="position:absolute;top:8px;right:8px" onclick="navigator.clipboard.writeText(document.getElementById(\'equipSqlBox\').textContent);Toast.show(\'복사 완료\',\'ok\')">\ud83d\udccb 복사</button>'
        +'</div>',
      foot:'<button class="btn bpri" onclick="Modal.close()">확인</button>'
    }),200);
  },

  /* [v2.28] mentions 테이블 누락 컬럼 SQL 안내 */
  _showMentionColSQL(){
    const sql='-- mentions 테이블 누락 컬럼 추가\n'
      +'ALTER TABLE mentions ADD COLUMN IF NOT EXISTS dept TEXT DEFAULT \'\';\n'
      +'ALTER TABLE mentions ADD COLUMN IF NOT EXISTS message TEXT DEFAULT \'\';\n'
      +'ALTER TABLE mentions ADD COLUMN IF NOT EXISTS reply_to BIGINT DEFAULT NULL;\n'
      +'ALTER TABLE mentions ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;\n'
      +'ALTER TABLE mentions ADD COLUMN IF NOT EXISTS ref TEXT DEFAULT \'\';';
    setTimeout(()=>Modal.open({title:'⚠️ mentions 컬럼 추가 필요',size:'mlg',
      body:'<div style="padding:10px;background:#fef3c7;border:1px solid #f59e0b;border-radius:var(--r);font-size:13px;margin-bottom:10px">'
        +'기본 컬럼(from·to·text)으로만 저장됐습니다.<br>'
        +'<strong>아래 SQL을 Supabase SQL Editor에서 실행 후 재시도하세요.</strong></div>'
        +'<div style="position:relative">'
        +'<pre id="sqlBox" style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:var(--r);font-size:11px;white-space:pre-wrap">'+H.e(sql)+'</pre>'
        +'<button class="btn bsm bpri" style="position:absolute;top:8px;right:8px" onclick="Pages._copySql()">📋 복사</button>'
        +'</div>',
      foot:'<button class="btn bpri" onclick="Modal.close()">확인</button>'
    }),200);
  },
  async updateVendor(id,patch){
    if(!_sb){const v=DB.vendors.find(v=>v.id===id);if(v)Object.assign(v,patch);return{ok:true};}
    const {error}=await _sb.from('vendors').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const v=DB.vendors.find(v=>v.id===id);if(v)Object.assign(v,patch);return{ok:true};
  },
  async deleteVendor(id){
    if(!_sb){DB.vendors=DB.vendors.filter(v=>v.id!==id);return{ok:true};}
    const {error}=await _sb.from('vendors').delete().eq('id',id);
    if(error){Toast.show('삭제 실패: '+error.message,'err');return{ok:false};}
    DB.vendors=DB.vendors.filter(v=>v.id!==id);return{ok:true};
  },

  /* ── 부적합 ── */
  async addNc(row){
    if(!_sb){const id=Math.max(0,...DB.nc.map(n=>n.id))+1;DB.nc.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.17) */
    const {error}=await _sb.from('nonconformances').insert(row);
    if(error){Toast.show('부적합 저장 실패: '+error.message,'err');return{ok:false};}
    DB.nc.push({id:Date.now(),...row});return{ok:true};
  },
  async updateNc(id,patch){
    if(!_sb){const n=DB.nc.find(n=>n.id===id);if(n)Object.assign(n,patch);return{ok:true};}
    const {error}=await _sb.from('nonconformances').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const n=DB.nc.find(n=>n.id===id);if(n)Object.assign(n,patch);return{ok:true};
  },

  /* ── 계측기 ── */
  async getEquip(){
    if(!_sb) return DB.equip;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('equipment','id',true);
    if(data===null){console.warn('[SB] equip 조회 실패');return [];}
    return data;
  },
  async addEquip(row){
    if(!_sb){const id=Math.max(0,...DB.equip.map(e=>e.id))+1;DB.equip.push({id,...row});return{ok:true,id};}
    /* [v2.29] 허용 컬럼만 추출 + 동적 컬럼 오류 제거 */
    /* [v2.29] 날짜 시리얼/객체 → YYYY-MM-DD 변환 */
    const _fmtD=(v)=>{
      if(!v&&v!==0) return null;
      if(v instanceof Date){const y=v.getUTCFullYear(),mo=v.getUTCMonth()+1,dy=v.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}
      const s=String(v).trim();
      if(!s) return null;
      if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      if(s.includes(' ')&&s.length>8){const d=new Date(s);if(!isNaN(d.getTime())){const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}}
      const n=Number(s);
      if(!isNaN(n)&&n>30000&&n<100000){const d=new Date(Math.round((n-25569)*86400)*1000);const y=d.getUTCFullYear(),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;}
      return s||null;
    };
    const allowed={
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
      next:        _fmtD(row.next),
      last:        _fmtD(row.last),
      updated_at:  null,
      created_at:  row.created_at||null,
    };
    /* [v2.29] upsert — code 중복 시 update (insert conflict 방지) */
    let insertRow={...allowed};
    let {error}=await _sb.from('equipment').upsert(insertRow,{onConflict:'code',ignoreDuplicates:false});
    let retries=0;
    while(error&&(error.message?.includes('column')||error.message?.includes('schema cache'))&&retries<8){
      retries++;
      const m=error.message.match(/['"`](\w+)['"`]\s*column/);
      if(m&&m[1]){delete insertRow[m[1]];console.warn('[SB] addEquip 컬럼 제거:',m[1]);}
      else break;
      ({error}=await _sb.from('equipment').upsert(insertRow,{onConflict:'code',ignoreDuplicates:false}));
    }
    if(error){
      console.error('[SB] addEquip 최종 오류:',error.message);
      Toast.show('계측기 저장 실패: '+error.message,'err');
      return{ok:false};
    }
    /* [v2.290] 컬럼 누락으로 일부 저장 시 SQL 팝업 안내 (최초 1회) */
    if(retries>0&&!SB._equipColWarned){
      SB._equipColWarned=true;
      SB._showEquipColSQL();
    }
    DB.equip.push({id:Date.now(),...insertRow});return{ok:true};
  },
  async updateEquip(id,patch){
    if(!_sb){const e=DB.equip.find(e=>e.id===id);if(e)Object.assign(e,patch);return{ok:true};}
    const {error}=await _sb.from('equipment').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const e=DB.equip.find(e=>e.id===id);if(e)Object.assign(e,patch);return{ok:true};
  },

  /* ── 교정 ── */
  async getCals(){
    if(!_sb) return DB.cals;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('calibrations','cal_date',false);
    if(data===null){console.warn('[SB] cals 조회 실패');return [];}
    return data;
  },
  async addCal(row){
    /* [v2.305 Phase1] allowed 컬럼 명시 */
    const allowed={
      equip_code: row.equip_code||row.code||'',
      code:        row.code||row.equip_code||'',
      cal_date:    row.cal_date||row.date||null,
      date:        row.date||row.cal_date||null,
      next_date:   row.next_date||row.next||null,
      next:        row.next||row.next_date||null,
      agency:      row.agency||'',
      cert_no:     row.cert_no||row.cert||'',
      cert:        row.cert||row.cert_no||'',
      result:      row.result||'합격',
      cost:        row.cost||null,
      note:        row.note||'',
      file_url:    row.file_url||'',
      created_by:  row.created_by||Auth.cur()?.username||'system',
    };
    if(!_sb){const id=Math.max(0,...DB.cals.map(c=>c.id))+1;DB.cals.push({id,...allowed});return{ok:true,id};}
    const {error}=await _sb.from('calibrations').insert(allowed);
    if(error){Toast.show('교정 저장 실패: '+error.message,'err');return{ok:false};}
    DB.cals.push({id:Date.now(),...allowed});return{ok:true};
  },

  /* ── [v2.305 Phase1] 교정이력 수정/삭제 ── */
  async updateCal(id, patch){
    if(!_sb){const c=DB.cals.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};}
    patch.updated_at=H.today();
    const{error}=await _sb.from('calibrations').update(patch).eq('id',id);
    if(error){Toast.show('교정이력 수정 실패: '+error.message,'err');return{ok:false};}
    const c=DB.cals.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};
  },
  async deleteCal(id){
    if(!_sb){DB.cals=DB.cals.filter(c=>c.id!==id);return{ok:true};}
    const{error}=await _sb.from('calibrations').delete().eq('id',id);
    if(error){Toast.show('교정이력 삭제 실패: '+error.message,'err');return{ok:false};}
    DB.cals=DB.cals.filter(c=>c.id!==id);return{ok:true};
  },

  /* ── [v2.305 Phase1] 변경 이력 조회/저장 ── */
  async getLogs(equip_code){
    if(!_sb){return DB.equip_logs.filter(l=>l.equip_code===equip_code);}
    const{data,error}=await _sb.from('equipment_logs')
      .select('*').eq('equip_code',equip_code)
      .order('changed_at',{ascending:false});
    if(error){console.warn('[SB] getLogs 실패:',error.message);return[];}
    return data||[];
  },
  async addLog(row){
    /* row: {equip_code, change_type, field_name, old_value, new_value, changed_by} */
    const entry={...row, changed_at:new Date().toISOString()};
    DB.equip_logs.unshift({id:Date.now(),...entry});
    if(!_sb) return{ok:true};
    const{error}=await _sb.from('equipment_logs').insert(entry);
    if(error){console.warn('[SB] addLog 실패:',error.message);return{ok:false};}
    return{ok:true};
  },


  /* ── 문서 ── */
  async getDocs(){
    if(!_sb) return DB.docs;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('documents','id',true);
    if(data===null){console.warn('[SB] docs 조회 실패');return [];}
    return data;
  },
  async addDoc(row){
    if(!_sb){const id=Math.max(0,...DB.docs.map(d=>d.id))+1;DB.docs.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.17) */
    const {error}=await _sb.from('documents').insert(row);
    if(error){Toast.show('문서 저장 실패: '+error.message,'err');return{ok:false};}
    DB.docs.push({id:Date.now(),...row});return{ok:true};
  },
  async updateDoc(id,patch){
    if(!_sb){const d=DB.docs.find(d=>d.id===id);if(d)Object.assign(d,patch);return{ok:true};}
    const {error}=await _sb.from('documents').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const d=DB.docs.find(d=>d.id===id);if(d)Object.assign(d,patch);return{ok:true};
  },

  /* ── 시정조치(CAR) ── */
  async getCars(){
    if(!_sb) return DB.cars;
    /* [v2.25] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('corrective_actions','date',false);
    if(data===null){console.warn('[SB] cars 조회 실패');return [];}
    return data;
  },
  async addCar(row){
    if(!_sb){const id=Math.max(0,...DB.cars.map(c=>c.id))+1;DB.cars.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.17) */
    const {error}=await _sb.from('corrective_actions').insert(row);
    if(error){Toast.show('CAR 저장 실패: '+error.message,'err');return{ok:false};}
    DB.cars.push({id:Date.now(),...row});return{ok:true};
  },
  async updateCar(id,patch){
    if(!_sb){const c=DB.cars.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};}
    const {error}=await _sb.from('corrective_actions').update(patch).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const c=DB.cars.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};
  },
};

/* ══ 전역 상태 ══ *//* ══ DB ══ */
const DB={
  items:[
    {id:1,item_code:'RAW-001',item_name:'스테인레스 플레이트',category:'원자재',spec:'SUS304 2T',material:'SUS304',unit:'EA',vendor_id:1,vendor_name:'㈜한국스틸',active:1,created_at:'2026-01-10',updated_at:'2026-03-15'},
    {id:2,item_code:'RAW-002',item_name:'알루미늄 바',category:'원자재',spec:'A6061 Ø20',material:'AL6061',unit:'M',vendor_id:2,vendor_name:'알루미늄코리아',active:1,created_at:'2026-01-12',updated_at:'2026-04-01'},
    {id:3,item_code:'SUB-001',item_name:'육각볼트 M8',category:'부자재',spec:'M8×25 SUS',material:'SUS',unit:'EA',vendor_id:3,vendor_name:'㈜부품나라',active:1,created_at:'2026-01-15',updated_at:'2026-01-15'},
    {id:4,item_code:'SFG-001',item_name:'가공 브라켓',category:'반제품',spec:'자체제작',material:'SS400',unit:'EA',vendor_id:null,vendor_name:'-',active:1,created_at:'2026-02-01',updated_at:'2026-02-01'},
    {id:5,item_code:'FG-001',item_name:'완성 어셈블리',category:'완제품',spec:'A TYPE',material:'복합',unit:'SET',vendor_id:null,vendor_name:'-',active:1,created_at:'2026-02-10',updated_at:'2026-04-20'},
    {id:6,item_code:'CONS-001',item_name:'절삭유',category:'소모품',spec:'수용성',material:'-',unit:'L',vendor_id:4,vendor_name:'화학산업㈜',active:0,created_at:'2026-03-01',updated_at:'2026-03-01'},
  ],
  vendors:[
    {id:1,vendor_name:'㈜한국스틸',   vendor_type:'원자재',biz_no:'123-45-67890',ceo_name:'김대표',tel:'02-1234-5678',fax:'02-1234-5679',email:'steel@hankook.co.kr',    manager:'이담당',manager_tel:'010-1234-5678',manager_email:'lee@hankook.co.kr',   active:1,created_at:'2026-01-05',updated_at:'2026-03-10'},
    {id:2,vendor_name:'알루미늄코리아', vendor_type:'원자재',biz_no:'234-56-78901',ceo_name:'박사장',tel:'031-234-5678',fax:'031-234-5679',email:'info@alkorea.co.kr',      manager:'최담당',manager_tel:'010-2345-6789',manager_email:'choi@alkorea.co.kr',  active:1,created_at:'2026-01-06',updated_at:'2026-01-06'},
    {id:3,vendor_name:'㈜부품나라',   vendor_type:'부자재',biz_no:'345-67-89012',ceo_name:'이대표',tel:'032-345-6789',fax:'032-345-6780',email:'parts@bupum.co.kr',      manager:'강담당',manager_tel:'010-3456-7890',manager_email:'kang@bupum.co.kr',   active:1,created_at:'2026-01-07',updated_at:'2026-02-15'},
    {id:4,vendor_name:'화학산업㈜',   vendor_type:'소모품',biz_no:'456-78-90123',ceo_name:'정사장',tel:'051-456-7890',fax:'051-456-7891',email:'chem@hwahak.co.kr',       manager:'윤담당',manager_tel:'010-4567-8901',manager_email:'yoon@hwahak.co.kr',  active:1,created_at:'2026-01-08',updated_at:'2026-01-08'},
    {id:5,vendor_name:'정밀측정기㈜', vendor_type:'외주',  biz_no:'567-89-01234',ceo_name:'한대표',tel:'02-567-8901', fax:'02-567-8902', email:'measure@jungmil.co.kr',   manager:'신담당',manager_tel:'010-5678-9012',manager_email:'shin@jungmil.co.kr', active:1,created_at:'2026-02-01',updated_at:'2026-04-20'},
  ],
  users:[
    {id:1,username:'admin',  name:'시스템관리자',department:'IT팀',  tel:'010-0000-0001',email:'admin@company.com',   role:'admin',  active:1,created_at:'2026-01-01',updated_at:'2026-04-01'},
    {id:2,username:'qm01',   name:'김품질',      department:'품질팀',tel:'010-1234-5678',email:'qm01@company.com',   role:'manager',active:1,created_at:'2026-01-02',updated_at:'2026-01-02'},
    {id:3,username:'insp01', name:'이검사',      department:'품질팀',tel:'010-2345-6789',email:'insp01@company.com', role:'user',   active:1,created_at:'2026-01-03',updated_at:'2026-01-03'},
    {id:4,username:'prod01', name:'박생산',      department:'생산팀',tel:'010-3456-7890',email:'prod01@company.com', role:'user',   active:1,created_at:'2026-01-04',updated_at:'2026-03-15'},
    {id:5,username:'eng01',  name:'최엔지니어',  department:'개발팀',tel:'010-4567-8901',email:'eng01@company.com',  role:'user',   active:1,created_at:'2026-01-05',updated_at:'2026-01-05'},
  ],
    inspections:[], /* [v2.29] 더미 제거 — SB에서 로드 */

  nc:[
    {id:1,no:'NC-20260430-001',type:'수입',item:'알루미늄 바',date:'2026-04-30',status:'처리중',desc:'치수 불량 - 직경 기준 초과',assignee:'김품질'},
    {id:2,no:'NC-20260425-001',type:'공정',item:'가공 브라켓',date:'2026-04-25',status:'접수',desc:'표면 스크래치 발생',assignee:'박생산'},
    {id:3,no:'NC-20260420-001',type:'출하',item:'완성 어셈블리',date:'2026-04-20',status:'완료',desc:'포장 불량',assignee:'김품질'},
  ],
  equip:[
    {id:1,code:'EQ-001',name:'버니어캘리퍼스',model:'CD-20CP',maker:'미쓰토요',range:'0~200mm',res:'0.01mm',loc:'품질실',status:'정상',next:'2026-07-01',last:'2026-01-01'},
    {id:2,code:'EQ-002',name:'마이크로미터',model:'MDC-25MJ',maker:'미쓰토요',range:'0~25mm',res:'0.001mm',loc:'품질실',status:'정상',next:'2026-08-01',last:'2026-02-01'},
    {id:3,code:'EQ-003',name:'다이얼게이지',model:'1044S',maker:'미쓰토요',range:'0~10mm',res:'0.01mm',loc:'생산팀',status:'교정중',next:'2026-05-15',last:'2025-11-15'},
    {id:4,code:'EQ-004',name:'표면조도계',model:'SJ-210',maker:'미쓰토요',range:'Ra0~16μm',res:'0.001μm',loc:'품질실',status:'정상',next:'2026-09-01',last:'2026-03-01'},
    {id:5,code:'EQ-005',name:'경도계(로크웰)',model:'HR-530L',maker:'미쓰토요',range:'20~100HRC',res:'0.5HRC',loc:'품질실',status:'교정만료',next:'2026-04-01',last:'2025-10-01'},
  ],
  cals:[
    {id:1,code:'EQ-001',name:'버니어캘리퍼스',date:'2026-01-01',agency:'㈜정밀측정',result:'합격',next:'2026-07-01',cert:'CAL-2026-001'},
    {id:2,code:'EQ-002',name:'마이크로미터',date:'2026-02-01',agency:'㈜정밀측정',result:'합격',next:'2026-08-01',cert:'CAL-2026-002'},
    {id:3,code:'EQ-003',name:'다이얼게이지',date:'2025-11-15',agency:'한국계량측정',result:'합격',next:'2026-05-15',cert:'CAL-2025-015'},
    {id:4,code:'EQ-005',name:'경도계(로크웰)',date:'2025-10-01',agency:'㈜정밀측정',result:'합격',next:'2026-04-01',cert:'CAL-2025-010'},
  ],
  /* [v2.305 Phase1] 계측기 변경이력 캐시 */
  equip_logs:[],
  docs:[
    {id:1,no:'QP-20260110-001',type:'절차서',title:'수입검사 절차서',rev:'2.0',date:'2026-01-10',status:'유효',author:'김품질'},
    {id:2,no:'QP-20260115-001',type:'절차서',title:'부적합품 관리 절차서',rev:'1.5',date:'2026-01-15',status:'유효',author:'김품질'},
    {id:3,no:'QI-20260201-001',type:'지침서',title:'계측기 교정 관리 지침',rev:'1.0',date:'2026-02-01',status:'유효',author:'이검사'},
    {id:4,no:'QF-20260210-001',type:'양식',title:'수입검사 성적서',rev:'3.0',date:'2026-02-10',status:'유효',author:'김품질'},
    {id:5,no:'QP-20260301-001',type:'절차서',title:'시정조치 절차서',rev:'1.0',date:'2026-03-01',status:'초안',author:'관리자'},
  ],
  cars:[
    {id:1,no:'CAR-20260430-001',src:'부적합',title:'알루미늄 바 치수불량 재발방지',status:'처리중',open:'2026-04-30',due:'2026-05-14',assignee:'박생산'},
    {id:2,no:'CAR-20260415-001',src:'내부심사',title:'검사 기록 미비 개선',status:'완료',open:'2026-04-15',due:'2026-04-30',assignee:'이검사'},
    {id:3,no:'CAR-20260401-001',src:'고객불만',title:'포장 개선 조치',status:'접수',open:'2026-04-01',due:'2026-05-01',assignee:'김품질'},
  ],
  /* ── 멘션 데이터
     Supabase 배포 시: supabase.from('mentions').select('*').order('created_at',{ascending:false})
     필드: id, from(작성자), to(수신자), dept, text, ref(참조메뉴), time, read, replies(댓글배열) */
  mentions:[
    {id:1,from:'김품질',to:'관리자',to_list:['관리자'],dept:'품질팀',text:'@관리자 수입검사 결과 확인 부탁드립니다.',ref:'수입검사',channel:'quality',type:'mention',priority:'normal',status:'open',pinned:false,reactions:{},time:'5분 전',read:false,replies:[]},
    {id:2,from:'이검사',to:'관리자',dept:'품질팀',text:'@관리자 부적합 보고서 NC-20260430-001 검토 요청입니다.',ref:'부적합관리',time:'1시간 전',read:false,replies:[{id:1,from:'관리자',text:'확인하겠습니다.',time:'50분 전'}]},
    {id:3,from:'박담당',to:'관리자',dept:'생산팀',text:'@관리자 CAR-20260430-001 처리 부탁드립니다.',ref:'시정조치',time:'2시간 전',read:false,replies:[]},
    {id:4,from:'최엔지니어',to:'관리자',dept:'개발팀',text:'@관리자 EQ-003 교정 만료 확인 요청드립니다.',ref:'계측기관리',time:'1일 전',read:true,replies:[]},
  ],
};

/* ══ 헬퍼 ══ *//* ══ 토스트 ══ */