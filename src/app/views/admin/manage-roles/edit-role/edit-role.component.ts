import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoleServiceService } from 'src/app/services/role-service/role-service.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { NgForm } from '@angular/forms';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user-service/user.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-role',
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.scss']
})
export class EditRoleComponent implements OnInit {
  tenant;
  tenantId;
  tenantForms;
  tenantEmailNotifications;

  // role info
  role;
  roleId;
  roleName;

  // role permissions
  canEditNotes;
  canEditTickets;
  canManageTickets;
  canViewAdminPages;
  canViewNotes;

  // form info
  formName;
  formId;

  // form permissions
  orgFormpermissions = [];
  formPermissions;

  readonly;
  su;
  @ViewChild('manageRolesForm') manageRolesForm: any;
  specificLength: any;
  
  constructor(private route: ActivatedRoute,
              private roleService: RoleServiceService,
              private formService: FormServiceService,
              private lookupService: LookupServiceService,
              private authService: AuthService,
              private spinner: NgxSpinnerService,
              public dialog: MatDialog,
              private titleService: Title,
              private userService: UserService,
              private toastrService: ToastrnotificationService) { }

  CanDeactivate(): any {
    if (this.manageRolesForm.form.dirty || this.manageRolesForm.form.dirty) {
          return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Edit Role');
    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });

    // getting formId from url
    this.route.params.subscribe(params => {
      this.roleId = params.roleId;
    });

    // set readonly
    this.readonly = this.authService.authentication.data.roles.some(i => i.id == this.roleId);
    if (this.authService.authentication.data.su) {
      this.readonly = false;
    }

    this.getTenantData(this.tenantId, this.roleId);


