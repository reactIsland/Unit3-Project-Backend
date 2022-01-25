const express = require('express')
const User = require('../models/user')
const passport = require('passport')
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

    // calculate the users cart 

    // send all necessary cart stuff to session stripe object
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], 
            mode: 'payment', 
            line_items: userCart.map(item => {
                return {
                    price_data: {
                        currency: 'usd', 
                        product_data: {
                            name: item.name
                        },
                        unit_amount: item.price
                    }, 
                    quantity: 1
                }
            }),
            success_url: `${process.env.CLIENT_URL}/success`, 
            cancel_url: `${process.env.CLIENT_URL}/cancel`
        });
        res.json({ url: session.url })
    } catch(e) {
        res.status(500).json({ error: e.message })
    }
    res.redirect(303, session.url);
  });



module.exports = router