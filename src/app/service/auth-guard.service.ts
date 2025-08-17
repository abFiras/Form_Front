import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(): boolean {
      if (this.authService.isUserLoggedIn()) {

        return true;

      } else {

        this.router.navigate(['/login']);
         // Assurez-vous que la route de redirection est correcte
        return false;

      }
    }
}
