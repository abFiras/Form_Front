import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormHistoryService } from '../service/form-history.service';
import { Router } from '@angular/router';

export interface FormHistoryDTO {
  id: number;
  formId: number;
  formName: string;
  secteur: string;
  description: string;
  status: string;
  statusLabel: string;
  actionType: string;
  actionTypeLabel: string;
  actionDescription: string;
  performedById: number;
  performedByUsername: string;
  performedByEmail: string;
  assignedGroups: GroupInfoDTO[];
  fieldCount: number;
  isInLibrary: boolean;
  librarySharedDate: string;
  changesDetails: string;
  ipAddress: string;
  createdAt: string;
  timeAgo: string;
  formattedDate: string;
  actionIcon: string;
  actionColor: string;
}

export interface GroupInfoDTO {
  id: number;
  name: string;
  color: string;
}

export interface FormHistoryPageDTO {
  content: FormHistoryDTO[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FormHistoryStatsDTO {
  totalActions: number;
  todayActions: number;
  weekActions: number;
  monthActions: number;
  actionTypeStats: ActionTypeStatsDTO[];
  secteurStats: SecteurStatsDTO[];
}

export interface ActionTypeStatsDTO {
  actionType: string;
  actionTypeLabel: string;
  count: number;
  percentage: string;
  color: string;
}

export interface SecteurStatsDTO {
  secteur: string;
  count: number;
  percentage: string;
}

@Component({
  selector: 'app-form-history',
  standalone: false,
  templateUrl: './form-history.component.html',
  styleUrls: ['./form-history.component.css']
})
export class FormHistoryComponent implements OnInit {

  // Données
  historyPage: FormHistoryPageDTO = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  };

  statistics: FormHistoryStatsDTO = {
    totalActions: 0,
    todayActions: 0,
    weekActions: 0,
    monthActions: 0,
    actionTypeStats: [],
    secteurStats: []
  };

  recentActivity: FormHistoryDTO[] = [];

  // États
  loading = false;
  statsLoading = false;

  // Filtres
  filters = {
    formName: '',
    secteur: '',
    actionType: '',
    status: '',
    performedBy: '',
    searchTerm: '',
    startDate: null as Date | null,
    endDate: null as Date | null
  };

  // Pagination
  currentPage = 0;
  pageSize = 20;

  // Options pour les filtres
  actionTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'CREATED', label: 'Création' },
    { value: 'UPDATED', label: 'Modification' },
    { value: 'PUBLISHED', label: 'Publication' },
    { value: 'ARCHIVED', label: 'Archivage' },
    { value: 'DELETED', label: 'Suppression' },
    { value: 'SHARED_TO_LIBRARY', label: 'Partagé vers bibliothèque' },
    { value: 'REMOVED_FROM_LIBRARY', label: 'Retiré de la bibliothèque' },
    { value: 'GROUPS_ASSIGNED', label: 'Groupes assignés' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'PUBLISHED', label: 'Publié' },
    { value: 'ARCHIVED', label: 'Archivé' },
    { value: 'DELETED', label: 'Supprimé' }
  ];

  // Mode d'affichage
  viewMode: 'timeline' | 'table' = 'timeline';
  showFilters = false;

  constructor(
    private formHistoryService: FormHistoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadStatistics();
    this.loadRecentActivity();
  }

  /**
   * Charger l'historique avec les filtres actuels
   */
  loadHistory(): void {
    this.loading = true;

    const params = {
      ...this.filters,
      page: this.currentPage,
      size: this.pageSize,
      startDate: this.filters.startDate?.toISOString(),
      endDate: this.filters.endDate?.toISOString()
    };

    this.formHistoryService.getFormHistory(params).subscribe({
      next: (response) => {
        this.historyPage = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement historique:', error);
        this.snackBar.open('Erreur lors du chargement de l\'historique', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  /**
   * Charger les statistiques
   */
  loadStatistics(): void {
    this.statsLoading = true;

    this.formHistoryService.getHistoryStatistics().subscribe({
      next: (response) => {
        this.statistics = response.data;
        this.statsLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
        this.statsLoading = false;
      }
    });
  }

  /**
   * Charger l'activité récente
   */
  loadRecentActivity(): void {
    this.formHistoryService.getRecentActivity(24).subscribe({
      next: (response) => {
        this.recentActivity = response.data.slice(0, 10); // Limiter à 10
      },
      error: (error) => {
        console.error('Erreur chargement activité récente:', error);
      }
    });
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    this.currentPage = 0;
    this.loadHistory();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filters = {
      formName: '',
      secteur: '',
      actionType: '',
      status: '',
      performedBy: '',
      searchTerm: '',
      startDate: null,
      endDate: null
    };
    this.currentPage = 0;
    this.loadHistory();
  }

  /**
   * Changer de page
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadHistory();
  }

  /**
   * Basculer le mode d'affichage
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'timeline' ? 'table' : 'timeline';
  }

  /**
   * Basculer l'affichage des filtres
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Voir les détails d'une action
   */
  viewActionDetails(action: FormHistoryDTO): void {
    // Ouvrir une modal avec les détails
    console.log('Détails de l\'action:', action);
  this.router.navigate(['/forms', action.formId, 'preview']);

    // Exemple de notification
    this.snackBar.open(
      `Action: ${action.actionTypeLabel} sur "${action.formName}" par ${action.performedByUsername}`,
      'Fermer',
      { duration: 4000 }
    );
  }

  /**
   * Naviguer vers le formulaire
   */
  goToForm(action: FormHistoryDTO): void {
    if (action.formId && action.status !== 'DELETED') {
  this.router.navigate(['/forms', action.formId, 'preview']);
      console.log('Navigation vers formulaire:', action.formId);
    } else {
      this.snackBar.open('Ce formulaire n\'est plus disponible', 'Fermer', {
        duration: 3000
      });
    }
  }

  /**
   * Exporter l'historique
   */
  exportHistory(): void {
    // Logique d'export (Excel, CSV, etc.)
    this.snackBar.open('Export en cours de développement', 'Fermer', {
      duration: 3000
    });
  }

  /**
   * Obtenir l'icône pour un type d'action
   */
  getActionIcon(actionType: string): string {
    const icons: { [key: string]: string } = {
      'CREATED': 'add_circle',
      'UPDATED': 'edit',
      'PUBLISHED': 'publish',
      'ARCHIVED': 'archive',
      'DELETED': 'delete',
      'SHARED_TO_LIBRARY': 'library_add',
      'REMOVED_FROM_LIBRARY': 'library_remove',
      'GROUPS_ASSIGNED': 'group'
    };
    return icons[actionType] || 'history';
  }

  /**
   * Obtenir la couleur pour un statut
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'DRAFT': '#ff9800',
      'PUBLISHED': '#4caf50',
      'ARCHIVED': '#9e9e9e',
      'DELETED': '#f44336'
    };
    return colors[status] || '#666666';
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}
