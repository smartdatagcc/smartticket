import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CacheServiceService} from 'src/app/services/cache-service/cache-service.service';

@Injectable({
  providedIn: 'root'
})
export class RoleServiceService {

  constructor(private http: HttpClient, private cacheService: CacheServiceService) { }

  getRole(tenantId, roleId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/roles/' + roleId);
  }

  getDefaultPermissionAccess(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/defaultpermissionaccess');
  }

  updateRole(role) {
    this.cacheService.remove('/api/' + role.tenant_id + '/lookup');
    return this.http.put(environment.apiUrl + '/api/' + role.tenant_id + '/roles/' + role.id, role);
  }

  setDefaultRole(role){
    this.cacheService.remove(environment.apiUrl + '/api/' + role.tenant_id + '/lookup');
    return this.http.put(environment.apiUrl + '/api/' + role.tenant_id + '/roles/' + role.id + '/default', role);
  }

  addNewRole = function(tenantId, role){
    this.cacheService.remove(environment.apiUrl + '/api/' + tenantId + '/lookup');
    return this.http.post(environment.apiUrl + '/api/' + tenantId + '/roles/add', role);
  };

  removeRole = function(tenantId, roleId){
    this.cacheService.remove(environment.apiUrl + '/api/' + tenantId + '/lookup');
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/roles/' +  roleId);
  };

}
