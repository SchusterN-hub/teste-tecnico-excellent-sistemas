import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/environment';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  description: string;
  sale_price: number;
  stock: number;
  images?: string[];
}

export interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    last_page: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getAll(page: number = 1, limit: number = 10): Observable<PaginatedProducts> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedProducts>(this.apiUrl, { params });
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
