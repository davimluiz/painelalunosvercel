
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [anuncios, setAnunciosState] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedAulas = localStorage.getItem('senai_aulas_v2');
        const savedAnuncios = localStorage.getItem('senai_anuncios_v2');
        if (savedAulas) setAulas(JSON.parse(savedAulas));
        if (savedAnuncios) setAnunciosState(JSON.parse(savedAnuncios));
      } catch (e) {
        console.error("Erro ao carregar dados locais", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('senai_aulas_v2', JSON.stringify(aulas));
      localStorage.setItem('senai_anuncios_v2', JSON.stringify(anuncios));
    }
  }, [aulas, anuncios, loading]);

  const addAula = useCallback((aula: Omit<Aula, 'id'>) => {
    setAulas(prev => [...prev, { ...aula, id: Date.now().toString() }]);
  }, []);

  const updateAulasFromCSV = useCallback((data: Omit<Aula, 'id'>[]) => {
    const novasAulas = data.map(d => ({ 
      ...d, 
      id: Math.random().toString(36).substr(2, 9) 
    }));
    setAulas(novasAulas);
  }, []);

  const updateAula = useCallback(async (id: string, aulaData: Partial<Aula>) => {
    setAulas(prev => prev.map(a => a.id === id ? { ...a, ...aulaData } : a));
  }, []);

  const deleteAula = useCallback(async (id: string) => {
    setAulas(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAulas = useCallback(() => {
    if(confirm("Deseja apagar todos os dados do painel?")) {
      setAulas([]);
    }
  }, []);

  const addAnuncio = useCallback((novoAnuncio: Omit<Anuncio, 'id'>) => {
    if (anuncios.length >= 4) {
      alert("Limite de 4 anúncios atingido.");
      return;
    }
    setAnunciosState(prev => [...prev, { ...novoAnuncio, id: Date.now().toString() }]);
  }, [anuncios.length]);

  const deleteAnuncio = useCallback((id: string) => {
    setAnunciosState(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{ aulas, anuncios, loading, error, addAula, updateAulasFromCSV, updateAula, deleteAula, clearAulas, addAnuncio, deleteAnuncio }}>
      {children}
    </DataContext.Provider>
  );
};
