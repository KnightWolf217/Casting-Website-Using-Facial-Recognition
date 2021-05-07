let AWS = require("aws-sdk");
let axios = require('axios');

exports.handler = (event) => {
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

        let jobId = event.queryStringParameters.id;
        let creatorEmail = response.data.email;
        let roleName = event.queryStringParameters.role;

        var paramsJobs = {
            TableName: "Jobs",
            Item: {
                roleId: jobId,
                role_name: roleName,
                posted_by: creatorEmail
            }
        };

        let documentClient = new AWS.DynamoDB.DocumentClient();

        //Store job in DynamoDB and handle errors
        documentClient.put(paramsJobs, function(err, data) {
            if (err) {
                console.error("Unable to add item");
                console.error("Error JSON:", JSON.stringify(err));
            } else {
                console.log("added to table!");
            }
        })

        var params = {
            UserPoolId: "us-east-1_MEb9PHP1H",
            /* required */
            AttributesToGet: [
                "email",
                "name"
            ],
            Limit: 0
        };
        return new Promise((resolve, reject) => {
            //generating face match for all users in the cognito database
            var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
            cognitoidentityserviceprovider.listUsers(params, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    for (let i = 0; i < data.Users.length; i++) {
                        let name = data.Users[i].Attributes[0].Value;
                        let email = data.Users[i].Attributes[1].Value;

                        let client = new AWS.Rekognition();

                        const params2 = {
                            SourceImage: {
                                S3Object: {
                                    Bucket: 'rupakbucket3',
                                    Name: 'jobs/' + jobId + '.jpg'
                                },
                            },
                            TargetImage: {
                                S3Object: {
                                    Bucket: 'rupakbucket3',
                                    Name: 'users/' + email + '.jpg'
                                },
                            },
                            SimilarityThreshold: 0
                        }
                        client.compareFaces(params2, function(err, response) {
                            if (err) {
                                console.log(JSON.stringify(err)); // an error occurred
                            } else {
                                console.log(response.FaceMatches[0].Similarity.toFixed(2));
                                //parameters to save to applicants table
                                var params3 = {
                                    TableName: "Applicants",
                                    Item: {
                                        job_id: jobId,
                                        posted_by: creatorEmail,
                                        applicant_email: email,
                                        applicant_name: name,
                                        face_score: response.FaceMatches[0].Similarity.toFixed(2),
                                        role_name: roleName
                                    }
                                };

                                //Store data in DynamoDB and handle errors
                                documentClient.put(params3, function(err, data) {
                                    if (err) {
                                        console.error("Unable to add item");
                                        console.error("Error JSON:", JSON.stringify(err));
                                    } else {
                                        console.log("added to table!");
                                    }
                                })
                            }
                        });
                    }
                }
            })
        });
    });
};