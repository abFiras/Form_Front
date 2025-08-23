import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { AddformComponent } from './addform/addform.component';
import { UsersComponent } from './users/users.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // default route
  { path: 'connexion', component: LoginComponent }, // default route
  { path: 'ajouterform', component: AddformComponent }, // default route
  { path: 'users', component: UsersComponent },
  { path: 'profil', component: UserProfileComponent },
  { path: 'reset-password', component: ResetPasswordComponent },



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})
export class AppRoutingModule { }
