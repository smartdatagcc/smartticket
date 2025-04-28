import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResponseTemplateServiceService {

  constructor(private http: HttpClient) { }

  get(tenantId, formId){
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/form/' + formId + '/templates');
  }

  update(tenantId, formId, responseTemplates){
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/form/' + formId + '/templates', responseTemplates);
  }

  add(tenantId, formId, responseTemplate){
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/form/' + formId + '/templates', responseTemplate);
  }

}
