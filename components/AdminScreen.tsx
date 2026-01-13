
import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, TrashIcon, LogOutIcon, CameraIcon, SettingsIcon } from './Icons';

const normalizarTurno = (turnoRaw: string): string => {
    if (!turnoRaw) return 'Matutino';
    const t = turnoRaw.trim().toLowerCase();
    if (t.includes('matutino') || t.includes('manhã') || t.includes('manha')) return 'Matutino';
    if (t.includes('vespertino') || t.includes('tarde')) return 'Vespertino';
    if (t.includes('noturno') || t.includes('noite')) return 'Noturno';
    return 'Matutino';
};

const calcularTurno = (inicio: string): string => {
    if (!inicio) return 'Matutino';
    const h = parseInt(inicio.split(':')[0], 10);
    if (isNaN(h)) return 'Matutino';
    if (h < 12) return 'Matutino';
    if (h < 18) return 'Vespertino';
    return 'Noturno';
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loadingSync, setLoadingSync] = useState(false);

    const filteredAulas = useMemo(() => {
        if (!context) return [];
        let items = [...context.aulas];
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

    const handleSync = async () => {
        setLoadingSync(true);
        try {
            const res = await fetch('/csv/aulas.csv');
            if (!res.ok) throw new Error("Arquivo não encontrado em /public/csv/aulas.csv");
            
            const text = await res.text();
            const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
            if (rows.length < 2) throw new Error("O CSV parece estar vazio.");

            // Detectar separador (vírgula ou ponto-e-vírgula)
            const headerRow = rows[0];
            const separator = headerRow.includes(';') ? ';' : ',';
            const headers = headerRow.split(separator).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

            // Mapear índices das colunas por palavras-chave
            const idx = {
                data: headers.findIndex(h => h.includes('data')),
                sala: headers.findIndex(h => h.includes('ambiente') || h.includes('sala')),
                turma: headers.findIndex(h => h.includes('turma')),
                instrutor: headers.findIndex(h => h.includes('instrutor')),
                uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular')),
                inicio: headers.findIndex(h => h.includes('inicio') || h.includes('início')),
                fim: headers.findIndex(h => h.includes('fim')),
                turno: headers.findIndex(h => h.includes('turno'))
            };

            // Validação mínima
            if (idx.data === -1 || idx.turma === -1 || idx.inicio === -1) {
                throw new Error("Colunas obrigatórias (Data, Turma, Inicio) não encontradas no CSV.");
            }

            rows.shift(); // Remove cabeçalho

            const data = rows.map(r => {
                const v = r.split(separator).map(s => s.trim().replace(/^"|"$/g, ''));
                const inicio = v[idx.inicio] || '';
                
                // Prioriza o turno da coluna, senão calcula
                const turnoCSV = idx.turno !== -1 ? v[idx.turno] : '';
                const turnoFinal = turnoCSV ? normalizarTurno(turnoCSV) : calcularTurno(inicio);

                return {
                    data: v[idx.data] || '',
                    sala: v[idx.sala] || '',
                    turma: v[idx.turma] || '',
                    instrutor: v[idx.instrutor] || '',
                    unidade_curricular: v[idx.uc] || '',
                    inicio: inicio,
                    fim: v[idx.fim] || '',
                    turno: turnoFinal
                };
            }).filter(a => a.data && a.inicio);

            context?.updateAulasFromCSV(data);
            alert(`Sincronizado com sucesso! ${data.length} aulas importadas.`);
        } catch (e: any) {
            alert(`Erro na importação: ${e.message}`);
        } finally {
            setLoadingSync(false);
        }
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Gestão de Painel</h1>
                    <span className="text-[10px] text-white/30 tracking-widest uppercase">Admin Online — Local Storage</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleSync} disabled={loadingSync} className="bg-[#ff6600] px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50">
                        <UploadCloudIcon className="w-4 h-4" /> {loadingSync ? "Sincronizando..." : "Sincronizar GitHub"}
                    </button>
                    <button onClick={onLogout} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><LogOutIcon /></button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h2 className="text-sm font-bold uppercase text-[#ff6600] mb-4 flex items-center gap-2"><CameraIcon className="w-4 h-4"/> Adicionar Mídia</h2>
                    <p className="text-[10px] text-white/30 mb-4">Caminho: /public/midia/nome-do-arquivo.mp4</p>
                    <div className="flex gap-2">
                        <input id="ad-url" placeholder="/midia/video.mp4" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#ff6600] transition-colors" />
                        <button onClick={() => {
                            const val = (document.getElementById('ad-url') as HTMLInputElement).value;
                            if(val) {
                                context.addAnuncio({ src: val, type: val.toLowerCase().endsWith('.mp4') ? 'video' : 'image' });
                                (document.getElementById('ad-url') as HTMLInputElement).value = '';
                            }
                        }} className="bg-white text-black px-4 rounded-xl font-bold hover:bg-[#ff6600] hover:text-white transition-all">+</button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {context.anuncios.map(ad => (
                            <div key={ad.id} className="relative group">
                                <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-white/10">
                                    {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] bg-orange-500/20 text-orange-500 font-bold">MP4</div>}
                                </div>
                                <button onClick={() => context.deleteAnuncio(ad.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><XIcon className="w-2 h-2" /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold uppercase text-[#ff6600] flex items-center gap-2"><FileTextIcon className="w-4 h-4"/> Filtro de Período</h2>
                        <button onClick={context.clearAulas} className="text-[10px] text-red-500 font-bold border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/10 transition-colors">Limpar Todo o Painel</button>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-bold opacity-30">Data Inicial</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none text-white/80" />
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-bold opacity-30">Data Final</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none text-white/80" />
                        </div>
                        {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('');}} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><XIcon className="w-4 h-4 text-red-500" /></button>}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-white/5 uppercase font-bold text-white/20 tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Turno</th>
                                <th className="p-4">Horário</th>
                                <th className="p-4">Turma</th>
                                <th className="p-4">Sala</th>
                                <th className="p-4">Instrutor</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAulas.map(a => (
                                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-mono opacity-60">{a.data}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                            a.turno === 'Matutino' ? 'bg-yellow-500/10 text-yellow-500' : 
                                            a.turno === 'Vespertino' ? 'bg-orange-500/10 text-orange-500' : 
                                            'bg-indigo-500/10 text-indigo-500'
                                        }`}>
                                            {a.turno}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-[#ff6600]">{a.inicio} - {a.fim}</td>
                                    <td className="p-4 font-black">{a.turma}</td>
                                    <td className="p-4 opacity-70">{a.sala}</td>
                                    <td className="p-4 opacity-50 italic">{a.instrutor}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => context.deleteAula(a.id)} className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"><TrashIcon className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredAulas.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="opacity-10"><FileTextIcon className="w-12 h-12" /></div>
                        <p className="opacity-20 uppercase tracking-[0.3em] font-black text-xs">Nenhum dado importado para o período</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    if (!auth) return (
        <div className="h-screen w-screen flex items-center justify-center bg-black relative">
            <div className="absolute inset-0 bg-[#ff6600]/5 radial-gradient"></div>
            <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 w-full max-w-sm text-center backdrop-blur-3xl shadow-2xl relative z-10">
                <div className="w-16 h-16 bg-[#ff6600] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-500/20"><SettingsIcon className="text-white w-8 h-8" /></div>
                <h2 className="text-xl font-black mb-8 tracking-tighter">ACESSO RESTRITO</h2>
                <form onSubmit={e => { e.preventDefault(); setAuth(true); }} className="space-y-4">
                    <input type="password" autoFocus placeholder="SENHA DE ACESSO" className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-center text-xs tracking-[0.3em] outline-none focus:border-[#ff6600] transition-all placeholder:opacity-20" />
                    <button className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-[#ff6600] hover:text-white transition-all uppercase text-xs active:scale-95">Entrar no Painel</button>
                </form>
                <button onClick={onReturnToDashboard} className="mt-8 text-[9px] opacity-30 hover:opacity-100 uppercase font-black tracking-widest transition-opacity">Voltar ao Dashboard</button>
            </div>
        </div>
    );
    return <AdminPanel onLogout={onReturnToDashboard} />;
};

export default AdminScreen;
