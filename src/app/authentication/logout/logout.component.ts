import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private authService: AuthService, private spinner: NgxSpinnerService, private router: Router) {}

  ngOnInit(): void {
    const tenantId = JSON.parse(localStorage.getItem('tenant'))?.id;
    localStorage.clear();
    this.authService.authentication = {};
    this.spinner.show();
    if (tenantId) {
      this.router.navigate(['/' + tenantId + '/login']);
    } else {
      this.router.navigate(['/']);
    }
  }

}
