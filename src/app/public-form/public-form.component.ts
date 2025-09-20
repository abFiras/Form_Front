import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormDTO, FormFieldDTO, FormSubmissionRequest } from '../models/form.models';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-public-form',
  standalone: false,
  templateUrl: './public-form.component.html',
  styleUrl: './public-form.component.css'
})
export class PublicFormComponent implements OnInit {
  publishedForms: FormDTO[] = [];
  isLoading = true;
  currentUser: any;

  constructor(
    private formService: FormService,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPublishedForms();
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('Utilisateur connecté:', user.username);
      },
      error: (error) => {
        console.error('Erreur récupération utilisateur:', error);
      }
    });
  }
getAccessibleCount(): number {
  return this.publishedForms.filter(f => f.isAccessible).length;
}

getRestrictedCount(): number {
  return this.publishedForms.filter(f => !f.isAccessible).length;
}

  loadPublishedForms(): void {
    this.isLoading = true;

    this.formService.getPublishedForms().subscribe({
      next: (forms) => {
        this.publishedForms = forms;
        this.isLoading = false;

        console.log(`${forms.length} formulaires publiés accessibles`);

        if (forms.length === 0) {
          this.snackBar.open(
            'Aucun formulaire publié n\'est accessible avec vos groupes actuels',
            'Fermer',
            { duration: 5000 }
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur chargement formulaires publiés:', error);
        this.snackBar.open(error || 'Erreur lors du chargement', 'Fermer', { duration: 5000 });
      }
    });
  }

  fillForm(form: FormDTO): void {
    if (!form.isAccessible) {
      this.snackBar.open('Vous n\'avez pas accès à ce formulaire', 'Fermer', { duration: 3000 });
      return;
    }

    console.log('Redirection vers remplissage du formulaire:', form.name);
    this.router.navigate(['/forms', form.id, 'fill']);
  }

  getFormStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED': return '#4caf50';
      case 'DRAFT': return '#ff9800';
      default: return '#666';
    }
  }

  getFormStatusText(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'Publié';
      case 'DRAFT': return 'Brouillon';
      default: return status;
    }
  }

  getAccessibleGroupNames(form: FormDTO): string[] {
    return form.assignedGroups?.map(group => group.name) || [];
  }

  getGroupAccessMessage(form: FormDTO): string {
    const groupNames = this.getAccessibleGroupNames(form);

    if (groupNames.length === 0) {
      return 'Accessible à tous les utilisateurs';
    } else if (groupNames.length === 1) {
      return `Réservé au groupe : ${groupNames[0]}`;
    } else {
      return `Réservé aux groupes : ${groupNames.join(', ')}`;
    }
  }

  refreshList(): void {
    this.loadPublishedForms();
  }

  goToMyForms(): void {
    this.router.navigate(['/forms']);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

 canFillForm(form: FormDTO): boolean {
  return form.status === 'PUBLISHED' && (form.isAccessible ?? false);
}


  getFormDescription(form: FormDTO): string {
    if (!form.description || form.description.trim() === '') {
      return 'Aucune description disponible';
    }

    // Limiter la description à 150 caractères
    if (form.description.length > 150) {
      return form.description.substring(0, 150) + '...';
    }

    return form.description;
  }
trackByFormId(index: number, form: FormDTO): number {
  return form.id ?? 0;
}

}
