import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';
import { ViewEncapsulation  } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmationModalComponent implements OnInit {

  message: string;
  title: string;
  params: any;
  
  constructor(public dialogRef: MatDialogRef<ConfirmationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
      this.message = data.data.modalMessage;
      this.title = data.data.modalTitle;
  }

  ngOnInit(): void {
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  // Close modal
  onCancel() {
    this.dialogRef.close(false);
  }
}
