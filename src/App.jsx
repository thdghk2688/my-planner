import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const TYPES0 = [
  {key:"work",label:"업무",color:"#378ADD"},
  {key:"exhibition",label:"체험관",color:"#1D9E75"},
  {key:"edu_center",label:"식품안전교육센터",color:"#7F77DD"},
  {key:"trip",label:"출장",color:"#D85A30"},
  {key:"edu_ops",label:"교육운영단",color:"#BA7517"},
  {key:"cooperation",label:"업무협조",color:"#D4537E"},
  {key:"field",label:"현지실사교육",color:"#0F6E56"},
  {key:"etc",label:"기타",color:"#888780"},
];
const SL = [
  {key:"before",label:"시작 전",border:"#E24B4A"},
  {key:"doing",label:"진행 중",border:"#378ADD"},
  {key:"done",label:"완료",border:"#B4B2A9"},
  {key:"cancel",label:"취소",border:"#B4B2A9"},
];
const PL = ["낮음","보통","높음","긴급"];
const PC = ["#888780","#378ADD","#EF9F27","#E24B4A"];
// 대비 강한 색 팔레트 (계열별 명도 차이 확보)
const PCOLS = [
  // 진한 계열
  "#1A3A6B","#0F6E56","#5C1F8A","#8B1A1A","#7A4000","#004D5C",
  // 중간 계열
  "#378ADD","#1D9E75","#7F77DD","#E24B4A","#D85A30","#00897B",
  // 선명 계열
  "#2196F3","#00C853","#9C27B0","#F44336","#FF6D00","#00BCD4",
  // 밝은 계열
  "#64B5F6","#69F0AE","#CE93D8","#EF9A9A","#FFAB40","#80DEEA",
  // 포인트
  "#D4537E","#BA7517","#639922","#546E7A","#795548","#888780",
];
const ET = [
  {key:"worker",label:"종사자",short:"종",color:"#7F77DD"},
  {key:"future",label:"미래인재",short:"미",color:"#1D9E75"},
  {key:"trainer",label:"강사",short:"강",color:"#D85A30"},
];
const EF = [
  {key:"visit",label:"찾아가는"},
  {key:"center",label:"본원"},
  {key:"online",label:"비대면"},
];
const WDAYS = ["일","월","화","수","목","금","토"];

const gid = () => Math.random().toString(36).slice(2,10);
const fmtD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const tod = () => fmtD(new Date());
const pld = (s) => { if(!s) return null; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const sameD = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const inR = (day,s,e) => { const sd=pld(s),ed=pld(e); if(!sd) return false; const d=pld(fmtD(day)); return ed?d>=sd&&d<=ed:sameD(day,sd); };
const rgba = (hex,a) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const tInfo = (types,key) => types.find(t=>t.key===key)||types[0]||{color:"#888",label:"기타"};
const sInfo = (key) => SL.find(s=>s.key===key)||SL[0];
const pND = (raw) => { if(!raw) return tod(); const m=raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/); return m?`${m[1]}-${m[2]}-${m[3]}`:tod(); };
const pStat = (s) => { if(!s) return "before"; if(s==="완료") return "done"; if(s==="진행") return "doing"; if(s==="취소"||s==="보류") return "cancel"; return "before"; };
const tType = (f) => { if(!f) return "etc"; if(f.includes("체험관")) return "exhibition"; if(f.includes("식품안전교육센터")) return "edu_center"; if(f.includes("출장")) return "trip"; if(f.includes("교육운영단")) return "edu_ops"; if(f.includes("업무협조")) return "cooperation"; if(f.includes("현지실사")) return "field"; return "etc"; };

// DB 변환 헬퍼
const taskToDb = (t) => ({
  id: t.id, title: t.title, type: t.type,
  start_date: t.startDate, end_date: t.endDate,
  due_time: t.dueTime||"", priority: t.priority,
  status: t.status, note: t.note||"",
});
const taskFromDb = (r) => ({
  id: r.id, title: r.title, type: r.type,
  startDate: r.start_date, endDate: r.end_date,
  dueTime: r.due_time||"", priority: r.priority,
  status: r.status, note: r.note||"",
});
const eduToDb = (e) => ({
  id: e.id, target: e.target, type: e.type, nth: e.nth,
  start_date: e.startDate, end_date: e.endDate,
  start_time: e.startTime, end_time: e.endTime,
  region: e.region||"", place: e.place||"",
  lectures: e.lectures||[], note: e.note||"",
});
const eduFromDb = (r) => ({
  id: r.id, target: r.target, type: r.type, nth: r.nth,
  startDate: r.start_date, endDate: r.end_date,
  startTime: r.start_time, endTime: r.end_time,
  region: r.region||"", place: r.place||"",
  lectures: r.lectures||[], note: r.note||"",
});
const typeToDb = (t, i) => ({id: t.key, key: t.key, label: t.label, color: t.color, sort_order: i});
const typeFromDb = (r) => ({key: r.key, label: r.label, color: r.color});

