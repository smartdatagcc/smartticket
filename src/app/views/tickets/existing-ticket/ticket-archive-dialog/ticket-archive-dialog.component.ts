import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-archive-dialog',
  templateUrl: './ticket-archive-dialog.component.html',
  styleUrls: ['./ticket-archive-dialog.component.scss']
})
export class TicketArchiveDialogComponent implements OnInit {
  ticket;
  deleteOnly;
  canViewAdminPages;
  deleteThis;

  constructor(private router: Router, public dialogRef: MatDialogRef<TicketArchiveDialogComponent>, private supportTickets: SupportTicketServiceService,
               @Inject(MAT_DIALOG_DATA) public data,  public authService: AuthService, private tosterService: ToastrnotificationService,
               private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.ticket = this.data;
    this.deleteOnly = this.ticket.archived;
    this.canViewAdminPages = this.authService.allowed(this.ticket.tenantId, 'CanViewAdminPages');
    this.deleteThis = false;
  }

  dismiss(){
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate([this.router.url]);
    this.dialogRef.close();
  }

  getTitle(){
      if (this.ticket.archived || this.deleteThis){
          return 'Delete ' + this.ticket.form.name;
      }

      return 'Archive ' + this.ticket.form.name;
  }

  getText(){
      if (this.ticket.archived || this.deleteThis) {
          return 'delete';
      }
      return 'archive';
  }

  getConfirmationText(){
      if (this.ticket.archived || this.deleteThis) {
          return 'UnCheck to archive';
      }
      return 'Check to delete';
  }

  archiveDelete(deleteArchiveForm){
    if (deleteArchiveForm.valid){
        this.spinner.show();
        if (this.ticket.archived || this.deleteThis){
            // delete
            this.ticket.deleted = true;
            this.ticket.archived = false;
            this.supportTickets.deleteSupportTicket(this.ticket).subscribe((result) => {
              this.tosterService.showSuccessMessage('Ticket successfully deleted' , 'success');
              this.supportTickets.setSelectedFormName(true);
              this.spinner.hide();
              this.dismiss();

            }, (err) => {
              this.tosterService.showErrorMessage('An error has occurred ' , err.data.message);
              this.spinner.hide();
            });
        }
        else {
            // archive
            this.ticket.deleted = false;
            this.ticket.archived = true;
            this.supportTickets.archiveSupportTicket(this.ticket).subscribe((result) => {
              this.tosterService.showSuccessMessage('Ticket successfully archived' , 'success');
              this.supportTickets.setSelectedFormName(true);
              this.spinner.hide();
              this.dismiss();
            }, (err) => {
              this.tosterService.showErrorMessage('An error has occurred ' , err.data.message);
              this.spinner.hide();
            });
        }
    }
  };
}
