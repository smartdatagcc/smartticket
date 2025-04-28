import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef } from "@angular/material/dialog";
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';

@Component({
  selector: 'app-add-tenant',
  templateUrl: './add-tenant.component.html',
  styleUrls: ['./add-tenant.component.scss']
})
export class AddTenantComponent implements OnInit {

  public addTenantForm: FormGroup;

  tierOptions: any = [
    { key: 0, value: "Basic Tier" },
    { key: 1, value: "Silver Tier" },
    { key: 2, value: "Gold Tier" },
    { key: 3, value: "Platinum Tier" },
  ];

  tsettings: any;
  tname: string;
  tiertype: any = 0;
  tapiConnectivity: boolean = false;
  temailNotification: boolean = true;


  constructor(private fb: FormBuilder, private mdr: MatDialogRef<AddTenantComponent>,
    private suservice: SuServiceService, private toastrService: ToastrnotificationService,) { }

  ngOnInit(): void {
    this.addTenantForm = this.fb.group({
      tenantname: [this.tname, [Validators.required, this.removeSpaces]],
      tier: [this.tiertype],
      apiConnectivity: [this.tapiConnectivity],
      emailNotification: [this.temailNotification],
    });
    this.getSettings();
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
  // get all the default settings
  getSettings() {
    this.suservice.getAllSettings().subscribe((response) => {
      this.tsettings = response;
    },
      (error) => {
        let errorMessage = 'An error has occurred - ';
        errorMessage += error;
        this.toastrService.showWarningMessage(errorMessage, 'Error');
      });
  }

  tierChanged(item) {
  }

  // Build new tenant object
  buildNewTenant() {
    // get the new Tenant default template
    let newTenantTemplate = this.tsettings.filter(function (setting) {
      return setting.key === 'newTenantTemplate';
    })

    // get the new Tenant default user template
    let userTemplate = this.tsettings.filter(function (setting) {
      return setting.key === 'userTemplate';
    })

    // get the new Tenant default settings
    let ticketTemplate = this.tsettings.filter(function (setting) {
      return setting.key === 'ticketTemplate';
    })

    // update 'emailNotification' with user input
    newTenantTemplate[0].value['settings']['emailNotification'] = this.addTenantForm.controls['emailNotification'].value;

    let tenant = {
      name: this.addTenantForm.controls['tenantname'].value,
      tier: this.addTenantForm.controls['tier'].value,
      apiConnectivity: this.addTenantForm.controls['apiConnectivity'].value,
      tenantSettings: newTenantTemplate[0].value,
      ticketTemplate: ticketTemplate[0].value,
      userTemplate: userTemplate[0].value,
    }
    return tenant;
  }

  submit() {
    let newTenant = this.buildNewTenant();

    // Add new tenant to DB
    this.suservice.addNewTenant(newTenant).subscribe((response) => {
      this.toastrService.showSuccessMessage('Tenant successfully created', 'Success');
      window.location.reload(true);
    },
      (error) => {
        let errorMessage = 'An error has occurred - ';
        errorMessage += error;
        this.toastrService.showWarningMessage(errorMessage, 'Error');
      });
    this.onCancel();
  }

  // Close modal
  onCancel() {
    this.mdr.close();
  }

}
