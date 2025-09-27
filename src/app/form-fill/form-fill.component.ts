import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormDTO, FormFieldDTO, FormSubmissionRequest } from '../models/form.models';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-form-fill',
  standalone: false,
  templateUrl: './form-fill.component.html',
  styleUrls: ['./form-fill.component.css']
})
export class FormFillComponent implements OnInit {
  formId!: number;
  currentForm?: FormDTO;
  submissionForm = new FormGroup({});
  isLoading = false;
  isSubmitting = false;
  hasSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      // ✅ CORRECTION : Validation stricte de l'ID
      const idParam = params['id'];

      if (!idParam || idParam === 'undefined' || idParam === 'null') {
        this.handleInvalidFormId('Identifiant de formulaire manquant');
        return;
      }

      const parsedId = Number(idParam);

      if (isNaN(parsedId) || parsedId <= 0) {
        this.handleInvalidFormId(`Identifiant de formulaire invalide: ${idParam}`);
        return;
      }

      this.formId = parsedId;
      this.loadFormForFilling();
    });
  }

  // ✅ NOUVELLE MÉTHODE : Gérer les ID invalides
  private handleInvalidFormId(errorMessage: string): void {
    console.error('ID de formulaire invalide:', errorMessage);
    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
    //this.router.navigate(['/forms/published']);
  }

  loadFormForFilling(): void {
    this.isLoading = true;

    // ✅ VALIDATION SUPPLÉMENTAIRE avant l'appel API
    if (!this.formId || isNaN(this.formId) || this.formId <= 0) {
      this.isLoading = false;
      this.handleInvalidFormId('Identifiant de formulaire invalide');
      return;
    }

    console.log('Chargement du formulaire avec ID:', this.formId);

    this.formService.getFormForFilling(this.formId).subscribe({
      next: (form) => {
        this.currentForm = form;
        this.buildSubmissionForm();
        this.isLoading = false;

        console.log('Formulaire chargé pour remplissage:', form.name);
        console.log('Groupes assignés:', form.assignedGroups?.map(g => g.name).join(', '));
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur chargement formulaire:', error);

        let errorMessage = 'Formulaire non disponible';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
       // this.router.navigate(['/forms/published']);
      }
    });
  }

  buildSubmissionForm(): void {
  if (!this.currentForm?.fields) {
    console.warn('Aucun champ trouvé dans le formulaire');
    return;
  }

  const controls: { [key: string]: FormControl } = {};

  this.currentForm.fields.forEach(field => {
    const validators = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.type === 'email') {
      validators.push(Validators.email);
    }

    // ✅ AJOUT: Traitement spécial pour le champ contact
    if (field.type === 'contact') {
      // Créer les sous-contrôles pour contact
      controls[`${field.fieldName}_name`] = new FormControl('', field.required ? [Validators.required] : []);
      controls[`${field.fieldName}_phone`] = new FormControl('', []);
      controls[`${field.fieldName}_email`] = new FormControl('', [Validators.email]);

      // Le contrôle principal reste pour la logique
      controls[field.fieldName] = new FormControl(null, validators);
    } else {
      // Traitement normal pour les autres types
      let defaultValue: any = this.getDefaultValueForFieldType(field.type);
      controls[field.fieldName] = new FormControl(defaultValue, validators);
    }
  });

  this.submissionForm = new FormGroup(controls);
  console.log('Formulaire de soumission construit avec', Object.keys(controls).length, 'champs');
}

  // ✅ NOUVELLE MÉTHODE : Obtenir la valeur par défaut selon le type
  private getDefaultValueForFieldType(fieldType: string): any {
    switch (fieldType) {
      case 'checkbox':
        return false;
      case 'number':
      case 'slider':
        return 0;
      case 'select':
      case 'radio':
        return '';
      case 'multiselect':
        return [];
      case 'date':
      case 'datetime':
        return '';
      case 'textarea':
      case 'text':
      case 'email':
      case 'password':
        return '';
      case 'file':
      case 'attachment':
      case 'signature':
      case 'drawing':
        return null;
      case 'geolocation':
        return null;
      default:
        return '';
    }
  }

  onSubmitForm(): void {
    if (this.submissionForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.submissionForm);
      this.snackBar.open('Veuillez corriger les erreurs avant de soumettre', 'Fermer', { duration: 3000 });
      return;
    }

    // ✅ VALIDATION FINALE avant soumission
    if (!this.formId || isNaN(this.formId)) {
      this.snackBar.open('Erreur: Identifiant de formulaire invalide', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    const submissionData = this.prepareSubmissionData();
    const submissionRequest: FormSubmissionRequest = {
      data: submissionData
    };

    console.log('Soumission du formulaire ID:', this.formId, 'Données:', submissionRequest);

    this.formService.submitForm(this.formId, submissionRequest).subscribe({
      next: (submission) => {
        this.isSubmitting = false;
        this.hasSubmitted = true;

        this.snackBar.open(
          'Formulaire soumis avec succès! Une copie vide reste disponible pour d\'autres utilisateurs.',
          'Fermer',
          { duration: 5000 }
        );

        console.log('Soumission enregistrée:', submission);

        // Rediriger après 3 secondes
       setTimeout(() => {
  this.router.navigate(['/forms', this.formId, 'submissions']);
}, 3000);

      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Erreur soumission:', error);

        let errorMessage = 'Erreur lors de la soumission';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
      }
    });
  }

prepareSubmissionData(): Record<string, any> {
  const formValue: Record<string, any> = this.submissionForm.value || {};
  const processedData: Record<string, any> = {};

  console.log('=== DEBUT prepareSubmissionData ===');
  console.log('FormValue complet:', formValue);

  if (!this.currentForm?.fields) {
    return processedData;
  }

  this.currentForm.fields.forEach(field => {
    const fieldValue = formValue[field.fieldName];

if (field.type === 'calculation') {
  // Pour les calculs, toujours prendre la valeur actuelle du FormControl
  const calculatedValue = formValue[field.fieldName];

  if (calculatedValue !== null && calculatedValue !== undefined && calculatedValue !== '') {
    if (typeof calculatedValue === 'number') {
      processedData[field.fieldName] = calculatedValue;
    } else if (typeof calculatedValue === 'string' && !isNaN(Number(calculatedValue))) {
      processedData[field.fieldName] = Number(calculatedValue);
    } else {
      processedData[field.fieldName] = calculatedValue.toString();
    }
    console.log('✅ Calculation value processed:', processedData[field.fieldName]);
  } else {
    processedData[field.fieldName] = 0;
    console.log('✅ Calculation default value:', 0);
  }
}
  // Traitement normal pour les autres champs...
    if (field.type === 'geolocation') {
      // Utiliser les données stockées dans l'attribut du champ
      if ((field as any).geoData) {
        processedData[field.fieldName] = (field as any).geoData;
      } else if (fieldValue && typeof fieldValue === 'string' && fieldValue !== '') {
        // Parser la saisie manuelle si pas d'objet stocké
        const coords = this.parseManualCoordinates(fieldValue);
        processedData[field.fieldName] = coords;
      } else {
        processedData[field.fieldName] = null;
      }
    } else {
if (field.type === 'fixed-text') {
      // Essayer plusieurs sources pour le contenu
      let content = 'Texte non configuré';

      if (field.attributes?.['content']) {
        content = field.attributes['content'];
      } else if (field.placeholder && field.placeholder !== 'Enter texte fixe...') {
        content = field.placeholder;
      } else if (field.label && field.label !== 'Texte fixe') {
        content = `Contenu: ${field.label}`;
      }

      processedData[field.fieldName] = {
        type: 'fixed-text',
        content: content,
        acknowledged: true,
        timestamp: new Date().toISOString(),
        fieldLabel: field.label
      };
    }
    if (field.type === 'file-fixed') {
      if (field.attributes && field.attributes['fileUrl']) {
        processedData[field.fieldName] = {
          type: 'file-fixed',
          fileUrl: field.attributes['fileUrl'],
          fileName: field.attributes['fileName'],
          fileType: field.attributes['fileType'],
          acknowledged: true,
          timestamp: new Date().toISOString()
        };
      } else {
        processedData[field.fieldName] = {
          type: 'file-fixed',
          acknowledged: false,
          timestamp: new Date().toISOString()
        };
      }
    }
    console.log(`Field ${field.fieldName}:`);
    console.log('- Type:', field.type);
    console.log('- Raw value:', fieldValue);
    console.log('- Is array:', Array.isArray(fieldValue));
    if (field.type === 'image') {
      // Pour les champs image, récupérer les données depuis les attributes
      if (field.attributes && typeof field.attributes === 'object') {
        processedData[field.fieldName] = {
          type: 'image',
          imageUrl: field.attributes['imageUrl'],
          fileName: field.attributes['fileName'],
          fileType: field.attributes['fileType'],
          acknowledged: true,
          timestamp: new Date().toISOString()
        };
      } else if (field.attributes && typeof field.attributes === 'string') {
        // Si attributes est une chaîne JSON
        try {
          const parsedAttributes = JSON.parse(field.attributes);
          processedData[field.fieldName] = {
            type: 'image',
            imageUrl: parsedAttributes.imageUrl,
            fileName: parsedAttributes.fileName,
            fileType: parsedAttributes.fileType,
            acknowledged: true,
            timestamp: new Date().toISOString()
          };
        } catch (e) {
          processedData[field.fieldName] = this.getDefaultSubmissionValue(field.type);
        }
      } else {
        processedData[field.fieldName] = this.getDefaultSubmissionValue(field.type);
      }
    }

 // Dans prepareSubmissionData(), remplacer le traitement de l'adresse par :

// ✅ TRAITEMENT SPÉCIAL POUR ADDRESS - VERSION CORRIGÉE
if (field.type === 'address') {
  const addressData = {
    fullAddress: formValue[field.fieldName] || '',
    zipCode: formValue[`${field.fieldName}_zip`] || '',
    city: formValue[`${field.fieldName}_city`] || ''
  };

  // ✅ DEBUG: Vérifier les valeurs récupérées
  console.log('=== ADDRESS FIELD DEBUG ===');
  console.log('Field name:', field.fieldName);
  console.log('Full address value:', formValue[field.fieldName]);
  console.log('Zip code value:', formValue[`${field.fieldName}_zip`]);
  console.log('City value:', formValue[`${field.fieldName}_city`]);
  console.log('Form keys containing address:', Object.keys(formValue).filter(key => key.includes(field.fieldName)));

  // Construire l'adresse complète si les champs séparés sont remplis
  if (addressData.zipCode || addressData.city) {
    const parts = [
      addressData.fullAddress,
      addressData.zipCode,
      addressData.city
    ].filter(part => part && part.trim() !== '');

    addressData.fullAddress = parts.join(', ');
  }

  const hasData = Object.values(addressData).some(val => val && val.trim() !== '');
  processedData[field.fieldName] = hasData ? addressData : null;
  console.log('- Address processed:', processedData[field.fieldName]);

} else if (field.type === 'contact') {
        const contactData = {
        name: formValue[`${field.fieldName}_name`] || '',
        phone: formValue[`${field.fieldName}_phone`] || '',
        email: formValue[`${field.fieldName}_email`] || '',
        company: formValue[`${field.fieldName}_company`] || ''
      };

      const hasData = Object.values(contactData).some(val => val && val.trim() !== '');
      processedData[field.fieldName] = hasData ? contactData : null;
      console.log('- Contact processed:', processedData[field.fieldName]);

    } else {
      // ✅ CORRECTION PRINCIPALE : Traitement des arrays (checkboxes multiples)
      if (Array.isArray(fieldValue)) {
        // Array - garder tel quel (même si vide)
        processedData[field.fieldName] = fieldValue;
        console.log('- Array kept as-is:', fieldValue);

      } else if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        // Valeur non-vide - traitement normal
        const processedValue = this.processFieldValueForSubmission(field, fieldValue);
        processedData[field.fieldName] = processedValue;
        console.log('- Processed value:', processedValue);

      } else {
        // Valeur vide - utiliser défaut
        const defaultValue = this.getDefaultSubmissionValue(field.type);
        processedData[field.fieldName] = defaultValue;
        console.log('- Default value used:', defaultValue);
      }
    }

    console.log('- Final value in processedData:', processedData[field.fieldName]);
  }
  });


  // Métadonnées globales
  processedData['_submission_metadata'] = {
    submittedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    formVersion: this.currentForm?.id,
    language: navigator.language,
    formId: this.formId
  };

  console.log('=== PROCESSED DATA FINAL ===', processedData);
  return processedData;
}

