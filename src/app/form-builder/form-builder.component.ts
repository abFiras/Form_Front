import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldOptionDTO, FieldType, FormCreateRequest, FormDTO, FormFieldCreateDTO, FormFieldDTO, FormUpdateRequest, PaletteField } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ExternalListConfigComponent } from '../external-list-config/external-list-config.component';

@Component({
  selector: 'app-form-builder',
  standalone: false,
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.css'
})
export class FormBuilderComponent implements OnInit {
  formId?: number;
  isPreviewMode = false;
  currentForm?: FormDTO;
  formFields: FormFieldDTO[] = [];
  previewForm = new FormGroup({});

  formSettingsForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('')
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
      private dialog: MatDialog // ✅ Ajout du MatDialog

  ) {}

  ngOnInit(): void {

      console.log('IsPreviewMode:', this.isPreviewMode); // Debug

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.formId = +params['id'];
        this.isPreviewMode = this.route.snapshot.url[2]?.path === 'preview';
        this.loadForm();
      }
    });
     this.authService.getCurrentUser().subscribe({
    next: (user) => {
      console.log('Current logged-in user:', user);
      // user might look like { id: 1, username: "admin" }
    },
    error: (err) => {
      console.error('Error fetching current user:', err);
    }
  });
  }


loadForm(): void {
  if (this.formId) {
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.currentForm = form;

        // Normalize options AND attributes for all fields before using them
        this.formFields = [...form.fields]
          .sort((a, b) => a.order - b.order)
          .map(field => {
            console.log('Processing field from server:', field); // Debug

            // ✅ Normaliser les options
            if (field.options) {
              if (typeof field.options === 'string') {
                try {
                  field.options = JSON.parse(field.options);
                } catch (e) {
                  console.error('Error parsing field options:', e);
                  field.options = [];
                }
              }
              if (!Array.isArray(field.options)) {
                field.options = [];
              }
            }

            // ✅ Normaliser les attributs avec gestion spéciale pour external-list
            if (field.attributes) {
              if (typeof field.attributes === 'string') {
                try {
                  field.attributes = JSON.parse(field.attributes);
                } catch (e) {
                  console.error('Error parsing field attributes:', e);
                  field.attributes = {};
                }
              }
              if (typeof field.attributes !== 'object' || field.attributes === null) {
                field.attributes = {};
              }
            } else {
              field.attributes = {};
            }

            // ✅ CORRECTION SPÉCIALE pour external-list
            if (field.type === 'external-list') {
              console.log('Processing external-list field:', field);
              console.log('Field attributes:', field.attributes);

              // Récupérer les valeurs depuis les attributes
              const externalListId = field.attributes['externalListId'];
              const displayMode = field.attributes['externalListDisplayMode'] || 'select';

              // Convertir et assigner aux propriétés du field
              if (externalListId) {
                field.externalListId = parseInt(externalListId.toString());
              }
              field.externalListDisplayMode = displayMode;

              // Autres propriétés optionnelles
              field.externalListUrl = field.attributes['externalListUrl'] || '';
              field.externalListParams = field.attributes['externalListParams'] || {};

              console.log('External-list field after processing:', {
                externalListId: field.externalListId,
                displayMode: field.externalListDisplayMode,
                url: field.externalListUrl,
                params: field.externalListParams
              });
            }

            // ✅ Autres types de champs avec attributs spéciaux
            else if (field.type === 'calculation') {
              // Pas de changement nécessaire
            }
            else if (field.type === 'image') {
              // Pas de changement nécessaire
            }
            else if (field.type === 'table') {
              // Pas de changement nécessaire
            }

            return field;
          });

        console.log('All processed fields:', this.formFields); // Debug

        this.formSettingsForm.patchValue({
          name: form.name,
          description: form.description
        });

        this.rebuildPreviewForm();
      },
      error: (error) => {
        console.error('Error loading form:', error);
        this.snackBar.open('Error loading form', 'Fermer', { duration: 3000 });
      }
    });
  }
}

 // Remplacez votre méthode onFieldDrop actuelle par celle-ci dans votre composant TypeScript

