import moment = require("moment");
import {ActivityItem} from "../../models/ActivityItem";

const _ = require("lodash");
const AWS = require("aws-sdk");
const TABLE_NAME: string = process.env.TABLE_NAME;
const ACTIVITY_TYPES: string[] = process.env.ACTIVITY_TYPES.split(",");

const activityResolvers = {
    Query: {
        getActivityItems: async (parent: any, args: ActivityItem, ctx: any, info: any) => {
            console.log('[ACTIVITY_RESOLVERS.getActivityItems] 12: ', args);

            // Timestamp validation
            const tsregex = /^[0-9]{13}$/g;
            if (args && args.endTime && !tsregex.test("" + args.endTime)) throw new Error("endTime is not in right format");
            if (args && args.startTime && !tsregex.test("" + args.startTime)) throw new Error("startTime is not in right format");

            // If startTime is not provided in the query, today start time(00:00:00) is considered
            const startTime: any = args && args.startTime ? args.startTime : moment().utc().startOf('day').format('x');

            // dynamodb params preparation for the query
            let params: any = {
                ExpressionAttributeValues: {
                    ":deviceId": {"S": args.partitionKey},
                    ":startTime": {"S": startTime}
                },
                KeyConditionExpression: 'partitionKey = :deviceId AND sortKey >= :startTime',
                TableName: TABLE_NAME,
                Limit: args && args.pageSize ? args.pageSize : 10
            };

            // if both startTime and endTime provided query need to be adjusted (range query)
            if (args && args.endTime) {
                params.ExpressionAttributeValues[":endTime"] = {"S": args.endTime};
                params.KeyConditionExpression = 'partitionKey = :deviceId AND sortKey BETWEEN :startTime AND :endTime'
            }

            // filter: query on activityType if provided
            if (args && args.activityType) {
                if (!_.includes(ACTIVITY_TYPES, args.activityType)) throw new Error(`ActivityType "${args.activityType}" is not found`);
                params.FilterExpression = '#activityType = :activityType';
                params.ExpressionAttributeNames = {"#activityType": "activityType"};
                params.ExpressionAttributeValues[":activityType"] = {S: args.activityType};
            }

            // Pagination
            if (args && args.sortKey && args.partitionKey) {
                params.ExclusiveStartKey = {partitionKey: {S: args.partitionKey}, sortKey: {S: args.sortKey}};
            }

            try {
                const items = await ctx.db.query(params).promise(); // query
                items.Items = items.Items.map((item: any) => AWS.DynamoDB.Converter.unmarshall(item)); // json output without db datatypes

                let response: any = {};
                if (items && items.LastEvaluatedKey) { // next page exists
                    response.next = {
                        partitionKey: items.LastEvaluatedKey.partitionKey.S,
                        sortKey: items.LastEvaluatedKey.sortKey.S
                    };

                }
                response.items = items.Items;
                return response;
            } catch (error) {
                console.error('Error: ', error.message);
                throw new Error(error.message);
            }
        }
    },
    Mutation: {
        createActivityItem: async (parent: any, args: any, ctx: any, info: any) => {
            const item: ActivityItem = args.data;

            // Validations
            if (!item.partitionKey) throw new Error("Missing partitionKey in the mutation");
            if (!item.activityType) throw new Error("Missing activityType in the mutation");
            if (!_.includes(ACTIVITY_TYPES, item.activityType)) throw new Error(`ActivityType "${item.activityType}" is not found`);

            let actionData: any = {M: {}};

            if (_.get(item, 'actionData.duration')) {
                actionData.M.duration = {N: "" + item.actionData.duration};
            }
            if (item.activityType === "LOCATION" && _.get(item, 'actionData.location')) {
                if (!_.get(item, "actionData.location.lat")) throw new Error("Field \"lat\" is not provided in the location object");
                if (!_.get(item, "actionData.location.long")) throw new Error("Field \"long\" is not provided in the location object");

                actionData.M.location = {M: {lat: {S: item.actionData.location.lat}, long: {S: item.actionData.location.long}}};
            }

            let params: any = {
                Item: {
                    partitionKey: {S: item.partitionKey}, // "54668-30073-6ad9de2"
                    sortKey: {S: _.now() + "_" + item.activityType},
                    activityType: {S: item.activityType},
                    createdAt: {S: moment.utc().toISOString()},
                    actionData: actionData
                },
                TableName: TABLE_NAME
            };

            try {
                await ctx.db.putItem(params).promise();
            } catch (error) {
                console.error('Error: ', error.message);
                throw new Error(error.message);
            }


            // Get the last inserted item
            params = {
                ExpressionAttributeValues: {
                    ":partitionKey": {"S": item.partitionKey},
                    ":sortKey": {"S": params.Item.sortKey.S}
                },
                KeyConditionExpression: "partitionKey = :partitionKey AND sortKey = :sortKey",
                TableName: TABLE_NAME,
                Limit: 1
            };

            let items = await ctx.db.query(params).promise();
            items.Items = items.Items.map((item: any) => AWS.DynamoDB.Converter.unmarshall(item));

            let response: any = {};
            if (items && items.LastEvaluatedKey) {
                response.next = {
                    partitionKey: items.LastEvaluatedKey.partitionKey.S,
                    sortKey: items.LastEvaluatedKey.sortKey.S
                };

            }
            response.items = items.Items;
            return response;
        },
        deleteActivityItem: (parent: any, args: any, ctx: any, info: any) => {
            // TODO: delete record
            return {};
        },
    }

};

module.exports = activityResolvers;
