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

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/admin'; // Ajustez selon votre configuration

  constructor(private http: HttpClient ,private authService: AuthService) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken'); // 👈 ton AuthService le stocke sous ce nom
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
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}`, user ,{
      headers: this.getAuthHeaders()
    });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
