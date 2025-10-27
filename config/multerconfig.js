const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const storage = multer.diskStorage({
  destination : function(req, file, cb){
    cb(null, './public/images/uploads')                                      //jha file store krni h 
  },
  filename: function (req, file, cb){
    crypto.randomBytes(12, (err, bytes)=>{                                  //used to create new name of file
      const fn = bytes.toString("hex") + path.extname(file.originalname);   //to show new name
      cb(null, fn);
    })
  }
})
const upload = multer({storage: storage})

module.exports = upload