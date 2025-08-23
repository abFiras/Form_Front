export interface FieldTypeConfig {
  type: string;
  label: string;
  icon: string;
  hasOptions: boolean;
  category: 'input' | 'select' | 'special';
}

export const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: 'text_fields',
    hasOptions: false,
    category: 'input'
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: 'notes',
    hasOptions: false,
    category: 'input'
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'email',
    hasOptions: false,
    category: 'input'
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'numbers',
    hasOptions: false,
    category: 'input'
  },
  {
    type: 'date',
    label: 'Date',
    icon: 'calendar_today',
    hasOptions: false,
    category: 'input'
  },
  {
    type: 'select',
    label: 'Select Dropdown',
    icon: 'arrow_drop_down',
    hasOptions: true,
    category: 'select'
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: 'radio_button_checked',
    hasOptions: true,
    category: 'select'
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: 'check_box',
    hasOptions: true,
    category: 'select'
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: 'attach_file',
    hasOptions: false,
    category: 'special'
  }
];

// Helper function to get field type config
export function getFieldTypeConfig(type: string): FieldTypeConfig | undefined {
  return FIELD_TYPES.find(fieldType => fieldType.type === type);
}

// Helper function to get field types by category
export function getFieldTypesByCategory(category: 'input' | 'select' | 'special'): FieldTypeConfig[] {
  return FIELD_TYPES.filter(fieldType => fieldType.category === category);
}