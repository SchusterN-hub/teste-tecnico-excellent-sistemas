import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/environment';
import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';

export interface OrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
}

export interface Order {
  id: string;
  createdAt: Date;
  customer: {
    razao_social: string;
  };
  items: {
    price: number;
    quantity: number;
    product: {
      description: string;
    };
  }[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  create(order: CreateOrderDto) {
    return this.http.post(this.apiUrl, order);
  }

  delete(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
