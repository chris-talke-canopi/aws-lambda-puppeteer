const crypto = require('crypto');

exports.handler = async (event) => {

  try {

    const payload = JSON.parse(event.body);
    if (typeof payload.values === 'string') {
      payload.values = JSON.parse(payload.values);
    }

    if (payload.action === "ENCRYPT") {
      console.log("Encrypting!")
      const encryptedValues = [];
      const secret = process.env.SECRET__0001;
      const secretKey = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
      for (var i = payload.values.length; i--;) {
        const plaintext = payload.values[i];
        const encryptedData = encryptString(plaintext, secretKey);
        encryptedValues.push(encryptedData);
      }
      console.log("Encrypted!")
      const response = {
        statusCode: 200,
        body: JSON.stringify(encryptedValues),
      };
      return response;
    }

    if (payload.action === process.env.DECRYPT_SECRET_ACTION) {
      console.log("Decrypting!")
      const decryptedValues = [];
      const secret = process.env.SECRET__0001;
      const secretKey = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
      for (var i = payload.values.length; i--;) {
        const [encrypted, iv] = payload.values[i].split('__');
        const decryptedData = decryptString(encrypted, secretKey, iv);
        decryptedValues.push(decryptedData);
      }
      console.log("Decrypted!")
      const response = {
        statusCode: 200,
        body: JSON.stringify(decryptedValues),
      };
      return response;
    }

    return JSON.stringify({
      statusCode: 200,
      body: JSON.stringify({
        message: "incorrect_payload"
      }),
    });

  }
  catch (e) {
    console.log(e)
    return JSON.stringify({
      statusCode: 500,
      body: JSON.stringify({
        message: "error"
      }),
    });
  }
};

function encryptString(plaintext, secret) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, secret, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${encrypted}__${iv.toString('hex')}`;
}

function decryptString(encryptedText, secret, iv) {
  const algorithm = 'aes-256-cbc';

  // Create a decipher with the secret key and IV
  const decipher = crypto.createDecipheriv(algorithm, secret, Buffer.from(iv, 'hex'));

  // Decrypt the encrypted text
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // Return the decrypted text
  return decrypted;
}