import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskPipe } from 'ngx-mask';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../enviroments/environment';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../utils/confirm-dialog-component';
import { CustomerFormDialogComponent } from './components/customer-form-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NgxMaskPipe,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <div class="header-actions">
        <h1>Gerenciar Clientes</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Novo Cliente
        </button>
      </div>

      <mat-card>
        <mat-card-content class="table-container">
          <table mat-table [dataSource]="customers">
            <ng-container matColumnDef="cnpj">
              <th mat-header-cell *matHeaderCellDef>CNPJ</th>
              <td mat-cell *matCellDef="let c">
                {{ c.cnpj | mask: '00.000.000/0000-00' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="razao_social">
              <th mat-header-cell *matHeaderCellDef>Razão Social</th>
              <td mat-cell *matCellDef="let c">{{ c.razao_social }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>E-mail</th>
              <td mat-cell *matCellDef="let c">{{ c.email }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button color="warn" (click)="delete(c.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
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
      .mat-mdc-card-content {
        background-color: #faf9fd;
      }
    `,
  ],
})
export class CustomersComponent implements OnInit {
  http = inject(HttpClient);
  snack = inject(MatSnackBar);
  dialog = inject(MatDialog);

  customers: any[] = [];
  displayedColumns = ['cnpj', 'razao_social', 'email', 'actions'];
  apiUrl = `${environment.apiUrl}/customers`;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.http
      .get<any[]>(this.apiUrl)
      .subscribe((data) => (this.customers = data));
  }

  openForm() {
    const dialogRef = this.dialog.open(CustomerFormDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.loadCustomers();
      }
    });
  }

  delete(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Excluir Cliente',
        message:
          'Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        color: 'warn',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            this.loadCustomers();
            this.snack.open('Cliente removido', 'OK', { duration: 2000 });
          },
          error: (err) =>
            this.snack.open(
              'Erro ao excluir cliente: ' + err.error?.message || err.message,
              'X',
              {
                duration: 3000,
              },
            ),
        });
      }
    });
  }
}
