import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Notification } from '../../model/notification/notification';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AccountServiceService {
  notifications = null;
  public notificationsUpdated: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor(private http: HttpClient, private router: Router) { }


  // setting notification Updated
  setNotificationUpdated() {
    this.notificationsUpdated.next(true);
  }

  // fetching notification Updated details
  getNotificationUpdatedStatus(): Observable<any> {
    return this.notificationsUpdated.asObservable();
  }


  getNotifications(tenantId): Observable<Notification[]> {
    return this.http.get<Notification[]>(environment.apiUrl + '/api/' + tenantId + '/account/notifications');
  }

  // forgot password api
  forgotPassword(data) {
    console.log(data);
    return this.http.post(environment.apiUrl + '/api/account/forgotpassword', data);
  }

  // Update Password API
  updatePassword(password) {
    return this.http.put(environment.apiUrl + '/api/account/password', { password });
  }

  // update Account tenant
  updateAccountTenant(user, tenantId) {
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/account', {
      name: user.name,
      email: user.email,
      user_metadata: user.user_metadata
    });
  }

  // update user tenant
  updateAccount(user) {
    return this.http.put(environment.apiUrl + '/api/account', {
      name: user.name,
      email: user.email,

    });
  }

  // Getting the Dashboard details
  getDashboard(id) {
    return this.http.get(environment.apiUrl + '/api/account/dashboard');
  }

  // reset password
  resetPassword(request) {
    return this.http.post(environment.apiUrl + '/api/account/resetpassword', request);
  }

  // Delete Notifications
  deleteNotifications(tenantId, url) {
    if (url === true) {
      url = '';
      return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/account/notifications');
    } else {
      return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/account/notifications?url=' + encodeURIComponent(url));
    }
  }

  getResetUrl(userId) {
    return this.http.get(environment.apiUrl + `/api/${userId}/account/reseturl`);
  }

  // reset user's password
  resetUserPassword(request) {
    return this.http.post(environment.apiUrl + '/api/account/resetuserpassword', request);
  }

}
