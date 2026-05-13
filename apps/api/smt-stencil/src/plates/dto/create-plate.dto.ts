import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePlateDto {
    @IsString()
    plateModel!: string;

    @IsString()
    serialNumber!: string;

    @IsString()
    blankId!: string;

    @IsString()
    lineName!: string;

    @IsOptional()
    @IsString()
    plateManufacturerId?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsNumber()
    thickness?: number;

    @IsOptional()
    @IsString()
    addressing?: string;
}
