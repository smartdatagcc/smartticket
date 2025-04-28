import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleServiceService } from 'src/app/services/role-service/role-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user-service/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-create-new-role',
  templateUrl: './create-new-role.component.html',
  styleUrls: ['./create-new-role.component.scss']
})
export class CreateNewRoleComponent implements OnInit {

  tenantId: any;
  roles: any;
  defaultPermissionAccess: any;
  lookupData: any;
  roleExists = false;
  showEmail: boolean;
  newRole: any;
  showMessage: string;
  @ViewChild('createRolesForm') createRolesForm: any;

  constructor(private route: ActivatedRoute,
    private roleService: RoleServiceService,
    private lookupService: LookupServiceService,
    private toastrService: ToastrnotificationService,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private titleService: Title,
    private router: Router) { }

  CanDeactivate(): any {
    if (this.createRolesForm.form.dirty || this.createRolesForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Create New Role');
    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });

    this.lookupData = this.lookupService.lookupdata;
    this.showEmail = this.lookupData.tenant.tenantSettings.settings.emailNotification;
    this.gettenantroles(this.tenantId);
    this.getDefaultPermissionAccess(this.tenantId);
  }


  // getting the tenant's roles
  gettenantroles(tenantId) {
    this.lookupService.getRoles(tenantId).subscribe(
      (response) => {
        this.roles = response;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // Getting the default permission access details of Tenant
  getDefaultPermissionAccess(tenantId) {
    this.spinner.show();
    this.roleService.getDefaultPermissionAccess(tenantId).subscribe(response => {
      if (response) {
        this.defaultPermissionAccess = response;
        this.newRole = {
          name: '',
          permissions: this.defaultPermissionAccess,
          formPermissions: this.lookupData.tenant.forms.map(form => {
            return {
              name: form.name,
              formId: form.id,
              canBeAssigned: false,
              canCreateTicket: true,
              notifications: {
                commentEmail: true,
                commentNotify: true,
                updateEmail: true,
                updateNotify: true,
                newEmail: true,
                newNotify: true
              }
            };
          })
        };
      }
      this.spinner.hide();
    }, (error) => {
      this.newRole = {
        name: '',
        permissions: this.defaultPermissionAccess,
        formPermissions: this.lookupData.tenant.forms.map(form => {
          return {
            name: form.name,
            formId: form.id,
            canBeAssigned: false,
            canCreateTicket: true,
            notifications: {
              commentEmail: true,
              commentNotify: true,
              updateEmail: true,
              updateNotify: true,
              newEmail: true,
              newNotify: true
            }
          };
        })
      };
      console.log(error);
    });
  }

  // Check whether Role exist or not
  isRoleExist(newRole) {
    if (newRole.length > 0) {
      if (this.roles.find(data => data.name === newRole)) {
        this.roleExists = true;
      }
      else {
        this.roleExists = false;
      }
    }
  }

  roleChange() {
    this.showMessage = '';
  }

  // Save the Roles
  saveRoles(createRolesForm: NgForm) {
    if (!this.newRole.name) {
      this.showMessage = 'Role Name is required';
      this.toastrService.showErrorMessage('Role Name is required', 'Error');
      return;
    }
    if (this.roles.find(data => data.name === this.newRole.name)) {
      this.toastrService.showErrorMessage('Role with this name already exists, please select a unique name', 'Error');
      return;
    }
    if (createRolesForm.form.valid) {
      this.spinner.show();
      this.showMessage = '';
      const role = JSON.parse(JSON.stringify(this.newRole));

      if (role.permissions.access.CanViewAdminPages) {
        role.permissions.access.CanManageTickets = true;
      }
      if (role.permissions.access.CanEditNotes) {
        role.permissions.access.CanViewNotes = true;
      }
      this.roleService.addNewRole(this.tenantId, role).subscribe(response => {
        this.createRolesForm.form.markAsPristine();
        this.toastrService.showSuccessMessage('Role successfully created - redirecting back to roles', 'Success');
        this.spinner.hide();
        setTimeout(() => {
          const keyTenantId = this.tenantId;
          const path = keyTenantId + '/admin/roles';
          this.router.navigate([path]);
        }, 500);
      }, error => {
        this.spinner.hide();
        this.toastrService.showErrorMessage(error.error.message, 'Error');
      });
    }
    else {
      this.toastrService.showErrorMessage('Enter all the required fields', 'Error');
    }
  }

  onNotifyCanEditAdminNotesChange(e) {
    this.newRole.permissions.access.CanEditNotes = e.checked;
    this.newRole.permissions.access.CanViewNotes = e.checked;

  }

  onNotifyCanAccessAllTicketsChange(e) {
    this.newRole.permissions.access.CanEditTickets = e.checked;
    this.newRole.permissions.access.CanManageTickets = e.checked;

  }

  onNotifyCanAdministrateWorkspaceChange(e) {
    this.newRole.permissions.access.CanViewAdminPages = e.checked;
    this.newRole.permissions.access.CanManageTickets = e.checked;
    this.newRole.permissions.access.CanEditTickets = e.checked;

  }

}