const ND = [
  ["세종여고 강사카드 ppt 제출","2025/10/15","완료",0,""],["센터-현업만족도","2025/10/02","완료",0,"개인정보 관련 서류 요청"],
  ["정보보안 검토회신","2025/10/21","완료",2,""],["식품안전교육센터 9월결과보고","2025/10/10","완료",0,"9월 결과 보고 작성 완료"],
  ["리플렛 3차 시안 검토","2025/10/16","완료",0,"최종 시안 확인"],["반부패 청렴 표어 제출","2025/10/15","완료",0,""],
  ["체험관 단체방문 신청서 제출","2025/10/10","완료",0,"휴먼케어 종군교 한경대"],["11월 계획보고 식약처","2025/10/16","완료",0,""],
  ["세종시청 일정 강릉교육지원청 확인","2025/10/15","완료",0,""],["리디앤리서치 최신 데이터 송부","2025/10/16","완료",0,""],
  ["미결의 내역 회신","2025/10/16","완료",0,""],["표준교재 편집작업","2025/11/17","완료",0,""],
  ["QR가이드 결의","2025/10/16","완료",0,""],["26년 사업계획 작성","2025/10/19","완료",0,""],
  ["체험관 예산 사용 고민 단장님 보고","2025/12/08","완료",0,"키링 볼펜 추가 주문"],["프랜차이즈 교육 일정 공유","2025/10/23","완료",2,""],
  ["강사 컨설팅 사례집 수정","2025/11/07","완료",3,""],["체험관 태블릿 수리요청","2025/10/31","완료",1,"마이모노 태블릿업체 수리요청"],
  ["키링제작 발의","2025/10/29","완료",2,""],["출장 정산","2025/11/12","완료",1,""],
  ["세종여고 강의수당 신고 및 출장정산","2025/10/28","완료",1,""],["11월 계획보고 내부결재","2025/10/29","완료",2,""],
  ["26년 사업계획 수정","2025/10/28","완료",3,""],["경영혁신 회의자료","2025/10/28","완료",2,""],
  ["오디오가이드 사용계약 결의","2025/10/29","완료",1,""],["결의 리플렛","2025/10/29","완료",1,"세금계산서 요청함"],
  ["업적평가 기술서","2025/11/03","완료",3,""],["적극행정 사례","2025/11/03","완료",3,""],
  ["10월 결과보고 식약처 제출","2025/10/31","완료",3,"주무관님 검토요청"],["세종여고 출석부 및 사진 전달","2025/10/31","완료",1,""],
  ["비정규직 채용계획서","2025/11/06","완료",2,"현수선생님 내부우편"],["BGF 교육 만족도 교육자료 송부","2025/11/06","완료",3,"배강원"],
  ["예은쌤 개인정보 자료 회신","2025/11/05","완료",0,""],["체험관 약 구매 결의","2025/12/10","완료",0,""],
  ["표준교재 사례집 배포 검토요청","2025/12/08","완료",0,""],["내부통제 리스크 회신","2025/12/10","완료",0,""],
  ["현지실사 실무과정 견적 송부","2025/12/22","진행",0,""],["체험관 정기점검 보고","2025/12/16","완료",0,""],
  ["체험관 유지보수 최종보고 잔금결의","2025/12/22","완료",0,""],["추진실적 보고서","2026/01/07","완료",0,""],
  ["개인평가 기술서","2026/01/08","완료",0,""],["발주계획 회신","2026/01/14","완료",0,""],
  ["주요사업 성과보고서","2026/01/13","완료",0,""],["해외작업장 교육 예산 산출내역서 송부","2026/01/13","시작 전",0,""],
  ["현지실사 실무과정 예산 계약 진행사항 확인","2026/01/12","시작 전",0,""],["체험관 수납장 설치","2026/01/15","완료",0,""],
  ["현지실사 실무과정 교육자료 요청","2026/01/12","진행",0,"1월 28일까지 요청"],["사전정보공표 현행화 자료 회신","2026/01/19","완료",0,""],
  ["체험관 게시물 현행화 예산 진행사항 확인","2026/01/13","시작 전",0,""],["체험관 만족도 조사 게시","2026/01/23","시작 전",0,""],
  ["체험관 결의","2026/01/21","시작 전",0,"현행화 시공 청소용품"],["체험관 대정비 소개 자료","2026/01/21","진행",0,""],
  ["현지실사 실무과정 계약 요청 체결","2026/01/23","진행",0,"1/21 요청공문 발송"],["현지실사 실무과정 교육 운영 준비","2026/01/28","시작 전",0,""],
  ["종군교 체험관 단체방문 신청서 제출","2026/02/09","완료",0,"2/10 방문 예정"],["체험관 개보수 청소용품 결의","2026/02/11","시작 전",0,""],
  ["식품안전교육센터 제안서 발표자료작성","2026/02/19","시작 전",0,""],["현지실사 실무과정 교육 결과보고서","2026/02/12","시작 전",0,""],
  ["현지실사 실무과정 결과보고","2026/02/23","시작 전",0,""],["현지실사 실무과정 결의","2026/02/23","시작 전",0,""],
  ["해외작업장 현지실사 섭외 확정","2026/02/23","시작 전",0,""],["체험관 보도자료 수정","2026/02/23","시작 전",0,""],
  ["체험관 유지보수 계약안 기안","2026/03/09","완료",0,""],["식품안전교육센터 입찰 요청","2026/03/09","완료",0,""],
  ["반려동물 설명회 명단 제출","2026/03/06","완료",0,""],["체험관 단체방문 신청서 제출2","2026/03/09","완료",0,"온라인 종군교 우송대"],
  ["체험관 유지보수 계약 제반서류요청","2026/03/09","완료",0,""],["체험관 유지보수 계약 준비","2026/03/16","완료",0,"예산 조정 필요서류 재요청"],
  ["경영혁신 적극행정 공모자료 작성","2026/03/16","진행",0,""],["식품안전교육센터 재입찰 요청공문발송","2026/03/16","완료",0,"재입찰 일정 공유 후 요청 공문 발송"],
  ["경영혁신 적극행정 공모자료2","2026/03/17","진행",0,""],["체험관 유지보수 계약발의 요청","2026/03/17","진행",0,""],
];
const TD = [
  ["세종시청 14:00~16:00","2025/10/23","출장","완료",""],["11월 계획보고 식약처","2025/10/15","식품안전교육센터","완료",""],
  ["강사 컨설팅 자료 검토","2025/10/24","식품안전교육센터","완료",""],["견학 종군교 10:00","2025/10/17","체험관","완료",""],
  ["정보보안 결과 확인 및 회신","2025/10/21","교육운영단","완료","예은쌤 직무대행"],["교육+견학 한경대 10:00","2025/10/14","체험관","완료",""],
  ["순천대 10:00~12:00","2025/10/13","출장","완료",""],["세종여고 진로 강의","2025/10/24","교육운영단","완료","강의카드 보내야함"],
  ["현업적용도 진행사항 확인","2025/10/24","식품안전교육센터","완료","9월 중순 DB 발송완료"],["9월 결과보고 식약처","2025/10/10","식품안전교육센터","완료",""],
  ["표준교재 검토","2025/10/20","식품안전교육센터","완료",""],["교육+견학 순천대 13:30~15:30","2025/10/27","체험관","완료",""],
  ["11월 계획보고 내부결재","2025/10/29","식품안전교육센터","완료",""],["교육+견학 마이스터고 10:00","2025/10/22","체험관","완료",""],
  ["견학 휴먼케어 13:30~14:30","2025/10/17","체험관","완료",""],["리플렛 최종 컨펌 및 제작요청","2025/10/22","체험관","완료","10/1 2차 시안검토 완료"],
  ["10월 결과보고 식약처","2025/11/05","식품안전교육센터","완료",""],["고려대 세종 12:00~14:00","2025/10/17","출장","취소","출장 취소 필요"],
  ["대전대 비대면 9:00~12:00","2025/10/24","식품안전교육센터","완료",""],["견학 휴먼케어 10:30~11:30","2025/10/13","체험관","완료","혜연선생님 부탁"],
  ["26년 사업계획 초안 작성","2025/10/22","교육운영단","완료",""],["체험관 예산 발의","2025/10/31","체험관","완료",""],
  ["ESG 꿈길 체험관","2025/11/24","업무협조","완료",""],["업적평가 기술서","2025/11/03","교육운영단","완료",""],
  ["전략본부 체험관 견학","2025/11/18","업무협조","취소","오후 6명 중앙부처 공직자"],["적극행정 사례 제출","2025/11/04","업무협조","완료",""],
  ["ESG 소상공인 교육실적","2025/12/08","업무협조","취소",""],["비정규직 채용계획서 회신","2025/11/06","교육운영단","완료",""],
  ["체험관 견학 10:30 2~3명","2025/11/04","체험관","완료",""],["체험관 견학 14:00 파워블로거","2025/11/05","체험관","취소","이시우선생님 요청"],
  ["체험관 견학 중앙대 26명","2025/11/13","체험관","완료","단체방문 신청서 제출 완료"],["표준교재 사례집 배포","2025/12/10","식품안전교육센터","완료",""],
  ["체험관 예산 소진 필요","2025/12/12","체험관","완료",""],["종군교 체험관 견학 오전 5명","2025/12/17","체험관","완료","단장님 협조요청"],
  ["내부평가 실적자료 제출","2026/01/08","교육운영단","완료",""],["환경경영시스템 인터뷰 협조","2025/12/18","업무협조","완료","14:30 5층 영상회의실"],
  ["강원도 군부대 체험관견학","2026/01/13","체험관","취소","단체방문 신청 필요"],["개인평가 업적기술서 제출","2026/01/09","기타","완료",""],
  ["25년 성과보고서 제출","2026/01/13","교육운영단","완료",""],["체험관 게시물 현행화 시공","2026/01/19","체험관","완료",""],
  ["현지실사 실무과정 교육","2026/02/09","현지실사교육","완료",""],["해외작업장 현지실사 교육","2026/04/07","현지실사교육","완료",""],
  ["건국대 식품유통공학과 견학","2026/03/27","체험관","취소","010-8638-2651"],["현장실습 확정여부 확인","2026/02/23","현지실사교육","완료","마니커로 확정"],
  ["식약처장 기관방문","2026/01/22","교육운영단","완료","체험관 셋팅"],["충북대 식품영양학과 견학","2026/03/27","체험관","시작 전","명단 제출 필요"],
  ["체험관 예약자 견학 인솔","2026/03/10","체험관","완료",""],["경영혁신 적극행정 아이디어 공모","2026/03/20","기타","시작 전",""],
  ["종군교 견학 9:30","2026/03/13","체험관","완료","박수진 교관"],["휴직대체직원 견학 10:30","2026/03/13","체험관","완료","인증기획팀 장형권"],
  ["우송대 일본","2026/03/17","체험관","시작 전","박수정 교수 명단 제출 완료"],["라오스 국제인증팀","2026/03/26","체험관","시작 전","명단 받아야함"],
  ["송성옥 이사님 외 5","2026/03/19","체험관","완료",""],["기자단 원장님","2026/04/09","체험관","시작 전","누리기자단"],
  ["엑스코어 방문","2026/03/23","체험관","시작 전","김병우 책임"],
];
const INIT_TASKS = [
  ...ND.map(r=>({id:gid(),title:r[0],type:"work",startDate:pND(r[1]),endDate:pND(r[1]),dueTime:"",priority:r[3],status:pStat(r[2]),note:r[4]})),
  ...TD.map(r=>({id:gid(),title:r[0],type:tType(r[2]),startDate:pND(r[1]),endDate:pND(r[1]),dueTime:"",priority:1,status:pStat(r[3]),note:r[4]})),
];
const INIT_EDU = [{id:gid(),target:"worker",type:"center",nth:1,startDate:"2026-03-25",endDate:"2026-03-26",startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"식품위생 기초",instructor:"김강사"}],note:""}];

