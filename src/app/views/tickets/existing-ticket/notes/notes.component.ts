import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketServiceService } from 'src/app/services/support-ticket-service/support-ticket-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  tinyMceConfig: any;
  ticket: any;
  tenantId: any;
  formId: any;
  ticketId: any;
  lookupData: any;
  newNote: any;
  newNoteformsubmitted = false;
  canCreateNote: any;
  users: any;
  notifyUser = [];
  @ViewChild('addNotesForm') addNotesForm: any;
  constructor(private route: ActivatedRoute, private supportTickets: SupportTicketServiceService, private spinner: NgxSpinnerService,
    public authService: AuthService, private lookupService: LookupServiceService, private titleService: Title,
    private tosterService: ToastrnotificationService, private userService: UserService, private router: Router) {
  }

  CanDeactivate(): any {
    if (this.addNotesForm !== undefined && this.addNotesForm.form.dirty) {
      //  return confirm('You haven"t saved your changes. Do you want to leave without finishing ?');
      return this.userService.openDialog();
    }
    else {
      return true;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('Ticket Notes');
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
      this.configureTinyMce();
    });

    this.route.params.subscribe((params) => {
      this.formId = params.formId;
      this.ticketId = params.id;
    });
    this.getSupportTicketNotes();
    this.getlookupdate();
    this.notifyUsers();
  }
  configureTinyMce() {
    const _this = this;
    this.tinyMceConfig = {
      menubar: false,
      height: 200,
      paste_data_images: true,
      setup(editor) {
        editor.on('keyup', function (e) {
          const finalcontent = e.target.innerHTML;
          _this.getcontent(finalcontent);
        });
      },
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat'
    };
  }

  getcontent(content) {
    const count = content.replace(/(<([^>]+)>)/ig, '');
    if (count.length >= 5000) {
      this.addNotesForm.form.controls.newnote.setErrors({ invalid: true });
    } else {
      this.addNotesForm.form.controls.newnote.setErrors(null);
    }
  }

  // add user to notify list
  addusertonotify(e, user) {
    if (this.notifyUser.includes(user.id)) {
      const index = this.notifyUser.indexOf(user.id);
      this.notifyUser.splice(index, 1);
    } else {
      this.notifyUser.push(user.id);
    }
    e.stopPropagation();
  }

  // Check and Uncheck
  checkUnckeckUsers(e, status) {
    if (status === 'check') {
      this.users.map((user) => {
        if (this.notifyUser.indexOf(user.id) === -1) {
          this.notifyUser.push(user.id);
        }
      });
    } else {
      this.notifyUser = [];
    }
    e.stopPropagation();
  }



  // get lookupdate
  getlookupdate() {
    if (this.tenantId !== '') {
      this.lookupService.getLookupData(this.tenantId).subscribe(data => {
        this.lookupService.storeData(data);
        this.lookupData = data;
      },
        error => {
          this.tosterService.showErrorMessage(error.error.message, 'Error');
        }
      );
    }
  }

  // get ticket notes
  getSupportTicketNotes() {
    if (this.tenantId !== '') {
      this.spinner.show();
      this.supportTickets.getSupportTicketNotes(this.tenantId, this.ticketId).subscribe((ticket) => {
        this.ticket = ticket;
        this.canCreateNote = this.authService.allowed(this.ticket.tenantId, 'CanEditNotes');
        this.spinner.hide();
      },
        (error) => {
          this.tosterService.showErrorMessage(error.error.message, 'Error');
          if (error.error.statusCode === 403) {
            this.router.navigate(['./' + this.tenantId + '/tickets/' + this.formId]);
          }
        });
    }
  }

  // Get users
  notifyUsers() {
    if (this.tenantId !== '') {
      this.spinner.show();
      this.userService.getManagingUsers(this.tenantId).subscribe((result) => {
        this.users = result;
        this.spinner.hide();
      },
        (error) => {
        });
    }
  }

  // Add New Note
  addNote(addNotesForm) {
    if (addNotesForm.valid && addNotesForm.value.newnote != '') {
      this.spinner.show();
      this.supportTickets.addNote(this.ticket, { content: this.newNote, notifyUsers: this.notifyUser }).subscribe(note => {
        this.ticket.notes.unshift(note);
        this.tosterService.showSuccessMessage('Note successfully added', 'Success');
        this.supportTickets.setNewNote(true);
        this.spinner.hide();
        this.newNote = '';
        addNotesForm.form.markAsPristine();
      }, (error) => {
        this.spinner.hide();
        this.tosterService.showErrorMessage(error.error.message, 'Error');
      });
    } else {
      this.tosterService.showErrorMessage('New Note can"t be Empty & can"t exceeded character limit ', 'Error');
    }
  }

  // Cancel Note
  cancelNewNote(addNotesForm) {
    this.newNote = '';
    addNotesForm.form.markAsPristine();
  }
}
