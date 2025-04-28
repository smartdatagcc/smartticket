import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'transformDate'
})
export class TransformDatePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value){
        return '';
    }
    const momentDate = moment(value);
    // is today
    if (momentDate.isSame(new Date(), 'day')){
        return 'Today' + momentDate.format('h:mm a');
    }
    // is this year
    if (momentDate.isSame(new Date(), 'year')){
      return momentDate.format('MMM Do');
    }

    return momentDate.format('MMM Do YYYY');
  }

}
