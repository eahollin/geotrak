import React, { Component } from "react";
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import Grid from '@material-ui/core/Grid';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import AppBar from '@material-ui/core/AppBar';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {Dialog} from 'primereact/dialog';
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

const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: "#EBE9CD",
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: "#EBE9CD"
  },
  drawerContainer: {
    overflow: 'auto',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
    marginTop: 30
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

function Wrapper(props) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={classes.appBar}
      >
        <Header onClickHamburger={props.onClickHamburger}
              onClickReset={props.onClickReset}
              onClickClear={props.onClickClear}
              onClickExport={props.onClickExport}
        />
      </AppBar>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: props.isOpen,
        })}
      >
        <div className={classes.drawerHeader} />
        <Grid container
            direction="row"
            justify="left"
            alignItems="flex-start"
            spacing={2}
            padding={3}
        >
          <Grid item sm={3} xs={12} container
              direction="column"
              justify="top"
              alignItems="flex-start"
              spacing={2}>
            {props.showWelcome && <Grid item>
              <Card id="sidebar-card" className="customStyle" variant="outlined">
                <CardContent>
                  <Typography className="title" color="textSecondary" gutterBottom>
                    Wecome!
                  </Typography>
                  <Typography variant="h6" component="h2">
                    Use the Toolbar to Reset or Clear the Map display, or export the
                    generated Trak data to GeoJSON format.  Use the form to the left of
                    the Map to configure and execute TrakkerJakker jobs, which simulate
                    various Trak-generating scenarios.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={props.onInfoClick} >Learn More</Button>
                  <Button size="small" onClick={props.onDismissClick} >Dismiss</Button>
                </CardActions>
              </Card>
            </Grid>}
            <Grid container item
                direction="column"
                alignItems="flex-start"
            >
              <JakkerPanel setColor={props.colorCallback}/>
            </Grid>
          </Grid>
          <Grid item style={{minWidth:"200px"}} sm={9} xs={12}>
            <MapDisplay
                mapCenter={props.mapCenter}
                mapRef={props.mapRef}
                mapLayers={props.featureGroups}
            />
          </Grid>
        </Grid>
      </main>
      <Hidden smDown implementation="css">
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="right"
          open={props.isOpen}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div style={{height:"130px"}}/>
          <div className={classes.drawerContainer}  style={{width:drawerWidth-25}}>
            <SidePanel output={props.output}/>
          </div>
        </Drawer>
      </Hidden>
    </div>
  );
}

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
      showInfo: false,
      showWelcome: true,
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

    this.colorMap[geoId] = color;
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
        <Wrapper output={this.state.trakOutput}
            mapCenter={this.state.mapCenter}
            mapRef={this.mapRef}
            featureGroups={this.featureGroups}
            onClickHamburger={this.toggleClick.bind(this)}
            onClickReset={this.handleReset.bind(this)}
            onClickClear={this.handleClear.bind(this)}
            onClickExport={this.handleExport.bind(this)}
            isOpen={this.state.sidebarOpen}
            toggleClick={this.toggleClick.bind(this)}
            colorCallback={this.colorCallback.bind(this)}
            onInfoClick={this.handleInfoClick.bind(this)}
            onDismissClick={this.handleDismissClick.bind(this)}
            showInfo={this.state.showInfo}
            showWelcome={this.state.showWelcome}
        />
        <WarningMessage
            open={warningMessageOpen}
            text={warningMessageText}
            onWarningClose={this.handleWarningClose}
        />
        <Dialog header="GeoTrak (tm) Platform" visible={this.state.showInfo} style={{width: '70vw'}} modal={true} onHide={() => this.setState({showInfo: false})}>
          The GeoTrak (tm) platform is composed of a suite of application services focused on the tracking and visualization 
          of reported geographic position data. It is largely intended to demonstrate the ability of a Quarkus microservice 
          to effectively scale to meet the demand of hundreds to thousands of position reports being sent in from many different 
          IoT sources. The core components of the platform are:<br/><br/>
          <ul>
            <li><b>Trakker:</b> the Quarkus microservice used for capturing reported position data. It accepts GraphQL 
                mutations and pushes received events to a Kafka event stream.</li>
            <li><b>GeoTrak Server:</b> a Spring Boot service which listens to the Kafka event stream written to by Trakker, 
                consumes the reported events, and serves them to client(s) via GraphQL Subscription(s). These events are 
                delivered asynchronously by the Reactive Streams Publisher & Spring WebFlux APIs.</li>
            <li><b>TrakkerJakker:</b> a Spring Boot application which executes parameterized simulations of IoT calls. Uses 
                randomizers to determine number of calls per execution, and to offset geographic positions for each subsequent 
                call. Uses the Java ApolloClient library to execute GraphQL calls against the Trakker service.</li>
            <li><b>GeoTrak (tm):</b> React-based JavaScript UI for visualizing generated geographic position data using Leaflet. 
                Uses JavaScript Apollo client library to establish a GraphQL Subscription to the GeoTrak Server. When position 
                events are received, they are dynamically added to the Map and the Map is re-rendered to show the updated data. 
                Data from each source (identified by GeoID) is rendered in its own Map layer that can be turned on or off through 
                the UI. Allows limited map manipulation and execution of TrakkerJakker processes via simple REST calls.</li>
          </ul>
          A separate service is planned for management of GeoEntity objects (the simulated objects generating the position events), 
          but this facility is currently being provided by the GeoTrak Server component.<br/><br/>
          <Typography variant="h6" style={{horizontalAlign:"center"}}>&copy;2020 Ed Hollingsworth</Typography>
        </Dialog>
      </>
    );
  }

  handleInfoClick() {
    this.setState({"showInfo": true});
  }

  handleDismissClick() {
    this.setState({"showWelcome": false});
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
      fillColor: "#"+color,
      color: '#fff',
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.3
    };

    return L.circleMarker(latlng, markerParams);
  }
}
