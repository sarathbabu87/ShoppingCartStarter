var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { prototype, reject, resolve } = require('promise')
const { ObjectId } = require('mongodb');
const collections = require('../config/collections')
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            //console.log(userData)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
                console.log('mecho ' + data)
            })


        })
    },
    doLogin: (userData) => {
        //console.log(userData)
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.Email })
            //console.log(user)
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('Login Success')
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('Login failed')
                        resolve({ status: false })

                    }

                })

            } else {
                console.log('Login Bailed')
                resolve({ status: false })
            }
        })
    },

    addToCart: (proId, usrId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usrCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(usrId) })
            if (usrCart) {
                let prodExists = usrCart.product.findIndex(product => product.item == proId)
                if (prodExists != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ 'product.item': new ObjectId(proId) },
                            {
                                $inc: { 'product.$.quantity': 1 }
                            }
                        ).then((response) => {
                            resolve()
                        })

                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(usrId) },
                            {
                                $push: { product: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }


            } else {
                let cartObj = {
                    user: new ObjectId(usrId),
                    product: [proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartItems: (usrId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: new ObjectId(usrId) }
                    },
                    {
                        $unwind: '$product'
                    },
                    {
                        $project: {
                            item: "$product.item",
                            quantity: "$product.quantity"
                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] }

                        }
                    }
                ]).toArray()
                console.log('mangoos',cartItems)
            //console.log(cartItems[2].products)
            resolve(cartItems)


        })

    },

    removeProduct: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION)
                .updateOne({ _id: new ObjectId(cartId) },
                    {
                        $pull: { product: { item: new ObjectId(proId) } }
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })


                }
                )

        })
    },



    getCartCount: (usrId) => {
        return new Promise(async (resolve, reject) => {
            let count = null
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(usrId) })

            if (cart) {
                count = cart.product.length
            }
            resolve(count)
        })
    },

    changeProdQty: (details) => {
        //console.log("******"+{details})
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        //console.log(count)
        return new Promise((resolve, reject) => {

            if (count == -1 && quantity == 1) {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: new ObjectId(details.cart) },
                        {
                            $pull: { product: { item: new ObjectId(details.product) } }
                        }

                    ).then((response) => {
                        resolve({ removeProduct: true })

                    })
            } else {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: new ObjectId(details.cart), 'product.item': new ObjectId(details.product) },
                        {
                            $inc: { 'product.$.quantity': count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })

            }

        })

    },

    getTotalAmt: (usrId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collections.CART_COLLECTION)
                    .aggregate([
                        {
                            $match: { user: new ObjectId(usrId) }
                        },
                        {
                            $unwind: '$product'
                        },
                        {
                            $project: {
                                item: "$product.item",
                                quantity: "$product.quantity"
                            }
                        },
                        {
                            $lookup: {
                                from: collections.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: '_id',
                                as: 'product'
                            }
                        },
                        {
                            $project: {
                                item: 1, quantity: 1,
                                product: { $arrayElemAt: ["$product", 0] },
                                price: { $toDouble: { $arrayElemAt: ["$product.Price", 0] } }

                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: { $multiply: ['$quantity', '$price'] } }
                            }
                        }
                    ]).toArray()
                //console.log(cartItems[2].products)
                console.log(total[0].total)
                resolve(total[0].total)
            }
            catch (err) {
                reject(err)
            }


        })
    },

    placeOrder: (order,products,total) => {
        return new Promise((resolve,reject)=>{
            console.log(order,products,total)
            let status=order['payment-method']==="COD"?"placed":"pending"
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:new ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                TotalAmount:total,
                status:status,
                Date: new Date()

            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collections.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
                resolve()
            })

        })

    },

    getCartProdList: (userId) => {
        //console.log(userId)
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            console.log(cart)
            resolve(cart.product)
        })

    },

    pullUserOrders:(usrId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log('*#*'+usrId)
            let order=await db.get().collection(collections.ORDER_COLLECTION).find({userId:new ObjectId(usrId)}).toArray()
            console.log('*****',order)
            resolve(order)
        })
    },

    pullOrderedProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderedItems=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id: new ObjectId (orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

            ]).toArray()
            console.log(orderedItems)
            resolve(orderedItems)
            
        })
    }


}