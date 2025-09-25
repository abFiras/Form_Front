import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- correct
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AddformComponent } from './addform/addform.component';
import { UsersComponent } from './users/users.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FieldPaletteComponent } from './field-palette/field-palette.component';
import { DynamicFieldComponent } from './dynamic-field/dynamic-field.component';
import { FormListComponent } from './form-list/form-list.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AcceuilComponent } from './acceuil/acceuil.component';
import { MatSliderModule } from '@angular/material/slider';
import { CreeListeExterneComponent } from './cree-liste-externe/cree-liste-externe.component';
import { BibliothequeComponent } from './bibliotheque/bibliotheque.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { LibraryFormDetailComponent } from './library-form-detail/library-form-detail.component';
import { ListexterneComponent } from './listexterne/listexterne.component';
import { ExternalListConfigComponent } from './external-list-config/external-list-config.component';
import { ExternalListModule } from './external-list/external-list.module';
import { ExternalListFieldComponent } from './external-list-field/external-list-field.component';
import { ListExterneCardComponent } from './list-externe-card/list-externe-card.component';
import { MatColumnDef, MatTableModule } from '@angular/material/table';
import { ExternalListDetailComponent } from './external-list-detail/external-list-detail.component';
import { PublicFormComponent } from './public-form/public-form.component';
import { FormSubmissionsComponent } from './form-submissions/form-submissions.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormFillComponent } from './form-fill/form-fill.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthInterceptor } from './service/auth-interceptor.service';
import { SubmissionDetailComponent } from './submission-detail/submission-detail.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExcelImportDialogComponent } from './excel-import-dialog/excel-import-dialog.component';
import { FormHistoryComponent } from './form-history/form-history.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    LoginComponent,
    NavbarComponent,
    SidebarComponent,
    AddformComponent,
    UsersComponent,
    UserProfileComponent,
    ResetPasswordComponent,
    FormBuilderComponent,
    FieldPaletteComponent,
    DynamicFieldComponent,
    FormListComponent,
    AcceuilComponent,
    CreeListeExterneComponent,
    BibliothequeComponent,
    LibraryFormDetailComponent,
    ListExterneCardComponent,
    ExternalListDetailComponent,
    PublicFormComponent,
    FormSubmissionsComponent,
    FormFillComponent,
    SubmissionDetailComponent,
    ExcelImportDialogComponent,
    FormHistoryComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
     CommonModule,
    ReactiveFormsModule,
     DragDropModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSliderModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    ExternalListModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatTooltipModule



  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
    bootstrap: [AppComponent]
})
export class AppModule { }
