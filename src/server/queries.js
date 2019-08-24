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
  pool.query(`SELECT token FROM users WHERE phone=${phone};`, (error, results) => {
    if(error) throw error;
    
    if(results.rows.length > 0) { //overwrite existing token
      updateToken(phone, token);
    } else { //no previously existing token for phone number
      createUser(phone, token);
    }
  });
}

/**
 * Verifies that the phone and token retrieved from user input matches that stored in DB
 */
const validatePhoneAndAccessToken = (phone, token, callback) => {
  pool.query(`SELECT token FROM users WHERE phone=${phone} AND token='${token}'`, (error, results) => {
    if(error) console.log(error);

    return callback(results.rows.length > 0 ? true : false);
  })
}

/**
 * Called after a user makes a call
 */
const incrementCalls = (phone) => {
  pool.query('UPDATE users SET calls = calls+1 WHERE phone = $1',
    [phone],
    (error, results) => {
    if(error) console.log(error);
  })
}

/**
 * --- GENERIC METHODS ---
 */
const createUser = (phone, token) => {
  pool.query(`INSERT INTO users(phone,calls,paid,token) VALUES (${phone}, 0, 0, '${token}');`, (error, results) => {
    if(error) console.log(error);
  })
}

const updateToken = (phone, token) => {
  pool.query(`UPDATE users SET token='${token}' WHERE phone=${phone};`, (error, results) => {
    if(error) console.log(error);
  });
}

/**
 * --- GENERIC METHODS CALLED DIRECTLY FROM CLIENT --- 
 */
const getCallDataByPhone = (request, response) => {
  pool.query('SELECT phone, calls FROM users WHERE phone = $1', 
  [phone],
  (error, results) => {
    if(error) console.log(error);
    response.status(200).json(results.rows)
  })
}

const getAllUsersCallData = (request, response) => {
  pool.query('SELECT SUM(calls) AS calls, SUM(paid) AS paid FROM users', (error, results) => {
    if(error) console.log(error);
    response.status(200).json(results.rows);
  })
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
  createUser,
  updateUser,
  deleteUser,
}