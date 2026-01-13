
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

export const DataContext = createContext<DataContextType | undefined>(undefined);

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

  const fetchCSVFromServer = useCallback(async () => {
    try {
      const res = await fetch('/csv/aulas.csv?t=' + Date.now());
      if (!res.ok) throw new Error("CSV não encontrado");
      
      const text = await res.text();
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
      if (rows.length < 2) return;

      const separator = rows[0].includes(';') ? ';' : ',';
      const headers = rows[0].split(separator).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      const idx = {
        data: headers.findIndex(h => h.includes('data')),
        // Procura por 'ambiente' ou 'sala' ou 'justificativa' (comum no SENAI)
        sala: headers.findIndex(h => h.includes('ambiente') || h.includes('sala') || h.includes('justificativa')),
        turma: headers.findIndex(h => h.includes('turma') || h.includes('tipo')),
        instrutor: headers.findIndex(h => h.includes('instrutor') || h.includes('reserva')),
        uc: headers.findIndex(h => h.includes('unidade') || h.includes('curricular') || h.includes('solicitante')),
        inicio: headers.findIndex(h => h.includes('inicio') || h.includes('início')),
        fim: headers.findIndex(h => h.includes('fim'))
      };

      rows.shift();
      const data = rows.map(r => {
        // Regex para lidar com separadores dentro de aspas, se necessário
        const v = r.split(separator).map(s => s.trim().replace(/^["']|["']$/g, ''));
        const horaInicio = v[idx.inicio] || '';
        return {
          id: Math.random().toString(36).substr(2, 9),
          data: v[idx.data] || '',
          sala: v[idx.sala] || 'Ambiente não definido',
          turma: v[idx.turma] || '',
          instrutor: v[idx.instrutor] || '',
          unidade_curricular: v[idx.uc] || '',
          inicio: horaInicio,
          fim: v[idx.fim] || '',
          turno: calcularTurnoPorHorario(horaInicio)
        };
      }).filter(a => a.data && a.inicio);

      setAulas(data);
      localStorage.setItem('senai_aulas_v2', JSON.stringify(data));
    } catch (e) {
      console.warn("Usando cache local.");
      const saved = localStorage.getItem('senai_aulas_v2');
      if (saved) setAulas(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedAnuncios = localStorage.getItem('senai_anuncios_v2');
    if (savedAnuncios) setAnunciosState(JSON.parse(savedAnuncios));
    fetchCSVFromServer();
    const interval = setInterval(fetchCSVFromServer, 300000);
    return () => clearInterval(interval);
  }, [fetchCSVFromServer]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('senai_anuncios_v2', JSON.stringify(anuncios));
    }
  }, [anuncios, loading]);

  const addAula = (aula: Omit<Aula, 'id'>) => {
    setAulas(prev => [...prev, { ...aula, id: Date.now().toString() }]);
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
    }
  };

  const addAnuncio = (novoAnuncio: Omit<Anuncio, 'id'>) => {
    setAnunciosState(prev => [...prev, { ...novoAnuncio, id: Date.now().toString() }]);
  };

  const deleteAnuncio = (id: string) => {
    setAnunciosState(prev => prev.filter(a => a.id !== id));
  };

  return (
    <DataContext.Provider value={{ aulas, anuncios, loading, error, addAula, updateAulasFromCSV, updateAula, deleteAula, clearAulas, addAnuncio, deleteAnuncio }}>
      {children}
    </DataContext.Provider>
  );
};
