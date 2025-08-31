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
  externalListId?: number; // ID de la liste externe à utiliser
  externalListDisplayMode?: 'select' | 'radio' | 'checkbox'; // Mode d'affichage
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
  | 'external-list'; // ✅ Nouveau type ajouté


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
