import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';


@Component({
  selector: 'app-add-form-field-control-modal',
  templateUrl: './add-form-field-control-modal.component.html',
  styleUrls: ['./add-form-field-control-modal.component.scss']
})
export class AddFormFieldControlModalComponent implements OnInit {

  form: any;
  tenantId: any;
  newControl = {
    name: null,
    content: '',
    type: 'text',
    label: null,
    value: null,
    required: true,
    adminOnly: false,
    helpText: '',
    showHelpText: true,
    showToolTip: false,
    showMyLabel: false,
    options: []
  };
  onLabel: string;
  offLabel: string;
  newMessage: string;
  newOption = '';
  toggleMessage = '';
  controlTypes: string[];
  isDismissed: boolean;
  tinyMceConfig: any;

  constructor(public dialogRef: MatDialogRef<AddFormFieldControlModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddFormFieldControlDialogModel,
    private controlService: ControlsServiceService,
    private formService: FormServiceService,
    private spinner: NgxSpinnerService,
    private notifyService: ToastrnotificationService) {
    this.form = data.form;
    this.tenantId = data.tenantId;
  }

  ngOnInit(): void {
    this.onLabel = 'Yes';
    this.offLabel = 'No';
    this.controlTypes = this.controlService.getUserControlTypes();
    this.configureTinyMce();
  }
  configureTinyMce() {
    this.tinyMceConfig = {
      menubar: false,
      height: 200,
      paste_data_images: true,
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat'
    };
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
  addFormFieldControl(addFormFieldControlForm: NgForm) {
    if (this.isDismissed) { return; }

    this.spinner.show();
    this.newMessage = '';

    this.form.ticketTemplate = this.form.ticketTemplate || {};

    if (!this.form.ticketTemplate.controls || !Array.isArray(this.form.ticketTemplate.controls)) {
      this.form.ticketTemplate.controls = [];
    }

    let formIsValid = addFormFieldControlForm.form.valid;
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
      this.addNewOption(this.newControl, this.newOption);
      this.newOption = null;
    }
    // Validating an option control is having options or not
    if (this.hasOptionsControl(this.newControl.type) && this.newControl.options.length === 0) {
      this.newMessage += ' There must be at least one option for this control';
      formIsValid = false;
    }

    // Validating the control name is already exist in the control list or not
    if (this.form.ticketTemplate.controls.findIndex(item => item.name === this.newControl.name) > -1) {
      this.newMessage += ' The name provided for this control already exists, enter a unique name';
      formIsValid = false;
    }

    if (formIsValid) {
      this.newMessage = '';
      this.form.ticketTemplate.controls.push(this.newControl);
      this.form.settings.defaultGridColumns.push({ name: this.newControl.name, label: this.newControl.label, selected: true });
      this.formService.save(this.tenantId, this.form).subscribe(result => {
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
export class AddFormFieldControlDialogModel {

  constructor(public form: any, public tenantId: any) {
  }
}
