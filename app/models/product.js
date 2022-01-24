const mongoose = require('mongoose')

const productSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    //   image: {
    //     type: String,
    //     required: true
    //   },
    description: {
      type: String,
      required: true
    },
    priceInCents: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    photo: {
      type: String
    }
  }, {
    timestamps: true
  }
)
module.exports = mongoose.model('Product', productSchema)
