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
  prenom:string,
  nom:string,
  password?: string;
  phone: string;
  banned?: any;
  suspended: boolean;
  banEndDate?: any;
  roles: Role[];
  resetPasswordToken?: any;
  resetPasswordExpiry?: any;
  profilePhotoUrl?: string; // Nouveau champ

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
  // Nouvelles méthodes pour ban/unban/delete
 banUser(email: string): Observable<any> {
  return this.http.post("http://localhost:8080/api/admin/banUser", email, {
    headers: { 'Content-Type': 'text/plain' }, // très important
    responseType: 'text'
  });
}


  unbanUser(email: string): Observable<string> {
  return this.http.post("http://localhost:8080/api/admin/unbanUser", email, {
    headers: { 'Content-Type': 'text/plain' }, // très important
    responseType: 'text'
  });
}

  deleteUser(email: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteUser`, {
      headers: this.getAuthHeaders(),
      body: { email }
    });
  }

  // Méthode de suspension existante (pour compatibilité)
  suspendUser(email: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/suspendUser`, { email }, {
      headers: this.getAuthHeaders(),
      responseType: 'text' as 'json'
    });
  }


  getCurrentUserProfile(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.authUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
  }
// Nouvelles méthodes pour le profil utilisateur
  updateProfile(updates: any): Observable<any> {
    return this.http.post(`${this.authUrl}/update-profile`, updates, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfilePhoto(photoUrl: string): Observable<any> {
    return this.http.post(`${this.authUrl}/update-profile-photo`, { photoUrl }, {
      headers: this.getAuthHeaders()
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.authUrl}/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: this.getAuthHeaders()
    });
  }



}