function Overlay({children,onClose}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
        {children}
      </div>
    </div>
  );
}

function TaskBlock({t,types,onClick,selMode,isSel,onSel}) {
  const si=sInfo(t.status), ti=tInfo(types,t.type);
  const now=new Date(), end=pld(t.endDate);
  const dl=end?Math.ceil((end-now)/86400000):null;
  const ov=t.status!=="done"&&t.status!=="cancel"&&dl!==null&&dl<0;
  const sk=t.status==="done"||t.status==="cancel";
  return (
    <div onClick={()=>selMode?onSel(t.id):onClick(t)}
      style={{padding:"2px 6px",borderRadius:5,marginBottom:2,cursor:"pointer",
        background:isSel?rgba(ti.color,0.25):rgba(ti.color,0.10),
        border:`1px solid ${isSel?"#378ADD":si.border}`,
        borderLeft:`3px solid ${isSel?"#378ADD":si.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        {selMode&&<div style={{width:13,height:13,borderRadius:3,border:`2px solid ${isSel?"#378ADD":"#ccc"}`,background:isSel?"#378ADD":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{isSel&&<span style={{color:"#fff",fontSize:8}}>✓</span>}</div>}
        {!selMode&&<div style={{width:5,height:5,borderRadius:"50%",background:ti.color,flexShrink:0}}/>}
        <span style={{flex:1,fontSize:11,fontWeight:500,textDecoration:sk?"line-through":"none",color:sk?"#bbb":"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"left"}}>{t.title}</span>
        {ov&&<span style={{fontSize:9,color:"#E24B4A",flexShrink:0}}>초과</span>}
      </div>
      <div style={{display:"flex",gap:4,marginTop:1,paddingLeft:10,flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:"#888"}}>{t.startDate}{t.endDate&&t.endDate!==t.startDate?`~${t.endDate}`:""}{t.dueTime?` ${t.dueTime}`:""}</span>
        <span style={{fontSize:8,padding:"0 2px",borderRadius:2,lineHeight:"4px",height:"9px",background:PC[t.priority]+"22",color:PC[t.priority],display:"inline-block"}}>{PL[t.priority]}</span>
        {dl!==null&&!sk&&<span style={{fontSize:8,color:ov?"#E24B4A":dl<=2?"#EF9F27":"#bbb"}}>{ov?`${Math.abs(dl)}일 초과`:dl===0?"오늘":"D-"+dl}</span>}
      </div>
    </div>
  );
}

function TaskForm({types,initial,onSave,onClose,onDelete}) {
  const [f,setF] = useState(initial||{title:"",type:types[0]?.key||"work",startDate:tod(),endDate:tod(),dueTime:"",priority:1,status:"before",note:""});
  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  const isEdit = !!onDelete;
  const tc = tInfo(types,f.type);
  const ai = useCallback(async() => {
    if(!f.title) return;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:`태스크: "${f.title}"\n우선순위 0~3 숫자만:`}]})});
      const data = await res.json();
      const n = parseInt(data.content?.[0]?.text?.trim());
      if(!isNaN(n)&&n>=0&&n<=3) upd("priority",n);
    } catch(e) {}
  },[f.title]);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>{isEdit?"태스크 수정":"새 태스크"}</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>제목</div><input value={f.title} onChange={e=>upd("title",e.target.value)} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderLeft:`3px solid ${tc.color}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>메모</div><textarea value={f.note} onChange={e=>upd("note",e.target.value)} rows={2} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div>
          <div style={{fontSize:11,color:"#666",marginBottom:3}}>유형</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{types.map(t=>{const on=f.type===t.key;return<button key={t.key} onClick={()=>upd("type",t.key)} style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:`1.5px solid ${on?t.color:"#ccc"}`,background:on?rgba(t.color,0.15):"#fff",color:on?t.color:"#666",cursor:"pointer",fontWeight:on?600:400}}>{t.label}</button>;})}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:"#666",marginBottom:3}}>상태</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{SL.map(st=>{const on=f.status===st.key;return<button key={st.key} onClick={()=>upd("status",st.key)} style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:`1.5px solid ${on?st.border:"#ccc"}`,background:on?rgba(st.border,0.1):"#fff",color:on?st.border:"#666",cursor:"pointer",fontWeight:on?600:400}}>{st.label}</button>;})}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작일</div><input type="date" value={f.startDate} onChange={e=>upd("startDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
          <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료일</div><input type="date" value={f.endDate} onChange={e=>upd("endDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
        </div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>마감 시간</div><input type="time" value={f.dueTime} onChange={e=>upd("dueTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div style={{flex:1}}><div style={{fontSize:11,color:"#666",marginBottom:3}}>우선순위</div><select value={f.priority} onChange={e=>upd("priority",parseInt(e.target.value))} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8}}>{PL.map((l,i)=><option key={i} value={i}>{l}</option>)}</select></div>
          <button onClick={ai} style={{padding:"6px 10px",fontSize:11,border:"1px solid #ccc",borderRadius:8,background:"#f5f5f5",cursor:"pointer"}}>AI 제안 ✦</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {isEdit&&<button onClick={onDelete} style={{padding:"7px 12px",background:"#fff0f0",color:"#c00",border:"1px solid #fcc",borderRadius:8,cursor:"pointer",fontSize:13}}>삭제</button>}
          <button onClick={onClose} style={{flex:1,padding:"7px",background:"#f5f5f5",border:"1px solid #ddd",borderRadius:8,cursor:"pointer",fontSize:13}}>취소</button>
          <button onClick={()=>{if(f.title.trim())onSave(f);}} style={{flex:2,padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function EduForm({initial,eduItems,onSave,onClose,onDelete}) {
  const isEdit=!!onDelete;
  const all=eduItems||[];
  const aNth=(tgt,cid,sd)=>{const same=all.filter(e=>e.target===tgt&&e.id!==cid).sort((a,b)=>a.startDate>b.startDate?1:-1);const idx=same.findIndex(e=>e.startDate>(sd||"9999"));return(idx===-1?same.length:idx)+1;};
  const [f,setF]=useState(()=>initial||{target:"worker",type:"center",nth:aNth("worker",null,tod()),startDate:tod(),endDate:tod(),startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"",instructor:""}],note:""});
  const upd=(k,v)=>setF(p=>{if(k==="target"&&!isEdit)return{...p,[k]:v,nth:aNth(v,null,p.startDate)};if(k==="startDate"&&!isEdit)return{...p,[k]:v,nth:aNth(p.target,null,v)};return{...p,[k]:v};});
  const ti=ET.find(t=>t.key===f.target)||ET[0];
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>{isEdit?"교육일정 수정":"교육일정 추가"}</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>교육 구분</div><div style={{display:"flex",gap:5}}>{ET.map(t=><button key={t.key} onClick={()=>upd("target",t.key)} style={{flex:1,padding:6,borderRadius:8,border:`1.5px solid ${f.target===t.key?t.color:"#ccc"}`,background:f.target===t.key?rgba(t.color,0.15):"#fff",color:f.target===t.key?t.color:"#666",cursor:"pointer",fontSize:13}}>{t.label}</button>)}</div></div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>교육 형태</div><div style={{display:"flex",gap:5}}>{EF.map(t=><button key={t.key} onClick={()=>upd("type",t.key)} style={{flex:1,padding:6,borderRadius:8,border:`1.5px solid ${f.type===t.key?ti.color:"#ccc"}`,background:f.type===t.key?rgba(ti.color,0.12):"#fff",color:f.type===t.key?ti.color:"#666",cursor:"pointer",fontSize:13}}>{t.label}</button>)}</div></div>
        {f.type==="visit"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:10,borderRadius:8,background:rgba(ti.color,0.07),border:`1px dashed ${rgba(ti.color,0.4)}`}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>지역</div><input value={f.region} onChange={e=>upd("region",e.target.value)} placeholder="예) 충북" style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>장소</div><input value={f.place} onChange={e=>upd("place",e.target.value)} placeholder="예) 청주교육원" style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div></div>}
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:11,color:"#666",whiteSpace:"nowrap"}}>차수</div><input type="number" min={1} value={f.nth} onChange={e=>upd("nth",parseInt(e.target.value)||1)} style={{width:70,padding:"6px 8px",border:"1px solid #ccc",borderRadius:8}}/><span style={{fontSize:11,color:"#888"}}>차 (자동계산)</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작일</div><input type="date" value={f.startDate} onChange={e=>upd("startDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료일</div><input type="date" value={f.endDate} onChange={e=>upd("endDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작 시간</div><input type="time" value={f.startTime} onChange={e=>upd("startTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료 시간</div><input type="time" value={f.endTime} onChange={e=>upd("endTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div></div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{fontSize:11,color:"#666"}}>강의 내용 및 강사</div><button onClick={()=>upd("lectures",[...f.lectures,{id:gid(),subject:"",instructor:""}])} style={{fontSize:11,padding:"2px 8px",background:rgba(ti.color,0.1),border:`1px solid ${ti.color}`,color:ti.color,borderRadius:10,cursor:"pointer"}}>+ 추가</button></div>
          {f.lectures.map((l,i)=><div key={l.id} style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,padding:"6px 8px",background:"#f9f9f9",borderRadius:8}}><span style={{fontSize:11,color:"#999",minWidth:18}}>{i+1}.</span><input placeholder="강의 과목" value={l.subject} onChange={e=>upd("lectures",f.lectures.map(x=>x.id===l.id?{...x,subject:e.target.value}:x))} style={{flex:2,padding:"5px 8px",border:"1px solid #ccc",borderRadius:6,fontSize:12}}/><input placeholder="강사명" value={l.instructor} onChange={e=>upd("lectures",f.lectures.map(x=>x.id===l.id?{...x,instructor:e.target.value}:x))} style={{flex:1,padding:"5px 8px",border:"1px solid #ccc",borderRadius:6,fontSize:12}}/>{f.lectures.length>1&&<button onClick={()=>upd("lectures",f.lectures.filter(x=>x.id!==l.id))} style={{border:"none",background:"none",color:"#999",fontSize:14,cursor:"pointer"}}>×</button>}</div>)}
        </div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>메모</div><textarea value={f.note} onChange={e=>upd("note",e.target.value)} rows={2} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {isEdit&&<button onClick={onDelete} style={{padding:"7px 12px",background:"#fff0f0",color:"#c00",border:"1px solid #fcc",borderRadius:8,cursor:"pointer",fontSize:13}}>삭제</button>}
          <button onClick={onClose} style={{flex:1,padding:"7px",background:"#f5f5f5",border:"1px solid #ddd",borderRadius:8,cursor:"pointer",fontSize:13}}>취소</button>
          <button onClick={()=>onSave(f)} style={{flex:2,padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function DayPanel({date,tasks,types,onTask,onAdd,onClose}) {
  const dt=tasks.filter(t=>inR(date,t.startDate,t.endDate)).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  return(
    <div style={{marginTop:16,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafafa"}}>
        <strong style={{fontSize:13,color:"#333"}}>{date.getMonth()+1}월 {date.getDate()}일 업무 ({dt.length}건)</strong>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onAdd} style={{fontSize:11,padding:"4px 10px",borderRadius:16,border:"none",background:"#1a1a1a",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 추가</button>
          <button onClick={onClose} style={{fontSize:11,padding:"4px 8px",borderRadius:16,border:"1px solid #ddd",background:"#fff",color:"#888",cursor:"pointer"}}>닫기</button>
        </div>
      </div>
      <div style={{padding:"10px 12px",maxHeight:280,overflowY:"auto"}}>
        {dt.length===0?<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"1.5rem 0"}}>이 날 업무가 없어요</div>:dt.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={false} isSel={false} onSel={()=>{}}/>)}
      </div>
    </div>
  );
}

function CalGrid({types,tasks,cur,setCur,onTask,selectedDate,setSelectedDate}) {
  const y=cur.getFullYear(),m=cur.getMonth();
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const now=new Date(),weeks=[];
  let day=1-fd;
  while(day<=dim){const wk=[];for(let i=0;i<7;i++,day++)wk.push(day>0&&day<=dim?new Date(y,m,day):null);weeks.push(wk);}
  const BD="1px solid #e0e0e0";
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>setCur(new Date(y,m-1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>‹</button>
        <strong>{y}년 {m+1}월</strong>
        <button onClick={()=>setCur(new Date(y,m+1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>›</button>
      </div>
      <div style={{border:BD,borderRadius:8,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",borderBottom:BD}}>
          {WDAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,padding:"6px 0",color:i===0?"#E24B4A":i===6?"#378ADD":"#666",borderRight:i<6?BD:"none",background:"#fafafa"}}>{d}</div>)}
        </div>
        {weeks.map((wk,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))"}}>
            {wk.map((date,di)=>{
              if(!date)return<div key={`e${wi}${di}`} style={{minHeight:80,borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",background:"#f7f7f7"}}/>;
              const dt=tasks.filter(t=>inR(date,t.startDate,t.endDate));
              const isT=sameD(date,now);
              const isSel=selectedDate&&sameD(date,selectedDate);
              return(
                <div key={`${wi}${di}`} onClick={()=>setSelectedDate(isSel?null:date)}
                  style={{minHeight:52,padding:"2px 2px",borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",cursor:"pointer",background:isSel?"#dbeafe":isT?"#EBF4FD":"#fff",boxSizing:"border-box",outline:isSel?"2px solid #378ADD":"none",outlineOffset:-1}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:1}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:isT?"#378ADD":"transparent",fontSize:10,fontWeight:isT?600:400,color:isT?"#fff":di===0?"#E24B4A":di===6?"#378ADD":"#1a1a1a"}}>{date.getDate()}</span>
                  </div>
                  {dt.slice(0,3).map(t=>{const si=sInfo(t.status);const ti=tInfo(types,t.type);const sk=t.status==="done"||t.status==="cancel";return<div key={t.id} onClick={e=>{e.stopPropagation();onTask(t);}} style={{fontSize:9,padding:"0px 3px 0px 4px",marginBottom:1,borderRadius:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",cursor:"pointer",background:rgba(ti.color,0.15),color:"#444",border:`1px solid ${si.border}`,borderLeft:`3px solid ${si.border}`,textDecoration:sk?"line-through":"none",opacity:sk?0.6:1,textAlign:"left",lineHeight:"14px"}}>{t.title}</div>;})}
                  {dt.length>3&&<div style={{fontSize:8,color:"#aaa",paddingLeft:2}}>+{dt.length-3}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{types.map(t=><div key={t.key} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/><span style={{fontSize:10,color:"#666"}}>{t.label}</span></div>)}</div>
        <div style={{display:"flex",gap:8,marginLeft:"auto",flexWrap:"wrap"}}>{SL.map(st=><div key={st.key} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:9,height:9,borderRadius:2,border:`2px solid ${st.border}`,borderLeft:`3px solid ${st.border}`,background:"transparent"}}/><span style={{fontSize:10,color:"#666"}}>{st.label}</span></div>)}</div>
      </div>
    </div>
  );
}

function EduGrid({eduItems,onDay,onItem}) {
  const [cur,setCur]=useState(new Date());
  const y=cur.getFullYear(),m=cur.getMonth();
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const now=new Date(),weeks=[];
  let day=1-fd;
  while(day<=dim){const wk=[];for(let i=0;i<7;i++,day++)wk.push(day>0&&day<=dim?new Date(y,m,day):null);weeks.push(wk);}
  const lbl=item=>{const t=ET.find(x=>x.key===item.target);const loc=item.type==="visit"&&item.region?`(${item.region})`:"";return`${t?t.short:"?"} ${item.nth}차 ${EF.find(x=>x.key===item.type)?.label||""}${loc}`;};
  const mi=[...eduItems].filter(e=>{const sv=pld(e.startDate);return sv&&sv.getFullYear()===y&&sv.getMonth()===m;}).sort((a,b)=>a.startDate>b.startDate?1:-1);
  const BD="1px solid #e0e0e0";
  const calGrid=(
    <div style={{minWidth:0,flex:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>setCur(new Date(y,m-1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>‹</button>
        <strong>{y}년 {m+1}월</strong>
        <button onClick={()=>setCur(new Date(y,m+1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>›</button>
      </div>
      <div style={{border:BD,borderRadius:8,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",borderBottom:BD}}>
          {WDAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,padding:"6px 0",color:i===0?"#E24B4A":i===6?"#378ADD":"#666",borderRight:i<6?BD:"none",background:"#fafafa"}}>{d}</div>)}
        </div>
        {weeks.map((wk,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))"}}>
            {wk.map((date,di)=>{
              if(!date)return<div key={`e${wi}${di}`} style={{minHeight:52,borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",background:"#f7f7f7"}}/>;
              const items=eduItems.filter(e=>inR(date,e.startDate,e.endDate));
              const isT=sameD(date,now);
              return(
                <div key={`${wi}${di}`} onClick={()=>onDay(date)} style={{minHeight:52,padding:"2px 2px",borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",cursor:"pointer",background:isT?"#EBF4FD":"#fff",boxSizing:"border-box"}} onMouseEnter={e=>{if(!isT)e.currentTarget.style.background="#f5f5f5";}} onMouseLeave={e=>{e.currentTarget.style.background=isT?"#EBF4FD":"#fff";}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:1}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:isT?"#378ADD":"transparent",fontSize:10,fontWeight:isT?600:400,color:isT?"#fff":di===0?"#E24B4A":di===6?"#378ADD":"#1a1a1a"}}>{date.getDate()}</span>
                  </div>
                  {items.slice(0,2).map(item=>{const tc=ET.find(t=>t.key===item.target);const color=tc?.color||"#888";return<div key={item.id} onClick={e=>{e.stopPropagation();onItem(item);}} style={{fontSize:9,padding:"0px 3px 0px 4px",marginBottom:1,borderRadius:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",cursor:"pointer",background:rgba(color,0.15),color,border:`1px solid ${color}`,borderLeft:`3px solid ${color}`,lineHeight:"14px"}}>{lbl(item)}</div>;})}
                  {items.length>2&&<div style={{fontSize:8,color:"#aaa",paddingLeft:2}}>+{items.length-2}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>{ET.map(t=><div key={t.key} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/><span style={{fontSize:10,color:"#666"}}>{t.short} = {t.label}</span></div>)}</div>
    </div>
  );
  const sidebar=(
    <div style={{width:250,flexShrink:0,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",padding:"12px",height:"calc(100vh - 140px)",overflowY:"auto",position:"sticky",top:16}}>
      <strong style={{fontSize:13,display:"block",marginBottom:8}}>{m+1}월 교육 일정</strong>
      {mi.length===0&&<div style={{color:"#bbb",fontSize:12,textAlign:"center",padding:"1.5rem 0"}}>이 달 교육 없음</div>}
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {mi.map(item=>{const tc=ET.find(t=>t.key===item.target);const color=tc?.color||"#888";return(<div key={item.id} onClick={()=>onItem(item)} style={{padding:"4px 8px",borderRadius:7,cursor:"pointer",background:rgba(color,0.10),border:`1px solid ${color}`,borderLeft:`3px solid ${color}`}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,fontWeight:600,color}}>{lbl(item)}</span></div><div style={{fontSize:9,color:"#666",marginTop:1}}>{item.startDate}{item.endDate!==item.startDate?` ~ ${item.endDate}`:""} {item.startTime}~{item.endTime}{item.type==="visit"&&item.place?` · ${item.place}`:""}</div>{item.lectures[0]?.subject&&<div style={{marginTop:2,display:"flex",flexDirection:"column",gap:0}}>{item.lectures.map((l,i)=><span key={l.id} style={{fontSize:9,color:"#666"}}>{i+1}. {l.subject}{l.instructor?` (${l.instructor})`:""}</span>)}</div>}{item.note&&<div style={{marginTop:1,fontSize:9,color:"#999"}}>{item.note}</div>}</div>);})}
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",gap:16,alignItems:"start",width:"100%"}}>
      {calGrid}
      {sidebar}
    </div>
  );
}

function FocusView({types,tasks,onTask}) {
  const now=new Date(),past=new Date(now),future=new Date(now);
  past.setDate(past.getDate()-7);future.setDate(future.getDate()+14);
  const list=tasks.filter(t=>{const sv=pld(t.startDate||t.endDate),ev=pld(t.endDate||t.startDate);return sv&&sv<=future&&(ev||sv)>=past;}).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>1주 전 ~ 2주 후 ({list.length}건)</div>
      {list.length===0&&<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"2rem"}}>해당 기간 태스크 없음</div>}
      {list.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={false} isSel={false} onSel={()=>{}}/>)}
    </div>
  );
}

function TaskList({types,tasks,onTask,onAdd,onBulk}) {
  const [filter,setFilter]=useState("all");
  const [tf,setTf]=useState("all");
  const [sel,setSel]=useState([]);
  const [selMode,setSelMode]=useState(false);
  const [panel,setPanel]=useState(false);
  const [bType,setBType]=useState("");
  const [bStat,setBStat]=useState("");
  const [bPri,setBPri]=useState("");
  const list=tasks.filter(t=>filter==="all"||(filter==="active"?t.status==="before"||t.status==="doing":filter===t.status)).filter(t=>tf==="all"||t.type===tf).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  const exit=()=>{setSelMode(false);setSel([]);setPanel(false);setBType("");setBStat("");setBPri("");};
  const apply=()=>{const ch={};if(bType)ch.type=bType;if(bStat)ch.status=bStat;if(bPri!=="")ch.priority=parseInt(bPri);if(!Object.keys(ch).length)return;onBulk(sel,ch);exit();};
  const fBtn=(v,l)=><button key={v} onClick={()=>setFilter(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1px solid ${filter===v?"#1a1a1a":"#ddd"}`,background:filter===v?"#1a1a1a":"#fff",color:filter===v?"#fff":"#666",cursor:"pointer"}}>{l}</button>;
  return(
    <div>
      <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
        {fBtn("all","전체")}{fBtn("active","진행")}{fBtn("done","완료")}{fBtn("cancel","취소")}
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <button onClick={()=>{if(selMode)exit();else setSelMode(true);}} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1px solid ${selMode?"#378ADD":"#ddd"}`,background:selMode?"#EBF4FD":"#fff",color:selMode?"#378ADD":"#666",cursor:"pointer"}}>{selMode?"취소":"일괄편집"}</button>
          {!selMode&&<button onClick={onAdd} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"1px solid #ddd",background:"#fff",color:"#666",cursor:"pointer"}}>+ 추가</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
        <button onClick={()=>setTf("all")} style={{fontSize:11,padding:"2px 8px",borderRadius:10,border:`1.5px solid ${tf==="all"?"#1a1a1a":"#ddd"}`,background:"transparent",color:tf==="all"?"#1a1a1a":"#888",cursor:"pointer"}}>전체</button>
        {types.map(t=><button key={t.key} onClick={()=>setTf(t.key)} style={{fontSize:11,padding:"2px 8px",borderRadius:10,border:`1.5px solid ${tf===t.key?t.color:"#ddd"}`,background:tf===t.key?rgba(t.color,0.15):"transparent",color:tf===t.key?t.color:"#888",cursor:"pointer"}}>{t.label}</button>)}
      </div>
      {selMode&&<div style={{marginBottom:8,padding:"8px 12px",borderRadius:10,background:"#f9f9f9",border:"1px solid #e0e0e0"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:panel?8:0}}><button onClick={()=>setSel(s=>s.length===list.length?[]:list.map(t=>t.id))} style={{fontSize:11,padding:"3px 10px",borderRadius:10,border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}>{sel.length===list.length?"전체 해제":"전체 선택"}</button><span style={{fontSize:12,color:"#888"}}>{sel.length}개 선택</span>{sel.length>0&&<button onClick={()=>setPanel(p=>!p)} style={{marginLeft:"auto",fontSize:11,padding:"4px 12px",borderRadius:10,border:"none",background:"#378ADD",color:"#fff",cursor:"pointer",fontWeight:600}}>일괄 변경 {panel?"▲":"▼"}</button>}</div>{panel&&sel.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,paddingTop:8,borderTop:"1px solid #e8e8e8"}}><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>업무 유형</div><select value={bType} onChange={e=>setBType(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{types.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>진행 상태</div><select value={bStat} onChange={e=>setBStat(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{SL.map(st=><option key={st.key} value={st.key}>{st.label}</option>)}</select></div><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>우선순위</div><select value={bPri} onChange={e=>setBPri(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{PL.map((l,i)=><option key={i} value={i}>{l}</option>)}</select></div><button onClick={apply} style={{padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>선택한 {sel.length}개 적용</button></div>}</div>}
      {list.length===0&&<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"2rem"}}>태스크가 없어요</div>}
      {list.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={selMode} isSel={sel.includes(t.id)} onSel={id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}/>)}
    </div>
  );
}

function TypeSettings({types,onSave,onClose}) {
  const [list,setList]=useState(()=>types.map(t=>({...t})));
  const [oc,setOc]=useState(null);
  const [el,setEl]=useState({});
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>업무 유형 관리</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {list.map(t=>(
          <div key={t.key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:10,border:"1px solid #eee",background:"#fafafa"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div onClick={()=>setOc(c=>c===t.key?null:t.key)} style={{width:22,height:22,borderRadius:"50%",background:t.color,cursor:"pointer",border:"2px solid rgba(0,0,0,0.1)"}}/>
              {oc===t.key&&<div style={{position:"absolute",top:28,left:0,zIndex:10,background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:8,display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",width:180}}>{PCOLS.map(c=><div key={c} onClick={()=>{setList(l=>l.map(x=>x.key===t.key?{...x,color:c}:x));setOc(null);}} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:t.color===c?"2.5px solid #000":"2px solid transparent"}}/>)}<input type="color" value={t.color} onChange={e=>setList(l=>l.map(x=>x.key===t.key?{...x,color:e.target.value}:x))} style={{gridColumn:"span 6",height:22,border:"none",padding:0,cursor:"pointer",width:"100%",marginTop:4}}/></div>}
            </div>
            {el[t.key]?<input autoFocus value={t.label} onChange={e=>setList(l=>l.map(x=>x.key===t.key?{...x,label:e.target.value}:x))} onBlur={()=>setEl(p=>({...p,[t.key]:false}))} style={{flex:1,fontSize:13,padding:"2px 6px",border:"1px solid #ccc",borderRadius:6}}/>:<span style={{flex:1,fontSize:13,cursor:"text"}} onClick={()=>setEl(p=>({...p,[t.key]:true}))}>{t.label}</span>}
            <span style={{fontSize:10,color:"#bbb"}}>(클릭 수정)</span>
            <button onClick={()=>setList(l=>l.filter(x=>x.key!==t.key))} style={{border:"none",background:"none",cursor:"pointer",color:"#c00",fontSize:14}}>×</button>
          </div>
        ))}
      </div>
      <button onClick={()=>setList(l=>[...l,{key:gid(),label:"새 유형",color:PCOLS[l.length%PCOLS.length]}])} style={{width:"100%",padding:8,borderRadius:8,border:"1px dashed #ccc",background:"transparent",cursor:"pointer",color:"#888",marginBottom:10}}>+ 유형 추가</button>
      <button onClick={()=>onSave(list)} style={{width:"100%",padding:8,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>저장</button>
    </div>
  );
}

// ── 메인 App (Supabase 연동)
function App() {
  const [tasks,setTasks] = useState([]);
  const [eduItems,setEduItems] = useState([]);
  const [types,setTypes] = useState(TYPES0);
  const [loading,setLoading] = useState(true);
  const [calDate,setCalDate] = useState(new Date());
  const [selectedDate,setSelectedDate] = useState(null);
  const [modal,setModal] = useState(null);
  const [mainTab,setMainTab] = useState("planner");
  const [subTab,setSubTab] = useState("focus");
  const [mobile,setMobile] = useState(window.innerWidth<768);
  const [toast,setToast] = useState(null);
  const tRef = useRef(null);

  useEffect(()=>{const fn=()=>setMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  const showT = (msg) => {setToast(msg);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),2200);};

  // 초기 데이터 로드
  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      try {
        // tasks
        const {data:td} = await supabase.from("tasks").select("*").order("start_date");
        if(td&&td.length>0) {
          setTasks(td.map(taskFromDb));
        } else {
          // 초기 데이터 삽입
          const rows = INIT_TASKS.map(taskToDb);
          await supabase.from("tasks").insert(rows);
          setTasks(INIT_TASKS);
        }
        // edu_items
        const {data:ed} = await supabase.from("edu_items").select("*").order("start_date");
        if(ed&&ed.length>0) setEduItems(ed.map(eduFromDb));
        else {
          await supabase.from("edu_items").insert(INIT_EDU.map(eduToDb));
          setEduItems(INIT_EDU);
        }
        // types
        const {data:tyd} = await supabase.from("app_types").select("*").order("sort_order");
        if(tyd&&tyd.length>0) setTypes(tyd.map(typeFromDb));
        else {
          await supabase.from("app_types").insert(TYPES0.map(typeToDb));
          setTypes(TYPES0);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  },[]);

  // 실시간 구독
  useEffect(()=>{
    const ch1 = supabase.channel("tasks-changes")
      .on("postgres_changes",{event:"*",schema:"public",table:"tasks"},()=>{
        supabase.from("tasks").select("*").order("start_date").then(({data})=>{if(data)setTasks(data.map(taskFromDb));});
      }).subscribe();
    const ch2 = supabase.channel("edu-changes")
      .on("postgres_changes",{event:"*",schema:"public",table:"edu_items"},()=>{
        supabase.from("edu_items").select("*").order("start_date").then(({data})=>{if(data)setEduItems(data.map(eduFromDb));});
      }).subscribe();
    const ch3 = supabase.channel("types-changes")
      .on("postgres_changes",{event:"*",schema:"public",table:"app_types"},()=>{
        supabase.from("app_types").select("*").order("sort_order").then(({data})=>{if(data)setTypes(data.map(typeFromDb));});
      }).subscribe();
    return()=>{supabase.removeChannel(ch1);supabase.removeChannel(ch2);supabase.removeChannel(ch3);};
  },[]);

  // CRUD — DB 저장 + 즉시 로컬 state 반영 (새로고침 불필요)
  const saveTask = async (form) => {
    const id = modal?.task?.id || form.id || gid();
    const task = {...form, id};
    const row = taskToDb(task);
    if(modal?.type==="edit") {
      setTasks(prev => prev.map(t => t.id === id ? task : t)); // 즉시 반영
      await supabase.from("tasks").update(row).eq("id", id);
    } else {
      setTasks(prev => [...prev, task]); // 즉시 반영
      await supabase.from("tasks").insert(row);
    }
    showT("저장됨"); setModal(null);
  };
  const delTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id)); // 즉시 반영
    await supabase.from("tasks").delete().eq("id", id);
    showT("삭제됨"); setModal(null);
  };
  const saveTypes = async (list) => {
    setTypes(list); // 즉시 반영
    await supabase.from("app_types").delete().neq("id","__none__");
    await supabase.from("app_types").insert(list.map(typeToDb));
    showT("유형 저장됨"); setModal(null);
  };
  const bulkUpd = async (ids, ch) => {
    setTasks(prev => prev.map(t => ids.includes(t.id) ? {...t, ...ch} : t)); // 즉시 반영
    for(const id of ids) await supabase.from("tasks").update(ch).eq("id", id);
    showT(`${ids.length}개 수정됨`);
  };

  const reorder = (items) => {const r=[...items];["worker","future","trainer"].forEach(tgt=>{const ix=r.map((e,i)=>e.target===tgt?i:-1).filter(i=>i>=0);ix.slice().sort((a,b)=>r[a].startDate>r[b].startDate?1:-1).forEach((oi,rank)=>{r[oi]={...r[oi],nth:rank+1};});});return r;};

  const saveEdu = async (form) => {
    const reordered = reorder(modal?.type==="edu-edit"
      ? eduItems.map(e=>e.id===modal.item.id?{...e,...form}:e)
      : [...eduItems,{id:gid(),...form}]);
    setEduItems(reordered); // 즉시 반영
    if(modal?.type==="edu-edit") {
      const row = eduToDb(reordered.find(e=>e.id===modal.item.id));
      await supabase.from("edu_items").update(row).eq("id",row.id);
      for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id);
    } else {
      const newItem = reordered.find(e=>!eduItems.find(x=>x.id===e.id));
      if(newItem) await supabase.from("edu_items").insert(eduToDb(newItem));
      for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id);
    }
    showT("교육일정 저장됨"); setModal(null);
  };
  const delEdu = async (id) => {
    const reordered = reorder(eduItems.filter(e=>e.id!==id));
    setEduItems(reordered); // 즉시 반영
    await supabase.from("edu_items").delete().eq("id",id);
    for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id);
    showT("교육일정 삭제됨"); setModal(null);
  };

  const openNew = (date) => setModal({type:"new",initial:{title:"",type:types[0]?.key||"work",startDate:date?fmtD(date):tod(),endDate:date?fmtD(date):tod(),dueTime:"",priority:1,status:"before",note:""}});
  const openEdit = (task) => setModal({type:"edit",task});

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12,background:"#f0f0f0"}}>
      <div style={{fontSize:24}}>📋</div>
      <div style={{fontSize:14,color:"#888"}}>데이터 불러오는 중...</div>
    </div>
  );

  const pcPlanner = (
    <div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:16,alignItems:"start",width:"100%",boxSizing:"border-box"}}>
      <div style={{minWidth:0,width:"100%",overflow:"hidden"}}>
        <CalGrid types={types} tasks={tasks} cur={calDate} setCur={setCalDate}
          onTask={openEdit} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
        {selectedDate&&<DayPanel date={selectedDate} tasks={tasks} types={types} onTask={openEdit} onAdd={()=>openNew(selectedDate)} onClose={()=>setSelectedDate(null)}/>}
      </div>
      <div style={{width:250,flexShrink:0,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",padding:"12px",height:"calc(100vh - 140px)",display:"flex",flexDirection:"column",gap:8,position:"sticky",top:16}}>
        <div style={{display:"flex",gap:4}}>
          {[["focus","포커스"],["list","목록"]].map(([v,l])=><button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:6,borderRadius:8,border:"1px solid #ddd",background:subTab===v?"#1a1a1a":"#fff",color:subTab===v?"#fff":"#666",cursor:"pointer",fontSize:12}}>{l}</button>)}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {subTab==="focus"?<FocusView types={types} tasks={tasks} onTask={openEdit}/>:<TaskList types={types} tasks={tasks} onTask={openEdit} onAdd={()=>openNew()} onBulk={bulkUpd}/>}
        </div>
      </div>
    </div>
  );

  const mobilePlanner = (
    <>
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        {[["calendar","캘린더"],["focus","포커스"],["list","목록"]].map(([v,l])=><button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:7,borderRadius:8,border:"1px solid #ddd",background:subTab===v?"#1a1a1a":"#fff",color:subTab===v?"#fff":"#666",cursor:"pointer",fontSize:12}}>{l}</button>)}
      </div>
      {subTab==="calendar"&&<div><CalGrid types={types} tasks={tasks} cur={calDate} setCur={setCalDate} onTask={openEdit} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>{selectedDate&&<DayPanel date={selectedDate} tasks={tasks} types={types} onTask={openEdit} onAdd={()=>openNew(selectedDate)} onClose={()=>setSelectedDate(null)}/>}</div>}
      {subTab==="focus"&&<FocusView types={types} tasks={tasks} onTask={openEdit}/>}
      {subTab==="list"&&<TaskList types={types} tasks={tasks} onTask={openEdit} onAdd={()=>openNew()} onBulk={bulkUpd}/>}
    </>
  );

  return(
    <div style={{padding:mobile?"0.75rem":"1.5rem",minHeight:"100vh",background:"#f0f0f0",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <h2 style={{margin:0,fontSize:17}}>My Planner</h2>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#e0f7e9",color:"#1D9E75",border:"1px solid #b2dfdb"}}>● 실시간 연동</span>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {mainTab==="planner"&&<button onClick={()=>setModal({type:"settings"})} style={{fontSize:12,padding:"6px 12px",borderRadius:20,border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}>⚙ 유형 관리</button>}
          {mainTab==="planner"&&<button onClick={()=>openNew(selectedDate||undefined)} style={{fontSize:12,padding:"6px 14px",borderRadius:20,border:"none",background:"#1a1a1a",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 새 태스크</button>}
          {mainTab==="edu"&&<button onClick={()=>setModal({type:"edu-new"})} style={{fontSize:12,padding:"6px 14px",borderRadius:20,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 교육일정</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[["planner","📋 플래너"],["edu","🎓 교육일정"]].map(([v,l])=><button key={v} onClick={()=>setMainTab(v)} style={{padding:"8px 18px",borderRadius:10,border:`1.5px solid ${mainTab===v?"#1a1a1a":"#ddd"}`,background:mainTab===v?"#1a1a1a":"transparent",color:mainTab===v?"#fff":"#888",cursor:"pointer",fontWeight:mainTab===v?600:400,fontSize:13}}>{l}</button>)}
      </div>
      {mainTab==="planner"&&(mobile?mobilePlanner:pcPlanner)}
      {mainTab==="edu"&&<EduGrid eduItems={eduItems} onDay={d=>setModal({type:"edu-new",date:fmtD(d)})} onItem={item=>setModal({type:"edu-edit",item})}/>}
      {modal?.type==="settings"&&<Overlay onClose={()=>setModal(null)}><TypeSettings types={types} onSave={saveTypes} onClose={()=>setModal(null)}/></Overlay>}
      {(modal?.type==="new"||modal?.type==="edit")&&<Overlay onClose={()=>setModal(null)}><TaskForm types={types} initial={modal.type==="edit"?modal.task:modal.initial} onSave={saveTask} onClose={()=>setModal(null)} onDelete={modal.type==="edit"?()=>delTask(modal.task.id):null}/></Overlay>}
      {(modal?.type==="edu-new"||modal?.type==="edu-edit")&&<Overlay onClose={()=>setModal(null)}><EduForm eduItems={eduItems} initial={modal.type==="edu-edit"?modal.item:null} onSave={saveEdu} onClose={()=>setModal(null)} onDelete={modal.type==="edu-edit"?()=>delEdu(modal.item.id):null}/></Overlay>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(20,20,20,0.9)",color:"#fff",padding:"8px 20px",borderRadius:24,fontSize:13,zIndex:2000,pointerEvents:"none",whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );
}

export default App;