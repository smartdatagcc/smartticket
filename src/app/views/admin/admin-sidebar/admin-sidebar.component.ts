import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { ModuleServiceService } from 'src/app/services/module-service/module-service.service';
import * as _ from 'underscore';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent implements OnInit {
  forms: any;
  statusTypes = [];
  tenantId: string;
  canViewAdminPages;
  canManageTicket;
  tenantLogo;
  lookupData: any;
  path: any;
  su: any;
  isChecked: boolean;
  apiConnectivity: any;
  formLimit: any;
  modules: any;
  currentform: number;
  tenantModules: any;
  tenants: any;
  tenantName: string;
  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private ref: ChangeDetectorRef,
    private tenantService: TenantServiceService,
    private router: Router,
    private moduleService: ModuleServiceService
  ) {
    router.events.subscribe((val) => {
        // tslint:disable-next-line:no-string-literal
        // if (this.router.url.includes('/admin/settings')){
        //   this.path = val['url'];
        // }
        this.path = this.router.url;
    });
    this.tenantService.getTenantImage().subscribe((data) => {
      if (data !== false) {
        this.tenantLogo = data;
      }
    });

    this.lookupService.getSelectedForm().subscribe((data) => {
      if (data !== false) {
        this.currentform  = data.id;
      }
    });

    this.lookupService.getTenantForms().subscribe((data) => {
      this.forms = data;
    });

    this.moduleService.getSelectedModules().subscribe((data) => {
      this.modules = data;
    });

  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    this.route.firstChild.params.subscribe(params => {
      this.currentform = params.formId;
    });
    this.path = this.router.url;
    this.su = this.authService.authentication.data.su;
    const data = this.lookupService.lookupdata;
    this.lookupData = this.lookupService.lookupdata;
    this.modules = this.moduleService.getTenantModules(this.tenantId);
    this.moduleService.setSelectModules(this.modules);
    this.lookupService.setTentantForms(data.tenant.forms);
    this.forms = data.tenant.forms;
    this.tenants = this.authService.authentication.data.tenants;
    this.formLimit = this.lookupData.tenant.tier.forms;
    this.tenantService.setTenanImage(
      data.tenant.tenantSettings.settings.logoUrl
    );
    this.apiConnectivity = this.lookupData.tenant.apiConnectivity;
    this.statusTypes = data.statusTypes;
    this.canViewAdminPages = this.authService.allowed(
      this.tenantId,
      'CanViewAdminPages'
    );
    this.canManageTicket = this.authService.allowed(
      this.tenantId,
      'CanManageTickets'
    );
    this.getTenentName();
    this.ref.detectChanges();
  }

  removeclass(){
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('sidebar-open');
  }

  getTenentName() {
    this.tenants.map((tenant) => {
      if (tenant.id == this.tenantId) {
        this.tenantName = tenant.name;
      }
    });
  }

  // Change Tenant
  changeTenant(tenant){
    console.log(tenant);
    localStorage.setItem('tenant', JSON.stringify(tenant));
    this.router.navigate(['/' + tenant.id]);
  }


  isCurrentForm(formId) {
    return true; // this.route.params.formId && $route.current.params.formId === formId.toString();
  }

  // getstatus based on statusid
  getstatusTypes(statusid): any {
    return this.lookupData.statusTypes.filter((data) => data.id === statusid);
  }

  // selected form
  selectedform(form) {
    if ( form == ''){
        this.currentform = null;
      this.lookupService.setSelectedForm('');
    }
    localStorage.selectedForm = JSON.stringify(form);
  }

  // This function gets triggered when the slder-toggle changes
  // and updates the 'isChecked' property on the side-bar component
  onNotify(toggleStatus) {
    this.isChecked = toggleStatus;
  }

  RouteToTenantDashboard(){
    this.router.navigate(['./' + this.tenantId + '/dashboard']);
  }

  // check active route
  isActive(activeUrl){
    if (this.router.url.includes(activeUrl) === true) {
      return true;
    }else{
      return false;
    }
  }

}
