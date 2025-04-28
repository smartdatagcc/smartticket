import { Component, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { AccountServiceService } from 'src/app/services/account-service/account-service.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WorkspaceComponent implements OnInit {
  tenants;
  email;
  name;
  su;
  image;
  isAuth;
  tenantData;
  screenHeight;
  constructor(public authService: AuthService, private accountService: AccountServiceService, private router: Router,
    private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Smart Ticket Workspaces');
    this.screenHeight = window.innerHeight;
    if (localStorage.token) {
      this.authService.fillAuthData();
    }

    if (this.authService.authentication.isAuth) {
      this.tenants = this.authService.authentication.data.tenants || [];
      this.email = this.authService.authentication.data.email;
      this.name = this.authService.authentication.data.name;
      this.su = this.authService.authentication.data.su;
      this.image = this.authService.getProfileImage();
      this.isAuth = true;
      this.accountService.getDashboard(this.authService.authentication.data.id).subscribe((data) => {
        this.tenantData = data;
      },
        (error) => {
          console.log(error);
        });
    }
  }

  redirecttodashboard(tenant) {
    const tenantid = tenant['key'];
    const tenantname = tenant['value'].name;
    const tenantDetails = { id: tenantid, name: tenantname };
    localStorage.tenant = JSON.stringify(tenantDetails);
    this.router.navigate(['/' + tenantid + '/dashboard']);
  }
}
