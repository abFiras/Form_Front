import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  @Input() sidebarOpen = false;
  @Input() notificationCount = 3;
  @Output() sidebarToggle = new EventEmitter<void>();

  // Propriétés pour les données utilisateur
  userName = '';
  userRole = '';
  profilePhotoUrl = 'assets/default-avatar.png';
  userMenuOpen = false;
  isLoading = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.username || 'Utilisateur';
          // Récupérer le rôle - ajustez selon votre structure de données
          this.userRole = user.role?.name || user.roles?.[0]?.name || 'Utilisateur';
          this.profilePhotoUrl = user.profilePhotoUrl || user.photo || 'assets/default-avatar.png';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de récupération utilisateur:', err);
        this.userName = 'Erreur de chargement';
        this.userRole = '';
        this.isLoading = false;
      }
    });
  }

  get userInitials(): string {
    if (!this.userName) return '?';

    return this.userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2); // Limiter à 2 caractères
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  // Méthode pour gérer les erreurs de chargement d'image
  onImageError(event: any): void {
    event.target.src = 'assets/default-avatar.png';
  }
}
