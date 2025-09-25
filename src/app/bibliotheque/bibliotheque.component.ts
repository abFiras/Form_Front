import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LibraryFilters, LibraryFormDTO, LibraryService } from '../service/library.service';
import { Router } from '@angular/router';
import { FormDTO } from '../models/form.models';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-bibliotheque',
    standalone: false,
  templateUrl: './bibliotheque.component.html',
  styleUrls: ['./bibliotheque.component.css']
})
export class BibliothequeComponent implements OnInit {
  libraryForms: LibraryFormDTO[] = [];
  filteredForms: LibraryFormDTO[] = [];
  popularForms: LibraryFormDTO[] = [];
  recentForms: LibraryFormDTO[] = [];
    currentUserId!: number;

  loading = false;

  // Filtres
  filters: LibraryFilters = {
    search: '',
    origin: '',
    language: '',
    sortBy: 'relevance'
  };

  // Options pour les filtres
  originOptions = [
    { value: '', label: 'Toutes les origines' },
    { value: 'kizeo', label: 'Bibliothèque Kizeo' },
    { value: 'account', label: 'Bibliothèque du compte' }
  ];

  languageOptions = [
    { value: '', label: 'Toutes les langues' },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'es', label: 'Espagnol' },
    { value: 'de', label: 'Allemand' }
  ];

  sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'recent', label: 'Plus récents' },
    { value: 'updated', label: 'Dernières mises à jour' },
    { value: 'popular', label: 'Plus populaires' }
  ];

  // Mode d'affichage
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private libraryService: LibraryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router:Router,
    private authService: AuthService,

  ) {}

  ngOnInit(): void {

     this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Current logged-in user:', user);
        this.currentUserId = user.id; // ✅ stocke l'ID utilisateur connecté
      this.loadLibraryForms();
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      }
    });

    this.loadPopularForms();
    this.loadRecentForms();

  }

   canEdit(form: LibraryFormDTO): boolean {
    return form.createdBy === this.currentUserId;
  }

  /**
   * Charge tous les formulaires de la bibliothèque
   */
  loadLibraryForms(): void {
    this.loading = true;
    this.libraryService.getLibraryForms(this.filters).subscribe({
      next: (forms) => {
        this.libraryForms = forms;
        this.filteredForms = forms;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des formulaires:', error);
        this.snackBar.open('Erreur lors du chargement des formulaires', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  /**
   * Charge les formulaires populaires
   */
  loadPopularForms(): void {
    this.libraryService.getPopularForms(3).subscribe({
      next: (forms) => {
        this.popularForms = forms;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des formulaires populaires:', error);
      }
    });
  }

  /**
   * Charge les formulaires récents
   */
  loadRecentForms(): void {
    this.libraryService.getRecentForms(3).subscribe({
      next: (forms) => {
        this.recentForms = forms;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des formulaires récents:', error);
      }
    });
  }

  /**
   * Applique les filtres de recherche
   */
  applyFilters(): void {
    this.loadLibraryForms();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      origin: '',
      language: '',
      sortBy: 'relevance'
    };
    this.loadLibraryForms();
  }

  /**
   * Change le mode de tri
   */
  onSortChange(): void {
    this.loadLibraryForms();
  }

  /**
   * Change le mode d'affichage
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  /**
   * Prévisualise un formulaire
   */
  previewForm(form: LibraryFormDTO): void {
    this.libraryService.incrementViewCount(form.id).subscribe({
      next: () => {
        //form.viewCount++;
        // Ici vous pouvez ouvrir une modal de prévisualisation
        this.snackBar.open('Prévisualisation du formulaire...', 'Fermer', {
          duration: 2000
        });
              this.router.navigate(['/forms', form.id]);

      },
      error: (error) => {
        console.error('Erreur lors de la prévisualisation:', error);
      }
    });
  }

  /**
   * Ajoute un formulaire au compte utilisateur
   */
  addToAccount(form: LibraryFormDTO): void {
    this.libraryService.addFormToAccount(form.id).subscribe({
      next: (newForm) => {
        form.downloadCount++;
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

  /**
   * Supprime un formulaire de la bibliothèque (admin seulement)
   */
  removeFromLibrary(form: LibraryFormDTO): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire de la bibliothèque ?')) {
      this.libraryService.removeFromLibrary(form.id).subscribe({
        next: () => {
          this.libraryForms = this.libraryForms.filter(f => f.id !== form.id);
          this.filteredForms = this.filteredForms.filter(f => f.id !== form.id);
          this.snackBar.open('Formulaire supprimé de la bibliothèque', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  /**
   * Télécharge un formulaire (export)
   */
  downloadForm(form: LibraryFormDTO): void {
    // Ici vous pouvez implémenter l'export Word/Excel
    this.snackBar.open('Fonctionnalité de téléchargement en cours de développement', 'Fermer', {
      duration: 3000
    });
  }

  /**
   * Formate la date d'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Retourne l'icône selon le type d'origine
   */
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

  /**
   * Retourne la couleur selon la langue
   */
  getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      'fr': '#3f51b5',
      'en': '#4caf50',
      'es': '#ff9800',
      'de': '#f44336'
    };
    return colors[language] || '#9e9e9e';
  }

  /**
   * Calcule la popularité combinée (vues + téléchargements)
   */
  getTotalPopularity(form: LibraryFormDTO): number {
    return form.viewCount + form.downloadCount;
  }
}
