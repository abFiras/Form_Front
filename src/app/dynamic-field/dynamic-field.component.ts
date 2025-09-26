import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormFieldDTO } from '../models/form.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExternalListConfigComponent } from '../external-list-config/external-list-config.component';
import { MatDialog } from '@angular/material/dialog';
import { ExternalListFieldComponent } from '../external-list-field/external-list-field.component';
import { FormService } from '../service/FormService';

@Component({
  selector: 'app-dynamic-field',
  standalone: false,
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.css',
})
export class DynamicFieldComponent implements OnInit, AfterViewInit {
  @Input() field!: FormFieldDTO;
  @Input() isPreview = false;
  @Input() formGroup!: FormGroup;
  @Output() fieldChange = new EventEmitter<FormFieldDTO>();
  @Output() removeField = new EventEmitter<void>();
@Input() showValidation = false;

  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('drawingCanvas', { static: false }) drawingCanvas!: ElementRef<HTMLCanvasElement>;

  editMode = false;
  editForm = new FormGroup({
    label: new FormControl('', Validators.required),
    placeholder: new FormControl(''),
    required: new FormControl(false),
    options: new FormControl(''),
    calculationFormula: new FormControl(''),
    imageUrl: new FormControl(''),
    imageAlt: new FormControl(''),
    tableColumns: new FormControl(''),
    tableRows: new FormControl(''),
    fixedText: new FormControl(''),
    fileName: new FormControl('')
  });

  // Propriétés pour la signature et le dessin
  isDrawing = false;
  signatureContext: CanvasRenderingContext2D | null = null;
  drawingContext: CanvasRenderingContext2D | null = null;

  // Propriétés pour le tableau
  tableData: any[] = [];
  tableColumns: string[] = [];

  // Propriétés pour le code-barres et NFC
  isScanning = false;
  nfcSupported = false;

  constructor(private dialog: MatDialog,
      private formService: FormService  // ✅ Ajoutez ceci

  ) {}

  ngOnInit(): void {
    console.log('DynamicField ngOnInit - Field received:', this.field);

    // ✅ Correction spéciale pour les champs external-list
    if (this.field.type === 'external-list') {
      console.log('Initializing external-list field:', this.field);

      // S'assurer que les propriétés sont correctement initialisées depuis attributes
      if (this.field.attributes) {
        // Récupérer externalListId
        if (this.field.attributes['externalListId'] && !this.field.externalListId) {
          const idValue = this.field.attributes['externalListId'];
          this.field.externalListId = parseInt(idValue.toString());
        }

        // Récupérer displayMode
        if (this.field.attributes['externalListDisplayMode'] && !this.field.externalListDisplayMode) {
          this.field.externalListDisplayMode = this.field.attributes['externalListDisplayMode'];
        }
      }

      // Valeurs par défaut si toujours manquantes
      if (!this.field.externalListDisplayMode) {
        this.field.externalListDisplayMode = 'select';
      }

      console.log('External list field after initialization:', {
        externalListId: this.field.externalListId,
        displayMode: this.field.externalListDisplayMode,
        attributes: this.field.attributes
      });
    }

    this.normalizeFieldOptions();
    this.updateEditForm();
    if (this.formGroup && !this.formGroup.get(this.field.fieldName)) {
      this.addControlToForm();
    }
    this.initializeSpecialFields();
    this.checkNFCSupport();
  }

