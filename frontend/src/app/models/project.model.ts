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
  animations: Animation[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}
