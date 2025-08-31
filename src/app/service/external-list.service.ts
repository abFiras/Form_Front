import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExternalListItemDTO {
  id?: number;
  label: string;
  value: string;
  displayOrder?: number;
  isActive?: boolean;
  extraData?: string;
}

export interface ExternalListDTO {
  id?: number;
  name: string;
  description?: string;
  listType: string;
  rubrique?: string;
  isAdvanced?: boolean;
  isFiltered?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number;
  items?: ExternalListItemDTO[];
}

export interface CreateExternalListRequest {
  name: string;
  description?: string;
  listType: string;
  rubrique?: string;
  isAdvanced?: boolean;
  isFiltered?: boolean;
  items?: ExternalListItemDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class ExternalListService {
  private readonly apiUrl = 'http://localhost:8080/api/external-lists';

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les listes externes
   */
  getAllExternalLists(): Observable<ExternalListDTO[]> {
    return this.http.get<ExternalListDTO[]>(this.apiUrl);
  }

  /**
   * Récupère les listes externes d'un utilisateur
   */
  getExternalListsByUser(userId: number): Observable<ExternalListDTO[]> {
    return this.http.get<ExternalListDTO[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Récupère une liste externe par ID
   */
  getExternalListById(id: number): Observable<ExternalListDTO> {
    return this.http.get<ExternalListDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle liste externe
   */
  createExternalList(request: CreateExternalListRequest, userId: number): Observable<ExternalListDTO> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<ExternalListDTO>(this.apiUrl, request, { params });
  }

  /**
   * Met à jour une liste externe
   */
  updateExternalList(id: number, request: CreateExternalListRequest): Observable<ExternalListDTO> {
    return this.http.put<ExternalListDTO>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Supprime une liste externe
   */
  deleteExternalList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Importe une liste depuis un fichier CSV
   */
  importFromCSV(file: File, listName: string, description: string, rubrique: string, userId: number): Observable<ExternalListDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listName', listName);
    formData.append('description', description);
    if (rubrique) {
      formData.append('rubrique', rubrique);
    }
    formData.append('userId', userId.toString());

    return this.http.post<ExternalListDTO>(`${this.apiUrl}/import-csv`, formData);
  }

  /**
   * Récupère les éléments d'une liste externe
   */
  getListItems(id: number): Observable<ExternalListItemDTO[]> {
    return this.http.get<ExternalListItemDTO[]>(`${this.apiUrl}/${id}/items`);
  }

  /**
   * Recherche des listes par nom
   */
  searchLists(query: string): Observable<ExternalListDTO[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<ExternalListDTO[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Récupère toutes les rubriques disponibles
   */
  getAllRubriques(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/rubriques`);
  }

  /**
   * Récupère les listes d'une rubrique
   */
  getListsByRubrique(rubrique: string): Observable<ExternalListDTO[]> {
    return this.http.get<ExternalListDTO[]>(`${this.apiUrl}/rubrique/${rubrique}`);
  }
}
