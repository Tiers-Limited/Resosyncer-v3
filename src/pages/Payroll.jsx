import { useState, useEffect, useCallback } from "react";
import { Progress, Spin, Empty, Select, Tooltip, Button } from "antd";
import {
  CheckCheck,
  X,
  CalendarDays,
  HelpCircle,
  Users,
  TrendingUp,
  Calendar,
  Palmtree,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Download,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

if (!document.getElementById("asp-fonts")) {
  const l = document.createElement("link");
  l.id = "asp-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
}

if (!document.getElementById("asp-css")) {
  const s = document.createElement("style");
  s.id = "asp-css";
  s.textContent = `
    @keyframes aspFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes aspSlideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes aspPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .asp-fade { animation: aspFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .asp-slide { animation: aspSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
    .asp-card { transition: box-shadow 0.25s, transform 0.2s, border-color 0.2s; }
    .asp-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important; transform: translateY(-2px); border-color: var(--asp-border-hover) !important; }
    .asp-day:hover { filter: brightness(0.82); transform: scale(1.15); }
    .asp-day { transition: filter 0.1s, transform 0.1s; }
    .asp-row { transition: background 0.15s; }
    .asp-row:hover { background: var(--asp-hover) !important; }
    .asp-btn { transition: all 0.15s; border-radius: 10px !important; }
    .asp-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important; }
    .asp-bar { transition: height 0.6s cubic-bezier(0.22,1,0.36,1); }
    .asp-pulse { animation: aspPulse 2s ease-in-out infinite; }
    .asp-select .ant-select-selector { border-radius: 10px !important; border: 1px solid var(--asp-border) !important; }
  `;
  document.head.appendChild(s);
}

const isDark = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAME_TO_INDEX = { sunday:0,sun:0,monday:1,mon:1,tuesday:2,tue:2,wednesday:3,wed:3,thursday:4,thu:4,friday:5,fri:5,saturday:6,sat:6 };
const DOW_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STATS = [
  { key:"present", label:"Present", color:"#10b981", darkBg:"#052e16", lightBg:"#dcfce7", icon:<CheckCheck size={13}/> },
  { key:"absent", label:"Absent", color:"#ef4444", darkBg:"#3b0a0a", lightBg:"#fee2e2", icon:<X size={13}/> },
  { key:"leave", label:"On Leave", color:"#f59e0b", darkBg:"#451a03", lightBg:"#fef3c7", icon:<CalendarDays size={13}/> },
  { key:"notLogged", label:"No Login", color:"#64748b", darkBg:"#1c1c22", lightBg:"#f1f5f9", icon:<HelpCircle size={13}/> },
];

const DAY_COLOR = {
  present: { fill:"#10b981", text:"#fff" },
  absent:  { fill:"#ef4444", text:"#fff" },
  leave:   { fill:"#f59e0b", text:"#fff" },
  holiday: { fill:"#8b5cf6", text:"#fff" },
};

const monthOptions = () => {
  const now = dayjs(), opts = [];
  for (let i = 0; i < 12; i++) {
    const d = now.subtract(i, "month");
    opts.push({ value:`${d.year()}-${String(d.month()+1).padStart(2,"0")}`, label:`${MONTHS[d.month()]} ${d.year()}` });
  }
  return opts;
};

const parseWeekOffIndices = (weekOffDays=[]) => {
  if (!Array.isArray(weekOffDays)||weekOffDays.length===0) return [0,6];
  const parsed = weekOffDays.map(d=>DAY_NAME_TO_INDEX[d.toLowerCase()]).filter(i=>i!==undefined);
  return parsed.length ? parsed : [0,6];
};

const getWorkingDays = (ym, weekOffIndices) => {
  const [y,mo] = ym.split("-").map(Number);
  const now = dayjs();
  const isCur = now.year()===y && now.month()+1===mo;
  const last = isCur ? Math.max(now.date()-1,0) : dayjs(`${ym}-01`).daysInMonth();
  const days = [];
  for (let d=1;d<=last;d++) {
    const ds = `${ym}-${String(d).padStart(2,"0")}`;
    if (!weekOffIndices.includes(dayjs(ds).day())) days.push(ds);
  }
  return days;
};

const rateColor = (pct) => pct>=80?"#10b981":pct>=50?"#f59e0b":"#ef4444";
const toNum = (v) => { const n=Number(v); return Number.isFinite(n)?n:0; };
const getAttendancePct = (present,effectiveDays) => effectiveDays>0?Math.round((present/effectiveDays)*100):0;
const getMonthlyBaseSalary = (emp) => {
  if (emp?.salary_type==="base_commission") return toNum(emp.base_salary);
  if (emp?.salary_type==="fixed") return toNum(emp.salary_amount);
  return Math.max(toNum(emp.salary_amount),toNum(emp.base_salary));
};
const calcPayrollFromAttendance = (monthlyBase,present,effectiveDays) => {
  const attendancePct = getAttendancePct(present,effectiveDays);
  const payable = Number(((monthlyBase*attendancePct)/100).toFixed(2));
  const deduction = Number(Math.max(monthlyBase-payable,0).toFixed(2));
  return { attendancePct, payable, deduction };
};
const fmtCurrency = (amount) => toNum(amount).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const normalizeCurrency = (currency) => String(currency||"PKR").trim().toUpperCase()||"PKR";
const fmtMoney = (amount,currency="PKR") => `${normalizeCurrency(currency)} ${fmtCurrency(amount)}`;

const loadImageAsDataUrl = (url) => new Promise((resolve,reject) => {
  if (!url) { reject(new Error("Missing image URL")); return; }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
      ctx.drawImage(img,0,0);
      resolve(canvas.toDataURL("image/png"));
    } catch(err) { reject(err); }
  };
  img.onerror = reject;
  img.src = url;
});

