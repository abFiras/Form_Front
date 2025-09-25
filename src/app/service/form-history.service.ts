import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  message: string;
  data: T;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormHistoryService {
  private apiUrl = `http://localhost:8080/api/history`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir l'historique avec filtres
   */
  getFormHistory(filters: any): Observable<ApiResponse<any>> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  /**
   * Obtenir l'historique d'un formulaire spécifique
   */
  getFormSpecificHistory(formId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/form/${formId}`);
  }

  /**
   * Obtenir les statistiques
   */
  getHistoryStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }

  /**
   * Obtenir l'activité récente
   */
  getRecentActivity(hours: number = 24): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/recent?hours=${hours}`);
  }

  /**
   * Obtenir les options de filtrage
   */
  getFilterOptions(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/filter-options`);
  }
}
