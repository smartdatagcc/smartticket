import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as SparkMD5 from 'spark-md5';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public authdataupdated: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public showhidesidebar: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor(private http: HttpClient, private router: Router, public jwtHelper: JwtHelperService) {}

  authentication: any = {
    isAuth: false,
    data: {},
    refreshToken: null,
    token: null,
  };

  setAuthdata() {
    this.authdataupdated.next(true);
  }

  getAuthdata(): Observable<any> {
    return this.authdataupdated.asObservable();
  }

  setshowhidesidebar(value) {
    this.showhidesidebar.next(value);
  }

  getshowhidesidebar(): Observable<any> {
    return this.showhidesidebar.asObservable();
  }

  getIss(): string {
    return this.authentication.data.iss;
  }

  // login api
  login(loginData) {
    return this.http.post(environment.apiUrl + '/api/auth', {
      email: loginData.email,
      password: loginData.password,
    });
  }

  // get logged in user permissions
  getCurrentPermission(tenantId, permission) {
    const currentRole = this.authentication.data.roles.find(
      (role) => role.tenant_id === Number(tenantId)
    );
    return currentRole && currentRole.permissions.access[permission];
  }

  isSuperUser() {
    return this.authentication.data.su;
  }

  // checking permisssions
  allowed(tenantId, permission) {
    if (this.authentication.data.su) {
      return true;
    }
    return this.getCurrentPermission(tenantId, permission);
  }

  // getting user pofile image
  getProfileImage() {
    if (this.authentication.data.image) {
      return this.authentication.data.image;
    }
    const size = 30;
    // tslint:disable-next-line:max-line-length
    return ( '//www.gravatar.com/avatar/' + SparkMD5.hash(this.authentication.data.email.toLowerCase()) + '?d=identicon&s=' + size + '&f=y' );
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    // Check whether the token is expired and return
    // true or false
    return !this.jwtHelper.isTokenExpired(token);
  }

  // resetting  auth
  fillAuthData() {
    const decodedToken = this.jwtHelper.decodeToken(localStorage.token);
    const isExpired = this.jwtHelper.isTokenExpired(localStorage.token);
    if (localStorage.token && !isExpired) {
      this.authentication.isAuth = true;
      this.authentication.token = localStorage.token;
      this.authentication.data = decodedToken;
    } else {
      this.authentication.isAuth = false;
      this.logout();
    }
  }

  // logout
  logout() {
    const tenant = localStorage.tenant ? JSON.parse(localStorage.tenant) : localStorage.viewtenant? JSON.parse(localStorage.viewtenant) : null;
    const tenantid = tenant?.id;
    localStorage.removeItem('token');
    this.authentication = {};
    if(tenantid) {
      this.router.navigate(['/' + tenantid + '/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  refreshToken() {
    if (localStorage.token) {
      const authData = this.jwtHelper.decodeToken(localStorage.token);
      localStorage.removeItem('token');
      return this.http.post(environment.apiUrl + '/api/auth/refresh', {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        observe: 'response',
      });
    }
  }

  invitedUserRegistration(tenantId, registration) {
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/account/invitedUser', registration);
  }

  saveRegistration(tenantId, registration) {
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/account', registration);
  }

  addUserToTenant(tenantId, token?){
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/account/registration', {token});
  }

}
