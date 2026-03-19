import { Component } from '@angular/core';
import { TopbarUserDropdownComponent } from '../../../partials/topbar-user-dropdown/topbar-user-dropdown.component';

@Component({
  selector: '[app-header]',
  templateUrl: './header.component.html',
  imports: [TopbarUserDropdownComponent],
  standalone: true,
})
export class HeaderComponent {}
