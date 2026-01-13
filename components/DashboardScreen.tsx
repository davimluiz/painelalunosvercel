
import React, { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import useCurrentTime from '../hooks/useCurrentTime';
import { Anuncio, Aula } from '../types';
import { BuildingIcon, UsersIcon, UserTieIcon, BookOpenIcon, ClockIcon, SettingsIcon, SunIcon, MoonIcon } from './Icons';

const MaximizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);

const normalizeTurno = (t: string | undefined) => {
    if (!t) return '';
    const lower = t.toLowerCase();
    if (lower.includes('manhã') || lower.includes('matutino')) return 'matutino';
    if (lower.includes('tarde') || lower.includes('vespertino')) return 'vespertino';
    if (lower.includes('noite') || lower.includes('noturno')) return 'noturno';
    return lower;
};

const Header: React.FC<{ currentShift: string; onFullscreen: () => void }> = ({ currentShift, onFullscreen }) => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const { isDarkMode } = useTheme();
    
    let shiftColor = isDarkMode ? 'text-white/80' : 'text-slate-700';
    if (currentShift === 'Matutino') shiftColor = 'text-yellow-400';
    if (currentShift === 'Vespertino') shiftColor = 'text-orange-400';
    if (currentShift === 'Noturno') shiftColor = 'text-indigo-400';

    return (
        <header className={`flex-none p-4 flex justify-between items-center px-8 h-20 z-20 relative border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/20 backdrop-blur-md border-white/5 text-white' : 'bg-white/60 backdrop-blur-md border-slate-200 text-slate-800'}`}>
            <div className={`text-sm font-light tracking-widest uppercase flex flex-col ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                <span>Informativo Senai</span>
                <button onClick={onFullscreen} className="text-[10px] hover:text-[#ff6600] flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                    <MaximizeIcon className="w-3 h-3" /> Tela Cheia
                </button>
            </div>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                 <h1 className="text-3xl font-bold tracking-tighter leading-none">{formattedTime}</h1>
                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase opacity-50`}>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${shiftColor} ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
                    Turno: {currentShift}
                </span>
            </div>
        </header>
    );
};

const ClassCard: React.FC<{ aula: Aula }> = ({ aula }) => {
    const { isDarkMode } = useTheme();
    return (
        <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-xl flex flex-col gap-2 relative transition-all duration-500 hover:translate-y-[-2px] ${
            isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:shadow-2xl hover:shadow-slate-300'
        }`}>
            <div className={`absolute top-3 right-3 text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-black/40 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {aula.turno}
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#ff6600] rounded-xl text-white shadow-lg shadow-orange-500/20"><UsersIcon className="w-5 h-5" /></div>
                <h2 className="text-sm font-black uppercase truncate tracking-tight">{aula.turma}</h2>
            </div>
            <div className="space-y-2 mt-2">
                <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${isDarkMode ? 'bg-black/20' : 'bg-slate-50 border border-slate-100'}`}>
                    <BuildingIcon className="w-4 h-4 opacity-50" /><span className="font-bold opacity-80">{aula.sala}</span>
                </div>
                <div className={`flex items-center gap-2 text-[11px] px-2 opacity-70`}><UserTieIcon className="w-3.5 h-3.5" /><span className="truncate">{aula.instrutor}</span></div>
                <div className={`flex items-center gap-2 text-[11px] px-2 opacity-70`}><BookOpenIcon className="w-3.5 h-3.5" /><span className="truncate">{aula.unidade_curricular}</span></div>
            </div>
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#ff6600] tracking-widest uppercase">Horário</span>
                <div className="bg-[#ff6600]/10 text-[#ff6600] px-3 py-1 rounded-full text-xs font-black">{aula.inicio} — {aula.fim}</div>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<{ onAdminClick: () => void }> = ({ onAdminClick }) => {
    const context = useContext(DataContext);
    const { isDarkMode, toggleTheme } = useTheme();
    const [filteredAulas, setFilteredAulas] = useState<Aula[]>([]);
    const [visibleAulas, setVisibleAulas] = useState<Aula[]>([]);
    const [currentShift, setCurrentShift] = useState<string>('Matutino');
    const [page, setPage] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    useEffect(() => {
        const update = () => {
            const h = new Date().getHours();
            if (h < 12) setCurrentShift('Matutino');
            else if (h < 18) setCurrentShift('Vespertino');
            else setCurrentShift('Noturno');
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (context && !context.loading) {
            const today = new Date().toLocaleDateString('pt-BR');
            const filtered = context.aulas.filter(a => a.data === today && normalizeTurno(a.turno) === normalizeTurno(currentShift));
            setFilteredAulas(filtered);
            setPage(0);
        }
    }, [context, currentShift]);

    const ITEMS_PER_PAGE = (context?.anuncios?.length || 0) > 0 ? 6 : 12;

    useEffect(() => {
        const total = Math.ceil(filteredAulas.length / ITEMS_PER_PAGE);
        setVisibleAulas(filteredAulas.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE));
        if (total > 1) {
            const timer = setInterval(() => setPage(p => (p + 1) % total), 15000);
            return () => clearInterval(timer);
        }
    }, [filteredAulas, page, ITEMS_PER_PAGE]);

    if (!context) return null;

    return (
        <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-1000 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Header currentShift={currentShift} onFullscreen={() => document.documentElement.requestFullscreen()} />
            
            <main className="flex-1 p-6 flex gap-6 overflow-hidden">
                <div className={`flex-1 flex flex-col transition-all duration-500 ${(context.anuncios?.length || 0) > 0 ? 'w-2/3' : 'w-full'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                        {visibleAulas.map(a => <ClassCard key={a.id} aula={a} />)}
                    </div>
                    {filteredAulas.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-20 flex-col gap-4">
                            <ClockIcon className="w-20 h-20" />
                            <p className="text-xl font-light uppercase tracking-widest">Sem aulas no momento</p>
                        </div>
                    )}
                </div>

                {(context.anuncios?.length || 0) > 0 && (
                    <aside className="w-1/3 h-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black/40">
                         {context.anuncios.map((ad, idx) => (
                             <div key={ad.id} className={`w-full h-full transition-opacity duration-1000 ${idx === (Math.floor(Date.now()/10000) % context.anuncios.length) ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                                 {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover" /> : <video src={ad.src} autoPlay loop muted className="w-full h-full object-cover" />}
                             </div>
                         ))}
                    </aside>
                )}
            </main>

            {!isFullscreen && (
                <div className="fixed bottom-6 left-6 flex gap-3 z-50">
                    <button onClick={onAdminClick} className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl group">
                        <SettingsIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                    <button onClick={toggleTheme} className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-yellow-500 transition-all shadow-2xl">
                        {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                </div>
            )}
        </div>
    );
};
export default DashboardScreen;
