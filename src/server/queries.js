//Configuration for creating a pool of connections to db

//TODO: move these credentials to env file
const Pool = require('pg').Pool
console.log(process.env);
// const pool = new Pool({
//   user: 'jchani',
//   host: 'database-1.crelazp3gyca.us-west-2.rds.amazonaws.com',
//   database: 'postgres_1',
//   password: 'enknckj36n2dkac;3kd',
//   port: 5432,
// })
const pool = new Pool() //uses values defined in env file

/**
 *  --- AUTHENTICATION METHODS ---
 */

/**
 * Checks if an existing token exists for that phone number. If yes, then overwrite. If no, then insert. 
 */
const storeAccessToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT token FROM bsblock_users WHERE phone=$1;', [phone])
    .then(results => {
      if(results.rows.length > 0) { //overwrite existing token
        return resolve(updateToken(phone, token));
      } else { //no previously existing token for phone number
        return resolve(createUser(phone, token));
      }
    })
    .catch(error => logAndReject(error, reject));
  });
}

/**
 * Verifies that the phone and token retrieved from user input matches that stored in DB
 */
const validatePhoneAndAccessToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT token FROM bsblock_users WHERE phone=$1 AND token=$2`, [phone, token])
    .then(results => resolve(results.rows.length > 0 ? true : false))
    .catch(error => logAndReject(error, reject))
  });
}

/**
 * Called after a user makes a call
 */
const incrementCalls = (phone) => { 
  return new Promise((resolve, reject) => {
    pool.query('UPDATE bsblock_users SET calls = calls+1 WHERE phone = $1', [phone])
    .then(x => resolve(x))
    .catch(error => logAndReject(error, reject));
  });
}

/**
 * --- GENERIC METHODS ---
 */
const createUser = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO bsblock_users(phone,calls,paid,token) VALUES ($1, 0, 0, $2);`, [phone ,token])
    .then(x => {
      return Promise.resolve();
    })
    .then(x => resolve(x))
    .catch(error => logAndReject(error, reject));
  });
}

const updateToken = (phone, token) => {
  return new Promise((resolve, reject) => {
    pool.query(`UPDATE bsblock_users SET token=$2 WHERE phone=$1;`, [phone, token])
    .then(x => resolve(x))
    .catch(error => logAndReject(error, reject));
  });
}

/**
 * --- GENERIC METHODS CALLED DIRECTLY FROM CLIENT --- 
 */
const getCallDataByPhone = (phone) => {
  return new Promise((resolve, reject) => {
    pool.query(`SELECT phone, calls FROM bsblock_users WHERE phone = $1`, [phone])
    .then(results => resolve(results.rows))
    .catch(error => logAndReject(error, reject));
  });
}

const getAllUsersCallData = (request, response) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT SUM(calls) AS calls, SUM(paid) AS paid FROM bsblock_users')
    .then(results => resolve(response.status(200).json(results.rows)))
    .catch(error => logAndReject(error, reject));
  });
}

/**
 * --- UTILITY METHODS ---
 */
function logAndReject(error, reject) {
  console.log(error);
  reject(error);
}


/**
 * --- UNUSED GENERIC METHODS ---
 */

const updateUser = (request, response) => {
  const { phone, calls } = request.body
  pool.query('UPDATE bsblock_users SET calls=$2 WHERE phone = $1',
    [phone, calls],
    (error, results) => {
    if(error) console.log(error);
    response.status(200).json(results.rows)
  })
}

const deleteUser = (request, response) => {
  const phone = parseInt(request.params.phone)
  pool.query('DELETE FROM bsblock_users WHERE phone = $1',
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