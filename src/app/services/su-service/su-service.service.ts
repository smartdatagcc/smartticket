import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuServiceService {

  constructor(private http: HttpClient) { }

  getAllTenants() {
    return this.http.get(environment.apiUrl + '/api/su/tenants');
  }
  getAllSettings() {
    return this.http.get(environment.apiUrl + '/api/su/settings');
  }

  addNewTenant(tenant) {
    return this.http.post(environment.apiUrl + '/api/su/tenant', tenant);
  }

  updateTenant(tenant) {
    return this.http.put(environment.apiUrl + '/api/su/' + tenant.id + '/tenant', tenant);
  }

  getAllSuperUsers(){
    return this.http.get(environment.apiUrl + '/api/su/superusers');
  }

  revokeSuperUser(id){
    return this.http.delete(environment.apiUrl + '/api/su/superusers/' + id);
  }

  addSuperUser(email){
    return this.http.post(environment.apiUrl + '/api/su/superusers', {email});
  }

  // Mass-send forgot password email to all tenant users
  sendResetPasswordEmail(tenantId) {
    return this.http.post(environment.apiUrl + '/api/su/resetpasswordemail', {tenantId});
  }

  // get logs
  getLogs(){
    return this.http.get(environment.apiUrl + '/api/su/log', {responseType: 'text'});
  }

  updateSetting(setting){
    return this.http.put(environment.apiUrl + '/api/su/updatesetting', setting);
  }

}
