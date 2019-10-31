var config = {
    googleClientId: '499688413332-hk9kfn58091sfhn2gip95ikikkf91oet.apps.googleusercontent.com',
    apiEndpoint: 'https://mmzv0hdtyg.execute-api.eu-west-1.amazonaws.com/test',
    identityPoolId: 'eu-west-1:bf29fcee-8d40-419e-bf02-156305842794',
    identityPoolIdGoogle: 'eu-west-1:444a7930-bf2c-4c1f-bcc3-11fb74b5324e',
    userPoolIdGoogle: 'eu-west-1_Mq0FgVwii',
    userPoolClientId: 'bmuvo9avkj8brlsu4igtq43co',
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