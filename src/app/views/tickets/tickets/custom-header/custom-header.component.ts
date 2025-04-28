import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { Component, ViewChild, ElementRef } from '@angular/core';
@Component({
  selector: 'app-custom-header',
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss']
})
export class CustomHeaderComponent {

  params: any;
  ascSort: string;
  descSort: string;
  noSort: string;

  @ViewChild('menuButton', { read: ElementRef }) public menuButton;

  constructor(
    private supportTicketService: SupportTicketServiceService
  ) { }

  agInit(params): void {
    this.params = params;
  }

  onMenuClicked() {
    this.params.showColumnMenu(this.menuButton.nativeElement);
  }

  setSort() {
    this.supportTicketService.setSortBy(this.params?.column?.colDef?.field || '');
  }

  setShow(id: string, direction: string): boolean {
    const sorter = localStorage.getItem('sortBy') || '';
    const sortByDirection = localStorage.getItem('sortByDirection') || '';
    return id === sorter && direction === sortByDirection;
  }
}
