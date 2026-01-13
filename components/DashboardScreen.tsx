
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
    return t.toLowerCase().trim();
};

const Header: React.FC<{ currentShift: string; onFullscreen: () => void }> = ({ currentShift, onFullscreen }) => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const { isDarkMode } = useTheme();
    
    let shiftColor = 'text-white/80';
    if (currentShift === 'Matutino') shiftColor = 'text-yellow-400';
    if (currentShift === 'Vespertino') shiftColor = 'text-orange-400';
    if (currentShift === 'Noturno') shiftColor = 'text-indigo-400';

    return (
        <header className={`flex-none p-4 flex flex-col md:flex-row justify-between items-center px-4 md:px-8 md:h-24 z-20 relative border-b transition-colors duration-500 gap-4 md:gap-0 ${isDarkMode ? 'bg-black/40 backdrop-blur-xl border-white/5 text-white' : 'bg-white/70 backdrop-blur-xl border-slate-200 text-slate-800'}`}>
            <div className="flex flex-col items-center md:items-start">
                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6600]`}>SENAI • GESTÃO DE AMBIENTES</span>
                <div className="flex items-center gap-3 mt-1">
                    <button onClick={onFullscreen} className="text-[10px] md:text-[11px] font-bold hover:text-[#ff6600] flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all">
                        <MaximizeIcon className="w-3.5 h-3.5" /> MODO TV
                    </button>
                </div>
            </div>
            
            <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 text-center order-first md:order-none">
                 <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-1">{formattedTime}</h1>
                <span className={`text-[10px] md:text-[11px] font-medium tracking-[0.1em] uppercase opacity-40`}>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className={`flex flex-col items-end pr-4 border-r border-white/10`}>
                    <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Turno Agora</span>
                    <span className={`text-xs md:text-sm font-black uppercase tracking-tighter ${shiftColor}`}>{currentShift}</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#ff6600]/10 flex items-center justify-center border border-[#ff6600]/20">
                    <ClockIcon className="w-4 h-4 md:w-5 md:h-5 text-[#ff6600]" />
                </div>
            </div>
        </header>
    );
};

const ClassCard: React.FC<{ aula: Aula; index: number }> = ({ aula, index }) => {
    const colors = [
        'from-orange-500 to-orange-600 shadow-orange-500/20',
        'from-blue-500 to-blue-600 shadow-blue-500/20',
        'from-purple-500 to-purple-600 shadow-purple-500/20',
        'from-emerald-500 to-emerald-600 shadow-emerald-500/20'
    ];
    const colorClass = colors[index % colors.length];

    return (
        <div className={`relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-2xl transition-all duration-500 hover:scale-[1.02] flex flex-col gap-3 md:gap-4 border border-white/10 bg-gradient-to-br ${colorClass} text-white`}>
            <div className="absolute top-4 right-4 md:right-6 bg-white/20 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-tighter border border-white/10">
                {aula.turno}
            </div>
            <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none drop-shadow-md">
                    {aula.sala.split('-')[0].trim()}
                </h2>
                <div className="flex items-center gap-2 opacity-80">
                    <BuildingIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="text-[10px] md:text-[11px] font-bold truncate uppercase">{aula.sala.split('-').slice(1).join('-').trim() || 'Ambiente Educacional'}</span>
                </div>
            </div>
            <div className="h-px w-full bg-white/20 my-1"></div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold opacity-60 uppercase"><UserTieIcon className="w-2.5 h-2.5 md:w-3 md:h-3"/> Instrutor</div>
                    <span className="text-[10px] md:text-xs font-black truncate leading-tight">{aula.instrutor}</span>
                </div>
                <div className="flex flex-col gap-0.5 md:gap-1 items-end text-right">
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold opacity-60 uppercase">Turma <UsersIcon className="w-2.5 h-2.5 md:w-3 md:h-3"/></div>
                    <span className="text-[10px] md:text-xs font-black truncate leading-tight">{aula.turma}</span>
                </div>
            </div>
            <div className="mt-auto flex justify-between items-center bg-black/10 rounded-xl md:rounded-2xl p-2 md:p-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[7px] md:text-[8px] font-black opacity-50 uppercase tracking-widest">Horário</span>
                    <div className="flex items-center gap-1.5 font-black text-xs md:text-sm">
                        <ClockIcon className="w-3 h-3 md:w-3.5 md:h-3.5" /> {aula.inicio} — {aula.fim}
                    </div>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <BookOpenIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50" />
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
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const totalMin = (h * 60) + m;

            if (totalMin >= 360 && totalMin <= 690) setCurrentShift('Matutino');
            else if (totalMin >= 691 && totalMin <= 1050) setCurrentShift('Vespertino');
            else if (totalMin >= 1051 && totalMin <= 1320) setCurrentShift('Noturno');
            else {
                if (h < 6) setCurrentShift('Matutino');
                else setCurrentShift('Noturno');
            }
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (context && !context.loading) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const todayStr = `${day}/${month}/${year}`;

            const filtered = context.aulas.filter(a => {
                const aulaData = a.data.trim();
                return aulaData === todayStr && normalizeTurno(a.turno) === normalizeTurno(currentShift);
            });
            
            setFilteredAulas(filtered);
            setPage(0);
        }
    }, [context?.aulas, context?.loading, currentShift]);

    // Ajuste de itens por página baseado no tamanho da tela
    const [itemsPerPage, setItemsPerPage] = useState(8);
    useEffect(() => {
        const updateItems = () => {
            const hasAds = (context?.anuncios?.length || 0) > 0;
            if (window.innerWidth < 768) setItemsPerPage(4); // Menos itens no celular para evitar scroll infinito
            else if (hasAds) setItemsPerPage(6);
            else setItemsPerPage(8);
        };
        updateItems();
        window.addEventListener('resize', updateItems);
        return () => window.removeEventListener('resize', updateItems);
    }, [context?.anuncios]);

    useEffect(() => {
        const total = Math.ceil(filteredAulas.length / itemsPerPage);
        setVisibleAulas(filteredAulas.slice(page * itemsPerPage, (page + 1) * itemsPerPage));
        if (total > 1) {
            const timer = setInterval(() => setPage(p => (p + 1) % total), 15000);
            return () => clearInterval(timer);
        }
    }, [filteredAulas, page, itemsPerPage]);

    if (!context) return null;

    const hasAnuncios = (context.anuncios?.length || 0) > 0;

    return (
        <div className={`min-h-screen w-screen overflow-x-hidden flex flex-col transition-colors duration-1000 ${isDarkMode ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Header currentShift={currentShift} onFullscreen={() => document.documentElement.requestFullscreen()} />
            
            <main className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                <div className={`flex-1 flex flex-col transition-all duration-500 ${hasAnuncios ? 'lg:w-2/3' : 'w-full'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
                        {visibleAulas.map((a, idx) => <ClassCard key={a.id} aula={a} index={idx} />)}
                    </div>
                    {filteredAulas.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-10 flex-col gap-6 text-center py-20">
                            <div className="p-8 md:p-12 rounded-full border-2 md:border-4 border-dashed border-white/20"><ClockIcon className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" /></div>
                            <div>
                                <p className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">Sem atividades agora</p>
                                <p className="text-[9px] md:text-[10px] mt-2 opacity-50 tracking-widest font-bold uppercase">Aguardando o próximo turno ou novos dados</p>
                            </div>
                        </div>
                    )}
                    {filteredAulas.length > itemsPerPage && (
                        <div className="mt-8 flex justify-center gap-3 pb-4">
                            {Array.from({ length: Math.ceil(filteredAulas.length / itemsPerPage) }).map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'w-10 md:w-12 bg-[#ff6600]' : 'w-2 bg-white/10'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {hasAnuncios && (
                    <aside className="hidden lg:block w-1/3 h-[calc(100vh-160px)] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-black/40 relative">
                         {context.anuncios.map((ad, idx) => {
                             const isVisible = idx === (Math.floor(Date.now()/10000) % context.anuncios.length);
                             return (
                                <div key={ad.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                                    {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover" /> : <video src={ad.src} autoPlay loop muted className="w-full h-full object-cover" />}
                                </div>
                             );
                         })}
                    </aside>
                )}
            </main>

            {!isFullscreen && (
                <div className="fixed bottom-6 right-6 flex gap-3 z-50">
                    <button onClick={toggleTheme} className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl">
                        {isDarkMode ? <SunIcon className="w-5 h-5 md:w-6 md:h-6" /> : <MoonIcon className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>
                    {/* BOTÃO DE ENGRENAGEM: Oculto em celulares (md:flex mostra apenas de 768px pra cima) */}
                    <button onClick={onAdminClick} className="hidden md:flex p-5 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl group">
                        <SettingsIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                </div>
            )}
        </div>
    );
};
export default DashboardScreen;
