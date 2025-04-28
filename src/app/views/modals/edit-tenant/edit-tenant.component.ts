import { Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { AuthService } from 'src/app/services/authentication/auth.service';


@Component({
  selector: 'app-edit-tenant',
  templateUrl: './edit-tenant.component.html',
  styleUrls: ['./edit-tenant.component.scss']
})
export class EditTenantComponent implements OnInit {
  public editTenantForm: FormGroup;

  tsettings: any;
  tname: string = this.data.data.name;
  tiertype: any = this.data.data.tier;
  tapiConnectivity: boolean = this.data.data.apiConnectivity;
  // tslint:disable-next-line:no-string-literal
  temailNotification: boolean = this.data.data.tenantSettings['settings']['emailNotification'];
  tdeleted: boolean = this.data.data.deleted;
  tierOptions: any = [
    { key: 0, value: 'Basic Tier' },
    { key: 1, value: 'Silver Tier' },
    { key: 2, value: 'Gold Tier' },
    { key: 3, value: 'Platinum Tier' },
  ];


  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
              private mdr: MatDialogRef<EditTenantComponent>,
              private fb: FormBuilder, public authService: AuthService,
              private suservice: SuServiceService,
              private toastrService: ToastrnotificationService) { }

  ngOnInit(): void {
    this.editTenantForm = this.fb.group({
      tenantname: [this.tname, [Validators.required,this.removeSpaces]],
      tier: [this.tiertype],
      apiConnectivity: [this.tapiConnectivity],
      emailNotification: [this.temailNotification],
      tenantDeleted: [this.tdeleted]
    });
  }

  removeSpaces(control: AbstractControl) {
    if (control && control.value && !control.value.replace(/\s+/g, '').length) {
      control.setValue('');
    }
    return false;
  }
  omit_special_char(event) {
    var k;
    k = event.charCode;
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }
  tierChanged(item) {
  }

  // Build edit tenant object
  buildEditTenant() {
    // update 'emailNotification' with user input
    // tslint:disable-next-line:no-string-literal
    this.data.data.tenantSettings['settings']['emailNotification'] = this.editTenantForm.controls['emailNotification'].value;

    const tenant = {
      id: this.data.data.id,
      name: this.editTenantForm.controls['tenantname'].value,
      tier: this.editTenantForm.controls['tier'].value,
      apiConnectivity: this.editTenantForm.controls['apiConnectivity'].value,
      tenantSettings: this.data.data.tenantSettings,
      deleted: this.editTenantForm.controls['tenantDeleted'].value,
      ticketTemplate: this.data.data.ticketTemplate,
    };
    return tenant;
  }

  submit() {
    const editTenant = this.buildEditTenant();

    // Update tenant info in DB
    this.suservice.updateTenant(editTenant).subscribe((response) => {
      this.authService.refreshToken().subscribe((res: any) => {
        localStorage.setItem('token', res.token);
        this.authService.fillAuthData();
        this.authService.setAuthdata();
        this.mdr.close(true);
      });
      this.toastrService.showSuccessMessage('Tenant successfully updated', 'Success');
    },
      (error) => {
        let errorMessage = 'An error has occurred - ';
        errorMessage += error;
        this.toastrService.showWarningMessage(errorMessage, 'Error');
        this.mdr.close(false);
      });
  }

  // Close modal
  onCancel() {
    this.mdr.close();
  }
}

