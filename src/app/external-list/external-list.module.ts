import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { ExternalListConfigComponent } from '../external-list-config/external-list-config.component';
import { ListexterneComponent } from '../listexterne/listexterne.component';
import { ExternalListFieldComponent } from '../external-list-field/external-list-field.component';

@NgModule({
  declarations: [
    ListexterneComponent,
    ExternalListConfigComponent,
    ExternalListFieldComponent  // ✅ Ajout du composant manquant
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // Angular Material
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatDividerModule
  ],
  exports: [
    ListexterneComponent,
    ExternalListConfigComponent,
    ExternalListFieldComponent  // ✅ Export du composant
  ]
})
export class ExternalListModule { }
