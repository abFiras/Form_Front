import { Component, Input } from '@angular/core';
import { AuthService } from '../service/auth.service';

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


    constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
  }



  stats = {
    totalForms: 42,
    pendingValidations: 7
  };

  mainMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: '📊',
      route: '/dashboard',
      active: true
    },
    {
      id: 'forms',
      label: 'Formulaires',
      icon: '📝',
      route: '/forms',
      badge: 5,
      children: [
        {
          id: 'create-form',
          label: 'Créer un formulaire',
          icon: '➕',
          route: '/forms/create'
        },
        {
          id: 'my-forms',
          label: 'Mes formulaires',
          icon: '📋',
          route: '/forms/my-forms'
        },
        {
          id: 'templates',
          label: 'Modèles',
          icon: '📄',
          route: '/forms/templates'
        }
      ]
    },
    {
      id: 'validation',
      label: 'Validation',
      icon: '✅',
      route: '/validation',
      badge: 7
    },
    {
      id: 'exports',
      label: 'Exports/Imports',
      icon: '📤',
      route: '/exports',
      children: [
        {
          id: 'export-word',
          label: 'Export Word',
          icon: '📄',
          route: '/exports/word'
        },
        {
          id: 'import-excel',
          label: 'Import Excel',
          icon: '📊',
          route: '/exports/excel'
        }
      ]
    }
  ];

  managementMenuItems: MenuItem[] = [
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: '👥',
      route: '/users'
    },
    {
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
    }
  ];

  toolsMenuItems: MenuItem[] = [
    {
      id: 'analytics',
      label: 'Analyses',
      icon: '📈',
      route: '/analytics'
    },
    {
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
    }
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
}
