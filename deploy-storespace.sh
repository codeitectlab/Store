#!/bin/bash

ENV=qa
DEPLOY_TYPE=deploy
STATIC=true
NO_STATIC=false
DRY_RUN=false

BEANSTALK_APPLICATION_NAME=store-space-website
BEANSTALK_ENVIRONMENT_NAME[0]=
BEANSTALK_ENVIRONMENT_NAME[1]=store-space-01
BEANSTALK_ENVIRONMENT_NAME[2]=store-space-02

AWS="aws --profile storespace --region us-east-2"

S3_BUCKET=store-space-website
S3_FOLDER=website

BUILD_ID=$(git rev-parse --short=10 HEAD)

for i in "$@"
do
case $i in
    -e=*|--env=*|--environment=*)
    ENV="${i#*=}"
    shift # past argument=value
    ;;
    -t=*|--type=*)
    DEPLOY_TYPE="${i#*=}"
    shift # past argument=value
    ;;
    -n=*|--no-static=*)
#    NO_STATIC="${i#*=}"
    NO_STATIC=true
    shift # past argument=value
    ;;
    --dry-run)
    DRY_RUN=true
    shift # past argument=value
    ;;
    --default)
    DEFAULT=YES
    shift # past argument with no value
    ;;
    *)
            # unknown option
    ;;
esac
done

printf "\n\nStarting deploy.sh\n\n\n"
printf "ENV: $ENV\n"
printf "DEPLOY TYPE: $DEPLOY_TYPE\n"
printf "NO STATIC: $NO_STATIC\n"
printf "DRY RUN: $DRY_RUN\n"

if [ $NO_STATIC == 'true' ]; then
	STATIC=false
fi

function continueAfterConfirmation {
	read -r -p "Are you sure? [y/N] " response
	if [[ ! $response =~ ^([yY][eE][sS]|[yY])$ ]]; then
		printf "\nNot sure?! Jeez, exiting.\n\n\n"
		exit 0
	fi
	return 0
}

function dryRunChecked {
	if [ $DRY_RUN == false ]; then
		$@
	else
		printf "Dry run: $* \n"
	fi
	return 0
}

function executeAfterConfirmation {
	read -r -p "Are you sure? [y/N] " response
	if [[ ! $response =~ ^([yY][eE][sS]|[yY])$ ]]; then
		printf "\nNot sure?! Jeez, exiting.\n\n\n"
		exit 0
	fi

	$@

	return 0
}

CNAME_1=`$AWS --output text elasticbeanstalk describe-environments --query 'Environments[0].{CNAME: CNAME}' --application-name $BEANSTALK_APPLICATION_NAME --environment-name ${BEANSTALK_ENVIRONMENT_NAME[1]}`
CNAME_2=`$AWS --output text elasticbeanstalk describe-environments --query 'Environments[0].{CNAME: CNAME}' --application-name $BEANSTALK_APPLICATION_NAME --environment-name ${BEANSTALK_ENVIRONMENT_NAME[2]}`

PROD=1
QA=2

if [[ "$CNAME_1" =~ "store-space-test" ]]; then
	QA=1
fi

if [[ "$CNAME_2" =~ "store-space-prod" ]]; then
	PROD=2
fi

if [[ "$PROD" == "$QA" ]]; then
	printf "\n\nBoth Prod and QA environments are the same. If in the middle of a previous deployment, please try again in a few minutes. Verify in console https://access.amazon.com\n\n"
	exit 0
fi

if [ $DEPLOY_TYPE == 'promote' ]; then
	QA_APPLICATION_VERSION=`$AWS --output text elasticbeanstalk describe-environments --query 'Environments[0].{vl: VersionLabel}' --application-name $BEANSTALK_APPLICATION_NAME --environment-name ${BEANSTALK_ENVIRONMENT_NAME[QA]}`
	printf "\n\nQA App Version: $QA_APPLICATION_VERSION"

	PROD_APPLICATION_VERSION=`$AWS --output text elasticbeanstalk describe-environments --query 'Environments[0].{vl: VersionLabel}' --application-name $BEANSTALK_APPLICATION_NAME --environment-name ${BEANSTALK_ENVIRONMENT_NAME[PROD]}`
	printf "\n\nProd App Version: $PROD_APPLICATION_VERSION"

	printf "\n\nPromoting QA to Prod\n"
	continueAfterConfirmation

	printf "\n"

	dryRunChecked $AWS elasticbeanstalk swap-environment-cnames --source-environment-name ${BEANSTALK_ENVIRONMENT_NAME[1]} --destination-environment-name ${BEANSTALK_ENVIRONMENT_NAME[2]}
