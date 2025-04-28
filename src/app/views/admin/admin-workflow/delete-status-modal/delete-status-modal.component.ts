import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-delete-status-modal',
  templateUrl: './delete-status-modal.component.html',
  styleUrls: ['./delete-status-modal.component.scss']
})
export class DeleteStatusModalComponent implements OnInit {

  tenantId: any;
  statusTypes = [];
  statusToRemove: any;
  moveStatus: any;
  isDismissed: boolean;
  constructor(public dialogRef: MatDialogRef<DeleteStatusModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DeleteStatusDialogModel)
  {
     this.tenantId = data.tenantId;
     this.statusToRemove = data.statusToRemove;
     this.statusTypes = data.statusTypes.filter(result => result !== data.statusToRemove);
  }

  ngOnInit(): void {
  }

  onConfirm(){
    const moveStatusID = this.statusTypes.filter(data => data.name === this.moveStatus)[0].id;
    this.dialogRef.close(moveStatusID);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.isDismissed = true;
    this.dialogRef.close(false);
  }
}


/**
 * Class to represent Add user dialog model.
 *
 * It has been kept here to keep it as part of shared component.
 */
export class DeleteStatusDialogModel {

  constructor(public tenantId: any, public statusTypes: any, public statusToRemove: any) {
  }
}
