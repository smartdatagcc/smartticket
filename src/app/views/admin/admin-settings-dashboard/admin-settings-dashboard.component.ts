import { Component, OnInit } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';

@Component({
  selector: 'app-admin-settings-dashboard',
  templateUrl: './admin-settings-dashboard.component.html',
  styleUrls: ['./admin-settings-dashboard.component.scss']
})
export class AdminSettingsDashboardComponent implements OnInit {

  lookupdata: any;
  tenant: any;
  tenantId: string;
  pageType: string;
  themeColor: string;
  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, public authService: AuthService,
              private spinner: NgxSpinnerService, private supportTicket: SupportTicketServiceService,
              private tenantService: TenantServiceService) {
                this.tenantService.getThemeChanged().subscribe(data => {
                  if (data !== ''){
                    this.themeColor = data;
                  }
                });
              }

  ngOnInit() {
    this.spinner.show();
    this.lookupService.checkToken();

    this.pageType = 'my';
    this.route.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });

    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupdata = data;
        this.themeColor = this.lookupdata.tenant.tenantSettings.settings.themeColor || 'skin-blue';
        this.spinner.hide();
      },
        error => {
          this.spinner.hide();
          console.log(error);
        }
      );
    }
  }
}
