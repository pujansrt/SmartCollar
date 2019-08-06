import {ActivityItem} from "../../models/ActivityItem";
import {ActivityService} from "../../service/activity.service";

const activityResolvers = {
    Query: {

        /**
         * Implementation
         *
         * @param parent - GraphQL parent from which query should start (if used)
         * @param args - GraphQL argument passed to the field
         * @param ctx - context to be set by apollo server
         * @param info - GraphQL resolve info of the current resolver. It provides access to subquery that starts at current resolver
         */
        getActivityItems: async (parent: any, args: ActivityItem, ctx: any, info: any) => {
            const activity = new ActivityService(ctx.db);
            return await activity.getActivityItem(args);
        }
    },
    Mutation: {

        createActivityItem: async (parent: any, args: any, ctx: any, info: any) => {
            const item: ActivityItem = args.data;
            const activity = new ActivityService(ctx.db);
            return await activity.createActivityItem(item);
        },

        deleteActivityItem: async (parent: any, args: any, ctx: any, info: any) => {
            const item: ActivityItem = args.data;
            const activity = new ActivityService(ctx.db);
            return await activity.deleteActivityItem(item);
        },
    }

};

module.exports = activityResolvers;