  ngAfterViewInit(): void {
    if (this.field.type === 'signature' && this.signatureCanvas) {
      setTimeout(() => this.initializeSignaturePad(), 100);
    }
    if (this.field.type === 'drawing' && this.drawingCanvas) {
      setTimeout(() => this.initializeDrawingPad(), 100);
    }
  }
// Gérer l'upload de fichier pour attachment
onFileUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Vérifier la taille du fichier (par exemple, max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('Le fichier est trop volumineux. Taille maximale : 10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const fileData = e.target?.result as string;

    // Sauvegarder le fichier en base64 dans le FormControl
    this.formGroup.get(this.field.fieldName)?.setValue(fileData);

    // Sauvegarder les métadonnées dans les attributs si nécessaire
    if (!this.field.attributes) {
      this.field.attributes = {};
    }

    this.field.attributes['fileName'] = file.name;
    this.field.attributes['fileType'] = file.type;
    this.field.attributes['fileSize'] = file.size;

    console.log('Fichier uploadé:', {
      name: file.name,
      type: file.type,
      size: file.size,
      dataLength: fileData.length
    });
  };

  reader.onerror = (error) => {
    console.error('Erreur lecture fichier:', error);
    alert('Erreur lors du chargement du fichier');
  };

  reader.readAsDataURL(file);
}

// Obtenir les types de fichiers acceptés
getAcceptedFileTypes(): string {
  // Vous pouvez configurer cela selon vos besoins
  return '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip';
}

// Obtenir le nom du fichier uploadé
getUploadedFileName(): string {
  return this.field.attributes?.['fileName'] || '';
}

// Effacer le fichier
clearFile(): void {
  this.formGroup.get(this.field.fieldName)?.setValue('');
  if (this.field.attributes) {
    delete this.field.attributes['fileName'];
    delete this.field.attributes['fileType'];
    delete this.field.attributes['fileSize'];
  }
}
// Utilitaires pour les fichiers
getFileSize(): string {
  const size = this.field.attributes?.['fileSize'];
  if (!size) return '';

  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
  return Math.round(size / (1024 * 1024)) + ' MB';
}
  // ============ SIGNATURE CORRIGÉE ============
initializeSignaturePad(): void {
  if (!this.signatureCanvas?.nativeElement) return;

  const canvas = this.signatureCanvas.nativeElement;
  this.signatureContext = canvas.getContext('2d');

  if (this.signatureContext) {
    this.signatureContext.strokeStyle = '#000000';
    this.signatureContext.lineWidth = 2;
    this.signatureContext.lineCap = 'round';
    this.signatureContext.lineJoin = 'round';

    // Fond blanc
    this.signatureContext.fillStyle = '#ffffff';
    this.signatureContext.fillRect(0, 0, canvas.width, canvas.height);
  }

  let lastX = 0;
  let lastY = 0;

  const getMousePos = (e: MouseEvent | Touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  // Événements souris avec stopPropagation pour empêcher le drag
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    this.isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;

    if (this.signatureContext) {
      this.signatureContext.beginPath();
      this.signatureContext.moveTo(lastX, lastY);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing || !this.signatureContext) return;

    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const pos = getMousePos(e);

    this.signatureContext.beginPath();
    this.signatureContext.moveTo(lastX, lastY);
    this.signatureContext.lineTo(pos.x, pos.y);
    this.signatureContext.stroke();

    lastX = pos.x;
    lastY = pos.y;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveSignature();
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveSignature();
    }
  };

  // Événements tactiles
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const touch = e.touches[0];
    this.isDrawing = true;
    const pos = getMousePos(touch);
    lastX = pos.x;
    lastY = pos.y;

    if (this.signatureContext) {
      this.signatureContext.beginPath();
      this.signatureContext.moveTo(lastX, lastY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!this.isDrawing || !this.signatureContext) return;

    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const touch = e.touches[0];
    const pos = getMousePos(touch);

    this.signatureContext.beginPath();
    this.signatureContext.moveTo(lastX, lastY);
    this.signatureContext.lineTo(pos.x, pos.y);
    this.signatureContext.stroke();

    lastX = pos.x;
    lastY = pos.y;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveSignature();
    }
  };

  // Attacher les événements
  canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
  canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
  canvas.addEventListener('mouseup', handleMouseUp, { passive: false });
  canvas.addEventListener('mouseleave', handleMouseLeave, { passive: false });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  // ✅ EMPÊCHER LE DRAG SUR LE CANVAS
  canvas.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  canvas.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });
}

saveSignature(): void {
  if (this.signatureContext && this.signatureCanvas) {
    const signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
    this.formGroup.get(this.field.fieldName)?.setValue(signatureData);
  }
}

