const Wishlist = require("../models/wishlistModel");
const Cart = require("../models/cartModel")

const loadWishlistPage = async (req, res) => {
  try {
    let wishlistData = await Wishlist.findOne({ userId: req.session.user._id })
    .populate("products.productId")
    .populate("products.productId.offer")
    .populate("products.productId.category")
    .populate("products.productId.category.offer");
    let cartData = await Cart.findOne({userId: req.session.user._id})
    wishlistCount = wishlistData?.products?.length ?? 0;
    cartCount = cartData?.product?.length ?? 0;
    res.render("wishlist", { wishlistData, wishlistCount, cartCount });
  } catch (error) {
    console.log(`Error in loadWishlist -- ${error}`);
  }
};

const addToWishlist = async (req, res) => {
  try {
    let productId = req.body.productId;
    console.log(`ProductId - ${productId}`);
    if (req.session.user) {
      let wishlistData = await Wishlist.findOne({
        userId: req.session.user._id,
      });
      if (wishlistData) {
        let productCheck = wishlistData.products.find(p => p.productId.toString() === productId);
        console.log(`Product Found -- ${productCheck}`)
        if(!productCheck){
          wishlistData.products.unshift({
            productId: productId,
          });
          await wishlistData.save();
        } else {
          return res.status(200).json({message: 'Already added to wishlist'})
        }
      } else {
        wishlistData = new Wishlist({
          userId: req.session.user._id,
          products: [
            {
              productId: productId,
            },
          ],
        });
        await wishlistData.save();
      }
      res.status(200).json({ message: "Success" });
    } else {
      res.status(500).json({ message: "Log in to add products to wishlist" });
    }
  } catch (error) {
    console.log(`Error in addToWishlist -- ${error}`);
  }
};

const removeFromWishlist = async (req, res) => {
  let productId = req.body.productId;
  console.log(`ProductId -- ${productId}`)

  let wishlistData = await Wishlist.findOneAndUpdate({userId: req.session.user._id}, {$pull: {products: {productId: productId}}})
  if(wishlistData){
    res.status(200).json({message: 'Successfully removed from wishlist'})
  } else {
    res.status(500).json({message: 'Product not found'})
  }
}

module.exports = {
  loadWishlistPage,
  addToWishlist,
  removeFromWishlist,
};
