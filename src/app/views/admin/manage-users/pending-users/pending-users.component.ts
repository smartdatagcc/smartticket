import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import {
  ConfirmDialogModel,
  ConfirmDialogComponent,
} from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { MatDialog } from '@angular/material/dialog';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import * as _ from 'underscore';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { AddUserDialogModel, AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';
declare var $: any;
@Component({
  selector: 'app-pending-users',
  templateUrl: './pending-users.component.html',
  styleUrls: ['./pending-users.component.scss'],
})
export class PendingUsersComponent implements OnInit {

  columnDefs;
  rowData;
  rowSelection;
  rowSelect;
  frameworkComponents;
  defaultRole;
  tenantId: number;
  userTemplate: any;
  roles: any;
  public paginationPageSized;
  private gridAPI;
  public searchValue: any;
  private gridColumnApi;
  lookupData: any;
  resultRemove: boolean;
  advanceFilterColumns: any[] = [];
  localStorageFilterColumns: any[] = [];
  localStorageNameForColumnFilters: string;
  loggedInUserId: number;
  defaultColumns: any[];
  public tooltipShowDelay;

  @Input() currentUserData;
  @Input() Userroles;

  constructor(
    private userService: UserService,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog,
    private lookupService: LookupServiceService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private ControlsService: ControlsServiceService,
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

    // Setting up the default columns
    this.defaultColumns = [
      { id: 'role', label: 'Pending Role' },
      { id: 'created', label: 'Created On' },
      { id: 'updated', label: 'Updated On' }
    ];

    this.lookupData = this.lookupService.lookupdata;
    this.userTemplate = this.lookupData.tenant.userTemplate || { controls: [] };

    if (this.tenantId) {
      this.lookupService.getRoles(this.tenantId).subscribe(data => {
        this.roles = data;
      });
    }

    // Getting the login user name
    this.loggedInUserId = this.authService.authentication.data.id;

    // Setting up the Local Storage Name for the Advance filters
    this.localStorageNameForColumnFilters = 'pending_users_' + this.loggedInUserId + '_' + this.tenantId;
    this.getpendingusers();
    this.paginationPageSized = 20;
    this.tooltipShowDelay = 0;
    this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);
  }




  addUserRoleName(pendingUsers, userroles) {
    _.each(pendingUsers, (pendingUser) => {
      if (pendingUser['role_id']) {
        const role = _.find(userroles, { id: pendingUser['role_id'] });
        if (role) {
          pendingUser['role'] = role['name'];
        } else {
          pendingUser['role'] = _.find(userroles, { default: true })['name'];
        }
      } else {
        pendingUser['role'] = _.find(userroles, { default: true })['name'];
      }
    });
    return pendingUsers;
  }




  // check all and uncheck all the columns
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

  // Show And hide column
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
        headerName: 'Email', field: 'email', sortable: true, valueGetter: params => params.data.email
        , tooltipField: 'email', sort: 'asc', sortingOrder: ['asc', 'desc']
        , filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
      },
    ];

    // Looping the Deafault Columns
    this.defaultColumns.forEach(defaultcolumn => {
      let mappedColumn = {};
      switch (defaultcolumn.id) {
        case 'role': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, valueGetter: params => params.data.role,
            sortingOrder: ['asc', 'desc'],
            sortable: true, filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
          };
          break;
        }
        case 'created': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label
            , valueGetter: params => params.data.created_at ? moment(params.data.created_at).format('L LT') : ''
            , sortable: true, sortingOrder: ['asc', 'desc']
            , comparator: dateComparator
          };
          break;
        }
        case 'updated': {
          mappedColumn = {
            field: defaultcolumn.id, headerName: defaultcolumn.label, sortingOrder: ['asc', 'desc']
            , valueGetter: params => params.data.updated_at ? moment(params.data.updated_at).format('L LT') : ''
            , sortable: true // , filter: true , filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
            , comparator: dateComparator
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
          sortingOrder: ['asc', 'desc'],
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
          sortable: true,
          filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
        };
      } else {
        mappedColumn = {
          field: element.name,
          headerName: element.label,
          sortingOrder: ['asc', 'desc'],
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
          sortable: true
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
      field: 'Resend Invite Email',
      cellRenderer: this.resendInviteEmail.bind(this),
    });
    this.columnDefs.push({
      field: 'Remove',
      cellRenderer: this.removependinguser.bind(this),
    });

    // Push to the Local Storage if not available
    if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) ||
      (this.localStorageFilterColumns.length === 0)) {
      localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(tmpLocalStorageColumns));
    }

    // Remove duplicate columns
    this.columnDefs = this.columnDefs.filter(
      (column, columnIndex, self) =>
        columnIndex ===
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
    eSpan.addEventListener('click', (e) => {
      console.log(this);
    });
    return eSpan;
  }

  // resend Invite Email
  resendInviteEmail(params) {
    const button = document.createElement('button');
    button.className = 'btn btn-default';
    button.style.textJustify = 'true';
    button.innerHTML = 'Resend Invite Email';
    button.addEventListener('click', (e) => {
      this.resendInvite(params.data.id);
    });
    return button;
  }

  resendInvite(this, pendingUserId) {
    this.spinner.show();
    this.userService.resendInvite(this.tenantId, pendingUserId).subscribe(
      (result: any) => {
        this.notifyService.showSuccessMessage('User invite resent', 'Invite');
        this.spinner.hide();
      },
      (error) => {
        this.notifyService.showErrorMessage(
          error.data.message,
          'Error Sending Invite Email'
        );
        this.spinner.hide();
      }
    );
  }

  // delete user
  removependinguser(params) {
    const button = document.createElement('button');
    button.className = 'btn btn-danger';
    button.innerHTML = 'Remove User';
    button.addEventListener('click', (e) => {
      this.removePendingUserFromTenant(params.data.id);
    });
    return button;
  }

  removePendingUserFromTenant(this, userid) {
    const dialogTitle = `Confirmation Required`;
    const message = `<strong>Do you want to remove this user?</strong>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogPendingUserData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRefPendingUser = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '600px',
        data: dialogPendingUserData,
      }
    );

    dialogRefPendingUser.afterClosed().subscribe(
      (dialogPResult) => {
        this.resultRemove = dialogPResult;
        if (this.resultRemove === true) {
          this.spinner.show();
          this.userService.removePendingUser(this.tenantId, userid).subscribe(
            (res) => {
              this.getpendingusers();
              this.notifyService.showSuccessMessage(
                'Pending user successfully removed',
                'Pending User'
              );
              this.spinner.hide();
            },
            (error) => {
              this.notifyService.showErrorMessage(
                'Error removing pending user',
                'Pending User'
              );
              this.spinner.hide();
            }
          );
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  // get pending users
  getpendingusers() {
    this.userService.getAllPendingUsers(this.tenantId).subscribe(
      (response) => {
        this.rowData = response;
        this.addUserRoleName(this.rowData, this.Userroles);
        this.generateColumns(response);
        this.gridAPI.sizeColumnsToFit();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  confirmDialog(): void {
    const dialogTitle = `Confirmation Required`;
    const message = `<strong>Do you want to remove this user?</strong>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogPendingUserData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRefPendingUser = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '600px',
        data: dialogPendingUserData,
      }
    );

    dialogRefPendingUser.afterClosed().subscribe((dialogPResult) => {
      this.resultRemove = dialogPResult;
    });
  }

  AddUser(): void {
    const dialogData = new AddUserDialogModel(this.userTemplate, this.tenantId, this.Userroles);
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
        } else {
          this.notifyService.showSuccessMessage('An invitation email will be sent to the user.', 'Add User');
          // ToDo: Refresh the Pending Users and Switch to Pending users tab
        }
        this.getpendingusers();
      }
    });
  }

}


function dateComparator(date1, date2) {
  const date1Number = monthToComparableNumber(date1);
  const date2Number = monthToComparableNumber(date2);
  if (date1Number === null && date2Number === null) {
    return 0;
  }
  if (date1Number === null) {
    return -1;
  }
  if (date2Number === null) {
    return 1;
  }
  return date1Number - date2Number;
}

function monthToComparableNumber(date) {
  if (date === undefined || date === null || date.length < 17) {
    return null;
  }
  return Date.parse(date);
}