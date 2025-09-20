// form-list.component.ts - Version avec navigation corrigée
import { Component, OnInit } from '@angular/core';
import { FormDTO } from '../models/form.models';
import { FormService } from '../service/FormService';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-form-list',
  standalone: false,
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css']
})
export class FormListComponent implements OnInit {
  forms: FormDTO[] = [];
  loading = false;
  draftForms: FormDTO[] = [];
  publishedForms: FormDTO[] = [];
  searchTerm = '';
  constructor(
    private formService: FormService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading = true;
    this.formService.getAllForms().subscribe({
      next: (forms) => {
        this.forms = forms;
        this.updateFormCategories();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading forms:', error);
        this.snackBar.open('Erreur lors du chargement des formulaires', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private updateFormCategories(): void {
    this.draftForms = this.forms.filter(f => f.status === 'DRAFT' || f.status === null);
    this.publishedForms = this.forms.filter(f => f.status === 'PUBLISHED');
  }

  get filteredDraftForms(): FormDTO[] {
    return this.filterForms(this.draftForms);
  }

  get filteredPublishedForms(): FormDTO[] {
    return this.filterForms(this.publishedForms);
  }

  private filterForms(forms: FormDTO[]): FormDTO[] {
    if (!this.searchTerm.trim()) {
      return forms;
    }
    return forms.filter(form =>
      form.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // ✅ NAVIGATION SÉCURISÉE avec validation des IDs
  private validateFormId(form: FormDTO): boolean {
    if (!form || !form.id || isNaN(Number(form.id)) || form.id <= 0) {
      console.error('ID de formulaire invalide:', form);
      this.snackBar.open('Erreur: ID de formulaire invalide', 'Fermer', { duration: 3000 });
      return false;
    }
    return true;
  }

  createNewForm(): void {
    this.router.navigate(['/forms/new']);
  }

  editForm(id: number | undefined): void {
    if (!id || isNaN(Number(id)) || id <= 0) {
      console.error('ID invalide pour édition:', id);
      this.snackBar.open('Erreur: Impossible d\'éditer ce formulaire', 'Fermer', { duration: 3000 });
      return;
    }

    console.log('Navigation vers édition du formulaire ID:', id);
    this.router.navigate(['/forms', id, 'edit']);
  }

  previewForm(id: number | undefined): void {
    if (!id || isNaN(Number(id)) || id <= 0) {
      console.error('ID invalide pour aperçu:', id);
      this.snackBar.open('Erreur: Impossible de prévisualiser ce formulaire', 'Fermer', { duration: 3000 });
      return;
    }

    console.log('Navigation vers aperçu du formulaire ID:', id);
    this.router.navigate(['/forms', id, 'preview']);
  }

  // ✅ CORRECTION PRINCIPALE : Navigation sécurisée vers le remplissage
  fillForm(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    if (form.status !== 'PUBLISHED') {
      this.snackBar.open('Seuls les formulaires publiés peuvent être remplis', 'Fermer', { duration: 3000 });
      return;
    }

    // ✅ VALIDATION SUPPLÉMENTAIRE de l'accessibilité
    if (form.isAccessible === false) {
      const groupNames = this.getAssignedGroupNames(form);
      this.snackBar.open(
        `Accès refusé. Ce formulaire est réservé aux groupes: ${groupNames.join(', ')}`,
        'Fermer',
        { duration: 5000 }
      );
      return;
    }

    console.log('Navigation sécurisée vers remplissage du formulaire ID:', form.id);
    this.router.navigate(['/forms', form.id, 'fill']);
  }

  viewSubmissions(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    if (form.status !== 'PUBLISHED') {
      this.snackBar.open('Le formulaire doit être publié pour voir les soumissions', 'Fermer', { duration: 3000 });
      return;
    }

    console.log('Navigation vers soumissions du formulaire ID:', form.id);
    this.router.navigate(['/forms', form.id, 'submissions']);
  }

 goToPublishedForms(form: FormDTO): void {
  if (!this.validateFormId(form)) {
    return;
  }

  console.log('Navigation vers formulaire publié ID:', form.id);
  this.router.navigate(['/public/forms', form.id]);
}


  // ✅ COPIER L'URL PUBLIQUE avec validation
  copyPublicUrl(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    if (form.status !== 'PUBLISHED') {
      this.snackBar.open('Le formulaire doit être publié pour avoir une URL publique', 'Fermer', { duration: 3000 });
      return;
    }

    const publicUrl = this.formService.getPublicFormUrl(form.id!);

    if (!publicUrl) {
      this.snackBar.open('Erreur lors de la génération de l\'URL', 'Fermer', { duration: 3000 });
      return;
    }

    navigator.clipboard.writeText(publicUrl).then(() => {
      this.snackBar.open('URL publique copiée dans le presse-papier', 'Fermer', { duration: 2000 });
      console.log('URL copiée:', publicUrl);
    }).catch((error) => {
      console.error('Erreur copie URL:', error);
      this.snackBar.open('Erreur lors de la copie de l\'URL', 'Fermer', { duration: 3000 });
    });
  }

  duplicateForm(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    console.log('Navigation vers duplication du formulaire ID:', form.id);
    this.router.navigate(['/forms/new'], {
      queryParams: { duplicate: form.id }
    });
  }

  deleteForm(id: number | undefined): void {
    if (!id || isNaN(Number(id)) || id <= 0) {
      console.error('ID invalide pour suppression:', id);
      this.snackBar.open('Erreur: Impossible de supprimer ce formulaire', 'Fermer', { duration: 3000 });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ? Cette action est irréversible.')) {
      return;
    }

    console.log('Suppression du formulaire ID:', id);
    this.formService.deleteForm(id).subscribe({
      next: () => {
        this.snackBar.open('Formulaire supprimé avec succès', 'Fermer', { duration: 3000 });
        this.loadForms();
      },
      error: (error) => {
        console.error('Error deleting form:', error);
        this.snackBar.open('Erreur lors de la suppression du formulaire', 'Fermer', { duration: 3000 });
      }
    });
  }

  publishForm(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    console.log('Publication du formulaire ID:', form.id);
    this.formService.publishForm(form.id!).subscribe({
      next: () => {
        this.snackBar.open('Formulaire publié avec succès', 'Fermer', { duration: 3000 });
        this.loadForms();
      },
      error: (error) => {
        console.error('Error publishing form:', error);
        this.snackBar.open('Erreur lors de la publication du formulaire', 'Fermer', { duration: 3000 });
      }
    });
  }

  // ✅ MÉTHODES UTILITAIRES AMÉLIORÉES
  getFormFieldsCount(form: FormDTO): number {
    return form.fields?.length || 0;
  }

  getFormStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED': return '#4caf50';
      case 'DRAFT': return '#ff9800';
      default: return '#666';
    }
  }

  getFormStatusText(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'Publié';
      case 'DRAFT': return 'Brouillon';
      default: return status || 'Brouillon';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Date inconnue';
    }

    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  }

  getAssignedGroupNames(form: FormDTO): string[] {
    return form.assignedGroups?.map(group => group.name) || [];
  }

  getGroupAccessMessage(form: FormDTO): string {
    const groupNames = this.getAssignedGroupNames(form);
    if (groupNames.length === 0) {
      return 'Accessible à tous';
    } else if (groupNames.length === 1) {
      return `Groupe : ${groupNames[0]}`;
    } else {
      return `${groupNames.length} groupes`;
    }
  }

  onSearch(): void {
    // La recherche est automatique via les getters
    console.log('Recherche:', this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  // ✅ MÉTHODES DE DÉBOGAGE
  debugFormList(): void {
    console.log('État de FormListComponent:', {
      totalForms: this.forms.length,
      draftForms: this.draftForms.length,
      publishedForms: this.publishedForms.length,
      searchTerm: this.searchTerm,
      loading: this.loading
    });

    // Vérifier les IDs des formulaires
    this.forms.forEach(form => {
      console.log(`Formulaire: ${form.name} - ID: ${form.id} (${typeof form.id})`);
    });
  }
}
