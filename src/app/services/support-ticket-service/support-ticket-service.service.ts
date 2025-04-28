import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { AuthService } from '../authentication/auth.service';
import { environment } from 'src/environments/environment';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import { concat } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketServiceService {
  public archivedDeleted: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public newNoteAdded: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public ticketQuantities$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  public sortBy$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  allSupportTickets: any[];
  originalTicket: any;

  // calls if any ticket archiverd or unarchived, deleted
  // setting My or All Tickets Status
  setSelectedFormName(data) {
    this.archivedDeleted.next(data);
  }

  // set New Note Added
  setNewNote(data) {
    this.newNoteAdded.next(data);
  }

  setSortBy(sorter: string) {
    this.sortBy$.next(sorter);
  }

  // get New Note Added status
  getNewNote() {
    return this.newNoteAdded;
  }

  // storing data
  storeData(data) {
    this.allSupportTickets = data;
  }

  // storeOriginTicket
  storeOriginTickets(data) {
    this.originalTicket = data;
  }

  // get Origin Ticket
  getOriginTickets() {
    return this.originalTicket;
  }

  // get count based on formId and statusId and logged in userId
  // should be a better way to do this---
  getCountOfTickets(formId, statusId, userId) {
    if (this.allSupportTickets !== undefined) {
      if (statusId !== '') {
        if (userId === '') {
          return this.allSupportTickets.filter(item =>
            item.formId === formId &&
            item.statusType === statusId &&
            item.deleted === false &&
            item.archived === false)
            .length;
        } else {
          return this.allSupportTickets.filter(item =>
            item.formId === formId &&
            item.statusType === statusId &&
            item.deleted === false &&
            item.archived === false &&
            (item.createdBy == userId || item.assignedTo == userId))
            .length;
        }
      } else {
        if (userId === '') {
          return this.allSupportTickets.filter(item =>
            item.formId === formId &&
            item.deleted === false &&
            item.archived === false)
            .length;
        } else {
          return this.allSupportTickets.filter(item =>
            item.formId === formId &&
            (item.createdBy == userId || item.assignedTo == userId) &&
            item.deleted === false &&
            item.archived === false)
            .length;
        }
      }
    }
  }

  getQuantities(tenantId: number, userId: number) {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/quantities', { params }).subscribe(data => {
      this.ticketQuantities$.next(this.parseQuantities(data));
    });
  }

  checkTicketOwnership(ticket, userId: number) {
    return ticket.createdBy === userId || ticket.assignedTo === userId;
  }

  parseQuantities(data) {
    const userId = this.authService.authentication.data.id;
    const returnObject = {};
    data.forEach(ticket => {
      if (!returnObject[ticket.formName]) {
        returnObject[ticket.formName] = { deleted: { all: 0, my: 0 }, archived: { all: 0, my: 0 } };
      }
      if (ticket.archived) {
        returnObject[ticket.formName].archived.all += 1;
        if (this.checkTicketOwnership(ticket, userId)) {
          returnObject[ticket.formName].archived.my += 1;
        }
      }
      if (ticket.deleted) {
        returnObject[ticket.formName].deleted.all += 1;
        if (this.checkTicketOwnership(ticket, userId)) {
          returnObject[ticket.formName].deleted.my += 1;
        }
      }
      if (!ticket.archived && !ticket.deleted) {
        if (!returnObject[ticket.formName][ticket.statusTypeName]) {
          returnObject[ticket.formName][ticket.statusTypeName] = { all: 1, my: 0 };
          if (this.checkTicketOwnership(ticket, userId)) {
            returnObject[ticket.formName][ticket.statusTypeName].my += 1;
          }
        } else {
          returnObject[ticket.formName][ticket.statusTypeName].all += 1;
          if (this.checkTicketOwnership(ticket, userId)) {
            returnObject[ticket.formName][ticket.statusTypeName].my += 1;
          }
        }
      }
    });
    Object.keys(returnObject).forEach(form => {
      returnObject[form].all = 0;
      returnObject[form].my = 0;
      Object.keys(returnObject[form]).forEach(status => {
        if (returnObject[form][status].all) {
          returnObject[form].all += returnObject[form][status].all;
        }
        if (returnObject[form][status].my) {
          returnObject[form].my += returnObject[form][status].my;
        }
      });
    });
    return returnObject;
  }

  // get count of archived and deleted tickets
  getCountOfArchiveDeletedTickets(formId, type, userId) {
    if (this.allSupportTickets !== undefined) {
      if (type === 'deleted') {
        if (userId === '') {
          return this.allSupportTickets.filter(item => item.formId === formId && item.deleted === true).length;
        } else {
          return this.allSupportTickets.filter(item => item.formId === formId
            && (item.createdBy == userId || item.assignedTo == userId)
            && item.deleted === true).length;
        }
      } else {
        if (userId === '') {
          return this.allSupportTickets.filter(item => item.formId === formId && item.archived === true).length;
        } else {
          return this.allSupportTickets.filter(item => item.formId === formId
            && (item.createdBy == userId || item.assignedTo == userId)
            && item.archived === true).length;
        }
      }
    }
  }

  // get All Support Tickets from db
  getAllSupportTickets(tenantId) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supporttickets');
  }

  getSupportTicketsByFormId(tenantId: number, formId: number): Observable<any> {
    // placeholder for when this query is ready in knex
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supporttickets');
  }

  getSupportTicketsWithPagination(
    tenantId: number,
    formId: number,
    statusId: number,
    searchValue = '',
    page = 1,
    toggleSetting = 'My',
    headerId = '',
    sortDirection = '',
    pageLimit = 20,
    archived = document.URL.includes('archived=true'),
    deleted = document.URL.includes('deleted=true')
  ) {
    const params = new HttpParams()
      .set('formId', formId.toString() || '')
      .set('statusId', statusId?.toString() || '')
      .set('searchValue', searchValue)
      .set('pageLimit', pageLimit.toString())
      .set('page', page.toString())
      .set('toggleSetting', toggleSetting)
      .set('headerId', headerId)
      .set('sortDirection', sortDirection)
      .set('archived', archived.toString())
      .set('deleted', deleted.toString());
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supportTicketsPaginated', { params });
  }

  getCSV(
    tenantId: number,
    formId: number,
    statusId: number,
    searchValue = '',
    page = 1,
    toggleSetting = 'My',
    headerId = '',
    sortDirection = '',
    columnHeaders: string,
    archived = document.URL.includes('archived=true'),
    deleted = document.URL.includes('deleted=true')
  ): Observable<any> {
    const params = new HttpParams()
      .set('formId', formId.toString() || '')
      .set('statusId', statusId?.toString() || '')
      .set('searchValue', searchValue)
      .set('page', page.toString())
      .set('toggleSetting', toggleSetting)
      .set('headerId', headerId)
      .set('sortDirection', sortDirection)
      .set('columnHeaders', columnHeaders)
      .set('archived', archived.toString())
      .set('deleted', deleted.toString());
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supportTicketsCSV',
      { params: params, responseType: 'blob' });
  }

  bulkImport(thisRef, file, tenantId, formId, defaultUser, clearExisting, progressFn) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('formId', formId);
    fd.append('defaultUser', defaultUser);
    fd.append('clearExisting', clearExisting);

    return Observable.create(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', environment.apiUrl + '/api/' + tenantId + '/supportticketsimport', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.authService.authentication.token);
      xhr.onprogress = function () {
        let data = xhr.responseText.substr(0, xhr.responseText.lastIndexOf('}') + 1) + ']';
        if ((xhr.responseText.substr(xhr.responseText.length - 2, 1) === ']')
          && (xhr.responseText.substr(0, 1) !== '[')
        ) {
          data = '[' + data;
        }
        progressFn(thisRef, JSON.parse(data));
      };
      xhr.onload = function (e) {
        if (xhr.status === 200) {
          observer.next(JSON.parse(xhr.response));
          observer.complete();
        } else {
          observer.error(xhr.response);
        }

      };
      xhr.send(fd);
    });
  }

  errorMgmt(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(errorMessage);
    return throwError(errorMessage);
  }

  // create new ticket
  createSupportTicket(ticket) {
    if (ticket.assignedTo === null) {
      delete ticket.assignedTo;
    }
    return this.http.post(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets', ticket);
  }


  // add attachments to ticket
  addFile(files, tenantId, ticketId) {
    const attachments = files.map((file: string | Blob) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('supportTicketId', ticketId);
      return this.http.post(environment.apiUrl + '/api/' + tenantId + '/attachments', fd);
    });

    return concat(...attachments);
  }

  // get  Support Tickets by id
  getSupportTicket(tenantId, id, type = '') {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supporttickets/' + id + '/' + type);
  }

  // undelete
  undeleteTicket(ticketId, tenantId) {
    return this.http.put(environment.apiUrl + '/api/' + tenantId + '/supporttickets/' + ticketId + '/undelete', {});
  }

  // update Support Ticket
  updateSupportTicket(ticket) {
    const ticketToUpdate = {
      id: ticket.id,
      tenantId: ticket.tenantId,
      statusType: ticket.statusType.id,
      assignedTo: ticket.assignedTo,
      archived: ticket.archived,
      deleted: ticket.deleted,
      metadata: ticket.metadata,
      updated_at: moment().toISOString()
    };
    return this.http.put(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets/' + ticket.id, ticketToUpdate);
  }

  // delete support ticket
  deleteSupportTicket(ticket) {
    return this.http.delete(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets/' + ticket.id);
  }

  // archive support ticket
  archiveSupportTicket(ticket) {
    return this.http.put(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets/' + ticket.id + '/archive', ticket);
  }

  // add comment
  addComment(ticket, comment) {
    return this.http.post(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets/' + ticket.id + '/comment', comment);
  }

  // Get Support ticket comments
  getSupportTicketComments(tenantId, id) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supporttickets/' + id + '/comments');
  }

  // Remove Attachment
  removeAttachment(id, tenantId, ticketId) {
    return this.http.delete(environment.apiUrl + '/api/' + tenantId + '/attachments/' + id);
  }

  // Get Support ticket Notes
  getSupportTicketNotes(tenantId, id) {
    return this.http.get(environment.apiUrl + '/api/' + tenantId + '/supporttickets/' + id + '/notes');
  }

  // Add Note
  addNote(ticket, note) {
    return this.http.post(environment.apiUrl + '/api/' + ticket.tenantId + '/supporttickets/' + ticket.id + '/note', note);
  }
}
