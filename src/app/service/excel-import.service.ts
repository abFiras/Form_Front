import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExcelValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalRows: number;
  headers: string[];
  previewData: any[];
}

export interface ExcelImportResponse {
  success: boolean;
  message: string;
  data?: any;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {
  private readonly apiUrl = 'http://localhost:8080/api/external-lists';

  constructor(private http: HttpClient) {}

  /**
   * Valide un fichier Excel avant importation
   */
  validateExcelFile(file: File): Observable<ExcelValidationResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ExcelValidationResult>(`${this.apiUrl}/validate-excel`, formData);
  }

  /**
   * Importe une liste depuis un fichier Excel
   */
  importFromExcel(
    file: File,
    listName: string,
    description: string,
    rubrique: string,
    userId: number
  ): Observable<ExcelImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listName', listName);
    formData.append('description', description || '');
    if (rubrique) {
      formData.append('rubrique', rubrique);
    }
    formData.append('userId', userId.toString());

    return this.http.post<ExcelImportResponse>(`${this.apiUrl}/import-excel`, formData);
  }

  /**
   * Vérifie si une liste avec le même nom existe déjà
   */
  checkExistingList(listName: string, userId: number): Observable<{exists: boolean, listId: number}> {
    const params = new HttpParams()
      .set('listName', listName)
      .set('userId', userId.toString());

    return this.http.get<{exists: boolean, listId: number}>(`${this.apiUrl}/check-existing`, { params });
  }

  /**
   * Valide si le fichier est un fichier Excel valide
   */
  isValidExcelFile(file: File): boolean {
    if (!file) return false;

    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();

    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Valide la taille du fichier
   */
  isValidFileSize(file: File, maxSizeMB: number): boolean {
    if (!file) return false;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }
}
