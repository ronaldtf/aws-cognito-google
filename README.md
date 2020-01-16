# Use external IdPs with AWS Cognito

[AWS Cognito](https://aws.amazon.com/cognito/) is an AWS serverless service that allows authenticating users agains specific providers (such as Google, Facebook or Amazon) and enterprise identity providers (IdPs) via SAML 2.0. It can also be used as an IdP itself, without needing to depend on external identiy providers.

This is a project that serves as a Proof of Concept (PoC) to integrate an external Identity Provider for AWS Cognito. I have taken Google IdP as example of an external IdP. However, this can be easily changed to use other supported IdPs.

I have performed the following actions:

* I have explored multiple ways to use an external IdP (Google) in AWS Cognito
* I have defined the architecture of the different wasy to use an external IdP (Google) in AWS Cognito
* I have created an example application that uses the different options explored before to use an external IdP (Google) in Cognito
* I have defined the IaC to automatically deploy the needed infrastructure (in CloudFormation)
* I have implemented a script to perform the post-installation steps in order to make the project work

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

1. Verify you have correctly configured your `~/.aws/credentials` and `~/.aws/config` files.
   
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
    aws-mfa --profile cognito
    ```

2. Configure the google IdP to authorize the AWS service to use it as an IdP. Follow the instructions from [Google Developers page](https://developers.google.com/identity/protocols/OpenIDConnect). Briefly:
   1. Log in [Google APIs & Services page](https://console.developers.google.com/apis/dashboard)
   2. In Credentials, `Create a new Credential`. Select the `Oauth ID` option
   3. Select `Web application` as `Application type`
   4. Put any name
   5. In `Authorized JavaScript origins` set the same value as you will set later in CALLBACK_URL (see below)
   6. In `Authorized redirect URIs` set the value `https://<CUSTOM_DOMAIN_NAME>.auth.eu-west-1.amazoncognito.com/oauth2/idpresponse`, where `CUSTOM_DOMAIN_NAME` is a custom domain (it needs to be the same as in the `CUSTOM_DOMAIN_NAME` defined below)
   
    ![Web Credentials](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/images/google_config1.png)

   7. Go to Oauth consent screen and fill it in:
     * `Application type`: `public`
     * `Application name`: \<any\>
     * `Support email`: \<your email\>
     * `Scope for Google APIs`: (leave default)
     * `Authorized domains`: `amazoncognito.com`
  
    ![Oauth consent screen](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/images/google_config2.png)

3. Open the file `deploy/deploy.sh` and fill in the parameters section:

  * GOOGLE_APP_ID: Google client ID, obtained after creating the configuration in [Google APIs & Services page](https://console.developers.google.com/apis/dashboard)
  * GOOGLE_SECRET: Google client secret, obtained after creating the configuration in [Google APIs & Services page](https://console.developers.google.com/apis/dashboard)
  * PROFILE: AWS profile to be used for the deployment
  * STACK_NAME: Name to be used for the CloudFormation stack
  * BUCKET_NAME: Name of the bucket to be used as an example (follow [S3 bucket naming restrictions](https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html))
  * CUSTOM_DOMAIN_NAME: Cognito Custom Domain Names prefix to be used (do not use reserved words such as AWS services)
  * CALLBACK_URL: Url to be redirected when we have authenticated ourselves and used a Cognito Custom Domain Name (e.g. http://localhost:4567)

4. Install the httpserver package (I use pip3)
````
$ pip3 install httpserver
````

5. Run the script and wait until it finishes and get the ok:

````
$ ./deploy/deploy.sh
````
This script will not only deploy the infrastructure but also perform the post-installation steps to make the system up and running

5. Open the url as defined in the `CALLBACK_URL` parameter. You should see something like:

![Main page](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/images/01.interface.png)

## User interface

Colors in the user interface indicate the available/allowed/unauthorized actions:

* ![Gray](https://placehold.it/15/999999/000000?text=+) Button is disabled (no action is possible)
* ![White](https://placehold.it/15/ffffff/4CAF50?text=+) Loggin button is enabled
* ![Gren](https://placehold.it/15/00AA00/00AA00?text=+) Action is enabled
* ![Orange](https://placehold.it/15/e7c06b/e7c06b?text=+) Action is enabled but it will fail (it is not consistent with but it has been kept there to see the result)
* ![Gren](https://placehold.it/15/EE0000/EE0000?text=+) Clear result section

![Main page](https://raw.githubusercontent.com/ronaldtf/aws-cognito-google/master/resources/images/02.results.png)

On the other side, the interface is splitted in two parts:

1. _Federated Identity Credentials_ and _Assume Role (IAM)_: We simply use Cognito Federated Identities with default authorized role or assume role (architectural solution [1.](#architecture) and [2.](#architecture))
2. _Cognito User Pool_: We use a Cognito User Pool and Federated Identities to replicate user data in the pool. This solution uses a Cognito Custom Domain Name, that is why we have a separate login section.