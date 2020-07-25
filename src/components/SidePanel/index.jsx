import React, { Component } from "react";
import {InputTextarea} from 'primereact/inputtextarea';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import './sidepanel.css';

export default class SidePanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      "showInfo": false
    };
  }
  // this.props.output - dynamically-generated output to display in text box
  
  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("componentDidMount: Mounted SidePanel Component");
    console.log("componentDidMount: Received initial output: " + this.props.output);
  }

  render() { 
    return (
      <>
        <Grid item style={{width:'100%',align:'left'}}>
            <Typography variant="h5">Output will appear below:</Typography><br/>
            <InputTextarea rows={25} cols={35}
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
