import { Component, OnInit } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})

export class CreateTicketComponent implements OnInit {


  constructor(private componentData: ComponentDataService, private lookupService: LookupServiceService,
    private notifyService: ToastrnotificationService, public dialog: MatDialog) { }
  controls: ControlTemplateDataModel[];

  // For temporarly declared the following object for testing purpose
  // Later we need to fetch the details from the service.
  serverdata = {
    tenantid: '',
    formid: '',
    metadata: [
      {
        name: 'customCheckBox',
        type: 'checkboxlist',
        label: 'CustomCheckBox',
        value: null,
        isOpen: false,
        options: [
          'One',
          'Two'
        ],
        helpText: 'Check atlest one option',
        required: true,
        adminOnly: false,
        showHelpText: true
      },
      {
        name: 'Gender',
        type: 'radiobuttonlist',
        label: 'Gender',
        value: null,
        isOpen: false,
        options: [
          'Male',
          'Female'
        ],
        helpText: 'Choose Gender',
        required: true,
        adminOnly: false,
        showHelpText: true
      },
      {
        name: 'Department',
        type: 'select',
        label: 'Department',
        options: [
          'IT',
          'HR',
          'Finance'
        ],
        required: true,
        adminOnly: false
      },
      {
        name: 'subject',
        show: true,
        type: 'text',
        label: 'Subject/Title',
        isOpen: false,
        helpText: 'this is a help text',
        showHelpText: true,
        required: true,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'Telephone',
        show: true,
        type: 'phone number',
        label: 'Phone Number',
        isOpen: false,
        helpText: 'Enter Telephone Number',
        showHelpText: true,
        required: true,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'date',
        type: 'datepicker',
        label: 'Date',
        value: null,
        isOpen: false,
        options: [

        ],
        required: false,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'time',
        type: 'timepicker',
        label: 'Time',
        value: null,
        helpText: 'Time of Ticket',
        showHelpText: true,
        isOpen: false,
        required: true,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'links',
        type: 'email',
        label: 'Email',
        value: null,
        isOpen: false,
        content: null,
        options: [

        ],
        helpText: 'Enter Email address',
        required: true,
        adminOnly: false,
        showMyLabel: false,
        showToolTip: false,
        showHelpText: true
      },
      {
        name: 'Description',
        show: true,
        type: 'textarea',
        label: 'Description',
        isOpen: false,
        helpText: 'this is a help text',
        showHelpText: true,
        required: true,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'signaturepad',
        show: true,
        type: 'signaturepad',
        label: 'signaturepad',
        isOpen: false,
        showHelpText: true,
        required: true,
        adminOnly: false,
        showToolTip: false
      },
      {
        name: 'toggle',
        type: 'toggle',
        label: 'Toggle',
        value: null,
        isOpen: false,
        helpText: 'slide',
        required: false,
        adminOnly: false,
        showHelpText: false
      },
    ]
  };

  ToasterOption: string;

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // For Show Dialog code
  result: string = '';

  ngOnInit(): void {
    this.componentData.newticket = this.serverdata;
    // tslint:disable-next-line:no-string-literal
    this.controls = this.componentData.newticket['metadata'];

    if (localStorage.selectedForm) {
      this.lookupService.setSelectedForm(JSON.parse(localStorage.selectedForm));
      this.lookupService.setSelectedFormName(JSON.parse(localStorage.selectedForm).name);
    }

  }

  onSubmit() {
    this.componentData.createticket(this.componentData.newticket);
  }

  ShowToaster() {
    switch (this.ToasterOption) {
      case 'success':
        this.showToasterSuccessMessage();
        break;
      case 'error':
        this.showToasterErrorMessage();
        break;
      case 'warning':
        this.showToasterWarningMessage();
        break;
      case 'info':
        this.showToasterInformationMessage();
        break;
      default:
        this.showToasterSuccessMessage();
        break;
    }
  }

  showToasterSuccessMessage() {
    this.notifyService.showSuccessMessage('Data shown successfully !!', 'Success')
  }

  showToasterErrorMessage() {
    this.notifyService.showErrorMessage('Data shown successfully !!', 'Error')
  }

  showToasterWarningMessage() {
    this.notifyService.showWarningMessage('Data shown successfully !!', 'Warning')
  }

  showToasterInformationMessage() {
    this.notifyService.showInformationMessage('Data shown successfully !!', 'Info');
  }

  confirmDialog(): void {
    const dialogTitle = `Confirm Action`;
    const message = `Are you sure you want to do this?`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(dialogTitle, message, okButtonText, cancelButtonText);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      this.result = dialogResult;
    });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

}
