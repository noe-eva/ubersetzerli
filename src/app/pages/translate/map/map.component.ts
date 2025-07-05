import {Component, NgModule, OnInit} from '@angular/core';
import {geoJSON, latLng, latLngBounds, Map, tileLayer} from 'leaflet';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {NgxsModule, Store} from '@ngxs/store';
import {firstValueFrom, Observable} from 'rxjs';
import {BaseComponent} from '../../../components/base/base.component';
import {takeUntil, tap} from 'rxjs/operators';
import {SetSignedLanguage} from 'src/app/modules/translate/translate.actions';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent extends BaseComponent implements OnInit {
  static mapGeoJson = null;

  signedLanguage$: Observable<string>;
  selectedDialect: string = '';

  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 6,
        maxZoom: 10,
        attribution: '',
      }),
    ],
    zoom: 8,
    center: latLng(46.7985, 8.2318),
    maxBounds: latLngBounds(
      latLng(45.54177065708703, 5.4652441466393205),
      latLng(48.12451515158937, 11.664585551866729)
    ),
  };

  constructor(private http: HttpClient, private store: Store, public dialogRef: MatDialogRef<MapComponent>) {
    super();
    this.signedLanguage$ = store.select(state => state.translate.signedLanguage);
    this.signedLanguage$
      .pipe(
        tap(d => (this.selectedDialect = d)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  ngOnInit() {
    if (!('document' in globalThis)) {
      return;
    }

    const head = document.getElementsByTagName('head')[0];

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `map.css`;
    head.appendChild(style);
  }

  async onMapReady(map: Map) {
    map.fitBounds(
      latLngBounds(latLng(48.037661708884016, 10.563431572323458), latLng(45.54864651887529, 5.866776298885955))
    );

    const initialOpacity = 0.6;

    const dialectCode = id => `CH-${id}`;

    const modifyStyle = (feature, style) => {
      if (this.selectedDialect === dialectCode(feature.id)) {
        style.fillOpacity = 1;
      }
      return style;
    };

    const style = feature => {
      console.log('feature', feature.id);
      const fillColor = ['VD', 'NE', 'GE', 'JU'].includes(feature.id)
        ? 'green'
        : feature.id === 'TI'
        ? 'orange'
        : '#E31A1C';
      return modifyStyle(feature, {
        fillColor,
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: initialOpacity,
      });
    };

    const selectDialect = dialect => {
      this.store.dispatch(new SetSignedLanguage(dialect));
      this.dialogRef.close();
    };

    // TODO figure out how to use the `cantons.geojson` (topology) file because it is 8 times smaller
    if (!MapComponent.mapGeoJson) {
      MapComponent.mapGeoJson = await firstValueFrom(this.http.get('assets/geography/map.geojson'));
    }

    geoJSON(MapComponent.mapGeoJson, {
      style,
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function () {
          this.setStyle({fillOpacity: 1});
        });
        layer.on('mouseout', function () {
          this.setStyle(modifyStyle(feature, {fillOpacity: initialOpacity}));
        });
        layer.on('click', function () {
          selectDialect(dialectCode(feature.id));
        });
      },
    }).addTo(map);
  }
}

@NgModule({
  declarations: [MapComponent],
  imports: [MatDialogModule, LeafletModule, HttpClientModule, NgxsModule.forFeature([])],
})
export class MapDialogModule {}
