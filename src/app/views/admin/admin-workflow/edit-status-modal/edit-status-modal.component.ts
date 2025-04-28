import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { StatusServiceService } from 'src/app/services/status-service/status-service.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as _ from 'underscore';
@Component({
  selector: 'app-edit-status-modal',
  templateUrl: './edit-status-modal.component.html',
  styleUrls: ['./edit-status-modal.component.scss']
})
export class EditStatusModalComponent implements OnInit {
  tenantId: any;
  form: any;
  status: any;
  statusTypes = [];
  colorOptions: any;
  submitted: boolean;
  isDismissed: boolean;
  constructor(public dialogRef: MatDialogRef<EditStatusModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditStatusDialogModel,
    private statusService: StatusServiceService, private formService: FormServiceService,
    private spinner: NgxSpinnerService, private notifyService: ToastrnotificationService) {
    this.tenantId = data.tenantId;
    this.form = data.form;
    this.status = data.status;
    this.statusTypes = data.statusTypes;
    this.colorOptions = data.colorOptions;
  }

  ngOnInit(): void {
    localStorage.setItem('editStatus', JSON.stringify(this.status));

  }

  // Check whether the status exists or not
  statusExists(currentstatus) {
    const currentstatusoriginalvalue =   JSON.parse(localStorage.getItem('editStatus'));
    if(currentstatusoriginalvalue.name === currentstatus){
      return false;
    }else{
      return this.statusTypes.includes(currentstatus);
    }
  }

  saveChanges(editStatusForm: NgForm) {
    if (this.isDismissed) { return; }
    if (editStatusForm.form.valid && !this.statusExists(this.status.name)) {
      this.form.statusTypes.statusIds.some(item => {
        if (item.id === this.status.id) {
          item.isWorkFlow = this.status.isWorkFlow;
          return true;
        }
      });
      this.SaveStatusTypes();
      this.formService.save(this.tenantId, this.form).subscribe(response => {
        this.spinner.hide();
        this.dialogRef.close(this.status);
      }, error => {
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });
    }
    else {
      this.notifyService.showErrorMessage('Empty Name & Dupilicate name not allowed', 'Error');
    }
  }

  setColor(color: string) {
    this.status.color = color;
  }

  SaveStatusTypes() {
    this.statusService.save(this.tenantId, [this.status]).subscribe(result => {
      console.log('Status Types Updated successfully');
    });
  }

  onDismiss(): void {
    // Close the dialog, return false
    const originalstatusdata = JSON.parse(localStorage.getItem('editStatus'));
    this.status.name = originalstatusdata.name;
    this.isDismissed = true;
    this.dialogRef.close(false);
  }
}

/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class EditStatusDialogModel {
  constructor(public tenantId: any, public form: any, public status: any,
    public statusTypes: any, public colorOptions: any) {
  }
}
