import { Component, OnInit } from '@angular/core';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import * as moment from 'moment';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddTenantComponent } from 'src/app/views/modals/add-tenant/add-tenant.component';
import { EditTenantComponent } from 'src/app/views/modals/edit-tenant/edit-tenant.component';
import { ConfirmationModalComponent } from 'src/app/views/modals/confirmation-modal/confirmation-modal.component';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';

import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-tenants',
  templateUrl: './tenants.component.html',
  styleUrls: ['./tenants.component.scss']
})
export class TenantsComponent implements OnInit {
  public columnDefs;
  public rowSelection;
  rowSelect;
  public autoGroupColumnDef;
  public defaultColDef;
  public rowData: any;
  public searchValue: any;
  private gridAPI;
  private gridCoulmnAPI;
  public paginationPageSized;
  public frameworkComponents;
  public resetConfirm;

  constructor(
    private suservice: SuServiceService, 
    private router: Router, 
    public tenantDialog: MatDialog,
    private toastrService: ToastrnotificationService, 
    private ngZone: NgZone,
    private gridSelectService: GridRowSelectService,
    ) {
      this.rowSelection = 'multiple';
      this.frameworkComponents = { tooltipComponent: TooltipComponent };
    }

  tiers = [
    { key: 0, label: 'Basic Tier' },
    { key: 1, label: 'Silver Tier' },
    { key: 2, label: 'Gold Tier' },
    { key: 3, label: 'Platinum Tier' },
  ];
  ngOnInit(): void {
    this.paginationPageSized = 20;
    this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);

    this.columnDefs = [
      this.rowSelect,
      {
        headerName: 'Admin', field: 'admin', cellRenderer: this.adminlink.bind(this), valueGetter: params => params.data.id,
      },
      {
        headerName: 'Edit', field: 'edit', cellRenderer: this.editTenant.bind(this)
      },
      {
        headerName: 'Reset Password Email', field: 'reset', cellRenderer: this.tenantResetEmail.bind(this)
      },
      {
        headerName: 'Name', field: 'name', sortable: true, valueGetter: params => params.data.name, sortingOrder: ['asc', 'desc'],
      },
      {
        headerName: 'Tier', field: 'tier', sortable: true, valueGetter: params => this.tiers[params.data.tier].label, sortingOrder: ['asc', 'desc'],
      },
      {
        headerName: 'users', field: 'users', sortable: true, valueGetter: params => Number(params.data.users),
        sortingOrder: ['asc', 'desc'],
      },
      {
        headerName: 'Tickets', field: 'tickets', sortable: true, valueGetter: params => Number(params.data.tickets),
      },
      {
        // tslint:disable-next-line: max-line-length
        headerName: 'Email Enabled?', field: 'emailenabled', sortable: true, valueGetter: params => params.data.tenantSettings.settings.emailNotification ? 'Yes' : 'No',
        sortingOrder: ['asc', 'desc'],
      },
      {
        headerName: 'Deleted?', field: 'deleted', sortable: true, valueGetter: params => params.data.deleted ? 'Yes' : 'No'
      },
      {
        // tslint:disable-next-line: max-line-length
        headerName: 'Created On', field: 'created', sortable: true,  comparator: dateComparator,
          valueGetter: params => params.data.created_at ? moment(params.data.created_at).format('L LT') : '',
          sortingOrder: ['asc', 'desc'],
      },
      {
        // tslint:disable-next-line: max-line-length
        headerName: 'Last Updated', field: 'lastupdated', sortable: true, comparator: dateComparator,
          valueGetter: params => params.data.updated_at ? moment(params.data.updated_at).format('l LT') : '',
          sortingOrder: ['asc', 'desc'],
      },
    ];
    this.defaultColDef = {
      flex: 1,
      cellClass: 'cell-wrap-text',
      autoHeight: true,
      sortable: true,
      resizable: true,
    };

  }

  tenantlink(tenant) {
    return '<a>View ({{tenant.id}})</a>';
  }

  onGridReady(params) {
    this.getTenants(params);
    this.gridAPI = params.api;
    this.gridCoulmnAPI = params.gridCoulmnAPI;
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

  // redirect to selected tenennt settings page
  adminlink(params) {
    const eSpan = document.createElement('a');
    eSpan.innerHTML = 'View (' + params.data.id + ')';
    eSpan.style.color = '#3c8dbc';
    eSpan.addEventListener('click', () => {
      if (!params.data.deleted){
        localStorage.setItem('viewtenant', JSON.stringify(params.data));
        const url = '/' + params.data.id + '/admin/settings';
        this.ngZone.run(() => {
          this.router.navigateByUrl(url);
        });
      }
    });
    return eSpan;
  }

  // edit tenant details
  editTenant(params) {
    const _THIS = this;
    const editbutton = document.createElement('button');
    editbutton.className = 'btn btn-primary tenant';
    editbutton.innerHTML = 'Edit';
    editbutton.addEventListener('click', () => {
      const dialogRef = this.tenantDialog.open(EditTenantComponent, {
        width: '640px',
        data: params
      });
      dialogRef.afterClosed().subscribe(dialogResult => {
        if(dialogResult === true){
          _THIS.getTenants(params);
        }
      });
    });
    return editbutton;
  }

  // Reset tenant email details
  tenantResetEmail(params) {
    const message = '<h3><b>SPAM Warning</b><br>This will send an email to every user of this tenant.<br>DO NOT USE if there are a large number of users on this tenant.<br><span class="caution">! ! Caution Required ! !</span></h3>';
    params.modalMessage = message;
    params.modalTitle = 'Confirmation Required';

    const editbutton = document.createElement('button');
    editbutton.className = 'btn btn-warning text-white';
    editbutton.innerHTML = 'Send';
    editbutton.addEventListener('click', () => {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.data = params;
      const dialogRef = this.tenantDialog.open(ConfirmationModalComponent, {
        maxWidth: '100%',
        data: dialogConfig
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult) {
          this.suservice.sendResetPasswordEmail(params.data.id).subscribe((response) => {
          this.toastrService.showSuccessMessage('Password resets have been sent.', 'Success');
          }, (error) => {
            console.log(error);
            let errorMessage = 'An error has occurred - ';
            errorMessage += error;
            this.toastrService.showWarningMessage(errorMessage, 'Error');
          });
        }
      });
    });
    return editbutton;
  }

  // get all tenants
  getTenants(params) {
    this.suservice.getAllTenants().subscribe((response) => {
      params.api.setRowData(response);
      // console.log(response);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  // open add tenant modal
  openAddDialog(): void {
    const dialogRef = this.tenantDialog.open(AddTenantComponent, {
      width: '640px',

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
