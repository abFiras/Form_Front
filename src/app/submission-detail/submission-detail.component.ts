import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormDTO, FormFieldDTO, FormSubmissionResponseDTO } from '../models/form.models';
import { ExternalListItemDTO, ExternalListService } from '../service/external-list.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-submission-detail',
  standalone: false,
  templateUrl: './submission-detail.component.html',
  styleUrls: ['./submission-detail.component.css']
})
export class SubmissionDetailComponent implements OnInit {
  formId!: number;
  submissionId!: number;
  currentForm?: FormDTO;
  submission?: FormSubmissionResponseDTO;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private snackBar: MatSnackBar,
      private externalListService: ExternalListService // ← Ajouter cette ligne

  ) {}

  ngOnInit(): void {
    // Récupérer les paramètres de route
    this.route.params.subscribe(params => {
      this.formId = +params['id'];
      this.submissionId = +params['submissionId'];

      // Vérifier si les données sont passées via state
      const navigationState = this.router.getCurrentNavigation()?.extras?.state;
      if (navigationState?.['submissionData'] && navigationState?.['formData']) {
        this.submission = navigationState['submissionData'];
        this.currentForm = navigationState['formData'];
      } else {
        // Charger les données depuis l'API si pas dans state
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;

    // Charger le formulaire et les soumissions
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.currentForm = form;
        this.loadSubmission();
      },
      error: (error) => {
        console.error('Erreur chargement formulaire:', error);
        this.snackBar.open('Erreur lors du chargement du formulaire', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadSubmission(): void {
    this.formService.getFormSubmissions(this.formId).subscribe({
      next: (submissions) => {
        this.submission = submissions.find(s => s.id === this.submissionId);
        if (!this.submission) {
          this.snackBar.open('Soumission non trouvée', 'Fermer', { duration: 3000 });
          this.goBack();
        }else{
                    this.loadExternalListLabels();

        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement soumissions:', error);
        this.snackBar.open('Erreur lors du chargement de la soumission', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  // Obtenir le label d'un champ
  getFieldLabel(fieldName: string): string {
    if (!this.currentForm) return fieldName;

    const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
    return field ? field.label : this.formatFieldName(fieldName);
  }

  // Obtenir le type d'un champ
  getFieldType(fieldName: string): string {
    if (!this.currentForm) return '';

    const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
    return field ? field.type : '';
  }

  // Formater le nom de champ
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

// Vérifier si c'est un champ d'objet complexe (signature, drawing, etc.)
isComplexObjectField(fieldName: string): boolean {
  if (!this.submission?.data) return false;

  const value = this.submission.data[fieldName];
  return value && typeof value === 'object' && !Array.isArray(value) && value.type;
}

// Obtenir l'URL d'une signature ou d'un dessin
getImageUrl(fieldName: string): string {
  if (!this.submission?.data) return '';

  const fieldData = this.submission.data[fieldName];
  if (fieldData && typeof fieldData === 'object' && fieldData.url) {
    // Construire l'URL complète si c'est un chemin relatif
    const url = fieldData.url;
    if (url.startsWith('/')) {
      // Remplacez par votre URL de base du serveur
      return `http://localhost:8080${url}`;
    }
    return url;
  }
  return '';
}

// Vérifier si c'est un champ de type table
isTableField(fieldName: string): boolean {
  const fieldType = this.getFieldType(fieldName);
  return fieldType === 'table';
}

// Obtenir les données de table
getTableData(fieldName: string): any {
  if (!this.submission?.data || !this.currentForm) return null;

  const field = this.currentForm.fields.find(f => f.fieldName === fieldName);

  if (field && field.attributes && field.attributes['rows']) {
    return {
      columns: field.attributes['columns'] || [],
      rows: field.attributes['rows'] || []
    };
  }
  return null;
}

// Vérifier si c'est un champ image fixe
isStaticImageField(fieldName: string): boolean {
  const fieldType = this.getFieldType(fieldName);
  return fieldType === 'image';
}
  private externalListLabels: Map<string, Map<string, string>> = new Map();
  private externalListsLoaded = false;
// Méthode mise à jour pour formater les valeurs
  // Version moderne avec async/await et firstValueFrom
  private async loadExternalListLabels(): Promise<void> {
    if (!this.currentForm?.fields || !this.submission?.data || this.externalListsLoaded) {
      return;
    }

    // Identifier tous les champs external-list
    const externalListFields = this.currentForm.fields.filter(
      field => field.type === 'external-list' && field.externalListId
    );

    if (externalListFields.length === 0) {
      return;
    }

    console.log('Loading external list labels for fields:', externalListFields.map(f => f.fieldName));

    // Charger les options pour chaque liste externe
    for (const field of externalListFields) {
      try {
        console.log(`Loading options for external list ID: ${field.externalListId}`);

        // Utiliser firstValueFrom au lieu de toPromise()
        const options = await firstValueFrom(
          this.externalListService.getListItems(field.externalListId!)
        );

        if (options && Array.isArray(options)) {
          const labelMap = new Map<string, string>();

          options.forEach((option: ExternalListItemDTO) => {
            // Créer un mapping value -> label
            if (option.value !== undefined && option.label) {
              labelMap.set(option.value.toString(), option.label);
            }
          });

          this.externalListLabels.set(field.fieldName, labelMap);
          console.log(`Loaded labels for external list ${field.fieldName}:`,
                     Array.from(labelMap.entries()));
        }
      } catch (error) {
        console.error(`Error loading external list options for ${field.fieldName}:`, error);
        // Continuer avec les autres listes même si une échoue
      }
    }

    this.externalListsLoaded = true;
  }

  // ✅ MÉTHODE CORRIGÉE : Formater les valeurs avec support des listes externes
formatFieldValue(fieldName: string, value: any): string {
    if (value === null || value === undefined) return 'Non renseigné';

    const fieldType = this.getFieldType(fieldName);
  if (fieldType === 'image') {
    if (this.hasStaticImage(fieldName)) {
      const field = this.currentForm?.fields?.find(f => f.fieldName === fieldName);
      const fileName = field?.attributes?.['fileName'] || 'image';
      return `Image configurée: ${fileName}`;
    } else {
      return 'Aucune image configurée pour ce champ';
    }
  }
    // TRAITEMENT SPÉCIAL POUR LES LISTES EXTERNES
    if (fieldType === 'external-list') {
      const labelMap = this.externalListLabels.get(fieldName);
      if (labelMap && labelMap.has(value.toString())) {
        const label = labelMap.get(value.toString());
        return `${label}`;
      }
      // Fallback si le label n'est pas encore chargé ou pas trouvé
      return `Valeur: ${value} (chargement des labels...)`;
    }

    // Traitement spécial pour les objets complexes (signature, drawing, file)
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.type && ['signature', 'drawing', 'file'].includes(value.type)) {
        if (value.url) {
          return `Fichier enregistré (${value.type})`;
        }
      }
    }

    switch (fieldType) {
      case 'checkbox':
        return value ? 'Oui' : 'Non';

      case 'date':
        try {
          return new Date(value).toLocaleDateString('fr-FR');
        } catch {
          return value.toString();
        }

      case 'datetime':
        try {
          return new Date(value).toLocaleString('fr-FR');
        } catch {
          return value.toString();
        }

      case 'number':
      case 'slider':
        return Number(value).toLocaleString('fr-FR');

      case 'multiselect':
        if (Array.isArray(value)) {
          // Pour multiselect avec liste externe, essayer de récupérer les labels
          const labelMap = this.externalListLabels.get(fieldName);
          if (labelMap) {
            const labels = value.map(v => labelMap.get(v.toString()) || v).join(', ');
            return labels;
          }
          return value.join(', ');
        }
        return value.toString();

      case 'geolocation':
        if (typeof value === 'object' && value?.latitude && value?.longitude) {
          return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
        }
        return 'Position non disponible';

      case 'table':
        return 'Données de tableau (voir ci-dessous)';

      case 'image':
        return 'Image statique du formulaire';

      default:
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return value.toString();
    }
  }

  // Nouvelle méthode : Obtenir le label d'une valeur de liste externe
  getExternalListLabel(fieldName: string, value: string): string {
    const labelMap = this.externalListLabels.get(fieldName);
    if (labelMap && labelMap.has(value)) {
      return labelMap.get(value) || value;
    }
    return value;
  }

  // Méthode utilitaire : Vérifier si un champ est une liste externe
  isExternalListField(fieldName: string): boolean {
    const fieldType = this.getFieldType(fieldName);
    return fieldType === 'external-list';
  }


  // Vérifier si c'est un champ fichier/image
  isFileField(fieldName: string): boolean {
  const fieldType = this.getFieldType(fieldName);
  const isFileType = ['file', 'attachment'].includes(fieldType);

  // Vérifier aussi si c'est un objet avec type file
  if (this.submission?.data) {
    const value = this.submission.data[fieldName];
    if (typeof value === 'object' && value?.type === 'file') {
      return true;
    }
  }

  return isFileType;
}

// Mise à jour de la méthode isImageField
isImageField(fieldName: string): boolean {
  const fieldType = this.getFieldType(fieldName);
  const isImageType = ['signature', 'drawing'].includes(fieldType);

  // Vérifier aussi si c'est un objet avec type signature/drawing
  if (this.submission?.data) {
    const value = this.submission.data[fieldName];
    if (typeof value === 'object' && ['signature', 'drawing'].includes(value?.type)) {
      return true;
    }
  }

  return isImageType;
}
getFileInfo(fieldName: string): {url: string, type: string, size?: string} | null {
  if (!this.submission?.data) return null;

  const value = this.submission.data[fieldName];
  if (typeof value === 'object' && value.url) {
    return {
      url: value.url.startsWith('/') ? `http://localhost:8080${value.url}` : value.url,
      type: value.type || 'file',
      size: value.originalSize ? this.formatFileSize(value.originalSize) : undefined
    };
  }

  return null;
}

// Formater la taille de fichier
private formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

  // Obtenir les champs avec leurs valeurs
  getFormattedFieldsData(): { fieldName: string; label: string; value: any; type: string }[] {
    if (!this.submission?.data || !this.currentForm?.fields) return [];

    const fieldsData: { fieldName: string; label: string; value: any; type: string }[] = [];

    // Parcourir les champs du formulaire dans l'ordre
    this.currentForm.fields.forEach(field => {
      const value = this.submission!.data[field.fieldName];

      // Inclure même les champs vides pour maintenir la structure
      fieldsData.push({
        fieldName: field.fieldName,
        label: field.label,
        value: value,
        type: field.type
      });
    });

    return fieldsData;
  }

  // Obtenir les métadonnées de soumission
  getSubmissionMetadata(): { [key: string]: any } {
    if (!this.submission?.data) return {};

    const metadata: { [key: string]: any } = {};

    Object.keys(this.submission.data).forEach(key => {
      if (key.startsWith('_')) {
        metadata[key] = this.submission!.data[key];
      }
    });

    return metadata;
  }

  // Formater les métadonnées pour l'affichage
  formatMetadata(key: string, value: any): string {
    switch (key) {
      case '_submission_metadata':
        if (typeof value === 'object') {
          return `Soumis le ${new Date(value.submittedAt).toLocaleString('fr-FR')}`;
        }
        break;
      case '_submissionTimestamp':
        return `Horodatage: ${new Date(value).toLocaleString('fr-FR')}`;
      case '_clientUrl':
        return `URL client: ${value}`;
      default:
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return value.toString();
    }
    return value.toString();
  }

  // Obtenir le nom d'affichage du soumetteur
  getSubmitterDisplay(): string {
    if (!this.submission) return 'Inconnu';

    if (this.submission.submitterName) {
      return this.submission.submitterName;
    }
    if (this.submission.submitterEmail) {
      return this.submission.submitterEmail;
    }
    return 'Utilisateur anonyme';
  }

  // Obtenir la couleur du statut
  getStatusColor(status?: string): string {
    if (!status) return '';

    switch (status) {
      case 'SUBMITTED': return 'primary';
      case 'REVIEWED': return 'accent';
      case 'APPROVED': return 'primary';
      case 'REJECTED': return 'warn';
      default: return '';
    }
  }

  // Obtenir le label du statut
  getStatusLabel(status?: string): string {
    if (!status) return 'Inconnu';

    switch (status) {
      case 'SUBMITTED': return 'Soumis';
      case 'REVIEWED': return 'Examiné';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  }
  // Méthode corrigée pour obtenir l'URL d'une image fixe
// Méthode pour obtenir l'URL d'une image fixe
getStaticImageUrl(fieldName: string): string {
  if (!this.currentForm) return '';

  const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
  if (!field || field.type !== 'image') return '';

  // Vérifier dans les attributs du champ
  if (field.attributes && field.attributes['imageUrl']) {
    return field.attributes['imageUrl'];
  }

  return '';
}

// Méthode pour vérifier si l'image fixe existe
hasStaticImage(fieldName: string): boolean {
  return this.getStaticImageUrl(fieldName) !== '';
}
getFieldFileName(fieldName: string): string {
  const field = this.getCurrentForm()?.fields?.find(f => f.fieldName === fieldName);
  return field?.attributes?.['fileName'] ?? 'image';
}
// Méthode pour obtenir le formulaire actuel (éviter les erreurs de référence)
getCurrentForm(): FormDTO | undefined {
  return this.currentForm;
}
// Méthode pour obtenir le texte alternatif de l'image
getStaticImageAlt(fieldName: string): string {
  if (!this.currentForm) return '';

  const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
  if (!field || field.type !== 'image') return '';

  if (field.attributes && field.attributes['imageAlt']) {
    return field.attributes['imageAlt'];
  }

  return field.label || 'Image';
}

  // Calculer le temps écoulé
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays} jour(s)`;
  }

  // Télécharger la soumission en PDF
  downloadAsPDF(): void {
    // À implémenter selon vos besoins
    this.snackBar.open('Téléchargement PDF à implémenter', 'Fermer', { duration: 3000 });
  }

  // Imprimer la soumission
  printSubmission(): void {
    window.print();
  }

  // Retour à la liste des soumissions
  goBack(): void {
    this.router.navigate(['/forms', this.formId, 'submissions']);
  }

  // Naviguer vers l'édition du formulaire
  editForm(): void {
    this.router.navigate(['/forms', this.formId, 'edit']);
  }

  // Afficher le formulaire public
  viewPublicForm(): void {
    window.open(`/public/forms/${this.formId}`, '_blank');
  }

  // ✅ MÉTHODES MANQUANTES pour le template

  // TrackBy function pour ngFor
  trackByFieldName(index: number, field: any): string {
    return field.fieldName || index.toString();
  }

  // Obtenir l'icône d'un type de champ
  getFieldIcon(fieldType: string): string {
    const iconMap: { [key: string]: string } = {
      'text': 'text_fields',
      'textarea': 'notes',
      'email': 'email',
      'number': '123',
      'date': 'event',
      'datetime': 'schedule',
      'select': 'arrow_drop_down',
      'multiselect': 'checklist',
      'radio': 'radio_button_checked',
      'checkbox': 'check_box',
      'file': 'attach_file',
      'attachment': 'attach_file',
      'signature': 'gesture',
      'drawing': 'brush',
      'geolocation': 'location_on',
      'slider': 'tune'
    };
    return iconMap[fieldType] || 'help_outline';
  }

  // Obtenir le label d'un type de champ
  getFieldTypeLabel(fieldType: string): string {
    const labelMap: { [key: string]: string } = {
      'text': 'Texte',
      'textarea': 'Zone de texte',
      'email': 'Email',
      'number': 'Nombre',
      'date': 'Date',
      'datetime': 'Date et heure',
      'select': 'Liste déroulante',
      'multiselect': 'Sélection multiple',
      'radio': 'Bouton radio',
      'checkbox': 'Case à cocher',
      'file': 'Fichier',
      'attachment': 'Pièce jointe',
      'signature': 'Signature',
      'drawing': 'Dessin',
      'geolocation': 'Géolocalisation',
      'slider': 'Curseur'
    };
    return labelMap[fieldType] || fieldType;
  }

  // Vérifier si un champ a des métadonnées
  hasFieldMetadata(fieldName: string): boolean {
    if (!this.submission?.data) return false;

    const metadataKey = fieldName + '_metadata';
    return this.submission.data.hasOwnProperty(metadataKey);
  }

  // Obtenir les informations de métadonnées d'un champ
  getFieldMetadataInfo(fieldName: string): string {
    if (!this.submission?.data) return '';

    const metadataKey = fieldName + '_metadata';
    const metadata = this.submission.data[metadataKey];

    if (!metadata) return '';

    if (typeof metadata === 'object') {
      if (metadata.timestamp) {
        return `Ajouté le ${new Date(metadata.timestamp).toLocaleString('fr-FR')}`;
      }
      if (metadata.size) {
        return `Taille: ${(metadata.size / 1024).toFixed(1)} KB`;
      }
    }

    return 'Métadonnées disponibles';
  }

  // Ouvrir une modal pour agrandir une image
  openImageModal(imageData: string): void {
    // Pour l'instant, ouvrir dans un nouvel onglet
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Image</title></head>
          <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${imageData}" style="max-width:100%;max-height:100%;object-fit:contain;" />
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  }
}
