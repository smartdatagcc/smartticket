import { Component, OnInit, Input, Inject } from '@angular/core';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { UserService } from 'src/app/services/user-service/user.service';
import * as SparkMD5 from 'spark-md5';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-user-profile-dialog',
  templateUrl: './user-profile-dialog.component.html',
  styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent implements OnInit {
  user: any;
  lookupData: any;
  themeColor: string;
  currentRole: any;
  image: any;
  controls: any[];
  userid: any;
  tenantId: any;

  constructor(private lookupService: LookupServiceService,
    private userService: UserService,
    private controlsService: ControlsServiceService,
    public dialogRef: MatDialogRef<UserProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserProfileDialogModel) {
    // Update view with given values
    this.userid = data.userid;
    this.tenantId = data.tenantId;
  }

  ngOnInit(): void {
    if (this.tenantId !== '' && this.tenantId !== undefined) {
      this.lookupData = this.lookupService.lookupdata;
      this.getUserData(this.tenantId, this.userid);
    }
    this.themeColor = 'skin-blue';
    this.themeColor = this.lookupData.tenant.tenantSettings.settings.themeColor || this.themeColor;
  }

  // getting the user data for given tenant and userid from the user service
  getUserData(tenantId: string, id: string) {
    this.userService.getUser(tenantId, id).subscribe((data: any) => {
      this.user = data;
      this.currentRole = this.user.roles.find(role => role.tenant_id == this.tenantId);
      this.image = this.getProfileImage();
      this.getControls();
    });
  }

  // getting user pofile image
  getProfileImage() {
    if (this.user.image) {
      return this.user.image;
    }
    const size = 30;
    // tslint:disable-next-line:max-line-length
    return '//www.gravatar.com/avatar/' + SparkMD5.hash(this.user.email.toLowerCase()) + '?d=identicon&s=' + size + '&f=y';
  }

  // getting the control label and value
  getControls(): any {
    this.controls = this.user.user_metadata.controls.map(control => {
      return {
        label: control.label,
        type: control.type,
        val: this.controlsService.getControlValue(control, true)
      };
    });
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}

/**
 * Class to represent confirm dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class UserProfileDialogModel {

  constructor(public userid: any, public tenantId: any) {
  }
}
