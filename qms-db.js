/* qms-db.js — DB 초기 데이터 + Supabase 객체 [v2.396.1]
   v2.395  2026-06-01  문서관리 고도화 SB 함수 추가 (하단 참조) */
"use strict";

const SUPABASE_URL  = 'https://phxlsnghgvowrxdlcsph.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeGxzbmdoZ3Zvd3J4ZGxjc3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDUyNjAsImV4cCI6MjA5NDMyMTI2MH0.bddEx1cymfYIfKVWe01mb7qSZQMN3j-sNdFRyGzoGIA';
const SUPABASE_SERVICE_KEY = ''; /* [v2.394] 파일 업로드용 — Dashboard에서 service_role key 입력 */

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
   v2.394: SB 헬퍼 초기 구현 — getItems/getVendors/getInspections/getMentions 등
   v2.394: SB.uploadFile/deleteFile — Supabase Storage 연동
   v2.394: 일괄 버그 수정
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
     [v2.394 근본수정] hasMore 로직 버그 수정
     CHUNK=1000으로 SB 기본 단위와 일치시켜 페이지네이션
     data.length < CHUNK 이면 마지막 페이지 → 종료 */

  /* ── 소프트 삭제 공통 헬퍼 [v2.394] ──
     실제 삭제 대신 deleted_at = now() 로 표시
     복구: deleted_at = null 로 초기화 */
  async _softDelete(table, ids){
    if(!_sb) return {ok:true};
    const now=new Date().toISOString();
    const {error}=await _sb.from(table)
      .update({deleted_at:now})
      .in('id', Array.isArray(ids)?ids:[ids]);
    if(error){
      console.error(`[SB] softDelete ${table}:`,error.message);
      Toast.show('삭제 실패: '+error.message,'err');
      return {ok:false};
    }
    return {ok:true};
  },

  /* ── 소프트 삭제 복구 공통 헬퍼 [v2.394] ── */
  async _restoreDeleted(table, ids){
    if(!_sb) return {ok:true};
    const {error}=await _sb.from(table)
      .update({deleted_at:null})
      .in('id', Array.isArray(ids)?ids:[ids]);
    if(error){
      console.error(`[SB] restore ${table}:`,error.message);
      Toast.show('복구 실패: '+error.message,'err');
      return {ok:false};
    }
    return {ok:true};
  },

  /* ── 삭제된 항목 조회 [v2.394] ── */
  async getDeleted(table){
    if(!_sb) return [];
    const {data,error}=await _sb.from(table)
      .select('*')
      .not('deleted_at','is',null)
      .order('deleted_at',{ascending:false})
      .limit(200);
    if(error){console.warn(`[SB] getDeleted ${table}:`,error.message);return [];}
    return data||[];
  },

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

  /* ── [Phase 1 v2.394] 서버사이드 페이지네이션 헬퍼 ──
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
    const data=await this._sbFetchAll('items','id',true,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] items 조회 실패');return [];}
    return data;
  },

  /* 거래처 목록 조회 — 전체 반환 */
  /* 거래처 목록 조회 — 전체 반환 */
  async getVendors(){
    if(!_sb) return DB.vendors;
    const data=await this._sbFetchAll('vendors','id',true,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] vendors 조회 실패');return [];}
    return data;
  },

  /* 검사 목록 조회 */
  async getInspections(type=null){
    if(!_sb) return type?DB.inspections.filter(i=>i.type===type):DB.inspections;
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('inspections','insp_date',false,
      type?q=>q.eq('type',type,q=>q.is('deleted_at',null)):null);
    if(data===null){console.warn('[SB] inspections 조회 실패');return [];}
    return data;
  },

  /* 검사 등록 */
  async addInspection(row){
    if(!_sb){const id=Math.max(0,...DB.inspections.map(i=>i.id))+1;DB.inspections.push({id,...row});return {ok:true,id};}
    /* [v2.394] 허용 컬럼만 추출 — SB inspections 실제 컬럼만 포함
       SQL 미실행 시 없는 컬럼(spec, insp_method, wo_no, note, defect_rate) 자동 제거 */
    /* [v2.394] 엑셀 날짜 → YYYY-MM-DD (Date객체/시리얼/문자열 모두 처리) */
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
      updated_at:  null,  /* [v2.394] 등록 시 수정일 비움 */
    };
    /* [v2.394] upsert 시도, 실패시 insert 폴백 */
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
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('nonconformances','date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] nc 조회 실패');return [];}
    return data;
  },

  /* 멘션 목록 조회 */
  async getMentions(){
    if(!_sb) return DB.mentions||[];
    /* [v2.394] deleted_at IS NULL 필터 — 소프트 삭제된 항목 제외 */
    try{
      const {data,error}=await _sb.from('mentions')
        .select('*')
        .is('deleted_at',null)
        .order('created_at',{ascending:false})
        .limit(500);
      if(error) throw error;
      return data||[];
    }catch(e){
      /* deleted_at 컬럼 없으면 전체 조회 폴백 */
      const data=await this._sbFetchAll('mentions','created_at',false,q=>q.is('deleted_at',null));
      if(data===null){console.warn('[SB] mentions 조회 실패');return DB.mentions||[];}
      return data;
    }
  },

  /* 멘션 등록 */
  async addMention(row){
    if(!_sb){const id=Math.max(0,...DB.mentions.map(m=>m.id))+1;DB.mentions.unshift({id,...row,replies:[]});return {ok:true};}
    /* [v2.394] SB mentions 테이블 실제 컬럼만 전송
       기본 컬럼: from, to, to_list, text, dept, message, ref, reply_to, read
       ※ channel/type/priority/status/thread_id 등 미생성 컬럼 제외 */
    const insertRow={
      from:      row.from||'',
      to:        row.to||'',
      to_list:   Array.isArray(row.to_list)?row.to_list:[row.to||''],
      text:      row.text||row.message||'',
      dept:      row.dept||'',
      message:   row.message||row.text||'',
      ref:       row.ref||row.ref_key||'',
      reply_to:  row.reply_to||null,
      read:      row.read||false,
      file_url:  row.file_url||null,   /* [v2.394] 파일 첨부 */
    };
    /* created_at 있으면 포함 */
    if(row.created_at) insertRow.created_at=row.created_at;
    const {error}=await _sb.from('mentions').insert(insertRow);
    if(error){
      console.error('[SB] addMention 오류:', error.message);
      Toast.show('멘션 저장 실패: '+error.message,'err');
      return {ok:false};
    }
    return {ok:true};
  },

  /* 멘션 수정 */
  async updateMention(id,patch){
    /* [v2.394] 실제 SB 컬럼만 업데이트 */
    if(!_sb){const m=DB.mentions.find(m=>m.id===id);if(m)Object.assign(m,patch);return {ok:true};}
    /* 허용 컬럼만 필터링 */
    const allowed={};
    const COLS=['from','to','to_list','text','message','dept','ref','reply_to','read','file_url','saved'];  /* [v2.394] */
    COLS.forEach(k=>{if(k in patch) allowed[k]=patch[k];});
    if(!Object.keys(allowed).length) return {ok:true};
    const {error}=await _sb.from('mentions').update(allowed).eq('id',id);
    if(error){console.warn('[SB] updateMention 오류:',error.message);return {ok:false};}
    const m=DB.mentions.find(m=>m.id===id);if(m)Object.assign(m,patch);
    return {ok:true};
  },

  /* 멘션 삭제 (soft delete: deleted_at 기록) */
  async deleteMention(id){
    if(!_sb){DB.mentions=DB.mentions.filter(m=>m.id!==id);return {ok:true};}
    /* [v2.394] 소프트 삭제 — deleted_at 설정 (복구 가능) */
    const res=await SB._softDelete('mentions', [id]);
    if(!res.ok) return {ok:false};
    DB.mentions=DB.mentions.filter(m=>m.id!==id);return {ok:true};
  },

  /* 파일 업로드 (Supabase Storage: qms-files 버킷) */
  async uploadFile(key,file){
    if(!_sb) return null;
    /* [v2.394] 한글/특수문자 → ASCII로 변환 (Supabase Storage 요구사항) */
    const safeName=file.name
      .normalize('NFD')                        /* 유니코드 정규화 */
      .replace(/[\u0300-\u036f]/g,'')         /* 결합문자 제거 */
      .replace(/[^a-zA-Z0-9._-]/g,'_')        /* 한글/특수문자 → _ */
      .replace(/_+/g,'_')                      /* 연속 _ 정리 */
      .slice(0,80);                            /* 최대 80자 */
    const path=key+'/'+Date.now()+'_'+safeName;
    /* [v2.394] service_role key로 RLS 우회 업로드 */
    const _uploadSb = (typeof SUPABASE_SERVICE_KEY!=='undefined' && SUPABASE_SERVICE_KEY)
      ? supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      : _sb;
    const {data,error}=await _uploadSb.storage.from('qms-files').upload(path,file,{upsert:true});
    if(error){
      console.error('[SB] 파일 업로드 실패 — bucket:qms-files path:'+path, error);
      Toast.show('파일 업로드 실패: '+error.message,'err',5000);
      return null;
    }
    const {data:urlData}=_uploadSb.storage.from('qms-files').getPublicUrl(path);
    return {path, url:urlData.publicUrl, name:file.name, size:H._fmtSize(file.size), date:H.today()};
  },

  /* 파일 삭제 */
  async deleteFile(path){
    if(!_sb) return;
    const {error}=await _sb.storage.from('qms-files').remove([path]);
    if(error) console.warn('[SB] 파일 삭제 실패',error.message);
  },

  /* [v2.394] deleteVendors: 일괄 삭제 */
  async deleteVendors(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));return{ok:true};}
    const res=await SB._softDelete('vendors', ids);
    if(!res.ok) return {ok:false};
    DB.vendors=DB.vendors.filter(v=>!numIds.includes(Number(v.id)));
    if(error){console.error('[SB] deleteVendors 실패:',error.message);return{ok:false,msg:error.message};}
    return{ok:true};
  },

  /* ── 사용자 ── */
  async getUsers(){
    if(!_sb) return DB.users;
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('users','id',true);
    if(data===null){console.warn('[SB] users 조회 실패');return [];}
    return data;
  },
  async addUser(row){
    if(!_sb){const id=Math.max(0,...DB.users.map(u=>u.id))+1;DB.users.push({id,...row,updated_at:null});return{ok:true,id};}
    /* [v2.394] updated_at null로 명시 — 등록 시 수정일 비움 */
    const insertRow={...row, updated_at:null};
    const {error}=await _sb.from('users').insert(insertRow);
    if(error){Toast.show('사용자 저장 실패: '+error.message,'err');return{ok:false};}
    DB.users.push({id:Date.now(),...row});return{ok:true};
  },
  async updateUser(id,patch){
    if(!_sb){const u=DB.users.find(u=>u.id===id);if(u)Object.assign(u,patch);return{ok:true};}
    /* [v2.394] updated_at 오늘 날짜로 명시 — 수정 시만 기록 */
    const patchWithDate={...patch, updated_at:H.today()};
    const {error}=await _sb.from('users').update(patchWithDate).eq('id',id);
    if(error){Toast.show('수정 실패: '+error.message,'err');return{ok:false};}
    const u=DB.users.find(u=>u.id===id);if(u)Object.assign(u,patch);return{ok:true};
  },
  /* [v2.396.1 버그수정] deleteUser: error 변수 미정의 수정 → _softDelete 결과로 판단 */
  async deleteUser(id){
    if(!_sb){DB.users=DB.users.filter(u=>Number(u.id)!==Number(id));return{ok:true};}
    const res=await SB._softDelete('users', [id]);
    if(!res.ok){Toast.show('삭제 실패: '+(res.msg||'알 수 없는 오류'),'err');return{ok:false};}
    DB.users=DB.users.filter(u=>Number(u.id)!==Number(id));
    return{ok:true};
  },
  /* [v2.394] deleteUsers: 일괄 삭제 [v2.396.1 error변수 버그 수정] */
  async deleteUsers(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));return{ok:true};}
    const res=await SB._softDelete('users', numIds);
    if(!res.ok){console.error('[SB] deleteUsers 실패:',res.msg||'');return{ok:false,msg:res.msg||''};}
    DB.users=DB.users.filter(u=>!numIds.includes(Number(u.id)));
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
  /* [v2.394] deleteItem: 단건/복수 삭제 지원 */
  async deleteItem(id){
    if(!_sb){
      DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
      return{ok:true};
    }
    const res=await SB._softDelete('items', [id]);
    if(!res.ok) return {ok:false};
    if(error){
      console.error('[SB] deleteItem 실패:',error.message);
      /* 오류 원인 출력 후에도 로컬 캐시에서는 제거 */
      DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
      return{ok:false,msg:error.message};
    }
    DB.items=DB.items.filter(i=>Number(i.id)!==Number(id));
    return{ok:true};
  },

  /* [v2.394] deleteItems: 복수 일괄 삭제 (IN 쿼리로 1번에 처리) */
  async deleteItems(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true}; /* 빈 배열 전달 시 전체 삭제 방지 */
    if(!_sb){
      DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
      return{ok:true};
    }
    const res=await SB._softDelete('items', ids);
    if(!res.ok) return {ok:false};
    /* SB 성공 여부와 무관하게 로컬 캐시 즉시 제거 */
    DB.items=DB.items.filter(i=>!numIds.includes(Number(i.id)));
    if(error){
      console.error('[SB] deleteItems 실패:',error.message);
      return{ok:false,msg:error.message};
    }
    return{ok:true};
  },
  /* [v2.394] deleteInspections: 검사 일괄 삭제 */
  async deleteInspections(ids){
    const numIds=ids.map(Number);
    if(!numIds.length) return{ok:true};
    if(!_sb){DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));return{ok:true};}
    const res=await SB._softDelete('inspections', ids);
    if(!res.ok) return {ok:false};
    DB.inspections=DB.inspections.filter(i=>!numIds.includes(Number(i.id)));
    if(error){console.error('[SB] deleteInspections 실패:',error.message);return{ok:false,msg:error.message};}
    return{ok:true};
  },


  /* ── 거래처 ── */
    async addVendor(row){
    if(!_sb){const id=Math.max(0,...DB.vendors.map(v=>v.id))+1;DB.vendors.push({id,...row});return{ok:true,id};}
    /* [v2.394] 허용 컬럼만 추출 */
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
      updated_at:    null,  /* [v2.394] 등록 시 수정일 비움 */
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
  /* [v2.394] vendors 컬럼 추가 SQL 안내 팝업 */
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
  /* [v2.394] equipment 누락 컬럼 SQL 안내 */
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

  /* [v2.394] mentions 테이블 누락 컬럼 SQL 안내 */
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
    const res=await SB._softDelete('vendors', [id]);
    if(!res.ok) return {ok:false};
    if(error){Toast.show('삭제 실패: '+error.message,'err');return{ok:false};}
    DB.vendors=DB.vendors.filter(v=>v.id!==id);return{ok:true};
  },

  /* ── 부적합 ── */
  async addNc(row){
    if(!_sb){const id=Math.max(0,...DB.nc.map(n=>n.id))+1;DB.nc.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.394) */
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
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('equipment','id',true,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] equip 조회 실패');return [];}
    return data;
  },
  async addEquip(row){
    if(!_sb){const id=Math.max(0,...DB.equip.map(e=>e.id))+1;DB.equip.push({id,...row});return{ok:true,id};}
    /* [v2.394] 허용 컬럼만 추출 + 동적 컬럼 오류 제거 */
    /* [v2.394] 날짜 시리얼/객체 → YYYY-MM-DD 변환 */
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
      file_url:    row.file_url||null,    /* [v2.394] 파일 URL */
    };
    /* [v2.394] upsert — code 중복 시 update (insert conflict 방지) */
    let insertRow={...allowed};
    let {error}=await _sb.from('equipment').upsert(insertRow,{onConflict:'code',ignoreDuplicates:false});
    /* [v2.394] 컬럼 자동 제거 루프 제거 — 에러 시 즉시 안내 */
    if(error){
      console.error('[SB] addEquip 오류:',error.message);
      if(error.message?.includes('column')||error.message?.includes('schema')){
        Toast.show('SB 컬럼 오류. Supabase SQL에서 equipment 컬럼을 추가해주세요.','err',5000);
      } else {
        Toast.show('계측기 저장 실패: '+error.message,'err');
      }
      return{ok:false};
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
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('calibrations','cal_date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] cals 조회 실패');return [];}
    return data;
  },
  async addCal(row){
    /* [v2.106] cert 컬럼 NOT NULL 제약 — cert_no와 함께 동일값 전송 (cert 컬럼 존재 시에만 안전) */
    const certVal = row.cert_no||row.cert||'';
    const allowed={
      equip_code: row.equip_code||row.code||'',
      cal_date:    row.cal_date||row.date||null,
      next_date:   row.next_date||row.next||null,
      agency:      row.agency||'',
      cert_no:     certVal,
      cert:        certVal,
      result:      row.result||'합격',
      cost:        row.cost||null,
      note:        row.note||'',
      file_url:    row.file_url||null,
      file_name:   row.file_name||null,
      created_by:  row.created_by||Auth.cur()?.username||'system',
    };
    if(!_sb){const id=Math.max(0,...DB.cals.map(c=>c.id))+1;DB.cals.push({id,...allowed});return{ok:true,id};}
    const {error}=await _sb.from('calibrations').insert(allowed);
    if(error){Toast.show('교정 저장 실패: '+error.message,'err');return{ok:false};}
    DB.cals.push({id:Date.now(),...allowed});return{ok:true};
  },

  /* ── [v2.394 Phase1] 교정이력 수정/삭제 ── */
  async updateCal(id, patch){
    if(!_sb){const c=DB.cals.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};}
    /* [v2.106] 실제 컬럼만 필터 — code/date/next/cert 등 없는 컬럼 제거 */
    const cols=['equip_code','cal_date','next_date','agency','cert_no','result','cost','note','file_url','file_name'];
    /* [v2.106] cert 컬럼 NOT NULL — cert_no 변경 시 cert도 동일하게 업데이트 */
    if(patch.cert_no!==undefined) patch.cert=patch.cert_no;
    cols.push('cert');
    const allowed={};
    cols.forEach(function(k){ if(patch[k]!==undefined) allowed[k]=patch[k]; });
    allowed.updated_at=H.today();
    const{error}=await _sb.from('calibrations').update(allowed).eq('id',id);
    if(error){Toast.show('교정이력 수정 실패: '+error.message,'err');return{ok:false};}
    const c=DB.cals.find(c=>c.id===id);if(c)Object.assign(c,patch);return{ok:true};
  },
  async deleteCal(id){
    if(!_sb){DB.cals=DB.cals.filter(c=>c.id!==id);return{ok:true};}
    const res=await SB._softDelete('calibrations', [id]);
    if(!res.ok) return {ok:false};
    DB.cals=DB.cals.filter(c=>c.id!==id);return{ok:true};
  },

  /* ── [v2.394 Phase1] 변경 이력 조회/저장 ── */
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
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('documents','id',true);
    if(data===null){console.warn('[SB] docs 조회 실패');return [];}
    return data;
  },
  async addDoc(row){
    if(!_sb){const id=Math.max(0,...DB.docs.map(d=>d.id))+1;DB.docs.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.394) */
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
    /* [v2.394] _sbFetchAll: 1000건 제한 해제 */
    const data=await this._sbFetchAll('corrective_actions','date',false);
    if(data===null){console.warn('[SB] cars 조회 실패');return [];}
    return data;
  },
  async addCar(row){
    if(!_sb){const id=Math.max(0,...DB.cars.map(c=>c.id))+1;DB.cars.push({id,...row});return{ok:true,id};}
    /* .select() 미사용: RLS 오류 방지 (v2.394) */
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

  /* [v2.65 fix D1] DMS 지원 함수 */

  /* ════ code_types — 문서유형/분류 코드 관리 [v2.78] ════ */
  async getCodeTypes(category){
    if(!_sb) return [];
    var q=_sb.from('code_types').select('*').order('sort_order').order('id');
    if(category) q=q.eq('category',category);
    var {data,error}=await q;
    if(error){console.warn('getCodeTypes:',error.message);return [];}
    return data||[];
  },
  async addCodeType(category,code,label){
    if(!_sb) return {ok:false};
    var {error}=await _sb.from('code_types').insert({category,code,label});
    if(error){Toast.show('코드 추가 실패: '+error.message,'err');return {ok:false};}
    return {ok:true};
  },
  async deleteCodeType(id){
    if(!_sb) return {ok:false};
    var {error}=await _sb.from('code_types').delete().eq('id',id);
    if(error){Toast.show('코드 삭제 실패: '+error.message,'err');return {ok:false};}
    return {ok:true};
  },
  async getDocMaster(filter){
    if(!_sb) return window._docRows||[];
    var q=_sb.from('doc_master').select('*').order('created_at',{ascending:false});
    if(filter?.doc_type) q=q.eq('doc_type',filter.doc_type);
    const {data,error}=await q;
    if(error){console.warn('getDocMaster:',error.message);return[];}
    return data||[];
  },
  async getDocMasterById(id){
    if(!_sb) return (window._docRows||[]).find(d=>d.id===id)||null;
    const {data,error}=await _sb.from('doc_master').select('*').eq('id',id).single();
    if(error) return null;
    return data;
  },
  async getDocVersions(docId){
    if(!_sb) return [];
    const {data,error}=await _sb.from('doc_versions').select('*').eq('doc_id',docId).order('ver',{ascending:false});
    if(error) return [];
    return data||[];
  },

  /* [v2.65 D1] SB 내부 이동 */
  async addDocMaster(row){
  if(!_sb)return{ok:false};
  var allowed={
    doc_no:row.doc_no||'', title:row.title||'',
    doc_type:row.doc_type||'procedure', category:row.category||null,
    tags:Array.isArray(row.tags)?row.tags:[],
    status:row.status||'draft', current_ver:row.current_ver||'v1.0',
    owner_id:row.owner_id||null, dept:row.dept||null,
    review_cycle:row.review_cycle||'annual',
    next_review_at:row.next_review_at||null,
    file_url:row.file_url||null,
    file_name:row.file_name||null
  };
  /* [v2.65 D1-2] select().single()으로 삽입된 id 반환 */
  var res=await _sb.from('doc_master').insert(allowed).select('id').single();
  if(res.error){Toast.show('문서 저장 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true, id:res.data?.id};
},

  /* [v2.65 D1] SB 내부 이동 */
  async updateDocMaster(id,patch){
  if(!_sb)return{ok:false};
  patch.updated_at=new Date().toISOString();
  var res=await _sb.from('doc_master').update(patch).eq('id',id);
  if(res.error){Toast.show('문서 수정 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
},

  /* [v2.65 D1] SB 내부 이동 */
  async addDocVersion(row){
  if(!_sb)return{ok:false,id:null};
  var allowed={
    doc_id:row.doc_id, ver_no:row.ver_no||'v1.0',
    file_url:row.file_url||null, file_name:row.file_name||null, file_size:row.file_size||null,
    change_summary:row.change_summary||'신규 등록', change_detail:row.change_detail||null,
    status:row.status||'draft', created_by:row.created_by||null
  };
  var res=await _sb.from('doc_versions').insert(allowed).select('id').single();
  if(res.error){Toast.show('버전 저장 실패: '+res.error.message,'err');return{ok:false,id:null};}
  return{ok:true,id:res.data?res.data.id:null};
},

  /* [v2.65 D1] SB 내부 이동 */
  async updateDocVersion(id,patch){
  if(!_sb)return{ok:false};
  var res=await _sb.from('doc_versions').update(patch).eq('id',id);
  if(res.error){Toast.show('버전 수정 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
},

  /* [v2.65 D1] SB 내부 이동 */
  async addDocApprovals(rows){
  if(!_sb||!rows.length)return{ok:false};
  var res=await _sb.from('doc_approvals').insert(rows);
  if(res.error){Toast.show('결재선 저장 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
},

  /* [v2.65 D1] deleteDocMaster SB 메서드 */
  /* [v2.65] 소프트 삭제 — RLS 우회 + 복구 가능 */
  async deleteDocMaster(id){
    if(!_sb){
      /* 로컬 모드: status='deleted' 마킹 */
      var d=(window._docRows||[]).find(function(x){return x.id===id;});
      if(d) d.status='deleted';
      return{ok:true};
    }
    var res=await _sb.from('doc_master').update({status:'deleted'}).eq('id',id);
    if(res.error){Toast.show('삭제 실패: '+res.error.message,'err');return{ok:false};}
    return{ok:true};
  },
  /* [v2.65] ── 교정 이력 ─────────────────────────────── */
  async getCal(){
    if(!_sb) return DB.cals;
    const data=await this._sbFetchAll('calibrations','id',true,q=>q.is('deleted_at',null));
    if(data===null) return DB.cals;
    DB.cals=data; return data;
  },
  /* [v2.65] ── MSA ────────────────────────────────────── */
  async getMsa(){
    if(!_sb) return DB.msa;
    const data=await this._sbFetchAll('msa_studies','id',true,q=>q.is('deleted_at',null));
    if(data===null) return DB.msa;
    DB.msa=data; return data;
  },
  async addMsa(row){
    if(!_sb){
      const id=Math.max(0,...DB.msa.map(m=>m.id))+1;
      DB.msa.push({id,...row}); return{ok:true,id};
    }
    const allowed={
      name:row.name||'',equip_code:row.equip_code||'',
      parts:row.parts||5,appraisers:row.appraisers||3,trials:row.trials||2,
      tolerance:row.tolerance||null,study_data:row.study_data||[],
      ev:row.ev||null,av:row.av||null,grr:row.grr||null,tv:row.tv||null,
      result:row.result||null,date:row.date||H.today(),note:row.note||''
    };
    const res=await _sb.from('msa_studies').insert(allowed).select('id').single();
    if(res.error){Toast.show('MSA 저장 실패: '+res.error.message,'err');return{ok:false};}
    return{ok:true,id:res.data?.id};
  },
  async deleteMsa(id){
    if(!_sb){DB.msa=DB.msa.filter(m=>m.id!==id);return{ok:true};}
    const res=await SB._softDelete('msa_studies',[id]);
    if(!res.ok) return{ok:false};
    DB.msa=DB.msa.filter(m=>m.id!==id); return{ok:true};
  },

  /* ── 검사 기준서 [v2.394] ── */
  async getInspStd(){
    if(!_sb) return [];
    /* [v2.94] deleted_at IS NULL 필터 + id 정렬 */
    const {data,error}=await _sb.from('insp_std').select('*').is('deleted_at',null).order('id');
    if(error){console.warn('[SB] insp_std 조회 실패:',error.message);return [];}
    console.log('[SB] insp_std 전체 '+(data?.length||0)+'건 로드');
    return data||[];
  },
  async addInspStd(row){
    if(!_sb){const id=Date.now();DB.insp_std=(DB.insp_std||[]);DB.insp_std.push({id,...row});return{ok:true,id};}
    /* [v2.91] 실제 컬럼: id,item_code,item_name,insp_type,insp_items,
       spec_upper,spec_lower,aql,sample_size,rev,effective_date,created_at,deleted_at */
    /* [v2.94] 실제 컬럼 전체 */
    const allowed={
      item_code:     row.item_code||'',
      item_name:     row.item_name||'',
      insp_type:     row.insp_type||'수입',
      insp_items:    row.insp_items||'[]',
      aql:           row.aql||null,
      insp_level:    row.insp_level||'II',
      sample_size:   row.sample_size||null,
      rev:           row.rev||'A',
      rev_date:      row.rev_date||null,
      effective_date:row.effective_date||null,
      created_by:    row.created_by||'',
      file_url:      row.file_url||null,
      file_name:     row.file_name||null,
    };
    const {error}=await _sb.from('insp_std').insert(allowed);
    if(error){Toast.show('기준서 저장 실패: '+error.message,'err');return{ok:false};}
    const fresh=await this.getInspStd();if(fresh) DB.insp_std=fresh;
    return{ok:true};
  },
  async updateInspStd(id,patch){
    if(!_sb){const r=DB.insp_std?.find(r=>r.id===id);if(r)Object.assign(r,patch);return{ok:true};}
    /* [v2.91] 실제 컬럼만 필터 */
    const allowed={};
    const cols=['item_code','item_name','insp_type','insp_items',
      'aql','insp_level','sample_size','rev','rev_date','effective_date',
      'created_by','file_url','file_name'];
    cols.forEach(k=>{ if(patch[k]!==undefined) allowed[k]=patch[k]; });
    const {error}=await _sb.from('insp_std').update(allowed).eq('id',id);
    if(error){Toast.show('기준서 수정 실패: '+error.message,'err');return{ok:false};}
    return{ok:true};
  },

  /* ── Hold 관리 SB 함수 [v2.394] ── */
  async getHolds(){
    if(!_sb) return DB.holds||[];
    const data=await this._sbFetchAll('holds','issued_date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] holds 조회 실패');return DB.holds||[];}
    return data;
  },
  async addHold(row){
    if(!_sb){const id=Date.now();DB.holds=(DB.holds||[]);DB.holds.unshift({id,...row});return{ok:true,id};}
    const allowed={
      hold_no:row.hold_no||'', lot_no:row.lot_no||'',
      item_code:row.item_code||'', item_name:row.item_name||'',
      qty:row.qty||null, reason:row.reason||'',
      issued_by:row.issued_by||'', issued_date:row.issued_date||null,
      status:row.status||'Hold중', ref_insp_no:row.ref_insp_no||'',
    };
    const {error}=await _sb.from('holds').insert(allowed);
    if(error){Toast.show('Hold 저장 실패: '+error.message,'err');return{ok:false};}
    const fresh=await this.getHolds();if(fresh) DB.holds=fresh;
    return{ok:true};
  },
  async updateHold(id,patch){
    if(!_sb){const r=(DB.holds||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);return{ok:true};}
    const {error}=await _sb.from('holds').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){Toast.show('Hold 수정 실패: '+error.message,'err');return{ok:false};}
    const r=(DB.holds||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);
    return{ok:true};
  },
  async deleteHold(id){
    if(!_sb){DB.holds=(DB.holds||[]).filter(r=>r.id!==id);return{ok:true};}
    const res=await SB._softDelete('holds',[id]);
    if(!res.ok) return{ok:false};
    DB.holds=(DB.holds||[]).filter(r=>r.id!==id);return{ok:true};
  },

  /* ── 재검사 관리 SB 함수 [v2.394] ── */
  async getReinspections(){
    if(!_sb) return DB.reinspections||[];
    const data=await this._sbFetchAll('reinspections','req_date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] reinspections 조회 실패');return DB.reinspections||[];}
    return data;
  },
  async addReinsp(row){
    if(!_sb){const id=Date.now();DB.reinspections=(DB.reinspections||[]);DB.reinspections.unshift({id,...row});return{ok:true,id};}
    const allowed={
      reinsp_no:row.reinsp_no||'', orig_no:row.orig_no||'',
      lot_no:row.lot_no||'', item_code:row.item_code||'',
      item_name:row.item_name||'', qty:row.qty||null,
      req_date:row.req_date||null, insp_date:row.insp_date||null,
      inspector:row.inspector||'', result:row.result||'',
      status:row.status||'요청', note:row.note||'',
      created_by:row.created_by||'',
    };
    const {error}=await _sb.from('reinspections').insert(allowed);
    if(error){Toast.show('재검사 저장 실패: '+error.message,'err');return{ok:false};}
    const fresh=await this.getReinspections();if(fresh) DB.reinspections=fresh;
    return{ok:true};
  },
  async updateReinsp(id,patch){
    if(!_sb){const r=(DB.reinspections||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);return{ok:true};}
    const {error}=await _sb.from('reinspections').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){Toast.show('재검사 수정 실패: '+error.message,'err');return{ok:false};}
    const r=(DB.reinspections||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);
    return{ok:true};
  },
  async deleteReinsp(id){
    if(!_sb){DB.reinspections=(DB.reinspections||[]).filter(r=>r.id!==id);return{ok:true};}
    const res=await SB._softDelete('reinspections',[id]);
    if(!res.ok) return{ok:false};
    DB.reinspections=(DB.reinspections||[]).filter(r=>r.id!==id);return{ok:true};
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
  users:[], /* [v2.394] 더미 삭제 — SB에서 로드 */
    inspections:[], /* [v2.394] 더미 제거 — SB에서 로드 */

  nc:[
    {id:1,no:'NC-20260430-001',type:'수입',item:'알루미늄 바',date:'2026-04-30',status:'처리중',desc:'치수 불량 - 직경 기준 초과',assignee:'김품질'},
    {id:2,no:'NC-20260425-001',type:'공정',item:'가공 브라켓',date:'2026-04-25',status:'접수',desc:'표면 스크래치 발생',assignee:'박생산'},
    {id:3,no:'NC-20260420-001',type:'출하',item:'완성 어셈블리',date:'2026-04-20',status:'완료',desc:'포장 불량',assignee:'김품질'},
  ],
  msa:[
    {id:1,name:'버니어캘리퍼스 R&R 연구',equip_code:'EQ-001',parts:5,appraisers:3,trials:2,
     tolerance:0.1,study_data:[],ev:8.5,av:9.2,grr:12.3,tv:15.1,result:'pass',date:'2026-05-01',note:''},
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
  /* [v2.394 Phase1] 계측기 변경이력 캐시 */
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

  /* ════════════════════════════════════
     공급업체 품질 SB 함수 [v2.394]
     ════════════════════════════════════ */

  /* 업체 평가 */
  async getVendorEvals(){
    if(!_sb) return DB.vendor_evals||[];
    const data=await this._sbFetchAll('vendor_evals','eval_date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] vendor_evals 실패');return DB.vendor_evals||[];}
    return data;
  },
  async addVendorEval(row){
    if(!_sb){const id=Date.now();if(!DB.vendor_evals)DB.vendor_evals=[];DB.vendor_evals.unshift({id,...row});return{ok:true,id};}
    const allowed={
      vendor_id:row.vendor_id||null, vendor_name:row.vendor_name||'',
      period:row.period||'', eval_date:row.eval_date||null,
      quality:Number(row.quality)||0, delivery:Number(row.delivery)||0,
      price:Number(row.price)||0, response:Number(row.response)||0,
      total:Number(row.total)||0, grade:row.grade||'',
      ppm:Number(row.ppm)||0, complaint:Number(row.complaint)||0,
      evaluator:row.evaluator||'', note:row.note||'',
    };
    const {error}=await _sb.from('vendor_evals').insert(allowed);
    if(error){Toast.show('평가 저장 실패: '+error.message,'err');return{ok:false};}
    const fresh=await this.getVendorEvals();if(fresh)DB.vendor_evals=fresh;
    return{ok:true};
  },
  async updateVendorEval(id,patch){
    if(!_sb){const r=(DB.vendor_evals||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);return{ok:true};}
    const {error}=await _sb.from('vendor_evals').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){Toast.show('평가 수정 실패: '+error.message,'err');return{ok:false};}
    return{ok:true};
  },
  async deleteVendorEval(id){
    if(!_sb){DB.vendor_evals=(DB.vendor_evals||[]).filter(r=>r.id!==id);return{ok:true};}
    const res=await SB._softDelete('vendor_evals',[id]);
    DB.vendor_evals=(DB.vendor_evals||[]).filter(r=>r.id!==id);
    return res;
  },

  /* 업체 심사 */
  async getVendorAudits(){
    if(!_sb) return DB.vendor_audits||[];
    const data=await this._sbFetchAll('vendor_audits','plan_date',false,q=>q.is('deleted_at',null));
    if(data===null){console.warn('[SB] vendor_audits 실패');return DB.vendor_audits||[];}
    return data;
  },
  async addVendorAudit(row){
    if(!_sb){const id=Date.now();if(!DB.vendor_audits)DB.vendor_audits=[];DB.vendor_audits.unshift({id,...row});return{ok:true,id};}
    const allowed={
      vendor_id:row.vendor_id||null, vendor_name:row.vendor_name||'',
      audit_type:row.audit_type||'정기', plan_date:row.plan_date||null,
      actual_date:row.actual_date||null, auditor:row.auditor||'',
      score:Number(row.score)||null, findings:row.findings||'',
      corrective_req:row.corrective_req||'', status:row.status||'계획',
      next_date:row.next_date||null, notify_sent:row.notify_sent||false,
      result_sent:row.result_sent||false,
    };
    const {error}=await _sb.from('vendor_audits').insert(allowed);
    if(error){Toast.show('심사 저장 실패: '+error.message,'err');return{ok:false};}
    const fresh=await this.getVendorAudits();if(fresh)DB.vendor_audits=fresh;
    return{ok:true};
  },
  async updateVendorAudit(id,patch){
    if(!_sb){const r=(DB.vendor_audits||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);return{ok:true};}
    const {error}=await _sb.from('vendor_audits').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){Toast.show('심사 수정 실패: '+error.message,'err');return{ok:false};}
    const r=(DB.vendor_audits||[]).find(r=>r.id===id);if(r)Object.assign(r,patch);
    return{ok:true};
  },
  async deleteVendorAudit(id){
    if(!_sb){DB.vendor_audits=(DB.vendor_audits||[]).filter(r=>r.id!==id);return{ok:true};}
    const res=await SB._softDelete('vendor_audits',[id]);
    DB.vendor_audits=(DB.vendor_audits||[]).filter(r=>r.id!==id);
    return res;
  },

  /* ── LOT 추적 [v2.394] ── */
  async getLotTrace(lot_no){
    if(!_sb||!lot_no) return{inspections:[],nc:[],equip:[]};
    const q=lot_no.toLowerCase();
    const [insp,nc]=await Promise.all([
      _sb.from('inspections').select('*').ilike('lot_no','%'+lot_no+'%').order('insp_date',{ascending:false}).limit(100),
      _sb.from('nonconformances').select('*').ilike('item_code','%'+lot_no+'%').order('date',{ascending:false}).limit(50),
    ]);
    return{
      inspections:(insp.data||[]),
      nc:(nc.data||[]),
    };
  },
  /* [v2.394] 검사고도화 로컬 초기값 */
  holds:[],
  reinspections:[]

};

/* ══ 헬퍼 ══ *//* ══ 토스트 ══ */

/* ════════════════════════════════════════════════════════════
   문서관리 고도화 SB 함수 [v2.395 신규 — 2026-06-01]
   테이블: doc_master / doc_versions / doc_approvals / doc_dist_log
   ════════════════════════════════════════════════════════════ */

/* ── doc_master ── */
SB.getDocMaster=async function(filters){
  filters=filters||{};
  if(!_sb)return[];
  try{
    var q=_sb.from('doc_master').select('*').order('created_at',{ascending:false});
    if(filters.status)   q=q.eq('status',filters.status);
    if(filters.doc_type) q=q.eq('doc_type',filters.doc_type);
    if(filters.keyword)  q=q.ilike('title','%'+filters.keyword+'%');
    var res=await q;
    if(res.error) throw res.error;
    return res.data||[];
  }catch(e){console.warn('[SB] getDocMaster:',e.message);return[];}
};
SB.getDocMasterById=async function(id){
  if(!_sb)return null;
  var res=await _sb.from('doc_master').select('*').eq('id',id).single();
  if(res.error){console.warn('[SB] getDocMasterById:',res.error.message);return null;}
  return res.data;
};;
SB.updateDocMaster=async function(id,patch){
  if(!_sb)return{ok:false};
  patch.updated_at=new Date().toISOString();
  var res=await _sb.from('doc_master').update(patch).eq('id',id);
  if(res.error){Toast.show('문서 수정 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
};;

/**
 * [v2.396.1 신규] 검토 만료 임박 문서 조회
 * @param {number} days - 오늘로부터 N일 이내 만료 문서 (기본 30)
 * @returns {Array} next_review_at ≤ (오늘+days) 인 active 문서 배열 (오름차순)
 *
 * [활용]
 *  - D1 문서목록 만료 강조 (클라이언트 _dDay()와 병행)
 *  - Phase 2 D6 검토주기 알림: 만료 D-30/D-7 멘션함 자동 발송 시 사용
 */
SB.getExpiringDocs=async function(days){
  days=days||30;
  if(!_sb)return[];
  try{
    var target=new Date();
    target.setDate(target.getDate()+days);
    var targetStr=target.toISOString().split('T')[0]; // YYYY-MM-DD
    var res=await _sb.from('doc_master')
      .select('*')
      .eq('status','active')
      .lte('next_review_at',targetStr)
      .order('next_review_at',{ascending:true});
    if(res.error){console.warn('[SB] getExpiringDocs:',res.error.message);return[];}
    return res.data||[];
  }catch(e){console.warn('[SB] getExpiringDocs:',e.message);return[];}
};

/* ── doc_versions ── */
SB.getDocVersions=async function(docId){
  if(!_sb)return[];
  var res=await _sb.from('doc_versions')
    .select('*')
    .eq('doc_id',docId).order('created_at',{ascending:false});
  if(res.error){console.warn('[SB] getDocVersions:',res.error.message);return[];}
  return res.data||[];
};
SB.addDocVersion=async function(row){
  if(!_sb)return{ok:false,id:null};
  var allowed={
    doc_id:row.doc_id, ver_no:row.ver_no||'v1.0',
    file_url:row.file_url||null, file_name:row.file_name||null, file_size:row.file_size||null,
    change_summary:row.change_summary||'신규 등록', change_detail:row.change_detail||null,
    status:row.status||'draft', created_by:row.created_by||null
  };
  var res=await _sb.from('doc_versions').insert(allowed).select('id').single();
  if(res.error){Toast.show('버전 저장 실패: '+res.error.message,'err');return{ok:false,id:null};}
  return{ok:true,id:res.data?res.data.id:null};
};
SB.updateDocVersion=async function(id,patch){
  if(!_sb)return{ok:false};
  var res=await _sb.from('doc_versions').update(patch).eq('id',id);
  if(res.error){Toast.show('버전 수정 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
};
/* 버전 활성화: 기존 active→obsolete, 대상→active, doc_master 갱신 */
SB.activateDocVersion=async function(docId,verId,verNo,approverId){
  if(!_sb)return{ok:false};
  var now=new Date().toISOString();
  await _sb.from('doc_versions').update({status:'obsolete'}).eq('doc_id',docId).eq('status','active');
  var r=await _sb.from('doc_versions')
    .update({status:'active',approved_by:approverId,approved_at:now,published_at:now}).eq('id',verId);
  if(r.error){Toast.show('활성화 실패: '+r.error.message,'err');return{ok:false};}
  await _sb.from('doc_master').update({status:'active',current_ver:verNo,updated_at:now}).eq('id',docId);
  return{ok:true};
};

/* ── doc_approvals ── */
SB.getDocApprovals=async function(docVerId){
  if(!_sb)return[];
  var res=await _sb.from('doc_approvals')
    .select('*')  /* [v2.84] approver_id 외래키 없음 → JOIN 제거 */
    .eq('doc_ver_id',docVerId).order('step_order',{ascending:true});
  return res.error?[]:(res.data||[]);
};
SB.getMyPendingApprovals=async function(userId){
  if(!_sb)return[];
  /* doc_ver_id → doc_versions, doc_id → doc_master 중첩 조인 */
  var res=await _sb.from('doc_approvals')
    .select('*, doc_ver:doc_ver_id(id,ver_no,change_summary,doc_id,doc_master:doc_id(title))')
    .eq('approver_id',userId).eq('action','pending')
    .order('created_at',{ascending:false});
  if(res.error){console.warn('[SB] getMyPendingApprovals:',res.error.message);return[];}
  return res.data||[];
};
SB.addDocApprovals=async function(rows){
  if(!_sb||!rows.length)return{ok:false};
  var res=await _sb.from('doc_approvals').insert(rows);
  if(res.error){Toast.show('결재선 저장 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
};
SB.processApproval=async function(approvalId,action,comment){
  if(!_sb)return{ok:false};
  var res=await _sb.from('doc_approvals')
    .update({action:action,comment:comment||null,signed_at:new Date().toISOString()})
    .eq('id',approvalId);
  if(res.error){Toast.show('결재 처리 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
};

/* ── doc_dist_log (INSERT ONLY) ── */
SB.addDistLog=async function(row){
  if(!_sb)return;
  var res=await _sb.from('doc_dist_log').insert({
    doc_id:row.doc_id, doc_ver_id:row.doc_ver_id||null,
    user_id:row.user_id||null, action:row.action||'view',
    dept:row.dept||null, created_at:new Date().toISOString()
  });
  if(res.error) console.warn('[SB] distLog:',res.error.message);
};
SB.getDistLog=async function(docId,limit){
  limit=limit||50;
  if(!_sb)return[];
  var res=await _sb.from('doc_dist_log')
    .select('*, user:user_id(id,name,dept)')
    .eq('doc_id',docId).order('created_at',{ascending:false}).limit(limit);
  return res.error?[]:(res.data||[]);
};

/* ════════════════════════════════════════════════════════════
   Phase 2 SB 함수 [v2.397.2 신규 — 2026-06-01]
   D5: 배포 관리 / D6: 검토 주기 알림
   ════════════════════════════════════════════════════════════ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   D5: 배포 관리 — doc_dist_log 확장
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * [v2.397.2] 외부 공유 링크 토큰 발급
 * @param {number} docId     - doc_master.id
 * @param {number} docVerId  - doc_versions.id
 * @param {number} hours     - 링크 유효 시간 (기본 72시간)
 * @returns {{ok:boolean, token:string, expiresAt:string}}
 *
 * [구조] doc_dist_log 에 action='share' 로 INSERT
 *        share_token = 무작위 32자리 hex 문자열
 *        expires_at  = 발급 시각 + hours
 */
SB.createShareToken=async function(docId,docVerId,hours){
  hours=hours||72;
  if(!_sb)return{ok:false,token:null,expiresAt:null};
  try{
    /* 32자리 랜덤 토큰 생성 */
    var arr=new Uint8Array(16);
    crypto.getRandomValues(arr);
    var token=Array.from(arr).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    var expiresAt=new Date(Date.now()+hours*3600000).toISOString();
    var res=await _sb.from('doc_dist_log').insert({
      doc_id:docId,
      doc_ver_id:docVerId||null,
      action:'share',
      share_token:token,
      expires_at:expiresAt,
      created_at:new Date().toISOString(),
    });
    if(res.error){
      console.warn('[SB] createShareToken:',res.error.message);
      return{ok:false,token:null,expiresAt:null};
    }
    return{ok:true,token:token,expiresAt:expiresAt};
  }catch(e){
    console.warn('[SB] createShareToken:',e.message);
    return{ok:false,token:null,expiresAt:null};
  }
};

/**
 * [v2.397.2] 특정 문서의 배포/열람 로그 조회 (기존 getDistLog 확장 래퍼)
 * @param {number} docId  - doc_master.id
 * @param {string} action - 'all'|'view'|'download'|'share' (기본 'all')
 * @param {number} limit  - 최대 건수 (기본 100)
 */
SB.getDocDistLog=async function(docId,action,limit){
  action=action||'all'; limit=limit||100;
  if(!_sb)return[];
  try{
    var q=_sb.from('doc_dist_log')
      .select('*, user:user_id(id,name,dept)')
      .eq('doc_id',docId)
      .order('created_at',{ascending:false})
      .limit(limit);
    if(action!=='all') q=q.eq('action',action);
    var res=await q;
    if(res.error){console.warn('[SB] getDocDistLog:',res.error.message);return[];}
    return res.data||[];
  }catch(e){return[];}
};

/**
 * [v2.397.2] 전체 배포 로그 집계 — 대시보드용
 * @param {string} since - ISO 날짜 문자열 (기본: 30일 전)
 * @returns {{byAction:{}, byDoc:[], total:number}}
 */
SB.getDistLogSummary=async function(since){
  if(!_sb)return{byAction:{},byDoc:[],total:0};
  try{
    var sinceDate=since||(new Date(Date.now()-30*86400000).toISOString());
    var res=await _sb.from('doc_dist_log')
      .select('action, doc_id, doc_master:doc_id(doc_no,title)')
      .gte('created_at',sinceDate)
      .order('created_at',{ascending:false})
      .limit(500);
    if(res.error)return{byAction:{},byDoc:[],total:0};
    var rows=res.data||[];
    var byAction={};
    var byDocMap={};
    rows.forEach(function(r){
      byAction[r.action]=(byAction[r.action]||0)+1;
      var key=r.doc_id;
      if(!byDocMap[key]){
        byDocMap[key]={
          doc_id:r.doc_id,
          doc_no:r.doc_master&&r.doc_master.doc_no||'-',
          title:r.doc_master&&r.doc_master.title||'-',
          count:0
        };
      }
      byDocMap[key].count++;
    });
    var byDoc=Object.values(byDocMap).sort(function(a,b){return b.count-a.count;}).slice(0,10);
    return{byAction:byAction,byDoc:byDoc,total:rows.length};
  }catch(e){return{byAction:{},byDoc:[],total:0};}
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   D6: 검토 주기 관리 — doc_master 연장
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * [v2.397.2] 검토 주기 일괄 업데이트
 * @param {number[]} ids          - doc_master.id 배열
 * @param {string}   review_cycle - 'monthly'|'quarterly'|'biannual'|'annual'
 * @returns {{ok:boolean, updated:number}}
 */
SB.bulkUpdateReviewCycle=async function(ids,review_cycle){
  if(!_sb||!ids.length)return{ok:false,updated:0};
  try{
    var res=await _sb.from('doc_master')
      .update({review_cycle:review_cycle,updated_at:new Date().toISOString()})
      .in('id',ids);
    if(res.error){
      Toast.show('검토 주기 변경 실패: '+res.error.message,'err');
      return{ok:false,updated:0};
    }
    return{ok:true,updated:ids.length};
  }catch(e){return{ok:false,updated:0};}
};

/**
 * [v2.397.2] 다음 검토일 개별 업데이트
 * @param {number} docId          - doc_master.id
 * @param {string} next_review_at - YYYY-MM-DD
 */
SB.updateNextReviewDate=async function(docId,next_review_at){
  if(!_sb)return{ok:false};
  var res=await _sb.from('doc_master')
    .update({next_review_at:next_review_at,updated_at:new Date().toISOString()})
    .eq('id',docId);
  if(res.error){Toast.show('검토일 변경 실패: '+res.error.message,'err');return{ok:false};}
  return{ok:true};
};

/**
 * [v2.397.2] 검토 완료 처리 — 다음 검토일 자동 계산 후 갱신
 * @param {number} docId - doc_master.id
 * @param {string} cycle - review_cycle 값 (없으면 doc_master에서 조회)
 *
 * [계산 규칙]
 *  monthly   : +1개월
 *  quarterly : +3개월
 *  biannual  : +6개월
 *  annual    : +12개월 (기본)
 */
SB.completeReview=async function(docId,cycle){
  if(!_sb)return{ok:false};
  try{
    var doc=await SB.getDocMasterById(docId);
    if(!doc)return{ok:false};
    var reviewCycle=cycle||doc.review_cycle||'annual';
    var monthMap={monthly:1,quarterly:3,biannual:6,annual:12};
    var addMonths=monthMap[reviewCycle]||12;
    var base=doc.next_review_at?new Date(doc.next_review_at):new Date();
    base.setMonth(base.getMonth()+addMonths);
    var nextDate=base.toISOString().split('T')[0];
    var res=await _sb.from('doc_master')
      .update({next_review_at:nextDate,updated_at:new Date().toISOString()})
      .eq('id',docId);
    if(res.error){Toast.show('검토 완료 처리 실패: '+res.error.message,'err');return{ok:false};}
    return{ok:true,nextDate:nextDate};
  }catch(e){return{ok:false};}
};

/**
 * [v2.397.2] 만료 임박 문서 일괄 멘션 알림 발송
 * @param {number} days - 몇 일 이내 만료 문서에 알림 (7 또는 30)
 * @returns {{ok:boolean, sent:number}} — 발송 건수
 *
 * [동작]
 *  1. getExpiringDocs(days)로 만료 임박 문서 조회
 *  2. 각 문서 owner_id → 멘션함에 알림 발송
 *  3. 발송 건수 반환
 *
 * [호출 시점]
 *  - 앱 로그인 시 자동 1회 호출 (qms-init.js)
 *  - D6 검토주기 화면에서 "알림 발송" 버튼 수동 호출
 */
SB.sendReviewAlerts=async function(days){
  days=days||30;
  var docs=await SB.getExpiringDocs(days);
  if(!docs.length)return{ok:true,sent:0};
  var sent=0;
  var cur=typeof Auth!=='undefined'&&Auth._u?Auth._u.username||Auth._u.name||'시스템':'시스템';
  for(var i=0;i<docs.length;i++){
    var doc=docs[i];
    if(!doc.owner_id)continue;
    var d=Math.ceil((new Date(doc.next_review_at)-new Date())/86400000);
    var label=d<=0?'만료됨':('D-'+d);
    try{
      await SB.addMention({
        from:cur,
        to:String(doc.owner_id),
        text:'[검토 주기 알림] '+doc.doc_no+' '+doc.title+
             ' 검토일: '+doc.next_review_at+' ('+label+')\n'+
             '문서 검토 후 \'검토 완료\' 처리해 주세요.',
        ref:'doc_review_cycle',
        read:false,
      });
      sent++;
    }catch(e){console.warn('[SB] sendReviewAlerts 멘션 실패:',e.message);}
  }
  return{ok:true,sent:sent};
};

/* ════════════════════════════════════════════════════════════
   공지사항 SB 함수 [v2.65 신규]
   테이블: notices (id, title, body, author, date, expire, show, file_url, file_name, created_at)
   ════════════════════════════════════════════════════════════ */

/**
 * [v2.65] 공지사항 전체 조회
 * @returns {Array} created_at 내림차순 (최신순)
 *
 * [문제 배경] 기존 App.notices는 qms-core.js 하드코딩 배열
 *            → push()로 메모리에만 저장 → 새로고침/배포 시 초기화
 * [수정] Supabase notices 테이블에 영속화
 *        로컬 폴백: _sb 없으면 App.notices 사용 (더미 환경 호환)
 */
SB.getNotices = async function() {
  if (!_sb) return App.notices || [];
  try {
    var res = await _sb.from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (res.error) { console.warn('[SB] getNotices:', res.error.message); return App.notices || []; }
    return res.data || [];
  } catch(e) { console.warn('[SB] getNotices:', e.message); return App.notices || []; }
};

/**
 * [v2.65] 공지사항 등록
 * @param {object} row - { title, body, author, date, expire, show, file_url, file_name }
 */
SB.addNotice = async function(row) {
  if (!_sb) {
    row.id = Date.now();
    row.created_at = new Date().toISOString();
    App.notices.unshift(row);  // 맨 앞에 삽입 (최신순)
    return { ok: true };
  }
  try {
    var allowed = {
      title:     row.title || '',
      body:      row.body  || '',
      author:    row.author || '관리자',
      date:      row.date  || null,
      expire:    row.expire || null,
      show:      row.show  !== undefined ? row.show : true,
      file_url:  row.file_url  || null,
      file_name: row.file_name || null,
    };
    var res = await _sb.from('notices').insert(allowed);
    if (res.error) { Toast.show('공지 저장 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { Toast.show('공지 저장 실패: ' + e.message, 'err'); return { ok: false }; }
};

/**
 * [v2.65] 공지사항 수정
 * @param {number} id  - notices.id
 * @param {object} patch - 변경할 필드
 */
SB.updateNotice = async function(id, patch) {
  if (!_sb) {
    var idx = (App.notices || []).findIndex(function(n) { return n.id === id; });
    if (idx >= 0) Object.assign(App.notices[idx], patch);
    return { ok: true };
  }
  try {
    var res = await _sb.from('notices').update(patch).eq('id', id);
    if (res.error) { Toast.show('공지 수정 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/**
 * [v2.65] 공지사항 삭제
 * @param {number} id - notices.id
 */
SB.deleteNotice = async function(id) {
  if (!_sb) {
    App.notices = (App.notices || []).filter(function(n) { return n.id !== id; });
    return { ok: true };
  }
  try {
    var res = await _sb.from('notices').delete().eq('id', id);
    if (res.error) { Toast.show('공지 삭제 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/* ════════════════════════════════════════════════════════════
   Q&A SB 함수 [v2.65 신규]
   테이블: qna + qna_replies
   ════════════════════════════════════════════════════════════ */

/**
 * [v2.65] Q&A 목록 조회
 * @param {object} filter - { category, menu_ref, status }
 * @returns {Array} created_at 내림차순, 고정글 상단
 */
SB.getQna = async function(filter) {
  filter = filter || {};
  if (!_sb) return [];
  try {
    var q = _sb.from('qna')
      .select('*, replies:qna_replies(count)')
      .order('is_pinned', { ascending: false })
      .order('created_at',  { ascending: false });
    if (filter.category) q = q.eq('category', filter.category);
    if (filter.menu_ref)  q = q.eq('menu_ref',  filter.menu_ref);
    if (filter.status)    q = q.eq('status',     filter.status);
    var res = await q;
    if (res.error) { console.warn('[SB] getQna:', res.error.message); return []; }
    return res.data || [];
  } catch(e) { console.warn('[SB] getQna:', e.message); return []; }
};

/**
 * [v2.65] Q&A 단건 조회 (답변 포함)
 * @param {number} id
 */
SB.getQnaById = async function(id) {
  if (!_sb) return null;
  try {
    var res = await _sb.from('qna')
      .select('*, replies:qna_replies(*)')
      .eq('id', id)
      .single();
    if (res.error) return null;
    /* 조회수 증가 */
    _sb.from('qna').update({ view_count: (res.data.view_count||0)+1 }).eq('id', id).then(()=>{});
    return res.data;
  } catch(e) { return null; }
};

/** [v2.65] Q&A 등록 */
SB.addQna = async function(row) {
  if (!_sb) return { ok: false };
  try {
    var res = await _sb.from('qna').insert({
      category:  row.category  || 'qna',
      menu_ref:  row.menu_ref  || null,
      title:     row.title     || '',
      body:      row.body      || '',
      author:    row.author    || '관리자',
      status:    row.status    || 'open',
      is_pinned: row.is_pinned || false,
      file_url:  row.file_url  || null,
      file_name: row.file_name || null,
    });
    if (res.error) { Toast.show('Q&A 저장 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/** [v2.65] Q&A 수정 */
SB.updateQna = async function(id, patch) {
  if (!_sb) return { ok: false };
  try {
    patch.updated_at = new Date().toISOString();
    var res = await _sb.from('qna').update(patch).eq('id', id);
    if (res.error) { Toast.show('Q&A 수정 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/** [v2.65] Q&A 삭제 */
SB.deleteQna = async function(id) {
  if (!_sb) return { ok: false };
  try {
    var res = await _sb.from('qna').delete().eq('id', id);
    if (res.error) { Toast.show('Q&A 삭제 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/** [v2.65] 답변 등록 */
SB.addQnaReply = async function(qna_id, body, author, is_answer) {
  if (!_sb) return { ok: false };
  try {
    var res = await _sb.from('qna_replies').insert({
      qna_id:    qna_id,
      body:      body || '',
      author:    author || '관리자',
      is_answer: is_answer || false,
    });
    if (res.error) { Toast.show('답변 저장 실패: ' + res.error.message, 'err'); return { ok: false }; }
    /* 상태 자동 변경: 공식 답변이면 resolved */
    if (is_answer) await SB.updateQna(qna_id, { status: 'resolved' });
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/** [v2.65] 답변 삭제 */
SB.deleteQnaReply = async function(id) {
  if (!_sb) return { ok: false };
  try {
    var res = await _sb.from('qna_replies').delete().eq('id', id);
    if (res.error) { Toast.show('답변 삭제 실패: ' + res.error.message, 'err'); return { ok: false }; }
    return { ok: true };
  } catch(e) { return { ok: false }; }
};

/* ════════════════════════════════════════════════════════════
   제조설비관리 (EMS) SB 함수 [v2.65]
   테이블: equipment / eq_pm_log / eq_as / eq_cost / eq_manual / eq_oee
   ════════════════════════════════════════════════════════════ */

/* 설비 마스터 */
SB.getEquipment = async function(filter) {
  if (!_sb) return [];
  try {
    var q = _sb.from('ems_equipment').select('*').order('eq_no', {ascending:true});
    if (filter && filter.dept) q = q.eq('dept', filter.dept);
    var res = await q;
    if (res.error) { console.warn('[SB] getEquipment:', res.error.message); return []; }
    return res.data || [];
  } catch(e) { console.warn('[SB] getEquipment:', e.message); return []; }
};
SB.addEquipment = async function(row) {
  if (!_sb) return { ok: false };
  try {
    /* [v2.65] eq_no 자동생성 */
    if (!row.eq_no) {
      var year = new Date().getFullYear();
      var existing = await SB.getEquipment();
      var yearSeq = existing.filter(function(e){ return (e.eq_no||'').startsWith('EQ-'+year); }).length + 1;
      row.eq_no = 'EQ-' + year + '-' + String(yearSeq).padStart(3,'0');
    }
    /* [v2.65] 타입 정제 — 빈 문자열·undefined → null, numeric 컬럼 변환
       Supabase PostgREST는 빈 문자열('')을 numeric에 insert하면
       "schema cache" 오류를 발생시킴 */
    var NUMERIC_COLS = ['cost','lifespan'];
    var clean = {};
    Object.keys(row).forEach(function(k) {
      var v = row[k];
      /* 빈 문자열 → null */
      if (v === '' || v === undefined) { clean[k] = null; return; }
      /* numeric 컬럼 — 문자열이면 숫자로 변환, 변환 실패 시 null */
      if (NUMERIC_COLS.includes(k)) {
        var n = parseFloat(v);
        clean[k] = isNaN(n) ? null : n;
        return;
      }
      clean[k] = v;
    });
    var res = await _sb.from('ems_equipment').insert(clean);
    if (res.error) { Toast.show('설비 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { Toast.show('설비 저장 오류: '+e.message,'err'); return { ok:false }; }
};
SB.updateEquipment = async function(id, patch) {
  if (!_sb) return { ok:false };
  try {
    patch.updated_at = new Date().toISOString();
    /* [v2.65] 빈 문자열 → null 정제 */
    var NUMERIC_COLS = ['cost','lifespan'];
    var clean = {};
    Object.keys(patch).forEach(function(k) {
      var v = patch[k];
      if (v === '' || v === undefined) { clean[k] = null; return; }
      if (NUMERIC_COLS.includes(k)) {
        var n = parseFloat(v);
        clean[k] = isNaN(n) ? null : n;
        return;
      }
      clean[k] = v;
    });
    var res = await _sb.from('ems_equipment').update(clean).eq('id', id);
    if (res.error) { Toast.show('설비 수정 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEquipment = async function(id) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('ems_equipment').delete().eq('id', id);
    if (res.error) { Toast.show('설비 삭제 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};

/* PM 점검 이력 */
SB.getEqPmLogs = async function(eq_id) {
  if (!_sb) return [];
  try {
    var q = _sb.from('eq_pm_log').select('*').order('check_date', {ascending:false});
    if (eq_id) q = q.eq('eq_id', eq_id);
    var res = await q;
    return res.data || [];
  } catch(e) { return []; }
};
SB.addEqPmLog = async function(row) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_pm_log').insert(row);
    if (res.error) { Toast.show('PM 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.updateEqPmLog = async function(id, patch) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_pm_log').update(patch).eq('id', id);
    if (res.error) { Toast.show('PM 수정 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEqPmLog = async function(id) {
  if (!_sb) return { ok:false };
  try { await _sb.from('eq_pm_log').delete().eq('id', id); return { ok:true }; }
  catch(e) { return { ok:false }; }
};

/* AS/고장 관리 */
SB.getEqAs = async function(eq_id) {
  if (!_sb) return [];
  try {
    var q = _sb.from('eq_as').select('*').order('created_at', {ascending:false});
    if (eq_id) q = q.eq('eq_id', eq_id);
    var res = await q;
    return res.data || [];
  } catch(e) { return []; }
};
SB.addEqAs = async function(row) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_as').insert(row);
    if (res.error) { Toast.show('AS 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.updateEqAs = async function(id, patch) {
  if (!_sb) return { ok:false };
  try {
    patch.updated_at = new Date().toISOString();
    var res = await _sb.from('eq_as').update(patch).eq('id', id);
    if (res.error) { Toast.show('AS 수정 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEqAs = async function(id) {
  if (!_sb) return { ok:false };
  try { await _sb.from('eq_as').delete().eq('id', id); return { ok:true }; }
  catch(e) { return { ok:false }; }
};

/* 유지보수 비용 */
SB.getEqCost = async function(ym) {
  if (!_sb) return [];
  try {
    var q = _sb.from('eq_cost').select('*').order('date', {ascending:false});
    if (ym) { q = q.gte('date', ym+'-01').lte('date', ym+'-31'); }
    var res = await q;
    return res.data || [];
  } catch(e) { return []; }
};
SB.addEqCost = async function(row) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_cost').insert(row);
    if (res.error) { Toast.show('비용 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEqCost = async function(id) {
  if (!_sb) return { ok:false };
  try { await _sb.from('eq_cost').delete().eq('id', id); return { ok:true }; }
  catch(e) { return { ok:false }; }
};

/* 설비 매뉴얼 */
SB.getEqManuals = async function(eq_id) {
  if (!_sb) return [];
  try {
    var q = _sb.from('eq_manual').select('*').order('created_at', {ascending:false});
    if (eq_id) q = q.eq('eq_id', eq_id);
    var res = await q;
    return res.data || [];
  } catch(e) { return []; }
};
SB.addEqManual = async function(row) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_manual').insert(row);
    if (res.error) { Toast.show('매뉴얼 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEqManual = async function(id) {
  if (!_sb) return { ok:false };
  try { await _sb.from('eq_manual').delete().eq('id', id); return { ok:true }; }
  catch(e) { return { ok:false }; }
};

/* OEE 일보 */
SB.getEqOee = async function(eq_id) {
  if (!_sb) return [];
  try {
    var q = _sb.from('eq_oee').select('*').order('date', {ascending:false}).limit(60);
    if (eq_id) q = q.eq('eq_id', eq_id);
    var res = await q;
    return res.data || [];
  } catch(e) { return []; }
};
SB.addEqOee = async function(row) {
  if (!_sb) return { ok:false };
  try {
    var res = await _sb.from('eq_oee').insert(row);
    if (res.error) { Toast.show('OEE 저장 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
SB.deleteEqOee = async function(id) {
  if (!_sb) return { ok:false };
  try { await _sb.from('eq_oee').delete().eq('id', id); return { ok:true }; }
  catch(e) { return { ok:false }; }
};

/* [v2.65] SB.updateEqCost — 비용 수정 */
SB.updateEqCost = async function(id, patch) {
  if (!_sb) return { ok: false };
  try {
    var res = await _sb.from('eq_cost').update(patch).eq('id', id);
    if (res.error) { Toast.show('비용 수정 실패: '+res.error.message,'err'); return { ok:false }; }
    return { ok:true };
  } catch(e) { return { ok:false }; }
};
