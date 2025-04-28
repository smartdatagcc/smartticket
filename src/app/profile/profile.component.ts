import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy, AfterViewInit, Inject } from '@angular/core';
import { LookupServiceService } from '../services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user-service/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../services/authentication/auth.service';
import { ToastrnotificationService } from '../services/toastrnotification-service/toastrnotification.service';
import { NgForm } from '@angular/forms'
import { ChangePasswordComponent } from 'src/app/profile/change-password/change-password.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AccountServiceService } from '../services/account-service/account-service.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Title } from '@angular/platform-browser';
import SignaturePad from 'signature_pad';
import { Location } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute,
              private userService: UserService, private spinner: NgxSpinnerService, private ref: ChangeDetectorRef,
              public authService: AuthService, private toastrService: ToastrnotificationService,
              private acccountService: AccountServiceService, private titleService: Title,
              public dialog: MatDialog,  private location: Location) { }

  value: any;
  lookupData: any;
  user: any;
  tenantId: string;
  message: string;
  image: any;
  showEmail: any;
  canViewNotes: any;
  defaultNotifications: any;
  result: any = '';
  newPasswordValue = '';
  chunkedData = [];
  profileForm;
  workspaces: number;
  @ViewChild('profileForm') profileFormv: any;
  CanDeactivate(): any {
    if ( this.profileFormv === undefined){
      return true;
    }
    if (this.profileFormv.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Profile');
    this.authService.setshowhidesidebar(true);
    this.spinner.show();
    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });
    this.lookupService.checkToken();
    this.image = this.authService.getProfileImage();
    this.workspaces =  this.authService.authentication.data.tenants.length;
    if (this.tenantId !== '' && this.tenantId !== undefined) {
      this.lookupData = this.lookupService.lookupdata;
      this.getUserData(this.tenantId, this.authService.authentication.data.id);
      this.showEmail = this.lookupData.tenant.tenantSettings.settings.emailNotification;
      this.canViewNotes = this.authService.allowed(this.tenantId, 'CanViewNotes');
    }
    this.defaultNotifications = {
      commentEmail: true,
      commentNotify: true,
      updateEmail: true,
      updateNotify: true,
      newEmail: true,
      newNotify: true,
      noteEmail: true,
      noteNotify: true
    };
    this.ref.detectChanges();
  }

  removeSpaces(event) {
    if (event.which === 32 && !this.value.length) {
      event.preventDefault();
    }
  }
  // getting userdata
  getUserData(tenantId: string, id: string) {
    const _THIS = this;
    this.userService.getUser(tenantId, id).subscribe((data: any) => {
      this.spinner.hide();
      this.user = data;
      this.profileForm = data;
      // tslint:disable-next-line:no-string-literal
      const userroleid = data['role_id'];
      // tslint:disable-next-line:only-arrow-functions
      this.user.user_metadata.notifications = this.lookupData.tenant.forms.reduce(function(r, form) {
        let rolePermissions = {};
        form.roles.assignedRoles.map(filterdata => {
          if (filterdata.id === userroleid){
             rolePermissions = filterdata.notifications || {};
          }
        });
        let usermetadata = {};
        if (data.user_metadata.notifications !== undefined) {
          usermetadata = data.user_metadata.notifications[form.id];
        }
        r[form.id] = Object.assign({}, _THIS.defaultNotifications, rolePermissions, usermetadata);
        return r;
      }, {});

      this.chunkedData = data.user_metadata.controls;
    },
      error => {
        this.spinner.hide();
        this.lookupService.setShorheadNameAndSidebar();
        this.location.back();
        this.toastrService.showErrorMessage(error.error.message, 'Error');
      }
    );
  }

  // onsucess call this
  onSuccess() {
    this.authService.refreshToken().subscribe(
      (success: any) => {
        this.spinner.hide();
        const helper = new JwtHelperService();
        const tokenPayload = helper.decodeToken(success.token);
        this.authService.authentication.isAuth = true;
        this.authService.authentication.token = success.token;
        this.authService.authentication.refreshToken = success.refresh_token || null;
        this.authService.authentication.data = tokenPayload;
        const tenantId = tokenPayload.tenants[0].id;
        localStorage.token = success.token;
        this.toastrService.showSuccessMessage('Profile successfully updated', 'Success');
        this.profileFormv.form.markAsPristine();
      },
      (error) => {
        this.onError(error);
      }
    );
  }

  // onerror call this
  onError(err) {
    this.spinner.hide();
    this.message = err.error.message;
    this.toastrService.showErrorMessage(this.message, 'Error');
  }

  // onclick save profile
  saveProfile(profileForm: NgForm) {
    this.spinner.show();
    this.message = '';
    if (!profileForm.form.valid) {
      this.spinner.hide();
      this.toastrService.showErrorMessage('Please enter all the required fields', 'Error');
      return;
    }
    if (this.lookupData) {
      this.acccountService.updateAccountTenant(this.user, this.tenantId).subscribe((responce) => {
        this.onSuccess();
      }, (error: any) => {
        this.onError(error);
      });
    } else {
      this.acccountService.updateAccount(this.user).subscribe((responce) => {
        this.onSuccess();
      }, err => {
        this.onError(err);
      });
    }
  }


  ChangePassword(): void {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      this.result = dialogResult;
      if (this.result) {
        this.newPasswordValue = this.result.passwordGroup.newpassword;
        this.acccountService.updatePassword(this.newPasswordValue).subscribe((response: any) => {
          this.toastrService.showSuccessMessage('Password successfully updated', 'Update Password');
        },
          error => {
            let errorMessage = 'An error has occurred - ';
            errorMessage += error.error.message;
            this.toastrService.showWarningMessage(errorMessage, 'Error');
          }
        );
      }
    });
  }


  signature(control, index): void {
    const dialogRef = this.dialog.open(SignatureDialog, {
      data: { control }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        control.value = result;
      }
    });
  }

}

@Component({
  selector: 'signature-dialog',
  templateUrl: './signature-dialog.html',
  styleUrls: ['./profile.component.scss']
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
