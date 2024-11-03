var express = require('express');

var router = express.Router();

var productHelper=require('../helpers/product-helpers');
const { log } = require('handlebars');


/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelper.getAllProducts().then((products)=>{
    //console.log(products)
    res.render('admin/view-products',{admin:true, products});  
  })
});



router.get('/add-products',function(req,res){
  res.render('admin/add-products');
})


router.post('/add-products',(req,res)=>{
  //console.log(req.body);
  //console.log(req.files.image)
  productHelper.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{
      if (!err){
        
        res.render("admin/add-products")
      }
      else{
        console.log(err)
      }
    })
    
  })
  
})

router.get('/delete-product/:id',(req,res)=>{
  let proID=req.params.id
  console.log(proID)
  productHelper.deleteProduct(proID).then((response)=>{
    //console.log(response) 
    res.redirect('/admin/')
  })
                
})

router.get('/edit-product/:id',async(req,res)=>{

  let product=await productHelper.getProductDetails(req.params.id)
 //console.log(product)
  
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if (req.files.image){
      let image=req.files.image
      let id=req.params.id
      image.mv('./public/images/'+id+'.jpg')
    }
  })

})

module.exports = router;