clearSignature(): void {
  if (this.signatureContext && this.signatureCanvas) {
    const canvas = this.signatureCanvas.nativeElement;
    this.signatureContext.fillStyle = '#ffffff';
    this.signatureContext.fillRect(0, 0, canvas.width, canvas.height);
    this.formGroup.get(this.field.fieldName)?.setValue('');
  }
}

  startSignature(e: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.signatureContext) {
      this.signatureContext.beginPath();
      this.signatureContext.moveTo(x, y);
    }
  }

  drawSignature(e: MouseEvent): void {
    if (!this.isDrawing || !this.signatureContext) return;

    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.signatureContext.lineTo(x, y);
    this.signatureContext.stroke();
  }

  stopSignature(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.signatureContext) {
        this.signatureContext.closePath();
        const signatureData = this.signatureCanvas.nativeElement.toDataURL('image/png');
        this.formGroup.get(this.field.fieldName)?.setValue(signatureData);
      }
    }
  }

  handleSignatureTouch(e: TouchEvent, type: string): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (type === 'start') {
      this.startSignature({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
    } else if (type === 'move') {
      this.drawSignature({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
    }
  }



  // ============ DESSIN CORRIGÉ ============
initializeDrawingPad(): void {
  if (!this.drawingCanvas?.nativeElement) return;

  const canvas = this.drawingCanvas.nativeElement;
  this.drawingContext = canvas.getContext('2d');

  if (this.drawingContext) {
    this.drawingContext.strokeStyle = '#000000';
    this.drawingContext.lineWidth = 3;
    this.drawingContext.lineCap = 'round';
    this.drawingContext.lineJoin = 'round';

    // Fond blanc
    this.drawingContext.fillStyle = '#ffffff';
    this.drawingContext.fillRect(0, 0, canvas.width, canvas.height);
  }

  let lastX = 0;
  let lastY = 0;

  const getMousePos = (e: MouseEvent | Touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  // Événements souris avec stopPropagation
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    this.isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;

    if (this.drawingContext) {
      this.drawingContext.beginPath();
      this.drawingContext.moveTo(lastX, lastY);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing || !this.drawingContext) return;

    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const pos = getMousePos(e);

    this.drawingContext.beginPath();
    this.drawingContext.moveTo(lastX, lastY);
    this.drawingContext.lineTo(pos.x, pos.y);
    this.drawingContext.stroke();

    lastX = pos.x;
    lastY = pos.y;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveDrawing();
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveDrawing();
    }
  };

  // Événements tactiles
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const touch = e.touches[0];
    this.isDrawing = true;
    const pos = getMousePos(touch);
    lastX = pos.x;
    lastY = pos.y;

    if (this.drawingContext) {
      this.drawingContext.beginPath();
      this.drawingContext.moveTo(lastX, lastY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!this.isDrawing || !this.drawingContext) return;

    e.preventDefault();
    e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

    const touch = e.touches[0];
    const pos = getMousePos(touch);

    this.drawingContext.beginPath();
    this.drawingContext.moveTo(lastX, lastY);
    this.drawingContext.lineTo(pos.x, pos.y);
    this.drawingContext.stroke();

    lastX = pos.x;
    lastY = pos.y;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (this.isDrawing) {
      e.preventDefault();
      e.stopPropagation(); // ✅ EMPÊCHE LE DRAG

      this.isDrawing = false;
      this.saveDrawing();
    }
  };

  // Attacher les événements
  canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
  canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
  canvas.addEventListener('mouseup', handleMouseUp, { passive: false });
  canvas.addEventListener('mouseleave', handleMouseLeave, { passive: false });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  // ✅ EMPÊCHER LE DRAG SUR LE CANVAS
  canvas.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  canvas.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });
}

saveDrawing(): void {
  if (this.drawingContext && this.drawingCanvas) {
    const drawingData = this.drawingCanvas.nativeElement.toDataURL('image/png');
    this.formGroup.get(this.field.fieldName)?.setValue(drawingData);
  }
}

setDrawingColor(color: string): void {
  if (this.drawingContext) {
    this.drawingContext.strokeStyle = color;
  }
}

