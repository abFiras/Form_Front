import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
//import * as jwt_decode from "jwt-decode";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8080/api';
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient, private router: Router) {}

  register(signupRequest: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/signup`, signupRequest);
  }
  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }
  // auth.service.ts
getCurrentUser(): Observable<any> {
  const token = localStorage.getItem('accessToken'); // ou authService.getToken()
  return this.http.get<any>(`${this.baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}


  // Méthode pour récupérer le token JWT depuis le localStorage
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  login(loginRequest: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/signin`, loginRequest).pipe(
      map((response: any) => {
        if (response && response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          console.log('Token retrieved and stored successfully:', response.accessToken);
          console.log(this.getUserIdFromToken());
          console.log(this.getToken());


        } else {

          console.log('No token found in the response:', response);
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error during login:', error);
        return throwError(error);
      })
    );
  }

  logout() {
    console.log("Début de la déconnexion");
    if (localStorage.getItem('accessToken')) {
      localStorage.removeItem('accessToken');
      console.log("Jeton d'authentification supprimé avec succès");
    }
    this.router.navigate(['/login']);
    console.log("Redirection vers la page de connexion après déconnexion");
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    console.log("isAuthenticated suceess");

    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  isUserLoggedIn(): boolean {
    console.log("boo true");

    return this.isAuthenticated();
  }
  getUserIdFromToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // Décoder le token JWT pour obtenir les informations sur l'utilisateur
        const decodedToken: any = jwt_decode(token);
        // Récupérer l'ID de l'utilisateur à partir du token décrypté
        const userId = decodedToken.sub;
        console.log("l username :", userId);
        return userId;
      } catch (error) {
        console.error('Erreur lors du décryptage du token JWT :', error);
        return null;
      }
    } else {
      return null;
    }
  }
  getUserIdFromUsername(username: string): Observable<number> {
    return this.http.get<number>('http://localhost:8080/api/auth/getuser/id', {
      params: { username },
    });
  }
  async getLoggedInUsername(): Promise<string | null> {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = this.jwtHelper.decodeToken(token);
        return decodedToken.username; // Assurez-vous que le token JWT contient le champ 'username'
      } catch (error) {
        console.error('Erreur lors du décryptage du token JWT:', error);
        return null;
      }
    } else {
      return null;
    }
  }
 /* private isAuthenticatedValue: boolean = false;

  isAuthenticated(): boolean {
    return this.isAuthenticatedValue; // Accès direct à la propriété, pas de parenthèses
  }

  setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedValue = isAuthenticated;
  }*/

}



function jwt_decode(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}
