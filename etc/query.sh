#!/usr/bin/env bash

#aws dynamodb query \
#    --table-name pujan \
#    --key-condition-expression "partitionKey = :deviceId AND sortKey >= :startdatetime" \
#    --expression-attribute-values '{
#        ":deviceId": { "S": "54668-30073-6ad9de2" },
#        ":startdatetime": { "S": "1534000000000" }
#    }' \
#    --endpoint-url http://localhost:8000


aws dynamodb query \
    --table-name pujan \
    --key-condition-expression "partitionKey = :deviceId AND sortKey >= :startdatetime" \
    --filter-expression "#activityType = :activityType" \
    --expression-attribute-names '{"#activityType": "activityType"}' \
    --expression-attribute-values '{
        ":deviceId": { "S": "54668-30073-6ad9de2" },
        ":startdatetime": { "S": "1534000000000" },
        ":activityType" : { "S": "LOCATION"}
    }' \
    --endpoint-url http://localhost:8000