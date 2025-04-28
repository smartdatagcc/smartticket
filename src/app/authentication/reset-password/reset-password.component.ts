import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  resetPasswordForm = new FormGroup({
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  resetPasswordMessage: string;
  resetPasswordFormErrors = {
    password: '',
    confirmPassword: ''
  };
  resetPasswordFormValidataionMessages = {
    password: {
      required: 'Password is Required'
    },
    confirmPassword: {
      required: 'Confirm Password is Required',
      passwordMatch: 'Password and Confirm Password Must Match',
    }
  };


  constructor(public authService: AuthService, private acccountService: AccountServiceService,
              private spinner: NgxSpinnerService, private route: ActivatedRoute, private titleService: Title,
              private toastrService: ToastrnotificationService, private router: Router) { }
  user: any;
  token: any;
  message: string;

  ngOnInit(): void {
    this.titleService.setTitle('Reset Password');
    this.message = '';

    this.route.params.subscribe(params => {
      this.token = params.token;
    });
    this.user = {
      confirmPassword: null,
      password: null,
      token: this.token
    };

  }

  logResetPasswordValidationErrors(group: FormGroup = this.resetPasswordForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      if (abstractControl instanceof FormGroup) {
        this.logResetPasswordValidationErrors(abstractControl);
      }
      else {
        // Clearing out existing messages
        this.resetPasswordFormErrors[key] = '';
        if (abstractControl && !abstractControl.valid) {
          const message = this.resetPasswordFormValidataionMessages[key];
          // looping all the errors related to the control
          for (const errorKey in abstractControl.errors) {
            if (errorKey) {
              this.resetPasswordFormErrors[key] += message[errorKey] + ' ';
            }
          }
        }
      }
    });
  }
  onResetPasswordSubmit() {
    this.logResetPasswordValidationErrors(this.resetPasswordForm);
    if (this.resetPasswordForm.valid) {
      if (this.resetPasswordForm.value.password != this.resetPasswordForm.value.confirmPassword) {
        this.resetPasswordMessage = 'Password and Confirm Password are not matched';
      }
      else {
        this.spinner.show();
        this.user = {
          password: this.resetPasswordForm.value.password,
          token: this.token
        };
        this.acccountService.resetPassword(this.user).subscribe((response: any) => {

          this.spinner.hide();
          this.toastrService.showSuccessMessage('Your password has been reset', 'Password Reset');
          this.router.navigate(['/']);
        },
          error => {

            this.spinner.hide();
            let errorMessage = '';
            if (error.error.statusCode === 403) {
              errorMessage = error.error.message + 'Please reset again';
            } else if (error.error.statusCode === 400) {
              errorMessage = 'Forgot password is expired, please try with a new one';
            } else {
              errorMessage = error.error.message + ' Please contact support';
            }
            this.toastrService.showWarningMessage(errorMessage, 'Error resetting password');
            this.resetPasswordMessage = errorMessage;
          }
        );

      }
    }
  }


  ontestResetPasswordSubmit() {
    if (this.resetPasswordForm.valid) {
      this.spinner.show();
      this.acccountService.resetPassword(this.resetPasswordForm.value).subscribe((response: any) => {

        this.spinner.hide();
        this.toastrService.showSuccessMessage('Your password has been reset', 'Password Reset');
      },
        error => {

          this.spinner.hide();
          let errorMessage = 'Error resetting password';
          errorMessage += error;
          this.toastrService.showWarningMessage(errorMessage, 'Error');
          this.message = errorMessage;
        }
      );
    }
    else {
      this.spinner.hide();
      this.message = 'Your Password or Confirm Password is invalid please try again.';

    }
  }
}
