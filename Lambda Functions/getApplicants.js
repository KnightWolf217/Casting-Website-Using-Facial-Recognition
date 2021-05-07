let axios = require('axios');
let AWS = require("aws-sdk");

//Create client for accessing DynamoDB
let documentClient = new AWS.DynamoDB.DocumentClient();

/* Returns all data from Table */
exports.handler = (event, context, callback) => {
    //validate login token
    let x = event.queryStringParameters.token
    axios({
        url: 'https://magic-caster-producers.auth.us-east-1.amazoncognito.com/oauth2/userInfo',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + x
        },
    }).then(function(response) {
        let userEmail = response.data.email;

        let params = {
            TableName: "Applicants",
            FilterExpression: "#posted_by = :value",
            ExpressionAttributeNames: {
                "#posted_by": "posted_by",
            },
            ExpressionAttributeValues: { ":value": userEmail }
        };

        //Scan table to retrieve filtered data
        documentClient.scan(params, (err, data) => {
            if (err) {
                console.log("\nERROR:\n" + err + "\n");

                //Generate an error without sending back to client.
                callback(err);
            } else {
                console.log("\nDATA:\n" + JSON.stringify(data) + "\n");

                //Create object to set status code and hold error
                let response = {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
                    },
                    body: JSON.stringify(data)

                }
                callback(null, response);
            }
        });
    });
};