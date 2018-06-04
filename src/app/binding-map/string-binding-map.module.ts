import { NgModule } from '@angular/core';
import { StringBindingMapService } from './string-binding-map.service';
import { SocketModule } from '../socket/socket.module';

@NgModule({
  declarations: [],
  imports: [SocketModule],
  exports: [],
  providers: [StringBindingMapService],
  bootstrap: []
})
export class StringBindingMapModule {}
