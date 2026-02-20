import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService, Product } from '../../services/products.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../enviroments/environment';
import { NgxMaskDirective } from 'ngx-mask';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatFormFieldModule,
    NgxMaskDirective,
    MatPaginatorModule,
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Novo Produto</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="row">
              <mat-form-field
                appearance="outline"
                class="flex-grow"
                floatLabel="always"
              >
                <mat-label>Descrição</mat-label>
                <input matInput type="text" formControlName="description" />
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Preço</mat-label>
                <input
                  matInput
                  type="text"
                  formControlName="sale_price"
                  prefix="R$ "
                  mask="separator.2"
                  thousandSeparator="."
                  decimalMarker=","
                />
              </mat-form-field>

              <mat-form-field
                appearance="outline"
                style="width: 100px"
                floatLabel="always"
              >
                <mat-label>Estoque</mat-label>
                <input matInput type="number" formControlName="stock" />
              </mat-form-field>
            </div>

            <div class="file-upload">
              <label>Imagens do Produto:</label>
              <input
                type="file"
                multiple
                (change)="onFileSelected($event)"
                accept="image/*"
              />
              <span class="file-info" *ngIf="selectedFiles.length">
                {{ selectedFiles.length }} arquivos selecionados
              </span>
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="form.status !== 'VALID'"
            >
              Salvar Produto
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <table mat-table [dataSource]="products" class="mat-elevation-z8">
        <ng-container matColumnDef="image">
          <th mat-header-cell *matHeaderCellDef>Imagem</th>
          <td mat-cell *matCellDef="let p">
            @if (p.images && p.images.length > 0) {
              <img [src]="backendUrl + p.images[0]" class="thumb" alt="Foto" />
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
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .flex-grow {
        flex: 1;
      }
      .file-upload {
        margin-bottom: 20px;
        padding: 10px;
        border: 1px dashed #ccc;
        border-radius: 4px;
      }
      .thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }
      .file-info {
        margin-left: 10px;
        color: green;
        font-weight: bold;
      }
      .row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
    `,
  ],
})
export class ProductsComponent implements OnInit {
  fb = inject(FormBuilder);
  service = inject(ProductsService);
  snack = inject(MatSnackBar);

  products: Product[] = [];
  selectedFiles: File[] = [];

  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  backendUrl = environment.apiUrl.replace('/api/v1', '');

  displayedColumns = ['image', 'description', 'price', 'stock', 'actions'];

  form = this.fb.group({
    description: this.fb.control('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    sale_price: this.fb.control('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    stock: this.fb.control(0, {
      validators: [Validators.required, Validators.min(0)],
      nonNullable: true,
    }),
  });

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
        this.products = [];
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

  onFileSelected(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  save() {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    let rawPrice = formValue.sale_price?.toString() || '0';
    rawPrice = rawPrice
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const product: Product = {
      description: formValue.description as string,
      stock: Number(formValue.stock),
      sale_price: parseFloat(rawPrice),
    };

    this.service.create(product, this.selectedFiles).subscribe({
      next: () => {
        this.snack.open('Produto criado com sucesso!', 'OK', {
          duration: 3000,
        });

        this.form.reset({ description: '', sale_price: '', stock: 0 });
        this.selectedFiles = [];
        this.load();
      },
      error: (err) => {
        this.snack.open('Erro ao criar produto', 'X', { duration: 3000 });
        console.error(err);
      },
    });
  }

  delete(id: string) {
    if (confirm('Deseja realmente excluir?')) {
      this.service.delete(id).subscribe({
        next: () => {
          this.snack.open('Produto excluído', 'OK', { duration: 2000 });
          this.load();
        },
        error: (err) => {
          this.snack.open('Erro: Você não tem permissão (Admin only)', 'X', {
            duration: 3000,
          });
        },
      });
    }
  }
}
