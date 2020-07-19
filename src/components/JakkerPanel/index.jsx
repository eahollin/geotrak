import React, { Component } from "react";
import Typography from '@material-ui/core/Typography';
import { Panel } from 'primereact/panel';
import { Dropdown } from 'primereact/dropdown';
import { ListBox } from 'primereact/listbox';
import { InputText  } from 'primereact/inputtext';
import { Slider } from 'primereact/slider';
import { ColorPicker } from 'primereact/colorpicker';
import { Button } from 'primereact/button';
import 'primeflex/primeflex.css';
import './jakkerpanel.css';
import CONSTANTS from "../../constants";

export default class JakkerPanel extends Component {
  
  constructor(props) {
    super(props);

    // load contents of listbox from passed prop
    let selectItems = [
      {label: 'Zombie 1', value: 'zombie1'},
      {label: 'Zombie 2', value: 'zombie2'},
      {label: 'Roamer', value: 'roamer'},
      {label: 'Traveller', value: 'traveller'},
      {label: 'Caravan', value: 'caravan'}
    ];
    
    this.state = {
      entitySelectItems: selectItems,
      entityId: "",
      entityName: "",
      iterCount: 0,
      color: CONSTANTS.DEFAULT_COLOR
    };
  }
  
  // componentDidMount event called at component load time
  componentDidMount() {
    console.log("componentDidMount: Mounted JakkerPanel Component");
  }

  // handle submission of the TrakkerJakker job
  handleClick() {
    console.log("Submitting job:")
    console.log(this.state);

    let selectItems = this.state.entitySelectItems;

    // construct target URL
    let targetUrl = CONSTANTS.JAKKER_URL;
    if (this.state.entityId || this.state.entityName || (this.state.iterCount && this.state.iterCount > 0)) {
      targetUrl = targetUrl + "?"; // we'll at least be tacking on -something-...
    }
    if (this.state.entityId) {
      targetUrl = targetUrl + "geoId=" + this.state.entityId;
      if (this.state.color) {
        this.props.setColor(this.state.entityId, this.state.color);
      }
    }
    else if (this.state.entityName) {
      targetUrl = targetUrl + "geoId=" + this.state.entityName;
      selectItems.push({label: this.state.entityName, value: this.state.entityName});
      if (this.state.color) {
        this.props.setColor(this.state.entityName, this.state.color);
      }
    }
    if ((this.state.entityId || this.state.entityName) && this.state.iterCount && this.state.iterCount > 0) {
      targetUrl = targetUrl + "&";
    }
    if (this.state.iterCount && this.state.iterCount > 0) {
      targetUrl = targetUrl + "iterations=" + this.state.iterCount;
    }
    console.log("handleClick: target URL (with params) is " + targetUrl);
    
    // invoke the TrakkerJakker REST endpoint
    fetch(targetUrl)
        .then(res => console.log(res.ok()))
        .catch(console.log);

    // reset state variables
    this.setState({
      entitySelectItems: selectItems,
      entityId: "",
      entityName: "",
      iterCount: 0,
      color: CONSTANTS.DEFAULT_COLOR
    });
  }
  
  render() {
    return (
      <Panel header="TrakkerJakker Form" style={{width:'100%',align:'left'}} toggleable={true} collapsed={this.state.panelCollapsed} onToggle={(e) => this.setState({panelCollapsed: e.value})}>
        <Typography variant="h5">Configure a TrakkerJakker job using the form below.  Press 'Submit' to execute.</Typography><br/>
        <div className="p-field p-fluid">
          <label htmlFor="entityId">Select GeoEntity:</label>
          <Dropdown optionLabel="label" optionValue="value" dataKey="value" value={this.state.entityId} options={this.state.entitySelectItems} onChange={(e) => {this.setState({entityId: e.value})}} placeholder="Select a GeoEntity"/>
        </div>
        <div className="p-field p-fluid">
          <label htmlFor="entityName">...or Create a New One:</label>
          <InputText id="entityName" value={this.state.entityName} onChange={(e) => this.setState({entityName: e.target.value})} />
        </div>
        <div className="p-field p-fluid">
          <div className="p-grid">
            <div className="p-col">
              <label htmlFor="iterCount">Number of Iterations:</label>
            </div>
            <div className="p-col-fixed" style={{width:'20px'}}>
              <small id="iterCount-help">{this.state.iterCount}</small>
            </div>
          </div>
          <Slider id="iterCount" value={this.state.iterCount} onChange={(e) => this.setState({iterCount: e.value})} />
        </div>
        <div className="p-field p-grid">
          <label htmlFor="color" className="p-col-fixed" style={{width:'75px'}}>Color:</label>
          <div className="p-col">
            <div className="p-row">
              <ColorPicker id="color" value={this.state.color} onChange={(e) => this.setState({color: "#"+e.value})} />
            </div>
            <div className="p-row-fixed" style={{height:'20px'}}>
              <small id="color-help">&nbsp;{this.state.color}</small>
            </div>
          </div>
        </div>
        <div className="p-field">
          <Button label="Submit" icon="pi pi-check" iconPos="right" onClick={this.handleClick.bind(this)}/>
        </div>
      </Panel>
    );
  }
}