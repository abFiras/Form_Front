import { Component, OnInit } from '@angular/core';
import { FormDTO } from '../models/form.models';
import { FormService } from '../service/FormService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form-list',
  standalone: false,
  templateUrl: './form-list.component.html',
  styleUrl: './form-list.component.css'
})
export class FormListComponent implements OnInit {
  forms: FormDTO[] = [];
  loading = false;
  draftForms: FormDTO[] = [];
  publishedForms: FormDTO[] = [];
  constructor(
    private formService: FormService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading = true;
    this.formService.getAllForms().subscribe({
      next: (forms) => {
      this.forms = forms;
this.draftForms = this.forms.filter(f => f.status === 'DRAFT' || f.status === null);
        this.publishedForms = this.forms.filter(f => f.status === 'PUBLISHED');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading forms:', error);
        this.loading = false;
      }
    });
  }

  createNewForm(): void {
    this.router.navigate(['/forms/new']);
  }

  editForm(id: number): void {
    this.router.navigate(['/forms', id, 'edit']);
  }

  previewForm(id: number): void {
    this.router.navigate(['/forms', id, 'preview']);
  }

  deleteForm(id: number): void {
    if (confirm('Are you sure you want to delete this form?')) {
      this.formService.deleteForm(id).subscribe({
        next: () => {
          this.loadForms();
        },
        error: (error) => {
          console.error('Error deleting form:', error);
        }
      });
    }
  }

  publishForm(form: FormDTO): void {
    if (form.id) {
      this.formService.publishForm(form.id).subscribe({
        next: () => {
          this.loadForms();
        },
        error: (error) => {
          console.error('Error publishing form:', error);
        }
      });
    }
  }
}
