import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { AddUserControlDialogModel, AddUserControlModalComponent } from 'src/app/views/admin/user-metadata-controls/add-user-control-modal/add-user-control-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { Title } from '@angular/platform-browser';
declare var $: any;
@Component({
  selector: 'app-user-metadata-controls',
  templateUrl: './user-metadata-controls.component.html',
  styleUrls: ['./user-metadata-controls.component.scss']
})
export class UserMetadataControlsComponent implements OnInit {
  tenantId: number;
  tenantData: any;
  editControlsForm: any;
  templateControls: any;
  @ViewChild('editControlsForm') editControlsFormv: any;
  constructor(
    private userService: UserService,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private lookupService: LookupServiceService,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ControlService: ControlsServiceService,
    private tenantService: TenantServiceService,
    private titleService: Title
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
    this.titleService.setTitle('Custom User Fields');
    $(document).ready(function () {
      $('[rel=tooltip]').tooltip({ trigger: "hover" });
    });
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    this.getlookupdata();
  }


  // get lookup data from server
  getlookupdata() {
    this.lookupService.getLookupData(this.tenantId).subscribe((data: any) => {
      this.lookupService.storeData(data);
      this.editControlsForm = data;
      this.tenantData = this.lookupService.lookupdata;
      this.templateControls = data.tenant.userTemplate.controls;
      this.spinner.hide();
    },
      error => {
        this.spinner.hide();
        console.log(error);
      }
    );
  }

  // Addin new user
  AddUserField(): void {
    const dialogData = new AddUserControlDialogModel(this.tenantData.tenant);
    const dialogRef = this.dialog.open(AddUserControlModalComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
    });
  }

  // onsubmit this method will be called
  saveControls(editControlsForm) {
    this.spinner.show();
    let message = '';
    let formIsValid = editControlsForm.valid;
    this.templateControls.map((control) => {
      const existingControl = this.editControlsForm.tenant.userTemplate.controls.find((item: any) => {
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
    });

    if (formIsValid) {
      message = '';
      const tenant = this.editControlsForm.tenant;
      if (tenant.userTemplate.length === 0) {
        tenant.userTemplate = {};
      }
      this.tenantService.updateTenant(tenant).subscribe((res: any) => {
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Controls successfully updated !!', 'Success');
        editControlsForm.form.markAsPristine();
      },
        (error) => {
          this.spinner.hide();
          this.notifyService.showErrorMessage('update Controls Failed', 'Error');
        });
    }
  }
}
