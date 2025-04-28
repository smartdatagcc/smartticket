import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { error } from 'protractor';
import SignaturePad from 'signature_pad';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { CanComponentDeactivate } from 'src/app/services/auth-guard/my-guard.service';
import { Title } from '@angular/platform-browser';



@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent implements OnInit, CanComponentDeactivate {

  lookupData: any;
  formId: number;
  tenantId: number;
  form: any;
  ticketTemplate: any;
  canManageTicket: any;
  assignableUsers: any;
  canCreateNotes: any;
  ticket: any;
  ticketAttachments = [];
  metadataControls: any;
  formsubmitted = false;
  @ViewChild('createTicketForm') createTicketForm: any;
  constructor(private route: ActivatedRoute, private lookupService: LookupServiceService, private spinner: NgxSpinnerService,
              public authService: AuthService, private ControlsService: ControlsServiceService, private router: Router,
              public dialog: MatDialog, private accountService: AccountServiceService, private userService: UserService,
              private supportTickets: SupportTicketServiceService, private toastrService: ToastrnotificationService,
              private titleService: Title) { }


  CanDeactivate(): any {
    if (this.createTicketForm.form.dirty) {
      //  return confirm('You haven"t saved your changes. Do you want to leave without finishing ?');
       return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit() {
    this.titleService.setTitle('Create Ticket');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
    });

    this.getlookupdate();
    this.canManageTicket = this.authService.allowed(this.tenantId, 'CanManageTickets');
    //  this.assignableUsers = assignableUsers;
    this.canCreateNotes = this.authService.allowed(this.tenantId, 'CanEditNotes');
    // tslint:disable-next-line:triple-equals
  }

   // get lookupdate
   getlookupdate() {
    if (this.tenantId !== null) {
      this.spinner.show();
      this.lookupService.getLookupData(this.tenantId).subscribe((data: any) => {
        this.lookupService.storeData(data);
        this.lookupData = data;
        this.form = data.tenant.forms.filter((form) => form.id == this.formId)[0];
        this.ticketTemplate = this.form.ticketTemplate;
        this.ticket = {
          tenantId: this.tenantId,
          formId: this.formId,
          metadata: this.ticketTemplate,
          assignedTo: null
        };

        if (this.form.settings && this.form.settings.details && this.form.settings.details.autoAssignedUser) {
          this.ticket.assignedTo = this.form.settings.details.autoAssignedUser;
        }

        this.metadataControls = this.ControlsService.getMetadataControlsWithOutChunk(this.ticket.metadata.controls);
        this.getAssignableUsers();
        this.spinner.hide();
      },
      error => {
          this.toastrService.showErrorMessage('Something Went Wrong. Please reload page ', 'Error');
          this.spinner.hide();
      });
    }
  }

  // select file
  processFile(imageInput: any) {
    const FileSize = imageInput.files[0].size / 1024 / 1024; // in MB
    if (FileSize > 5) {
      this.toastrService.showErrorMessage('File cannot be larger than 5 MB', 'Error');
    } else {
      this.ticketAttachments.push(imageInput.files[0]);
    }
  }

  // replace file
  replacefile(fileInput, index) {
    const FileSize = fileInput.target.files[0].size / 1024 / 1024; // in MB
    if (FileSize > 5) {
      this.toastrService.showErrorMessage('File cannot be larger than 5 MB', 'Error');
    } else {
      const file = fileInput.target.files[0];
      this.ticketAttachments[index] = file;
    }
  }

  // remove file
  removefile(file) {
    this.ticketAttachments.splice(this.ticketAttachments.indexOf(file), 1);
  }

  // onsubmit calls this method
  submit(createTicketForm) {
    this.formsubmitted = true;
    if (createTicketForm.valid) {
      let attachmentCount = 1;
      const totalAttachmentCount = this.ticketAttachments.length;
      this.spinner.show();
      this.supportTickets.createSupportTicket(this.ticket).subscribe((data: any) => {
        this.ticket.id = data.id;
        this.supportTickets.setSelectedFormName(true);
        const path = data.tenantId + '/ticket/' + data.formId + '/' + data.id;
        if (this.ticketAttachments.length > 0) {
          this.supportTickets.addFile(this.ticketAttachments, this.tenantId, this.ticket.id).subscribe(
            (res) => {
              attachmentCount++;
              if (attachmentCount > totalAttachmentCount) {
                this.spinner.hide();
                this.createTicketForm.form.markAsPristine();
                this.router.routeReuseStrategy.shouldReuseRoute = () => false;
                this.router.onSameUrlNavigation = 'reload';
                this.router.navigate([path]);
              }
            },
            // tslint:disable-next-line:no-shadowed-variable
            (error) => {
              attachmentCount++;
              if (attachmentCount > totalAttachmentCount) {
                this.spinner.hide();
              }
              this.toastrService.showErrorMessage(error.error.message, 'Error');
            }, () => {
              this.spinner.hide();
              this.toastrService.showSuccessMessage('Ticket with attachments has been created', 'Success');
              this.router.routeReuseStrategy.shouldReuseRoute = () => false;
              this.router.onSameUrlNavigation = 'reload';
              this.router.navigate([path]);
            });
        } else {
          this.spinner.hide();
          this.toastrService.showSuccessMessage('Ticket has been created', 'Success');
          this.createTicketForm.form.markAsPristine();
          this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigate([path]);
        }
        // tslint:disable-next-line: no-shadowed-variable
      }, (error) => {
        this.toastrService.showErrorMessage(error.error.message, 'Error');
      });
    } else {
      this.toastrService.showErrorMessage('Please fill all mandatory fields', 'Error');
    }
  }

  // Get Assignable users
  getAssignableUsers() {
    this.userService.getAssignableUsers(this.tenantId, this.formId).subscribe(data => {
      this.assignableUsers = data;
    });
  }

  signature(control, index): void {
    const dialogRef = this.dialog.open(SignatureDialog, {
      data: { control }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.createTicketForm.form.controls[ control.label + '_' + index], control.value = result;
        this.createTicketForm.form.markAsDirty();
      }
    });
  }
}



@Component({
  // tslint:disable-next-line:component-selector
  selector: 'signature-dialog',
  templateUrl: '../signature-dialog.html',
  styleUrls: ['./create-ticket.component.scss']
})
// tslint:disable-next-line:component-class-suffix
export class SignatureDialog implements AfterViewInit {
  @ViewChild('sPad', { static: true }) signaturePadElement;
  signaturePad: any;
  constructor(
    public dialogRef: MatDialogRef<SignatureDialog>, @Inject(MAT_DIALOG_DATA) public data,
    private toastrService: ToastrnotificationService) { }

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement);
  }

  close() {
    this.dialogRef.close();
  }
  clear() {
    this.signaturePad.clear();
  }

  save() {
    if (this.signaturePad.isEmpty()) {
      this.toastrService.showErrorMessage('Please provide a signature', 'Error');
    } else {
      const dataURL = this.signaturePad.toDataURL();
      this.dialogRef.close(dataURL);
    }
  }
}
