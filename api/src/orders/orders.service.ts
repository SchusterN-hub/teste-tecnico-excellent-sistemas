import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const customer = await this.customerRepository.findOneBy({
      id: createOrderDto.customerId,
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const orderItems: OrderItem[] = [];

    for (const itemDto of createOrderDto.items) {
      const product = await this.productRepository.findOneBy({
        id: itemDto.productId,
      });

      if (!product) {
        throw new NotFoundException(
          `Produto ID ${itemDto.productId} não encontrado`,
        );
      }

      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.description}`,
        );
      }

      const orderItem = new OrderItem();
      orderItem.product = product;
      orderItem.quantity = itemDto.quantity;

      orderItem.price = Number(product.sale_price);

      orderItems.push(orderItem);
    }

    const order = this.orderRepository.create({
      customer: customer,
      user: user,
      items: orderItems,
    });

    return this.orderRepository.save(order);
  }

  findAll() {
    return this.orderRepository.find({
      relations: ['items', 'items.product', 'customer', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'customer', 'user'],
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    return this.orderRepository.remove(order);
  }
}
