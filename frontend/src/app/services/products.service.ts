import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/environment';

export interface Product {
  id?: string;
  description: string;
  sale_price: number;
  stock: number;
  images?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getAll() {
    return this.http.get<Product[]>(this.apiUrl);
  }

  create(product: Product, files: File[]) {
    const formData = new FormData();

    formData.append('description', product.description);
    formData.append('sale_price', product.sale_price.toString());
    formData.append('stock', product.stock.toString());

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return this.http.post(this.apiUrl, formData);
  }
  delete(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
