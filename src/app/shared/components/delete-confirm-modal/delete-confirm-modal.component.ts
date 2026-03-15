import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeleteInfo {
  label: string;
  value: string;
}

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirm-modal.component.html'
})
export class DeleteConfirmModalComponent {
  entityLabel = input.required<string>();   // e.g. "Tipo de Unidad"
  entityName  = input.required<string>();   // e.g. "MASS — Masa y Peso"
  details     = input<DeleteInfo[]>([]);    // additional info rows
  isDeleting  = input<boolean>(false);

  confirmed = output<void>();
  cancelled = output<void>();
}
