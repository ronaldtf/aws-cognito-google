var config = {
    googleClientId: '499688413332-hk9kfn58091sfhn2gip95ikikkf91oet.apps.googleusercontent.com',
    apiEndpoint: 'https://lmetoplvb9.execute-api.eu-west-1.amazonaws.com/test',
    identityPoolId: 'eu-west-1:4960fa80-988d-43ee-b4c4-513f8d77921e',
    identityPoolIdGoogle: 'eu-west-1:94ac9717-789b-40f3-8ffa-3a22170ffcae',
    userPoolIdGoogle: 'eu-west-1_L8QHaLZrS',
    userPoolClientId: '1e58us77cbhus8t14m9gkpmj6o',
    userPoolDomainName: 'myappdomainname',
    callbackUrl: 'http://localhost:4567',
    region: 'eu-west-1',
    bucket: 'rtf-cognito',
    s3key: 'test.json',
    role1: 'arn:aws:iam::519198854940:role/rtf-cognito-sts-role',
    role2: 'arn:aws:iam::519198854940:role/rtf-cognito-fedidentity-role',
    apiResource: '/noauth',
    apiIAMResource: '/iam',
    apiCognitoResource: '/cognito'
}