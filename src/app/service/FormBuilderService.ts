import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormFieldDTO } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  private formFieldsSubject = new BehaviorSubject<FormFieldDTO[]>([]);
  private selectedFieldSubject = new BehaviorSubject<FormFieldDTO | null>(null);

  public formFields$: Observable<FormFieldDTO[]> = this.formFieldsSubject.asObservable();
  public selectedField$: Observable<FormFieldDTO | null> = this.selectedFieldSubject.asObservable();

  constructor() {}

  // Get current form fields
  getFormFields(): FormFieldDTO[] {
    return this.formFieldsSubject.value;
  }

  // Set form fields
  setFormFields(fields: FormFieldDTO[]): void {
    this.formFieldsSubject.next(fields);
  }

  // Add a new field
  addField(field: FormFieldDTO): void {
    const currentFields = this.getFormFields();
    const newFields = [...currentFields, field];
    this.setFormFields(newFields);
  }

  // Update an existing field
  updateField(updatedField: FormFieldDTO): void {
    const currentFields = this.getFormFields();
    const index = currentFields.findIndex(field => field.order === updatedField.order);
    
    if (index > -1) {
      const newFields = [...currentFields];
      newFields[index] = updatedField;
      this.setFormFields(newFields);
      
      // Update selected field if it's the same one
      const currentSelected = this.selectedFieldSubject.value;
      if (currentSelected && currentSelected.order === updatedField.order) {
        this.selectedFieldSubject.next(updatedField);
      }
    }
  }

  // Remove a field
  removeField(order: number): void {
    const currentFields = this.getFormFields();
    const newFields = currentFields.filter(field => field.order !== order);
    
    // Reorder remaining fields
    newFields.forEach((field, index) => {
      field.order = index + 1;
    });
    
    this.setFormFields(newFields);
    
    // Clear selection if the removed field was selected
    const currentSelected = this.selectedFieldSubject.value;
    if (currentSelected && currentSelected.order === order) {
      this.selectField(null);
    }
  }

  // Select a field for editing
  selectField(field: FormFieldDTO | null): void {
    this.selectedFieldSubject.next(field);
  }

  // Get currently selected field
  getSelectedField(): FormFieldDTO | null {
    return this.selectedFieldSubject.value;
  }

  // Clear all fields
  clearFields(): void {
    this.setFormFields([]);
    this.selectField(null);
  }

  // Reorder fields
  reorderFields(fields: FormFieldDTO[]): void {
    const reorderedFields = fields.map((field, index) => ({
      ...field,
      order: index + 1
    }));
    this.setFormFields(reorderedFields);
  }

  // Find field by order
  findFieldByOrder(order: number): FormFieldDTO | undefined {
    return this.getFormFields().find(field => field.order === order);
  }

  // Find field by field name
  findFieldByName(fieldName: string): FormFieldDTO | undefined {
    return this.getFormFields().find(field => field.fieldName === fieldName);
  }

  // Generate unique field name
  generateUniqueFieldName(baseLabel: string): string {
    const baseName = baseLabel.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const currentFields = this.getFormFields();
    let fieldName = baseName;
    let counter = 1;
    
    while (currentFields.some(f => f.fieldName === fieldName)) {
      fieldName = `${baseName}_${counter}`;
      counter++;
    }
    
    return fieldName;
  }

  // Get next available order
  getNextOrder(): number {
    const currentFields = this.getFormFields();
    return currentFields.length > 0 ? Math.max(...currentFields.map(f => f.order)) + 1 : 1;
  }

  // Validate field name uniqueness
  isFieldNameUnique(fieldName: string, excludeOrder?: number): boolean {
    const currentFields = this.getFormFields();
    return !currentFields.some(field => 
      field.fieldName === fieldName && field.order !== excludeOrder
    );
  }
}