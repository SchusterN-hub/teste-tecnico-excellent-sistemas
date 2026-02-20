import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMaskDirective } from 'ngx-mask';
import { Product, ProductsService } from '../../../services/products.service';
import { environment } from '../../../../enviroments/environment';

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatIconModule,
    NgxMaskDirective,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data?.product ? 'Editar Produto' : 'Novo Produto' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrição</mat-label>
          <input
            matInput
            type="text"
            formControlName="description"
            placeholder="Ex: Monitor Gamer 24'"
          />
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="flex-grow">
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

          <mat-form-field appearance="outline" style="width: 120px">
            <mat-label>Estoque</mat-label>
            <input matInput type="number" formControlName="stock" />
          </mat-form-field>
        </div>

        <div class="file-upload-container">
          <label for="fileInput" class="custom-file-upload mat-elevation-z2">
            <mat-icon>cloud_upload</mat-icon> Adicionar Imagens
          </label>
          <input
            id="fileInput"
            type="file"
            multiple
            (change)="onFileSelected($event)"
            accept="image/*"
            style="display: none;"
          />
        </div>

        <div
          class="image-gallery"
          *ngIf="existingImages.length > 0 || newImagePreviews.length > 0"
        >
          @for (imgUrl of existingImages; track imgUrl; let i = $index) {
            <div class="thumb-container existing">
              <img [src]="imgUrl" alt="Imagem existente" />
              <span class="badge">Atual</span>
              <button
                type="button"
                class="delete-img-btn"
                (click)="removeExistingImage(i)"
                title="Remover"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @for (preview of newImagePreviews; track preview; let i = $index) {
            <div class="thumb-container new">
              <img [src]="preview" alt="Nova imagem" />
              <span class="badge new-badge">Nova</span>
              <button
                type="button"
                class="delete-img-btn"
                (click)="removeNewImage(i)"
                title="Remover"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
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
        {{ data?.product ? 'Atualizar' : 'Salvar' }}
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

      .file-upload-container {
        margin-top: 10px;
        display: flex;
        justify-content: flex-start;
      }
      .custom-file-upload {
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        background-color: #f5f5f5;
        font-weight: 500;
      }
      .custom-file-upload:hover {
        background-color: #e0e0e0;
      }

      .image-gallery {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 15px;
        padding: 15px;
        border: 1px dashed #ddd;
        border-radius: 8px;
        background: #fafafa;
      }
      .thumb-container {
        position: relative;
        width: 90px;
        height: 90px;
        border-radius: 6px;
        overflow: hidden;
        border: 2px solid #e0e0e0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .thumb-container.new {
        border-color: #4caf50;
      }
      .thumb-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .badge {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 0.65rem;
        text-align: center;
        padding: 3px 0;
        font-weight: bold;
      }
      .new-badge {
        background: rgba(76, 175, 80, 0.9);
      }

      /* Botão de excluir imagem */
      .delete-img-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: transform 0.2s;
      }
      .delete-img-btn:hover {
        transform: scale(1.1);
        background: red;
      }
      .delete-img-btn mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        font-weight: bold;
      }
    `,
  ],
})
export class ProductFormDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  service = inject(ProductsService);
  snack = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ProductFormDialogComponent>);

  backendUrl = environment.apiUrl.replace('/api/v1', '');

  selectedFiles: File[] = [];
  newImagePreviews: string[] = [];

  existingImages: string[] = [];
  imagesToKeep: string[] = [];

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: { product?: Product }) {}

  ngOnInit(): void {
    if (this.data?.product) {
      const formattedPrice = Number(this.data.product.sale_price)
        .toFixed(2)
        .replace('.', ',');

      this.form.patchValue({
        description: this.data.product.description,
        sale_price: formattedPrice,
        stock: this.data.product.stock,
      });

      if (this.data.product.images && Array.isArray(this.data.product.images)) {
        this.imagesToKeep = [...this.data.product.images];
        this.existingImages = this.imagesToKeep.map(
          (imgRoute) => this.backendUrl + imgRoute,
        );
      }
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files) as File[];
      this.selectedFiles = [...this.selectedFiles, ...newFiles];

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newImagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
    this.imagesToKeep.splice(index, 1);
  }

  removeNewImage(index: number) {
    this.newImagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  save() {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    let rawPrice = formValue.sale_price
      .toString()
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const productData: Product = {
      description: formValue.description,
      stock: Number(formValue.stock),
      sale_price: parseFloat(rawPrice),
      images: this.imagesToKeep,
    };

    const request = this.data?.product?.id
      ? this.service.update(
          this.data.product.id,
          productData,
          this.selectedFiles,
        )
      : this.service.create(productData, this.selectedFiles);

    request.subscribe({
      next: () => {
        this.snack.open(
          this.data?.product ? 'Produto atualizado!' : 'Produto criado!',
          'OK',
          { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Erro ao salvar produto', 'X', { duration: 3000 });
      },
    });
  }
}
