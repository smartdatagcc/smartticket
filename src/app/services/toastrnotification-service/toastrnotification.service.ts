import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastrnotificationService {

  constructor(private toastr: ToastrService) { }

  showSuccessMessage(message, title){
    this.toastr.success(message, title, {closeButton: true});
  }

  showErrorMessage(message, title){
    this.toastr.error(message, title, {closeButton: true});
  }

  showWarningMessage(message, title){
    this.toastr.warning(message, title, {closeButton: true});
  }

  showInformationMessage(message, title){
    this.toastr.info(message, title, {closeButton: true});
  }

}
