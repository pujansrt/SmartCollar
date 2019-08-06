export interface ActivityItem {
    partitionKey: string;
    sortKey?: string;
    activityType?: string;
    createdAt?: string;
    startTime?: number;
    endTime?: number;
    actionData: {
        location?: any;
        duration?: number;
    }
    pageSize?:number;
}