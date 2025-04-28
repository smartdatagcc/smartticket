import { Component, OnInit } from '@angular/core';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  logs;
  constructor(private suservice: SuServiceService,) { }

  ngOnInit(): void {
    this.getlogs();
  }

  // Get Logs
  getlogs(){
    this.suservice.getLogs().subscribe((logs) => {
      this.logs = this.consumeLogs(logs);
    }, (error) => {
      this.logs = this.consumeLogs(error);
      console.log(error);
    });
  }

  consumeLogs(data) {
    let parsed = data.split("\n");
    return parsed;
  }
}
