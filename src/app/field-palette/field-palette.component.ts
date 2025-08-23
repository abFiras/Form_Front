import { Component } from '@angular/core';
import { CdkDragStart } from '@angular/cdk/drag-drop';
import { FIELD_TYPES, FieldTypeConfig } from '../config/field-types.config';
import { FormBuilderService } from '../service/FormBuilderService';
import { PaletteField } from '../models/form.models';

@Component({
  selector: 'app-field-palette',
  standalone: false,
  templateUrl: './field-palette.component.html',
  styleUrl: './field-palette.component.css'
})
export class FieldPaletteComponent {
  availableFields: PaletteField[] = [
    { type: 'text', label: 'Text Input', icon: 'text_fields' },
    { type: 'textarea', label: 'Textarea', icon: 'notes' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'number', label: 'Number', icon: 'numbers' },
    { type: 'date', label: 'Date', icon: 'calendar_today' },
    { type: 'select', label: 'Select', icon: 'arrow_drop_down' },
    { type: 'radio', label: 'Radio', icon: 'radio_button_checked' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'file', label: 'File Upload', icon: 'upload_file' }
  ];
}
