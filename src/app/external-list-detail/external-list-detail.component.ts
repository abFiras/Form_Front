import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExternalListService, ExternalListDTO } from '../service/external-list.service';

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
}
