// ✅ Interfaces TypeScript corrigées pour correspondre au backend

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
  fieldName: string; // ✅ Ajouté fieldName
  placeholder?: string;
  required: boolean;
  order: number;
  cssClasses?: string;
  options?: FieldOptionDTO[]; // ✅ Type correct : tableau d'objets
  validationRules?: ValidationRule;
  attributes?: { [key: string]: string };
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
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface FormCreateRequest {
  name: string;
  description?: string;
  fields: FormFieldDTO[];
  userId: number; // ✅ Ajouté userId pour la création
}

export interface FormUpdateRequest extends FormCreateRequest {
  status?: 'DRAFT' | 'PUBLISHED';
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
