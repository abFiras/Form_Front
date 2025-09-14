import { Component } from '@angular/core';
import { FormDTO } from '../models/form.models';
import { FormService } from '../service/FormService';

@Component({
  selector: 'app-acceuil',
  standalone: false,
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css'
})
export class AcceuilComponent {
  forms: FormDTO[] = [];

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.formService.getAllForms().subscribe({
      next: (forms) => {
        this.forms = forms;
        console.log('Nombre de formulaires:', this.forms.length);

        // mettre à jour le dashboard
        this.dashboardData.forms.count = this.forms.length.toString();
      },
      error: (error) => {
        console.error('Error loading forms:', error);
      }
    });
  }

  dashboardData = {
    plateauInfo: {
      title: 'Plateau SMTA',
      subtitle: 'CINRJ',
      icon: 'PS'
    },
    contractEndDate: {
      date: '14 janv. 2026',
      subtitle: 'Date de fin du dernier contrat'
    },
    users: {
      count: '3/4',
      subtitle: 'Utilisateur(s) actif(s) / Licence(s)'
    },
    forms: {
      count: '0', // valeur par défaut
      subtitle: 'Formulaire(s)'
    },
    lastData: {
      days: '9 jours',
      subtitle: 'Dernière donnée reçue'
    },
    totalData: {
      count: '1018',
      subtitle: 'Données enregistrées'
    },
    sponsorship: {
      title: 'Parrainage'
    }
  };
}
