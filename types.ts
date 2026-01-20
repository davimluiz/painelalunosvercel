
export interface Aula {
  id: string;
  data: string; // Formato DD/MM/YYYY
  sala: string;
  turma: string;
  instrutor: string;
  unidade_curricular: string;
  inicio: string;
  fim: string;
  turno?: string;
  // Novos campos solicitados
  titulo?: string;
  descricao?: string;
  videoUrl?: string;
  materialUrl?: string;
  ordem?: number;
  ativa?: boolean;
  criadaEm?: any;
}

export interface Anuncio {
  id: string;
  type: 'image' | 'video';
  src: string;
}

export interface Aluno {
  id: string;
  nome: string;
  turma?: string;
  status?: string;
}

export interface DataContextType {
  aulas: Aula[];
  anuncios: Anuncio[];
  alunos: Aluno[];
  loading: boolean;
  error: string | null;
  addAula: (aula: Omit<Aula, 'id'>) => Promise<void>;
  updateAulasFromCSV: (data: Omit<Aula, 'id'>[]) => void;
  updateAula: (id: string, aula: Partial<Aula>) => Promise<void>;
  deleteAula: (id: string) => Promise<void>;
  clearAulas: () => void;
  addAnuncio: (anuncio: Omit<Anuncio, 'id'>) => void;
  deleteAnuncio: (id: string) => void;
}
