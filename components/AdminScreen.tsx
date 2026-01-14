
import React, { useState, useContext, useMemo } from 'react';
import { DataContext, ExtendedDataContextType } from '../context/DataContext';
import { Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, TrashIcon, LogOutIcon, CameraIcon, SettingsIcon, ClockIcon } from './Icons';

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const sanitizeDriveUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
        const id = url.match(/\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
        if (id) {
            // Se for vídeo, gera link de download direto
            if (url.toLowerCase().endsWith('.mp4') || url.includes('video')) {
                return `https://drive.google.com/uc?export=download&id=${id}`;
            }
            // Se for imagem, usa o renderer de miniaturas de alta qualidade
            return `https://drive.google.com/uc?id=${id}`;
        }
    }
    return url;
};

const EditModal: React.FC<{ aula: Aula; onSave: (d: Partial<Aula>) => void; onClose: () => void }> = ({ aula, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Aula>>(aula);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#1a1b1e] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Editar Atividade</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Turma</label>
                        <input value={formData.turma} onChange={e => setFormData({ ...formData, turma: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Ambiente (Sala)</label>
                        <input value={formData.sala} onChange={e => setFormData({ ...formData, sala: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Instrutor</label>
                        <input value={formData.instrutor} onChange={e => setFormData({ ...formData, instrutor: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Unidade Curricular</label>
                        <input value={formData.unidade_curricular} onChange={e => setFormData({ ...formData, unidade_curricular: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Data</label>
                        <input value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Turno</label>
                        <select value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600] appearance-none">
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Noturno">Noturno</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Início</label>
                        <input value={formData.inicio} onChange={e => setFormData({ ...formData, inicio: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Fim</label>
                        <input value={formData.fim} onChange={e => setFormData({ ...formData, fim: e.target.value })} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-[#ff6600]" />
                    </div>
                    <div className="md:col-span-2 pt-4">
                        <button type="submit" className="w-full bg-[#ff6600] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all shadow-2xl">Salvar Atualização</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext) as ExtendedDataContextType;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [editingAula, setEditingAula] = useState<Aula | null>(null);

    const aulasExibidas = useMemo(() => {
        let items = context ? [...context.aulas] : [];
        if (startDate || endDate) {
            items = items.filter(a => {
                const parts = a.data.split('/');
                if (parts.length !== 3) return true;
                const [d, m, y] = parts;
                const date = new Date(`${y}-${m}-${d}`);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        return items.sort((a, b) => {
            const dateA = a.data.split('/').reverse().join('-');
            const dateB = b.data.split('/').reverse().join('-');
            return dateA.localeCompare(dateB) || a.inicio.localeCompare(b.inicio);
        });
    }, [context?.aulas, startDate, endDate]);

    if (!context) return null;

    const handleSync = () => {
        context.syncFromRepository();
    };

    const handleAddAd = () => {
        const input = document.getElementById('ad-url') as HTMLInputElement;
        if (input.value) {
            const sanitized = sanitizeDriveUrl(input.value);
            context.addAnuncio({ 
                src: sanitized, 
                type: (sanitized.toLowerCase().endsWith('.mp4') || sanitized.includes('export=download')) ? 'video' : 'image' 
            });
            input.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-[#050508] text-white p-4 md:p-10 font-sans">
            {editingAula && (
                <EditModal 
                    aula={editingAula} 
                    onClose={() => setEditingAula(null)} 
                    onSave={(data) => {
                        context.updateAula(editingAula.id, data);
                        setEditingAula(null);
                    }} 
                />
            )}

            <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-6">
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">ADMINISTRAÇÃO</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-[#ff6600] tracking-[0.4em] uppercase opacity-60">Sincronização e Edição Manual</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    {context.syncSource && (
                        <div className="flex flex-col items-end mr-2 text-right">
                             <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Dados Ativos via</span>
                             <span className="text-[10px] font-bold text-[#ff6600] uppercase tracking-tighter bg-[#ff6600]/5 px-2 py-0.5 rounded border border-[#ff6600]/10">{context.syncSource}</span>
                        </div>
                    )}
                    <button 
                        onClick={handleSync} 
                        disabled={context.loading} 
                        className="w-full md:w-auto bg-[#ff6600] text-white px-6 md:px-8 py-3 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                        <UploadCloudIcon className={`w-4 h-4 md:w-5 md:h-5 ${context.loading ? 'animate-bounce' : ''}`} /> 
                        {context.loading ? "PROCESSANDO..." : "RECARREGAR CSV ORIGINAL"}
                    </button>
                    <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl opacity-40 hover:opacity-100 transition-opacity">
                        <LogOutIcon />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="bg-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3"><CameraIcon className="w-6 h-6 text-[#ff6600]"/><h2 className="text-sm font-black uppercase tracking-widest">Anúncios (Drive OK)</h2></div>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input id="ad-url" placeholder="Link público (Drive/URL)" className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl text-[11px] outline-none" />
                            <button onClick={handleAddAd} className="bg-white text-black px-5 rounded-2xl font-black hover:bg-[#ff6600] hover:text-white transition-all">+</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {context.anuncios.map(ad => (
                                <div key={ad.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black">
                                    {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#ff6600]">VIDEO</div>}
                                    <button onClick={() => context.deleteAnuncio(ad.id)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3"><FileTextIcon className="w-6 h-6 text-[#ff6600]"/><h2 className="text-sm font-black uppercase tracking-widest">Painel de Controle</h2></div>
                        <p className="text-[9px] md:text-[10px] font-bold opacity-30 italic">Edite qualquer campo abaixo. As mudanças são salvas instantaneamente para todos.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-black/40 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
                        <div className="flex flex-col gap-2"><span className="text-[9px] uppercase font-black opacity-30 tracking-widest">Data Inicial</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm outline-none text-white font-bold" /></div>
                        <div className="flex flex-col gap-2 md:border-l md:border-white/10 md:pl-6"><span className="text-[9px] uppercase font-black opacity-30 tracking-widest">Data Final</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm outline-none text-white font-bold" /></div>
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] md:rounded-[3rem] border border-white/5 bg-white/5 overflow-hidden shadow-2xl mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] md:text-[11px] border-collapse min-w-[800px]">
                        <thead className="bg-white/5 uppercase font-black text-white/20 tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4 md:p-6">Data</th>
                                <th className="p-4 md:p-6">Turno</th>
                                <th className="p-4 md:p-6">Horário</th>
                                <th className="p-4 md:p-6">Ambiente</th>
                                <th className="p-4 md:p-6">Instrutor</th>
                                <th className="p-4 md:p-6">Turma</th>
                                <th className="p-4 md:p-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {aulasExibidas.map(a => (
                                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 md:p-6 font-mono opacity-40">{a.data}</td>
                                    <td className="p-4 md:p-6">
                                        <span className={`px-2 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-tighter ${
                                            a.turno === 'Matutino' ? 'bg-yellow-500/10 text-yellow-500' : 
                                            a.turno === 'Vespertino' ? 'bg-orange-500/10 text-orange-500' : 
                                            'bg-indigo-500/10 text-indigo-500'
                                        }`}>
                                            {a.turno}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-6 font-black text-[#ff6600] whitespace-nowrap">{a.inicio} - {a.fim}</td>
                                    <td className="p-4 md:p-6 font-black uppercase text-[#ff6600]">{a.sala}</td>
                                    <td className="p-4 md:p-6 font-bold opacity-70 italic">{a.instrutor}</td>
                                    <td className="p-4 md:p-6 opacity-40">{a.turma}</td>
                                    <td className="p-4 md:p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingAula(a)} className="text-white/20 hover:text-[#ff6600] hover:bg-[#ff6600]/10 p-2 md:p-3 rounded-xl transition-all"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => context.deleteAula(a.id)} className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-2 md:p-3 rounded-xl transition-all"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    if (!auth) return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#020205] p-6 relative">
            <div className="bg-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 w-full max-w-sm text-center backdrop-blur-3xl shadow-2xl">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ff6600] rounded-2xl md:rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-orange-500/40"><SettingsIcon className="text-white w-8 h-8 md:w-10 md:h-10" /></div>
                <h2 className="text-xl md:text-2xl font-black mb-8 md:mb-10 tracking-tighter uppercase">Painel Admin</h2>
                <form onSubmit={e => { e.preventDefault(); setAuth(true); }} className="space-y-6">
                    <input type="password" autoFocus placeholder="SENHA" className="w-full bg-black/40 border border-white/10 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] text-center text-xs tracking-[0.5em] outline-none" />
                    <button className="w-full bg-white text-black font-black py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] hover:bg-[#ff6600] hover:text-white transition-all uppercase text-xs active:scale-95">Entrar</button>
                </form>
                <button onClick={onReturnToDashboard} className="mt-8 md:mt-10 text-[9px] md:text-[10px] opacity-30 hover:opacity-100 uppercase font-black transition-opacity">Sair para o Painel</button>
            </div>
        </div>
    );
    return <AdminPanel onLogout={onReturnToDashboard} />;
};

export default AdminScreen;
