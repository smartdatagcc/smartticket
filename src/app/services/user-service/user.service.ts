import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../authentication/auth.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogModel, ConfirmDialogComponent } from 'src/app/common/control-templates/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient, private router: Router, private authService: AuthService, public dialog: MatDialog) { }

  // getting roles from server
  getUser(tenantId, id) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/users/' + id);
  }

  // getting user using tenant id from server
  getAllUsers(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/users');
  }

  // getting Pendinguser using tenant id from server
  getAllPendingUsers(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/users/pending');
  }
  // remove user from tenanat
  removeUserFromTenant(tenantId, id) {
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/users/' + id);
  }
  // remove pending user
  removePendingUser(tenantId, pendingUserIdToRemove) {
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/pendinguser/' + pendingUserIdToRemove);
  }
  // resend invite
  resendInvite(tenantId, pendingUsrId) {
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/users/invite/resend', { pendingUserId: pendingUsrId });
  }

  // Get Pending User
  getPendingUser(token) {
    return this.http.get(environment.apiUrl + '/api/pendinguser/' + token);
  }

  inviteUser(tenantId, user) {
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/users/invite', user);
  }

  getAssignableUsers(tenantId, formId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/users/assignable/' + formId);
  }

  // For updating user information
  updateUser(tenantId, user) {
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/users/' + user.id, user);
  }

  bulkImport(thisRef, file, tenantId, clearExisting, progressFn) {
    let fd = new FormData();
    fd.append('file', file);
    fd.append('clearExisting', clearExisting);


    return Observable.create(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', environment.apiUrl + '/api/' + tenantId + '/usersimport', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.authService.authentication.token);
      xhr.onprogress = function () {
        let data = xhr.responseText.substr(0, xhr.responseText.lastIndexOf('}') + 1) + ']';
        if ((xhr.responseText.substr(xhr.responseText.length - 2, 1) === ']')
          && (xhr.responseText.substr(0, 1) !== '[')
        ) {
          data = '[' + data;
        }
        progressFn(thisRef, JSON.parse(data));
      };
      xhr.onload = function (e) {
        if (xhr.status === 200) {
          observer.next(JSON.parse(xhr.response));
          observer.complete();
        } else {
          observer.error(xhr.response);
        }
      };
      xhr.send(fd);
    });
  }

  // Manage users
  getManagingUsers(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/users/manageTickets');
  }


  // form is dirty or not
  openDialog() {
    const dialogTitle = `Leave Page?`;
    const message = `You haven't saved your changes. Do you want to leave without finishing ?`;
    const okButtonText = `Leave This Page  `;
    const cancelButtonText = `Stay on This Page`;

    const dialogData = new ConfirmDialogModel(dialogTitle, message, okButtonText, cancelButtonText);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '600px',
      data: dialogData
    });
    return dialogRef.afterClosed();
  }

}
