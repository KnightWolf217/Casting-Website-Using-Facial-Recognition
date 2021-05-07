let AWS = require("aws-sdk");
let axios = require('axios');

exports.handler = (event) => {
    //validate login token
    let x = event.queryStringParameters.token;

    axios({
        url: 'https://magic-caster.auth.us-east-1.amazoncognito.com/oauth2/userInfo',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + x
        },
    }).then(function(response) {
        let userName = response.data.name;
        let userEmail = response.data.email;

        let params = {
            TableName: "Jobs"
        };

        //create new documentClient
        let documentClient = new AWS.DynamoDB.DocumentClient();

        //Scan table to retrieve all jobs
        documentClient.scan(params, (err, data) => {
            if (err) {
                console.log("\nERROR:\n" + err + "\n");
            } else {
                //for all jobs
                for (let i = 0; i < data.Items.length; i++) {

                    //aws rekognition client
                    let client = new AWS.Rekognition();

                    const params2 = {
                        SourceImage: {
                            S3Object: {
                                Bucket: 'rupakbucket3',
                                Name: 'jobs/' + data.Items[i].roleId + '.jpg'
                            },
                        },
                        TargetImage: {
                            S3Object: {
                                Bucket: 'rupakbucket3',
                                Name: 'users/' + userEmail + '.jpg'
                            },
                        },
                        SimilarityThreshold: 0
                    };
                    //generate face match score for each job
                    client.compareFaces(params2, function(err, response) {
                        if (err) {
                            console.log(JSON.stringify(err)); // an error occurred
                        } else {
                            console.log(response.FaceMatches[0].Similarity.toFixed(2));
                            //parameters to save to applicants table
                            var params3 = {
                                TableName: "Applicants",
                                Item: {
                                    job_id: data.Items[i].roleId,
                                    posted_by: data.Items[i].posted_by,
                                    applicant_email: userEmail,
                                    applicant_name: userName,
                                    face_score: response.FaceMatches[0].Similarity.toFixed(2),
                                    role_name: data.Items[i].role_name
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
                            });
                        }
                    });
                }
            }
        });
    });
};