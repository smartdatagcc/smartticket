import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-custom-report',
  templateUrl: './admin-custom-report.component.html',
  styleUrls: ['./admin-custom-report.component.scss']
})
export class AdminCustomReportComponent implements OnInit {

  constructor(private route: ActivatedRoute, private lookupService: LookupServiceService, public authService: AuthService,
    private spinner: NgxSpinnerService, private formService: FormServiceService, private userService: UserService,
    private toastrService: ToastrnotificationService, public dialog: MatDialog, private titleService: Title) { }

  tenantId: any;
  form: any;
  formId: any;
  template: any;
  lookupdata: any;
  @ViewChild('reportForm') reportForm: any;

  CanDeactivate(): any {
    if (this.reportForm.form.dirty || this.reportForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }


  ngOnInit(): void {
    this.titleService.setTitle('admin-custom-report');
    this.spinner.show();
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
    });

    this.lookupdata = this.lookupService.lookupdata;
    // Get the current form details
    const formdata = this.lookupdata.tenant.forms.filter(data => data.id == this.formId);
    this.form = formdata[0];
    this.template = this.form.settings.template;
    this.spinner.hide();
  }


  save(templateForm) {
    if (templateForm.valid) {
      this.spinner.show();
      this.form.settings.template = this.template;

      this.formService.save(this.tenantId, this.form).subscribe((result) => {
        this.toastrService.showSuccessMessage('Template successfully updated', 'Template Updated');
        this.spinner.hide();
        this.reportForm.form.markAsPristine();
      },
        error => {
          this.toastrService.showErrorMessage(error.error.message, 'Error Updating Template');
          this.spinner.show();
        });
    }
  }

}
