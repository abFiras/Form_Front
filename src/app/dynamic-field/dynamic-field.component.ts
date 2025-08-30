import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormFieldDTO } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-dynamic-field',
  standalone: false,
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.css' ,

})
export class DynamicFieldComponent implements OnInit {
  @Input() field!: FormFieldDTO;
  @Input() isPreview = false;
@Input() formGroup!: FormGroup;
  @Output() fieldChange = new EventEmitter<FormFieldDTO>();
  @Output() removeField = new EventEmitter<void>();

  editMode = false;
  editForm = new FormGroup({
    label: new FormControl('', Validators.required),
    placeholder: new FormControl(''),
    required: new FormControl(false),
    options: new FormControl('')
  });

  ngOnInit(): void {
    this.updateEditForm();
    if (this.formGroup && !this.formGroup.get(this.field.fieldName)) {
      this.addControlToForm();
    }
  }

  updateEditForm(): void {
    this.editForm.patchValue({
      label: this.field.label,
      placeholder: this.field.placeholder || '',
      required: this.field.required,
      options: this.field.options?.map(opt => `${opt.label}:${opt.value}`).join('\n') || ''
    });
  }

  addControlToForm(): void {
    if (!this.formGroup) return;

    const validators = this.field.required ? [Validators.required] : [];
    const control = new FormControl('', validators);
    this.formGroup.addControl(this.field.fieldName, control);
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.updateEditForm();
    }
  }

  saveChanges(): void {
    if (this.editForm.valid) {
      const updatedField: FormFieldDTO = {
        ...this.field,
        label: this.editForm.value.label!,
        placeholder: this.editForm.value.placeholder || '',
        required: this.editForm.value.required || false
      };

      // Handle options for select/radio/checkbox
      if (['select', 'radio', 'checkbox'].includes(this.field.type)) {
        const optionsText = this.editForm.value.options || '';
        updatedField.options = optionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [label, value] = line.split(':');
            return { label: label.trim(), value: (value || label).trim() };
          });
      }

      this.field = updatedField;
      this.fieldChange.emit(updatedField);
      this.editMode = false;
    }
  }

  remove(): void {
    this.removeField.emit();
  }

  hasOptions(): boolean {
    return ['select', 'radio', 'checkbox'].includes(this.field.type);
  }
}
