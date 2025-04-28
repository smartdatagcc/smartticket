import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { Component, OnInit, Input } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { AuthService } from 'src/app/services/authentication/auth.service';

@Component({
  selector: 'app-workspace-change',
  templateUrl: './workspace-change.component.html',
  styleUrls: ['./workspace-change.component.scss']
})
export class WorkspaceChangeComponent implements OnInit {
  @Input() tenants;
  tenantLogo: string;
  tenantName: string;
  @Input() tenantId;
  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantServiceService,
    private authService: AuthService,
    private supportTicketService: SupportTicketServiceService
  ) {

    this.tenantService.getTenantName().subscribe((data) => {
      if (data !== false) {
        this.tenantName = data;
      }
    });

    this.tenantService.getTenantImage().subscribe((data) => {
      if (data !== false) {
        this.tenantLogo = data;
      }
    });
    this.lookupService.getLookupDataChanged().subscribe(data => {
      if (data !== false) {
        this.getBasicData();
      }
    });
    this.authService.getAuthdata().subscribe(data => {
      if ( data !== false){
        this.tenants = this.authService.authentication.data.tenants || [];
      }
    });
   }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });
    this.getBasicData();
  }

  // Get all Basic Details
  getBasicData() {
    this.tenantLogo = this.lookupService.lookupdata.tenant.tenantSettings.settings.logoUrl || '';
    this.getTenentName();
  }

  getTenentName() {
    if (this.tenants !== undefined) {
      this.tenantName = '';
      this.tenants.map((tenant) => {
        // tslint:disable-next-line:triple-equals
        if (tenant.id == this.tenantId) {
          this.tenantName = tenant.name;
        }
      });
      if (this.tenantName === undefined || this.tenantName === ''){
        this.tenantName =  JSON.parse(localStorage.getItem('viewtenant')).name;
      }
    }
  }
  // Change Tenant
  changeTenant(tenant) {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    this.lookupService.setToggleSetting(false);
    this.lookupService.setShorheadNameAndSidebar();
    this.supportTicketService.getQuantities(this.authService.authentication.data.id, this.tenantId);
  //  this.router.navigate(['/' + tenant.id]);
  }

}
