
import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, TrashIcon, LogOutIcon, CameraIcon, SettingsIcon } from './Icons';

// Função para calcular o turno baseado estritamente no horário de início
const calcularTurnoPorHorario = (horarioStr: string): string => {
    if (!horarioStr || !horarioStr.includes(':')) return 'Matutino';
    
    const [horas, minutos] = horarioStr.split(':').map(Number);
    const totalMinutos = (horas * 60) + (minutos || 0);

    // Matutino: 06:00 (360 min) até 11:30 (690 min)
    if (totalMinutos >= 360 && totalMinutos <= 690) return 'Matutino';
    
    // Vespertino: 11:31 (691 min) até 17:30 (1050 min)
    if (totalMinutos >= 691 && totalMinutos <= 1050) return 'Vespertino';
    
    // Noturno: 17:31 (1051 min) até 22:00 (1320 min)
    if (totalMinutos >= 1051 && totalMinutos <= 1320) return 'Noturno';

    // Fallback padrão se estiver fora das faixas (ex: madrugada)
    if (totalMinutos < 360) return 'Matutino';
    return 'Noturno';
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loadingSync, setLoadingSync] = useState(false);
    const [previewAulas, setPreviewAulas] = useState<Aula[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const aulasExibidas = useMemo(() => {
        let items = hasUnsavedChanges ? [...previewAulas] : (context ? [...context.aulas] : []);
        
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
    }, [context?.aulas, previewAulas, hasUnsavedChanges, startDate, endDate]);

    const handleLoadCSV = async () => {
        setLoadingSync(true);
        try {
            const res = await fetch('/csv/aulas.csv?t=' + Date.now());
            if (!res.ok) throw new Error("Arquivo aulas.csv não encontrado.");
            
            const text = await res.text();
            const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
            if (rows.length < 2) throw new Error("O CSV está vazio.");

            const separator = rows[0].includes(';') ? ';' : ',';
            const headers = rows[0].split(separator).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

            const idx = {
                data: headers.findIndex(h => h.includes('data')),
                sala: headers.findIndex(h => h.includes('ambiente') || h.includes('sala')),
                turma: headers.findIndex(h => h.includes('turma')),
                instrutor: headers.findIndex(h => h.includes('instrutor')),
                uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular')),
                inicio: headers.findIndex(h => h.includes('inicio') || h.includes('início')),
                fim: headers.findIndex(h => h.includes('fim'))
            };

            if (idx.data === -1 || idx.turma === -1 || idx.inicio === -1) {
                throw new Error("Colunas obrigatórias não encontradas.");
            }

            rows.shift();

            const importedData = rows.map(r => {
                const v = r.split(separator).map(s => s.trim().replace(/^"|"$/g, ''));
                const horaInicio = v[idx.inicio] || '';
                
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    data: v[idx.data] || '',
                    sala: v[idx.sala] || '',
                    turma: v[idx.turma] || '',
                    instrutor: v[idx.instrutor] || '',
                    unidade_curricular: v[idx.uc] || '',
                    inicio: horaInicio,
                    fim: v[idx.fim] || '',
                    // Aqui forçamos o cálculo pelo horário, ignorando o turno do CSV
                    turno: calcularTurnoPorHorario(horaInicio)
                };
            }).filter(a => a.data && a.inicio);

            setPreviewAulas(importedData);
            setHasUnsavedChanges(true);
            alert(`${importedData.length} aulas processadas por horário. Clique em PUBLICAR.`);
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
        } finally {
            setLoadingSync(false);
        }
    };

    const handleSaveChanges = () => {
        if (context && previewAulas.length > 0) {
            context.updateAulasFromCSV(previewAulas);
            setHasUnsavedChanges(false);
            alert("DADOS PUBLICADOS! O painel principal foi atualizado com a nova escala de horários.");
        }
    };

    const handleDelete = (id: string) => {
        if (hasUnsavedChanges) {
            setPreviewAulas(prev => prev.filter(a => a.id !== id));
        } else {
            context?.deleteAula(id);
        }
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#050508] text-white p-10 font-sans">
            <header className="flex justify-between items-center mb-12">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">ADMINISTRAÇÃO</h1>
                    <span className="text-xs font-bold text-[#ff6600] tracking-[0.4em] uppercase opacity-60">
                        {hasUnsavedChanges ? "MODO REVISÃO — VERIFIQUE OS TURNOS CALCULADOS" : "GESTÃO DE AMBIENTES"}
                    </span>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleLoadCSV} disabled={loadingSync} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px] flex items-center gap-3 hover:bg-white/20 transition-all">
                        <UploadCloudIcon className="w-4 h-4" /> 1. Carregar CSV
                    </button>
                    <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges} className={`px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-3 transition-all active:scale-95 shadow-2xl ${hasUnsavedChanges ? 'bg-[#ff6600] text-white animate-pulse' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                        2. Publicar no Painel
                    </button>
                    <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl opacity-40 hover:opacity-100 transition-opacity">
                        <LogOutIcon />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3"><CameraIcon className="w-6 h-6 text-[#ff6600]"/><h2 className="text-sm font-black uppercase tracking-widest">Anúncios</h2></div>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input id="ad-url" placeholder="/midia/video.mp4" className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl text-[11px] outline-none" />
                            <button onClick={() => {
                                const val = (document.getElementById('ad-url') as HTMLInputElement).value;
                                if(val) { context.addAnuncio({ src: val, type: val.toLowerCase().endsWith('.mp4') ? 'video' : 'image' }); (document.getElementById('ad-url') as HTMLInputElement).value = ''; }
                            }} className="bg-white text-black px-5 rounded-2xl font-black">+</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {context.anuncios.map(ad => (
                                <div key={ad.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black">
                                    {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">MOV</div>}
                                    <button onClick={() => context.deleteAnuncio(ad.id)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-6">
                    <div className="flex justify-between items-center"><div className="flex items-center gap-3"><FileTextIcon className="w-6 h-6 text-[#ff6600]"/><h2 className="text-sm font-black uppercase tracking-widest">Configuração</h2></div><button onClick={context.clearAulas} className="text-[10px] font-black text-red-500 border border-red-500/20 px-4 py-2 rounded-full">LIMPAR TUDO</button></div>
                    <div className="grid grid-cols-2 gap-6 bg-black/40 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-black opacity-30 tracking-widest">Filtrar Início</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm outline-none text-white font-bold" /></div>
                        <div className="flex flex-col gap-2 border-l border-white/10 pl-6"><span className="text-[10px] uppercase font-black opacity-30 tracking-widest">Filtrar Fim</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm outline-none text-white font-bold" /></div>
                    </div>
                </div>
            </div>

            <div className={`rounded-[3rem] border overflow-hidden shadow-2xl transition-all ${hasUnsavedChanges ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 bg-white/5'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-white/5 uppercase font-black text-white/20 tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-6">Data</th>
                                <th className="p-6">Turno (Auto)</th>
                                <th className="p-6">Horário</th>
                                <th className="p-6">Ambiente (Sala)</th>
                                <th className="p-6">Instrutor</th>
                                <th className="p-6">Turma</th>
                                <th className="p-6 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {aulasExibidas.map(a => (
                                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 font-mono opacity-40">{a.data}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                            a.turno === 'Matutino' ? 'bg-yellow-500/10 text-yellow-500' : 
                                            a.turno === 'Vespertino' ? 'bg-orange-500/10 text-orange-500' : 
                                            'bg-indigo-500/10 text-indigo-500'
                                        }`}>
                                            {a.turno}
                                        </span>
                                    </td>
                                    <td className="p-6 font-black text-[#ff6600]">{a.inicio} - {a.fim}</td>
                                    <td className="p-6 font-black uppercase">{a.sala}</td>
                                    <td className="p-6 font-bold opacity-70 italic">{a.instrutor}</td>
                                    <td className="p-6 opacity-40">{a.turma}</td>
                                    <td className="p-6 text-right">
                                        <button onClick={() => handleDelete(a.id)} className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-3 rounded-2xl transition-all"><TrashIcon className="w-4 h-4"/></button>
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
        <div className="h-screen w-screen flex items-center justify-center bg-[#020205] relative">
            <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 w-full max-w-sm text-center backdrop-blur-3xl shadow-2xl">
                <div className="w-20 h-20 bg-[#ff6600] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-orange-500/40"><SettingsIcon className="text-white w-10 h-10" /></div>
                <h2 className="text-2xl font-black mb-10 tracking-tighter uppercase">Painel Admin</h2>
                <form onSubmit={e => { e.preventDefault(); setAuth(true); }} className="space-y-6">
                    <input type="password" autoFocus placeholder="SENHA" className="w-full bg-black/40 border border-white/10 p-5 rounded-[1.5rem] text-center text-xs tracking-[0.5em] outline-none" />
                    <button className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] hover:bg-[#ff6600] hover:text-white transition-all uppercase text-xs active:scale-95">Entrar</button>
                </form>
                <button onClick={onReturnToDashboard} className="mt-10 text-[10px] opacity-30 hover:opacity-100 uppercase font-black transition-opacity">Voltar ao Painel</button>
            </div>
        </div>
    );
    return <AdminPanel onLogout={onReturnToDashboard} />;
};

export default AdminScreen;
