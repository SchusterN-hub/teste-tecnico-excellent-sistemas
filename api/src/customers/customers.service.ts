import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

interface CnpjWsResponse {
  razao_social: string;
  cnpj_raiz: string;
  estabelecimento: {
    email: string;
    cnpj_ordem: string;
    cnpj_dv: string;
  };
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repository: Repository<Customer>,
    private readonly httpService: HttpService,
  ) {}

  async getCnpjData(cnpj: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get<CnpjWsResponse>(
          `https://publica.cnpj.ws/cnpj/${cnpj}`,
        ),
      );

      return {
        razao_social: response.data.razao_social,
        email: response.data.estabelecimento.email,
        cnpj:
          response.data.cnpj_raiz +
          response.data.estabelecimento.cnpj_ordem +
          response.data.estabelecimento.cnpj_dv,
      };
    } catch {
      throw new BadRequestException(
        'Não foi possível obter dados deste CNPJ. Verifique se é válido.',
      );
    }
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const existing = await this.repository.findOneBy({
      cnpj: createCustomerDto.cnpj,
    });
    if (existing)
      throw new BadRequestException('Cliente com este CNPJ já cadastrado');

    const customer = this.repository.create(createCustomerDto);
    return this.repository.save(customer);
  }

  async findAll() {
    return this.repository.find();
  }

  async findOne(id: string) {
    const customer = await this.repository.findOneBy({ id });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    this.repository.merge(customer, updateCustomerDto);
    return this.repository.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    return this.repository.remove(customer);
  }
}
