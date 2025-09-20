// library.service.ts - Version corrigée avec meilleure gestion des IDs
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { FormDetailDTO } from '../library-form-detail/library-form-detail.component';

export interface LibraryFormDTO {
  id: number;
  originalFormId: number;
  name: string;
  description: string;
  origin: string;
  language: string;
  fieldCount: number;
  viewCount: number;
  downloadCount: number;
  sharedBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string;
}

export interface LibraryFilters {
  search?: string;
  origin?: string;
  language?: string;
  sortBy?: 'relevance' | 'recent' | 'updated' | 'popular';
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly apiUrl = 'http://localhost:8080/api/library';

  constructor(private http: HttpClient) {}

  // ✅ MÉTHODE UTILITAIRE CORRIGÉE : Validation plus robuste des IDs
  private validateLibraryFormId(libraryFormId: number | string | undefined | null, operation: string = 'opération'): number {
    console.log(`Validation ID pour ${operation}:`, {
      input: libraryFormId,
      type: typeof libraryFormId,
      isNull: libraryFormId === null,
      isUndefined: libraryFormId === undefined
    });

    // Vérifier si la valeur est null ou undefined
    if (libraryFormId === undefined || libraryFormId === null) {
      const error = `ID de formulaire de bibliothèque manquant pour ${operation}`;
      console.error(error);
      throw new Error(error);
    }

    // Vérifier si c'est une chaîne vide
    if (libraryFormId === '' || libraryFormId === 'undefined' || libraryFormId === 'null') {
      const error = `ID de formulaire de bibliothèque vide ou invalide pour ${operation}: "${libraryFormId}"`;
      console.error(error);
      throw new Error(error);
    }

    // Convertir en nombre
    const numericId = Number(libraryFormId);
    console.log(`Conversion en nombre:`, { original: libraryFormId, converted: numericId, isNaN: isNaN(numericId) });

    // Vérifier si la conversion a échoué
    if (isNaN(numericId)) {
      const error = `ID de formulaire de bibliothèque non numérique pour ${operation}: "${libraryFormId}" -> ${numericId}`;
      console.error(error);
      throw new Error(error);
    }

    // Vérifier si c'est un nombre positif
    if (numericId <= 0) {
      const error = `ID de formulaire de bibliothèque invalide pour ${operation}: ${numericId} (doit être > 0)`;
      console.error(error);
      throw new Error(error);
    }

    console.log(`ID validé avec succès pour ${operation}:`, numericId);
    return numericId;
  }

  // ✅ NOUVELLE MÉTHODE : Validation de l'ID depuis les paramètres de route
  private validateRouteId(routeId: any, operation: string = 'opération'): number {
    console.log(`Validation ID de route pour ${operation}:`, routeId);

    // Cas spéciaux pour les paramètres de route
    if (routeId && typeof routeId === 'object' && 'id' in routeId) {
      return this.validateLibraryFormId(routeId.id, operation);
    }

    return this.validateLibraryFormId(routeId, operation);
  }

