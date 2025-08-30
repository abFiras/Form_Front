import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LibraryFormDTO, LibraryService } from '../service/library.service';

export interface FormFieldPreview {
  id: number;
  type: string;
  label: string;
  fieldName: string;
  placeholder?: string;
  order: number;
  required: boolean;
  options?: string[];
  validation?: any;
  styling?: any;
}

export interface FormDetailDTO extends LibraryFormDTO {
  fields: FormFieldPreview[];
}

@Component({
  selector: 'app-library-form-detail',
  standalone: false,
  templateUrl: './library-form-detail.component.html',
  styleUrls: ['./library-form-detail.component.css']
})
export class LibraryFormDetailComponent implements OnInit {
  formDetail: FormDetailDTO | null = null;
  loading = true;
  libraryFormId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private libraryService: LibraryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.libraryFormId = +params['id'];
      this.loadFormDetail();
    });
  }

  loadFormDetail(): void {
    this.loading = true;

    // Simuler le chargement des détails (vous devrez implémenter cette méthode dans le service)
    this.libraryService.getLibraryFormDetail(this.libraryFormId).subscribe({
      next: (detail) => {
        this.formDetail = detail;
        this.loading = false;
        // Incrémenter le compteur de vues
        this.libraryService.incrementViewCount(this.libraryFormId).subscribe();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails:', error);
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement du formulaire', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bib']);
  }

  addToAccount(): void {
    if (!this.formDetail) return;

    this.libraryService.addFormToAccount(this.formDetail.id).subscribe({
      next: (newForm) => {
        this.formDetail!.downloadCount++;
        this.snackBar.open('Formulaire ajouté à votre compte avec succès!', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du formulaire:', error);
        this.snackBar.open('Erreur lors de l\'ajout du formulaire', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

downloadForm(format: 'word' | 'excel'): void {
  if (!this.formDetail) return;

  this.snackBar.open(`Téléchargement ${format.toUpperCase()} en cours...`, 'Fermer', { duration: 2000 });

  if (format === 'word') {
    this.libraryService.downloadFormAsWord(this.formDetail.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formulaire_bibliotheque_${this.formDetail!.id}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Incrémenter le compteur côté front
        this.formDetail!.downloadCount++;
      },
      error: (err) => {
        console.error('Erreur téléchargement Word', err);
        this.snackBar.open('Erreur lors du téléchargement du fichier Word', 'Fermer', { duration: 3000 });
      }
    });
  }
}


  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      'fr': '#3f51b5',
      'en': '#4caf50',
      'es': '#ff9800',
      'de': '#f44336'
    };
    return colors[language] || '#9e9e9e';
  }

  getOriginIcon(origin: string): string {
    switch (origin) {
      case 'kizeo':
        return 'library_books';
      case 'account':
        return 'folder_shared';
      default:
        return 'description';
    }
  }

  getFieldTypeIcon(fieldType: string): string {
    const iconMap: { [key: string]: string } = {
      'text': 'text_fields',
      'email': 'email',
      'number': 'pin',
      'textarea': 'notes',
      'select': 'arrow_drop_down_circle',
      'radio': 'radio_button_checked',
      'checkbox': 'check_box',
      'date': 'calendar_today',
      'datetime': 'schedule',
      'file': 'attach_file',
      'phone': 'phone',
      'url': 'link'
    };
    return iconMap[fieldType] || 'help_outline';
  }

  getFieldTypeLabel(fieldType: string): string {
    const labelMap: { [key: string]: string } = {
      'text': 'Texte',
      'email': 'Email',
      'number': 'Nombre',
      'textarea': 'Zone de texte',
      'select': 'Liste déroulante',
      'radio': 'Bouton radio',
      'checkbox': 'Case à cocher',
      'date': 'Date',
      'datetime': 'Date et heure',
      'file': 'Fichier',
      'phone': 'Téléphone',
      'url': 'URL'
    };
    return labelMap[fieldType] || fieldType;
  }
}
