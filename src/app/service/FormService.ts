// form.service.ts - Version corrigée pour éviter les erreurs NaN
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  FormDTO,
  FormCreateRequest,
  FormUpdateRequest,
  FormSubmissionRequest,
  FormSubmissionResponseDTO,
  ApiResponse,
  AssignGroupsRequest
} from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private readonly baseUrl = 'http://localhost:8080/api/forms';

  constructor(private http: HttpClient) {}

/**
 * Partage un formulaire vers la bibliothèque
 */
/**
 * Mettre à jour les attributs d'un champ
 */
updateFieldAttributes(fieldId: number, attributes: any): Observable<ApiResponse<string>> {
  return this.http.put<ApiResponse<string>>(`${this.baseUrl}/form-fields/${fieldId}/attributes`, {
    attributes: attributes
  }).pipe(
    catchError(error => {
      console.error('Erreur mise à jour attributs champ:', error);
      return throwError(() => error);
    })
  );
}
shareFormToLibrary(formId: number, request: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/${formId}/share-to-library`, request);
}
  downloadSubmissionAsWord(formId: number, submissionId: number): Observable<Blob> {
  const url = `${this.baseUrl}/${formId}/submissions/${submissionId}/download/word`;

  return this.http.get(url, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }).pipe(
    catchError(error => {
      console.error('Erreur téléchargement Word soumission:', error);
      throw error;
    })
  );
}
  // ✅ NOUVELLE MÉTHODE : Télécharger formulaire en Word avec userId
downloadFormAsWord(formId: number, userId: number): Observable<Blob> {
  const url = `${this.baseUrl}/forms/${formId}/download/word?userId=${userId}`;

  return this.http.get(url, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }).pipe(
    catchError(error => {
      console.error('Erreur téléchargement Word:', error);
      throw error;
    })
  );
}

  // ✅ MÉTHODE UTILITAIRE : Valider les IDs
  private validateFormId(formId: number | string | undefined | null): number {
    if (formId === undefined || formId === null) {
      throw new Error('ID de formulaire manquant');
    }

    const numericId = Number(formId);

    if (isNaN(numericId) || numericId <= 0) {
      throw new Error(`ID de formulaire invalide: ${formId}`);
    }

    return numericId;
  }

  // ✅ CRÉER UN FORMULAIRE
  createForm(request: FormCreateRequest): Observable<FormDTO> {
    return this.http.post<ApiResponse<FormDTO>>(`${this.baseUrl}`, request)
      .pipe(
        map(response => {
          console.log('Formulaire créé avec succès:', response);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  // ✅ OBTENIR TOUS LES FORMULAIRES
  getAllForms(): Observable<FormDTO[]> {
    return this.http.get<ApiResponse<FormDTO[]>>(`${this.baseUrl}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // ✅ OBTENIR LES FORMULAIRES PUBLIÉS
  getPublishedForms(): Observable<FormDTO[]> {
    return this.http.get<ApiResponse<FormDTO[]>>(`${this.baseUrl}/published`)
      .pipe(
        map(response => {
          console.log('Formulaires publiés récupérés:', response.data.length);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  // ✅ OBTENIR UN FORMULAIRE POUR REMPLISSAGE - CORRECTION PRINCIPALE
  getFormForFilling(formId: number | string): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);
      console.log('Récupération du formulaire pour remplissage, ID validé:', validatedId);

      return this.http.get<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}/fill`)
        .pipe(
          map(response => {
            console.log('Formulaire pour remplissage récupéré:', response.data);
            return response.data;
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ OBTENIR UN FORMULAIRE PAR ID
  getFormById(formId: number | string): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);
      console.log('Récupération du formulaire par ID:', validatedId);

      return this.http.get<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}`)
        .pipe(
          map(response => response.data),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ METTRE À JOUR UN FORMULAIRE
  updateForm(formId: number | string, request: FormUpdateRequest): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.put<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}`, request)
        .pipe(
          map(response => {
            console.log('Formulaire mis à jour:', response);
            return response.data;
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ PUBLIER UN FORMULAIRE
  publishForm(formId: number | string): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.post<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}/publish`, {})
        .pipe(
          map(response => {
            console.log('Formulaire publié:', response);
            return response.data;
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ ASSIGNER DES GROUPES
  assignGroupsToForm(formId: number | string, groupIds: number[]): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);
      const request: AssignGroupsRequest = { groupIds };

      return this.http.post<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}/assign-groups`, request)
        .pipe(
          map(response => {
            console.log('Groupes assignés:', response);
            return response.data;
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ SOUMETTRE UN FORMULAIRE - CORRECTION PRINCIPALE
// Dans votre service Angular
submitForm(formId: number | string, submission: FormSubmissionRequest): Observable<FormSubmissionResponseDTO> {
  try {
    const validatedId = this.validateFormId(formId);

    // ✅ LOG DÉTAILLÉ des données envoyées
    console.log('📤 Soumission du formulaire:', {
      formId: validatedId,
      dataKeys: Object.keys(submission.data),
      dataTypes: Object.entries(submission.data).map(([key, value]) => ({
        key,
        type: typeof value,
        hasValue: value !== null && value !== undefined
      }))
    });

    // ✅ VALIDATION SUPPLÉMENTAIRE des données de soumission
    if (!submission || !submission.data || Object.keys(submission.data).length === 0) {
      throw new Error('Données de soumission manquantes ou vides');
    }

    return this.http.post<ApiResponse<FormSubmissionResponseDTO>>(`${this.baseUrl}/${validatedId}/submit`, submission)
      .pipe(
        map(response => {
          console.log('✅ Formulaire soumis avec succès:', response);
          return response.data;
        }),
        catchError(error => {
          console.error('❌ Erreur soumission:', error);
          return this.handleError(error);
        })
      );
  } catch (error) {
    return throwError(error instanceof Error ? error.message : String(error));
  }
}

  // ✅ OBTENIR LES SOUMISSIONS
  getFormSubmissions(formId: number | string): Observable<FormSubmissionResponseDTO[]> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.get<ApiResponse<FormSubmissionResponseDTO[]>>(`${this.baseUrl}/${validatedId}/submissions`)
        .pipe(
          map(response => {
            console.log('Soumissions récupérées:', response.data.length);
            return response.data;
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ SUPPRIMER UN FORMULAIRE
  deleteForm(formId: number | string): Observable<void> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${validatedId}`)
        .pipe(
          map(() => {
            console.log('Formulaire supprimé:', validatedId);
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ ENDPOINTS PUBLICS

  // ✅ OBTENIR UN FORMULAIRE PUBLIC
  getPublicForm(formId: number | string): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.get<ApiResponse<FormDTO>>(`${this.baseUrl}/${validatedId}/public`)
        .pipe(
          map(response => response.data),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ SOUMISSION ANONYME
  submitFormAnonymous(formId: number | string, submission: FormSubmissionRequest): Observable<FormSubmissionResponseDTO> {
    try {
      const validatedId = this.validateFormId(formId);

      return this.http.post<ApiResponse<FormSubmissionResponseDTO>>(`${this.baseUrl}/${validatedId}/submit-anonymous`, submission)
        .pipe(
          map(response => response.data),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  // ✅ MÉTHODES UTILITAIRES

  getPublicFormUrl(formId: number | string): string {
    try {
      const validatedId = this.validateFormId(formId);
      return `${window.location.origin}/public/forms/${validatedId}`;
    } catch (error) {
      console.error('Erreur génération URL publique:', error);
      return '';
    }
  }

  getFormFillUrl(formId: number | string): string {
    try {
      const validatedId = this.validateFormId(formId);
      return `${window.location.origin}/forms/${validatedId}/fill`;
    } catch (error) {
      console.error('Erreur génération URL de remplissage:', error);
      return '';
    }
  }

  isFormAccessible(form: FormDTO): boolean {
    return form.isAccessible === true;
  }

  canEditForm(form: FormDTO): boolean {
    return form.canEdit === true;
  }

  getAssignedGroupNames(form: FormDTO): string[] {
    return form.assignedGroups?.map(group => group.name) || [];
  }

  getGroupAccessMessage(form: FormDTO): string {
    const groupNames = this.getAssignedGroupNames(form);
    if (groupNames.length === 0) {
      return 'Formulaire accessible à tous';
    } else if (groupNames.length === 1) {
      return `Accessible au groupe : ${groupNames[0]}`;
    } else {
      return `Accessible aux groupes : ${groupNames.join(', ')}`;
    }
  }

  // ✅ VALIDATION DES DONNÉES DE SOUMISSION
  validateSubmissionData(data: { [key: string]: any }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || Object.keys(data).length === 0) {
      errors.push('Aucune donnée à soumettre');
    }

    // Vérifier les types de données
    Object.keys(data).forEach(key => {
      const value = data[key];

      // Détecter les valeurs NaN
      if (typeof value === 'number' && isNaN(value)) {
        errors.push(`Valeur numérique invalide pour le champ: ${key}`);
      }

      // Détecter les chaînes "NaN"
      if (value === 'NaN' || value === 'undefined' || value === 'null') {
        errors.push(`Valeur invalide pour le champ: ${key} (${value})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ✅ PRÉPARER LES DONNÉES POUR SOUMISSION
  prepareSubmissionData(rawData: { [key: string]: any }): { [key: string]: any } {
    const cleanedData: { [key: string]: any } = {};

    Object.keys(rawData).forEach(key => {
      const value = rawData[key];

      // ✅ FILTRAGE STRICT des valeurs invalides
      if (this.isValidValue(value)) {
        cleanedData[key] = value;
      } else {
        console.warn(`Valeur invalide ignorée pour le champ ${key}:`, value);
      }
    });

    // Ajouter des métadonnées
    cleanedData['_submissionTimestamp'] = new Date().toISOString();
    cleanedData['_clientUrl'] = window.location.href;

    return cleanedData;
  }

  // ✅ VÉRIFIER SI UNE VALEUR EST VALIDE
  private isValidValue(value: any): boolean {
    // Rejeter null, undefined
    if (value === null || value === undefined) {
      return false;
    }

    // Rejeter les chaînes vides (sauf pour les cas spéciaux)
    if (value === '') {
      return false;
    }

    // Rejeter les valeurs NaN
    if (typeof value === 'number' && isNaN(value)) {
      return false;
    }

    // Rejeter les chaînes représentant des valeurs invalides
    if (typeof value === 'string') {
      const stringValue = value.toLowerCase().trim();
      if (['nan', 'undefined', 'null'].includes(stringValue)) {
        return false;
      }
    }

    // Rejeter les tableaux vides (pour multiselect)
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    // Rejeter les objets vides
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      return false;
    }

    return true;
  }

  // ✅ GESTION CENTRALISÉE DES ERREURS
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';

    console.error('Erreur dans FormService:', error);

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Accès non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          errorMessage = 'Formulaire non trouvé ou non disponible.';
          break;
        case 422:
          errorMessage = 'Données invalides. Vérifiez vos informations et réessayez.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    return throwError(errorMessage);
  };

  // ✅ MÉTHODES DE CACHE OPTIONNELLES
  private formsCache = new Map<number, FormDTO>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  getFormByIdCached(formId: number | string): Observable<FormDTO> {
    try {
      const validatedId = this.validateFormId(formId);
      const cached = this.formsCache.get(validatedId);

      if (cached && this.isCacheValid(cached)) {
        return new Observable(observer => {
          observer.next(cached);
          observer.complete();
        });
      }

      return this.getFormById(validatedId).pipe(
        map(form => {
          (form as any)._cacheTime = Date.now();
          this.formsCache.set(validatedId, form);
          return form;
        })
      );
    } catch (error) {
      return throwError(error instanceof Error ? error.message : String(error));
    }
  }

  private isCacheValid(cachedItem: any): boolean {
    if (!cachedItem._cacheTime) return false;
    return (Date.now() - cachedItem._cacheTime) < this.cacheExpiry;
  }

  clearCache(): void {
    this.formsCache.clear();
  }

  clearFormCache(formId: number | string): void {
    try {
      const validatedId = this.validateFormId(formId);
      this.formsCache.delete(validatedId);
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
    }
  }

  // ✅ MÉTHODES DE DÉBOGAGE (à utiliser temporairement)
  debugFormService(): void {
    console.log('État du FormService:', {
      baseUrl: this.baseUrl,
      cacheSize: this.formsCache.size,
      cachedFormIds: Array.from(this.formsCache.keys())
    });
  }
}
