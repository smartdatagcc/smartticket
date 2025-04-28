import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { ActivatedRoute } from '@angular/router';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
})
export class ManageUsersComponent implements OnInit {
  currentUserData;
  pendingUserData;
  roles;
  tenantId: number;
  userLimit: number;
  tabIndex = 0 ;
  constructor(
    private userService: UserService,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private lookupService: LookupServiceService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Manage Users');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.getallRoles();
    this.getcurrentusers();
    this.getpendingusers();
    this.userLimit = this.lookupService.lookupdata.tenant.tier.users;
  }

  changeTab(event){
    this.tabIndex = event.index;
 }

  getcurrentusers() {
    this.userService.getAllUsers(this.tenantId).subscribe(
      (response) => {
        this.currentUserData = response;
        this.ref.detectChanges();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getpendingusers() {
    this.userService.getAllPendingUsers(this.tenantId).subscribe(
      (response) => {
        this.pendingUserData = response;
        this.ref.detectChanges();
      },
      (error) => {
        console.log(error);
      }
    );
  }
  getallRoles() {
    this.lookupService.getRoles(this.tenantId).subscribe((rolesdata) => {
      this.roles = rolesdata;
      this.ref.detectChanges();
    });
  }

  getNewusers($event){
    this.currentUserData = $event;
  }
}
