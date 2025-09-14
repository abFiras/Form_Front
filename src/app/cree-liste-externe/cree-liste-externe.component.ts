import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
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
  currentUserId: number = 1;

  // Variables pour la gestion de l'édition
  isEditMode = false;
  editingListId: number | null = null;
  currentList: ExternalListDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private externalListService: ExternalListService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
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
    // Détecter si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editingListId = +params['id'];
        this.loadListForEditing(this.editingListId);
      } else {
        this.isEditMode = false;
        this.addDefaultItems();
      }
    });

    this.loadMyLists();
    this.loadRubriques();

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

  // Charger une liste pour édition
  loadListForEditing(id: number): void {
    this.loading = true;
    this.externalListService.getExternalListById(id).subscribe({
      next: (list) => {
        this.currentList = list;
        this.populateFormForEditing(list);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la liste:', error);
        this.snackBar.open('Erreur lors du chargement de la liste', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
        this.router.navigate(['/creelisteexterne']);
      }
    });
  }

  // Remplir le formulaire avec les données existantes
  populateFormForEditing(list: ExternalListDTO): void {
    this.createListForm.patchValue({
      name: list.name,
      description: list.description || '',
      listType: list.listType,
      rubrique: list.rubrique || '',
      isAdvanced: list.isAdvanced || false,
      isFiltered: list.isFiltered || false
    });

    // Vider le FormArray existant
    while (this.itemsFormArray.length !== 0) {
      this.itemsFormArray.removeAt(0);
    }

    // Ajouter les items existants
    if (list.items && list.items.length > 0) {
      list.items.forEach(item => {
        this.addItem(item.label, item.value);
      });
    } else {
      this.addDefaultItems();
    }
  }

  get itemsFormArray(): FormArray {
    return this.createListForm.get('items') as FormArray;
  }

  addDefaultItems(): void {
    if (!this.isEditMode) {
      this.addItem('Option 1', 'option1');
      this.addItem('Option 2', 'option2');
    }
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

  // Gérer création ET mise à jour
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

      const operation$ = this.isEditMode
        ? this.externalListService.updateExternalList(this.editingListId!, request)
        : this.externalListService.createExternalList(request, this.currentUserId);

      const successMessage = this.isEditMode
        ? 'Liste externe mise à jour avec succès!'
        : 'Liste externe créée avec succès!';

      operation$.subscribe({
        next: (list) => {
          this.snackBar.open(successMessage, 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          if (this.isEditMode) {
            this.router.navigate(['/listeexterne']);
          } else {
            this.resetForm();
          }

          this.loadMyLists();
        },
        error: (error) => {
          console.error('Erreur lors de l\'opération:', error);
          const errorMessage = this.isEditMode
            ? 'Erreur lors de la mise à jour de la liste'
            : 'Erreur lors de la création de la liste';

          this.snackBar.open(errorMessage, 'Fermer', {
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
    this.router.navigate(['/external-lists', id, 'edit']);
  }

  viewListDetails(id: number): void {
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

    // Ajouter les items par défaut seulement en mode création
    if (!this.isEditMode) {
      this.addDefaultItems();
    }
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

  // Méthode pour annuler l'édition
  cancelEdit(): void {
    if (this.isEditMode) {
      this.router.navigate(['/creelisteexterne']);
    } else {
      this.resetForm();
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

  // Getter pour le titre de la page
  get pageTitle(): string {
    return this.isEditMode ? 'Modifier la liste externe' : 'Nouvelle liste externe';
  }

  // Getter pour le texte du bouton
  get submitButtonText(): string {
    if (this.loading) {
      return this.isEditMode ? 'Mise à jour...' : 'Création...';
    }
    return this.isEditMode ? 'Mettre à jour la liste' : 'Créer la liste';
  }
}
