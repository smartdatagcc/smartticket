import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { ResponseTemplateServiceService } from 'src/app/services/response-template-service/response-template-service.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';

@Component({
  selector: 'app-add-response-template',
  templateUrl: './add-response-template.component.html',
  styleUrls: ['./add-response-template.component.scss']
})
export class AddResponseTemplateComponent implements OnInit {
  tinyMceConfig: any;
  responseTemplate: any;
  responsetemplatesubmitted = false;
  tenantId: any;
  formId: any;
  newControl = {
    name: null,
    content: null
  };
  newMessage: string;
  isDismissed: boolean;
  controls: ControlTemplateDataModel[];
  serverdata = {
    tenantid: '',
    formid: '',
    metadata: [
      {
        name: 'Content *',
        show: true,
        type: 'textarea',
        label: '',
        isOpen: true,
        value: null,
        helpText: '',
        showHelpText: true,
        required: true,
        adminOnly: false,
        showToolTip: true,
      },
    ],
  };
  //addResponseTemplateControlForm: any;
  @ViewChild('addResponseTemplateControlForm') addResponseTemplateControlForm: any;

  constructor(public dialogRef: MatDialogRef<AddResponseTemplateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddResponseTemplateControlDialogModel,
    private controlService: ControlsServiceService,
    private componentData: ComponentDataService,
    private responseTemplateService: ResponseTemplateServiceService,
    private spinner: NgxSpinnerService,
    private notifyService: ToastrnotificationService) {
    this.responseTemplate = data.responseTemplate;
    this.tenantId = data.tenantId;
    this.formId = data.formId;
  }

  ngOnInit(): void {
    this.componentData.newticket = this.serverdata;
    this.controls = this.componentData.newticket['metadata'];
    this.configureTinyMce();
  }

  configureTinyMce() {

    const _this = this;
    this.tinyMceConfig = {
      menubar: false,
      min_height: 300,
      paste_data_images: true,
      setup(editor) {
        editor.on('keyup', function (e) {
          const finalcontent = e.target.innerHTML;
          _this.getcontent(finalcontent);
        });
      },
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat'
    };
  }

  getcontent(content) {
    const count = content != null ? content.replace(/(<([^>]+)>)/ig, '') : '';
    if (count == '' || count.length >= 5000) {
      this.addResponseTemplateControlForm.form.controls.content.setErrors({ invalid: true });
    } else {
      this.addResponseTemplateControlForm.form.controls.content.setErrors(null);
    }
  }

  // Add the new control to the User Template
  addResponseTemplateControl(addResponseTemplateControlForm: NgForm) {
    if (this.isDismissed) { return; }
    this.getcontent(addResponseTemplateControlForm.value.content);
    this.spinner.show();
    this.newMessage = '';
   
    this.responsetemplatesubmitted = true;
    let formIsValid = addResponseTemplateControlForm.form.valid;

    // Validating the control name is already exist in the control list or not
    if (this.responseTemplate.findIndex(item => item.name === this.newControl.name) > -1) {
      this.newMessage += ' The name provided for this control already exists, enter a unique name';
      formIsValid = false;
    }

    if (formIsValid) {
      this.responseTemplate = this.responseTemplate || {};
      if (!this.responseTemplate || !Array.isArray(this.responseTemplate)) {
        this.responseTemplate = [];
      }
      this.newMessage = '';
      this.responseTemplate.push(this.newControl);
      this.responseTemplateService.add(this.tenantId, this.formId, this.newControl).subscribe((result) => {
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Response Template successfully added', 'Success');
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
export class AddResponseTemplateControlDialogModel {

  constructor(public responseTemplate: any, public tenantId: any, public formId: any) {
  }
}
