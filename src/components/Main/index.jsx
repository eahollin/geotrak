import React, { Component } from "react";
import Grid from '@material-ui/core/Grid';
import L from 'leaflet';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import './main.css';
import Header from "../Header";
import MapDisplay from "../MapDisplay";
import SidePanel from "../SidePanel";
import JakkerPanel from "../JakkerPanel";
import WarningMessage from "../WarningMessage";
import GraphQLCall from "../../GraphQLCallProvider";
import {
  GET_ALL_TRAKS,
  SUBSCRIBE_TO_TRAKS
} from "../../graphql_constants";
import { client } from "../../index";
import CONSTANTS from "../../constants";

// This component establishes the layout of the UI
export default class Main extends Component {

  // Constructor reads props and initializes state
  constructor(props) {
    super(props);

    // Initial center of the Map
    this.origin = [39.0093852,-77.5046096];
    this.mapRef = React.createRef(); // ref to Map component
    this.colorMap = {"Origin":CONSTANTS.DEFAULT_COLOR};
    this.trakData = [{"geoId":"Origin","lat":this.origin[0],"long":this.origin[1]}];

    // Initialize component state
    // sidebarOpen allows propagation of toggleClick() event
    this.state = {
      mapCenter: this.origin,
      trakOutput: "",
      sidebarOpen: true,
      warningMessageOpen: false,
      warningMessageText: ""
    }
  }

  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("componentDidMount: Mounted Main Component");

    this.featureGroups = this.buildLayers(this.trakData);
    this.layerControl = L.control.layers(null, this.featureGroups);
    this.layerControl.addTo(this.mapRef.current);
    
