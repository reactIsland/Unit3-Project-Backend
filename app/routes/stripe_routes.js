const express = require('express')
const User = require('../models/user')
const passport = require('passport')
const { session } = require('passport')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()

require('dotenv').config()
// Put key in .env file 
const stripeKey = process.env.STRIPE_PRIVATE_KEY

const stripe = require('stripe')(stripeKey);
// This example sets up an endpoint using the Express framework.
// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.

router.post('/create-checkout-session', requireToken, async (req, res) => {
    // find the user to get their cart
    let user = await User.findById(req.user._id)
    let userCart = user.cart
    console.log(user)
    console.log(userCart)

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
      }));

    // send all necessary cart stuff to session stripe object
    let session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], 
        line_items: transformedItems,
        mode: 'payment', 
        success_url: `${process.env.CLIENT_URL}/success`, 
        cancel_url: `${process.env.CLIENT_URL}/Home`
    });
    res.json({ session })
  });

  //Get customer object 
  router.get('/customer', requireToken, async (req, res, next) => {
    let user = await User.findById(req.user._id)
    
    const customer = await stripe.customers.retrieve(user.stripeId);
    
    res.json({ customer })
  })

  //Get PaymentIntents (ie. past orders)
  router.get('/payments', requireToken, async (req, res, next) => {
    let user = await User.findById(req.user._id)

    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripeId,
    });

    res.json({ paymentIntents })
  })

module.exports = router