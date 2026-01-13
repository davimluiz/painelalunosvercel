
import React, { useState, useContext, useRef, FormEvent, ChangeEvent, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Anuncio, Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, PlusCircleIcon, TrashIcon, LogOutIcon, CameraIcon } from './Icons';

const calcularTurno = (inicio: string): string => {
    if (!inicio) return 'Matutino'; 
    const horas = parseInt(inicio, 10);
    const totalMinutos = horas * 60 + parseInt(inicio.split(':')[1] || '0', 10);
    if (totalMinutos < 720) return 'Matutino';
    if (totalMinutos < 1080) return 'Vespertino';
    return 'Noturno';
};

const normalizarTurnoCSV = (turnoRaw: string): string | null => {
    if (!turnoRaw) return null;
    const t = turnoRaw.trim().toLowerCase();
    if (t.includes('matutino') || t.includes('manhã') || t.includes('manha')) return 'Matutino';
    if (t.includes('vespertino') || t.includes('tarde')) return 'Vespertino';
    if (t.includes('noturno') || t.includes('noite')) return 'Noturno';
    return null;
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  React.useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-5 right-5 ${type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'} border text-white p-4 rounded-lg shadow-lg z-50 backdrop-blur-sm flex items-center gap-4 max-w-sm`}>
      <span>{message}</span>
      <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
    </div>
  );
};

const LoginModal: React.FC<{ onLoginSuccess: () => void; onLoginError: (msg: string) => void }> = ({ onLoginSuccess, onLoginError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'admin' && password === '1234') onLoginSuccess();
        else onLoginError('Usuário ou senha incorretos.');
    };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-white mb-6">Acesso Administrativo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/20 border border-white/30 rounded-lg p-2 text-white" />
                    <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/30 rounded-lg p-2 text-white" />
                    <button type="submit" className="w-full bg-[#ff6600] text-white font-bold py-2 rounded-lg hover:bg-[#ff8533]">Entrar</button>
                </form>
            </div>
        </div>
    );
};

