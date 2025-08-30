import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormFieldDTO } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dynamic-field',
  standalone: false,
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.css',
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
    // Ensure options is always an array
    this.normalizeFieldOptions();
    this.updateEditForm();
    if (this.formGroup && !this.formGroup.get(this.field.fieldName)) {
      this.addControlToForm();
    }
  }

  // NEW: Method to ensure options is always an array
  normalizeFieldOptions(): void {
    if (this.field.options) {
      // If options is a string (JSON), parse it
      if (typeof this.field.options === 'string') {
        try {
          this.field.options = JSON.parse(this.field.options);
        } catch (e) {
          console.error('Error parsing field options:', e);
          this.field.options = [];
        }
      }
      // If it's not an array, convert it to an empty array
      if (!Array.isArray(this.field.options)) {
        this.field.options = [];
      }
    } else if (this.hasOptions()) {
      // Initialize with empty array for fields that should have options
      this.field.options = [];
    }
  }

  updateEditForm(): void {
    // Ensure options is an array before calling map
    const optionsArray = Array.isArray(this.field.options) ? this.field.options : [];

    this.editForm.patchValue({
      label: this.field.label,
      placeholder: this.field.placeholder || '',
      required: this.field.required,
      options: optionsArray.map(opt => `${opt.label}:${opt.value}`).join('\n') || ''
    });
  }

  addControlToForm(): void {
    if (!this.formGroup) return;

    const validators = this.field.required ? [Validators.required] : [];

    // Add main control
    const control = new FormControl('', validators);
    this.formGroup.addControl(this.field.fieldName, control);

    // Add additional controls for complex fields
    if (this.field.type === 'contact') {
      this.formGroup.addControl(this.field.fieldName + '_name', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_phone', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_email', new FormControl(''));
    }

    if (this.field.type === 'address') {
      this.formGroup.addControl(this.field.fieldName + '_zip', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_city', new FormControl(''));
    }
  }

  // Method to get current location for geolocation field
  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          this.formGroup.get(this.field.fieldName)?.setValue(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
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

  // NEW: Getter to safely access options as array
  get safeOptions() {
    return Array.isArray(this.field.options) ? this.field.options : [];
  }
}
