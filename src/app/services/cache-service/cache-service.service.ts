import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheServiceService {

  constructor() { }

  clearCacheTimestamp(url){
    try {
        if (localStorage.getItem('cache')) {
            const cache = JSON.parse(localStorage.getItem('cache'));
            if (cache[url]) {
                cache[url] = null;
                localStorage.setItem('cache', JSON.stringify(cache));
            }
        }
    }catch (err){

    }
  }

  remove(url) {
    this.clearCacheTimestamp(url);
  }

}
