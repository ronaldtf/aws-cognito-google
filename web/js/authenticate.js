var auth2
var googleUser = null

window.addEventListener('load', function() {
    // Set token value if this page is called from a Cognito User Pool custom domain
    // (know by checking the url path)
    var ID_TOKEN = 'id_token='
    var pathname = window.location.href
    var idTokenPos = pathname.indexOf(ID_TOKEN);
    if (idTokenPos != -1) {
        idTokenPos += ID_TOKEN.length
        var subpath = pathname.substring(idTokenPos)
        var idTokenEnd = subpath.indexOf('&')
        if (idTokenEnd == -1)
            idTokenEnd = subpath.length
        var idToken = pathname.substr(idTokenPos, idTokenEnd)

        output(JSON.stringify(parseJwt(idToken), undefined, 4), document.getElementById("result"))

        setCookie('token', idToken)
        document.getElementById('doClear').disabled = false
        document.getElementById('googleSignin').disabled = true
    }
    // Get Google user
    gapi.load('auth2', function() {
        auth2 = gapi.auth2.init({
            client_id: config.GoogleAppId,
            scope: 'email'
        });
        auth2.currentUser.listen(userChanged)
    })

})

// Listener when the user changes
var userChanged = function(user) {
    var userLogged = (user.Zi != null)
    if (userLogged) {
        googleUser = user
        document.getElementById('buttonFedIdentity1').disabled = false
        document.getElementById('buttonFedIdentity2').disabled = false
        document.getElementById('buttonFedIdentity3').disabled = false
        document.getElementById('buttonFedIdentity4').disabled = false
        document.getElementById('buttonFedIdentity5').disabled = false
        document.getElementById('buttonSTS1').disabled = false
        document.getElementById('buttonSTS2').disabled = false
        document.getElementById('buttonSTS3').disabled = false
        document.getElementById('buttonSTS4').disabled = false
        document.getElementById('buttonSTS5').disabled = false
        document.getElementById('signin').disabled = true
        document.getElementById('signout').disabled = false
        document.getElementById('showtoken').disabled = false
        document.getElementById('doClear').disabled = false
    } else {
        googleUser = null
        document.getElementById('buttonFedIdentity1').disabled = true
        document.getElementById('buttonFedIdentity2').disabled = true
        document.getElementById('buttonFedIdentity3').disabled = true
        document.getElementById('buttonFedIdentity4').disabled = true
        document.getElementById('buttonFedIdentity5').disabled = true
        document.getElementById('buttonSTS1').disabled = true
        document.getElementById('buttonSTS2').disabled = true
        document.getElementById('buttonSTS3').disabled = true
        document.getElementById('buttonSTS4').disabled = true
        document.getElementById('buttonSTS5').disabled = true
        document.getElementById('signin').disabled = false
        document.getElementById('signout').disabled = true
        document.getElementById('showtoken').disabled = true
        if (getCookie('token') == undefined || getCookie('token') == '')
            document.getElementById('doClear').disabled = true
    }
}

// Sign in a Google user
var signIn = function() {
    if (auth2.isSignedIn.get() == false) {
        auth2.signIn();
    }
}

// Sign out a Google user
var signOut = function() {
    if (auth2.isSignedIn.get() == true) {
        auth2.signOut();
        auth2.disconnect()
    }
    doClear()
}

// Clear the results section
var doClear = function() {

    var tag = document.getElementById("result")
    if (tag != null && tag.hasChildNodes())
        tag.removeChild(tag.children[0]);
    var tag2 = document.getElementById("result2")
    if (tag != null && tag2.hasChildNodes())
        tag2.removeChild(tag2.children[0]);
}

// Show results section
var output = function(inp, tag) {
    tag.appendChild(document.createElement('pre')).innerHTML = inp;
}

// Decode a token to see its contents in a readable format
var decodeToken = function(token) {
    var header = JSON.parse(atob(token.split('.')[0]));
    var payload = JSON.parse(atob(token.split('.')[1]));
    var tokenDecoded = {
        "header": header,
        "payload": payload
    }
    return tokenDecoded
}

// Parse a JWT token
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}

