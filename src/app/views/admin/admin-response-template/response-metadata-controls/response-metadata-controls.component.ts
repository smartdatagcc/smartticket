import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfirmDialogModel, ConfirmDialogComponent} from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'underscore';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { EditResponseTemplateControlDialogModel, EditResponseTemplateComponent } from '../edit-response-template/edit-response-template.component';

@Component({
  selector: 'app-response-metadata-controls',
  templateUrl: './response-metadata-controls.component.html',
  styleUrls: ['./response-metadata-controls.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class ResponseMetadataControlsComponent implements OnInit {

  tenantId: number;
  formId: any;
  lookupdata: any;
  controlTypes: any;
  newOption: any;
  @Input() templateControls;
  @Input() data;
  @Output() updateEvent = new EventEmitter<string>();

  constructor( @Optional() private ngForm: NgForm,
               private ref: ChangeDetectorRef,
               private route: ActivatedRoute,
               public dialog: MatDialog,
               private notifyService: ToastrnotificationService ,
               private spinner: NgxSpinnerService, ) { }

  ngOnInit(): void {
    this.spinner.show();
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
    });


    if (this.templateControls != undefined){
      this.spinner.hide();
    }
  }

  // sorting
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.templateControls, event.previousIndex, event.currentIndex);
    this.callParentsubmit();
  }

  editResponseControl(control){
    const dialogData = new EditResponseTemplateControlDialogModel(this.data, control, this.tenantId, this.formId);

    const dialogRef = this.dialog.open(EditResponseTemplateComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult){
         this.templateControls = dialogResult; }
       });
  }

  // onswipe call parent submit button
  // tslint:disable-next-line: adjacent-overload-signatures
  callParentsubmit(): void {
    this.updateEvent.next(this.templateControls);
  }

  removeResponseControl(control){
    const dialogTitle = `Confirm deletion of the template <b>'` + control.name + `'</b>`;
    const message = `<strong><i>Note: this cannot be undone.</i></strong>`;
    const okButtonText = `Yes`;
    const cancelButtonText = `No`;

    const dialogData = new ConfirmDialogModel(
      dialogTitle,
      message,
      okButtonText,
      cancelButtonText
    );

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((dialogResult) => {
      const dlgresult = dialogResult;
      if (dlgresult === true) {
        const index = this.templateControls.indexOf(control, 0);
        if (index > -1) {
          this.templateControls.splice(index, 1);
          this.callParentsubmit();
        }
      }
    });
  }
}
