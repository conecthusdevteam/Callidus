import { IsNumber, IsString } from "class-validator";

export class CreatePlateDto {
    @IsString()
    plateModel!: string;

    @IsString()
    serialNumber!: string;

    @IsString()
    blankId!: string;

    @IsNumber()
    shift!: number;

    @IsNumber()
    phase!: number;

    @IsNumber()
    totalWashes!: number;

    @IsString()
    operator!: string;

    @IsString()
    lineName!: string;
}
