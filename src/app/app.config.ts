import { ApplicationConfig, Injectable, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarNativeDateFormatter,
  DateAdapter,
  DateFormatterParams,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IMAGE_CONFIG } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { authInterceptor } from './interceptors/auth.interceptor';

@Injectable()
export class DateClass extends CalendarNativeDateFormatter {
  public override dayViewHour({ date, locale }: DateFormatterParams): string {
    return new Intl.DateTimeFormat(localStorage.getItem('lang') as string, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  }
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: '../assets/i18n/',
        suffix: '.json',
      },
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader,
        },
      }),
      CalendarModule.forRoot(
        {
          provide: DateAdapter,
          useFactory: adapterFactory,
        },
        {
          dateFormatter: {
            provide: CalendarDateFormatter,
            useClass: DateClass,
          },
        }
      )
    ),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true, 
        disableImageLazyLoadWarning: true
      }
    },NgbActiveModal  
  ],
  
};
