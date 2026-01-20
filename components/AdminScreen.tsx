
import React, { useState, useContext, useRef, useMemo } from 'react';
import { DataContext, ExtendedDataContextType } from '../context/DataContext';
import { Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, TrashIcon, LogOutIcon, CameraIcon, SettingsIcon, PlusCircleIcon, SunIcon, MoonIcon, ClockIcon } from './Icons';

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const SunHorizonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41-1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

const sanitizeVideoUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
        const id = url.match(/\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
        if (id) return `https://drive.google.com/file/d/${id}/preview?autoplay=1`;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const id = url.match(/(?:v=|\/embed\/|\/watch\?v=|\/\d+\/|\/vi\/|be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0`;
    }
    return url;
};

const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const EditModal: React.FC<{ aula: Aula; onSave: (d: Partial<Aula>) => void; onClose: () => void }> = ({ aula, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Aula>>(aula);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#1a1b1e] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Editar Registro</h2>
                        <p className="text-[10px] text-[#ff6600] font-bold uppercase tracking-wider opacity-60">ID: {aula.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all active:scale-90"><XIcon className="w-5 h-5" /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                        { label: 'Turma', key: 'turma' },
                        { label: 'Ambiente / Sala', key: 'sala' },
                        { label: 'Instrutor', key: 'instrutor' },
                        { label: 'Unidade Curricular', key: 'unidade_curricular' },
                        { label: 'Início', key: 'inicio' },
                        { label: 'Fim', key: 'fim' }
                    ].map(field => (
                        <div key={field.key} className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase opacity-40 tracking-widest px-1">{field.label}</label>
                            <input 
                                value={(formData as any)[field.key]} 
                                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} 
                                className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600] transition-colors"
                            />
                        </div>
                    ))}
                    <div className="md:col-span-2 mt-6 flex gap-3">
                        <button type="submit" className="flex-1 bg-[#ff6600] text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">Confirmar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext) as ExtendedDataContextType;
    const [editingAula, setEditingAula] = useState<Aula | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados de Busca e Filtro
    const [searchDate, setSearchDate] = useState('');
    const [searchTurma, setSearchTurma] = useState('');
    const [searchInstrutor, setSearchInstrutor] = useState('');
    const [filterShift, setFilterShift] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            context.uploadCSV(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddAd = () => {
        const input = document.getElementById('ad-url') as HTMLInputElement;
        if (input.value) {
            const url = input.value.trim();
            const isVid = url.includes('youtube') || url.includes('youtu.be') || url.includes('drive.google.com') || isDirectVideo(url);
            const sanitized = isVid ? sanitizeVideoUrl(url) : url;
            
            context.addAnuncio({ 
                src: sanitized, 
                type: isVid ? 'video' : 'image' 
            });
            input.value = '';
        }
    };

    const getTodayFormatted = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Lógica de Filtragem de Aulas
    const filteredAulasAdmin = useMemo(() => {
        return context.aulas.filter(aula => {
            const matchesDate = !searchDate || aula.data.includes(searchDate);
            const matchesTurma = !searchTurma || aula.turma.toLowerCase().includes(searchTurma.toLowerCase());
            const matchesInstrutor = !searchInstrutor || aula.instrutor.toLowerCase().includes(searchInstrutor.toLowerCase());
            const matchesShift = !filterShift || (aula.turno && aula.turno.toLowerCase() === filterShift.toLowerCase());
            
            return matchesDate && matchesTurma && matchesInstrutor && matchesShift;
        });
    }, [context.aulas, searchDate, searchTurma, searchInstrutor, filterShift]);

    return (
        <div className="min-h-screen bg-[#050508] text-white p-4 md:p-10">
            {editingAula && <EditModal aula={editingAula} onClose={() => setEditingAula(null)} onSave={d => { context.updateAula(editingAula.id, d); setEditingAula(null); }} />}
            
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Central de Comando</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sincronizado com Firebase Firestore</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={context.loading}
                        className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff6600] hover:text-white transition-all shadow-2xl disabled:opacity-50 active:scale-95"
                    >
                        <UploadCloudIcon className={`w-5 h-5 ${context.loading ? 'loading-pulse' : ''}`} /> 
                        {context.loading ? 'Processando Arquivo...' : 'Upload Novo CSV'}
                    </button>
                    <button 
                        onClick={() => context.clearAulas()} 
                        className="bg-red-600/10 text-red-500 border border-red-600/20 px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                        <TrashIcon className="w-5 h-5" /> Limpar Banco
                    </button>
                    <button onClick={onLogout} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"><LogOutIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Anúncios */}
                <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <CameraIcon className="w-6 h-6 text-[#ff6600]" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Mídia Rotativa</h2>
                    </div>
                    <div className="flex flex-col gap-3 mb-6">
                        <input id="ad-url" placeholder="Link (YouTube, Drive ou Imagem)" className="flex-1 bg-black/60 border border-white/10 p-4 rounded-2xl text-[10px] outline-none focus:border-[#ff6600] transition-all" />
                        <button onClick={handleAddAd} className="bg-[#ff6600] text-white py-4 rounded-2xl font-black hover:bg-white hover:text-black transition-all shadow-lg uppercase text-[10px] tracking-widest">Adicionar Mídia</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {context.anuncios.map(ad => (
                            <div key={ad.id} className="relative group aspect-video rounded-3xl overflow-hidden bg-black border border-white/5 shadow-inner">
                                {ad.type === 'image' ? (
                                    <img src={ad.src} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
                                ) : isDirectVideo(ad.src) ? (
                                    <video 
                                        src={ad.src} 
                                        autoPlay 
                                        muted 
                                        loop 
                                        playsInline 
                                        className="w-full h-full object-cover pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" 
                                    />
                                ) : (
                                    <iframe 
                                        src={ad.src} 
                                        className="w-full h-full border-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" 
                                        allow="autoplay; encrypted-media"
                                    ></iframe>
                                )}
                                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-widest border border-white/10">
                                    {ad.type}
                                </div>
                                <button onClick={() => context.deleteAnuncio(ad.id)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                                    <TrashIcon className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {context.anuncios.length === 0 && (
                        <div className="py-12 text-center text-[10px] font-bold text-white/20 uppercase tracking-widest border-2 border-dashed border-white/5 rounded-[2.5rem]">Sem anúncios ativos</div>
                    )}
                </div>

                {/* Coluna Aulas */}
                <div className="lg:col-span-2 bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <FileTextIcon className="w-6 h-6 text-[#ff6600]" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Cronograma Ativo</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {context.syncSource && <span className="text-[9px] font-black text-[#ff6600] uppercase tracking-widest bg-[#ff6600]/10 px-3 py-1 rounded-full">{context.syncSource}</span>}
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{filteredAulasAdmin.length} de {context.aulas.length} Aulas</span>
                        </div>
                    </div>

                    {/* Barra de Busca e Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase opacity-40 tracking-widest px-1">Buscar por Data</label>
                            <input 
                                type="text"
                                placeholder="DD/MM/YYYY"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                className="bg-black/40 border border-white/10 p-3 rounded-xl text-[11px] outline-none focus:border-[#ff6600] transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase opacity-40 tracking-widest px-1">Buscar por Turma</label>
                            <input 
                                type="text"
                                placeholder="Nome da turma..."
                                value={searchTurma}
                                onChange={(e) => setSearchTurma(e.target.value)}
                                className="bg-black/40 border border-white/10 p-3 rounded-xl text-[11px] outline-none focus:border-[#ff6600] transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black uppercase opacity-40 tracking-widest px-1">Buscar por Instrutor</label>
                            <input 
                                type="text"
                                placeholder="Nome do instrutor..."
                                value={searchInstrutor}
                                onChange={(e) => setSearchInstrutor(e.target.value)}
                                className="bg-black/40 border border-white/10 p-3 rounded-xl text-[11px] outline-none focus:border-[#ff6600] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Botões de Filtro por Turno e Botão Hoje */}
                    <div className="flex flex-wrap gap-3 mb-8 border-b border-white/5 pb-6">
                        <button
                            onClick={() => setSearchDate(getTodayFormatted())}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                searchDate === getTodayFormatted()
                                ? 'bg-white text-[#ff6600] shadow-lg scale-105' 
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Hoje
                        </button>

                        {[
                            { id: 'Matutino', icon: SunIcon },
                            { id: 'Vespertino', icon: SunHorizonIcon },
                            { id: 'Noturno', icon: MoonIcon }
                        ].map((t) => {
                            const Icon = t.icon;
                            const isActive = filterShift === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setFilterShift(isActive ? null : t.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                        isActive 
                                        ? 'bg-[#ff6600] text-white shadow-lg' 
                                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {t.id}
                                </button>
                            );
                        })}
                        {(searchDate || searchTurma || searchInstrutor || filterShift) && (
                            <button 
                                onClick={() => {
                                    setSearchDate('');
                                    setSearchTurma('');
                                    setSearchInstrutor('');
                                    setFilterShift(null);
                                }}
                                className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Limpar Filtros
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-white/5 text-white/30 uppercase tracking-[0.2em] border-b border-white/5 font-black">
                                <tr>
                                    <th className="p-5">Data</th>
                                    <th className="p-5">Sala / Ambiente</th>
                                    <th className="p-5">Turma</th>
                                    <th className="p-5">Instrutor</th>
                                    <th className="p-5">Turno</th>
                                    <th className="p-5 text-right">Controles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredAulasAdmin.map(a => (
                                    <tr key={a.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="p-5 text-white/40 group-hover:text-white transition-colors">{a.data}</td>
                                        <td className="p-5 font-black text-[#ff6600] uppercase tracking-wider">{a.sala.replace(/^VTRIA-\d+-/i, '')}</td>
                                        <td className="p-5 font-bold uppercase text-white/80">{a.turma}</td>
                                        <td className="p-5 font-medium text-white/60">{a.instrutor}</td>
                                        <td className="p-5 text-white/30 italic">{a.turno}</td>
                                        <td className="p-5 text-right flex justify-end gap-3">
                                            <button onClick={() => setEditingAula(a)} className="p-2.5 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => context.deleteAula(a.id)} className="p-2.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(filteredAulasAdmin.length === 0) && !context.loading && (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                <PlusCircleIcon className="w-12 h-12 stroke-[1px]" />
                                <p className="text-xs font-black uppercase tracking-[0.2em]">
                                    {context.aulas.length > 0 ? 'Nenhuma aula corresponde aos filtros aplicados.' : 'Nenhum registro encontrado. Faça upload do CSV para começar.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    const [password, setPassword] = useState("");

    if (!auth) return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#020205] p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff6600] opacity-10 blur-[150px] rounded-full"></div>
            <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 w-full max-sm text-center shadow-2xl backdrop-blur-3xl relative z-10">
                <div className="w-20 h-20 bg-[#ff6600] rounded-3xl mx-auto mb-10 flex items-center justify-center shadow-2xl shadow-orange-600/30">
                    <SettingsIcon className="text-white w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black mb-12 uppercase tracking-tighter text-white">Modo Admin</h2>
                <form onSubmit={e => { e.preventDefault(); setAuth(true); }} className="space-y-4">
                    <input 
                        type="password" 
                        autoFocus 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-black/60 border border-white/10 p-6 rounded-3xl text-center text-sm tracking-[1em] outline-none focus:border-[#ff6600] transition-all text-white placeholder:tracking-normal" 
                    />
                    <button className="w-full bg-white text-black font-black py-6 rounded-3xl hover:bg-[#ff6600] hover:text-white transition-all uppercase text-xs active:scale-95 shadow-xl">Autenticar</button>
                    <button type="button" onClick={onReturnToDashboard} className="w-full py-4 text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Voltar ao Dashboard</button>
                </form>
            </div>
        </div>
    );
    return <AdminPanel onLogout={onReturnToDashboard} />;
};

export default AdminScreen;
