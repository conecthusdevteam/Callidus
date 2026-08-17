import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  StencilApprovalStatus,
  StencilPhase,
  StencilTechnicalOpinion,
  WashStatus,
} from '../entities/stencil.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStencilDto {
  @ApiProperty({
    description:
      'The generated code of the stencil. If omitted, it is generated from the structured fields.',
    example: 'A960_MAIN_V53_2F_CHINA/3',
    required: false,
  })
  @IsOptional()
  @IsString()
  stencilCode?: string;

  @ApiProperty({
    description: 'The board model used to compose the stencil code',
    example: 'A960',
    required: false,
  })
  @IsOptional()
  @IsString()
  plateModel?: string;

  @ApiProperty({
    description: 'The board type used to compose the stencil code',
    example: 'MAIN',
    required: false,
  })
  @IsOptional()
  @IsString()
  plateType?: string;

  @ApiProperty({
    description: 'Optional board version used to compose the stencil code',
    example: '53',
    required: false,
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({
    description: 'Stencil phase',
    example: StencilPhase.SECOND,
    enum: StencilPhase,
    required: false,
  })
  @IsOptional()
  @IsEnum(StencilPhase)
  phase?: StencilPhase;

  @ApiProperty({
    description: 'Optional copy identifier, appended to the stencil code after /',
    example: '3',
    required: false,
  })
  @IsOptional()
  @IsString()
  copy?: string;

  @ApiProperty({
    description: 'The ID of the stencil manufacturer',
    example: 'FB017S20241213-10',
    required: false,
  })
  @IsOptional()
  @IsString()
  manufactureId?: string;

  @ApiProperty({
    description: 'The country of origin of the stencil',
    example: 'China',
  })
  @IsString()
  country!: string;

  @ApiProperty({
    description: 'The thickness of the stencil',
    example: 0.08,
  })
  @IsNumber()
  thickness!: number;

  @ApiProperty({
    description: 'The stencil manufacturing date',
    example: '2024-09-27',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  manufacturedAt?: string;

  @ApiProperty({
    description: 'The address where the stencil is located in the rack',
    example: '305',
  })
  @IsString()
  addressing!: string;

  @ApiProperty({
    description: 'The name of the line where the stencil is used',
    example: 'Manicoré',
    required: false,
  })
  @IsOptional()
  @IsString()
  lineName?: string;

  @ApiProperty({
    description: 'The status of the stencil',
    example: 'validation',
    enum: WashStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(WashStatus)
  status?: WashStatus;

  @ApiProperty({
    description: 'Serigraphy approval',
    example: StencilApprovalStatus.OK,
    enum: StencilApprovalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(StencilApprovalStatus)
  serigraphy?: StencilApprovalStatus;

  @ApiProperty({
    description: 'Fiducials approval',
    example: StencilApprovalStatus.OK,
    enum: StencilApprovalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(StencilApprovalStatus)
  fiducials?: StencilApprovalStatus;

  @ApiProperty({
    description: 'Finishing approval',
    example: StencilApprovalStatus.OK,
    enum: StencilApprovalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(StencilApprovalStatus)
  finishing?: StencilApprovalStatus;

  @ApiProperty({
    description: 'Technical opinion',
    example: StencilTechnicalOpinion.APPROVED,
    enum: StencilTechnicalOpinion,
    required: false,
  })
  @IsOptional()
  @IsEnum(StencilTechnicalOpinion)
  technicalOpinion?: StencilTechnicalOpinion;
}
