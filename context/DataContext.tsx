
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [anuncios, setAnunciosState] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados iniciais do localStorage ou do arquivo public/db.json
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const savedAulas = localStorage.getItem('senai_aulas');
      const savedAnuncios = localStorage.getItem('senai_anuncios');

      if (savedAulas && savedAnuncios) {
        setAulas(JSON.parse(savedAulas));
        setAnunciosState(JSON.parse(savedAnuncios));
      } else {
        // Se não houver nada no localStorage, tenta buscar o arquivo estático da pasta public
        const response = await fetch('/db.json');
        if (response.ok) {
          const data = await response.json();
          setAulas(data.aulas || []);
          setAnunciosState(data.anuncios || []);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar os dados iniciais. Certifique-se de que public/db.json existe no seu repositório.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persistência em localStorage sempre que os estados mudarem
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('senai_aulas', JSON.stringify(aulas));
      localStorage.setItem('senai_anuncios', JSON.stringify(anuncios));
    }
  }, [aulas, anuncios, loading]);

  const addAula = useCallback((aula: Omit<Aula, 'id'>) => {
    const novaAula = { ...aula, id: Date.now().toString() };
    setAulas(prev => [...prev, novaAula]);
  }, []);

  const updateAulasFromCSV = useCallback((data: Omit<Aula, 'id'>[]) => {
    const novasAulas = data.map(d => ({ 
      ...d, 
      id: `${d.sala}-${d.turma}-${Math.random().toString(36).substr(2, 9)}` 
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
    if(confirm("Deseja apagar todas as aulas salvas no seu navegador?")) {
      setAulas([]);
    }
  }, []);

  const addAnuncio = useCallback((novoAnuncio: Omit<Anuncio, 'id'>) => {
    if (anuncios.length >= 4) {
      alert("Limite de 4 anúncios atingido.");
      return;
    }
    const ad = { ...novoAnuncio, id: Date.now().toString() };
    setAnunciosState(prev => [...prev, ad]);
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
