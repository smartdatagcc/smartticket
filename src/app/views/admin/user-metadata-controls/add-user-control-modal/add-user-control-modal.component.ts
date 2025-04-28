import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';


@Component({
  selector: 'app-add-user-control-modal',
  templateUrl: './add-user-control-modal.component.html',
  styleUrls: ['./add-user-control-modal.component.scss']
})
export class AddUserControlModalComponent implements OnInit {

  tenant: any;
  newControl = {
    name: null,
    type: 'text',
    label: null,
    value: null,
    required: true,
    adminOnly: false,
    options: []
  };
  onLabel: string;
  offLabel: string;
  newMessage: string;
  newOption = '';
  toggleMessage = '';
  controlTypes: string[];
  isDismissed: boolean;

  constructor(public dialogRef: MatDialogRef<AddUserControlModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUserControlDialogModel, private controlService: ControlsServiceService,
    private tenantService: TenantServiceService, private spinner: NgxSpinnerService,
    private notifyService: ToastrnotificationService) {
    this.tenant = data.tenantData;
  }

  ngOnInit(): void {
    this.onLabel = 'Yes';
    this.offLabel = 'No';
    this.controlTypes = this.controlService.getUserControlTypes();
  }

  // Check whether the control type is an Optional control or not
  hasOptionsControl(controlType) {
    return this.controlService.hasOptionsControl(controlType);
  }

  setNewControlName() {
    this.controlService.setNewControlName(this.newControl);
  }

  // Add a new option to the control
  addNewOption(control, option) {
    this.newMessage = '';
    try {
      this.controlService.addNewOption(control, option);
    } catch (err) {
      this.newMessage += err.message;
    }
    this.newOption = null;
  }

  // Remove an option to the control
  removeNewOption(control, option) {
    this.controlService.removeNewOption(control, option);
  }

  // Add the new control to the User Template
  addUserControl(addUserControlForm: NgForm) {

    if (this.isDismissed) { return; }

    this.spinner.show();
    this.newMessage = '';

    this.tenant.userTemplate = this.tenant.userTemplate || {};

    if (!this.tenant.userTemplate.controls || !Array.isArray(this.tenant.userTemplate.controls)) {
      this.tenant.userTemplate.controls = [];
    }

    let formIsValid = addUserControlForm.form.valid;
    // Validating whether both options are available or not for a toggle type control
    if (this.newControl.type === 'toggle') {
      this.newControl.options = [];
      this.newMessage = '';
      if (this.offLabel.length > 0 && this.onLabel.length > 0) {
        this.controlService.addNewOption(this.newControl, this.onLabel);
        this.controlService.addNewOption(this.newControl, this.offLabel);
      } else {
        this.newMessage += ' toggle must have on and off labels';
        formIsValid = false;
      }
    }

    // if any new option is available and then add it to the new control options
    if (this.hasOptionsControl(this.newControl.type) && this.newOption && this.newOption.length > 0) {
      this.controlService.addNewOption(this.newControl, this.newOption);
      this.newOption = null;
    }
    // Validating an option control is having options or not
    if (this.hasOptionsControl(this.newControl.type) && this.newControl.options.length === 0) {
      this.newMessage += ' There must be at least one option for this control';
      formIsValid = false;
    }

    // Validating the control name is already exist in the control list or not
    if (this.tenant.userTemplate.controls.findIndex(item => item.name === this.newControl.name) > -1) {
      this.newMessage += ' The name provided for this control already exists, enter a unique name';
      formIsValid = false;
    }

    if (formIsValid) {
      this.newMessage = '';
      this.tenant.userTemplate.controls.push(this.newControl);
      this.tenantService.updateTenant(this.tenant).subscribe(result => {
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Control successfully added', 'Success');
        this.dialogRef.close(this.newControl);
      }, error => {
        this.newMessage = error.error.message;
        this.spinner.hide();
      });
    }
    else {
      this.spinner.hide();
    }

  }

  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.dialogRef.close(false);
  }

}

/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class AddUserControlDialogModel {

  constructor(public tenantData: any) {
  }
}
