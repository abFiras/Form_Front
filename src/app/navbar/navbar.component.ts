import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
@Input() sidebarOpen = false;
  @Input() userName = 'Jean Dupont';
  @Input() userRole = 'Administrateur';
  @Input() notificationCount = 3;
  @Output() sidebarToggle = new EventEmitter<void>();
constructor(private authService:AuthService){}
  userMenuOpen = false;

  get userInitials(): string {
    return this.userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.authService.logout(); // Appelle la méthode de déconnexion
  }
}
