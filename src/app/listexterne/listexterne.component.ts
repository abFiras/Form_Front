import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExternalListService, ExternalListDTO } from '../service/external-list.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-listexterne',
  standalone: false,
  templateUrl: './listexterne.component.html',
  styleUrls: ['./listexterne.component.css']
})
export class ListexterneComponent implements OnInit {
  myLists: ExternalListDTO[] = [];
  otherLists: ExternalListDTO[] = [];
  libraryLists: ExternalListDTO[] = [];

  displayedLists: ExternalListDTO[] = [];
  searchQuery = '';
  selectedFilter = 'mes-listes';
  selectedRubrique = '';
  rubriques: string[] = [];

  loading = false;
  currentUserId: number = 1;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private externalListService: ExternalListService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadRubriques();
    this.loadLists();
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = Number(user.id);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });
  }

  loadLists(): void {
    this.loading = true;

    // Charger mes listes
    this.externalListService.getExternalListsByUser(this.currentUserId).subscribe({
      next: (lists) => {
        this.myLists = lists;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des listes:', error);
      }
    });

    // Charger toutes les autres listes (simulé - à adapter selon vos besoins)
    this.externalListService.getAllExternalLists().subscribe({
      next: (allLists) => {
        this.otherLists = allLists.filter(list => list.createdBy !== this.currentUserId);
        this.libraryLists = allLists.filter(list => list.listType === 'LIBRARY'); // Exemple de filtre
        this.loading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des autres listes:', error);
        this.loading = false;
      }
    });
  }

  loadRubriques(): void {
    this.externalListService.getAllRubriques().subscribe({
      next: (rubriques) => {
        this.rubriques = rubriques;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rubriques:', error);
      }
    });
  }

  applyFilters(): void {
    let listsToDisplay: ExternalListDTO[] = [];

    // Sélection selon le filtre
    switch (this.selectedFilter) {
      case 'mes-listes':
        listsToDisplay = [...this.myLists];
        break;
      case 'autres-listes':
        listsToDisplay = [...this.otherLists];
        break;
      case 'bibliotheque':
        listsToDisplay = [...this.libraryLists];
        break;
      default:
        listsToDisplay = [...this.myLists, ...this.otherLists, ...this.libraryLists];
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      listsToDisplay = listsToDisplay.filter(list =>
        list.name.toLowerCase().includes(query) ||
        (list.description && list.description.toLowerCase().includes(query))
      );
    }

    // Filtre par rubrique
    if (this.selectedRubrique) {
      listsToDisplay = listsToDisplay.filter(list => list.rubrique === this.selectedRubrique);
    }

    this.displayedLists = listsToDisplay;
    this.totalItems = listsToDisplay.length;
  }

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onRubriqueChange(): void {
    this.applyFilters();
  }

  createNewList(): void {
    this.router.navigate(['/external-lists/create']);
  }

  editList(listId: number): void {
    this.router.navigate(['/external-lists', listId, 'edit']);
  }

  viewListDetails(listId: number): void {
    this.router.navigate(['/external-lists', listId]);
  }

  deleteList(list: ExternalListDTO): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la liste "${list.name}" ?`;

    if (confirm(confirmMessage)) {
      this.externalListService.deleteExternalList(list.id!).subscribe({
        next: () => {
          this.snackBar.open('Liste supprimée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadLists();
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

  duplicateList(list: ExternalListDTO): void {
    // Logique de duplication (à implémenter)
    this.snackBar.open(`Duplication de "${list.name}" - Fonctionnalité à implémenter`, 'Fermer', {
      duration: 3000
    });
  }

  exportList(list: ExternalListDTO): void {
    // Logique d'exportation (à implémenter)
    this.snackBar.open(`Export de "${list.name}" - Fonctionnalité à implémenter`, 'Fermer', {
      duration: 3000
    });
  }

  // Méthodes utilitaires
  getListTypeLabel(type: string): string {
    switch (type) {
      case 'STATIC': return 'Statique';
      case 'DYNAMIC': return 'Dynamique';
      case 'LIBRARY': return 'Bibliothèque';
      default: return type;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getOwnerLabel(createdBy: number): string {
    return createdBy === this.currentUserId ? 'D&S' : 'Autre';
  }

  // Pagination
  get paginatedLists(): ExternalListDTO[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.displayedLists.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  getMin(a: number, b: number): number {
  return Math.min(a, b);
}

}
