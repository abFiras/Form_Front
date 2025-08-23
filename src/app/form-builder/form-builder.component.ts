import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldType, FormDTO, FormFieldDTO, PaletteField } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../service/FormService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-form-builder',
  standalone: false,
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.css'
})
export class FormBuilderComponent implements OnInit {
  formId?: number;
  isPreviewMode = false;
  currentForm?: FormDTO;
  formFields: FormFieldDTO[] = [];
  previewForm = new FormGroup({});
  
  formSettingsForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('')
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.formId = +params['id'];
        this.isPreviewMode = this.route.snapshot.url[2]?.path === 'preview';
        this.loadForm();
      }
    });
     this.authService.getCurrentUser().subscribe({
    next: (user) => {
      console.log('Current logged-in user:', user);
      // user might look like { id: 1, username: "admin" }
    },
    error: (err) => {
      console.error('Error fetching current user:', err);
    }
  });
  }

  loadForm(): void {
    if (this.formId) {
      this.formService.getFormById(this.formId).subscribe({
        next: (form) => {
          this.currentForm = form;
          this.formFields = [...form.fields].sort((a, b) => a.order - b.order);
          this.formSettingsForm.patchValue({
            name: form.name,
            description: form.description
          });
          this.rebuildPreviewForm();
        },
        error: (error) => {
          console.error('Error loading form:', error);
          this.snackBar.open('Error loading form', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onFieldDrop(event: CdkDragDrop<any[]>): void {
    console.log('Drop event:', event); // Debug log
    
    if (event.previousContainer === event.container) {
      // Reordering within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateFieldOrders();
    } else {
      // Moving from palette to form fields
      const dragData = event.previousContainer.data[event.previousIndex];
      console.log('Drag data:', dragData); // Debug log
      
      // Check if it's a PaletteField (from palette)
      if (dragData && typeof dragData === 'object' && 'type' in dragData) {
        const paletteField = dragData as PaletteField;
        const newField = this.createFieldFromPalette(paletteField);
        console.log('Created new field:', newField); // Debug log
        
        // Add the new field to the form fields at the dropped position
        this.formFields.splice(event.currentIndex, 0, newField);
        this.updateFieldOrders();
        this.rebuildPreviewForm();
        
        this.snackBar.open(`${paletteField.label} field added`, 'Close', { duration: 2000 });
      } else {
        // Moving existing fields between containers
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        this.updateFieldOrders();
        this.rebuildPreviewForm();
      }
    }
  }

  createFieldFromPalette(paletteField: PaletteField): FormFieldDTO {
    const timestamp = Date.now();
    const fieldName = `field_${timestamp}`;
    
    const baseField: FormFieldDTO = {
      fieldType: paletteField.type,
      label: paletteField.label,
      fieldName,
      placeholder: `Enter ${paletteField.label.toLowerCase()}...`,
      required: false,
      order: this.formFields.length
    };

    // Add default options for fields that need them
    if (this.hasOptions(paletteField.type)) {
      baseField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
    }

    return baseField;
  }

  hasOptions(fieldType: FieldType): boolean {
    return ['select', 'radio', 'checkbox'].includes(fieldType);
  }

  updateFieldOrders(): void {
    this.formFields.forEach((field, index) => {
      field.order = index;
    });
  }

  onFieldChange(index: number, updatedField: FormFieldDTO): void {
    this.formFields[index] = updatedField;
    this.rebuildPreviewForm();
  }

  onRemoveField(index: number): void {
    const removedField = this.formFields[index];
    this.formFields.splice(index, 1);
    this.updateFieldOrders();
    this.rebuildPreviewForm();
    this.snackBar.open(`${removedField.label} field removed`, 'Close', { duration: 2000 });
  }

  rebuildPreviewForm(): void {
    const controls: { [key: string]: FormControl } = {};
    
    this.formFields.forEach(field => {
      const validators = [];
      
      if (field.required) {
        validators.push(Validators.required);
      }
      
      // Add specific validators based on field type
      if (field.fieldType === 'email') {
        validators.push(Validators.email);
      }
      
      controls[field.fieldName] = new FormControl('', validators);
    });
    
    this.previewForm = new FormGroup(controls);
  }
saveForm(): void {
  if (!this.formSettingsForm.valid) {
    this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    return;
  }

  // Prepare form data
  const formData = {
    name: this.formSettingsForm.value.name!,
    description: this.formSettingsForm.value.description || '',
    fields: this.formFields.map(f => ({
      fieldType: f.fieldType,
      label: f.label,
      fieldName: f.fieldName,
      placeholder: f.placeholder,
      required: !!f.required,
      order: Number(f.order) || 0,      // ensure numeric
      options: f.options?.map(opt => ({
        label: opt.label,
        value: String(opt.value)         // ensure string
      }))
    }))
  };

  if (this.formId) {
    // Update existing form
    this.formService.updateForm(this.formId, formData).subscribe({
      next: (form) => {
        this.snackBar.open('Form updated successfully', 'Close', { duration: 3000 });
        this.currentForm = form;
      },
      error: (error) => {
        console.error('Error updating form:', error);
        this.snackBar.open('Error updating form', 'Close', { duration: 3000 });
      }
    });
  } else {
    // Create new form
    this.authService.getCurrentUser()
      .pipe(
        switchMap(user => {
          const numericUserId = Number(user.id);
          if (isNaN(numericUserId)) {
            console.error('User ID is not numeric:', user.id);
            throw new Error('Invalid user ID');
          }

          const payload = { ...formData, userId: numericUserId };
          console.log('Payload to send:', payload); // debug
          return this.formService.createForm(payload);
        })
      )
      .subscribe({
        next: (form) => {
          this.snackBar.open('Form created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/forms', form.id, 'edit']);
        },
        error: (error) => {
          console.error('Error creating form:', error);
          this.snackBar.open('Error creating form', 'Close', { duration: 3000 });
        }
      });
  }
}

 
  publishForm(): void {
    if (this.formId) {
      this.formService.publishForm(this.formId).subscribe({
        next: (form) => {
          this.snackBar.open('Form published successfully', 'Close', { duration: 3000 });
          this.currentForm = form;
        },
        error: (error) => {
          console.error('Error publishing form:', error);
          this.snackBar.open('Error publishing form', 'Close', { duration: 3000 });
        }
      });
    }
  }

  submitPreview(): void {
    if (this.previewForm.valid && this.formId) {
      const submission = {
        data: this.previewForm.value
      };
      
      this.formService.submitForm(this.formId, submission).subscribe({
        next: () => {
          this.snackBar.open('Form submitted successfully', 'Close', { duration: 3000 });
          this.previewForm.reset();
        },
        error: (error) => {
          console.error('Error submitting form:', error);
          this.snackBar.open('Error submitting form', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/forms']);
  }
}