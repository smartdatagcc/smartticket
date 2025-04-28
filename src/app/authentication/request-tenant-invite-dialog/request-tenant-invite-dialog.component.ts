import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-request-tenant-invite-dialog',
  templateUrl: './request-tenant-invite-dialog.component.html',
  styleUrls: ['./request-tenant-invite-dialog.component.scss']
})
export class RequestTenantInviteDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<RequestTenantInviteDialogComponent>,) { }

  ngOnInit(): void {
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }

}
