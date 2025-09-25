import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExternalListService, ExternalListDTO } from '../service/external-list.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-external-list-detail',
    standalone:false,

  templateUrl: './external-list-detail.component.html',
  styleUrls: ['./external-list-detail.component.css']
})
export class ExternalListDetailComponent implements OnInit {
  list: ExternalListDTO | null = null;
  loading = false;
  error: string | null = null;
  listId: number | null = null;
  displayedColumns: string[] = ['order', 'label', 'value', 'active'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private externalListService: ExternalListService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.listId = +params['id'];
        this.loadListDetails();
      } else {
        this.error = 'ID de liste invalide';
      }
    });
  }

  loadListDetails(): void {
    if (!this.listId) return;

    this.loading = true;
    this.error = null;

    this.externalListService.getExternalListById(this.listId).subscribe({
      next: (list) => {
        this.list = list;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la liste:', error);
        this.error = 'Impossible de charger les détails de la liste';
        this.loading = false;
      }
    });
  }

  editList(): void {
    if (this.listId) {
      this.router.navigate(['/external-lists', this.listId, 'edit']);
    }
  }

  deleteList(): void {
    if (!this.listId || !this.list) return;

    const confirmation = confirm(`Êtes-vous sûr de vouloir supprimer la liste "${this.list.name}" ?`);
    if (confirmation) {
      this.externalListService.deleteExternalList(this.listId).subscribe({
        next: () => {
          this.snackBar.open('Liste supprimée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.goBack();
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

  goBack(): void {
    this.router.navigate(['/creelisteexterne']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getListTypeLabel(type: string): string {
    switch (type) {
      case 'STATIC': return 'Statique';
      case 'DYNAMIC': return 'Dynamique';
      default: return type;
    }
  }
  // Dans external-list-detail.component.ts - Ajouter ces imports

// Dans la classe ExternalListDetailComponent, ajouter cette méthode :

/**
 * Télécharge la liste actuelle au format Excel
 */
downloadAsExcel(): void {
  if (!this.list) {
    this.snackBar.open('Aucune liste à télécharger', 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  try {
    // Créer les données d'en-tête avec les informations de la liste
    const headerData = [
      ['Nom de la liste', 'Rubrique', 'Nombre d\'éléments', 'Type', 'Liste avancée', 'Filtrée', 'Propriétaire'],
      [
        this.list.name,
        this.list.rubrique || '-',
        this.list.itemCount?.toString() || '0',
        this.getListTypeLabel(this.list.listType!),
        this.list.isAdvanced ? 'Oui' : 'Non',
        this.list.isFiltered ? 'Oui' : 'Non',
        this.list.createdName || 'Inconnu'
      ]
    ];

    // Ajouter une ligne vide pour séparer
    headerData.push([]);

    // Créer les données des éléments si ils existent
    const itemsData = [];
    if (this.list.items && this.list.items.length > 0) {
      // En-têtes des éléments
      itemsData.push(['#', 'Libellé', 'Valeur', 'Statut']);

      // Données des éléments
      this.list.items.forEach((item, index) => {
        itemsData.push([
          (index + 1).toString(),
          item.label,
          item.value,
          item.isActive ? 'Actif' : 'Inactif'
        ]);
      });
    } else {
      itemsData.push(['Aucun élément dans cette liste']);
    }

    // Combiner toutes les données
    const allData = [...headerData, ...itemsData];

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Définir les largeurs de colonnes
    const columnWidths = [
      { wch: 20 }, // Colonne A
      { wch: 15 }, // Colonne B
      { wch: 18 }, // Colonne C
      { wch: 12 }, // Colonne D
      { wch: 15 }, // Colonne E
      { wch: 12 }, // Colonne F
      { wch: 15 }  // Colonne G
    ];
    worksheet['!cols'] = columnWidths;

    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liste Externe');

    // Générer le nom du fichier avec la date
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `${this.list.name}_${dateString}_${timeString}.xlsx`;

    // Télécharger le fichier
    XLSX.writeFile(workbook, fileName);

    // Afficher un message de succès
    this.snackBar.open('Liste exportée avec succès', 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    this.snackBar.open('Erreur lors de l\'export Excel', 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
}