// Display token content in the results section
var showToken = function() {
    var idToken = googleUser.Zi.id_token
    var accessToken = googleUser.Zi.access_token
    var idTokenDecoded = decodeToken(idToken)

    doClear()
    output(JSON.stringify(idTokenDecoded, null, 2), document.getElementById("result"))
    output(accessToken, document.getElementById("result2"))
}

// Set a value to a cookie
function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (30 * 60 * 1000)); // Expires after 30 minutes
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";SameSite=None";
}

// Get the value from a cookie
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) {
        return parts.pop().split(";").shift();
    }
}

// Delete a cookie
function deleteCookie(name) {
    document.cookie = name + "='';expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=None";
}

// Display an S3 key file given the input credentials
var accessS3 = function(awsAccessKeyId, awsSecretAccessKey, awsSessionToken) {

    var s3 = new AWS.S3({
        region: config.Region,
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken
    });

    var paramsS3 = {
        Bucket: config.ReferredBucket,
        Key: config.s3key
    }
    s3.getObject(paramsS3, function(err, data) {
        if (err) {
            output(String.fromCharCode.apply(null, "OPERATION NOT ALLOWED: " + err), document.getElementById("result"))
        } else {
            doClear()
            output(String.fromCharCode.apply(null, data.Body), document.getElementById("result"))
        }
    })
}

// Perform a signed API Gateway request with the input credentials and display the result in the result section
var callApiGatewaySignedIAM = function(awsAccessKeyId, awsSecretAccessKey, awsSessionToken, resource) {

    var credentials = {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken
    };

    apigateway.makeRequest(credentials, resource, 'GET', undefined, undefined, function(returnedData) {
        doClear()
        if (returnedData['status'] == 200) {
            output(returnedData['data']['body'], document.getElementById("result"))
        } else {
            output("OPERATION NOT ALLOWED: " + returnedData['status'], document.getElementById("result"))
        }
    })

}

// Perform a request to API Gateway (not signed)
var callApiGateway = function(resource, accessToken = null) {
    if (accessToken == null)
        accessToken = ''

    $.ajax({
        url: config.ApiEndpoint + resource,
        type: 'GET',
        crossDomain: true,
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(''),
        headers: {
            authorization: accessToken
        },
        success: function(data) {
            doClear()
            output(data['body'], document.getElementById("result"));
        },
        error: function(err) {
            doClear()
            output("OPERATION NOT ALLOWED: " + JSON.stringify(err), document.getElementById("result"))
        }
    });
}

// Perform an action give the Cognito User Pool custom domain
var performActionCustomDomainCognito = function(action, resource, token) {

    if (action == 's3') {
        const loginId = 'cognito-idp.' + config.Region + '.amazonaws.com/' + config.UserPoolWithFedIdentity
        AWS.config.region = config.Region
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: config.FederatedIdentityWithUserPool,
            Logins: {
                [loginId]: token
            }
        });

        AWS.config.credentials.get(function(error) {
            if (error) {
                alert(error)
            } else {
                var accessKey = AWS.config.credentials.accessKeyId
                var secretKey = AWS.config.credentials.secretAccessKey
                var sessionToken = AWS.config.credentials.sessionToken
                accessS3(accessKey, secretKey, sessionToken)
            }
        })
    } else if (action == 'apigatewayIAM') {
        callApiGatewaySignedIAM(null, null, null, resource)
    } else
    if (action == 'apigateway') {
        callApiGateway(resource)
    } else if (action == 'apigatewayCognito') {
        callApiGateway(resource, token)
    } else {
        doClear()
        output(JSON.stringify(parseJwt(token), undefined, 4), document.getElementById("result"))
    }
}

// Perform an action given the input parameters
var performAction = function(action, resource, accessKeyId, secretAccessKey, sessionToken, cognitoAccessToken) {
    if (action == 's3') {
        accessS3(accessKeyId, secretAccessKey, sessionToken)
    } else if (action == 'apigatewayIAM') {
        callApiGatewaySignedIAM(accessKeyId, secretAccessKey, sessionToken, resource)
    } else if (action == 'apigateway') {
        callApiGateway(resource)
    } else if (action == 'apigatewayCognito') {
        callApiGateway(resource, cognitoAccessToken)
    } else {
        var credentials = {
            "accessKeyId": accessKeyId,
            "secretAccessKey": secretAccessKey,
            "sessionToken": sessionToken
        }
        doClear()
        output(JSON.stringify(credentials, null, 2), document.getElementById("result"))
    }
}

