// users.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService, Utilisateur, Group, UpdateUserDTO, Role } from '../service/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: Utilisateur[] = [];
  filteredUsers: Utilisateur[] = [];
  groups: Group[] = []; // ✅ AJOUT: Liste des groupes disponibles
  loading = false;
  error = '';
  searchTerm = '';
  showAddModal = false;
  showEditModal = false;
  selectedUser: any | null = null;

  // Nouveau utilisateur pour le formulaire
  newUser: any = {
    username: '',
    email: '',
    prenom:'',
    nom:'',
    phone: '',
    password: '',
    suspended: false,
    banned: false,
    role: [],
    selectedGroupId: null // ✅ AJOUT: ID du groupe sélectionné
  };

  roles = [
    { value: 'ROLE_ADMIN', label: 'Administrateur' },
    { value: 'ROLE_USER', label: 'Utilisateur' },
  ];

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadGroups(); // ✅ AJOUT: Charger les groupes disponibles
  }

  // ✅ NOUVELLE MÉTHODE: Charger la liste des groupes
  loadGroups(): void {
    this.userService.getAllGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        console.log('Groupes chargés:', groups);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des groupes:', err);
      }
    });
  }

  trackByUserId(index: number, user: Utilisateur): any {
    return user.id;
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Erreur:', err);
      }
    });
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone.toLowerCase().includes(term) ||
      this.getUserRole(user).toLowerCase().includes(term)
    );
  }

  openAddModal(): void {
    this.newUser = {
      username: '',
      email: '',
      prenom: '',
      nom: '',
      phone: '',
      password: '',
      suspended: false,
      banned: false,
      role: [],
      selectedGroupId: null // ✅ RÉINITIALISER la sélection de groupe
    };
    this.showAddModal = true;
  }


  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.selectedUser = null;
  }

  // ✅ MÉTHODE MODIFIÉE: Créer utilisateur avec assignation de groupe manuelle
  addUser(): void {
    if (this.isValidUser(this.newUser)) {
      if (!Array.isArray(this.newUser.role)) {
        this.newUser.role = [this.newUser.role];
      }

      // Préparer la requête avec selectedGroupId
      const createRequest = {
        username: this.newUser.username,
        email: this.newUser.email,
        prenom: this.newUser.prenom,
        nom: this.newUser.nom,
        password: this.newUser.password,
        phone: this.newUser.phone,
        role: this.newUser.role,
        selectedGroupId: this.newUser.selectedGroupId || null
      };

      this.userService.createUser(createRequest).subscribe({
        next: (response) => {
          console.log('Réponse création utilisateur:', response);
          this.loadUsers();
          this.closeModals();

          const message = response.assignmentType === 'MANUAL'
            ? `Utilisateur ajouté et assigné manuellement au groupe ${response.assignedGroup?.name} !`
            : `Utilisateur ajouté avec assignation automatique au groupe ${response.assignedGroup?.name} !`;

          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: message,
            confirmButtonText: 'OK'
          });
        },
        error: (err) => {
          this.error = 'Erreur lors de l\'ajout de l\'utilisateur';
          console.error('Erreur:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de l\'ajout de l\'utilisateur.',
            confirmButtonText: 'Fermer'
          });
        }
      });
    }
  }

  // ✅ MÉTHODE MODIFIÉE: Mise à jour utilisateur avec changement de groupe
