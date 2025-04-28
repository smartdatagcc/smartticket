import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ControlContainer, NgForm } from '@angular/forms';
import * as _ from 'underscore';
import { FormServiceService } from 'src/app/services/form-service/form-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';

@Component({
  selector: 'app-form-metadata-controls',
  templateUrl: './form-metadata-controls.component.html',
  styleUrls: ['./form-metadata-controls.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class FormMetadataControlsComponent implements OnInit {

  tenantId: number;
  lookupdata: any;
  controlTypes: any;
  newOption: any;
  @Input() templateControls;
  @Output() updateEvent = new EventEmitter<string>();
  constructor(@Optional() private ngForm: NgForm,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private lookupService: LookupServiceService,
    private formService: FormServiceService,
  ) { }

  ngOnInit(): void {
    this.route.parent.params.subscribe((params) => {
      this.tenantId = params.tenantId;
    });

    if (this.templateControls !== undefined) {
    }
  }

  // sorting
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.templateControls, event.previousIndex, event.currentIndex);
    const formIds = _.map(this.templateControls, 'id');
    this.formService.saveFormOrder(this.tenantId, formIds).subscribe((result: any) => {
      // console.log('formUpdated');
    });
  }

  selectedformbasedonId(control) {
    this.lookupService.setSelectedForm(control);
    this.router.navigate(['/' + control.tenant_id + '/admin/forms/' + control.id]);
  }
}