onFieldDrop(event: CdkDragDrop<any[]>): void {
  console.log('Drop event:', event);
  console.log('Previous container ID:', event.previousContainer.id);
  console.log('Current container ID:', event.container.id);

  if (event.previousContainer === event.container) {
    // Reordering within the same list (canvas)
    console.log('Reordering within canvas');
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.updateFieldOrders();
  } else if (event.previousContainer.id === 'palette-list') {
    // Adding new field from palette - utiliser event.item.data au lieu de previousContainer.data
    console.log('Adding from palette');
    const dragData = event.item.data;
    console.log('Drag data from palette:', dragData);

    if (dragData && dragData.type && dragData.label) {
      const paletteField: PaletteField = {
        type: dragData.type as FieldType,
        label: dragData.label,
          icon: dragData.icon || '🔹' // mettre un emoji par défaut si dragData.icon est absent

      };

      const newField = this.createFieldFromPalette(paletteField);
      console.log('Created new field:', newField);

      // Insert at the correct position
      this.formFields.splice(event.currentIndex, 0, newField);
      this.updateFieldOrders();
      this.rebuildPreviewForm();

      this.snackBar.open(`${dragData.label} ajouté`, 'Fermer', { duration: 2000 });
    } else {
      console.error('Invalid drag data:', dragData);
    }
  } else {
    // Moving existing fields between containers
    console.log('Moving between containers');
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.updateFieldOrders();
    this.rebuildPreviewForm();
  }

  console.log('Final formFields:', this.formFields);
}

// Ajoutez aussi cette méthode pour gérer l'input du nom
onFormNameChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  this.formSettingsForm.get('name')?.setValue(target.value);
}

// ✅ Méthode corrigée dans form-builder.component.ts
// ✅ Méthode createFieldFromPalette() corrigée avec notation entre crochets

createFieldFromPalette(paletteField: PaletteField): FormFieldDTO {
  const timestamp = Date.now();
  const fieldName = `field_${timestamp}`;

  const baseField: FormFieldDTO = {
    type: paletteField.type,
    label: paletteField.label,
    fieldName,
    placeholder: `Enter ${paletteField.label.toLowerCase()}...`,
    required: false,
    order: this.formFields.length,
    attributes: {} // ✅ Initialiser les attributs
  };

  // Configuration spécifique selon le type de champ
  switch (paletteField.type) {
    case 'external-list':
      // ✅ Configuration par défaut pour external-list avec notation correcte
      baseField.placeholder = 'Sélectionnez une valeur...';
      baseField.attributes = {};
      baseField.attributes['externalListId'] = null;
      baseField.attributes['externalListDisplayMode'] = 'select';
      baseField.attributes['externalListUrl'] = '';
      baseField.attributes['externalListParams'] = {};

      // Programmer l'ouverture du dialog après l'ajout du champ
      setTimeout(() => {
        this.openExternalListConfig(baseField);
      }, 100);
      break;

    case 'select':
    case 'radio':
    case 'checkbox':
      baseField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
      break;

    case 'calculation':
      baseField.placeholder = 'Résultat calculé automatiquement';
      baseField.attributes = {};
      baseField.attributes['formula'] = '';
      break;

    case 'signature':
      baseField.placeholder = 'Signature électronique';
      baseField.attributes = {};
      baseField.attributes['signatureType'] = 'canvas';
      break;

    case 'image':
      baseField.placeholder = 'Image fixe';
      baseField.attributes = {};
      baseField.attributes['imageUrl'] = '';
      baseField.attributes['imageAlt'] = baseField.label;
      baseField.attributes['imageWidth'] = 'auto';
      baseField.attributes['imageHeight'] = 'auto';
      break;

    case 'table':
      baseField.placeholder = 'Tableau de données';
      baseField.attributes = {};
      baseField.attributes['columns'] = JSON.stringify(['Colonne 1', 'Colonne 2']);
      baseField.attributes['rows'] = JSON.stringify([
        { 'Colonne 1': '', 'Colonne 2': '' },
        { 'Colonne 1': '', 'Colonne 2': '' }
      ]);
      break;

    case 'fixed-text':
      baseField.placeholder = 'Texte fixe à afficher';
      baseField.attributes = {};
      baseField.attributes['content'] = 'Texte à configurer...';
      break;

    case 'file-fixed':
      baseField.placeholder = 'Fichier fixe à télécharger';
      baseField.attributes = {};
      baseField.attributes['fileUrl'] = '';
      baseField.attributes['fileName'] = '';
      baseField.attributes['fileType'] = '';
      break;

    case 'drawing':
      baseField.placeholder = 'Zone de dessin';
      baseField.attributes = {};
      baseField.attributes['canvasWidth'] = '400';
      baseField.attributes['canvasHeight'] = '200';
      break;

    case 'schema':
      baseField.placeholder = 'Définissez votre schéma...';
      baseField.attributes = {};
      baseField.attributes['schemaType'] = 'json';
      break;

    default:
      // Autres types de champs - configuration par défaut
      break;
  }

  return baseField;
}
  // ✅ Nouvelle méthode pour ouvrir la configuration des listes externes
