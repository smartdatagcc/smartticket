import { Component, OnInit, Inject, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';

@Component({
  selector: 'app-reset-user-password-modal',
  templateUrl: './reset-user-password-modal.component.html',
  styleUrls: ['./reset-user-password-modal.component.scss']
})
export class ResetUserPasswordModalComponent implements OnInit {

  user: any;
  tenantId: any;
  isDismissed: boolean;
  submitted: boolean;
  message = '';
  password: any;
  confirmpassword: any;
  resetUrl: string;
  copyStatus: string;
  copyMessage: string;

  constructor(public dialogRef: MatDialogRef<ResetUserPasswordModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResetUserPasswordDialogModel,
    private spinner: NgxSpinnerService, private controlService: ControlsServiceService,
    private accountService: AccountServiceService, private authService: AuthService, public dialog: MatDialog) {
    this.user = data.user;
    this.tenantId = data.tenantId;
  }

  ngOnInit(): void {
    this.resetUrl = `${this.authService.getIss()}/reset-password/${this.user.resetPasswordToken}`;
  }

  // Save the details and return Response from the API
  ResetPassword(resetPasswordForm: NgForm) {
    if (this.isDismissed) { return; }
    this.message = "";
    this.submitted = true;

    if(!resetPasswordForm.form.valid || (this.password != this.confirmpassword)){
      this.message = "Please verify that all values are set."
      return;
    }

    this.spinner.show();
    this.accountService.resetUserPassword({'token': this.user.resetPasswordToken, 'password': this.password}).subscribe(response => {
      if (response) {
        this.spinner.hide();
        this.dialogRef.close(response);
      } else {
        this.spinner.hide();
        this.message = 'An error occurred.';
      }
    }, error => {
      this.message = error.error.message;
      this.spinner.hide();
    });

  }

  copyUrl() {

    this.copyMessage = '';
    this.copyStatus = '';
    if(navigator.clipboard){
      navigator.clipboard.writeText(this.resetUrl).then(()=>{
        this.copyMessage='Url copied';
        this.copyStatus= "success";
      }, (err) => {
        this.copyMessage= `copy error: ${err}`;
        this.copyStatus= "error";
      });
    }
    else {
      this.copyMessage= "Cannot access clipboard";
      this.copyStatus= "error";
    }
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.spinner.hide();
    this.dialogRef.close(false);
  }

}


export class ResetUserPasswordDialogModel {

  constructor(public user: any, public tenantId: any) {
  }
}

