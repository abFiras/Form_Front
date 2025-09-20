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

          // ✅ CORRECTION: Gestion correcte des rôles selon le nouveau format
          this.userRole = this.extractUserRole(user);

          this.profilePhotoUrl = user.profilePhotoUrl || user.photo || 'assets/default-avatar.png';

          console.log('Utilisateur chargé dans navbar:', user);
          console.log('Rôle extrait:', this.userRole);
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

  // ✅ NOUVELLE MÉTHODE: Extraction correcte du rôle utilisateur
  private extractUserRole(user: any): string {
    // Cas 1: Rôles comme array de strings (format actuel du backend)
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      const role = user.roles[0];
      if (typeof role === 'string') {
        return this.formatRoleName(role);
      } else if (role && role.name) {
        return this.formatRoleName(role.name);
      }
    }

    // Cas 2: Rôle unique (si jamais utilisé)
    if (user.role) {
      if (typeof user.role === 'string') {
        return this.formatRoleName(user.role);
      } else if (user.role.name) {
        return this.formatRoleName(user.role.name);
      }
    }

    // Valeur par défaut
    return 'Utilisateur';
  }

  // ✅ NOUVELLE MÉTHODE: Formatage du nom du rôle
  private formatRoleName(roleName: string): string {
    if (!roleName) return 'Utilisateur';

    // Supprimer le préfixe ROLE_ et formater
    const cleanRole = roleName.replace('ROLE_', '');

    switch (cleanRole.toUpperCase()) {
      case 'ADMIN':
        return 'Administrateur';
      case 'USER':
        return 'Utilisateur';
      case 'MANAGER':
        return 'Gestionnaire';
      case 'MODERATOR':
        return 'Modérateur';
      default:
        // Capitaliser la première lettre
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase();
    }
  }

  // ✅ NOUVELLE MÉTHODE: Vérifier si l'utilisateur a un rôle spécifique
  hasRole(roleName: string): boolean {
    return this.userRole.toLowerCase().includes(roleName.toLowerCase()) ||
           this.userRole.toLowerCase().includes(roleName.replace('ROLE_', '').toLowerCase());
  }

  // ✅ NOUVELLE MÉTHODE: Vérifier si l'utilisateur est administrateur
  isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('ADMINISTRATEUR');
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

  // ✅ MÉTHODE AMÉLIORÉE: Badge de rôle avec couleur
  getRoleBadgeClass(): string {
    switch (this.userRole.toLowerCase()) {
      case 'administrateur':
        return 'role-admin';
      case 'gestionnaire':
        return 'role-manager';
      case 'modérateur':
        return 'role-moderator';
      default:
        return 'role-user';
    }
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
