import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cs-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Staff POS</h1>
      <p>Scaffold online. Theme, Apollo, auth, and shell land in sc-198…sc-201.</p>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 2rem;
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: 1.75rem;
      }
      p {
        margin: 0;
        color: #57534e;
      }
    `,
  ],
})
export class PlaceholderPage {}
