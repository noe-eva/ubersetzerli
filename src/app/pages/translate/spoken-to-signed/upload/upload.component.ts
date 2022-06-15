import {Component} from '@angular/core';
import {Store} from '@ngxs/store';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent {
  uploadEl: HTMLInputElement = document.createElement('input');

  constructor(private store: Store) {
    this.uploadEl.setAttribute('type', 'file');
    this.uploadEl.setAttribute('accept', '.mp4, .ogv, .webm');

    this.uploadEl.addEventListener('change', this.onFileUpload.bind(this));
  }

  upload(): void {
    this.uploadEl.click();
  }

  onFileUpload(): void {
    const file = this.uploadEl.files[0];
    if (file) {
      // TODO support document upload
      // const objectURL = (window.URL || window.webkitURL).createObjectURL(file);
      // this.store.dispatch(new SetVideo(objectURL));
    }
  }
}
