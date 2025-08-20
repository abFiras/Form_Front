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
  profilePhotoUrl = 'assets/default-avatar.png'; // Image par défaut

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
        if (user) {
          this.user = user;
          this.profilePhotoUrl = user.profilePhotoUrl || 'assets/default-avatar.png';

          this.profileForm.patchValue({
            username: user.username ?? '',
            email: user.email ?? '',
            phone: user.phone ?? ''
          });
        }
      },
      error: (err) => {
        console.error('Erreur de récupération utilisateur:', err);
        this.showMessage('Erreur lors du chargement du profil', 'error');
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
        this.profilePhotoUrl = this.user?.profilePhotoUrl || 'assets/default-avatar.png';
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
      const updates = this.profileForm.value;

      this.userService.updateProfile(updates).subscribe({
        next: (response) => {
          this.user = response;
          this.isEditingProfile = false;
          this.showMessage('Profil mis à jour avec succès!', 'success');
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          let errorMessage = 'Erreur lors de la mise à jour du profil';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.showMessage(errorMessage, 'error');
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
