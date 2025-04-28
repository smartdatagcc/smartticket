import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import * as _ from 'underscore';

@Injectable({
  providedIn: 'root'
})
export class ControlsServiceService {

  constructor(private http: HttpClient) { }

  types = ['text', 'textarea', 'select', 'toggle', 'datepicker', 'timepicker', 'radiobuttonlist', 'checkboxlist', 'email', 'phone number', 'label', 'signature'];

  DefaultColumns = [
    { id: 'created_at', label: 'Created', selected: true },
    { id: 'updated_at', label: 'Last Updated', selected: true },
    { id: 'ticketAge', label: 'Ticket Age', selected: true },
    { id: 'createdUserName', label: 'Created By ', selected: true },
    { id: 'assignedUserName', label: 'Assigned To', selected: true },
    { id: 'status', label: 'Status', selected: true }
  ];

  getDefaultColumns() {
    return this.DefaultColumns;
  }

  getValue(control, val) {
    if (val !== null) {
      switch (control.type) {
        case 'datepicker':
          return val ? moment(val).format('M/DD/YYYY') : null;
        case 'timepicker':
          return val ? moment.utc(val).format('h:mm a') : null;
        case 'checkboxlist':
          return val; // && control.value instanceof Array ? control.value.join(', ') : val;
        case 'radiobuttonlist':
          return val && control.value instanceof Array ? control.value.join(', ') : val;
        case 'toggle':
          return val && val === true ? control.options[0] : control.options[1];
        case 'signature':
          return val ? '<img src="' + val + '">' : null;
        default:
          return val;
      }
    } else {
      return val;
    }
  }

  getControlValue(control, displayOnly) {
    if (control.value) {
      if (displayOnly && (control.type === 'textarea' || control.type === 'label')) {
        return control.value.replace(/\n/g, '<br/>');
      }
      if (displayOnly) {
        const values = this.getValue(control, control.value);
        if (Array.isArray(values)) {
          return values.join(', ');
        }
      }
    }
    return this.getValue(control, control.value || control.content);
  }

  initialize(controls) {
    return controls.map(item => {
      // controls could have been added since creation of the user...

      if (!item.hasOwnProperty('value')) {
        item.value = null;
      }

      if (item.value === null) {
        switch (item.type) {
          case 'toggle':
            item.value = false;
            break;
          case 'timepicker':
            item.value = new Date();
            break;
          case 'label':
            item.value = item.content;
            break;
        }
      } else {
        if (item.type === 'datepicker') {
          item.value = new Date(item.value);
        } else if (item.type === 'timepicker') {
          item.value = moment.utc(item.value).toDate();
        }
      }
      // item.templateUrl = getInclude(item.type);
      return item;
    });
  }

  // Slice the data
  chunk(arr, size) {
    const newArr = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }

  getMetadataControls(controls, chunkSize) {
    const userControls = controls.filter(usercontrol => usercontrol.adminOnly === false);
    const internalControls = controls.filter(internalcontrol => internalcontrol.adminOnly === true);
    const size = chunkSize || 2;
    return {
      userControls: this.chunk(userControls, chunkSize),
      internalControls: this.chunk(internalControls, chunkSize)
    };
  }

  getMetadataControlsWithOutChunk(controls) {
    const userCtrls = controls.filter(usercontrol => usercontrol.adminOnly === false);
    const internalCtrls = controls.filter(internalcontrol => internalcontrol.adminOnly === true);

    return {
      userControls: userCtrls,
      internalControls: internalCtrls
    };
  }

  flattenMetadataControls(chunkedMetadata) {
    const userControls = _.flatten(chunkedMetadata.userControls);
    const internalControls = _.flatten(chunkedMetadata.internalControls);

    return userControls.concat(internalControls);
  }

  // get option controls
  hasOptionsControl(controlType) {
    return controlType === 'select' || controlType === 'radiobuttonlist' || controlType === 'checkboxlist';
  }

  getControlTypes() {
    return this.types;
  }

  getUserControlTypes() {
    return this.types;
  }

  setNewControlName(control) {
    control.name = (!control.label) ? 'control' + _.random(1000, 30000) : control.label.replace(/[^A-Za-z0-9\-_ ]+/g, '');
    control.name = control.name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

  }

  addNewOption(control, option) {
    if (option && option.length > 0) {
      if (_.includes(control.options, option)) {
        throw new Error('option already exist');
      } else {
        control.options.push(option);
      }
    } else {
      throw new Error('the option must have text');
    }
  }

  removeNewOption(control, option) {
    if (control.options.length > 1) {
      control.options.splice(control.options.indexOf(option), 1);
    }
  }
  getControlValueExample(control) {
    switch (control.type) {
      case 'checkboxlist': return [control.options[0], control.options[1]];
      case 'radiobuttonlist':
      case 'select': return control.options[0];
      case 'text': return 'Text Value';
      case 'textarea': return 'Text Value';
      case 'datepicker': return '2020-01-01T10:09:08.0000Z';
      case 'timepicker': return '10:10 AM';
      case 'phone number': return '937-123-4567';
      case 'email': return 'smart.ticket@smartdatasystems.net';
      case 'toggle': return true;
    }
    return null;
  }


  getControlHtmlExample(control) {
    let example = '\r\n<div><label>\r\n  ' + control.label + '<br />\r\n  ';
    switch (control.type) {
      case 'checkboxlist':
      case 'radiobuttonlist':
      case 'select':
        example += '<select name="' + control.name + '" ' + (control.required ? 'required ' : '') + (control.type === 'checkboxlist' ? 'multiple="multiple"' : '') + '>\r\n    <option>' + control.options.join('</option>\r\n    <option>') + '</option>\r\n  </select>';
        break;
      case 'datepicker':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="date" />';
        break;
      case 'timepicker':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="time" />';
        break;
      case 'phone number':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="tel"  />';
        break;
      case 'text':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="text" />';
        break;
      case 'textarea':
        example += '<textarea name="' + control.name + '" ' + (control.required ? 'required ' : '') + '></textarea>';
        break;
      case 'email':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="email" />';
        break;
      case 'toggle':
        example += '<input name="' + control.name + '" ' + (control.required ? 'required ' : '') + 'type="checkbox" />';
        break;
    }

    example += '\r\n</label></div>\r\n';
    return example;
  }

}
