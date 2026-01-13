
import React, { useContext, useEffect, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import useCurrentTime from '../hooks/useCurrentTime';
import { Aula } from '../types';
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
        <header className={`flex-none p-4 flex justify-between items-center px-8 h-24 z-20 relative border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/40 backdrop-blur-xl border-white/5 text-white' : 'bg-white/70 backdrop-blur-xl border-slate-200 text-slate-800'}`}>
            <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-[#ff6600]' : 'text-[#ff6600]'}`}>SENAI • GESTÃO DE AMBIENTES</span>
                <div className="flex items-center gap-3 mt-1">
                    <button onClick={onFullscreen} className="text-[11px] font-bold hover:text-[#ff6600] flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all">
                        <MaximizeIcon className="w-3.5 h-3.5" /> MODO TV
                    </button>
                </div>
            </div>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                 <h1 className="text-4xl font-black tracking-tighter leading-none mb-1">{formattedTime}</h1>
                <span className={`text-[11px] font-medium tracking-[0.1em] uppercase opacity-40`}>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className={`flex flex-col items-end pr-4 border-r border-white/10`}>
                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Turno Atual</span>
                    <span className={`text-sm font-black uppercase tracking-tighter ${shiftColor}`}>{currentShift}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ff6600]/10 flex items-center justify-center border border-[#ff6600]/20">
                    <ClockIcon className="w-5 h-5 text-[#ff6600]" />
                </div>
            </div>
        </header>
    );
};

const ClassCard: React.FC<{ aula: Aula; index: number }> = ({ aula, index }) => {
    const { isDarkMode } = useTheme();
    
    // Cores vibrantes inspiradas no IHC moderno
    const colors = [
        'from-orange-500 to-orange-600 shadow-orange-500/20',
        'from-blue-500 to-blue-600 shadow-blue-500/20',
        'from-purple-500 to-purple-600 shadow-purple-500/20',
        'from-emerald-500 to-emerald-600 shadow-emerald-500/20'
    ];
    const colorClass = colors[index % colors.length];

    return (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 shadow-2xl transition-all duration-500 hover:scale-[1.02] flex flex-col gap-4 border border-white/10 bg-gradient-to-br ${colorClass} text-white`}>
            {/* Tag de Turno */}
            <div className="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/10">
                {aula.turno}
            </div>

            {/* Cabeçalho: Sala em Destaque */}
            <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none drop-shadow-md">
                    {aula.sala.split('-')[0].trim()}
                </h2>
                <div className="flex items-center gap-2 opacity-80">
                    <BuildingIcon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold truncate uppercase">{aula.sala.split('-').slice(1).join('-').trim() || 'Ambiente Educacional'}</span>
                </div>
            </div>

            <div className="h-px w-full bg-white/20 my-1"></div>

            {/* Corpo: Detalhes */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-60 uppercase"><UserTieIcon className="w-3 h-3"/> Instrutor</div>
                    <span className="text-xs font-black truncate leading-tight">{aula.instrutor}</span>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-60 uppercase">Turma <UsersIcon className="w-3 h-3"/></div>
                    <span className="text-xs font-black truncate leading-tight">{aula.turma}</span>
                </div>
            </div>

            {/* Rodapé: Horário */}
            <div className="mt-auto flex justify-between items-center bg-black/10 rounded-2xl p-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">Horário da Aula</span>
                    <div className="flex items-center gap-2 font-black text-sm">
                        <ClockIcon className="w-3.5 h-3.5" /> {aula.inicio} — {aula.fim}
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <BookOpenIcon className="w-4 h-4 opacity-50" />
                </div>
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

    const ITEMS_PER_PAGE = (context?.anuncios?.length || 0) > 0 ? 6 : 8;

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
        <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-1000 ${isDarkMode ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Header currentShift={currentShift} onFullscreen={() => document.documentElement.requestFullscreen()} />
            
            <main className="flex-1 p-8 flex gap-8 overflow-hidden">
                <div className={`flex-1 flex flex-col transition-all duration-500 ${(context.anuncios?.length || 0) > 0 ? 'w-2/3' : 'w-full'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                        {visibleAulas.map((a, idx) => <ClassCard key={a.id} aula={a} index={idx} />)}
                    </div>
                    {filteredAulas.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-10 flex-col gap-6">
                            <div className="p-12 rounded-full border-4 border-dashed border-white/20"><ClockIcon className="w-24 h-24 stroke-[1px]" /></div>
                            <p className="text-2xl font-black uppercase tracking-[0.4em]">Nenhuma aula programada</p>
                        </div>
                    )}
                    {filteredAulas.length > ITEMS_PER_PAGE && (
                        <div className="mt-auto flex justify-center gap-3 pb-4">
                            {Array.from({ length: Math.ceil(filteredAulas.length / ITEMS_PER_PAGE) }).map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'w-12 bg-[#ff6600]' : 'w-2 bg-white/10'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {(context.anuncios?.length || 0) > 0 && (
                    <aside className="w-1/3 h-full rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-black/40 relative group">
                         {context.anuncios.map((ad, idx) => (
                             <div key={ad.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${idx === (Math.floor(Date.now()/10000) % context.anuncios.length) ? 'opacity-100' : 'opacity-0'}`}>
                                 {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover" /> : <video src={ad.src} autoPlay loop muted className="w-full h-full object-cover" />}
                             </div>
                         ))}
                         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {context.anuncios.map((_, idx) => (
                                <div key={idx} className={`h-1 rounded-full bg-white/20 w-4`} />
                            ))}
                         </div>
                    </aside>
                )}
            </main>

            {!isFullscreen && (
                <div className="fixed bottom-8 right-8 flex gap-4 z-50">
                    <button onClick={toggleTheme} className="p-5 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl">
                        {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={onAdminClick} className="p-5 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl group">
                        <SettingsIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                </div>
            )}
        </div>
    );
};
export default DashboardScreen;
