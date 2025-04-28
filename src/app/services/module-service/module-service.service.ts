import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../authentication/auth.service';
import * as _ from 'underscore';
import { LookupServiceService } from '../lookup-service/lookup-service.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleServiceService {
  public tenantModules: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor(private http: HttpClient, private authService: AuthService, private lookupService: LookupServiceService) { }

  modules() {
    return [{
      'custom-report': {
        links: {
          adminform: "Custom Report",
          ticket: '<i class="fa fa-file-text-o"></i> Report'
        },
        // tslint:disable-next-line: object-literal-shorthand
        permissions: function (data) {

          const form = _.find(data.tenant.forms, { id: parseInt(data.ticket.formId, 10) });
          return this.authService.allowed(data.ticket.tenantId, "CanManageTickets") &&
            this.form && this.form.settings.template;
        }
      }
    }];
  }

  // setting tenant forms
  setSelectModules(modules) {
    this.tenantModules.next(modules);
  }

  // fetching tenant forms details
  getSelectedModules(): Observable<any> {
    return this.tenantModules.asObservable();
  }

  getTenantModules(tenantId) {
    let tenantModules = this.lookupService.lookupdata.tenant.tenantSettings.settings.modules || [];
    const modules = this.modules();
    tenantModules = tenantModules.map(x => {
      return {
        'key': x,
        'val': modules[0][x]
      };
    });
    return tenantModules;
  }


    // ticket module
    ticketmodules() {
    //  console.log(this);
      return [{
          key: 'custom-report',
          val: {
            links: {
              adminform: 'Custom Report',
              ticket: '<i class="fa fa-file-text-o"></i> Report'
            },
            // tslint:disable-next-line: object-literal-shorthand
            permissions(data) {
              // tslint:disable-next-line:variable-name
              const _this = data.thisstate;
              const form: any = _.find(data.tenant.forms, { id: parseInt(data.ticket.formId, 10) });
              return _this.authService.allowed(data.ticket.tenantId, 'CanManageTickets') &&
                form && form.settings.template;
            },
            thisstate: this
          }
      }];
    }

    // Get Ticket Tenent Module
    getTicketTenantModules(tenantId) {
      let tenantModules = this.lookupService.lookupdata.tenant.tenantSettings.settings.modules || [];
      const modules = this.ticketmodules();
      tenantModules = tenantModules.map((x, index) => {
        x = modules[index];
        return x;
      });
      return tenantModules;
    }


}
