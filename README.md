# Use external IdPs with AWS Cognito

[AWS Cognito](https://aws.amazon.com/cognito/) is an AWS serverless service that allows authenticating users agains specific providers (such as Google, Facebook or Amazon) and enterprise identity providers (IdPs) via SAML 2.0. It can also be used as an IdP itself, without needing to depend on external identiy providers.

This is a project that serves as a Proof of Concept (PoC) to integrate an external Identity Provider for AWS Cognito. I have taken Google IdP as example of an external IdP. However, this can be easily changed to use other supported IdPs.

I have performed the following actions:

* I have explored multiple ways to use an external IdP (Google) in AWS Cognito
* I have defined the architecture of the different wasy to use an external IdP (Google) in AWS Cognito
* I have created an example application that uses the different options explored before to use an external IdP (Google) in Cognito
* I have defined the IaC to automatically deploy the needed infrastructure (in CloudFormation)
* I have defined the post-installation steps in order to make the project work (defined here below)

NOTE: This has been tested in Google Chrome. Other browsers might not be compatible.

## Architecture

There are different ways to integrate Google IdP in AWS Cognito:

1. Link the Google IdP to a Cognito Federated Identity and use an authenticated default role to give access to the accessed services.

![Google IdP with Cognito Federated Identity and default authentication role](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/architecture/federated_identity.png)

2. Link the Google IdP to a Cognito Fedeated Identity. use an authenticated default role to give access to assuming a role. The assume role defines the required access to the accessed services. By adding and extra isolation layer, we simplify and protect the access to our resources.

![Google IdP with Cognito Federated Identity and assume role](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/architecture/iam_assumed_role.png)

3. Link the Google IdP to a Cognito Federated Identity and link it to a Cognito User Pool (I have connected them to both to access to different services but I could have used one or the other).
   1. By connecting to the Federated Identity, we can get temporary credentials to access to specific services
   2. By connecting to the User Pool, we can simplify the configuration of services like the API Gateway, where we can configure Authorizers that use Cognito

![Google IdP with both Cognito Federated Identity and User Pool](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/architecture/user_pool.png)
