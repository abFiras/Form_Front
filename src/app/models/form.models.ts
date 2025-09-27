// form.models.ts - Modèles TypeScript corrigés avec gestion des groupes

export interface FormDTO {
  id?: number;
  name: string;
  secteur: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fields: FormFieldDTO[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;


  // ✅ NOUVEAU : Gestion des groupes
  assignedGroupIds?: number[];
  assignedGroups?: GroupDTO[];

  // ✅ NOUVEAU : Indicateurs d'accès
  isAccessible?: boolean;
  canEdit?: boolean;

  isInLibrary?: boolean;
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
  attributes?: { [key: string]: any };
  geoData?: any; // Pour stocker temporairement les données de géolocalisation

  // ✅ Propriétés spécifiques aux listes externes
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

// ✅ NOUVEAU : DTO pour les groupes
export interface GroupDTO {
  id: number;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
}

// ✅ NOUVEAU : Requête de création avec groupes
export interface FormCreateRequest {
  name: string;
  description?: string;
  secteur: string;
  fields: FormFieldCreateDTO[];
  userId?: number; // Sera rempli automatiquement côté service
  groupIds?: number[]; // ✅ Groupes assignés au formulaire
}

export interface FormUpdateRequest extends FormCreateRequest {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  groupIds?: number[]; // ✅ Permet de modifier les groupes
}

export interface FormFieldCreateDTO {
  type: FieldType;
  label: string;
  fieldName: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: FieldOptionDTO[];
  attributes?: { [key: string]: any };
}

export interface FormSubmissionRequest {
  data: { [key: string]: any };
  email?: string;
}

export interface FormSubmissionResponseDTO {
  id: number;
  formId: number;
  data: { [key: string]: any };
  status?: string;
  submittedAt: string;
  submitterEmail?: string;
  submitterIp?: string;
  submitterId?: number;
  submitterName?: string;
  expanded?: boolean;
  isTemplate?: boolean; // ✅ Pour distinguer templates des vraies soumissions

  // ✅ NOUVEAU : Infos du formulaire
  formName?: string;
  formDescription?: string;
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

// ✅ NOUVEAU : Interface pour les réponses API
export interface ApiResponse<T> {
  message: string;
  data: T;
  success: boolean;
  timestamp?: string;
}

// ✅ NOUVEAU : Interface pour assigner des groupes
export interface AssignGroupsRequest {
  groupIds: number[];
}

// ✅ NOUVEAU : Interface pour les statistiques
export interface FormStatistics {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalSubmissions: number;
  recentSubmissions: number;
}
