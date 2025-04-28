import { Component } from '@angular/core';
import { ITooltipParams } from 'ag-grid-community';

interface ITooltipAngularComp {
  /** The agInit(params) method is called on the tooltip component once.
      See below for details on the parameters. */
  agInit(params: ITooltipParams): void;
}

@Component({
  selector: 'tooltip-component',
  template: `<ng-template [ngIf]="isHeader">
  <div class="custom-tooltip">
    <p [innerHTML]="valueToDisplay"></p>
  </div></ng-template>`,
  styles: [
    `
      :host {
        position: absolute;
      }

      :host.ag-tooltip-hiding {
        opacity: 0;
      }

      .custom-tooltip p {
        width: 15vw;
        height: 12vh;
        padding: 2%;
        margin: 2%;
        border: 1px solid #3c8dbc;
        overflow: hidden;
        pointer-events: none;
        transition: opacity 1s;
        background-color: #fff;
      }
    `,
  ],
})
export class TooltipComponent implements ITooltipAngularComp {
  private params: { color: string } & ITooltipParams;
  public isHeader: boolean;
  private data: any[];
  public valueToDisplay: string;
  private color: string;

  agInit(params: { location: 'header', color: 'white' } & ITooltipParams): void {
    this.params = params;
    this.isHeader = params.rowIndex === undefined;
    this.valueToDisplay = params.value ? params.value : '';
    this.data = params.api.getDisplayedRowAtIndex(params.rowIndex)?.data;
    this.color = this.params.color || 'white';
  }
}

/**
 * interface ITooltipParams {
    location: string; // what part of the application is showing the tooltip, e.g. 'cell', 'header', 'menuItem' etc
    api: GridApi; // the grid API
    columnApi: ColumnApi; // the column API
    context: any; // the grid context

    value?: any; // the value to be rendered by the tooltip

    /* Column Params (N/A within some components like the Menu Item) */

    /*
    colDef?: ColDef | ColGroupDef; // the grid colDef
    column?: Column | ColumnGroup; // the column bound to this tooltip

    /* Row and Cell Params (N/A with headerTooltips) */

    /* valueFormatted?: any; // the formatted value to be rendered by the tooltip
    rowIndex?: number; // the index of the row containing the cell rendering the tooltip
    node?: RowNode; // the row node
    data?: any; // the row node data
 */