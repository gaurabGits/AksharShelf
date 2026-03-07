const multer = require('multer'); //middleware for Express that handles multipart/form-data, primarily used for file uploads. 
const path = require('path'); // work with file and directory paths

const storage = multer.diskStorage({
    destination(res, file, call){
        call(null, "uploads/");
    },
    filename(res, file, call){
        const ext = path.extname(file.originalname);
        call(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

function checkFileType(file, call){
    const filetypes = /jpg|jpeg|png|pdf/; //regex to check for allowed file types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(extname && mimetype){
        return call(null, true);
    } else {
        call("Error: Images and PDFs only!");
    }
}

const upload = multer({
    storage,
    fileFilter: function(res, file, call){
        checkFileType(file, call);
    },
});

module.exports = upload;

