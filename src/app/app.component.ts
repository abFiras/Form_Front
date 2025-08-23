import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'form-app';
  showNavbarSidebar = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
            const currentPath = event.urlAfterRedirects.split('?')[0].split('#')[0];

      const excludedRoutes = ['/connexion', '/landingpage', '/reset-password','/']; // routes where navbar/sidebar should be hidden
            this.showNavbarSidebar = !excludedRoutes.includes(currentPath);

    });
  }
}
