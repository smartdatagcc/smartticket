import { Subscription } from 'rxjs';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-formslist',
  templateUrl: './formslist.component.html',
  styleUrls: ['./formslist.component.scss']
})
export class FormslistComponent implements OnInit, OnDestroy {
  pluralize = require('pluralize');
  lookupData: any;
  forms: any;
  statusTypes = [];
  id: string;
  canViewAdminPages;
  canManageTicket;
  tenantLogo;
  toggleSetting;
  loggedInUserId;
  ticketQuantities$: Subscription;
  ticketQuantities = {};

  form = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };

  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private titleService: Title,
    private ref: ChangeDetectorRef,
    private supportTicketService: SupportTicketServiceService,
    private spinner: NgxSpinnerService
  ) {
    this.lookupService.getLookupDataChanged().subscribe(data => {
      if (data !== false) {
        this.getdefaultdata();
      }
    });
  }

  ngOnInit() {
    this.titleService.setTitle('Dashboard');
    this.selectedform(this.form);
    this.getdefaultdata();
    this.ticketQuantities$ = this.supportTicketService.ticketQuantities$.subscribe(data => {
      this.ticketQuantities = data;
    });
    const tenantId = +JSON.parse(localStorage.getItem('tenant')).id;
    const userId = this.authService.authentication.data.id;
    this.supportTicketService.getQuantities(tenantId, userId);
  }

  ngOnDestroy() {
    this.ticketQuantities$.unsubscribe();
  }

  getdefaultdata() {
    const data = this.lookupService.lookupdata;
    this.lookupData = this.lookupService.lookupdata;
    this.forms = data.tenant.forms;
    this.forms.map(form => {
      form.namePlural = this.pluralize(form.name);
    });
    this.tenantLogo = data.tenant.tenantSettings.settings.logoUrl;
    this.canViewAdminPages = this.authService.allowed(this.id, 'CanViewAdminPages');
    this.canManageTicket = this.authService.allowed(this.id, 'CanManageTickets');
   // this.ref.detectChanges();

    this.loggedInUserId = this.authService.authentication.data.id;

    // get 'toggleSetting' from lookupService 'toggleSetting BehaviorSubject'
    this.lookupService.getToggleSetting().subscribe(toggledata => {
      this.toggleSetting = toggledata ? 'All' : 'My';
    });
    this.spinner.hide();
  }

  // getstatus based on statusid
  getStatusTypes(statusid): any {
    return this.lookupData.statusTypes.filter(data => data.id === statusid);
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

  // setting selected form
  selectedform(form) {
    this.lookupService.setSelectedForm(form);
    this.lookupService.setSelectedFormID(form.id);
    this.lookupService.setSelectedFormName(form.name);
    localStorage.selectedForm = JSON.stringify(form);
  }
}
