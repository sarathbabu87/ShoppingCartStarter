var db=require('../config/connection')
var products=require('../config/collections')
var collection = require('../config/collections')
const { reject } = require('promise')
const { response } = require('express')
const { ObjectId } = require('mongodb');
const collections = require('../config/collections')
module.exports={

    addProduct:(xyz,callback)=>{
        //console.log(bango);
        db.get().collection('xyz').insertOne(xyz).then((data)=>{
           // console.log(data)
            callback(data.insertedId.toString())

        })

    },

    // addProduct:(prodBody,ProdId)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get
    //     })
    // }
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct:(proID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne(
                { _id: new ObjectId (proID)}).then((response)=>{
                //console.log(response)
                resolve(response)
            })
        })

    },

    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)}).then((product)=>{
                //console.log("this one"+proId)
                resolve (product)
            })
        })
    },
    updateProduct:(proId,prodDetails)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne(
                {_id:new ObjectId(proId)},{
                    $set:{Name:prodDetails.Name,
                        Category:prodDetails.Category,
                        Price:prodDetails.Price,
                        Description:prodDetails.Description
                    }
                }
            
            ).then((response)=>{
                //console.log(response)
                resolve(response)
            })
        })

    }


   
}