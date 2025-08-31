import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  ExternalListService,
  ExternalListDTO,
  CreateExternalListRequest,
  ExternalListItemDTO
} from '../service/external-list.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-cree-liste-externe',
  standalone: false,
  templateUrl: './cree-liste-externe.component.html',
  styleUrls: ['./cree-liste-externe.component.css']
})
export class CreeListeExterneComponent implements OnInit {
  createListForm: FormGroup;
  importForm: FormGroup;
  myLists: ExternalListDTO[] = [];
  rubriques: string[] = [];
  selectedFile: File | null = null;
  showImportSection = false;
  loading = false;
  currentUserId: number = 1; // À récupérer depuis le service d'authentification

  constructor(
    private fb: FormBuilder,
    private externalListService: ExternalListService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.createListForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      listType: ['STATIC', Validators.required],
      rubrique: [''],
      isAdvanced: [false],
      isFiltered: [false],
      items: this.fb.array([])
    });

    this.importForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      rubrique: [''],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMyLists();
    this.loadRubriques();
    this.addDefaultItems();

    // Récupérer l'utilisateur actuel
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = Number(user.id);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });
  }

  get itemsFormArray(): FormArray {
    return this.createListForm.get('items') as FormArray;
  }

  addDefaultItems(): void {
    this.addItem('Option 1', 'option1');
    this.addItem('Option 2', 'option2');
  }

  addItem(label: string = '', value: string = ''): void {
    const itemForm = this.fb.group({
      label: [label, Validators.required],
      value: [value, Validators.required],
      displayOrder: [this.itemsFormArray.length],
      isActive: [true]
    });

    this.itemsFormArray.push(itemForm);
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    // Réorganiser les ordres d'affichage
    this.itemsFormArray.controls.forEach((control, i) => {
      control.get('displayOrder')?.setValue(i);
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.importForm.patchValue({ file: file });
    } else {
      this.snackBar.open('Veuillez sélectionner un fichier CSV valide', 'Fermer', {
        duration: 3000
      });
    }
  }

  createList(): void {
    if (this.createListForm.valid) {
      this.loading = true;

      const formValue = this.createListForm.value;
      const request: CreateExternalListRequest = {
        name: formValue.name,
        description: formValue.description,
        listType: formValue.listType,
        rubrique: formValue.rubrique,
        isAdvanced: formValue.isAdvanced,
        isFiltered: formValue.isFiltered,
        items: formValue.items.map((item: any, index: number) => ({
          label: item.label,
          value: item.value,
          displayOrder: index,
          isActive: true
        }))
      };

      this.externalListService.createExternalList(request, this.currentUserId).subscribe({
        next: (list) => {
          this.snackBar.open('Liste externe créée avec succès!', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.resetForm();
          this.loadMyLists();
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.snackBar.open('Erreur lors de la création de la liste', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.createListForm);
    }
  }

  importList(): void {
    if (this.importForm.valid && this.selectedFile) {
      this.loading = true;

      const formValue = this.importForm.value;

      this.externalListService.importFromCSV(
        this.selectedFile,
        formValue.name,
        formValue.description || '',
        formValue.rubrique || '',
        this.currentUserId
      ).subscribe({
        next: (list) => {
          this.snackBar.open(`Liste "${list.name}" importée avec succès! (${list.itemCount} éléments)`, 'Fermer', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.resetImportForm();
          this.loadMyLists();
        },
        error: (error) => {
          console.error('Erreur lors de l\'importation:', error);
          this.snackBar.open('Erreur lors de l\'importation du fichier CSV', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.importForm);
    }
  }

  deleteList(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste externe?')) {
      this.externalListService.deleteExternalList(id).subscribe({
        next: () => {
          this.snackBar.open('Liste supprimée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadMyLists();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  editList(id: number): void {
    // Navigation vers une page d'édition ou ouverture d'un dialog
    this.router.navigate(['/external-lists', id, 'edit']);
  }

  viewListDetails(id: number): void {
    // Afficher les détails de la liste
    this.router.navigate(['/external-lists', id]);
  }

  loadMyLists(): void {
    this.externalListService.getExternalListsByUser(this.currentUserId).subscribe({
      next: (lists) => {
        this.myLists = lists;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des listes:', error);
      }
    });
  }

  loadRubriques(): void {
    this.externalListService.getAllRubriques().subscribe({
      next: (rubriques) => {
        this.rubriques = rubriques;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rubriques:', error);
      }
    });
  }

  resetForm(): void {
    this.createListForm.reset({
      listType: 'STATIC',
      isAdvanced: false,
      isFiltered: false
    });

    // Vider le FormArray des items
    while (this.itemsFormArray.length !== 0) {
      this.itemsFormArray.removeAt(0);
    }

    // Ajouter les items par défaut
    this.addDefaultItems();
  }

  resetImportForm(): void {
    this.importForm.reset();
    this.selectedFile = null;
    this.showImportSection = false;
  }

  toggleImportSection(): void {
    this.showImportSection = !this.showImportSection;
    if (!this.showImportSection) {
      this.resetImportForm();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

getErrorMessage(fieldName: string, formGroup?: AbstractControl): string {
  const group = (formGroup as FormGroup) || this.createListForm;
  const control = group.get(fieldName);

  if (control?.hasError('required')) {
    return 'Ce champ est requis';
  }
  if (control?.hasError('minlength')) {
    return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
  }

  return '';
}


  // Méthodes utilitaires pour le template
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getListTypeLabel(type: string): string {
    switch (type) {
      case 'STATIC': return 'Statique';
      case 'DYNAMIC': return 'Dynamique';
      default: return type;
    }
  }
}
