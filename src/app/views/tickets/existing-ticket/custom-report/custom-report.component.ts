import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as moment from 'moment';
import * as _ from 'underscore';
import { EditCustomReportDialogModel, EditCustomReportComponent } from './edit-custom-report/edit-custom-report.component';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-custom-report',
  templateUrl: './custom-report.component.html',
  styleUrls: ['./custom-report.component.scss']
})
export class CustomReportComponent implements OnInit {
  ticket: any;
  tenantId: any;
  formId: any;
  ticketId: any;
  lookupData: any;
  params: any;
  form: any;
  compiledTemplate: any;
  compiledReport: any;
  @ViewChild('formPdfDocument') formPdfDocument: ElementRef;
  element: any;
  hiddenfieldelement: any;
  environment: any;

  constructor(private route: ActivatedRoute, private supportTickets: SupportTicketServiceService,
    private spinner: NgxSpinnerService, public authService: AuthService, private titleService: Title,
    private lookupService: LookupServiceService, private controlsService: ControlsServiceService,
    public dialog: MatDialog, private notifyService: ToastrnotificationService) {
  }


  ngOnInit(): void {
    this.titleService.setTitle('custom-report');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });
    this.route.params.subscribe((params) => {
      this.formId = params.formId;
      this.ticketId = params.id;
    });
    this.getlookupdate();
    this.environment = environment.apiUrl;
  }

  compile() {
    // var handle = Handlebars.compile(this.form.settings.template || 'No Template Defined. ');
    const THIS = this;
    // tslint:disable-next-line:triple-equals
    const formlist = this.lookupData.tenant.forms.filter(formdata => formdata.id == this.formId);
    this.form = formlist[0];
    const Handlebars = require('handlebars');

    // Handle newlines in custom report:
    Handlebars.registerHelper('breaklines', function (text) {
      if (text && text !== undefined) {
        if (!text.includes('<img')) {
          text = Handlebars.Utils.escapeExpression(text);
        }
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        return new Handlebars.SafeString(text);
      }
    });

    const newline = /([\{]{3})|([\{]{2})/gm;
    let formSettingsTemplate = THIS.form.settings.template.replace(newline, '$1$2breaklines ');

    const handle = Handlebars.compile(formSettingsTemplate || 'No Template Defined. ');

    this.compiledTemplate = handle(this.params);
    // tslint:disable-next-line: one-variable-per-declaration
    const showdown = require('showdown'),
      converter = new showdown.Converter();
    this.compiledTemplate = converter.makeHtml(this.compiledTemplate);
  }

  getCommentValue(comments: any) {
    let commentValue = '';
    comments.map(data => {
      commentValue += '[' + moment(data.created_at).format('M/DD/YYYY h:mm a') + ' by ' + data.user.name + '] ';
      commentValue += data.content + '\r\n';
    });
    return commentValue.slice(0, commentValue.lastIndexOf(',')).replace(/<[^>]*>/g, '');
  }
  getNoteValue(notes: any) {
    let noteValue = '';
    notes.map(data => {
      noteValue += '[' + moment(data.created_at).format('M/DD/YYYY h:mm a') + ' by ' + data.user.name + '] ';
      noteValue += data.content + '\n';
    });
    return noteValue.slice(0, noteValue.lastIndexOf(',')).replace(/<[^>]*>/g, '');
  }

  // Get SupportTicket
  getSupportTicket() {
    this.spinner.show();
    this.supportTickets.getSupportTicket(this.tenantId, this.ticketId, 'all').subscribe(data => {
      this.ticket = data;
      // this.ticket.metadata.reportEdited = false;
      const THIS = this;
      this.params = Object.assign({
        createdAt: moment(this.ticket.created_at).format('LLL'),
        updatedAt: moment(this.ticket.updated_at).format('LLL'),
        createdBy: this.ticket.user,
        updatedBy: this.ticket.updatedByUser,
        formName: this.ticket.form.name,
        statusType: this.ticket.statusType.name,
        comments: this.getCommentValue(this.ticket.comments),
        notes: this.getNoteValue(this.ticket.notes)
        // tslint:disable-next-line:only-arrow-functions
      }, this.ticket.metadata.controls.reduce(function (r, v) {
        r[v.name] = THIS.controlsService.getControlValue(v, true);
        return r;
      }, {}));
      if (this.ticket.metadata.reportEdited) {
        this.compiledTemplate = this.ticket.metadata.report;
      } else {
        this.compile();
      }
      this.spinner.hide();
    });
  }

  // get lookupdate
  getlookupdate() {
    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupData = data;
        this.getSupportTicket();
      },
        error => {
        }
      );
    }
  }

  revert() {
    this.spinner.show();
    this.compile();

    this.ticket.metadata.report = null;
    this.ticket.metadata.reportEdited = false;
    this.supportTickets.updateSupportTicket(this.ticket).subscribe((result: any) => {
      this.compile();
      this.spinner.hide();
      this.compiledReport = this.compiledTemplate;
      this.notifyService.showSuccessMessage('Report generated', 'Success');
    },
      error => {
        this.spinner.hide();
        this.notifyService.showErrorMessage(error.error.message, 'Error');
      });
  }

  edit() {
    this.compiledReport = this.compiledTemplate;
    const dialogData = new EditCustomReportDialogModel(this.compiledTemplate);

    const dialogRef = this.dialog.open(EditCustomReportComponent, {
      data: dialogData,
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.spinner.show();
        this.compiledReport = dialogResult;
        this.ticket.metadata.report = this.compiledReport;
        this.ticket.metadata.reportEdited = true;

        this.supportTickets.updateSupportTicket(this.ticket).subscribe((result: any) => {
          this.spinner.hide();
          this.compiledTemplate = this.compiledReport;
          this.notifyService.showSuccessMessage('Report Updated', 'Success');
        },
          error => {
            this.spinner.hide();
            this.notifyService.showErrorMessage(error.error.message, 'Error');

          });
      }
    });
  }

  downloadPdf() {
    // angular.element('#formPdfDocument input').val(this.ticket.metadata.report);
    // angular.element('#formPdfDocument').submit();
    const DATA = this.ticket.metadata.report;
    // this.formPdfDocument.nativeElement.insertAdjacentHTML('beforeend', DATA);
    this.element = document.getElementById('formPdfDocument') as HTMLElement;
    this.hiddenfieldelement = document.getElementById('document') as HTMLElement;
    this.hiddenfieldelement.value = DATA;
    this.element.submit();
  }

  download() {
    this.spinner.show();
    if (!this.ticket.metadata.reportEdited) {
      this.ticket.metadata.report = this.compiledTemplate;
      this.supportTickets.updateSupportTicket(this.ticket).subscribe(result => {
        this.spinner.hide();
        this.downloadPdf();
      }, (error) => {
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });
    } else {
      this.spinner.hide();
      this.downloadPdf();
    }
  }
}
