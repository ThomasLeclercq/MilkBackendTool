# Milk Typescript Backend Tool 

## Description:
Provide a set of Providers, Models, Helpers and Managers to run scripts against MILK backend. Tools are provided in Typescript. 

## Use:
`npm install`

`npm run start`

## Parameters: 
MILKAPIKEY

API_HOST_URI - *Uri of the API to fetch products prices eg: NZD*

AWSREGION - *region where to fetch milk_product_picker.json and store the compare-range.json*

BUCKET - *bucket that holds milk_product_picker.json and will receive new compare-range.json*

S3_COMPARE_RANGE_PATH - *S3 path where compare-range.json should be stored*

S3_MILK_PRODUCT_PICKER_PATH - *S3 path where milk_product_picker.json is stored*

FORCE_REFRESH - *(**Optional**) - if set to "true", milk_product_picker.json and currency prices will be fetched again, updated and stored in /data*