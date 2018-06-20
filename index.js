/* global fetch */
const LokkaTransport = require('lokka/transport').default
const aws4 = require('./signer')
const AWS = require('aws-sdk')
const Url = require('url')
const axios = require('axios')

// the default error handler
function handleErrors(errors, data) {
  const message = errors[0].message;
  const error = new Error(`GraphQL Error: ${message}`);
  error.rawError = errors;
  error.rawData = data;
  throw error;
}

class Transport extends LokkaTransport {
  constructor(endpoint, options = {}) {
    if (!endpoint) {
      throw new Error('endpoint is required!');
    }

    super();

    this._httpOptions = {
      auth: options.auth,
      headers: options.headers || {},
      credentials: options.credentials || new AWS.EnvironmentCredentials('AWS'),
    };
    this.endpoint = endpoint;
    this.handleErrors = options.handleErrors || handleErrors;
  }

  _buildOptions(payload) {

    const { host, path } = Url.parse(this.endpoint);
    const options = {
      host,
      path,
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload),
      service: 'appsync',
      region: 'us-east-1',
      url: this.endpoint
    }

    const { accessKeyId, secretAccessKey, sessionToken } = this._httpOptions.credentials

    const { headers } = aws4.sign(options, {
      access_key: accessKeyId,
      secret_key: secretAccessKey,
      session_token: sessionToken
    })

    Object.assign(options.headers, headers);
    return options;
  }

  send(query, variables, operationName) {
    const payload = {query, variables, operationName};
    const options = this._buildOptions(payload);

    return axios({...options, data: options.body}).then(response => {
      // 200 is for success
      // 400 is for bad request
      if (response.status !== 200 && response.status !== 400) {
        throw new Error(`Invalid status code: ${response.status}`);
      }

      return response.data;
    }).then(({data, errors}) => {
      if (errors) {
        this.handleErrors(errors, data);
        return null;
      }

      return data;
    });
  }
}

exports.Transport = Transport;
