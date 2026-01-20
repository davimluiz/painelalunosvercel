
import React, { useContext, useEffect, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import useCurrentTime from '../hooks/useCurrentTime';
import { Aula } from '../types';
import { BuildingIcon, UsersIcon, UserTieIcon, BookOpenIcon, ClockIcon, SettingsIcon, SunIcon, MoonIcon } from './Icons';

const MaximizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);

const SunHorizonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41-1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>
);

const normalizeTurno = (t: string | undefined) => {
    if (!t) return '';
    return t.toLowerCase().trim();
};

const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const Header: React.FC<{ onFullscreen: () => void }> = ({ onFullscreen }) => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const { isDarkMode } = useTheme();

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

            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end pr-4 border-r border-white/10">
                    <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">Vitória</span>
                    <span className="text-xs font-black uppercase text-[#ff6600]">Unidade Integrada</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ff6600]/10 flex items-center justify-center border border-[#ff6600]/20">
                    <BuildingIcon className="w-5 h-5 text-[#ff6600]" />
                </div>
            </div>
        </header>
    );
};

const ClassCard: React.FC<{ aula: Aula; index: number }> = ({ aula, index }) => {
    const { isDarkMode } = useTheme();

    const formatText = (text: string) => {
        return text.replace(/['"]/g, '').trim();
    };

    const abrevSala = (sala: string) => {
        return sala.replace(/^VTRIA-\d+-/i, '').trim();
    };

    const getHorarioFixo = (turno: string | undefined) => {
        const t = normalizeTurno(turno);
        if (t === 'matutino') return '7:00 as 11:30';
        if (t === 'vespertino') return '13:00 as 17:30';
        if (t === 'noturno') return '18:00 as 22:00';
        return '';
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col gap-3 border ${isDarkMode ? 'bg-[#1a1b1e] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ff6600] flex items-center justify-center shadow-lg shadow-orange-600/20">
                        <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className={`text-lg md:text-xl font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {formatText(aula.turma)}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1 text-[#ff6600] opacity-90">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-black tracking-widest uppercase">{abrevSala(aula.sala)}</span>
                        </div>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${isDarkMode ? 'bg-zinc-800/50 border-white/5 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {aula.turno}
                </div>
            </div>

            <div className="space-y-1.5">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#25262b] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <UserTieIcon className="w-3.5 h-3.5 text-[#ff6600] opacity-80" />
                    <span className={`text-[10px] md:text-[11px] font-bold uppercase ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
                        {formatText(aula.instrutor)}
                    </span>
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#25262b] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <BookOpenIcon className="w-3.5 h-3.5 text-[#ff6600] opacity-80" />
                    <span className={`text-[10px] md:text-[11px] font-bold uppercase truncate ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
                        {aula.unidade_curricular || 'Atividade SENAI'}
                    </span>
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#25262b] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <ClockIcon className="w-3.5 h-3.5 text-[#ff6600] opacity-80" />
                    <span className={`text-[10px] md:text-[11px] font-bold uppercase ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
                        {getHorarioFixo(aula.turno)}
                    </span>
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
    const [adIndex, setAdIndex] = useState(0);
    
    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    useEffect(() => {
        const detectShift = () => {
            const h = new Date().getHours();
            if (h >= 6 && h < 12) return 'Matutino';
            if (h >= 12 && h < 18) return 'Vespertino';
            return 'Noturno';
        };
        setCurrentShift(detectShift());
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

    useEffect(() => {
        if (context?.anuncios && context.anuncios.length > 0) {
            const timer = setInterval(() => {
                setAdIndex(prev => (prev + 1) % context.anuncios.length);
            }, 15000);
            return () => clearInterval(timer);
        }
    }, [context?.anuncios]);

    const itemsPerPage = 8;

    useEffect(() => {
        const total = Math.ceil(filteredAulas.length / itemsPerPage);
        setVisibleAulas(filteredAulas.slice(page * itemsPerPage, (page + 1) * itemsPerPage));
        if (total > 1) {
            const timer = setInterval(() => setPage(p => (p + 1) % total), 15000);
            return () => clearInterval(timer);
        }
    }, [filteredAulas, page]);

    if (!context) return null;

    const hasAnuncios = (context.anuncios?.length || 0) > 0;

    const turnos = [
        { id: 'Matutino', icon: SunIcon },
        { id: 'Vespertino', icon: SunHorizonIcon },
        { id: 'Noturno', icon: MoonIcon }
    ];

    return (
        <div className={`min-h-screen w-screen overflow-x-hidden flex flex-col transition-colors duration-1000 ${isDarkMode ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Header onFullscreen={() => document.documentElement.requestFullscreen()} />
            
            <div className="flex justify-center pt-8 px-4">
                <div className={`flex p-1.5 rounded-2xl md:rounded-[2rem] gap-2 border ${isDarkMode ? 'bg-[#16171d] border-white/5' : 'bg-white border-slate-200 shadow-lg'}`}>
                    {turnos.map((t) => {
                        const Icon = t.icon;
                        const active = currentShift === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setCurrentShift(t.id)}
                                className={`flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] transition-all duration-500 font-black uppercase tracking-widest text-[10px] md:text-xs ${
                                    active 
                                    ? 'bg-[#ff6600] text-white shadow-lg shadow-orange-600/40 scale-105 z-10' 
                                    : 'text-white/30 hover:text-white/60'
                                }`}
                            >
                                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'animate-pulse' : ''}`} />
                                {t.id}
                            </button>
                        );
                    })}
                </div>
            </div>

            <main className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                <div className={`flex-1 flex flex-col transition-all duration-500 ${hasAnuncios ? 'lg:w-2/3' : 'w-full'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-min">
                        {visibleAulas.map((a, idx) => <ClassCard key={a.id} aula={a} index={idx} />)}
                    </div>
                    {filteredAulas.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-10 flex-col gap-6 text-center py-20">
                            <ClockIcon className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" />
                            <p className="text-xl font-black uppercase tracking-widest">Sem atividades agendadas para o turno {currentShift}</p>
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

                {/* Coluna Lateral: Anúncios (Desktop) */}
                {hasAnuncios && (
                    <div className="hidden lg:flex flex-col gap-8 w-1/3">
                        <aside className="flex-1 min-h-[450px] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-black relative">
                             {context.anuncios.map((ad, idx) => {
                                 const isVisible = idx === adIndex;
                                 return (
                                    <div key={ad.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                        {ad.type === 'image' ? (
                                            <img src={ad.src} className="w-full h-full object-cover" alt="Anúncio" />
                                        ) : isDirectVideo(ad.src) ? (
                                            <video 
                                                src={ad.src} 
                                                autoPlay 
                                                muted 
                                                loop 
                                                playsInline 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <iframe 
                                                src={ad.src} 
                                                className="w-full h-full border-0" 
                                                allow="autoplay; encrypted-media; fullscreen"
                                            ></iframe>
                                        )}
                                    </div>
                                 );
                             })}
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                {context.anuncios.map((_, i) => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === adIndex ? 'w-6 bg-[#ff6600]' : 'w-1 bg-white/20'}`} />
                                ))}
                             </div>
                        </aside>
                    </div>
                )}
            </main>

            {!isFullscreen && (
                <div className="fixed bottom-6 right-6 flex gap-3 z-50">
                    <button onClick={toggleTheme} className="p-4 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl">
                        {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={onAdminClick} className="hidden md:flex p-4 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-[#ff6600] transition-all shadow-2xl">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
};
export default DashboardScreen;
