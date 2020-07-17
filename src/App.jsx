import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import Main from "./components/Main";

class App extends Component {
  
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route exact path = "/" render = { (props) => (
              <Main {...props} />
          )}/>
        </Switch>
      </React.Fragment>
    );
  }
}

export default App;
