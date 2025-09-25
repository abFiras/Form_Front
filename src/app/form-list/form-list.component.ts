// form-list.component.ts - Version avec navigation corrigée
import { Component, OnInit } from '@angular/core';
import { FormDTO, GroupDTO } from '../models/form.models';
import { FormService } from '../service/FormService';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../service/auth.service';
import { LibraryFormDTO } from '../service/library.service';

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
    currentUserId!: number;
  currentUserGroup?: GroupDTO; // ✅ AJOUT : Groupe de l'utilisateur connecté

  constructor(
    private formService: FormService,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,

  ) {}

  ngOnInit(): void {
       this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Current logged-in user:', user);
        this.currentUserId = user.id; // ✅ stocke l'ID utilisateur connecté
  this.currentUserGroup = user.group; // ✅ AJOUT : Stocker le groupe de l'utilisateur
        this.loadForms();
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      }
    });
  }



  // ✅ NOUVELLE MÉTHODE : Vérifier si l'utilisateur peut télécharger le formulaire
  canDownloadForm(form: FormDTO): boolean {
    // Si l'utilisateur est le créateur du formulaire, il peut toujours le télécharger
    if (form.createdBy === this.currentUserId) {
      return true;
    }

    // Si l'utilisateur n'a pas de groupe, il ne peut pas télécharger
    if (!this.currentUserGroup) {
      return false;
    }

    // Si le formulaire n'a pas de groupes assignés, accessible à tous
    if (!form.assignedGroupIds || form.assignedGroupIds.length === 0) {
      return true;
    }

    // Vérifier si l'utilisateur appartient à un des groupes assignés au formulaire
    return form.assignedGroupIds.includes(this.currentUserGroup.id);
  }

  // ✅ MÉTHODE MISE À JOUR : Télécharger le formulaire en Word avec vérification d'accès
  downloadFormAsWord(form: FormDTO): void {
    if (!this.validateFormId(form)) {
      return;
    }

    // ✅ Vérifier l'accès avant le téléchargement
    if (!this.canDownloadForm(form)) {
      const assignedGroups = this.getAssignedGroupNames(form);
      const message = assignedGroups.length > 0
        ? `Accès refusé. Ce formulaire est réservé aux groupes: ${assignedGroups.join(', ')}`
        : 'Vous n\'avez pas l\'autorisation de télécharger ce formulaire';

      this.snackBar.open(message, 'Fermer', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    console.log('Téléchargement Word du formulaire:', form.name);

    // ✅ MISE À JOUR : Passer l'ID utilisateur au service
    this.formService.downloadFormAsWord(form.id!, this.currentUserId).subscribe({
      next: (blob) => {
        // Créer un nom de fichier sécurisé
        const fileName = this.sanitizeFileName(form.name) + '_formulaire.docx';

        // Télécharger le fichier
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();

        // Nettoyer l'URL
        window.URL.revokeObjectURL(url);

        this.snackBar.open(`Formulaire "${form.name}" téléchargé en Word`, 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Erreur téléchargement Word:', error);

        // ✅ Messages d'erreur plus spécifiques
        let errorMessage = 'Erreur lors du téléchargement du formulaire';

        if (error.status === 403) {
          errorMessage = 'Accès refusé: vous n\'êtes pas autorisé à télécharger ce formulaire';
        } else if (error.status === 404) {
          errorMessage = 'Formulaire non trouvé';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de la génération du document';
        }

        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir le message d'accès pour le tooltip
  getDownloadAccessMessage(form: FormDTO): string {
    if (form.createdBy === this.currentUserId) {
      return 'Vous pouvez télécharger ce formulaire (vous êtes le créateur)';
    }

    if (!this.currentUserGroup) {
      return 'Vous devez appartenir à un groupe pour télécharger ce formulaire';
    }

    if (!form.assignedGroupIds || form.assignedGroupIds.length === 0) {
      return 'Formulaire accessible à tous - Téléchargement autorisé';
    }

    const canDownload = form.assignedGroupIds.includes(this.currentUserGroup.id);
    if (canDownload) {
      return `Téléchargement autorisé (votre groupe: ${this.currentUserGroup.name})`;
    } else {
      const assignedGroups = this.getAssignedGroupNames(form);
      return `Accès refusé - Réservé aux groupes: ${assignedGroups.join(', ')}`;
    }
  }


// ✅ MÉTHODE MISE À JOUR : canEdit avec logique similaire
  canEdit1(form: FormDTO): boolean {
    // Le créateur peut toujours éditer
    if (form.createdBy === this.currentUserId) {
      return true;
    }

    // Si l'utilisateur n'a pas de groupe, il ne peut pas éditer
    if (!this.currentUserGroup) {
      return false;
    }

    // Vérifier si l'utilisateur appartient à un des groupes assignés
    if (form.assignedGroupIds && form.assignedGroupIds.length > 0) {
      return form.assignedGroupIds.includes(this.currentUserGroup.id);
    }

    return false;
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir les informations d'accès pour l'affichage
  getFormAccessInfo(form: FormDTO): { canAccess: boolean, message: string, isCreator: boolean } {
    const isCreator = form.createdBy === this.currentUserId;

    if (isCreator) {
      return {
        canAccess: true,
        message: 'Créateur',
        isCreator: true
      };
    }

    if (!this.currentUserGroup) {
      return {
        canAccess: false,
        message: 'Aucun groupe assigné',
        isCreator: false
      };
    }

    if (!form.assignedGroupIds || form.assignedGroupIds.length === 0) {
      return {
        canAccess: true,
        message: 'Accessible à tous',
        isCreator: false
      };
    }

    const hasAccess = form.assignedGroupIds.includes(this.currentUserGroup.id);
    const assignedGroups = this.getAssignedGroupNames(form);

    return {
      canAccess: hasAccess,
      message: hasAccess
        ? `Votre groupe: ${this.currentUserGroup.name}`
        : `Groupes requis: ${assignedGroups.join(', ')}`,
      isCreator: false
    };
  }

  // ✅ MÉTHODE UTILITAIRE : Nettoyer le nom de fichier
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, '_') // Remplacer espaces par underscores
      .substring(0, 50); // Limiter la longueur
  }

  // ✅ MÉTHODE DE DEBUG : Afficher les informations d'accès
  debugFormAccess(form: FormDTO): void {
    console.log('=== DEBUG ACCÈS FORMULAIRE ===');
    console.log('Nom du formulaire:', form.name);
    console.log('Créé par:', form.createdBy);
    console.log('Utilisateur actuel:', this.currentUserId);
    console.log('Groupe utilisateur:', this.currentUserGroup);
    console.log('Groupes assignés au formulaire:', form.assignedGroupIds);
    console.log('Peut télécharger:', this.canDownloadForm(form));
    console.log('Peut éditer:', this.canEdit(form));
    console.log('Info d\'accès:', this.getFormAccessInfo(form));
    console.log('===============================');
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
  canEdit(form: FormDTO): boolean {
  return form.createdBy === this.currentUserId;
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

  /**
 * Partage un formulaire vers la bibliothèque
 */
shareToLibrary(form: FormDTO): void {
  if (!this.validateFormId(form) || !this.canEdit(form)) {
    return;
  }

  if (form.status !== 'PUBLISHED') {
    this.snackBar.open('Seuls les formulaires publiés peuvent être partagés', 'Fermer', {
      duration: 3000
    });
    return;
  }

  if (form.isInLibrary) {
    this.snackBar.open('Ce formulaire est déjà dans la bibliothèque', 'Fermer', {
      duration: 3000
    });
    return;
  }

  // Dialog pour demander la langue et les tags
  const dialogData = {
    title: 'Partager vers la bibliothèque',
    message: `Voulez-vous partager "${form.name}" dans la bibliothèque publique ?`,
    formName: form.name
  };

  // Ici vous pouvez ouvrir un dialog pour saisir langue et tags
  // Pour l'instant, utilisation de valeurs par défaut
  const shareRequest = {
    language: 'fr',
  tags: form.assignedGroups?.map(g => g.name).join(', ') || ''
  };

  this.formService.shareFormToLibrary(form.id!, shareRequest).subscribe({
    next: (response) => {
      this.snackBar.open('Formulaire partagé avec succès dans la bibliothèque!', 'Fermer', {
        duration: 4000,
        panelClass: ['success-snackbar']
      });

      // Marquer le formulaire comme étant dans la bibliothèque
      form.isInLibrary = true;
    },
    error: (error) => {
      console.error('Erreur partage vers bibliothèque:', error);
      let errorMessage = 'Erreur lors du partage vers la bibliothèque';

      if (error.error?.message) {
        errorMessage = error.error.message;
      }

      this.snackBar.open(errorMessage, 'Fermer', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    }
  });
}


}
