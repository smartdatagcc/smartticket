import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { CacheServiceService} from 'src/app/services/cache-service/cache-service.service';


@Injectable({
  providedIn: 'root'
})
export class FormServiceService {
  constructor(private http: HttpClient, private router: Router,
              private cacheService: CacheServiceService) {}

  getFormIcons() {
    return this.http.get(environment.apiUrl + '/api/forms/icons');
  }

  save(tenantId, form){
    delete form.namePlural;
    this.cacheService.remove(environment.apiUrl + '/api/' + tenantId + '/lookup');
    this.cacheService.remove(environment.apiUrl + '/api/' + tenantId + '/form/' + form.id);
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/form/' + form.id, form);
  }

  // save the form order
  saveFormOrder(tenantId, formIds){
    // tslint:disable-next-line: object-literal-shorthand
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/form-order/', {formIds: formIds});
  }

  // delete form
  delete(tenantId, formId){
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/form/' + formId );
  }

  saveForm(tenantId, form) {
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/form/' + form.id, form);
  }

  create(tenantId, form){
    this.cacheService.remove(environment.apiUrl + '/api/' + tenantId + '/lookup');
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/form/', form);
  }
}
