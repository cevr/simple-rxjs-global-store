import { NgModule } from '@angular/core';
import { SocketService } from './socket.service';
import { ContextModule } from '../context/context.module';

@NgModule({
  declarations: [],
  imports: [ContextModule],
  exports: [],
  providers: [SocketService],
  bootstrap: []
})
export class SocketModule {}
