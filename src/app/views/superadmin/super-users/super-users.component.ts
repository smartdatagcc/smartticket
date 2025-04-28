import { Component, OnInit } from '@angular/core';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { TooltipComponent } from 'src/app/common/tooltip-component/tooltip-component.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { AddSuperUserComponent } from './add-super-user/add-super-user.component';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { GridRowSelectService } from 'src/app/services/grid-row-select-service/grid-row-select.service';

@Component({
  selector: 'app-super-users',
  templateUrl: './super-users.component.html',
  styleUrls: ['./super-users.component.scss']
})
export class SuperUsersComponent implements OnInit {
  public columnDefs;
  public rowSelection;
  rowSelect;
  frameworkComponents;
  public autoGroupColumnDef;
  public defaultColDef;
  public rowData: any;
  public searchValue: any;
  private gridAPI;
  private gridCoulmnAPI;
  public paginationPageSized;
  public tooltipShowDelay;

  constructor(
    private suservice: SuServiceService, 
    private router: Router, 
    public superuserDialog: MatDialog,
    private notifyService: ToastrnotificationService,
    private spinner: NgxSpinnerService,
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
    this.tooltipShowDelay = 0;
    this.gridSelectService.rowSelect.subscribe(r => this.rowSelect = r);

    this.columnDefs = [
      this.rowSelect,
      {
        headerName: 'Name', field: 'name', sortable: true, valueGetter: params => params.data.name,
        filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
      },
      {
        headerName: 'Email', field: 'email', sortable: true, valueGetter: params => params.data.email,
        tooltipField: 'email',
        filter: true, filterParams: { buttons: ['reset', 'apply'], closeOnApply: true }
      },
      {
        // tslint:disable-next-line: max-line-length
        headerName: 'Created On', field: 'created', sortable: true,  comparator: dateComparator,
          valueGetter: params => params.data.created_at ? moment(params.data.created_at).format('L LT') : '',
      },
      {
        // tslint:disable-next-line: max-line-length
        headerName: 'Last Updated', field: 'lastupdated', sortable: true, comparator: dateComparator,
          valueGetter: params => params.data.updated_at ? moment(params.data.updated_at).format('L LT') : '',
      },
      {
        headerName: '', field: 'revoke', cellRenderer: this.revokeSuperUser.bind(this)
      },
    ];
    this.defaultColDef = {
      flex: 1,
      cellClass: 'cell-wrap-text',
      autoHeight: true,
      sortable: true,
      resizable: true,
    };

    this.getSuperUsers();
  }

  onGridReady(params) {
    // this.getSuperUsers(params);
    this.gridAPI = params.api;
    this.gridCoulmnAPI = params.gridCoulmnAPI;
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

  // revoke Super User
  revokeSuperUser(params) {
    const revokebutton = document.createElement('button');
    revokebutton.className = 'btn btn-danger';
    revokebutton.innerHTML = 'Revoke';
    revokebutton.addEventListener('click', (e) => {
      this.revokeSuperUserFromTenant(params.data.id);
    });
    return revokebutton;
  }

  // get all super users
  getSuperUsers() {
    this.suservice.getAllSuperUsers().subscribe((response) => {
      // params.api.setRowData(response);
      this.rowData = response;
      // console.log(response);
    },
      (error) => {
        console.log(error);
        this.spinner.hide();
      }
    );
  }

  revokeSuperUserFromTenant(this, userid) {
    const dialogTitle = `Do you want to revoke this user's superuser access?`;
    const message = `The user will no longer be able to access super user dashboard or private tenants.`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRef = this.superuserDialog.open(
      ConfirmDialogComponent,
      {
        maxWidth: '600px',
        data: dialogData,
      }
    );

    dialogRef.afterClosed().subscribe(
      (dialogResult) => {
        this.resultRemove = dialogResult;
        if (this.resultRemove === true) {
          this.spinner.show();

          this.suservice.revokeSuperUser(userid).subscribe(
            (res) => {

              this.getSuperUsers();
              this.notifyService.showSuccessMessage(
                'SuperUser successfully removed',
                'Super User'
              );
              this.spinner.hide();
            },
            (error) => {
              this.notifyService.showErrorMessage(
                'Error removing super user',
                'Super User'
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

  // open add tenant modal
  openAddDialog(): void {
    const dialogRef = this.superuserDialog.open(AddSuperUserComponent, {
      width: '640px',

    });
    dialogRef.afterClosed().subscribe(
      (dialogResult) => {
        const emailToAdd = dialogResult;
        if (emailToAdd){
          this.suservice.addSuperUser(emailToAdd).subscribe((response) => {
            this.spinner.show();
            this.notifyService.showSuccessMessage('Super user successfully added', 'Success');
            this.getSuperUsers();
            this.spinner.hide();
          }, error => {
            this.notifyService.showErrorMessage(error.error.message, 'Error');
            this.spinner.hide();
          });
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