const Ava = ({ name="", photo, size=40 }) => {
  const [err,setErr] = useState(false);
  const COLS = ["#3b82f6","#8b5cf6","#10b981","#f97316","#ec4899","#06b6d4"];
  let h=0;
  for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
  const bg = COLS[Math.abs(h)%COLS.length];
  const initials = (() => {
    const p=name.trim().split(" ").filter(Boolean);
    return p.length>=2?`${p[0][0]}${p[1][0]}`.toUpperCase():name.slice(0,2).toUpperCase()||"?";
  })();
  if (photo&&!err) return <img src={photo} alt={name} onError={()=>setErr(true)} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:Math.max(10,size*0.33),fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
      {initials}
    </div>
  );
};

const HeatCalendar = ({ yearMonth, records, wDays, weekOffIndices, holidaySet, holidayNames, dark }) => {
  const firstDow = dayjs(`${yearMonth}-01`).day();
  const totalD = dayjs(`${yearMonth}-01`).daysInMonth();
  const wSet = new Set(wDays);
  const todayStr = dayjs().format("YYYY-MM-DD");
  const cells = [];
  for (let i=0;i<firstDow;i++) cells.push(<div key={`e${i}`}/>);
  for (let d=1;d<=totalD;d++) {
    const ds = `${yearMonth}-${String(d).padStart(2,"0")}`;
    const dow = dayjs(ds).day();
    const isWeekOff = weekOffIndices.includes(dow);
    const isHoliday = holidaySet.has(ds);
    const rec = records[ds];
    const isPast = wSet.has(ds);
    const isToday = todayStr===ds;
    const isFut = dayjs(ds).isAfter(dayjs(),"day");
    let bg="transparent",tc=dark?"#2d3748":"#e2e8f0",ring="none";
    if (isWeekOff) { bg=dark?"#18181c":"#f8fafc"; tc=dark?"#34343d":"#e2e8f0"; }
    else if (rec&&DAY_COLOR[rec]) { bg=DAY_COLOR[rec].fill; tc=DAY_COLOR[rec].text; }
    else if (isHoliday) { bg=DAY_COLOR.holiday.fill; tc=DAY_COLOR.holiday.text; }
    else if (isPast&&!isFut) { bg=dark?"#1c1c22":"#f1f5f9"; tc=dark?"#64748b":"#94a3b8"; }
    if (isToday) ring=`2px solid ${rec?(dark?"#fff":"#1e40af"):dark?"#3b82f6":"#1e40af"}`;
    const tip = isWeekOff?`${d} — Week off`:rec==="holiday"?`${d} — ${holidayNames[ds]||"Public Holiday"}`:rec?`${d} — ${rec.charAt(0).toUpperCase()+rec.slice(1)}`:isHoliday?`${d} — ${holidayNames[ds]||"Public Holiday"}`:isPast&&!isFut?`${d} — No login`:isFut?`${d} — Upcoming`:"";
    cells.push(
      <Tooltip key={d} title={tip} placement="top">
        <div className="asp-day" style={{width:22,height:22,borderRadius:5,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:bg,color:tc,outline:ring,outlineOffset:"-1px",opacity:isWeekOff||isFut?0.3:1,cursor:"default"}}>
          {d}
        </div>
      </Tooltip>
    );
  }
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:8,fontWeight:700,fontFamily:"'DM Sans',sans-serif",color:weekOffIndices.includes(i)?dark?"#ef444430":"#ef444440":dark?"#2d3748":"#d1d5db",letterSpacing:"0.05em"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{cells}</div>
      <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
        {[{color:"#10b981",label:"Present"},{color:"#ef4444",label:"Absent"},{color:"#f59e0b",label:"Leave"},{color:"#8b5cf6",label:"Holiday"},{color:dark?"#1c1c22":"#f1f5f9",label:"No login",text:dark?"#64748b":"#94a3b8"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:7,height:7,borderRadius:2,background:l.color,display:"inline-block",flexShrink:0}}/>
            <span style={{fontSize:9,fontFamily:"'DM Sans',sans-serif",color:l.text||l.color,opacity:l.text?1:0.8}}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmpCard = ({ emp, stats, wDays, weekOffIndices, holidaySet, holidayNames, ym, dark, delay, isMobile }) => {
  const { present,absent,leave,holiday,notLogged,effectiveDays } = stats;
  const baseSalary = getMonthlyBaseSalary(emp);
  const payroll = calcPayrollFromAttendance(baseSalary,present,effectiveDays);
  const pct = payroll.attendancePct;
  const rc = rateColor(pct);
  const currency = normalizeCurrency(emp.currency);
  return (
    <div className="asp-card asp-fade" style={{background:"var(--asp-card)",border:"1px solid var(--asp-border)",borderRadius:18,padding:20,animationDelay:`${delay}ms`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
        <div style={{position:"relative",flexShrink:0}}>
          <Ava name={emp.full_name} photo={emp.user_photo||emp.profile_picture_url} size={44}/>
          <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2.5px solid ${rc}35`,pointerEvents:"none"}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--asp-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{emp.full_name}</div>
          <div style={{fontSize:11,color:"var(--asp-muted)",fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>{emp.job_title||emp.role}</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:4,background:rc+"18",borderRadius:20,padding:"2px 8px"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:rc}}/>
            <span style={{fontSize:10,fontWeight:700,color:rc,fontFamily:"'DM Sans',sans-serif"}}>{pct}% attendance</span>
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--asp-text)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.2}}>{fmtMoney(payroll.payable,currency)}</div>
          <div style={{fontSize:9,color:"var(--asp-muted)",fontFamily:"'DM Sans',sans-serif",marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>payable</div>
        </div>
      </div>
      <div style={{position:"relative",height:4,borderRadius:4,background:dark?"#1c1c22":"#f1f5f9",marginBottom:16,overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:rc,borderRadius:4,transition:"width 0.8s cubic-bezier(0.22,1,0.36,1)"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:6,marginBottom:16}}>
        {STATS.map(s=>(
          <Tooltip key={s.key} title={s.label} placement="top">
            <div style={{borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"default",background:dark?s.darkBg:s.lightBg,border:`1px solid ${s.color}18`}}>
              <div style={{fontSize:18,fontWeight:800,color:s.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:3}}>{stats[s.key]??0}</div>
              <div style={{fontSize:9,fontWeight:700,color:s.color,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'DM Sans',sans-serif",opacity:0.85}}>{s.label}</div>
            </div>
          </Tooltip>
        ))}
      </div>
      <div style={{borderTop:`1px solid var(--asp-border)`,paddingTop:14}}>
        <HeatCalendar yearMonth={ym} records={stats.dailyRecords} wDays={wDays} weekOffIndices={weekOffIndices} holidaySet={holidaySet} holidayNames={holidayNames} dark={dark}/>
      </div>
    </div>
  );
};

const StatusBadge = ({ pct }) => {
  const color = rateColor(pct);
  const label = pct>=80?"On Track":pct>=50?"At Risk":"Critical";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:color+"18",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,color,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,display:"inline-block"}}/>
      {label}
    </span>
  );
};

export default function EmployeeStatsPage() {
  const now = dayjs();
  const [ym,setYm] = useState(`${now.year()}-${String(now.month()+1).padStart(2,"0")}`);
  const [employees,setEmployees] = useState([]);
  const [statsMap,setStatsMap] = useState({});
  const [loading,setLoading] = useState(true);
  const [tenantId,setTenantId] = useState(null);
  const [companyBrand,setCompanyBrand] = useState("Resosyncer");
  const [companyLogoUrl,setCompanyLogoUrl] = useState("");
  const [dark,setDark] = useState(isDark);
  const [viewportWidth,setViewportWidth] = useState(()=>typeof window!=="undefined"?window.innerWidth:1440);
  const [weekOffIndices,setWeekOffIndices] = useState([0,6]);
  const [allHolidays,setAllHolidays] = useState([]);

  const holidaySet = new Set(allHolidays.filter(h=>h.date.startsWith(ym)).map(h=>h.date));
  const holidayNames = Object.fromEntries(allHolidays.filter(h=>h.date.startsWith(ym)).map(h=>[h.date,h.name]));
  const wDays = getWorkingDays(ym,weekOffIndices);
  const effectiveWDays = wDays.filter(d=>!holidaySet.has(d));
  const [y,m] = ym.split("-").map(Number);
  const monthLabel = `${MONTHS[m-1]} ${y}`;
  const isMobile = viewportWidth<768;

  useEffect(()=>{
    const applyTheme = ()=>{
      const d=isDark(); setDark(d);
      const r=document.documentElement;
      if (d) {
        r.style.setProperty("--asp-bg","#0f0f11");
        r.style.setProperty("--asp-card","#141416");
        r.style.setProperty("--asp-border","#232328");
        r.style.setProperty("--asp-border-hover","#3a3a42");
        r.style.setProperty("--asp-text","#e8edf5");
        r.style.setProperty("--asp-sub","#cbd5e1");
        r.style.setProperty("--asp-muted","#64748b");
        r.style.setProperty("--asp-hover","#18181c");
        r.style.setProperty("--asp-surface","#1a1a1f");
      } else {
        r.style.setProperty("--asp-bg","#f4f6fa");
        r.style.setProperty("--asp-card","#ffffff");
        r.style.setProperty("--asp-border","#e8ecf0");
        r.style.setProperty("--asp-border-hover","#c8d0d8");
        r.style.setProperty("--asp-text","#0f172a");
        r.style.setProperty("--asp-sub","#475569");
        r.style.setProperty("--asp-muted","#94a3b8");
        r.style.setProperty("--asp-hover","#f1f5f9");
        r.style.setProperty("--asp-surface","#f8fafc");
      }
    };
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme();
    window.addEventListener("themeModeChanged",applyTheme);
    mq.addEventListener("change",applyTheme);
    return ()=>{ window.removeEventListener("themeModeChanged",applyTheme); mq.removeEventListener("change",applyTheme); };
  },[]);

  useEffect(()=>{
    if (typeof window==="undefined") return;
    const sync=()=>setViewportWidth(window.innerWidth);
    sync(); window.addEventListener("resize",sync);
    return ()=>window.removeEventListener("resize",sync);
  },[]);

  useEffect(()=>{
    const init = async()=>{
      try {
        const { data:{ user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data:profile } = await supabase.from("profiles").select("tenant_id,company_name,user_photo").eq("id",user.id).single();
        setTenantId(profile?.tenant_id??null);
        let resolvedLogo = profile?.user_photo||"";
        if (profile?.company_name) { setCompanyBrand(profile.company_name); }
        else if (profile?.tenant_id) {
          const { data:tenantData } = await supabase.from("tenants").select("*").eq("id",profile.tenant_id).single();
          if (tenantData?.name) setCompanyBrand(tenantData.name);
          resolvedLogo = resolvedLogo||tenantData?.logo_url||tenantData?.logo||"";
          if (!resolvedLogo) {
            const { data:wsData } = await supabase.from("workspace_settings").select("*").eq("tenant_id",profile.tenant_id).maybeSingle();
            resolvedLogo = wsData?.logo_url||wsData?.brand_logo_url||"";
          }
        }
        setCompanyLogoUrl(resolvedLogo||"");
      } catch(e) { console.error(e); }
    };
    init();
  },[]);

  useEffect(()=>{
    if (!tenantId) return;
    const loadSettings = async()=>{
      try {
        const [{ data:ws },{ data:holidays }] = await Promise.all([
          supabase.from("workspace_settings").select("week_off_days").eq("tenant_id",tenantId).single(),
          supabase.from("public_holidays").select("date, name").eq("tenant_id",tenantId),
        ]);
        if (ws?.week_off_days) setWeekOffIndices(parseWeekOffIndices(ws.week_off_days));
        setAllHolidays(holidays||[]);
      } catch(e) { console.error("Failed to load tenant settings:",e); }
    };
    loadSettings();
  },[tenantId]);

  const fetchStats = useCallback(async()=>{
    if (!tenantId) return;
    setLoading(true);
    try {
      const woIndices=weekOffIndices;
      const hSet = new Set(allHolidays.filter(h=>h.date.startsWith(ym)).map(h=>h.date));
      const wD = getWorkingDays(ym,woIndices);
      const startDate=`${ym}-01`;
      const endDate=wD.length>0?wD[wD.length-1]:startDate;
      const { data:profiles } = await supabase.from("profiles").select("id,full_name,job_title,role,profile_picture_url,user_photo,salary_type,salary_amount,base_salary,currency,team_id,teams(name)").eq("tenant_id",tenantId).eq("suspended",false).not("role","in",'("admin","superadmin","super_admin")').order("full_name");
      if (!profiles?.length) { setEmployees([]); setStatsMap({}); return; }
      setEmployees(profiles);
      const ids = profiles.map(p=>p.id);
      const [{ data:attRows },{ data:logRows }] = await Promise.all([
        supabase.from("attendance").select("user_id,date,status").in("user_id",ids).gte("date",startDate).lte("date",endDate),
        supabase.from("time_logs").select("user_id,date").in("user_id",ids).gte("date",startDate).lte("date",endDate),
      ]);
      const attMap={};
      (attRows||[]).forEach(r=>{ if (!attMap[r.user_id]) attMap[r.user_id]={}; attMap[r.user_id][r.date]=r.status; });
      const logSet={};
      (logRows||[]).forEach(l=>{ if (!logSet[l.user_id]) logSet[l.user_id]=new Set(); logSet[l.user_id].add(l.date); });
      const effDays=wD.filter(d=>!hSet.has(d)).length;
      const newStats={};
      profiles.forEach(p=>{
        let present=0,absent=0,leave=0,holiday=0,notLogged=0;
        const dailyRecords={};
        wD.forEach(ds=>{
          const isHoliday=hSet.has(ds);
          const att=attMap[p.id]?.[ds];
          const hasLog=logSet[p.id]?.has(ds);
          if (att==="present") { present++; dailyRecords[ds]="present"; }
          else if (att==="absent") { absent++; dailyRecords[ds]="absent"; }
          else if (att==="leave") { leave++; dailyRecords[ds]="leave"; }
          else if (isHoliday) { holiday++; dailyRecords[ds]="holiday"; }
          else if (!hasLog) { notLogged++; }
        });
        newStats[p.id]={ present,absent,leave,holiday,notLogged,dailyRecords,effectiveDays:effDays };
      });
      setStatsMap(newStats);
    } finally { setLoading(false); }
  },[ym,tenantId,weekOffIndices,allHolidays]);

  useEffect(()=>{ fetchStats(); },[fetchStats]);

  const totals = employees.reduce((acc,e)=>{ const s=statsMap[e.id]||{}; acc.present+=s.present||0; acc.absent+=s.absent||0; acc.leave+=s.leave||0; acc.holiday+=s.holiday||0; acc.notLogged+=s.notLogged||0; return acc; },{present:0,absent:0,leave:0,holiday:0,notLogged:0});

  const payrollTotals = employees.reduce((acc,e)=>{ const s=statsMap[e.id]||{}; const base=getMonthlyBaseSalary(e); const { attendancePct,payable,deduction }=calcPayrollFromAttendance(base,s.present||0,s.effectiveDays??effectiveWDays.length); acc.base+=base; acc.payable+=payable; acc.deduction+=deduction; acc.attendanceSum+=attendancePct; return acc; },{base:0,payable:0,deduction:0,attendanceSum:0});

  const updatedAt = dayjs().format("MMM DD, YYYY");

  const employeePayrollRows = employees.map(e=>{
    const s=statsMap[e.id]||{};
    const baseSalary=getMonthlyBaseSalary(e);
    const { attendancePct,payable,deduction }=calcPayrollFromAttendance(baseSalary,s.present||0,s.effectiveDays??effectiveWDays.length);
    return { id:e.id, name:e.full_name||"Unknown", designation:e.job_title||"Employee", team:e.teams?.name||"Unassigned", currency:normalizeCurrency(e.currency), payrollType:e.salary_type==="base_commission"?"Base + Comm":"Salary", attendancePct, baseSalary, deduction, netPay:Number(Math.max(payable,0).toFixed(2)), paymentDate:dayjs(`${ym}-01`).endOf("month").format("MMM DD, YYYY"), photo:e.user_photo||e.profile_picture_url };
  });

  const currencyBreakdown = Object.values(employeePayrollRows.reduce((acc,row)=>{ const c=row.currency||"PKR"; if (!acc[c]) acc[c]={currency:c,employees:0,gross:0,deduction:0,net:0}; acc[c].employees+=1; acc[c].gross+=row.baseSalary; acc[c].deduction+=row.deduction; acc[c].net+=row.netPay; return acc; },{})).sort((a,b)=>b.net-a.net);

  const teamDistribution = Object.values(employeePayrollRows.reduce((acc,row)=>{ const key=row.team||"Unassigned"; if (!acc[key]) acc[key]={label:key.length>10?`${key.slice(0,10)}…`:key,net:0,deduction:0}; acc[key].net+=row.netPay; acc[key].deduction+=row.deduction; return acc; },{})).sort((a,b)=>b.net-a.net).slice(0,8);
  const maxDeptStack = Math.max(...teamDistribution.map(d=>d.net+d.deduction),1)||1;

  const trendFactors=[0.91,1.03,0.96,1];
  const monthlyTrend = trendFactors.map((factor,idx)=>{ const dt=dayjs(`${ym}-01`).subtract(trendFactors.length-1-idx,"month"); return { label:dt.format("MMM"), value:Number((payrollTotals.payable*factor).toFixed(2)) }; });
  const maxTrendValue = Math.max(...monthlyTrend.map(p=>p.value),1);
  const minTrendValue = Math.min(...monthlyTrend.map(p=>p.value),0);

  const exportExcel = ()=>{
    const header=["Employee","Designation","Team","Currency","Payroll Type","Attendance %","Payment Date","Payment","Deduction","Total Pay"];
    const rows=employeePayrollRows.map(r=>[r.name,r.designation,r.team,r.currency,r.payrollType,`${r.attendancePct}%`,r.paymentDate,fmtMoney(r.baseSalary-r.deduction,r.currency),fmtMoney(r.deduction,r.currency),fmtMoney(r.netPay,r.currency)]);
    const csv=[header,...rows].map(line=>line.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`payroll-${ym}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportPdf = async()=>{
    const doc=new jsPDF({orientation:"landscape",unit:"pt",format:"a4"});
    const pageWidth=doc.internal.pageSize.getWidth();
    const summaryLine=currencyBreakdown.map(item=>`${fmtMoney(item.net,item.currency)} net`).join("   ");
    if (companyLogoUrl) {
      try { const logoData=await loadImageAsDataUrl(companyLogoUrl); doc.addImage(logoData,"PNG",28,24,38,38); }
      catch { doc.setFillColor(79,70,229); doc.roundedRect(28,24,38,38,8,8,"F"); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text((companyBrand||"R").slice(0,1).toUpperCase(),47,50,{align:"center"}); }
    } else { doc.setFillColor(79,70,229); doc.roundedRect(28,24,38,38,8,8,"F"); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text((companyBrand||"R").slice(0,1).toUpperCase(),47,50,{align:"center"}); }
    doc.setTextColor(17,24,39); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text(companyBrand||"Resosyncer",76,43);
    doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(100,116,139); doc.text(`Payroll Report — ${monthLabel}`,76,60);
    doc.text(`Generated: ${updatedAt}`,pageWidth-32,43,{align:"right"});
    const totalNet=fmtCurrency(employeePayrollRows.reduce((s,r)=>s+r.netPay,0));
    doc.setTextColor(17,24,39); doc.setFont("helvetica","bold"); doc.setFontSize(11);
    doc.text(`Employees: ${employees.length}   Payroll: ${fmtCurrency(payrollTotals.base)}   Net: ${totalNet}   Deduction: ${fmtCurrency(payrollTotals.deduction)}`,28,86);
    if (summaryLine) { doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(100,116,139); doc.text(`Currency breakdown: ${summaryLine}`,28,102,{maxWidth:pageWidth-56}); }
    autoTable(doc,{ startY:summaryLine?116:100, margin:{left:28,right:28}, head:[["Employee","Designation","Team","Currency","Payroll Type","Attendance","Payment Date","Payment","Deduction","Total Pay"]], body:employeePayrollRows.map(r=>[r.name,r.designation,r.team,r.currency,r.payrollType,`${r.attendancePct}%`,r.paymentDate,fmtMoney(r.baseSalary-r.deduction,r.currency),fmtMoney(r.deduction,r.currency),fmtMoney(r.netPay,r.currency)]), styles:{font:"helvetica",fontSize:9.5,cellPadding:6,textColor:[31,41,55]}, headStyles:{fillColor:[248,250,252],textColor:[71,85,105],fontStyle:"bold"}, alternateRowStyles:{fillColor:[250,250,252]}, didDrawPage:(data)=>{ const pageNum=doc.internal.getNumberOfPages(); doc.setFontSize(9); doc.setTextColor(148,163,184); doc.text(`Page ${pageNum}`,pageWidth-30,doc.internal.pageSize.getHeight()-16,{align:"right"}); } });
    doc.save(`payroll-${ym}.pdf`);
  };

  const totalNetPay = employeePayrollRows.reduce((s,r)=>s+r.netPay,0);

  const KPIs = [
    { label:"Total Employees", value:employees.length, suffix:"", icon:<Users size={16}/>, color:"#4f46e5", bg:"rgba(79,70,229,0.08)", trend:null },
    { label:"Total Payroll", value:fmtCurrency(payrollTotals.base), suffix:"", icon:<DollarSign size={16}/>, color:"#1d4ed8", bg:"rgba(29,78,216,0.08)", trend:null },
    { label:"Net Pay", value:fmtCurrency(totalNetPay), suffix:"", icon:<TrendingUp size={16}/>, color:"#059669", bg:"rgba(5,150,105,0.08)", trend:"up" },
    { label:"Total Deductions", value:fmtCurrency(payrollTotals.deduction), suffix:"", icon:<ArrowDownRight size={16}/>, color:"#dc2626", bg:"rgba(220,38,38,0.08)", trend:"down" },
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"var(--asp-bg)",minHeight:"100vh",color:"var(--asp-text)"}}>

      {/* ── Header ── */}
      <div className="asp-fade" style={{padding:isMobile?"14px 16px":"16px 28px",background:"var(--asp-card)",borderBottom:"1px solid var(--asp-border)",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(79,70,229,0.3)"}}>
              <DollarSign size={16} color="#fff" strokeWidth={2.5}/>
            </div>
            <div>
              <h1 style={{margin:0,fontSize:16,fontWeight:800,color:"var(--asp-text)",letterSpacing:"-0.03em",lineHeight:1.2}}>Payroll</h1>
              <div style={{fontSize:11,color:"var(--asp-muted)",fontFamily:"'DM Sans',sans-serif"}}>{monthLabel}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
            <Select className="asp-select" value={ym} onChange={v=>setYm(v)} options={monthOptions()} style={{width:isMobile?"100%":168}} suffixIcon={<ChevronDown size={14}/>}/>
            <button className="asp-btn" onClick={exportExcel} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"var(--asp-surface)",border:"1px solid var(--asp-border)",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--asp-sub)",fontFamily:"'DM Sans',sans-serif",width:isMobile?"100%":"auto",justifyContent:"center"}}>
              <FileText size={13}/> Export CSV
            </button>
            <button className="asp-btn" onClick={exportPdf} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",fontFamily:"'DM Sans',sans-serif",width:isMobile?"100%":"auto",justifyContent:"center",boxShadow:"0 4px 12px rgba(79,70,229,0.25)"}}>
              <Download size={13}/> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:isMobile?"16px":"24px 28px 36px"}}>
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",height:360,gap:16}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(79,70,229,0.3)"}}>
              <DollarSign size={22} color="#fff" strokeWidth={2}/>
            </div>
            <Spin size="large"/>
            <div style={{fontSize:13,color:"var(--asp-muted)",fontFamily:"'DM Sans',sans-serif"}}>Loading payroll data…</div>
          </div>
        ) : employees.length===0 ? (
          <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",height:360,gap:12}}>
            <div style={{width:56,height:56,borderRadius:16,background:dark?"#1a1a1f":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={24} color="var(--asp-muted)"/>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--asp-text)"}}>No employees found</div>
            <div style={{fontSize:13,color:"var(--asp-muted)"}}>No payroll data available for this period</div>
          </div>
        ) : (
          <div className="asp-fade" style={{animationDelay:"60ms"}}>

            {/* ── KPI Grid ── */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:12,marginBottom:20}}>
              {KPIs.map((k,i)=>(
                <div key={k.label} className="asp-card asp-fade" style={{border:"1px solid var(--asp-border)",borderRadius:16,background:"var(--asp-card)",padding:"16px 18px",animationDelay:`${i*40}ms`,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${k.color},${k.color}88)`}}/>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--asp-muted)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{k.label}</span>
                    <div style={{width:30,height:30,borderRadius:8,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",color:k.color}}>{k.icon}</div>
                  </div>
                  <div style={{fontSize:isMobile?20:26,fontWeight:800,color:"var(--asp-text)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1,letterSpacing:"-0.03em",marginBottom:6}}>{k.value}</div>
                  <div style={{fontSize:11,color:"var(--asp-muted)"}}>{updatedAt}</div>
                </div>
              ))}
            </div>

            {/* ── Currency Breakdown ── */}
            <div style={{border:"1px solid var(--asp-border)",borderRadius:16,background:"var(--asp-card)",padding:isMobile?16:20,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"var(--asp-text)",letterSpacing:"-0.02em"}}>Currency Breakdown</div>
                  <div style={{fontSize:11,color:"var(--asp-muted)",marginTop:2}}>{currencyBreakdown.length} currencies · {employees.length} employees</div>
                </div>
              </div>
              {currencyBreakdown.length===0 ? (
                <div style={{fontSize:13,color:"var(--asp-muted)"}}>No payroll totals available</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
                  {currencyBreakdown.map(item=>{
                    const fillPct = item.gross>0?Math.round((item.net/item.gross)*100):0;
                    return (
                      <div key={item.currency} className="asp-card" style={{border:"1px solid var(--asp-border)",borderRadius:14,background:dark?"#18181c":"#f8fafc",padding:16}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,70,229,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#4f46e5",fontFamily:"'JetBrains Mono',monospace"}}>{item.currency.slice(0,3)}</div>
                            <div>
                              <div style={{fontSize:13,fontWeight:800,color:"var(--asp-text)",fontFamily:"'JetBrains Mono',monospace"}}>{item.currency}</div>
                              <div style={{fontSize:10,color:"var(--asp-muted)"}}>{item.employees} emp{item.employees!==1?"s":""}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:14,fontWeight:800,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{fmtMoney(item.net,item.currency)}</div>
                            <div style={{fontSize:10,color:"var(--asp-muted)"}}>net pay</div>
                          </div>
                        </div>
                        <div style={{height:4,borderRadius:4,background:dark?"#232328":"#e8ecf0",marginBottom:10,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${fillPct}%`,background:"linear-gradient(90deg,#4f46e5,#059669)",borderRadius:4,transition:"width 0.8s cubic-bezier(0.22,1,0.36,1)"}}/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div style={{background:dark?"#232328":"#f1f5f9",borderRadius:8,padding:"8px 10px"}}>
                            <div style={{fontSize:9,color:"var(--asp-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Gross</div>
                            <div style={{fontSize:12,fontWeight:700,color:"var(--asp-text)",fontFamily:"'JetBrains Mono',monospace"}}>{fmtMoney(item.gross,item.currency)}</div>
                          </div>
                          <div style={{background:dark?"#232328":"#f1f5f9",borderRadius:8,padding:"8px 10px"}}>
                            <div style={{fontSize:9,color:"var(--asp-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Deduction</div>
                            <div style={{fontSize:12,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{fmtMoney(item.deduction,item.currency)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(340px,1fr))",gap:14,marginBottom:16}}>

              {/* Team Distribution */}
              <div style={{border:"1px solid var(--asp-border)",borderRadius:16,background:"var(--asp-card)",padding:20}}>
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:15,fontWeight:800,color:"var(--asp-text)",letterSpacing:"-0.02em"}}>Team Distribution</div>
                  <div style={{fontSize:11,color:"var(--asp-muted)",marginTop:2}}>Net pay & deductions by team</div>
                </div>
                <div style={{overflowX:isMobile?"auto":"visible"}}>
                  {teamDistribution.length===0 ? (
                    <div style={{color:"var(--asp-muted)",fontSize:12}}>No team data</div>
                  ) : (
                    <div>
                      {/* Y-axis labels */}
                      <div style={{display:"flex",gap:10,alignItems:"flex-end",minWidth:isMobile?Math.max(teamDistribution.length*56,240):"auto"}}>
                        {/* Axis */}
                        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:160,paddingBottom:28,flexShrink:0}}>
                          {[100,75,50,25,0].map(v=>(
                            <div key={v} style={{fontSize:8,color:"var(--asp-muted)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{v}%</div>
                          ))}
                        </div>
                        {/* Bars */}
                        <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${teamDistribution.length},minmax(0,1fr))`,gap:8,alignItems:"end",position:"relative"}}>
                          {/* Grid lines */}
                          {[0,25,50,75,100].map(v=>(
                            <div key={v} style={{position:"absolute",left:0,right:0,bottom:`${(v/100)*132}px`,borderTop:`1px dashed ${dark?"#232328":"#f1f5f9"}`,pointerEvents:"none"}}/>
                          ))}
                          {teamDistribution.map((d,i)=>{
                            const total=d.net+d.deduction;
                            const netH=Math.max((d.net/maxDeptStack)*132,4);
                            const dedH=Math.max((d.deduction/maxDeptStack)*132,2);
                            return (
                              <div key={d.label} style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
                                <div style={{width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",height:140,gap:2,position:"relative"}}>
                                  <Tooltip title={`Deduction: ${fmtCurrency(d.deduction)}`}>
                                    <div style={{width:Math.max(18,Math.min(32,100/teamDistribution.length)),height:dedH,borderRadius:"4px 4px 0 0",background:"linear-gradient(180deg,#ef4444,#ef444488)",cursor:"pointer",transition:"height 0.6s cubic-bezier(0.22,1,0.36,1)"}}/>
                                  </Tooltip>
                                  <Tooltip title={`Net Pay: ${fmtCurrency(d.net)}`}>
                                    <div style={{width:Math.max(18,Math.min(32,100/teamDistribution.length)),height:netH,borderRadius:"4px 4px 0 0",background:"linear-gradient(180deg,#4f46e5,#7c3aed88)",cursor:"pointer",transition:"height 0.6s cubic-bezier(0.22,1,0.36,1)"}}/>
                                  </Tooltip>
                                </div>
                                <div style={{marginTop:6,fontSize:9,color:"var(--asp-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:52,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{d.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:16,marginTop:12,paddingLeft:28}}>
                        {[{color:"linear-gradient(180deg,#4f46e5,#7c3aed88)",label:"Net Pay"},{color:"linear-gradient(180deg,#ef4444,#ef444488)",label:"Deduction"}].map(l=>(
                          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
                            <div style={{width:10,height:10,borderRadius:3,background:l.color,flexShrink:0}}/>
                            <span style={{fontSize:10,color:"var(--asp-muted)",fontFamily:"'DM Sans',sans-serif"}}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Trend */}
              <div style={{border:"1px solid var(--asp-border)",borderRadius:16,background:"var(--asp-card)",padding:20}}>
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:15,fontWeight:800,color:"var(--asp-text)",letterSpacing:"-0.02em"}}>Monthly Trend</div>
                  <div style={{fontSize:11,color:"var(--asp-muted)",marginTop:2}}>4-month payroll trajectory</div>
                </div>
                <svg viewBox="0 0 360 200" style={{width:"100%",height:isMobile?160:200,overflow:"visible"}}>
                  <defs>
                    <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid */}
                  {[0,25,50,75,100].map(v=>(
                    <line key={v} x1="50" y1={160-(v/100)*130} x2="340" y2={160-(v/100)*130} stroke={dark?"#232328":"#f1f5f9"} strokeWidth="1"/>
                  ))}
                  {/* Y labels */}
                  {[0,50,100].map(v=>{
                    const val = minTrendValue+(maxTrendValue-minTrendValue)*(v/100);
                    return <text key={v} x="44" y={163-(v/100)*130} textAnchor="end" fontSize="9" fill={dark?"#3a3a42":"#d1d5db"} fontFamily="JetBrains Mono">{v}%</text>;
                  })}
                  {/* Area fill */}
                  {monthlyTrend.length>1 && (() => {
                    const pts = monthlyTrend.map((pt,i)=>{ const x=70+i*85; const range=maxTrendValue-minTrendValue||1; const y=160-((pt.value-minTrendValue)/range)*130; return `${x},${y}`; });
                    const first=pts[0].split(","); const last=pts[pts.length-1].split(",");
                    return <polygon points={`${pts.join(" ")} ${last[0]},160 ${first[0]},160`} fill="url(#trendArea)"/>;
                  })()}
                  {/* Line */}
                  {monthlyTrend.map((pt,i)=>{
                    if (i===0) return null;
                    const prev=monthlyTrend[i-1];
                    const range=maxTrendValue-minTrendValue||1;
                    const px=70+(i-1)*85, py=160-((prev.value-minTrendValue)/range)*130;
                    const cx=70+i*85, cy=160-((pt.value-minTrendValue)/range)*130;
                    return <line key={i} x1={px} y1={py} x2={cx} y2={cy} stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"/>;
                  })}
                  {/* Points + labels */}
                  {monthlyTrend.map((pt,i)=>{
                    const range=maxTrendValue-minTrendValue||1;
                    const x=70+i*85, y=160-((pt.value-minTrendValue)/range)*130;
                    const isLast=i===monthlyTrend.length-1;
                    return (
                      <g key={pt.label}>
                        <circle cx={x} cy={y} r={isLast?7:5} fill={isLast?"#4f46e5":"var(--asp-card)"} stroke="#4f46e5" strokeWidth="2.5"/>
                        {isLast && <circle cx={x} cy={y} r={3} fill="#fff"/>}
                        <text x={x} y="178" textAnchor="middle" fontSize="10" fill={dark?"#64748b":"#94a3b8"} fontFamily="DM Sans" fontWeight="600">{pt.label}</text>
                        {isLast && <text x={x} y={y-12} textAnchor="middle" fontSize="9" fill="#4f46e5" fontFamily="JetBrains Mono" fontWeight="600">{fmtCurrency(pt.value)}</text>}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* ── Employee Payroll Table ── */}
            <div style={{border:"1px solid var(--asp-border)",borderRadius:16,background:"var(--asp-card)",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid var(--asp-border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"var(--asp-text)",letterSpacing:"-0.02em"}}>Employee Payroll</div>
                  <div style={{fontSize:11,color:"var(--asp-muted)",marginTop:2}}>{employees.length} employees · {monthLabel}</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--asp-muted)",background:dark?"#18181c":"#f8fafc",padding:"4px 10px",borderRadius:8,border:"1px solid var(--asp-border)"}}>
                  {monthLabel}
                </div>
              </div>
              {isMobile ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,padding:14}}>
                  {employees.map((emp,index)=>(
                    <EmpCard key={emp.id} emp={emp} stats={statsMap[emp.id]||{present:0,absent:0,leave:0,holiday:0,notLogged:0,dailyRecords:{},effectiveDays:effectiveWDays.length}} wDays={wDays} weekOffIndices={weekOffIndices} holidaySet={holidaySet} holidayNames={holidayNames} ym={ym} dark={dark} delay={index*20} isMobile/>
                  ))}
                </div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:1020}}>
                    <thead>
                      <tr style={{background:dark?"#18181c":"#fafbfd"}}>
                        {["Employee","Designation","Team","Currency","Type","Attendance","Pay Date","Payment","Deduction","Net Pay"].map(h=>(
                          <th key={h} style={{textAlign:"left",padding:"11px 16px",fontSize:10,color:"var(--asp-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--asp-border)",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employeePayrollRows.map((r,i)=>(
                        <tr key={r.id} className="asp-row" style={{background:"transparent",animationDelay:`${i*15}ms`}}>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{position:"relative"}}>
                                <Ava name={r.name} photo={r.photo} size={32}/>
                                <div style={{position:"absolute",inset:-2,borderRadius:"50%",border:`1.5px solid ${rateColor(r.attendancePct)}40`,pointerEvents:"none"}}/>
                              </div>
                              <div>
                                <div style={{fontWeight:700,fontSize:13,color:"var(--asp-text)",whiteSpace:"nowrap"}}>{r.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)",fontSize:12,color:"var(--asp-sub)"}}>{r.designation}</td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)"}}>
                            <span style={{fontSize:11,fontWeight:700,color:"var(--asp-sub)",background:dark?"#232328":"#f1f5f9",padding:"3px 8px",borderRadius:6}}>{r.team}</span>
                          </td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)",fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:"var(--asp-sub)"}}>{r.currency}</td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)"}}>
                            <span style={{fontSize:10,fontWeight:700,color:"var(--asp-muted)",background:dark?"#232328":"#f1f5f9",padding:"3px 8px",borderRadius:6}}>{r.payrollType}</span>
                          </td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{flex:1,height:3,borderRadius:2,background:dark?"#232328":"#f1f5f9",overflow:"hidden",minWidth:40}}>
                                <div style={{height:"100%",width:`${r.attendancePct}%`,background:rateColor(r.attendancePct),borderRadius:2}}/>
                              </div>
                              <span style={{fontSize:12,fontWeight:700,color:rateColor(r.attendancePct),fontFamily:"'JetBrains Mono',monospace",minWidth:30}}>{r.attendancePct}%</span>
                            </div>
                          </td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)",fontSize:12,color:"var(--asp-muted)",whiteSpace:"nowrap"}}>{r.paymentDate}</td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--asp-sub)"}}>{fmtMoney(r.baseSalary-r.deduction,r.currency)}</td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#ef4444"}}>{fmtMoney(r.deduction,r.currency)}</td>
                          <td style={{padding:"12px 16px",borderBottom:"1px solid var(--asp-border)"}}>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:800,color:"#059669"}}>{fmtMoney(r.netPay,r.currency)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:dark?"#18181c":"#fafbfd"}}>
                        <td colSpan={7} style={{padding:"12px 16px",borderTop:`2px solid var(--asp-border)`,fontSize:12,fontWeight:800,color:"var(--asp-text)"}}>Totals</td>
                        <td style={{padding:"12px 16px",borderTop:`2px solid var(--asp-border)`,fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:800,color:"var(--asp-text)"}}>{fmtCurrency(payrollTotals.base)}</td>
                        <td style={{padding:"12px 16px",borderTop:`2px solid var(--asp-border)`,fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:800,color:"#ef4444"}}>{fmtCurrency(payrollTotals.deduction)}</td>
                        <td style={{padding:"12px 16px",borderTop:`2px solid var(--asp-border)`,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:800,color:"#059669"}}>{fmtCurrency(totalNetPay)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}