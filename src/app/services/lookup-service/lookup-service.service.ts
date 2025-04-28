import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../authentication/auth.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class LookupServiceService {
  public selectedForm: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public selectedFormName: BehaviorSubject<any> = new BehaviorSubject<any>('');
  public toggleSetting: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public tenantForms: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public selectedFormID: BehaviorSubject<any> = new BehaviorSubject<any>('');
  public lookupdatechanged: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public shorheadnameandsidebar: BehaviorSubject<any> = new BehaviorSubject<any>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService) { }

  lookupdata: any = {};

  setShorheadNameAndSidebar() {
    this.shorheadnameandsidebar.next(true);
  }

  getShorheadNameAndSidebar() {
    return this.shorheadnameandsidebar.asObservable();
  }
  // storing data
  storeData(data) {
    this.lookupdata = data;
    this.lookupdatechanged.next(true);
  }

  getLookupDataChanged() {
    return this.lookupdatechanged.asObservable();
  }

  // getting data from server
  getLookupData(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/lookup');
  }

  // getting roles from server
  getRoles(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/roles');
  }

  // check token exist
  checkToken() {
    if (localStorage.token) {
      this.authService.fillAuthData();
      const tenantid = this.authService.authentication.data.tenants[0].id;
    }
  }

  // setting tenant forms
  setTentantForms(forms) {
    this.tenantForms.next(forms);
  }

  // fetching tenant forms details
  getTenantForms(): Observable<any> {
    return this.tenantForms.asObservable();
  }

  // setting sected form
  setSelectedFormID(id) {
    this.selectedFormID.next(id);
  }

  // fetching selected form details
  getSelectedFormID(): Observable<any> {
    return this.selectedFormID.asObservable();
  }

  // setting sected form
  setSelectedForm(form) {
    this.selectedForm.next(form);
  }

  // fetching selected form details
  getSelectedForm(): Observable<any> {
    return this.selectedForm.asObservable();
  }

  // setting My or All Tickets Status
  setToggleSetting(toggleChecked) {
    this.toggleSetting.next(toggleChecked);
  }
  // Getting My or All Tickets Status
  getToggleSetting(): Observable<any> {
    return this.toggleSetting.asObservable();
  }

  // setting My or All Tickets Status
  setSelectedFormName(formNAme) {
    this.selectedFormName.next(formNAme);
  }
  // Getting My or All Tickets Status
  getSelectedFormName(): Observable<any> {
    return this.selectedFormName.asObservable();
  }

  // Getting status type
  getStatusTypes(statusTypes): any {
    // return _.reduce(statusTypes, function (r,v){r[v.id] = v; return r; }, {});
    // tslint:disable-next-line: only-arrow-functions
    statusTypes.reduce(function(r, v) { r[v.id] = v; return r; }, {});
  }

  // Get Registration fields
  getRegistrationFields(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/registrationfields');
  }

  // Get Tenant Name
  getTenantName(tenantId){
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/tenantName');
  }

}