clearDrawing(): void {
  if (this.drawingContext && this.drawingCanvas) {
    const canvas = this.drawingCanvas.nativeElement;
    this.drawingContext.fillStyle = '#ffffff';
    this.drawingContext.fillRect(0, 0, canvas.width, canvas.height);
    this.formGroup.get(this.field.fieldName)?.setValue('');
  }
}
  // ============ TABLEAU CORRIGÉ ============
  initializeTableData(): void {
    try {
      // Initialisation des colonnes
      if (this.field.attributes?.['columns']) {
        const columnsData = this.field.attributes['columns'];
        if (typeof columnsData === 'string') {
          // Si c'est une chaîne, essayer de parser ou diviser par virgules
          try {
            this.tableColumns = JSON.parse(columnsData);
          } catch {
            this.tableColumns = columnsData.split(',').map(c => c.trim()).filter(c => c);
          }
        } else if (Array.isArray(columnsData)) {
          this.tableColumns = columnsData;
        } else {
          this.tableColumns = ['Colonne 1', 'Colonne 2'];
        }
      } else {
        this.tableColumns = ['Colonne 1', 'Colonne 2'];
      }

      // Initialisation des données
      if (this.field.attributes?.['rows']) {
        const rowsData = this.field.attributes['rows'];
        if (typeof rowsData === 'string') {
          try {
            this.tableData = JSON.parse(rowsData);
          } catch {
            this.tableData = [];
          }
        } else if (Array.isArray(rowsData)) {
          this.tableData = rowsData;
        } else {
          this.tableData = [];
        }
      } else {
        this.tableData = [];
      }

      // Assurer au moins une ligne
      if (this.tableData.length === 0) {
        this.addTableRow();
      }

      // Assurer que chaque ligne a toutes les colonnes
      this.tableData = this.tableData.map(row => {
        const completeRow: any = {};
        this.tableColumns.forEach(col => {
          completeRow[col] = row[col] || '';
        });
        return completeRow;
      });

    } catch (e) {
      console.error('Error parsing table data:', e);
      this.tableColumns = ['Colonne 1', 'Colonne 2'];
      this.tableData = [{ 'Colonne 1': '', 'Colonne 2': '' }];
    }
  }

  addTableRow(): void {
    const newRow: any = {};
    this.tableColumns.forEach(col => {
      newRow[col] = '';
    });
    this.tableData = [...this.tableData, newRow];
    this.updateTableData();
  }

  removeTableRow(index: number): void {
    if (this.tableData.length > 1) {
      this.tableData = this.tableData.filter((_, i) => i !== index);
      this.updateTableData();
    }
  }

  addTableColumn(): void {
    const newColumnName = `Colonne ${this.tableColumns.length + 1}`;
    this.tableColumns = [...this.tableColumns, newColumnName];

    // Ajouter la nouvelle colonne à toutes les lignes
    this.tableData = this.tableData.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    this.updateTableData();
  }

  removeTableColumn(columnIndex: number): void {
    if (this.tableColumns.length > 1) {
      const columnToRemove = this.tableColumns[columnIndex];
      this.tableColumns = this.tableColumns.filter((_, i) => i !== columnIndex);

      // Supprimer la colonne de toutes les lignes
      this.tableData = this.tableData.map(row => {
        const { [columnToRemove]: removed, ...rest } = row;
        return rest;
      });
      this.updateTableData();
    }
  }

  updateTableData(): void {
    const tableValue = {
      columns: this.tableColumns,
      data: this.tableData
    };

    // Sauvegarder dans les attributs
    if (!this.field.attributes) this.field.attributes = {};
    this.field.attributes['columns'] = this.tableColumns;
    this.field.attributes['rows'] = this.tableData;

    // Sauvegarder dans le FormControl
    this.formGroup.get(this.field.fieldName)?.setValue(JSON.stringify(tableValue));
  }

  onTableCellChange(rowIndex: number, column: string, value: string): void {
    if (this.tableData[rowIndex]) {
      this.tableData[rowIndex] = {
        ...this.tableData[rowIndex],
        [column]: value
      };
      this.updateTableData();
    }
  }

  getTableDisplayedColumns(): string[] {
    if (this.isPreview) {
      return this.tableColumns;
    }
    return [...this.tableColumns, 'actions'];
  }

  // ============ CALCUL CORRIGÉ ============
  setupCalculationWatcher(): void {
    if (this.field.attributes?.['formula']) {
      this.formGroup.valueChanges.subscribe(() => {
        setTimeout(() => this.calculateValue(), 100);
      });
      // Calcul initial
      setTimeout(() => this.calculateValue(), 200);
    }
  }

  calculateValue(): void {
    if (!this.field.attributes?.['formula']) return;

    try {
      let formula = this.field.attributes['formula'];
      console.log('Original formula:', formula);

      // Remplacer les références aux champs par leurs valeurs
      const fieldPattern = /field_\w+/g;
      const fieldNames = formula.match(fieldPattern) || [];

      fieldNames.forEach((fieldName: string) => {
        const control = this.formGroup.get(fieldName);
        const value = control?.value || 0;
        const numericValue = parseFloat(value.toString()) || 0;
        formula = formula.replace(new RegExp(fieldName, 'g'), numericValue.toString());
      });

      console.log('Formula after replacement:', formula);

      // Évaluer la formule de manière sécurisée
      const result = this.safeEval(formula);
      console.log('Calculation result:', result);

      this.formGroup.get(this.field.fieldName)?.setValue(result, { emitEvent: false });
    } catch (error) {
      console.error('Error calculating value:', error);
      this.formGroup.get(this.field.fieldName)?.setValue('Erreur');
    }
  }

  safeEval(formula: string): number {
    try {
      // Nettoyer la formule pour n'autoriser que les opérations sécurisées
      const cleanFormula = formula.replace(/[^0-9+\-*/.() ]/g, '');
      if (cleanFormula !== formula) {
        throw new Error('Formula contains invalid characters');
      }

      const result = new Function(`"use strict"; return (${cleanFormula})`)();
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch (error) {
      console.error('Safe eval error:', error);
      return 0;
    }
  }

  // ============ CODE-BARRES CORRIGÉ ============
/*  async startBarcodeScanning(): Promise<void> {
    this.isScanning = true;

    try {
      // Simuler la lecture de code-barres
      const barcodeValue = await this.simulateBarcodeScanning();
      if (barcodeValue) {
        this.formGroup.get(this.field.fieldName)?.setValue(barcodeValue);
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      // Fallback vers saisie manuelle
      const manualValue = prompt('Impossible de scanner. Saisissez le code-barres manuellement:');
      if (manualValue) {
        this.formGroup.get(this.field.fieldName)?.setValue(manualValue);
      }
    } finally {
      this.isScanning = false;
    }
        private async simulateBarcodeScanning(): Promise<string | null> {
    return new Promise((resolve) => {
      // Simuler un scan avec délai
      setTimeout(() => {
        const mockBarcodes = ['123456789', '987654321', 'ABC123DEF', 'XYZ789GHI'];
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        resolve(randomBarcode);
      }, 2000);
    });
  }*/
  async startBarcodeScanning(): Promise<void> {
    this.isScanning = true;

    try {
      // Vérifier si l'API de caméra est supportée
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Caméra arrière pour mobile
        });

        // Simuler la lecture de code-barres (en réalité, vous utiliseriez une bibliothèque comme ZXing)
        // Pour la démo, nous allons juste permettre la saisie manuelle
        const barcodeValue = prompt('Scanner le code-barres ou saisissez manuellement:');
        if (barcodeValue) {
          this.formGroup.get(this.field.fieldName)?.setValue(barcodeValue);
        }

        // Arrêter la caméra
        stream.getTracks().forEach(track => track.stop());
      } else {
        // Fallback vers saisie manuelle
        const barcodeValue = prompt('Saisissez le code-barres:');
        if (barcodeValue) {
          this.formGroup.get(this.field.fieldName)?.setValue(barcodeValue);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback vers saisie manuelle
      const barcodeValue = prompt('Impossible d\'accéder à la caméra. Saisissez le code-barres:');
      if (barcodeValue) {
        this.formGroup.get(this.field.fieldName)?.setValue(barcodeValue);
      }
    }


  }

  // ============ NFC CORRIGÉ ============
