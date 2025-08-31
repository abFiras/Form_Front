import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ExternalListDTO, ExternalListItemDTO, ExternalListService } from '../service/external-list.service';

@Component({
  selector: 'app-external-list-field',
  standalone:false,
  templateUrl: './external-list-field.component.html',
  styleUrls: ['./external-list-field.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExternalListFieldComponent),
      multi: true
    }
  ]
})
export class ExternalListFieldComponent implements OnInit, ControlValueAccessor {
  @Input() label: string = 'Liste externe';
  @Input() placeholder: string = 'Sélectionnez une valeur...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() externalListId?: number; // ID de la liste externe à utiliser
  @Input() displayMode: 'select' | 'radio' | 'checkbox' = 'select';

  control = new FormControl();
  externalList?: ExternalListDTO;
  listItems: ExternalListItemDTO[] = [];
  filteredOptions: Observable<ExternalListItemDTO[]> = new Observable();

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private externalListService: ExternalListService) {}

  ngOnInit(): void {
    if (this.externalListId) {
      this.loadExternalList();
    }

    // Setup filtered options for autocomplete
    this.filteredOptions = this.control.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.label),
      map(name => name ? this._filter(name) : this.listItems.slice())
    );

    // Subscribe to control changes
    this.control.valueChanges.subscribe(value => {
      if (this.displayMode === 'select') {
        // For select, emit the value directly
        this.onChange(typeof value === 'object' ? value?.value : value);
      } else {
        // For radio/checkbox, value is already in correct format
        this.onChange(value);
      }
      this.onTouched();
    });
  }

  loadExternalList(): void {
    if (!this.externalListId) return;

    this.externalListService.getExternalListById(this.externalListId).subscribe({
      next: (list) => {
        this.externalList = list;
        this.listItems = list.items || [];
      },
      error: (error) => {
        console.error('Error loading external list:', error);
        this.listItems = [];
      }
    });
  }

  private _filter(name: string): ExternalListItemDTO[] {
    const filterValue = name.toLowerCase();
    return this.listItems.filter(option =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  displayFn(item: ExternalListItemDTO): string {
    return item && item.label ? item.label : '';
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.displayMode === 'select' && value) {
      // Find the corresponding item for select mode
      const selectedItem = this.listItems.find(item => item.value === value);
      this.control.setValue(selectedItem || value, { emitEvent: false });
    } else {
      this.control.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  onSelectionChange(value: any): void {
    this.control.setValue(value);
  }

  onCheckboxChange(item: ExternalListItemDTO, checked: boolean): void {
    let currentValue = this.control.value || [];
    if (!Array.isArray(currentValue)) {
      currentValue = [];
    }

    if (checked) {
      if (!currentValue.includes(item.value)) {
        currentValue.push(item.value);
      }
    } else {
      const index = currentValue.indexOf(item.value);
      if (index > -1) {
        currentValue.splice(index, 1);
      }
    }

    this.control.setValue([...currentValue]);
  }

  isChecked(item: ExternalListItemDTO): boolean {
    const currentValue = this.control.value;
    if (this.displayMode === 'checkbox') {
      return Array.isArray(currentValue) && currentValue.includes(item.value);
    }
    return currentValue === item.value;
  }
}