openExternalListConfig(field: FormFieldDTO): void {
  const dialogRef = this.dialog.open(ExternalListConfigComponent, {
    width: '600px',
    data: { field }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Mettre à jour le champ avec la configuration
      const fieldIndex = this.formFields.findIndex(f => f.fieldName === field.fieldName);
      if (fieldIndex >= 0) {
        this.formFields[fieldIndex] = result;
        this.rebuildPreviewForm();
      }
    }
  });
}

  hasOptions(fieldType: FieldType): boolean {
    return ['select', 'radio', 'checkbox'].includes(fieldType);
  }

  updateFieldOrders(): void {
    this.formFields.forEach((field, index) => {
      field.order = index;
    });
  }

  onFieldChange(index: number, updatedField: FormFieldDTO): void {
    this.formFields[index] = updatedField;
    this.rebuildPreviewForm();
  }

  onRemoveField(index: number): void {
    const removedField = this.formFields[index];
    this.formFields.splice(index, 1);
    this.updateFieldOrders();
    this.rebuildPreviewForm();
    this.snackBar.open(`${removedField.label} field removed`, 'Fermer', { duration: 2000 });
  }

  rebuildPreviewForm(): void {
    const controls: { [key: string]: FormControl } = {};

    this.formFields.forEach(field => {
      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      // Add specific validators based on field type
      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      controls[field.fieldName] = new FormControl('', validators);
    });

    this.previewForm = new FormGroup(controls);
  }
// ✅ FormBuilder Component - saveForm() method corrigé

// ✅ Méthode saveForm() corrigée dans form-builder.component.ts

// ✅ Méthode saveForm() corrigée dans form-builder.component.ts

