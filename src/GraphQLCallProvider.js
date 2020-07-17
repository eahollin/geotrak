import { getMainDefinition } from "apollo-utilities";

const operationTypes = {
  query: "query",
  mutation: "mutation",
  subscription: "subscription"
};

export default {
  QueryOrMutation: (client, query, variables, fetchPolicy) => {
    //switch between queries and mutations for graphQL API Calls
    let graphQLCall = (type, query, variables, fetchPolicy) =>
      new Promise((resolve, reject) => {
        if (type === operationTypes.query) {
          fetchPolicy = fetchPolicy || "cache-first"; //cache-first is default, but you can provide other fetchPolicies (e.g. network-only)
          client
            .query({ query, variables, fetchPolicy })
            .then(data => resolve(data))
            .catch(err => reject(err));
        } else if (type === operationTypes.mutation) {
          // By default (with no fetchPolicy provided) mutations fire remotely then the results update the cache (as in network-only)
          // (See: https://github.com/apollographql/apollo-client/issues/4577#issuecomment-472791200)
          // The no-cache option (only) is enabled for mutations because you might not want to update the cache sometimes
          if (fetchPolicy !== "no-cache") {
            fetchPolicy = undefined;
          } // no fetchPolicy is the default for mutations, but allow no-cache
          client
            .mutate({ mutation: query, variables, fetchPolicy })
            .then(data => resolve(data))
            .catch(err => reject(err));
        } else {
          throw new Error("type needs to be a query or mutation");
        }
      });

    let fetch = (query, variables, fetchPolicy) =>
      new Promise((resolve, reject) => {
        try {
          let type = getMainDefinition(query).operation;

          graphQLCall(type, query, variables, fetchPolicy)
            .then(res => resolve({ res, client }))
            .catch(err => reject(err));
        } catch (err) {
          console.log(err);
        }
      });

    return fetch(query, variables, fetchPolicy);
  },

  //Subscriptions are handled differently than queries/mutations. We need a callback function (to execute when the subscription data comes in).
  //We also need to return a subscription object to the caller so we can use that to unsubscribe when needed.
  Subscription: (client, query, variables, callback) => {
    if (
      getMainDefinition(query).operation === operationTypes.subscription &&
      process.env.NODE_ENV !== "test"
    ) {
      return client.subscribe({ query, variables }).subscribe({
        next: data => {
          callback({ res: data, client });
        },
        error: err => {
          console.log(err);
        }
      });
    }
  }
};
