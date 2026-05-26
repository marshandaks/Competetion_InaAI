import { IsString, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditFeedbackDto {
  @ApiProperty({ description: 'Customer rating (1 to 5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Customer feedback comments' })
  @IsString()
  feedback: string;

  @ApiProperty({ description: 'Manual overriding sentiment (positive/neutral/negative)', required: false })
  @IsString()
  @IsOptional()
  sentiment?: string;

  @ApiProperty({ description: 'Manual overriding topics/tags', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  topics?: string[];

  @ApiProperty({ description: 'Active model version to perform optimistic lock check' })
  @IsInt()
  version: number;
}
