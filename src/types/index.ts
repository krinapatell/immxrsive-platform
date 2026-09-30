export interface Student {
  id: string;
  name: string;
  headline: string;
  program: string;
  status: 'current' | 'alumni';
  profile_status: 'published' | 'unpublished';
  availability: string[];
  skills: string[];
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
}

export interface ProjectContributor {
  student_id: string;
  role: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  contributors: ProjectContributor[];
  links?: {
    demo?: string;
    repository?: string;
    video?: string;
  };
}

export interface Skill {
  id?: number;
  name: string;
}
