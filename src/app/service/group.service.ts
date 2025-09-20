// group.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface GroupDTO {
  id: number;
  name: string;
  description?: string;
  color?: string;
  active?: boolean;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly baseUrl = 'http://localhost:8080/api/groups';

  constructor(private http: HttpClient) {}

  // Obtenir tous les groupes actifs
  getAllActiveGroups(): Observable<GroupDTO[]> {
    return this.http.get<ApiResponse<GroupDTO[]>>(`${this.baseUrl}/active`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtenir tous les groupes
  getAllGroups(): Observable<GroupDTO[]> {
    return this.http.get<ApiResponse<GroupDTO[]>>(`${this.baseUrl}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtenir les groupes de l'utilisateur actuel
  getUserGroups(): Observable<GroupDTO[]> {
    return this.http.get<ApiResponse<GroupDTO[]>>(`${this.baseUrl}/user`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';

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
          errorMessage = 'Ressource non trouvée.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Erreur dans GroupService:', error);
    return throwError(errorMessage);
  };
}