// ✅ MÉTHODE FIXÉE: Utilise maintenant des données compatibles avec UpdateUserDTO
// ✅ MÉTHODE FINALE CORRIGÉE: Compatible avec UpdateUserDTO
updateUser(): void {
  if (this.selectedUser && this.isValidUser(this.selectedUser)) {
    // Préparer les données au format UpdateUserDTO
    const updateRequest = {
      username: this.selectedUser.username,
      email: this.selectedUser.email,
      prenom: this.selectedUser.prenom,
      nom: this.selectedUser.nom,
      phone: this.selectedUser.phone,
      suspended: this.selectedUser.suspended,
      banned: this.selectedUser.banned || false,
      roles: this.selectedUser.selectedRole ? [this.selectedUser.selectedRole] : [], // Array de strings
      selectedGroupId: this.selectedUser.selectedGroupId || null
    };

    console.log('Requête de mise à jour (UpdateUserDTO):', updateRequest);

    this.userService.updateUser(this.selectedUser.id!, updateRequest).subscribe({
      next: (updatedUser) => {
        console.log('Utilisateur mis à jour:', updatedUser);

        // Mettre à jour la liste locale
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.searchUsers();
        this.closeModals();

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Utilisateur modifié avec succès !',
          confirmButtonText: 'OK'
        });
      },
      error: (err) => {
        this.error = 'Erreur lors de la modification de l\'utilisateur';
        console.error('Erreur:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la modification de l\'utilisateur.',
          confirmButtonText: 'Fermer'
        });
      }
    });
  }
}



  // ✅ NOUVELLE MÉTHODE: Obtenir le nom du groupe par son ID
  getGroupNameById(groupId: number): string {
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.name : 'Groupe inconnu';
  }

  // ✅ NOUVELLE MÉTHODE: Obtenir la couleur du groupe pour l'utilisateur


  // Nouvelle méthode pour bannir un utilisateur
  banUser(user: Utilisateur): void {
    Swal.fire({
      title: 'Bannir l\'utilisateur',
      text: `Voulez-vous vraiment bannir l'utilisateur ${user.username} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, bannir!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.banUser(user.email).subscribe({
          next: (response) => {
            const index = this.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
              this.users[index].banned = true;
            }
            this.searchUsers();

            Swal.fire({
              icon: 'success',
              title: 'Utilisateur banni!',
              text: 'L\'utilisateur a été banni avec succès.',
              confirmButtonText: 'OK'
            });
          },
          error: (err) => {
            this.error = 'Erreur lors du bannissement de l\'utilisateur';
            console.error('Erreur:', err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors du bannissement.',
              confirmButtonText: 'Fermer'
            });
          }
        });
      }
    });
  }

  // Nouvelle méthode pour débannir un utilisateur
  unbanUser(user: Utilisateur): void {
    Swal.fire({
      title: 'Débannir l\'utilisateur',
      text: `Voulez-vous vraiment débannir l'utilisateur ${user.username} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, débannir!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.unbanUser(user.email).subscribe({
          next: (response) => {
            const index = this.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
              this.users[index].banned = false;
            }
            this.searchUsers();

            Swal.fire({
              icon: 'success',
              title: 'Utilisateur débanni!',
              text: 'L\'utilisateur a été débanni avec succès.',
              confirmButtonText: 'OK'
            });
          },
          error: (err) => {
            this.error = 'Erreur lors du débannissement de l\'utilisateur';
            console.error('Erreur:', err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors du débannissement.',
              confirmButtonText: 'Fermer'
            });
          }
        });
      }
    });
  }

  // Méthode de suppression mise à jour pour utiliser l'email
  deleteUser(user: Utilisateur): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Voulez-vous vraiment supprimer définitivement l'utilisateur ${user.username} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(user.email).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.searchUsers();
            Swal.fire({
              icon: 'success',
              title: 'Supprimé!',
              text: 'L\'utilisateur a été supprimé définitivement.',
              confirmButtonText: 'OK'
            });
          },
          error: (err) => {
            this.error = 'Erreur lors de la suppression de l\'utilisateur';
            console.error('Erreur:', err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de la suppression.',
              confirmButtonText: 'Fermer'
            });
          }
        });
      }
    });
  }




  private isValidUser(user: any): boolean {
    return !!(user.username && user.email && user.phone);
  }

  getRoleLabel(roleName: string): string {
    const roleObj = this.roles.find(r => r.value === roleName);
    return roleObj ? roleObj.label : roleName.replace('ROLE_', '');
  }

// ✅ MÉTHODES CORRIGÉES pour gérer les rôles comme array de strings

getUserRole(user: Utilisateur): string {
  if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    return 'ROLE_USER';
  }

  const firstRole = user.roles[0];

  // Si le backend envoie un string (cas actuel)
  if (typeof firstRole === 'string') {
    return firstRole;
  }

  // Si le backend envoie un objet Role
  if (firstRole && typeof firstRole === 'object' && firstRole.name) {
    return firstRole.name;
  }

  return 'ROLE_USER';
}
getUserRoleLabel(user: Utilisateur): string {
  const role = this.getUserRole(user);
  return this.getRoleLabel(role);
}

