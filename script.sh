aws cloudformation create-stack --stack-name rtf-cognito --template-body file://deploy.yaml --capabilities CAPABILITY_NAMED_IAM --parameters ParameterKey=WebBucket,ParameterValue=rtj-cognito ParameterKey=ReferredBucket,ParameterValue=rtf-cognito-web ParameterKey=AppId,ParameterValue=499688413332-hk9kfn58091sfhn2gip95ikikkf91oet.apps.googleusercontent.com

aws cloudformation wait stack-create-complete --stack-name rtf-cognito

aws s3 cp test.json s3://rtj-cognito/

aws cloudformation describe-stacks --stack-name rtf-cognito --query 'Stacks[0].Outputs'