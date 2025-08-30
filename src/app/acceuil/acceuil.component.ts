import { Component } from '@angular/core';

@Component({
  selector: 'app-acceuil',
  standalone: false,
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css'
})
export class AcceuilComponent {
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
      count: '24',
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
