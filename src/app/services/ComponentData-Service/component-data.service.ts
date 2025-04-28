import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ComponentDataService {

  constructor(private http: HttpClient) { }

  newticket: any = {};

  createticket(ticket) {
    console.log(ticket);
  }

}
