import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output } from '@angular/core';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { UserService } from 'src/app/services/user-service/user.service';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import {
  ConfirmDialogModel,
  ConfirmDialogComponent,
} from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { AddUserDialogModel, AddUserModalComponent } from 'src/app/views/admin/manage-users/add-user-modal/add-user-modal.component';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { EditUserDialogModel, EditUserModalComponent } from 'src/app/views/admin/manage-users/edit-user-modal/edit-user-modal.component';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ResetUserPasswordDialogModel, ResetUserPasswordModalComponent } from 'src/app/views/admin/manage-users/reset-user-password-modal/reset-user-password-modal.component';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';

declare var $: any;

@Component({
  selector: 'app-current-users',
  templateUrl: './current-users.component.html',
  styleUrls: ['./current-users.component.scss'],
})
export class CurrentUsersComponent implements OnInit {

  columnDefs;
  rowData;
  rowSelection;
  rowSelect;
  frameworkComponents;
  tenantId: number;
  public paginationPageSized;
  private gridAPI;
  public searchValue: any;
  private gridColumnApi;
  result: boolean;
  lookupData: any;
  userTemplate: any;
  roles: any;
  @Input() currentUserData;
  advanceFilterColumns: any[] = [];
  localStorageFilterColumns: any[] = [];
  localStorageNameForColumnFilters: string;
  loggedInUserId: number;
  defaultColumns: any[];
  roleFilter: string;
  userLimit: number;
  @Output() usersUpdate = new EventEmitter();

  constructor(
    private userService: UserService,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private lookupService: LookupServiceService,
    private authService: AuthService,
    private ControlsService: ControlsServiceService,
    private accountService: AccountServiceService,
    private gridSelectService: GridRowSelectService,
  ) { 
    this.rowSelection = 'multiple';
    this.frameworkComponents = { tooltipComponent: TooltipComponent };
  }

  ngOnInit() {
    $(document).ready(function () {
      $('[rel=tooltip]').tooltip({ trigger: "hover" });
    });
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    // getting query parameters from url
    this.route.queryParams.subscribe(params => {
      /* tslint:disable:no-string-literal */
      this.roleFilter = params['role'];
    });

    this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);

    this.defaultColumns = [
      { id: 'email', label: 'Email' },
      { id: 'role', label: 'Role' },
      { id: 'assigned', label: 'Assigned Tickets' },
      { id: 'created', label: 'Created Tickets' }
    ];

    this.lookupData = this.lookupService.lookupdata;
    this.userLimit = this.lookupService.lookupdata.tenant.tier.users;
    this.userTemplate = this.lookupData.tenant.userTemplate || { controls: [] };
    if (this.tenantId) {
      this.lookupService.getRoles(this.tenantId).subscribe(data => {
        this.roles = data;
      });
    }

