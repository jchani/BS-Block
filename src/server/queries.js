//Configuration for creating a pool of connections

//TODO: move these credentials to env file
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
})

const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if(error) {
      throw error
    }
  })
}

const getUserById = (request, response) => {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM users WHERE id = $1', (error, results) => {
    if(error) {
      throw error
    }
    response.status(200).json(results.row)
  })
}

const createNewUser = (request, response) => {
  const name = parseString(request.params.name)
  const email = parseString(request.params.email)
  pool.query('INSERT INTO users (name, email) VALUES ($name, $email)', (error, results) => {
    if(error) {
      throw error
    }
    response.status(200).json(results.row)
  })
}

const updateUser = (request, response) => {
  const name = parseString(request.params.name)
  const email = parseString(request.params.email)
  pool.query('UPDATE users SET name=$1 email=$2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
    if(error) {
      throw error
    }
    response.status(200).json(results.row)
  })
}

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)
  pool.query('DELETE FROM users WHERE id = $1',
    [id],
    (error, results) => {
    if(error) {
      throw error
    }
    response.status(200).json(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}