import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../enviroments/environment';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../components/confirm-dialog-component';

function cnpjValidator(
  control: AbstractControl,
): { [key: string]: boolean } | null {
  const cnpj = control.value?.replace(/[^\d]+/g, '');

  if (!cnpj) return null;
  if (cnpj.length !== 14) return { invalidCnpj: true };
  if (/^(\d)\1+$/.test(cnpj)) return { invalidCnpj: true };

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return { invalidCnpj: true };

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return { invalidCnpj: true };

  return null;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NgxMaskDirective,
    NgxMaskPipe,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Gerenciar Clientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>CNPJ</mat-label>
                <input
                  matInput
                  formControlName="cnpj"
                  mask="00.000.000/0000-00"
                  (blur)="searchCnpj()"
                />
                <mat-icon
                  matSuffix
                  (click)="searchCnpj()"
                  style="cursor: pointer"
                  >search</mat-icon
                >
                @if (form.get('cnpj')?.hasError('invalidCnpj')) {
                  <mat-error>CNPJ Inválido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>Razão Social</mat-label>
                <input matInput formControlName="razao_social" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" style="width: 100%">
              <mat-label>E-mail</mat-label>
              <input matInput formControlName="email" type="email" />
            </mat-form-field>

            <button mat-raised-button color="primary" [disabled]="form.invalid">
              Salvar Cliente
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <table mat-table [dataSource]="customers" class="mat-elevation-z8">
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
      .form-card {
        padding: 10px;
      }
      .row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .flex-grow {
        flex: 1;
      }
    `,
  ],
})
export class CustomersComponent implements OnInit {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  snack = inject(MatSnackBar);
  dialog = inject(MatDialog);

  customers: any[] = [];
  displayedColumns = ['cnpj', 'razao_social', 'email', 'actions'];
  apiUrl = `${environment.apiUrl}/customers`;

  form = this.fb.group({
    razao_social: ['', Validators.required],
    cnpj: ['', [Validators.required, cnpjValidator]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.http
      .get<any[]>(this.apiUrl)
      .subscribe((data) => (this.customers = data));
  }

  searchCnpj() {
    const rawCnpj = this.form.get('cnpj')?.value?.toString().replace(/\D/g, '');

    if (rawCnpj?.length !== 14 || this.form.get('cnpj')?.invalid) return;

    this.http.get<any>(`${this.apiUrl}/lookup-cnpj/${rawCnpj}`).subscribe({
      next: (data) => {
        this.form.patchValue({
          razao_social: data.razao_social,
          email: data.email,
        });
        this.snack.open('Dados encontrados na Receita!', 'OK', {
          duration: 3000,
        });
      },
      error: () => {
        this.snack.open('CNPJ não encontrado.', 'Fechar', { duration: 3000 });
      },
    });
  }

  save() {
    if (this.form.invalid) return;

    const payload = {
      ...this.form.value,
      cnpj: this.form.value.cnpj?.toString().replace(/\D/g, ''),
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.snack.open('Cliente salvo!', 'Sucesso', { duration: 3000 });
        this.form.reset();
        this.loadCustomers();
      },
      error: (err) => {
        this.snack.open(
          'Erro ao salvar: ' + (err.error.message || err.message),
          'X',
          { duration: 3000 },
        );
      },
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
          error: () =>
            this.snack.open('Sem permissão para excluir', 'X', {
              duration: 3000,
            }),
        });
      }
    });
  }
}
