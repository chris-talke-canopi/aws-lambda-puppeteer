exports.handler = async (event) => {
    const response = {
      statusCode: 200,
      body: {
        message: "Hello from AWS and Github, Get Function"
      },
    }
    return response
  }