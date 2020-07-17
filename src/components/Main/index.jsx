import React, { Component } from "react";
import Grid from '@material-ui/core/Grid';
import {Menu} from 'primereact/menu';
import L from 'leaflet';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import './main.css';
import Header from "../Header";
import MapDisplay from "../MapDisplay";
import SidePanel from "../SidePanel";
import WarningMessage from "../WarningMessage";
import GraphQLCall from "../../GraphQLCallProvider";
import {
  GET_ALL_TRAKS,
  SUBSCRIBE_TO_TRAKS
} from "../../graphql_constants";
import { client } from "../../index";

// This component establishes the layout of the UI
export default class Main extends Component {

  // Constructor reads props and initializes state
  constructor(props) {
    super(props);

    // Initial center of the Map
    this.origin = [39.0093852,-77.5046096];
    this.mapRef = React.createRef(); // ref to Map component

    this.trakData = [{"geoId":"Origin","lat":this.origin[0],"long":this.origin[1]}];
    this.featureGroups = this.buildLayers(this.trakData);

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
    console.log("Mounted Main Component");
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
    console.log("Unsubscribing...");
    this.subscription.unsubscribe();
  }

  // handle clicking on the various Menu options
  handleMenuClick = (event) => {
    let action = event.item.label;
    console.log("handleMenuClick: Clicked " + action);

    // clicked "Map -> Reset"
    if (action === "Reset") {
      console.log("handleMenuClick: Attempting to recenter the Map...");
      // setting this state variable triggers the map update in the child
      this.mapRef.current.flyTo(this.origin, 12);
    }
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
      overlays[key] = L.featureGroup(markers);//.addTo(map);
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

  handleReceiveTrak = (obj) => {
    /*var newData = this.state.trakData;
    newData.push(obj);*/
    
    // assemble the HTML for the markers' popups (Leaflet's bindPopup method doesn't accept React JSX)
    const popupContent = `<h6>${obj.geoId}</h6>
        ${obj.lat}, ${obj.long}`;
    let marker = this.pointToLayer(null, [obj.lat,obj.long]);
    marker.bindPopup(popupContent);
    
    // Does a FeatureGroup for this geoId already exist?
    if (this.featureGroups.hasOwnProperty(obj.geoId)) {
      let existingGroup = this.featureGroups[obj.geoId];
      existingGroup.addLayer(marker);
      if (this.mapRef.current.hasLayer(existingGroup)) {
        console.log("Detected existing layer already added to Map");
      }
      else {
        console.log("Detected existing group NOT added to Map!");
      }
    }
    else {
      console.log("Creating a new layer for geoId=" + obj.geoId + "...");
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
    // pad fitBounds() so features aren't hidden under the Filter UI element
    var fitBoundsParams = {
      paddingTopLeft: [200,200],
      paddingBottomRight: [200,200]
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
        <Header onClickHamburger={this.toggleClick.bind(this)}/> 
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
            <Grid item xs={2}>
              <Menu model={this.menuItems} style={{width:"100%"}}/>
            </Grid>
            <Grid item xs={7}>
              <MapDisplay 
                  features={this.state.trakData} 
                  mapCenter={this.state.mapCenter}
                  mapRef={this.mapRef}
                  mapLayers={this.featureGroups}
              />
            </Grid>
            <Grid item xs={3}
                container 
                spacing={3}
                direction="column"
                justify="center"
                alignItems="flex-end"
            >
              <SidePanel output={this.state.trakOutput}/>
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
    var markerParams = {
      radius: 10,
      fillColor: 'purple',
      color: '#fff',
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.3
    };

    return L.circleMarker(latlng, markerParams);
  }

  menuItems = [
    {
       label:'Map',
       icon:'pi pi-fw pi-file',
       items:[
          {
             label:'Reset',
             icon:'pi pi-fw pi-home',
             command: this.handleMenuClick
          },
          {
             label:'Delete',
             icon:'pi pi-fw pi-trash'
          },
          {
             separator:true
          },
          {
             label:'Export',
             icon:'pi pi-fw pi-external-link'
          }
       ]
    },
    {
       label:'Edit',
       icon:'pi pi-fw pi-pencil',
       items:[
          {
             label:'Left',
             icon:'pi pi-fw pi-align-left'
          },
          {
             label:'Right',
             icon:'pi pi-fw pi-align-right'
          },
          {
             label:'Center',
             icon:'pi pi-fw pi-align-center'
          },
          {
             label:'Justify',
             icon:'pi pi-fw pi-align-justify'
          }
       ]
    },
    {
       label:'Users',
       icon:'pi pi-fw pi-user',
       items:[
          {
             label:'New',
             icon:'pi pi-fw pi-user-plus'
          },
          {
             label:'Delete',
             icon:'pi pi-fw pi-user-minus'
          },
          {
             label:'Search',
             icon:'pi pi-fw pi-users'
          }
       ]
    },
    {
       label:'Events',
       icon:'pi pi-fw pi-calendar',
       items:[
          {
             label:'Edit',
             icon:'pi pi-fw pi-pencil'
          },
          {
             label:'Archive',
             icon:'pi pi-fw pi-calendar-times'
          }
       ]
    },
    {
       label:'Quit',
       icon:'pi pi-fw pi-power-off'
    }
 ];
}
