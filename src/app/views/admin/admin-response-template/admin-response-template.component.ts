import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { ResponseTemplateServiceService } from 'src/app/services/response-template-service/response-template-service.service';
import { AddResponseTemplateControlDialogModel, AddResponseTemplateComponent } from './add-response-template/add-response-template.component';
import * as _ from 'underscore';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-response-template',
  templateUrl: './admin-response-template.component.html',
  styleUrls: ['./admin-response-template.component.scss']
})
export class AdminResponseTemplateComponent implements OnInit {
  data: any;
  tenantId: number;
  tenantData: any;
  formId: any;
  responseTemplate: any;
  templateControls: any;
  constructor(
    private route: ActivatedRoute,
    private responseService: ResponseTemplateServiceService,
    private notifyService: ToastrnotificationService,
    public dialog: MatDialog,
    private titleService: Title,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Response Template');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
    });

    this.getResponseTemplatedata();
  }

  // get lookup data from server
  getResponseTemplatedata() {
    this.responseService.get(this.tenantId, this.formId).subscribe((data: any) => {
      this.data = data;
      this.templateControls = data.template.responseTemplates;
      this.responseTemplate = data;
      this.spinner.hide();
    },
      error => {
        this.spinner.hide();
        console.log(error);
      }
    );
  }

  // Addin new user
  AddResponseTemplate(): void {
    const dialogData = new AddResponseTemplateControlDialogModel(this.templateControls, this.tenantId, this.formId);

    const dialogRef = this.dialog.open(AddResponseTemplateComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
      this.getResponseTemplatedata();
    });
  }

  // onsubmit this method will be called
  updateControls(editControlsForm){
    this.spinner.show();
    this.responseService.update(this.tenantId, this.formId, this.responseTemplate).subscribe((result) => {
      this.spinner.hide();
      this.notifyService.showSuccessMessage('Response Template successfully updated', 'Success');
      this.getResponseTemplatedata();
      }, error => {
          this.spinner.hide();
      });
  }
}
