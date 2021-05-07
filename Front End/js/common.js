//bucket configurations
var bucketName = "";
var bucketRegion = "";
var IdentityPoolId = "";

AWS.config.update({
    region: bucketRegion,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId
    })
});

var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {
        Bucket: bucketName
    }
});

//upload function
function uploadJob() {
    //check if user token is still valid
    let expiry = parseInt(localStorage.getItem('timeout')) + 3600000;
    let now = new Date().getTime()
    if (now > expiry) {
        alert('Session Timed out. Please sign in again');
        signOut();
    } else {
        let random_id = Date.now();
        var files = document.getElementById('file').files;
        if (files) {
            var file = files[0];
            var filePath = random_id;
            var fileUrl = 'https://' + bucketRegion + '.amazonaws.com/rupakbucket3/jobs/' + filePath;
            s3.upload({
                Key: "jobs/" + filePath + ".jpg",
                Body: file,
                ACL: 'public-read'
            }, function(err, data) {
                if (err) {
                    alert('Error');
                } else {
                    $.ajax({
                        url: "https://es1l2xdih9.execute-api.us-east-1.amazonaws.com/default/jobInsertCompare?id=" + random_id +
                            "&token=" + localStorage.getItem('loginToken') + "&role=" + document.getElementById('role').value,
                        type: 'GET',
                    }).done(function() {});
                    alert('Job Posted Successfully! Please go to the Applicants page to view matched actors!');
                }
            }).on('httpUploadProgress', function(progress) {
                var uploaded = parseInt((progress.loaded * 100) / progress.total);
                $(" progress ").attr('value', uploaded);
            });

        }
    }
};

//upload function
function uploadImage() {
    //display uploading message
    document.getElementById("loadingMessage").innerHTML = "Uploading... Please wait";
    //check if user token is still valid
    let expiry = parseInt(localStorage.getItem('timeout')) + 3600000;
    let now = new Date().getTime()
    if (now > expiry) {
        alert('Session Timed out. Please sign in again');
        signOut();
    } else {
        let userEmailAddress = localStorage.getItem('userEmail');
        var files = document.getElementById('file').files;
        if (files) {
            var file = files[0];
            var fileName = userEmailAddress;
            var filePath = 'users/' + fileName + ".jpg";
            var fileUrl = 'https://' + bucketRegion + '.amazonaws.com/rupakbucket3/' + filePath;
            s3.upload({
                Key: filePath,
                Body: file,
                ACL: 'public-read'
            }, function(err, data) {
                if (err) {
                    alert('Error');
                } else {
                    $.ajax({
                        url: "https://es1l2xdih9.execute-api.us-east-1.amazonaws.com/default/userInsertCompare?token=" + localStorage.getItem('loginToken'),
                        type: 'GET'
                    }).done(function() {});
                    alert('Photo updated successfully! All your face scores for each job will be updated shortly!');
                    location.reload();
                }
            }).on('httpUploadProgress', function(progress) {
                var uploaded = parseInt((progress.loaded * 100) / progress.total);
                $(" progress ").attr('value', uploaded);
            });
        }
    }
};

//sign out function
function signOut() {
    localStorage.clear();
    window.location.href = "index.html";
}