saveForm(): void {
  if (!this.formSettingsForm.valid) {
    this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
    return;
  }

  // Récupérer l'utilisateur actuel
  this.authService.getCurrentUser().pipe(
    switchMap(user => {
      const numericUserId = Number(user.id);
      if (isNaN(numericUserId)) {
        console.error('User ID is not numeric:', user.id);
        throw new Error('Invalid user ID');
      }

      // ✅ Préparer les données du formulaire avec gestion complète des attributs
      const formData: FormCreateRequest | FormUpdateRequest = {
        name: this.formSettingsForm.value.name!,
        description: this.formSettingsForm.value.description || '',
        userId: numericUserId,
        fields: this.formFields.map(f => {
          console.log('Processing field for save:', f); // Debug log

          // Nettoyage des options
          let cleanOptions: FieldOptionDTO[] | undefined = undefined;
          if (f.options && Array.isArray(f.options) && f.options.length > 0) {
            cleanOptions = f.options
              .filter(opt => opt && opt.label && opt.label.trim() && opt.value && opt.value.trim())
              .map(opt => ({
                label: opt.label.trim(),
                value: opt.value.trim()
              }));

            if (cleanOptions.length === 0) {
              cleanOptions = undefined;
            }
          }

          // ✅ Préparation complète des attributs
          let cleanAttributes: { [key: string]: any } | undefined = undefined;
          if (f.attributes && Object.keys(f.attributes).length > 0) {
            cleanAttributes = { ...f.attributes };
          }

          // ✅ Traitement spécialisé pour external-list
          if (f.type === 'external-list') {
            // Construire les attributs spécifiques
            if (!cleanAttributes) cleanAttributes = {};

            // Priorité aux propriétés directes, sinon utiliser les attributs existants
            cleanAttributes['externalListId'] = f.externalListId?.toString() ||
                                               f.attributes?.['externalListId'] ||
                                               cleanAttributes['externalListId'];

            cleanAttributes['externalListDisplayMode'] = f.externalListDisplayMode ||
                                                        f.attributes?.['externalListDisplayMode'] ||
                                                        'select';

            cleanAttributes['externalListUrl'] = f.externalListUrl ||
                                                f.attributes?.['externalListUrl'] || '';

            cleanAttributes['externalListParams'] = f.externalListParams ||
                                                   f.attributes?.['externalListParams'] || {};

            console.log('External list attributes for save:', cleanAttributes); // Debug log
          }

          // ✅ Autres types de champs avec attributs spéciaux
          else if (f.type === 'calculation' && f.attributes?.['formula']) {
            if (!cleanAttributes) cleanAttributes = {};
            cleanAttributes['formula'] = f.attributes['formula'];
          }
          else if (f.type === 'image' && (f.attributes?.['imageUrl'] || f.attributes?.['imageAlt'])) {
            if (!cleanAttributes) cleanAttributes = {};
            if (f.attributes['imageUrl']) cleanAttributes['imageUrl'] = f.attributes['imageUrl'];
            if (f.attributes['imageAlt']) cleanAttributes['imageAlt'] = f.attributes['imageAlt'];
          }
          else if (f.type === 'table' && (f.attributes?.['columns'] || f.attributes?.['rows'])) {
            if (!cleanAttributes) cleanAttributes = {};
            if (f.attributes['columns']) cleanAttributes['columns'] = f.attributes['columns'];
            if (f.attributes['rows']) cleanAttributes['rows'] = f.attributes['rows'];
          }

          // Construire l'objet field final
          const fieldData: FormFieldCreateDTO = {
            type: f.type,
            label: f.label,
            fieldName: f.fieldName || `field_${Date.now()}`,
            placeholder: f.placeholder,
            required: !!f.required,
            order: Number(f.order) || 0,
            options: cleanOptions,
            attributes: cleanAttributes
          };

          console.log('Final field data for save:', fieldData); // Debug log
          return fieldData;
        })
      };

      console.log('Complete form data for save:', formData); // Debug log

      // Si formId existe => update, sinon create
      if (this.formId) {
        const updatePayload: FormUpdateRequest = {
          ...formData,
          status: this.currentForm?.status || 'DRAFT'
        };
        return this.formService.updateForm(this.formId, updatePayload);
      } else {
        return this.formService.createForm(formData);
      }
    })
  ).subscribe({
    next: (form) => {
      const message = this.formId ? 'Formulaire mis à jour avec succès' : 'Formulaire créé avec succès';
      this.snackBar.open(message, 'Fermer', { duration: 3000 });

      console.log('Form saved successfully:', form); // Debug log

      // Mettre à jour l'état local et redirection si nécessaire
      this.currentForm = form;
      if (!this.formId) {
        this.router.navigate(['/forms', form.id, 'edit']);
      }
    },
    error: (error) => {
      console.error('Error saving form:', error);
      this.snackBar.open("Erreur lors de l'enregistrement du formulaire", 'Fermer', { duration: 3000 });
    }
  });
}


