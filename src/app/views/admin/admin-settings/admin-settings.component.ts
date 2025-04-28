import { Component, OnInit, ViewChild } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgForm } from '@angular/forms';
import { ModuleServiceService } from 'src/app/services/module-service/module-service.service';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserService } from 'src/app/services/user-service/user.service';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit {
  constructor(
    private lookupService: LookupServiceService,
    private route: ActivatedRoute,
    public authService: AuthService,
    private spinner: NgxSpinnerService,
    private moduleService: ModuleServiceService,
    private tenantService: TenantServiceService,
    private userService: UserService,
    private toastrService: ToastrnotificationService,
    private titleService: Title
  ) { }

  tenant: any;
  tenantId: any;
  tierName: any;
  tenantLogo: any;
  modules: any;
  allowRegistrationName: any;
  logoImage: any;
  su: any;
  element: HTMLElement;
  message: any;
  submitted = false;
  canViewAdminPages: any;
  selectedvalue: string[] = [];
  isCustomReport: boolean;
  themeColor: string;
  tinyMceConfig: any;
  maxLength1 = 0;
  maxLength2 = 7;
  markannouncementdirty = false;
  @ViewChild('tenantAdminForm') tenantAdminForm: any;
  themes = [
    { class: 'skin-blue', name: 'Blue', primary: 'bg-blue', secondary: 'bg-black' },
    { class: 'skin-navy', name: 'Navy', primary: 'bg-navy', secondary: 'bg-black' },
    { class: 'skin-aqua', name: 'Aqua', primary: 'bg-aqua', secondary: 'bg-black' },
    { class: 'skin-purple', name: 'Purple', primary: 'bg-purple', secondary: 'bg-black' },
    { class: 'skin-green', name: 'Green', primary: 'bg-green', secondary: 'bg-black' },
    { class: 'skin-red', name: 'Red', primary: 'bg-red', secondary: 'bg-black' },
    { class: 'skin-yellow', name: 'Yellow', primary: 'bg-yellow', secondary: 'bg-black' },
    { class: 'skin-maroon', name: 'Maroon', primary: 'bg-maroon', secondary: 'bg-black' },
    { class: 'skin-lime', name: 'SDS', primary: 'bg-lime', secondary: 'bg-black' },
    { class: 'skin-black', name: 'Monochrome', primary: 'bg-white', secondary: 'bg-black' },
    { class: 'skin-blue-light', name: 'Blue Light', primary: 'bg-blue', secondary: 'bg-white' },
    { class: 'skin-navy-light', name: 'Navy Light', primary: 'bg-navy', secondary: 'bg-white' },
    { class: 'skin-aqua-light', name: 'Aqua Light', primary: 'bg-aqua', secondary: 'bg-white' },
    { class: 'skin-purple-light', name: 'Purple Light', primary: 'bg-purple', secondary: 'bg-white' },
    { class: 'skin-green-light', name: 'Green Light', primary: 'bg-green', secondary: 'bg-white' },
    { class: 'skin-red-light', name: 'Red Light', primary: 'bg-red', secondary: 'bg-white' },
    { class: 'skin-yellow-light', name: 'Yellow Light', primary: 'bg-yellow', secondary: 'bg-white' },
    { class: 'skin-black-light', name: 'White Light', primary: 'bg-white', secondary: 'bg-white' }
  ];

  CanDeactivate(): any {
    const annbanner = this.tenantAdminForm.form.controls.Description;

    if (this.markannouncementdirty === true){
      if (annbanner === undefined){
        this.tenantAdminForm.form.markAsDirty();
      }else{
        annbanner.markAsTouched();
      }
    }

    if (annbanner !== undefined){
      if (this.tenantAdminForm.form.dirty && annbanner.touched){
        annbanner.markAsDirty();
      }else{
        annbanner.markAsPristine();
      }
    }

    if (this.tenantAdminForm.form.dirty) {
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }


  ngOnInit(): void {
    this.titleService.setTitle('Admin Settings');
    this.configureTinyMce();
    this.allowRegistrationName = false;
    this.logoImage = null;
    this.spinner.show();
    this.lookupService.checkToken();
    this.submitted = false;
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
      this.lookupService.getTenantName(this.tenantId).subscribe((data: {
        domain: string,
        inviteOnly: boolean,
        logoUrl: string,
        tenantName: string,
        themeColor: string
      }) => {
        localStorage.setItem('tenant', JSON.stringify({ name: data.tenantName, id: params.tenantId }))
      });
    });

    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(
        (data) => {
          this.lookupService.storeData(data);
          this.tenant = data;
          this.tierName = this.tenant.tenant.tier.name.split(' ')[0];
          this.tenantLogo = this.tenant.tenant.tenantSettings.settings.logoUrl;
          this.themeColor = this.tenant.tenant.tenantSettings.settings.themeColor || 'skin-blue';
          this.su = this.authService.authentication.data.su;
          this.tenant.tenant.tenantSettings.settings.themeColor = this.tenant.tenant.tenantSettings.settings.themeColor || 'skin-blue';
          this.tenant.tenant.tenantSettings.settings.modules = this.tenant.tenant.tenantSettings.settings.modules || [];
          this.modules = this.moduleService.modules();
          this.isCustomReport = this.tenant.tenant.tenantSettings.settings.modules.length > 0 ? true : false;
          this.canViewAdminPages = this.authService.allowed(this.tenantId, 'CanViewAdminPages');
          this.spinner.hide();
        },
        (error) => {
          this.spinner.hide();
        }
      );

    }

  }

  configureTinyMce() {
    this.tinyMceConfig = {
      menubar: false,
      height: 400,
      paste_data_images: true,
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount', 'image code'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat',
    };
  }

  onChange(isChecked: boolean) {
    if (isChecked) {
      this.selectedvalue.push('custom-report');
    }
    else {
      const index = this.selectedvalue.indexOf('custom-report', 0);
      if (index > -1) {
        this.selectedvalue.splice(index, 1);
      }
    }
    this.tenant.tenant.tenantSettings.settings.modules = this.selectedvalue;
  }

  updateTenant(tenantAdminForm: NgForm) {
    this.message = '';
    this.submitted = true;
    if (this.tenant.tenant.tenantSettings.settings.showAnnouncement &&  tenantAdminForm.form.value.Description !== undefined &&
       tenantAdminForm.form.value.Description.length > 5000) {
      this.tenantAdminForm.form.controls.Description.setErrors({ incorrect: true });
      this.message = 'Error: Announcement Body: must not exceed 5000';
      return;
    }

    if (!tenantAdminForm.form.valid) {
      this.message = 'Error: Please enter all the required fields';
      return;
    }

    this.spinner.show();
    // make sure these are saved properly:
    if (!this.tenant.tenant.tenantSettings.settings.registrationInviteOnly ||
      !this.tenant.tenant.tenantSettings.settings.restrictRegistrationToDomain) {
      this.tenant.tenant.tenantSettings.settings.restrictRegistrationToDomain = false;
      this.tenant.tenant.tenantSettings.settings.restrictedRegistrationDomain = '';
    }
    this.tenantService.updateTenant(this.tenant.tenant).subscribe((response: any) => {
      this.tenantService.setTenanName(this.tenant.tenant.name);
      this.themeColor = this.tenant.tenant.tenantSettings.settings.themeColor;
      this.tenantService.setThemeChanged(this.tenant.tenant.tenantSettings.settings.themeColor);
      this.authService.refreshToken().subscribe((success: any) => {
        this.spinner.hide();
        const helper = new JwtHelperService();
        const tokenPayload = helper.decodeToken(success.token);
        this.authService.authentication.isAuth = true;
        this.authService.authentication.token = success.token;
        this.authService.authentication.refreshToken = success.refresh_token || null;
        this.authService.authentication.data = tokenPayload;
        const tenantId = tokenPayload.tenants[0].id;
        localStorage.token = success.token;
        this.submitted = false;
        this.markannouncementdirty = false;
        this.moduleService.setSelectModules(this.moduleService.getTenantModules(this.tenantId));
        this.toastrService.showSuccessMessage('Tenant Details Updated', 'Saved');
        tenantAdminForm.form.markAsPristine();
      },
        (error) => {
          this.spinner.hide();
          this.toastrService.showErrorMessage(error.error.message, 'Error');
        }
      );
    },
      (error) => {
        this.spinner.hide();
        this.toastrService.showErrorMessage(error.error.message, 'Error');
      }
    );
  }


  onNotifyChange(event) {
    this.tenant.tenant.tenantSettings.settings.restrictRegistrationToDomain = event;
  }

  onNotifyShowAnnouncementChange(event) {
    this.tenant.tenant.tenantSettings.settings.showAnnouncement = event;
  }

  changeSubscription() {
    window.open('http://help.getsmartticket.com/wordpress/forms/change-subscription-level/?tid=' + this.tenantId, '_blank');
  }

  openFileBrowser(event) {
    event.preventDefault();
    this.element = document.getElementById('tenantPhotoId') as HTMLElement;
    this.element.click();
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      this.spinner.show();
      const file = event.target.files[0];
      this.tenantService.updateLogo(file, this.tenantId).subscribe(
        (data: any) => {
          if (data.logoUrl) {
            this.tenant.tenant.tenantSettings.settings.logoUrl = data.logoUrl;
            this.tenant.tenant.tenantSettings.settings.logoBucket = data.logoBucket;
            this.tenant.tenant.tenantSettings.settings.logoFileName = data.logoFileName;
            this.tenantService.setTenanImage(data.logoUrl);
            this.tenantLogo = data.logoUrl;
            this.tenantService.updateTenant(this.tenant.tenant).subscribe((response: any) => {
              this.authService.refreshToken().subscribe(
                (success: any) => {
                  this.spinner.hide();
                  const helper = new JwtHelperService();
                  const tokenPayload = helper.decodeToken(success.token);
                  this.authService.authentication.isAuth = true;
                  this.authService.authentication.token = success.token;
                  this.authService.authentication.refreshToken = success.refresh_token || null;
                  this.authService.authentication.data = tokenPayload;
                  const tenantId = tokenPayload.tenants[0].id;
                  localStorage.token = success.token;
                  this.toastrService.showSuccessMessage('Logo Updated', 'Saved');
                },
                (error) => {
                  this.spinner.hide();
                  this.toastrService.showErrorMessage(error.error.message, 'Error');
                }
              );

            });
          }
        },
        (error) => {
          this.spinner.hide();
          this.toastrService.showErrorMessage(error.error.message, 'Error');
        }
      );
    }
  }

  removeLogoImage() {
    this.spinner.show();
    this.tenantService.removeLogo(this.tenantId).subscribe((data) => {
      this.tenantService.setTenanImage('');
      this.tenant.tenant.tenantSettings.settings.logoUrl = null;
      this.tenant.tenant.tenantSettings.settings.logoBucket = null;
      this.tenant.tenant.tenantSettings.settings.logoFileName = null;
      // make sure these are saved properly:
      if (!this.tenant.tenant.tenantSettings.settings.registrationInviteOnly ||
        !this.tenant.tenant.tenantSettings.settings.restrictRegistrationToDomain) {
        this.tenant.tenant.tenantSettings.settings.restrictRegistrationToDomain = false;
        this.tenant.tenant.tenantSettings.settings.restrictedRegistrationDomain = '';
      }
      this.tenantService.updateTenant(this.tenant.tenant).subscribe((response: any) => {
        this.authService.refreshToken().subscribe((success: any) => {
          this.spinner.hide();
          const helper = new JwtHelperService();
          const tokenPayload = helper.decodeToken(success.token);
          this.authService.authentication.isAuth = true;
          this.authService.authentication.token = success.token;
          this.authService.authentication.refreshToken = success.refresh_token || null;
          this.authService.authentication.data = tokenPayload;
          const tenantId = tokenPayload.tenants[0].id;
          localStorage.token = success.token;
          this.toastrService.showSuccessMessage('Logo Updated', 'Saved');
        },
          (error) => {
            this.spinner.hide();
            this.toastrService.showErrorMessage(error.error.message, 'Error');
          });
      },
        error => {
          this.spinner.hide();
          this.toastrService.showErrorMessage(error.error.message, 'Error');
        });
    });
  }
  // Make form dirty
  makeformDirty() {
    this.tenantAdminForm.form.markAsDirty();
  }

  markannouncedirty(){
    this.tenantAdminForm.form.markAsDirty();
    this.markannouncementdirty = true;
  }
}
