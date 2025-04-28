import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ModuleServiceService } from 'src/app/services/module-service/module-service.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ticket-menu',
  templateUrl: './ticket-menu.component.html',
  styleUrls: ['./ticket-menu.component.scss']
})
export class TicketMenuComponent implements OnInit {
  canViewNotes;
  modules;
  @Input() ticket;
  @Input() active;
  @Input() lookup;
  key: any;
  tenantId: any;
  su: any;
  formId: any;
  ticketId: any;
  constructor(private authService: AuthService, private moduleService: ModuleServiceService, private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.tenantId = this.ticket.tenantId;
    this.formId = this.ticket.formId;
    this.ticketId = this.ticket.id;
    this.canViewNotes = this.authService.allowed(this.ticket.tenantId, 'CanViewNotes');
    this.modules = this.moduleService.getTicketTenantModules(this.ticket.tenantId);
    this.su = this.authService.authentication.data.su;
  }

  navigate(page) {
    let path = '';
    if (page == 'details') {
      path = '../' + this.tenantId + '/ticket/' + this.formId + '/' + this.ticketId;
    } else if (page == 'report') {
      path = '../' + this.tenantId + '/ticket/' + this.formId + '/' + this.ticketId + '/custom-report';
    } else {
      path = '../' + this.tenantId + '/ticket/' + this.formId + '/' + this.ticketId + '/' + page;
    }
    this.router.navigate([path]);
  }


  // Checking permissions
  checkpermissions(val) {
    const ticket = this.ticket;
    const tenant = this.lookup !== undefined ? this.lookup.tenant : undefined;
    if (ticket !== undefined && tenant !== undefined) {
      return val.permissions({ ticket, tenant, thisstate: val.thisstate });
    }
  }
}
