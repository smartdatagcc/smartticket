import { Component, OnInit } from '@angular/core';
import { LookupServiceService } from '../services/lookup-service/lookup-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../services/authentication/auth.service';
import { SupportTicketServiceService } from '../services/support-ticket-service/support-ticket-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  lookupdata: any;
  tenant: any;
  tenantId: string;
  pageType: string;
  themeColor = 'skin-blue';
  toggleSetting: string;
  toggleSettingchecked: any;
  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, public authService: AuthService,
    private spinner: NgxSpinnerService,
              private notificationService: ToastrnotificationService, private router: Router, private titleService: Title) {
              }

  ngOnInit() {
    this.titleService.setTitle('Dashboard');
    this.lookupService.checkToken();
    this.pageType = 'my';
    // Get 'toggleSetting' from lookupService getToggleSetting()
    this.lookupService.getToggleSetting().subscribe(data => {
      this.toggleSetting = data ? 'All' : 'My';
      this.toggleSettingchecked = data;
    });
    this.route.params.subscribe(params => {
      this.tenantId = params.tenantId;
      this.getlookupdate();
    });
    this.spinner.show();
  }

  getlookupdate(){
    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupdata = data;
        this.themeColor = this.lookupdata.tenant.tenantSettings.settings.themeColor || this.themeColor;
      },
        error => {
          this.notificationService.showErrorMessage(error.error.message, 'Error');
          this.spinner.hide();
          if (localStorage.tenant) {
            const tenantid = JSON.parse(localStorage.tenant).id;
            this.router.navigate(['/' + tenantid + '/dashboard']);
          }
        }
      );
    }
  }
}
