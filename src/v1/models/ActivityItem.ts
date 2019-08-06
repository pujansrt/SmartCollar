/**
 * ActivityItem Model is used to model different activities as well as parameters by GQL
 *
 * @author Pujan Srivastava
 */
export interface ActivityItem {
    partitionKey: string;
    sortKey?: string;
    activityType?: string;
    createdAt?: string;
    startTime?: number;
    endTime?: number;
    actionData?: {
        location?: any;
        duration?: number;
    }
    pageSize?:number;
}