checkNFCSupport(): void {
  // Vérification plus robuste du support NFC
  this.nfcSupported = (
    'NDEFReader' in window ||
    (navigator as any).nfc ||
    navigator.userAgent.includes('Android')
  );
}

async readNFCTag(): Promise<void> {
  try {
    // Support Web NFC API (Chrome Android)
    if ('NDEFReader' in window) {
      console.log('Using Web NFC API');
      const ndef = new (window as any).NDEFReader();

      // Demander les permissions
      await ndef.scan();
      console.log('NFC scan started');

      // Écouter les lectures de tags
      ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC tag detected:', { message, serialNumber });

        let nfcData = '';

        if (serialNumber) {
          nfcData += `Serial: ${serialNumber}`;
        }

        if (message && message.records && message.records.length > 0) {
          message.records.forEach((record: any, index: number) => {
            try {
              const decoder = new TextDecoder();
              const recordData = decoder.decode(record.data);
              nfcData += `${nfcData ? ' | ' : ''}Record${index + 1}: ${recordData}`;
            } catch (e) {
              nfcData += `${nfcData ? ' | ' : ''}Record${index + 1}: [Binary Data]`;
            }
          });
        }

        if (!nfcData) {
          nfcData = `NFC Tag (${new Date().toLocaleTimeString()})`;
        }

        this.formGroup.get(this.field.fieldName)?.setValue(nfcData);
        console.log('NFC data saved:', nfcData);
      });

      ndef.addEventListener('readingerror', (error: any) => {
        console.error('NFC reading error:', error);
        this.showNFCError('Erreur lors de la lecture du tag NFC');
      });

    }
    // Support legacy NFC (si disponible)
    else if ((navigator as any).nfc) {
      console.log('Using legacy NFC API');
      const nfc = (navigator as any).nfc;

      const nfcData = await new Promise((resolve, reject) => {
        nfc.beginSession((session: any) => {
          session.readNDEF((message: any) => {
            let data = `NFC_${Date.now()}`;
            if (message && message.records) {
              data = message.records.map((r: any, i: number) =>
                `Record${i + 1}: ${r.data || '[Binary]'}`
              ).join(' | ');
            }
            resolve(data);
          }, reject);
        }, reject);
      });

      this.formGroup.get(this.field.fieldName)?.setValue(nfcData);
    }
    // Simulation pour appareils non compatibles
    else {
      console.log('Using NFC simulation');
      await this.simulateNFC();
    }

  } catch (error) {
    console.error('NFC Error:', error);
    this.handleNFCError(error);
  }
}

private async simulateNFC(): Promise<void> {
  // Simuler un délai de lecture
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockNFCData = [
    'NFC_TAG_001_2024',
    'Employee_ID_12345',
    'Access_Card_ABC123',
    'Product_SKU_789XYZ',
    'Location_Office_Building_A'
  ];

  const randomData = mockNFCData[Math.floor(Math.random() * mockNFCData.length)];
  const timestamp = new Date().toLocaleTimeString();
  const simulatedData = `${randomData} (${timestamp})`;

  this.formGroup.get(this.field.fieldName)?.setValue(simulatedData);
}

private handleNFCError(error: any): void {
  let errorMessage = 'Erreur lors de la lecture NFC';

  if (error.name === 'NotAllowedError') {
    errorMessage = 'Permission NFC refusée. Veuillez autoriser l\'accès NFC dans les paramètres.';
  } else if (error.name === 'NotSupportedError') {
    errorMessage = 'NFC non supporté sur cet appareil.';
  } else if (error.name === 'NotReadableError') {
    errorMessage = 'Impossible de lire le tag NFC. Rapprochez l\'appareil du tag.';
  }

  this.showNFCError(errorMessage);
}

