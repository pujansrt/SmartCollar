const {ApolloServer} = require("apollo-server-lambda");

const mainTypeDefs = require("./typedefs/main.typedef");
const mainResolver = require("./resolvers/main.resolver");
const AWS = require("aws-sdk");
let config: any = {};
if (process.env.STAGE === 'local') {// process.env.IS_OFFLINE) {
    config = {region: "localhost", endpoint: "http://localhost:8000"};
}

const server = new ApolloServer({ // run apollo server for lambda
    typeDefs: mainTypeDefs,
    resolvers: mainResolver, // _.merge(otherResolver, mainResolver),
    formatError: (err: any) => { // disable full stack trace in response, show only meaningful
        if (err.message.startsWith("Database Error: ")) {// Don't give the specific errors to the client.
            return new Error('Internal server error');
        }
        return {message: err.message};
    },
    cacheControl: {
        defaultMaxAge: 30,
    },
    context: async () => ({
        db: await new AWS.DynamoDB(config), // singleton for db connection
    })
});

exports.graphql = server.createHandler({
    cors: {
        origin: "*",
        credentials: true
    }
});
