import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormDTO, FormCreateRequest, FormUpdateRequest, FormSubmissionRequest, FormSubmissionDTO } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private readonly API_URL = 'http://localhost:8080/api/forms';

  constructor(private http: HttpClient) {}

  // Helper function to get the headers with token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken'); // or wherever your JWT is stored
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getAllForms(): Observable<FormDTO[]> {
    return this.http.get<FormDTO[]>(this.API_URL, this.getAuthHeaders());
  }

  getFormById(id: number): Observable<FormDTO> {
    return this.http.get<FormDTO>(`${this.API_URL}/${id}`, this.getAuthHeaders());
  }

  getPublicForm(id: number): Observable<FormDTO> {
    return this.http.get<FormDTO>(`${this.API_URL}/${id}/public`);
  }

  createForm(form: FormCreateRequest): Observable<FormDTO> {
    return this.http.post<FormDTO>(this.API_URL, form, this.getAuthHeaders());
  }


  updateForm(id: number, form: FormUpdateRequest): Observable<FormDTO> {
    return this.http.put<FormDTO>(`${this.API_URL}/${id}`, form, this.getAuthHeaders());
  }

  deleteForm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, this.getAuthHeaders());
  }

  publishForm(id: number): Observable<FormDTO> {
    return this.http.post<FormDTO>(`${this.API_URL}/${id}/publish`, {}, this.getAuthHeaders());
  }

  submitForm(id: number, submission: FormSubmissionRequest): Observable<FormSubmissionDTO> {
    return this.http.post<FormSubmissionDTO>(`${this.API_URL}/${id}/submit`, submission, this.getAuthHeaders());
  }

  getFormSubmissions(id: number): Observable<FormSubmissionDTO[]> {
    return this.http.get<FormSubmissionDTO[]>(`${this.API_URL}/${id}/submissions`, this.getAuthHeaders());
  }
}
