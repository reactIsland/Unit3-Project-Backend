// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for examples
const Product = require('../models/product')
const User = require('../models/user')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existent document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { product: { title: '', text: 'foo' } } -> { product: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

// Add item to cart
router.post('/cart/add/:id', requireToken, async (req, res, next) => {
  // Grab the user ID from req object
  let userId = req.user.id

  // Grab the item ID from url
  let itemId = req.params.id

  // find user
  let user = await User.findById(userId)

  // find product by itemID param
  let item = await Product.findById(itemId)

  // put the product into the users cart array
  user.cart.push(item)

  // update database cart
  await user.save()
  res.json({ user })
})

router.delete('/cart/:id', requireToken, async (req, res, next) => {
  let productId = req.params.id
  let userId = req.user.id

  let user = await User.findById(userId)
  let cart = user.cart

  let updatedCart = cart.filter(cartItem => cartItem._id != productId)

  user.cart = updatedCart

  await user.save()
  res.json({ user })
})

// Get all cart items - Kian
router.get('/cart', requireToken, async (req, res, next) => {
  // find the userID
  let userId = req.user.id
  // find the user
  let user = await User.findById(userId)
  // isolate the user.cart
  let cart = user.cart
  // send cart back to the frontend
  res.json({ cart })
})

// Remove all items - useful if customer clears cart or buys everything and we wish to clear the cart.
router.delete('/clearall', requireToken, async (req, res, next) => {
  let userId = req.user.id
  let user = await User.findById(userId)
  user.cart = []

  await user.save()

  res.json({ user })
})

module.exports = router
