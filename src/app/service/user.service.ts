// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Role {
  id: number;
  name: string;
}

export interface Utilisateur {
  id?: number;
  username: string;
  email: string;
  password?: string;
  phone: string;
  banned?: any;
  suspended: boolean;
  banEndDate?: any;
  roles: Role[];
  resetPasswordToken?: any;
  resetPasswordExpiry?: any;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/admin';
  private authUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/getAllUsers`, {
      headers: this.getAuthHeaders()
    });
  }

  createUser(user: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.baseUrl}/create-user`, user, {
      headers: this.getAuthHeaders()
    });
  }

  updateUser(id: number, user: Utilisateur): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}`, user, {
      headers: this.getAuthHeaders()
    });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getCurrentUserProfile(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.authUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateCurrentUserProfile(user: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.authUrl}/profile`, user, {
      headers: this.getAuthHeaders()
    });
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.authUrl}/change-password`, passwordData, {
      headers: this.getAuthHeaders()
    });
  }

  uploadProfilePhoto(file: File): Observable<{photoUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    });

    return this.http.post<{photoUrl: string}>(`${this.authUrl}/upload-photo`, formData, {
      headers: headers
    });
  }
}
