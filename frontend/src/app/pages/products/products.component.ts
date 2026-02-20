import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService, Product } from '../../services/products.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../enviroments/environment';
import { ProductFormDialogComponent } from './components/product-form-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../utils/confirm-dialog-component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <div class="header-actions">
        <h1>Gerenciar Produtos</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Novo Produto
        </button>
      </div>

      <mat-card>
        <mat-card-content class="table-container">
          <table mat-table [dataSource]="products">
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef>Imagem</th>
              <td mat-cell *matCellDef="let p">
                @if (p.images && p.images.length > 0) {
                  <img
                    [src]="backendUrl + p.images[0]"
                    class="thumb"
                    alt="Foto"
                  />
                } @else {
                  <mat-icon>image_not_supported</mat-icon>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descrição</th>
              <td mat-cell *matCellDef="let p">{{ p.description }}</td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Preço</th>
              <td mat-cell *matCellDef="let p">
                {{ p.sale_price | currency: 'BRL' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Estoque</th>
              <td mat-cell *matCellDef="let p">{{ p.stock }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button color="primary" (click)="openForm(p)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="delete(p.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)"
          >
          </mat-paginator>
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
        padding: 0; /* Remove o padding padrão do card para a tabela encostar nas bordas */
      }
      table {
        width: 100%;
      }
      .thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }
      .mat-mdc-card-content {
        background-color: #faf9fd;
      }
    `,
  ],
})
export class ProductsComponent implements OnInit {
  service = inject(ProductsService);
  snack = inject(MatSnackBar);
  dialog = inject(MatDialog);

  products: Product[] = [];

  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  backendUrl = environment.apiUrl.replace('/api/v1', '');
  displayedColumns = ['image', 'description', 'price', 'stock', 'actions'];

  ngOnInit() {
    this.load();
  }

  load() {
    const pageParaApi = this.pageIndex + 1;
    this.service.getAll(pageParaApi, this.pageSize).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.products = res.data;
          this.totalItems = res.meta?.total || 0;
        } else {
          this.products = Array.isArray(res) ? res : [];
          this.totalItems = this.products.length;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.snack.open('Erro ao carregar lista de produtos', 'X', {
          duration: 3000,
        });
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openForm(product?: Product) {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { product },
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.load();
      }
    });
  }

  delete(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Excluir Produto',
        message:
          'Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Voltar',
        color: 'warn',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.service.delete(id).subscribe({
          next: () => {
            this.snack.open('Produto excluído', 'OK', { duration: 2000 });
            this.load();
          },
          error: () =>
            this.snack.open('Erro: Apenas administradores podem excluir', 'X', {
              duration: 3000,
            }),
        });
      }
    });
  }
}
