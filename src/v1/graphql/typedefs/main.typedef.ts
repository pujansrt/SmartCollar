const { gql } = require("apollo-server-lambda");

const allTypeDefs = gql`
  type Collar {
    partitionKey: String!
    sortKey: String!
    activityType: String!
    createdAt: String
    actionData: ActionData
  }
  
  type ActionData {
    duration: Int
    location: Location
  }
  
  type Location {
     lat: String
     long: String
  }
  
  type Query {
    getActivityItems(partitionKey: String!, startTime: String, endTime: String, sortKey: String, pageSize: Int, activityType: String): CollarResult
  }
  
  input CollarInput {
    partitionKey: String!
    activityType: String!
    actionData: actionDataInput!
  }
  
  input CollarDelete {
    partitionKey: String!
    sortKey: String!
  }
  
  input actionDataInput {
    duration: Int
    location: LocationInput
  }
  
  input LocationInput {
     lat: String
     long: String
  }
  
  type Result {
    error: String
  }
  
  type CollarResult {
    items: [Collar]
    next: Page
  }
  
  type Page {
    partitionKey: String
    sortKey: String
  }
  
  type Mutation {
    createActivityItem(data: CollarInput!): CollarResult
    deleteActivityItem(data: CollarDelete!): Collar
  }
  
`;

module.exports = allTypeDefs;
