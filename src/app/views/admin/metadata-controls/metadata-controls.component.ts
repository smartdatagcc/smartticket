import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, Optional } from '@angular/core';
import { UserService } from '../../../services/user-service/user.service';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from '../../../services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfirmDialogModel, ConfirmDialogComponent} from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'underscore';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { EditControlDialogModel, EditControlModalComponent } from 'src/app/views/admin/metadata-controls/edit-control-modal/edit-control-modal.component';


@Component({
  selector: 'app-metadata-controls',
  templateUrl: './metadata-controls.component.html',
  styleUrls: ['./metadata-controls.component.scss'],
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class MetadataControlsComponent implements OnInit {

  tenantId: number;
  lookupdata: any;
  controlTypes: any;
  newOption: any;
  @Input() templateControls;
  @Output() updateEvent = new EventEmitter<string>();
  constructor( @Optional() private ngForm: NgForm,
               private userService: UserService,
               private ref: ChangeDetectorRef,
               private route: ActivatedRoute,
               private lookupService: LookupServiceService,
               private ControlService: ControlsServiceService,
               public dialog: MatDialog,
               private notifyService: ToastrnotificationService ,
               private spinner: NgxSpinnerService, ) { }

  ngOnInit(): void {
    this.spinner.show();
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.controlTypes = this.ControlService.getControlTypes();

    if(this.templateControls != undefined){
      this.spinner.hide();
    }
  }

  // sorting
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.templateControls, event.previousIndex, event.currentIndex);
    this.callParentsubmit();
  }

  hasOptionsControl(controlType) {
    return this.ControlService.hasOptionsControl(controlType);
  }

  // onswipe call parent submit button
  callParentsubmit(): void {
    this.updateEvent.next(this.templateControls);
  }

  removeUserField(control){
    const dialogTitle = `Please confirm you want to remove this field`;
    const message = `<strong><i>Note: This field will be removed from all existing instances of this form</i></strong>`;
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
  // Add new option
  addoption(control){
    const index: number = control.options.indexOf(this.newOption);
    if (this.newOption && this.newOption.length > 0) {
      if (index !== -1) {
        this.notifyService.showErrorMessage('Option Already exist!', 'Error');
      }else{
        control.options.push(this.newOption);
        this.ngForm.form.markAsDirty();
        this.newOption = '';
      }
    }
  }

  // removing option from selected control
  removeOption(control, option) {
    const index: number = control.options.indexOf(option);
    if (control.options.length > 1) {
      if (index !== -1) {
        control.options.splice(index, 1);
        this.ngForm.form.markAsDirty();
      }
    }
  }

  editControl(control){
    const dialogData = new EditControlDialogModel(control);

    const dialogRef = this.dialog.open(EditControlModalComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
      if (dilgResult){
        const index = this.templateControls.indexOf(control, 0);
        if (index > -1) {
          this.templateControls.splice(index, 1);
        }
        this.templateControls.push(dilgResult);
        this.callParentsubmit();
      }
    });
  }

}