// ✅ Méthode helper pour ajouter une option à un champ select/radio
addOption(fieldIndex: number): void {
  if (!this.formFields[fieldIndex].options) {
    this.formFields[fieldIndex].options = [];
  }

  this.formFields[fieldIndex].options!.push({
    label: '',
    value: ''
  });
}

// ✅ Méthode helper pour supprimer une option
removeOption(fieldIndex: number, optionIndex: number): void {
  if (this.formFields[fieldIndex].options) {
    this.formFields[fieldIndex].options!.splice(optionIndex, 1);
  }
}

// ✅ Méthode helper pour valider les options avant sauvegarde
validateFieldOptions(field: any): boolean {
  if (['select', 'radio', 'checkbox'].includes(field.type)) {
    if (!field.options || field.options.length === 0) {
      this.snackBar.open(`Field "${field.label}" of type ${field.type} must have at least one option`, 'Fermer', { duration: 5000 });
      return false;
    }

    const validOptions = field.options.filter((opt: any) =>
      opt && opt.label && opt.label.trim() && opt.value && opt.value.trim()
    );

    if (validOptions.length === 0) {
      this.snackBar.open(`Field "${field.label}" has no valid options (label and value are required)`, 'Fermer', { duration: 5000 });
      return false;
    }
  }

  return true;
}



  publishForm(): void {
    if (this.formId) {
      this.formService.publishForm(this.formId).subscribe({
        next: (form) => {
          this.snackBar.open('Formulaire publié avec succès', 'Fermer', { duration: 3000 });
          this.currentForm = form;
        },
        error: (error) => {
          console.error('Error publishing form:', error);
          this.snackBar.open('Error publishing form', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  submitPreview(): void {
    if (this.previewForm.valid && this.formId) {
      const submission = {
        data: this.previewForm.value
      };

      this.formService.submitForm(this.formId, submission).subscribe({
        next: () => {
          this.snackBar.open('Formulaire soumis avec succès', 'Fermer', { duration: 3000 });
          this.previewForm.reset();
        },
        error: (error) => {
          console.error('Error submitting form:', error);
          this.snackBar.open('Error submitting form', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/forms']);
  }

  // Ajoutez ces méthodes à votre classe FormBuilderComponent

getCharacterCount(): number {
  const nameValue = this.formSettingsForm.get('name')?.value || '';
  return nameValue.length;
}

// Méthode pour basculer entre mode édition et preview
togglePreviewMode(): void {
  this.isPreviewMode = !this.isPreviewMode;
  if (this.isPreviewMode) {
    this.rebuildPreviewForm();
  }
}

// Méthode pour créer un drag data avec une structure cohérente
createDragData(type: string, label: string): any {
  return {
    type: type,
    label: label,
    icon: this.getFieldIcon(type)
  };
}

// Méthode pour obtenir l'icône appropriée selon le type
getFieldIcon(type: string): string {
  const iconMap: { [key: string]: string } = {
    'text': 'text_fields',
    'textarea': 'notes',
    'datetime': 'event',
    'checkbox': 'check_box',
    'slider': 'linear_scale',
    'number': 'add',
    'select': 'list',
    'radio': 'radio_button_checked',
    'geolocation': 'location_on',
    'contact': 'contact_phone',
    'address': 'home',
    'reference': 'link',
    'file': 'photo_camera',
    'audio': 'mic',
    'drawing': 'brush',
    'schema': 'account_tree',
    'attachment': 'attach_file',
    'signature': 'gesture',
    'barcode': 'qr_code_scanner',
    'nfc': 'nfc',
    'separator': 'remove',
    'table': 'table_chart',
    'fixed-text': 'text_snippet',
    'image': 'image',
    'file-fixed': 'description',
    'calculation': 'calculate',
    'external-list': 'list_alt' // ✅ Nouveau type

  };

  return iconMap[type] || 'help_outline';
}
get nameFormControl(): FormControl {
  return this.formSettingsForm.get('name') as FormControl;
}
}
