import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-custom-report',
  templateUrl: './edit-custom-report.component.html',
  styleUrls: ['./edit-custom-report.component.scss']
})
export class EditCustomReportComponent implements OnInit {
  compiledTemplate: any;
  newMessage: string;
  isDismissed: boolean;
  tinyMceConfig: any;
  constructor(public dialogRef: MatDialogRef<EditCustomReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditCustomReportDialogModel,
    private spinner: NgxSpinnerService) {
    this.compiledTemplate = data.compiledTemplate;
  }

  ngOnInit(): void {
    this.configureTinyMce();
  }

  configureTinyMce() {
    const that = this;
    this.tinyMceConfig = {
      menubar: false,
      min_height: 300,
      paste_data_images: true,
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: 'bold italic Underline  strikethrough bullist numlist removeformat alignleft aligncenter alignright  outdent indent redo undo wordcount\
            formatselect blockquote  code-block  ',
    };
  }
  // Add the new control to the User Template
  edit(editForm: NgForm) {
    if (this.isDismissed) { return; }

    this.spinner.show();
    this.newMessage = '';
    if (editForm.form.valid) {
      this.spinner.hide();
      this.dialogRef.close(this.compiledTemplate);
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
export class EditCustomReportDialogModel {

  constructor(public compiledTemplate: any) {
  }
}
