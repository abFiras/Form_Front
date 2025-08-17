import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
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

  login() {
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
  }

  goHome() {
    window.location.href = '/';
  }

  socialLogin(provider: string) {
    alert(`Connexion avec ${provider} - Fonctionnalité à implémenter`);
  }
}
