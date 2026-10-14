export type MaterialType = 'audio' | 'video' | 'image';

export interface Material {
  id: string;
  type: MaterialType;
  title: string;
  description: string;
  file_path: string;
  file_url: string;
  cover_path: string | null;
  cover_url: string | null;
  mime_type: string;
  size_bytes: number;
  is_published: boolean;
  created_at: string;
}

export interface NewMaterialInput {
  type: MaterialType;
  title: string;
  description: string;
  file: File;
  cover: Blob | null;
  is_published: boolean;
}

export interface MaterialPatch {
  title?: string;
  description?: string;
  is_published?: boolean;
}

export interface AppUser {
  email: string;
}

export type RepoMode = 'demo' | 'supabase';

export interface Repo {
  mode: RepoMode;
  list(): Promise<Material[]>;
  create(input: NewMaterialInput, onProgress: (fraction: number) => void): Promise<Material>;
  update(id: string, patch: MaterialPatch): Promise<Material>;
  remove(material: Material): Promise<void>;
  getUser(): Promise<AppUser | null>;
  isTeacher(): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: () => void): () => void;
}
