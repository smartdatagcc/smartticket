import { Subscription } from 'rxjs';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
declare var $: any;

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  pluralize = require('pluralize');
  forms: any;
  statusTypes = [];
  tenantId: string;
  canViewAdminPages;
  canManageTicket;
  tenantLogo;
  lookupData: any;
  tenants: any;
  isChecked = false;
  toggleSetting = 'My';
  toggleSettingchecked = false;
  statusId: number;
  loggedInUserId: number;
  currentForm: number;
  tenantName: string;
  statusArchivedeleted: string;
  dispalysidebar = true;
  form: any;
  color = 'primary';
  defaultform = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };
  ticketQuantities$: Subscription;
  ticketQuantities = {};
  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private ref: ChangeDetectorRef,
    private supportTicketService: SupportTicketServiceService
  ) {
    this.supportTicketService.archivedDeleted.subscribe(data => {
      if (data !== false) {
        // this.getSupportTickets(this.tenantId);
      }
    });

    this.lookupService.getSelectedFormID().subscribe(data => {
      if (data !== false && data !== '') {
        this.currentForm = data;
      }
    });

    this.authService.getshowhidesidebar().subscribe(data => {
      this.showHideSidebar();
    });

    this.lookupService.getLookupDataChanged().subscribe(data => {
      if (data !== false) {
        this.showHideSidebar();
        this.getBasicData();
      }
    });

    this.lookupService.getShorheadNameAndSidebar().subscribe(data => {
      if (data !== false) {
        this.dispalysidebar = true;
      }
    });
  }

  ngOnInit() {
    this.ticketQuantities$ = this.supportTicketService.ticketQuantities$.subscribe(data => {
      this.ticketQuantities = data;
    });
    
    this.route.params.subscribe(params => {
      if (params.tenantId && params.tenantId !== this.tenantId) {
        this.lookupService.getTenantName(+params.tenantId).subscribe((data: {
          domain: string,
          inviteOnly: Boolean,
          logoUrl: string,
          tenantName: string,
          themeColor: string
        }) => {
          localStorage.setItem('tenant', JSON.stringify({ name: data.tenantName, id: params.tenantId }))
        },
        );

      }
      this.tenantId = params.tenantId;
      if (this.tenantId !== null) {
        // this.getSupportTickets(this.tenantId);
      }

      // In case of page refresh, reset the currentForm from localStorage
      if(params.formId !== undefined) {
        this.currentForm = params.formId;
      } else if(localStorage.getItem('selectedForm')) {
        let frm = JSON.parse(localStorage.getItem('selectedForm'));
        this.currentForm = frm.id;
      }

      // We're getting ticket quantities every time the form changes, but
      // this should be refactored later to only fetch all forms + only the current
      // status' quantities, not ALL forms plus ALL statuses like it is now.
      this.getQuantities(+this.tenantId, +this.loggedInUserId);
      if (this.currentForm !== undefined) {
        const selectedForm = localStorage.getItem('selectedForm');
        this.lookupService.setSelectedForm(JSON.parse(selectedForm));
        this.lookupService.setSelectedFormName(JSON.parse(selectedForm).name);
      }
    });

    this.showHideSidebar();

    // getting query parameters from url
    this.route.queryParams.subscribe(params => {
      /* tslint:disable:no-string-literal */
      if (params['statusId'] !== undefined) {
        this.statusArchivedeleted = '';
        this.statusId = params['statusId'];
      } else if (params.archived === 'true') {
        this.statusId = null;
        this.statusArchivedeleted = 'archived';
      } else if (params.deleted === 'true') {
        this.statusId = null;
        this.statusArchivedeleted = 'deleted';
      }
    });
    this.getBasicData();
    // get 'toggleSetting' from lookupService 'toggleSetting BehaviorSubject'
    this.lookupService.getToggleSetting().subscribe(data => {
      this.toggleSetting = data ? 'All' : 'My';
      this.toggleSettingchecked = data;
    });
  }

  showHideSidebar() {
    if (this.router.url.includes('/profile') === true) {
      this.dispalysidebar = false;
    }else{
      this.dispalysidebar = true;
    }
  }

  // Change Tenant
  changeTenant(tenant) {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    this.router.navigate(['/' + tenant.id]);
  }

  // Get all Basic Details
  getBasicData() {
    const data = this.lookupService.lookupdata;
    this.lookupData = this.lookupService.lookupdata;
    this.forms = data.tenant.forms;
    this.forms.map(form => {
      form.namePlural = this.pluralize(form.name);
    });
    this.tenantLogo = data.tenant.tenantSettings.settings.logoUrl;
    this.statusTypes = data.statusTypes;
    this.tenants = this.authService.authentication.data.tenants;
    this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
    this.canManageTicket = this.authService.allowed(this.tenantId, 'CanManageTickets');
   // this.ref.detectChanges();
    // Get logged in user Id
    this.loggedInUserId = this.authService.authentication.data.id;
    this.getTenentName();
  }

  getTenentName() {
    this.tenants.map((tenant) => {
      // tslint:disable-next-line:triple-equals
      if (tenant.id == this.tenantId) {
        this.tenantName = tenant.name;
      }
    });
  }

  // getstatus based on statusid
  getStatusTypes(statusId): any {
    return this.lookupData.statusTypes.filter(data => data.id === statusId);
  }

  // getting count based on 'formid' and 'statusid' and 'loggedInUserId' from service
  getCount(formName: string, statusName = null) {
    if (!!Object.keys(this.ticketQuantities).length) {
      if (statusName) {
        if (this.ticketQuantities[formName]) {
          if (this.ticketQuantities[formName][statusName]) {
            return this.ticketQuantities[formName][statusName][this.toggleSetting.toLowerCase()];
          }
        }
      } else if (this.ticketQuantities[formName]) {
        return this.ticketQuantities[formName][this.toggleSetting.toLowerCase()];
      }
    }
    return 0;
  }

  getQuantities(tenantId: number, userId: number) {
    this.supportTicketService.getQuantities(tenantId, userId);
  }

  // getting count od Archived and Deleted tickets
  getArchiveDeletedCount(formId, type) {
    if (this.toggleSetting === 'My') {
      return this.supportTicketService.getCountOfArchiveDeletedTickets(formId, type, this.loggedInUserId);
    }
    else {
      return this.supportTicketService.getCountOfArchiveDeletedTickets(formId, type, '');
    }
  }

  // setting selected form
  selectedForm(form) {
    this.statusId = null;
    this.statusArchivedeleted = '';
    this.lookupService.setSelectedForm(form);
  }

  // getting status id
  formStatusId(status) {
    this.statusId = status.id;
  }

  // This function gets triggered when the slder-toggle changes
  // and updates the 'isChecked' property on the side-bar component
  // set the 'toggleSetting' based on 'isChecked'
  // store 'toggleSetting' in 'lookupService' as BehaviorSubject to be used in other components
  onToggleStatus(toggleStatus) {
    this.isChecked = toggleStatus.checked;
    this.toggleSetting = this.isChecked ? 'All' : 'My';
    this.lookupService.setToggleSetting(this.isChecked);
  }

  redirectToDashboard(tenant) {
    const tenantid = tenant.id;
    const tenantname = tenant.name;
    const tenantDetails = { id: tenantid, name: tenantname };
    localStorage.setItem('tenant', JSON.stringify(tenantDetails));
    this.router.navigate(['/' + tenantid + '/dashboard']);
  }

}