    this.loggedInUserId = this.authService.authentication.data.id;
    this.localStorageNameForColumnFilters = 'manage_users_' + this.loggedInUserId + '_' + this.tenantId;
    if (this.currentUserData) {
      // Filter the data based on the role name
      if (this.roleFilter && this.roleFilter !== undefined && this.roleFilter.length > 0) {
        let filteredData;
        filteredData = this.currentUserData.filter(data => data.roleName === this.roleFilter);
        this.rowData = filteredData;
      }
      else {
        this.rowData = this.currentUserData;
      }

      this.generateColumns(this.rowData);
    }
    this.paginationPageSized = 20;
  }

  // check all and uncheck all
  showhideallcolumns(e, status) {
    const showhidearray = [];
    const localstoragecolumns = [];
    this.advanceFilterColumns.filter((column) => {
      column.value = status;
      showhidearray.push(column.name);
      if (status) {
        localstoragecolumns.push({ id: column.name, label: column.label });
      }
    });
    localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(localstoragecolumns));
    this.gridColumnApi.setColumnsVisible([showhidearray][0], status);
    e.stopPropagation();
  }

  // Show And hide Name
  showhidecolumn(e, show) {
    const name = show.name;
    const value = show.value === true ? false : true;
    this.advanceFilterColumns.filter((column) => {
      if (column.id === show.id) {
        column.value = value;
      }
    });
    // Update Local Storage if any column is removed or added in the Advance Filters
    if (localStorage.getItem(this.localStorageNameForColumnFilters)) {
      const localstoragecolumns = JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters));
      if (value) {
        localstoragecolumns.push({ id: show.name, label: show.label });
      } else {
        const index = localstoragecolumns.findIndex(x => x.id === show.name);
        if (index > -1) {
          localstoragecolumns.splice(index, 1);
        }
      }
      localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(localstoragecolumns));
    }
    this.gridColumnApi.setColumnVisible(name, value);
    e.stopPropagation();
  }


  generateColumns(data) {
    this.advanceFilterColumns = [];
    const tmpLocalStorageColumns = [];
    let index = 0;
    if (localStorage.getItem(this.localStorageNameForColumnFilters)) {
      this.localStorageFilterColumns = JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters));
    }

    this.columnDefs = [
      this.rowSelect,
      {
        headerName: 'Name', field: 'name', sortable: true, valueGetter: params => params.data.name
        , cellRenderer: this.adminlink.bind(this), sort: 'asc', sortingOrder: ['asc', 'desc']
        , filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
      },
    ];

    // Looping the Deafault Columns
    this.defaultColumns.forEach(defaultcolumn => {
      let mappedColumn = {};
      switch (defaultcolumn.id) {
        case 'email': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, valueGetter: params => params.data.email,
            tooltipField: 'email', sortingOrder: ['asc', 'desc'],
            sortable: true, filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
          };
          break;
        }
        case 'role': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, valueGetter: params => params.data.roleName, sortingOrder: ['asc', 'desc'],
            sortable: true, filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
          };
          break;
        }
        case 'assigned': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, valueGetter: params => Number(params.data.assignedTickets),
            sortingOrder: ['asc', 'desc'], sortable: true, filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
          };
          break;
        }
        case 'created': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, valueGetter: params => Number(params.data.createdTickets),
            sortingOrder: ['asc', 'desc'], sortable: true, filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
          };
          break;
        }
      }

      index = index + 1;

      if ((this.localStorageFilterColumns.length > 0) &&
        this.localStorageFilterColumns.find(colData => colData.id === defaultcolumn.id)) {
        this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: true });
        // tslint:disable-next-line: no-string-literal
        mappedColumn['hide'] = false;
      }
      else if ((this.localStorageFilterColumns.length > 0) &&
        !this.localStorageFilterColumns.find(colData => colData.id === defaultcolumn.id)) {
        this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: false });
        // tslint:disable-next-line: no-string-literal
        mappedColumn['hide'] = true;
      }
      else if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) ||
        (this.localStorageFilterColumns.length === 0)) {
        this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: true });
        // tslint:disable-next-line: no-string-literal
        mappedColumn['hide'] = false;
        tmpLocalStorageColumns.push({ id: defaultcolumn.id, label: defaultcolumn.label });
      }

      // Push the mapped column to column Def.
      this.columnDefs.push(mappedColumn);

    });

    this.userTemplate.controls.forEach((element) => {

      if (tmpLocalStorageColumns.length > 0) {
        index = tmpLocalStorageColumns.length + 1;
      }
      else {
        index = index + 1;
      }

      let mappedColumn;
      if (element.type !== 'datepicker') {
        mappedColumn = {
          field: element.name,
          headerName: element.label,
          valueGetter: params => {
            if (params.data.user_metadata != null && params.data.user_metadata.controls != null) {
              // Format the column value based on the Type
              if (params.data.user_metadata.controls[element.name]) {
                return this.formatMetadata(element.name, params.data.user_metadata.controls[element.name]);
              } else {
                return params.data.user_metadata.controls[element.name];
              }
            }
          },
          sortable: true, sortingOrder: ['asc', 'desc'],
          filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
        };
      } else {
        mappedColumn = {
          field: element.name,
          headerName: element.label,
          valueGetter: params => {
            if (params.data.user_metadata != null && params.data.user_metadata.controls != null) {
              // Format the column value based on the Type
              if (params.data.user_metadata.controls[element.name]) {
                return this.formatMetadata(element.name, params.data.user_metadata.controls[element.name]);
              } else {
                return params.data.user_metadata.controls[element.name];
              }
            }
          },
          sortable: true, filter: 'agDateColumnFilter', sortingOrder: ['asc', 'desc'],
          filterParams: {
            buttons: ['reset', 'apply'], closeOnApply: true
            , comparator(filterLocalDateAtMidnight, cellValue) {
              const dateAsString = cellValue;

              if (dateAsString == null) {
                return 0;
              }

              // In the example application, dates are stored as dd/mm/yyyy
              // We create a Date object for comparison against the filter date
              const dateParts = dateAsString.split('/');
              const day = Number(dateParts[2]);
              const month = Number(dateParts[1]) - 1;
              const year = Number(dateParts[0]);
              const cellDate = new Date(day, month, year);

              // Now that both parameters are Date objects, we can compare
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              } else if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              } else {
                return 0;
              }
            }
          }
        };
      }
      if (mappedColumn) {
        if ((this.localStorageFilterColumns.length > 0) &&
          this.localStorageFilterColumns.find(colData => colData.id === element.name)) {
          this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: true });
          mappedColumn['hide'] = false;
        }
        else if ((this.localStorageFilterColumns.length > 0) &&
          !this.localStorageFilterColumns.find(colData => colData.id === element.name)) {
          this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: false });
          mappedColumn['hide'] = true;
        }
        else if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) ||
          (this.localStorageFilterColumns.length === 0)) {
          this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: true });
          mappedColumn['hide'] = false;
          tmpLocalStorageColumns.push({ id: element.name, label: element.label });
        }

        this.columnDefs.push(mappedColumn);
      }
    });

    this.columnDefs.push({
      field: 'Remove',
      cellRenderer: this.removeuser.bind(this),
    });

    if (this.authService.isSuperUser()){
      this.columnDefs.push({
        field: 'Reset Password',
        cellRenderer: this.resetPassword.bind(this),
      });
    }

    // Push to the Local Storage if not available
    if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) ||
      (this.localStorageFilterColumns.length === 0)) {
      localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(tmpLocalStorageColumns));
    }

    // Remove duplicate columns
    this.columnDefs = this.columnDefs.filter(
      (column, index, self) =>
        index ===
        self.findIndex((colAtIndex) => colAtIndex.field === column.field)
    );
  }

  formatMetadata(key, val) {
    if (val) {
      // Check whether the given value is array or not
      if (Array.isArray(val)) {
        return val.join(', ');
      }

      const name = key.split('\'')[0];
      const ctrl = this.userTemplate.controls.filter(data => data.name === name)[0];
      if (ctrl && ctrl.type !== 'label') {
        ctrl.value = val;
        return this.ControlsService.getControlValue(ctrl, false).replace(/<.*?>/g, '');
      } else {
        if (ctrl && ctrl.type === 'label') {
          return this.ControlsService.getControlValue(ctrl, true).replace(/<.*?>/g, '');
        }
      }
    }
  }

  // onGrid is Ready
  onGridReady(params) {
    this.gridAPI = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // onGrid Size Change
  gridSizeChanged(params) {
    this.gridAPI.sizeColumnsToFit();
  }

  // global search
  quickSearch() {
    this.gridAPI.setQuickFilter(this.searchValue);
  }

  // refresh grid
  refreshgrid() {
    this.searchValue = '';
    this.gridAPI.setQuickFilter('');
  }

  // open user details Model
  adminlink(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = params.data.name;
    eSpan.style.color = '#3c8dbc';
    eSpan.addEventListener('click', (e) => {
      this.EditUser(params.data.id);
    });
    return eSpan;
  }

  // delete user
  removeuser(params) {
    const button = document.createElement('button');
    button.className = 'btn btn-danger';
    button.innerHTML = 'Remove User';
    button.addEventListener('click', (e) => {
      this.removeUserFromTenant(params.data.id);
    });
    return button;
  }

  resetPassword(params) {
    const button = document.createElement('button');
    button.className = 'btn btn-default';
    button.innerHTML = 'Reset Password';
    button.addEventListener('click', (e) => {
      this.resetPasswordForTheUser(params.data.id);
    });
    return button;
  }

  // Remove User based on TenantId
  removeUserFromTenant(this, userid) {
    const dialogTitle = `Confirmation Required`;
    const message = `<strong>Do you want to remove this user?</strong> <br> <i>The user will no longer be able to access the ticketing system or be assigned to tickets.</i>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((dialogResult) => {
      this.result = dialogResult;
      if (this.result === true) {
        this.spinner.show();
        this.userService.removeUserFromTenant(this.tenantId, userid).subscribe(
          (res) => {
            this.getusers();
            this.authService.refreshToken().subscribe((restoken: any) => {
              localStorage.setItem('token', restoken.token);
              this.authService.fillAuthData();
              this.authService.setAuthdata();
              this.notifyService.showSuccessMessage(
                'User successfully removed',
                'Remove User'
              );
              this.spinner.hide();
            });
          },
          (error) => {
            this.notifyService.showErrorMessage(
              error.error.message,
              'Error removing user'
            );
            this.spinner.hide();
          }
        );
      }
    });
  }

  updateUsers(val) {
    this.usersUpdate.emit(val);
  }

  // get users
  getusers() {
    this.userService.getAllUsers(this.tenantId).subscribe(
      (response) => {
        this.currentUserData = response;
        this.updateUsers(response);
        let filteredData;
        filteredData = response;
        // Filtered data based on the role
        if (this.roleFilter && this.roleFilter !== undefined && this.roleFilter.length > 0) {
          filteredData = filteredData.filter(data => data.roleName === this.roleFilter);
        }
        this.rowData = filteredData;
        this.generateColumns(response);
      },
      (error) => {
        this.notifyService.showErrorMessage(
          error.error.message,
          'Error while getting users'
        );
      }
    );
  }

  // Remove user Confirmaion Dialog
  confirmDialog(): void {
    const dialogTitle = `Confirm Action`;
    const message = `Are you sure you want to do this?`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;
    const dialogData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((dialogResult) => {
      this.result = dialogResult;
    });
  }

  // redirecting to users fields page
  userFilelds() {
    this.router.navigate(['/' + this.tenantId + '/admin/user-controls']);
  }

  // Addin new user
  AddUser(): void {
    const dialogData = new AddUserDialogModel(this.userTemplate, this.tenantId, this.roles);
    const windowsHeight = window.innerHeight - 150;
    const dialogRef = this.dialog.open(AddUserModalComponent, {
      data: dialogData,
      width: '600px',
      minHeight: '300px',
      maxHeight: windowsHeight + 'px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
      if (dilgResult) {

        if (dilgResult.useradded) {
          this.notifyService.showSuccessMessage('User successfully added', 'Add User');
          this.getusers();
        } else {
          this.notifyService.showSuccessMessage('An invitation email will be sent to the user.', 'Add User');
          // ToDo: Refresh the Pending Users and Switch to Pending users tab
        }
      }
    });
  }

  // Edit the user based on the Tenant Id and User Id
  EditUser(selectedUserId): void {
    let user: any;
    this.userService.getUser(this.tenantId, selectedUserId).subscribe(response => {
      user = response;
      if (user) {
        const dialogData = new EditUserDialogModel(user, this.tenantId, this.roles);
        const windowsHeight = window.innerHeight - 150;
        const dialogRef = this.dialog.open(EditUserModalComponent, {
          data: dialogData,
          width: '600px',
          minHeight: '300px',
          maxHeight: windowsHeight + 'px'
        });

        dialogRef.afterClosed().subscribe(dialogResult => {
          const dilgResult = dialogResult;
          if (dilgResult) {
            this.notifyService.showSuccessMessage('User profile saved', 'Profile');
            this.getusers();
          }
        }, (error) => {
          this.notifyService.showErrorMessage(error.error.message, 'Error removing user');
        }
        );
      }
    }, erro => {
      console.log(erro);
    });
  }

  resetPasswordForTheUser(this, userId){

    this.accountService.getResetUrl(userId).subscribe(response => {
      let user = response;

      const dialogData = new ResetUserPasswordDialogModel (user, this.tenantId);
      const windowsHeight = window.innerHeight - 150;
      const dialogRef = this.dialog.open(ResetUserPasswordModalComponent, {
        data: dialogData,
        width: '600px',
        minHeight: '300px',
        maxHeight: windowsHeight + 'px'
      });

    }, erro => {
      console.log(erro);
    });

  }

}

