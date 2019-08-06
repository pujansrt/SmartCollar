const _ = require("lodash");
if (process.env.IS_OFFLINE) {
    config = {region: "localhost", endpoint: "http://localhost:8000"};
}
module.exports = async () => {
    process.env.ACTIVITY_TYPES = "BARK,LOCATION,PHYSICAL_ACTIVITY";
    process.env.TABLE_NAME = "pujan";
};

