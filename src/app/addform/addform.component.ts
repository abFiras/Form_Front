import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { AuthService } from '../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-addform',
  standalone: false,
  templateUrl: './addform.component.html',
  styleUrl: './addform.component.css'
})
export class AddformComponent implements OnInit {

  formTemplates = [
    {
      id: 'custom',
      title: 'Créer un nouveau formulaire personnalisé',
      icon: 'add',
      description: 'Créez votre formulaire à partir de zéro avec tous les éléments disponibles',
      isNew: false
    },
    {
      id: 'library',
      title: 'Choisir un modèle d\'exemple de la bibliothèque',
      icon: 'library_books',
      description: 'Sélectionnez un modèle prêt à utiliser et personnalisez-le selon vos besoins',
      isNew: false
    },
    {
      id: 'ai',
      title: 'Utiliser l\'IA pour créer un formulaire personnalisé',
      icon: 'auto_awesome',
      description: 'Décrivez ce dont vous avez besoin et l\'IA créera le formulaire pour vous',
      isNew: true,
      isBeta: true
    }
  ];

  constructor(
    private router: Router,
    private formService: FormService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initialization logic if needed
  }

  onTemplateSelect(templateId: string): void {
    switch (templateId) {
      case 'custom':
        this.createCustomForm();
        break;
      case 'library':
        this.openLibrary();
        break;
      case 'ai':
        this.openAIAssistant();
        break;
      default:
        console.error('Unknown template:', templateId);
    }
  }

  private createCustomForm(): void {
    // Navigate to form builder for creating a new form
    this.router.navigate(['/forms/new']);
  }

  private openLibrary(): void {
    // Navigate to template library or show template selection dialog
    this.snackBar.open('Bibliothèque de modèles - Fonctionnalité en cours de développement', 'Fermer', {
      duration: 3000
    });
    // TODO: Implement template library
    // this.router.navigate(['/forms/templates']);
  }

  private openAIAssistant(): void {
    // Navigate to AI form creation assistant
    this.snackBar.open('Assistant IA - Fonctionnalité en cours de développement', 'Fermer', {
      duration: 3000
    });
    // TODO: Implement AI assistant
    // this.router.navigate(['/forms/ai-assistant']);
  }

  goBack(): void {
    this.router.navigate(['/forms']);
  }
}
