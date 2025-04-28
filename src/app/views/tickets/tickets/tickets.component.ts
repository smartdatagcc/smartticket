import { CustomHeaderComponent } from './custom-header/custom-header.component';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import * as moment from 'moment';
import { UserProfileDialogComponent, UserProfileDialogModel } from '../user-profile-dialog/user-profile-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { find } from 'lodash';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';
import { UserService } from 'src/app/services/user-service/user.service';
import * as _ from 'underscore';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit, OnDestroy {
  tenantId: string;
  formId: number;
  statusId: number;
  toggleSetting: string;
  loggedInUserId: number;
  lookupdata: any;
  form: any;
  formName: string;
  formStatuses: any[];
  token: string;
  canViewAll: any;
  metadata: any[] = [];
  defaultColumns: any[];
  public columnDefs;
  public defaultColDef;
  private gridAPI;
  private gridColumnApi;
  public rowClassRules;
  public searchValue: any;
  paginationPageSize: 10;
  rowData;
  allSupportTickets: any[];
  filteredSupportTickets: any[];
  columns = [];
  checkedColumns = [];
  calculateBy: string;
  overDue: any;
  overDueDays: any;
  statusTypes: any[] = [];
  SampleDate = '2020-05-22T14:18:28.559Z';
  archivedTickets = false;
  deletedTickets = false;
  rowSelection;
  rowSelect;
  advanceFilterColumns: any[] = [];
  localStorageFilterColumns: any[] = [];
  localStorageNameForColumnFilters: string;
  notifications: any[] = [];
  tmplocalStorageColumns = [];
  selectedFormSubscription$: Subscription;
  gridOptions;
  frameworkComponents;
  currentPage = 1;
  totalPages = 0;
  formSubscription$: Subscription;
  statusSubscription$: Subscription;
  toggleSettingsSubscription$: Subscription;
  accountServiceGetNotificationUpdatedStatusSubscription$: Subscription;
  sortBySubscription$: Subscription;
  sortBy = '';
  sortByDirection = '';
  pageLimit = 100;
  filteredTickets: any[];
  validTenantUsers: any;
  isValidUser: boolean;

  constructor(
    private route: ActivatedRoute,
    private supportTicketsService: SupportTicketServiceService,
    private tosterService: ToastrnotificationService,
    private lookupService: LookupServiceService,
    private spinner: NgxSpinnerService,
    private location: Location,
    public authService: AuthService,
    private ControlsService: ControlsServiceService,
    private router: Router,
    public dialog: MatDialog,
    private accountService: AccountServiceService,
    private titleService: Title,
    private gridSelectService: GridRowSelectService,
    private userService: UserService
  ) {
    this.selectedFormSubscription$ = this.lookupService.getSelectedForm().subscribe(data => {
      this.dummycolums();
      if (data !== false) {
        if (this.formId !== +data.id) {
          this.clearColumnDataFromStorage();
        }
        this.archivedTickets = false;
        this.deletedTickets = false;
        this.statusId = null;
        this.formId = +data.id;
        this.form = data;
        this.resetTableData();
        this.rerenderFormData(data);
        this.lookupService.setSelectedFormID(data.id);
        this.lookupService.setSelectedFormName(data.name);
        localStorage.selectedForm = JSON.stringify(data);
      }

      this.currentPage = 1;

    });

    this.accountServiceGetNotificationUpdatedStatusSubscription$ = this.accountService.getNotificationUpdatedStatus().subscribe(data => {
      if (data === true && this.tenantId) {
        this.notifications = [];
        this.dummycolums();
        this.accountService.getNotifications(this.tenantId).subscribe((res) => {
          this.notifications = res;
        });
      }
    });

    this.toggleSettingsSubscription$ = this.lookupService.getToggleSetting().subscribe(data => {
      this.toggleSetting = data ? 'All' : 'My';
      this.rerenderFormData('');
    });

    this.rowSelection = 'multiple';

    this.frameworkComponents = { customHeaderComponent: CustomHeaderComponent, tooltipComponent: TooltipComponent };

  }

  ngOnInit(): void {
    this.clearColumnDataFromStorage();
    this.spinner.show();
    this.titleService.setTitle('Tickets');

    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      if (params.tenantId !== this.tenantId) {
        this.clearColumnDataFromStorage();
      }
      this.tenantId = params.tenantId;
    });

    // In case of refresh, and no tenantId set, try to find from the selectedForm
    if (this.tenantId === undefined && localStorage.getItem('selectedForm')) {
      let frm = JSON.parse(localStorage.getItem('selectedForm'));
      this.tenantId = frm.tenant_id;
    }

    // getting query parameters from url
    this.statusSubscription$ = this.route.queryParams.subscribe(params => {
      if (!!params.archived || !!params.deleted || (params.statusId && params.statusId !== this.statusId)) {
        this.archivedTickets = !!params.archived;
        this.deletedTickets = !!params.deleted;
        this.statusId = params.statusId ? params.statusId : null;
        this.dummycolums();
        this.resetTableData();
        this.rerenderFormData('');
      }
    });

    // Get logged in user Id
    this.loggedInUserId = this.authService.authentication.data.id;

    this.formSubscription$ = this.route.params.subscribe(params => {
      this.formId = params.formId;
      if (isNaN(params.formId)) {
        this.tosterService.showErrorMessage('Not Valid User Id, Moving to previous Form Id', 'Error');
        this.location.back();
      }
    });

    this.sortBySubscription$ = this.supportTicketsService.sortBy$.subscribe(sorter => {
      if (!this.sortByDirection || this.sortByDirection === 'desc' || sorter !== this.sortBy) {
        this.sortByDirection = 'asc';
      } else {
        this.sortByDirection = 'desc';
      }
      this.sortBy = sorter;
      localStorage.setItem('sortBy', sorter);
      localStorage.setItem('sortByDirection', this.sortByDirection);

      // trigger notification update request
      this.accountService.setNotificationUpdated();

      if (this.sortBy.length) {
        this.getPaginatedSupportTickets(
          +this.tenantId,
          +this.formId,
          +this.statusId,
          this.searchValue,
          this.currentPage,
          this.toggleSetting,
          this.sortBy
          )
      }
    });

    this.rerenderFormData('');

   this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);

  }

  ngOnDestroy() {
    this.selectedFormSubscription$.unsubscribe();
    this.formSubscription$.unsubscribe();
    this.statusSubscription$.unsubscribe();
    this.toggleSettingsSubscription$.unsubscribe();
    this.accountServiceGetNotificationUpdatedStatusSubscription$.unsubscribe();
    this.sortBySubscription$.unsubscribe();
  }

  resetTableData() {
    this.searchValue = '';
    this.currentPage = 1;
    this.sortBy = '';
    this.sortByDirection = '';
    localStorage.removeItem('sortByDirection');
    localStorage.removeItem('sortBy');
  }

  dummycolums() {
    this.columnDefs = [];
  }

  getFormIDFromURL() {
    this.route.params.subscribe(params => {
      this.formId = params.formId;
      if (isNaN(params.formId)){
        this.tosterService.showErrorMessage('Not Vaid User Id, Moving to previous Form Id', 'Error');
        this.location.back();
      }
    });
  }

  getNotification(tenantId) {
    this.accountService.getNotifications(tenantId).subscribe((res) => {
      this.notifications = res;
    });
  }

  isNotification(data) {
    const url = '/' + data.tenantId + '/ticket/' + data.formId + '/' + data.id;
    return find(this.notifications, function(n) { return n.url == url; });
  }

  // formId updated
  rerenderFormData(responsedata) {
    this.spinner.show();
    // Get the lookupdata
    this.lookupdata = this.lookupService.lookupdata;

    if (!!responsedata) {
      this.formId = responsedata.id;
    }

    // Get the current form details
    const formData = this.lookupdata.tenant.forms.filter(data => data.id === +this.formId);

    this.form = formData[0];
    if (this.form !== undefined) {
      this.formName = this.form.name;

      // Get the token from the Auth service
      this.token = 'Bearer ' + this.authService.authentication.token;

      // Check the permission required to View all or not
      this.canViewAll = this.authService.allowed(this.tenantId, 'CanManageTickets');

      // Get the default column details from the control service
      this.defaultColumns = this.ControlsService.getDefaultColumns();

      // Logic for older forms without ticket age
      if (!this.form.settings.details.calculateBy) {
        this.form.settings.details.calculateBy = 'created_at';
      }
      this.calculateBy = this.form.settings.details.calculateBy;
      this.overDue = this.form.settings.details.overDue;
      this.overDueDays = this.form.settings.details.overDueDays;

      // Forming the localStorage field name for the Advance column filters
      const userId = this.authService.authentication.data.id;
      this.localStorageNameForColumnFilters = 'ticketColumns_' + userId + '_' + this.formId + '_' + this.tenantId;

      // Get Form Statuses
      const _THIS = this;
      this.formStatuses = this.lookupdata.statusTypes.reduce(function (arr, statusType) {
        if (_THIS.form.statusTypes.statusIds.find(x => x.id === statusType.id)) {
          arr[statusType.id] = statusType;
        }
        return arr;
      }, {});

      // Get all Support Tickets from the database based on the Tenant ID
      if (this.tenantId !== undefined) {
        this.getPaginatedSupportTickets(
          +this.tenantId,
          +this.formId,
          +this.statusId,
          this.searchValue,
          this.currentPage,
          this.toggleSetting
        );
      }
    } else {
      this.spinner.hide();
    }
  }

  // Get valid tenant users
  getValidTenantUsers() {
    this.userService.getAssignableUsers(this.tenantId, this.formId).subscribe(data => {
      this.validTenantUsers = data;
    });
  }

  // get all tickets
  // getSupportTickets(tenantId) {
  //   this.supportTicketsService.getAllSupportTickets(tenantId).subscribe((data) => {
  //     this.supportTicketsService.storeData(data);
  //     this.filteredSupportTickets = this.getFilteredSupportTickets();
  //     this.rowData = this.filteredSupportTickets;
  //     this.columnDefs = [];
  //     this.generateColumns(this.filteredSupportTickets);
  //     this.rowClassRules = {
  //       unread: params => {
  //         const url = '/' + this.tenantId + '/ticket/' + params.data.formId + '/' + params.data.id;
  //         const isExist =  this.notifications.find(Notification => Notification.url === url);
  //         return isExist;
  //       }
  //     };
  //     this.spinner.hide();
  //   },
  //     (error) => {
  //       this.spinner.hide();
  //     }
  //   );
  // }

  getPaginatedSupportTickets(
    tenantId: number,
    formId: number,
    statusId: number,
    searchValue = this.searchValue || '',
    requestedPage: number,
    toggleSetting: string,
    sortBy = this.sortBy
  ) {
    this.getValidTenantUsers();
    this.supportTicketsService.getSupportTicketsWithPagination(
      tenantId,
      formId,
      statusId,
      searchValue,
      requestedPage,
      toggleSetting,
      sortBy,
      this.sortByDirection,
      this.pageLimit
    ).subscribe(data => {
      this.rowData = data;
      this.currentPage = requestedPage;
      this.generateColumns(this.rowData);
      this.rowClassRules = {
        unread: params => { return !!this.isNotification(params.data); }
      };
      localStorage.setItem('allTicketData', JSON.stringify(data));
      this.supportTicketsService.storeData(data);
      if (this.rowData.length) {
        this.calculatePages(+this.rowData[0].total, this.currentPage, this.pageLimit);
      } else {
        this.totalPages = 0;
      }
      this.spinner.hide();
    }, error => {
      console.log(error);
      this.spinner.hide();
    });
  }

  calculatePages(totalRows: number, currentPage: number, pageLimit: number) {
    this.totalPages = Math.ceil(totalRows / pageLimit);
  }

  // check all and uncheck all
  showHideAllColumns(e, status) {
    let showHideArray = [];
    const localStorageColumns = [];

    this.advanceFilterColumns.map(column => {
      column.value = status;
      if (status) {
        localStorageColumns.push({ id: column.name });
      }
    });

    localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(localStorageColumns));

    showHideArray = this.gridColumnApi.getAllColumns().map((column, idx) => {
      if (!!idx) {
        return column.colId;
      }
    });

    this.localStorageFilterColumns = [];

    this.gridColumnApi.setColumnsVisible(showHideArray, status);
    e?.stopPropagation();
  }

  // Show And hide Name
  showHideColumn(e, show) {
    const name = show.name;
    const value = show.value === true ? false : true;
    this.advanceFilterColumns.map(column => {
      if (column.id === show.id) {
        column.value = value;
      }
    });

    // Update Local Storage if any column is removed or added in the Advance Filters
    if (localStorage.getItem(this.localStorageNameForColumnFilters)) {
      let localStorageColumns = JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters));
      if (value && !localStorageColumns.find(column => column.id === name)) {
        localStorageColumns.push({ id: show.name });
      } else {
        localStorageColumns = localStorageColumns.filter(column => column.id !== show.name);
      }
      localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(localStorageColumns));
    }

    // Hide column using API, taking into account the '_1' that is sometimes included:
    this.gridColumnApi.getAllColumns().forEach(column => {
      if (column.colId === show.name || column.colId === show.name + '_1') {
        this.gridColumnApi.setColumnVisible(column.colId, value)
      }
    })

    this.columnDefs.filter(def => {
      return JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters)).find(column => {
        return column.id === def.field || def.field === 'id';
      })
    })

    e.stopPropagation();
  }

  onGridReady(params) {
    this.gridAPI = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // onGrid Size Change
  gridRerender(params) {
    this.gridAPI = params.api;
    this.gridColumnApi = params.columnApi;
    this.removeUnneededDefaultColumns();
  }

  removeUnneededDefaultColumns() {
    // Prevent default columns from showing when all columns are unchecked.
    if (
      this.gridColumnApi.getAllColumns().length
      && this.getLocalStorageColumns()
      && !this.getLocalStorageColumns().length
    ) {
      this.showHideAllColumns(null, false);
    }
  }

  generateColumns(data) {
    this.advanceFilterColumns = [];
    this.tmplocalStorageColumns = [];
    let index: number;

    if (localStorage.getItem(this.localStorageNameForColumnFilters)) {
      this.localStorageFilterColumns = JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters));
    }

    this.columnDefs = [
      this.rowSelect,
      {
        headerName: 'Ticket Id',
        field: 'id',
        sortable: true, resizable: true,
        valueGetter: params => params.data.id,
        cellStyle: { 'text-align': 'center'},
        cellRenderer: this.ticketlink.bind(this),
        tooltipValueGetter: (params) => '' + params.data.id, sortingOrder: ['asc', 'desc'],
        filter: true,
        filterParams: {
          buttons: ['reset', 'apply'],
          closeOnApply: true
        },
        initialWidth: 115,
        width: 115
      },
    ];

    if (this.form.ticketTemplate !== undefined) {
      this.form.ticketTemplate.controls.forEach((element, idx) => {
        if (!element.adminOnly || this.canViewAll && element.adminOnly) {
          if (element.type !== 'signature') {
            // Filter the columns, which are not available in the form's default grid columns list
            const defaultColumn = (this.form.settings.defaultGridColumns
              ?
              this.form.settings.defaultGridColumns.filter(column => column.name === element.name)[0]
              :
              '');
            if (defaultColumn === '' || (defaultColumn && defaultColumn.selected === true && defaultColumn !== '')) {
              this.addGridColumns(element, idx);
            }
          }
        }
      });
    }

    // Looping the Deafault Columns
    this.defaultColumns.forEach(defaultcolumn => {
      // Filter the columns, which are not available in the form's default grid columns list
      const requiredColumn = this.form?.settings.defaultGridColumns
        ?
        this.form.settings.defaultGridColumns.filter(column => column.name === defaultcolumn.id)[0]
        :
        '';
      if (requiredColumn === '' || (requiredColumn && requiredColumn.selected === true && requiredColumn !== '')) {
        let mappedColumn;
        switch (defaultcolumn.id) {
          case 'created_at': {
            mappedColumn = {
              field: defaultcolumn.id,
              headerName: defaultcolumn.label,
              valueGetter: params =>
                this.getTransformDate(params.data.created_at),
              onCellClicked: this.onCellClicked.bind(this),
              cellRenderer: this.created_at_label.bind(this),
              sortingOrder: ['asc', 'desc'],
              sortable: true, resizable: true,
              filter: true,
              filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
            };
            break;
          }
          case 'updated_at': {
            mappedColumn = {
              field: defaultcolumn.id,
              headerName: defaultcolumn.label,
              valueGetter: params =>
                this.getTransformDate(params.data.updated_at),
              onCellClicked: this.onCellClicked.bind(this),
              cellRenderer: this.updated_at_label.bind(this),
              sortingOrder: ['asc', 'desc'],
              sortable: true, resizable: true,
              filter: true,
              filterParams: {
                buttons: ['reset', 'apply'],
                closeOnApply: true
              }
              };
            break;
          }
          case 'ticketAge': {
            const fieldName = this.calculateBy;
            if (fieldName === 'created_at') {
              mappedColumn = {
                field: defaultcolumn.id,
                headerName: defaultcolumn.label,
                valueGetter: params =>
                  this.getTransformAge(params.data.created_at),
                onCellClicked: this.onCellClicked.bind(this),
                cellRenderer: this.TicketAge_label.bind(this),
                sortingOrder: ['asc', 'desc'],
                sortable: true, resizable: true, filter: true,
                filterParams: {
                  buttons: ['reset', 'apply'],
                  closeOnApply: true
                }
              };
            } else if (fieldName === 'updated_at') {
              mappedColumn = {
                field: defaultcolumn.id,
                headerName: defaultcolumn.label,
                valueGetter: params =>
                  this.getTransformAge(params.data.updated_at),
                onCellClicked: this.onCellClicked.bind(this),
                cellRenderer: this.TicketAge_label.bind(this),
                sortingOrder: ['asc', 'desc'],
                sortable: true, resizable: true, filter: true,
                filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
              };
            }
            break;
          }
          case 'createdUserName': {
            mappedColumn = {
              field: defaultcolumn.id,
              headerName: defaultcolumn.label,
              valueGetter: params => params.data.createdUserName,
              cellRenderer: this.createdUser_link.bind(this),
              sortingOrder: ['asc', 'desc'],
              sortable: true, resizable: true, filter: true,
              filterParams: {
                buttons: ['reset', 'apply'],
                closeOnApply: true
              }
            };
            break;
          }
          case 'assignedUserName': {
            mappedColumn = {
              field: defaultcolumn.id,
              headerName: defaultcolumn.label, valueGetter: params => params.data.assignedUserName,
              cellRenderer: this.assignedUser_link.bind(this),
              sortingOrder: ['asc', 'desc'],
              sortable: true, resizable: true, filter: true,
              filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
            };
            break;
          }
          case 'status': {
            mappedColumn = {
              field: defaultcolumn.id,
              headerName: defaultcolumn.label,
              valueGetter: params => this.getStatus(params.data.statusType),
              cellRenderer: this.statusOrder_label.bind(this),
              sortingOrder: ['asc', 'desc'],
              onCellClicked: this.onCellClicked.bind(this),
              sortable: true, resizable: true, filter: true,
              filterParams: {
                buttons: ['reset', 'apply'],
                closeOnApply: true
              }
            };
            break;
          }
        }

        this.columnDefs.push(mappedColumn);

        if (this.tmplocalStorageColumns.length > 0) {
          index = this.tmplocalStorageColumns.length + 1;
        }
        else if (this.advanceFilterColumns.length > 0) {
          // Getting the last element id value and increasing to one
          index = this.advanceFilterColumns[this.advanceFilterColumns.length - 1].id + 1;
        }
        else {
          index = index + 1;
        }

        if (this.localStorageFilterColumns && !this.localStorageFilterColumns?.length) {
          this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: false });
        } else if ((this.localStorageFilterColumns?.length)
          && this.localStorageFilterColumns?.find(colData => colData.id === defaultcolumn.id)) {
            this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: true });
            mappedColumn.hide = false;
        }
        else if ((this.localStorageFilterColumns?.length)
          && !this.localStorageFilterColumns?.find(colData => colData.id === defaultcolumn.id)) {
          this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: false });
          mappedColumn.hide = true;
        }
        else if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) ||
          (!this.localStorageFilterColumns?.length)) {
            this.advanceFilterColumns.push({ id: index, name: defaultcolumn.id, label: defaultcolumn.label, value: true });
            mappedColumn.hide = false;
            this.tmplocalStorageColumns.push({ id: defaultcolumn.id });
        }

        this.columnDefs.push(mappedColumn);
      }
    });


    // Push to the Local Storage if not available
    if (!localStorage.getItem(this.localStorageNameForColumnFilters)) {
      localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(this.tmplocalStorageColumns));
    }

    // Remove duplicate columns
    this.columnDefs = this.columnDefs.filter((column, index, self) =>
      index === self.findIndex((colAtIndex) => (
        colAtIndex.field === column.field
      ))
    );
    this.getFormIDFromURL();
    // add custom header to each component

    this.columnDefs.forEach(def => def.headerComponentFramework = CustomHeaderComponent);

    localStorage.setItem(this.localStorageNameForColumnFilters, JSON.stringify(
      this.advanceFilterColumns.filter(col => col.value === true)
        .map(col => { return { id: col.name } })
    ));
  
    this.advanceFilterColumns.forEach(col => this.gridColumnApi?.setColumnVisible(col.name, col.value));
  }

  getLocalStorageColumns() {
    if (localStorage.getItem(this.localStorageNameForColumnFilters)) {
      return JSON.parse(localStorage.getItem(this.localStorageNameForColumnFilters));
    }
  }

  addGridColumns(element, index) {
    let mappedColumn;
    if (element.type !== 'datepicker') {
      mappedColumn = {
        field: element.name,
        headerName: element.label,
        onCellClicked: this.onCellClicked.bind(this),
        valueGetter: params => {
          return this.formatMetadata(element.name, params.data.metadata.controls[element.name]);
        },
        sortable: true, resizable: true,
        sortingOrder: ['asc', 'desc'],
        filter: true,
        filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
      };
    } else {
      mappedColumn = {
        field: element.name,
        headerName: element.label,
        onCellClicked: this.onCellClicked.bind(this),
        valueGetter: params => {
          return this.formatMetadata(element.name, params.data.metadata.controls[element.name]);
        },
        sortable: true, resizable: true,
        filter: 'agDateColumnFilter',
        sortingOrder: ['asc', 'desc'],
        filterParams: {
          buttons: ['reset', 'apply'],
          closeOnApply: true,
          comparator(filterLocalDateAtMidnight, cellValue) {
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

    if ((this.localStorageFilterColumns?.length > 0) &&
      this.localStorageFilterColumns?.find(colData => colData.id === element.name)) {
      this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: true });
      mappedColumn.hide = false;
    }
    else if ((this.localStorageFilterColumns?.length > 0) &&
      !this.localStorageFilterColumns?.find(colData => colData.id === element.name)) {
      this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: false });
      mappedColumn.hide = true;
    } else if (this.localStorageFilterColumns && !this.localStorageFilterColumns?.length) {
      this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: false });
      mappedColumn.hide = true;
    }
    else if ((!localStorage.getItem(this.localStorageNameForColumnFilters)) || (!this.localStorageFilterColumns?.length)) {
      this.advanceFilterColumns.push({ id: index, name: element.name, label: element.label, value: true });
      mappedColumn.hide = false;
      this.tmplocalStorageColumns.push({ id: element.name });
    }

    this.columnDefs.push(mappedColumn);
  }

  clearColumnDataFromStorage() {
    const keys = Object.keys(localStorage).filter(key => key.includes('ticketColumn'));
    keys.forEach(key => {
      localStorage.removeItem(key);
    })
    this.localStorageFilterColumns = null;
  }
  // global search
  quickSearch(event) {
    // this.gridAPI.setQuickFilter(this.searchValue);
    if (event.keyCode === 13) {
      this.getPaginatedSupportTickets(
        +this.tenantId,
        +this.formId,
        +this.statusId,
        this.searchValue,
        1,
        this.toggleSetting
      )
    }
  }

  submitSearch() {
    this.getPaginatedSupportTickets(
      +this.tenantId,
      +this.formId,
      +this.statusId,
      this.searchValue,
      1,
      this.toggleSetting
    )
  }
  // refresh grid
  refreshGrid() {
    this.searchValue = '';
    this.gridAPI.setQuickFilter('');
    this.getPaginatedSupportTickets(
      +this.tenantId,
      this.formId,
      this.statusId,
      this.searchValue,
      this.currentPage,
      this.toggleSetting,
      this.sortBy
    )
  }

  getFilteredSupportTickets(): any[] {
    this.allSupportTickets = this.supportTicketsService.allSupportTickets;
    if (this.allSupportTickets !== undefined) {
      if (this.statusId) {
        if (this.toggleSetting === 'All') {
          return this.allSupportTickets.filter(item => item.formId == this.formId && item.statusType == this.statusId
            && item.archived == false && item.deleted == false);
        } else {
          return this.allSupportTickets.filter(item => item.formId == this.formId && item.statusType == this.statusId
            && (item.createdBy == this.loggedInUserId || item.assignedTo == this.loggedInUserId)
            && item.archived == false && item.deleted == false);
        }
      } else if (this.archivedTickets === true) {
        if (this.toggleSetting === 'All') {
          return this.allSupportTickets.filter(item => item.formId == this.formId && item.archived == true);
        } else {
          return this.allSupportTickets.filter(item => item.formId == this.formId &&
            (item.createdBy == this.loggedInUserId || item.assignedTo == this.loggedInUserId)
            && item.archived == true);
        }
      } else if (this.deletedTickets === true) {
        if (this.toggleSetting === 'All') {
          return this.allSupportTickets.filter(item => item.formId == this.formId && item.deleted == true);
        } else {
          return this.allSupportTickets.filter(item => item.formId == this.formId
            && (item.createdBy == this.loggedInUserId || item.assignedTo == this.loggedInUserId)
            && item.deleted == true);
        }
      } else {
        if (this.toggleSetting === 'All') {
          return this.allSupportTickets.filter(item => item.formId == this.formId && item.archived == false && item.deleted == false);
        } else {
          return this.allSupportTickets.filter(item => item.formId == this.formId
            && (item.createdBy == this.loggedInUserId || item.assignedTo == this.loggedInUserId)
            && item.archived == false && item.deleted == false);
        }
      }
    }
  }

  getStatus(id) {
    const status = this.lookupdata.statusTypes.filter(item => item.id === id)[0];

    if (status.name.length > 10) {
      status.name = status.name.substring(0, 10) + '...';
    }
    return status.name;
  }

  formatMetadata(key, val) {
    // const name = key.split('\'')[0];
    const ctrl = this.form.ticketTemplate.controls.filter(data => data.name === key)[0];
    if (ctrl && ctrl.type !== 'label') {
        if (ctrl.type === 'textarea' && val !== null && val !== '' && val !== undefined){
          ctrl.value = val.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ');
        }else{
          ctrl.value = val;
        }
        const value = this.ControlsService.getControlValue(ctrl, false);
        return value;
    } else {
      if (ctrl && ctrl.type === 'label') {
        let value = this.ControlsService.getControlValue(ctrl, true);
        if (value !== null && value !== '' && value !== undefined){
           value = value.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ');
        }else{
          value = value;
        }
        return value;
      }
    }
    return this.ControlsService.getControlValue(ctrl, false).replace(/<.*?>/g, '');
  }

  // getstatus based on statusid
  getStatusTypes(statusid): any {
    return this.lookupdata.statusTypes.filter(data => data.id === statusid)[0];
  }

  // open ticket
  ticketlink(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = params.data.id;
    eSpan.style.color = '#3c8dbc';
    const keyTenantId = params.data.tenantId;
    const keyFormId = params.data.formId;
    const keyId = params.data.id;
    const path = keyTenantId + '/ticket/' + keyFormId + '/' + keyId;
    eSpan.addEventListener('click', (e) => {
      this.router.navigate([path]);
    });
    return eSpan;
  }

  // onclickk ag-grid row
  onCellClicked(event: any) {
    const keyTenantId = event.data.tenantId;
    const keyFormId = event.data.formId;
    const keyId = event.data.id;
    const path = keyTenantId + '/ticket/' + keyFormId + '/' + keyId;
    this.router.navigate([path]);
  }

  // Created at
  created_at_label(params) {
    const eSpan = document.createElement('span');
    eSpan.innerHTML = this.getTransformDate(params.data.created_at);
    return eSpan;
  }

  // Updated at
  updated_at_label(params) {
    const eSpan = document.createElement('span');
    eSpan.innerHTML = this.getTransformDate(params.data.updated_at);
    return eSpan;
  }

  // Ticket Age

  TicketAge_label(params) {
    const fieldName = this.calculateBy;
    let ticketAge;
    const eSpan = document.createElement('span');
    if (fieldName === 'created_at') {
      eSpan.innerHTML = this.getTransformAge(params.data.created_at).toString();
      ticketAge = this.getTransformAge(params.data.created_at);
    } else if (fieldName === 'updated_at') {
      eSpan.innerHTML = this.getTransformAge(params.data.updated_at).toString();
      ticketAge = this.getTransformAge(params.data.updated_at);
    }

    const daysIndex = ticketAge.indexOf('days');
    let ticketAgeNumber;
    if (daysIndex > -1) {
      ticketAgeNumber = ticketAge.substring(0, daysIndex - 1);
      if (ticketAgeNumber > 0) {
        if (this.overDue && ticketAgeNumber > this.overDueDays) {
          eSpan.className = 'text-danger';
        }
      }
    }
    return eSpan;
  }

  // Created User
  createdUser_link(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = params.data.createdUserName;
    eSpan.style.color = '#3c8dbc';
    eSpan.addEventListener('click', () => {
      this.ShowUserProfileDialog(this.tenantId, params.data.createdBy);
    });
    return eSpan;
  }

  // Assigned User
  assignedUser_link(params) {
    if (this.validTenantUsers !== undefined) {  // this should no longer be
      let allValidTenantUserIds = this.validTenantUsers.map(({ id }) => id);
      if (allValidTenantUserIds.includes(params.data.assignedTo)) {
        const eSpan = document.createElement('a');
        eSpan.style.color = '#3c8dbc';
        eSpan.innerHTML = params.data.assignedUserName;
        eSpan.addEventListener('click', () => {
          this.ShowUserProfileDialog(this.tenantId, params.data.assignedTo);
        });
        return eSpan;
      } else {
        const eSpan = document.createElement('p');
        eSpan.style.color = '#fc0f03';
        eSpan.innerHTML = params.data.assignedTo != null ?
          params.data.assignedUserName + ' ' + '(Removed)' :
          'Unassigned';
        return eSpan;
      }
    }
  }

  // Status Order
  statusOrder_label(params) {
    const eSpan = document.createElement('span');
    eSpan.innerHTML = '<i class="fa fa-circle" style="color:' + this.getStatusTypes(params.data.statusType).color + '"></i>'
      + ' ' + this.getStatus(params.data.statusType);
    return eSpan;
  }

  getTransformDate(value: any) {
    if (!value) {
      return '';
    }
    const momentDate = moment(value);
    // is today
    if (momentDate.isSame(new Date(), 'day')) {
      return 'Today ' + momentDate.format('h:mm a');
    }
    // is this year
    if (momentDate.isSame(new Date(), 'year')) {
      return momentDate.format('MMM Do');
    }

    return momentDate.format('MMM Do YYYY');
  }

  getTransformAge(value: any, args?: any) {
    if (!value) {
      return '';
    }
    const momentDate = moment(value);
    if (args !== undefined && args === 'days') {
      return moment().diff(momentDate, 'days');
    }
    else {
      // is today
      if (momentDate.isSame(new Date(), 'day')) {
        const m = moment().diff(momentDate, 'minutes');
        if (m === 0) {
          return moment().diff(momentDate, 'seconds') + ' seconds';
        }
        if (m < 60) {
          return m + ' minutes';
        }
        if (m > 60) {
          return moment().diff(momentDate, 'hours') + ' hours';
        }
      }
      else {
        const d = moment().diff(momentDate, 'days');
        if (d === 0) {
          return moment().diff(momentDate, 'hours') + ' hours';
        }
        if (d > 0) {
          return d + ' days';
        }
      }
    }
  }

  ShowUserProfileDialog(tenantId, userid): void {

    const dialogData = new UserProfileDialogModel(userid, tenantId);
    const windowsHeight = window.innerHeight - 150;
    const dialogRef = this.dialog.open(UserProfileDialogComponent, {
      data: dialogData,
      width: '600px',
      maxHeight: windowsHeight + 'px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
    });
  }

  onBtnExport() {
    // Get selected rows - TODO
    var selectedRows = this.gridAPI.getSelectedRows();
    const params = this.getParams();
    const columnHeaders =
      JSON.stringify(
        JSON.parse(
          localStorage.getItem(this.localStorageNameForColumnFilters))
          .map(column => column.id));

    this.supportTicketsService.getCSV(
      +this.tenantId,
      +this.formId,
      +this.statusId,
      this.searchValue,
      this.currentPage,
      this.toggleSetting,
      this.sortBy,
      this.sortByDirection,
      columnHeaders,
    ).subscribe(data => {
      if(window.navigator.msSaveOrOpenBlob) {
        //IE11 & Edge, download function
        window.navigator.msSaveOrOpenBlob(new Blob([data], { type: 'text/csv' }), this.form.name + '.csv'); 
    } else {
      const blob = new Blob([data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.form.name + '.csv';
      link.click();
    }
  });
}

  getParams() {
    const formName = this.form.name;
    return {
      suppressQuotes: false,
      columnSeparator: ',',
      fileName: formName + '.csv'
    };
  }

  // pagination controls:
  pagination(instance: string) {
    let requestedPage: number;
    if (instance === 'first') {
      requestedPage = 1;
    } else if (instance === 'last') {
      requestedPage = this.totalPages;
    } else if (instance === 'previous') {
      requestedPage = this.currentPage - 1;
    } else {
      requestedPage = this.currentPage + 1;
    }
    this.getPaginatedSupportTickets(
      +this.tenantId,
      +this.formId,
      +this.statusId,
      this.searchValue,
      requestedPage,
      this.toggleSetting
    );
  }
}
