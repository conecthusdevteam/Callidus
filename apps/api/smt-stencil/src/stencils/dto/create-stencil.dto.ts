import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { WashStatus } from "../entities/stencil.entity";

export class CreateStencilDto {
    @IsString()
    stencilCode!: string;

    @IsString()
    manufacteId!: string;

    @IsString()
    country!: string;

    @IsNumber()
    thickness!: number;

    @IsNumber()
    addressing!: number;

    @IsNumber()
    totalWashes!: number;
    
    @IsString()
    operator!: string;

    @IsString()
    lineName!: string;

    @IsOptional()
    @IsEnum(WashStatus)
    status?: WashStatus
}
