import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { NgForm } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-import-tickets',
  templateUrl: './import-tickets.component.html',
  styleUrls: ['./import-tickets.component.scss']
})
export class ImportTicketsComponent implements OnInit {

  tenantId: any;
  lookupData: any;
  roles: any;
  users: any;
  forms: any;
  manageTicketEnabledRoles: any;
  manageTicketEnabledUsers: any;
  exampleCSV: any;
  exampleBase: any;
  example: any;
  selectedFormID: number;
  clearExisting = true;
  file: any;
  defaultUser: any;
  results: any[] = [];
  @ViewChild('importTicketsForm') importTicketsForm: any;

  constructor(private route: ActivatedRoute,
    private lookupService: LookupServiceService,
    private notifyService: ToastrnotificationService,
    private userService: UserService,
    public dialog: MatDialog,
    private controlsService: ControlsServiceService,
    private SupportTicketService: SupportTicketServiceService,
    private titleService: Title,
    private spinner: NgxSpinnerService) { }

  CanDeactivate(): any {
    if (this.importTicketsForm.form.dirty || this.importTicketsForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }
  ngOnInit(): void {
    this.titleService.setTitle('import-tickets');
    // getting parent tenantId from url
    this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });

    // Getting the lookup data
    this.lookupData = this.lookupService.lookupdata;

    // Getting the Tenant Forms data
    this.forms = this.lookupData.tenant.forms;

    this.exampleBase = {
      comments: [
        {
          content: 'Comment',
          createdBy: 'smart.ticket@smartdatasystems.net',
          created: '2020-01-01T10:09:08.0000Z'
        }
      ],
      notes: [
        {
          content: 'Note',
          createdBy: 'smart.ticket@smartdatasystems.net',
          created: '2020-01-01T10:09:08.0000Z'
        }
      ],
      attachments: [
        {
          filename: '123-456-7890/filename.jpg',
          bucket: 'supporttickettest',
          createdBy: 'smart.ticket@smartdatasystems.net',
          created: '2020-01-01T10:09:08.0000Z'
        }
      ],
      id: 'externalId123',

      statusType: 'Open',
      createdBy: 'smart.ticket@smartdatasystems.net',
      created: '2020-01-01T10:09:08.0000Z',
      assignedTo: 'smart.ticket@smartdatasystems.net'

    };

    this.gettenantroles(this.tenantId);
  }



  // getting the tenant's roles
  gettenantroles(tenantId) {
    this.lookupService.getRoles(tenantId).subscribe(
      (response) => {
        this.roles = response;
        if (this.roles) {
          // Getting the roles which is having "ManagedTicket" permission
          this.manageTicketEnabledRoles = this.roles.filter(data => data.permissions.access.CanManageTickets === true)
            .map(rollDetails => rollDetails.id);
          this.getAllusers();
        }
      },
      (error) => {
        this.notifyService.showErrorMessage(error.error.message, 'Error while getting Tenant Roles');
      }
    );
  }

  // Getting the Tenant users
  getAllusers() {
    this.userService.getAllUsers(this.tenantId).subscribe(
      (response) => {
        this.users = response;
        if (this.users) {
          // Filter the users who is having "ManageTickets" permission
          this.manageTicketEnabledUsers = this.users.filter(data => {
            return this.manageTicketEnabledRoles.indexOf(data.role_id) >= 0;
          });
        }
      },
      (error) => {
        this.notifyService.showErrorMessage(error.error.message, 'Error while getting Tenant users');
      }
    );
  }

  // Getting the Example Json based on the selcted form including Form control names and values
  formChange(formId: number) {
    this.selectedFormID = formId;
    const THIS = this;
    // Getting the form details based on the selected form
    const form = this.forms.filter(data => data.id == formId)[0];
    // tslint:disable-next-line: only-arrow-functions
    const metadata = form.ticketTemplate.controls.reduce(function (r, v) {
      r[v.name] = THIS.controlsService.getControlValueExample(v);
      return r;
    }, {});

    // Merging Meta Data control data with Example Base
    this.example = Object.assign({}, this.exampleBase, metadata);
  }

  processFile(AttachementFile) {
    const selected_file = AttachementFile.files[0];
    const extension = this.getFileExtension1(selected_file.name);
    if (extension == 'json') {
      this.file = AttachementFile.files[0];
    } else {
      this.notifyService.showErrorMessage('please select json files only', 'Error');
    }
  }

  // getting file extension
  getFileExtension1(filename) {
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
  }

  // remove file
  removefile() {
    this.file = '';
  }

  update(thisRef, data) {
    thisRef.results = data;
    console.log('From Update Method: ' + thisRef.results);
  }


  bulkImport(importTicketsForm: NgForm) {
    this.results = [];
    if (importTicketsForm.invalid || !this.file) {
      this.notifyService.showWarningMessage('Please fill all the required fields', 'Warning');
      return;
    }

    const thisRef = this;
    this.spinner.show();
    this.SupportTicketService.bulkImport(thisRef, this.file, this.tenantId, this.selectedFormID,
      this.defaultUser, !this.clearExisting, this.update)
      .subscribe(response => {
        this.results = response;
        console.log('After Success: ' + this.results);
        this.spinner.hide();
        this.notifyService.showSuccessMessage('Import Completed', 'Success');
        this.importTicketsForm.form.markAsPristine();
      }, error => {
        console.log(error);
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });
  }

}
