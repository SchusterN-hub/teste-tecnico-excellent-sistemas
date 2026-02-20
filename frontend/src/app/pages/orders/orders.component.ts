import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { OrdersService, CreateOrderDto } from '../../services/orders.service';
import { ProductsService, Product } from '../../services/products.service';
import { environment } from '../../../enviroments/environment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../components/confirm-dialog-component';

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
    MatDividerModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <div class="header-row">
        <h1>Nova Venda</h1>
        <h2 class="total-badge">
          Total Carrinho: {{ cartTotal | currency: 'BRL' }}
        </h2>
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

          <mat-divider style="margin: 15px 0"></mat-divider>

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

      <mat-card *ngIf="cart.length > 0">
        <mat-card-header>
          <mat-card-title>Itens do Pedido Atual</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="cart">
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
              [disabled]="headerForm.invalid"
              (click)="finishOrder()"
            >
              FINALIZAR PEDIDO
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-divider></mat-divider>

      <div class="header-row">
        <h1>Pedidos Realizados</h1>
      </div>

      <table mat-table [dataSource]="pastOrders" class="mat-elevation-z8">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>Pedido</th>
          <td mat-cell *matCellDef="let o">#{{ o.id.substring(0, 8) }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Data</th>
          <td mat-cell *matCellDef="let o">
            {{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef>Cliente</th>
          <td mat-cell *matCellDef="let o">{{ o.customer?.razao_social }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let o">
            <strong>{{ calculateOrderTotal(o) | currency: 'BRL' }}</strong>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Ações</th>
          <td mat-cell *matCellDef="let o">
            <button mat-icon-button color="warn" (click)="deleteOrder(o.id)">
              <mat-icon>delete_forever</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: orderColumns"></tr>
      </table>
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
    `,
  ],
})
export class OrdersComponent implements OnInit {
  fb = inject(FormBuilder);
  ordersService = inject(OrdersService);
  productsService = inject(ProductsService);
  http = inject(HttpClient);
  snack = inject(MatSnackBar);
  dialog = inject(MatDialog);

  customers: any[] = [];
  products: Product[] = [];
  cart: CartItem[] = [];
  pastOrders: any[] = []; // Array para armazenar os pedidos vindos do banco

  displayedColumns = ['product', 'price', 'quantity', 'subtotal', 'actions'];
  orderColumns = ['id', 'date', 'customer', 'total', 'actions']; // Colunas da tabela de histórico

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
    this.http.get<any>(`${environment.apiUrl}/customers`).subscribe((res) => {
      this.customers = Array.isArray(res) ? res : res.data || [];
    });

    this.productsService.getAll(1, 100).subscribe({
      next: (res) => (this.products = res.data),
      error: (err) => console.error('Erro ao carregar produtos', err),
    });

    this.ordersService.getAll().subscribe({
      next: (res: any) => {
        this.pastOrders = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) =>
        console.error('Erro ao carregar histórico de pedidos', err),
    });
  }

  get cartTotal(): number {
    return this.cart.reduce((acc, item) => acc + item.subtotal, 0);
  }

  calculateOrderTotal(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0,
    );
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
        this.cart = [];
        this.headerForm.reset();
        this.loadData(); // Atualiza a lista de pedidos e o estoque dos produtos
      },
      error: (err) =>
        this.snack.open(err.error?.message || 'Erro ao salvar', 'X', {
          duration: 4000,
        }),
    });
  }

  deleteOrder(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Excluir Pedido',
        message:
          'Deseja excluir este pedido permanentemente? O estoque dos produtos não será estornado automaticamente.',
        confirmText: 'Excluir Pedido',
        cancelText: 'Cancelar',
        color: 'warn',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.ordersService.delete(id).subscribe({
          next: () => {
            this.snack.open('Pedido removido', 'OK', { duration: 2000 });
            this.loadData();
          },
          error: () =>
            this.snack.open(
              'Erro: Apenas administradores podem excluir pedidos',
              'X',
              { duration: 4000 },
            ),
        });
      }
    });
  }
}
