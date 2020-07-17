import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { split, ApolloLink, from } from "apollo-link";
import { WebSocketLink } from "apollo-link-ws";
import { createHttpLink } from "apollo-link-http";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
//import fetch from "unfetch";
import { getMainDefinition } from "apollo-utilities";
import { onError } from "apollo-link-error";
import * as serviceWorker from './serviceWorker';
import './index.css';
import './fonts/OCRAEXT.TTF';
import './fonts/Blender-Pro-Medium.otf';
import './fonts/DINNextLTPro-Light.ttf';
import './fonts/JosefinSans-Bold.ttf';
import App from './App';
import CONSTANTS from "./constants";

const authMiddleware = new ApolloLink((operation, forward) => {
  /*operation.setContext({
    headers: {
      Authorization: "Bearer " + cookie
    }
  });*/
  return forward(operation);
});

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        if (
          err.extensions &&
          err.extensions.response &&
          err.extensions.response.status === 401
        ) {
          console.log("supposedly push logout onto history?")
          //history.push("/logout");
        }
      }
    }
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  }
);

const cache = new InMemoryCache({
  dataIdFromObject: object => {
    if(object.referralId){
      return object.__typename + object.referralId; //this line tells our apollo store to uniquely identify objects using a combination of the id and typename fields
    }
    return object.__typename + object.id; 
  }
});

let link = null;
// Create an http link:
const httpLink = new createHttpLink({
  uri: CONSTANTS.GRAPHQL_URL,
  fetch: fetch
});

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: CONSTANTS.WEBSOCKET_GRAPHQL_URL,
  options: {
    reconnect: true
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wsLink, // if true (operation is subscription), use web-socket link
  httpLink // else (operation is not subscription), use normal http link
);

export const client = new ApolloClient({
  cache,
  link: from([authMiddleware, errorLink, link])
});

ReactDOM.render(
  
    <BrowserRouter>
      <App />
    </BrowserRouter>
  ,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
