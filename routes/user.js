var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHealper=require('../helpers/user-healpers');
const userHealpers = require('../helpers/user-healpers');
const session = require('express-session');

const verifyLoggedIn=(req,res,next)=>{
  if (req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  //console.log(user)
  let cartCount=null
  if (user)
  {
  cartCount=await userHealpers.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products)=>{
    //console.log(products)
    res.render('user/view_products',{products,user,cartCount});  
  })
  
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn)
  {
    res.redirect('/')
  }else{
  res.render('user/login',{"loginErr":req.session.loginErr})
  req.session.loginErr=false
  }
})  
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHealper.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response.user
        res.redirect('/')
    console.log('checho '+response)
    
  })

})
router.post('/login',(req,res)=>{
  userHealper.doLogin(req.body).then((response)=>{
    if (response.status)
    {
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }
    else{
      req.session.loginErr="Invalid Username or Password!!"
      res.redirect('/login')
    }
  })
  
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLoggedIn,async(req,res)=>{
 let items=await userHealpers.getCartItems (req.session.user._id)
 console.log(items)
 let total=0;

 if (items.length===0){
  return res.render('user/empty-cart', { user: req.session.user._id });
} else {
 total=await userHealpers.getTotalAmt(req.session.user._id)
}

  //console.log(items)
  res.render('user/cart',{items,user:req.session.user._id,total})
})

router.get('/add-to-cart/:id', (req,res)=>{
  console.log('its working')
  userHealpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true})
  })

})

router.post('/change-product-quantity',(req,res, next)=>{
  userHealpers.changeProdQty(req.body).then(async(response)=>{
    response.total=await userHealpers.getTotalAmt(req.body.user)
    res.json(response)
    console.log("**routerpost**"+response)

  })
})

router.post('/remove-product/:id', (req,res)=>{
  let proId=req.params.id
  userHealpers.removeProduct(req.body.cart,proId).then((response)=>{
    res.json(response)
  })
})

router.get('/place-order',verifyLoggedIn,async(req,res)=>{
  let total=await userHealpers.getTotalAmt(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})

})

router.post('/place-order',async(req,res)=>{
 console.log(req.body) 
 let products=await userHealpers.getCartProdList(req.body.userId)
 let totalPrice=await userHealpers.getTotalAmt(req.body.userId)
 userHealpers.placeOrder(req.body,products,totalPrice).then((response)=>{
  res.json({status:true})
  
 })
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/order-list',async(req,res)=>{
  let order=await userHealpers.pullUserOrders(req.session.user._id)
  res.render('user/order-list',{user:req.session.user,order})
})

router.get('/view-ordered-products/:id',async(req,res)=>{
  let orderedItems=await userHealpers.pullOrderedProducts(req.params.id)
  res.render('user/view-ordered-products',{user:req.session.user,orderedItems})
})

module.exports = router;