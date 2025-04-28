import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../authentication/auth.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class TenantServiceService {
  public tenantNamechanged: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public LogoImage: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public themechanged: BehaviorSubject<any> = new BehaviorSubject<any>(String);
  constructor(private http: HttpClient, private authService: AuthService) { }

  setTenanName(name) {
    this.tenantNamechanged.next(name);
  }

  getTenantName(): Observable<any> {
    return this.tenantNamechanged.asObservable();
  }

  getTenant(tenantId: number | string) {
    return this.http.get(environment.apiUrl + '/api/tenant/' + tenantId);  }

  setTenanImage(image) {
    this.LogoImage.next(image);
  }

  getTenantImage(): Observable<any> {
    return this.LogoImage.asObservable();
  }

  // set theme changes
  setThemeChanged(color) {
    this.themechanged.next(color);
  }

  // get theme changes
  getThemeChanged(): Observable<any> {
    return this.themechanged.asObservable();
  }

  updateTenant(tenant) {
    return this.http.put(
      environment.apiUrl + '/api/' + tenant.id + '/tenant',
      tenant
    );
  }
  removeLogo(tenantId) {
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/logo');
  }

  updateLogo(file, tenantId) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(
      environment.apiUrl + '/api/' + tenantId + '/logo',
      fd
    );
  }

  download(tenantId) {
    return Observable.create(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', environment.apiUrl + '/api/' + tenantId + '/settingsexport', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.authService.authentication.token);
      xhr.onload = function (e) {
        if (xhr.status === 200) {
          const filename = "settings.json";
          const type = xhr.getResponseHeader('Content-Type');
          const blob = new Blob([this.response], { type: type });
          const responsedata = [];
          responsedata["filename"] = filename;
          responsedata["blob"] = blob;
          observer.next(responsedata);
          observer.complete();
        } else {
          observer.error(xhr.response);
        }
      };
      xhr.send();
    });
  }

  bulkImport(file, tenantId, clearExisting) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('clearExisting', clearExisting);

    const headers = new Headers();
    headers.append('Content-Type', undefined);

    headers.append("Authorization", "Bearer " + this.authService.authentication.token);

    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/settingsimport', fd);
  }
}
