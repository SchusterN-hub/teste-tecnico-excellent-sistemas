import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CreateOrderDto,
  OrdersService,
} from '../../../services/orders.service';
import { Product, ProductsService } from '../../../services/products.service';
import { environment } from '../../../../enviroments/environment';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-order-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Nova Venda</h2>
      <h3 class="total-badge">Total: {{ cartTotal | currency: 'BRL' }}</h3>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="headerForm">
        <mat-form-field appearance="outline" class="full-width">
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

      <mat-divider style="margin: 10px 0 20px 0"></mat-divider>

      <form [formGroup]="itemForm" (ngSubmit)="addItem()" class="row">
        <mat-form-field appearance="outline" class="flex-grow">
          <mat-label>Produto</mat-label>
          <mat-select formControlName="product">
            @for (p of products; track p.id) {
              <mat-option [value]="p" [disabled]="p.stock === 0">
                {{ p.description }} -
                {{ p.sale_price | currency: 'BRL' }} (Estoque: {{ p.stock }})
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100px">
          <mat-label>Qtd</mat-label>
          <input matInput type="number" formControlName="quantity" min="1" />
        </mat-form-field>

        <button
          mat-raised-button
          color="accent"
          type="submit"
          [disabled]="itemForm.invalid"
          style="height: 56px"
        >
          <mat-icon>add_shopping_cart</mat-icon>
        </button>
      </form>

      <div *ngIf="cart.length > 0" class="cart-container mat-elevation-z2">
        <table mat-table [dataSource]="cart" style="width: 100%">
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let item">
              {{ item.product.description }}
            </td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Preço</th>
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
              <button
                mat-icon-button
                color="warn"
                (click)="removeItem(i)"
                type="button"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="headerForm.invalid || cart.length === 0"
        (click)="finishOrder()"
      >
        FINALIZAR PEDIDO
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 24px;
      }
      .dialog-content {
        min-width: 600px;
      }
      .total-badge {
        background: #4caf50;
        color: white;
        padding: 6px 16px;
        border-radius: 8px;
        margin: 0;
      }
      .full-width {
        width: 100%;
      }
      .row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .flex-grow {
        flex: 1;
      }
      .cart-container {
        margin-top: 15px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e0e0e0;
      }

      mat-icon {
        margin: 0 !important;
      }
    `,
  ],
})
export class OrderFormDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  ordersService = inject(OrdersService);
  productsService = inject(ProductsService);
  http = inject(HttpClient);
  snack = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<OrderFormDialogComponent>);

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
    this.http.get<any>(`${environment.apiUrl}/customers`).subscribe((res) => {
      this.customers = Array.isArray(res) ? res : res.data || [];
    });

    this.productsService.getAll(1, 100).subscribe({
      next: (res) => (this.products = res.data),
      error: (err) => console.error('Erro ao carregar produtos', err),
    });
  }

  get cartTotal(): number {
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
          product,
          quantity,
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
        this.snack.open('Pedido finalizado!', 'SUCESSO', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) =>
        this.snack.open(err.error?.message || 'Erro ao salvar', 'X', {
          duration: 4000,
        }),
    });
  }
}
