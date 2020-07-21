import React, { Component } from "react";
import L from 'leaflet';
// postCSS import of Leaflet's CSS
import 'leaflet/dist/leaflet.css';
import './mapdisplay.css';

export default class MapDisplay extends Component {
  constructor(props) {
    super(props);
    
    //props.mapCenter allows parent to control Map center
    //props.mapRef allows parent to control Map
    this._mapNode = null;

    // Initialize state
    this.state = {
      map: null,
      tileLayer: null,
      zoom: 12
    }

    // store the map configuration properties in an object,
    // we could also move this to a separate file & import it if desired.
    this.config = {};
    this.config.params = {
      center: props.mapCenter,
      zoomControl: true,
      zoom: 12,
      maxZoom: 19,
      minZoom: 1,
      scrollwheel: false,
      legends: true,
      infoControl: false,
      attributionControl: true
    };
    this.config.tileLayer = {
      uri: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      params: {
        minZoom: 1,
        attribution: '&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors'
      }
    };
  }

  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("componentDidMount: Mounted MapDisplay Component");
    
    // create the Leaflet map object
    if (!this.map) this.init(this._mapNode);
  }

  // Initialize the Leaflet Map
  init(id) {
    if (this.map) return;

    console.log("mapLayers looks like this:");
    console.log(this.props.mapLayers);

    // this function creates the Leaflet map object and is called after the Map component mounts
    this.props.mapRef.current = L.map(id, this.config.params);
    this.map = this.props.mapRef.current;
    L.control.scale({ position: "bottomleft"}).addTo(this.map);
    
    // a TileLayer is used as the "basemap"
    const tileLayer = L.tileLayer(this.config.tileLayer.uri, this.config.tileLayer.params).addTo(this.map);
    
    this.setState({
      "tileLayer": tileLayer
    });

    // set our state to include the tile layer
    console.log("init: Map successfully created");
  }

  // this destroys the Leaflet map object & related event listeners
  componentWillUnmount() {
    console.log("componentWillUnmount: Removing Leaflet Map...");
    this.state.map.remove();
  }

  selectGeoId(geoId) {
    console.log("selectGeoId: Finding the requeseted id: " + geoId);
  
    // fit the geographic extent of the GeoJSON layer within the map's bounds / viewport
    //this.zoomToFeature(dataLayer);
  }

  filterFeatures(feature, layer) {
    
    console.log("filterFeatures: Filtering should happen here...");
  }

  render() {
    
    return (
      <div id="map_container" className="mapStyle" ref={(node) => this._mapNode = node}/>
    );
  }
}