import { Injectable } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent} from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService {

  constructor( private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.authentication.token;
    let newHeaders = req.headers;
    if (token) {
       newHeaders = newHeaders.append('Authorization', 'Bearer ' + token);
    }
    const authReq = req.clone({headers: newHeaders});
    return next.handle(authReq);
 }
}
