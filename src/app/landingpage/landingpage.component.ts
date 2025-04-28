import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../services/authentication/auth.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AccountServiceService } from '../services/account-service/account-service.service';
import { ToastrnotificationService } from '../services/toastrnotification-service/toastrnotification.service';
import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';
import {
  trigger,
  style,
  animate,
  transition,
  // ...
} from '@angular/animations';
import { Title } from '@angular/platform-browser';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition('void => *', [
        style({
          transform: 'translateY(100%)',
        }),
        animate('1000ms ease-out',
          style({
            transform: 'translateY(0)',
          })
        ),
      ]),
    ])
  ]
})


export class LandingpageComponent implements OnInit {
  submitted = false;
  landingPageURLs: any = environment.landingPageURLs;
  showorhideloginmenu = 'none';
  constructor(public authService: AuthService, private router: Router, private spinner: NgxSpinnerService,
    private acccountService: AccountServiceService, private toastrService: ToastrnotificationService,
    private scrollToService: ScrollToService, private titleService: Title) {
  }

  // showForgotPassword = false;
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });
  message: string;

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  forgotPasswordMessage: string;
  showForgotPassword: boolean;
  id = false;

  forgotPasswordFormValidataionMessages = {
    email: {
      required: 'Email is Required',
      email: 'Your email address is invalid'
    }
  };

  forgotPasswordFormErrors = {
    email: ''
  };

  @HostListener('window:scroll', ['$event'])

  onWindowScroll(e) {
    const element = document.querySelector('.navbar');
    if (window.pageYOffset > element.clientHeight) {
      element.classList.add('affix');
    } else {
      element.classList.remove('affix');
    }
  }
  ngOnInit() {
    this.titleService.setTitle('SmartTicket | HIPAA Compliant Business Management Software');
    if (localStorage.token) {
      this.authService.fillAuthData();
      if (this.authService.authentication.data.tenants?.length > 0) {
        const tenantid = this.authService.authentication.data.tenants[0].id;
        this.router.navigate(['/' + tenantid + '/dashboard']);
      }
    }
  }

  // omclick open login menu
  openlogin() {
    this.triggerScrollTo('top');
    this.showForgotPassword = false;
    this.showorhideloginmenu = 'block';
  }

  // onclick outside on login menu then close
  ClickOutside() {
    this.showorhideloginmenu = 'none';
  }

  triggerScrollTo(dest) {
    const config: ScrollToConfigOptions = {
      target: dest,
      duration: 700,
    };

    this.scrollToService.scrollTo(config);
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    const helper = new JwtHelperService();

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
      //this.message = 'Please Enter username and password';
    } else {
      this.spinner.show();
      this.message = '';
      this.authService.authentication = {};
      this.authService.login(this.loginForm.value).subscribe((user: any) => {
        this.spinner.hide();
        const tokenPayload = helper.decodeToken(user.token);
        this.authService.authentication.isAuth = true;
        this.authService.authentication.token = user.token;
        this.authService.authentication.refreshToken = user.refresh_token || null;
        this.authService.authentication.data = tokenPayload;
        let tenantId;
        if (tokenPayload.tenants.length > 0) {
          tenantId = tokenPayload.tenants[0].id;
        } else {
          this.message = 'Your username or password is invalid please try again.';
        }

        localStorage.token = user.token;
        localStorage.tenant = JSON.stringify(tokenPayload.tenants[0]);

        if (tokenPayload && tokenPayload.tenants) {
          if (this.authService.authentication.isAuth && tokenPayload.tenants.length > 1) {
            this.router.navigate(['/workspace']);
          } else if (tokenPayload.tenants.length === 1 && !tokenPayload.tenants[0].deleted) {
            this.router.navigate(['/' + tenantId + '/dashboard']);
          }
        }
      },
        error => {
          this.spinner.hide();
          this.message = 'Your username or password is invalid please try again.';
        }
      );
    }
  }

  setForgotPassword() {
    this.showForgotPassword = true;
  }

  logForgotPasswordValidationErrors(group: FormGroup = this.forgotPasswordForm): void {
    this.forgotPasswordMessage = '';
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      if (abstractControl instanceof FormGroup) {
        this.logForgotPasswordValidationErrors(abstractControl);
      }
      else {
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
      this.acccountService.forgotPassword(this.forgotPasswordForm.value).subscribe((response: any) => {
        this.spinner.hide();
        this.showForgotPassword = false;
        this.forgotPasswordForm.reset();
        this.toastrService.showSuccessMessage('An email will be sent to you with instructions to reset your password',
          'Password Retrieval');
      },
        error => {
          this.spinner.hide();
          let errorMessage = 'Error resetting password - ';
          errorMessage += error.error.message;
          this.toastrService.showWarningMessage(errorMessage, 'Error');
          this.forgotPasswordMessage = errorMessage;
        }
      );

    }
  }

}
