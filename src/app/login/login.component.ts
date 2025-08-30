import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  remember = false;
  loading = false;
  showError = false;
  errorMessage = 'Email ou mot de passe incorrect';

  togglePasswordVisibility(passwordInput: HTMLInputElement, toggleIcon: HTMLElement) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
    }
  }

  /*login() {
    this.showError = false;
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      if (this.email === 'admin@dsgroupe.com' && this.password === 'password123') {
        alert('Connexion réussie ! Redirection vers le tableau de bord...');
        window.location.href = '/dashboard';
      } else {
        this.showError = true;
      }
    }, 2000);
  }*/

  goHome() {
    window.location.href = '/';
  }

  socialLogin(provider: string) {
    alert(`Connexion avec ${provider} - Fonctionnalité à implémenter`);
  }
   loginFormGroup!: FormGroup;
  hidePassword = true;
  protected aFormGroup!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginFormGroup = this.fb.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required]],
      rememberMe: [false], // Optionnel, selon si vous voulez implémenter cette fonctionnalité
    });
    this.aFormGroup = this.formBuilder.group({
   //   recaptcha: ['', Validators.required],
    });
  }
  siteKey: string = '6LevP4spAAAAAGORJ4Z3vjGfitgthh0dJjsHyOWE';
  private isAuthenticated: boolean = false;

  login() {
  this.authService.login(this.loginFormGroup.value).subscribe(
    (response) => {
this.snackbar.open('Connexion réussie.', 'Fermer', { duration: 5000 });
      this.router.navigate(['/dashboard']);
      console.log("avec succès");
    },
    (error) => {
      console.error('Login error:', error);

      if (error.status === 403 && error.error?.error) {
        // Message spécifique si utilisateur banni
        this.snackbar.open(error.error.error, 'Fermer', { duration: 5000 });
      } else {
        // Message générique
        this.snackbar.open('Échec de connexion. Vérifiez vos identifiants.', 'Fermer', { duration: 5000 });
      }
    }
  );
}


}
