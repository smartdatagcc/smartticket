import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { MatDialog } from '@angular/material/dialog';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { RoleServiceService } from 'src/app/services/role-service/role-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';
import { Title } from '@angular/platform-browser';
declare var $: any;

@Component({
  selector: 'app-manage-roles',
  templateUrl: './manage-roles.component.html',
  styleUrls: ['./manage-roles.component.scss']
})
export class ManageRolesComponent implements OnInit {

  columnDefs;
  rowSelection;
  rowSelect;
  tenantId: any;
  tenantUsers;
  tenantRoles;
  rowData;
  paginationPageSized;
  gridApi;
  gridColumnApi;
  searchValue;
  frameworkComponents;

  constructor(
    private route: ActivatedRoute,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog,
    private router: Router,
    private spinner: NgxSpinnerService, 
    private titleService: Title,
    private lookupService: LookupServiceService, 
    private rolesService: RoleServiceService,
    private gridSelectService: GridRowSelectService,) {
      this.rowSelection = 'multiple';
  }

  ngOnInit(): void {
    this.titleService.setTitle('Manage Roles');
    $(document).ready(function () {
      $('[rel=tooltip]').tooltip({ trigger: 'hover' });
    });
    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });
    this.gettenantroles(this.tenantId);
    this.paginationPageSized = 15;
    this.frameworkComponents = { tooltipComponent: TooltipComponent };
    this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);
  }
  generateColumns(data) {
    this.columnDefs = [
      this.rowSelect,
      {
        field: 'Name', sortable: true, valueGetter: params => params.data.name, filter: true,
        filterParams: { buttons: ['reset', 'apply'], closeOnApply: true },
        cellRenderer: this.rolelink.bind(this), sortingOrder: ['asc', 'desc']
      },
      {
        field: 'Default *', sortable: true, valueGetter: params => params.data.default ? 'Yes' : 'No', filter: true
        , filterParams: { buttons: ['reset', 'apply'], closeOnApply: true },
        cellRenderer: this.defaultLink.bind(this), sortingOrder: ['asc', 'desc']
      },
      {
        field: 'Users', sortable: true, valueGetter: params => params.data.users, filter: true
        , filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
        , cellRenderer: this.roleUsersLink.bind(this), sortingOrder: ['asc', 'desc']
      },
    ];

    this.columnDefs.push(
      { field: 'Remove **', cellRenderer: this.removeRoleLink.bind(this) },
    );

  }

  rolelink(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = params.data.name;
    eSpan.style.color = '#3c8dbc';
    const keyName = params.data.name;
    const keyId = params.data.id;
    const keyTenantId = params.data.tenant_id;

    const path = keyTenantId + '/admin/roles/' + keyId + '/edit';
    eSpan.addEventListener('click', (e) => {
      this.router.navigate([path]);
    });
    return eSpan;
  }

  roleUsersLink(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = params.data.users;
    eSpan.style.color = '#3c8dbc';

    const keyTenantId = params.data.tenant_id;
    const keyName = params.data.name;

    const path = keyTenantId + '/admin/users';
    const navigationExtras: NavigationExtras = {
      queryParams: { role: encodeURIComponent(keyName) }
    };

    eSpan.addEventListener('click', (e) => {
      this.router.navigate([path], navigationExtras);
    });
    return eSpan;
  }

  defaultLink(params) {
    const eSpan = document.createElement('span');
    const data = params.data;
    if (params.data.default !== true) {
      eSpan.innerHTML = params.data.default ? 'Yes' : 'No' + '   ' +
        '<a style="font-style:italic; color:#3c8dbc">Set As Default</a>';
      eSpan.addEventListener('click', () => {
        this.setDefaultRole(params.data);
      });
    }
    else {
      eSpan.innerHTML = params.data.default ? 'Yes' : 'No';
    }
    return eSpan;
  }

  setDefaultRole(selRole) {
    this.spinner.show();
    this.tenantRoles.forEach(role => {
      role.default = false;
    });

    selRole.default = true;

    this.rolesService.setDefaultRole(selRole).subscribe(response => {
      this.gettenantroles(this.tenantId);
      this.notifyService.showSuccessMessage('Default role updated', 'Success');
      this.spinner.hide();
    }, error => {
      this.notifyService.showErrorMessage(error.error.message, 'Error');
      this.spinner.hide();
    });
  }

  // remove role button
  removeRoleLink(params) {
    const button = document.createElement('button');
    button.className = 'btn btn-danger';
    button.innerHTML = 'Remove Role';

    const isDisable = !params.data.canEdit || params.data.users !== '0' || params.data.default;
    button.disabled = isDisable;

    button.addEventListener('click', (e) => {
      this.removeRole(params.data.id);
    });
    return button;
  }

  // remove confirmation
  removeRole(roleId) {

    const dialogTitle = `Confirmation Required`;
    const message = `<strong>Do you want to remove this Role?</strong> <br>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(dialogTitle, message, okButtonText, cancelButtonText);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '600px',
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dlgResult = dialogResult;
      if (dlgResult === true) {
        this.spinner.show();
        this.rolesService.removeRole(this.tenantId, roleId).subscribe(result => {
          this.gettenantroles(this.tenantId);
          this.notifyService.showSuccessMessage('Role successfully removed', 'Remove Role');
          this.spinner.hide();
        }, error => {
          this.notifyService.showErrorMessage(error.error.message, 'Error');
          this.spinner.hide();
        });
      }
    });

  }

  // get all the tenant's roles
  gettenantroles(tenantId) {
    this.lookupService.getRoles(tenantId).subscribe(
      (response) => {
        this.tenantRoles = response;
        this.rowData = response;
        this.generateColumns(response);
      },
      (error) => {
        console.log(error);
      }
    );
  }
  // onGrid is Ready
  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }

  // onGrid Size Change
  gridSizeChanged(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }

  // global grid search
  quickSearch() {
    this.gridApi.setQuickFilter(this.searchValue);
  }

  // refresh grid
  refreshgrid() {
    this.searchValue = '';
    this.gridApi.setQuickFilter('');
  }

  AddRole() {
    const keyTenantId = this.tenantId;
    const path = keyTenantId + '/admin/roles/create';
    this.router.navigate([path]);
  }

}
