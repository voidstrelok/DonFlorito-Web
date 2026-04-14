import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly _loading = signal<boolean>(false);

  readonly loading = this._loading.asReadonly();
  readonly isLoading = computed(() => this._loading());

  loadingOn(): void {
    this._loading.set(true);
  }

  loadingOff(): void {
    this._loading.set(false);
  }
}
