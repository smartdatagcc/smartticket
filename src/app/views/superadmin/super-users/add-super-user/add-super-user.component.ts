import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';


@Component({
  selector: 'app-add-super-user',
  templateUrl: './add-super-user.component.html',
  styleUrls: ['./add-super-user.component.scss']
})
export class AddSuperUserComponent implements OnInit {

  public addSuperUserForm: FormGroup;

  temail: string;
  isCancelButtonclicked: boolean;

  constructor(private fb: FormBuilder, private mdr: MatDialogRef<AddSuperUserComponent>,
    private suservice: SuServiceService, private toastrService: ToastrnotificationService) { }

  ngOnInit(): void {
    this.addSuperUserForm = this.fb.group({
      email: [this.temail, [Validators.required, Validators.email, this.removeSpaces]]
    });
  }

  removeSpaces(control: AbstractControl) {
    if (control && control.value && !control.value.replace(/\s+/g, '').length) {
      control.setValue('');
    }
    return false;
  }


  submit() {

    if (this.isCancelButtonclicked) {
      return;
    }
    this.mdr.close(this.addSuperUserForm.controls.email.value);
  }

  // Close modal
  onCancel() {
    this.isCancelButtonclicked = true;
    this.mdr.close();
  }

}
