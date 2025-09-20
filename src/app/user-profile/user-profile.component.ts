import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { UserService, Utilisateur } from '../service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: Utilisateur | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;

  isEditingProfile = false;
  isChangingPassword = false;
  profilePhotoUrl = 'assets/images/icon.png'; // Image par défaut

  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({

      prenom: ['', [Validators.required, Validators.minLength(3)]],
      nom: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
  this.loading = true;
  this.authService.getCurrentUser().subscribe({
    next: (user) => {
      if (user) {
        this.user = user;
        this.profilePhotoUrl = user.profilePhotoUrl || 'assets/images/icon.png';

        // Patcher le formulaire avec des valeurs sécurisées
        this.profileForm.patchValue({
          prenom: user.prenom || '',
          nom: user.nom || '',
          email: user.email || '',
          phone: user.phone || ''
        });

        console.log('Utilisateur chargé:', this.user);
      } else {
        this.showMessage('Aucune donnée utilisateur trouvée', 'error');
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur de récupération utilisateur:', err);
      this.showMessage('Erreur lors du chargement du profil', 'error');
      this.loading = false;
    }
  });
}

  onProfilePhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('La taille de l\'image ne doit pas dépasser 5MB', 'error');
        return;
      }

      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.showMessage('Format d\'image non supporté. Utilisez JPG, PNG ou GIF', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64String = e.target.result;
        this.profilePhotoUrl = base64String;

        // Mettre à jour la photo de profil
        this.updateProfilePhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfilePhoto(photoUrl: string): void {
    this.loading = true;
    this.userService.updateProfilePhoto(photoUrl).subscribe({
      next: (response) => {
        this.showMessage('Photo de profil mise à jour avec succès!', 'success');
        this.loading = false;
        // Mettre à jour l'utilisateur local
        if (this.user) {
          this.user.profilePhotoUrl = photoUrl;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de la photo:', error);
        this.showMessage('Erreur lors de la mise à jour de la photo', 'error');
        this.loading = false;
        // Revenir à l'ancienne photo
        this.profilePhotoUrl = this.user?.profilePhotoUrl || 'assets/images/icon.png';
      }
    });
  }

  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      // Annuler les modifications
      this.loadUserProfile();
    }
  }

 onUpdateProfile(): void {
  if (this.profileForm.valid && this.user) {
    this.loading = true;
    const updates = {
      ...this.profileForm.value,
      username: this.user.username // Garder le username existant
    };

    this.userService.updateProfile(updates).subscribe({
      next: (response) => {
        // Mettre à jour l'utilisateur local avec la réponse
        if (response) {
          this.user = { ...this.user, ...response };
          this.isEditingProfile = false;
          this.showMessage('Profil mis à jour avec succès!', 'success');

          // Optionnel: recharger complètement le profil
           this.loadUserProfile();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        let errorMessage = 'Erreur lors de la mise à jour du profil';

        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        }

        this.showMessage(errorMessage, 'error');
        this.loading = false;
      }
    });
  } else {
    this.showMessage('Veuillez remplir tous les champs requis', 'error');
  }
}

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      const currentPassword = this.passwordForm.get('currentPassword')?.value;
      const newPassword = this.passwordForm.get('newPassword')?.value;

      this.userService.changePassword(currentPassword, newPassword).subscribe({
        next: (response) => {
      Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: response.message, // le message JSON du backend
          confirmButtonColor: '#3085d6'
        });
               this.isChangingPassword = false;
          this.passwordForm.reset();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du changement de mot de passe:', error);
          let errorMessage = 'Erreur lors du changement de mot de passe';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }
    Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#d33'
        });
                  this.loading = false;
        }
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    }
    return null;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }



// ✅ MÉTHODE AJOUTÉE: Vérifier si l'utilisateur est administrateur
isAdmin(): boolean {
  return this.hasRole('ROLE_ADMIN');
}
getRoleDisplay(): string {
  if (!this.user?.roles || !Array.isArray(this.user.roles) || this.user.roles.length === 0) {
    return 'Utilisateur';
  }

  return this.user.roles
    .filter(role => role) // Filtrer les valeurs nulles/undefined
    .map(role => {
      // TypeScript: role peut être string ou Role
      const r = role as string | { name: string };

      if (typeof r === 'string') {
        const roleName = r.replace('ROLE_', '');
        return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
      } else if (r.name) {
        const roleName = r.name.replace('ROLE_', '');
        return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
      }

      return 'Utilisateur';
    })
    .join(', ') || 'Utilisateur';
}

// ✅ MÉTHODE CORRIGÉE: Vérification des rôles selon la nouvelle structure
hasRole(roleName: string): boolean {
  if (!this.user?.roles || !Array.isArray(this.user.roles)) {
    return false;
  }
  return this.user.roles.some(role => {
    if (typeof role === 'string') {
      return role === roleName;
    } else if (role && role.name) {
      return role.name === roleName;
    }
    return false;
  });
}

// ✅ MÉTHODE CORRIGÉE: Obtenir le rôle principal
getPrimaryRole(): string {
  if (!this.user?.roles || !Array.isArray(this.user.roles) || this.user.roles.length === 0) {
    return 'ROLE_USER';
  }

  const firstRole = this.user.roles[0];
  if (typeof firstRole === 'string') {
    return firstRole;
  } else if (firstRole && firstRole.name) {
    return firstRole.name;
  }
  return 'ROLE_USER';
}

// ✅ MÉTHODE CORRIGÉE: Gestion sécurisée du statut
getStatusBadgeClass(): string {
  if (!this.user) return 'status-unknown';
  if (this.user.banned === true) return 'status-banned';
  if (this.user.suspended === true) return 'status-suspended';
  return 'status-active';
}

// ✅ MÉTHODE CORRIGÉE: Gestion sécurisée du texte de statut
getStatusText(): string {
  if (!this.user) return 'Inconnu';
  if (this.user.banned === true) return 'Banni';
  if (this.user.suspended === true) return 'Suspendu';
  return 'Actif';
}

}
