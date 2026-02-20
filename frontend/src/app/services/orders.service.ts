import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/environment';

export interface OrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  create(order: CreateOrderDto) {
    return this.http.post(this.apiUrl, order);
  }
}
