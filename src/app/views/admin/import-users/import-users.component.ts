import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import * as _ from 'underscore';
import { ThemePalette } from '@angular/material/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { NgForm } from '@angular/forms';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-import-users',
  templateUrl: './import-users.component.html',
  styleUrls: ['./import-users.component.scss']
})
export class ImportUsersComponent implements OnInit {
  @ViewChild('inputFile') myInputVariable: ElementRef;
  constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, public dialog: MatDialog,
              private authService: AuthService, public controlsService: ControlsServiceService, private titleService: Title,
              private userService: UserService, private notifyService: ToastrnotificationService) { }

  tenantId: any;
  su: any;
  example: any;
  lookupData: any;
  clearExisting: boolean = false;
  metadata: any;
  results: any[] = [];
  file: any;
  color: ThemePalette = 'primary';
  exampleBase: any = {
    name: 'John Smith',
    email: 'john.smith@smartdatasystems.net',
    password: '@#!RF3q32ads34@#',
    role: 'User'
  };

  @ViewChild('tenantAdminForm') tenantAdminForm: any;

  CanDeactivate(): any {
    if (this.tenantAdminForm.form.dirty || this.tenantAdminForm.form.dirty) {
      return this.openDialog();
    }
    else {
      return true;
    }
  }
  ngOnInit(): void {
    this.titleService.setTitle('import-users');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    const THIS = this;
    this.su = this.authService.authentication.data.su;
    this.lookupData = this.lookupService.lookupdata;
    const metadata = this.lookupData.tenant.userTemplate.controls.reduce(function (r, v) {
      r[v.name] = THIS.controlsService.getControlValueExample(v);
      return r;
    }, {});

    // Merging Meta Data control data with Example Base
    this.example = Object.assign({}, this.exampleBase, metadata);
  }
  // form is dirty or not
  openDialog() {
    const dialogTitle = `Leave Page?`;
    const message = `You haven't saved your changes. Do you want to leave without finishing ?`;
    const okButtonText = `Leave This Page  `;
    const cancelButtonText = `Stay on This Page`;
    const dialogData = new ConfirmDialogModel(dialogTitle, message, okButtonText, cancelButtonText);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: dialogData
    });
    return dialogRef.afterClosed();
  }

  update(thisRef, data) {
    thisRef.results = data;
    console.log('From Update Method: ' + thisRef.results);
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const selected_file = event.target.files[0];
      const extension = this.getFileExtension1(selected_file.name);
      if (extension == 'json') {
        this.file = event.target.files[0];
      } else {
        this.notifyService.showErrorMessage('please select json files only', 'Error');
      }
    }
  }

  // getting file extension
  getFileExtension1(filename) {
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
  }

  bulkImport(tenantAdminForm: NgForm) {
    this.results = [];
    const thisRef = this;
    if (this.myInputVariable.nativeElement.value != '') {
      this.userService.bulkImport(thisRef, this.file, this.tenantId, this.clearExisting, this.update)
        .subscribe((result: any) => {
          // console.log('After Success: ' + this.results);
          this.file = null;
          this.myInputVariable.nativeElement.value = '';
          this.notifyService.showSuccessMessage('Import Completed', 'Success');
          this.tenantAdminForm.form.markAsPristine();
        },
          error => {
            console.log(error.error.message);
            this.file = null;
            this.myInputVariable.nativeElement.value = '';
            this.notifyService.showErrorMessage(error.error.message, 'Error');
          });
    }
    else {
      this.results = [{ reason: 'Choose a file to import', success: false }];
    }
  }
}
