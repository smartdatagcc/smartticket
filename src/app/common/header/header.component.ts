import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { Notification } from '../../model/notification/notification';
import { Observable } from 'rxjs';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

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
  notifications: Notification[] = [];
  toggleSetting: any;
  formName: string;
  routename: any;
  dispalyHeadername = true;
  public modal$: Observable<any>;
  formicon: string;

  form = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };
  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, private authService: AuthService,
              private accountService: AccountServiceService, private ref: ChangeDetectorRef, private tenantService: TenantServiceService,
              private router: Router, private spinner: NgxSpinnerService) {

    this.tenantService.getThemeChanged().subscribe(data => {
      this.themeColor = data;
    });

    this.lookupService.getSelectedForm().subscribe(data => {
      if (data !== false && data !== '') {
        this.form = data;
        this.formicon = this.form.settings.details.icon;
        this.showhidesidebar();
      }
    });
    this.lookupService.getSelectedFormName().subscribe(formname => {
      this.formName = formname;
      this.showhidesidebar();
    });

    // get 'toggleSetting' from lookupService 'toggleSetting BehaviorSubject'
    this.lookupService.getToggleSetting().subscribe(data => {
      this.toggleSetting = data ? 'All' : 'My';
    });

    this.authService.getshowhidesidebar().subscribe(data => {
      this.showhidesidebar();
    });
    this.lookupService.getLookupDataChanged().subscribe(data => {
      if (data !== false) {
        this.showhidesidebar();
        this.form = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };
        this.formicon = this.form.settings.details.icon;
        this.formName =  this.form.name;
        this.themeColor = this.lookupService.lookupdata.tenant.tenantSettings.settings.themeColor || 'skin-blue';
        if (this.tenantId !== undefined){
          this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
          this.getnotifaction(this.tenantId);
        }
      }
    });

    this.lookupService.getShorheadNameAndSidebar().subscribe(data => {
      if (data !== false) {
        this.showhidesidebar();
        this.form = { name: 'Dashboard', settings: { details: { icon: 'fa-home' } } };
        this.formicon = this.form.settings.details.icon;
        this.formName =  this.form.name;
        this.themeColor = this.lookupService.lookupdata.tenant.tenantSettings.settings.themeColor || 'skin-blue';
        this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });
    this.formicon = this.form.settings.details.icon;
    this.isAuth = this.authService.authentication.isAuth;
    this.tenants = this.authService.authentication.data.tenants || [];
    this.sbnTenantsOnly = true;
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
    if (this.tenantId) {
      this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
      const lookupData = this.lookupService.lookupdata;
      this.themeColor = lookupData.tenant.tenantSettings.settings.themeColor || 'skin-blue';
      this.logoUrl = lookupData.tenant.tenantSettings.settings.logoUrl;
      this.tenantName = lookupData.tenant.name;
      this.clearOnVisit = lookupData.tenant.tenantSettings.settings.clearOnVisit;
      this.forms = lookupData.tenant.forms;
      this.routename = this.route.component;
      this.showhidesidebar();
    }
    this.getnotifaction(this.tenantId);
  }

  showhidesidebar() {
    if (this.router.url.includes('/admin/') === true || this.router.url.includes('/profile') === true) {
      this.dispalyHeadername = false;
    }else{
      this.dispalyHeadername = true;
    }
  }

  getnotifaction(tenantId) {
    this.accountService.getNotifications(this.tenantId).subscribe((res) => {
      this.notifications = res;
    });
  }

  logout() {
    this.authService.logout();
  }

  checkAndRouteProfilePage() {
    if (this.router.url.includes('/admin/settings')) {
      this.router.navigate(['./' + this.tenantId + '/profile']);
    }
    else {
      this.router.navigate(['/' + this.tenantId + '/profile']);
    }
  }

  // remove visited notifications
  clearVisitedNotification(notification, url) {
    if (this.clearOnVisit) {
      this.clearNotifications(notification, url);
    }
  }

  // clear notifications
  clearNotifications(notification, url) {
    this.accountService.deleteNotifications(this.tenantId, url).subscribe((n) => {
      if (url === true) {
        this.notifications = [];
        this.accountService.setNotificationUpdated();
      } else {
        const index = this.notifications.findIndex(x => x == notification);
        this.notifications.splice(index, 1);
        this.accountService.setNotificationUpdated();
      }
    });
  }
}
