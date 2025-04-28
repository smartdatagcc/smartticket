import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent implements OnInit {
  baseUrl: string;
  tenantId: any;
  tenant: any;
  currentForm: any;
  exampleCode: string;
  exampleSafeHTML: SafeHtml;
  apiDomain: string;
  constructor(public dialogRef: MatDialogRef<DocumentationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentationDialogModel,
    public controlsService: ControlsServiceService, private sanitizer: DomSanitizer) {
    this.baseUrl = data.baseUrl;
    this.tenantId = data.tenantId;
    this.tenant = data.tenant;
    this.currentForm = data.form;
    this.apiDomain = data.apiDomain;
  }

  ngOnInit(): void {

    this.exampleCode = '<form action="' + environment.apiUrl + '/public-api/' + this.tenantId + '/tickets" method="post">\r\n';
    this.exampleCode += '<input type="hidden" name="ApiKey" value="' + this.tenant.tenantSettings.settings.apiKey + '" />\r\n';


    this.exampleCode += '<input type="hidden" name="FormId" value="' + this.currentForm.id + '" />\r\n';
    this.exampleCode += '<input type="hidden" name="SuccessUrl" value="' + this.tenant.tenantSettings.settings.apiReturnUrl + '" />\r\n';
    this.exampleCode += '<input type="hidden" name="ErrorUrl" value="' + this.tenant.tenantSettings.settings.apiErrorUrl + '" />\r\n';

    this.currentForm.ticketTemplate.controls.forEach(control => {
      this.exampleCode += this.controlsService.getControlHtmlExample(control);
    });

    this.exampleCode += '\r\n<input type="submit" value="Create ' + this.currentForm.name + '">\r\n';
    this.exampleCode += '</form>';
    this.exampleSafeHTML = this.sanitizer.bypassSecurityTrustHtml(this.exampleCode);
  }

  getFriendlyType(type) {
    switch (type) {
      case 'checkboxlist': return 'Multi-Select';
      case 'radiobuttonlist':
      case 'select': return 'Enum';
      case 'datepicker': return 'Date';
      case 'timepicker': return 'Time';
      case 'phone number': return 'Telephone Number';
      case 'text': return 'String';
      case 'textarea': return 'String';
      case 'email': return 'Email';
      case 'toggle': return 'Boolean';
    }
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }

}

/**
 * Class to represent Documentation user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class DocumentationDialogModel {
 constructor(public baseUrl: string, public tenantId: any, public tenant: any, public form: any, public apiDomain: string) {
  }
}
