import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldOptionDTO, FieldType, FormCreateRequest, FormDTO, FormFieldCreateDTO, FormFieldDTO, FormUpdateRequest, PaletteField } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { GroupService, GroupDTO } from '../service/group.service'; // Nouveau import
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

  // Nouvelles propriétés pour les groupes
  availableGroups: GroupDTO[] = [];
  selectedGroups: number[] = [];
  loadingGroups = false;
currentUserGroup?: GroupDTO; // ✅ AJOUT : Groupe de l'utilisateur connecté

  formSettingsForm = new FormGroup({
    name: new FormControl('', Validators.required),
    secteur:new FormControl('', Validators.required),
    description: new FormControl(''),
  selectedGroups: new FormControl<number[]>([]) // explicitly typed
  });
getGroupName(groupId: number): string {
  const group = this.availableGroups.find(g => g.id === groupId);
  return group?.name || 'Groupe ' + groupId;
}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private groupService: GroupService, // Nouveau service
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('IsPreviewMode:', this.isPreviewMode);



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
              this.currentUserGroup = user.group; // ✅ Stocker le groupe de l'utilisateur
      this.loadAvailableGroups();

      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      }
    });
  }


  // Nouvelle méthode pour charger les groupes disponibles
  loadAvailableGroups(): void {
    this.loadingGroups = true;
    this.groupService.getAllActiveGroups().subscribe({
      next: (groups) => {
        this.availableGroups = groups;
        this.loadingGroups = false;

              // ✅ AJOUT : Inclure automatiquement le groupe de l'utilisateur

            if (this.currentUserGroup && !this.selectedGroups.includes(this.currentUserGroup.id)) {
        this.selectedGroups = [this.currentUserGroup.id, ...this.selectedGroups];
        this.formSettingsForm.get('selectedGroups')?.setValue(this.selectedGroups);
      }
        console.log('Groupes disponibles chargés:', groups);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des groupes:', error);
        this.snackBar.open('Erreur lors du chargement des groupes', 'Fermer', { duration: 3000 });
        this.loadingGroups = false;
      }
    });
  }

  loadForm(): void {
    if (this.formId) {
      this.formService.getFormById(this.formId).subscribe({
        next: (form) => {
          this.currentForm = form;

          // Mettre à jour les groupes sélectionnés
          if (form.assignedGroupIds && form.assignedGroupIds.length > 0) {
            this.selectedGroups = form.assignedGroupIds;
            this.formSettingsForm.get('selectedGroups')?.setValue(this.selectedGroups);
          }

          this.formFields = [...form.fields]
            .sort((a, b) => a.order - b.order)
            .map(field => {
              console.log('Processing field from server:', field);

              // Normalisation des options et attributs (code existant)
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

              // Traitement spécialisé pour external-list (code existant)
              if (field.type === 'external-list') {
                console.log('Processing external-list field:', field);
                console.log('Field attributes:', field.attributes);

                const externalListId = field.attributes['externalListId'];
                const displayMode = field.attributes['externalListDisplayMode'] || 'select';

                if (externalListId) {
                  field.externalListId = parseInt(externalListId.toString());
                }
                field.externalListDisplayMode = displayMode;
                field.externalListUrl = field.attributes['externalListUrl'] || '';
                field.externalListParams = field.attributes['externalListParams'] || {};

                console.log('External-list field after processing:', {
                  externalListId: field.externalListId,
                  displayMode: field.externalListDisplayMode,
                  url: field.externalListUrl,
                  params: field.externalListParams
                });
              }

              return field;
            });

          console.log('All processed fields:', this.formFields);

          this.formSettingsForm.patchValue({
            name: form.name,
            secteur:form.secteur,
            description: form.description,
            selectedGroups: this.selectedGroups
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

  // Nouvelle méthode pour gérer les changements de sélection de groupes


  // Méthode pour obtenir les noms des groupes sélectionnés (pour l'affichage)
  getSelectedGroupNames(): string[] {
    return this.availableGroups
      .filter(group => this.selectedGroups.includes(group.id))
      .map(group => group.name);
  }

  // Méthode pour vérifier si au moins un groupe est sélectionné
  hasSelectedGroups(): boolean {
    return this.selectedGroups.length > 0;
  }
// ✅ AJOUT : Méthode pour vérifier si un groupe peut être supprimé
canRemoveGroup(groupId: number): boolean {
  return !this.currentUserGroup || groupId !== this.currentUserGroup.id;
}
  // Méthode pour supprimer un groupe spécifique
removeGroup(groupId: number): void {

    // ✅ AJOUT : Empêcher la suppression du groupe de l'utilisateur
  if (this.currentUserGroup && groupId === this.currentUserGroup.id) {
    this.snackBar.open('Vous ne pouvez pas supprimer votre groupe par défaut', 'Fermer', { duration: 3000 });
    return;
  }

  // Empêcher la propagation de l'événement pour éviter les interactions indésirables
  event?.stopPropagation();

  // Supprimer le groupe de la liste des groupes sélectionnés
  this.selectedGroups = this.selectedGroups.filter(id => id !== groupId);

  // Mettre à jour le FormControl
  this.formSettingsForm.get('selectedGroups')?.setValue(this.selectedGroups);

  // Optionnel : Marquer le formulaire comme modifié
  this.formSettingsForm.markAsDirty();

  console.log('Groupe supprimé:', groupId, 'Groupes restants:', this.selectedGroups);

  // Afficher une confirmation
  const groupName = this.getGroupName(groupId);
  this.snackBar.open(`Groupe "${groupName}" retiré du formulaire`, 'Fermer', { duration: 2000 });
}

  // Code existant pour onFieldDrop, createFieldFromPalette, etc. (reste identique)
  onFieldDrop(event: CdkDragDrop<any[]>): void {
    console.log('Drop event:', event);
    console.log('Previous container ID:', event.previousContainer.id);
    console.log('Current container ID:', event.container.id);

    if (event.previousContainer === event.container) {
      console.log('Reordering within canvas');
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateFieldOrders();
    } else if (event.previousContainer.id === 'palette-list') {
      console.log('Adding from palette');
      const dragData = event.item.data;
      console.log('Drag data from palette:', dragData);

      if (dragData && dragData.type && dragData.label) {
        const paletteField: PaletteField = {
          type: dragData.type as FieldType,
          label: dragData.label,
          icon: dragData.icon || '🔹'
        };

        const newField = this.createFieldFromPalette(paletteField);
        console.log('Created new field:', newField);

        this.formFields.splice(event.currentIndex, 0, newField);
        this.updateFieldOrders();
        this.rebuildPreviewForm();

        this.snackBar.open(`${dragData.label} ajouté`, 'Fermer', { duration: 2000 });
      } else {
        console.error('Invalid drag data:', dragData);
      }
    } else {
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

  onFormNameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formSettingsForm.get('name')?.setValue(target.value);
  }

 private generateUniqueFieldName(baseType: string, existingFields: FormFieldDTO[]): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  const candidateName = `${baseType}_${timestamp}_${randomSuffix}`;

  // Vérifier l'unicité (peu probable mais sûr)
  const exists = existingFields.some(f => f.fieldName === candidateName);
  if (exists) {
    // Ajouter un compteur supplémentaire
    return `${candidateName}_${Math.floor(Math.random() * 1000)}`;
  }

  return candidateName;
}

// ✅ CORRECTION de createFieldFromPalette
createFieldFromPalette(paletteField: PaletteField): FormFieldDTO {
  // Générer un fieldName complètement unique
  const uniqueFieldName = this.generateUniqueFieldName(
    paletteField.type.replace('-', '_'),
    this.formFields
  );

  const baseField: FormFieldDTO = {
    type: paletteField.type,
    label: paletteField.label,
    fieldName: uniqueFieldName, // ✅ Utiliser le nom unique généré
    placeholder: `Enter ${paletteField.label.toLowerCase()}...`,
    required: false,
    order: this.formFields.length,
    attributes: {}
  };

  // Configuration spécifique selon le type de champ (code existant)
  switch (paletteField.type) {
    case 'external-list':
      baseField.placeholder = 'Sélectionnez une valeur...';
      baseField.attributes = {};
      baseField.attributes['externalListId'] = null;
      baseField.attributes['externalListDisplayMode'] = 'radio';
      baseField.attributes['externalListUrl'] = '';
      baseField.attributes['externalListParams'] = {};

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

    default:
      break;
  }

  console.log('Champ créé avec fieldName unique:', uniqueFieldName);
  return baseField;
}

openExternalListConfig(field: FormFieldDTO): void {
  const dialogRef = this.dialog.open(ExternalListConfigComponent, {
    width: '600px',
    data: { field }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Utilisateur a cliqué sur "Enregistrer"
      const fieldIndex = this.formFields.findIndex(f => f.fieldName === field.fieldName);
      if (fieldIndex >= 0) {
        this.formFields[fieldIndex] = result;
        this.rebuildPreviewForm();
      }
    } else {
      // Utilisateur a cliqué sur "Annuler" - supprimer le champ
      const fieldIndex = this.formFields.findIndex(f => f.fieldName === field.fieldName);
      if (fieldIndex >= 0) {
        this.onRemoveField(fieldIndex);
        console.log('Configuration annulée, champ supprimé');
      }
    }
  });
}

  // Méthode saveForm mise à jour avec support des groupes
 // Méthode saveForm améliorée dans form-builder.component.ts

// ✅ MÉTHODE SAVEFORM COMPLÈTEMENT CORRIGÉE
saveForm(): void {
  console.log('=== DÉBUT SAVEFORM ===');

  if (!this.formSettingsForm.valid) {
    this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
    return;
  }

  if (this.isSaving) {
    console.log('Sauvegarde déjà en cours, abandon');
    return;
  }
  this.isSaving = true;

  console.log('État actuel des champs AVANT traitement:', this.formFields.map(f => ({
    fieldName: f.fieldName,
    label: f.label,
    order: f.order
  })));

  // ✅ ÉTAPE 1: Nettoyage et validation des champs UNE SEULE FOIS
  const processedFields: FormFieldCreateDTO[] = [];
  const usedFieldNames = new Set<string>();

  for (let i = 0; i < this.formFields.length; i++) {
    const field = this.formFields[i];

    // Générer un fieldName absolument unique
    let uniqueFieldName = field.fieldName;
    if (!uniqueFieldName || uniqueFieldName.trim() === '' || usedFieldNames.has(uniqueFieldName)) {
      uniqueFieldName = this.generateAbsolutelyUniqueFieldName(field.type || 'field', i);
      console.log(`FieldName généré pour l'index ${i}: ${uniqueFieldName}`);
    }

    // Vérifier l'unicité une dernière fois
    while (usedFieldNames.has(uniqueFieldName)) {
      uniqueFieldName = this.generateAbsolutelyUniqueFieldName(field.type || 'field', i);
      console.log(`FieldName régénéré pour éviter doublon: ${uniqueFieldName}`);
    }

    usedFieldNames.add(uniqueFieldName);

    // Nettoyer les options
    let cleanOptions: FieldOptionDTO[] | undefined = undefined;
    if (field.options && Array.isArray(field.options) && field.options.length > 0) {
      cleanOptions = field.options
        .filter(opt => opt && opt.label && opt.label.trim() && opt.value && opt.value.trim())
        .map(opt => ({
          label: opt.label.trim(),
          value: opt.value.trim()
        }));
      if (cleanOptions.length === 0) {
        cleanOptions = undefined;
      }
    }

    // Nettoyer les attributs
    let cleanAttributes: { [key: string]: any } | undefined = undefined;
    if (field.attributes && Object.keys(field.attributes).length > 0) {
      cleanAttributes = { ...field.attributes };

      // Traitement spécial pour external-list
      if (field.type === 'external-list') {
        cleanAttributes['externalListId'] = field.externalListId?.toString() || null;
        cleanAttributes['externalListDisplayMode'] = field.externalListDisplayMode || 'select';
        cleanAttributes['externalListUrl'] = field.externalListUrl || '';
        cleanAttributes['externalListParams'] = field.externalListParams || {};
      }
    }

    // ✅ CRÉER UN SEUL OBJET PAR CHAMP
    const processedField: FormFieldCreateDTO = {
      type: field.type,
      label: field.label,
      fieldName: uniqueFieldName,
      placeholder: field.placeholder,
      required: !!field.required,
      order: i, // Utiliser l'index pour garantir l'ordre
      options: cleanOptions,
      attributes: cleanAttributes
    };

    processedFields.push(processedField);
  }

  // ✅ ÉTAPE 2: Validation finale - Vérifier qu'il n'y a pas de doublons
  const finalFieldNames = processedFields.map(f => f.fieldName);
  const uniqueFinalFieldNames = new Set(finalFieldNames);

  if (finalFieldNames.length !== uniqueFinalFieldNames.size) {
    this.isSaving = false;
    console.error('ERREUR: Des doublons subsistent dans les noms de champs!');
    console.error('Champs processés:', finalFieldNames);
    this.snackBar.open('Erreur interne: doublons détectés. Rechargez la page.', 'Fermer', { duration: 5000 });
    return;
  }

  console.log('Champs processés (UNIQUE):', processedFields.map(f => ({
    fieldName: f.fieldName,
    label: f.label,
    order: f.order
  })));

  // ✅ ÉTAPE 3: Préparer les données du formulaire
  this.authService.getCurrentUser().pipe(
    switchMap(user => {
      const numericUserId = Number(user.id);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid user ID');
      }

      const formData: FormCreateRequest | FormUpdateRequest = {
        name: this.formSettingsForm.value.name!,
        secteur: this.formSettingsForm.value.secteur!,
        description: this.formSettingsForm.value.description || '',
        userId: numericUserId,
        groupIds: [...this.selectedGroups], // ✅ Copie indépendante des groupes
        fields: processedFields // ✅ Liste unique de champs
      };

      console.log('=== DONNÉES FINALES À ENVOYER ===');
      console.log('Nom:', formData.name);
      console.log('secteur:', formData.secteur);
      console.log('Groupes sélectionnés:', formData.groupIds);
      console.log('Nombre de champs:', formData.fields.length);
      console.log('Noms des champs:', formData.fields.map(f => f.fieldName));
      console.log('=====================================');

      // ✅ ÉTAPE 4: Envoyer UNE SEULE REQUÊTE
      if (this.formId) {
        const updatePayload: FormUpdateRequest = {
          ...formData,
          status: this.currentForm?.status || 'DRAFT'
        };
        console.log('Envoi de la requête UPDATE...');
        return this.formService.updateForm(this.formId, updatePayload);
      } else {
        console.log('Envoi de la requête CREATE...');
        return this.formService.createForm(formData);
      }
    })
  ).subscribe({
    next: (form) => {
      this.isSaving = false;
      const message = this.formId ? 'Formulaire mis à jour avec succès' : 'Formulaire créé avec succès';
      this.snackBar.open(message, 'Fermer', { duration: 3000 });

      this.formSettingsForm.markAsPristine();
      this.currentForm = form;

      console.log('=== SUCCÈS SAUVEGARDE ===');
      console.log('Formulaire sauvé:', form.name);
      console.log('Champs retournés:', form.fields?.length || 0);

      // ✅ Recharger proprement
      if (this.formId) {
        this.loadForm();
                this.router.navigate(['/forms']);

      } else {
        this.formId = form.id;
       // this.router.navigate(['/forms', form.id, 'edit']);
               this.router.navigate(['/forms']);

      }
    },
    error: (error) => {
      this.isSaving = false;
      console.error('=== ERREUR SAUVEGARDE ===');
      console.error('Détails:', error);
      this.snackBar.open(`Erreur lors de l'enregistrement: ${error}`, 'Fermer', {
        duration: 5000
      });
    }
  });
}

// ✅ MÉTHODE pour générer des noms absolument uniques
private generateAbsolutelyUniqueFieldName(baseType: string, index: number): string {
  const cleanType = baseType.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 8);
  return `${cleanType}_${index}_${timestamp}_${randomSuffix}`;
}

// ✅ MÉTHODE de debug pour identifier les problèmes
debugCurrentState(): void {
  console.log('=== DEBUG STATE ACTUEL ===');
  console.log('Groupes sélectionnés:', this.selectedGroups);
  console.log('Nombre de champs:', this.formFields.length);

  const fieldNameCounts = new Map<string, number>();
  this.formFields.forEach(field => {
    const count = fieldNameCounts.get(field.fieldName) || 0;
    fieldNameCounts.set(field.fieldName, count + 1);
  });

  console.log('Comptage des noms de champs:');
  fieldNameCounts.forEach((count, fieldName) => {
    if (count > 1) {
      console.error(`❌ DOUBLON: "${fieldName}" apparaît ${count} fois`);
    } else {
      console.log(`✅ "${fieldName}" - unique`);
    }
  });
  console.log('==========================');
}

// ✅ MÉTHODE onGroupSelectionChange CORRIGÉE
onGroupSelectionChange(event: any): void {
  console.log('Changement de sélection des groupes:', event.value);

  let newSelection = [...event.value];

  // ✅ AJOUT : S'assurer que le groupe de l'utilisateur est toujours inclus
  if (this.currentUserGroup && !newSelection.includes(this.currentUserGroup.id)) {
    newSelection.unshift(this.currentUserGroup.id); // Ajouter au début

    // Afficher un message d'information
    this.snackBar.open(
      'Votre groupe par défaut ne peut pas être désélectionné',
      'Fermer',
      { duration: 3000 }
    );
  }

  this.selectedGroups = newSelection;
  this.formSettingsForm.markAsDirty();

  console.log('Nouveaux groupes sélectionnés:', this.selectedGroups);
}

// ✅ MÉTHODE DE DEBUG pour identifier les problèmes
debugFieldNames(): void {
  console.log('=== DEBUG FIELD NAMES ===');
  this.formFields.forEach((field, index) => {
    console.log(`Index ${index}: fieldName="${field.fieldName}", label="${field.label}", order=${field.order}`);
  });

  const fieldNames = this.formFields.map(f => f.fieldName);
  const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    console.error('DOUBLONS DÉTECTÉS:', duplicates);
  } else {
    console.log('Aucun doublon détecté');
  }
  console.log('=== FIN DEBUG ===');
}

// Ajoutez cette propriété dans votre composant
private isSaving = false;

  // Autres méthodes existantes (hasOptions, updateFieldOrders, onFieldChange, etc.)
  hasOptions(fieldType: FieldType): boolean {
    return ['select', 'radio', 'checkbox'].includes(fieldType);
  }

 updateFieldOrders(): void {
  this.formFields.forEach((field, index) => {
    field.order = index;
  });

  // Log pour debug
  console.log('Ordres des champs mis à jour:',
    this.formFields.map(f => ({ name: f.fieldName, order: f.order })));
}

// ✅ AMÉLIORATION de onFieldChange
onFieldChange(index: number, updatedField: FormFieldDTO): void {
  if (index >= 0 && index < this.formFields.length) {
    this.formFields[index] = updatedField;
    this.rebuildPreviewForm();

    // Marquer comme modifié
    this.formSettingsForm.markAsDirty();

    console.log('Champ modifié à l\'index:', index, 'Nom:', updatedField.fieldName);
  } else {
    console.error('Index invalide pour la modification de champ:', index);
  }
}
onRemoveField(index: number): void {
  if (index < 0 || index >= this.formFields.length) {
    console.error('Index invalide pour la suppression:', index);
    return;
  }

  const removedField = this.formFields[index];
  const fieldName = removedField.fieldName;

  // Supprimer le champ du tableau
  this.formFields.splice(index, 1);

  // ✅ IMPORTANT: Mettre à jour les ordres après suppression
  this.updateFieldOrders();

  // Reconstruire le formulaire de prévisualisation
  this.rebuildPreviewForm();

  // ✅ Marquer le formulaire comme modifié pour déclencher la sauvegarde
  this.formSettingsForm.markAsDirty();

  console.log('Champ supprimé:', fieldName, 'Champs restants:', this.formFields.length);

  this.snackBar.open(`Champ "${removedField.label}" supprimé`, 'Fermer', {
    duration: 2000
  });
}
  rebuildPreviewForm(): void {
    const controls: { [key: string]: FormControl } = {};

    this.formFields.forEach(field => {
      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      controls[field.fieldName] = new FormControl('', validators);
    });

    this.previewForm = new FormGroup(controls);
  }

  publishForm(): void {
    if (this.formId) {
      this.formService.publishForm(this.formId).subscribe({
        next: (form) => {
          this.snackBar.open('Formulaire publié avec succès', 'Fermer', { duration: 3000 });
          this.currentForm = form;
            this.router.navigate(['/public/forms', this.formId]);

        //  this.showPublicUrl();
        },
        error: (error) => {
          console.error('Error publishing form:', error);
          this.snackBar.open('Error publishing form', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  showPublicUrl(): void {
    if (this.formId) {
      const publicUrl = this.formService.getPublicFormUrl(this.formId);

      const message = `Formulaire publié! URL publique: ${publicUrl}`;
      const snackBarRef = this.snackBar.open(message, 'Copier URL', {
        duration: 10000,
        panelClass: ['success-snackbar']
      });

      snackBarRef.onAction().subscribe(() => {
        navigator.clipboard.writeText(publicUrl).then(() => {
          this.snackBar.open('URL copiée dans le presse-papier', 'Fermer', { duration: 2000 });
        });
      });
    }
  }

  previewPublicForm(): void {
    if (this.formId && this.currentForm?.status === 'PUBLISHED') {
      const publicUrl = `/public/forms/${this.formId}`;
      window.open(publicUrl, '_blank');
    } else {
      this.snackBar.open('Le formulaire doit être publié pour être prévisualisé', 'Fermer', { duration: 3000 });
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

  getCharacterCount(): number {
    const nameValue = this.formSettingsForm.get('name')?.value || '';
    return nameValue.length;
  }

  togglePreviewMode(): void {
    this.isPreviewMode = !this.isPreviewMode;
    if (this.isPreviewMode) {
      this.rebuildPreviewForm();
    }
  }

  createDragData(type: string, label: string): any {
    return {
      type: type,
      label: label,
      icon: this.getFieldIcon(type)
    };
  }

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
      'external-list': 'list_alt'
    };

    return iconMap[type] || 'help_outline';
  }

  get nameFormControl(): FormControl {
    return this.formSettingsForm.get('name') as FormControl;
  }
}
