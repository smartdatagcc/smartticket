import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import * as SparkMD5 from 'spark-md5';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import * as _ from 'underscore';

@Component({
    selector: 'app-ticket-timeline',
    templateUrl: './ticket-timeline.component.html',
    styleUrls: ['./ticket-timeline.component.scss']
})
export class TicketTimelineComponent implements OnInit {

    @Input() items: any;
    @Input() ticket: any;
    sortDesc = false;
    constructor(private ControlsService: ControlsServiceService) { }

    ngOnInit(): void {
        this.sortdata();
    }

    // Sorting date in asc and desc order
    sortdata() {
        if (!this.sortDesc) {
            this.items.sort((a, b) => {
                return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
            });
        } else {
            this.items.sort((a, b) => {
                return new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
            });
        }
    }

    // date match
    datesMatch(a, b) {
        return a && b && moment(a).isSame(b, 'day');
    }

    // get image
    getImage(item) {
        const user = item.updatedByUser || item.user;
        if (user) {
            if (user.image) {
                return user.image;
            }
            return '//www.gravatar.com/avatar/' + SparkMD5.hash(user.email.toLowerCase()) + '?d=identicon&s=45&f=y';
        } else {
            return '';
        }
    }

    // getting header
    getHeader(item) {
        if (item) {
            const user = item.updatedByUser || item.user;
            if (item.reason && user.name) {
                return item.reason + ' by ' + user.name;
            }
        }
        return '';
    }

    // display data 
    displayDiff(diff) {
        let name = diff.path.join('.');
        const metaControlIndex = diff.path.join('.').indexOf('metadata.controls.');
        const result = {
            current: null,
            previous: null
        };
        // file attachment:
        if (name === 'file') {
            if (diff.kind === 'N') {
                result.current = diff.rhs + ' <strong>file added</strong>';
            }

            if (diff.kind === 'D') {
                result.current = diff.rhs.substring(37) + ' <strong>file removed</strong>';
            }

            return result;
        }

        // AssignedTo
        if (diff.path.join('.') === 'statusType.name') {
            name = 'Status';
        }

        if (metaControlIndex > -1) {
            name = diff.path[diff.path.length - 1];
        }

        // tslint:disable-next-line:only-arrow-functions
        diff.path = _.filter(diff.path, function (path) {
            return path !== 0;
        });

        let control = null;
        if (diff.path.join('.').indexOf('metadata.controls.') > -1) {
            const controlName = diff.path[diff.path.length - 1];
            control = _.find(this.ticket.metadata.controls, { name: controlName });
            if (control) {
                name = control.label;
            }
        }

        if (typeof name === 'string') {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }


        if (typeof name === 'string' && name.toUpperCase() === 'ASSIGNEDTO') {
            const was = diff.lhs;
            const is = diff.rhs;
            if (was && is) {
                result.current = 'Ticket assigned to <strong>' + is + '</strong>';
                result.previous = '(previously was assigned to ' + was + ')';
            }
            if (was && !is) {
                result.current = 'Ticket is unassigned';
                result.previous = '(previously was ' + was + ')';
            }
            if (is && !was) {
                result.current = 'Ticket assigned to <strong>' + is + '</strong>';
                result.previous = '(previously was unassigned)';
            }

        } else {
            if (diff.rhs !== undefined && diff.rhs !== null) {
                if (diff.rhs === Object(diff.rhs)) {
                    if (Array.isArray(diff.rhs) && diff.rhs.length > 0) {
                        result.current = '<strong>' + name + '</strong> changed to \'' + diff.rhs.join(',') + '\'';
                    } else {
                        if (diff.rhs.name !== undefined && diff.rhs.name !== null) {
                            result.current = '<strong>' + name + '</strong> changed to \'' + diff.rhs.name + '\'';
                        }
                    }
                } else {
                    if (control) {
                        const newValue = this.ControlsService.getValue(control, diff.rhs);
                        result.current = '<strong>' + name + '</strong>';
                        if (control.type === 'signature'){
                            result.current += ' changed ';
                        }else{
                            if (control.type !== 'signature' && newValue.length > 0) {
                                result.current += ' changed to \'' + newValue + '\'';
                            }
                            else {
                                result.current += ' changed (no values)';
                            }
                        }
                    } else {
                        result.current = '<strong>' + name + '</strong> changed to \'' + diff.rhs + '\'';
                    }
                }
            }

            if (diff.lhs !== undefined && diff.lhs !== null) {
                if (diff.lhs === Object(diff.lhs)) {
                    if (Array.isArray(diff.rhs)) {
                        result.current = '<strong>' + name + '</strong> changed to \'' + diff.lhs.join(',') + '\'';
                    } else {
                        if (diff.lhs.name !== undefined && diff.lhs.name !== null) {
                            result.current = '<strong>' + name + '</strong> changed to \'' + diff.lhs.name + '\'';
                        }
                    }
                } else {
                    if (diff.lhs !== undefined && diff.lhs !== null) {
                        if (control && control.type !== 'signature') {
                            const oldValue = this.ControlsService.getValue(control, diff.lhs);
                            if (oldValue.length > 0) {
                                result.previous = ' (previously was \'' + oldValue + '\')';
                            } else {
                                result.previous = ' previously (no values)';
                            }
                        }
                        if (!control) {
                            result.previous = ' (previously was \'' + diff.lhs + '\')';
                        }
                    }
                }
            }
            if (diff.kind === 'A') {
                switch (diff.item.kind) {
                    case 'A':
                        result.current = '<strong>' + name + '</strong> updated \'' + diff.item.rhs + '\'';
                        break;
                    case 'D':
                        result.current = '<strong>' + name + '</strong> items removed';
                        break;
                }
                if (diff.item && diff.item.lhs) {
                    if (diff.item.kind && diff.item.kind !== 'D') {
                        result.previous = ' (previously was \'' + diff.item.lhs + '\')';
                    }
                }
            }
        }
        if (result.previous) {
            result.previous = '<i>' + result.previous + '</i>';
        }
        return result;
    }

}
