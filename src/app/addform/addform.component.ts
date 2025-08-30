import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormService } from '../service/FormService';
import { FieldOptionDTO, FormDTO } from '../models/form.models';

@Component({
  selector: 'app-addform',
  standalone: false,
  templateUrl: './addform.component.html',
  styleUrl: './addform.component.css'
})

export class AddformComponent implements OnInit {
  formBuilderForm!: FormGroup;
  previewFormGroup!: FormGroup;
  isLoading = false;
  isEditMode = false;
  formId?: number;
  isDraggedOver = false;
  expandedField: number | null = null;
  draggedtype: string = '';

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.checkEditMode();
  }

  private initializeForms(): void {
    this.formBuilderForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1000)]],
      fields: this.fb.array([])
    });

    this.previewFormGroup = this.fb.group({});

    // Subscribe to form changes to update preview
    this.formBuilderForm.valueChanges.subscribe(() => {
      this.updatePreviewForm();
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.formId = +id;
      this.loadForm(this.formId);
    }
  }

  goBack(): void {
    this.router.navigate(['/connexion']);
  }

  private loadForm(id: number): void {
    this.isLoading = true;
    this.formService.getFormById(id).subscribe({
      next: (form: FormDTO) => {
        this.populateForm(form);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading form:', error);
        this.isLoading = false;
        // Handle error (show toast, redirect, etc.)
      }
    });
  }

  private populateForm(form: FormDTO): void {
    this.formBuilderForm.patchValue({
      name: form.name,
      description: form.description
    });

    // Clear existing fields
    while (this.fieldsArray.length) {
      this.fieldsArray.removeAt(0);
    }

    // Add fields from loaded form
    form.fields.forEach((field, index) => {
      this.addField(field.type);
      const fieldGroup = this.fieldsArray.at(index) as FormGroup;

      fieldGroup.patchValue({
        type: field.type,
        label: field.label,
        fieldName: field.fieldName,
        placeholder: field.placeholder,
        required: field.required,
        order: field.order,
        cssClasses: field.cssClasses
      });

      // Add options if field has them
      if (field.options && field.options.length > 0) {
        const optionsArray = fieldGroup.get('options') as FormArray;
        field.options.forEach(option => {
          optionsArray.push(this.createOptionGroup(option));
        });
      }

      // Set validation rules
      if (field.validationRules) {
        fieldGroup.get('validationRules')?.setValue(field.validationRules);
      }
    });
  }

  get fieldsArray(): FormArray {
    return this.formBuilderForm.get('fields') as FormArray;
  }

  getOptionsArray(fieldIndex: number): FormArray {
    return this.fieldsArray.at(fieldIndex).get('options') as FormArray;
  }

  // Drag and Drop Methods
  onDragStart(event: DragEvent, type: string): void {
    this.draggedtype = type;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', type);
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedtype = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggedOver = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggedOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggedOver = false;

    const type = event.dataTransfer?.getData('text/plain');
    if (type) {
      this.addField(type);
    }
  }

  // Field reordering with CDK Drag Drop
  onFieldReorder(event: CdkDragDrop<string[]>): void {
    const fieldsArray = this.fieldsArray;
    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;

    // Move the form control
    const fieldToMove = fieldsArray.at(fromIndex);
    fieldsArray.removeAt(fromIndex);
    fieldsArray.insert(toIndex, fieldToMove);

    // Update field orders
    this.updateFieldOrders();
    this.updatePreviewForm();
  }

  addField(type?: string): void {
    const fieldGroup = this.fb.group({
      type: [type || '', Validators.required],
      label: ['', Validators.required],
      fieldName: ['', Validators.required],
      placeholder: [''],
      required: [false],
      order: [this.fieldsArray.length],
      cssClasses: [''],
      options: this.fb.array([]),
      validationRules: [{}]
    });

    this.fieldsArray.push(fieldGroup);

    // Set default values based on field type
    if (type) {
      this.setDefaultFieldValues(fieldGroup, type);
    }

    // Add default options for SELECT and RADIO fields
    if (type === 'SELECT' || type === 'RADIO') {
      const newFieldIndex = this.fieldsArray.length - 1;
      this.addOption(newFieldIndex);
      this.addOption(newFieldIndex);
    }

    // Auto-expand the newly added field
    this.expandedField = this.fieldsArray.length - 1;

    this.updatePreviewForm();
  }

  private setDefaultFieldValues(fieldGroup: FormGroup, type: string): void {
    const defaultValues: { [key: string]: any } = {
      'TEXT': {
        label: 'Text Input',
        fieldName: 'text_input',
        placeholder: 'Enter text'
      },
      'EMAIL': {
        label: 'Email Address',
        fieldName: 'email',
        placeholder: 'Enter email address'
      },
      'NUMBER': {
        label: 'Number',
        fieldName: 'number',
        placeholder: 'Enter number'
      },
      'TEXTAREA': {
        label: 'Text Area',
        fieldName: 'textarea',
        placeholder: 'Enter detailed text'
      },
      'SELECT': {
        label: 'Select Option',
        fieldName: 'select_option',
        placeholder: 'Choose an option'
      },
      'RADIO': {
        label: 'Radio Buttons',
        fieldName: 'radio_choice',
        placeholder: ''
      },
      'CHECKBOX': {
        label: 'Checkbox',
        fieldName: 'checkbox',
        placeholder: ''
      },
      'DATE': {
        label: 'Date',
        fieldName: 'date',
        placeholder: ''
      }
    };

    const defaults = defaultValues[type];
    if (defaults) {
      fieldGroup.patchValue(defaults);
    }
  }

  removeField(index: number): void {
    this.fieldsArray.removeAt(index);
    this.updateFieldOrders();
    this.updatePreviewForm();

    // Reset expanded field if it was the removed one
    if (this.expandedField === index) {
      this.expandedField = null;
    } else if (this.expandedField !== null && this.expandedField > index) {
      this.expandedField--;
    }
  }

  toggleFieldSettings(index: number): void {
    this.expandedField = this.expandedField === index ? null : index;
  }

  onFieldChange(): void {
    this.updatePreviewForm();
  }

  moveFieldUp(index: number): void {
    if (index > 0) {
      const fieldToMove = this.fieldsArray.at(index);
      this.fieldsArray.removeAt(index);
      this.fieldsArray.insert(index - 1, fieldToMove);
      this.updateFieldOrders();

      // Update expanded field index
      if (this.expandedField === index) {
        this.expandedField = index - 1;
      }
    }
  }

  moveFieldDown(index: number): void {
    if (index < this.fieldsArray.length - 1) {
      const fieldToMove = this.fieldsArray.at(index);
      this.fieldsArray.removeAt(index);
      this.fieldsArray.insert(index + 1, fieldToMove);
      this.updateFieldOrders();

      // Update expanded field index
      if (this.expandedField === index) {
        this.expandedField = index + 1;
      }
    }
  }

  private updateFieldOrders(): void {
    this.fieldsArray.controls.forEach((control, index) => {
      control.get('order')?.setValue(index);
    });
  }

  ontypeChange(fieldIndex: number): void {
    const field = this.fieldsArray.at(fieldIndex);
    const type = field.get('type')?.value;
    const optionsArray = field.get('options') as FormArray;

    // Clear existing options
    while (optionsArray.length) {
      optionsArray.removeAt(0);
    }

    // Add default options for SELECT and RADIO fields
    if (type === 'SELECT' || type === 'RADIO') {
      this.addOption(fieldIndex);
      this.addOption(fieldIndex);
    }

    this.updatePreviewForm();
  }

  addOption(fieldIndex: number): void {
    const optionsArray = this.getOptionsArray(fieldIndex);
    const optionNumber = optionsArray.length + 1;
    optionsArray.push(this.createOptionGroup({
      value: `option${optionNumber}`,
      label: `Option ${optionNumber}`,
    }));
  }

  removeOption(fieldIndex: number, optionIndex: number): void {
    const optionsArray = this.getOptionsArray(fieldIndex);
    optionsArray.removeAt(optionIndex);
  }

  private createOptionGroup(option?: FieldOptionDTO): FormGroup {
    return this.fb.group({
      value: [option?.value || '', Validators.required],
      label: [option?.label || '', Validators.required],
    });
  }

  updateValidationRule(fieldIndex: number, ruleName: string, event: any): void {
    const field = this.fieldsArray.at(fieldIndex);
    const currentRules = field.get('validationRules')?.value || {};
    const value = event.target.value;

    if (value) {
      currentRules[ruleName] = +value; // Convert to number
    } else {
      delete currentRules[ruleName];
    }

    field.get('validationRules')?.setValue(currentRules);
  }

  // Helper methods for template
  getFieldIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'TEXT': 'fa fa-font',
      'EMAIL': 'fa fa-envelope',
      'NUMBER': 'fa fa-hashtag',
      'TEXTAREA': 'fa fa-align-left',
      'SELECT': 'fa fa-list',
      'RADIO': 'fa fa-dot-circle',
      'CHECKBOX': 'fa fa-check-square',
      'DATE': 'fa fa-calendar'
    };
    return icons[type] || 'fa fa-question';
  }

  gettypeName(type: string): string {
    const names: { [key: string]: string } = {
      'TEXT': 'Text Input',
      'EMAIL': 'Email',
      'NUMBER': 'Number',
      'TEXTAREA': 'Textarea',
      'SELECT': 'Select',
      'RADIO': 'Radio',
      'CHECKBOX': 'Checkbox',
      'DATE': 'Date'
    };
    return names[type] || 'Unknown';
  }

  private updatePreviewForm(): void {
    const previewControls: { [key: string]: AbstractControl } = {};

    this.fieldsArray.controls.forEach((field, index) => {
      const type = field.get('type')?.value;
      const required = field.get('required')?.value;

      let validators = [];
      if (required) {
        validators.push(Validators.required);
      }

      const validationRules = field.get('validationRules')?.value;
      if (validationRules) {
        if (validationRules.minLength) {
          validators.push(Validators.minLength(validationRules.minLength));
        }
        if (validationRules.maxLength) {
          validators.push(Validators.maxLength(validationRules.maxLength));
        }
        if (validationRules.min) {
          validators.push(Validators.min(validationRules.min));
        }
        if (validationRules.max) {
          validators.push(Validators.max(validationRules.max));
        }
      }

      if (type === 'EMAIL') {
        validators.push(Validators.email);
      }

      previewControls[`field_${index}`] = this.fb.control('', validators);
    });

    this.previewFormGroup = this.fb.group(previewControls);
  }

  previewForm(): void {
    // You can implement a modal or navigate to a preview page
    console.log('Preview form data:', this.formBuilderForm.value);
  }

  saveDraft(): void {
    if (this.formBuilderForm.get('name')?.invalid) {
      this.formBuilderForm.get('name')?.markAsTouched();
      return;
    }

    const formData = this.prepareFormData();
    formData.status = 'DRAFT';

    this.saveFormData(formData);
  }

  saveForm(): void {
    if (this.formBuilderForm.invalid) {
      this.markFormGroupTouched(this.formBuilderForm);
      return;
    }

    const formData = this.prepareFormData();
    this.saveFormData(formData);
  }

  private prepareFormData(): any {
    const formValue = this.formBuilderForm.value;

    // Process fields data
    const fields = formValue.fields.map((field: any, index: number) => ({
      type: field.type,
      label: field.label,
      fieldName: field.fieldName || this.generateFieldName(field.label),
      placeholder: field.placeholder,
      required: field.required,
      order: index,
      cssClasses: field.cssClasses,
      options: field.options || [],
      validationRules: field.validationRules || {},
      attributes: {}
    }));

    return {
      name: formValue.name,
      description: formValue.description,
      fields: fields
    };
  }

  private generateFieldName(label: string): string {
    return label.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private saveFormData(formData: any): void {
    this.isLoading = true;

    const request = this.isEditMode ?
      this.formService.updateForm(this.formId!, formData) :
      this.formService.createForm(formData);

    request.subscribe({
      next: (response: FormDTO) => {
        console.log('Form saved successfully:', response);
        this.isLoading = false;
        // Navigate to forms list or show success message
        this.router.navigate(['/forms']);
      },
      error: (error) => {
        console.error('Error saving form:', error);
        this.isLoading = false;
        // Handle error (show toast, etc.)
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }
}