private parseManualCoordinates(input: string): any {
  const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
  const match = input.match(coordPattern);

  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);

    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return {
        latitude,
        longitude,
        accuracy: null,
        timestamp: new Date().toISOString(),
        source: 'manual'
      };
    }
  }

  return null;
}
// ✅ NOUVELLE MÉTHODE : Données pour champs informatifs
private getInformationalFieldData(field: FormFieldDTO): any {
  switch (field.type) {
    case 'separator':
      return { type: 'separator', acknowledged: true };
    case 'fixed-text':
      return { type: 'fixed-text', text: field.attributes?.['text'] || '' };
    case 'image':
      return {
        type: 'image',
        url: field.attributes?.['imageUrl'] || '',
        fileName: field.attributes?.['fileName'] || ''
      };
    case 'geolocation':
      return null; // Géolocalisation nécessite une action utilisateur
    case 'contact':
      return null; // Contact nécessite des données utilisateur
    default:
      return { type: field.type, acknowledged: true };
  }
}

// ✅ NOUVELLE MÉTHODE : Valeurs par défaut pour soumission
private getDefaultSubmissionValue(fieldType: string): any {
  switch (fieldType) {
    case 'checkbox':
      return false;
    case 'number':
    case 'slider':
      return 0;
    case 'text':
    case 'textarea':
    case 'email':
    case 'schema':
      return '';
    case 'select':
    case 'radio':
      return null;
    case 'multiselect':
    case 'external-list':
      return [];
    case 'date':
    case 'datetime':
      return null;
    case 'geolocation':
    case 'contact':
      return null;
    case 'barcode':
    case 'nfc':
      return null;
    case 'address':
    case 'reference':
      return null;
    case 'file':
    case 'attachment':
    case 'signature':
    case 'drawing':
    case 'audio':
      return null;
    case 'file-fixed':
      // Pour file-fixed, récupérer les données depuis les attributes
      const fileFixedField = this.currentForm?.fields?.find(f => f.type === 'file-fixed');
      if (fileFixedField?.attributes?.['fileUrl']) {
        return {
          type: 'file-fixed',
          fileUrl: fileFixedField.attributes['fileUrl'],
          fileName: fileFixedField.attributes['fileName'],
          fileType: fileFixedField.attributes['fileType'],
          acknowledged: true,
          timestamp: new Date().toISOString()
        };
      }
      return {
        type: 'file-fixed',
        acknowledged: false,
        timestamp: new Date().toISOString()
      };
    case 'separator':
    case 'fixed-text':
      return {
        type: fieldType,
        acknowledged: true,
        timestamp: new Date().toISOString()
      };
    case 'image':
      // Retourner les données d'image depuis les attributs du champ
      const imageField = this.currentForm?.fields?.find(f => f.type === 'image');
      if (imageField?.attributes?.['imageUrl']) {
        return {
          type: 'image',
          imageUrl: imageField.attributes['imageUrl'],
          fileName: imageField.attributes['fileName'],
          acknowledged: true,
          timestamp: new Date().toISOString()
        };
      }
      return {
        type: fieldType,
        acknowledged: true,
        timestamp: new Date().toISOString()
      };
    case 'calculation':
      return '';
    default:
      return null;
  }
}


  // ✅ NOUVELLE MÉTHODE : Traiter les valeurs selon le type de champ
  private processFieldValueForSubmission(field: FormFieldDTO, value: any): any {
    switch (field.type) {
        case 'attachment':
    case 'file':
      // Pour les fichiers, garder la valeur base64 telle quelle
      if (typeof value === 'string' && value.startsWith('data:')) {
        return value; // Données base64 du fichier
      }
      return null;
      case 'number':
      case 'slider':
        const numValue = Number(value);
        return isNaN(numValue) ? 0 : numValue;

      case 'checkbox':
         if (Array.isArray(value)) {
        return value; // Garder l'array tel quel
      }
      return Boolean(value);

      case 'date':
      case 'datetime':
        if (value instanceof Date) {
          return value.toISOString();
        } else if (typeof value === 'string' && value.trim()) {
          try {
            return new Date(value).toISOString();
          } catch (e) {
            console.warn('Date invalide pour le champ', field.fieldName, ':', value);
            return null;
          }
        }
        return null;

      case 'geolocation':
        if (typeof value === 'object' && value?.latitude && value?.longitude) {
          return {
            latitude: Number(value.latitude),
            longitude: Number(value.longitude),
            accuracy: value.accuracy ? Number(value.accuracy) : null
          };
        }
        return null;

      default:
        return value;
    }
  }

  // ✅ NOUVELLE MÉTHODE : Ajouter des métadonnées de champ
  private addFieldMetadata(processedData: Record<string, any>, field: FormFieldDTO, fieldValue: any): void {
    switch (field.type) {
      case 'signature':
      case 'drawing':
        if (typeof fieldValue === 'string' && fieldValue.startsWith('data:image/')) {
          processedData[field.fieldName + '_metadata'] = {
            type: field.type,
            timestamp: new Date().toISOString(),
            size: fieldValue.length
          };
        }
        break;

      case 'file':
      case 'attachment':
        if (typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
          processedData[field.fieldName + '_metadata'] = {
            type: field.type,
            timestamp: new Date().toISOString(),
            filename: field.fieldName + '_' + Date.now()
          };
        }
        break;

      case 'geolocation':
        if (typeof fieldValue === 'object' && fieldValue?.latitude && fieldValue?.longitude) {
          processedData[field.fieldName + '_metadata'] = {
            accuracy: fieldValue.accuracy,
            timestamp: new Date().toISOString()
          };
        }
        break;
    }
  }

  resetForm(): void {
    this.submissionForm.reset();
    this.buildSubmissionForm();
    this.hasSubmitted = false;
    this.snackBar.open('Formulaire réinitialisé', 'Fermer', { duration: 2000 });
  }

  goBack(): void {
    this.router.navigate(['/forms']);
  }

  // ✅ MÉTHODES UTILITAIRES AMÉLIORÉES

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.submissionForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        const field = this.currentForm?.fields?.find(f => f.fieldName === fieldName);
        return `Le champ "${field?.label || fieldName}" est obligatoire`;
      }
      if (control.errors['email']) {
        return 'Adresse email invalide';
      }
      if (control.errors['min']) {
        return `Valeur trop petite (minimum: ${control.errors['min'].min})`;
      }
      if (control.errors['max']) {
        return `Valeur trop grande (maximum: ${control.errors['max'].max})`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.submissionForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  getProgressPercentage(): number {
    if (!this.currentForm?.fields || this.currentForm.fields.length === 0) {
      return 0;
    }

    const totalFields = this.currentForm.fields.length;
    let filledFields = 0;

    Object.keys(this.submissionForm.controls).forEach(fieldName => {
      const control = this.submissionForm.get(fieldName);
      const value = control?.value;

      // ✅ AMÉLIORATION : Validation plus précise des champs remplis
      if (this.isFieldValueFilled(fieldName, value)) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  }

  // ✅ NOUVELLE MÉTHODE : Vérifier si un champ est rempli
  private isFieldValueFilled(fieldName: string, value: any): boolean {
    const field = this.currentForm?.fields?.find(f => f.fieldName === fieldName);
    if (!field) return false;

    switch (field.type) {
      case 'checkbox':
        return value === true;
        return Array.isArray(value) && value.length > 0;
      case 'number':
      case 'slider':
        return !isNaN(Number(value)) && Number(value) !== 0;
      case 'file':
      case 'attachment':
      case 'signature':
      case 'drawing':
        return value !== null && value !== undefined;
      default:
        return value !== null && value !== undefined && value !== '';
    }
  }

canSubmit(): boolean {
  return this.submissionForm.valid &&
         !this.isSubmitting &&
         !this.hasSubmitted &&
         (typeof this.formId === 'number' && !isNaN(this.formId));
}


  // ✅ MÉTHODES DE DÉBOGAGE (à supprimer en production)
  debugFormState(): void {
    console.log('État du formulaire:', {
      formId: this.formId,
      isValid: this.submissionForm.valid,
      isSubmitting: this.isSubmitting,
      hasSubmitted: this.hasSubmitted,
      formValue: this.submissionForm.value,
      canSubmit: this.canSubmit()
    });
  }



  // ✅ MÉTHODES UTILITAIRES POUR LE TEMPLATE

  trackByFieldId(index: number, field: FormFieldDTO): any {
    return field.id || field.fieldName || index;
  }

  getFieldTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'text': 'Texte',
      'textarea': 'Zone de texte',
      'email': 'Email',
      'number': 'Nombre',
      'select': 'Liste déroulante',
      'radio': 'Bouton radio',
      'checkbox': 'Case à cocher',
      'date': 'Date',
      'datetime': 'Date et heure',
      'file': 'Fichier',
      'signature': 'Signature',
      'drawing': 'Dessin',
      'geolocation': 'Géolocalisation',
      'slider': 'Curseur'
    };
    return typeLabels[type] || type;
  }

  getFieldLabel(fieldName: string): string {
    const field = this.currentForm?.fields?.find(f => f.fieldName === fieldName);
    return field?.label || fieldName;
  }

  getValidationSummaryMessage(): string {
    const invalidFields = this.getInvalidFields();
    const count = invalidFields.length;

    if (count === 1) {
      return 'Veuillez corriger le champ en erreur avant de soumettre.';
    } else {
      return `Veuillez corriger les ${count} champs en erreur avant de soumettre.`;
    }
  }

  getInvalidFields(): { fieldName: string; error: string }[] {
    const invalidFields: { fieldName: string; error: string }[] = [];

    Object.keys(this.submissionForm.controls).forEach(fieldName => {
      const error = this.getFieldError(fieldName);
      if (error) {
        invalidFields.push({
          fieldName,
          error
        });
      }
    });

    return invalidFields;
  }

  hasSpecialFields(): boolean {
    if (!this.currentForm?.fields) return false;

    const specialTypes = ['signature', 'drawing', 'file', 'attachment', 'geolocation'];
    return this.currentForm.fields.some(field => specialTypes.includes(field.type));
  }

  hasSignatureFields(): boolean {
    if (!this.currentForm?.fields) return false;
    return this.currentForm.fields.some(field => ['signature', 'drawing'].includes(field.type));
  }

  hasFileFields(): boolean {
    if (!this.currentForm?.fields) return false;
    return this.currentForm.fields.some(field => ['file', 'attachment'].includes(field.type));
  }

  hasGeolocationFields(): boolean {
    if (!this.currentForm?.fields) return false;
    return this.currentForm.fields.some(field => field.type === 'geolocation');
  }


  // ✅ MÉTHODES DE VALIDATION AVANCÉE

  validateFormBeforeSubmit(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier l'ID du formulaire
    if (!this.formId || isNaN(this.formId) || this.formId <= 0) {
      errors.push('Identifiant de formulaire invalide');
    }

    // Vérifier l'état du formulaire
    if (!this.currentForm) {
      errors.push('Formulaire non chargé');
    }

    // Vérifier les données de soumission
    if (!this.submissionForm.value || Object.keys(this.submissionForm.value).length === 0) {
      errors.push('Aucune donnée à soumettre');
    }

    // Vérifier les champs obligatoires
    const invalidFields = this.getInvalidFields();
    if (invalidFields.length > 0) {
      errors.push(`${invalidFields.length} champ(s) invalide(s)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ✅ MÉTHODES DE NETTOYAGE

  ngOnDestroy(): void {
    // Nettoyer les observables si nécessaire
    if (this.formId) {
      console.log('Nettoyage du composant form-fill pour le formulaire:', this.formId);
    }
  }

}
