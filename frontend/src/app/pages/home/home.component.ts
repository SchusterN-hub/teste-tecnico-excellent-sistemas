import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterLink,
    RouterOutlet,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="drawer.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>Sistema Excellent</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <mat-drawer-container class="container">
      <mat-drawer #drawer mode="side" opened>
        <mat-nav-list>
          <a mat-list-item routerLink="/home/customers">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Clientes</span>
          </a>
          <a mat-list-item routerLink="/home/products">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Produtos</span>
          </a>
          <a mat-list-item routerLink="/home/orders">
            <mat-icon matListItemIcon>shopping_cart</mat-icon>
            <span matListItemTitle>Pedidos</span>
          </a>
        </mat-nav-list>
      </mat-drawer>

      <mat-drawer-content>
        <div class="content-padding">
          <router-outlet></router-outlet>
        </div>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: [
    `
      .container {
        height: calc(100vh - 64px);
      }
      .spacer {
        flex: 1 1 auto;
      }
      .content-padding {
        padding: 20px;
      }
      mat-toolbar {
        position: sticky;
        top: 0;
        z-index: 1000;
      }
    `,
  ],
})
export class HomeComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
