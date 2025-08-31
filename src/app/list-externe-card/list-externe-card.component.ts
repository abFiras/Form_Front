import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-externe-card',
  standalone: false,
  templateUrl: './list-externe-card.component.html',
  styleUrl: './list-externe-card.component.css'
})
export class ListExterneCardComponent {
  constructor(private router :Router){}
creelisteexterne() {
  this.router.navigate(['/creelisteexterne']);
}

}
