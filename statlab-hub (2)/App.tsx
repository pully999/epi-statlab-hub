
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { 
  Calculator, ChevronRight, Menu, Home, Info, X, 
  FlaskConical, ShieldCheck, ListFilter, Keyboard, 
  LineChart as LucideLineChart, Lightbulb, Settings2,
  Stethoscope, Activity, TrendingUp, Target, FileUp, FileSpreadsheet,
  BarChart3, Binary, Scale, Search, ChevronDown, PieChart, BookOpen, ExternalLink,
  Code2, Copy, Check, Beaker, Sigma
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine 
} from 'recharts';
import { getAllCalculators, getCalculatorById } from './calculators/registry';
import { Category } from './types';

// --- Professional Logo Component ---
const StatLabLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className} bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 overflow-hidden`}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
      <path d="M4 20V14M8 20V10M12 20V15M16 20V7M20 20V11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 6L12 3L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 rounded-full translate-x-1/2 -translate-y-1/2 blur-[1px]"></div>
  </div>
);

// --- Visual Components ---

const RCodeBlock = ({ code }: { code?: string }) => {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-inner">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Code2 size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">R Script Generator</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs font-mono text-indigo-100 leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
};

const ReferencesSection = ({ references }: { references?: any[] }) => {
  if (!references || references.length === 0) return null;
  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <div className="flex items-center space-x-2 mb-6">
        <BookOpen size={18} className="text-indigo-600" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">References & Methodology</h3>
      </div>
      <div className="grid gap-4">
        {references.map((ref, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start space-x-4">
            <div className="bg-slate-50 p-2 rounded-lg text-slate-400 text-xs font-bold">{idx + 1}</div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-slate-800">{ref.title}</p>
              <p className="text-xs text-slate-500 italic">{ref.author} ({ref.year}). {ref.source}</p>
              {ref.doi && (
                <a href={ref.doi.startsWith('http') ? ref.doi : `https://doi.org/${ref.doi}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center space-x-1">
                  <span>View Source</span> <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PowerCurve = ({ calc, formData }: { calc: any, formData: any }) => {
  const dataPoints = useMemo(() => {
    if (!formData || !calc || Object.keys(formData).length === 0) return [];
    const nKeys = ['n', 'n1', 'nPerGroup', 'nIndividual', 'T', 'observed', 'tp', 'n2', 'population', 'personTime', 'cases'];
    const activeNKey = nKeys.find(key => typeof formData[key] === 'number');
    if (!activeNKey) return [];
    const baseN = formData[activeNKey];
    if (isNaN(baseN) || baseN <= 0) return [];
    const points = [];
    const multipliers = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2.0];
    for (const m of multipliers) {
      const testData = { ...formData };
      const currentN = Math.max(1, Math.ceil(baseN * m));
      testData[activeNKey] = currentN;
      if (activeNKey === 'n1' && formData.n2 !== undefined) {
        const ratio = formData.n2 / formData.n1 || 1;
        testData.n2 = Math.ceil(currentN * ratio);
      }
      try {
        const res = calc.compute(testData);
        const powerItem = res.results.find((r: any) => /power|1\s*-\s*β|1-beta/i.test(r.label));
        if (powerItem) {
          const valStr = powerItem.value.toString().replace('%', '');
          const val = parseFloat(valStr);
          const finalVal = val <= 1 ? val * 100 : val;
          if (!isNaN(finalVal)) points.push({ n: currentN, power: finalVal });
        }
      } catch (e) {}
    }
    return points.sort((a, b) => a.n - b.n);
  }, [calc, formData]);

  if (dataPoints.length === 0) return (
    <div className="h-64 w-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 p-6 text-center">
      <LucideLineChart className="mb-2 opacity-20" size={32} />
      <p className="text-xs italic">Sensitivity analysis is available for tools with sample size/population inputs and Power outputs.</p>
    </div>
  );

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="n" fontSize={10} tick={{fontSize: 10}} label={{ value: 'N (Units)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
          <YAxis domain={[0, 100]} fontSize={10} tick={{fontSize: 10}} label={{ value: 'Power %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
          <Area type="monotone" dataKey="power" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPower)" strokeWidth={3} />
          <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const Sidebar = ({ isOpen, close }: { isOpen: boolean, close: () => void }) => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [Category.DESCRIPTIVE]: true,
    [Category.CONFIDENCE_INTERVALS]: true,
    [Category.EPIDEMIOLOGY]: true,
    [Category.SAMPLE_SIZE]: true,
    [Category.HYPOTHESIS_TESTS]: true
  });

  const calcs = useMemo(() => getAllCalculators(), []);

  const filteredCalcs = useMemo(() => {
    if (!search) return calcs;
    return calcs.filter(c => 
      c.metadata.title.toLowerCase().includes(search.toLowerCase()) ||
      c.metadata.category.toLowerCase().includes(search.toLowerCase()) ||
      c.metadata.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
    );
  }, [calcs, search]);

  const grouped = useMemo(() => filteredCalcs.reduce((acc, c) => {
    const cat = c.metadata.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, any[]>), [filteredCalcs]);

  const toggleExpand = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getCatIcon = (cat: string) => {
    switch (cat) {
      case Category.DESCRIPTIVE: return <BarChart3 size={16} />;
      case Category.CONFIDENCE_INTERVALS: return <Scale size={16} />;
      case Category.HYPOTHESIS_TESTS: return <Binary size={16} />;
      case Category.EPIDEMIOLOGY: return <Activity size={16} />;
      case Category.SAMPLE_SIZE: return <Target size={16} />;
      default: return <PieChart size={16} />;
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={close} />
      <aside className={`fixed md:sticky top-0 md:top-16 h-screen md:h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 z-50 transition-all ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        <div className="p-4 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar pb-20">
          <Link to="/" onClick={close} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Home size={18} /> <span className="font-bold text-sm">Dashboard</span>
          </Link>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-1">
              <button onClick={() => toggleExpand(cat)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors group">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300 group-hover:text-indigo-400 transition-colors">{getCatIcon(cat)}</span>
                  <span>{cat}</span>
                </div>
                <ChevronDown size={12} className={`transition-transform duration-300 ${expanded[cat] ? 'rotate-180' : ''}`} />
              </button>
              <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${expanded[cat] ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                {(items as any[]).map(item => (
                  <Link key={item.metadata.id} to={`/calc/${item.metadata.id}`} onClick={close} className={`flex items-center space-x-2 px-4 py-2 text-[11px] rounded-lg transition-all border-l-2 ${location.pathname === `/calc/${item.metadata.id}` ? 'text-indigo-700 bg-indigo-50 font-bold border-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border-transparent hover:border-slate-200'}`}>
                    <div className={`w-1 h-1 rounded-full ${location.pathname === `/calc/${item.metadata.id}` ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    <span className="truncate">{item.metadata.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

const CalculatorPage = () => {
  const { id } = useParams<{ id: string }>();
  const calc = useMemo(() => getCalculatorById(id || ''), [id]);
  const [formData, setFormData] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [showPlots, setShowPlots] = useState(true);
  const [showRCode, setShowRCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setResults(null); setFormData({}); setShowRCode(false); }, [id]);

  if (!calc) return <div className="p-20 text-center text-slate-400 font-medium">Tool not found.</div>;

  const getZodShape = (zodObj: any): any => {
    if (!zodObj) return {};
    if (zodObj._def.shape) return zodObj._def.shape();
    if (zodObj._def.schema) return getZodShape(zodObj._def.schema); 
    if (zodObj._def.innerType) return getZodShape(zodObj._def.innerType);
    return {};
  };

  const schemaShape = useMemo(() => getZodShape(calc.schema), [calc.schema]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const flatData = data.flat().filter(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && v !== ''));
      const stringData = flatData.join(' ');
      const datasetField = Object.keys(schemaShape).find(k => k === 'numbers' || k === 'text' || k === 'dataset' || k === 'var1' || k === 'var2');
      if (datasetField) setFormData(prev => ({ ...prev, [datasetField]: stringData }));
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = calc.schema.parse(formData);
      setResults(calc.compute(parsed));
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Check your inputs.");
    }
  };

  const hasDatasetInput = Object.keys(schemaShape).some(k => k === 'numbers' || k === 'text' || k === 'dataset' || k === 'var1' || k === 'var2');

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto pb-32">
      <div className="mb-10 space-y-2">
        <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{calc.metadata.category}</div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{calc.metadata.title}</h1>
        <p className="text-slate-500 text-lg max-w-3xl">{calc.metadata.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parameters</h3>
               <div className="flex space-x-3">
                 {hasDatasetInput && (
                   <>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center space-x-1" title="Upload Excel or CSV">
                      <FileSpreadsheet size={12} /> <span>Import</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                   </>
                 )}
                 <button onClick={() => {
                   setFormData(calc.examples[0]);
                   setResults(calc.compute(calc.schema.parse(calc.examples[0])));
                 }} className="text-[10px] font-bold text-indigo-600 hover:underline">Sample Case</button>
               </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(schemaShape).map(key => {
                const isDatasetField = key === 'numbers' || key === 'text' || key === 'dataset' || key === 'var1' || key === 'var2';
                return (
                  <div key={key}>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-tight mb-1 block">{key.replace(/([A-Z])/g, ' $1').replace(/^p([0-9])/, 'p$1')}</label>
                    <input type={isDatasetField ? "text" : "number"} step="any" placeholder={isDatasetField ? "Enter data list" : ""} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" value={formData[key] || ''} onChange={(e) => {
                        const val = e.target.value;
                        setFormData({...formData, [key]: isDatasetField ? val : parseFloat(val)})
                      }} 
                    />
                  </div>
                );
              })}
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Calculate Results</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {results ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analysis Output</h3>
                  <button 
                    onClick={() => setShowRCode(!showRCode)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${showRCode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Code2 size={12} />
                    <span>{showRCode ? 'Hide R Script' : 'Show R Script'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {(results.results as any[]).map((res: any, idx: number) => (
                    <div key={idx} className={`p-6 rounded-2xl ${res.isMain ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                      <div className={`text-[10px] font-black uppercase mb-1 ${res.isMain ? 'text-indigo-200' : 'text-slate-400'}`}>{res.label}</div>
                      <div className={`font-mono leading-none ${res.isMain ? 'text-2xl font-black' : 'text-lg font-bold text-slate-800'}`}>{res.value}</div>
                      {res.description && <div className={`text-[9px] mt-2 opacity-70 ${res.isMain ? 'text-white' : 'text-slate-500'}`}>{res.description}</div>}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden mb-6">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Interpretation</h3>
                  <p className="text-xl font-serif italic text-slate-100 leading-relaxed">"{results.interpretation}"</p>
                </div>

                {showRCode && <RCodeBlock code={results.rCode} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   {results.formula && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Mathematical Basis</div>
                      <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">{results.formula}</pre>
                    </div>
                  )}
                  {showPlots && (calc.metadata.category === Category.SAMPLE_SIZE || calc.metadata.category === Category.EPIDEMIOLOGY) && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4">Sample Size Spectrum</h4>
                        <PowerCurve calc={calc} formData={formData} />
                    </div>
                  )}
                </div>
              </div>
              <ReferencesSection references={calc.references} />
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4"><Calculator size={32}/></div>
              <h3 className="text-xl font-bold text-slate-900">Input Data Needed</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs">Fill parameters to see report.</p>
              <ReferencesSection references={calc.references} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HomeDashboard = () => {
  const categories = [Category.DESCRIPTIVE, Category.CONFIDENCE_INTERVALS, Category.HYPOTHESIS_TESTS, Category.EPIDEMIOLOGY, Category.SAMPLE_SIZE];
  const calcs = getAllCalculators();
  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto space-y-16">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-4">
          <StatLabLogo className="w-16 h-16" />
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">StatLab<span className="text-indigo-600">Hub</span></h1>
        </div>
        <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed">Unified medical statistics and epidemiologic monitoring for precision research.</p>
      </div>
      {categories.map(cat => (
        <section key={cat} className="space-y-8">
           <div className="flex items-center space-x-4">
             <h2 className="text-2xl font-black text-slate-900">{cat}</h2>
             <div className="flex-1 h-px bg-slate-200" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {calcs.filter(c => c.metadata.category === cat).slice(0, 9).map(c => (
               <Link key={c.metadata.id} to={`/calc/${c.metadata.id}`} className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-indigo-500 transition-all hover:shadow-2xl flex flex-col h-full group">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={18}/></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{c.metadata.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{c.metadata.description}</p>
               </Link>
             ))}
           </div>
        </section>
      ))}
    </div>
  );
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 flex items-center px-6 md:px-10 justify-between">
          <div className="flex items-center space-x-6">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden"><Menu size={20}/></button>
            <Link to="/" className="flex items-center space-x-3">
              <StatLabLogo className="w-8 h-8" />
              <span className="text-2xl font-black tracking-tighter">StatLab Hub</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center space-x-1"><ShieldCheck size={14} className="text-green-500" /> <span>Clinical Standard</span></span>
            <span className="flex items-center space-x-1"><Settings2 size={14} className="text-indigo-400" /> <span>v1.2.0-stable</span></span>
          </div>
        </nav>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} close={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<HomeDashboard />} />
              <Route path="/calc/:id" element={<CalculatorPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
