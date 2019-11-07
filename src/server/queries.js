//Configuration for creating a pool of connections to db

//TODO: move these credentials to env file
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'twiliodb',
  password: 'password',
  port: 5432,
})

/**
 *  --- AUTHENTICATION METHODS ---
 */

/**
 * Checks if an existing token exists for that phone number. If yes, then overwrite. If no, then insert. 
 */
const storeAccessToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT token FROM users WHERE phone=$1;', [phone])
    .then(results => {
      if(results.rows.length > 0) { //overwrite existing token
        return resolve(updateToken(phone, token));
      } else { //no previously existing token for phone number
        return resolve(createUser(phone, token));
      }
    })
    .catch(error => logAndReject(reject));
  });
}

/**
 * Verifies that the phone and token retrieved from user input matches that stored in DB
 */
const validatePhoneAndAccessToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT token FROM users WHERE phone=$1 AND token=$2`, [phone, token])
    .then(results => resolve(results.rows.length > 0 ? true : false))
    .catch(error => logAndReject(reject))
  });
}

/**
 * Called after a user makes a call
 */
const incrementCalls = (phone) => { 
  return new Promise((resolve, reject) => {
    pool.query('UPDATE users SET calls = calls+1 WHERE phone = $1', [phone])
    .then(x => resolve(x))
    .catch(error => logAndReject(reject));
  });
}

/**
 * --- GENERIC METHODS ---
 */
const createUser = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO users(phone,calls,paid,token) VALUES ($1, 0, 0, $2);`, [phone ,token])
    .then(x => {
      return Promise.resolve();
    })
    .then(x => resolve(x))
    .catch(error => logAndReject(reject));
  });
}

const updateToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE users SET token=$2 WHERE phone=$1;`, [phone, token])
    .then(x => resolve(x))
    .catch(error => logAndReject(reject));
  });
}

/**
 * --- GENERIC METHODS CALLED DIRECTLY FROM CLIENT --- 
 */
const getCallDataByPhone = (phone) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT phone, calls FROM users WHERE phone = $1`, [phone])
    .then(results => resolve(results.rows))
    .catch(error => logAndReject(error));
  });
}

const getAllUsersCallData = (request, response) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT SUM(calls) AS calls, SUM(paid) AS paid FROM users')
    .then(results => resolve(response.status(200).json(results.rows)))
    .catch(error => logAndReject(error));
  });
}

/**
 * --- UTILITY METHODS ---
 */
function logAndReject(reject) {
  console.log(error);
  reject(error);
}


/**
 * --- UNUSED GENERIC METHODS ---
 */

const updateUser = (request, response) => {
  const { phone, calls } = request.body
  pool.query('UPDATE users SET calls=$2 WHERE phone = $1',
    [phone, calls],
    (error, results) => {
    if(error) console.log(error);
    response.status(200).json(results.rows)
  })
}

const deleteUser = (request, response) => {
  const phone = parseInt(request.params.phone)
  pool.query('DELETE FROM users WHERE phone = $1',
    [phone],
    (error, results) => {
    if(error) console.log(error);
    response.status(200).json(`User deleted with phone: ${phone}`)
  })
}

module.exports = {
  storeAccessToken,
  validatePhoneAndAccessToken,
  incrementCalls,
  getAllUsersCallData,
  getCallDataByPhone,
}