import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-su-dashboard',
  templateUrl: './su-dashboard.component.html',
  styleUrls: ['./su-dashboard.component.scss']
})
export class SuDashboardComponent implements OnInit {

  tabIndex = 0;
  constructor( private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('SU Dashboard');
    const tenant = JSON.parse(localStorage.getItem('tenant'));
  }

  changeTab(event){
    this.tabIndex = event.index;
 }
}
