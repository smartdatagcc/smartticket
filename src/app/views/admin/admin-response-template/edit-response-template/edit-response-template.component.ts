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
  selector: 'app-edit-response-template',
  templateUrl: './edit-response-template.component.html',
  styleUrls: ['./edit-response-template.component.scss']
})
export class EditResponseTemplateComponent implements OnInit {
  tinyMceConfig: any;
  responseTemplate: any;
  template: any;
  itemTemplate: any;
  tenantId: any;
  formId: any;
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

  @ViewChild('editResponseTemplateControlForm') editResponseTemplateControlForm: any;
  editResponseTemplateControlsubmitted = false;
  constructor(public dialogRef: MatDialogRef<EditResponseTemplateComponent>,
              @Inject(MAT_DIALOG_DATA) public data: EditResponseTemplateControlDialogModel,
              private controlService: ControlsServiceService,
              private componentData: ComponentDataService,
              private responseTemplateService: ResponseTemplateServiceService,
              private spinner: NgxSpinnerService,
              private notifyService: ToastrnotificationService) {
    this.data = data.data;
    this.tenantId = data.tenantId;
    this.formId = data.formId;
    this.template = data.template;
  }

  ngOnInit(): void {
    this.componentData.newticket = this.serverdata;
    this.controls = this.componentData.newticket['metadata'];
    this.itemTemplate = this.data.template.responseTemplates.filter(data => data.name == this.template.name)[0];
    localStorage.setItem('responsetemplateedit', JSON.stringify(this.itemTemplate));
    this.configureTinyMce();
  }
  configureTinyMce() {
    // tslint:disable-next-line:variable-name
    const _this = this;
    this.tinyMceConfig = {
      menubar: false,
      height: 250,
      paste_data_images: true,
      setup(editor) {
        // tslint:disable-next-line:only-arrow-functions
        editor.on('keyup', function(e) {
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
    const count = content.replace(/(<([^>]+)>)/ig, '');
    if (count == '' || count.length >= 5000) {
      this.editResponseTemplateControlForm.form.controls.editcontent.setErrors({ invalid: true });
    } else {
      this.editResponseTemplateControlForm.form.controls.editcontent.setErrors(null);
    }
  }
  // Add the new control to the User Template
  editResponseTemplateControl(editResponseTemplateControlForm: NgForm) {
    if (this.isDismissed) { return; }
    this.editResponseTemplateControlsubmitted = true;
    this.getcontent(editResponseTemplateControlForm.value.editcontent);
    this.spinner.show();
    this.newMessage = '';
    if (editResponseTemplateControlForm.form.valid) {
      this.responseTemplateService.update(this.tenantId, this.formId, this.data).subscribe((result) => {
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Response Template successfully updated', 'Success');
        this.dialogRef.close(this.responseTemplate);
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
    const originaltemplatedata = JSON.parse(localStorage.getItem('responsetemplateedit'));
    this.itemTemplate.name = originaltemplatedata.name;
    this.itemTemplate.content = originaltemplatedata.content;
    this.isDismissed = true;
    this.dialogRef.close(false);
  }
}

/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class EditResponseTemplateControlDialogModel {

  constructor( public data: any, public template: any, public tenantId: any, public formId: any) {
  }
}
