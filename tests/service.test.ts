import {ActivityService} from "../src/v1/service/activity.service";
import {ActivityItem} from "../src/v1/models/ActivityItem";

const AWS = require("aws-sdk");
const config = {region: "localhost", endpoint: "http://localhost:8000"};

describe('Query Suite', () => {

    beforeAll(async (done) => {
        console.log('BeforeAll');
        done();
    });

    test('Query', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.getActivityItem(item);

        expect(response.items.length).toBeGreaterThanOrEqual(0);
        done();
    });

    test('Query - Pagesize', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1111111111111,
            pageSize: 5
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.getActivityItem(item);

        expect(response.items.length).toBeGreaterThanOrEqual(0);
        expect(response.items.length).toBeLessThanOrEqual(5);

        done();
    });


    test('Query - startTime is not valid', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        await activity.getActivityItem(item)
            .then()
            .catch(error => {
                done();
            });
    });

    test('Query - endTime is not valid', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1111111111111,
            endTime: 1
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        activity.getActivityItem(item)
            .then()
            .catch(error => {
                done();
            });
    });


    test('Query - Range search', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1515002351700,
            endTime: 1595002351700
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.getActivityItem(item);
        expect(response.items.length).toBeGreaterThanOrEqual(0);
        done();
    });

    test('Query - Range search with Filter', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1515002351700,
            endTime: 1595002351700,
            activityType: "BARK"
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.getActivityItem(item);
        expect(response.items.length).toBeGreaterThanOrEqual(0);
        done();
    });

    test('Query - Range search with Incorrect Filter', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            startTime: 1515002351700,
            endTime: 1595002351700,
            activityType: "XYZ"
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        activity.getActivityItem(item)
            .then()
            .catch(error => {
                done();
            });
    });


    test('Mutation Create', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            activityType: "BARK",
            actionData: {duration: 34}
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.createActivityItem(item);
        expect(response.items[0].createdAt).toBeTruthy();
        done();
    });

    test('Mutation Create - Fail', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            actionData: {duration: 34}
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        activity.createActivityItem(item)
            .then()
            .catch(error => {
                done();
            });
    });

    test('Mutation Create - Fail', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            activityType: "LOCATION",
            actionData: {location: {lat: 34}}
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        activity.createActivityItem(item)
            .then()
            .catch(error => {
                done();
            });
    });


    test('Mutation Delete', async (done) => {
        const item: ActivityItem = {
            partitionKey: "54668-30073-6ad9de2",
            sortKey: "1565084041403_BARK",
        };
        const db = await new AWS.DynamoDB(config);
        const activity = new ActivityService(db);
        const response = await activity.deleteActivityItem(item);

        expect(response.partitionKey).toBeTruthy();
        expect(response.sortKey).toBeTruthy();
        done();
    });


});