import React, { Component } from "react";
import {Toolbar} from 'primereact/toolbar';
import {Button} from 'primereact/button';
import Grid from '@material-ui/core/Grid';
import './header.css';

export default class Header extends Component {
  //this.props.onClickReset - handler function for "Reset" button
  //this.props.onClickClear - handler function for "Clear" button
  //this.props.onClickExport - handler function for "Export to GeoJSON" button

  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("Mounted Header Component")
  }

  render() {
    const logoPath="geotrak-logo.png";
    return (
      <>
        <Grid container
              direction="row"
              alignItems="flex-start"
              id="header-section"
              className="main-header"
              style={{marginLeft:"12px",paddingRight:"40px"}}
        >
          <Grid item xs={12}>
            <ul className="header-list">
              <li className="float-left header-style">
                <img src={logoPath} alt="GeoTrak logo" style={{width:"50px",height:"50px"}}/>
              </li>
              <li className="float-left header-style nav-panel">GeoTrak (tm)</li>
              <li className="float-right header-style icon-menu support" id="hamburger" 
                  onClick={this.props.onClickHamburger} ref="sidebarToggle"></li>
            </ul>
          </Grid>
        </Grid>
        <Grid container
            direction="row"
            alignItems="flex-start"
            style={{marginLeft:"12px",paddingRight:"40px",paddingBottom:"5px"}}
        >
          <Grid item xs={12}>
            <Toolbar>
              <div className="p-toolbar-group-left">
                  <Button label="Reset" icon="pi pi-home" className="p-button-secondary" style={{marginRight:'.25em'}} 
                      onClick={this.props.onClickReset}/>
                  <Button label="Clear" icon="pi pi-trash" className="p-button-secondary"
                      onClick={this.props.onClickClear}/>
                  <i className="pi pi-bars p-toolbar-separator" style={{marginRight:'.25em'}} />
                  <Button label="Export to GeoJSON" icon="pi pi-external-link" className="p-button-secondary"
                      onClick={this.props.onClickExport}/>
              </div>
              <div className="p-toolbar-group-right">
                  <Button icon="pi pi-search" className="p-button-secondary" style={{marginRight:'.25em'}} />
                  <Button icon="pi pi-calendar" className="p-button-secondary" style={{marginRight:'.25em'}} />
                  <Button icon="pi pi-times" className="p-button-secondary" />
              </div>
            </Toolbar>
          </Grid>
        </Grid>
      </>
    );
  }
  //toggle the sidebar by manipulating the state variable
  toggleClick() {
    this.setState({"sidebarOpen": !this.state.sidebarOpen})
  }
}
