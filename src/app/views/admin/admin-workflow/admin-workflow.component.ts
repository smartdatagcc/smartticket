import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from '../../../services/lookup-service/lookup-service.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { StatusServiceService } from 'src/app/services/status-service/status-service.service';
import { ColorServiceService } from 'src/app/services/color-service/color-service.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { EditStatusDialogModel, EditStatusModalComponent } from 'src/app/views/admin/admin-workflow/edit-status-modal/edit-status-modal.component';
import { DeleteStatusDialogModel, DeleteStatusModalComponent } from 'src/app/views/admin/admin-workflow/delete-status-modal/delete-status-modal.component';

import * as _ from 'underscore';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-workflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.scss']
})
export class AdminWorkflowComponent implements OnInit {
  tenantId: number;
  formId: number;
  lookupdata: any;
  forms: any;
  form: any;
  statusTypes: any;
  colorOptions: any;
  OtherFormStatuslist: string[] = [];
  filterOtherFormStatuslist: string[] = [];
  currentFormStatuslist = [];
  autocomplete = [];
  allStatus = [];
  newStatus: string;
  newAction: string;
  customAction: boolean;
  constructor(private ref: ChangeDetectorRef, private route: ActivatedRoute, private titleService: Title,
    private lookupService: LookupServiceService, private spinner: NgxSpinnerService,
    private notifyService: ToastrnotificationService, private statusService: StatusServiceService,
    private colorService: ColorServiceService, private formService: FormServiceService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.titleService.setTitle('Workflow Organization');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    // getting formId from url
    this.route.params.subscribe(params => {
      this.formId = params.formId;
      this.rerenderFormData(this.formId);
    });

    this.rerenderFormData('');
  }

  rerenderFormData(formid) {
    this.spinner.show();

    if (formid != false) {
      this.formId = formid;
    }

    this.getFormDetails();
    this.getColorOptions();

  }

  // Getting the Form details from the Lookup Service
  getFormDetails() {
    this.lookupService.getLookupData(this.tenantId).subscribe(data => {
      this.lookupService.storeData(data);
      this.forms = this.lookupService.lookupdata.tenant.forms;
      this.form = this.forms.filter(formsdata => formsdata.id == this.formId)[0];
      this.getStatusTypes();
      this.spinner.hide();
    },
      error => {
        this.spinner.hide();
        console.log(error);
      }
    );
  }

  // Getting the status Types
  getStatusTypes() {
    this.spinner.show();
    this.statusService.getTypes(this.tenantId).subscribe(data => {
      this.statusTypes = data;
      this.refresh(this.statusTypes);
      this.spinner.hide();
    },
      error => {
        console.log(error.error.message);
        this.spinner.hide();
      }
    );
  }

  // Getting the Color options
  getColorOptions() {
    this.colorOptions = this.colorService.getColorOptions();
  }

  // Re-arranging the order of status
  drop(event: CdkDragDrop<string[]>) {
    this.spinner.show();
    moveItemInArray(this.statusTypes, event.previousIndex, event.currentIndex);

    this.form.statusTypes = {
      statusIds: this.statusTypes.map(
        statusType => {
          return { id: statusType.id, isWorkFlow: statusType.isWorkFlow };
        }
      )
    };

    this.formService.save(this.tenantId, this.form).subscribe(response => {
      this.notifyService.showSuccessMessage('Workflow Updated', 'Saved');
      this.spinner.hide();
    }, error => {
      this.notifyService.showErrorMessage(error.error.message, 'Error');
      this.spinner.hide();
    });
  }

  // Refresh the details
  refresh(newStatusList) {
    this.spinner.show();
    this.OtherFormStatuslist = [];
    this.currentFormStatuslist = [];
    this.statusTypes = _.map(this.form.statusTypes.statusIds, (v: any) => {
      const template = _.find(newStatusList, { id: v.id });
      if (template) {
        return _.extend(template, v);
      }
    });

    this.statusTypes = this.removeItemAll(this.statusTypes, undefined);

    this.autocomplete = newStatusList.filter(data => {
      return this.form.statusTypes.statusIds.some(formStatus => {
        return formStatus.id === data.id;
      });
    });

    this.allStatus = newStatusList.map(item => {
      item.forms = this.forms.filter(f => {
        return f.statusTypes.statusIds.some(status => {
          return status.id === item.id;
        });
      });
      return item;
    });

    // Loop all statuses and their forms and getting OtherFormStatus list and current form satus list
    for (const status of this.allStatus) {
      if (status.forms.length > 0) {
        for (const statusForm of status.forms) {
          this.OtherFormStatuslist.push(status.name);
          // filtering duplicated Statuses
          this.OtherFormStatuslist = this.OtherFormStatuslist.filter((elem, index, self) => {
            return index === self.indexOf(elem);
          });
          if (this.form['id'] === statusForm['id']) {
            this.currentFormStatuslist.push(status.name.toLowerCase());
            // filtering duplicated Statuses
            this.currentFormStatuslist = this.currentFormStatuslist.filter((elem, index, self) => {
              return index === self.indexOf(elem);
            });
          }
        }
      }
    }

    this.spinner.hide();

  }

