# WIP: lokka-transport-appsync

Handles sigv4 signing of query/mutation calls to appsync api.  Usable within aws lambda.

### Example
```javascript
// AppsyncApi.js (uses node 8.10)

const Lokka = require('lokka').Lokka
const AppSyncTransport = require('./AppSyncTransport').Transport
const AWS = require('aws-sdk')
const ssm = new AWS.SSM({apiVersion: '2014-11-06'})

// Just one example of how to obtain credentials
const getCredentials = async () => {
  if (getCredentials.credentials) {
    return getCredentials.credentials
  }

  const [accessKeyResponse, accessSecretResponse] = await Promise.all([
    ssm.getParameter({Name: process.env.APPSYNC_KEY_PARAMETER, WithDecryption: true}).promise(),
    ssm.getParameter({Name: process.env.APPSYNC_SECRET_PARAMETER, WithDecryption: true}).promise(),
  ])

  getCredentials.credentials = {
    accessKeyId: accessKeyResponse.Parameter.Value,
    secretAccessKey: accessSecretResponse.Parameter.Value
  }
   
  return getCredentials.credentials
}

const AppSyncClient = async (credentials) => {
  credentials = await getCredentials()
  return new Lokka({
    transport: new AppSyncTransport('https://<appsync api id>.appsync-api.<region>.amazonaws.com/graphql', {credentials})
  })
}

exports.getCredentials = getCredentials
exports.AppSyncClient = AppSyncClient

```


### TODOs

- Make region configurable
- Better error handling
- Handle all authentication types
- Make installable via npm
