import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from 'src/app/services/authentication/auth.service';
import * as SparkMD5 from 'spark-md5';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';

@Component({
  selector: 'app-comments-notes-view',
  templateUrl: './comments-notes-view.component.html',
  styleUrls: ['./comments-notes-view.component.scss']
})
export class CommentsNotesViewComponent implements OnInit {

  @Input() items;
  @Input() ticket;
  sortDesc = false;
  constructor(private authService: AuthService, private supportTickets: SupportTicketServiceService) {
    this.supportTickets.getNewNote().subscribe(data => {
      if (data !== false){
        this.sortdata();
      }
    });
  }

  ngOnInit(): void {
    this.sortdata();
  }

  // Sorting date in asc and desc order
  sortdata() {
    if (!this.sortDesc) {
      this.items.sort((a, b) => {
        return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
      });
    } else {
      this.items.sort((a, b) => {
        return new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
      });
    }
  }

  // get image
  getImage(item) {
    const user = item.updatedByUser || item.user;
    if (user) {
      return '//www.gravatar.com/avatar/' + SparkMD5.hash(user.email.toLowerCase()) + '?d=identicon&s=45&f=y';
    } else {
      return '';
    }
  }

}
