import gql from "graphql-tag";

export const SUBSCRIBE_TO_TRAKS = gql`
  subscription trakAdded {
    trakAdded {
      id
      geoId
      lat
      long
      alt
    }
  }
`;

export const GET_ALL_TRAKS = gql`
  query getTraks {
    getTraks {
      id
      geoId
      lat
      long
      alt
      timestamp
    }
  }
`;

export const GET_TRAKS_BY_GEO_ID = gql`
  query getTraksByGeoId($geoId: String!) {
    getTraksByGeoId(geoId: $geoId) {
      id
      geoId
      lat
      long
      alt
      timestamp
    }
  }
`;