// Get credentials through an assume role and perform a given action
var doButtonActionSTS = function(action, resource) {

    // Set credentials
    var idToken = googleUser.Zi.id_token
    AWS.config.credentials = new AWS.WebIdentityCredentials({
        RoleArn: config.RoleIAMAuthViaSTS,
        WebIdentityToken: idToken
    });

    // Do assume role
    var paramsSTS = {
        DurationSeconds: 3600,
        RoleArn: config.RoleIAMAuthViaSTS,
        RoleSessionName: "test",
        WebIdentityToken: idToken
    };
    var sts = new AWS.STS();
    sts.assumeRoleWithWebIdentity(paramsSTS, function(err, data) {
        // Perform an action if possible
        if (err) {
            output(String.fromCharCode.apply(null, "OPERATION NOT ALLOWED: " + err), document.getElementById("result"))
        } else {
            performAction(action, resource, data.Credentials.AccessKeyId, data.Credentials.SecretAccessKey, data.Credentials.SessionToken, null)

        }
    });

}

// Get credentials from Federated Identity and performa an action
var doButtonActionFedIdentity = function(action = null, resource = null) {

    var idToken = googleUser.Zi.id_token;
    // var accessToken = googleUser.Zi.access_token

    AWS.config.region = config.Region;
    // Configure the credentials provider to use your identity pool
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.FedIdentity,
        Logins: { // optional tokens, used for authenticated login
            'accounts.google.com': idToken
        }
    });

    // Perform an action, if possible
    AWS.config.credentials.get(function() {
        performAction(action, resource, AWS.config.credentials.accessKeyId, AWS.config.credentials.secretAccessKey, AWS.config.credentials.sessionToken, null)
    });
}

// Display Google token contents in the result section
var showTokenGoogle = function() {
    doClear()
    output(JSON.stringify(decodeToken(getCookie('token')), null, 2), document.getElementById("result"))
    output(getCookie('token'), document.getElementById("result2"))
}

// Invoke the Cognito User Pool custom domain with the right parameters
var googleSignInCustomDomain = function() {
    document.getElementById('buttonCognito1').disabled = false
    document.getElementById('buttonCognito2').disabled = false
    document.getElementById('buttonCognito3').disabled = false
    document.getElementById('buttonCognito4').disabled = false
    document.getElementById('buttonCognito5').disabled = false
    document.getElementById('googleSignout').disabled = false
    document.getElementById('googleSignin').disabled = true
    document.getElementById('showtokenGoogle').disabled = false
    document.getElementById('doClear').disabled = false

    if (getCookie('token') == undefined || getCookie('token') == '') {
        var url = 'https://' + config.CustomDomainName + '.auth.' + config.Region + '.amazoncognito.com/login?redirect_uri=' + config.CallbackUrl + '&response_type=token&client_id=' + config.UserPoolAppClient
        window.location.href = url
    }
}

// Sign out from Cognito User Pool custom domain
var googleSignOutCustomDomain = function() {
    document.getElementById('buttonCognito1').disabled = true
    document.getElementById('buttonCognito2').disabled = true
    document.getElementById('buttonCognito3').disabled = true
    document.getElementById('buttonCognito4').disabled = true
    document.getElementById('buttonCognito5').disabled = true
    document.getElementById('googleSignout').disabled = true
    document.getElementById('googleSignin').disabled = false
    document.getElementById('showtokenGoogle').disabled = true

    deleteCookie('token')
    doClear()
    if (googleUser == null)
        document.getElementById('doClear').disabled = true
}

// Perform an action given the Cognito User Pool credentials (from Custom Domain)
var doButtonActionCognito = function(action = null, resource = null) {
    performActionCustomDomainCognito(action, resource, getCookie('token'))
}