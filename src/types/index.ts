export interface Project {
  title: string;
  description: string;
  tech_stack?: string[];
  link?: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  date?: string;
}

export interface Achievement {
  title: string;
  year?: string;
  description?: string;
}

export interface Student {
  id: string;
  name: string;
  headline?: string;
  program?: string;
  status: string;
  availability?: string | string[];
  skills?: string[];
  projects?: Project[];
  certificates?: Certificate[];
  achievements?: Achievement[];
}