// ✅ MÉTHODE CORRIGÉE pour toggleUserStatus
toggleUserStatus(user: Utilisateur): void {
  // Convertir les roles en strings pour l'envoi au backend
  const rolesAsStrings = user.roles.map(role => {
    if (typeof role === 'string') {
      return role;
    } else if (role && role.name) {
      return role.name;
    }
    return 'ROLE_USER';
  });

  const updatedUser: UpdateUserDTO = {
    suspended: !user.suspended,
    roles: rolesAsStrings, // ✅ Conversion en string[]
  };

  this.userService.updateUser(user.id!, updatedUser).subscribe({
    next: (result) => {
      // ✅ TRANSFORMATION: Convertir la réponse backend en format Role[]
      const transformedResult = this.transformBackendUser(result);

      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users[index] = transformedResult;
      }
      this.searchUsers();
      Swal.fire({
        icon: 'success',
        title: 'Statut modifié',
        text: `L'utilisateur a été ${transformedResult.suspended ? 'suspendu' : 'réactivé'} avec succès.`,
        confirmButtonText: 'OK'
      });
    },
    error: (err) => {
      this.error = 'Erreur lors de la modification du statut';
      console.error('Erreur:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de la modification du statut.',
        confirmButtonText: 'Fermer'
      });
    }
  });
}

// ✅ MÉTHODE UTILITAIRE pour transformer la réponse backend
transformBackendUser(backendUser: any): Utilisateur {
  return {
    ...backendUser,
    roles: this.transformRoles(backendUser.roles),
    assignedGroup: backendUser.group || backendUser.assignedGroup
  };
}

// ✅ MÉTHODE pour transformer les roles string[] en Role[]
transformRoles(roles: any): Role[] {
  if (!roles || !Array.isArray(roles)) {
    return [{ id: 1, name: 'ROLE_USER' }];
  }

  return roles.map((role, index) => {
    if (typeof role === 'string') {
      return { id: index + 1, name: role };
    } else if (role && role.name) {
      return role;
    }
    return { id: index + 1, name: 'ROLE_USER' };
  });
}


// ✅ MÉTHODE CORRIGÉE pour openEditModal
openEditModal(user: Utilisateur): void {
  this.selectedUser = {
    ...user,
    selectedRole: this.getUserRole(user), // ✅ Maintenant cela retourne correctement le string
    selectedGroupId: user.assignedGroup?.id || user.group?.id || null // ✅ Vérifier aussi user.group
  };
  this.showEditModal = true;
}

// ✅ MÉTHODE UTILITAIRE pour vérifier si un utilisateur a un rôle spécifique
hasRole(user: Utilisateur, roleName: string): boolean {
  if (!user.roles || !Array.isArray(user.roles)) {
    return false;
  }

  return user.roles.some(role => {
    if (typeof role === 'string') {
      return role === roleName;
    } else if (role && typeof role === 'object' && role.name) {
      return role.name === roleName;
    }
    return false;
  });
}

// ✅ MÉTHODE UTILITAIRE pour obtenir tous les rôles d'un utilisateur
getAllUserRoles(user: Utilisateur): string[] {
  if (!user.roles || !Array.isArray(user.roles)) {
    return ['ROLE_USER'];
  }

  return user.roles.map(role => {
    if (typeof role === 'string') {
      return role;
    } else if (role && typeof role === 'object' && role.name) {
      return role.name;
    }
    return 'ROLE_USER';
  });
}

// ✅ CORRECTION pour getUserGroupColor et getUserGroupIcon
getUserGroupColor(user: Utilisateur): string {
  const group = user.assignedGroup || user.group; // ✅ Vérifier les deux propriétés
  if (group) {
    return group.color || this.userService.getGroupColor(group.name);
  }
  return '#424242';
}

getUserGroupIcon(user: Utilisateur): string {
  const group = user.assignedGroup || user.group; // ✅ Vérifier les deux propriétés
  if (group) {
    return this.userService.getGroupIcon(group.name);
  }
  return '🏢';
}




  getInitials(user: Utilisateur): string {
    return user.username.charAt(0).toUpperCase() +
           (user.username.length > 1 ? user.username.charAt(1).toUpperCase() : 'U');
  }
}
