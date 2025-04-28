import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router, PRIMARY_OUTLET } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserService } from 'src/app/services/user-service/user.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as _ from 'underscore';
import { ThemePalette } from '@angular/material/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-manage-forms',
  templateUrl: './manage-forms.component.html',
  styleUrls: ['./manage-forms.component.scss']
})
export class ManageFormsComponent implements OnInit {

  tenantId: any;
  formId: any;
  lookupdata: any;
  forms: any;
  form: any;
  formExists: any;
  assignableUsers: any;
  roles: any;
  icons: any;
  overDueDays: any;
  colorOptions: any;
  canViewAdminPages: any;
  originalForm: any;
  submitted: any;
  message: any;
  iconsdata: any;
  collapseAccessView: boolean;
  collapseIconView: boolean;
  collapseTicketAgeView: boolean;
  formname: string;
  color: ThemePalette = 'primary';
  @ViewChild('editForm') editForm: any;

  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private ref: ChangeDetectorRef,
    private userService: UserService,
    private router: Router,
    private notifyService: ToastrnotificationService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private titleService: Title,
    private formService: FormServiceService) {
  }

  CanDeactivate(): any {
    if (this.editForm.form.dirty || this.editForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Manage Forms');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    this.route.params.subscribe((params) => {
      this.formId = params.formId;
      this.gettingbasicdata();
    });
  }

  gettingbasicdata() {
    if (this.tenantId !== '' && this.formId !== undefined) {
      this.spinner.show();
      this.collapseAccessView = false;
      this.collapseIconView = false;
      this.collapseTicketAgeView = false;
      if (this.editForm != undefined) {
        this.editForm.form.markAsPristine();
      }
      this.lookupService.getLookupData(this.tenantId).subscribe((data) => {
        this.lookupService.storeData(data);
        this.formExists = false;
        this.lookupdata = data;
        this.forms = this.lookupdata.tenant.forms;
        this.getAssignableUsers();
        this.getRoles();
        this.getIcons();
        const formdata = this.lookupdata.tenant.forms.filter(data => data.id == this.formId);
        this.form = formdata[0];
        this.form.settings.details.autoAssignedUser = Number(this.form.settings.details.autoAssignedUser);
        this.lookupService.setSelectedForm(this.form);
        this.lookupService.setTentantForms(this.lookupdata.tenant.forms);
        this.formname = this.form.name;
        this.originalForm = JSON.parse(JSON.stringify(this.form));
        if (!this.form.settings.details.overDue) {
          this.form.settings.details.overDueDays = 0;
        }
        if (this.form.settings.details.overDueDays === undefined) {
          this.form.settings.details.overDueDays = 0;
        }
        this.overDueDays = this.form.settings.details.overDueDays;
        this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');

        this.collapseAccessView = true;
        this.collapseTicketAgeView = true;
        this.collapseIconView = true;
      },
        (error) => {
          this.spinner.hide();
          console.log(error);
        });
      this.spinner.hide();
    }
  }

  // check permison readonly or not
  isReadOnly(role) {
    return role.permissions.access.CanViewAdminPages;
  }

  // filter roles
  fillterformRoles() {
    const _this = this;
    const formdata = this.lookupdata.tenant.forms.filter(data => data.id == this.formId);
    const form = formdata[0];
    this.form.roles.assignedRoles = _.map(this.roles, function (role: any) {
      const existingRole: any = _.find(form.roles.assignedRoles, { id: role.id });
      if (existingRole) {
        existingRole.name = role.name;
        existingRole.isReadOnly = _this.isReadOnly(role);
        return existingRole;
      } else {
        return {
          id: role.id,
          name: role.name,
          isReadOnly: _this.isReadOnly(role),
          canCreateTicket: true,
          canBeAssigned: role.name === 'User' ? false : true
        };
      }
    });
  }

  // Get Assignable users
  getAssignableUsers() {
    this.userService.getAssignableUsers(this.tenantId, this.formId).subscribe(data => {
      this.assignableUsers = data;
    });
  }

  // Get Roles
  getRoles() {
    this.lookupService.getRoles(this.tenantId).subscribe(data => {
      this.roles = data;
      this.fillterformRoles();
    });
  }

  // Get Icons for the form
  getIcons() {
    this.formService.getFormIcons().subscribe(data => {
      this.iconsdata = data;
      this.icons = this.iconsdata.value.icons;
    });
  }

  // Save Form details
  saveForm(editForm) {

    if (this.form.name === '') {
      this.notifyService.showErrorMessage('Form Name is reqired', 'Error');
      return false;
    }
    this.forms.filter((formdata) => {
      if (formdata.name === this.form.name && formdata.id !== this.form.id) {
        this.formExists = true;
        this.notifyService.showErrorMessage('Form with this name already exists, please select a unique name', 'Error');
        return false;
      }
    });

    this.message = '';
    this.form.roles.assignedRoles.filter((role) => {
      if (!role.canCreateTicket) {
        role.canBeAssigned = false; // make sure this happens
      }
    });

    if (this.form.ticketTemplate.length === 0) {
      this.form.ticketTemplate = {};
    }
    this.spinner.show();
    this.formService.save(this.tenantId, this.form).subscribe((result) => {
      this.spinner.hide();
      this.notifyService.showSuccessMessage('Form updated', 'Success');
      this.lookupService.setTentantForms(this.forms);
      this.editForm.form.markAsPristine();
    },
      error => {
        console.log(error);
        this.spinner.hide();
      });
  }

  // Delete form
  showDeleteConfirmation(editForm) {
    const dialogTitle = `Confirm deletion of the form <strong>'` + this.form.name + `'</strong>`;
    const message = `<strong><i>Note: deleting the form will delete all existing tickets of this form.</i></strong>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '600px',
        data: dialogData,
      }
    );

    dialogRef.afterClosed().subscribe(
      (dialogResult) => {
        if (dialogResult === true) {
          this.spinner.show();
          this.formService.delete(this.tenantId, this.form.id).subscribe((result: any) => {
            this.notifyService.showSuccessMessage('Form successfully removed', 'Form Deletion');
            this.spinner.hide();
            this.editForm.form.markAsPristine();
            this.router.navigate(['/' + this.tenantId + '/admin/admin-form']);
          },
            error => {
              this.notifyService.showSuccessMessage('Error deleting Form', 'Error');
              this.spinner.hide();
            });
        }
      });
  }

  // Cancel changes to the form
  cancelChanges(editForm) {
    editForm.form.markAsPristine();
    this.form = JSON.parse(JSON.stringify(this.originalForm));
  }
}
