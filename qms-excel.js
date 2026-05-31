/* qms-excel.js — ExcelMgr + SearchPop [v2.386] */
"use strict";


/* SQL 복사 헬퍼 */
Pages._copySql=function(){
  var e=document.getElementById('sqlBox');
  if(e) navigator.clipboard.writeText(e.textContent).then(function(){Toast.show('복사됨!','ok');});
};
/* [v2.386] settings 공지/로고 — Cfg에 실제 구현, Pages에서 위임 */
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
  /* [v2.386] 공지 파일 미리보기 */
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
  /* [v2.386] 첨부파일 삭제 */
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
    /* [v2.386] 파일 처리 */
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
      /* [v2.386] 품목코드만 중복 확인, 필수값 외 빈칸 허용 */
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
      /* [v2.386] 거래처명만 중복 확인, 필수값 외 빈칸 허용 */
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
      /* [v2.386] 품목코드+거래처명 없으면 등록 안 됨, 동일시트 중복 허용 */
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
      /* [v2.386] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.386] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.386] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.386] 품목코드+거래처명 필수, 동일시트 중복 허용 */
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
      /* [v2.386] 엑셀 업로드 컬럼 — 사내외/품목코드/고객 유형 추가 */
      cols:[
        {key:'no',        label:'부적합번호', req:true,  sample:'NC-20260601-001'},
        {key:'in_out',    label:'사내외',     req:true,  sample:'사내'},
        {key:'type',      label:'유형',       req:true,  sample:'수입'},
        {key:'item_code', label:'품목코드',   req:false, sample:'ITM-001'},
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
    /* [v2.386] 계측기 업로드 양식 — 처음부터 새로 작성, 캐시 무효화 */
    equip:{
      title:'계측기_업로드양식',
      cols:[
        {key:'code',     label:'A_계측기코드',  req:true,  sample:'EQ-001',              note:'필수'},
        {key:'name',     label:'B_계측기명',    req:true,  sample:'디지털버니어캘리퍼스',  note:'필수'},
        {key:'model',    label:'C_모델번호',    req:false, sample:'CD-20APX'},
        {key:'maker',    label:'D_제조사',      req:false, sample:'미쓰토요'},
        {key:'range',    label:'E_측정범위',    req:false, sample:'0~200mm'},
        {key:'res',      label:'F_분해능',      req:false, sample:'0.01mm'},
        {key:'loc',      label:'G_보관위치',    req:false, sample:'품질실'},
        {key:'operator', label:'H_사용자',      req:false, sample:'홍길동'},
        {key:'last',     label:'I_최근교정일',  req:false, sample:'2026-01-01',           note:'YYYY-MM-DD'},
        {key:'next',     label:'J_차기교정일',  req:false, sample:'2026-07-01',           note:'날짜만입력'},
        {key:'active',   label:'K_사용여부',    req:false, sample:'사용',                 note:'사용/불용'},
      ],
      dupKey:'code', dupLabel:'A_계측기코드', getData:()=>DB.equip,
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
  
    /* [v2.386] 검사 기준서 스키마 */
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
    },
    /* [v2.386] 검사 성적서 스키마 */
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
    /* [v2.386] Hold 관리 스키마 */
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
    /* [v2.386] 재검사 관리 스키마 */
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
    /* [v2.386] sqm 엑셀 업로드 스키마 */
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
  },

  /* ── 양식 내려받기 ── */
  /* [v2.386] 파일명 생성 공통 함수 — 중복 로직 제거 */
  _fileName(title,suffix=''){
    /* [v2.386] 파일명: qms_제목_YYYY-MM-DD.xlsx */
    const n=new Date();
    const ts=n.getFullYear()+'-'
      +String(n.getMonth()+1).padStart(2,'0')+'-'
      +String(n.getDate()).padStart(2,'0');
    /* 한글 제목 매핑 — 기존 업로드 파일과 호환 */
    const MAP={부적합관리:'부적합관리',nonconformances:'부적합관리'};
    const t=MAP[title]||title;
    return `qms_${t}${suffix?'_'+suffix:''}_${ts}.xlsx`;
  },

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
    XLSX.writeFile(wb,this._fileName(sc.title));
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
        this._ws=ws; /* [v2.386] ws 저장 — 날짜 변환에 사용 */
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        /* [v2.386] 날짜 필드 변환 — 엑셀 시리얼/Date객체 → YYYY-MM-DD */
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
       [v2.386 버그수정] 인덱스 기반 → 헤더 레이블 기반 파싱
       이전: sc.cols[i] 순서에 맞춰 i번째 셀 매핑 → 엑셀 열 순서가 다르면 오매핑
       수정: 엑셀 헤더 레이블로 key 찾아 매핑 → 열 순서 무관 */
    const headerRow = raw[0].map(h=>String(h||'').replace(/\s*\*\s*$/,'').trim()); // 필수(*) 표시 제거
    // 헤더→key 역매핑 테이블
    const labelToKey={};
    sc.cols.forEach(c=>{labelToKey[c.label]=c.key;});
    /* [v2.386] equip 전용 한글 별칭 매핑 (다른 schema와 충돌 방지) */
    if(page==='equip'){
      /* [v2.386] A_/B_/C_ 접두사 포함 매핑 + 기존 한글 그대로도 지원 */
      const equipAlias={
        'A_계측기코드':'code','계측기코드':'code','코드':'code',
        'B_계측기명':'name','계측기명':'name','기기명':'name',
        'C_모델번호':'model','모델번호':'model','모델':'model','형번':'model',
        'D_제조사':'maker','제조사':'maker','메이커':'maker',
        'E_측정범위':'range','측정범위':'range','범위':'range',
        'F_분해능':'res','분해능':'res','해상도':'res',
        'G_보관위치':'loc','보관위치':'loc','위치':'loc',
        'H_사용자':'operator','사용자':'operator','담당자':'operator',
        'I_최근교정일':'last','최근교정일':'last','교정일':'last',
        'J_차기교정일':'next','차기교정일':'next','다음교정일':'next',
        'K_사용여부':'active','사용여부':'active',
      };
      Object.assign(labelToKey, equipAlias);
    }
    // 헤더 인덱스 매핑: colMap[i] = key (없으면 null)
    // 헤더 앞뒤 공백 제거 + * 필수표시 제거
    const colMap=headerRow.map(h=>labelToKey[(String(h||'').trim().replace(/\s*\*$/,''))]||null);
    // 헤더 매핑 여부 로그
    const mappedCols=colMap.filter(Boolean).length;
    /* [v2.386] 진단: 매핑된 컬럼 목록 콘솔 출력 */
    console.log('[엑셀업로드] 헤더:', headerRow);
    console.log('[엑셀업로드] 매핑:', colMap.map((k,i)=>k?`${headerRow[i]}→${k}`:'(무시)'));
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
     [v2.386 수정]
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
      /* [v2.386] 테이블별 허용 컬럼만 추출 — SB schema 오류 방지 */
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
        /* [v2.386] 전체 컬럼 명시 — maker/range/res/loc 누락 방지 */
        code:        row.code||'',
        name:        row.name||'',
        model:       row.model||row['모델번호']||'',
        maker:       row.maker||row['제조사']||'',
        range:       row.range||row['측정범위']||'',
        res:         row.res||row['분해능']||'',
        loc:         row.loc||row['보관위치']||'',
        operator:    row.operator||row['사용자']||'',
        active:      (row.active==='불용'||row.active===0||row.active==='0')?0:1,
        /* 차기교정일은 날짜 그대로, 상태는 자동계산 */
        next:        row.next||row['차기교정일']||null,
        last:        row.last||row['최근교정일']||null,
        status:      H.equipStatus(row.next||row['차기교정일']||null),
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

    /* [v2.386] equip: SB.addEquip 헬퍼 직접 호출 (검사5종 방식과 동일)
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
       [v2.386 수정] 1000건 제한 해결
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
     A+C안: 멀티시트 통합 업로드 [v2.386 신규]
     A: 하나의 파일에 품목/거래처/사용자/수입검사 시트 포함
     C: 전체 정합성 검사 통과 시에만 등록 버튼 활성화
        오류 행에 결과 열 자동 추가, 결과 엑셀 내보내기
     ════════════════════════════════════════════════════ */

  /* 멀티시트 양식 다운로드
     [v2.386] pageFilter: 특정 시트만 포함 (null=전체) */
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
    /* [v2.386] 공통 _fileName 사용 */
    const fname=pageFilter&&this._schemas[pageFilter]
      ?this._fileName(this._schemas[pageFilter].title)
      :this._fileName('통합업로드양식');
    XLSX.writeFile(wb,fname);
    Toast.show(`양식이 다운로드되었습니다. (${keys.length}개 시트)`,'ok');
  },

  /* 멀티시트 업로드 모달
     [v2.386] pageFilter: 특정 시트만 표시 (예: 'vendors', 'insp_in' 등)
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
      equip:'계측기_업로드양식', equipment:'계측기_업로드양식',
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
        /* 시트명 → 스키마 키 매핑 — [v2.386] 검사 4종 추가 */
        const SMAP_ALL={'품목등록':'items','거래처등록':'vendors','사용자등록':'users',
          '수입검사':'insp_in','공정검사':'insp_pr','구매검사':'insp_pu',
          '외주검사':'insp_ou','최종검사':'insp_fi',
          '계측기등록':'equip'};
        /* [v2.386] pageFilter: 특정 시트만 파싱 */
        const pf=this._pageFilter;
        const SMAP=pf
          ?Object.fromEntries(Object.entries(SMAP_ALL).filter(([,v])=>v===pf))
          :SMAP_ALL;
        const results={};
        let totalOk=0,totalErr=0,totalDup=0;
        /* [v2.386 버그수정] SB 최신 데이터 강제 로드
           실패 시 빈 배열로 초기화 → 구 캐시로 인한 중복 오판 방지 */
        if(_sb){
          try{
            DB.items=await SB.getItems();
            DB.vendors=await SB.getVendors();
            DB.users=await SB.getUsers();
            /* [v2.386] 계측기 중복 체크용 */
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
          /* [v2.386] raw:true 유지 — 셀 직접 접근으로 날짜 변환 처리 */
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
            /* [v2.386] 날짜 변환 헬퍼
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
    /* [v2.386] 엑셀 날짜 → YYYY-MM-DD (Date객체/시리얼/문자열 모두 처리) */
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
      /* [v2.386] 검사5종 — SB.addInspection allowed와 동일 컬럼 */
      if(['insp_in','insp_pr','insp_pu','insp_ou','insp_fi'].includes(pKey)){
        const typeMap={insp_in:'수입',insp_pr:'공정',insp_pu:'구매',insp_ou:'외주',insp_fi:'최종'};
        return{type:r.type||typeMap[pKey]||'',vendor:r.vendor||'',insp_no:r.insp_no||'',
          insp_date:_toDate(r.insp_date),inspector:r.inspector||'',item_code:r.item_code||'',
          item_name:r.item_name||'',spec:r.spec||'',insp_method:r.insp_method||'',
          result:r.result||'합격',qty:Number(r.qty)||0,pass_qty:Number(r.pass_qty)||0,
          fail_qty:Number(r.fail_qty)||0,defect_rate:Number(r.defect_rate)||0,
          wo_no:r.wo_no||'',note:r.note||'',created_at:_toDate(r.created_at),updated_at:null};
      }
      /* [v2.386] 계측기 — SB.addEquip allowed와 동일 컬럼 */
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
      /* [v2.386] 계측기: SB.addEquip 직접 호출 */
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
      /* [v2.386] 검사5종: SB.addInspection 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
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
      /* [v2.386] 계측기: SB.addEquip 직접 호출 (거래처 방식 — 컬럼 오류 자동 처리) */
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
              /* [v2.386] SAFE 저장 성공하면 colErrors 제거 — SQL 실행 후 팝업 억제 */
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
      /* [v2.386] SB 반영 대기 후 페이지 이동 */
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
  },
};
