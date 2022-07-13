import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '@shared/material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainStreamComponent } from './main-stream/main-stream.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '@environments/environment';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CallInfoDialogComponent } from './main-stream/components/callinfo-dialog/callinfo-dialog.component';
import { ChatComponent } from './main-stream/components/chat/chat.component';

@NgModule({
  declarations: [
    AppComponent,
    MainStreamComponent,
    CallInfoDialogComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
