const express = require('express')
const User = require('../models/user')
const passport = require('passport')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()

require('dotenv').config()
const stripeKey = process.env.STRIPE_PRIVATE_KEY
const stripe = require('stripe')(stripeKey);


const createCustomer = async (id) => {
  const customer = await stripe.customers.create({
    description: 'My First Test Customer (created for API docs)',
  });
  let customerID = customer.id
  let user = await User.findById(id)
  user.stripeId = customerID
  user.save()
}

router.post('/create-checkout-session', requireToken, async (req, res) => {
    // find the user to get their cart
    let user = await User.findById(req.user._id)
    let userCart = user.cart

    createCustomer(user._id)

  // transform cart items into format that stripe needs
  const transformedItems = userCart.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name
      },
      unit_amount: item.price * 100
    },
    description: item.description,
    quantity: 1
  }))

    // send all necessary cart stuff to session stripe object
    let session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], 
        line_items: transformedItems,
        mode: 'payment', 
        success_url: `${process.env.SERVER_URL}/${user._id}/success`, 
        cancel_url: `${process.env.CLIENT_URL}/Home`
    });

    res.json({ session })
  });

  //Get customer object
  router.get('/customer', requireToken, async (req, res, next) => {
    let user = await User.findById(req.user._id)

    const { stripeId } = user
  
    const customer = await stripe.customers.retrieve(stripeId);
  
    res.json({ customer })
  })

  //Get PaymentIntents (id what this does lol)
  router.get('/payments', requireToken, async (req, res, next) => {
    let user = await User.findById(req.user._id)
    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripeId,
    });
    const { data } = paymentIntents
    res.json({ data })
  })

  router.get('/orders', requireToken, async (req, res, next) => {
    let user = await User.findById(req.user._id)
    res.json({ user })
  })

  router.get('/:id/success', async (req, res, next) => {
    let id = req.params.id
    let user = await User.findById(id)

    const userCart = user.cart
  
    user.orders = userCart
    user.cart = []
    user.save()

    res.redirect(`${process.env.CLIENT_URL}/success`)
  })

module.exports = router
