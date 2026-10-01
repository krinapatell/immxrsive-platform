export interface Student {
  id: string;
  name: string;
  bio?: string;
  headline?: string;
  program?: string;
  skills?: any;
  status?: string;
  availability?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at?: string;
  [key: string]: any;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tech_stack?: any;
  technologies?: any;
  project_url?: string;
  student_ids?: string[];
  created_at?: string;
  [key: string]: any;
}
