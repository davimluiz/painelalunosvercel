
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

// Declaração global para a biblioteca SheetJS carregada via CDN no index.html
declare const XLSX: any;

export interface ExtendedDataContextType extends DataContextType {
  syncFromRepository: () => Promise<void>;
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
  const [anuncios, setAnunciosState] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<string | null>(null);

  const processCSVData = (jsonData: any[][]) => {
    if (!jsonData || jsonData.length < 2) return [];
    
    // Normalização dos cabeçalhos para encontrar as colunas
    const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim().replace(/^["']|["']$/g, ''));
    
    const idx = {
      data: headers.findIndex(h => h.includes('data')),
      sala: headers.findIndex(h => h.includes('ambiente') || h.includes('sala') || h.includes('justificativa')),
      turma: headers.findIndex(h => h.includes('turma') || h.includes('tipo')),
      instrutor: headers.findIndex(h => h.includes('instrutor') || h.includes('reserva')),
      uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular') || h.includes('solicitante')),
      inicio: headers.findIndex(h => h.includes('inicio') || h.includes('início')),
      fim: headers.findIndex(h => h.includes('fim'))
    };

    // Validação mínima obrigatória
    if (idx.data === -1 || idx.inicio === -1) {
        console.warn("Cabeçalhos obrigatórios não encontrados no CSV:", headers);
        return [];
    }

    return jsonData.slice(1).map(v => {
      const hInicio = String(v[idx.inicio] || '').trim();
      return {
        id: Math.random().toString(36).substr(2, 9),
        data: String(v[idx.data] || '').trim(),
        sala: String(v[idx.sala] || 'Ambiente não definido').replace(/^["']|["']$/g, '').trim(),
        turma: String(v[idx.turma] || '').trim(),
        instrutor: String(v[idx.instrutor] || '').trim(),
        unidade_curricular: String(v[idx.uc] || '').trim(),
        inicio: hInicio,
        fim: String(v[idx.fim] || '').trim(),
        turno: calcularTurnoPorHorario(hInicio)
      };
    }).filter(a => a.data && a.inicio && (a.data.includes('/') || a.data.includes('-')));
  };

  const syncFromRepository = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fileName = 'aulas.csv';
      // Busca estritamente o arquivo .csv
      const res = await fetch(`/csv/${fileName}?t=${Date.now()}`);
      
      if (!res.ok) {
        throw new Error(`O arquivo ${fileName} não foi encontrado na pasta /csv/.`);
      }

      // Evita ler o index.html em caso de redirecionamento 404 de SPA
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error("Servidor retornou HTML em vez do arquivo CSV.");
      }

      const text = await res.text();
      // O SheetJS também é excelente para ler CSVs respeitando aspas e vírgulas
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const processed = processCSVData(jsonData as any[][]);
      
      if (processed.length > 0) {
        setAulas(processed);
        setSyncSource(fileName);
        localStorage.setItem('senai_aulas_v2', JSON.stringify(processed));
        localStorage.setItem('senai_sync_source', fileName);
      } else {
        throw new Error("O arquivo aulas.csv está vazio ou tem formato inválido.");
      }
    } catch (e: any) {
      console.error("Erro na sincronização CSV:", e);
      setError(e.message);
      const saved = localStorage.getItem('senai_aulas_v2');
      if (saved) {
        setAulas(JSON.parse(saved));
        setSyncSource(localStorage.getItem('senai_sync_source'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedAnuncios = localStorage.getItem('senai_anuncios_v2');
    if (savedAnuncios) setAnunciosState(JSON.parse(savedAnuncios));
    
    syncFromRepository();
    const interval = setInterval(syncFromRepository, 300000); // 5 min
    return () => clearInterval(interval);
  }, [syncFromRepository]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('senai_anuncios_v2', JSON.stringify(anuncios));
    }
  }, [anuncios, loading]);

  const addAula = (aula: Omit<Aula, 'id'>) => {
    const nova = { ...aula, id: Date.now().toString() };
    setAulas(prev => [...prev, nova]);
  };

  const updateAulasFromCSV = (data: Omit<Aula, 'id'>[]) => {
    const novasAulas = data.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) }));
    setAulas(novasAulas);
    localStorage.setItem('senai_aulas_v2', JSON.stringify(novasAulas));
  };

  const updateAula = async (id: string, aulaData: Partial<Aula>) => {
    setAulas(prev => prev.map(a => a.id === id ? { ...a, ...aulaData } : a));
  };

  const deleteAula = async (id: string) => {
    setAulas(prev => prev.filter(a => a.id !== id));
  };

  const clearAulas = () => {
    if(confirm("Deseja apagar todos os dados locais?")) {
      setAulas([]);
      localStorage.removeItem('senai_aulas_v2');
      setSyncSource(null);
    }
  };

  const addAnuncio = (novoAnuncio: Omit<Anuncio, 'id'>) => {
    setAnunciosState(prev => [...prev, { ...novoAnuncio, id: Date.now().toString() }]);
  };

  const deleteAnuncio = (id: string) => {
    setAnunciosState(prev => prev.filter(a => a.id !== id));
  };

  return (
    <DataContext.Provider value={{ 
      aulas, anuncios, loading, error, 
      addAula, updateAulasFromCSV, updateAula, deleteAula, 
      clearAulas, addAnuncio, deleteAnuncio,
      syncFromRepository,
      syncSource
    }}>
      {children}
    </DataContext.Provider>
  );
};
