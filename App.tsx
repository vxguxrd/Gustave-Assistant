
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Upload,
  BarChart3,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FinancialDataPoint } from './types';
import { parseExcelFile } from './services/excelParser';

const COLORS_DETAILED = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const COLORS_STRATEGIC = ['#10b981', '#f59e0b']; // Épargne (Index 0), Investissement (Index 1)
const STORAGE_KEY = 'gustave_data';

const formatCurrency = (val: number) => {
  return val.toLocaleString('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};

const Card = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">
        {formatCurrency(value)}
      </h3>
    </div>
  </div>
);

const WelcomeOverlay = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center overflow-hidden">
      <div className="text-center relative">
        <h2 className="font-serif-elegant text-6xl md:text-8xl font-light tracking-tight opacity-0 animate-[reveal-text_1.8s_cubic-bezier(0.77,0,0.175,1)_forwards] animate-moving-gradient bg-clip-text text-transparent">
          Bienvenue !
        </h2>
        <div className="mt-8 w-0 h-[1px] bg-slate-200 mx-auto animate-[expand-line_1.5s_ease-in-out_0.5s_forwards]"></div>
      </div>
      <style>{`
        @keyframes reveal-text {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); letter-spacing: -0.05em; }
          40% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 0.1em; }
        }
        @keyframes expand-line {
          from { width: 0; }
          to { width: 200px; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<FinancialDataPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setData(parsed);
          setShowWelcome(true);
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const parsedData = await parseExcelFile(file);
      setData(parsedData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      setLoading(false);
      setShowWelcome(true);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la lecture du fichier. Assurez-vous qu'il respecte l'architecture attendue.");
      setLoading(false);
    }
  };

  const resetData = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes vos données financières ?")) {
      setData([]);
      localStorage.removeItem(STORAGE_KEY);
      setError(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const calculateChange = (curr: number, prev: number | undefined) => {
    if (prev === undefined || prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  if (showWelcome) {
    return <WelcomeOverlay onComplete={() => setShowWelcome(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-indigo-600 text-lg italic">Gustave prépare vos chiffres...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 transition-all duration-500"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className={`max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Bonjour, je suis Gustave</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">Votre assistant financier personnel. Importez votre suivi Excel pour donner vie à votre patrimoine.</p>
            
            <label className="w-full flex items-center justify-center gap-3 animate-moving-gradient text-white px-6 py-4 rounded-2xl font-bold cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
              <Upload size={20} />
              <span>Confier un fichier à Gustave</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls" 
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
            
            <p className="mt-6 text-sm text-slate-400 flex items-center gap-1.5">
              <FileSpreadsheet size={16} />
              Ou glissez-déposez le fichier ici
            </p>

            {error && (
              <div className="mt-6 p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 animate-pulse">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  const assetDistribution = [
    { name: 'Livret A', value: latest.livretA },
    { name: 'Livret Jeune', value: latest.livretJeune },
    { name: 'Compte Titres', value: latest.compteTitres },
    { name: 'PEA', value: latest.pea },
  ].filter(a => a.value > 0);

  const strategicDistribution = [
    { name: 'Épargne', value: latest.totalEpargne },
    { name: 'Investissement', value: latest.totalInvestissement },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 transition-all duration-700 animate-[fade-in_0.6s_ease-out]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gustave</h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 animate-moving-gradient text-white px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer hover:shadow-indigo-500/20 shadow-lg transition-all border-none group active:scale-95">
            <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
            <span>Charger un autre fichier</span>
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Évolution Globale */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Évolution Globale</h3>
              <p className="text-sm text-slate-400">Suivi historique de votre croissance patrimoniale</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Patrimoine Net</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{formatCurrency(latest.totalPatrimoine)}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${calculateChange(latest.totalPatrimoine, previous?.totalPatrimoine) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {calculateChange(latest.totalPatrimoine, previous?.totalPatrimoine) >= 0 ? <ArrowUpRight size={22}/> : <ArrowDownRight size={22}/>}
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}}
                  tickFormatter={(val) => `${(val/1000).toFixed(1)}k€`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px'}}
                  formatter={(val: number) => [formatCurrency(val), 'Patrimoine']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPatrimoine" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPat)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            title="Patrimoine Net" 
            value={latest.totalPatrimoine} 
            change={calculateChange(latest.totalPatrimoine, previous?.totalPatrimoine)} 
            icon={Wallet} 
            color="bg-indigo-600"
          />
          <Card 
            title="Total Épargne" 
            value={latest.totalEpargne} 
            change={calculateChange(latest.totalEpargne, previous?.totalEpargne)}
            icon={CreditCard} 
            color="bg-emerald-600"
          />
          <Card 
            title="Investissements" 
            value={latest.totalInvestissement} 
            change={calculateChange(latest.totalInvestissement, previous?.totalInvestissement)}
            icon={BarChart3} 
            color="bg-amber-500"
          />
          <Card 
            title="Performance Mensuelle" 
            value={latest.perfCompteTitresEuro + latest.perfPeaEuro} 
            change={latest.perfCompteTitresPercent} 
            icon={PlusCircle} 
            color="bg-indigo-600"
          />
        </div>

        {/* Répartition Stratégique Row */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-slate-800">Répartition Stratégique</h3>
            <p className="text-sm text-slate-400">Analyse croisée de la structure de votre capital</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Chart 1: Allocation par supports */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Détail des Actifs</p>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={200}
                    >
                      {assetDistribution.map((entry, index) => (
                        <Cell key={`cell-detailed-${index}`} fill={COLORS_DETAILED[index % COLORS_DETAILED.length]} cornerRadius={8} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 flex justify-center w-full">
                <div className="bg-slate-50 px-6 py-4 rounded-full border border-slate-100 shadow-inner inline-flex items-center gap-6 whitespace-nowrap overflow-x-auto max-w-full no-scrollbar">
                  {assetDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_DETAILED[idx % COLORS_DETAILED.length] }}></div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{item.name}</span>
                        <span className="text-sm font-bold text-slate-700">
                          {((item.value / latest.totalPatrimoine) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Épargne vs Investissement */}
            <div className="flex flex-col items-center w-full">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Épargne vs Investissement</p>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={strategicDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={400}
                    >
                      {strategicDistribution.map((entry, index) => (
                        <Cell key={`cell-strategic-${index}`} fill={COLORS_STRATEGIC[index % COLORS_STRATEGIC.length]} cornerRadius={8} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 flex justify-center w-full">
                <div className="bg-slate-50 px-10 py-4 rounded-full border border-slate-100 shadow-inner inline-flex items-center gap-12 whitespace-nowrap">
                  {strategicDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_STRATEGIC[idx % COLORS_STRATEGIC.length] }}></div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{item.name}</span>
                        <span className={`text-lg font-bold ${idx === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {((item.value / latest.totalPatrimoine) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Historique Mensuel</h3>
               <p className="text-sm text-slate-400">Suivi précis des variations de capital</p>
             </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-5">Période</th>
                  <th className="px-8 py-5">Patrimoine Total</th>
                  <th className="px-8 py-5">Épargne</th>
                  <th className="px-8 py-5">Investissements</th>
                  <th className="px-8 py-5 text-right">Performance Bourse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...data].reverse().map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-semibold text-slate-700">{row.date}</td>
                    <td className="px-8 py-5 font-bold text-slate-900">{formatCurrency(row.totalPatrimoine)}</td>
                    <td className="px-8 py-5 text-emerald-600 font-medium">{formatCurrency(row.totalEpargne)}</td>
                    <td className="px-8 py-5 font-medium text-amber-600">{formatCurrency(row.totalInvestissement)}</td>
                    <td className="px-8 py-5 text-right font-bold text-slate-900">
                      <span className={row.perfCompteTitresEuro >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {row.perfCompteTitresEuro > 0 ? '+' : ''}{formatCurrency(row.perfCompteTitresEuro)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-10 border-t border-slate-200 mt-12 mb-12">
          <button 
            onClick={resetData}
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-rose-500 transition-colors px-6 py-3 rounded-2xl hover:bg-rose-50 active:scale-95"
          >
            <Trash2 size={18} />
            Réinitialiser Gustave
          </button>
          <div className="text-slate-300 text-xs font-bold uppercase tracking-[0.2em] hidden sm:block">•</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gustave Dashboard v2.5</p>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <p className="italic text-slate-300 text-sm">Gustave — Votre avenir commence aujourd'hui</p>
      </footer>
    </div>
  );
};

export default App;
