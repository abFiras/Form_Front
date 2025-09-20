import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormFieldDTO } from '../models/form.models';
import { ExternalListDTO, ExternalListService } from '../service/external-list.service';

interface ExternalListConfigData {
  field: FormFieldDTO;
}

@Component({
  selector: 'app-external-list-config',
  standalone: false,
  templateUrl: './external-list-config.component.html',
  styleUrls: ['./external-list-config.component.css']
})
export class ExternalListConfigComponent implements OnInit {
  configForm = new FormGroup({
    label: new FormControl('', Validators.required),
    fieldName: new FormControl('', Validators.required),
    placeholder: new FormControl(''),
    required: new FormControl(false),
    externalListId: new FormControl('', Validators.required),
    displayMode: new FormControl('select', Validators.required)
  });

  availableLists: ExternalListDTO[] = [];
  loading = false;
  displayModes = [
    { value: 'radio', label: 'Boutons radio' },
    { value: 'checkbox', label: 'Cases à cocher (sélection multiple)' }
  ];

  constructor(
    private dialogRef: MatDialogRef<ExternalListConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExternalListConfigData,
    private externalListService: ExternalListService
  ) {}

  ngOnInit(): void {
    this.loadExternalLists();
    this.initializeForm();
  }

  loadExternalLists(): void {
    this.loading = true;
    this.externalListService.getAllExternalLists().subscribe({
      next: (lists) => {
        this.availableLists = lists;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading external lists:', error);
        this.loading = false;
      }
    });
  }

 initializeForm(): void {
  if (this.data.field) {
    // ✅ Récupérer externalListId depuis attributes OU propriétés directes
    const externalListId = this.data.field.externalListId ||
                          this.data.field.attributes?.['externalListId'];

    const displayMode = this.data.field.externalListDisplayMode ||
                       this.data.field.attributes?.['externalListDisplayMode'] ||
                       'select';

    console.log('Initializing form with:', {
      externalListId,
      displayMode,
      field: this.data.field
    });

    this.configForm.patchValue({
      label: this.data.field.label,
      fieldName: this.data.field.fieldName,
      placeholder: this.data.field.placeholder || '',
      required: this.data.field.required,
      externalListId: externalListId?.toString() || '',
      displayMode: displayMode
    });
  }
}

onSave(): void {
  if (this.configForm.valid) {
    const formValue = this.configForm.value;

    // ✅ Créer une copie complète du field avec tous les attributs
    const updatedField: FormFieldDTO = {
      ...this.data.field,
      label: formValue.label!,
      fieldName: formValue.fieldName!,
      placeholder: formValue.placeholder || '',
      required: !!formValue.required,

      // ✅ CORRECTION: Stocker AUSSI dans les attributs pour la persistance
      attributes: {
        ...this.data.field.attributes,
        externalListId: formValue.externalListId!,
        externalListDisplayMode: formValue.displayMode!
      },

      // ✅ Propriétés directes pour compatibilité
      externalListId: parseInt(formValue.externalListId!),
      externalListDisplayMode: formValue.displayMode as 'select' | 'radio' | 'checkbox'
    };

    console.log('Saving external list config:', updatedField); // Debug
    this.dialogRef.close(updatedField);
  }
}

  onCancel(): void {
    this.dialogRef.close();
  }

  getSelectedListInfo(): string {
    const selectedId = this.configForm.get('externalListId')?.value;
    if (!selectedId) return '';

    const selectedList = this.availableLists.find(list => list.id?.toString() === selectedId);
    if (selectedList) {
      return `${selectedList.itemCount || 0} éléments - ${selectedList.listType}`;
    }
    return '';
  }
}