    // Begin listening for GeoTrak events
    this.subscription = GraphQLCall.Subscription(
      client,
      SUBSCRIBE_TO_TRAKS,
      {},
      ({res}) => {
          // Add to collection and display output
          console.log("EVENT: Received Trak: " + res.data.trakAdded.id);
          this.handleReceiveTrak(res.data.trakAdded);
      });
  }

  // this is where we need to cancel subscriptions
  componentWillUnmount() {
    console.log("componentWillUnmount: Unsubscribing...");
    this.subscription.unsubscribe();
  }

  // Callback for setting GeoEntity color
  colorCallback(geoId, color) {
    console.log("colorCallback: assigning color " + color + " to entity " + geoId);

    this.colorMap[geoId] = "#"+color;
  }

  // Toolbar action handlers:
  // clicked "Reset" on the Toolbar
  handleReset() {
    console.log("handleReset: Recentering the Map...");
    // setting this state variable triggers the map update in the child
    this.mapRef.current.flyTo(this.origin, 12);
  }

  // clicked "Clear" on the Toolbar
  handleClear() {
    console.log("handleClear: Clearing Overlay FeatureGroups...");
    var keys = Object.keys(this.featureGroups);
    keys.forEach((groupName) => {
      if (groupName !== "Origin") {
        console.log("handleClear: Removing FeatureGroup " + groupName);
        this.featureGroups[groupName].clearLayers();
      }
      else {
        console.log("handleClear: Skipping 'Origin'!");
      }
    });

    //TODO: Also need to update the Layers control!
  }

  // clicked "Export to JSON" on the Toolbar
  handleExport() {
    console.log("handleExport: Generating GeoJSON");
    let geojson = [];
    var keys = Object.keys(this.featureGroups);
    keys.forEach((groupName) => {
      geojson.push(this.featureGroups[groupName].toGeoJSON());
    });
    alert(JSON.stringify(geojson));
  }

  // Build the FeatureGroups that will be controlled by the Layers UI control
  buildLayers(traks) {
    // Re-generate the group of feature layers
    var grouped = this.groupBy(traks, 'geoId');
    var keys = Object.keys(grouped);
    var overlays = {};

    keys.forEach((key, index) => {
      let feats = grouped[key];
      let markers = [];
      feats.forEach((feat, index) => {
        // assemble the HTML for the markers' popups (Leaflet's bindPopup method doesn't accept React JSX)
        const popupContent = `<h6>${feat.geoId}</h6>
            ${feat.lat}, ${feat.long}`;
        let marker = this.pointToLayer(null, [feat.lat,feat.long]);
        marker.bindPopup(popupContent);
        markers.push(marker);
      });
      
      // Add the named FeatureGroup to the collection
      overlays[key] = L.featureGroup(markers);
      //overlays[key].addTo(this.mapRef.current);
    });

    return overlays;
  }

  handleWarningClose = () => {
    this.setState({
      warningMessageOpen: false,
      warningMessageText: ""
    });
  }
    
  handleGeneralError = (error) => {
    this.setState({
      warningMessageOpen: true,
      warningMessageText: error
    });
  };

  // callback for handling GeoTrak messages as they are received via the GraphQL Subscription
  handleReceiveTrak = (obj) => {
    // assemble the HTML for the markers' popups (Leaflet's bindPopup method doesn't accept React JSX)
    const popupContent = `<h6>${obj.geoId}</h6>
        ${obj.lat}, ${obj.long}`;
    let marker = this.pointToLayer(obj.geoId, [obj.lat,obj.long]);
    marker.bindPopup(popupContent);
    
    // Does a FeatureGroup for this geoId already exist?
    if (this.featureGroups.hasOwnProperty(obj.geoId)) {
      let existingGroup = this.featureGroups[obj.geoId];
      existingGroup.addLayer(marker);
      if (this.mapRef.current.hasLayer(existingGroup)) {
        console.log("handleReceiveTrak: Detected existing layer already added to Map");
      }
      else {
        console.log("handleReceiveTrak: Detected existing group NOT added to Map!");
      }
    }
    else {
      console.log("handleReceiveTrak: Creating a new layer for geoId=" + obj.geoId + "...");
      this.featureGroups[obj.geoId] = L.featureGroup([marker]);
      //console.log(this.featureGroups[obj.geoId]);
      
      this.mapRef.current.addLayer(this.featureGroups[obj.geoId]);

      // Update the Layer control to include the new FeatureGroup
      this.mapRef.current.removeControl(this.layerControl);
      this.layerControl = L.control.layers(null, this.featureGroups);
      this.layerControl.addTo(this.mapRef.current);
    }
    this.zoomToFeature(this.featureGroups[obj.geoId]);

    //trakData: newData
    this.setState({
      trakOutput: this.state.trakOutput + obj.geoId + " [" + obj.lat + ", " + obj.long + "]\n"
    });
  }

  zoomToFeature(target) {
    // pad fitBounds()
    var fitBoundsParams = {
      paddingTopLeft: [50,50],
      paddingBottomRight: [50,50]
    };
    // set the map's center & zoom so that it fits the geographic extent of the layer
    this.mapRef.current.fitBounds(target.getBounds(), fitBoundsParams);
  }

  render() { 
    const {
      warningMessageOpen,
      warningMessageText
    } = this.state;

    return (
      <>
        <Header onClickHamburger={this.toggleClick.bind(this)}
            onClickReset={this.handleReset.bind(this)}
            onClickClear={this.handleClear.bind(this)}
            onClickExport={this.handleExport.bind(this)}
        />
        <Grid container
            spacing={1}
            direction="row"
            alignItems="flex-start"
        >
          <Grid item xs={12} container 
                direction="row"
                justify="center"
                alignItems="flex-start"
                spacing={2}
          >
            <Grid item xs={3}>
              <JakkerPanel style={{width:"100%"}} setColor={this.colorCallback.bind(this)}/>
            </Grid>
            <Grid item xs={7} style={{minWidth:"800px"}}>
              <MapDisplay 
                  mapCenter={this.state.mapCenter}
                  mapRef={this.mapRef}
                  mapLayers={this.featureGroups}
              />
            </Grid>
            <Grid item xs={2}
                container 
                spacing={3}
                direction="column"
                justify="center"
                alignItems="flex-end"
            >
              <SidePanel output={this.state.trakOutput} isOpen={this.state.sidebarOpen}/>
            </Grid>
          </Grid>       
        </Grid>
          
        <WarningMessage
            open={warningMessageOpen}
            text={warningMessageText}
            onWarningClose={this.handleWarningClose}
        />
      </>
    );
  }

  //toggle the sidebar by manipulating the state variable
  toggleClick() {
    this.setState({"sidebarOpen": !this.state.sidebarOpen});
    console.log("clicked it!");
  }
        
  // simple function for grouping Traks by GeoId
  groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  pointToLayer(feature, latlng) {
    // renders our points as circle markers, rather than Leaflet's default image markers
    // parameters to style the markers
    let color;
    if (this.colorMap[feature]) {
      color = this.colorMap[feature];
    }
    else {
      color = CONSTANTS.DEFAULT_COLOR;
    }
    var markerParams = {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.3
    };

    return L.circleMarker(latlng, markerParams);
  }
}
