import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExternalListService, ExternalListDTO } from '../service/external-list.service';
import { AuthService } from '../service/auth.service';
import * as XLSX from 'xlsx';

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
  selectedFilter = ''; // <-- par défaut montrer toutes les listes
  selectedRubrique = '';
  rubriques: string[] = [];

  loading = false;
  currentUserId!: number;

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
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = Number(user.id);
        console.log(this.currentUserId,"user ");
      this.loadLists(); // 👉 Charger après avoir récupéré l'ID utilisateur

      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });
  }

 loadLists(): void {
    this.loading = true;

    this.externalListService.getAllExternalLists().subscribe({
      next: (allLists) => {
        this.myLists = allLists.filter(list => list.createdBy === this.currentUserId);
        this.otherLists = allLists.filter(list => list.createdBy !== this.currentUserId);
        this.libraryLists = allLists.filter(list => list.listType === 'LIBRARY');

        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement listes', error);
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

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      listsToDisplay = listsToDisplay.filter(list =>
        list.name.toLowerCase().includes(query) ||
        (list.description && list.description.toLowerCase().includes(query))
      );
    }

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
  downloadExternalListsExcel(): void {
  if (!this.displayedLists || this.displayedLists.length === 0) {
    this.snackBar.open('Aucune liste à exporter', 'Fermer', { duration: 3000 });
    return;
  }

  try {
    // Préparer les données pour Excel
    const dataForExcel = this.displayedLists.map(list => ({
      'Nom de la liste': list.name,
      'Rubrique': list.rubrique || '-',
      'Nombre d\'éléments': list.itemCount || 0,
      'Type': this.getListTypeLabel(list.listType),
      'Liste avancée': list.isAdvanced ? 'Oui' : 'Non',
      'Filtrée': list.isFiltered ? 'Oui' : 'Non',
      'Propriétaire': list.createdBy === this.currentUserId ? 'Moi' : (list.createdName || 'Inconnu')
    }));

    // Créer le workbook et la feuille
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForExcel);

    // Ajuster la largeur des colonnes
    ws['!cols'] = [
      { wch: 30 }, // Nom de la liste
      { wch: 20 }, // Rubrique
      { wch: 15 }, // Nombre d'éléments
      { wch: 15 }, // Type
      { wch: 12 }, // Liste avancée
      { wch: 12 }, // Filtrée
      { wch: 20 }  // Propriétaire
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Listes Externes');

    // Générer le fichier Excel
    const fileName = `listes_externes_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);

    this.snackBar.open('Fichier Excel téléchargé avec succès', 'Fermer', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });

  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    this.snackBar.open('Erreur lors de la création du fichier Excel', 'Fermer', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }
}


  /**
   * Télécharge un fichier Excel exemple pour tester l'importation
   */
  downloadExampleExcelFile(): void {
    // Données d'exemple pour différents types de listes
    const sampleData = [
      {
        'Nom': 'France',
        'Code': 'FR',
        'Continent': 'Europe',
        'Population': '67000000'
      },
      {
        'Nom': 'Allemagne',
        'Code': 'DE',
        'Continent': 'Europe',
        'Population': '83000000'
      },
      {
        'Nom': 'Espagne',
        'Code': 'ES',
        'Continent': 'Europe',
        'Population': '47000000'
      },
      {
        'Nom': 'Italie',
        'Code': 'IT',
        'Continent': 'Europe',
        'Population': '60000000'
      },
      {
        'Nom': 'Royaume-Uni',
        'Code': 'UK',
        'Continent': 'Europe',
        'Population': '67000000'
      },
      {
        'Nom': 'Japon',
        'Code': 'JP',
        'Continent': 'Asie',
        'Population': '125000000'
      },
      {
        'Nom': 'États-Unis',
        'Code': 'US',
        'Continent': 'Amérique du Nord',
        'Population': '331000000'
      },
      {
        'Nom': 'Canada',
        'Code': 'CA',
        'Continent': 'Amérique du Nord',
        'Population': '38000000'
      },
      {
        'Nom': 'Australie',
        'Code': 'AU',
        'Continent': 'Océanie',
        'Population': '25000000'
      },
      {
        'Nom': 'Brésil',
        'Code': 'BR',
        'Continent': 'Amérique du Sud',
        'Population': '215000000'
      }
    ];

    try {
      // Créer un workbook
      const wb = XLSX.utils.book_new();

      // Créer une feuille de calcul avec les données d'exemple
      const ws = XLSX.utils.json_to_sheet(sampleData);

      // Ajouter quelques styles (largeur des colonnes)
      const colWidths = [
        { wch: 15 }, // Nom
        { wch: 8 },  // Code
        { wch: 20 }, // Continent
        { wch: 12 }  // Population
      ];
      ws['!cols'] = colWidths;

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pays');

      // Créer une deuxième feuille avec un exemple plus simple
      const simpleData = [
        { 'Label': 'Option 1', 'Value': 'opt1' },
        { 'Label': 'Option 2', 'Value': 'opt2' },
        { 'Label': 'Option 3', 'Value': 'opt3' },
        { 'Label': 'Option 4', 'Value': 'opt4' },
        { 'Label': 'Option 5', 'Value': 'opt5' }
      ];

      const ws2 = XLSX.utils.json_to_sheet(simpleData);
      ws2['!cols'] = [{ wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Liste Simple');

      // Créer une troisième feuille avec des données invalides pour tester la validation
      const invalidData = [
        { 'Label': 'Valide', 'Code': 'V1', 'Note': 'Ligne correcte' },
        { 'Label': '', 'Code': 'V2', 'Note': 'Label vide - sera ignoré' },
        { 'Label': 'Avec caractères spéciaux @#$', 'Code': 'V3', 'Note': 'Test caractères' },
        { 'Label': 'Très long nom qui dépasse la limite normale pour tester la gestion des textes longs dans l\'importation', 'Code': 'V4', 'Note': 'Texte long' }
      ];

      const ws3 = XLSX.utils.json_to_sheet(invalidData);
      ws3['!cols'] = [{ wch: 30 }, { wch: 8 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Test Validation');

      // Générer le fichier Excel
      const fileName = `exemple_liste_externe_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      this.snackBar.open('Fichier Excel exemple téléchargé avec succès', 'Fermer', {
        duration: 4000,
        panelClass: ['success-snackbar']
      });

    } catch (error) {
      console.error('Erreur lors de la création du fichier Excel:', error);
      this.snackBar.open('Erreur lors de la création du fichier Excel', 'Fermer', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Télécharge un modèle Excel vide avec les en-têtes recommandés
   */
  downloadExcelTemplate(): void {
    try {
      // Créer un workbook
      const wb = XLSX.utils.book_new();

      // Créer une feuille avec seulement les en-têtes
      const templateData = [
        { 'Label': '', 'Value': '', 'Description': '' }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);

      // Définir la largeur des colonnes
      ws['!cols'] = [
        { wch: 20 }, // Label
        { wch: 15 }, // Value
        { wch: 30 }  // Description
      ];

      // Supprimer la ligne de données vide (garder seulement les en-têtes)
      delete ws['A2'];
      delete ws['B2'];
      delete ws['C2'];
      ws['!ref'] = 'A1:C1';

      XLSX.utils.book_append_sheet(wb, ws, 'Modèle');

      // Générer le fichier
      const fileName = `modele_liste_externe.xlsx`;
      XLSX.writeFile(wb, fileName);

      this.snackBar.open('Modèle Excel téléchargé avec succès', 'Fermer', {
        duration: 4000,
        panelClass: ['success-snackbar']
      });

    } catch (error) {
      console.error('Erreur lors de la création du modèle:', error);
      this.snackBar.open('Erreur lors de la création du modèle', 'Fermer', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    }
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

  getOwnerLabel(list: ExternalListDTO): string {
    if (list.createdBy === this.currentUserId) {
      return "Moi";
    }
    return list.createdName || "Inconnu";
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