  // Remove an item from an array
  removeItemAll(arr, value) {
    let i = 0;
    while (i < arr.length) {
      if (arr[i] === value) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }

  // Check whether the status exists or not
  statusExists(name) {
    if (this.currentFormStatuslist.indexOf(name.toLowerCase()) !== -1) {
      return true;
    }
    return false;
  }

  // Add the New status
  addStatus(addForm: NgForm) {
    if (addForm.form.valid && !this.statusExists(this.newStatus)) {
      this.spinner.show();
      let newStatusName = this.newStatus;

      for (const otherStatus of this.OtherFormStatuslist) {
        if (newStatusName.toLowerCase() === otherStatus.toLowerCase()) {
          newStatusName = otherStatus;
        }
      }

      this.statusService.create({
        name: newStatusName,
        workflowActionName: this.newAction,
        color: '#666',
        tenantId: this.tenantId
      }).subscribe(newStatus => {
        this.form.statusTypes.statusIds.push({ id: newStatus.id, isWorkFlow: true });
        this.statusService.getTypes(this.tenantId).subscribe(result => {
          this.newStatus = '';
          this.newAction = '';
          this.customAction = false;
          this.SaveStatusTypes();
          this.formService.save(this.tenantId, this.form).subscribe(response => {
            this.notifyService.showSuccessMessage('Workflow Updated', 'Saved');
            this.refresh(result);
            this.spinner.hide();
          }, error => {
            this.notifyService.showErrorMessage(error.error.message, 'Error');
            this.spinner.hide();
          });
        }, error => {
          this.notifyService.showErrorMessage(error.error.message, 'Error');
          this.spinner.hide();
        });
      }, error => {
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });

    }
  }

  // Save the new status type
  SaveStatusTypes() {
    this.statusService.save(this.tenantId, this.statusTypes).subscribe(result => {
      console.log('Status Types Updated successfully');
    });
  }

  // filtering the Auto complete status based on the Text input
  doFilter() {
    this.filterOtherFormStatuslist = this._filter(this.newStatus);
    this.newAction = this.to_title_case(this.newStatus);
  }

  private _filter(value: string): string[] {
    const filterValue = this._normalizeValue(value);
    return this.OtherFormStatuslist.filter(status => this._normalizeValue(status).includes(filterValue));
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  // Changing the text to first character as upper case and rest of the characters are in lower case
  to_title_case(Value) {
    return Value.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  // Edit status by using Material Dialog
  editStatus(status): void {
    const dialogData = new EditStatusDialogModel(this.tenantId, this.form, status, this.OtherFormStatuslist, this.colorOptions);

    const dialogRef = this.dialog.open(EditStatusModalComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const result = dialogResult;
      if (result) {
        this.notifyService.showSuccessMessage('Status successfully updated', 'Success');
        const index = _.findIndex(this.statusTypes, { id: result.id });
        const formIndex = _.findIndex(this.form.statusTypes.statusIds, { id: result.id });
        this.statusTypes.splice(index, 1, result);
        this.form.statusTypes.statusIds[formIndex].isWorkFlow = result.isWorkFlow;
        this.refresh(this.statusTypes);
      }
    });

  }

  // Remove the status by using material dialog
  removeStatus(statusToRemove) {
    const dialogData = new DeleteStatusDialogModel(this.tenantId, this.statusTypes, statusToRemove);

    const dialogRef = this.dialog.open(DeleteStatusModalComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const newStatusId = dialogResult;
      if (newStatusId) {
        this.spinner.show();
        if (this.forms.some(forms => {
          return forms.id !== this.form.id && forms.statusTypes.statusIds.some(formstatus => {
            return formstatus.id === statusToRemove.id;
          });
        })) {
          // if status is in multiple forms, migrate tickets and remove from this form
          this.statusService.moveTickets(this.tenantId, this.form.id, statusToRemove.id, newStatusId).subscribe(response => {
            this.removeStatusId(statusToRemove.id);
          });
        }
        else {
          // if status is in one form, delete status and remove from this form
          this.statusService.delete(this.tenantId, this.form.id, statusToRemove.id, newStatusId).subscribe(data => {
            this.removeStatusId(statusToRemove.id);
          });
        }
        this.spinner.hide();
      }


    });

  }

  // Remove the status by id
  removeStatusId(statusId) {

    const index = this.statusTypes.findIndex(x => x.id === statusId);
    if (index > -1) {
      this.statusTypes.splice(index, 1);
    }

    const formStatusIndex = this.form.statusTypes.statusIds.findIndex(y => y.id === statusId);
    if (formStatusIndex > -1) {
      this.form.statusTypes.statusIds.splice(formStatusIndex, 1);
    }

    this.formService.save(this.tenantId, this.form).subscribe(response => {
      this.getStatusTypes();
      this.notifyService.showSuccessMessage('Status Removed', 'Success');
    }, error => {
      if (error) {
        const errorMessage = error.error.message;
        this.notifyService.showErrorMessage(errorMessage, 'Error removing status');
      }
    });

  }

}
