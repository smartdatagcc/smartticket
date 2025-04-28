import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'transformAge'
})
export class TransformAgePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value){
      return '';
    }
    const momentDate = moment(value);
    if (args !== undefined && args === 'days'){
      return moment().diff(momentDate, 'days');
    }
    else{
      // is today
      if (momentDate.isSame(new Date(), 'day')){
        const m = moment().diff(momentDate, 'minutes');
        if (m === 0){
            return moment().diff(momentDate, 'seconds') + ' seconds';
        }
        if (m < 60){
            return m + ' minutes';
        }
        if (m > 60){
            return moment().diff(momentDate, 'hours') + ' hours';
        }
      }
      else{
          const d = moment().diff(momentDate, 'days');
          if (d === 0){
              return moment().diff(momentDate, 'hours') + ' hours';
          }
          if (d > 0){
              return d + ' days';
          }
      }
    }
  }

}
