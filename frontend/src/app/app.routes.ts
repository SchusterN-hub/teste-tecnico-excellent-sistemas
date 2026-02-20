import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProductsComponent } from './pages/products/products.component';
import { authGuard } from './guards/auth.guard';
import { OrdersComponent } from './pages/orders/orders.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    children: [
      { path: 'customers', component: CustomersComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'orders', component: OrdersComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' },
];
