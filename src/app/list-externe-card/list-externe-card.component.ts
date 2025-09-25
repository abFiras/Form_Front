import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelImportService, ExcelValidationResult, ExcelImportResponse } from '../service/excel-import.service';
import { AuthService } from '../service/auth.service';
import { ExcelImportDialogComponent } from '../excel-import-dialog/excel-import-dialog.component';

@Component({
  selector: 'app-list-externe-card',
  standalone: false,
  templateUrl: './list-externe-card.component.html',
  styleUrl: './list-externe-card.component.css'
})
export class ListExterneCardComponent {
  selectedFile: File | null = null;
  currentUserId: number = 0;
  isUploading = false;
  validationErrors: string[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private excelImportService: ExcelImportService,
    private authService: AuthService
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = Number(user.id);
        console.log('Current user ID:', this.currentUserId);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        this.showError('Erreur d\'authentification');
      }
    });
  }

  creelisteexterne() {
    this.router.navigate(['/creelisteexterne']);
  }

  /**
   * Déclenché quand l'utilisateur clique sur "Créer à partir d'un fichier Excel"
   */
  onExcelImportClick(): void {
    // Vérifier que l'utilisateur est connecté
    if (!this.currentUserId) {
      this.showError('Vous devez être connecté pour importer un fichier Excel');
      return;
    }

    // Créer un input file invisible pour déclencher la sélection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.handleFileSelection(file);
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  /**
   * Gère la sélection d'un fichier Excel
   */
  private handleFileSelection(file: File): void {
    console.log('Fichier sélectionné:', file.name);

    this.selectedFile = null;
    this.validationErrors = [];

    // Validation basique du fichier côté client
    if (!this.excelImportService.isValidExcelFile(file)) {
      this.showError('Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)');
      return;
    }

    if (!this.excelImportService.isValidFileSize(file, 5)) {
      this.showError('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    this.selectedFile = file;
    this.validateAndPreviewFile(file);
  }

  /**
   * Valide le fichier Excel et affiche un aperçu
   */
  private validateAndPreviewFile(file: File): void {
    console.log('Validation du fichier:', file.name);
    this.isUploading = true;

    this.excelImportService.validateExcelFile(file).subscribe({
      next: (validation: ExcelValidationResult) => {
        console.log('Résultat de validation:', validation);
        this.isUploading = false;

        if (!validation.valid) {
          this.validationErrors = validation.errors || [];
          this.showValidationErrors(validation.errors || []);
          return;
        }

        // Afficher les avertissements s'il y en a
        if (validation.warnings && validation.warnings.length > 0) {
          this.showWarnings(validation.warnings);
        }

        // Ouvrir la boîte de dialogue de création de liste
        this.openImportDialog(file, validation);
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Erreur lors de la validation du fichier:', error);

        // Gérer différents types d'erreurs
        let errorMessage = 'Erreur lors de la validation du fichier Excel';
        if (error.status === 400 && error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 413) {
          errorMessage = 'Le fichier est trop volumineux (max 5MB)';
        } else if (error.status === 415) {
          errorMessage = 'Format de fichier non supporté';
        }

        this.showError(errorMessage);
      }
    });
  }

  /**
   * Ouvre la boîte de dialogue pour configurer l'importation
   */
  private openImportDialog(file: File, validation: ExcelValidationResult): void {
    console.log('Ouverture du dialog avec validation:', validation);

    const dialogRef = this.dialog.open(ExcelImportDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        file: file,
        validation: validation,
        userId: this.currentUserId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog fermé avec résultat:', result);

      if (result && result.success) {
        this.showSuccess(`Liste "${result.listName}" créée avec succès !`);

        // Naviguer vers la nouvelle liste si on a l'ID
        if (result.listId) {
          this.router.navigate(['/external-lists', result.listId]);
        } else {
          // Sinon, rafraîchir la page courante ou naviguer vers la liste des listes
          this.router.navigate(['/external-lists']);
        }
      } else if (result && !result.success) {
        // Afficher les erreurs si l'importation a échoué
        const errorMsg = result.message || 'Erreur lors de l\'importation';
        this.showError(errorMsg);
      }

      // Nettoyer
      this.selectedFile = null;
      this.validationErrors = [];
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showWarnings(warnings: string[]): void {
    const warningMessage = `Avertissements: ${warnings.join(', ')}`;
    this.snackBar.open(warningMessage, 'Fermer', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }

  private showValidationErrors(errors: string[]): void {
    const errorMessage = errors.length > 0 ?
      `Erreurs de validation: ${errors.join(', ')}` :
      'Erreurs de validation détectées';
    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 6000,
      panelClass: ['error-snackbar']
    });
  }
}