private showNFCError(message: string): void {
  // Utiliser une notification ou alert selon votre système
  if (typeof window !== 'undefined') {
    alert(message);
  }
  console.error('NFC Error:', message);
}

  // ============ FICHIER FIXE CORRIGÉ ============
  downloadFixedFile(): void {
    const fileUrl = this.field.attributes?.['fileUrl'];
    const fileName = this.field.attributes?.['fileName'] || 'document';

    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Aucun fichier configuré');
    }
  }

  uploadFixedFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        if (!this.field.attributes) this.field.attributes = {};
        this.field.attributes['fileUrl'] = fileData;
        this.field.attributes['fileName'] = file.name;
        this.field.attributes['fileType'] = file.type;
        this.fieldChange.emit(this.field);
      };
      reader.readAsDataURL(file);
    }
  }

// ============ MÉTHODE UPLOADIMAGE CORRIGÉE ============
// Après l'upload d'image, sauvegarder en base
uploadImage(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;

      if (!this.field.attributes) {
        this.field.attributes = {};
      }

      this.field.attributes['imageUrl'] = imageUrl;
      this.field.attributes['fileName'] = file.name;
      this.field.attributes['fileType'] = file.type;
      this.field.attributes['fileSize'] = file.size;

      // ✅ NOUVEAU : Sauvegarder immédiatement en base via un service
      this.saveFieldAttributes();

      this.fieldChange.emit(this.field);

      if (this.editMode) {
        this.editForm.patchValue({
          imageUrl: imageUrl
        });
      }
    };

    reader.readAsDataURL(file);
  }
}
private saveFieldAttributes(): void {
  if (!this.field.id || !this.field.attributes) return;

  this.formService.updateFieldAttributes(this.field.id, this.field.attributes)
    .subscribe({
      next: (response) => {
        console.log('Attributes sauvegardés pour le champ', this.field.fieldName);
      },
      error: (error) => {
        console.error('Erreur sauvegarde attributes:', error);
        // Optionnel : afficher un message d'erreur à l'utilisateur
      }
    });
}
  // ============ MÉTHODES UTILITAIRES ============
  initializeSpecialFields(): void {
    if (this.field.type === 'table') {
      this.initializeTableData();
    }
    if (this.field.type === 'calculation') {
      this.setupCalculationWatcher();
    }
  }

  getFormControl(): FormControl {
    const control = this.formGroup.get(this.field.fieldName) as FormControl;
    if (!control) {
      const newControl = new FormControl('', this.field.required ? [Validators.required] : []);
      this.formGroup.addControl(this.field.fieldName, newControl);
      return newControl;
    }
    return control;
  }

  normalizeFieldOptions(): void {
    if (this.field.options) {
      if (typeof this.field.options === 'string') {
        try {
          this.field.options = JSON.parse(this.field.options);
        } catch (e) {
          console.error('Error parsing field options:', e);
          this.field.options = [];
        }
      }
      if (!Array.isArray(this.field.options)) {
        this.field.options = [];
      }
    } else if (this.hasOptions()) {
      this.field.options = [];
    }
  }

  updateEditForm(): void {
    const optionsArray = Array.isArray(this.field.options) ? this.field.options : [];

    this.editForm.patchValue({
      label: this.field.label,
      placeholder: this.field.placeholder || '',
      required: this.field.required,
      options: optionsArray.map(opt => `${opt.label}:${opt.value}`).join('\n') || '',
      calculationFormula: this.field.attributes?.['formula'] || '',
      imageUrl: this.field.attributes?.['imageUrl'] || '',
      imageAlt: this.field.attributes?.['imageAlt'] || '',
      tableColumns: Array.isArray(this.tableColumns) ? this.tableColumns.join(',') : '',
      fixedText: this.field.attributes?.['content'] || '',
      fileName: this.field.attributes?.['fileName'] || ''
    });
  }

  addControlToForm(): void {
    if (!this.formGroup) return;

    const validators = this.field.required ? [Validators.required] : [];

      // Valeur par défaut selon le type de checkbox
  let defaultValue: any;
  if (this.field.type === 'checkbox') {
    // Valeur par défaut selon le type de checkbox
    if (this.field.options && this.field.options.length > 0) {
      // Checkboxes multiples - array vide
      defaultValue = [];
    } else {
      // Checkbox simple - boolean false
      defaultValue = false;
    }
  } else {
    // Autres types de champs
    defaultValue = '';
  }
  if (this.field.options && this.field.options.length > 0) {
    // Checkboxes multiples - array vide
    defaultValue = [];
  } else {
    // Checkbox simple - boolean false
    defaultValue = false;
  }


    const control = new FormControl(defaultValue, validators);
    this.formGroup.addControl(this.field.fieldName, control);

    // Contrôles additionnels pour les champs complexes
    if (this.field.type === 'contact') {
      this.formGroup.addControl(this.field.fieldName + '_name', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_phone', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_email', new FormControl(''));
    }

    if (this.field.type === 'address') {
      this.formGroup.addControl(this.field.fieldName + '_zip', new FormControl(''));
      this.formGroup.addControl(this.field.fieldName + '_city', new FormControl(''));
    }
      // ✅ NOUVEAUX CONTRÔLES POUR DATETIME
  if (this.field.type === 'datetime') {
    this.formGroup.addControl(this.field.fieldName + '_date', new FormControl(''));
    this.formGroup.addControl(this.field.fieldName + '_time', new FormControl(''));
  }

    if (this.field.type === 'calculation') {
      control.disable();
    }
  }

  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          this.formGroup.get(this.field.fieldName)?.setValue(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.updateEditForm();
    }
  }

  saveChanges(): void {
    if (this.editForm.valid) {
      const updatedField: FormFieldDTO = {
        ...this.field,
        label: this.editForm.value.label!,
        placeholder: this.editForm.value.placeholder || '',
        required: this.editForm.value.required || false
      };

      if (!updatedField.attributes) {
        updatedField.attributes = {};
      }

      // Sauvegarder les attributs spécialisés
      if (this.field.type === 'calculation') {
        updatedField.attributes['formula'] = this.editForm.value.calculationFormula || '';
      }

       if (this.field.type === 'image') {
      // Récupérer l'URL depuis le formulaire d'édition OU conserver l'existante
      const formImageUrl = this.editForm.value.imageUrl;
      const existingImageUrl = this.field.attributes?.['imageUrl'];

      // Utiliser la nouvelle image si elle existe, sinon conserver l'ancienne
      updatedField.attributes['imageUrl'] = formImageUrl || existingImageUrl || '';
      updatedField.attributes['imageAlt'] = this.editForm.value.imageAlt || '';

      console.log('Sauvegarde du champ image:', {
        imageUrl: updatedField.attributes['imageUrl'] ? 'Présente' : 'Absente',
        imageAlt: updatedField.attributes['imageAlt']
      });
    }


if (this.field.type === 'fixed-text') {
  const textContent = this.editForm.value.fixedText || '';
  updatedField.attributes['content'] = textContent;

  // Sauvegarder immédiatement via l'API
  if (this.field.id) {
    this.saveFieldAttributes();
  }

  console.log('Fixed-text content saved:', textContent);
}

      if (this.field.type === 'file-fixed') {
        updatedField.attributes['fileName'] = this.editForm.value.fileName || '';
      }

      if (this.field.type === 'table') {
        const columns = this.editForm.value.tableColumns?.split(',').map((c: string) => c.trim()) || this.tableColumns;
        this.tableColumns = columns;
        updatedField.attributes['columns'] = columns;
        updatedField.attributes['rows'] = this.tableData;
      }

      // Gestion des options
      if (['select', 'radio', 'checkbox'].includes(this.field.type)) {
        const optionsText = this.editForm.value.options || '';
        updatedField.options = optionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [label, value] = line.split(':');
            return { label: label.trim(), value: (value || label).trim() };
          });
      }

      this.field = updatedField;
      this.fieldChange.emit(updatedField);
      this.editMode = false;

      if (this.field.type === 'table') {
        this.initializeTableData();
      }
    }
  }

  remove(): void {
    this.removeField.emit();
  }

  hasOptions(): boolean {
    return ['select', 'radio', 'checkbox'].includes(this.field.type);
  }

  onConfigureExternalList(): void {
    const dialogRef = this.dialog.open(ExternalListConfigComponent, {
      width: '600px',
      data: { field: this.field }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fieldChange.emit(result);
      }
    });
  }