const AulaItem: React.FC<{ aula: Aula, onUpdate: (id: string, data: Partial<Aula>) => void, onDelete: (id: string) => void }> = ({ aula, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Aula>(aula);
    const handleSave = () => { onUpdate(aula.id, editData); setIsEditing(false); };
    if (isEditing) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 bg-white/10 p-4 rounded-lg items-center border border-[#ff6600]/50">
            <input name="data" value={editData.data} onChange={e => setEditData({...editData, data: e.target.value})} className="bg-black/40 rounded px-2 py-1 text-xs text-white" />
            <input name="inicio" value={editData.inicio} onChange={e => setEditData({...editData, inicio: e.target.value})} className="bg-black/40 rounded px-2 py-1 text-xs text-white" />
            <input name="turma" value={editData.turma} onChange={e => setEditData({...editData, turma: e.target.value})} className="bg-black/40 rounded px-2 py-1 text-xs text-white" />
            <input name="sala" value={editData.sala} onChange={e => setEditData({...editData, sala: e.target.value})} className="bg-black/40 rounded px-2 py-1 text-xs text-white" />
            <input name="instrutor" value={editData.instrutor} onChange={e => setEditData({...editData, instrutor: e.target.value})} className="bg-black/40 rounded px-2 py-1 text-xs text-white" />
            <div className="flex gap-2 justify-end"><button onClick={handleSave} className="text-green-400 text-xs">Salvar</button><button onClick={() => setIsEditing(false)} className="text-red-400 text-xs">Cancelar</button></div>
        </div>
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 bg-white/5 p-4 rounded-lg items-center border border-white/5">
            <div className="text-xs text-white/70 font-mono">{aula.data}</div>
            <div className="text-xs text-[#ff6600] font-bold">{aula.inicio} - {aula.fim} <span className="text-white/30 text-[10px] ml-1">({aula.turno})</span></div>
            <div className="text-xs font-bold text-white truncate">{aula.turma}</div>
            <div className="text-xs text-white/80 truncate">{aula.sala}</div>
            <div className="text-xs text-white/60 truncate">{aula.instrutor}</div>
            <div className="flex gap-2 justify-end"><button onClick={() => setIsEditing(true)} className="text-[#ff6600] text-xs">Editar</button><button onClick={() => onDelete(aula.id)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button></div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [newAula, setNewAula] = useState<Omit<Aula, 'id'>>({ data: new Date().toLocaleDateString('pt-BR'), sala: '', turma: '', instrutor: '', unidade_curricular: '', inicio: '', fim: '' });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

    if (!context) return null;

    const sortedAulas = useMemo(() => {
        const turnosOrder: { [key: string]: number } = { 'Matutino': 1, 'Vespertino': 2, 'Noturno': 3 };
        let filtered = [...context.aulas];
        if (startDate || endDate) {
            filtered = filtered.filter(aula => {
                const [d, m, y] = aula.data.split('/');
                const date = new Date(`${y}-${m}-${d}`);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        } else {
            const today = new Date().toLocaleDateString('pt-BR');
            filtered = filtered.filter(a => a.data === today);
        }
        return filtered.sort((a, b) => {
            const [d1, m1, y1] = a.data.split('/');
            const [d2, m2, y2] = b.data.split('/');
            const diffDate = new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
            if (diffDate !== 0) return diffDate;
            return (turnosOrder[a.turno!] || 0) - (turnosOrder[b.turno!] || 0) || a.inicio.localeCompare(b.inicio);
        });
    }, [context.aulas, startDate, endDate]);

    const handleCSV = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const rows = text.split('\n').filter(r => r.trim() !== '');
                const headers = rows.shift()?.split(',').map(h => h.trim()) || [];
                const data = rows.map(row => {
                    const vals = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const inicio = vals[5];
                    return { data: vals[0], sala: vals[1], turma: vals[2], instrutor: vals[3], unidade_curricular: vals[4], inicio, fim: vals[6], turno: normalizarTurnoCSV(vals[7]) || calcularTurno(inicio) };
                }).filter(a => a.data && a.sala);
                context.updateAulasFromCSV(data);
                setToast({ message: `${data.length} aulas carregadas.`, type: 'success' });
            } catch { setToast({ message: 'Erro ao ler CSV.', type: 'error' }); }
        };
        reader.readAsText(file, 'UTF-8');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0b0b0f] to-[#1a1a20] text-white p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Admin Online</h1><button onClick={onLogout} className="flex items-center gap-2 hover:text-[#ff6600] transition-colors"><LogOutIcon /> Sair</button></header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <h2 className="text-xl font-bold text-[#ff6600] flex items-center gap-2 mb-4"><FileTextIcon /> Importar CSV</h2>
                        <input type="file" accept=".csv" onChange={handleCSV} className="w-full text-sm" />
                        <p className="text-[10px] text-white/30 mt-2">Envie o arquivo atualizado para a pasta 'public' no Github para automatizar no futuro.</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <h2 className="text-xl font-bold text-[#ff6600] flex items-center gap-2 mb-4"><CameraIcon /> Anúncios ({context.anuncios.length}/4)</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">{context.anuncios.map(ad => (
                            <div key={ad.id} className="relative aspect-video bg-black/50 rounded-lg group">
                                {ad.type === 'image' ? <img src={ad.src} className="w-full h-full object-cover" /> : <video src={ad.src} />}
                                <button onClick={() => context.deleteAnuncio(ad.id)} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"><TrashIcon className="w-3 h-3" /></button>
                            </div>
                        ))}</div>
                        <input type="file" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => { setMediaPreview(reader.result as string); setMediaType(file.type.startsWith('image') ? 'image' : 'video'); };
                                reader.readAsDataURL(file);
                            }
                        }} className="text-xs" />
                        {mediaPreview && <button onClick={() => { context.addAnuncio({ src: mediaPreview!, type: mediaType! }); setMediaPreview(null); }} className="mt-2 w-full bg-[#ff6600] p-2 rounded">Adicionar</button>}
                    </div>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                    <h2 className="text-xl font-bold text-[#ff6600] flex items-center gap-2 mb-4"><PlusCircleIcon /> Nova Aula</h2>
                    <form onSubmit={e => { e.preventDefault(); context.addAula({...newAula, turno: calcularTurno(newAula.inicio)}); }} className="space-y-3">
                        <input placeholder="Data (DD/MM/YYYY)" value={newAula.data} onChange={e => setNewAula({...newAula, data: e.target.value})} className="w-full bg-black/20 p-2 rounded" />
                        <input placeholder="Turma" value={newAula.turma} onChange={e => setNewAula({...newAula, turma: e.target.value})} className="w-full bg-black/20 p-2 rounded" />
                        <div className="flex gap-2"><input type="time" value={newAula.inicio} onChange={e => setNewAula({...newAula, inicio: e.target.value})} className="w-1/2 bg-black/20 p-2 rounded" /><input type="time" value={newAula.fim} onChange={e => setNewAula({...newAula, fim: e.target.value})} className="w-1/2 bg-black/20 p-2 rounded" /></div>
                        <button type="submit" className="w-full bg-green-600 font-bold py-2 rounded">Adicionar Aula</button>
                    </form>
                </div>
            </div>
            <div className="mt-8 bg-white/10 p-6 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#ff6600]">Filtrar por Período</h2>
                    <div className="flex gap-2 items-center text-xs">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black/40 p-1 rounded" />
                        <span>até</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black/40 p-1 rounded" />
                        {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-400">Limpar</button>}
                    </div>
                    <button onClick={context.clearAulas} className="text-red-500 text-xs border border-red-500/30 px-3 py-1 rounded-full">Limpar Cache</button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#ff6600]">
                    {sortedAulas.map(a => <AulaItem key={a.id} aula={a} onUpdate={context.updateAula} onDelete={context.deleteAula} />)}
                    {sortedAulas.length === 0 && <p className="text-center text-white/30 py-10">Nenhuma aula encontrada para este período.</p>}
                </div>
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    if (!auth) return <div className="h-screen w-screen flex items-center justify-center bg-black"><LoginModal onLoginSuccess={() => setAuth(true)} onLoginError={alert} /><button onClick={onReturnToDashboard} className="fixed top-6 left-6 text-white/50">Voltar</button></div>;
    return <AdminPanel onLogout={onReturnToDashboard} />;
};
export default AdminScreen;
