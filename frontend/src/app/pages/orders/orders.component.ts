import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrdersService } from '../../services/orders.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../utils/confirm-dialog-component';
import { OrderFormDialogComponent } from './components/order-form-dialog.component';
import { OrderDetailsDialogComponent } from './components/order-details-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <div class="header-actions">
        <h1>Histórico de Vendas</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add_shopping_cart</mat-icon> Nova Venda
        </button>
      </div>

      <mat-card>
        <mat-card-content class="table-container">
          <table mat-table [dataSource]="pastOrders">
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
              <td mat-cell *matCellDef="let o">
                {{ o.customer?.razao_social }}
              </td>
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
                <button
                  mat-icon-button
                  color="primary"
                  (click)="openDetails(o)"
                  title="Ver Detalhes"
                >
                  <mat-icon>visibility</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  (click)="deleteOrder(o.id)"
                  title="Excluir Pedido"
                >
                  <mat-icon>delete_forever</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: orderColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
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
      .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-actions h1 {
        margin: 0;
      }
      .table-container {
        padding: 0;
      }
      table {
        width: 100%;
      }
    `,
  ],
})
export class OrdersComponent implements OnInit {
  ordersService = inject(OrdersService);
  snack = inject(MatSnackBar);
  dialog = inject(MatDialog);

  pastOrders: any[] = [];
  orderColumns = ['id', 'date', 'customer', 'total', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.ordersService.getAll().subscribe({
      next: (res: any) => {
        this.pastOrders = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) =>
        console.error('Erro ao carregar histórico de pedidos', err),
    });
  }

  calculateOrderTotal(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0,
    );
  }

  openForm() {
    const dialogRef = this.dialog.open(OrderFormDialogComponent, {
      width: '800px',
      maxWidth: '100vw',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.loadData();
      }
    });
  }

  openDetails(order: any) {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '100vw',
      data: { order: order },
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
