import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { OrdersService, CreateOrderDto } from '../../services/orders.service';
import { ProductsService, Product } from '../../services/products.service';
import { environment } from '../../../enviroments/environment';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="container">
      <div class="header-row">
        <h1>Nova Venda</h1>
        <h2 class="total-badge">Total: {{ total | currency: 'BRL' }}</h2>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="headerForm">
            <mat-form-field appearance="outline" style="width: 100%">
              <mat-label>Selecione o Cliente</mat-label>
              <mat-select formControlName="customerId">
                @for (c of customers; track c.id) {
                  <mat-option [value]="c.id">
                    {{ c.razao_social }} ({{ c.cnpj }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </form>

          <hr />

          <form [formGroup]="itemForm" (ngSubmit)="addItem()" class="row">
            <mat-form-field appearance="outline" class="flex-grow">
              <mat-label>Produto</mat-label>
              <mat-select formControlName="product">
                @for (p of products; track p.id) {
                  <mat-option [value]="p" [disabled]="p.stock === 0">
                    {{ p.description }} -
                    {{ p.sale_price | currency: 'BRL' }} (Estoque:
                    {{ p.stock }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" style="width: 100px">
              <mat-label>Qtd</mat-label>
              <input
                matInput
                type="number"
                formControlName="quantity"
                min="1"
              />
            </mat-form-field>

            <button
              mat-raised-button
              color="accent"
              type="submit"
              [disabled]="itemForm.invalid"
              style="height: 56px"
            >
              <mat-icon>add_shopping_cart</mat-icon> Adicionar
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <table mat-table [dataSource]="cart" class="mat-elevation-z8">
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Produto</th>
          <td mat-cell *matCellDef="let item">
            {{ item.product.description }}
          </td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Preço Unit.</th>
          <td mat-cell *matCellDef="let item">
            {{ item.product.sale_price | currency: 'BRL' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Qtd</th>
          <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="subtotal">
          <th mat-header-cell *matHeaderCellDef>Subtotal</th>
          <td mat-cell *matCellDef="let item">
            <strong>{{ item.subtotal | currency: 'BRL' }}</strong>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let item; let i = index">
            <button mat-icon-button color="warn" (click)="removeItem(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <div class="footer-actions">
        <button
          mat-raised-button
          color="primary"
          size="large"
          [disabled]="cart.length === 0 || headerForm.invalid"
          (click)="finishOrder()"
        >
          FINALIZAR PEDIDO
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .total-badge {
        background: #4caf50;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
      }
      .row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin-top: 15px;
      }
      .flex-grow {
        flex: 1;
      }
      .footer-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
      hr {
        border: 0;
        border-top: 1px solid #eee;
        margin: 20px 0;
      }
    `,
  ],
})
export class OrdersComponent implements OnInit {
  fb = inject(FormBuilder);
  ordersService = inject(OrdersService);
  productsService = inject(ProductsService);
  http = inject(HttpClient);
  snack = inject(MatSnackBar);

  customers: any[] = [];
  products: Product[] = [];
  cart: CartItem[] = [];

  displayedColumns = ['product', 'price', 'quantity', 'subtotal', 'actions'];

  headerForm = this.fb.group({
    customerId: ['', Validators.required],
  });

  itemForm = this.fb.group({
    product: [null as Product | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http
      .get<any[]>(`${environment.apiUrl}/customers`)
      .subscribe((data) => (this.customers = data));
    this.productsService.getAll().subscribe((data) => (this.products = data));
  }

  get total(): number {
    return this.cart.reduce((acc, item) => acc + item.subtotal, 0);
  }

  addItem() {
    if (this.itemForm.invalid) return;

    const { product, quantity } = this.itemForm.value;

    if (product && quantity) {
      const existingItem = this.cart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal =
          existingItem.quantity * Number(product.sale_price);
      } else {
        this.cart.push({
          product: product,
          quantity: quantity,
          subtotal: quantity * Number(product.sale_price),
        });
      }

      this.cart = [...this.cart];
      this.itemForm.reset({ product: null, quantity: 1 });
    }
  }

  removeItem(index: number) {
    this.cart.splice(index, 1);
    this.cart = [...this.cart];
  }

  finishOrder() {
    if (this.headerForm.invalid || this.cart.length === 0) return;

    const payload: CreateOrderDto = {
      customerId: this.headerForm.value.customerId!,
      items: this.cart.map((item) => ({
        productId: item.product.id!,
        quantity: item.quantity,
      })),
    };

    this.ordersService.create(payload).subscribe({
      next: () => {
        this.snack.open('Pedido realizado com sucesso!', 'SUCESSO', {
          duration: 4000,
        });
        this.cart = [];
        this.headerForm.reset();
        this.loadData(); // Recarrega para atualizar os estoques no select
      },
      error: (err) => {
        this.snack.open(
          'Erro ao fechar pedido: ' +
            (err.error?.message || 'Erro desconhecido'),
          'X',
          { duration: 4000 },
        );
      },
    });
  }
}