// Méthode pour vérifier si le champ fixed-text a du contenu
hasFixedTextContent(): boolean {
  if (this.field.type !== 'fixed-text') return false;

  const content = this.getFixedTextContent();
  return !!(content && content.trim() !== '' && content !== 'Texte à configurer...');
}

// Méthode améliorée pour récupérer le contenu
getFixedTextContent(): string {
  if (this.field.type !== 'fixed-text') return '';

  // 1. Vérifier dans les attributs
  if (this.field.attributes?.['content']) {
    return this.field.attributes['content'];
  }

  // 2. Vérifier dans le placeholder (fallback)
  if (this.field.placeholder && this.field.placeholder !== 'Enter texte fixe...') {
    return this.field.placeholder;
  }

  // 3. Vérifier dans le label si configuré
  if (this.field.label && this.field.label !== 'Texte fixe') {
    return `Contenu basé sur le label: ${this.field.label}`;
  }

  return 'Texte non configuré';
}
  get safeOptions() {
    return Array.isArray(this.field.options) ? this.field.options : [];
  }

// ============ MÉTHODE POUR DÉCLENCHER L'UPLOAD ============
@ViewChild('imageUpload', { static: false }) imageUpload!: ElementRef<HTMLInputElement>;

triggerImageUpload(): void {
  if (this.imageUpload?.nativeElement) {
    this.imageUpload.nativeElement.click();
  }
}
  // Méthodes utilitaires pour l'affichage
