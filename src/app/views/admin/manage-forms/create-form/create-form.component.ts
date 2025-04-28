import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserService } from 'src/app/services/user-service/user.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as _ from 'underscore';
import { ThemePalette } from '@angular/material/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent implements OnInit {

  tenantId: any;
  formId: any;
  lookupdata: any;
  form: any;
  forms: any;
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
  @ViewChild('addForm') addForm: any;

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
    if (this.addForm.form.dirty || this.addForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }


  ngOnInit(): void {
    this.titleService.setTitle('Create Form');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    this.setNewFormControl();
    this.getIcons();
    this.gettingbasicdata();
  }

  gettingbasicdata() {
    if (this.tenantId !== '') {
      this.spinner.show();
      this.lookupService.getLookupData(this.tenantId).subscribe((data: any) => {
        this.lookupService.storeData(data);
        this.formExists = false;
        this.lookupdata = data;
        this.forms = this.lookupdata.tenant.forms;
        this.getRoles();
        this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
      },
        (error) => {
          this.spinner.hide();
        });
      this.spinner.hide();
    }
  }

  isReadOnly(role) {
    return role.permissions.access.CanViewAdminPages;
  }

  setNewFormControl() {
    this.form = {
      name: null,
      color: 'primary',
      // tslint:disable-next-line: object-literal-key-quotes
      roles: {
        'assignedRoles': {},
      },
      settings: {
        // tslint:disable-next-line: object-literal-key-quotes
        'details': {
          // tslint:disable-next-line: object-literal-key-quotes
          'icon': 'fa-ticket',
          // tslint:disable-next-line: object-literal-key-quotes
          'calculateBy': 'created_at',
          // tslint:disable-next-line: object-literal-key-quotes
          'overDue': false
        }
      },
      ticketTemplate: {
        controls: [
          // tslint:disable-next-line: object-literal-key-quotes
          { 'name': 'subject', 'type': 'text', 'label': 'Subject/Title', 'required': true, 'adminOnly': false },
          // tslint:disable-next-line: object-literal-key-quotes
          { 'name': 'description', 'type': 'textarea', 'label': 'Description', 'required': true, 'adminOnly': false }
        ]
      }
    };
  }

  // Get Roles
  getRoles() {
    this.lookupService.getRoles(this.tenantId).subscribe(data => {
      this.roles = data;
      this.form.roles.assignedRoles = this.roles.map(role => {
        return {
          id: role.id,
          name: role.name,
          isReadOnly: this.isReadOnly(role),
          canCreateTicket: true,
          canBeAssigned: role.name === 'User' ? false : true
        };
      });
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
  saveForm(addForm) {
    this.spinner.show();
    if (!(this.form.name)) {
      this.notifyService.showErrorMessage('Form name is required', 'Error');
      this.spinner.hide();
      return false;
    }
    this.forms.filter((formdata) => {
      if (formdata.name === this.form.name && formdata.id !== this.form.id) {
        this.formExists = true;
        this.notifyService.showErrorMessage('Form with this name already exists, please select a unique name', 'Error');
        this.spinner.hide();
        return false;
      }
    });

    this.message = '';

    // FoundationApi.publish('editTenantModal', 'hide');
    this.form.roles.assignedRoles.filter((role) => {
      if (!role.canCreateTicket) {
        role.canBeAssigned = false; // make sure this happens
      }
    });
    if (this.form.ticketTemplate.length === 0) {
      this.form.ticketTemplate = {};
    }

    this.formService.create(this.tenantId, this.form).subscribe((result: any) => {
      this.lookupService.getLookupData(this.tenantId).subscribe((refreshdata: any) => {
        this.lookupService.setTentantForms(refreshdata.tenant.forms);
      });
      this.spinner.hide();
      this.addForm.form.markAsPristine();
      this.notifyService.showSuccessMessage('Form successfully created - redirecting to new form', 'Success');
      this.router.navigate(['/' + this.tenantId + '/admin/forms/' + result.id]);
    },
      error => {
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });
  }
}
