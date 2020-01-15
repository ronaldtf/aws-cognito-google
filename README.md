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

## Deployment

0. Verify you have correctly configured your `~/.aws/credentials` and `~/.aws/config` files.
   
   NOTE: In case  you need to assume a role in another account, you must follow the following procedure:
   
   0.1. Install the aws-mfa tool
    ```
    $ pip install aws-mfa
    ```

    0.2. Define a profile (e.g. cognito-long-term) and update your ~/.aws/config file by including the profile options.
    ```
    [profile default]
    ...

    [profile cognito-long-term]
    region = eu-west-1
    output = json
    role_arn = arn:aws:iam::123456789012:role/role_to_be_assumed
    source_profile = default
    ```
    Note that the `source_profile` is the profile that gives us permissions to do an assume role. Therefore, we need to define the credentials for it in the `~/.aws/config` file

    0.3. Update your credentials file, by creating a tag profile by appending 'long-term' to the profile name:
    ```
    [cognito-long-term]
    aws_access_key_id = YOURACCESSKEYID
    aws_secret_access_key = YOURSECRETACCESSKEY
    aws_mfa_device = arn:aws:iam::123456789012:mfa/iam_user
    ```

    0.4. Run the aws-mfa command to set the credentials with the profile
    ```
    aws-mfa --duration 1800 --device arn:aws:iam::<source_account_id>:mfa/<username> --profile <profile-e.g.-cdk> --assume-role arn:aws:iam::<target_account>:role/<role-to-be-assumed> --role-session-name <a-session-name>
    ```

1. 