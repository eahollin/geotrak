import React, { Component } from "react";
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import {InputTextarea} from 'primereact/inputtextarea';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import './sidepanel.css';

export default class SidePanel extends Component {
  // this.props.output - dynamically-generated output to display in text box
  // this.props.isOpen - whether or not the SidePanel is open
  
  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("componentDidMount: Mounted SidePanel Component");
    console.log("componentDidMount: Received initial output: " + this.props.output);
  }

  render() { 
    if (this.props.isOpen) {
      return (
        <>
          <Grid item>
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
                <Button size="small">Learn More</Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item style={{width:'100%',align:'left'}}>
              <Typography variant="h5">Output will appear below:</Typography><br/>
              <InputTextarea rows={15} cols={35}
                value={this.props.output}
                disabled={true}
                autoResize={false}
                style={{width: "100%"}}
              />
          </Grid>
        </>
      );
    }
    else {
      return(
        <div/>
      );
    }
  }
}
