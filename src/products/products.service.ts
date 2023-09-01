import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import {validate as isUUID} from 'uuid';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ){}

  async create(createProductDto: CreateProductDto) {
    try{
      
      // if(!createProductDto.slug){
      //   createProductDto.slug = createProductDto.title.toLowerCase().replaceAll(' ', '_')
      //   .replaceAll("'",'');
      // }else{
      //   createProductDto.slug = createProductDto.slug.toLowerCase().replaceAll(' ', '_')
      //   .replaceAll("'",'');
      // }

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);

      return product;
    }catch(error){
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto:PaginationDto) {
    const {limit = 10, offset = 0} =  paginationDto;
    
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: relaciones
    });
    return products;
  }

  async findOne(id: string) {
    let product :Product;
    
    if(isUUID(id)){
      product = await this.productRepository.findOneBy({id});
    }

    else{
      //Esto es valido solo si funcionasemos con el slug
      //product = await this.productRepository.findOneBy({slug: id});
      //Esto es para buscar por slug o titulo
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder.where(
        'UPPER(title) =:title or slug =:slug', {
          title: id.toUpperCase(),
          slug: id.toLowerCase(),
        }
      ).getOne();

    }
   

    if (!product){
      throw new BadRequestException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);

    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
      
    
    
  }

  async remove(id: string) {
    await this.findOne(id);

    const product =  await this.productRepository.delete(id);
  }

  private handleExceptions(error){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
