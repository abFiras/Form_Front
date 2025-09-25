import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ExcelImportService, ExcelValidationResult } from '../service/excel-import.service';
import { ExternalListService } from '../service/external-list.service';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

interface DialogData {
  file: File;
  validation: ExcelValidationResult;
  userId: number;
}

@Component({
  selector: 'app-excel-import-dialog',
  template: `
    <div class="import-dialog">
      <h2 mat-dialog-title>Créer une liste à partir d'Excel</h2>

      <div mat-dialog-content class="dialog-content">
        <!-- Informations du fichier -->
        <div class="file-info">
          <mat-icon class="file-icon">description</mat-icon>
          <div class="file-details">
            <h4>{{ data.file.name }}</h4>
            <p class="file-size">{{ getFileSize() }}</p>
            <p class="file-rows" *ngIf="data.validation.totalRows">
              {{ data.validation.totalRows }} lignes détectées
            </p>
          </div>
        </div>

        <!-- Aperçu des données -->
        <div class="preview-section" *ngIf="data.validation.previewData && data.validation.previewData.length > 0">
          <h4>Aperçu des données (5 premières lignes)</h4>
          <div class="preview-table">
            <table>
              <thead>
                <tr>
                  <th *ngFor="let header of getPreviewHeaders()">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of data.validation.previewData.slice(0, 5)">
                  <td *ngFor="let cell of getRowValues(row)">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Formulaire de configuration -->
        <form [formGroup]="importForm" class="import-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom de la liste *</mat-label>
            <input matInput formControlName="listName" placeholder="Entrez le nom de la liste">
            <mat-error *ngIf="importForm.get('listName')?.hasError('required')">
              Le nom de la liste est requis
            </mat-error>
            <mat-error *ngIf="importForm.get('listName')?.hasError('listExists')">
              Une liste avec ce nom existe déjà
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (optionnelle)</mat-label>
            <textarea matInput formControlName="description" rows="3"
                     placeholder="Description de la liste"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Rubrique</mat-label>
            <mat-select formControlName="rubrique">
              <mat-option value="">Aucune rubrique</mat-option>
              <mat-option *ngFor="let rubrique of rubriques" [value]="rubrique">
                {{ rubrique }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </form>

        <!-- Avertissements -->
  <div class="validation-errors" *ngIf="data.validation.errors && data.validation.errors.length > 0">
  <mat-icon class="error-icon">error</mat-icon>
  <div class="error-content">
    <h4>Erreurs de structure du fichier Excel :</h4>
    <div class="error-list">
      <div *ngFor="let error of data.validation.errors" class="error-item">
        <mat-icon class="small-error-icon">cancel</mat-icon>
        <span>{{ error }}</span>
      </div>
    </div>
    <div class="help-text">
      <strong>Structure attendue :</strong>
      <ol>
        <li>Ligne 1 : En-têtes de configuration (Nom de la liste, Rubrique, Nombre d'éléments, Type, etc.)</li>
        <li>Ligne 2 : Données de configuration</li>
        <li>Ligne 3 : Vide (optionnelle)</li>
        <li>Ligne 4 : En-têtes des éléments (#, Libellé, Valeur, Statut)</li>
        <li>Lignes 5+ : Données des éléments</li>
      </ol>
    </div>
  </div>
</div>

<!-- Messages d'avertissement -->
<div class="warnings" *ngIf="data.validation.warnings && data.validation.warnings.length > 0">
  <mat-icon class="warning-icon">warning</mat-icon>
  <div class="warning-content">
    <h4>Avertissements :</h4>
    <div class="warning-list">
      <div *ngFor="let warning of data.validation.warnings" class="warning-item">
        <mat-icon class="small-warning-icon">info</mat-icon>
        <span>{{ warning }}</span>
      </div>
    </div>
  </div>
</div>

<!-- Récapitulatif de validation -->
<div class="validation-summary" *ngIf="data.validation.valid">
  <mat-icon class="success-icon">check_circle</mat-icon>
  <div class="success-content">
    <h4>Fichier Excel valide !</h4>
    <div class="summary-stats">
      <span class="stat">{{ getValidElementsCount() }} éléments détectés</span>
      <span class="stat" *ngIf="data.validation.totalRows">{{ data.validation.totalRows }} lignes au total</span>
    </div>
  </div>
</div>
 <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" [disabled]="isImporting">
          Annuler
        </button>
  <button mat-raised-button color="primary"
        [disabled]="!canImport()"
        (click)="onImport()"
        [class.pulse-disabled]="!data.validation.valid">
  <mat-spinner diameter="20" *ngIf="isImporting"></mat-spinner>
  <span *ngIf="!isImporting && data.validation.valid">Créer la liste</span>
  <span *ngIf="!isImporting && !data.validation.valid">Fichier non valide</span>
  <span *ngIf="isImporting">Importation en cours...</span>
</button>
      </div>
    </div>
  `,
  standalone: false,
  styles: [`
  .validation-errors {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 8px;
  margin: 16px 0;
}

.validation-errors .error-icon {
  color: #f44336;
  flex-shrink: 0;
  font-size: 24px;
}

.error-content h4 {
  margin: 0 0 12px 0;
  color: #d32f2f;
  font-weight: 600;
}

.error-list {
  margin-bottom: 16px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

.small-error-icon {
  color: #f44336;
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.help-text {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #f44336;
  font-size: 13px;
}

.help-text strong {
  color: #d32f2f;
}

.help-text ol {
  margin: 8px 0 0 16px;
  padding: 0;
}

.help-text li {
  margin-bottom: 4px;
  color: #666;
}

.warning-list {
  margin-bottom: 12px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding: 6px 10px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 4px;
}

.small-warning-icon {
  color: #ff9800;
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.validation-summary {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #e8f5e8;
  border: 2px solid #4caf50;
  border-radius: 8px;
  margin: 16px 0;
}

.success-icon {
  color: #4caf50;
  flex-shrink: 0;
  font-size: 24px;
}

.success-content h4 {
  margin: 0 0 8px 0;
  color: #2e7d32;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #2e7d32;
  font-weight: 500;
}
    .import-dialog {
      min-width: 500px;
      max-width: 800px;
    }

    .dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 0 24px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .file-icon {
      font-size: 24px;
      color: #4CAF50;
    }

    .file-details h4 {
      margin: 0;
      font-weight: 500;
    }

    .file-size, .file-rows {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 12px;
    }

    .preview-section {
      margin: 16px 0;
    }

    .preview-section h4 {
      margin-bottom: 8px;
      color: #333;
    }

    .preview-table {
      max-height: 200px;
      overflow: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .preview-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .preview-table th,
    .preview-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
      font-size: 12px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preview-table th {
      background: #f9f9f9;
      font-weight: 500;
      position: sticky;
      top: 0;
    }

    .import-form {
      margin: 16px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .warnings {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      margin-top: 16px;
    }

    .warning-icon {
      color: #f39c12;
      flex-shrink: 0;
    }

    .error-messages {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin-top: 16px;
    }

    .error-icon {
      color: #dc3545;
      flex-shrink: 0;
    }

    .warning-content h4,
    .error-content h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
    }

    .warning-content ul,
    .error-content ul {
      margin: 0;
      padding-left: 16px;
    }

    .warning-content li,
    .error-content li {
      font-size: 12px;
      color: #666;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class ExcelImportDialogComponent implements OnInit {
  importForm: FormGroup;
  rubriques: string[] = [];
  isImporting = false;
  importErrors: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ExcelImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private excelImportService: ExcelImportService,
    private externalListService: ExternalListService
  ) {
    this.importForm = this.fb.group({
      listName: [this.getDefaultListName(), [Validators.required], [this.listNameAsyncValidator.bind(this)]],
      description: [''],
      rubrique: ['']
    });

    console.log('Dialog data:', this.data);
  }

  ngOnInit(): void {
    this.loadRubriques();
  }

  private loadRubriques(): void {
    this.externalListService.getAllRubriques().subscribe({
      next: (rubriques) => {
        this.rubriques = rubriques;
        console.log('Rubriques chargées:', rubriques);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rubriques:', error);
      }
    });
  }

  private getDefaultListName(): string {
    const fileName = this.data.file.name;
    return fileName.replace(/\.(xlsx|xls)$/i, '');
  }

  getFileSize(): string {
    const bytes = this.data.file.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getPreviewHeaders(): string[] {
    if (!this.data.validation.previewData || this.data.validation.previewData.length === 0) {
      return this.data.validation.headers || [];
    }
    return Object.keys(this.data.validation.previewData[0]);
  }

  getRowValues(row: any): string[] {
    return Object.values(row).map(value => String(value || ''));
  }

  // Validateur asynchrone pour vérifier l'existence du nom de liste
  private listNameAsyncValidator(control: AbstractControl): Observable<{[key: string]: any} | null> {
    if (!control.value || control.value.length < 2) {
      return of(null);
    }

    return of(control.value).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value =>
        this.excelImportService.checkExistingList(value, this.data.userId).pipe(
          map(result => result?.exists ? { listExists: true } : null),
          catchError(() => of(null))
        )
      )
    );
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onImport(): void {

    if (!this.canImport()) {
      console.log('Import impossible:', {
        validFile: this.data.validation.valid,
        validForm: this.importForm.valid,
        elementsCount: this.getValidElementsCount(),
        isImporting: this.isImporting
      });

      if (!this.data.validation.valid) {
        // Scrolling vers les erreurs pour les rendre visibles
        setTimeout(() => {
          const errorElement = document.querySelector('.validation-errors');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }

      return;
    }

    if (!this.importForm.valid) {
      console.log('Formulaire invalide:', this.importForm.errors);
      return;
    }

    this.isImporting = true;
    this.importErrors = [];
    const formValue = this.importForm.value;

    console.log('Démarrage de l\'importation avec:', {
      file: this.data.file.name,
      listName: formValue.listName,
      description: formValue.description,
      rubrique: formValue.rubrique,
      userId: this.data.userId
    });

    this.excelImportService.importFromExcel(
      this.data.file,
      formValue.listName,
      formValue.description || '',
      formValue.rubrique || '',
      this.data.userId
    ).subscribe({
      next: (response) => {
        console.log('Réponse d\'importation:', response);
        this.isImporting = false;

        if (response.success) {
          this.dialogRef.close({
            success: true,
            listName: formValue.listName,
            listId: response.data?.id,
            message: response.message
          });
        } else {
          // Afficher les erreurs de l'importation
          this.importErrors = response.errors || [response.message || 'Erreur inconnue'];
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'importation Excel:', error);
        this.isImporting = false;

        // Gérer les différents types d'erreurs
        if (error.status === 400 && error.error?.message) {
          this.importErrors = [error.error.message];
        } else if (error.error?.errors) {
          this.importErrors = error.error.errors;
        } else {
          this.importErrors = ['Erreur lors de l\'importation du fichier Excel'];
        }
      }
    });
  }

   getValidElementsCount(): number {
    if (!this.data.validation.previewData) {
      return 0;
    }
    return this.data.validation.previewData.length;
  }

  /**
   * Vérifie si le fichier peut être importé
   */
  canImport(): boolean {
    return this.data.validation.valid &&
           this.importForm.valid &&
           !this.isImporting &&
           this.getValidElementsCount() > 0;
  }

  /**
   * Retourne un message d'aide contextualisé selon les erreurs
   */
  getContextualHelpMessage(): string {
    if (!this.data.validation.errors || this.data.validation.errors.length === 0) {
      return '';
    }

    const errors = this.data.validation.errors;

    if (errors.some(e => e.includes('En-tête de configuration manquant'))) {
      return 'Assurez-vous que la première ligne contient les colonnes : "Nom de la liste", "Nombre d\'éléments", "Type"';
    }

    if (errors.some(e => e.includes('Section des éléments non trouvée'))) {
      return 'Ajoutez une ligne avec "#" en colonne A et "Libellé" en colonne B pour marquer le début des éléments';
    }

    if (errors.some(e => e.includes('Aucun élément valide'))) {
      return 'Ajoutez au moins un élément avec un libellé non vide dans la colonne "Libellé"';
    }

    return 'Vérifiez la structure de votre fichier Excel selon le modèle fourni';
  }

}
