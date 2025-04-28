import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { AddFormFieldControlDialogModel, AddFormFieldControlModalComponent } from 'src/app/views/admin/form-field-metadata-controls/add-form-field-control-modal/add-form-field-control-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as _ from 'underscore';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-form-field-metadata-controls',
  templateUrl: './form-field-metadata-controls.component.html',
  styleUrls: ['./form-field-metadata-controls.component.scss']
})
export class FormFieldMetadataControlsComponent implements OnInit {

  tenantId: number;
  tenantData: any;
  formId: any;
  form: any;
  formname: any;
  defaultColumns: any;
  columns: any;
  editControlsForm: any;
  templateControls: any;
  formdefaultGridColumns: any;
  @ViewChild('editControlsForm') editControlsFormv: any;

  constructor(
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private lookupService: LookupServiceService,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog, private titleService: Title,
    private spinner: NgxSpinnerService,
    private ControlService: ControlsServiceService,
    private formService: FormServiceService,
    private userService: UserService,
    public authService: AuthService
  ) { }

  CanDeactivate(): any {
    if (this.editControlsFormv.form.dirty || this.editControlsFormv.form.dirty) {
          return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit() {
    this.titleService.setTitle('Custom Ticket Fields');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
    });
    this.getlookupdata();
  }


  // get lookup data from server
  getlookupdata() {
    this.lookupService.getLookupData(this.tenantId).subscribe((data: any) => {
      this.lookupService.storeData(data);
      this.tenantData = this.lookupService.lookupdata;
      this.form = this.tenantData.tenant.forms.filter(data => data.id == this.formId)[0];
      this.formname = this.form.name;
      this.formdefaultGridColumns = this.form.settings.defaultGridColumns;
      this.editControlsForm = this.form;
      this.defaultColumns = this.ControlService.getDefaultColumns();
      this.columns = [];
      this.templateControls = this.form.ticketTemplate.controls; // data.tenant.userTemplate.controls;
      this.setDefaultGridColumns();
      this.spinner.hide();
    },
      error => {
        this.spinner.hide();
        console.log(error);
      }
    );
  }

  setDefaultGridColumns(){
    this.columns = [];
    // retain the same order as the grid - which is custom controls first, then default columns:
    if (this.form.ticketTemplate.controls) {
      this.form.ticketTemplate.controls.filter((data) => {
        this.columns.push({id: data.name, label: data.label});
      });

      this.defaultColumns.filter((data) => {
        this.columns.push({id: data.id, label: data.label});
      });
    }

    if (!this.form.settings.defaultGridColumns)
    {
        this.form.settings.defaultGridColumns = [];
    }

    const defaultGridColumns = _.clone(this.formdefaultGridColumns);
    this.form.settings.defaultGridColumns = [];
    // rebuild it (new controls, new arrangements, etc...
    this.columns.filter((column) => {
         const defaultGridColumn =(defaultGridColumns && defaultGridColumns.length > 0) ?
                                      defaultGridColumns.filter(data => data.name == column.id) :[];
         if (defaultGridColumn && defaultGridColumn.length > 0){
            this.form.settings.defaultGridColumns.push({name: column.id, label: column.label, selected: defaultGridColumn[0].selected});
        } else{
            this.form.settings.defaultGridColumns.push({name: column.id, label: column.label, selected: true});
        }
    });
    this.formdefaultGridColumns = this.form.settings.defaultGridColumns;
  }

  // Addin new form
  AddFormField(): void {
    const dialogData = new AddFormFieldControlDialogModel(this.form, this.tenantId);
    const windowsHeight = window.innerHeight - 150;
    const dialogRef = this.dialog.open(AddFormFieldControlModalComponent, {
      data: dialogData,
      width: '600px',
      maxHeight: windowsHeight + 'px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
      this.updateTicketGridLocalStorageOnAdd(dilgResult);
    });
  }

  updateTicketGridLocalStorageOnAdd(newControl){
    // Tie this back into the localStorage for column headers:
    try {
      const userId = this.authService.authentication.data.id;
      const localStorageNameForColumnFilters = 'ticketColumns_' + userId + '_' + this.formId + '_' + this.tenantId;
      if (localStorage.getItem(localStorageNameForColumnFilters)) {
        // Getting the Local Storage Column filters
        let localStorageFilterColumns = [];
        localStorageFilterColumns = JSON.parse(localStorage.getItem(localStorageNameForColumnFilters));
        // Push the newly added column
        localStorageFilterColumns.push({id: newControl.name});
        // Setting back the Column Filters
        localStorage.setItem(localStorageNameForColumnFilters, JSON.stringify(localStorageFilterColumns));
      }
    } catch (err) {
      // continue...
    }
  }

  // onsubmit this method will be called
  saveControls(editControlsForm){
    this.spinner.show();
    let message = '';
    let formIsValid = editControlsForm.valid;
    this.templateControls.map((control) => {
      const existingControl = this.editControlsForm.ticketTemplate.controls.find((item: any) => {
        return item.name === control.name;
      });

      if (existingControl !== control) {
        formIsValid = false;
        message += 'Controls with duplicate names are not valid<br>';
      }

      if (this.ControlService.hasOptionsControl(control.type) && control.options.length === 0) {
        formIsValid = false;
        message += 'there must be at least one option for this control<br>';
      }

      if (control.type === 'toggle') {
        if (control.options[0].length === 0 && control.options[1].length === 0) {
          formIsValid = false;
          message += ' toggle must have on and off label values';
        }
      }

      if (control.type === 'label'){
        control.value = control.content;
    }

      if (!control.showHelpText){
        control.showToolTip = true;
    }else{
        control.showToolTip = false;
    }

    });

    if (formIsValid) {
      message = '';
      this.setDefaultGridColumns();
      const form = this.editControlsForm;
      if (form.ticketTemplate.length === 0) {
        form.ticketTemplate = {};
      }
      this.formService.save(this.tenantId, form).subscribe((res: any) => {
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Controls successfully updated !!', 'Success');
        editControlsForm.form.markAsPristine();
      },
      (error) => {
        this.spinner.hide();
        this.notifyService.showErrorMessage('update Controls Failed', 'Error');
      });
    }
    else{
      this.spinner.hide();
    }
  }
}
