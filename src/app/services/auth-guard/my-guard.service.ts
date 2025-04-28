import { Injectable } from '@angular/core';
import {  CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';


export interface CanComponentDeactivate {
    CanDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class CreateRequestGuardService implements CanDeactivate<CanComponentDeactivate> {
    canDeactivate(component: CanComponentDeactivate,
                  currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
                return component ? component.CanDeactivate() : true;
    }
}
