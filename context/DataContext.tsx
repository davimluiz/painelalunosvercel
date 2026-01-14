
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

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
    
    const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim().replace(/^["']|["']$/g, ''));
    
    const idx = {
      data: headers.findIndex(h => h.includes('data')),
      sala: headers.findIndex(h => (h.includes('ambiente') || h.includes('sala')) && !h.includes('instrutor')),
      turma: headers.findIndex(h => h.includes('turma') || h.includes('tipo')),
      instrutor: headers.findIndex(h => h.includes('instrutor')),
      uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular') || h.includes('solicitante')),
      inicio: headers.findIndex(h => h.includes('inicio') || h.includes('início')),
      fim: headers.findIndex(h => h.includes('fim'))
    };

    if (idx.sala === -1) idx.sala = headers.findIndex(h => h.includes('justificativa'));

    if (idx.data === -1 || idx.inicio === -1) return [];

    return jsonData.slice(1).map(v => {
      const hInicio = String(v[idx.inicio] || '').trim();
      let salaDetectada = String(v[idx.sala] || 'Ambiente não definido').replace(/^["']|["']$/g, '').trim();
      let instrutorDetectado = String(v[idx.instrutor] || '').trim();

      if (!salaDetectada.toUpperCase().startsWith('VTRIA') && instrutorDetectado.toUpperCase().startsWith('VTRIA')) {
          const temp = salaDetectada;
          salaDetectada = instrutorDetectado;
          instrutorDetectado = temp;
      }

      let ucLimpa = String(v[idx.uc] || '')
        .replace(/\s*[\(\[].*?ch.*?[\)\]]/gi, '')
        .replace(/\s+ch[:\s].*?(\s|$)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        id: Math.random().toString(36).substr(2, 9),
        data: String(v[idx.data] || '').trim(),
        sala: salaDetectada,
        turma: String(v[idx.turma] || '').trim(),
        instrutor: instrutorDetectado,
        unidade_curricular: ucLimpa,
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
      const res = await fetch(`/csv/${fileName}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Arquivo não encontrado.");
      const text = await res.text();
      const workbook = XLSX.read(text, { type: 'string' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
      const processed = processCSVData(jsonData as any[][]);
      if (processed.length > 0) {
        setAulas(processed);
        setSyncSource(fileName);
        localStorage.setItem('senai_aulas_v2', JSON.stringify(processed));
      }
    } catch (e: any) {
      setError(e.message);
      const saved = localStorage.getItem('senai_aulas_v2');
      if (saved) setAulas(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedAnuncios = localStorage.getItem('senai_anuncios_v2');
    if (savedAnuncios) setAnunciosState(JSON.parse(savedAnuncios));
    
    const savedAulas = localStorage.getItem('senai_aulas_v2');
    if (savedAulas) {
      setAulas(JSON.parse(savedAulas));
      setLoading(false);
    } else {
      syncFromRepository();
    }
  }, [syncFromRepository]);

  const addAula = (aula: Omit<Aula, 'id'>) => {
    setAulas(prev => {
      const newAulas = [...prev, { ...aula, id: Date.now().toString() }];
      localStorage.setItem('senai_aulas_v2', JSON.stringify(newAulas));
      return newAulas;
    });
  };

  const updateAulasFromCSV = (data: Omit<Aula, 'id'>[]) => {
    const novas = data.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) }));
    setAulas(novas);
    localStorage.setItem('senai_aulas_v2', JSON.stringify(novas));
  };

  const updateAula = async (id: string, d: Partial<Aula>) => {
    setAulas(prev => {
      const newAulas = prev.map(a => a.id === id ? { ...a, ...d } : a);
      localStorage.setItem('senai_aulas_v2', JSON.stringify(newAulas));
      return newAulas;
    });
  };

  const deleteAula = async (id: string) => {
    setAulas(prev => {
      const newAulas = prev.filter(a => a.id !== id);
      localStorage.setItem('senai_aulas_v2', JSON.stringify(newAulas));
      return newAulas;
    });
  };

  const clearAulas = () => { 
    if(confirm("Apagar dados locais?")) { 
      setAulas([]); 
      localStorage.removeItem('senai_aulas_v2'); 
    } 
  };

  const addAnuncio = (n: Omit<Anuncio, 'id'>) => {
    setAnunciosState(prev => {
      const newAnuncios = [...prev, { ...n, id: Date.now().toString() }];
      localStorage.setItem('senai_anuncios_v2', JSON.stringify(newAnuncios));
      return newAnuncios;
    });
  };

  const deleteAnuncio = (id: string) => {
    setAnunciosState(prev => {
      const newAnuncios = prev.filter(a => a.id !== id);
      localStorage.setItem('senai_anuncios_v2', JSON.stringify(newAnuncios));
      return newAnuncios;
    });
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
