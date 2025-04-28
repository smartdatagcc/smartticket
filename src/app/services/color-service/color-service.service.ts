import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorServiceService {

  constructor() { }

  // To Do: Need to get the below colors from AdminLTE Theme
  // Getting the colors
  getColorOptions(isInline?){
    return{
      flat: !!isInline,
      showPaletteOnly: true,
      showPalette: true,
      clickoutFiresChange: true,
      palette: [
                  '#3c8dbc',
                  '#f56954',
                  '#00a65a',
                  '#00c0ef',
                  '#f39c12',
                  '#0073b7',
                  '#001F3F',
                  '#39CCCC',
                  '#3D9970',
                  '#01FF70',
                  '#FF851B',
                  '#F012BE',
                  '#8E24AA',
                  '#D81B60',
                  '#222222',
                  '#d2d6de',
                  '#666'
               ]
    };
  }
}
