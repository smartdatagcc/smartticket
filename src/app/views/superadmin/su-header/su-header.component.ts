import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-su-header',
  templateUrl: './su-header.component.html',
  styleUrls: ['./su-header.component.scss']
})
export class SuHeaderComponent implements OnInit {

  lookupData: any;
  tenantId: string;
  pageType: string;
  isAuth: boolean;
  tenants: any;
  sbnTenantsOnly: any;
  email: any;
  name: any;
  su: any;
  image: any;
  multipleTenants: any;
  canViewAdminPages: any;
  CanManageTickets: any;
  themeColor: any;
  logoUrl: any;
  tenantName: any;
  clearOnVisit: any;
  forms: any;
  tenantLogo;
  selectedtenantName;
  notifications: Notification[] = [];

  form = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };
  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, private authService: AuthService,
              private accountService: AccountServiceService, private ref: ChangeDetectorRef, private spinner: NgxSpinnerService,
              private router: Router) {

    this.lookupService.getSelectedForm().subscribe(data => {
      if (data !== false) {
        this.form = data;
      }
    });
    this.authService.getAuthdata().subscribe(data => {
      if ( data !== false){
        this.tenants = this.authService.authentication.data.tenants || [];
      }
    });
  }

  ngOnInit(): void {
    this.lookupService.checkToken();
    const tenant = JSON.parse(localStorage.getItem('tenant'));
    this.tenantId = tenant.id;
    this.isAuth = this.authService.authentication.isAuth;
    this.tenants = this.authService.authentication.data.tenants || [];
    this.sbnTenantsOnly = true;
    this.tenants.map((tenant) =>  {
      if (tenant.id == this.tenantId){
        this.selectedtenantName = tenant.name;
      }
    });
    for (let i = 0; i < this.tenants.length && this.sbnTenantsOnly; i++) {
      if (this.tenants[i].id !== '1013' && this.tenants[i].id !== '1021') {
        this.sbnTenantsOnly = false;
      }
    }
    this.email = this.authService.authentication.data.email;
    this.name = this.authService.authentication.data.name;
    this.su = this.authService.authentication.data.su;
    this.image = this.authService.getProfileImage();
    // tslint:disable-next-line:max-line-length
    this.multipleTenants = (this.authService.authentication.data.tenants && this.authService.authentication.data.tenants.length > 1);
    this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');

    const loopdataexist = ((this.lookupService.lookupdata).length === 0);
    if (this.tenantId !== '') {
      if (!loopdataexist) {
        this.lookupService.getLookupData(this.tenantId).subscribe(data => {
          this.lookupService.storeData(data);
          this.gettenantdetails();
          this.spinner.hide();
        },
          error => {
            this.spinner.hide();
            console.log(error);
          }
        );
      } else {
        this.gettenantdetails();
      }

    }
    this.getnotifaction(this.tenantId);
  }

  getnotifaction(tenantId) {
    this.accountService.getNotifications(this.tenantId).subscribe((res) => {
    });
  }

  logout() {
    this.authService.logout();
  }

  gettenantdetails() {
    const lookupData = this.lookupService.lookupdata;
    this.themeColor = lookupData.tenant.tenantSettings.settings.themeColor || this.themeColor;
    this.logoUrl = lookupData.tenant.tenantSettings.settings.logoUrl;
    this.tenantName = lookupData.tenant.name;
    this.clearOnVisit = lookupData.tenant.tenantSettings.settings.clearOnVisit;
    this.forms = lookupData.tenant.forms;
  }

  // Change Tenant
  changeTenant(tenant) {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    this.router.navigate(['/' + tenant.id + '/dashboard']);
  }
}
