import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormDTO, FormSubmissionResponseDTO } from '../models/form.models';

@Component({
  selector: 'app-form-submissions',
    standalone: false,
  templateUrl: './form-submissions.component.html',
  styleUrls: ['./form-submissions.component.css']
})
export class FormSubmissionsComponent implements OnInit {
  formId!: number;
  currentForm?: FormDTO;
  submissions: FormSubmissionResponseDTO[] = [];
  isLoading = false;


  constructor(
    private route: ActivatedRoute,
      private router: Router, // ✅ Ajoutez cette ligne

    private formService: FormService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.formId = +params['id'];
      this.loadForm();
      this.loadSubmissions();
    });
  }

  loadForm(): void {
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.currentForm = form;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du formulaire:', error);
        this.snackBar.open('Erreur lors du chargement du formulaire', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadSubmissions(): void {
    this.isLoading = true;
    this.formService.getFormSubmissions(this.formId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des soumissions:', error);
        this.snackBar.open('Erreur lors du chargement des soumissions', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

viewSubmissionDetails(submission: FormSubmissionResponseDTO): void {
  // Passer les données de la soumission au composant de détail
  this.router.navigate(['/forms', this.formId, 'submissions', submission.id, 'detail'], {
    state: {
      submissionData: submission,
      formData: this.currentForm
    }
  });
}

  exportSubmissions(): void {
    // Exporter les soumissions en CSV ou PDF
    const csvData = this.convertToCSV(this.submissions);
    this.downloadCSV(csvData, `form_${this.formId}_submissions.csv`);
  }

  private convertToCSV(submissions: FormSubmissionResponseDTO[]): string {
    if (submissions.length === 0) return '';

    const headers = ['Date de soumission', 'Utilisateur', 'Statut', 'Données'];
    const csvContent = [
      headers.join(','),
      ...submissions.map(submission => [
        new Date(submission.submittedAt).toLocaleDateString(),
        submission.submitterName || 'Anonyme',
        submission.status,
        JSON.stringify(submission.data).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getSubmitterDisplay(submission: FormSubmissionResponseDTO): string {
    if (submission.submitterName) {
      return submission.submitterName;
    }
    if (submission.submitterEmail) {
      return submission.submitterEmail;
    }
    return 'Utilisateur anonyme';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'primary';
      case 'REVIEWED': return 'accent';
      case 'APPROVED': return 'primary';
      case 'REJECTED': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'Soumis';
      case 'REVIEWED': return 'Examiné';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  }
 goToMyForms(): void {
    this.router.navigate(['/forms']);
  }

  copyPublicUrl(): void {
    const publicUrl = this.formService.getPublicFormUrl(this.formId);
    navigator.clipboard.writeText(publicUrl).then(() => {
      this.snackBar.open('URL copiée dans le presse-papier', 'Fermer', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Erreur lors de la copie de l\'URL', 'Fermer', { duration: 3000 });
    });
  }

  // ✅ Ajoutez ces méthodes à votre FormSubmissionsComponent

// Filtrer les soumissions par statut
getSubmissionsByStatus(status: string): FormSubmissionResponseDTO[] {
  return this.submissions.filter(submission => submission.status === status);
}

// Calculer le temps écoulé depuis la soumission
getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays} jour(s)`;
}

// Générer un résumé des données
getDataSummary(data: { [key: string]: any }): string {
  const keys = Object.keys(data);
  const nonEmptyFields = keys.filter(key =>
    data[key] !== null &&
    data[key] !== '' &&
    data[key] !== undefined &&
    !key.endsWith('_type')
  );

  return `${nonEmptyFields.length} champ(s) rempli(s)`;
}

// Basculer l'expansion des détails
toggleDataExpansion(submission: FormSubmissionResponseDTO): void {
  submission.expanded = !submission.expanded;
}

// Vérifier si une ligne est expansée
isExpanded = (index: number, item: FormSubmissionResponseDTO) => item.expanded;

// Formater les données pour l'affichage
getFormattedData(data: { [key: string]: any }): { [key: string]: any } {
  const formatted: { [key: string]: any } = {};

  Object.keys(data).forEach(key => {
    // Ignorer les champs de type (_type)
    if (!key.endsWith('_type') && data[key] !== null && data[key] !== '') {
      formatted[key] = data[key];
    }
  });

  return formatted;
}

// Obtenir le label d'un champ
getFieldLabel(fieldName: string): string {
  if (!this.currentForm) return fieldName;

  const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
  return field ? field.label : this.formatFieldName(fieldName);
}

// Formater le nom de champ pour l'affichage
private formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

// Formater la valeur d'un champ
formatFieldValue(value: any): string {
  if (value === null || value === undefined) return 'Non renseigné';

  if (typeof value === 'object') {
    if (value.latitude && value.longitude) {
      return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
    }
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }

  return value.toString();
}

// Vérifier si c'est un champ fichier
isFileField(fieldName: string): boolean {
  const value = this.getFieldTypeFromForm(fieldName);
  return ['file', 'attachment', 'photo'].includes(value);
}

// Vérifier si c'est un champ signature
isSignatureField(fieldName: string): boolean {
  const value = this.getFieldTypeFromForm(fieldName);
  return ['signature', 'drawing'].includes(value);
}

// Obtenir le type de champ depuis le formulaire
private getFieldTypeFromForm(fieldName: string): string {
  if (!this.currentForm) return '';

  const field = this.currentForm.fields.find(f => f.fieldName === fieldName);
  return field ? field.type : '';
}

// Mettre à jour le statut d'une soumission
updateSubmissionStatus(submission: FormSubmissionResponseDTO, newStatus: string): void {
  // Implémentation de la mise à jour du statut
  // Vous devrez créer un endpoint backend pour cela
  console.log('Updating submission status:', submission.id, 'to', newStatus);

  // Mise à jour locale temporaire
  submission.status = newStatus;

  this.snackBar.open(`Statut mis à jour: ${this.getStatusLabel(newStatus)}`, 'Fermer', {
    duration: 3000
  });
}

// Télécharger une soumission en PDF
downloadSubmissionPDF(submission: FormSubmissionResponseDTO): void {
  // Implémentation du téléchargement PDF
  console.log('Downloading PDF for submission:', submission.id);

  // Pour l'instant, juste un message
  this.snackBar.open('Téléchargement PDF à implémenter', 'Fermer', { duration: 3000 });
}

// Prévisualiser le formulaire public
previewPublicForm(): void {
  if (this.formId && this.currentForm?.status === 'PUBLISHED') {
    const publicUrl = `/public/forms/${this.formId}`;
    window.open(publicUrl, '_blank');
  } else {
    this.snackBar.open('Le formulaire doit être publié pour être prévisualisé', 'Fermer', { duration: 3000 });
  }
}

// Mise à jour des colonnes affichées
displayedColumns: string[] = ['submittedAt', 'submitter', 'status', 'dataPreview', 'actions'];
}
