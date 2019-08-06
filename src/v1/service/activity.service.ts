import {ActivityItem} from "../models/ActivityItem";
import moment = require("moment");

const _ = require("lodash");
const AWS = require("aws-sdk");
const TABLE_NAME: string = process.env.TABLE_NAME;
const ACTIVITY_TYPES: string[] = process.env.ACTIVITY_TYPES.split(",");

/**
 * Database service
 * Business logic and operations are implemented here
 *
 * @author Pujan Srivastava
 *
 */
export class ActivityService {

    /**
     * Constructor
     *
     * @param db {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html}
     */
    constructor(private db: any) {

    }

    /**
     * Query <code>activity items</code> from dynamodb database
     *
     * @param item {@link ActivityItem} - activityItem
     * @return Promise<any>
     */
    public async getActivityItem(item: ActivityItem): Promise<any> {

        // Timestamp validation
        const tsregex = /^[0-9]{13}$/;
        if (item && item.endTime && !tsregex.test("" + item.endTime)) throw new Error("endTime is not in right format");
        if (item && item.startTime && !tsregex.test("" + item.startTime)) throw new Error("startTime is not in right format");

        // If startTime is not provided in the query, today start time(00:00:00) is considered
        const startTime: any = item && item.startTime ? item.startTime : moment().utc().startOf('day').format('x');

        // dynamodb params preparation for the query
        let params: any = {
            ExpressionAttributeValues: {
                ":deviceId": {"S": item.partitionKey},
                ":startTime": {"S": "" + startTime}
            },
            KeyConditionExpression: 'partitionKey = :deviceId AND sortKey >= :startTime',
            TableName: TABLE_NAME,
            Limit: item && item.pageSize ? item.pageSize : 10
        };

        // if both startTime and endTime provided query need to be adjusted (range query)
        if (item && item.endTime) {
            params.ExpressionAttributeValues[":endTime"] = {"S": "" + item.endTime};
            params.KeyConditionExpression = 'partitionKey = :deviceId AND sortKey BETWEEN :startTime AND :endTime'
        }

        // filter: query on activityType if provided
        if (item && item.activityType) {
            if (!_.includes(ACTIVITY_TYPES, item.activityType)) throw new Error(`ActivityType "${item.activityType}" is not found`);
            params.FilterExpression = '#activityType = :activityType';
            params.ExpressionAttributeNames = {"#activityType": "activityType"};
            params.ExpressionAttributeValues[":activityType"] = {S: item.activityType};
        }

        // Pagination
        if (item && item.sortKey && item.partitionKey) {
            params.ExclusiveStartKey = {partitionKey: {S: item.partitionKey}, sortKey: {S: item.sortKey}};
        }

        try {
            const items = await this.db.query(params).promise(); // query
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
            console.error('[ACTIVITY_SERVICE.getActivityItem] 90: Error: ',error);
            throw new Error(error.message);
        }
    }


    /**
     * Create new activityItem in the dynamodb database
     *
     * @param item {@link ActivityItem} - activityItem
     *
     */
    public async createActivityItem(item: ActivityItem): Promise<any> {
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
                // sortKey: {S: _.now() + "-" + _.indexOf(ACTIVITY_TYPES, item.activityType)},
                activityType: {S: item.activityType},
                createdAt: {S: moment.utc().toISOString()},
                actionData: actionData
            },
            TableName: TABLE_NAME
        };

        try {
            await this.db.putItem(params).promise();
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

        let items = await this.db.query(params).promise();
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
    }


    public async deleteActivityItem(item: ActivityItem): Promise<ActivityItem> {
        let params: any = {
            Key: {
                partitionKey: {S: item.partitionKey},
                sortKey: {S: item.sortKey},
            },
            TableName: TABLE_NAME
        };

        try {
            await this.db.deleteItem(params).promise();

            return {
                partitionKey: params.Key.partitionKey.S,
                sortKey: params.Key.sortKey.S
            };
        } catch (error) {
            console.error('Error: ', error.message);
            throw new Error(error.message);
        }
    }
}