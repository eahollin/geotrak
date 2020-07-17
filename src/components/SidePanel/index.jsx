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
  // this.props.output
  
  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("Mounted SidePanel Component");
    console.log("Received initial output: " + this.props.output);
  }

  render() { 
    return (
      <>
        <Grid item>
          <Card id="sidebar-card" className="customStyle" variant="outlined">
            <CardContent>
              <Typography className="title" color="textSecondary" gutterBottom>
                Helpful Tip!
              </Typography>
              <Typography variant="h6" component="h2">
                If this is the first time you are using GeoTrak(tm), there
                are a few things you should know!  Lorem ipsum dolor sit
                amet, or something like that, and other things.
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
}
