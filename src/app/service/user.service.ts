// user.service.ts - Correction pour la sélection manuelle de groupe
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Group {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  color?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  id: number;
  name: string;
}
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  phone?: string;
  suspended?: boolean;
  banned?: boolean;
  roles?: string[]; // Array de strings pour les noms de rôles
  selectedGroupId?: number;
}

export interface Utilisateur {
  id?: number;
  username: string;
  email: string;
  prenom: string;
  nom: string;
  password?: string;
  phone: string;
  banned?: boolean;
  suspended: boolean;
  banEndDate?: Date;
  roles: Role[];
  createdAt?: string;
  group?: Group;
  assignedGroup?: Group;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  profilePhotoUrl?: string;
  // ✅ NOUVEAU CHAMP pour la sélection de groupe
  selectedGroupId?: number;

}

// Interface pour les statistiques des groupes
export interface GroupStatistics {
  [groupName: string]: number;
}

// ✅ INTERFACE MISE À JOUR pour la réponse de création d'utilisateur
export interface CreateUserResponse {
  message: string;
  userId: number;
  username: string;
  assignmentType: 'MANUAL' | 'AUTOMATIC';
  assignedGroup?: {
    id: number;
    name: string;
    color: string;
    description: string;
  };
}

// ✅ INTERFACE POUR LA REQUÊTE DE CRÉATION D'UTILISATEUR
export interface CreateUserRequest {
  username: string;
  email: string;
  prenom: string;
  nom: string;
  password: string;
  phone: string;
  role: string[];
  suspended?: boolean;
  selectedGroupId?: number; // Groupe sélectionné manuellement
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

  // ✅ MÉTHODE MISE À JOUR pour créer un utilisateur avec groupe sélectionné
  createUser(user: CreateUserRequest): Observable<CreateUserResponse> {
    const payload = {
      username: user.username,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      password: user.password,
      phone: user.phone,
      role: user.role,
      selectedGroupId: user.selectedGroupId // Inclure l'ID du groupe sélectionné
    };

    console.log('Payload envoyé au backend:', payload);

    return this.http.post<CreateUserResponse>(`${this.baseUrl}/create-user`, payload, {
      headers: this.getAuthHeaders()
    });
  }

//✅ MÉTHODE MISE À JOUR pour accepter UpdateUserDTO
  updateUser(id: number, userData: UpdateUserDTO): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}`, userData, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ ALTERNATIVE: Garder l'ancienne méthode et ajouter une nouvelle
  updateUserWithDTO(id: number, userData: UpdateUserDTO): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}`, userData, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthode originale conservée si nécessaire ailleurs
  updateUserEntity(id: number, user: Utilisateur): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.baseUrl}/${id}`, user, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthodes pour ban/unban/delete
  banUser(email: string): Observable<any> {
    return this.http.post("http://localhost:8080/api/admin/banUser", email, {
      headers: { 'Content-Type': 'text/plain' },
      responseType: 'text'
    });
  }

  unbanUser(email: string): Observable<string> {
    return this.http.post("http://localhost:8080/api/admin/unbanUser", email, {
      headers: { 'Content-Type': 'text/plain' },
      responseType: 'text'
    });
  }

  deleteUser(email: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteUser`, {
      headers: this.getAuthHeaders(),
      body: { email }
    });
  }

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

  // Méthodes pour les groupes
  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/groups`, {
      headers: this.getAuthHeaders()
    });
  }

  getActiveGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/groups/active`, {
      headers: this.getAuthHeaders()
    });
  }

  getGroupStatistics(): Observable<GroupStatistics> {
    return this.http.get<GroupStatistics>(`${this.baseUrl}/groups/statistics`, {
      headers: this.getAuthHeaders()
    });
  }

  assignUserToGroup(userId: number, groupId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/assign-group/${groupId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ NOUVELLE MÉTHODE pour retirer un utilisateur d'un groupe
  removeUserFromGroup(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/remove-group`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthodes utilitaires pour obtenir couleur et icône du groupe
  getGroupColor(groupName: string): string {
    const groupColors: { [key: string]: string } = {
      'AQMARIS': '#1976D2',
      'Alfadir': '#388E3C',
      'SafetyShop': '#F57C00',
      'KairosFormations': '#7B1FA2',
      'FilDem': '#D32F2F',
      'DSIngenierie': '#303F9F',
      'Quadance': '#0288D1'
    };
    return groupColors[groupName] || '#424242';
  }

  getGroupIcon(groupName: string): string {
    const groupIcons: { [key: string]: string } = {
      'AQMARIS': '🌊',
      'Alfadir': '🏛️',
      'SafetyShop': '🛡️',
      'KairosFormations': '🎓',
      'FilDem': '⚙️',
      'DSIngenierie': '🔧',
      'Quadance': '💻'
    };
    return groupIcons[groupName] || '🏢';
  }
}
