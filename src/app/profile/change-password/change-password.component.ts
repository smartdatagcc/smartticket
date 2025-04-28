import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';


@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {

  public changepasswordForm: FormGroup;
  changePasswordFormValidataionMessages = {
    newpassword: {
      required: 'Password is required'
    },
    confirmpassword: {
      required: 'Confirm Password is required'
    },
    passwordGroup: {
      passwordMismatch: 'Password and Confirm Password does not match'
    }
  };

  changePasswordFormErrors = {
    newpassword: '',
    confirmpassword: '',
    passwordGroup: '',
  };


  constructor(public dialogRef: MatDialogRef<ChangePasswordComponent>, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.changepasswordForm = this.fb.group({
      passwordGroup: this.fb.group({
        newpassword: [null, Validators.required],
        confirmpassword: [null, Validators.required]
      }, { validator: matchPassword })
    });
  }
  public hasError = (controlName: string, errorName: string) => {
    return this.changepasswordForm.controls[controlName].hasError(errorName);
  }


  logChangePasswordValidationErrors(group: FormGroup = this.changepasswordForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);

      // Clearing out existing messages
      this.changePasswordFormErrors[key] = '';
      if (abstractControl && !abstractControl.valid) {
        const message = this.changePasswordFormValidataionMessages[key];
        // looping all the errors related to the control
        for (const errorKey in abstractControl.errors) {
          if (errorKey) {
            this.changePasswordFormErrors[key] += message[errorKey] + ' ';
          }
        }
      }
      if (abstractControl instanceof FormGroup) {
        this.logChangePasswordValidationErrors(abstractControl);
      }
    });
  }

  onConfirm(): void {
    // Close the dialog, return form value
    this.logChangePasswordValidationErrors();

    const { value, valid } = this.changepasswordForm;
    if (valid) {
      this.dialogRef.close(value);
    }
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }

}

function matchPassword(group: AbstractControl): { [key: string]: any } | null {
  const passwordControl = group.get('newpassword');
  const confirmPasswordControl = group.get('confirmpassword');

  if (passwordControl.value === confirmPasswordControl.value || confirmPasswordControl.pristine) {
    return null;
  }
  else {
    return { passwordMismatch: true };
  }
}
