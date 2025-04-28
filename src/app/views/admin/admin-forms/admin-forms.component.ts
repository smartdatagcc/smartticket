import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import * as _ from 'underscore';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-forms',
  templateUrl: './admin-forms.component.html',
  styleUrls: ['./admin-forms.component.scss']
})
export class AdminFormsComponent implements OnInit {

  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    private formService: FormServiceService,
    private titleService: Title,
    private spinner: NgxSpinnerService) { }

  tenantId: any;
  tenant: any;
  forms = [];
  formLimit: any;

  ngOnInit(): void {
    this.titleService.setTitle('Administrate Forms');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    if (this.tenantId !== '') {
      this.spinner.show();
      this.lookupService.getLookupData(this.tenantId).subscribe(
        (data) => {
          this.lookupService.storeData(data);
          this.tenant = data;
          this.forms = this.tenant.tenant.forms;
          this.lookupService.setTentantForms(this.forms);
          this.formLimit = this.tenant.tenant.tier.forms;
          this.spinner.hide();
        },
        (error) => {
          this.spinner.hide();
          console.log(error);
        }
      );
    }
  }

}
