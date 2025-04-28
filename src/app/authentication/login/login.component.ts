import { Component, OnInit } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as _ from 'underscore';
import { parseMarker } from '@fullcalendar/core';
import { MatDialog } from '@angular/material/dialog';
import { RequestTenantInviteDialogComponent } from '../request-tenant-invite-dialog/request-tenant-invite-dialog.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    // password: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  lookupTenant: any;
  tenant: any;
  tenantId: string;
  formId: string;
  ticketId: string;
  token: any;
  submitted = false;
  email: any;
  version: string = require('../../../../package.json').version;
  forgotPasswordMessage: string;
  forgotPasswordText: string;
  forgotEmail: string;
  forgotEmailReadonly: boolean;
  isOldBrowser: any;
  user: any;

  message: string;
  forgotPasswordFormValidataionMessages = {
    email: {
      required: 'Email is Required',
      email: 'Your email address is invalid',
    },
  };

  forgotPasswordFormErrors = {
    email: '',
  };

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  showForgotPassword: boolean;
  id = false;
  tenantLogo: string;
  tenantName: string;
  themeColor: string;

  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private acccountService: AccountServiceService,
    private titleService: Title,
    private toastrService: ToastrnotificationService
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Login');
    this.route.params.subscribe((params) => {
      this.tenantId = params.tenantId;
      this.formId = params.formId;
      this.ticketId = params.ticketId;
      this.token = params.token;
    });
    const element = document.querySelector('.sidebar-collapse');
    if (element != null) {
      element.classList.remove('sidebar-collapse');
    }

    localStorage.removeItem('tenant');
    this.spinner.show();
    if (this.tenantId === undefined) {
      this.spinner.hide();
      this.tenantLogo = '';
      this.tenantName = 'SmartTicket';
      this.themeColor = 'skin-lime';
    } else {
      this.lookupService.getTenantName(this.tenantId).subscribe((data: any) => {
        this.lookupTenant = data;
        this.tenantLogo = data.logoUrl || '';
        this.tenantName = data.tenantName || 'SmartTicket';
        this.themeColor = data.themeColor || 'skin-lime';
        this.lookupTenant.tenantId = this.tenantId;
        this.showForgotPassword = false;
        this.authService.authentication = {};
        this.forgotEmail = null;
        this.forgotEmailReadonly = false;
        const ua = navigator.userAgent;
        const ISIE = ua.indexOf('MSIE') > 0 || ua.indexOf('Trident') > 0;
        const ISIE10 = ua.indexOf('MSIE 10') > 0;
        const ISIE11UP = ua.indexOf('MSIE') === -1 && ua.indexOf('Trident') > 0;
        const ISIE10UP = ISIE10 || ISIE11UP;
        this.isOldBrowser = ISIE && !ISIE10UP;
        this.spinner.hide();
        this.user = {
          email: null,
          password: null,
          confirmPassword: null,
          rememberMe: true,
          useRefreshTokens: false,
        };
      }, error => {
        this.spinner.hide();
      });
    }
  }
  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.spinner.show();
    this.submitted = true;
    const helper = new JwtHelperService();
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe((user: any) => {
        this.spinner.hide();
        const tokenPayload = helper.decodeToken(user.token);
        this.authService.authentication.isAuth = true;
        this.authService.authentication.token = user.token;
        this.authService.authentication.refreshToken = user.refresh_token || null;
        this.authService.authentication.data = tokenPayload;
        localStorage.token = user.token;
        localStorage.setItem('tenant', JSON.stringify(tokenPayload.tenants[0]));
        tokenPayload.tenants.map((tenant) => {
          if (tenant.id == this.tenantId) {
            localStorage.setItem('tenant', JSON.stringify(tenant));
            const tenantId = tenant.id;
          }
        });
        let path = '/';
        if (this.authService.authentication.data && this.authService.authentication.data.tenants) {
          if (this.lookupTenant) {
            const tenant = _.find(this.authService.authentication.data.tenants, { id: parseInt(this.lookupTenant.tenantId, 10) });
            if (tenant && !this.lookupTenant.deleted && this.formId && this.ticketId) {
              path += this.lookupTenant.tenantId + '/ticket/' + this.formId + '/' + this.ticketId;
            } else if (tenant && !this.lookupTenant.deleted) {
              path += this.lookupTenant.tenantId + '/dashboard';
            } else if (!tenant && !this.token &&
              (!this.lookupTenant.inviteOnly || this.authService.authentication.data.email.includes(this.lookupTenant.domain))) {
              path += this.lookupTenant.tenantId + '/registration';
            } else if (!tenant && this.token) {
              path += this.lookupTenant.tenantId + '/registration/' + this.token;
            }
          }
          else if (this.authService.authentication.data.tenants.length === 1 && !this.lookupTenant.deleted) {
            path += this.authService.authentication.data.tenants[0].id + '/dashboard';
          }
        }
        this.spinner.hide();
        this.message = '';
        this.router.navigate([path]);
      },
        (error) => {
          this.spinner.hide();
          this.message =
            'Your username or password is invalid please try again.';
        }
      );
    } else {
      this.spinner.hide();
      // this.message = 'Your username or password is invalid please try again.';
      this.message = 'Email is Required Password is Required';
    }
  }

  setForgotPassword() {
    this.message = '';
    this.showForgotPassword = true;
    this.message = '';
  }

  // Validating forgot password controls
  logForgotPasswordValidationErrors(
    group: FormGroup = this.forgotPasswordForm
  ): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      if (abstractControl instanceof FormGroup) {
        this.logForgotPasswordValidationErrors(abstractControl);
      } else {
        // Clearing out existing messages
        this.forgotPasswordFormErrors[key] = '';
        if (abstractControl && !abstractControl.valid) {
          const message = this.forgotPasswordFormValidataionMessages[key];
          // looping all the errors related to the control
          for (const errorKey in abstractControl.errors) {
            if (errorKey) {
              this.forgotPasswordFormErrors[key] += message[errorKey] + ' ';
            }
          }
        }
      }
    });
  }

  onForgotPasswordSubmit() {
    this.logForgotPasswordValidationErrors(this.forgotPasswordForm);
    if (this.forgotPasswordForm.valid) {
      this.spinner.show();
      this.acccountService
        .forgotPassword(this.forgotPasswordForm.value)
        .subscribe(
          (response: any) => {
            this.spinner.hide();
            this.showForgotPassword = false;
            this.toastrService.showSuccessMessage(
              'An email will be sent to you with instructions to reset your password',
              'Password Retrieval'
            );
          },
          (error) => {
            this.spinner.hide();
            let errorMessage = 'Error resetting password - ';
            errorMessage += error.error.message;
            this.toastrService.showWarningMessage(errorMessage, 'Error');
            this.forgotPasswordMessage = errorMessage;
          }
        );
    }
  }

  // onclick cancle in forgotpassword
  cancelforgotpassword($event) {
    $event.stopPropagation();
    this.showForgotPassword = false;
    this.forgotPasswordMessage = '';
    this.forgotPasswordFormErrors.email = '';
  }

  openRequestInviteDialog() {
    const dialogRef = this.dialog.open(RequestTenantInviteDialogComponent, {
      maxWidth: '600px',
    });

    dialogRef.afterClosed().subscribe(confirmresult => {
      console.log(confirmresult);
    });
  }

  register() {
    this.router.navigate(['/' + this.tenantId + '/register']);
  }
}
