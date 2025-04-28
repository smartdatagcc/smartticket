import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import * as SparkMD5 from 'spark-md5';
import { NgForm } from '@angular/forms';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import {  forkJoin } from 'rxjs';
import { DocumentationComponent, DocumentationDialogModel } from 'src/app/views/admin/admin-api/documentation/documentation.component';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-api',
  templateUrl: './admin-api.component.html',
  styleUrls: ['./admin-api.component.scss']
})
export class AdminApiComponent implements OnInit {

  tenantId: any;
  lookupData: any;
  users: any;
  tenant: any;
  apiToggle: boolean;
  baseUrl: string;
  apiDomain: string;
  @ViewChild('tenantAdminAPIForm') tenantAdminAPIForm: any;

  constructor(private route: ActivatedRoute,
              private lookupService: LookupServiceService,
              private userService: UserService,
              private notifyService: ToastrnotificationService,
              private router: Router,
              private tenantService: TenantServiceService,
              public dialog: MatDialog,
              private formService: FormServiceService,
              private spinner: NgxSpinnerService,
              public authService: AuthService,
              private titleService: Title,
    ) { }


    CanDeactivate(): any {
        if (this.tenantAdminAPIForm.form.dirty || this.tenantAdminAPIForm.form.dirty) {
              return this.userService.openDialog();
        }
        else {
          return true;
        }
      }

  ngOnInit(): void {
     this.titleService.setTitle('Api Connectivity');
     // getting parent tenantId from url
     this.route.parent.params.subscribe(params => {
      this.tenantId = params.tenantId;
    });

    // Getting the lookup data
     this.lookupData = this.lookupService.lookupdata;

     // Initializing the required variables
     this.getInitialize();

     // Getting all the Tenant Users
     this.getAllusers();
  }


  // Initializing the required variables
  getInitialize(){
    this.tenant = this.lookupData.tenant;
    this.apiToggle = !!this.tenant.tenantSettings.settings.apiKey;
    this.baseUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    this.apiDomain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    if (this.tenant.tier.level !== 2 && this.tenant.tier.level !== 3) {
     // Navigating to the Admin Settings, if the Tenant is not authorized to the API connectivity screen
     const path = this.tenantId + '/admin/settings';
     this.router.navigate([path]);
   }
  }

  // Getting the Tenant users
  getAllusers() {
  this.userService.getAllUsers(this.tenantId).subscribe(
      (response) => {
        this.users = response;
      },
      (error) => {
        this.notifyService.showErrorMessage(error.error.message, 'Error while getting Tenant users');
      }
    );
  }

  // Getting the default settings when Enabling the API Access toggle
  toggleAPIAccess(e){
    if (e.checked && !this.tenant.tenantSettings.settings.apiKey){
      this.tenant.tenantSettings.settings.apiKey = SparkMD5.hash(Math.random().toString());
    }
    if (e.checked && !this.tenant.tenantSettings.settings.apiReturnUrl){
      this.tenant.tenantSettings.settings.apiReturnUrl = this.baseUrl;
    }
    if (e.checked && !this.tenant.tenantSettings.settings.apiErrorUrl){
      this.tenant.tenantSettings.settings.apiErrorUrl = this.baseUrl;
    }
  }

  updateTenant(apiconnectivityForm: NgForm){
    if (!apiconnectivityForm.invalid){
      this.spinner.show();
      if (!this.apiToggle) {
        this.tenant.tenantSettings.settings.apiKey = null;
      }

      if (this.tenant.tenantSettings.settings.apiRefs){
        this.tenant.tenantSettings.settings.apiRefs = this.tenant.tenantSettings.settings.apiRefs.replace('http:', '')
        .replace('https:', '').replace(/\//g, '');
      }

      const hopesAndDreams = [];
      hopesAndDreams.push(this.tenantService.updateTenant(this.tenant));
      this.tenant.forms.forEach(form => {
        hopesAndDreams.push(this.formService.save(this.tenantId, form));
      });
      // Calling API's parallel by using rxJs forkJoin method
      forkJoin(hopesAndDreams).subscribe(data => {
        this.notifyService.showSuccessMessage('Api Settings Updated', 'Saved');
        this.spinner.hide();
        this.tenantAdminAPIForm.form.markAsPristine();
      }, error => {
        this.notifyService.showErrorMessage(error.error.message, 'Error');
        this.spinner.hide();
      });

    }
  }

  // Documentation Example
  Documentation(form): void{
    const dialogData = new DocumentationDialogModel(this.baseUrl, this.tenantId, this.tenant, form, this.apiDomain);
    const windowsHeight = window.innerHeight - 150;
    const dialogRef = this.dialog.open(DocumentationComponent, {
      data: dialogData,
      width: '650px',
      minHeight: '500px',
      maxHeight: windowsHeight + 'px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      const dilgResult = dialogResult;
      if (dilgResult){
        console.log (dilgResult);

      }
    });
  }

}
