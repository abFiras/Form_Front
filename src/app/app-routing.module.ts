import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { AddformComponent } from './addform/addform.component';
import { UsersComponent } from './users/users.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormListComponent } from './form-list/form-list.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // default route
  { path: 'connexion', component: LoginComponent }, // default route
  { path: 'ajouterform', component: AddformComponent }, // default route
  { path: 'users', component: UsersComponent },
  { path: 'profil', component: UserProfileComponent },

// NEW: Form Builder - Drag & Drop Interface
  { path: 'builder', component: FormBuilderComponent },
  
 { path: 'forms', component: FormListComponent },
  { path: 'forms/new', component: FormBuilderComponent },
  { path: 'forms/:id/edit', component: FormBuilderComponent },
  { path: 'forms/:id/preview', component: FormBuilderComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})
export class AppRoutingModule { }
