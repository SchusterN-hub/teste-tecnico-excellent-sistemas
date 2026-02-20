import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMaskDirective } from 'ngx-mask';
import { environment } from '../../../../enviroments/environment';

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
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
    NgxMaskDirective,
  ],
  template: `
    <h2 mat-dialog-title>Novo Cliente</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="row">
          <mat-form-field appearance="outline" class="flex-grow">
            <mat-label>CNPJ</mat-label>
            <input
              matInput
              formControlName="cnpj"
              mask="00.000.000/0000-00"
              (blur)="searchCnpj()"
            />
            <mat-icon matSuffix (click)="searchCnpj()" style="cursor: pointer"
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

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid"
        (click)="save()"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 10px;
        min-width: 500px;
      }
      .full-width {
        width: 100%;
      }
      .row {
        display: flex;
        gap: 15px;
      }
      .flex-grow {
        flex: 1;
      }
    `,
  ],
})
export class CustomerFormDialogComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  snack = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<CustomerFormDialogComponent>);

  apiUrl = `${environment.apiUrl}/customers`;

  form = this.fb.group({
    razao_social: ['', Validators.required],
    cnpj: ['', [Validators.required, cnpjValidator]],
    email: ['', [Validators.required, Validators.email]],
  });

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
        this.dialogRef.close(true); // Retorna true para o componente pai atualizar a tabela
      },
      error: (err) => {
        this.snack.open(
          'Erro ao salvar: ' + (err.error?.message || err.message),
          'X',
          { duration: 3000 },
        );
      },
    });
  }
}
