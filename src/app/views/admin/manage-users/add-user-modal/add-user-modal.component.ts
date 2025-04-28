import { Component, OnInit, Inject, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import SignaturePad from 'signature_pad';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { Tenant } from 'src/app/model/Tenant';
import { environment } from 'src/environments/environment';
import { domainToASCII } from 'url';

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss']
})
export class AddUserModalComponent implements OnInit {

  userTemplate: any;
  tenantId: any;
  tenant: Tenant;
  roles: any;
  newUser: any;
  controls: any;
  metadataControls: any;
  message: string;
  submitted: boolean;
  isDismissed: boolean;

  constructor(
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: AddUserDialogModel,
    private controlService: ControlsServiceService,
    private tenantService: TenantServiceService,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private toastrService: ToastrnotificationService
  ) {
    this.userTemplate = data.userTemplate;
    this.tenantId = data.tenantId;
    this.roles = data.roles;
  }

  ngOnInit(): void {

    this.tenantService.getTenant(this.tenantId).subscribe(t => {
      this.tenant = t as Tenant;
    });

    this.userTemplate.controls.forEach(function (control) {
      if (!control.adminOnly) {
        control.required = false;
      }
      control.value = null;
    });
    this.newUser = {
      email: null,
      user_metadata: this.userTemplate,
      role_id: this.roles.find(data => data.default === true).id
    };

    this.controls = this.controlService.initialize(this.newUser.user_metadata.controls);
    this.metadataControls = this.controlService.getMetadataControlsWithOutChunk(this.controls);
  }

  validateDomain(email: string) {
    const isRestricted = this.tenant.tenantSettings.settings.restrictRegistrationToDomain;

    if (!isRestricted) return;

    const domains = this.tenant.tenantSettings.settings.restrictedRegistrationDomain;

    let arrDomain = domains.split(',').map(d => d.trim());

    const domain = arrDomain.find(domain => email.indexOf(domain) > 0);

    if (domain === undefined || !!!domain) {
      this.message = 'Error: Email must be a part of the ' + domains + ' domain(s)';
      return;
    }
  }

  AddUser(addUserForm: NgForm) {
    if (this.isDismissed) { return; }
    this.message = '';
    this.submitted = true;
    if (!addUserForm.form.valid) {
      this.message = 'Error: Please enter all the required fields';
      return;
    }
    this.validateDomain(addUserForm.form.value.email);

    this.spinner.show();
    this.newUser.user_metadata.controls = this.controlService.flattenMetadataControls(this.metadataControls);
    this.userService.inviteUser(this.tenantId, this.newUser).subscribe(response => {
      this.authService.refreshToken().subscribe((res: any) => {
        localStorage.setItem('token', res.token);
        this.authService.fillAuthData();
        this.authService.setAuthdata();
        this.spinner.hide();
        addUserForm.resetForm();
        this.dialogRef.close(response);

        let toastMsg = 'An invitation email has been sent to the user';
        if(!environment.production) {
          toastMsg += ' (emails are restricted in testing environment)';
        }
        this.toastrService.showSuccessMessage(
          toastMsg,
          'User is now Pending'
        );
      });
    }, error => {
      this.message = error.error.message;
      this.spinner.hide();
    });
  }


  keyDownFunction(event, addUserForm) {
    if (event.keyCode === 13) {
      this.AddUser(addUserForm);
    }
  }
  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.dialogRef.close(false);
  }

  signature(control, index): void {
    const dialogRef = this.dialog.open(SignatureDialog, {
      data: { control },
      width: '550px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        control.value = result;
      }
    });
  }

}


/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class AddUserDialogModel {

  constructor(public userTemplate: any, public tenantId: any, public roles: any) {
  }
}


@Component({
  selector: 'signature-dialog',
  templateUrl: 'signature-dialog.html',
  styleUrls: ['./add-user-modal.component.scss']
})
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
