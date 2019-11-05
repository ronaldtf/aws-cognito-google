#!/bin/bash

# Use this script to deploy and destroy your stack

############################################################################################
#################################### PARAMETERS ############################################
############################################################################################
GOOGLE_APP_ID=
GOOGLE_SECRET=
PROFILE=default

STACK_NAME=
BUCKET_NAME=
CUSTOM_DOMAIN_NAME=
CALLBACK_URL=
############################################################################################
############################################################################################
############################################################################################

# Custom files/paths
WEB_PATH=../resources/web
TEST_FILE=test.json
WEB_SCRIPT=runserver.sh
TEST_PATH=../resources/${TEST_FILE}
WEB_CONFIG=${WEB_PATH}/js/config.js
DEPLOY_FILE=deploy.yaml

# Global variable
STACK_STATUS=''
function checkStackStatus() {
    EXISTS=$(aws cloudformation describe-stacks --profile ${PROFILE} --stack-name ${STACK_NAME} 2>/dev/null)
    if [ $? -ne 0 ]; then
        if [ -z $(echo ${EXISTS} | grep 'does not exist') ]; then
            STACK_STATUS='DELETE_COMPLETE'
        else
            echo "A problem has occurred when checking stack status. Script aborted"
            exit
        fi
    else
        STACK_STATUS=$(aws cloudformation describe-stacks --profile ${PROFILE} --stack-name ${STACK_NAME} --query 'Stacks[0].StackStatus' | sed 's/\"//g')
    fi
}

function waitStack() {
    TIMEOUT=300
    startTime=$(date +%s)
    counter=0
    sec=0
    while true; do
        # Check status every ~10 seconds
        if [ $(expr $sec % 10) -eq 0 ]; then
            printf "Checking stack status...                                           \r"
            checkStackStatus
            if [[ ${STACK_STATUS} == 'CREATE_COMPLETE' ]] || [[ ${STACK_STATUS} == 'UPDATE_COMPLETE' ]] || [[ ${STACK_STATUS} == 'DELETE_COMPLETE' ]]; then
                echo ""
                printf "Stack complete                                                     \n"
                break
            elif [[ ${STACK_STATUS} == 'CREATE_FAILED' ]] || [[ ${STACK_STATUS} == 'ROLLBACK_COMPLETE' ]] || [[ ${STACK_STATUS} == 'UPDATE_ROLLBACK_COMPLETE' ]] || [[ ${STACK_STATUS} == 'DELETE_FAILED' ]]; then
                echo ""
                printf "ERROR: A problem has ocurred when creating/updating/deleting the stack        "
                exit
            fi
            sleep 3
        fi
        # Write a waiting message with elapsed time
        currentTime=$(date +%s)
        diffTime=$(expr $currentTime - $startTime)
        min=$(expr $diffTime / 60)
        sec=$(expr $diffTime % 60)
        n=$(expr $counter % 3 + 1)
        dots=$(yes . | head -$n | tr -d "\n")
        printf "Waiting stack to complete. Elapsed ${min}min ${sec}s ${dots}       \r"
        sleep 1
        ((counter++))
        if [ ${diffTime} -ge ${TIMEOUT} ]; then
            echo ''
            echo "TIMEOUT EXCEEDED"
            break
        fi
    done
}

if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo -ne "\n"
    echo $(yes '#' | head -80 | tr -d "\n")
    echo -ne "This script deploys the CloudFormation stack and updates the web configuration needed to test it.\n"
    echo -ne "Usage:\n"
    echo -ne "\t*-h|--help\tShow this help\n"
    echo -ne "\t*(no option)\tCreate a stack and prepare the environment\n"
    echo -ne "\t*-d|--delete\tRemove stack and the environment\n"
    echo $(yes '#' | head -80 | tr -d "\n")
    echo -ne "\n"
elif [[ "$1" == "-d" ]] || [[ "$1" == "--delete" ]]; then

    aws cloudformation describe-stacks --profile ${PROFILE} --stack-name ${STACK_NAME} 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]; then # Stack does not exist
        echo "Stack ${STACK_NAME} does not exist"
    else
        echo "Removing files..."
        aws s3 rm --profile ${PROFILE} s3://${BUCKET_NAME}/${TEST_FILE}
        echo "Removing stack ${STACk_NAME}..."
        aws cloudformation delete-stack --profile ${PROFILE} --stack-name ${STACK_NAME}
        if [ $? -eq 0 ]; then
            echo "Waiting stack to be removed..."
            waitStack
        else
            echo "A problem has occurred. Script will be aborted"
            exit
        fi
    fi
else

    echo "Deploying stack..."
    aws cloudformation create-stack --profile ${PROFILE} --stack-name ${STACK_NAME} --template-body file://${DEPLOY_FILE} --capabilities CAPABILITY_NAMED_IAM --parameters ParameterKey=ReferredBucket,ParameterValue=${BUCKET_NAME} ParameterKey=CustomDomainName,ParameterValue=${CUSTOM_DOMAIN_NAME} ParameterKey=GoogleAppId,ParameterValue=${GOOGLE_APP_ID} ParameterKey=GoogleSecret,ParameterValue=${GOOGLE_SECRET} ParameterKey=CallbackUrl,ParameterValue=${CALLBACK_URL}

    if [ $? -eq 0 ]; then
        echo "Waiting stack to finish..."
        # aws cloudformation wait stack-create-complete --profile ${PROFILE} --stack-name ${STACK_NAME}
        waitStack
    else
        echo "A problem has occurred. Script will be aborted"
        exit
    fi

    echo "Getting outputs..."
    aws cloudformation describe-stacks --profile ${PROFILE} --stack-name ${STACK_NAME} --query "Stacks[].Outputs[*].{Key:OutputKey,Val:OutputValue}" --output=text > /tmp/deploy.tmp

    if [ $? -eq 0 ]; then
        while read line; do
            key=$(echo "$line" | awk '{print $1}' | sed 's/\//\\\//g')
            value=$(echo "$line" | awk '{print $2}' | sed 's/\//\\\//g')
            eval "sed -i '' 's/^[ ]*${key}:.*/${key}: \"${value}\",/g' ${WEB_CONFIG}"
        done < /tmp/deploy.tmp
        rm /tmp/deploy.tmp
    else
        echo "A problem has occurred. Script will be aborted"
        exit
    fi

    echo "Updating bucket..."
    aws s3 cp --profile ${PROFILE} ${TEST_PATH} s3://${BUCKET_NAME}

    if [ $? -eq 0 ]; then
        echo "Running web script..."
        cd ${WEB_PATH} && ./${WEB_SCRIPT}
    else
        echo "A problem has occurred. Script will be aborted"
        exit
    fi
fi