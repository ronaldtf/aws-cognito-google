var apigateway = {}

// Make a signed API Gateway request
apigateway.makeRequest = function(credentials, resource, requestType, defaultContentType, defaultAcceptType, callback) {

    if (defaultContentType === undefined)
        defaultContentType = 'application/json'

    if (defaultAcceptType === undefined)
        defaultAcceptType = 'application/json'

    if (!resource.startsWith('/'))
        resource = '/' + resource

    // Prepare the parameters for the request

    var authType = 'AWS_IAM'
    var additionalParams = {}
    var endpoint = /(^https?:\/\/[^\/]+)/g.exec(config.ApiEndpoint)[1];
    var pathComponent = config.ApiEndpoint.substring(endpoint.length);

    var httpParams = {
        endpoint: endpoint,
        defaultContentType: 'application/json',
        defaultAcceptType: 'application/json'
    }
    var v4params = {
        accessKey: credentials.accessKeyId,
        secretKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        serviceName: 'execute-api',
        region: config.Region,
        endpoint: endpoint,
        defaultContentType: 'application/json',
        defaultAcceptType: 'application/json'
    }

    var request = {
        verb: requestType.toUpperCase(),
        path: pathComponent + resource,
        headers: {},
        queryParams: {},
        body: ''
    }

    var apiClient = apiGateway.core.apiGatewayClientFactory.newClient(httpParams, v4params)

    // Perform the request
    apiClient.makeRequest(request, authType, additionalParams, '').then(function(result) {
        callback({
            "data": result.data,
            "status": result.status,
            "status_text": result.statusText
        })
    }).catch(function(result) {
        callback({
            "data": "",
            "status": "400",
            "status_text": JSON.stringify(result)
        })
    });
}