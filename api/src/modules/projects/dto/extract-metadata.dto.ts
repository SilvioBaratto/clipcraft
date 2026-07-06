import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The raw script content to create a project from',
    example: `## 🎯 Hook
Sapevi che Netflix usa l'AI per creare le copertine dei film?

## 🎬 Script
Ogni volta che apri Netflix, le immagini che vedi sono personalizzate per te.
L'algoritmo analizza i tuoi gusti e sceglie la copertina più accattivante.
Se guardi molti film d'azione, vedrai scene più dinamiche.
Seguimi per altre curiosità tech!`,
  })
  @IsString()
  @IsNotEmpty()
  script: string;

  @ApiPropertyOptional({ description: 'Optional user ID' })
  @IsString()
  @IsOptional()
  userId?: string;
}

// Structured response DTOs for animation scenes
export class AnimationSceneResponseDto {
  @ApiProperty({ example: 'scene_123' })
  id: string;

  @ApiProperty({ example: 1 })
  sceneNumber: number;

  @ApiProperty({
    example: 'INTRO',
    enum: ['INTRO', 'EXPLANATION', 'VISUALIZATION', 'COMPARISON', 'CTA'],
  })
  sceneType: string;

  @ApiProperty({ example: 'Netflix personalizes thumbnails' })
  mainText: string;

  @ApiPropertyOptional({ example: 'Using machine learning' })
  subText?: string;

  @ApiProperty({
    example: 'CENTERED',
    enum: [
      'TWO_COLUMN',
      'CENTERED',
      'FLOW_DIAGRAM',
      'SCATTER_PLOT',
      'GRID',
      'COMPARISON',
      'DASHBOARD',
    ],
  })
  visualType: string;

  @ApiPropertyOptional({ example: '<div>...</div>' })
  generatedHtml?: string;
}

export class AnimationResponseDto {
  @ApiProperty({ example: 'animation_123' })
  id: string;

  @ApiProperty({ example: 'Netflix AI' })
  topic: string;

  @ApiProperty({ example: 6 })
  totalScenes: number;

  @ApiProperty({ example: '#FF5733' })
  colorAccent: string;

  @ApiPropertyOptional({ example: '#333333' })
  secondaryAccent?: string;

  @ApiProperty({ example: 'COMPLETED', enum: ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'] })
  status: string;

  @ApiProperty({ type: [AnimationSceneResponseDto] })
  scenes: AnimationSceneResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProjectResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'Netflix AI Covers' })
  name: string;

  @ApiProperty({ example: 'Come Netflix personalizza le copertine con AI' })
  title: string;

  @ApiProperty({ example: 'netflix_ai_covers' })
  folderName: string;

  @ApiProperty({ example: "Sapevi che Netflix usa l'AI per creare le copertine dei film?" })
  hook: string;

  @ApiProperty({ example: 'https://picsum.photos/seed/netflix/400/300' })
  thumbnail: string;

  @ApiProperty({ example: false })
  hasAnimations: boolean;

  @ApiProperty({
    description: 'The original script content',
    example: `## 🎯 Hook
Sapevi che Netflix usa l'AI per creare le copertine dei film?

## 🎬 Script
Ogni volta che apri Netflix, le immagini che vedi sono personalizzate per te.
Seguimi per altre curiosità tech!`,
  })
  sourceScript: string;

  @ApiProperty({ description: 'Structured animations with scenes', type: [AnimationResponseDto] })
  animations: AnimationResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  projects: ProjectResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;
}
