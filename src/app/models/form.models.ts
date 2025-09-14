// ✅ Modèles TypeScript corrigés pour supporter les listes externes

export interface FormDTO {
  id?: number;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED';
  fields: FormFieldDTO[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface FormFieldDTO {
  id?: number;
  type: FieldType;
  label: string;
  fieldName: string;
  placeholder?: string;
  required: boolean;
  order: number;
  cssClasses?: string;
  options?: FieldOptionDTO[];
  validationRules?: ValidationRule;

  // ✅ CORRECTION: attributes doit être flexible (string ou any)
  attributes?: { [key: string]: any }; // Changé de string vers any

  // ✅ Propriétés spécifiques aux listes externes (compatibilité)
  externalListId?: number;
  externalListDisplayMode?: 'select' | 'radio' | 'checkbox';
  externalListUrl?: string;
  externalListParams?: any;
}

export interface FieldOptionDTO {
  label: string;
  value: string;
}

export interface ValidationRule {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  email?: boolean;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'slider'
  | 'geolocation'
  | 'contact'
  | 'address'
  | 'reference'
  | 'audio'
  | 'drawing'
  | 'schema'
  | 'attachment'
  | 'signature'
  | 'barcode'
  | 'nfc'
  | 'separator'
  | 'table'
  | 'fixed-text'
  | 'image'
  | 'file-fixed'
  | 'calculation'
  | 'external-list';

export interface FormCreateRequest {
  name: string;
  description?: string;
  fields: FormFieldCreateDTO[]; // ✅ Utiliser un DTO spécialisé pour la création
  userId: number;
}

export interface FormUpdateRequest extends FormCreateRequest {
  status?: 'DRAFT' | 'PUBLISHED';
}

// ✅ NOUVEAU: DTO spécialisé pour la création/mise à jour des champs
export interface FormFieldCreateDTO {
  type: FieldType;
  label: string;
  fieldName: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: FieldOptionDTO[];
  attributes?: { [key: string]: any }; // ✅ Flexible pour tous types de données
}

export interface FormSubmissionRequest {
  data: { [key: string]: any };
}

export interface FormSubmissionDTO {
  id: number;
  formId: number;
  data: { [key: string]: any };
  submittedAt: string;
  submitterIp?: string;
  submitterId?: number;
}

export interface PaletteField {
  type: FieldType;
  label: string;
  icon: string;
}
