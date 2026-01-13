
import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Aula } from '../types';
// Fixed: Added SettingsIcon to the import list
import { XIcon, UploadCloudIcon, FileTextIcon, TrashIcon, LogOutIcon, CameraIcon, SettingsIcon } from './Icons';

const calcularTurno = (inicio: string): string => {
    const h = parseInt(inicio, 10);
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
                const [d, m, y] = a.data.split('/');
                const date = new Date(`${y}-${m}-${d}`);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        return items.sort((a,b) => a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio));
    }, [context?.aulas, startDate, endDate]);

    const handleSync = async () => {
        setLoadingSync(true);
        try {
            const res = await fetch('/csv/aulas.csv');
            if (!res.ok) throw new Error("Arquivo não encontrado em /public/csv/aulas.csv");
            const text = await res.text();
            const rows = text.split('\n').filter(r => r.trim() !== '');
            rows.shift(); // remove header
            const data = rows.map(r => {
                const v = r.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                return { data: v[0], sala: v[1], turma: v[2], instrutor: v[3], unidade_curricular: v[4], inicio: v[5], fim: v[6], turno: calcularTurno(v[5]) };
            }).filter(a => a.data && a.inicio);
            context?.updateAulasFromCSV(data);
            alert("Sincronizado com sucesso!");
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingSync(false);
        }
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Gestão de Painel</h1>
                <div className="flex gap-4">
                    <button onClick={handleSync} disabled={loadingSync} className="bg-[#ff6600] px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors">
                        <UploadCloudIcon className="w-4 h-4" /> {loadingSync ? "Sincronizando..." : "Sincronizar GitHub"}
                    </button>
                    <button onClick={onLogout} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><LogOutIcon /></button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h2 className="text-sm font-bold uppercase text-[#ff6600] mb-4 flex items-center gap-2"><CameraIcon className="w-4 h-4"/> Adicionar Mídia</h2>
                    <p className="text-[10px] text-white/30 mb-4">Coloque o arquivo em public/midia/ e informe o nome abaixo:</p>
                    <div className="flex gap-2">
                        <input id="ad-url" placeholder="/midia/exemplo.mp4" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-xs" />
                        <button onClick={() => {
                            const val = (document.getElementById('ad-url') as HTMLInputElement).value;
                            if(val) context.addAnuncio({ src: val, type: val.endsWith('.mp4') ? 'video' : 'image' });
                        }} className="bg-white text-black px-4 rounded-xl font-bold">+</button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold uppercase text-[#ff6600] flex items-center gap-2"><FileTextIcon className="w-4 h-4"/> Filtro de Período</h2>
                        <button onClick={context.clearAulas} className="text-[10px] text-red-500 font-bold border border-red-500/20 px-3 py-1 rounded-full">Limpar Painel</button>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-bold opacity-30">Data Inicial</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-bold opacity-30">Data Final</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                        </div>
                        {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('');}} className="p-2"><XIcon className="w-4 h-4 text-red-500" /></button>}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white/5 uppercase font-bold text-white/40">
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
                            <tr key={a.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono">{a.data}</td>
                                <td className="p-4"><span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{a.turno}</span></td>
                                <td className="p-4 font-bold text-[#ff6600]">{a.inicio} - {a.fim}</td>
                                <td className="p-4 font-bold">{a.turma}</td>
                                <td className="p-4 opacity-70">{a.sala}</td>
                                <td className="p-4 opacity-50">{a.instrutor}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => context.deleteAula(a.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAulas.length === 0 && <div className="p-20 text-center opacity-20 uppercase tracking-widest font-bold">Nenhum dado encontrado</div>}
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    if (!auth) return (
        <div className="h-screen w-screen flex items-center justify-center bg-black">
            <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-[#ff6600] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-500/20"><SettingsIcon className="text-white w-8 h-8" /></div>
                <h2 className="text-xl font-black mb-8">ADMINISTRAÇÃO</h2>
                <form onSubmit={e => { e.preventDefault(); setAuth(true); }} className="space-y-4">
                    <input type="password" placeholder="SENHA DE ACESSO" className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-center text-xs tracking-[0.3em] outline-none focus:border-[#ff6600] transition-colors" />
                    <button className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-[#ff6600] hover:text-white transition-all uppercase text-xs">Acessar Painel</button>
                </form>
                <button onClick={onReturnToDashboard} className="mt-8 text-[10px] opacity-30 hover:opacity-100 uppercase font-black tracking-widest">Sair</button>
            </div>
        </div>
    );
    return <AdminPanel onLogout={onReturnToDashboard} />;
};

export default AdminScreen;
