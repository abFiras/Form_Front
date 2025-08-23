// users.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService, Utilisateur } from '../service/user.service';
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
    role: []
  };

  roles = [
    { value: 'ROLE_ADMIN', label: 'Administrateur' },
    { value: 'ROLE_USER', label: 'Utilisateur' },
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
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
      phone: '',
      password: '',

    };
    this.showAddModal = true;
  }

  openEditModal(user: Utilisateur): void {
    this.selectedUser = { ...user };
    this.showEditModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.selectedUser = null;
  }

  addUser(): void {
    if (this.isValidUser(this.newUser)) {
        if (!Array.isArray(this.newUser.role)) {
      this.newUser.role = [this.newUser.role];
    }
      this.userService.createUser(this.newUser).subscribe({
        next: (user) => {
          this.users.push(user);
          this.searchUsers();
          this.closeModals();
           Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Utilisateur ajouté avec succès !',
          confirmButtonText: 'OK'
        });
            this.loadUsers();

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

  updateUser(): void {
    if (this.selectedUser && this.isValidUser(this.selectedUser)) {
      // Préparer les données pour le backend
      const userToUpdate = {
        ...this.selectedUser,
        roles: this.selectedUser.selectedRole ? [{ name: this.selectedUser.selectedRole }] : this.selectedUser.roles
      };

      // Supprimer la propriété temporaire
      delete userToUpdate.selectedRole;

      this.userService.updateUser(this.selectedUser.id!, userToUpdate).subscribe({
        next: (updatedUser) => {
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
            // Mettre à jour l'utilisateur dans la liste locale
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
            // Mettre à jour l'utilisateur dans la liste locale
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

 toggleUserStatus(user: Utilisateur): void {
    const updatedUser = { ...user, suspended: !user.suspended };
    this.userService.updateUser(user.id!, updatedUser).subscribe({
      next: (result) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = result;
        }
        this.searchUsers();
        Swal.fire({
          icon: 'success',
          title: 'Statut modifié',
          text: `L'utilisateur a été ${result.suspended ? 'suspendu' : 'réactivé'} avec succès.`,
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
  private isValidUser(user: any): boolean {
    return !!(user.username && user.email && user.phone);
  }

  getRoleLabel(roleName: string): string {
    const roleObj = this.roles.find(r => r.value === roleName);
    return roleObj ? roleObj.label : roleName.replace('ROLE_', '');
  }

  getUserRole(user: Utilisateur): string {
    return user.roles && user.roles.length > 0 ? user.roles[0].name : 'ROLE_USER';
  }

  getUserRoleLabel(user: Utilisateur): string {
    const role = this.getUserRole(user);
    return this.getRoleLabel(role);
  }

  getInitials(user: Utilisateur): string {
    return user.username.charAt(0).toUpperCase() +
           (user.username.length > 1 ? user.username.charAt(1).toUpperCase() : 'U');
  }
}
