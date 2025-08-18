import { Component, OnInit } from '@angular/core';

import { AuthService } from '../service/auth.service';
import { UserService, Utilisateur } from '../service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


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
  profilePhotoUrl = '';

  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
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
  this.authService.getCurrentUser().subscribe({
    next: (user) => {
      if (user) { // ✅ Vérification
        this.user = user;

        this.profileForm.patchValue({
          username: user.username ?? '',
          email: user.email ?? '',
          phone: user.phone ?? ''
        });
      }
    },
    error: (err) => {
      console.error('Erreur de récupération utilisateur:', err);
    }
  });
}



  onProfilePhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
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
      const updatedUser: Utilisateur = {
        ...this.user,
        ...this.profileForm.value
      };

      this.userService.updateUser(this.user.id!, updatedUser).subscribe({
        next: (response) => {
          this.user = response;
          this.isEditingProfile = false;
          this.showMessage('Profil mis à jour avec succès!', 'success');
          this.loading = false;
        },
        error: (error) => {
          this.showMessage('Erreur lors de la mise à jour du profil', 'error');
          this.loading = false;
        }
      });
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
      // Ici vous devriez appeler votre service pour changer le mot de passe
      // this.authService.changePassword(this.passwordForm.value).subscribe(...)

      // Simulation d'une requête
      setTimeout(() => {
        this.showMessage('Mot de passe modifié avec succès!', 'success');
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.loading = false;
      }, 1000);
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

  getRoleDisplay(): string {
    if (!this.user?.roles) return '';
    return this.user.roles.map(role =>
      role.name.replace('ROLE_', '').toLowerCase()
    ).join(', ');
  }

  getStatusBadgeClass(): string {
    if (this.user?.banned) return 'status-banned';
    if (this.user?.suspended) return 'status-suspended';
    return 'status-active';
  }

  getStatusText(): string {
    if (this.user?.banned) return 'Banni';
    if (this.user?.suspended) return 'Suspendu';
    return 'Actif';
  }
}
