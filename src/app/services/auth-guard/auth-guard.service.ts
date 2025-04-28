import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(public auth: AuthService, public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isAuthenticated()) {
      if (localStorage.tenant !== undefined) {
        const tenantid = JSON.parse(localStorage.tenant).id;
        this.router.navigate(['/' + tenantid + '/login']);
        return false;
      } else {
        let params = route.params;
        let formId = route.children[0].params.formId;
        let ticketId = route.children[0].params.id;
        const tenantId = params['tenantId'];
        // if formId & ticketId exist on URL pass them along to login
        if (tenantId && formId && ticketId) {
          this.router.navigate(['/' + tenantId + '/login/' + formId + '/' + ticketId]);
        } else if (tenantId) {
          this.router.navigate(['/' + tenantId + '/login']);
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      }
    }
    return true;
  }
}