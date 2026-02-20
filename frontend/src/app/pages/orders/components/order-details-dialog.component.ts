import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-order-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        Detalhes do Pedido
        <span class="order-id">#{{ data.order.id.substring(0, 8) }}</span>
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <div class="info-section">
        <div class="info-block">
          <h3>Dados do Pedido</h3>
          <p>
            <strong>Data:</strong>
            {{ data.order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
          </p>
          <p><strong>ID Completo:</strong> {{ data.order.id }}</p>
        </div>

        <div class="info-block">
          <h3>Dados do Cliente</h3>
          <p>
            <strong>Razão Social:</strong>
            {{ data.order.customer?.razao_social || 'N/A' }}
          </p>
          <p><strong>CNPJ:</strong> {{ data.order.customer?.cnpj || 'N/A' }}</p>
          <p>
            <strong>E-mail:</strong> {{ data.order.customer?.email || 'N/A' }}
          </p>
        </div>
      </div>

      <mat-divider style="margin: 20px 0"></mat-divider>

      <h3>Itens do Pedido</h3>
      <table
        mat-table
        [dataSource]="data.order.items || []"
        class="mat-elevation-z1"
      >
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Produto</th>
          <td mat-cell *matCellDef="let item">
            {{ item.product?.description || 'Produto não encontrado' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Preço Unit.</th>
          <td mat-cell *matCellDef="let item">
            {{ item.price | currency: 'BRL' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Qtd</th>
          <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="subtotal">
          <th mat-header-cell *matHeaderCellDef>Subtotal</th>
          <td mat-cell *matCellDef="let item">
            <strong>{{ item.price * item.quantity | currency: 'BRL' }}</strong>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <div class="total-section">
        <h2>
          Total do Pedido:
          <span class="total-value">{{
            calculateTotal() | currency: 'BRL'
          }}</span>
        </h2>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close color="primary">Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 8px;
      }
      .dialog-content {
        min-width: 600px;
        max-width: 800px;
      }
      .order-id {
        color: #757575;
        font-size: 0.9em;
      }
      .info-section {
        display: flex;
        gap: 40px;
        margin-top: 10px;
      }
      .info-block h3 {
        margin-bottom: 8px;
        color: #3f51b5; /* Cor primary do Material, ajuste se necessário */
      }
      .info-block p {
        margin: 4px 0;
        color: #424242;
      }
      table {
        width: 100%;
        margin-top: 10px;
      }
      .total-section {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 10px;
        border-top: 2px solid #eee;
      }
      .total-value {
        color: #4caf50;
      }
    `,
  ],
})
export class OrderDetailsDialogComponent {
  displayedColumns = ['product', 'price', 'quantity', 'subtotal'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { order: any }) {}

  ngoninit() {
    console.log('Pedido recebido no modal de detalhes:', this.data.order);
  }

  calculateTotal(): number {
    if (!this.data.order?.items) return 0;
    return this.data.order.items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0,
    );
  }
}
