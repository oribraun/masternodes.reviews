import {Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";

declare var DATA: any;
@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.less']
})
export class AddressComponent implements OnInit {

  public data;
  public txs: any[] = [];
  public emptyTable: any[] = [];
  public currentTable: any[] = [];
  public addressDetails: any;
  public addr: string;
  public gettingTxs: boolean = false;
  public gettingAddressCount: boolean = false;
  public pagination: any = {
    current: 1,
    start: 1,
    end: 10,
    pages: 0,
    maxPages: 10,
    offset: 0,
    limit: 10
  }
  public input = '';
  private http: HttpClient;
  private route: ActivatedRoute;
  constructor(http: HttpClient, route: ActivatedRoute) {
    this.http = http;
    this.route = route;
    this.route.params.subscribe(params => {
      this.addr = params['address'];
    });

    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.setCurrentTable();
    this.setPages();
    this.getAddressCount();
    this.getAddressTxList();
  }

  ngOnInit() {
  }

  setCurrentTable() {
    for(var i = 0; i < this.pagination.maxPages; i++) {
      this.emptyTable.push( {"txid": "&nbsp;","timestamp": "","amount": "","type": "","blockindex": ""});
    }
    this.currentTable = this.emptyTable.slice();
  }
  setPages() {
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.pagination.pages = Math.ceil(this.data.total / this.pagination.maxPages);
    this.pagination.start = this.pagination.start + (this.pagination.offset * this.pagination.maxPages);
    this.pagination.end = this.pagination.maxPages + (this.pagination.offset * this.pagination.maxPages);
    if(this.pagination.start + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages - this.pagination.maxPages) {
      this.pagination.start = this.pagination.pages - this.pagination.maxPages;
    }
    if(this.pagination.end + (this.pagination.offset * this.pagination.maxPages) > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
    }
  }
  nextPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current < this.pagination.pages) {
      this.pagination.current++;
      this.getAddressTxList();
    }
    if(this.pagination.end < this.pagination.pages && this.pagination.current > Math.floor(this.pagination.maxPages / 2)) {
      this.pagination.start++;
      this.pagination.end++;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  prevPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current > 1) {
      this.pagination.current--;
      this.getAddressTxList();
    }
    if(this.pagination.start > 1 && this.pagination.current < this.pagination.pages - Math.ceil(this.pagination.maxPages / 2)) {
      this.pagination.start--;
      this.pagination.end--;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  setPage(page) {
    if(this.gettingTxs) return;
    if(page == this.pagination.current || !page || isNaN(page)) {
      return;
    }
    this.pagination.current = parseInt(page);
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;

    this.pagination.start = this.pagination.current - Math.floor(this.pagination.maxPages / 2);
    this.pagination.end = this.pagination.current + Math.floor(this.pagination.maxPages / 2);

    if(this.pagination.start < 1) {
      this.pagination.start = 1;
      // this.pagination.current = this.pagination.start;
      this.pagination.end = this.pagination.maxPages;
    }
    if(this.pagination.end > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
      // this.pagination.current = this.pagination.end;
      this.pagination.start = this.pagination.end - this.pagination.maxPages;
    }
    if(this.pagination.current < 1) {
      this.pagination.current = this.pagination.start;
    }
    if(this.pagination.current > this.pagination.end) {
      this.pagination.current = this.pagination.end;
    }
    this.getAddressTxList();
  }

  getAddressTxList() {
    this.gettingTxs = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAddressTxs/' + this.addr + '/' + this.pagination.limit + '/' + this.pagination.offset;
    console.log('url', url)
    this.http.get(url).subscribe(
      (txs: any) => {
        this.txs = txs;
        this.currentTable = this.emptyTable.slice();
        for(var i = 0; i< this.txs.length; i++) {
          this.currentTable[i] = this.txs[i];
        }
        this.gettingTxs = false;
      },
      (error) => {
        console.log(error);
        this.gettingTxs = false;
      }
    )
  }

  getAddressCount() {
    this.gettingAddressCount = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAddressDetails/' + this.addr;
    console.log('url', url)
    this.http.get(url).subscribe(
      (addressDetails: any) => {
        this.addressDetails = addressDetails;
        this.gettingAddressCount = false;
      },
      (error) => {
        console.log(error);
        this.gettingAddressCount = false;
      }
    )
  }

  @HostListener('window:resize')
  onWindowResize() {
    //debounce resize, wait for resize to finish before doing stuff
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.setPages();
  }

}