  /**
   * Récupère tous les formulaires de la bibliothèque avec filtres
   */
  getLibraryForms(filters: LibraryFilters = {}): Observable<LibraryFormDTO[]> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.origin) {
      params = params.set('origin', filters.origin);
    }
    if (filters.language) {
      params = params.set('language', filters.language);
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    console.log('Récupération formulaires bibliothèque avec filtres:', filters);
    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms`, { params });
  }

  // ✅ CORRIGÉ : Meilleure validation et logging
  getLibraryFormDetail(libraryFormId: number | string | any): Observable<FormDetailDTO> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'récupération détail formulaire bibliothèque');
      console.log('Appel API détail formulaire bibliothèque, ID validé:', validatedId);

      return this.http.get<FormDetailDTO>(`${this.apiUrl}/forms/${validatedId}`);
    } catch (error) {
      console.error('Erreur validation ID formulaire bibliothèque:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Récupère les formulaires populaires
   */
  getPopularForms(limit: number = 10): Observable<LibraryFormDTO[]> {
    const params = new HttpParams().set('limit', limit.toString());
    console.log('Récupération formulaires populaires, limite:', limit);
    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms/popular`, { params });
  }

  /**
   * Récupère les formulaires récents
   */
  getRecentForms(limit: number = 10): Observable<LibraryFormDTO[]> {
    const params = new HttpParams().set('limit', limit.toString());
    console.log('Récupération formulaires récents, limite:', limit);
    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms/recent`, { params });
  }

  /**
   * Partage un formulaire dans la bibliothèque
   */
  shareFormToLibrary(formId: number | string | any, origin: string, language: string, tags?: string): Observable<any> {
    try {
      const validatedId = this.validateRouteId(formId, 'partage formulaire dans bibliothèque');
      console.log('Partage formulaire dans bibliothèque, ID validé:', validatedId);

      const shareData = { origin, language, tags: tags || '' };
      return this.http.post(`${this.apiUrl}/forms/${validatedId}/share`, shareData);
    } catch (error) {
      console.error('Erreur validation ID pour partage:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Télécharge un formulaire de la bibliothèque au format Word
   */
  downloadFormAsWord(libraryFormId: number | string | any): Observable<Blob> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'téléchargement Word formulaire');
      console.log('Téléchargement Word formulaire, ID validé:', validatedId);

      return this.http.get(`${this.apiUrl}/forms/${validatedId}/export/word`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Erreur validation ID pour téléchargement Word:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Télécharge un formulaire de la bibliothèque au format Excel
   */
  downloadFormAsExcel(libraryFormId: number | string | any): Observable<Blob> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'téléchargement Excel formulaire');
      console.log('Téléchargement Excel formulaire, ID validé:', validatedId);

      return this.http.get(`${this.apiUrl}/forms/${validatedId}/export/excel`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Erreur validation ID pour téléchargement Excel:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Ajoute un formulaire de la bibliothèque au compte utilisateur
   */
  addFormToAccount(libraryFormId: number | string | any): Observable<any> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'ajout formulaire au compte');
      console.log('Ajout formulaire au compte, ID validé:', validatedId);

      return this.http.post(`${this.apiUrl}/forms/${validatedId}/add-to-account`, {});
    } catch (error) {
      console.error('Erreur validation ID pour ajout au compte:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Incrémente le compteur de vues
   */
  incrementViewCount(libraryFormId: number | string | any): Observable<any> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'incrémentation vues');
      console.log('Incrémentation compteur vues, ID validé:', validatedId);

      return this.http.post(`${this.apiUrl}/forms/${validatedId}/view`, {});
    } catch (error) {
      console.error('Erreur validation ID pour incrémentation vues:', error);
      // Pour les vues, on peut échouer silencieusement
      return throwError(() => new Error('Impossible d\'incrémenter les vues'));
    }
  }

  /**
   * Supprime un formulaire de la bibliothèque
   */
  removeFromLibrary(libraryFormId: number | string | any): Observable<any> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'suppression formulaire bibliothèque');
      console.log('Suppression formulaire bibliothèque, ID validé:', validatedId);

      return this.http.delete(`${this.apiUrl}/forms/${validatedId}`);
    } catch (error) {
      console.error('Erreur validation ID pour suppression:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Prévisualise un formulaire de la bibliothèque
   */
  previewLibraryForm(libraryFormId: number | string | any): Observable<any> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'prévisualisation formulaire bibliothèque');
      console.log('Prévisualisation formulaire bibliothèque, ID validé:', validatedId);

      return this.http.get(`${this.apiUrl}/forms/${validatedId}/preview`);
    } catch (error) {
      console.error('Erreur validation ID pour prévisualisation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }

  // ✅ NOUVELLE MÉTHODE : Pour récupérer un formulaire de la bibliothèque et le remplir
  getLibraryFormForFilling(libraryFormId: number | string | any): Observable<any> {
    try {
      const validatedId = this.validateRouteId(libraryFormId, 'remplissage formulaire bibliothèque');
      console.log('Récupération formulaire bibliothèque pour remplissage, ID validé:', validatedId);

      // D'abord récupérer les détails
      return this.http.get(`${this.apiUrl}/forms/${validatedId}/fill`);
    } catch (error) {
      console.error('Erreur validation ID pour remplissage:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return throwError(() => new Error(errorMessage));
    }
  }



  /**
   * Debugging method (remove in production)
   */
  debugLibraryService(): void {
    console.log('État du LibraryService:', {
      apiUrl: this.apiUrl,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Valide et nettoie un ID avant de l'utiliser
   */
 
  /**
   * Vérifie si un ID est potentiellement valide sans lever d'exception
   */
  isValidId(id: any): boolean {
    try {
      this.validateLibraryFormId(id, 'vérification');
      return true;
    } catch (error) {
      return false;
    }
  }
}
