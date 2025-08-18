import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { AddformComponent } from './addform/addform.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // default route
  { path: 'connexion', component: LoginComponent }, // default route
  { path: 'ajouterform', component: AddformComponent }, // default route
  { path: 'users', component: UsersComponent },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})
export class AppRoutingModule { }
