import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';

@Component({
  selector: 'app-workspace-settings',
  templateUrl: './workspace-settings.component.html',
  styleUrls: ['./workspace-settings.component.scss'],
})
export class WorkspaceSettingsComponent implements OnInit {
  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    public authService: AuthService,
    private spinner: NgxSpinnerService,
    private supportTicket: SupportTicketServiceService
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.lookupService.checkToken();

    this.route.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(
        (data) => {
          this.lookupService.storeData(data);
          this.lookupdata = data;
          this.spinner.hide();
        },
        (error) => {
          this.spinner.hide();
          console.log(error);
        }
      );
    }
  }

  tenant: any;
  tenantId: any;
  lookupdata: any;
  tenantService: any;

  tenantAdminForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  updateTenant() {
    var form = this.tenantAdminForm;
    //make sure these are saved properly:
    if (
      !this.tenant.tenantSettings.settings.registrationInviteOnly ||
      !this.tenant.tenantSettings.settings.restrictRegistrationToDomain
    ) {
      this.tenant.tenantSettings.settings.restrictRegistrationToDomain = false;
      this.tenant.tenantSettings.settings.restrictedRegistrationDomain = '';
    }
    if (form.value.valid) {
    }
  }
  onNotify(event) {}
}
