import { Component, Input } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { FormDTO } from '../models/form.models';
import { FormService } from '../service/FormService';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: number;
  active?: boolean;
}
@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
@Input() isOpen = true;
  isAdmin = false;
 forms: FormDTO[] = [];


    constructor(private authService: AuthService,private formService: FormService) {}

  ngOnInit(): void {
    this.loadForms();
    this.isAdmin = this.authService.isAdmin();
  }
 loadForms(): void {
  this.formService.getAllForms().subscribe({
    next: (forms) => {
      this.forms = forms;
      console.log(this.forms.length);

      // mettre à jour le badge dans le menu
      const formsMenu = this.mainMenuItems.find(m => m.id === 'forms');
      if (formsMenu && formsMenu.children) {
        const myFormsItem = formsMenu.children.find(c => c.id === 'my-forms');
        if (myFormsItem) {
          myFormsItem.badge = this.forms.length;
        }
      }
    },
    error: (error) => {
      console.error('Error loading forms:', error);
    }
  });
}



  stats = {
    totalForms: 42,
    pendingValidations: 7
  };

  mainMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Acceuil',
      icon: '🏠',
      route: '/dashboard',
      active: true
    },
    {
      id: 'forms',
      label: 'Formulaires',
      icon: '📝',
      children: [
        {
          id: 'create-form',
          label: 'Créer un formulaire',
          icon: '➕',
          route: '/ajouterform'
        },
        {
          id: 'my-forms',
          label: 'Mes formulaires',
          icon: '📋',
          badge: this.forms.length,
          route: '/forms'
        },
        {
          id: 'templates',
          label: 'Bibliothèque',
          icon: '📄',
          route: '/bib'
        }
      ]
    },
    {
      id: 'exports',
      label: 'Listes externes',
      icon: '📤',
      route: '/exports',
      children: [
        {
          id: 'export-word',
          label: 'Creer une Listes externes',
          icon: '📄',
          route: '/creelisteexterne'
        },
        {
          id: 'import-excel',
          label: 'Mes Listes externes',
          icon: '📊',
          route: '/exports/excel'
        }
      ]
    },
     {
      id: 'exports',
      label: 'Données',
      icon: '📄',
      route: '/exports',
      children: [
        {
          id: 'Historique',
          label: 'Historique',
          icon: '📄',
          route: '/exports/word'
        },
        {
          id: 'import-excel',
          label: 'Exporter',
          icon: '📊',
          route: '/exports/excel'
        },
                {
          id: 'import-excel',
          label: 'Saisir des données',
          icon: '✍️',
          route: '/exports/excel'
        },
                {
          id: 'import-excel',
          label: 'Planning',
          icon: '📋',
          route: '/exports/excel'
        }
      ]
    }
  ];

  toolsMenuItems: MenuItem[] = [
    {
      id: 'analytics',
      label: 'Graphiques',
      icon: '📈',
      route: '/analytics'
    },
    /*{
      id: 'reports',
      label: 'Rapports',
      icon: '📋',
      route: '/reports'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: '⚙️',
      route: '/settings'
    }*/
  ];

  managementMenuItems: MenuItem[] = [
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: '👥',
      route: '/users'
    },
   /* {
      id: 'permissions',
      label: 'Permissions',
      icon: '🔐',
      route: '/permissions'
    },
    {
      id: 'signatures',
      label: 'Signatures',
      icon: '✍️',
      route: '/signatures'
    }*/
  ];


  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      // Reset all other items
      this.mainMenuItems.forEach(menuItem => {
        if (menuItem.id !== item.id) {
          menuItem.active = false;
        }
      });

      // Toggle current item
      item.active = !item.active;
    }
  }

    logout(): void {
    this.authService.logout();
  }
}