getImageUrl(): string {
  // ✅ CORRECTION : Vérifier d'abord dans les attributs du champ
  if (this.field?.attributes?.['imageUrl']) {
    return this.field.attributes['imageUrl'];
  }

  // Fallback vers le formulaire d'édition
  const editFormUrl = this.editForm?.get('imageUrl')?.value;
  if (editFormUrl) {
    return editFormUrl;
  }

  return '';
}

  getImageAlt(): string {
    return this.field.attributes?.['imageAlt'] || this.field.label;
  }

  getCalculationFormula(): string {
    return this.field.attributes?.['formula'] || '';
  }

 // Remplacer votre méthode getFixedText() actuelle par :
getFixedText(): string {
  // 1. D'abord vérifier les attributes
  if (this.field.attributes?.['content']) {
    return this.field.attributes['content'];
  }

  // 2. Ensuite le placeholder s'il contient du vrai contenu
  if (this.field.placeholder &&
      this.field.placeholder !== 'Enter texte fixe...' &&
      this.field.placeholder.trim() !== '') {
    return this.field.placeholder;
  }

  // 3. Utiliser le label si différent du défaut
  if (this.field.label && this.field.label !== 'Texte fixe') {
    return this.field.label;
  }

  // 4. Message par défaut plus explicite
  return 'Contenu du texte fixe non configuré dans les paramètres du champ.';
}

  getFileName(): string {
    return this.field.attributes?.['fileName'] || 'Document';
  }

  hasFixedFile(): boolean {
    return !!(this.field.attributes?.['fileUrl']);
  }


  // ============ MÉTHODES POUR DATE ET DATETIME ============

// Méthode pour détecter si on est sur mobile
isMobile(): boolean {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Gestionnaire pour les changements de date simple
onDateChange(event: any): void {
  if (event.value) {
    const date = new Date(event.value);
    const formattedDate = date.toISOString().split('T')[0];
    this.formGroup.get(this.field.fieldName)?.setValue(formattedDate);
    console.log('Date changed:', formattedDate);
  }
}

// Gestionnaire pour les changements de datetime (séparé date/heure)
onDateTimeChange(): void {
  const dateControl = this.formGroup.get(this.field.fieldName + '_date');
  const timeControl = this.formGroup.get(this.field.fieldName + '_time');
  const mainControl = this.formGroup.get(this.field.fieldName);

  if (dateControl?.value && timeControl?.value) {
    try {
      const dateValue = new Date(dateControl.value);
      const [hours, minutes] = timeControl.value.split(':');

      dateValue.setHours(parseInt(hours, 10));
      dateValue.setMinutes(parseInt(minutes, 10));

      const isoString = dateValue.toISOString();
      const localDateTime = isoString.slice(0, 16); // Format YYYY-MM-DDTHH:mm

      mainControl?.setValue(localDateTime);
      console.log('DateTime combined:', localDateTime);
    } catch (error) {
      console.error('Error combining date and time:', error);
    }
  }
}

// Gestionnaire pour la saisie manuelle datetime
onManualDateTimeChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  if (value) {
    try {
      // Valider le format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Mettre à jour les champs séparés
        const dateStr = value.split('T')[0];
        const timeStr = value.split('T')[1];

        this.formGroup.get(this.field.fieldName + '_date')?.setValue(date);
        this.formGroup.get(this.field.fieldName + '_time')?.setValue(timeStr);

        console.log('Manual datetime input:', value);
      }
    } catch (error) {
      console.error('Invalid datetime format:', error);
    }
  }
}

// Prévisualisation de la datetime
getDateTimePreview(): string {
  const mainValue = this.formGroup.get(this.field.fieldName)?.value;

  if (mainValue) {
    try {
      const date = new Date(mainValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (error) {
      console.error('Error formatting datetime preview:', error);
    }
  }

  return '';
}

// Vérification des erreurs datetime
hasDateTimeError(): boolean {
  const mainControl = this.formGroup.get(this.field.fieldName);
  return !!(mainControl?.hasError('pattern') || mainControl?.hasError('invalid'));
}
// Vérifier si une option est sélectionnée
isOptionSelected(optionValue: string): boolean {
  const currentValue = this.formGroup.get(this.field.fieldName)?.value;
  return Array.isArray(currentValue) && currentValue.includes(optionValue);
}

// Gérer le changement de checkbox
onCheckboxChange(optionValue: string, event: any): void {
  const currentValue = this.formGroup.get(this.field.fieldName)?.value || [];
  let newValue: string[];

  if (event.checked) {
    // Ajouter la valeur si cochée
    newValue = Array.isArray(currentValue) ? [...currentValue, optionValue] : [optionValue];
  } else {
    // Retirer la valeur si décochée
    newValue = Array.isArray(currentValue) ? currentValue.filter(v => v !== optionValue) : [];
  }

  this.formGroup.get(this.field.fieldName)?.setValue(newValue);
  console.log('Checkbox changed:', this.field.fieldName, newValue);
}


}
