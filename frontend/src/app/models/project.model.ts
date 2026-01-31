// Project and Script models for ClipCraft

export interface Script {
  id: string;
  title: string;
  hook: string;
  sections: ScriptSection[];
  cta: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptSection {
  testo: string;
}

// Structured carousel slide from database
export interface CarouselSlide {
  id: string;
  slideNumber: number;
  slideType: 'HOOK' | 'CONTENT' | 'CTA';
  mainText: string;
  highlightText?: string;
  subText?: string;
  generatedHtml?: string;
}

// Structured carousel from database
export interface Carousel {
  id: string;
  topic: string;
  totalSlides: number;
  colorAccent: string;
  secondaryAccent?: string;
  platform?: string;
  canvas?: string;
  ratio?: string;
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  slides: CarouselSlide[];
  createdAt: Date;
  updatedAt: Date;
}

// Structured animation scene from database
export interface AnimationScene {
  id: string;
  sceneNumber: number;
  sceneType: 'INTRO' | 'EXPLANATION' | 'VISUALIZATION' | 'COMPARISON' | 'CTA';
  mainText: string;
  subText?: string;
  visualType: 'TWO_COLUMN' | 'CENTERED' | 'FLOW_DIAGRAM' | 'SCATTER_PLOT' | 'GRID' | 'COMPARISON' | 'DASHBOARD';
  generatedHtml?: string;
}

// Structured animation from database
export interface Animation {
  id: string;
  topic: string;
  totalScenes: number;
  colorAccent: string;
  secondaryAccent?: string;
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  scenes: AnimationScene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  folderName: string;
  script: Script;
  hasAnimations: boolean;
  hasCarousel: boolean;
  hasPreview: boolean;
  carousels: Carousel[];
  animations: Animation[];
  previews: Preview[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

// Structured preview from database
export interface Preview {
  id: string;
  platform: 'instagram' | 'tiktok';
  width: number;
  height: number;
  colorAccent: string;
  secondaryAccent?: string;
  mainText: string;
  highlightText?: string;
  subText?: string;
  emoji?: string;
  label?: string;
  generatedHtml?: string;
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}
