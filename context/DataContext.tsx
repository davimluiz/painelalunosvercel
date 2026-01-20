
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, Aluno, DataContextType } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

declare const XLSX: any;

export interface ExtendedDataContextType extends DataContextType {
  uploadCSV: (file: File) => Promise<void>;
  syncSource: string | null;
}

export const DataContext = createContext<ExtendedDataContextType | undefined>(undefined);

const calcularTurnoPorHorario = (horarioStr: string): string => {
    if (!horarioStr || !horarioStr.includes(':')) return 'Matutino';
    const [horas, minutos] = horarioStr.split(':').map(Number);
    const totalMinutos = (horas * 60) + (minutos || 0);
    if (totalMinutos >= 360 && totalMinutos <= 690) return 'Matutino';
    if (totalMinutos >= 691 && totalMinutos <= 1050) return 'Vespertino';
    if (totalMinutos >= 1051 && totalMinutos <= 1320) return 'Noturno';
    return totalMinutos < 360 ? 'Matutino' : 'Noturno';
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<string | null>(null);

  useEffect(() => {
    // Listener para Aulas ordenadas
    const qAulas = query(collection(db, 'aulas'), orderBy('ordem', 'asc'));
    const unsubAulas = onSnapshot(collection(db, 'aulas'), (snapshot) => {
      const aulasData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Aula[];
      setAulas(aulasData);
      setLoading(false);
    });

    // Listener para Anúncios
    const unsubAnuncios = onSnapshot(collection(db, 'anuncios'), (snapshot) => {
      const anunciosData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Anuncio[];
      setAnuncios(anunciosData);
    });

    // Listener para Alunos
    const unsubAlunos = onSnapshot(collection(db, 'alunos'), (snapshot) => {
      const alunosData = snapshot.docs.map(doc => ({ 
        id: doc.id,
        nome: doc.data().nome || doc.data().aluno || "Aluno sem nome",
        turma: doc.data().turma || "",
        status: doc.data().status || "Ativo"
      })) as Aluno[];
      setAlunos(alunosData);
    });

    return () => {
      unsubAulas();
      unsubAnuncios();
      unsubAlunos();
    };
  }, []);

  const processCSVData = (jsonData: any[][]) => {
    if (!jsonData || jsonData.length < 2) return [];
    const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim().replace(/^["']|["']$/g, ''));
    
    const idx = {
      data: headers.findIndex(h => h.includes('data')),
      sala: headers.findIndex(h => (h.includes('ambiente') || h.includes('sala')) && !h.includes('instrutor')),
      turma: headers.findIndex(h => h.includes('turma') || h.includes('tipo')),
      instrutor: headers.findIndex(h => h.includes('instrutor')),
      uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular') || h.includes('solicitante')),
      inicio: headers.findIndex(h => h.includes('inicio')),
      fim: headers.findIndex(h => h.includes('fim'))
    };

    return jsonData.slice(1).map((v, i) => {
      const hInicio = String(v[idx.inicio] || '').trim();
      const turma = String(v[idx.turma] || '').trim();
      const uc = String(v[idx.uc] || '').trim();
      
      return {
        data: String(v[idx.data] || '').trim(),
        sala: String(v[idx.sala] || 'Ambiente').trim(),
        turma: turma,
        instrutor: String(v[idx.instrutor] || '').trim(),
        unidade_curricular: uc,
        inicio: hInicio,
        fim: String(v[idx.fim] || '').trim(),
        turno: calcularTurnoPorHorario(hInicio),
        // Novos metadados
        titulo: turma,
        descricao: uc,
        ativa: true,
        ordem: i,
        criadaEm: new Date()
      };
    }).filter(a => a.data && a.inicio);
  };

  const uploadCSV = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const processed = processCSVData(jsonData as any[][]);
      
      if (processed.length === 0) {
        throw new Error("Nenhuma aula válida encontrada no arquivo.");
      }

      const batch = writeBatch(db);
      const currentDocs = await getDocs(collection(db, 'aulas'));
      currentDocs.forEach((d) => batch.delete(d.ref));
      
      processed.forEach((aula) => {
        const newDocRef = doc(collection(db, 'aulas'));
        batch.set(newDocRef, aula);
      });
      
      await batch.commit();
      setSyncSource(file.name);
      alert(`${processed.length} aulas sincronizadas com sucesso!`);
    } catch (e: any) {
      setError(e.message);
      alert("Erro ao processar arquivo: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAula = async (id: string, aula: Partial<Aula>) => {
    try {
      await updateDoc(doc(db, 'aulas', id), aula);
    } catch (e) { console.error(e); }
  };

  const deleteAula = async (id: string) => {
    try { await deleteDoc(doc(db, 'aulas', id)); } catch (e) { console.error(e); }
  };

  const addAnuncio = async (anuncio: Omit<Anuncio, 'id'>) => {
    try { await addDoc(collection(db, 'anuncios'), anuncio); } catch (e) { console.error(e); }
  };

  const deleteAnuncio = async (id: string) => {
    try { await deleteDoc(doc(db, 'anuncios', id)); } catch (e) { console.error(e); }
  };

  const addAula = async (aulaData: Omit<Aula, 'id'>) => { 
    try {
      const newAula = {
        ...aulaData,
        titulo: aulaData.turma,
        descricao: aulaData.unidade_curricular,
        ativa: true,
        criadaEm: serverTimestamp(),
        ordem: aulas.length + 1
      };
      await addDoc(collection(db, 'aulas'), newAula); 
    } catch (e) {
      console.error("Erro ao adicionar aula:", e);
      alert("Erro ao salvar no banco.");
    }
  };

  const updateAulasFromCSV = () => {};

  const clearAulas = async () => {
    if(confirm("Limpar todas as aulas?")) {
      const batch = writeBatch(db);
      const docs = await getDocs(collection(db, 'aulas'));
      docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  };

  return (
    <DataContext.Provider value={{ 
      aulas, anuncios, alunos, loading, error, 
      addAula, updateAulasFromCSV, updateAula, deleteAula, 
      clearAulas, addAnuncio, deleteAnuncio,
      uploadCSV, syncSource
    }}>
      {children}
    </DataContext.Provider>
  );
};
