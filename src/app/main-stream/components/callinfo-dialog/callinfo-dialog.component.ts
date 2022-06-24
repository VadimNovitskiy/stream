import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogData } from 'src/app/models/dialog-data.model';

@Component({
  selector: 'app-callInfo-dialog',
  templateUrl: './callinfo-dialog.component.html',
  styleUrls: ['./callinfo-dialog.component.scss']
})
export class CallInfoDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<CallInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private _snackBar: MatSnackBar
  ) { }

  public showCopiedSnackBar() {
    this._snackBar.open('Peer ID Copied!', 'Hurrah', {
      duration: 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
