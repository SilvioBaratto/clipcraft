import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type PlannerSectionValue = 'WEEKEND_PREP' | 'IDEAS';

export class CreateEntryDto {
  @ApiProperty({ example: '2026-07-06', description: 'ISO date (yyyy-mm-dd)' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'RAG vs CAG' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateEntryDto {
  @ApiPropertyOptional({ example: 'RAG vs CAG', nullable: true })
  @IsOptional()
  @IsString()
  theme?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  prepared?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateTaskDto {
  @ApiProperty({ enum: ['WEEKEND_PREP', 'IDEAS'] })
  @IsIn(['WEEKEND_PREP', 'IDEAS'])
  section: PlannerSectionValue;

  @ApiProperty({ example: 'Vector database' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Vector database' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  order?: number;
}
