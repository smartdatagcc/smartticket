import { Component, OnInit, AfterViewInit, ViewChild, Inject, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { ResponseTemplateServiceService } from 'src/app/services/response-template-service/response-template-service.service';
import { TicketArchiveDialogComponent } from './ticket-archive-dialog/ticket-archive-dialog.component';
import { UserProfileDialogModel, UserProfileDialogComponent } from '../user-profile-dialog/user-profile-dialog.component';
import SignaturePad from 'signature_pad';
import * as moment from 'moment';
import { StatusServiceService } from 'src/app/services/status-service/status-service.service';
import * as _ from 'underscore';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { error } from 'protractor';
@Component({
  selector: 'app-existing-ticket',
  templateUrl: './existing-ticket.component.html',
  styleUrls: ['./existing-ticket.component.scss']
})
export class ExistingTicketComponent implements OnInit {
  tenantId: any;
  allTenantUsers: any;
  formId: any;
  ticketId: any;
  newComment: any;
  assignableUsers: any;
  userId: number;
  ticket: any;
  lookupData: any;
  responseTemplates: any;
  currentResponseTemplate = {};
  expandComments = false;
  expandDetails = false;
  showAddComments = false;
  inEditMode = false;
  canViewAdminPages;
  canManageTicket;
  canViewNotes;
  canCreateNotes;
  canEditTicket;
  originalTicket;
  metadataControls;
  ticketAttachments = [];
  newCommentformsubmitted = false;
  formsubmitted = false;
  statusTypes = [];
  selectedStatus: any;
  @ViewChild('editTicketFrm') editTicketFrm: any;
  @ViewChild('ticketcontent') htmlData: ElementRef;
  @ViewChild('formPdfDocument') formPdfDocument: ElementRef;
  @ViewChild('addCommentForm') addCommentForm: any;
  element: any;
  hiddenfieldelement: any;
  environment: any;
  tinyMceConfig: any;
  isValidUser: boolean;

  constructor(private route: ActivatedRoute, private supportTickets: SupportTicketServiceService, private titleService: Title,
    private lookupService: LookupServiceService, private spinner: NgxSpinnerService, private userService: UserService,
    public authService: AuthService, private ControlsService: ControlsServiceService, private router: Router, private location: Location,
    public dialog: MatDialog, private accountService: AccountServiceService, private statusService: StatusServiceService,
    private tosterService: ToastrnotificationService, private responseService: ResponseTemplateServiceService,
    private ngZone: NgZone) {
  }
  CanDeactivate(): any {
    if (this.editTicketFrm === undefined) {
      return true;
    }
    const controlskeys = this.editTicketFrm !== undefined && this.editTicketFrm.form.controls;
    Object.keys(controlskeys).map((key) => {
      if (controlskeys[key].dirty && controlskeys[key].touched) {
        controlskeys[key].markAsDirty();
      } else {
        controlskeys[key].markAsPristine();
      }
    });
    if (this.editTicketFrm.form.dirty || this.addCommentForm.form.dirty) {
      //  return confirm('You haven"t saved your changes. Do you want to leave without finishing ?');
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Ticket Details');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
      this.configureTinyMce();
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
      this.ticketId = params.id;
      this.getTicketCompleteData();
    });
  }

  getTicketCompleteData() {
    if (this.tenantId !== '') {
      this.getSupportTicket();
      this.getResponseTemplate();
      this.userId = this.authService.authentication.data.id;
      this.expandComments = false;
      this.expandDetails = false;
      this.showAddComments = false;
      this.inEditMode = false;
      this.environment = environment.apiUrl;
    }
  }

  configureTinyMce() {
    const _THIS = this;
    this.tinyMceConfig = {
      menubar: true,
      height: 200,
      paste_data_images: true,
      data: [],
      setup: function (editor) {
        const data = _THIS.responseTemplates.template !== undefined && _THIS.responseTemplates.template.responseTemplates || [];
        if (_THIS.responseTemplates.template !== undefined) {
          editor.ui.registry.addMenuButton('mybutton', {
            icon: 'comment',
            fetch: function (callback) {
              const dataitems = [];
              data.map(item => {
                dataitems.push({
                  type: 'menuitem',
                  text: item.name,
                  onAction() {
                    var currentContent = editor.getContent();
                    if (_THIS.newComment === undefined || _THIS.newComment === null) {
                      _THIS.newComment = currentContent;
                    }
                    _THIS.ngZone.run(() => {
                      _THIS.newComment = currentContent + item.content;
                    })
                  }
                });
              });
              callback(dataitems);
            }
          });
        }
      },
      plugins: ['autoresize advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat| mybutton ',
      max_height: 400
    };
  }

  getcontent(content) {
    const count = content.replace(/(<([^>]+)>)/ig, '');
    if (count.length >= 5000 || count.length == 0) {
      this.addCommentForm.form.controls.newcomment.setErrors({ invalid: true });
    } else {
      this.addCommentForm.form.controls.newcomment.setErrors(null);
    }
  }

  // get lookupdate
  getlookupdate() {
    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupData = data;
        this.getStatusTypes();
      },
        error => {
        }
      );
    }
  }

  // Get Assignable users
  getAssignableUsers() {
    this.userService.getAssignableUsers(this.tenantId, this.formId).subscribe(data => {
      this.assignableUsers = data;
    });
  }

  // get response template
  getResponseTemplate() {
    this.responseService.get(this.tenantId, this.formId).subscribe(data => {
      this.responseTemplates = data;
    });
  }

  // Get SupportTicket
  getSupportTicket() {
    this.spinner.show();
    this.supportTickets.getSupportTicket(this.tenantId, this.ticketId).subscribe(data => {
      this.getlookupdate();
      this.ticket = data;
      this.originalTicket = data;
      this.supportTickets.originalTicket = data;
      this.metadataControls = this.ControlsService.getMetadataControlsWithOutChunk(this.ticket.metadata.controls);
      this.canViewAdminPages = this.authService.allowed(this.ticket.tenantId, 'CanViewAdminPages');
      this.canManageTicket = this.authService.allowed(this.ticket.tenantId, 'CanManageTickets');
      this.canViewNotes = this.authService.allowed(this.ticket.tenantId, 'CanViewNotes');
      this.canCreateNotes = this.authService.allowed(this.ticket.tenantId, 'CanEditNotes');
      this.canEditTicket = this.authService.allowed(this.ticket.tenantId, 'CanEditTickets');
      if (this.canEditTicket) {
        this.getAssignableUsers();
      }

      // Get all tenant users
      this.userService.getAllUsers(this.tenantId).subscribe((data: any) => {
        this.allTenantUsers = data;
        // Is the current assignedUser still a valid tenant user 
        // if not do not diplay assignedUser
        this.isValidUser = _.any(this.allTenantUsers, this.ticket.assignedUser);
        if (!this.isValidUser) {
          this.ticket.assignedUser.name = this.ticket.assignedUser.name + ' ' + '(Removed)';
        }
      });

      this.spinner.hide();
    },
      (error) => {
        this.tosterService.showErrorMessage('Not Vaid Ticket Id', 'Error');
        this.router.navigate(['./' + this.tenantId + '/tickets/' + this.formId]);
      });
  }

  // Cancel Edit
  cancelEditDetails(frm) {
    this.ticketAttachments = [];
    this.getSupportTicket();
    this.inEditMode = false;
    this.editTicketFrm.form.markAsPristine();
  }

  // can Edit
  canEdit() {
    if (this.ticket.deleted || this.ticket.archived || !this.canEditTicket) {
      return false;
    }
    return true;
  }

  // set Edit Mode
  setEditMode() {
    this.editTicketFrm.form.markAsPristine();
    this.inEditMode = true;
  }

  // set UnEdit Mode
  unSetEditMode() {
    this.inEditMode = false;
  }

  // undelete
  undelete() {
    this.spinner.show();
    this.supportTickets.undeleteTicket(this.ticket.id, this.ticket.tenantId).subscribe((ticket) => {
      this.ticket.deleted = false;
      this.originalTicket.deleted = false;
      this.supportTickets.setSelectedFormName(true);
      this.tosterService.showSuccessMessage('Ticket successfully unarchived', 'success');
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate([this.router.url]);

      this.spinner.hide();
    },
      (err) => {
        this.tosterService.showErrorMessage(err.status + ' : ' + err.statusText, 'An error has occurred');
        this.spinner.hide();
      });
  }

  // unArchive
  unarchive() {
    if (this.ticket.archived) {
      this.spinner.show();
      this.ticket.archived = false;
      this.supportTickets.updateSupportTicket(this.ticket).subscribe((ticket) => {
        this.tosterService.showSuccessMessage('Ticket successfully unarchived', 'success');
        this.supportTickets.setSelectedFormName(true);
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([this.router.url]);

        this.spinner.hide();
      }, (err) => {
        this.tosterService.showErrorMessage(err.status + ' : ' + err.statusText, 'An error has occurred');
        this.spinner.hide();
      });
    }
  }

  // displayArchiveButton
  displayArchiveButton() {
    if (this.inEditMode) {
      return false;
    }

    let canView = false;
    if (this.canViewAdminPages && !this.ticket.deleted) {
      canView = true;
    }
    if (this.canManageTicket && !this.ticket.deleted && !this.ticket.archived) {
      canView = true;
    }
    return canView;
  }

  // Delete Ticket Confirmation
  openDeletedTicketConfirmation() {
    const dialogRef = this.dialog.open(TicketArchiveDialogComponent, {
      width: '600px',
      data: this.ticket
    });
  }

  // open user details
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


  // add  new comment
  addComment(form) {
    this.newCommentformsubmitted = true;
    this.getcontent(form.value.newcomment);
    if (form.valid) {
      this.spinner.show();
      this.supportTickets.addComment(this.ticket, { comment: this.newComment }).subscribe(
        (res) => {
          this.ticket.comments.unshift(res);
          this.newComment = '';
          this.showAddComments = false;
          form.reset();
          this.spinner.hide();
          this.supportTickets.setNewNote(true);
          this.tosterService.showSuccessMessage('Comment successfully added', 'Success');
        },
        (error) => {
          this.spinner.hide();
          this.tosterService.showErrorMessage(error.error.message, 'Error');
        }
      );
    }
  }

  formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  // Get Control value
  getControlValue(control) {
    const val = control.value != undefined ? control.value : control.content;
    switch (control.type) {
      case 'datepicker':
        return val ? moment(val).format('M/DD/YYYY') : null;
      case 'timepicker':
        return val ? moment.utc(val).format('h:mm a') : null;
      case 'checkboxlist':
        return val;
      case 'radiobuttonlist':
        return val && control.value instanceof Array ? control.value.join(', ') : val;
      case 'toggle':
        return val && val === true ? control.options[0] : control.options[1];
      default:
        return val === null || val === undefined ? '' : val;
    }
  }

  // Getting the status Types
  getStatusTypes() {
    if (this.ticket.form.statusTypes !== undefined) {
      this.statusTypes = this.ticket.form.statusTypes.statusIds.map((statusid) => {
        const status = _.find(this.lookupData.statusTypes, { id: statusid.id });
        return status;
      });
    }
  }

  //  cancel new comment
  cancelNewComment(form) {
    this.showAddComments = false;
    this.newComment = '';
    form.reset();
  }

  // select file
  processFile(imageInput: any) {
    const FileSize = (imageInput.files[0].size || 0) / 1024 / 1024; // in MB
    if (FileSize > 5) {
      this.tosterService.showErrorMessage('File cannot be larger than 5 MB', 'Error');
    } else {
      this.ticketAttachments.push(imageInput.files[0]);
      this.editTicketFrm.form.markAsDirty();
    }
  }

  // replace file
  replacefile(fileInput, index) {
    const FileSize = fileInput.target.files[0].size / 1024 / 1024; // in MB
    if (FileSize > 5) {
      this.tosterService.showErrorMessage('File cannot be larger than 5 MB', 'Error');
    } else {
      const file = fileInput.target.files[0];
      this.ticketAttachments[index] = file;
    }
  }

  // remove file
  removefile(file) {
    this.ticketAttachments.splice(this.ticketAttachments.indexOf(file), 1);
  }

  // signature model
  signature(control, index): void {
    const dialogRef = this.dialog.open(SignatureDialog, {
      data: { control }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        control.value = result;
        this.editTicketFrm.form.markAsDirty();
        this.editTicketFrm.form.controls[control.label + '_' + index].markAsDirty();
        this.editTicketFrm.form.controls[control.label + '_' + index].markAsTouched();
      }
    });
  }

  // Edit Ticket
  updateTicket(editTicketFrm) {
    this.formsubmitted = true;
    if (editTicketFrm.valid) {
      this.spinner.show();
      let attachmentCount = 1;
      const totalAttachmentCount = this.ticketAttachments.length;
      if (this.ticketAttachments.length > 0) {
        this.supportTickets.addFile(this.ticketAttachments, this.tenantId, this.ticket.id).subscribe(
          (res) => {
            this.originalTicket.attachments.push(res);
            attachmentCount++;
            if (attachmentCount > totalAttachmentCount) {
              this.editticketdata(editTicketFrm);
            }
          },
          // tslint:disable-next-line:no-shadowed-variable
          (error) => {
            attachmentCount++;
            if (attachmentCount > totalAttachmentCount) {
              this.editticketdata(editTicketFrm);
            }
            // this.toastrService.showErrorMessage(error.error.message, 'Error');
          });
      } else {
        this.editticketdata(editTicketFrm);
      }
    } else {
      this.spinner.hide();
      this.tosterService.showErrorMessage('Please fill all mandatory fields', 'Error');
    }
  }

  // call after exit form submit
  editticketdata(form) {
    if (this.canEditTicket) {
      this.supportTickets.updateSupportTicket(this.ticket).subscribe((succes) => {
        this.getSupportTicket();
        this.ticketAttachments = [];
        this.inEditMode = false;
        this.supportTickets.setSelectedFormName(true);
        this.editTicketFrm.form.markAsPristine();
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([this.router.url]);
        this.tosterService.showSuccessMessage('Ticket Updated', 'Success');
      }, (error) => {
        this.tosterService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });
    } else {
      this.supportTickets.getSupportTicketComments(this.tenantId, this.ticketId).subscribe((res) => {
        this.ticketAttachments = [];
        this.inEditMode = false;
        this.editTicketFrm.form.markAsPristine();
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([this.router.url]);
        this.spinner.hide();
        this.tosterService.showSuccessMessage('Ticket Updated', 'Success');
      });
    }
  }

  // Remove Attachment
  removeAttachment(attachment) {
    const dialogTitle = `Do you want to remove this file?<br>`;
    const message = `This file will no longer be accessible in the ticketing system or visible to users.`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(dialogTitle, message, okButtonText, cancelButtonText);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dlgResult = dialogResult;
      if (dlgResult === true) {
        this.spinner.show();
        this.supportTickets.removeAttachment(attachment.id, this.ticket.tenantId, this.ticket.id).subscribe((res) => {
          this.ticket.attachments = this.ticket.attachments.filter((attach) => attach.id !== attachment.id);
          this.originalTicket.attachments = this.originalTicket.attachments.filter((attach) => attach.id !== attachment.id);
          this.tosterService.showSuccessMessage('Attachment removed successfully', 'Success');
          this.spinner.hide();
        });
      }
    });
  }


  // status Change
  onStatusChange(statusid) {
    // tslint:disable-next-line:triple-equals
    const status = this.statusTypes.find(x => x.id == statusid);
    this.ticket.statusType = status;
    this.editTicketFrm.form.markAsDirty();
  }
  onAssignedUserChange(event) {
    const userid = this.ticket.assignedTo;
    // tslint:disable-next-line:triple-equals
    const user = this.assignableUsers.find(x => x.id == userid);
    this.ticket.assignedUser = user;
  }


  // Export Pdf
  exportPdf(e) {
    const DATA = this.htmlData.nativeElement;
    this.formPdfDocument.nativeElement.insertAdjacentHTML('beforeend', DATA.innerHTML);
    this.element = document.getElementById('formPdfDocument') as HTMLElement;
    this.hiddenfieldelement = document.getElementById('document') as HTMLElement;
    this.hiddenfieldelement.value = DATA.innerHTML;
    this.element.submit();
  }
}


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'signature-dialog',
  templateUrl: '../signature-dialog.html',
  styleUrls: ['./existing-ticket.component.scss']
})
// tslint:disable-next-line:component-class-suffix
export class SignatureDialog implements AfterViewInit {
  @ViewChild('sPad', { static: true }) signaturePadElement;
  signaturePad: any;
  constructor(
    public dialogRef: MatDialogRef<SignatureDialog>, @Inject(MAT_DIALOG_DATA) public data) { }

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
      // alert('Please provide a signature first.');
    } else {
      const dataURL = this.signaturePad.toDataURL();
      this.dialogRef.close(dataURL);
    }
  }
}
