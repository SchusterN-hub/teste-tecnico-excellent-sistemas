import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(paginationDto: PaginationDto) {
    const page: number = paginationDto.page ?? 1;
    const limit: number = paginationDto.limit ?? 10;
    const skip: number = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'DESC' as const },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const product = await this.findOne(id);

    let imagensAntigas: string[] = [];
    if (updateProductDto.images) {
      try {
        imagensAntigas = Array.isArray(updateProductDto.images)
          ? updateProductDto.images
          : (JSON.parse(updateProductDto.images) as string[]);
      } catch {
        imagensAntigas = Array.isArray(updateProductDto.images)
          ? updateProductDto.images
          : [updateProductDto.images];
      }
    }

    this.productRepository.merge(product, updateProductDto);

    let imagensFinais = [...imagensAntigas];

    if (files && Array.isArray(files) && files.length > 0) {
      const novasImagens = files.map((file) => {
        const name = file.filename || file.originalname || `img-${Date.now()}`;
        return `/uploads/${name}`;
      });

      imagensFinais = [...imagensFinais, ...novasImagens];
    }

    product.images = imagensFinais;

    return this.productRepository.save(product);
  }
  async remove(id: string) {
    const product = await this.findOne(id);
    return this.productRepository.softRemove(product);
  }
}