    // get role details, set values
    this.roleService.getRole(this.tenantId, this.roleId).subscribe(
      (response) => {
        this.role = response;
        // tslint:disable-next-line: no-string-literal
        this.roleName = response['name'];
        // tslint:disable-next-line: no-string-literal
        this.canEditNotes = response['permissions']['access']['CanEditNotes'];
        // tslint:disable-next-line: no-string-literal
        this.canEditTickets = response['permissions']['access']['CanEditTickets'];
        // tslint:disable-next-line: no-string-literal
        this.canManageTickets = response['permissions']['access']['CanManageTickets'];
        // tslint:disable-next-line: no-string-literal
        this.canViewAdminPages = response['permissions']['access']['CanViewAdminPages'];
        // tslint:disable-next-line: no-string-literal
        this.canViewNotes = response['permissions']['access']['CanViewNotes'];
      },
      (error) => {
        console.log(error);
      }
    );
  }

 

  // get tenant forms, set values
  getTenantData(tId, rId) {
    this.lookupService.getLookupData(tId).subscribe(data => {
      this.tenant = data;
      // tslint:disable-next-line: no-string-literal
      this.tenantEmailNotifications = data['tenant']['tenantSettings']['settings']['emailNotification'];
      // tslint:disable-next-line: no-string-literal
      this.tenantForms = data['tenant']['forms'];

      this.formPermissions = this.tenantForms.reduce((arr, form) => {
        const assignedRoles = form.roles.assignedRoles.filter(r => r.id == rId);
        assignedRoles.forEach((assignedRole) => {
          const setTenantNotifications = assignedRole.notifications == '' || assignedRole.notifications == undefined ? false : true;
          arr.push({
            name: form.name,
            formId: form.id,
            canBeAssigned: assignedRole.canBeAssigned,
            canCreateTicket: assignedRole.canCreateTicket,
            notifications: {
              commentEmail: setTenantNotifications ? assignedRole.notifications.commentEmail : true,
              commentNotify: setTenantNotifications ? assignedRole.notifications.commentNotify : true,
              updateEmail: setTenantNotifications ? assignedRole.notifications.updateEmail : true,
              updateNotify: setTenantNotifications ? assignedRole.notifications.updateNotify : true,
              newEmail: setTenantNotifications ? assignedRole.notifications.newEmail : true,
              newNotify: setTenantNotifications ? assignedRole.notifications.newNotify : true,
              noteEmail: setTenantNotifications ? assignedRole.notifications.noteEmail : true,
              noteNotify: setTenantNotifications ? assignedRole.notifications.noteNotify : true,
            }
          });
        });
        return arr;
      }, []);
    });
  }

  // Make form dirty
  makeformDirty(){
    this.manageRolesForm.form.markAsDirty();
  }

  onNotifyCanAdministrateWorkspaceChange(e) {
    this.role.permissions.access.CanViewAdminPages = e;
    this.canViewAdminPages = e;

    // this creates clone of the orginal from permissions
    this.orgFormpermissions = (this.formPermissions);

    // if toggle is true then set all related toggles to true
    if (e) {
      this.canManageTickets = true;
      this.canEditTickets = true;
      this.formPermissions.forEach(form => {
        form.canCreateTicket = true;

      });
    }
    else {
      // re-store orginal form permissions
      this.canManageTickets = this.role.permissions.access.CanManageTickets;
      this.canEditTickets = this.role.permissions.access.CanEditTickets;
      this.formPermissions = this.orgFormpermissions;
    }
    this.makeformDirty();
  }

  onNotifyCanAccessAllTicketsChange(e) {
    this.role.permissions.access.CanManageTickets = e;
    this.canManageTickets = e;
    if (e) {
      this.canEditTickets = true;
    }
    else {
      this.canEditTickets = this.role.permissions.access.CanEditTickets;
    }
    this.makeformDirty();
  }

  onNotifyCanEditAdminNotesChange(e) {
    this.role.permissions.access.CanEditNotes = e;
    this.canEditNotes = e;
    if (e) {
      this.canViewNotes = e;
    }
    else {
      this.canViewNotes = this.role.permissions.access.CanViewNotes;
    }
    this.makeformDirty();
  }

  onNotifyCanViewAdminNotesChange(e) {
    this.role.permissions.access.CanViewNotes = e;
    this.canViewNotes = e;
    this.makeformDirty();
  }

  onNotifyCanEditTicketsChange(e) {
    this.role.permissions.access.CanEditTickets = e;
    this.canEditTickets = e;
    this.makeformDirty();
  }

  saveRoles(manageRolesForm: NgForm) {
    let tenantform = 0;
    // update the role info
    // tslint:disable-next-line: no-string-literal
    this.role.name = manageRolesForm.controls['name'].value;
    this.role.permissions.access.CanViewAdminPages = this.canViewAdminPages;
    this.role.permissions.access.CanManageTickets = this.canManageTickets;
    this.role.permissions.access.CanManageTickets = this.canManageTickets;
    this.role.permissions.access.CanEditNotes = this.canEditNotes;
    this.role.permissions.access.CanViewNotes = this.canViewNotes;
    if (manageRolesForm.valid) {
      this.spinner.show();
      // save role
      this.roleService.updateRole(this.role).subscribe((response) => {
        // update form info
        for (let i = 0; i < this.tenantForms.length; i++) {
          // if tenant form does not have notifications then add default values
          if (this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications === '' ||
            this.tenantForms[i].roles.assignedRoles.filter(r => r.id == this.roleId)[0].notifications === undefined) {
            this.tenantForms[i].roles.assignedRoles.filter(r => r.id == this.roleId)[0].notifications = {
              commentEmail: true,
              commentNotify: true,
              updateEmail: true,
              updateNotify: true,
              newEmail: true,
              newNotify: true,
              noteEmail: true,
              noteNotify: true
            };
          }

          this.tenantForms[i].roles.assignedRoles.filter(r => r.id == this.roleId)[0].canBeAssigned = this.formPermissions[i].canBeAssigned;
          this.tenantForms[i].roles.assignedRoles.filter(r => r.id == this.roleId)[0].canCreateTicket = this.formPermissions[i].canCreateTicket;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.commentEmail = this.formPermissions[i].notifications.commentEmail;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.commentNotify = this.formPermissions[i].notifications.commentNotify;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.newEmail = this.formPermissions[i].notifications.newEmail;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.newNotify = this.formPermissions[i].notifications.newNotify;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.noteEmail = this.formPermissions[i].notifications.noteEmail;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.noteNotify = this.formPermissions[i].notifications.noteNotify;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.updateEmail = this.formPermissions[i].notifications.updateEmail;
          this.tenantForms[i].roles.assignedRoles.filter(
            r => r.id == this.roleId)[0].notifications.updateNotify = this.formPermissions[i].notifications.updateNotify;
          // save forms
          this.formService.saveForm(this.tenantId, this.tenantForms[i]).subscribe((response) => {

            tenantform++;
            if (tenantform >= this.tenantForms.length) {
              this.spinner.hide();
              this.manageRolesForm.form.markAsPristine();
              this.toastrService.showSuccessMessage('Role successfully updated', 'Success');
            }
           
          }, (err) => {
            tenantform++;
            this.toastrService.showErrorMessage(err.error.message, 'Error');
            if (tenantform >= this.tenantForms.length) {
              this.spinner.hide();
            }
          });
        }
      }, (err) => {
        this.spinner.hide();
        this.toastrService.showErrorMessage(err.error.message, 'Error');
      });
    } else {
      this.toastrService.showErrorMessage('Please fill all required fields', 'Error');
    }
  }
}
