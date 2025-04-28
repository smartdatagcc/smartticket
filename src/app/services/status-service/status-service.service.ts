import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CacheServiceService} from 'src/app/services/cache-service/cache-service.service';


@Injectable({
  providedIn: 'root'
})
export class StatusServiceService {

  constructor(private http: HttpClient, private cacheService: CacheServiceService) { }

  getTypes(tenantId){
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/status');
  }

  create = function(statusType){
    this.cacheService.remove('/api/' + statusType.tenantId + '/lookup');
    return this.http.post(environment.apiUrl + '/api/' + statusType.tenantId + '/status/', statusType);
  };

  save(tenantId, statusTypes){
    this.cacheService.remove('/api/' + tenantId + '/lookup');
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/status/', statusTypes);
  }

  moveTickets(tenantId, formID, oldId, newId){
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/status/' + oldId + '/bulkMove', {formId: formID, newStatus: newId});
  }

  delete = function(tenantId, formId,  oldId, newId){
    this.cacheService.remove('/api/' + tenantId + '/lookup');
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/status/' + oldId + '?newStatus=' + newId + '&formId=' + formId);
  };

}
