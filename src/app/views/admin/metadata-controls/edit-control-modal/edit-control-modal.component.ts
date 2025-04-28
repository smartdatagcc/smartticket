import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-control-modal',
  templateUrl: './edit-control-modal.component.html',
  styleUrls: ['./edit-control-modal.component.scss']
})
export class EditControlModalComponent implements OnInit {
  tinyMceConfig: any;
  editControl: any;
  controlTypes: string[];
  isDismissed: boolean;
  newMessage: string;

  constructor(public dialogRef: MatDialogRef<EditControlModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditControlDialogModel, private controlService: ControlsServiceService) {
    this.editControl = (JSON.parse(JSON.stringify(data.control)));
  }

  ngOnInit(): void {
    this.controlTypes = this.controlService.getControlTypes();
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
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat'
    };
  }
  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.dialogRef.close(false);
  }

  updateControl(EditControlForm: NgForm) {
    if (this.isDismissed) { return; }
    this.newMessage = '';
    this.editControl.value = this.editControl.content;
    this.dialogRef.close(this.editControl);
  }

}

/**
 * Class to represent Edit Control dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class EditControlDialogModel {

  constructor(public control: any) {
  }
}
