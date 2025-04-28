import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileDialogModel, UserProfileDialogComponent } from '../../views/tickets/user-profile-dialog/user-profile-dialog.component';

@Component({
  selector: 'app-ticket-header',
  templateUrl: './ticket-header.component.html',
  styleUrls: ['./ticket-header.component.scss']
})
export class TicketHeaderComponent implements OnInit {

  @Input() ticket;
  @Input() validTenantUser;
  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  // set form icon
  setFormIcon() {
    return 'fa ' + this.ticket.form.settings.details.icon + ' fa-4x';
  }

  // open profile
  openProfile(userid) {
    const tenantId = this.ticket.tenantId;

    const dialogData = new UserProfileDialogModel(userid, tenantId);
    const windowsHeight = window.innerHeight - 150;
    const dialogRef = this.dialog.open(UserProfileDialogComponent, {
      data: dialogData,
      width: '600px',
      maxHeight: windowsHeight + 'px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
    });

  }

}
