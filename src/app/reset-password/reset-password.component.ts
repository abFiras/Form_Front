import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  step: 'request' | 'reset' = 'request';
  token: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Vérifier si on a un token dans l'URL
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (this.token) {
      this.step = 'reset';
      this.initResetForm();
    } else {
      this.step = 'request';
      this.initRequestForm();
    }
  }

  initRequestForm(): void {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  initResetForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.loading = true;

      if (this.step === 'request') {
        this.requestPasswordReset();
      } else {
        this.resetPassword();
      }
    }
  }

  requestPasswordReset(): void {
    const email = this.resetPasswordForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackbar.open(
          'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
          'Fermer',
          { duration: 5000 }
        );
        // Rediriger vers la page de connexion après quelques secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error requesting password reset:', error);
        this.snackbar.open(
          'Une erreur est survenue. Veuillez réessayer.',
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }

  resetPassword(): void {
    const { password } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token!, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackbar.open(
          'Mot de passe réinitialisé avec succès !',
          'Fermer',
          { duration: 5000 }
        );
        // Rediriger vers la page de connexion
        setTimeout(() => {
          this.router.navigate(['/connexion']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error resetting password:', error);
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

        if (error.error === 'Token invalide ou expiré') {
          errorMessage = 'Le lien de réinitialisation est invalide ou a expiré.';
        } else if (error.error === 'Token expiré') {
          errorMessage = 'Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.';
        }

        this.snackbar.open(errorMessage, 'Fermer', { duration: 5000 });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  // Ajoutez ces méthodes à votre ResetPasswordComponent

/**
 * Calcule la force du mot de passe
 * @param password Le mot de passe à évaluer
 * @returns Un score de 0 à 4
 */
private calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;

  // Longueur
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;

  // Caractères minuscules
  if (/[a-z]/.test(password)) score++;

  // Caractères majuscules
  if (/[A-Z]/.test(password)) score++;

  // Chiffres
  if (/\d/.test(password)) score++;

  // Caractères spéciaux
  if (/[^a-zA-Z\d]/.test(password)) score++;

  // Retourne un score normalisé entre 0 et 4
  return Math.min(Math.floor(score / 1.5), 4);
}

/**
 * Retourne la classe CSS pour la barre de force
 * @returns La classe CSS appropriée
 */
getPasswordStrengthClass(): string {
  const password = this.resetPasswordForm?.get('password')?.value || '';
  const strength = this.calculatePasswordStrength(password);

  switch (strength) {
    case 0:
    case 1:
      return 'weak';
    case 2:
      return 'fair';
    case 3:
      return 'good';
    case 4:
      return 'strong';
    default:
      return 'weak';
  }
}

/**
 * Retourne le texte de description de la force
 * @returns Le texte descriptif
 */
getPasswordStrengthText(): string {
  const password = this.resetPasswordForm?.get('password')?.value || '';
  const strength = this.calculatePasswordStrength(password);

  switch (strength) {
    case 0:
    case 1:
      return 'Mot de passe faible';
    case 2:
      return 'Mot de passe moyen';
    case 3:
      return 'Mot de passe bon';
    case 4:
      return 'Mot de passe fort';
    default:
      return 'Mot de passe faible';
  }
}
}
