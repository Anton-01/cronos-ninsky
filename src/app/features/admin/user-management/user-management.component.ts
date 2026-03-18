import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserResponse, UpdateUserRequest, AssignRolesRequest } from '../../../core/models/user.model';
import { ErrorResponse } from '../../../core/models/error-response.model';
import { PageRequest } from '../../../core/models/pagination.model';

type ActionPanel = 'none' | 'details' | 'roles';

const AVAILABLE_ROLES = ['ADMIN', 'USER', 'MANAGER'] as const;

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  // ── Data state ─────────────────────────────────────────────────────────────
  users         = signal<UserResponse[]>([]);
  totalElements = signal(0);
  totalPages    = signal(0);
  isLoading     = signal(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  roleFilter    = signal<string>('');
  statusFilter  = signal<string>('');

  // ── Pagination ─────────────────────────────────────────────────────────────
  pageRequest: PageRequest = { page: 0, size: 10, sort: 'createdAt,desc' };

  // ── Action panel ───────────────────────────────────────────────────────────
  selectedUser  = signal<UserResponse | null>(null);
  activePanel   = signal<ActionPanel>('none');
  isActioning   = signal(false);
  openDropdownId = signal<string | null>(null);

  readonly availableRoles = AVAILABLE_ROLES;

  // ── Assign roles form ──────────────────────────────────────────────────────
  rolesForm = this.fb.group({
    selectedRoles: [[] as string[], [Validators.required]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const role    = this.roleFilter()   || undefined;
    const enabled = this.statusFilter() === '' ? undefined
                  : this.statusFilter() === 'active';

    this.userService.getAllUsers({ ...this.pageRequest, role, enabled }).subscribe({
      next: res => {
        this.users.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.totalPages.set(res.data.totalPages);
        this.isLoading.set(false);
      },
      error: (err: ErrorResponse) => {
        this.isLoading.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudo cargar la lista de usuarios.');
      }
    });
  }

  applyFilters(): void {
    this.pageRequest = { ...this.pageRequest, page: 0 };
    this.load();
  }

  // ── Dropdown actions ───────────────────────────────────────────────────────
  toggleDropdown(userId: string): void {
    this.openDropdownId.update(id => id === userId ? null : userId);
  }

  viewDetails(user: UserResponse): void {
    this.selectedUser.set(user);
    this.activePanel.set('details');
    this.openDropdownId.set(null);
  }

  openAssignRoles(user: UserResponse): void {
    this.selectedUser.set(user);
    this.rolesForm.setValue({ selectedRoles: [...user.roles] });
    this.activePanel.set('roles');
    this.openDropdownId.set(null);
  }

  closePanel(): void {
    this.selectedUser.set(null);
    this.activePanel.set('none');
  }

  // ── Block / Unblock ────────────────────────────────────────────────────────
  toggleBlock(user: UserResponse): void {
    this.isActioning.set(true);
    this.openDropdownId.set(null);

    const action$ = user.accountNonLocked
      ? this.userService.blockUser(user.id)
      : this.userService.unblockUser(user.id);

    action$.subscribe({
      next: res => {
        this.isActioning.set(false);
        this.users.update(list => list.map(u => u.id === res.data.id ? res.data : u));
        const msg = res.data.accountNonLocked ? 'Usuario desbloqueado.' : 'Usuario bloqueado.';
        this.toast.success('Acción completada', msg);
      },
      error: (err: ErrorResponse) => {
        this.isActioning.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudo cambiar el estado.');
      }
    });
  }

  // ── Assign roles ───────────────────────────────────────────────────────────
  onAssignRoles(): void {
    const user = this.selectedUser();
    if (!user) return;

    const roles = this.rolesForm.value.selectedRoles ?? [];
    if (roles.length === 0) {
      this.toast.error('Validación', 'Debes asignar al menos un rol.');
      return;
    }

    this.isActioning.set(true);
    const payload: AssignRolesRequest = { roles };

    this.userService.assignRoles(user.id, payload).subscribe({
      next: res => {
        this.isActioning.set(false);
        this.users.update(list => list.map(u => u.id === res.data.id ? res.data : u));
        this.closePanel();
        this.toast.success('Roles asignados', `Roles actualizados para ${user.username}.`);
      },
      error: (err: ErrorResponse) => {
        this.isActioning.set(false);
        this.toast.error('Error', err?.message ?? 'No se pudieron asignar los roles.');
      }
    });
  }

  // ── Role chip toggle ───────────────────────────────────────────────────────
  toggleRole(role: string): void {
    const current = this.rolesForm.value.selectedRoles ?? [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    this.rolesForm.setValue({ selectedRoles: updated });
  }

  isRoleSelected(role: string): boolean {
    return (this.rolesForm.value.selectedRoles ?? []).includes(role);
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    this.pageRequest = { ...this.pageRequest, page };
    this.load();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}
