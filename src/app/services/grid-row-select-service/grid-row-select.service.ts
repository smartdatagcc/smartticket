import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * Generate row selection column for ag grid
 */
export class GridRowSelectService {
  rowSelect: BehaviorSubject<object>;
  selector;
  constructor() {
    const highlightTooltipGetter = (params) => ({ value: params.value });

    this.selector = {
      headerName: '',
      field: 'row-selection',
      resizable: true,
      suppressSizeToFit: true,
      pinned: 'left',
      cellClass: 'grid-row-selection',
      width: 15,
      maxWidth: 20,
      headerClass: 'grid-row-selection-header',
      headerComponentParams: { template: '<i class="far fa-question-circle"></i>' },
      headerTooltip: '<p>Click in this column to highlight a row.</p><p>Hold <strong>Shift</strong> or <strong>CTRL</strong> and click, to highlight multiple rows.</p>',
      tooltipComponent: 'tooltipComponent',
      tooltipValueGetter: highlightTooltipGetter,
      supressMenuHide: true
    };

    this.rowSelect  = new BehaviorSubject(this.selector);
  }

}
