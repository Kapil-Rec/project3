const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
app.use(bodyParser.json())
const dbName = "TestDataBase";

// Data Base Connection 
mongoose.connect(`mongodb://localhost:27017/${dbName}`, { useNewUrlParser: true }, (error, result) => {
    if (error) {
        console.log("Not Connected")
    } else {
        console.log("Database Connected")
    }
});
// Schema code Desing
const schema = mongoose.Schema;
const apiSchema = new schema({
    name: String,
    img: String,
    summary: String
})
apiModel = mongoose.model('api', apiSchema);


// create Api
const imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: 'images',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now()
            + path.extname(file.originalname))
        // file.fieldname is name of the field (image)
        // path.extname get the uploaded file extension
    }
});
const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jfif)$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
})
// For Single image upload
app.post('/uploadImage', imageUpload.single('image'), (req, res) => {

    console.log(req.file);
    apiModel.findOne({ name: req.body.name }, (findErr, findRes) => {
        if (findErr) {
            return res.send({ responseCode: 501, responseMessage: "Internal Server Error" });
        } else if (findRes) {
            return res.send({ responseCode: 404, responseMessage: "Already Exist" });

        } else {
            const obj = {
                name: req.body.name,
                img: req.file.path,
                summary: req.body.summary
            }
            new apiModel(obj).save((saveErr, saveRes) => {
                if (saveErr) {
                    return res.send({ responseMessage: "Save Error" })
                } else {
                    return res.send({ responseCode: 200, responseMessage: "Movie Is Uploaded Successfully", responseResult: saveRes })
                }
            })

        }
    })
})

// read data 
app.get('/read', (req, res) => {
    apiModel.find((findErr, findRes) => {
        if (findErr) {
            return res.send({ responseCode: 501, responseMessage: "Internal Error" })
        } else {
            return res.send({ responseCode: 200, responseMessage: "Data Read ", reponseResult: findRes })
        }
    })
})
// delete all Api
app.get('/delete', (req, res) => {
    apiModel.remove((delErr, delRes) => {
        if (delErr) {
            return res.send({ responseMessage: "Internal server Error" })
        } else {
            return res.send({ responseCode: 200, responseMessage: "All record are Delete Successfully" })
        }
    })
})

// Server 
var port = 8001;
app.listen(port, (result, error) => {
    if (error) {
        console.log("Server not running");
    } else {
        console.log(`Server is running on ${port}`);
    }
})
