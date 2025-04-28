import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user-service/user.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgForm } from '@angular/forms';
import * as _ from 'underscore';
import { Title } from '@angular/platform-browser';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import SignaturePad from 'signature_pad';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';

interface User {
  email: string;
  password: string;
  confirmPassword: string;
  invitedEmail: boolean;
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})

export class RegistrationComponent implements OnInit {
  tenantId: number;
  token: any;
  tenant: any;
  fields: any[];
  registrationFields: any;
  isAuth: boolean;
  alreadyRegistered: boolean ;
  isOldBrowser: any;
  inviteOnly: boolean;
  controls = [];
  confirmEmailSent: boolean = false;
  lookupTenant: any;
  message = '';
  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitedEmail: false,
  };
  version: string = require('../../../../package.json').version;
  tenantLogo: string;
  tenantName: string;
  themeColor: string;
  screenHeight: number;
  submitted: boolean;

  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute,  public dialog: MatDialog,
    private userService: UserService, private router: Router, private titleService: Title,
    private ControlService: ControlsServiceService, private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Registration');
    this.route.params.subscribe(params => {
      this.tenantId = params.tenantId;
      this.token = params.token;
    });

    if (localStorage.getItem('token') !== null) {
      this.authService.fillAuthData();
    }

    this.isAuth = this.authService.authentication.isAuth;
    const ua = navigator.userAgent;
    const ISIE = ua.indexOf('MSIE') > 0 || ua.indexOf('Trident') > 0;
    const ISIE10 = ua.indexOf('MSIE 10') > 0;
    const ISIE11UP = ua.indexOf('MSIE') === -1 && ua.indexOf('Trident') > 0;
    const ISIE10UP = ISIE10 || ISIE11UP;

    this.isOldBrowser = ISIE && !ISIE10UP;

    this.getRegistrationFields();
    // Get the Tenant Details.
    this.getLookupTenant();

    this.screenHeight = window.innerHeight - 140;

  }

  getLookupTenant() {
    this.lookupService.getTenantName(this.tenantId).subscribe((data: any) => {
      if (data) {
        this.lookupTenant = data;
        this.tenantLogo = data.logoUrl || '';
        this.tenantName = data.tenantName || 'SmartTicket';
        this.themeColor = data.themeColor || 'skin-lime';
        if (data.inviteOnly && (!data.domain && !this.token)) {
          this.inviteOnly = true;
        }
        this.CheckAuthandRedirectToDashboard();
        this.InitializeUser();
        if (this.token) {
          this.userService.getPendingUser(this.token).subscribe((pendinguser: any) => {
            this.tenant = data;
            this.tenant.email = pendinguser.email;
            this.tenant.user_metadata = pendinguser.user_metadata;
            this.InitializeUser();
          },
            error => {
              // redirect to login screen
              this.router.navigate(['/' + this.tenantId + '/login']);
            });
        }
        this.tenant = data;
      }
    });
  }

  getRegistrationFields() {
    this.lookupService.getRegistrationFields(this.tenantId).subscribe(data => {
      this.registrationFields = data;
      this.getFormField();
    });
  }

  getFormField() {
    if (this.tenant && this.tenant.user_metadata && this.tenant.user_metadata.controls && this.token) {
      this.fields = this.ControlService.initialize(this.tenant.user_metadata.controls);
    } else {
      this.fields = this.ControlService.initialize(this.registrationFields);
    }
    this.controls = JSON.parse(JSON.stringify(this.fields));
  }

  CheckAuthandRedirectToDashboard() {
    if (this.isAuth) {
      this.alreadyRegistered = true;
      if (this.authService.authentication.data.tenants.filter(data => data.id == this.tenantId)[0]) {
        // redirect to Overview screen
        this.router.navigate([this.tenantId + '/overview']);
      } else if (this.lookupTenant.inviteOnly && !this.authService.authentication.data.email.includes(this.lookupTenant.domain)) {
        this.router.navigate(['/']);
      }
    }else{
      this.alreadyRegistered = false;
    }
  }

  InitializeUser() {
    this.user = {
      name: '',
      email: this.tenant !== undefined ? this.tenant.email : null,
      password: null,
      confirmPassword: null,
      invitedEmail: this.tenant !== undefined && this.tenant.email ? true : false
    };
  }

  submitRegister(registrationForm: NgForm) {
    this.message = '';
    this.submitted = true;
    if (registrationForm.form.valid) {
      const user: any = Object.assign({}, this.user);
      user.token = this.token;
      user.user_metadata = {
        controls: _.flatten(this.controls)
      };

      if (user.token) {
        delete user.invitedEmail;
        this.authService.invitedUserRegistration(this.tenantId, user).subscribe(response => {
          this.authService.login({ email: user.email, password: user.password }).subscribe(data => {
            this.router.navigate([this.tenantId + '/overview']);
          });
        }, error => {
          if (error && error.error && error.error.message) {
            this.message = 'Registration failed: ' + error.error.message;
          } else {
            this.message = 'Registration failed: ';
          }
        });
      } else if (!this.tenant.inviteOnly || (this.tenant.inviteOnly && user.email.includes(this.tenant.domain))) {
        delete user.invitedEmail;
        this.authService.saveRegistration(this.tenantId, user).subscribe(saveresponse => {
          this.confirmEmailSent = true;
          this.message = 'A confirmation email has been sent to your email address.';
        }, error => {
          if (error && error.error && error.error.message) {
            this.message = 'Registration failed: ' + error.error.message;
          } else {
            this.message = 'Registration failed: ';
          }
        });
      }
      else {
        this.message = 'Please provide a valid email address for this workspace or contact your administrator.';
      }

    }
  }

  submitTenant(registrationForm: NgForm) {
    this.message = '';
    if (this.token) {
      this.authService.addUserToTenant(this.tenantId, this.token).subscribe(response => {
        this.authService.refreshToken();
        this.router.navigate([this.tenantId + '/dashboard']);
      }, error => {
        this.message = 'Registration failed to add you to workspace.';
      });
    } else if (!this.lookupTenant.inviteOnly || (this.lookupTenant.inviteOnly
      && this.authService.authentication.data.email.includes(this.lookupTenant.domain))) {
      this.authService.addUserToTenant(this.tenantId).subscribe(response => {
        this.authService.refreshToken();
        this.router.navigate([this.tenantId + '/overview']);
      }, error => {
        this.message = 'Registration failed to add you to workspace, contact your administrator.';
      });
    } else {
      this.message = 'Please provide a valid email address for this workspace or contact your administrator.';
    }
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
  // tslint:disable-next-line:component-selector
  selector: 'signature-dialog',
  templateUrl: './signature-dialog.html',
  styleUrls: ['./registration.component.scss']
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
