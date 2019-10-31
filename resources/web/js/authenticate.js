var auth2
var googleUser = null

window.addEventListener('load', function() {
    gapi.load('auth2', function() {
        auth2 = gapi.auth2.init({
            client_id: config.googleClientId,
            scope: 'email'
        });
        auth2.currentUser.listen(userChanged)
    })
})

var userChanged = function(user) {
    var userLogged = (user.Zi != null)
    console.log("User logged: " + userLogged)
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
        document.getElementById('buttonCognito1').disabled = false
        document.getElementById('buttonCognito2').disabled = false
        document.getElementById('buttonCognito3').disabled = false
        document.getElementById('buttonCognito4').disabled = false
        document.getElementById('buttonCognito5').disabled = false
        document.getElementById('signin').disabled = false
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
        document.getElementById('buttonCognito1').disabled = true
        document.getElementById('buttonCognito2').disabled = true
        document.getElementById('buttonCognito3').disabled = true
        document.getElementById('buttonCognito4').disabled = true
        document.getElementById('buttonCognito5').disabled = true
        document.getElementById('signin').disabled = false
        document.getElementById('signout').disabled = true
        document.getElementById('showtoken').disabled = true
        document.getElementById('doClear').disabled = true
    }
}

var doClear = function() {

    var tag = document.getElementById("result")
    if (tag != null && tag.hasChildNodes())
        tag.removeChild(tag.children[0]);
    var tag2 = document.getElementById("result2")
    if (tag != null && tag2.hasChildNodes())
        tag2.removeChild(tag2.children[0]);
}

var googleSignIn = function() {
    if (auth2.isSignedIn.get() == false) {
        auth2.signIn();
    }
}

var googleSignOut = function() {
    if (auth2.isSignedIn.get() == true) {
        auth2.signOut();
        auth2.disconnect()
        deleteCookie('token')
        deleteCookie('action')
        deleteCookie('resource')
    }
}

var output = function(inp, tag) {

    tag.appendChild(document.createElement('pre')).innerHTML = inp;
}

function decodeToken(token) {
    var header = JSON.parse(atob(token.split('.')[0]));
    var payload = JSON.parse(atob(token.split('.')[1]));
    var tokenDecoded = {
        "header": header,
        "payload": payload
    }
    return tokenDecoded

}

var showToken = function() {
    var idToken = googleUser.Zi.id_token
    var accessToken = googleUser.Zi.access_token
    var idTokenDecoded = decodeToken(idToken)

    doClear()
    output(JSON.stringify(idTokenDecoded, null, 2), document.getElementById("result"))
    output(JSON.stringify(accessToken, null, 2), document.getElementById("result2"))
}

var accessS3 = function(awsAccessKeyId, awsSecretAccessKey, awsSessionToken) {

    var s3 = new AWS.S3({
        region: config.region,
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken
    });

    var paramsS3 = {
        Bucket: config.bucket,
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

var callApiGateway = function(resource, accessToken = null) {
    if (accessToken == null)
        accessToken = ''

    $.ajax({
        url: config.apiEndpoint + resource,
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

var performActionGoogle = function(action, resource, token) {

    if (action == 's3') {
        const loginId = 'cognito-idp.' + config.region + '.amazonaws.com/' + config.userPoolIdGoogle
        AWS.config.region = config.region
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: config.identityPoolIdGoogle,
            Logins: {
                [loginId]: token
            }
        });

        AWS.config.credentials.get(function(error) {
            var accessKey = AWS.config.credentials.accessKeyId
            var secretKey = AWS.config.credentials.secretAccessKey
            var sessionToken = AWS.config.credentials.sessionToken
            console.log(accessKey)
            accessS3(accessKey, secretKey, sessionToken)
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

var doButtonActionSTS = function(action, resource) {

    var idToken = googleUser.Zi.id_token

    AWS.config.credentials = new AWS.WebIdentityCredentials({
        RoleArn: config.role1,
        WebIdentityToken: idToken
    });

    var paramsSTS = {
        DurationSeconds: 3600,
        RoleArn: config.role1,
        RoleSessionName: "test",
        WebIdentityToken: idToken
    };
    var sts = new AWS.STS();
    sts.assumeRoleWithWebIdentity(paramsSTS, function(err, data) {
        if (err) {
            output(String.fromCharCode.apply(null, "OPERATION NOT ALLOWED: " + err), document.getElementById("result"))
        } else {
            performAction(action, resource, data.Credentials.AccessKeyId, data.Credentials.SecretAccessKey, data.Credentials.SessionToken, null)

        }
    });

}

var doButtonActionFedIdentity = function(action = null, resource = null) {

    var idToken = googleUser.Zi.id_token;
    // var accessToken = googleUser.Zi.access_token

    AWS.config.region = config.region;
    // Configure the credentials provider to use your identity pool
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: { // optional tokens, used for authenticated login
            'accounts.google.com': idToken
        }
    });

    AWS.config.credentials.get(function() {
        performAction(action, resource, AWS.config.credentials.accessKeyId, AWS.config.credentials.secretAccessKey, AWS.config.credentials.sessionToken, null)
    });
}

var doButtonActionCognito = function(action = null, resource = null) {

    var cookieToken = getCookie('token')

    if (cookieToken === undefined || cookieToken === '') {
        setCookie('action', action)
        setCookie('resource', resource)

        var url = 'https://' + config.userPoolDomainName + '.auth.' + config.region + '.amazoncognito.com/login?redirect_uri=' + config.callbackUrl + '&response_type=token&client_id=' + config.userPoolClientId
        window.location.href = url
    }
    performActionGoogle(action, resource, cookieToken)
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}

function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (30 * 60 * 1000)); // Expires after 30 minutes
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) {
        return parts.pop().split(";").shift();
    }
}

function deleteCookie(name) {
    if (getCookie(name)) {
        document.cookie = name + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
}

window.addEventListener('load', function() {
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
        var cookieAction = getCookie('action')
        var cookieResource = getCookie('resource')
        doButtonActionCognito(cookieAction, cookieResource)

    }
})