import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms`, { params });
  }
 getLibraryFormDetail(libraryFormId: number): Observable<FormDetailDTO> {
    return this.http.get<FormDetailDTO>(`${this.apiUrl}/forms/${libraryFormId}`);
  }
  /**
   * Récupère les formulaires populaires
   */
  getPopularForms(limit: number = 10): Observable<LibraryFormDTO[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms/popular`, { params });
  }

  /**
   * Récupère les formulaires récents
   */
  getRecentForms(limit: number = 10): Observable<LibraryFormDTO[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<LibraryFormDTO[]>(`${this.apiUrl}/forms/recent`, { params });
  }

  /**
   * Partage un formulaire dans la bibliothèque
   */
  shareFormToLibrary(formId: number, origin: string, language: string, tags?: string): Observable<any> {
    let params = new HttpParams()
      .set('origin', origin)
      .set('language', language);

    if (tags) {
      params = params.set('tags', tags);
    }

    return this.http.post(`${this.apiUrl}/forms/${formId}/share`, {}, { params });
  }
/**
 * Télécharge un formulaire de la bibliothèque au format Word
 */
downloadFormAsWord(libraryFormId: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/forms/${libraryFormId}/export/word`, {
    responseType: 'blob'
  });
}

  /**
   * Ajoute un formulaire de la bibliothèque au compte utilisateur
   */
  addFormToAccount(libraryFormId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/${libraryFormId}/add-to-account`, {});
  }

  /**
   * Incrémente le compteur de vues
   */
  incrementViewCount(libraryFormId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/${libraryFormId}/view`, {});
  }

  /**
   * Supprime un formulaire de la bibliothèque
   */
  removeFromLibrary(libraryFormId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${libraryFormId}`);
  }

  /**
   * Prévisualise un formulaire de la bibliothèque
   */
  previewLibraryForm(libraryFormId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/forms/${libraryFormId}/preview`);
  }
}
