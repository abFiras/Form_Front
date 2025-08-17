import { Component, EventEmitter, Input, Output } from '@angular/core';

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

  logout(): void {
    // Logique de déconnexion
    console.log('Déconnexion...');
    this.userMenuOpen = false;
  }
}