import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldOptionDTO, FieldType, FormCreateRequest, FormDTO, FormFieldDTO, FormUpdateRequest, PaletteField } from '../models/form.models';
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

        // Normalize options for all fields before using them
        this.formFields = [...form.fields]
          .sort((a, b) => a.order - b.order)
          .map(field => {
            // Ensure options is always an array
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
            return field;
          });

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

  createFieldFromPalette(paletteField: PaletteField): FormFieldDTO {
    const timestamp = Date.now();
    const fieldName = `field_${timestamp}`;

    const baseField: FormFieldDTO = {
      type: paletteField.type,
      label: paletteField.label,
      fieldName,
      placeholder: `Enter ${paletteField.label.toLowerCase()}...`,
      required: false,
      order: this.formFields.length
    };

    // Add default options for fields that need them
    if (this.hasOptions(paletteField.type)) {
      baseField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
    }
 if (paletteField.type === 'external-list') {
    // Ouvrir immédiatement le dialog de configuration
    this.openExternalListConfig(baseField);
    return baseField;
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

      // Préparer les données du formulaire avec options nettoyées
      const formData: FormCreateRequest | FormUpdateRequest = {
        name: this.formSettingsForm.value.name!,
        description: this.formSettingsForm.value.description || '',
        userId: numericUserId,
        fields: this.formFields.map(f => {
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

          return {
            type: f.type,
            label: f.label,
            fieldName: f.fieldName || `field_${Date.now()}`,
            placeholder: f.placeholder,
            required: !!f.required,
            order: Number(f.order) || 0,
            options: cleanOptions
          };
        })
      };

      // Si formId existe => update, sinon create
      if (this.formId) {
        const updatePayload: FormUpdateRequest = {
          ...formData,
          status: this.currentForm?.status || 'DRAFT' // ou garder l'ancien status
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