else
	printf "\n\nDeploying to QA\n"
	continueAfterConfirmation

	printf "\n\nUploading static assets: $STATIC\n"
	continueAfterConfirmation

	printf "\n\nPackaging Store Space Website\n"
	printf "New version: "$BUILD_ID"\n"
	npm run package

	printf "\n\nDeleting current app version "$BUILD_ID", if it exists\n"
	dryRunChecked $AWS elasticbeanstalk delete-application-version --application-name "$BEANSTALK_APPLICATION_NAME" --version-label $BUILD_ID --delete-source-bundle
	printf "\nCopying build to S3\n"
	dryRunChecked $AWS s3 cp storespace.zip s3://$S3_BUCKET/builds/$S3_FOLDER/storespace.com-$BUILD_ID.zip
	printf "\nCreating app version "$BUILD_ID"\n"
	dryRunChecked $AWS elasticbeanstalk create-application-version --application-name "$BEANSTALK_APPLICATION_NAME" --version-label $BUILD_ID --source-bundle S3Bucket="$S3_BUCKET",S3Key="builds/$S3_FOLDER/storespace.com-"$BUILD_ID".zip"
	printf "\n"

	if [[ $STATIC != true ]]; then
		printf "Not copying static files to S3\n"
	else
#		printf "Removing static assets from S3\n"
#		dryRunChecked $AWS s3 rm s3://$S3_BUCKET --exclude "*" --include "assets/$S3_FOLDER/$BUILD_ID/*" --recursive
		printf "\nCopying static assets for version "$BUILD_ID" to S3\n"
		dryRunChecked $AWS s3 cp public/data s3://$S3_BUCKET/assets/$S3_FOLDER/data --recursive --acl public-read --cache-control max-age=7200,s-maxage=7200
		dryRunChecked $AWS s3 cp public/images s3://$S3_BUCKET/assets/$S3_FOLDER/images --recursive --acl public-read --cache-control max-age=7200,s-maxage=7200
		dryRunChecked $AWS s3 cp public/bundle/scripts s3://$S3_BUCKET/assets/$S3_FOLDER/bundle/scripts --recursive --acl public-read --cache-control max-age=7200,s-maxage=7200
		dryRunChecked $AWS s3 cp public/bundle/styles s3://$S3_BUCKET/assets/$S3_FOLDER/bundle/styles --recursive --acl public-read --cache-control max-age=7200,s-maxage=7200
	fi

	printf "\nDeploying webapp to Elastic Beanstalk\n"
	dryRunChecked $AWS elasticbeanstalk update-environment --environment-name ${BEANSTALK_ENVIRONMENT_NAME[QA]} --version-label $BUILD_ID --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=BUILD_ID,Value=$BUILD_ID
	printf "\n"
fi

function checkStatus {
	response=`$AWS --output text elasticbeanstalk describe-environments --query 'Environments[0].Status' --application-name $BEANSTALK_APPLICATION_NAME --environment-name ${BEANSTALK_ENVIRONMENT_NAME[QA]}`
	if [ $1 == "true" ] ; then
		printf "$response\n";
	fi
	if [[ $response == *"Updating"* ]] ; then
		return 1;
	fi
	return 0
}

i=0;
WAIT_LIMIT=30;
SLEEP_TIME=10;

checkStatus false

while [ $? -ne 0 ] && [ "$i" -lt "$WAIT_LIMIT" ]
do
	(( i += 1 ))
	printf "."
	sleep "$SLEEP_TIME"
	checkStatus false
done

printf ".\n\n"

checkStatus true

printf "\nEnding deploy script\n\n"
