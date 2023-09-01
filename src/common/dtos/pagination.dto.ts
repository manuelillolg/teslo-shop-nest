import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";


export class PaginationDto{

    @IsOptional()
    @IsPositive()
    @Type(()=> Number) //enableImplicitConversions:true
    //transformar string a entero
    limit?: number;

    @IsOptional()
    @IsPositive()
    @Type(()=> Number)
    offset?:number;
}