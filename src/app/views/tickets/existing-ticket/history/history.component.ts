import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  ticket: any;
  tenantId: any;
  formId: any;
  ticketId: any;
  lookupData: any;
  constructor(private route: ActivatedRoute, private supportTickets: SupportTicketServiceService, private spinner: NgxSpinnerService,
              public authService: AuthService, private lookupService: LookupServiceService, private titleService: Title) {
  }


  ngOnInit(): void {
    this.titleService.setTitle('Ticket History');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
      this.ticketId = params.id;
    });
    this.getSupportTicket();
    this.getlookupdate();
  }

  // Get SupportTicket
  getSupportTicket() {
    this.spinner.show();
    this.supportTickets.getSupportTicket(this.tenantId, this.ticketId).subscribe(data => {
      this.ticket = data;
      this.spinner.hide();
    });
  }

  // get lookupdate
  getlookupdate() {
    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupData = data;
      },
        error => {
        }
      );
    }
  }
}
