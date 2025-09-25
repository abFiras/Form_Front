import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { AddformComponent } from './addform/addform.component';
import { UsersComponent } from './users/users.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormListComponent } from './form-list/form-list.component';
import { AcceuilComponent } from './acceuil/acceuil.component';
import { CreeListeExterneComponent } from './cree-liste-externe/cree-liste-externe.component';
import { BibliothequeComponent } from './bibliotheque/bibliotheque.component';
import { LibraryFormDetailComponent } from './library-form-detail/library-form-detail.component';
import { ListexterneComponent } from './listexterne/listexterne.component';
import { ListExterneCardComponent } from './list-externe-card/list-externe-card.component';
import { ExternalListDetailComponent } from './external-list-detail/external-list-detail.component';
import { FormSubmissionsComponent } from './form-submissions/form-submissions.component';
import { PublicFormComponent } from './public-form/public-form.component';
import { FormFillComponent } from './form-fill/form-fill.component';
import { SubmissionDetailComponent } from './submission-detail/submission-detail.component';
import { FormHistoryComponent } from './form-history/form-history.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // default route
  { path: 'connexion', component: LoginComponent }, // default route
  { path: 'ajouterform', component: AddformComponent }, // default route
    { path: 'dashboard', component: AcceuilComponent }, // default route

  { path: 'users', component: UsersComponent },
  { path: 'profil', component: UserProfileComponent },
// ✅ NOUVEAU : Route pour remplir un formulaire publié (authentifié)
  { path: 'forms/:id/fill', component: FormFillComponent },
// NEW: Form Builder - Drag & Drop Interface
  { path: 'builder', component: FormBuilderComponent },

 { path: 'forms', component: FormListComponent },
  { path: 'forms/new', component: FormBuilderComponent },
  { path: 'forms/:id/edit', component: FormBuilderComponent },
  { path: 'forms/:id/preview', component: FormBuilderComponent },

      { path: 'card', component: ListExterneCardComponent },

   { path: 'creelisteexterne', component: CreeListeExterneComponent },
      { path: 'listeexterne', component: ListexterneComponent },
 { path: 'external-lists/:id', component: ExternalListDetailComponent  }, // Voir détails
  { path: 'external-lists/:id/edit', component: CreeListeExterneComponent }, // Éditer
 {
    path: 'forms/:id/submissions',
    component: FormSubmissionsComponent  },
    {
    path: 'public/forms/:id',
    component: PublicFormComponent  },

   { path: 'bib', component: BibliothequeComponent },
{ path: 'forms/:id', component: LibraryFormDetailComponent },

  { path: 'forms/:id/submissions/:submissionId/detail', component: SubmissionDetailComponent },

     { path: 'history', component: FormHistoryComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})
export class AppRoutingModule { }
