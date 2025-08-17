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

    // if (this.loginFormGroup.invalid) {
    //   this.snackbar.open('Please fill all fields correctly.', 'close', {
    //     duration: 5000,
    //   });
    //   return;
    // }

    this.authService.login(this.loginFormGroup.value).subscribe(
      (response) => {
        this.snackbar.open('Login successful.', 'close', { duration: 5000 });
        this.router.navigate(['/ajouterform']);
        console.log("avecc success");
        // Redirection vers la page de profil après une connexion réussie
      },
      (error) => {
        console.error('Login error:', error);
        this.snackbar.open(
          'Failed to log in. Please check your credentials.',
          'close',
          { duration: 5000 }
        );
        // Ne pas rediriger vers la page de profil en cas d'erreur
      }
    );
  }


}
