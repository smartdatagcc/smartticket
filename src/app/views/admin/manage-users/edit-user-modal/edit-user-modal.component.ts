import { Component, OnInit, Inject, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { AuthService } from 'src/app/services/authentication/auth.service';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.scss']
})
export class EditUserModalComponent implements OnInit {

  user: any;
  tenantId: any;
  roles: any;
  isDismissed: boolean;
  submitted: boolean;
  message = '';
  controls: any;
  metadataControls: any;

  constructor(public dialogRef: MatDialogRef<EditUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogModel,
    private spinner: NgxSpinnerService, private controlService: ControlsServiceService,
    private userService: UserService, private authService: AuthService, public dialog: MatDialog) {
    this.user = data.user;
    this.tenantId = data.tenantId;
    this.roles = data.roles;
  }

  ngOnInit(): void {

    this.user.user_metadata.controls.forEach((control) => {
      if (control.required && !control.adminOnly) {
        control.required = false;
      }
    });

    this.controls = this.controlService.initialize(this.user.user_metadata.controls);
    this.metadataControls = this.controlService.getMetadataControlsWithOutChunk(this.controls);
  }

  // Save the details and return Response from the API
  EditUser(addUserForm: NgForm) {
    if (this.isDismissed) { return; }
    this.message = '';
    this.submitted = true;
    if (!addUserForm.form.valid) {
      this.message = 'Error: Please enter all the required fields';
      return;
    }
    this.spinner.show();
    this.user.user_metadata.controls = this.controlService.flattenMetadataControls(this.metadataControls);
    this.userService.updateUser(this.tenantId, this.user).subscribe(response => {
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

  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.spinner.hide();
    this.dialogRef.close(false);
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

/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class EditUserDialogModel {

  constructor(public user: any, public tenantId: any, public roles: any) {
  }
}

@Component({
  selector: 'signature-dialog',
  templateUrl: '../add-user-modal/signature-dialog.html',
  styleUrls: ['./edit-user-modal.component.scss']
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
